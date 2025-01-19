/** @type {import('next').NextConfig} */
const nextConfig = {
  // React 严格模式
  reactStrictMode: true,

    // 图片相关配置
  images: {
  unoptimized: true,
  domains: process.env.NEXT_PUBLIC_CDN ? 
    [new URL(process.env.NEXT_PUBLIC_CDN).hostname] : 
    [],
  },
  
  // API 配置
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },

  // 性能优化
  swcMinify: true,
  poweredByHeader: false,
  compress: true,

  // 安全配置
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],
}

export default nextConfig
