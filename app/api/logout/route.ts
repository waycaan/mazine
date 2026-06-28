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

import { NextResponse } from 'next/server'
import { IronLoginService } from '@/lib/iron-session'
export const runtime = 'edge'
export async function POST(request: Request) {
  try {
    await IronLoginService.logout()
    return NextResponse.json({
      success: true,
      message: '登出成功'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: '注销失败' },
      { status: 500 }
    )
  }
}