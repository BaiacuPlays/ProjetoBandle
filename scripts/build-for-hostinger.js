const fs = require('fs');
const path = require('path');

console.log('🚀 Preparando build para Hostinger...');

// Função para copiar arquivos recursivamente
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Criar pasta de output
const outputDir = './hostinger-build';
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true });
}
fs.mkdirSync(outputDir);

console.log('📁 Copiando arquivos estáticos...');

// Copiar arquivos do build do Next.js
if (fs.existsSync('./out')) {
  copyRecursive('./out', outputDir);
  console.log('✅ Arquivos do Next.js copiados');
} else if (fs.existsSync('./.next')) {
  // Fallback para build normal do Next.js
  console.log('⚠️  Usando build padrão do Next.js (não estático)');
  copyRecursive('./.next/static', path.join(outputDir, '_next/static'));

  // Copiar páginas HTML se existirem
  if (fs.existsSync('./.next/server/pages')) {
    copyRecursive('./.next/server/pages', path.join(outputDir, 'pages'));
  }
  console.log('✅ Arquivos do Next.js copiados');
} else {
  console.log('❌ Nenhuma pasta de build encontrada. Execute "npm run export" primeiro.');
  process.exit(1);
}

// Copiar arquivos de áudio
if (fs.existsSync('./public/audio')) {
  const audioDestDir = path.join(outputDir, 'audio');
  copyRecursive('./public/audio', audioDestDir);
  console.log('✅ Arquivos de áudio copiados');
}

// Copiar outros arquivos públicos importantes
const publicFiles = ['vine.mp3', 'sacabambapis.png', 'Logo.png', 'fundo.png'];
publicFiles.forEach(file => {
  const srcPath = path.join('./public', file);
  const destPath = path.join(outputDir, file);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ ${file} copiado`);
  }
});

// Criar arquivo .htaccess para Apache (Hostinger)
const htaccessContent = `
# Configurações para SPA (Single Page Application)
RewriteEngine On

# Redirecionar todas as rotas para index.html (exceto arquivos existentes)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache para arquivos estáticos
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType audio/mpeg "access plus 1 year"
    ExpiresByType audio/mp3 "access plus 1 year"
</IfModule>

# Compressão GZIP
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
`;

fs.writeFileSync(path.join(outputDir, '.htaccess'), htaccessContent.trim());
console.log('✅ Arquivo .htaccess criado');

// Criar arquivo README com instruções
const readmeContent = `
# Deploy para Hostinger

## Instruções de Upload

1. Faça upload de todos os arquivos desta pasta para o diretório público do seu site na Hostinger
2. Certifique-se de que o arquivo .htaccess foi enviado (pode estar oculto)
3. Configure as variáveis de ambiente no painel da Hostinger se necessário

## Estrutura dos Arquivos

- index.html - Página principal
- _next/ - Arquivos JavaScript e CSS do Next.js
- audio/ - Arquivos de música do jogo
- *.html - Páginas estáticas (multiplayer, termos, etc.)
- .htaccess - Configurações do Apache

## Backend Externo

O sistema multiplayer requer um backend externo. Configure a variável:
NEXT_PUBLIC_API_URL=https://seu-backend.railway.app

## Suporte

Se houver problemas, verifique:
1. Se todos os arquivos foram enviados
2. Se o .htaccess está presente
3. Se a URL da API externa está correta
`;

fs.writeFileSync(path.join(outputDir, 'README-DEPLOY.md'), readmeContent.trim());
console.log('✅ README de deploy criado');

console.log('🎉 Build para Hostinger concluído!');
console.log(`📂 Arquivos prontos em: ${outputDir}`);
console.log('');
console.log('📋 Próximos passos:');
console.log('1. Configure o backend externo (Railway, Render, etc.)');
console.log('2. Atualize a variável NEXT_PUBLIC_API_URL');
console.log('3. Faça upload dos arquivos para a Hostinger');
console.log('4. Teste todas as funcionalidades');
