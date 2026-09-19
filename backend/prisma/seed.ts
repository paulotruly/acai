import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client.js'
import 'dotenv/config'

const adapter = new PrismaMariaDb(process.env.URL_BANCO_DE_DADOS!)
const prisma = new PrismaClient({ adapter })

const TIPOS_EVENTO = ['enchente', 'alagamento', 'deslizamento', 'falta_de_agua', 'incendio', 'outro']

async function main() {
  await prisma.usuario.upsert({
    where: { email: 'admin@exemplo.com' },
    update: {},
    create: {
      email: 'admin@exemplo.com',
      nome: 'Admin',
      senha: 'senha-segura',
    },
  })

  for (const nome of TIPOS_EVENTO) {
    await prisma.tipoEvento.upsert({
      where: { nome },
      update: {},
      create: { nome },
    })
  }

  console.log('✅ Seed concluído')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
