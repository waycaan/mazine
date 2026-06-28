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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 🚨 获取Iron Session认证cookie
  const ironSessionCookie = request.cookies.get('mazine-auth')?.value
  const isAuthenticated = !!ironSessionCookie

  // 根路径重定向到登录页
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 受保护的路径
  const protectedPaths = ['/home', '/manage', '/likes']
  const isProtectedPath = protectedPaths.includes(pathname)

  // 已登录用户访问登录页，重定向到首页
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // 未登录用户访问受保护页面，重定向到登录页
  if (!isAuthenticated && isProtectedPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}
