import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface LoginRequest {
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const receivedPassword = data.password
    const expectedPassword = process.env.ACCESS_PASSWORD
    
    if (!expectedPassword) {
      return NextResponse.json(
        { success: false, message: '服务器配置错误' },
        { status: 500 }
      )
    }
    
    if (receivedPassword === expectedPassword) {
      const response = NextResponse.json({ 
        success: true,
        message: '登录成功'
      })
      
      response.cookies.set('auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 72
      })
      
      return response
    }
    
    return NextResponse.json(
      { success: false, message: '密码错误' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
