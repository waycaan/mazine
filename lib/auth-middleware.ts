import { NextRequest, NextResponse } from 'next/server'
import * as jose from 'jose'

type RouteHandler<T = Record<string, string>> = (
  request: NextRequest,
  context: { params: T }
) => Promise<Response> | Response

export function withAuth<T = Record<string, string>>(handler: RouteHandler<T>) {
  return async function(request: NextRequest, context: { params: T }) {
    const token = request.cookies.get('token')
    
    console.log('Auth middleware:', {
      hasCookie: !!token,
      cookieValue: token?.value,
      allCookies: request.cookies.getAll()
    })
    
    if (!token?.value) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    try {
      // 验证 JWT token
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'default-secret'
      )
      
      const { payload } = await jose.jwtVerify(token.value, secret)
      
      console.log('Token payload:', payload)
      
      if (!payload.authenticated) {
        console.log('Token not authenticated')
        throw new Error('Invalid token')
      }
      
      return handler(request, context)
      
    } catch (error: any) {
      console.error('Token verification failed:', error)
      return NextResponse.json(
        { 
          error: '未授权访问', 
          details: error?.message || '验证失败'
        },
        { status: 401 }
      )
    }
  }
} 
