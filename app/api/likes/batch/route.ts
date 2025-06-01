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

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { imageIndexManager } from '@/utils/image-index-manager'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('批量收藏请求:', body)
    if (!body || !body.fileNames || !Array.isArray(body.fileNames)) {
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      )
    }
    const { fileNames } = body
    console.log('批量收藏文件:', fileNames)
    let updatedIndex = null;
    try {
      updatedIndex = await imageIndexManager.toggleLikes(fileNames, true);
      if (updatedIndex) {
        console.log(`📋 索引已更新，收藏总数: ${updatedIndex.likedCount}`);
      }
    } catch (indexError) {
      console.error('更新收藏索引失败:', indexError);
      return NextResponse.json({
        success: false,
        error: '更新索引失败'
      }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: `成功收藏 ${fileNames.length} 张图片`,
      newIndex: updatedIndex
    })
  } catch (error: any) {
    console.error('批量收藏失败:', error)
    return NextResponse.json(
      { error: '批量收藏失败' },
      { status: 500 }
    )
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('批量取消收藏请求:', body)
    if (!body || !body.fileNames || !Array.isArray(body.fileNames)) {
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      )
    }
    const { fileNames } = body
    console.log('批量取消收藏文件:', fileNames)
    let updatedIndex = null;
    try {
      updatedIndex = await imageIndexManager.toggleLikes(fileNames, false);
      if (updatedIndex) {
        console.log(`📋 索引已更新，收藏总数: ${updatedIndex.likedCount}`);
      }
    } catch (indexError) {
      console.error('更新取消收藏索引失败:', indexError);
      return NextResponse.json({
        success: false,
        error: '更新索引失败'
      }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: `成功取消收藏 ${fileNames.length} 张图片`,
      newIndex: updatedIndex
    })
  } catch (error: any) {
    console.error('批量取消收藏失败:', error)
    return NextResponse.json(
      { error: '批量取消收藏失败' },
      { status: 500 }
    )
  }
}