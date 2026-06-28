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

import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
export interface SessionData {
  username: string;
  isLoggedIn: boolean;
  createdAt: number;
}
function deriveSessionKey(): string {
  const secret = process.env.AUTH_PASSWORD;
  if (!secret) {
    throw new Error('AUTH_PASSWORD must be set for session encryption');
  }
  const salt = 'mazine-session-salt-2024';
  const combined = salt + secret + salt;
  let key = '';
  for (let i = 0; i < 48; i++) {
    key += combined.charCodeAt(i % combined.length).toString(16);
  }
  return key;
}
const getSessionOptions = (): SessionOptions => ({
  cookieName: 'mazine-auth',
  password: deriveSessionKey(),
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