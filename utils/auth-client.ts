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

export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf-token') {
      return decodeURIComponent(value)
    }
  }
  return null
}
export class AuthClient {
  static async login(username: string, password: string): Promise<{ success: boolean; error?: string; csrfToken?: string }> {
    try {
      console.log('🔐 开始登录请求...', { username })
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })
      console.log('📡 登录响应状态:', response.status)
      const data = await response.json()
      console.log('📄 登录响应数据:', data)
      if (response.ok && data.success) {
        console.log('✅ 登录成功')
        return { success: true }
      }
      console.log('❌ 登录失败:', data.error)
      return { success: false, error: data.error || '登录失败' }
    } catch (error) {
      console.error('🚨 登录网络错误:', error)
      return { success: false, error: '网络错误，请重试' }
    }
  }
  static async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚪 开始注销请求...')
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('📡 注销响应状态:', response.status)
      const data = await response.json()
      console.log('📄 注销响应数据:', data)
      if (response.ok && data.success) {
        console.log('✅ 注销成功')
        return { success: true }
      }
      console.log('❌ 注销失败:', data.error)
      return { success: false, error: data.error || '注销失败' }
    } catch (error) {
      console.error('🚨 注销网络错误:', error)
      return { success: false, error: '网络错误' }
    }
  }
  static async apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const csrfToken = getCSRFToken()
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(csrfToken && options.method !== 'GET' && { 'X-CSRF-Token': csrfToken })
    }
    return fetch(url, {
      ...options,
      headers
    })
  }
}
export function useAuth() {
  const login = async (username: string, password: string) => {
    const result = await AuthClient.login(username, password)
    return result
  }
  const logout = async () => {
    const result = await AuthClient.logout()
    if (result.success) {
      window.location.href = '/login'
    }
    return result
  }
  const isAuthenticated = () => {
    if (typeof document === 'undefined') return false
    return document.cookie.includes('mazine-auth=')
  }
  return {
    login,
    logout,
    isAuthenticated
  }
}