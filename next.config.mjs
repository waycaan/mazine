/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
  unoptimized: true,
  domains: process.env.NEXT_PUBLIC_CDN ? 
    [new URL(process.env.NEXT_PUBLIC_CDN).hostname] : 
    [],
  },
  
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },

  swcMinify: true,
  poweredByHeader: false,
  compress: true,

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
