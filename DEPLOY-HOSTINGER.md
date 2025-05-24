# 🚀 Deploy para Hostinger - Guia Completo

Este guia explica como migrar seu projeto da Vercel para a Hostinger mantendo todas as funcionalidades.

## 📋 Pré-requisitos

1. Conta na Hostinger com WordPress
2. Acesso ao painel de controle da Hostinger
3. Node.js instalado localmente

## 🔧 Etapa 1: Preparar o Backend Externo

### Opção A: Railway (Recomendado - Gratuito)
1. Acesse [railway.app](https://railway.app)
2. Conecte sua conta GitHub
3. Crie um novo projeto
4. Faça deploy das APIs (`pages/api/`)
5. Anote a URL gerada (ex: `https://bandle-api.railway.app`)

### Opção B: Render (Alternativa Gratuita)
1. Acesse [render.com](https://render.com)
2. Conecte sua conta GitHub
3. Crie um Web Service
4. Configure para Node.js
5. Anote a URL gerada

## 🏗️ Etapa 2: Configurar o Projeto

1. **Criar arquivo de ambiente:**
```bash
cp .env.example .env.local
```

2. **Editar `.env.local`:**
```env
NEXT_PUBLIC_API_URL=https://sua-api.railway.app
NEXT_PUBLIC_ENABLE_MULTIPLAYER=true
NEXT_PUBLIC_ENABLE_MUSIC_INFO=true
```

3. **Gerar build para Hostinger:**
```bash
npm run build:hostinger
```

## 📤 Etapa 3: Upload para Hostinger

1. **Acessar File Manager da Hostinger:**
   - Entre no painel da Hostinger
   - Vá em "File Manager"
   - Navegue até `public_html`

2. **Upload dos arquivos:**
   - Faça upload de todos os arquivos da pasta `hostinger-build/`
   - Certifique-se de incluir o arquivo `.htaccess`
   - Mantenha a estrutura de pastas

3. **Verificar permissões:**
   - Arquivos: 644
   - Pastas: 755

## 🔗 Etapa 4: Integração com WordPress

### Opção A: Página Dedicada
1. Crie uma nova página no WordPress
2. Use um plugin como "Insert Headers and Footers"
3. Adicione um iframe apontando para seu site

### Opção B: Subdomínio
1. Configure um subdomínio (ex: `jogo.seusite.com`)
2. Aponte para a pasta onde fez upload dos arquivos

## ✅ Etapa 5: Testes

### Funcionalidades a Testar:
- [ ] Single player funciona
- [ ] Música diária carrega
- [ ] Cheat code 'sacabambapis' funciona
- [ ] Multiplayer conecta
- [ ] Criação de salas funciona
- [ ] Páginas legais carregam
- [ ] Configurações persistem

## 🐛 Solução de Problemas

### Problema: "API não encontrada"
**Solução:** Verifique se a URL da API está correta no `.env.local`

### Problema: "Arquivos de áudio não carregam"
**Solução:** Verifique se a pasta `audio/` foi enviada corretamente

### Problema: "Página não carrega"
**Solução:** Verifique se o arquivo `.htaccess` está presente

### Problema: "Multiplayer não funciona"
**Solução:** Verifique se o backend externo está online

## 📊 Monitoramento

### Logs de Erro:
- Console do navegador (F12)
- Logs da Hostinger (se disponível)
- Logs do backend externo

### Performance:
- Teste velocidade de carregamento
- Verifique cache dos arquivos estáticos
- Monitore uso de banda

## 🔄 Atualizações Futuras

Para atualizar o site:
1. Faça as alterações no código
2. Execute `npm run build:hostinger`
3. Faça upload apenas dos arquivos alterados
4. Teste as funcionalidades

## 📞 Suporte

Se encontrar problemas:
1. Verifique este guia primeiro
2. Consulte os logs de erro
3. Teste cada funcionalidade individualmente
4. Entre em contato se necessário

---

**✨ Parabéns! Seu site agora está rodando na Hostinger com todas as funcionalidades mantidas!**
