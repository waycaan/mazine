export interface ApiResponse {
  success: boolean
  error?: string
  details?: string
}

export interface PaginatedResponse<T> extends ApiResponse {
  data?: {
    items: T[]
    total: number
    page: number
    pageSize: number
  }
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse extends ApiResponse {
  data?: {
    token: string
    user: {
      id: string
      username: string
    }
  }
}

export interface UploadRequest {
  file: File
  onProgress?: (progress: number) => void
}

export interface DeleteRequest {
  fileName: string
}

export interface BatchDeleteRequest {
  fileNames: string[]
}

export interface BatchLikeRequest {
  fileNames: string[]
  like: boolean
} 
