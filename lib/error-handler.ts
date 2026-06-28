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

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
export class ApiError extends Error {
  statusCode?: number
  code?: string
  constructor(message: string, statusCode?: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
  }
}
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
export function createApiResponse<T = unknown>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): ApiResponse<T> {
  const response: ApiResponse<T> = { success }
  if (data !== undefined) response.data = data
  if (error) response.error = error
  if (message) response.message = message
  return response
}
export function withErrorHandler<T = Record<string, string>>(
  handler: (request: NextRequest, context: { params: T }) => Promise<Response>
) {
  return async function(request: NextRequest, context: { params: T }): Promise<Response> {
    try {
      return await handler(request, context)
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', {
          url: request.url,
          method: request.method,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
      }
      let statusCode = 500
      let errorMessage = 'Internal server error'
      if (error instanceof ApiError) {
        statusCode = error.statusCode || 500
        errorMessage = error.message
      } else if (error instanceof Error) {
        switch (error.name) {
          case 'ValidationError':
            statusCode = 400
            errorMessage = 'Invalid input data'
            break
          case 'UnauthorizedError':
            statusCode = 401
            errorMessage = 'Unauthorized access'
            break
          case 'ForbiddenError':
            statusCode = 403
            errorMessage = 'Forbidden access'
            break
          case 'NotFoundError':
            statusCode = 404
            errorMessage = 'Resource not found'
            break
          default:
            errorMessage = error.message || 'Internal server error'
        }
      }
      return NextResponse.json(
        createApiResponse(false, undefined, errorMessage),
        { status: statusCode }
      )
    }
  }
}
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}
export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden access') {
    super(message)
    this.name = 'ForbiddenError'
  }
}
export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`)
  }
}
export function validateFileExtension(filename: string, allowedExtensions: string[]): void {
  const ext = filename.toLowerCase().split('.').pop()
  if (!ext || !allowedExtensions.includes(ext)) {
    throw new ValidationError(`File extension must be one of: ${allowedExtensions.join(', ')}`)
  }
}
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\./, '')
    .trim()
}