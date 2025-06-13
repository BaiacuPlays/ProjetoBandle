// API otimizada para buscar múltiplos dados em uma única chamada
// Reduz drasticamente o número de Function Invocations
import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = (process.env.KV_REST_API_URL || process.env.KV_URL) && process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { types, userId } = req.query;

  if (!types) {
    return res.status(400).json({ error: 'Parâmetro types é obrigatório' });
  }

  const requestedTypes = types.split(',');
  const result = {};

  try {
    // Buscar dados em paralelo para otimizar performance
    const promises = requestedTypes.map(async (type) => {
      switch (type) {
        case 'globalStats':
          return ['globalStats', await getGlobalStats()];

        case 'profile':
          if (!userId) return ['profile', null];
          return ['profile', await getProfile(userId)];

        case 'statistics':
          if (!userId) return ['statistics', null];
          return ['statistics', await getStatistics(userId)];

        case 'dailySong':
          return ['dailySong', await getDailySong()];

        case 'friends':
          if (!userId) return ['friends', null];
          return ['friends', await getFriends(userId)];

        default:
          return [type, null];
      }
    });

    const results = await Promise.allSettled(promises);

    results.forEach((promiseResult) => {
      if (promiseResult.status === 'fulfilled' && promiseResult.value) {
        const [key, value] = promiseResult.value;
        result[key] = value;
      }
    });

    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na API batch-data:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      data: result // Retornar dados parciais se houver
    });
  }
}

// Função para buscar estatísticas globais
async function getGlobalStats() {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const currentDay = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (isDevelopment && !hasKVConfig) {
      return {
        totalGames: 3,
        averageAttempts: 3.2
      };
    }

    const dailyStatsKey = `stats:daily:${currentDay}`;
    const rawStats = await kv.get(dailyStatsKey);

    if (rawStats && rawStats.totalGames >= 0) {
      return {
        totalGames: rawStats.totalGames || 0,
        averageAttempts: rawStats.averageAttempts || 3.2
      };
    }

    return {
      totalGames: 0,
      averageAttempts: 3.2
    };
  } catch (error) {
    return {
      totalGames: 0,
      averageAttempts: 3.2
    };
  }
}

// Função para buscar perfil
async function getProfile(userId) {
  try {
    if (isDevelopment && !hasKVConfig) {
      return null;
    }

    const profile = await kv.get(`profile:${userId}`);
    return profile;
  } catch (error) {
    return null;
  }
}

// Função para buscar estatísticas do usuário
async function getStatistics(userId) {
  try {
    const defaultStats = {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      winPercentage: 0,
      averageAttempts: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      totalScore: 0,
      achievements: [],
      badges: [],
      level: 1,
      xp: 0
    };

    if (isDevelopment && !hasKVConfig) {
      return defaultStats;
    }

    const statsKey = `stats:${userId}`;
    const stats = await kv.get(statsKey);
    return stats || defaultStats;
  } catch (error) {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      winPercentage: 0,
      averageAttempts: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      totalScore: 0,
      achievements: [],
      badges: [],
      level: 1,
      xp: 0
    };
  }
}

// Função para buscar música do dia
async function getDailySong() {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Verificar se há override definido
    let customSong = null;
    if (!isDevelopment || hasKVConfig) {
      try {
        customSong = await kv.get(`daily-song-override:${dayOfYear}`);
      } catch (err) {
        // Ignorar erro
      }
    }

    if (customSong) {
      return {
        song: customSong,
        dayOfYear,
        isOverride: true
      };
    }

    // Carregar música determinística
    try {
      const musicPath = path.join(process.cwd(), 'data', 'music.json');
      const musicFile = fs.readFileSync(musicPath, 'utf8');
      const musicData = JSON.parse(musicFile);

      // Função determinística simples
      const songIndex = dayOfYear % musicData.songs.length;
      const currentSong = musicData.songs[songIndex];

      return {
        song: currentSong,
        dayOfYear,
        isOverride: false
      };
    } catch (err) {
      return {
        song: {
          title: 'Sweden',
          artist: 'C418',
          game: 'Minecraft'
        },
        dayOfYear,
        isOverride: false
      };
    }
  } catch (error) {
    return null;
  }
}

// Função para buscar amigos
async function getFriends(userId) {
  try {
    if (isDevelopment && !hasKVConfig) {
      return {
        friends: [],
        requests: [],
        sentRequests: []
      };
    }

    const [friends, requests, sentRequests] = await Promise.all([
      kv.get(`friends:${userId}`) || [],
      kv.get(`friend_requests:${userId}`) || [],
      kv.get(`sent_requests:${userId}`) || []
    ]);

    return {
      friends,
      requests,
      sentRequests
    };
  } catch (error) {
    return {
      friends: [],
      requests: [],
      sentRequests: []
    };
  }
}
