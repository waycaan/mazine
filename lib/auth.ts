/*
 * MIT License
 * 
 * Copyright (c) 2024 waycaan
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
const SESSION_COOKIE_NAME = 'session-id'
const CSRF_COOKIE_NAME = 'csrf-token'
class SessionStore {
  private static sessions = new Map<string, { username: string; isLoggedIn: boolean; createdAt: number }>()
  private static readonly SESSION_FILE = path.join(process.cwd(), '.sessions.json')
  private static initialized = false
  private static init() {
    if (this.initialized) return
    try {
      if (fs.existsSync(this.SESSION_FILE)) {
        const data = fs.readFileSync(this.SESSION_FILE, 'utf8')
        const sessionsArray = JSON.parse(data)
        const now = Date.now()
        const validSessions = sessionsArray.filter((session: any) => {
          return now - session.createdAt < 7 * 24 * 60 * 60 * 1000
        })
        this.sessions.clear()
        validSessions.forEach((session: any) => {
          this.sessions.set(session.sessionId, {
            username: session.username,
            isLoggedIn: session.isLoggedIn,
            createdAt: session.createdAt
          })
        })
        console.log(`🔄 [Session] 从文件加载 ${validSessions.length} 个有效session`)
      }
    } catch (error) {
      console.error('🚨 [Session] 加载session文件失败:', error)
    }
    this.initialized = true
  }
  private static save() {
    try {
      const sessionsArray = Array.from(this.sessions.entries()).map(([sessionId, data]) => ({
        sessionId,
        ...data
      }))
      fs.writeFileSync(this.SESSION_FILE, JSON.stringify(sessionsArray, null, 2))
      console.log(`💾 [Session] 已保存 ${sessionsArray.length} 个session到文件`)
    } catch (error) {
      console.error('🚨 [Session] 保存session文件失败:', error)
    }
  }
  static generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
  static createSession(username: string): string {
    this.init() 
    const sessionId = this.generateSessionId()
    this.sessions.set(sessionId, {
      username,
      isLoggedIn: true,
      createdAt: Date.now()
    })
    this.save()
    return sessionId
  }
  static isValidSession(sessionId: string): boolean {
    this.init() 
    if (!sessionId) return false
    const session = this.sessions.get(sessionId)
    console.log('🔍 Session验证详情:', {
      sessionId: sessionId.substring(0, 8) + '...',
      sessionExists: !!session,
      isLoggedIn: session?.isLoggedIn,
      totalSessions: this.sessions.size,
      allSessionIds: Array.from(this.sessions.keys()).map(id => id.substring(0, 8) + '...')
    });
    return !!(session?.isLoggedIn)
  }
  static deleteSession(sessionId: string): void {
    this.init() 
    this.sessions.delete(sessionId)
    this.save()
  }
  static getStats() {
    return {
      totalSessions: this.sessions.size,
      sessions: Array.from(this.sessions.entries()).map(([id, data]) => ({
        id: id.substring(0, 8) + '...',
        username: data.username,
        isLoggedIn: data.isLoggedIn,
        createdAt: new Date(data.createdAt).toISOString()
      }))
    }
  }
}
export class AuthUtils {
  static generateCSRFToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  static async setAuthCookie(sessionId: string) {
    const cookieStore = await cookies()
    const csrfToken = this.generateCSRFToken();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, 
      path: '/'
    })
    cookieStore.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, 
      path: '/'
    })
    console.log('🔐 已设置认证cookies:', {
      sessionId: sessionId.substring(0, 8) + '...',
      csrfToken: csrfToken.substring(0, 8) + '...'
    });
  }
  static async clearAuthCookie() {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (sessionId) {
      SessionStore.deleteSession(sessionId)
    }
    cookieStore.set(SESSION_COOKIE_NAME, '', { maxAge: 0 })
    cookieStore.set(CSRF_COOKIE_NAME, '', { maxAge: 0 })
    console.log('🧹 已清除所有认证cookies');
  }
  static async isLoggedIn(): Promise<boolean> {
    try {
      const cookieStore = await cookies()
      const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
      if (!sessionId) return false
      return SessionStore.isValidSession(sessionId)
    } catch {
      return false
    }
  }
  static getSessionStats() {
    return SessionStore.getStats()
  }
}
export function withAuth(handler: Function) {
  return async function(request: NextRequest, context?: any) {
    try {
      const cookieStore = await cookies()
      const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
      console.log('🔐 认证验证:', {
        hasSessionId: !!sessionId,
        sessionIdValue: sessionId?.substring(0, 8) + '...',
        url: request.url,
        method: request.method
      });
      if (!sessionId) {
        console.log('❌ 认证失败: 未找到session ID');
        return NextResponse.json(
          { success: false, error: '未登录' },
          { status: 401 }
        )
      }
      const isValid = SessionStore.isValidSession(sessionId)
      console.log('🔐 Session验证结果:', { isValid });
      if (!isValid) {
        console.log('❌ 认证失败: Session无效');
        return NextResponse.json(
          { success: false, error: '会话已过期' },
          { status: 401 }
        )
      }
      console.log('✅ 认证成功');
      return await handler(request, context)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '认证失败' },
        { status: 401 }
      )
    }
  }
}
export class LoginService {
  static async validateCredentials(username: string, password: string): Promise<boolean> {
    const validUsername = process.env.AUTH_USERNAME
    const validPassword = process.env.AUTH_PASSWORD
    if (!validUsername || !validPassword) {
      throw new Error('认证配置未设置')
    }
    return username === validUsername && password === validPassword
  }
  static async login(username: string, password: string): Promise<string> {
    const isValid = await this.validateCredentials(username, password)
    if (!isValid) {
      throw new Error('用户名或密码错误')
    }
    const sessionId = SessionStore.createSession(username)
    return sessionId
  }
}
export { SessionStore }
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
export function createApiResponse<T>(
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
export function withCSRF(handler: Function) {
  return async function(request: NextRequest, context?: any) {
    if (request.method === 'GET') {
      return await handler(request, context)
    }
    try {
      const cookieStore = await cookies()
      const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value
      const csrfHeader = request.headers.get('x-csrf-token')
      console.log('🔐 CSRF验证:', {
        hasCookie: !!csrfCookie,
        hasHeader: !!csrfHeader,
        cookieValue: csrfCookie?.substring(0, 8) + '...',
        headerValue: csrfHeader?.substring(0, 8) + '...',
        match: csrfCookie === csrfHeader
      });
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        console.log('❌ CSRF验证失败');
        return NextResponse.json(
          createApiResponse(false, undefined, 'CSRF验证失败'),
          { status: 403 }
        )
      }
      console.log('✅ CSRF验证成功');
      return await handler(request, context)
    } catch (error) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'CSRF验证错误'),
        { status: 403 }
      )
    }
  }
}