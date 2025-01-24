import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 获取所有文件夹
export async function GET() {
  try {
    const folders = await prisma.folder.findMany({
      where: { deleted: false },
      orderBy: { order: 'asc' },
      include: {
        notes: {
          where: { deleted: false },
          orderBy: { order: 'asc' },
        },
      },
    })
    return NextResponse.json(folders)
  } catch (error) {
    return NextResponse.json({ error: '获取文件夹失败' }, { status: 500 })
  }
}

// 创建新文件夹
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const folder = await prisma.folder.create({
      data: {
        name: data.name || '新建文件夹',
        parentId: data.parentId,
        order: data.order || 0,
      },
    })
    return NextResponse.json(folder)
  } catch (error) {
    return NextResponse.json({ error: '创建文件夹失败' }, { status: 500 })
  }
}

// 更新文件夹
export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const folder = await prisma.folder.update({
      where: { id: data.id },
      data: {
        name: data.name,
        parentId: data.parentId,
        order: data.order,
        updatedAt: new Date(),
      },
    })
    return NextResponse.json(folder)
  } catch (error) {
    return NextResponse.json({ error: '更新文件夹失败' }, { status: 500 })
  }
}

// 删除文件夹（软删除）
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    // 同时软删除文件夹及其包含的笔记
    const [folder, notes] = await prisma.$transaction([
      prisma.folder.update({
        where: { id },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      }),
      prisma.note.updateMany({
        where: { folderId: id },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      }),
    ])
    return NextResponse.json({ folder, notes })
  } catch (error) {
    return NextResponse.json({ error: '删除文件夹失败' }, { status: 500 })
  }
} 