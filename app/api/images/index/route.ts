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

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
export const runtime = 'edge'
import { imageIndexManager } from '@/utils/image-index-manager';
import { ImageIndexResponse } from '@/types/image-index';
import { withIronAuth } from '@/lib/iron-session';
export async function GET(request: NextRequest): Promise<NextResponse<ImageIndexResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const rebuild = searchParams.get('rebuild') === 'true';
    let index;
    if (rebuild) {
      console.log('🔄 强制重建图片索引...');
      index = await imageIndexManager.rebuildIndex();
    } else {
      index = await imageIndexManager.getIndex();
      if (!index) {
        console.log('📋 索引不存在，自动重建...');
        index = await imageIndexManager.rebuildIndex();
      }
    }
    const etag = `"${index.lastUpdated}"`;
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag && !rebuild) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'private, max-age=300' 
        }
      });
    }
    const response = NextResponse.json({
      success: true,
      data: index
    });
    response.headers.set('ETag', etag);
    response.headers.set('Cache-Control', 'private, max-age=300');
    response.headers.set('Last-Modified', new Date(index.lastUpdated).toUTCString());
    return response;
  } catch (error) {
    console.error('获取图片索引失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取图片索引失败'
    }, { status: 500 });
  }
}
async function handlePOST(request: NextRequest): Promise<NextResponse<ImageIndexResponse>> {
  try {
    console.log('🔄 手动重建图片索引...');
    const index = await imageIndexManager.rebuildIndex();
    return NextResponse.json({
      success: true,
      data: index
    });
  } catch (error) {
    console.error('重建图片索引失败:', error);
    return NextResponse.json({
      success: false,
      error: '重建图片索引失败'
    }, { status: 500 });
  }
}

export const POST = withIronAuth(handlePOST);