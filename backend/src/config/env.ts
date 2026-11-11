import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  URL_BANCO_DE_DADOS: z.string().min(1, 'URL_BANCO_DE_DADOS é obrigatória'),
  PORTA: z.coerce.number().default(3001),
  CHAVE_API_GEMINI: z.string().optional(),
  MODELO_GEMINI: z.string().default('gemini-2.5-flash'),
  GEMINI_LIMITE_DIARIO: z.coerce.number().int().positive().default(20),
  GEMINI_INTERVALO_MS: z.coerce.number().int().positive().default(6000),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Erro nas variáveis de ambiente:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
