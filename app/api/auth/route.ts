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

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')
    return NextResponse.json({
      success: true,
      authenticated: !!token,
      data: token ? { token: token.value } : null
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Authentication check failed' },
      { status: 500 }
    )
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token } = body
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, 
      path: '/'
    })
    return NextResponse.json({
      success: true,
      message: 'Token set successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to set token' },
      { status: 500 }
    )
  }
}
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies()
    cookieStore.set('token', '', { maxAge: 0 })
    return NextResponse.json({
      success: true,
      message: 'Token cleared successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear token' },
      { status: 500 }
    )
  }
}