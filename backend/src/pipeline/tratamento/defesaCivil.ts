import { createHash } from 'node:crypto'
import { identificarBairroRecife } from './territorio.js'
import { dentroDoPeriodo, diaNoRecife } from './data.js'
import { normalizarNome } from './texto.js'

export type RegistroCkan = Record<string, string | number | null | undefined>

const COLUNAS_ESPERADAS = [
  '_id', 'Regional', 'Ano', 'Mes', 'Data', 'Ocorrencia', 'Solicitacao', 'Endereco', 'Bairro', 'Localidade',
  'Grau_de_Risco', 'Data_da_Acao', 'Tipo_da_Acao', 'Quantidade', 'Altura', 'Largura', 'Area_m',
]

// Cabeçalhos publicados com codificação corrompida, como "MÃªs", equivalem ao nome correto.
export function normalizarCabecalho(coluna: string): string {
  const corrigida = coluna.replace(/^﻿/, '')
  return /^m(ê|Ãª|e)s$/i.test(corrigida) ? 'Mes' : corrigida
}

export function validarColunas(colunas: string[]): void {
  const normalizadas = new Set(colunas.map(normalizarCabecalho))
  const desconhecidas = [...normalizadas].filter((coluna) => !COLUNAS_ESPERADAS.includes(coluna))
  const ausentes = COLUNAS_ESPERADAS.filter((coluna) => !normalizadas.has(coluna))
  if (desconhecidas.length > 0 || ausentes.length > 0) {
    throw new Error(`Colunas inesperadas: ${desconhecidas.join(', ')}; ausentes: ${ausentes.join(', ')}`)
  }
}

function texto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null
  const limpo = String(valor).replace(/^"+|"+$/g, '').trim()
  return limpo === '' ? null : limpo
}

function numero(valor: unknown): number | null {
  const limpo = texto(valor)
  if (limpo === null) return null
  const convertido = Number(limpo.replace(',', '.'))
  return Number.isFinite(convertido) ? convertido : null
}

// A publicação contém erros de digitação, como o ano 0202; datas fora do período são descartadas.
function dia(valor: unknown, hoje: string): string | null {
  const limpo = texto(valor)
  if (!limpo || !/^\d{4}-\d{2}-\d{2}/.test(limpo)) return null
  const convertido = diaNoRecife(limpo.slice(0, 10))
  return dentroDoPeriodo(convertido, hoje) ? convertido : null
}

const PARECE_LOGRADOURO =
  /^(rua|r\.|av\b|av\.|avenida|travessa|tv\.|trav\b|beco|estrada|alameda|pra[cç]a|largo|vila|c[oó]rrego|alto|ladeira|subida|\d)/i

/**
 * Parte dos arquivos oficiais tem as colunas deslocadas uma posição para a esquerda:
 * Regional contém o ano, Ano contém o mês, Mês contém a data, Data contém a ocorrência,
 * Ocorrencia contém a solicitação e Solicitacao contém o logradouro.
 */
export function colunasDeslocadas(registro: RegistroCkan): boolean {
  return /^\d{4}$/.test(String(registro.Regional ?? '').trim())
}

const CATEGORIAS: [RegExp, string][] = [
  [/desliza/, 'Deslizamento de barreira'],
  [/monitoramento alagad|vistoria setor alagad|alagamento/, 'Alagamento'],
  [/inc(e)?ndio/, 'Incêndio'],
  [/v(i)?tima/, 'Vítimas'],
  [/desabamento/, 'Desabamento'],
  [/muro/, 'Muro com danos'],
  [/(a)?rvores? em risco|^rvores/, 'Árvores em risco'],
  [/im(o)?veis com danos/, 'Imóvel com danos ou risco'],
  [/reposi.*lona/, 'Reposição de lonas'],
  [/coloca.*lona/, 'Colocação de lonas'],
  [/monitoramento/, 'Monitoramento'],
  [/vistoria/, 'Vistoria'],
  [/acompanhamento de obra/, 'Acompanhamento de obra'],
]

export function classificarCategoria(...valores: (string | null)[]): string | null {
  for (const valor of valores) {
    if (!valor) continue
    const normalizado = normalizarNome(valor)
    const achada = CATEGORIAS.find(([padrao]) => padrao.test(normalizado))
    if (achada) return achada[1]
  }
  return null
}

const TIPO_EVENTO_POR_CATEGORIA: Record<string, string> = {
  'Deslizamento de barreira': 'deslizamento',
  Alagamento: 'alagamento',
  Incêndio: 'incendio',
}

export function normalizarGrauRisco(valor: string | null): string | null {
  const compacto = valor?.toUpperCase().replace(/\s/g, '')
  return compacto && /^R[1-4]$/.test(compacto) ? compacto : null
}

export interface AtendimentoTratado {
  idOrigem: number
  ano: number | null
  regional: string | null
  dataSolicitacao: string | null
  ocorrencia: string | null
  solicitacao: string | null
  categoria: string | null
  nomeTipoEvento: string | null
  bairroOriginal: string | null
  bairro: string | null
  grauRisco: string | null
  dataAcao: string | null
  tipoAcao: string | null
  quantidade: number | null
  altura: number | null
  largura: number | null
  areaM2: number | null
  colunasDeslocadas: boolean
  hashLinha: string
  alertas: string[]
}

export function tratarAtendimento(
  bruto: RegistroCkan,
  hoje = new Date().toISOString().slice(0, 10),
): AtendimentoTratado {
  const registro: RegistroCkan = {}
  for (const [coluna, valor] of Object.entries(bruto)) registro[normalizarCabecalho(coluna)] = valor

  const deslocada = colunasDeslocadas(registro)
  const alertas: string[] = []

  const regional = deslocada ? null : texto(registro.Regional)
  const ano = numero(deslocada ? registro.Regional : registro.Ano)
  const dataBruta = deslocada ? registro.Mes : registro.Data
  let ocorrencia = texto(deslocada ? registro.Data : registro.Ocorrencia)
  let solicitacao = texto(deslocada ? registro.Ocorrencia : registro.Solicitacao)

  // Salvaguarda de privacidade: um logradouro nunca é persistido em campo analítico.
  if (ocorrencia && PARECE_LOGRADOURO.test(ocorrencia)) {
    ocorrencia = null
    alertas.push('logradouro removido de ocorrencia')
  }
  if (solicitacao && PARECE_LOGRADOURO.test(solicitacao)) {
    solicitacao = null
    alertas.push('logradouro removido de solicitacao')
  }

  const dataSolicitacao = dia(dataBruta, hoje)
  if (!dataSolicitacao) alertas.push('data de solicitação ausente ou inválida')

  const bairroOriginal = texto(registro.Bairro)
  const bairro = bairroOriginal ? identificarBairroRecife(bairroOriginal) : null
  if (bairroOriginal && !bairro) alertas.push('bairro fora do dicionário')

  const grauOriginal = texto(registro.Grau_de_Risco)
  const grauRisco = normalizarGrauRisco(grauOriginal)
  if (grauOriginal && !grauRisco) alertas.push('grau de risco não reconhecido')

  const categoria = classificarCategoria(ocorrencia, solicitacao)
  const tipoAcao = texto(registro.Tipo_da_Acao)

  const campos = {
    ano, regional, dataSolicitacao, ocorrencia, solicitacao, bairroOriginal, grauRisco,
    dataAcao: dia(registro.Data_da_Acao, hoje),
    tipoAcao: tipoAcao ? normalizarNome(tipoAcao) : null,
    quantidade: numero(registro.Quantidade),
    altura: numero(registro.Altura),
    largura: numero(registro.Largura),
    areaM2: numero(registro.Area_m),
    localidade: texto(registro.Localidade),
    endereco: `${texto(registro.Endereco) ?? ''}|${deslocada ? (texto(registro.Solicitacao) ?? '') : ''}`,
  }
  // O endereço entra no hash apenas para distinguir linhas; o valor não é persistido.
  const hashLinha = createHash('sha256').update(JSON.stringify(campos)).digest('hex')
  const { localidade: _localidade, endereco: _endereco, ...publicos } = campos

  return {
    idOrigem: Number(registro._id),
    ...publicos,
    categoria,
    nomeTipoEvento: categoria ? (TIPO_EVENTO_POR_CATEGORIA[categoria] ?? null) : null,
    bairro,
    colunasDeslocadas: deslocada,
    hashLinha,
    alertas,
  }
}
