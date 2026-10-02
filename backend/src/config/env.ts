import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  URL_BANCO_DE_DADOS: z.string().min(1, 'URL_BANCO_DE_DADOS é obrigatória'),
  PORTA: z.coerce.number().default(3000),
  CHAVE_API_GEMINI: z.string().min(1, 'CHAVE_API_GEMINI é obrigatória'),
  MODELO_GEMINI: z.string().default('gemini-2.5-flash'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Erro nas variáveis de ambiente:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
