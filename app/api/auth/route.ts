import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // 检查请求体是否为空
    if (!request.body) {
      console.error('Empty request body')
      return NextResponse.json({ 
        success: false,
        error: '无效的请求' 
      }, { status: 400 })
    }

    const body = await request.json()
    
    // 检查密码字段是否存在
    if (!body || typeof body.password !== 'string') {
      console.error('Invalid password format')
      return NextResponse.json({ 
        success: false,
        error: '密码格式错误' 
      }, { status: 400 })
    }

    const { password } = body

    // 检查环境变量
    if (!process.env.ACCESS_PASSWORD) {
      console.error('ACCESS_PASSWORD not configured')
      return NextResponse.json({ 
        success: false,
        error: '服务器配置错误' 
      }, { status: 500 })
    }

    // 验证密码
    if (password === process.env.ACCESS_PASSWORD) {
      console.log('Login successful')
      
      // 设置认证 cookie
      cookies().set('auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',  // 改为 'lax' 以支持跨站点请求
        maxAge: 60 * 60 * 24 // 24小时
      })
      
      return NextResponse.json({ 
        success: true,
        redirect: '/' 
      })
    }

    console.log('Invalid password attempt')
    return NextResponse.json({ 
      success: false,
      error: '密码错误' 
    }, { status: 401 })

  } catch (error) {
    // 详细记录错误
    console.error('Auth error:', error)
    return NextResponse.json({ 
      success: false,
      error: '服务器错误',
      details: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : '未知错误'
        : undefined
    }, { status: 500 })
  }
} 