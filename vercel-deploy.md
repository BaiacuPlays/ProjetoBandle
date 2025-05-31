# 🚀 Guia de Deploy na Vercel - LudoMusic

## ✅ **CONFIGURAÇÕES NECESSÁRIAS**

### 1. **Variáveis de Ambiente na Vercel**
```bash
# Obrigatórias
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token

# Opcionais
DISCORD_WEBHOOK_URL=your_discord_webhook_url
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
NODE_ENV=production
```

### 2. **Configurações de Build**
- **Framework Preset**: Next.js
- **Node.js Version**: 18.x
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci`

### 3. **Configurações de Domínio**
- **Domain**: ludomusic.xyz
- **Redirect**: www.ludomusic.xyz → ludomusic.xyz

## 🔧 **PROBLEMAS COMUNS E SOLUÇÕES**

### ❌ **Erro: "Schema validation failed"**
**Solução**: Simplificar `vercel.json` e `next.config.js`

### ❌ **Erro: "Build failed"**
**Soluções**:
1. Verificar se todas as dependências estão no `package.json`
2. Remover imports problemáticos temporariamente
3. Verificar se não há arquivos muito grandes

### ❌ **Erro: "Function timeout"**
**Solução**: Configurar `maxDuration` no `vercel.json`

### ❌ **Erro: "Audio files not found"**
**Soluções**:
1. Verificar se arquivos estão em `/public/audio/`
2. Usar URLs relativas (`/audio/...`)
3. Configurar headers corretos

## 📁 **ESTRUTURA DE ARQUIVOS PARA VERCEL**

```
projeto/
├── pages/
│   ├── api/
│   │   ├── statistics.js
│   │   ├── timezone.js
│   │   └── lobby.js
│   └── index.js
├── public/
│   ├── audio/ (arquivos de áudio)
│   └── ...
├── vercel.json (configuração simplificada)
├── next.config.js (configuração mínima)
└── package.json
```

## 🚀 **PASSOS PARA DEPLOY**

### 1. **Preparar Repositório**
```bash
# Limpar arquivos desnecessários
git rm -r --cached .next/
git rm -r --cached node_modules/

# Commit das mudanças
git add .
git commit -m "Preparar para deploy na Vercel"
git push origin main
```

### 2. **Configurar na Vercel**
1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Fazer deploy

### 3. **Verificar Deploy**
1. Testar funcionalidades básicas
2. Verificar carregamento de áudio
3. Testar multiplayer
4. Verificar estatísticas

## 🔍 **DEBUGGING**

### **Logs de Build**
- Verificar logs na aba "Functions" da Vercel
- Procurar por erros de import/export
- Verificar timeouts

### **Logs de Runtime**
- Verificar logs em tempo real
- Monitorar performance
- Verificar erros de API

### **Testes Locais**
```bash
# Testar build local
npm run build
npm start

# Verificar se funciona em produção
```

## 📊 **MONITORAMENTO**

### **Métricas Importantes**
- Build time
- Function execution time
- Error rate
- User engagement

### **Alertas**
- Configurar alertas para erros
- Monitorar uso de bandwidth
- Verificar limites da Vercel

## 🎯 **OTIMIZAÇÕES PARA VERCEL**

### **Performance**
- Usar Edge Functions quando possível
- Configurar cache adequadamente
- Otimizar tamanho dos bundles

### **Custos**
- Monitorar uso de bandwidth
- Otimizar arquivos de áudio
- Usar CDN quando necessário

### **Reliability**
- Implementar fallbacks
- Configurar retry logic
- Monitorar uptime
