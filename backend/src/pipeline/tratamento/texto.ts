import { createHash } from 'node:crypto'

const ENTIDADES: Record<string, string> = {
  nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>', amp: '&',
  aacute: 'á', agrave: 'à', acirc: 'â', atilde: 'ã', auml: 'ä',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  iacute: 'í', igrave: 'ì', icirc: 'î', iuml: 'ï',
  oacute: 'ó', ograve: 'ò', ocirc: 'ô', otilde: 'õ', ouml: 'ö',
  uacute: 'ú', ugrave: 'ù', ucirc: 'û', uuml: 'ü',
  ccedil: 'ç', ntilde: 'ñ',
  Aacute: 'Á', Agrave: 'À', Acirc: 'Â', Atilde: 'Ã',
  Eacute: 'É', Ecirc: 'Ê', Iacute: 'Í',
  Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Uacute: 'Ú', Ccedil: 'Ç',
  ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  hellip: '…', ordm: 'º', ordf: 'ª', deg: '°', middot: '·',
}

// Uma única passagem: "&amp;amp;" resulta em "&amp;", e não em "&".
export function decodificarEntidades(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (original, corpo: string) => {
    if (corpo[0] !== '#') return ENTIDADES[corpo] ?? original
    const hexadecimal = corpo[1] === 'x' || corpo[1] === 'X'
    const codigo = Number.parseInt(corpo.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10)
    return Number.isNaN(codigo) || codigo > 0x10ffff ? original : String.fromCodePoint(codigo)
  })
}

function lerAtributo(etiqueta: string, nome: string): string | undefined {
  const m = etiqueta.match(new RegExp(`\\b${nome}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
  return m?.[1] ?? m?.[2]
}

export function lerMeta(html: string, propriedade: string): string | undefined {
  for (const [etiqueta] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const nome = lerAtributo(etiqueta, 'property') ?? lerAtributo(etiqueta, 'name')
    if (nome?.toLowerCase() !== propriedade.toLowerCase()) continue
    const valor = lerAtributo(etiqueta, 'content')
    if (valor) return decodificarEntidades(valor).trim()
  }
  return undefined
}

export function lerCanonica(html: string): string | undefined {
  for (const [etiqueta] of html.matchAll(/<link\b[^>]*>/gi)) {
    if (lerAtributo(etiqueta, 'rel')?.toLowerCase() === 'canonical') {
      return lerAtributo(etiqueta, 'href')
    }
  }
  return undefined
}

export interface ArtigoJsonLd {
  corpo?: string
  dataPublicacao?: string
}

export function lerJsonLd(html: string): ArtigoJsonLd {
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let dados: unknown
    try {
      dados = JSON.parse(m[1])
    } catch {
      continue
    }
    const pendentes: unknown[] = [dados]
    while (pendentes.length > 0) {
      const item = pendentes.shift()
      if (Array.isArray(item)) {
        pendentes.push(...item)
      } else if (item && typeof item === 'object') {
        const registro = item as Record<string, unknown>
        if (registro['@graph']) pendentes.push(registro['@graph'])
        if (typeof registro.articleBody === 'string' || typeof registro.datePublished === 'string') {
          return {
            corpo: typeof registro.articleBody === 'string' ? registro.articleBody : undefined,
            dataPublicacao: typeof registro.datePublished === 'string' ? registro.datePublished : undefined,
          }
        }
      }
    }
  }
  return {}
}

function limparFragmento(fragmento: string): string {
  return decodificarEntidades(fragmento.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

export function extrairTextoDoHtml(html: string, limite = 15000): string {
  const corpoJsonLd = lerJsonLd(html).corpo
  if (corpoJsonLd && corpoJsonLd.length >= 200) return limparFragmento(corpoJsonLd).slice(0, limite)

  const semRuido = html.replace(/<(script|style|noscript|svg|nav|footer|header|aside)\b[\s\S]*?<\/\1>/gi, ' ')
  return [...semRuido.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => limparFragmento(m[1]))
    .filter((p) => p.length > 40)
    .join('\n\n')
    .slice(0, limite)
}

export function decodificarBytes(bytes: Uint8Array, contentType?: string | null): string {
  const inicio = new TextDecoder('latin1').decode(bytes.slice(0, 2048))
  const declarado =
    contentType?.match(/charset=([\w-]+)/i)?.[1] ?? inicio.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1]
  try {
    return new TextDecoder(declarado ?? 'utf-8').decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}

export function normalizarNome(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

// Remove somente o sufixo que repete o nome da fonte: "Recife - Olinda decreta" permanece igual.
export function limparTitulo(titulo: string, fonte: string): string {
  const limpo = titulo.trim()
  const partes = limpo.match(/^(.*\S)\s+[|–—-]\s+([^|–—-]+)$/)
  if (!partes) return limpo
  const dominio = normalizarNome(fonte.replace(/\.(com|org|net|gov|uol|globo).*$/, '')).replace(/\s/g, '')
  const sufixo = normalizarNome(partes[2]).replace(/\s/g, '')
  return dominio && (sufixo.includes(dominio) || dominio.includes(sufixo)) ? partes[1].trim() : limpo
}

export function hashTexto(texto: string): string {
  return createHash('sha256').update(normalizarNome(texto)).digest('hex')
}
