import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client.js'
import 'dotenv/config'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

const EVENT_TYPES = ['enchente', 'alagamento', 'deslizamento', 'falta_de_agua', 'incendio', 'outro']

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@exemplo.com' },
    update: {},
    create: {
      email: 'admin@exemplo.com',
      name: 'Admin',
      password: 'senha-segura',
    },
  })

  for (const name of EVENT_TYPES) {
    await prisma.eventType.upsert({
      where: { name },
      update: {},
      create: { name },
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
