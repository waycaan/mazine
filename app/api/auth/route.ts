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

const API_INFO = {
  id: 'mazine-api-auth-v1.0.0',
  endpoint: '/api/auth',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

if (process.env.NODE_ENV === 'development') {
  console.log(
    "%c Mazine API Endpoint %c /api/auth %c",
    "background: #059669; color: white; padding: 5px 0 5px 5px; border-radius: 3px 0 0 3px;",
    "background: #047857; color: white; padding: 5px; border-radius: 0 3px 3px 0;",
    "background: transparent"
  );
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const messages = {
  en: {
    emptyRequest: 'Invalid request',
    invalidPassword: 'Invalid password format',
    serverError: 'Server configuration error',
    wrongPassword: 'Incorrect password',
    logoutSuccess: 'Logged out',
    logoutFailed: 'Logout failed'
  },
  zh: {
    emptyRequest: '无效的请求',
    invalidPassword: '密码格式错误',
    serverError: '服务器配置错误',
    wrongPassword: '密码错误',
    logoutSuccess: '已登出',
    logoutFailed: '登出失败'
  }
}

const getCurrentLang = () => process.env.NEXT_PUBLIC_LANGUAGE?.toLowerCase() === 'en' ? 'en' : 'zh'

export async function POST(request: Request) {
  try {
    // 检查请求体是否为空
    if (!request.body) {
      console.error('Empty request body')
      return NextResponse.json({ 
        success: false,
        error: messages[getCurrentLang()].emptyRequest 
      }, { status: 400 })
    }

    const body = await request.json()
    
    // 检查密码字段是否存在
    if (!body || typeof body.password !== 'string') {
      console.error('Invalid password format')
      return NextResponse.json({ 
        success: false,
        error: messages[getCurrentLang()].invalidPassword 
      }, { status: 400 })
    }

    const { password } = body

    // 检查环境变量
    if (!process.env.ACCESS_PASSWORD) {
      console.error('ACCESS_PASSWORD not configured')
      return NextResponse.json({ 
        success: false,
        error: messages[getCurrentLang()].serverError 
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
      error: messages[getCurrentLang()].wrongPassword 
    }, { status: 401 })

  } catch (error) {
    // 详细记录错误
    console.error('Auth error:', error)
    return NextResponse.json({ 
      success: false,
      error: messages[getCurrentLang()].serverError,
      details: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : '未知错误'
        : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // 清除认证 cookie
    cookies().delete('auth')
    
    return NextResponse.json({ 
      success: true,
      message: messages[getCurrentLang()].logoutSuccess 
    })
    
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ 
      success: false,
      error: messages[getCurrentLang()].logoutFailed 
    }, { status: 500 })
  }
} 
