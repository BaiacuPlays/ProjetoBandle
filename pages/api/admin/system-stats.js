// API para estatísticas do sistema - Admin
import fs from 'fs';
import path from 'path';

// Importação segura do KV
let kv = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
  }
} catch (error) {
  console.warn('⚠️ KV não disponível:', error.message);
}

const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  // Verificar autenticação admin
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'admin123') {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const stats = {
      system: await getSystemStats(),
      users: await getUserStats(),
      games: await getGameStats(),
      donations: await getDonationStats(),
      music: await getMusicStats(),
      performance: await getPerformanceStats()
    };

    return res.status(200).json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas do sistema:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function getSystemStats() {
  const stats = {
    environment: process.env.NODE_ENV,
    hasKV: !!kv,
    kvConfig: hasKVConfig,
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform
  };

  // Estatísticas de memória
  const memUsage = process.memoryUsage();
  stats.memory = {
    used: Math.round(memUsage.heapUsed / 1024 / 1024),
    total: Math.round(memUsage.heapTotal / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };

  return stats;
}

async function getUserStats() {
  if (!kv) {
    return {
      total: 0,
      active: 0,
      newToday: 0,
      withGames: 0
    };
  }

  try {
    // Buscar todos os usuários (isso pode ser otimizado com índices)
    const keys = await kv.keys('user:*');
    const profiles = await kv.keys('profile:*');
    
    const today = new Date().toDateString();
    let activeUsers = 0;
    let newToday = 0;
    let usersWithGames = 0;

    // Amostra de usuários para estatísticas (para performance)
    const sampleSize = Math.min(50, keys.length);
    for (let i = 0; i < sampleSize; i++) {
      try {
        const userData = await kv.get(keys[i]);
        if (userData) {
          if (userData.lastLoginAt && new Date(userData.lastLoginAt).toDateString() === today) {
            activeUsers++;
          }
          if (userData.createdAt && new Date(userData.createdAt).toDateString() === today) {
            newToday++;
          }
        }
      } catch (err) {
        console.warn('Erro ao processar usuário:', err);
      }
    }

    return {
      total: keys.length,
      profiles: profiles.length,
      active: Math.round((activeUsers / sampleSize) * keys.length),
      newToday: Math.round((newToday / sampleSize) * keys.length),
      withGames: Math.round((usersWithGames / sampleSize) * keys.length)
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de usuários:', error);
    return { total: 0, active: 0, newToday: 0, withGames: 0 };
  }
}

async function getGameStats() {
  if (!kv) {
    return {
      totalGames: 0,
      gamesToday: 0,
      averageWinRate: 0,
      popularModes: {}
    };
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyGames = await kv.keys(`daily-game:*:${today}`);
    
    return {
      totalGames: 0, // Seria necessário um contador global
      gamesToday: dailyGames.length,
      averageWinRate: 0, // Calculado a partir dos perfis
      popularModes: {
        daily: dailyGames.length,
        infinite: 0,
        multiplayer: 0
      }
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de jogos:', error);
    return { totalGames: 0, gamesToday: 0, averageWinRate: 0, popularModes: {} };
  }
}

async function getDonationStats() {
  if (!kv) {
    return {
      pending: 0,
      approved: 0,
      rejected: 0,
      totalAmount: 0
    };
  }

  try {
    const pending = await kv.get('pending_pix_donations') || [];
    const approved = await kv.get('approved_donations') || [];
    const rejected = await kv.get('rejected_donations') || [];

    return {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      totalAmount: 0 // Seria necessário somar os valores
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de doações:', error);
    return { pending: 0, approved: 0, rejected: 0, totalAmount: 0 };
  }
}

async function getMusicStats() {
  try {
    const musicPath = path.join(process.cwd(), 'data', 'music.json');
    const musicFile = fs.readFileSync(musicPath, 'utf8');
    const musicData = JSON.parse(musicFile);

    const games = new Set();
    const artists = new Set();
    
    musicData.songs.forEach(song => {
      if (song.game) games.add(song.game);
      if (song.artist) artists.add(song.artist);
    });

    return {
      totalSongs: musicData.songs.length,
      totalGames: games.size,
      totalArtists: artists.size,
      averageDuration: 30 // Assumindo 30s por música
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de música:', error);
    return { totalSongs: 0, totalGames: 0, totalArtists: 0, averageDuration: 0 };
  }
}

async function getPerformanceStats() {
  const stats = {
    responseTime: Date.now(), // Será calculado no final
    errorRate: 0, // Seria necessário um sistema de logs
    cacheHitRate: 0, // Seria necessário métricas de cache
    apiCalls: 0 // Seria necessário um contador
  };

  // Simular tempo de resposta
  stats.responseTime = Date.now() - stats.responseTime;

  return stats;
}
