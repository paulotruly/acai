import { decodificarEntidades } from '../tratamento/texto.js'

const USER_AGENT_NAVEGADOR = 'Mozilla/5.0'
export const LIMITE_ITENS_RSS = 100

const TERMOS =
  '(alagamento OR enchente OR inundação OR deslizamento OR "queda de barreira" OR "falta d\'água" OR incêndio OR desabrigados OR desalojados)'

export function montarConsulta(municipio: string, inicio: string, fim: string): string {
  return `${municipio} ${TERMOS} after:${inicio} before:${fim}`
}

export interface ItemNoticia {
  link: string
  titulo: string
  fonte?: string
  publicadoEm?: Date
}

export function interpretarRss(xml: string): ItemNoticia[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].flatMap(([, item]) => {
    const link = item.match(/<link>([^<]+)<\/link>/)?.[1]
    const titulo = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]
    if (!link || !titulo) return []
    const publicado = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]
    const data = publicado ? new Date(publicado) : undefined
    return [
      {
        link: decodificarEntidades(link),
        titulo: decodificarEntidades(titulo.replace(/<!\[CDATA\[|\]\]>/g, '')),
        fonte: item.match(/<source[^>]*>([^<]+)<\/source>/)?.[1],
        publicadoEm: data && !Number.isNaN(data.getTime()) ? data : undefined,
      },
    ]
  })
}

export async function buscarRss(consulta: string): Promise<{ xml: string; itens: ItemNoticia[] }> {
  const parametros = new URLSearchParams({ q: consulta, hl: 'pt-BR', gl: 'BR', ceid: 'BR:pt-419' })
  const resposta = await fetch(`https://news.google.com/rss/search?${parametros}`, {
    headers: { 'User-Agent': USER_AGENT_NAVEGADOR },
    signal: AbortSignal.timeout(30000),
  })
  if (resposta.status === 429) throw new LimiteGoogle()
  if (!resposta.ok) throw new Error(`Google Notícias respondeu ${resposta.status}`)
  const xml = await resposta.text()
  return { xml, itens: interpretarRss(xml) }
}

export class LimiteGoogle extends Error {}

/**
 * Obtém a URL real de um link do Google Notícias. O método não é oficial e pode deixar de
 * funcionar; por isso fica isolado aqui e a etapa chamadora interrompe a execução se a taxa
 * de falha subir, mantendo os itens para nova tentativa.
 */
export async function resolverUrl(link: string): Promise<string | null> {
  const id = link.match(/articles\/([^?]+)/)?.[1]
  if (!id) return null

  const pagina = await fetch(`https://news.google.com/articles/${id}`, {
    headers: { 'User-Agent': USER_AGENT_NAVEGADOR },
    signal: AbortSignal.timeout(20000),
  })
  if (pagina.status === 429) throw new LimiteGoogle()
  if (!pagina.ok) return null
  const html = await pagina.text()
  const assinatura = html.match(/data-n-a-sg="([^"]+)"/)?.[1]
  const instante = html.match(/data-n-a-ts="([^"]+)"/)?.[1]
  if (!assinatura || !instante) return null

  const requisicao = JSON.stringify([
    'garturlreq',
    [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1], 'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0],
    id,
    Number(instante),
    assinatura,
  ])
  const resposta = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'User-Agent': USER_AGENT_NAVEGADOR },
    body: `f.req=${encodeURIComponent(JSON.stringify([[['Fbv4je', requisicao]]]))}`,
    signal: AbortSignal.timeout(20000),
  })
  if (resposta.status === 429) throw new LimiteGoogle()
  if (!resposta.ok) return null
  const corpo = await resposta.text()
  const url = corpo.match(/https?:[^"\\]+/)?.[0]
  return url && !url.includes('google.com') ? url : null
}
