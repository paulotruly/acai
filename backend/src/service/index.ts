import { prisma } from '../config/database.js'
import { generateMockNewsEvents } from './mockNewsExtraction.js'
import type {
  CreateNewsEventInput,
  CreateUserInput,
  EventType,
  NewsEvent,
  SearchNewsEventsResult,
  User,
} from '../type/index.js'

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

export const eventTypeService = {
  async list(): Promise<EventType[]> {
    return prisma.eventType.findMany({ orderBy: { name: 'asc' } })
  },
}

export const newsEventService = {
  async list(): Promise<NewsEvent[]> {
    return prisma.newsEvent.findMany({ orderBy: { createdAt: 'desc' } })
  },

  async findById(id: number): Promise<NewsEvent | null> {
    return prisma.newsEvent.findUnique({ where: { id } })
  },

  async create(input: CreateNewsEventInput): Promise<NewsEvent> {
    return prisma.newsEvent.create({ data: input })
  },

  async search(query: string, count = 3): Promise<SearchNewsEventsResult> {
    const mockItems = generateMockNewsEvents(query, count)

    const existing = await prisma.newsEvent.findMany({
      where: { url: { in: mockItems.map((item) => item.url) } },
      select: { url: true },
    })
    const existingUrls = new Set(existing.map((item) => item.url))

    const created: NewsEvent[] = []
    for (const item of mockItems) {
      if (existingUrls.has(item.url)) continue

      const eventType = await prisma.eventType.upsert({
        where: { name: item.eventTypeName },
        update: {},
        create: { name: item.eventTypeName },
      })

      const { eventTypeName: _eventTypeName, ...data } = item
      const newsEvent = await prisma.newsEvent.create({
        data: { ...data, eventTypeId: eventType.id },
      })
      created.push(newsEvent)
    }

    return { created, skipped: mockItems.length - created.length }
  },
}
