/**
 * Copyright 2024 waycaan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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