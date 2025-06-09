// Sistema de perfis estilo Steam
// Validação e migração de perfis para compatibilidade

/**
 * Valida se um perfil tem a estrutura correta estilo Steam
 * @param {Object} profile - Perfil a ser validado
 * @returns {Object} - Resultado da validação
 */
export function validateProfile(profile) {
  const errors = [];
  const warnings = [];

  if (!profile) {
    errors.push('Perfil é null ou undefined');
    return { isValid: false, errors, warnings };
  }

  // Verificar campos obrigatórios
  const requiredFields = ['id', 'username'];
  for (const field of requiredFields) {
    if (!profile[field]) {
      errors.push(`Campo obrigatório ausente: ${field}`);
    }
  }

  // Verificar tipos de dados
  if (profile.level !== undefined && (typeof profile.level !== 'number' || profile.level < 1)) {
    errors.push('Level deve ser um número maior que 0');
  }

  if (profile.xp !== undefined && (typeof profile.xp !== 'number' || profile.xp < 0)) {
    errors.push('XP deve ser um número maior ou igual a 0');
  }

  // Verificar estrutura das estatísticas
  if (profile.stats) {
    if (typeof profile.stats !== 'object') {
      errors.push('Stats deve ser um objeto');
    } else {
      // Verificar campos numéricos das estatísticas
      const numericFields = ['totalGames', 'wins', 'totalWins', 'totalScore', 'averageScore', 'bestStreak', 'currentStreak', 'perfectGames'];
      for (const field of numericFields) {
        if (profile.stats[field] !== undefined && (typeof profile.stats[field] !== 'number' || profile.stats[field] < 0)) {
          warnings.push(`Stats.${field} deve ser um número maior ou igual a 0`);
        }
      }

      // Verificar consistência das estatísticas
      if (profile.stats.wins > profile.stats.totalGames) {
        warnings.push('Número de vitórias não pode ser maior que total de jogos');
      }

      if (profile.stats.currentStreak > profile.stats.bestStreak) {
        warnings.push('Sequência atual não pode ser maior que melhor sequência');
      }

      if (profile.stats.winRate !== undefined && (profile.stats.winRate < 0 || profile.stats.winRate > 100)) {
        warnings.push('Taxa de vitórias deve estar entre 0 e 100');
      }
    }
  }

  // Verificar estrutura das conquistas
  if (profile.achievements && typeof profile.achievements !== 'object') {
    warnings.push('Achievements deve ser um objeto');
  }

  // Verificar estrutura dos badges
  if (profile.badges && typeof profile.badges !== 'object') {
    warnings.push('Badges deve ser um objeto');
  }

  // Verificar avatar
  if (profile.avatar && typeof profile.avatar !== 'string') {
    warnings.push('Avatar deve ser uma string');
  }

  // Verificar datas
  const dateFields = ['createdAt', 'lastLoginAt', 'lastUpdated'];
  for (const field of dateFields) {
    if (profile[field] && !isValidDate(profile[field])) {
      warnings.push(`${field} deve ser uma data válida`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Migra um perfil antigo para o formato Steam-like atual
 * @param {Object} oldProfile - Perfil no formato antigo
 * @param {string} userId - ID do usuário
 * @param {string} username - Nome do usuário
 * @returns {Object} - Perfil migrado
 */
export function migrateProfile(oldProfile, userId, username) {
  if (!oldProfile) {
    return createDefaultProfile(userId, username);
  }

  try {
    // Estrutura base do perfil migrado
    const migratedProfile = {
      id: oldProfile.id || userId,
      username: oldProfile.username || username,
      displayName: oldProfile.displayName || oldProfile.username || username,
      bio: oldProfile.bio || '',
      avatar: oldProfile.avatar || oldProfile.profilePhoto || '🎮',
      level: Math.max(1, oldProfile.level || 1),
      xp: Math.max(0, oldProfile.xp || 0),
      createdAt: oldProfile.createdAt || new Date().toISOString(),
      lastLoginAt: oldProfile.lastLoginAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),

      // Migrar estatísticas
      stats: migrateStats(oldProfile.stats || {}),

      // Migrar conquistas
      achievements: migrateAchievements(oldProfile.achievements || {}),

      // Migrar badges
      badges: migrateBadges(oldProfile.badges || {}),

      // Metadados de migração
      migrationVersion: 2,
      migratedAt: new Date().toISOString(),
      originalVersion: oldProfile.version || 1
    };

    console.log(`🔄 Perfil migrado para usuário: ${username}`);
    return migratedProfile;

  } catch (error) {
    console.error('❌ Erro na migração do perfil:', error);
    return createDefaultProfile(userId, username);
  }
}

/**
 * Migra estatísticas para o formato atual
 * @param {Object} oldStats - Estatísticas antigas
 * @returns {Object} - Estatísticas migradas
 */
function migrateStats(oldStats) {
  return {
    totalGames: Math.max(0, oldStats.totalGames || 0),
    wins: Math.max(0, oldStats.wins || oldStats.totalWins || 0),
    totalWins: Math.max(0, oldStats.totalWins || oldStats.wins || 0),
    gamesWon: Math.max(0, oldStats.gamesWon || oldStats.wins || oldStats.totalWins || 0),
    totalScore: Math.max(0, oldStats.totalScore || 0),
    averageScore: Math.max(0, oldStats.averageScore || 0),
    bestStreak: Math.max(0, oldStats.bestStreak || 0),
    currentStreak: Math.max(0, oldStats.currentStreak || 0),
    perfectGames: Math.max(0, oldStats.perfectGames || 0),
    totalPlayTime: Math.max(0, oldStats.totalPlayTime || 0),
    averageAttempts: Math.max(0, oldStats.averageAttempts || 0),
    fastestWin: oldStats.fastestWin || null,
    
    // Calcular winRate se não existir
    winRate: oldStats.winRate || (oldStats.totalGames > 0 ? 
      Math.round(((oldStats.wins || oldStats.totalWins || 0) / oldStats.totalGames) * 100) : 0),

    // Migrar estatísticas por modo se existirem
    modeStats: oldStats.modeStats || {
      daily: { games: 0, wins: 0, bestStreak: 0, averageAttempts: 0, perfectGames: 0 },
      infinite: { games: 0, wins: 0, bestStreak: 0, totalSongsCompleted: 0, longestSession: 0 },
      multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0 }
    }
  };
}

/**
 * Migra conquistas para o formato atual
 * @param {Object} oldAchievements - Conquistas antigas
 * @returns {Object} - Conquistas migradas
 */
function migrateAchievements(oldAchievements) {
  const migratedAchievements = {};

  // Se é um array (formato antigo), converter para objeto
  if (Array.isArray(oldAchievements)) {
    for (const achievement of oldAchievements) {
      if (typeof achievement === 'string') {
        migratedAchievements[achievement] = {
          unlocked: true,
          unlockedAt: new Date().toISOString(),
          progress: 100
        };
      }
    }
  } else if (typeof oldAchievements === 'object') {
    // Se já é objeto, manter estrutura
    for (const [key, value] of Object.entries(oldAchievements)) {
      migratedAchievements[key] = {
        unlocked: value.unlocked || false,
        unlockedAt: value.unlockedAt || null,
        progress: value.progress || 0
      };
    }
  }

  return migratedAchievements;
}

/**
 * Migra badges para o formato atual
 * @param {Object} oldBadges - Badges antigos
 * @returns {Object} - Badges migrados
 */
function migrateBadges(oldBadges) {
  const migratedBadges = {};

  // Se é um array (formato antigo), converter para objeto
  if (Array.isArray(oldBadges)) {
    for (const badge of oldBadges) {
      if (typeof badge === 'string') {
        migratedBadges[badge] = {
          unlocked: true,
          unlockedAt: new Date().toISOString()
        };
      }
    }
  } else if (typeof oldBadges === 'object') {
    // Se já é objeto, manter estrutura
    for (const [key, value] of Object.entries(oldBadges)) {
      migratedBadges[key] = {
        unlocked: value.unlocked || false,
        unlockedAt: value.unlockedAt || null
      };
    }
  }

  return migratedBadges;
}

/**
 * Cria um perfil padrão
 * @param {string} userId - ID do usuário
 * @param {string} username - Nome do usuário
 * @returns {Object} - Perfil padrão
 */
function createDefaultProfile(userId, username) {
  return {
    id: userId,
    username: username,
    displayName: username,
    bio: '',
    avatar: '🎮',
    level: 1,
    xp: 0,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),

    stats: {
      totalGames: 0,
      wins: 0,
      totalWins: 0,
      gamesWon: 0,
      totalScore: 0,
      averageScore: 0,
      bestStreak: 0,
      currentStreak: 0,
      perfectGames: 0,
      winRate: 0,
      totalPlayTime: 0,
      averageAttempts: 0,
      fastestWin: null,
      
      modeStats: {
        daily: { games: 0, wins: 0, bestStreak: 0, averageAttempts: 0, perfectGames: 0 },
        infinite: { games: 0, wins: 0, bestStreak: 0, totalSongsCompleted: 0, longestSession: 0 },
        multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0 }
      }
    },

    achievements: {},
    badges: {},

    version: 2,
    createdAt: new Date().toISOString()
  };
}

/**
 * Verifica se uma string é uma data válida
 * @param {string} dateString - String da data
 * @returns {boolean} - Se é uma data válida
 */
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}
