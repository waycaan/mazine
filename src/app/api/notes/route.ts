import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 获取所有笔记
export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      where: { deleted: false },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(notes)
  } catch (error) {
    return NextResponse.json({ error: '获取笔记失败' }, { status: 500 })
  }
}

// 创建新笔记
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const note = await prisma.note.create({
      data: {
        title: data.title || '无标题',
        content: data.content || '',
        folderId: data.folderId,
        order: data.order || 0,
      },
    })
    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: '创建笔记失败' }, { status: 500 })
  }
}

// 更新笔记
export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const note = await prisma.note.update({
      where: { id: data.id },
      data: {
        title: data.title,
        content: data.content,
        folderId: data.folderId,
        order: data.order,
        updatedAt: new Date(),
      },
    })
    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: '更新笔记失败' }, { status: 500 })
  }
}

// 删除笔记（软删除）
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    const note = await prisma.note.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    })
    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: '删除笔记失败' }, { status: 500 })
  }
} 