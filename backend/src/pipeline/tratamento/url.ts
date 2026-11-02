const PARAMETROS_RASTREIO = /^(utm_.*|fbclid|gclid|gclsrc|dclid|mc_[ce]id|igshid|ref_src|outputType)$/i

export function nomeDaFonte(url: string): string {
  return new URL(url).hostname.replace(/^(www|m|amp)\./, '')
}

export function canonizarUrl(url: string, canonica?: string): string {
  let alvo: URL
  try {
    alvo = canonica ? new URL(canonica, url) : new URL(url)
  } catch {
    alvo = new URL(url)
  }
  alvo.hash = ''
  alvo.protocol = 'https:'
  alvo.hostname = alvo.hostname.toLowerCase().replace(/^(www|m|amp)\./, '')
  for (const chave of [...alvo.searchParams.keys()]) {
    if (PARAMETROS_RASTREIO.test(chave)) alvo.searchParams.delete(chave)
  }
  if (alvo.pathname.length > 1) alvo.pathname = alvo.pathname.replace(/\/+$/, '')
  return alvo.toString()
}
