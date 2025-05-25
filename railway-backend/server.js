const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Importar rotas das APIs
const lobbyRoutes = require('./routes/lobby');
const musicInfoRoutes = require('./routes/music-info');

// Usar as rotas
app.use('/api/lobby', lobbyRoutes);
app.use('/api/music-info', musicInfoRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Bandle Backend está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Bandle Backend API',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'POST /api/lobby - Gerenciar lobbies multiplayer',
      'GET /api/music-info - Informações das músicas'
    ]
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Bandle Backend rodando na porta ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
