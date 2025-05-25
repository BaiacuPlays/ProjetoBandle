/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  // Excluir arquivos de áudio das funções serverless
  experimental: {
    outputFileTracingExcludes: {
      '*': ['./public/audio/**/*'],
      '/api/**': ['./public/audio/**/*']
    },
    outputFileTracingIgnores: ['./public/audio/**/*']
  },
  // Configuração para servir arquivos estáticos
  async headers() {
    return [
      {
        source: '/audio/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig;