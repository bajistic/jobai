export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiError {
  error: string
  message?: string
  status: number
}

export type ApiRequestParams = Record<string, string | number | boolean | undefined> 