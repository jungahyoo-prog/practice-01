/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Nginx 정적 서빙을 위한 설정 (빌드 시에만)
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },

  // 개발 환경에서 API 프록시 설정 (NEXT_PUBLIC_FLO_ENV가 없으면 프록시 불필요)
  async rewrites() {
    const env = process.env.NEXT_PUBLIC_FLO_ENV
    if (process.env.NODE_ENV === 'production' || !env) {
      return []
    }

    const API_SERVERS = {
      dev: 'https://api.dev.music-flo.com',
      qa: 'https://api.qa.music-flo.com',
      alpha: 'https://pri-api.alpha.music-flo.com',
      production: 'https://api.music-flo.com',
    }

    const apiServer = API_SERVERS[env] || API_SERVERS.qa

    console.log(`[Next.js] API Proxy: /api/* -> ${apiServer}/*`)

    return [
      {
        source: '/api/:path*',
        destination: `${apiServer}/:path*`,
      },
    ]
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "img-src 'self' data: https://cdn.music-flo.com https://cdnimg.music-flo.com https://image.music-flo.com https://img.music-flo.com",
              process.env.NEXT_PUBLIC_SUPABASE_URL
                ? "connect-src 'self' https://cdn.jsdelivr.net https://*.supabase.co wss://*.supabase.co https://*.supabase.in wss://*.supabase.in"
                : "connect-src 'self' https://cdn.jsdelivr.net",
              "font-src 'self' https://cdn.jsdelivr.net",
              "frame-src 'self' https://calendar.google.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
