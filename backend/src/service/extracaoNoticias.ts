import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { env } from '../config/env.js'
import type { CriarNoticiaInput, Sentimento } from '../type/index.js'

const client = new GoogleGenAI({ apiKey: env.CHAVE_API_GEMINI })

const TIPOS_EVENTO = ['enchente', 'alagamento', 'deslizamento', 'falta_de_agua', 'incendio', 'outro'] as const
const SENTIMENTOS: [Sentimento, ...Sentimento[]] = ['POSITIVO', 'NEGATIVO', 'NEUTRO', 'MISTO']

export type NoticiaExtraida = Omit<CriarNoticiaInput, 'tipoEventoId'> & {
  nomeTipoEvento: string
}

const noticiaExtraidaSchema = z.object({
  titulo: z.string().optional(),
  data: z.coerce.date().optional(),
  fonte: z.string().min(1),
  url: z.string().url(),
  textoCompleto: z.string().min(1),
  nomeTipoEvento: z.enum(TIPOS_EVENTO),
  localizacaoTexto: z.string().optional(),
  bairro: z.string().optional(),
  ruaOuPontoDeReferencia: z.string().optional(),
  pessoasAfetadas: z.string().optional(),
  danoMaterial: z.string().optional(),
  problemaInfraestrutura: z.string().optional(),
  depoimentoMorador: z.string().optional(),
  depoimentoInstituicao: z.string().optional(),
  sentimento: z.enum(SENTIMENTOS).optional(),
  temas: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

function montarSystemInstruction(quantidade: number): string {
  return `Você é um assistente de pesquisa que ajuda a mapear eventos de desastre (enchente, alagamento, deslizamento, falta de água, incêndio) relatados em notícias e redes sociais sobre bairros do Recife.

Use a busca do Google para encontrar até ${quantidade} notícias ou posts REAIS e DISTINTOS (URLs diferentes, de fontes reais) relacionados ao termo de busca informado pelo usuário.

Para cada notícia encontrada, extraia os seguintes campos e responda SOMENTE com um array JSON (sem markdown, sem cercas de código, sem texto antes ou depois), no formato:

[
  {
    "titulo": "string opcional",
    "data": "data ISO 8601 opcional",
    "fonte": "nome do veículo/rede social",
    "url": "URL real da notícia/post",
    "textoCompleto": "texto ou resumo do conteúdo",
    "nomeTipoEvento": "um dos valores: ${TIPOS_EVENTO.join(' | ')}",
    "localizacaoTexto": "string opcional",
    "bairro": "string opcional",
    "ruaOuPontoDeReferencia": "string opcional",
    "pessoasAfetadas": "string opcional",
    "danoMaterial": "string opcional",
    "problemaInfraestrutura": "string opcional",
    "depoimentoMorador": "string opcional",
    "depoimentoInstituicao": "string opcional",
    "sentimento": "um dos valores: ${SENTIMENTOS.join(' | ')} (opcional)",
    "temas": ["string", "..."],
    "latitude": 0,
    "longitude": 0
  }
]

Se não encontrar nenhuma notícia real relevante, responda com um array vazio: []. Nunca invente uma URL ou notícia que não tenha sido encontrada na busca.`
}

function limparCercasDeCodigo(texto: string): string {
  return texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
}

export async function pesquisarNoticiasComGemini(
  consulta: string,
  quantidade = 3,
): Promise<NoticiaExtraida[]> {
  const resposta = await client.models.generateContent({
    model: env.MODELO_GEMINI,
    contents: consulta,
    config: {
      systemInstruction: montarSystemInstruction(quantidade),
      tools: [{ googleSearch: {} }],
    },
  })

  const textoFinal = limparCercasDeCodigo(resposta.text ?? '')
  if (!textoFinal) return []

  let itensBrutos: unknown
  try {
    itensBrutos = JSON.parse(textoFinal)
  } catch (erro) {
    console.warn('Não foi possível interpretar a resposta do Gemini como JSON:', erro)
    return []
  }

  const itens = Array.isArray(itensBrutos) ? itensBrutos : []
  const noticias: NoticiaExtraida[] = []

  for (const item of itens) {
    const validado = noticiaExtraidaSchema.safeParse(item)
    if (!validado.success) {
      console.warn('Item descartado por não seguir o formato esperado:', validado.error.flatten())
      continue
    }
    noticias.push(validado.data)
  }

  return noticias
}
