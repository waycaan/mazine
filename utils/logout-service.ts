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

import { AuthClient } from '@/utils/auth-client'
import { frontendJsonManager } from '@/utils/frontend-json-manager'
export class LogoutService {
  static async logout(): Promise<void> {
    try {
      this.clearAllCaches()
      const result = await AuthClient.logout()
      if (result.success) {
        window.location.href = '/login'
      } else {
        alert(result.error || '登出失败')
      }
    } catch (error) {
      console.error('注销失败:', error)
      alert('登出失败')
    }
  }
  private static clearAllCaches(): void {
    frontendJsonManager.clearCache()
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
  }
}