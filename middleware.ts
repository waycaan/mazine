import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const auth = request.cookies.get('auth')
  const isAuthenticated = !!auth
  
  const protectedPaths = ['/home', '/manage', '/likes']

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  if (!isAuthenticated && protectedPaths.includes(pathname)) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/home', '/manage', '/likes']
}
