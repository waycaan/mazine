/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare module '@aws-sdk/client-s3' {
  export class S3Client {
    constructor(config: any)
    send(command: any): Promise<any>
  }

  export class PutObjectCommand {
    constructor(input: any)
  }

  export class ListObjectsV2Command {
    constructor(input: any)
  }
}

declare module 'next/server' {
  import { NextResponse as OriginalNextResponse } from 'next'
  export const NextResponse: typeof OriginalNextResponse
}

declare module '*.tsx' {
  const content: React.FC<any> | React.ComponentType<any>
  export default content
} 