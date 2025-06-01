/*
 * MIT License
 * 
 * Copyright (c) 2024 waycaan
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { NextRequest, NextResponse } from 'next/server'import { AuthUtils } from './auth'type RouteHandler<T = Record<string, string>> = (  request: NextRequest,  context: { params: T }) => Promise<Response> | Responseexport function withAuth<T = Record<string, string>>(handler: RouteHandler<T>) {  return async function(request: NextRequest, context: { params: T }) {    const sessionId = request.cookies.get('session-id')?.value    if (process.env.NODE_ENV === 'development') {      console.log('🔍 API认证中间件 - session存在:', !!sessionId)    }    if (!sessionId) {      return NextResponse.json(        { success: false, error: '未授权访问' },        { status: 401 }      )    }    try {      const isLoggedIn = await AuthUtils.isLoggedIn()      if (!isLoggedIn) {        if (process.env.NODE_ENV === 'development') {          console.log('❌ Session验证失败')        }        throw new Error('Session invalid')      }      if (process.env.NODE_ENV === 'development') {        console.log('✅ Session验证成功')      }      return handler(request, context)    } catch (error: any) {      if (process.env.NODE_ENV === 'development') {        console.error('❌ 认证失败:', error.message)      }      return NextResponse.json(        {          success: false,          error: '未授权访问'        },        { status: 401 }      )    }  }}