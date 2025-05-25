# Bandle Backend - Railway Deploy

Este é o backend para o jogo Bandle, contendo as APIs necessárias para o funcionamento do multiplayer.

## 🚀 Deploy no Railway

### Passo 1: Preparar o Repositório
1. Crie um novo repositório no GitHub
2. Faça upload dos arquivos desta pasta (`railway-backend/`)
3. Commit e push para o GitHub

### Passo 2: Deploy no Railway
1. Acesse [railway.app](https://railway.app)
2. Conecte sua conta GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha o repositório que você criou
6. Railway detectará automaticamente que é um projeto Node.js

### Passo 3: Configurar Variáveis (Opcional)
No painel do Railway, você pode adicionar variáveis de ambiente se necessário:
- `PORT` - Porta do servidor (Railway define automaticamente)
- `NODE_ENV` - Ambiente (production)

### Passo 4: Obter a URL
Após o deploy, o Railway fornecerá uma URL como:
`https://bandle-backend-production.up.railway.app`

## 📡 Endpoints Disponíveis

### Health Check
- `GET /health` - Verifica se o servidor está funcionando

### Lobby API
- `POST /api/lobby` - Criar nova sala
- `PATCH /api/lobby` - Ações do lobby (join, start, guess, etc.)
- `GET /api/lobby` - Buscar sala

### Music Info API
- `GET /api/music-info` - Buscar informações de músicas

## 🔧 Configuração no Frontend

Após obter a URL do Railway, configure no seu projeto principal:

1. Crie/edite o arquivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://sua-url.railway.app
NEXT_PUBLIC_ENABLE_MULTIPLAYER=true
```

2. Faça novo build para Hostinger:
```bash
npm run build:hostinger
```

## 🧪 Testando

Para testar se o backend está funcionando:

1. Acesse: `https://sua-url.railway.app/health`
2. Deve retornar: `{"status":"OK","message":"Bandle Backend está funcionando!"}`

## 📝 Notas Importantes

- O Railway oferece 500 horas gratuitas por mês
- O backend entra em "sleep" após inatividade, mas acorda rapidamente
- Para produção, considere um plano pago para melhor performance
- Mantenha a URL do backend atualizada no frontend

## 🔄 Atualizações

Para atualizar o backend:
1. Faça as alterações no código
2. Commit e push para o GitHub
3. Railway fará deploy automaticamente
