# 🚀 Deploy para Hostinger - Bandle

## 📋 Instruções de Upload

### 1️⃣ Acesse o Painel da Hostinger
- Entre no painel da Hostinger
- Vá em **"File Manager"** (Gerenciador de Arquivos)
- Navegue até a pasta **`public_html`**

### 2️⃣ Limpe a Pasta (se necessário)
- Se houver arquivos antigos, remova-os
- Mantenha apenas arquivos importantes como `.htaccess` se existir

### 3️⃣ Faça Upload dos Arquivos
- **Selecione TODOS os arquivos desta pasta**
- **Arraste e solte** ou use o botão "Upload"
- **IMPORTANTE:** Inclua o arquivo `.htaccess` (pode estar oculto)

## 📁 Estrutura dos Arquivos

### ✅ Arquivos Principais
- `index.html` - Página inicial do site
- `game.html` - Jogo single player
- `multiplayer.html` - Interface multiplayer
- `.htaccess` - Configurações do servidor Apache

### 🎵 Arquivos de Mídia
- `audio/` - Pasta com todas as músicas do jogo
- `Logo.png` - Logo do site
- `fundo.png` - Imagem de fundo
- `sacabambapis.png` - Easter egg
- `vine.mp3` - Som do easter egg

### 📄 Páginas Legais
- `terms-of-use.html` - Termos de uso
- `privacy-policy.html` - Política de privacidade
- `content-removal.html` - Remoção de conteúdo

## 🎮 Funcionalidades

### ✅ Funcionando Imediatamente
- **Jogo Single Player** - Totalmente funcional
- **Interface Principal** - Menu e navegação
- **Páginas Legais** - Termos, privacidade, etc.
- **Easter Egg** - Digite "sacabambapis" na página inicial

### 🔧 Requer Configuração (Opcional)
- **Multiplayer** - Precisa de backend externo

## 🌐 Configurar Multiplayer (Opcional)

### Opção A: Usar Vercel para Backend
1. Crie novo projeto na Vercel
2. Faça upload da pasta `bandle-backend-simple/`
3. Anote a URL gerada
4. Configure no painel da Hostinger:
   ```
   NEXT_PUBLIC_API_URL=https://sua-url.vercel.app
   ```

### Opção B: Sem Multiplayer
- O jogo funcionará apenas no modo single player
- Não precisa configurar nada mais

## 🔍 Verificar Após Upload

### ✅ Checklist
- [ ] Site carrega no seu domínio
- [ ] Logo aparece corretamente
- [ ] Jogo single player funciona
- [ ] Músicas tocam
- [ ] Easter egg funciona (digite "sacabambapis")
- [ ] Páginas legais carregam

### 🐛 Problemas Comuns
- **Site não carrega:** Verifique se o `.htaccess` foi enviado
- **Músicas não tocam:** Verifique se a pasta `audio/` foi enviada
- **Imagens não aparecem:** Verifique se os arquivos PNG foram enviados

## 📊 Tamanho dos Arquivos
- **Total:** ~2-3 GB (principalmente áudio)
- **Upload pode demorar:** 30-60 minutos dependendo da conexão
- **Seja paciente:** Muitos arquivos de áudio para enviar

## 🎯 Resultado Final
Após o upload, você terá:
- ✅ Site funcionando no seu domínio
- ✅ Jogo single player completo
- ✅ Interface profissional
- ✅ Páginas legais
- 🎮 Multiplayer (se configurar backend)

## 📞 Suporte
Se houver problemas:
1. Verifique se todos os arquivos foram enviados
2. Teste em modo anônimo/privado do navegador
3. Verifique o console do navegador (F12) para erros

---
**Boa sorte com o deploy! 🚀**
