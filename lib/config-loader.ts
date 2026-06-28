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
