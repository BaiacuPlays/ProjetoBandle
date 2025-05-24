/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Só usar export em produção
  ...(process.env.NODE_ENV === 'production' && process.env.BUILD_STATIC === 'true' ? {
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
  } : {}),
  images: {
    unoptimized: true
  },
  // Configuração para servir arquivos estáticos (só em desenvolvimento)
  ...(!process.env.BUILD_STATIC ? {
    async headers() {
      return [
        {
          source: '/imagens/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/audio/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          ],
        },
      ];
    },
  } : {}),
}

module.exports = nextConfig;