/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  // SEO e Performance
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Excluir arquivos de áudio das funções serverless
  experimental: {
    outputFileTracingExcludes: {
      '*': ['./public/audio/**/*'],
      '/api/**': ['./public/audio/**/*']
    }
  },
  // Sitemap agora é servido como arquivo estático em /public/sitemap.xml
  // Configuração para servir arquivos estáticos e SEO
  async headers() {
    return [
      {
        source: '/audio/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
          {
            key: 'Alt-Svc',
            value: 'h3=":443"; ma=86400, h2=":443"; ma=86400',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      {
        source: '/(.*)',
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
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig;