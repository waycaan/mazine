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

import { NextRequest, NextResponse } from 'next/server'
import { AuthUtils } from './auth'
type RouteHandler<T = Record<string, string>> = (
  request: NextRequest,
  context: { params: T }
) => Promise<Response> | Response
export function withAuth<T = Record<string, string>>(handler: RouteHandler<T>) {
  return async function(request: NextRequest, context: { params: T }) {
    const sessionId = request.cookies.get('session-id')?.value
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 API认证中间件 - session存在:', !!sessionId)
    }
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }
    try {
      const isLoggedIn = await AuthUtils.isLoggedIn()
      if (!isLoggedIn) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Session验证失败')
        }
        throw new Error('Session invalid')
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Session验证成功')
      }
      return handler(request, context)
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 认证失败:', error.message)
      }
      return NextResponse.json(
        {
          success: false,
          error: '未授权访问'
        },
        { status: 401 }
      )
    }
  }
}