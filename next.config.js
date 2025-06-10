/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Desabilitar verificações de hidratação em produção
  // para evitar erros causados por extensões de navegador
  compiler: {
    // Suprimir avisos de hidratação
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? { properties: ['^data-bis_skin_checked$', '^bis_skin_checked$'] } : false,
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex'
          }
        ]
      }
    ];
  }
}

module.exports = nextConfig