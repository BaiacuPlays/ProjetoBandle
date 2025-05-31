import { kv } from '@vercel/kv';

// Estrutura padrão do perfil
const createDefaultProfile = (userId) => {
  return {
    id: userId,
    username: `Jogador_${userId.slice(-6)}`,
    displayName: '',
    bio: '',
    avatar: '/default-avatar.png',
    level: 1,
    xp: 0,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    
    // Estatísticas do jogo
    stats: {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageGuesses: 0,
      bestStreak: 0,
      currentStreak: 0,
      totalPlayTime: 0,
      
      // Estatísticas por tentativa
      guessDistribution: {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
      },
      
      // Estatísticas por modo
      modeStats: {
        daily: { games: 0, wins: 0 },
        infinite: { games: 0, wins: 0, bestStreak: 0 }
      }
    },
    
    // Conquistas desbloqueadas
    achievements: [],
    
    // Configurações
    settings: {
      soundEnabled: true,
      theme: 'dark',
      language: 'pt'
    },
    
    // Histórico de jogos (últimos 10)
    gameHistory: [],
    
    // Músicas favoritas (que mais acerta)
    favoriteSongs: []
  };
};

// Calcular XP necessário para o próximo nível
const getXPForNextLevel = (level) => {
  return level * 100 + (level - 1) * 50;
};

// Calcular nível baseado no XP
const calculateLevel = (xp) => {
  let level = 1;
  let totalXPNeeded = 0;
  
  while (totalXPNeeded <= xp) {
    totalXPNeeded += getXPForNextLevel(level);
    if (totalXPNeeded <= xp) {
      level++;
    }
  }
  
  return level;
};

export default async function handler(req, res) {
  try {
    const { method } = req;
    
    if (method === 'GET') {
      // Buscar perfil
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }
      
      try {
        let profile = await kv.get(`profile:${userId}`);
        
        if (!profile) {
          // Criar novo perfil
          profile = createDefaultProfile(userId);
          await kv.set(`profile:${userId}`, profile);
        }
        
        // Atualizar último login
        profile.lastLogin = new Date().toISOString();
        await kv.set(`profile:${userId}`, profile);
        
        return res.status(200).json({ profile });
      } catch (kvError) {
        console.error('Erro no KV:', kvError);
        // Fallback: retornar perfil padrão sem salvar
        const profile = createDefaultProfile(userId);
        return res.status(200).json({ profile, fallback: true });
      }
    }
    
    if (method === 'POST') {
      // Atualizar perfil
      const { userId, updates } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }
      
      try {
        let profile = await kv.get(`profile:${userId}`);
        
        if (!profile) {
          profile = createDefaultProfile(userId);
        }
        
        // Aplicar atualizações
        profile = { ...profile, ...updates };
        
        // Recalcular nível se XP foi atualizado
        if (updates.xp !== undefined) {
          profile.level = calculateLevel(profile.xp);
        }
        
        // Recalcular taxa de vitória
        if (profile.stats.totalGames > 0) {
          profile.stats.winRate = (profile.stats.wins / profile.stats.totalGames) * 100;
        }
        
        await kv.set(`profile:${userId}`, profile);
        
        return res.status(200).json({ profile });
      } catch (kvError) {
        console.error('Erro ao salvar no KV:', kvError);
        return res.status(500).json({ error: 'Erro ao salvar perfil' });
      }
    }
    
    if (method === 'PUT') {
      // Atualizar estatísticas do jogo
      const { userId, gameStats } = req.body;
      
      if (!userId || !gameStats) {
        return res.status(400).json({ error: 'userId e gameStats são obrigatórios' });
      }
      
      try {
        let profile = await kv.get(`profile:${userId}`);
        
        if (!profile) {
          profile = createDefaultProfile(userId);
        }
        
        // Atualizar estatísticas
        profile.stats.totalGames += 1;
        
        if (gameStats.won) {
          profile.stats.wins += 1;
          profile.stats.currentStreak += 1;
          profile.stats.bestStreak = Math.max(profile.stats.bestStreak, profile.stats.currentStreak);
          
          // XP por vitória
          profile.xp += 50;
          
          // XP bônus por tentativas
          const guessBonus = Math.max(0, (7 - gameStats.guesses) * 10);
          profile.xp += guessBonus;
        } else {
          profile.stats.losses += 1;
          profile.stats.currentStreak = 0;
          profile.xp += 10; // XP consolação
        }
        
        // Atualizar distribuição de tentativas
        if (gameStats.won && gameStats.guesses >= 1 && gameStats.guesses <= 6) {
          profile.stats.guessDistribution[gameStats.guesses] += 1;
        }
        
        // Atualizar estatísticas por modo
        if (gameStats.mode) {
          if (!profile.stats.modeStats[gameStats.mode]) {
            profile.stats.modeStats[gameStats.mode] = { games: 0, wins: 0 };
          }
          
          profile.stats.modeStats[gameStats.mode].games += 1;
          if (gameStats.won) {
            profile.stats.modeStats[gameStats.mode].wins += 1;
          }
          
          if (gameStats.mode === 'infinite' && gameStats.streak) {
            profile.stats.modeStats.infinite.bestStreak = Math.max(
              profile.stats.modeStats.infinite.bestStreak || 0,
              gameStats.streak
            );
          }
        }
        
        // Recalcular nível e taxa de vitória
        profile.level = calculateLevel(profile.xp);
        profile.stats.winRate = (profile.stats.wins / profile.stats.totalGames) * 100;
        
        // Calcular média de tentativas
        const totalGuesses = Object.entries(profile.stats.guessDistribution)
          .reduce((sum, [guess, count]) => sum + (parseInt(guess) * count), 0);
        profile.stats.averageGuesses = profile.stats.wins > 0 ? totalGuesses / profile.stats.wins : 0;
        
        // Adicionar ao histórico
        const gameRecord = {
          date: new Date().toISOString(),
          won: gameStats.won,
          guesses: gameStats.guesses,
          song: gameStats.song,
          mode: gameStats.mode,
          xpGained: gameStats.won ? 50 + Math.max(0, (7 - gameStats.guesses) * 10) : 10
        };
        
        profile.gameHistory.unshift(gameRecord);
        profile.gameHistory = profile.gameHistory.slice(0, 10); // Manter apenas os últimos 10
        
        await kv.set(`profile:${userId}`, profile);
        
        return res.status(200).json({ profile });
      } catch (kvError) {
        console.error('Erro ao atualizar estatísticas:', kvError);
        return res.status(500).json({ error: 'Erro ao atualizar estatísticas' });
      }
    }
    
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de perfil:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
