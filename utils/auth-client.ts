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