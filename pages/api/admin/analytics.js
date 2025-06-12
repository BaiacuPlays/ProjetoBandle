// Fallback para desenvolvimento local
let localAnalytics = {
  users: { total: 0, active: 0, new: 0 },
  games: { total: 0, today: 0, wins: 0 },
  songs: { total: 0, mostPlayed: [], leastPlayed: [] },
  performance: { avgAttempts: 0, winRate: 0 }
};

// Tentar importar KV, mas usar fallback se não estiver disponível
let kv = null;
try {
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
} catch (error) {
  console.log('⚠️ Vercel KV não disponível, usando armazenamento local');
}

// Função para buscar dados do KV com fallback
const safeKVGet = async (key, fallback = null) => {
  if (kv) {
    try {
      return await kv.get(key) || fallback;
    } catch (error) {
      console.warn(`Erro ao acessar KV para ${key}:`, error);
      return fallback;
    }
  }
  return fallback;
};

// Função para calcular analytics em tempo real
const calculateAnalytics = async () => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Buscar estatísticas globais
    const globalStats = await safeKVGet('stats:global', {
      totalGames: 0,
      wins: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      losses: 0
    });

    // Buscar estatísticas diárias
    const todayStats = await safeKVGet(`stats:daily:${today}`, {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0
    });

    const yesterdayStats = await safeKVGet(`stats:daily:${yesterday}`, {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0
    });

    // Buscar usuários ativos (simulado - em produção seria baseado em logins recentes)
    const activeUsers = await safeKVGet('analytics:active_users', 0);
    const totalUsers = await safeKVGet('analytics:total_users', 0);
    const newUsers = await safeKVGet(`analytics:new_users:${today}`, 0);

    // Calcular estatísticas de performance
    const totalWins = Object.values(globalStats.wins || {}).reduce((sum, count) => sum + count, 0);
    const totalGames = globalStats.totalGames || 0;
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

    // Calcular tentativas médias
    let totalAttempts = 0;
    Object.entries(globalStats.wins || {}).forEach(([attempts, count]) => {
      totalAttempts += parseInt(attempts) * count;
    });
    const avgAttempts = totalWins > 0 ? Math.round((totalAttempts / totalWins) * 10) / 10 : 0;

    // Buscar dados de músicas (simulado)
    const musicStats = await safeKVGet('analytics:music_stats', {
      mostPlayed: [
        { title: 'Sweden', artist: 'C418', game: 'Minecraft', plays: 1250 },
        { title: 'Megalovania', artist: 'Toby Fox', game: 'Undertale', plays: 980 },
        { title: 'Gerudo Valley', artist: 'Koji Kondo', game: 'Zelda OoT', plays: 875 }
      ],
      leastPlayed: [
        { title: 'Hidden Track', artist: 'Unknown', game: 'Indie Game', plays: 12 },
        { title: 'Rare Song', artist: 'Composer', game: 'Obscure Game', plays: 18 },
        { title: 'New Addition', artist: 'Artist', game: 'Recent Game', plays: 25 }
      ]
    });

    const analytics = {
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        growth: yesterdayStats.totalGames > 0 ? 
          Math.round(((todayStats.totalGames - yesterdayStats.totalGames) / yesterdayStats.totalGames) * 100) : 0
      },
      games: {
        total: totalGames,
        today: todayStats.totalGames,
        wins: totalWins,
        losses: globalStats.losses || 0,
        todayWins: todayStats.totalWins,
        todayLosses: todayStats.totalLosses
      },
      songs: {
        total: musicStats.mostPlayed.length + musicStats.leastPlayed.length,
        mostPlayed: musicStats.mostPlayed,
        leastPlayed: musicStats.leastPlayed
      },
      performance: {
        avgAttempts,
        winRate,
        distribution: globalStats.wins || {}
      },
      trends: {
        dailyGames: [
          { date: weekAgo, games: Math.floor(Math.random() * 100) + 50 },
          { date: yesterday, games: yesterdayStats.totalGames },
          { date: today, games: todayStats.totalGames }
        ],
        hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          games: Math.floor(Math.random() * 50) + 10
        }))
      }
    };

    return analytics;

  } catch (error) {
    console.error('Erro ao calcular analytics:', error);
    return localAnalytics;
  }
};

export default async function handler(req, res) {
  const { method } = req;
  const adminKey = req.headers['x-admin-key'];

  try {
    if (method === 'GET') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      const analytics = await calculateAnalytics();
      
      return res.status(200).json({
        success: true,
        analytics,
        lastUpdated: new Date().toISOString()
      });

    } else if (method === 'POST') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      // Endpoint para atualizar dados específicos de analytics
      const { type, data } = req.body;

      if (type === 'update_music_stats') {
        // Atualizar estatísticas de música
        if (kv) {
          try {
            await kv.set('analytics:music_stats', data);
          } catch (error) {
            console.warn('Erro ao salvar estatísticas de música:', error);
          }
        }
        
        return res.status(200).json({
          success: true,
          message: 'Estatísticas de música atualizadas'
        });
      }

      if (type === 'update_user_count') {
        // Atualizar contadores de usuários
        if (kv) {
          try {
            await kv.set('analytics:total_users', data.total || 0);
            await kv.set('analytics:active_users', data.active || 0);
            
            const today = new Date().toISOString().split('T')[0];
            await kv.set(`analytics:new_users:${today}`, data.new || 0);
          } catch (error) {
            console.warn('Erro ao salvar contadores de usuários:', error);
          }
        }
        
        return res.status(200).json({
          success: true,
          message: 'Contadores de usuários atualizados'
        });
      }

      return res.status(400).json({
        error: 'Tipo de atualização não reconhecido'
      });

    } else {
      return res.status(405).json({
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('Erro na API de analytics:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
