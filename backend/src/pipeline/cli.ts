import { prisma } from '../config/database.js'
import { importarDefesaCivil } from './etapas/defesaCivil.js'
import {
  baixar,
  descobrir,
  executarDiario,
  extrair,
  normalizar,
  planejarColeta,
  planejarPiloto,
  relatorio,
  resolverCandidatos,
} from './etapas/noticias.js'
import { semearReferencias } from './etapas/referencias.js'

const ETAPAS: Record<string, (limite?: number) => Promise<unknown>> = {
  referencias: semearReferencias,
  'defesa-civil': importarDefesaCivil,
  planejar: planejarColeta,
  piloto: planejarPiloto,
  descobrir,
  resolver: resolverCandidatos,
  baixar,
  extrair,
  normalizar,
  relatorio,
  diario: executarDiario,
}

const [nome, ...argumentos] = process.argv.slice(2)
const indice = argumentos.indexOf('--limite')
const limite = indice >= 0 ? Number(argumentos[indice + 1]) : undefined

const etapa = nome ? ETAPAS[nome] : undefined
if (!etapa) {
  console.error(`Etapa desconhecida. Opções: ${Object.keys(ETAPAS).join(', ')}`)
  process.exit(1)
}

try {
  await etapa(limite)
} catch (erro) {
  console.error(erro)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
