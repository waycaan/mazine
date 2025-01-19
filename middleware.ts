import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const auth = request.cookies.get('auth')
  const isAuthenticated = !!auth
  
  // 需要保护的路由
  const protectedPaths = ['/home', '/manage', '/likes']

  // 如果访问根路径，重定向到登录页
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 如果已登录用户访问登录页，重定向到主页
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // 如果未登录用户访问受保护的路由，重定向到登录页
  if (!isAuthenticated && protectedPaths.includes(pathname)) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)  // 保存来源路径
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// 只匹配需要处理的路由
export const config = {
  matcher: ['/', '/login', '/home', '/manage', '/likes']
}
