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
export const runtime = 'edge'
export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      services: {
        database: 'not_applicable',
        storage: checkS3Config(),
        auth: checkAuthConfig()
      }
    };

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    );
  }
}

function checkS3Config(): string {
  const requiredS3Vars = ['S3_ENDPOINT', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET_NAME'];
  const missingVars = requiredS3Vars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    return `misconfigured (missing: ${missingVars.join(', ')})`;
  }
  
  return 'configured';
}

function checkAuthConfig(): string {
  const requiredAuthVars = ['AUTH_USERNAME', 'AUTH_PASSWORD'];
  const missingVars = requiredAuthVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    return `misconfigured (missing: ${missingVars.join(', ')})`;
  }
  
  return 'configured';
}
