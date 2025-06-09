// Utilitários para manipulação e validação de perfis
// Funções para sanitizar e reparar dados corrompidos

/**
 * Sanitiza um perfil removendo dados corrompidos ou inválidos
 * @param {Object} profile - Perfil a ser sanitizado
 * @returns {Object} - Perfil sanitizado
 */
export function sanitizeProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return null;
  }

  // Função auxiliar para sanitizar strings
  const sanitizeString = (str, defaultValue = '') => {
    if (!str || typeof str !== 'string') return defaultValue;
    
    // Verificar se é uma string muito longa ou contém caracteres estranhos
    if (str.length > 100 || /[+/=]{10,}/.test(str)) {
      console.warn('String corrompida detectada:', str.substring(0, 50) + '...');
      return defaultValue;
    }
    
    // Verificar se parece ser base64 ou hash
    if (/^[A-Za-z0-9+/=]{20,}$/.test(str)) {
      console.warn('String suspeita (base64/hash) detectada:', str.substring(0, 20) + '...');
      return defaultValue;
    }
    
    return str;
  };

  // Função auxiliar para sanitizar números
  const sanitizeNumber = (num, defaultValue = 0, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, num));
  };

  // Função auxiliar para sanitizar avatar
  const sanitizeAvatar = (avatar) => {
    if (!avatar || typeof avatar !== 'string') return '🎮';
    
    // Se é um emoji válido (1-8 caracteres)
    if (avatar.length <= 8 && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(avatar)) {
      return avatar;
    }
    
    // Se é uma URL válida
    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')) {
      return avatar;
    }
    
    // Se é uma imagem base64 válida (mas não muito longa)
    if (avatar.startsWith('data:image/') && avatar.length < 500000) {
      return avatar;
    }
    
    return '🎮';
  };

  try {
    const sanitized = {
      id: sanitizeString(profile.id, 'unknown'),
      username: sanitizeString(profile.username, 'Usuário'),
      displayName: sanitizeString(profile.displayName || profile.username, 'Usuário'),
      bio: sanitizeString(profile.bio, ''),
      avatar: sanitizeAvatar(profile.avatar || profile.profilePhoto),
      level: sanitizeNumber(profile.level, 1, 1, 1000),
      xp: sanitizeNumber(profile.xp, 0, 0),
      createdAt: profile.createdAt || new Date().toISOString(),
      lastLoginAt: profile.lastLoginAt || new Date().toISOString(),
      
      // Sanitizar estatísticas
      stats: {
        totalGames: sanitizeNumber(profile.stats?.totalGames, 0),
        wins: sanitizeNumber(profile.stats?.wins || profile.stats?.totalWins, 0),
        totalWins: sanitizeNumber(profile.stats?.totalWins || profile.stats?.wins, 0),
        gamesWon: sanitizeNumber(profile.stats?.gamesWon || profile.stats?.wins, 0),
        totalScore: sanitizeNumber(profile.stats?.totalScore, 0),
        averageScore: sanitizeNumber(profile.stats?.averageScore, 0),
        bestStreak: sanitizeNumber(profile.stats?.bestStreak, 0),
        currentStreak: sanitizeNumber(profile.stats?.currentStreak, 0),
        perfectGames: sanitizeNumber(profile.stats?.perfectGames, 0),
        winRate: sanitizeNumber(profile.stats?.winRate, 0, 0, 100),
        totalPlayTime: sanitizeNumber(profile.stats?.totalPlayTime, 0),
        averageAttempts: sanitizeNumber(profile.stats?.averageAttempts, 0),
        fastestWin: profile.stats?.fastestWin || null
      },
      
      // Sanitizar conquistas
      achievements: profile.achievements && typeof profile.achievements === 'object' ? profile.achievements : {},
      
      // Sanitizar badges
      badges: profile.badges && typeof profile.badges === 'object' ? profile.badges : {}
    };

    return sanitized;
  } catch (error) {
    console.error('Erro ao sanitizar perfil:', error);
    return null;
  }
}

/**
 * Repara um perfil corrompido tentando recuperar dados válidos
 * @param {Object} profile - Perfil corrompido
 * @returns {Object|null} - Perfil reparado ou null se irrecuperável
 */
export function repairCorruptedProfile(profile) {
  if (!profile) return null;

  try {
    // Primeiro, tentar sanitizar
    const sanitized = sanitizeProfile(profile);
    if (!sanitized) return null;

    // Verificar se tem campos essenciais
    if (!sanitized.id || !sanitized.username) {
      console.warn('Perfil sem campos essenciais, não pode ser reparado');
      return null;
    }

    // Verificar integridade das estatísticas
    if (sanitized.stats) {
      // Recalcular winRate se necessário
      if (sanitized.stats.totalGames > 0 && sanitized.stats.wins >= 0) {
        sanitized.stats.winRate = Math.round((sanitized.stats.wins / sanitized.stats.totalGames) * 100);
      }

      // Garantir que wins não seja maior que totalGames
      if (sanitized.stats.wins > sanitized.stats.totalGames) {
        sanitized.stats.totalGames = sanitized.stats.wins;
      }

      // Garantir que currentStreak não seja maior que bestStreak
      if (sanitized.stats.currentStreak > sanitized.stats.bestStreak) {
        sanitized.stats.bestStreak = sanitized.stats.currentStreak;
      }
    }

    // Adicionar timestamp de reparo
    sanitized.repairedAt = new Date().toISOString();
    sanitized.repairVersion = 1;

    console.log(`✅ Perfil reparado com sucesso para usuário: ${sanitized.username}`);
    return sanitized;

  } catch (error) {
    console.error('Erro ao reparar perfil corrompido:', error);
    return null;
  }
}

/**
 * Valida se um perfil tem a estrutura correta
 * @param {Object} profile - Perfil a ser validado
 * @returns {Object} - Resultado da validação
 */
export function validateProfile(profile) {
  const errors = [];
  
  if (!profile) {
    errors.push('Perfil é null ou undefined');
    return { isValid: false, errors };
  }

  // Verificar campos obrigatórios
  const requiredFields = ['id', 'username'];
  for (const field of requiredFields) {
    if (!profile[field]) {
      errors.push(`Campo obrigatório ausente: ${field}`);
    }
  }

  // Verificar tipos
  if (profile.level && typeof profile.level !== 'number') {
    errors.push('Level deve ser um número');
  }

  if (profile.xp && typeof profile.xp !== 'number') {
    errors.push('XP deve ser um número');
  }

  if (profile.stats && typeof profile.stats !== 'object') {
    errors.push('Stats deve ser um objeto');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
