/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Desabilitado para melhor performance
  images: {
    unoptimized: true
  },
  compress: true,
  poweredByHeader: false,
  swcMinify: true // Usar SWC para minificação mais rápida
}

module.exports = nextConfig;