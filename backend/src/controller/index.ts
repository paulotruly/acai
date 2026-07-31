import type { Request, Response } from 'express'
import { z } from 'zod'
import { userService } from '../service/index.js'
import type { ApiResponse, User } from '../type/index.js'

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(6),
})

export const userController = {
  async list(_req: Request, res: Response) {
    const users = await userService.list()
    const body: ApiResponse<User[]> = {
      success: true,
      message: 'Usuários listados',
      data: users,
    }
    res.json(body)
  },

  async create(req: Request, res: Response) {
    const parsed = createUserSchema.safeParse(req.body)

    if (!parsed.success) {
      const body: ApiResponse = {
        success: false,
        message: 'Dados inválidos',
        data: parsed.error.flatten().fieldErrors,
      }
      res.status(400).json(body)
      return
    }

    const user = await userService.create(parsed.data)
    const body: ApiResponse<User> = {
      success: true,
      message: 'Usuário criado',
      data: user,
    }
    res.status(201).json(body)
  },
}
