import app from './app.js'
import { env } from './config/env.js'

app.listen(env.PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${env.PORTA}`)
})
