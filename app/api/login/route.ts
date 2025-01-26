import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { passwordSchema, usernameSchema } from '@/lib/password-validation'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    try {
      usernameSchema.parse(username)
      passwordSchema.parse(password)
    } catch (error) {
      console.error('Validation error:', error)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      )
    }

    if (
      username !== process.env.AUTH_USERNAME ||
      !bcrypt.compareSync(password, process.env.AUTH_PASSWORD_HASH!)
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = await new SignJWT({
      authenticated: true,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET))

    const cookieStore = cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
} 