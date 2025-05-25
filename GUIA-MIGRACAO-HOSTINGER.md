# 🚀 Guia Completo: Migração Vercel → Hostinger

Este guia te ajudará a migrar seu projeto do Vercel para a Hostinger mantendo todas as funcionalidades.

## 📋 O que você precisa

- ✅ Conta na Hostinger com WordPress
- ✅ Conta no GitHub
- ✅ Conta no Railway (gratuita)
- ✅ Arquivos do projeto já preparados

## 🎯 Etapa 1: Configurar Backend no Railway

### 1.1 Preparar Repositório do Backend
1. Crie um novo repositório no GitHub chamado `bandle-backend`
2. Faça upload de todos os arquivos da pasta `railway-backend/`
3. Commit e push

### 1.2 Deploy no Railway
1. Acesse [railway.app](https://railway.app)
2. Conecte sua conta GitHub
3. Clique em "New Project" → "Deploy from GitHub repo"
4. Selecione o repositório `bandle-backend`
5. Aguarde o deploy (2-3 minutos)
6. **ANOTE A URL GERADA** (ex: `https://bandle-backend-production.up.railway.app`)

### 1.3 Testar Backend
- Acesse: `https://sua-url.railway.app/health`
- Deve mostrar: `{"status":"OK","message":"Bandle Backend está funcionando!"}`

## 🏗️ Etapa 2: Preparar Frontend para Hostinger

### 2.1 Configurar Variáveis de Ambiente
Crie/edite o arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_API_URL=https://sua-url.railway.app
NEXT_PUBLIC_ENABLE_MULTIPLAYER=true
NEXT_PUBLIC_ENABLE_MUSIC_INFO=true
```

### 2.2 Gerar Build para Hostinger
```bash
npm run build:hostinger
```

### 2.3 Verificar Arquivos Gerados
Verifique se a pasta `hostinger-build/` contém:
- ✅ Arquivo `.htaccess`
- ✅ Pasta `audio/` com todas as músicas
- ✅ Pasta `_next/` com arquivos JavaScript/CSS
- ✅ Arquivos HTML das páginas
- ✅ Imagens (Logo.png, fundo.png, etc.)

## 📤 Etapa 3: Upload para Hostinger

### 3.1 Acessar File Manager
1. Entre no painel da Hostinger
2. Vá em "File Manager"
3. Navegue até `public_html`

### 3.2 Fazer Upload
1. **IMPORTANTE**: Faça backup dos arquivos existentes
2. Selecione todos os arquivos da pasta `hostinger-build/`
3. Faça upload para `public_html`
4. Certifique-se de que o arquivo `.htaccess` foi enviado

### 3.3 Verificar Permissões
- Arquivos: 644
- Pastas: 755

## 🔗 Etapa 4: Configuração no WordPress (Opcional)

### Opção A: Página Dedicada
1. Crie uma nova página no WordPress
2. Adicione um iframe:
```html
<iframe src="https://seudominio.com" width="100%" height="800px" frameborder="0"></iframe>
```

### Opção B: Subdomínio
1. Configure um subdomínio (ex: `jogo.seusite.com`)
2. Aponte para a pasta onde fez upload

## ✅ Etapa 5: Testes Completos

### 5.1 Funcionalidades Básicas
- [ ] Site carrega corretamente
- [ ] Música diária funciona
- [ ] Cheat code 'sacabambapis' funciona
- [ ] Páginas legais carregam (termos, privacidade)

### 5.2 Funcionalidades Multiplayer
- [ ] Página multiplayer carrega
- [ ] Consegue criar sala
- [ ] Consegue entrar em sala
- [ ] Consegue iniciar jogo
- [ ] Tentativas funcionam
- [ ] Pontuação funciona
- [ ] Próxima rodada funciona

## 🐛 Solução de Problemas

### Problema: "Site não carrega"
**Soluções:**
1. Verifique se o arquivo `.htaccess` está presente
2. Verifique permissões dos arquivos
3. Verifique se todos os arquivos foram enviados

### Problema: "Multiplayer não funciona"
**Soluções:**
1. Verifique se o backend Railway está online
2. Teste: `https://sua-url.railway.app/health`
3. Verifique se a URL no `.env.local` está correta
4. Refaça o build: `npm run build:hostinger`

### Problema: "Músicas não carregam"
**Soluções:**
1. Verifique se a pasta `audio/` foi enviada
2. Verifique permissões da pasta `audio/`
3. Teste acessar: `https://seusite.com/audio/`

### Problema: "Erro 404 em páginas"
**Soluções:**
1. Verifique se o arquivo `.htaccess` está correto
2. Verifique se o Apache mod_rewrite está ativo
3. Entre em contato com suporte da Hostinger

## 📊 Monitoramento

### Logs para Verificar
- Console do navegador (F12)
- Logs do Railway: `railway logs`
- Logs da Hostinger (se disponível)

### Performance
- Teste velocidade: [PageSpeed Insights](https://pagespeed.web.dev/)
- Monitore uso de banda na Hostinger
- Monitore uso do Railway (500h gratuitas/mês)

## 🔄 Atualizações Futuras

Para atualizar o site:
1. Faça alterações no código
2. Execute `npm run build:hostinger`
3. Faça upload apenas dos arquivos alterados
4. Teste funcionalidades

Para atualizar o backend:
1. Faça alterações no repositório `bandle-backend`
2. Commit e push
3. Railway fará deploy automaticamente

## 💡 Dicas Importantes

- **Backup**: Sempre faça backup antes de alterações
- **Teste**: Teste em ambiente local antes do deploy
- **Monitoramento**: Monitore logs regularmente
- **Performance**: Otimize imagens e arquivos grandes
- **Segurança**: Mantenha dependências atualizadas

## 📞 Suporte

Se encontrar problemas:
1. ✅ Consulte este guia primeiro
2. ✅ Verifique logs de erro
3. ✅ Teste cada funcionalidade individualmente
4. ✅ Verifique se backend Railway está online

---

**🎉 Parabéns! Seu site agora está rodando na Hostinger com todas as funcionalidades!**
