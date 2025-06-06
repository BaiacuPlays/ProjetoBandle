import { safeKV } from '../../utils/kv-fix';
import { verifyAuthentication } from '../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  console.log('🔄 [FORCE-UPDATE] Recebida solicitação de atualização forçada');

  // Verificar autenticação - obrigatório
  const authResult = await verifyAuthentication(req);
  if (!authResult.authenticated) {
    console.error('❌ [FORCE-UPDATE] Usuário não autenticado');
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const userId = authResult.userId;
  const username = authResult.username;
  console.log(`🔄 [FORCE-UPDATE] Iniciando atualização para ${username} (${userId})`);

  try {
    console.log(`🔄 [FORCE-UPDATE] Iniciando atualização forçada para usuário: ${userId}`);

    // Verificar status do safeKV
    const kvStatus = safeKV.getStatus();
    console.log('📊 [FORCE-UPDATE] Status do KV:', kvStatus);

    // Buscar perfil atual
    const profileKey = `profile:${userId}`;
    console.log(`🔍 [FORCE-UPDATE] Buscando perfil com chave: ${profileKey}`);

    // Tentar diferentes chaves possíveis
    let profile = await safeKV.get(profileKey);
    console.log(`📋 [FORCE-UPDATE] Perfil encontrado com chave ${profileKey}:`, profile ? 'SIM' : 'NÃO');

    if (!profile) {
      // Tentar chave alternativa user:
      const altKey = `user:${userId}`;
      console.log(`🔍 [FORCE-UPDATE] Tentando chave alternativa: ${altKey}`);
      profile = await safeKV.get(altKey);
      console.log(`📋 [FORCE-UPDATE] Perfil encontrado com chave ${altKey}:`, profile ? 'SIM' : 'NÃO');
    }

    if (!profile) {
      console.error(`❌ [FORCE-UPDATE] Perfil não encontrado para usuário: ${userId}`);
      console.error(`❌ [FORCE-UPDATE] Chaves testadas: ${profileKey}, user:${userId}`);

      // Listar algumas chaves para debug
      try {
        const allKeys = await safeKV.keys('profile:*');
        console.log(`🔍 [FORCE-UPDATE] Chaves profile: encontradas:`, allKeys.slice(0, 5));
        const userKeys = await safeKV.keys('user:*');
        console.log(`🔍 [FORCE-UPDATE] Chaves user: encontradas:`, userKeys.slice(0, 5));
      } catch (keyError) {
        console.warn(`⚠️ [FORCE-UPDATE] Erro ao listar chaves:`, keyError.message);
      }

      return res.status(404).json({
        error: 'Perfil não encontrado',
        details: `Chaves testadas: ${profileKey}, user:${userId}`
      });
    }

    // Verificar estrutura básica do perfil
    if (!profile.id && !profile.username) {
      console.error(`❌ [FORCE-UPDATE] Perfil inválido - sem ID ou username`);
      return res.status(400).json({ error: 'Perfil inválido' });
    }

    console.log(`📊 [FORCE-UPDATE] Histórico de jogos:`, profile.gameHistory ? profile.gameHistory.length : 0, 'jogos');
    console.log(`📊 [FORCE-UPDATE] Stats atuais:`, profile.stats ? 'PRESENTES' : 'AUSENTES');

    // Garantir que o perfil tem a estrutura mínima necessária
    const safeProfile = {
      ...profile,
      gameHistory: profile.gameHistory || [],
      stats: profile.stats || {}
    };

    // Criar backup antes da atualização
    const backupKey = `backup:profile:${userId}:${Date.now()}`;
    console.log(`💾 [FORCE-UPDATE] Criando backup: ${backupKey}`);
    await safeKV.set(backupKey, safeProfile);
    console.log(`💾 [FORCE-UPDATE] Backup criado com sucesso`);

    // Recalcular estatísticas baseado no histórico de jogos
    console.log(`🔄 [FORCE-UPDATE] Iniciando recálculo de estatísticas`);
    const updatedStats = await recalculateStatsFromHistory(safeProfile);
    console.log(`✅ [FORCE-UPDATE] Recálculo concluído`);

    // Atualizar perfil com novas estatísticas
    const updatedProfile = {
      ...safeProfile,
      stats: updatedStats,
      lastUpdated: new Date().toISOString()
    };

    // Salvar perfil atualizado
    console.log(`💾 [FORCE-UPDATE] Salvando perfil atualizado`);
    await safeKV.set(profileKey, updatedProfile);
    console.log(`✅ [FORCE-UPDATE] Perfil salvo com sucesso`);

    console.log(`✅ [FORCE-UPDATE] Estatísticas atualizadas para usuário: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Estatísticas atualizadas com sucesso',
      backupKey,
      updatedStats: {
        totalGames: updatedStats.totalGames,
        wins: updatedStats.wins,
        losses: updatedStats.losses,
        winRate: updatedStats.winRate,
        currentStreak: updatedStats.currentStreak,
        bestStreak: updatedStats.bestStreak
      }
    });

  } catch (error) {
    console.error('❌ [FORCE-UPDATE] Erro ao atualizar estatísticas:', error);
    console.error('❌ [FORCE-UPDATE] Stack trace:', error.stack);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function recalculateStatsFromHistory(profile) {
  console.log(`📊 [RECALC] Iniciando recálculo para perfil:`, profile.username || profile.id);

  const gameHistory = profile.gameHistory || [];
  console.log(`📊 [RECALC] Histórico de jogos encontrado:`, gameHistory.length, 'jogos');

  // Inicializar estatísticas zeradas
  const stats = {
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalPlayTime: 0,
    perfectGames: 0,
    averageAttempts: 0,
    fastestWin: null,
    longestSession: 0,
    modeStats: {
      daily: { games: 0, wins: 0, bestStreak: 0, averageAttempts: 0, perfectGames: 0 },
      infinite: { games: 0, wins: 0, bestStreak: 0, totalSongsCompleted: 0, longestSession: 0 },
      multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0 }
    }
  };

  let currentStreak = 0;
  let totalAttempts = 0;
  let totalWinTime = 0;
  let winCount = 0;

  // Processar cada jogo no histórico
  console.log(`🔄 [RECALC] Processando ${gameHistory.length} jogos...`);

  for (let i = 0; i < gameHistory.length; i++) {
    const game = gameHistory[i];

    try {
      stats.totalGames++;

      // Tempo de jogo
      if (game.playTime && typeof game.playTime === 'number') {
        stats.totalPlayTime += game.playTime;
      }

    // Estatísticas por modo
    const mode = game.mode || 'daily';
    if (!stats.modeStats[mode]) {
      stats.modeStats[mode] = { games: 0, wins: 0, bestStreak: 0 };
    }
    stats.modeStats[mode].games++;

    if (game.won) {
      stats.wins++;
      stats.modeStats[mode].wins++;
      currentStreak++;

      // Jogo perfeito (1 tentativa)
      if (game.attempts === 1) {
        stats.perfectGames++;
        stats.modeStats[mode].perfectGames = (stats.modeStats[mode].perfectGames || 0) + 1;
      }

      // Tempo mais rápido
      if (game.playTime && (!stats.fastestWin || game.playTime < stats.fastestWin)) {
        stats.fastestWin = game.playTime;
      }

      // Para cálculo da média de tentativas
      if (game.attempts) {
        totalAttempts += game.attempts;
        winCount++;
      }

      // Tempo total de vitórias para média
      if (game.playTime) {
        totalWinTime += game.playTime;
      }

    } else {
      stats.losses++;
      currentStreak = 0; // Reset streak on loss
    }

    // Atualizar melhor streak
    if (currentStreak > stats.bestStreak) {
      stats.bestStreak = currentStreak;
    }

    // Atualizar melhor streak por modo
    if (currentStreak > stats.modeStats[mode].bestStreak) {
      stats.modeStats[mode].bestStreak = currentStreak;
    }

    // Dados específicos do modo infinito
    if (mode === 'infinite' && game.songsCompleted) {
      stats.modeStats.infinite.totalSongsCompleted += game.songsCompleted;
    }

    // Dados específicos do modo multiplayer
    if (mode === 'multiplayer') {
        if (game.points && typeof game.points === 'number') {
          stats.modeStats.multiplayer.totalPoints += game.points;
          if (game.points > stats.modeStats.multiplayer.bestRoundScore) {
            stats.modeStats.multiplayer.bestRoundScore = game.points;
          }
        }
      }
    } catch (gameError) {
      console.warn(`⚠️ [RECALC] Erro ao processar jogo ${i}:`, gameError.message);
      // Continuar processando outros jogos
    }
  }

  // Definir streak atual
  stats.currentStreak = currentStreak;

  // Calcular taxa de vitória
  stats.winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0;

  // Calcular média de tentativas
  stats.averageAttempts = winCount > 0 ? totalAttempts / winCount : 0;

  // Calcular médias por modo
  Object.keys(stats.modeStats).forEach(mode => {
    const modeData = stats.modeStats[mode];
    if (modeData.wins > 0) {
      // Calcular média de tentativas para este modo baseado no histórico
      const modeGames = gameHistory.filter(g => (g.mode || 'daily') === mode && g.won && g.attempts);
      if (modeGames.length > 0) {
        const modeAttempts = modeGames.reduce((sum, g) => sum + g.attempts, 0);
        modeData.averageAttempts = modeAttempts / modeGames.length;
      }
    }
  });

  // Sessão mais longa
  if (profile.stats?.longestSession) {
    stats.longestSession = profile.stats.longestSession;
  }

  console.log(`📊 [RECALC] Estatísticas recalculadas:`, {
    totalGames: stats.totalGames,
    wins: stats.wins,
    losses: stats.losses,
    winRate: stats.winRate.toFixed(1),
    bestStreak: stats.bestStreak
  });

  return stats;
}
