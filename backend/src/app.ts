import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import { env } from './config/env.js'

const app = express()

app.use(cors(env.ORIGENS_PERMITIDAS.length > 0 ? { origin: env.ORIGENS_PERMITIDAS } : undefined))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API online' })
})

app.use('/api', routes)

app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(erro)
  res.status(500).json({ success: false, message: 'Erro interno do servidor' })
})

export default app
