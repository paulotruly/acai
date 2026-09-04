export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface User {
  id: number
  email: string
  name: string | null
  password: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserInput {
  email: string
  name?: string
  password: string
}

export type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED'

export interface EventType {
  id: number
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface NewsEvent {
  id: number
  title: string | null
  date: Date | null
  source: string
  url: string
  fullText: string
  eventTypeId: number | null
  locationText: string | null
  neighborhood: string | null
  streetOrLandmark: string | null
  peopleAffected: string | null
  materialDamage: string | null
  infrastructureIssue: string | null
  residentQuote: string | null
  institutionQuote: string | null
  sentiment: Sentiment | null
  themes: unknown
  latitude: number | null
  longitude: number | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateNewsEventInput {
  title?: string
  date?: Date
  source: string
  url: string
  fullText: string
  eventTypeId?: number
  locationText?: string
  neighborhood?: string
  streetOrLandmark?: string
  peopleAffected?: string
  materialDamage?: string
  infrastructureIssue?: string
  residentQuote?: string
  institutionQuote?: string
  sentiment?: Sentiment
  themes?: string[]
  latitude?: number
  longitude?: number
}

export interface SearchNewsEventsInput {
  query: string
  count?: number
}

export interface SearchNewsEventsResult {
  created: NewsEvent[]
  skipped: number
}
