/** @type {import('next').NextConfig} */
const nextConfig = {
  // React 严格模式
  reactStrictMode: true,

  // 图片相关配置
  images: {
    domains: ['imgurl.chenry.eu.org'],
    unoptimized: true,
  },

  // Sharp 包配置
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },

  // 性能优化
  swcMinify: true,  // 使用 SWC 压缩
  poweredByHeader: false,  // 移除 X-Powered-By header
  compress: true,  // 启用 gzip 压缩

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
