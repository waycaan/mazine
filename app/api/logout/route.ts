import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  // 删除认证 cookie
  response.cookies.delete('auth')
  
  return response
} 