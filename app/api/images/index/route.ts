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

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { imageIndexManager } from '@/utils/image-index-manager';
import { ImageIndexResponse } from '@/types/image-index';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
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
export async function POST(request: NextRequest): Promise<NextResponse<ImageIndexResponse>> {
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