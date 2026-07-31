import { prisma } from '../config/database.js'
import type { CreateUserInput, User } from '../type/index.js'

export const userService = {
  async list(): Promise<User[]> {
    return prisma.user.findMany()
  },

  async create(input: CreateUserInput): Promise<User> {
    return prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: input.password,
      },
    })
  },

  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  },
}
