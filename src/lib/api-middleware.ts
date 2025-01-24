import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export function handleError(error: unknown) {
  console.error(error)
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return new NextResponse(
      JSON.stringify({
        error: '数据库操作失败',
        code: error.code
      }),
      { status: 400 }
    )
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new NextResponse(
      JSON.stringify({
        error: '数据验证失败'
      }),
      { status: 400 }
    )
  }
  
  return new NextResponse(
    JSON.stringify({
      error: '服务器内部错误'
    }),
    { status: 500 }
  )
} 