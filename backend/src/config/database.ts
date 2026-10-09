import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client.js'
import { env } from './env.js'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  // MySQL 8 usa caching_sha2_password: sem isso o driver mariadb recusa a conexão
  // (ER_CANNOT_RETRIEVE_RSA_KEY), que o Prisma reporta como "pool timeout"
  const url = new URL(env.URL_BANCO_DE_DADOS)
  if (!url.searchParams.has('allowPublicKeyRetrieval')) {
    url.searchParams.set('allowPublicKeyRetrieval', 'true')
  }
  const adapter = new PrismaMariaDb(url.toString())
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
