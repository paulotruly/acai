import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { env } from '../config/env.js'
import type { CriarNoticiaInput, Sentimento } from '../type/index.js'

const client = new GoogleGenAI({ apiKey: env.CHAVE_API_GEMINI })

const TIPOS_EVENTO = ['enchente', 'alagamento', 'deslizamento', 'falta_de_agua', 'incendio', 'outro'] as const
const SENTIMENTOS: [Sentimento, ...Sentimento[]] = ['POSITIVO', 'NEGATIVO', 'NEUTRO', 'MISTO']

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const LIMITE_TEXTO_PAGINA = 15000

export type NoticiaExtraida = Omit<CriarNoticiaInput, 'tipoEventoId'> & {
  nomeTipoEvento: string
}

export interface FonteEncontrada {
  url: string
  fonte: string
}

// Campos que o Gemini extrai do texto real da página. url, fonte e textoCompleto
// vêm da própria página baixada, nunca do modelo, para não haver dado inventado.
const extracaoSchema = z.object({
  relevante: z
    .boolean()
    .describe('true somente se o texto é uma notícia/post relatando um evento de desastre concreto'),
  titulo: z.string().optional(),
  data: z.string().optional().describe('data do evento ou da publicação, formato ISO 8601 (AAAA-MM-DD)'),
  nomeTipoEvento: z.enum(TIPOS_EVENTO),
  localizacaoTexto: z.string().optional(),
  bairro: z
    .string()
    .optional()
    .describe('somente nomes de bairros citados, separados por vírgula; omita se nenhum bairro específico for citado'),
  ruaOuPontoDeReferencia: z.string().optional(),
  pessoasAfetadas: z.string().optional(),
  danoMaterial: z.string().optional(),
  problemaInfraestrutura: z.string().optional(),
  depoimentoMorador: z.string().optional(),
  depoimentoInstituicao: z.string().optional(),
  sentimento: z.enum(SENTIMENTOS).optional(),
  temas: z.array(z.string()).optional(),
})

const { $schema: _schema, ...extracaoJsonSchema } = z.toJSONSchema(extracaoSchema)

const INSTRUCAO_EXTRACAO = `Você extrai fatos de notícias e posts sobre eventos de desastre (enchente, alagamento, deslizamento, falta de água, incêndio) em bairros do Recife e região.

Use SOMENTE as informações presentes no texto fornecido. Não complete com conhecimento próprio nem invente dados: se um campo não estiver no texto, omita-o.
Marque "relevante" como false se o texto não for uma notícia/post sobre um evento de desastre concreto (ex.: previsão do tempo genérica, página inicial de portal, vídeo sem texto).
Em "depoimentoMorador" e "depoimentoInstituicao", copie as falas como aparecem no texto.`

function nomeDaFonte(url: string): string {
  return new URL(url).hostname.replace(/^(www|m)\./, '')
}

function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
}

function lerMeta(html: string, propriedade: string): string | undefined {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${propriedade}["'][^>]+content=["']([^"']*)["']`,
    'i',
  )
  const valor = html.match(regex)?.[1]
  return valor ? decodificarEntidades(valor).trim() : undefined
}

function extrairTextoDoHtml(html: string): string {
  const semRuido = html
    .replace(/<(script|style|noscript|svg|nav|footer|header|aside)[\s\S]*?<\/\1>/gi, ' ')
  const paragrafos = [...semRuido.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => decodificarEntidades(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 40)
  return paragrafos.join('\n\n').slice(0, LIMITE_TEXTO_PAGINA)
}

async function resolverRedirecionamento(uri: string): Promise<string | null> {
  try {
    const resposta = await fetch(uri, { redirect: 'manual', signal: AbortSignal.timeout(15000) })
    return resposta.headers.get('location')
  } catch {
    return null
  }
}

/**
 * Usa o Gemini com a busca do Google e retorna as URLs REAIS que a busca
 * consultou (groundingMetadata), já resolvidas do redirecionamento do Google.
 */
export async function buscarFontesComGemini(consulta: string): Promise<FonteEncontrada[]> {
  const resposta = await client.models.generateContent({
    model: env.MODELO_GEMINI,
    contents: `Pesquise no Google notícias e posts sobre: ${consulta}. Priorize notícias específicas sobre eventos em bairros do Recife. Resuma brevemente o que encontrou.`,
    config: { tools: [{ googleSearch: {} }] },
  })

  const chunks = resposta.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
  const urls = new Set<string>()
  for (const chunk of chunks) {
    const uri = chunk.web?.uri
    if (!uri) continue
    const url = await resolverRedirecionamento(uri)
    if (url) urls.add(url)
  }

  return [...urls].map((url) => ({ url, fonte: nomeDaFonte(url) }))
}

/**
 * Baixa a página real e pede ao Gemini (sem busca) para extrair os fatos do
 * texto dela. Retorna null se a página não abrir ou não for relevante.
 */
export async function extrairNoticiaDaPagina(fonte: FonteEncontrada): Promise<NoticiaExtraida | null> {
  let html: string
  try {
    const pagina = await fetch(fonte.url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR,pt;q=0.9' },
      signal: AbortSignal.timeout(20000),
    })
    if (!pagina.ok || !pagina.headers.get('content-type')?.includes('text/html')) return null
    html = await pagina.text()
  } catch {
    return null
  }

  const textoCompleto = extrairTextoDoHtml(html)
  if (textoCompleto.length < 200) return null

  const tituloPagina = lerMeta(html, 'og:title')
  const dataPublicacao = lerMeta(html, 'article:published_time')

  const resposta = await client.models.generateContent({
    model: env.MODELO_GEMINI,
    contents: `URL: ${fonte.url}\nTítulo: ${tituloPagina ?? '(desconhecido)'}\nPublicado em: ${dataPublicacao ?? '(desconhecido)'}\n\nTexto:\n${textoCompleto}`,
    config: {
      systemInstruction: INSTRUCAO_EXTRACAO,
      responseMimeType: 'application/json',
      responseJsonSchema: extracaoJsonSchema,
    },
  })

  let bruto: unknown
  try {
    bruto = JSON.parse(resposta.text ?? '')
  } catch (erro) {
    console.warn(`Resposta do Gemini não é JSON válido para ${fonte.url}:`, erro)
    return null
  }

  const validado = extracaoSchema.safeParse(bruto)
  if (!validado.success) {
    console.warn(`Extração descartada para ${fonte.url}:`, validado.error.flatten())
    return null
  }

  const { relevante, data, titulo, ...campos } = validado.data
  if (!relevante) return null

  const dataNoticia = new Date(dataPublicacao ?? data ?? '')

  return {
    ...campos,
    titulo: tituloPagina ?? titulo,
    data: Number.isNaN(dataNoticia.getTime()) ? undefined : dataNoticia,
    fonte: fonte.fonte,
    url: fonte.url,
    textoCompleto,
  }
}
