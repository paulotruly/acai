import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API online' })
})

app.use('/api', routes)

export default app
