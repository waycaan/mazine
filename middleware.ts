import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value
  
  const protectedPaths = ['/home', '/manage', '/likes']

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let isAuthenticated = false
  if (token) {
    try {
      await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      )
      isAuthenticated = true
    } catch {
      isAuthenticated = false
    }
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
