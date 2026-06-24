import { NextResponse } from 'next/server'
export const runtime = 'edge'
export async function GET() {
  return NextResponse.json({
    AUTH_USERNAME: process.env.AUTH_USERNAME ? 'SET' : 'MISSING',
    AUTH_PASSWORD: process.env.AUTH_PASSWORD ? 'SET' : 'MISSING',
    S3_ENDPOINT: process.env.S3_ENDPOINT ? 'SET' : 'MISSING',
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME ? 'SET' : 'MISSING',
    NEXT_PUBLIC_CDN: process.env.NEXT_PUBLIC_CDN ? 'SET' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
  })
}
