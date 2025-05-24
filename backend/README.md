# Bandle Backend

Backend para o jogo Bandle - APIs para multiplayer e outras funcionalidades.

## 🚀 Deploy Rápido

### Railway (Recomendado)
1. Acesse [railway.app](https://railway.app)
2. Conecte sua conta GitHub
3. Crie um novo projeto
4. Selecione "Deploy from GitHub repo"
5. Escolha este repositório
6. Configure a pasta raiz como `/backend`
7. Railway detectará automaticamente o Node.js

### Render
1. Acesse [render.com](https://render.com)
2. Conecte sua conta GitHub
3. Crie um "Web Service"
4. Selecione este repositório
5. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

## 📋 APIs Disponíveis

### `/api/lobby`
- **POST** - Criar sala de jogo
- **PUT** - Entrar em sala existente
- **GET** - Buscar dados da sala
- **PATCH** - Ações do jogo (start, guess, next_round, etc.)

### `/api/music-info`
- **GET** - Buscar informações de música no VGMdb

### `/api/timezone`
- **GET** - Buscar timezone de São Paulo

## 🔧 Desenvolvimento Local

```bash
cd backend
npm install
npm start
```

O servidor rodará em `http://localhost:3000`

## 📝 Variáveis de Ambiente

Nenhuma variável obrigatória. O backend funciona out-of-the-box.

## 🗄️ Armazenamento

Atualmente usa armazenamento em memória. Em produção, considere usar:
- Redis (para Railway)
- PostgreSQL (para dados persistentes)
- MongoDB (para flexibilidade)

## 🔗 Integração

Após o deploy, use a URL gerada no frontend:

```env
NEXT_PUBLIC_API_URL=https://sua-api.railway.app
```
