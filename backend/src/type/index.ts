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
