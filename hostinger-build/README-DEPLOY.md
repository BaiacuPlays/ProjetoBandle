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