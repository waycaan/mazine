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

import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import md5 from 'md5';
export interface SessionData {
  username: string;
  isLoggedIn: boolean;
  createdAt: number;
}
const getSessionOptions = (): SessionOptions => ({
  cookieName: 'mazine-auth',
  password: md5('mazine' + (process.env.AUTH_PASSWORD || 'default-password')), 
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60, 
    sameSite: 'lax',
    path: '/'
  },
});
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}
export async function isLoggedIn(): Promise<boolean> {
  try {
    const session = await getSession();
    return !!(session.username && session.isLoggedIn);
  } catch {
    return false;
  }
}
export async function createLoginSession(username: string): Promise<void> {
  const session = await getSession();
  session.username = username;
  session.isLoggedIn = true;
  session.createdAt = Date.now();
  await session.save();
  await setCSRFToken();
}
async function setCSRFToken(): Promise<void> {
  const cookieStore = await cookies();
  const csrfToken = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
  cookieStore.set('csrf-token', csrfToken, {
    httpOnly: false, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, 
    path: '/'
  });
}
export async function clearLoginSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
  await clearCSRFToken();
}
async function clearCSRFToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('csrf-token', '', { maxAge: 0 });
}
export async function getCurrentUser(): Promise<{ username: string } | null> {
  try {
    const session = await getSession();
    if (session.isLoggedIn && session.username) {
      return { username: session.username };
    }
    return null;
  } catch {
    return null;
  }
}
export function withIronAuth(handler: Function) {
  return async function(request: NextRequest, context?: any) {
    try {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        return NextResponse.json(
          { success: false, error: '未登录' },
          { status: 401 }
        );
      }
      return await handler(request, context);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '认证失败' },
        { status: 401 }
      );
    }
  };
}
export class IronLoginService {
  static async validateCredentials(username: string, password: string): Promise<boolean> {
    const validUsername = process.env.AUTH_USERNAME;
    const validPassword = process.env.AUTH_PASSWORD;
    if (!validUsername || !validPassword) {
      throw new Error('认证配置未设置');
    }
    return username === validUsername && password === validPassword;
  }
  static async login(username: string, password: string): Promise<boolean> {
    const isValid = await this.validateCredentials(username, password);
    if (!isValid) {
      throw new Error('用户名或密码错误');
    }
    await createLoginSession(username);
    return true;
  }
  static async logout(): Promise<void> {
    await clearLoginSession();
  }
}