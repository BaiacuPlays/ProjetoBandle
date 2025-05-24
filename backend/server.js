const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Importar rotas
const lobbyRoutes = require('./routes/lobby');
const musicInfoRoutes = require('./routes/music-info');
const timezoneRoutes = require('./routes/timezone');

// Usar rotas
app.use('/api/lobby', lobbyRoutes);
app.use('/api/music-info', musicInfoRoutes);
app.use('/api/timezone', timezoneRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bandle Backend está funcionando!',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/lobby',
      '/api/music-info',
      '/api/timezone'
    ]
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});
