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

import fs from 'fs';
import path from 'path';

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
  private configPath: string;

  private constructor() {
    this.configPath = process.env.CONFIG_PATH || '/app/config/config.json';
    
    if (process.env.NODE_ENV !== 'production') {
      this.configPath = path.join(process.cwd(), 'config', 'config.json');
    }
  }

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

    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error(`Configuration file not found: ${this.configPath}`);
      }

      const configContent = fs.readFileSync(this.configPath, 'utf8');
      const parsedConfig = JSON.parse(configContent) as AppConfig;
      
      this.validateConfig(parsedConfig);
      this.config = parsedConfig;
      
      this.setEnvironmentVariables(parsedConfig);
      
      console.log('✅ Configuration loaded successfully');
      return this.config;
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      throw error;
    }
  }

  private validateConfig(config: AppConfig): void {
    const requiredFields = [
      'auth.username',
      'auth.password',
      'storage.s3.endpoint',
      'storage.s3.accessKey',
      'storage.s3.secretKey',
      'storage.s3.bucketName'
    ];

    for (const field of requiredFields) {
      const value = this.getNestedValue(config, field);
      if (!value) {
        throw new Error(`Missing required configuration field: ${field}`);
      }
    }


  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setEnvironmentVariables(config: AppConfig): void {
    process.env.AUTH_USERNAME = config.auth.username;
    process.env.AUTH_PASSWORD = config.auth.password;
    
    process.env.S3_ENDPOINT = config.storage.s3.endpoint;
    process.env.S3_REGION = config.storage.s3.region;
    process.env.S3_ACCESS_KEY = config.storage.s3.accessKey;
    process.env.S3_SECRET_KEY = config.storage.s3.secretKey;
    process.env.S3_BUCKET_NAME = config.storage.s3.bucketName;
    process.env.S3_FORCE_PATH_STYLE = config.storage.s3.forcePathStyle.toString();
    
    if (config.cdn.enabled && config.cdn.baseUrl) {
      process.env.NEXT_PUBLIC_CDN = config.cdn.baseUrl;
    }
    
    process.env.NEXT_PUBLIC_LANGUAGE = config.app.language;
    process.env.PORT = config.app.port.toString();
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
