/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  // Configuração para incluir arquivos de áudio
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp3|wav|ogg|flac)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/audio/',
          outputPath: 'static/audio/',
        },
      },
    });
    return config;
  },
  // Configuração para servir arquivos estáticos
  async headers() {
    return [
      {
        source: '/audio/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig;