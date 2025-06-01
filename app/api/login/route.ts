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

import { NextResponse } from 'next/server'import { IronLoginService } from '@/lib/iron-session'export async function POST(request: Request) {  try {    const { username, password } = await request.json()    if (!username || !password) {      return NextResponse.json(        { success: false, error: '用户名和密码不能为空' },        { status: 400 }      )    }    if (username.length > 50 || password.length > 100) {      return NextResponse.json(        { success: false, error: '输入长度超出限制' },        { status: 400 }      )    }    await IronLoginService.login(username, password)    return NextResponse.json({      success: true,      data: { username },      message: '登录成功'    })  } catch (error: any) {    return NextResponse.json(      { success: false, error: error.message || '登录失败' },      { status: 401 }    )  }}