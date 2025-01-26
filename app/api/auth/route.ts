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
import bcrypt from 'bcryptjs'
import * as jose from 'jose'

const messages = {
  en: {
    emptyRequest: 'Invalid request',
    invalidPassword: 'Invalid password format',
    serverError: 'Server configuration error',
    wrongPassword: 'Incorrect password',
    logoutSuccess: 'Logged out',
    logoutFailed: 'Logout failed',
    invalidCredentials: 'Invalid credentials'
  },
  zh: {
    emptyRequest: '无效的请求',
    invalidPassword: '密码格式错误',
    serverError: '服务器配置错误',
    wrongPassword: '密码错误',
    logoutSuccess: '已登出',
    logoutFailed: '登出失败',
    invalidCredentials: '无效的凭证'
  }
}

const getCurrentLang = () => process.env.NEXT_PUBLIC_LANGUAGE?.toLowerCase() === 'en' ? 'en' : 'zh'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!process.env.AUTH_USERNAME || !process.env.AUTH_PASSWORD_HASH) {
      console.error('Missing auth configuration')
      return NextResponse.json({ 
        success: false,
        error: messages[getCurrentLang()].serverError 
      }, { status: 500 })
    }

    if (
      process.env.AUTH_USERNAME === username && 
      bcrypt.compareSync(password, process.env.AUTH_PASSWORD_HASH)
    ) {
      console.log('Login successful')
      
      // 使用 jose 生成 JWT token
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'default-secret'
      )
      
      const token = await new jose.SignJWT({ 
        authenticated: true,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .sign(secret)
      
      const response = NextResponse.json({ 
        success: true,
        redirect: '/home' 
      })

      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      })

      return response
    }

    return NextResponse.json({ 
      success: false,
      error: messages[getCurrentLang()].invalidCredentials 
    }, { status: 401 })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ 
      success: false,
      error: messages[getCurrentLang()].serverError 
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    cookies().delete('token')
    
    return NextResponse.json({ 
      success: true,
      message: messages[getCurrentLang()].logoutSuccess 
    })
    
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: messages[getCurrentLang()].logoutFailed 
    }, { status: 500 })
  }
} 
