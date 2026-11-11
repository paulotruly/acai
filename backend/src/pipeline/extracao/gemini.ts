import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { env } from '../../config/env.js'
import { extracaoSchema, INSTRUCAO_EXTRACAO } from '../tratamento/extracao.js'

const { $schema: _schema, ...extracaoJsonSchema } = z.toJSONSchema(extracaoSchema)

let cliente: GoogleGenAI | undefined

// Criado somente quando necessário, para que testes e importações sem LLM dispensem a chave.
function obterCliente(): GoogleGenAI {
  if (!env.CHAVE_API_GEMINI) throw new Error('CHAVE_API_GEMINI não configurada')
  cliente ??= new GoogleGenAI({ apiKey: env.CHAVE_API_GEMINI })
  return cliente
}

export class CotaEsgotada extends Error {}

export function erroDeCotaDiaria(mensagem: string): boolean {
  return /PerDay|per day|daily/i.test(mensagem)
}

export interface EntradaExtracao {
  url: string
  titulo: string | null
  dataPublicacao: string | null
  texto: string
}

/** Devolve a resposta bruta do modelo; lança CotaEsgotada quando a cota diária termina. */
export async function chamarExtracao(entrada: EntradaExtracao): Promise<string> {
  for (let tentativa = 1; ; tentativa++) {
    try {
      const resposta = await obterCliente().models.generateContent({
        model: env.MODELO_GEMINI,
        contents: `URL: ${entrada.url}\nTítulo: ${entrada.titulo ?? '(desconhecido)'}\nPublicado em: ${entrada.dataPublicacao ?? '(desconhecido)'}\n\nTexto:\n${entrada.texto}`,
        config: {
          systemInstruction: INSTRUCAO_EXTRACAO,
          temperature: 0,
          responseMimeType: 'application/json',
          responseJsonSchema: extracaoJsonSchema,
        },
      })
      return resposta.text ?? ''
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro)
      const limite = /429|RESOURCE_EXHAUSTED/.test(mensagem)
      if (limite && erroDeCotaDiaria(mensagem)) throw new CotaEsgotada(mensagem)
      if (!(limite || /503|UNAVAILABLE/.test(mensagem)) || tentativa >= 3) throw erro
      await new Promise((resolver) => setTimeout(resolver, 60000))
    }
  }
}
