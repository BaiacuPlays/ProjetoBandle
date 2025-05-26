const fs = require('fs');
const path = require('path');

// Configuração do site
const SITE_URL = 'https://ludomusic.xyz';
const CURRENT_DATE = new Date().toISOString().split('T')[0];

// Páginas do site com suas configurações
const pages = [
  {
    url: '/',
    lastmod: CURRENT_DATE,
    changefreq: 'daily',
    priority: '1.0'
  },
  {
    url: '/multiplayer',
    lastmod: CURRENT_DATE,
    changefreq: 'weekly',
    priority: '0.8'
  },
  {
    url: '/sobre',
    lastmod: CURRENT_DATE,
    changefreq: 'monthly',
    priority: '0.7'
  },
  {
    url: '/faq',
    lastmod: CURRENT_DATE,
    changefreq: 'monthly',
    priority: '0.6'
  },
  {
    url: '/termos',
    lastmod: CURRENT_DATE,
    changefreq: 'monthly',
    priority: '0.3'
  },
  {
    url: '/privacidade',
    lastmod: CURRENT_DATE,
    changefreq: 'monthly',
    priority: '0.3'
  },
  {
    url: '/remocao',
    lastmod: CURRENT_DATE,
    changefreq: 'monthly',
    priority: '0.2'
  }
];

// Gerar XML do sitemap
function generateSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${pages.map(page => `  
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}

</urlset>`;

  return sitemap;
}

// Salvar sitemap
function saveSitemap() {
  const sitemapContent = generateSitemap();
  const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  
  fs.writeFileSync(sitemapPath, sitemapContent);
  console.log('✅ Sitemap gerado com sucesso!');
  console.log(`📍 Localização: ${sitemapPath}`);
  console.log(`🌐 URL: ${SITE_URL}/sitemap.xml`);
  console.log(`📄 Páginas incluídas: ${pages.length}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  saveSitemap();
}

module.exports = { generateSitemap, saveSitemap };
