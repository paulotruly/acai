import assert from 'node:assert/strict'
import { test } from 'node:test'
import { avaliarDataEvento, diaNoRecife } from './data.js'
import {
  classificarCategoria,
  colunasDeslocadas,
  normalizarCabecalho,
  normalizarGrauRisco,
  tratarAtendimento,
  validarColunas,
} from './defesaCivil.js'
import { evidenciaPresente, normalizarTemas, tituloRelevante } from './extracao.js'
import { encontrarMunicipios, identificarBairroRecife, separarBairros } from './territorio.js'
import {
  decodificarBytes,
  decodificarEntidades,
  extrairTextoDoHtml,
  hashTexto,
  lerCanonica,
  lerMeta,
  limparTitulo,
} from './texto.js'
import { canonizarUrl } from './url.js'
import { interpretarRss, montarConsulta } from '../coleta/googleNoticias.js'
import { lerRegrasRobots, permitidoPelasRegras } from '../coleta/paginas.js'

test('RT-URL-01: canonização remove rastreio e fragmento e mantém parâmetros de conteúdo', () => {
  assert.equal(
    canonizarUrl('http://www.g1.com/a/?utm_source=x&id=9&fbclid=y#t'),
    'https://g1.com/a?id=9',
  )
})

test('RT-URL-02: a URL canônica declarada pela página tem prioridade', () => {
  assert.equal(canonizarUrl('https://a.com/x?y=1', '/materia'), 'https://a.com/materia')
  assert.equal(lerCanonica('<link href="https://a.com/m" rel="canonical">'), 'https://a.com/m')
})

test('RT-TXT-01: metatag preserva apóstrofo e aceita qualquer ordem de atributos', () => {
  assert.equal(lerMeta(`<meta content="Morro D'Água" property="og:title">`, 'og:title'), "Morro D'Água")
  assert.equal(lerMeta(`<meta property='og:title' content="Falta d'água">`, 'og:title'), "Falta d'água")
})

test('RT-TXT-02: entidades são decodificadas uma única vez', () => {
  assert.equal(decodificarEntidades('&#x2013; &ccedil; &amp;amp; &#225;'), '– ç &amp; á')
})

test('RT-TXT-03: bytes em latin1 mantêm os acentos', () => {
  const bytes = new Uint8Array(Buffer.from('<p>Água e ação</p>', 'latin1'))
  assert.equal(decodificarBytes(bytes, 'text/html; charset=ISO-8859-1'), '<p>Água e ação</p>')
})

test('RT-TXT-04: articleBody do JSON-LD tem prioridade sobre os parágrafos', () => {
  const corpo = 'Texto completo da matéria. '.repeat(10).trim()
  const html = `<script type="application/ld+json">${JSON.stringify({ '@graph': [{ articleBody: corpo }] })}</script><p>${'parágrafo de publicidade '.repeat(4)}</p>`
  assert.equal(extrairTextoDoHtml(html), corpo)
})

test('RT-TXT-05: o texto ignora navegação e parágrafos curtos', () => {
  const longo = 'Este parágrafo descreve um alagamento ocorrido na cidade do Recife.'
  assert.equal(extrairTextoDoHtml(`<nav><p>${longo} menu</p></nav><p>curto</p><p>${longo}</p>`), longo)
})

test('RT-TIT-01: remove o sufixo igual ao nome da fonte', () => {
  assert.equal(limparTitulo('Chuva alaga Recife | G1', 'g1.globo.com'), 'Chuva alaga Recife')
})

test('RT-TIT-02: não altera título sem sufixo da fonte', () => {
  assert.equal(limparTitulo('Recife - Olinda decreta emergência', 'g1.globo.com'), 'Recife - Olinda decreta emergência')
})

test('RT-DAT-01: a data de publicação usa o dia civil do Recife', () => {
  assert.equal(diaNoRecife('2024-05-10T22:30:00-03:00'), '2024-05-10')
  assert.equal(diaNoRecife('2024-05-11T01:30:00Z'), '2024-05-10')
  assert.equal(diaNoRecife('não é data'), null)
})

test('RT-DAT-02: sem menção no texto, a data do evento permanece nula', () => {
  assert.deepEqual(avaliarDataEvento(undefined, '2024-05-10'), { dataEvento: null })
})

test('RT-DAT-03: evento posterior à publicação é rejeitado com alerta', () => {
  assert.deepEqual(avaliarDataEvento('2024-05-11', '2024-05-10'), {
    dataEvento: null,
    alerta: 'evento posterior à publicação',
  })
})

test('RT-TER-01: bairro homônimo em outro estado não indica município da região', () => {
  assert.deepEqual(encontrarMunicipios('Chuva em Boa Viagem, no Ceará'), [])
})

test('RT-TER-02: logradouro e sobrenome não indicam município', () => {
  assert.deepEqual(encontrarMunicipios('Enchente na Avenida Paulista, relata João Moreno'), [])
  assert.deepEqual(encontrarMunicipios('Barreira deslizou em Paulista, no Grande Recife'), ['Paulista', 'Recife'])
})

test('RT-TER-03: reconhece as formas usuais dos nomes de município', () => {
  assert.deepEqual(encontrarMunicipios('Em Jaboatão e Olinda houve deslizamentos'), [
    'Jaboatão dos Guararapes',
    'Olinda',
  ])
})

test('RT-BAI-01: trechos sem nome próprio não viram bairro', () => {
  assert.deepEqual(separarBairros('134 bairros no total'), [])
  assert.deepEqual(separarBairros('bairros da zona norte'), [])
})

test('RT-BAI-02: nomes variantes são normalizados pelo dicionário', () => {
  assert.deepEqual(separarBairros('IBURA e Cohab; Dois Unidos').map(identificarBairroRecife), ['Ibura', 'Cohab', 'Dois Unidos'])
  assert.equal(identificarBairroRecife('Agua Fria'), 'Água Fria')
  assert.equal(identificarBairroRecife('Jd. Sao Paulo'), 'Jardim São Paulo')
})

test('RT-BAI-03: bairro desconhecido resulta em null', () => {
  assert.equal(identificarBairroRecife('Bairro Nao Cadastrado'), null)
})

test('RT-LLM-01: evidência ausente do texto é rejeitada', () => {
  assert.equal(evidenciaPresente('Água invadiu casas', 'A água invadiu  CASAS no bairro.'), true)
  assert.equal(evidenciaPresente('Nada disso consta', 'A água invadiu casas.'), false)
  assert.equal(evidenciaPresente(undefined, 'qualquer texto'), false)
})

test('RT-LLM-02: tema fora do vocabulário vira outro', () => {
  assert.deepEqual(normalizarTemas(['Defesa Civil', 'clima extremo', 'mortes']), ['defesa_civil', 'outro', 'mortes'])
})

test('RT-DUP-01: textos iguais com diferença de formatação têm o mesmo hash', () => {
  assert.equal(hashTexto('Água  invadiu CASAS.'), hashTexto('agua invadiu casas'))
})

test('RT-FIL-01: o filtro de título aceita o tema e rejeita outros assuntos', () => {
  assert.equal(tituloRelevante('Chuva deixa desabrigados em Olinda'), true)
  assert.equal(tituloRelevante('Sport vence jogo no Recife'), false)
})

test('RT-COL-01: a leitura do RSS decodifica título, fonte e data', () => {
  const [item] = interpretarRss(
    '<item><title>Chuva &amp; vento - G1</title><link>https://news.google.com/rss/articles/abc?oc=5</link><pubDate>Tue, 24 May 2022 07:00:00 GMT</pubDate><source url="https://g1.globo.com">G1</source></item>',
  )
  assert.equal(item.titulo, 'Chuva & vento - G1')
  assert.equal(item.fonte, 'G1')
  assert.equal(item.publicadoEm?.toISOString(), '2022-05-24T07:00:00.000Z')
})

test('RT-COL-02: a consulta restringe município e período', () => {
  const consulta = montarConsulta('"Olinda"', '2022-05-01', '2022-06-01')
  assert.match(consulta, /^"Olinda" /)
  assert.match(consulta, /after:2022-05-01 before:2022-06-01$/)
})

test('RT-COL-03: robots.txt aplica somente regras de qualquer robô', () => {
  const robots = 'User-agent: Googlebot\nDisallow: /a\n\nUser-agent: *\nDisallow: /privado # nota\nAllow: /\n'
  assert.deepEqual(lerRegrasRobots(robots), [
    { permitir: false, caminho: '/privado' },
    { permitir: true, caminho: '/' },
  ])
})

test('RT-COL-04: curingas do robots.txt não bloqueiam o site inteiro', () => {
  const regras = lerRegrasRobots('User-agent: *\nDisallow: /*?s=\nDisallow: /busca/*\nDisallow: /*.pdf$\n')
  assert.equal(permitidoPelasRegras(regras, '/pe/pernambuco/noticia/chuva.ghtml'), true)
  assert.equal(permitidoPelasRegras(regras, '/?s=chuva'), false)
  assert.equal(permitidoPelasRegras(regras, '/busca/chuva'), false)
  assert.equal(permitidoPelasRegras(regras, '/a.pdf'), false)
  assert.equal(permitidoPelasRegras(regras, '/a.pdf.html'), true)
})

test('RT-COL-05: a regra mais específica do robots.txt prevalece', () => {
  const regras = lerRegrasRobots('User-agent: *\nDisallow: /_next/\nAllow: /_next/static/\nDisallow: /\n')
  assert.equal(permitidoPelasRegras(regras, '/_next/static/a.js'), true)
  assert.equal(permitidoPelasRegras(regras, '/_next/a'), false)
  assert.equal(permitidoPelasRegras(regras, '/materia'), false)
})

test('RT-DC-01: cabeçalho corrompido é corrigido e coluna desconhecida interrompe', () => {
  assert.equal(normalizarCabecalho('MÃªs'), 'Mes')
  const colunas = '_id,Regional,Ano,MÃªs,Data,Ocorrencia,Solicitacao,Endereco,Bairro,Localidade,Grau_de_Risco,Data_da_Acao,Tipo_da_Acao,Quantidade,Altura,Largura,Area_m'.split(',')
  assert.doesNotThrow(() => validarColunas(colunas))
  assert.throws(() => validarColunas([...colunas, 'Nova']))
})

const LINHA_DESLOCADA = {
  _id: 7, Regional: 2022, Ano: 'Julho', 'MÃªs': '2022-07-15T00:00:00', Data: 'Imveis com Danos / Risco',
  Ocorrencia: 'Vistoria', Solicitacao: '"Rua Alto da Bela Vista', Endereco: '12', Bairro: 'Coqueiral',
  Localidade: 'Alto', Grau_de_Risco: 'r 4', Data_da_Acao: '2022-07-15T00:00:00', Tipo_da_Acao: 'Atendimento  Social',
  Quantidade: null, Altura: null, Largura: null, Area_m: 0,
}

test('RT-DC-02: linha com colunas deslocadas é realinhada', () => {
  assert.equal(colunasDeslocadas(LINHA_DESLOCADA), true)
  const t = tratarAtendimento(LINHA_DESLOCADA)
  assert.equal(t.ano, 2022)
  assert.equal(t.regional, null)
  assert.equal(t.dataSolicitacao, '2022-07-15')
  assert.equal(t.ocorrencia, 'Imveis com Danos / Risco')
  assert.equal(t.solicitacao, 'Vistoria')
  assert.equal(t.categoria, 'Imóvel com danos ou risco')
  assert.equal(t.grauRisco, 'R4')
})

test('RT-DC-03: endereço e logradouro nunca aparecem nos campos analíticos', () => {
  const t = tratarAtendimento(LINHA_DESLOCADA)
  assert.equal(JSON.stringify(t).includes('Bela Vista'), false)
  const semDeslocamento = tratarAtendimento({
    _id: 8, Regional: 'Sul', Ano: 2024, Mês: 'Maio', Data: '2024-05-01', Ocorrencia: '', Solicitacao: 'Rua da Paz',
    Endereco: 'Rua da Paz 10', Bairro: 'Ibura', Localidade: 'X', Grau_de_Risco: '', Data_da_Acao: '', Tipo_da_Acao: '',
    Quantidade: null, Altura: null, Largura: null, Area_m: null,
  })
  assert.equal(semDeslocamento.solicitacao, null)
  assert.equal(JSON.stringify(semDeslocamento).includes('Rua da Paz'), false)
  assert.ok(semDeslocamento.alertas.includes('logradouro removido de solicitacao'))
})

test('RT-DC-04: categorias com caracteres perdidos na publicação são reconhecidas', () => {
  assert.equal(classificarCategoria('Colocao de Lonas Plsticas'), 'Colocação de lonas')
  assert.equal(classificarCategoria('Incndios'), 'Incêndio')
  assert.equal(classificarCategoria('Monitoramento Alagado'), 'Alagamento')
  assert.equal(classificarCategoria(null, 'MONITORAMENTO'), 'Monitoramento')
})

test('RT-DC-06: datas impossíveis são descartadas com alerta', () => {
  const base = {
    _id: 9, Regional: 'Sul', Ano: 2021, Mês: 'Maio', Ocorrencia: '', Solicitacao: 'Vistoria', Endereco: '', Bairro: 'Torroes',
    Localidade: '', Grau_de_Risco: '', Tipo_da_Acao: '', Quantidade: null, Altura: null, Largura: null, Area_m: null,
  }
  const errada = tratarAtendimento({ ...base, Data: '0202-02-10T00:00:00', Data_da_Acao: '1900-01-16' }, '2026-11-02')
  assert.equal(errada.dataSolicitacao, null)
  assert.equal(errada.dataAcao, null)
  assert.ok(errada.alertas.includes('data de solicitação ausente ou inválida'))
  assert.equal(errada.bairro, 'Torrões')
  const futura = tratarAtendimento({ ...base, Data: '2027-01-01', Data_da_Acao: '2021-05-02' }, '2026-11-02')
  assert.equal(futura.dataSolicitacao, null)
  assert.equal(futura.dataAcao, '2021-05-02')
})

test('RT-DC-05: grau de risco é normalizado e valor inválido é descartado', () => {
  assert.equal(normalizarGrauRisco('r 3'), 'R3')
  assert.equal(normalizarGrauRisco('R24'), null)
})
