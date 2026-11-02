import { createHash } from 'node:crypto'
import { env } from '../../config/env.js'
import { prisma } from '../../config/database.js'
import { buscarRss, LIMITE_ITENS_RSS, LimiteGoogle, montarConsulta, resolverUrl } from '../coleta/googleNoticias.js'
import { baixarPagina } from '../coleta/paginas.js'
import { chamarExtracao, CotaEsgotada } from '../extracao/gemini.js'
import { avaliarDataEvento, dentroDoPeriodo, diaNoRecife, INICIO_PERIODO, paraDate } from '../tratamento/data.js'
import {
  evidenciaPresente,
  extracaoSchema,
  normalizarTemas,
  tituloRelevante,
  VERSAO_PROMPT,
} from '../tratamento/extracao.js'
import { encontrarMunicipios, identificarBairroRecife, MUNICIPIOS_RMR, separarBairros } from '../tratamento/territorio.js'
import { extrairTextoDoHtml, hashTexto, lerCanonica, lerJsonLd, lerMeta, limparTitulo } from '../tratamento/texto.js'
import { canonizarUrl, nomeDaFonte } from '../tratamento/url.js'

const SEMENTE_FILA = 'pesquisa-recife-2026'
const MINIMO_TEXTO = 200
const PAUSA_RSS_MS = 2000
const PAUSA_DECODIFICACAO_MS = 6000
const TAXA_MAXIMA_FALHA = 0.2
const MINIMO_PARA_AVALIAR_FALHA = 20

const pausa = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))
const sha256 = (texto: string) => createHash('sha256').update(texto).digest('hex')

// Ordem pseudoaleatória e fixa: uma interrupção não enviesa o período nem o município cobertos.
function ordemFila(chave: string): bigint {
  return BigInt(`0x${sha256(SEMENTE_FILA + chave).slice(0, 12)}`)
}

function janelasMensais(inicio: string, fim: string): [string, string][] {
  const janelas: [string, string][] = []
  const atual = new Date(`${inicio.slice(0, 7)}-01T00:00:00Z`)
  const limite = new Date(`${fim}T00:00:00Z`)
  while (atual < limite) {
    const proximo = new Date(atual)
    proximo.setUTCMonth(proximo.getUTCMonth() + 1)
    janelas.push([atual.toISOString().slice(0, 10), proximo.toISOString().slice(0, 10)])
    atual.setTime(proximo.getTime())
  }
  return janelas
}

async function registrarExecucao(consultaMunicipio: string, nome: string, inicio: string, fim: string) {
  const chave = sha256(`google-noticias|${nome}|${inicio}|${fim}`).slice(0, 64)
  await prisma.execucaoColeta.upsert({
    where: { chave },
    update: {},
    create: {
      chave,
      conector: 'google-noticias',
      consulta: montarConsulta(consultaMunicipio, inicio, fim),
      janelaInicio: paraDate(inicio),
      janelaFim: paraDate(fim),
    },
  })
}

/** Cria as consultas por município e mês; repetir a etapa não duplica execuções. */
export async function planejarColeta(): Promise<void> {
  const hoje = new Date().toISOString().slice(0, 10)
  const janelas = janelasMensais(INICIO_PERIODO, hoje)
  for (const { nome, consulta } of MUNICIPIOS_RMR) {
    for (const [inicio, fim] of janelas) await registrarExecucao(consulta, nome, inicio, fim)
  }
  console.log(`${MUNICIPIOS_RMR.length * janelas.length} consultas planejadas`)
}

/** Planeja somente o recorte do piloto: Recife, Olinda e Jaboatão, de abril a junho de 2022. */
export async function planejarPiloto(): Promise<void> {
  const nomes = ['Recife', 'Olinda', 'Jaboatão dos Guararapes']
  const municipios = MUNICIPIOS_RMR.filter((m) => nomes.includes(m.nome))
  const janelas = janelasMensais('2022-04-01', '2022-07-01')
  for (const { nome, consulta } of municipios) {
    for (const [inicio, fim] of janelas) await registrarExecucao(consulta, nome, inicio, fim)
  }
  console.log(`${municipios.length * janelas.length} consultas do piloto planejadas`)
}

export async function descobrir(limite = 1000): Promise<void> {
  const execucoes = await prisma.execucaoColeta.findMany({
    where: { estado: { in: ['PENDENTE', 'FALHOU'] } },
    orderBy: { id: 'asc' },
    take: limite,
  })

  for (const execucao of execucoes) {
    try {
      const { itens } = await buscarRss(execucao.consulta)
      for (const item of itens) {
        const chave = sha256(item.link.replace(/\?.*$/, ''))
        const relevante = tituloRelevante(item.titulo)
        await prisma.candidato.upsert({
          where: { chave },
          update: {},
          create: {
            chave,
            urlDescoberta: item.link,
            titulo: item.titulo.slice(0, 500),
            fonteDescoberta: item.fonte?.slice(0, 191),
            publicadoEm: item.publicadoEm,
            execucaoId: execucao.id,
            estado: relevante ? 'DESCOBERTO' : 'DESCARTADO_TITULO',
            ordemFila: ordemFila(chave),
          },
        })
      }
      // Uma janela no limite do RSS pode ter omitido resultados e precisa ser subdividida depois.
      await prisma.execucaoColeta.update({
        where: { id: execucao.id },
        data: { estado: itens.length >= LIMITE_ITENS_RSS ? 'SATURADA' : 'CONCLUIDA', itensRetornados: itens.length },
      })
    } catch (erro) {
      if (erro instanceof LimiteGoogle) {
        console.log('Limite de frequência do Google atingido; as consultas restantes permanecem pendentes')
        return
      }
      await prisma.execucaoColeta.update({
        where: { id: execucao.id },
        data: { estado: 'FALHOU', erro: erro instanceof Error ? erro.message : String(erro) },
      })
    }
    await pausa(PAUSA_RSS_MS)
  }
  console.log(`${execucoes.length} consultas executadas`)
}

export async function resolverCandidatos(limite = 500): Promise<void> {
  const candidatos = await prisma.candidato.findMany({
    where: { estado: { in: ['DESCOBERTO', 'FALHA_DECODIFICACAO'] }, tentativas: { lt: 3 } },
    orderBy: { ordemFila: 'asc' },
    take: limite,
  })

  let falhas = 0
  let processados = 0
  for (const candidato of candidatos) {
    processados += 1
    let url: string | null = null
    try {
      url = await resolverUrl(candidato.urlDescoberta)
    } catch (erro) {
      // O limite de frequência não é falha do item: a etapa para e retoma em outra execução.
      if (erro instanceof LimiteGoogle) {
        console.log(`Limite de frequência do Google atingido após ${processados - 1} itens; retome mais tarde`)
        return
      }
      url = null
    }
    if (!url) {
      falhas += 1
      await prisma.candidato.update({
        where: { id: candidato.id },
        data: { estado: 'FALHA_DECODIFICACAO', tentativas: { increment: 1 } },
      })
      if (processados >= MINIMO_PARA_AVALIAR_FALHA && falhas / processados > TAXA_MAXIMA_FALHA) {
        throw new Error(`Decodificador interrompido: ${falhas} falhas em ${processados} itens`)
      }
    } else {
      const canonica = canonizarUrl(url)
      const existente = await prisma.candidato.findUnique({ where: { urlCanonica: canonica } })
      await prisma.candidato.update({
        where: { id: candidato.id },
        data: existente
          ? { estado: 'DUPLICADO_URL', motivo: `igual ao candidato ${existente.id}` }
          : { estado: 'URL_RESOLVIDA', urlCanonica: canonica },
      })
    }
    await pausa(PAUSA_DECODIFICACAO_MS)
  }
  console.log(`${processados} links resolvidos, ${falhas} falhas`)
}

export async function baixar(limite = 500): Promise<void> {
  const hoje = new Date().toISOString().slice(0, 10)
  const candidatos = await prisma.candidato.findMany({
    where: { estado: 'URL_RESOLVIDA' },
    orderBy: { ordemFila: 'asc' },
    take: limite,
  })

  const contagem: Record<string, number> = {}
  for (const candidato of candidatos) {
    const url = candidato.urlCanonica!
    const pagina = await baixarPagina(url)
    let dados: Parameters<typeof prisma.candidato.update>[0]['data']

    if (pagina.situacao !== 'ok') {
      dados = { estado: pagina.situacao === 'bloqueado' ? 'BLOQUEADO' : 'SEM_TEXTO', motivo: pagina.motivo }
    } else {
      const artefato = await prisma.artefatoBruto.create({
        data: {
          tipo: 'pagina',
          urlOrigem: url.slice(0, 1000),
          caminho: pagina.caminho,
          sha256: pagina.sha256,
          httpStatus: pagina.httpStatus,
          contentType: pagina.contentType,
        },
      })
      const texto = extrairTextoDoHtml(pagina.html)
      const fonte = nomeDaFonte(url)
      const titulo = lerMeta(pagina.html, 'og:title') ?? candidato.titulo ?? ''
      const dataPublicacao =
        diaNoRecife(lerMeta(pagina.html, 'article:published_time')) ??
        diaNoRecife(lerJsonLd(pagina.html).dataPublicacao) ??
        diaNoRecife(candidato.publicadoEm)
      const canonica = canonizarUrl(pagina.urlFinal, lerCanonica(pagina.html))
      const municipios = encontrarMunicipios(`${titulo}\n${texto}`)

      let estado: 'AGUARDANDO_LLM' | 'SEM_TEXTO' | 'FORA_TERRITORIO' = 'AGUARDANDO_LLM'
      let motivo: string | undefined
      if (texto.length < MINIMO_TEXTO) {
        estado = 'SEM_TEXTO'
        motivo = `texto com ${texto.length} caracteres`
      } else if (municipios.length === 0) {
        estado = 'FORA_TERRITORIO'
      } else if (!dentroDoPeriodo(dataPublicacao, hoje)) {
        estado = 'FORA_TERRITORIO'
        motivo = `publicação fora do período: ${dataPublicacao}`
      }

      dados = {
        estado,
        motivo,
        artefatoId: artefato.id,
        textoTratado: texto,
        hashTexto: hashTexto(texto),
        tituloPagina: limparTitulo(titulo, fonte).slice(0, 500),
        dataPublicacao: paraDate(dataPublicacao),
        urlCanonica: canonica.length <= 700 && canonica !== url
          ? (await prisma.candidato.findUnique({ where: { urlCanonica: canonica } })) ? url : canonica
          : url,
      }
    }
    const atualizado = await prisma.candidato.update({ where: { id: candidato.id }, data: dados })
    contagem[atualizado.estado] = (contagem[atualizado.estado] ?? 0) + 1
    await pausa(500)
  }
  console.log('Páginas processadas:', contagem)
}

async function chamadasNasUltimas24Horas(): Promise<number> {
  return prisma.extracaoLlm.count({ where: { criadoEm: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
}

export async function extrair(limite?: number): Promise<void> {
  const disponivel = env.GEMINI_LIMITE_DIARIO - (await chamadasNasUltimas24Horas())
  const quantidade = Math.min(limite ?? disponivel, disponivel)
  if (quantidade <= 0) {
    console.log('Cota diária do Gemini já utilizada; execute novamente mais tarde')
    return
  }

  const candidatos = await prisma.candidato.findMany({
    where: { estado: 'AGUARDANDO_LLM', tentativas: { lt: 3 } },
    orderBy: { ordemFila: 'asc' },
    take: quantidade,
  })

  const contagem: Record<string, number> = {}
  for (const candidato of candidatos) {
    let bruto: string
    try {
      bruto = await chamarExtracao({
        url: candidato.urlCanonica!,
        titulo: candidato.tituloPagina,
        dataPublicacao: candidato.dataPublicacao?.toISOString().slice(0, 10) ?? null,
        texto: candidato.textoTratado!,
      })
    } catch (erro) {
      if (erro instanceof CotaEsgotada) {
        console.log('Cota diária esgotada; os itens restantes permanecem na fila')
        break
      }
      const mensagem = erro instanceof Error ? erro.message : String(erro)
      await prisma.extracaoLlm.create({
        data: { candidatoId: candidato.id, modelo: env.MODELO_GEMINI, versaoPrompt: VERSAO_PROMPT, sucesso: false, erro: mensagem },
      })
      await prisma.candidato.update({ where: { id: candidato.id }, data: { tentativas: { increment: 1 } } })
      contagem.erro = (contagem.erro ?? 0) + 1
      await pausa(env.GEMINI_INTERVALO_MS)
      continue
    }

    let json: unknown = null
    try {
      json = JSON.parse(bruto)
    } catch {
      json = null
    }
    const validado = extracaoSchema.safeParse(json)
    await prisma.extracaoLlm.create({
      data: {
        candidatoId: candidato.id,
        modelo: env.MODELO_GEMINI,
        versaoPrompt: VERSAO_PROMPT,
        respostaBruta: json ?? undefined,
        sucesso: validado.success,
        erro: validado.success ? undefined : bruto.slice(0, 2000),
      },
    })

    let estado: 'EXTRAIDO' | 'IRRELEVANTE' | 'FALHA_LLM' = 'FALHA_LLM'
    let motivo: string | undefined
    if (validado.success) {
      if (!validado.data.relevante) {
        estado = 'IRRELEVANTE'
      } else if (!evidenciaPresente(validado.data.evidencia, `${candidato.tituloPagina ?? ''}\n${candidato.textoTratado!}`)) {
        estado = 'IRRELEVANTE'
        motivo = 'evidência ausente do texto'
      } else {
        estado = 'EXTRAIDO'
      }
    }
    await prisma.candidato.update({ where: { id: candidato.id }, data: { estado, motivo } })
    contagem[estado] = (contagem[estado] ?? 0) + 1
    await pausa(env.GEMINI_INTERVALO_MS)
  }
  console.log('Extrações:', contagem)
}

/**
 * Reconstrói Noticia e NoticiaLocal a partir das extrações salvas, sem consumir cota.
 * Corrigir uma regra de tratamento exige apenas executar esta etapa novamente.
 */
export async function normalizar(): Promise<void> {
  const municipios = new Map((await prisma.municipio.findMany()).map((m) => [m.nome, m.id]))
  const bairros = new Map((await prisma.bairro.findMany()).map((b) => [b.nome, b]))
  const tipos = new Map((await prisma.tipoEvento.findMany()).map((t) => [t.nome, t.id]))
  const recife = municipios.get('Recife')!

  async function gravarLocais(noticiaId: number, nomesMunicipios: string[], textosBairro: string[]) {
    await prisma.noticiaLocal.deleteMany({ where: { noticiaId } })
    const linhas: { noticiaId: number; municipioId: number; bairroId: number | null; textoOriginal: string | null }[] = []
    for (const nome of nomesMunicipios) {
      const municipioId = municipios.get(nome)
      if (municipioId) linhas.push({ noticiaId, municipioId, bairroId: null, textoOriginal: null })
    }
    const vistos = new Set<string>()
    for (const texto of textosBairro) {
      const nome = identificarBairroRecife(texto)
      const chave = nome ?? texto
      if (vistos.has(chave)) continue
      vistos.add(chave)
      // Bairros validados pertencem ao Recife; demais nomes são mantidos sem vínculo a bairro.
      if (nome && nomesMunicipios.includes('Recife')) {
        linhas.push({ noticiaId, municipioId: recife, bairroId: bairros.get(nome)!.id, textoOriginal: texto.slice(0, 255) })
      }
    }
    if (linhas.length > 0) await prisma.noticiaLocal.createMany({ data: linhas })
  }

  const extraidos = await prisma.candidato.findMany({
    where: { estado: 'EXTRAIDO' },
    include: { extracoes: { where: { sucesso: true }, orderBy: { id: 'desc' }, take: 1 } },
  })

  for (const candidato of extraidos) {
    const parsed = extracaoSchema.safeParse(candidato.extracoes[0]?.respostaBruta)
    if (!parsed.success || !candidato.textoTratado || !candidato.urlCanonica) continue
    const e = parsed.data
    const dataPublicacao = candidato.dataPublicacao?.toISOString().slice(0, 10) ?? null
    const { dataEvento } = avaliarDataEvento(e.dataEvento, dataPublicacao)
    const dados = {
      titulo: candidato.tituloPagina,
      dataPublicacao: paraDate(dataPublicacao),
      dataEvento: paraDate(dataEvento),
      fonte: nomeDaFonte(candidato.urlCanonica),
      textoCompleto: candidato.textoTratado,
      hashTexto: candidato.hashTexto,
      origem: 'COLETA' as const,
      tipoEventoId: tipos.get(e.nomeTipoEvento) ?? null,
      localizacaoTexto: e.localizacaoTexto,
      bairroTexto: e.bairros?.join(', '),
      ruaOuPontoDeReferencia: e.ruaOuPontoDeReferencia,
      pessoasAfetadas: e.pessoasAfetadas,
      danoMaterial: e.danoMaterial,
      problemaInfraestrutura: e.problemaInfraestrutura,
      depoimentoMorador: e.depoimentoMorador,
      depoimentoInstituicao: e.depoimentoInstituicao,
      sentimento: e.sentimento,
      temas: normalizarTemas(e.temas),
    }
    const noticia = await prisma.noticia.upsert({
      where: { url: candidato.urlCanonica },
      update: { ...dados, candidatoId: candidato.id },
      create: { ...dados, url: candidato.urlCanonica, candidatoId: candidato.id },
    })
    await gravarLocais(
      noticia.id,
      encontrarMunicipios(`${candidato.tituloPagina ?? ''}\n${candidato.textoTratado}`),
      e.bairros ?? [],
    )
  }

  // As notícias anteriores à coleta ampliada recebem o mesmo tratamento territorial.
  const legado = await prisma.noticia.findMany({ where: { origem: 'LEGADO' } })
  for (const noticia of legado) {
    await prisma.noticia.update({
      where: { id: noticia.id },
      data: {
        titulo: noticia.titulo ? limparTitulo(noticia.titulo, noticia.fonte) : noticia.titulo,
        hashTexto: hashTexto(noticia.textoCompleto),
        temas: normalizarTemas(Array.isArray(noticia.temas) ? noticia.temas.map(String) : []),
      },
    })
    await gravarLocais(
      noticia.id,
      encontrarMunicipios(`${noticia.titulo ?? ''}\n${noticia.textoCompleto}`),
      separarBairros(noticia.bairroTexto),
    )
  }

  // Textos iguais em URLs distintas apontam para a notícia mais antiga do grupo.
  const todas = await prisma.noticia.findMany({
    where: { hashTexto: { not: null } },
    select: { id: true, hashTexto: true },
    orderBy: { id: 'asc' },
  })
  const primeiras = new Map<string, number>()
  let duplicadas = 0
  for (const { id, hashTexto: hash } of todas) {
    const primeira = primeiras.get(hash!)
    if (primeira === undefined) primeiras.set(hash!, id)
    else duplicadas += 1
    await prisma.noticia.update({ where: { id }, data: { duplicadaDeId: primeira ?? null } })
  }
  console.log(`${extraidos.length} extrações e ${legado.length} notícias anteriores normalizadas; ${duplicadas} duplicadas`)
}

export async function relatorio(): Promise<void> {
  const estados = await prisma.candidato.groupBy({ by: ['estado'], _count: true, orderBy: { estado: 'asc' } })
  const execucoes = await prisma.execucaoColeta.groupBy({ by: ['estado'], _count: true, orderBy: { estado: 'asc' } })
  const bloqueados = await prisma.candidato.findMany({
    where: { estado: 'BLOQUEADO' },
    select: { urlCanonica: true },
  })
  const porDominio = new Map<string, number>()
  for (const { urlCanonica } of bloqueados) {
    if (!urlCanonica) continue
    const dominio = nomeDaFonte(urlCanonica)
    porDominio.set(dominio, (porDominio.get(dominio) ?? 0) + 1)
  }
  const relevantes = await prisma.noticia.count({ where: { duplicadaDeId: null } })

  console.log('Consultas:', Object.fromEntries(execucoes.map((e) => [e.estado, e._count])))
  console.log('Candidatos:', Object.fromEntries(estados.map((e) => [e.estado, e._count])))
  console.log('Bloqueios por domínio:', Object.fromEntries([...porDominio].sort((a, b) => b[1] - a[1])))
  console.log('Notícias sem duplicatas:', relevantes)
  console.log('Chamadas ao Gemini nas últimas 24 horas:', await chamadasNasUltimas24Horas())
}

export async function executarDiario(limite?: number): Promise<void> {
  await descobrir()
  await resolverCandidatos(limite ?? 1000)
  await baixar(limite ?? 1000)
  await extrair(limite)
  await normalizar()
  await relatorio()
}
