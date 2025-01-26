import { withAuth } from '@/lib/auth-middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const POST = withAuth(async (request: NextRequest) => {
  cookies().delete('auth')
  return NextResponse.json({ success: true })
}) 