/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Desabilitar verificações de hidratação em produção
  // para evitar erros causados por extensões de navegador
  compiler: {
    // Suprimir avisos de hidratação
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? { properties: ['^data-bis_skin_checked$', '^bis_skin_checked$'] } : false,
  },
}

module.exports = nextConfig