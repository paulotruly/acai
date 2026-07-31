import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  PORT: z.coerce.number().default(3000),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Erro nas variáveis de ambiente:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
