import type { Request, Response } from 'express'
import { z } from 'zod'
import { eventTypeService, newsEventService, userService } from '../service/index.js'
import type {
  ApiResponse,
  EventType,
  NewsEvent,
  SearchNewsEventsResult,
  User,
} from '../type/index.js'

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(6),
})

const createNewsEventSchema = z.object({
  title: z.string().optional(),
  date: z.coerce.date().optional(),
  source: z.string().min(1),
  url: z.string().url(),
  fullText: z.string().min(1),
  eventTypeId: z.number().int().optional(),
  locationText: z.string().optional(),
  neighborhood: z.string().optional(),
  streetOrLandmark: z.string().optional(),
  peopleAffected: z.string().optional(),
  materialDamage: z.string().optional(),
  infrastructureIssue: z.string().optional(),
  residentQuote: z.string().optional(),
  institutionQuote: z.string().optional(),
  sentiment: z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED']).optional(),
  themes: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

const searchNewsEventsSchema = z.object({
  query: z.string().min(1),
  count: z.coerce.number().int().min(1).max(20).optional(),
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

export const eventTypeController = {
  async list(_req: Request, res: Response) {
    const eventTypes = await eventTypeService.list()
    const body: ApiResponse<EventType[]> = {
      success: true,
      message: 'Tipos de evento listados',
      data: eventTypes,
    }
    res.json(body)
  },
}

export const newsEventController = {
  async list(_req: Request, res: Response) {
    const newsEvents = await newsEventService.list()
    const body: ApiResponse<NewsEvent[]> = {
      success: true,
      message: 'Notícias listadas',
      data: newsEvents,
    }
    res.json(body)
  },

  async getById(req: Request, res: Response) {
    const id = Number(req.params.id)
    const newsEvent = await newsEventService.findById(id)

    if (!newsEvent) {
      const body: ApiResponse = { success: false, message: 'Notícia não encontrada' }
      res.status(404).json(body)
      return
    }

    const body: ApiResponse<NewsEvent> = {
      success: true,
      message: 'Notícia encontrada',
      data: newsEvent,
    }
    res.json(body)
  },

  async create(req: Request, res: Response) {
    const parsed = createNewsEventSchema.safeParse(req.body)

    if (!parsed.success) {
      const body: ApiResponse = {
        success: false,
        message: 'Dados inválidos',
        data: parsed.error.flatten().fieldErrors,
      }
      res.status(400).json(body)
      return
    }

    const newsEvent = await newsEventService.create(parsed.data)
    const body: ApiResponse<NewsEvent> = {
      success: true,
      message: 'Notícia criada',
      data: newsEvent,
    }
    res.status(201).json(body)
  },

  async search(req: Request, res: Response) {
    const parsed = searchNewsEventsSchema.safeParse(req.body)

    if (!parsed.success) {
      const body: ApiResponse = {
        success: false,
        message: 'Dados inválidos',
        data: parsed.error.flatten().fieldErrors,
      }
      res.status(400).json(body)
      return
    }

    const result = await newsEventService.search(parsed.data.query, parsed.data.count)
    const body: ApiResponse<SearchNewsEventsResult> = {
      success: true,
      message: `${result.created.length} notícia(s) criada(s), ${result.skipped} já existiam`,
      data: result,
    }
    res.status(201).json(body)
  },
}
