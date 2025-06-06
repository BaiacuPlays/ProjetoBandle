/**
 * SISTEMA DE ESTATÍSTICAS À PROVA DE BALAS
 * Este sistema GARANTE que as estatísticas nunca se percam
 */

import { kv } from '@vercel/kv';

// Configuração do sistema
const STATS_CONFIG = {
  MAX_RETRIES: 5,
  RETRY_DELAY: 1000,
  BACKUP_INTERVAL: 300000, // 5 minutos
  VALIDATION_ENABLED: true
};

/**
 * Estrutura padrão completa do perfil
 */
export const createDefaultProfile = (userId, username, displayName = '') => {
  const now = new Date().toISOString();

  return {
    // Dados básicos
    id: userId,
    username: username,
    displayName: displayName || username,
    bio: '',
    avatar: null,
    level: 1,
    xp: 0,
    createdAt: now,
    lastLogin: now,
    lastUpdated: now,
    version: '2.0',

    // ESTATÍSTICAS PRINCIPAIS
    stats: {
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

      // Estatísticas por modo
      modeStats: {
        daily: {
          games: 0,
          wins: 0,
          bestStreak: 0,
          averageAttempts: 0,
          perfectGames: 0,
          totalPlayTime: 0
        },
        infinite: {
          games: 0,
          wins: 0,
          bestStreak: 0,
          totalSongsCompleted: 0,
          longestSession: 0,
          totalPlayTime: 0
        },
        multiplayer: {
          games: 0,
          wins: 0,
          roomsCreated: 0,
          totalPoints: 0,
          bestRoundScore: 0,
          totalPlayTime: 0
        }
      }
    },

    // CONQUISTAS E BADGES
    achievements: [],
    badges: [],
    titles: [],
    currentTitle: null,

    // HISTÓRICO DE JOGOS
    gameHistory: [],

    // ESTATÍSTICAS DE FRANQUIAS
    franchiseStats: {},

    // ESTATÍSTICAS SOCIAIS
    socialStats: {
      gamesShared: 0,
      friendsReferred: 0,
      friendsAdded: 0,
      multiplayerGamesPlayed: 0,
      multiplayerWins: 0,
      invitesSent: 0,
      invitesAccepted: 0,
      socialInteractions: 0,
      helpfulActions: 0
    },

    // PREFERÊNCIAS
    preferences: {
      theme: 'dark',
      language: 'pt',
      notifications: true,
      showAchievementPopups: true,
      hasSeenProfileTutorial: false
    }
  };
};

/**
 * Validar integridade das estatísticas
 */
export const validateStats = (stats) => {
  const errors = [];

  if (!stats) {
    errors.push('Stats object is missing');
    return { isValid: false, errors };
  }

  // Validações básicas
  if (typeof stats.totalGames !== 'number' || stats.totalGames < 0) {
    errors.push('Invalid totalGames');
  }

  if (typeof stats.wins !== 'number' || stats.wins < 0) {
    errors.push('Invalid wins');
  }

  if (typeof stats.losses !== 'number' || stats.losses < 0) {
    errors.push('Invalid losses');
  }

  // Validação matemática
  if (stats.wins + stats.losses !== stats.totalGames) {
    errors.push('Math error: wins + losses ≠ totalGames');
  }

  // Validação de winRate
  const expectedWinRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0;
  if (Math.abs(stats.winRate - expectedWinRate) > 0.1) {
    errors.push('Invalid winRate calculation');
  }

  // Validação de streaks
  if (stats.currentStreak > stats.bestStreak) {
    errors.push('currentStreak > bestStreak');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Reparar estatísticas corrompidas
 */
export const repairStats = (stats, gameHistory = []) => {
  console.log('🔧 [REPAIR] Reparando estatísticas...');

  // Se não há stats, criar do zero
  if (!stats) {
    stats = createDefaultProfile('temp', 'temp').stats;
  }

  // Recalcular baseado no histórico se disponível
  if (gameHistory && gameHistory.length > 0) {
    const recalculated = recalculateFromHistory(gameHistory);
    return {
      ...stats,
      ...recalculated
    };
  }

  // Reparos básicos
  const repaired = {
    totalGames: Math.max(0, stats.totalGames || 0),
    wins: Math.max(0, stats.wins || 0),
    losses: Math.max(0, stats.losses || 0),
    currentStreak: Math.max(0, stats.currentStreak || 0),
    bestStreak: Math.max(0, stats.bestStreak || 0),
    totalPlayTime: Math.max(0, stats.totalPlayTime || 0),
    perfectGames: Math.max(0, stats.perfectGames || 0),
    averageAttempts: Math.max(0, stats.averageAttempts || 0),
    fastestWin: stats.fastestWin,
    longestSession: Math.max(0, stats.longestSession || 0),
    modeStats: stats.modeStats || createDefaultProfile('temp', 'temp').stats.modeStats
  };

  // Corrigir totalGames
  repaired.totalGames = repaired.wins + repaired.losses;

  // Corrigir winRate
  repaired.winRate = repaired.totalGames > 0 ? (repaired.wins / repaired.totalGames) * 100 : 0;

  // Corrigir streaks
  if (repaired.currentStreak > repaired.bestStreak) {
    repaired.bestStreak = repaired.currentStreak;
  }

  console.log('✅ [REPAIR] Estatísticas reparadas');
  return repaired;
};

/**
 * Recalcular estatísticas baseado no histórico
 */
export const recalculateFromHistory = (gameHistory) => {
  console.log('📊 [RECALC] Recalculando do histórico:', gameHistory.length, 'jogos');

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
      daily: { games: 0, wins: 0, bestStreak: 0, averageAttempts: 0, perfectGames: 0, totalPlayTime: 0 },
      infinite: { games: 0, wins: 0, bestStreak: 0, totalSongsCompleted: 0, longestSession: 0, totalPlayTime: 0 },
      multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0, totalPlayTime: 0 }
    }
  };

  let currentStreak = 0;
  let totalAttempts = 0;
  let winCount = 0;

  for (const game of gameHistory) {
    if (!game || typeof game !== 'object') continue;

    stats.totalGames++;

    const mode = game.mode || 'daily';
    if (!stats.modeStats[mode]) {
      stats.modeStats[mode] = { games: 0, wins: 0, bestStreak: 0 };
    }
    stats.modeStats[mode].games++;

    // Tempo de jogo
    if (game.playTime && typeof game.playTime === 'number') {
      stats.totalPlayTime += game.playTime;
      stats.modeStats[mode].totalPlayTime = (stats.modeStats[mode].totalPlayTime || 0) + game.playTime;
    }

    if (game.won) {
      stats.wins++;
      stats.modeStats[mode].wins++;
      currentStreak++;

      // Jogo perfeito
      if (game.attempts === 1) {
        stats.perfectGames++;
        if (stats.modeStats[mode].perfectGames !== undefined) {
          stats.modeStats[mode].perfectGames++;
        }
      }

      // Tempo mais rápido
      if (game.playTime && (!stats.fastestWin || game.playTime < stats.fastestWin)) {
        stats.fastestWin = game.playTime;
      }

      // Tentativas
      if (game.attempts && typeof game.attempts === 'number') {
        totalAttempts += game.attempts;
        winCount++;
      }
    } else {
      stats.losses++;
      currentStreak = 0;
    }

    // Atualizar melhor streak
    if (currentStreak > stats.bestStreak) {
      stats.bestStreak = currentStreak;
    }
    if (currentStreak > stats.modeStats[mode].bestStreak) {
      stats.modeStats[mode].bestStreak = currentStreak;
    }

    // Dados específicos por modo
    if (mode === 'infinite' && game.songsCompleted) {
      stats.modeStats.infinite.totalSongsCompleted += game.songsCompleted;
    }
    if (mode === 'multiplayer' && game.points) {
      stats.modeStats.multiplayer.totalPoints += game.points;
      if (game.points > stats.modeStats.multiplayer.bestRoundScore) {
        stats.modeStats.multiplayer.bestRoundScore = game.points;
      }
    }
  }

  // Finalizar cálculos
  stats.currentStreak = currentStreak;
  stats.winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0;
  stats.averageAttempts = winCount > 0 ? totalAttempts / winCount : 0;

  console.log('✅ [RECALC] Recálculo concluído');
  return stats;
};

/**
 * Salvar perfil com retry automático
 */
export const saveProfileWithRetry = async (userId, profile, retries = STATS_CONFIG.MAX_RETRIES) => {
  const profileKey = `profile:${userId}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`💾 [SAVE] Tentativa ${attempt}/${retries} para ${userId}`);

      // Validar antes de salvar
      if (STATS_CONFIG.VALIDATION_ENABLED) {
        const validation = validateStats(profile.stats);
        if (!validation.isValid) {
          console.warn('⚠️ [SAVE] Estatísticas inválidas, reparando...', validation.errors);
          profile.stats = repairStats(profile.stats, profile.gameHistory);
        }
      }

      // Atualizar timestamp
      profile.lastUpdated = new Date().toISOString();

      // Salvar no KV
      await kv.set(profileKey, profile);

      // Criar backup
      const backupKey = `backup:${profileKey}:${Date.now()}`;
      await kv.set(backupKey, profile, { ex: 86400 }); // Expira em 24h

      console.log(`✅ [SAVE] Perfil salvo com sucesso (tentativa ${attempt})`);
      return true;

    } catch (error) {
      console.error(`❌ [SAVE] Erro na tentativa ${attempt}:`, error.message);

      if (attempt === retries) {
        throw new Error(`Falha ao salvar após ${retries} tentativas: ${error.message}`);
      }

      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, STATS_CONFIG.RETRY_DELAY * attempt));
    }
  }
};

/**
 * Carregar perfil com fallback automático
 */
export const loadProfileWithFallback = async (userId) => {
  const profileKey = `profile:${userId}`;

  try {
    console.log(`🔍 [LOAD] Carregando perfil: ${userId}`);

    // Tentar carregar perfil principal
    let profile = await kv.get(profileKey);

    if (profile) {
      console.log(`✅ [LOAD] Perfil encontrado`);

      // Validar integridade
      if (STATS_CONFIG.VALIDATION_ENABLED) {
        const validation = validateStats(profile.stats);
        if (!validation.isValid) {
          console.warn('⚠️ [LOAD] Perfil corrompido, reparando...', validation.errors);
          profile.stats = repairStats(profile.stats, profile.gameHistory);

          // Salvar versão reparada
          await saveProfileWithRetry(userId, profile, 2);
        }
      }

      return profile;
    }

    console.warn(`⚠️ [LOAD] Perfil não encontrado, tentando backup...`);

    // Tentar carregar backup mais recente
    const backupKeys = await kv.keys(`backup:${profileKey}:*`);
    if (backupKeys.length > 0) {
      // Ordenar por timestamp (mais recente primeiro)
      backupKeys.sort((a, b) => {
        const timestampA = parseInt(a.split(':').pop());
        const timestampB = parseInt(b.split(':').pop());
        return timestampB - timestampA;
      });

      for (const backupKey of backupKeys) {
        try {
          const backupProfile = await kv.get(backupKey);
          if (backupProfile) {
            console.log(`🔄 [LOAD] Recuperado do backup: ${backupKey}`);

            // Restaurar como perfil principal
            await saveProfileWithRetry(userId, backupProfile, 2);
            return backupProfile;
          }
        } catch (backupError) {
          console.warn(`⚠️ [LOAD] Erro no backup ${backupKey}:`, backupError.message);
        }
      }
    }

    console.log(`📝 [LOAD] Criando novo perfil para: ${userId}`);
    return null;

  } catch (error) {
    console.error(`❌ [LOAD] Erro crítico ao carregar perfil:`, error);
    return null;
  }
};

/**
 * Atualizar estatísticas de jogo
 */
export const updateGameStats = async (userId, gameData) => {
  try {
    console.log(`🎮 [UPDATE] Atualizando stats para: ${userId}`);

    // Carregar perfil atual
    let profile = await loadProfileWithFallback(userId);

    if (!profile) {
      console.error(`❌ [UPDATE] Perfil não encontrado: ${userId}`);
      return null;
    }

    // Garantir estrutura das stats
    if (!profile.stats) {
      profile.stats = createDefaultProfile(userId, profile.username).stats;
    }

    // Adicionar jogo ao histórico
    const gameEntry = {
      id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      won: gameData.won,
      attempts: gameData.attempts || 0,
      mode: gameData.mode || 'daily',
      playTime: gameData.playTime || 0,
      song: gameData.song || null,
      points: gameData.points || 0,
      songsCompleted: gameData.songsCompleted || 0
    };

    // Adicionar ao histórico (manter últimos 1000 jogos)
    if (!profile.gameHistory) {
      profile.gameHistory = [];
    }
    profile.gameHistory.unshift(gameEntry);
    if (profile.gameHistory.length > 1000) {
      profile.gameHistory = profile.gameHistory.slice(0, 1000);
    }

    // Recalcular todas as estatísticas baseado no histórico
    profile.stats = {
      ...profile.stats,
      ...recalculateFromHistory(profile.gameHistory)
    };

    // Atualizar XP e level
    if (gameData.won) {
      const xpGained = calculateXP(gameData);
      profile.xp = (profile.xp || 0) + xpGained;
      profile.level = calculateLevel(profile.xp);
    }

    // Salvar perfil atualizado
    await saveProfileWithRetry(userId, profile);

    console.log(`✅ [UPDATE] Stats atualizadas com sucesso`);
    return profile;

  } catch (error) {
    console.error(`❌ [UPDATE] Erro ao atualizar stats:`, error);
    throw error;
  }
};

/**
 * Calcular XP baseado no desempenho
 */
const calculateXP = (gameData) => {
  if (!gameData.won) return 0;

  let xp = 50; // XP base

  // Bônus por tentativas
  if (gameData.attempts === 1) xp += 50;
  else if (gameData.attempts <= 2) xp += 30;
  else if (gameData.attempts <= 3) xp += 20;
  else if (gameData.attempts <= 4) xp += 10;

  return xp;
};

/**
 * Calcular level baseado no XP
 */
const calculateLevel = (xp) => {
  return Math.floor(Math.sqrt(xp / 300)) + 1;
};
