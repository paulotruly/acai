import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { decodificarBytes } from '../tratamento/texto.js'

// Identifica o projeto, sem simular navegador, e não contorna bloqueios das fontes.
const USER_AGENT = 'PesquisaCientificaCesarSchool/1.0 (pesquisa academica sobre desastres no Recife)'
const PASTA_BRUTOS = join('dados', 'brutos', 'noticias')

export interface RegraRobots {
  permitir: boolean
  caminho: string
}

const regrasPorHost = new Map<string, RegraRobots[]>()

/** Interpreta as regras que valem para qualquer robô no robots.txt. */
export function lerRegrasRobots(robots: string): RegraRobots[] {
  const regras: RegraRobots[] = []
  let aplicavel = false
  let lendoAgentes = false
  for (const linhaBruta of robots.split(/\r?\n/)) {
    const linha = linhaBruta.replace(/#.*/, '').trim()
    const m = linha.match(/^([\w-]+)\s*:\s*(.*)$/)
    if (!m) continue
    const campo = m[1].toLowerCase()
    if (campo === 'user-agent') {
      if (!lendoAgentes) aplicavel = false
      lendoAgentes = true
      if (m[2].trim() === '*') aplicavel = true
    } else {
      lendoAgentes = false
      if ((campo === 'disallow' || campo === 'allow') && aplicavel && m[2].trim()) {
        regras.push({ permitir: campo === 'allow', caminho: m[2].trim() })
      }
    }
  }
  return regras
}

function casaRegra(caminho: string, alvo: string): boolean {
  const ancorado = caminho.endsWith('$')
  const corpo = (ancorado ? caminho.slice(0, -1) : caminho)
    .split('*')
    .map((parte) => parte.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*')
  return new RegExp(`^${corpo}${ancorado ? '$' : ''}`).test(alvo)
}

// Conforme a RFC 9309, vale a regra mais longa; em caso de empate, a permissão prevalece.
export function permitidoPelasRegras(regras: RegraRobots[], alvo: string): boolean {
  let melhor: RegraRobots | undefined
  for (const regra of regras) {
    if (!casaRegra(regra.caminho, alvo)) continue
    const maisLonga = !melhor || regra.caminho.length > melhor.caminho.length
    const empatePermissivo = melhor && regra.caminho.length === melhor.caminho.length && regra.permitir
    if (maisLonga || empatePermissivo) melhor = regra
  }
  return melhor?.permitir ?? true
}

async function permitidoPorRobots(url: URL): Promise<boolean> {
  let regras = regrasPorHost.get(url.host)
  if (!regras) {
    try {
      const resposta = await fetch(`${url.origin}/robots.txt`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(10000),
      })
      regras = resposta.ok ? lerRegrasRobots(await resposta.text()) : []
    } catch {
      regras = []
    }
    regrasPorHost.set(url.host, regras)
  }
  return permitidoPelasRegras(regras, url.pathname + url.search)
}

export type ResultadoDownload =
  | { situacao: 'ok'; html: string; caminho: string; sha256: string; httpStatus: number; contentType: string | null; urlFinal: string }
  | { situacao: 'bloqueado' | 'falha'; motivo: string }

export async function baixarPagina(url: string): Promise<ResultadoDownload> {
  const alvo = new URL(url)
  if (!(await permitidoPorRobots(alvo))) return { situacao: 'bloqueado', motivo: 'robots.txt' }

  let resposta: Response
  try {
    resposta = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR,pt;q=0.9' },
      signal: AbortSignal.timeout(20000),
    })
  } catch (erro) {
    return { situacao: 'falha', motivo: erro instanceof Error ? erro.message : 'erro de rede' }
  }
  if ([401, 403, 429, 451].includes(resposta.status)) {
    return { situacao: 'bloqueado', motivo: `HTTP ${resposta.status}` }
  }
  const contentType = resposta.headers.get('content-type')
  if (!resposta.ok || !contentType?.includes('text/html')) {
    return { situacao: 'falha', motivo: `HTTP ${resposta.status} ${contentType ?? ''}`.trim() }
  }

  const bytes = new Uint8Array(await resposta.arrayBuffer())
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  mkdirSync(PASTA_BRUTOS, { recursive: true })
  const caminho = join(PASTA_BRUTOS, `${sha256}.html.gz`)
  writeFileSync(caminho, gzipSync(bytes))

  return {
    situacao: 'ok',
    html: decodificarBytes(bytes, contentType),
    caminho,
    sha256,
    httpStatus: resposta.status,
    contentType,
    urlFinal: resposta.url || url,
  }
}
