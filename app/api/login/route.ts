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
import { IronLoginService } from '@/lib/iron-session'
import type { NextRequest } from 'next/server'
export const runtime = 'edge'
const loginAttempts = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000
const RATE_LIMIT_MAX = 5
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const attempts = loginAttempts.get(ip) || []
  const recent = attempts.filter(t => now - t < RATE_LIMIT_WINDOW)
  if (recent.length >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { success: false, error: '登录尝试过于频繁，请 15 分钟后重试' },
      { status: 429 }
    )
  }
  try {
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '用户名和密码不能为空' },
        { status: 400 }
      )
    }
    if (username.length > 50 || password.length > 100) {
      return NextResponse.json(
        { success: false, error: '输入长度超出限制' },
        { status: 400 }
      )
    }
    await IronLoginService.login(username, password)
    loginAttempts.delete(ip)
    return NextResponse.json({
      success: true,
      data: { username },
      message: '登录成功'
    })
  } catch (error: any) {
    recent.push(now)
    loginAttempts.set(ip, recent)
    return NextResponse.json(
      { success: false, error: error.message || '登录失败' },
      { status: 401 }
    )
  }
}