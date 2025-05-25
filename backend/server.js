const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://projeto-bandle.vercel.app',
    'https://projeto-bandle-ku6w02asi-baiacuplays-projects.vercel.app',
    'https://projeto-bandle-6h4eqh7t5-baiacuplays-projects.vercel.app',
    /^https:\/\/projeto-bandle-.*\.vercel\.app$/,
    /^https:\/\/.*-baiacuplays-projects\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
