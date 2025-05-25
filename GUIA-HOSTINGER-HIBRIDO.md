# 🚀 Guia Completo: Migração Híbrida para Hostinger

## 🎯 Solução Escolhida: Hostinger (Frontend) + Vercel (APIs)

### ✅ Vantagens desta abordagem:
- ✅ Não precisa migrar as APIs (que já funcionam)
- ✅ Implementação mais rápida e simples
- ✅ Sem custos adicionais
- ✅ Mantém a funcionalidade multiplayer
- ✅ Aproveita o melhor dos dois mundos

## 📋 Passo a Passo Completo

### Etapa 1: ✅ CONCLUÍDA - Build Gerado
O build já foi gerado na pasta `hostinger-build/` com:
- ✅ Arquivos HTML estáticos
- ✅ Pasta `audio/` com todas as músicas
- ✅ Arquivos JavaScript e CSS
- ✅ Arquivo `.htaccess` configurado
- ✅ Imagens (Logo.png, fundo.png, etc.)

### Etapa 2: Upload para Hostinger

#### 2.1 Acessar File Manager da Hostinger
1. Entre no painel da Hostinger
2. Vá em "File Manager" ou "Gerenciador de Arquivos"
3. Navegue até a pasta `public_html`

#### 2.2 Fazer Backup (IMPORTANTE)
1. **ANTES DE FAZER UPLOAD**, faça backup dos arquivos existentes
2. Baixe ou mova os arquivos atuais para uma pasta de backup

#### 2.3 Upload dos Arquivos
1. Selecione **TODOS** os arquivos da pasta `hostinger-build/`
2. Faça upload para `public_html`
3. **IMPORTANTE**: Certifique-se de que o arquivo `.htaccess` foi enviado
   - Pode estar oculto, verifique as configurações para mostrar arquivos ocultos

#### 2.4 Verificar Estrutura
Após o upload, sua pasta `public_html` deve ter:
```
public_html/
├── index.html
├── .htaccess
├── _next/ (pasta com arquivos JS/CSS)
├── audio/ (pasta com todas as músicas)
├── pages/ (páginas HTML)
├── Logo.png
├── fundo.png
├── sacabambapis.png
└── vine.mp3
```

### Etapa 3: Configurar Domínio (Se Necessário)

#### Opção A: Domínio Principal
Se quiser que o jogo seja o site principal:
- Os arquivos já estão em `public_html`
- Acesse: `https://seudominio.com`

#### Opção B: Subdomínio
Se quiser criar um subdomínio (ex: `jogo.seudominio.com`):
1. No painel da Hostinger, vá em "Subdomínios"
2. Crie um subdomínio (ex: `jogo`)
3. Aponte para a pasta onde fez upload dos arquivos

### Etapa 4: Testes Completos

#### 4.1 Funcionalidades Básicas
Teste no seu domínio:
- [ ] Site carrega corretamente
- [ ] Música diária funciona
- [ ] Cheat code 'sacabambapis' funciona
- [ ] Páginas legais carregam (termos, privacidade)

#### 4.2 Funcionalidades Multiplayer
- [ ] Página multiplayer carrega (`/multiplayer`)
- [ ] Consegue criar sala
- [ ] Consegue entrar em sala com código
- [ ] Consegue iniciar jogo
- [ ] Tentativas funcionam
- [ ] Pontuação funciona
- [ ] Próxima rodada funciona

### Etapa 5: Verificações Técnicas

#### 5.1 Console do Navegador
1. Pressione F12 para abrir o console
2. Verifique se não há erros em vermelho
3. Se houver erros de CORS, verifique se as APIs da Vercel estão funcionando

#### 5.2 Teste das APIs
Teste diretamente as URLs das APIs:
- `https://projeto-bandle-pvj1bnq4u-baiacuplays-projects.vercel.app/api/lobby`
- `https://projeto-bandle-pvj1bnq4u-baiacuplays-projects.vercel.app/api/music-info`

## 🐛 Solução de Problemas

### Problema: "Site não carrega"
**Soluções:**
1. Verifique se o arquivo `.htaccess` está presente
2. Verifique permissões dos arquivos (644 para arquivos, 755 para pastas)
3. Verifique se todos os arquivos foram enviados

### Problema: "Multiplayer não funciona"
**Soluções:**
1. Verifique se as APIs da Vercel estão online
2. Teste: `https://projeto-bandle-pvj1bnq4u-baiacuplays-projects.vercel.app/api/lobby`
3. Verifique o console do navegador (F12) para erros

### Problema: "Músicas não carregam"
**Soluções:**
1. Verifique se a pasta `audio/` foi enviada completamente
2. Verifique permissões da pasta `audio/`
3. Teste acessar: `https://seudominio.com/audio/`

### Problema: "Erro 404 em páginas"
**Soluções:**
1. Verifique se o arquivo `.htaccess` está correto
2. Verifique se o Apache mod_rewrite está ativo na Hostinger
3. Entre em contato com suporte da Hostinger se necessário

## 🔄 Atualizações Futuras

### Para atualizar o site:
1. Faça alterações no código local
2. Execute `npm run build:hostinger`
3. Faça upload apenas dos arquivos alterados
4. Teste funcionalidades

### Para atualizar as APIs:
1. Faça alterações nas APIs na Vercel
2. Faça deploy na Vercel
3. As mudanças serão aplicadas automaticamente

## 📞 Suporte

Se encontrar problemas:
1. ✅ Consulte este guia primeiro
2. ✅ Verifique logs de erro no console (F12)
3. ✅ Teste cada funcionalidade individualmente
4. ✅ Verifique se as APIs da Vercel estão online

---

**🎉 Parabéns! Seu site agora está rodando na Hostinger com APIs na Vercel!**
