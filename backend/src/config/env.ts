import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  URL_BANCO_DE_DADOS: z.string().min(1, 'URL_BANCO_DE_DADOS é obrigatória'),
  PORTA: z.coerce.number().default(3001),
  CHAVE_API_GEMINI: z.string().optional(),
  MODELO_GEMINI: z.string().default('gemini-2.5-flash'),
  GEMINI_LIMITE_DIARIO: z.coerce.number().int().positive().default(20),
  GEMINI_INTERVALO_MS: z.coerce.number().int().positive().default(6000),
  // Domínios autorizados a consumir a API, separados por vírgula; vazio libera todos (desenvolvimento)
  ORIGENS_PERMITIDAS: z
    .string()
    .optional()
    .transform((valor) => valor?.split(',').map((origem) => origem.trim().replace(/\/$/, '')).filter(Boolean) ?? []),
})

// O Render (e a maioria das hospedagens) define a porta pela variável PORT
const parsed = envSchema.safeParse({ ...process.env, PORTA: process.env.PORTA ?? process.env.PORT })

if (!parsed.success) {
  console.error('❌ Erro nas variáveis de ambiente:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
