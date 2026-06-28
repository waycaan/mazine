/**
 * Copyright 2024 waycaan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { imageIndexManager } from '@/utils/image-index-manager'
import { withIronAuth } from '@/lib/iron-session'
export const runtime = 'edge'

async function handlePOST(request: NextRequest) {
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
async function handleDELETE(request: NextRequest) {
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

export const POST = withIronAuth(handlePOST);
export const DELETE = withIronAuth(handleDELETE);