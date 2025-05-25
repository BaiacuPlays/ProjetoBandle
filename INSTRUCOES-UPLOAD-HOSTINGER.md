# 📤 Instruções Detalhadas para Upload na Hostinger

## 🎯 O que você precisa fazer agora:

### 1. Acessar o Painel da Hostinger
1. Faça login na sua conta Hostinger
2. Vá para o painel de controle do seu domínio
3. Procure por "File Manager" ou "Gerenciador de Arquivos"

### 2. Navegar para a Pasta Correta
1. No File Manager, navegue até `public_html`
2. Esta é a pasta onde ficam os arquivos do seu site

### 3. Fazer Backup dos Arquivos Atuais (IMPORTANTE!)
1. **ANTES** de fazer upload, faça backup dos arquivos existentes
2. Selecione todos os arquivos em `public_html`
3. Baixe ou mova para uma pasta de backup
4. Isso é importante caso precise reverter

### 4. Upload dos Novos Arquivos
1. Na sua máquina, vá para a pasta `E:\Bandle\hostinger-build\`
2. Selecione **TODOS** os arquivos e pastas desta pasta:
   - index.html
   - .htaccess (pode estar oculto)
   - _next/ (pasta)
   - audio/ (pasta)
   - pages/ (pasta)
   - Logo.png
   - fundo.png
   - sacabambapis.png
   - vine.mp3
   - README-DEPLOY.md

3. Faça upload de todos estes arquivos para `public_html`

### 5. Verificar se o Upload foi Completo
Após o upload, verifique se `public_html` contém:
- ✅ index.html
- ✅ .htaccess (arquivo oculto - importante!)
- ✅ Pasta `_next/` com subpastas
- ✅ Pasta `audio/` com todas as músicas
- ✅ Pasta `pages/` com arquivos HTML
- ✅ Todas as imagens (Logo.png, fundo.png, etc.)

### 6. Configurar Permissões (Se Necessário)
Se o site não carregar, verifique as permissões:
- Arquivos: 644
- Pastas: 755

### 7. Testar o Site
1. Acesse seu domínio: `https://seudominio.com`
2. Verifique se o site carrega
3. Teste a música diária
4. Teste o multiplayer
5. Teste o cheat code 'sacabambapis'

## 🔍 Verificações Importantes

### Arquivo .htaccess
- Este arquivo é CRUCIAL para o funcionamento
- Pode estar oculto no File Manager
- Se não aparecer, ative "Mostrar arquivos ocultos"
- Sem este arquivo, as páginas não carregarão corretamente

### Pasta audio/
- Deve conter todas as subpastas de jogos
- Verifique se o upload não foi interrompido
- Esta pasta é grande (~GB), pode demorar

### Console do Navegador
- Pressione F12 no seu site
- Verifique se há erros em vermelho
- Erros comuns: arquivos não encontrados, problemas de CORS

## 🚨 Problemas Comuns e Soluções

### "Página não carrega" ou "Erro 404"
- Verifique se o arquivo `.htaccess` foi enviado
- Verifique se `index.html` está na raiz de `public_html`

### "Músicas não tocam"
- Verifique se a pasta `audio/` foi enviada completamente
- Teste acessar: `https://seudominio.com/audio/`

### "Multiplayer não funciona"
- Isso é normal! As APIs ainda estão na Vercel
- Teste se consegue criar uma sala
- Se não funcionar, verifique o console (F12)

## 📞 Próximos Passos Após Upload

1. **Teste básico**: Acesse seu domínio e veja se carrega
2. **Teste música**: Veja se a música diária funciona
3. **Teste multiplayer**: Tente criar uma sala
4. **Reporte problemas**: Se algo não funcionar, me avise

## 💡 Dicas Importantes

- **Paciência**: O upload pode demorar devido ao tamanho da pasta `audio/`
- **Backup**: Sempre mantenha backup dos arquivos originais
- **Teste gradual**: Teste uma funcionalidade por vez
- **Console**: Use F12 para ver erros técnicos

---

**🎯 Foco agora: Fazer o upload dos arquivos da pasta `hostinger-build/` para `public_html` na Hostinger**
