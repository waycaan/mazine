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

export interface AppConfig {
  app: {
    name: string;
    version: string;
    port: number;
    language: string;
  };
  auth: {
    username: string;
    password: string;
  };
  storage: {
    type: 's3';
    s3: {
      endpoint: string;
      region: string;
      accessKey: string;
      secretKey: string;
      bucketName: string;
      forcePathStyle: boolean;
    };
  };
  cdn: {
    enabled: boolean;
    baseUrl?: string;
  };
  security: {
    poweredByHeader: boolean;
    compress: boolean;
    headers: {
      xContentTypeOptions: string;
      xFrameOptions: string;
      xXSSProtection: string;
    };
  };
  features: {
    imageOptimization: boolean;
    thumbnailGeneration: boolean;
    batchOperations: boolean;
  };
}

class ConfigLoader {
  private static instance: ConfigLoader;
  private config: AppConfig | null = null;

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  public loadConfig(): AppConfig {
    if (this.config) {
      return this.config;
    }

    this.config = {
      app: {
        name: 'mazine',
        version: '1.0.0',
        port: parseInt(process.env.PORT || '3000'),
        language: process.env.NEXT_PUBLIC_LANGUAGE || 'zh',
      },
      auth: {
        username: process.env.AUTH_USERNAME || '',
        password: process.env.AUTH_PASSWORD || '',
      },
      storage: {
        type: 's3',
        s3: {
          endpoint: process.env.S3_ENDPOINT || '',
          region: process.env.S3_REGION || 'auto',
          accessKey: process.env.S3_ACCESS_KEY || '',
          secretKey: process.env.S3_SECRET_KEY || '',
          bucketName: process.env.S3_BUCKET_NAME || '',
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        },
      },
      cdn: {
        enabled: !!process.env.NEXT_PUBLIC_CDN,
        baseUrl: process.env.NEXT_PUBLIC_CDN,
      },
      security: {
        poweredByHeader: false,
        compress: true,
        headers: {
          xContentTypeOptions: 'nosniff',
          xFrameOptions: 'DENY',
          xXSSProtection: '1; mode=block',
        },
      },
      features: {
        imageOptimization: true,
        thumbnailGeneration: true,
        batchOperations: true,
      },
    };

    return this.config;
  }

  public getConfig(): AppConfig {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }

  public reloadConfig(): AppConfig {
    this.config = null;
    return this.loadConfig();
  }
}

export const configLoader = ConfigLoader.getInstance();
