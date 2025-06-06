// API para reparar estatísticas corrompidas
import { safeKV } from '../../utils/kv-fix';
import { verifyAuthentication } from '../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const authResult = verifyAuthentication(req);
    if (!authResult.isValid) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const userId = authResult.userId;
    console.log('🔧 [REPAIR] Iniciando reparo de estatísticas para userId:', userId);

    // Buscar perfil atual
    const profileKey = `user:${userId}`;
    const currentProfile = await safeKV.get(profileKey);

    if (!currentProfile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Criar backup antes do reparo
    const backupKey = `backup:${userId}:${Date.now()}`;
    await safeKV.set(backupKey, currentProfile, { ex: 7 * 24 * 60 * 60 }); // Expira em 7 dias
    console.log('💾 [REPAIR] Backup criado:', backupKey);

    // Verificar integridade atual
    const integrityCheck = verifyProfileIntegrity(currentProfile);
    console.log('🔍 [REPAIR] Problemas encontrados:', integrityCheck.issues);

    // Reparar perfil
    const repairedProfile = repairProfile(currentProfile, userId);
    
    // Verificar se o reparo foi bem-sucedido
    const postRepairCheck = verifyProfileIntegrity(repairedProfile);
    
    if (!postRepairCheck.isValid) {
      console.error('❌ [REPAIR] Reparo falhou, problemas persistem:', postRepairCheck.issues);
      return res.status(500).json({ 
        error: 'Falha no reparo',
        issues: postRepairCheck.issues,
        backupKey
      });
    }

    // Salvar perfil reparado
    await safeKV.set(profileKey, repairedProfile);
    console.log('✅ [REPAIR] Perfil reparado salvo');

    // Também reparar estatísticas diárias se existirem
    const dailyStatsKey = `stats:daily:${userId}`;
    const dailyStats = await safeKV.get(dailyStatsKey);
    
    if (dailyStats) {
      const repairedDailyStats = repairDailyStats(dailyStats);
      await safeKV.set(dailyStatsKey, repairedDailyStats);
      console.log('✅ [REPAIR] Estatísticas diárias reparadas');
    }

    const repairReport = {
      timestamp: new Date().toISOString(),
      userId,
      backupKey,
      issuesFound: integrityCheck.issues,
      issuesFixed: integrityCheck.issues.length - postRepairCheck.issues.length,
      remainingIssues: postRepairCheck.issues,
      success: postRepairCheck.isValid,
      repairedProfile: {
        username: repairedProfile.username,
        level: repairedProfile.level,
        xp: repairedProfile.xp,
        totalGames: repairedProfile.stats?.totalGames,
        wins: repairedProfile.stats?.wins,
        losses: repairedProfile.stats?.losses,
        winRate: repairedProfile.stats?.winRate
      }
    };

    console.log('📊 [REPAIR] Relatório de reparo:', repairReport);
    return res.status(200).json(repairReport);

  } catch (error) {
    console.error('❌ [REPAIR] Erro durante reparo:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}

// Função para verificar integridade do perfil
function verifyProfileIntegrity(profile) {
  const issues = [];
  
  if (!profile) {
    return { isValid: false, issues: ['Perfil não existe'] };
  }

  // Verificar campos obrigatórios
  const requiredFields = ['id', 'username', 'level', 'xp', 'stats'];
  requiredFields.forEach(field => {
    if (!profile[field] && profile[field] !== 0) {
      issues.push(`Campo obrigatório ausente: ${field}`);
    }
  });

  // Verificar tipos
  if (typeof profile.level !== 'number' || profile.level < 1) {
    issues.push('Level inválido');
  }

  if (typeof profile.xp !== 'number' || profile.xp < 0) {
    issues.push('XP inválido');
  }

  // Verificar estrutura das estatísticas
  if (profile.stats) {
    const statsCheck = verifyStatsIntegrity(profile.stats);
    if (!statsCheck.isValid) {
      issues.push(...statsCheck.issues.map(issue => `Stats: ${issue}`));
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

// Função para verificar integridade das estatísticas
function verifyStatsIntegrity(stats) {
  const issues = [];
  
  // Verificar se campos obrigatórios existem
  const requiredFields = ['totalGames', 'wins', 'losses', 'winRate', 'currentStreak', 'bestStreak'];
  requiredFields.forEach(field => {
    if (typeof stats[field] !== 'number') {
      issues.push(`Campo ${field} ausente ou inválido`);
    }
  });

  // Verificar consistência matemática
  if (stats.totalGames !== (stats.wins + stats.losses)) {
    issues.push('Total de jogos não confere com wins + losses');
  }

  if (stats.totalGames > 0) {
    const calculatedWinRate = (stats.wins / stats.totalGames) * 100;
    if (Math.abs(stats.winRate - calculatedWinRate) > 0.1) {
      issues.push('Taxa de vitória inconsistente');
    }
  }

  if (stats.currentStreak > stats.bestStreak) {
    issues.push('Sequência atual maior que a melhor sequência');
  }

  // Verificar valores negativos
  requiredFields.forEach(field => {
    if (stats[field] < 0) {
      issues.push(`Campo ${field} com valor negativo`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues
  };
}

// Função para reparar perfil
function repairProfile(profile, userId) {
  const repairedProfile = { ...profile };

  // Garantir campos obrigatórios
  repairedProfile.id = repairedProfile.id || userId;
  repairedProfile.username = repairedProfile.username || `Jogador_${userId.slice(-6)}`;
  repairedProfile.level = typeof repairedProfile.level === 'number' ? Math.max(1, repairedProfile.level) : 1;
  repairedProfile.xp = typeof repairedProfile.xp === 'number' ? Math.max(0, repairedProfile.xp) : 0;
  repairedProfile.lastUpdated = new Date().toISOString();

  // Reparar estatísticas
  if (!repairedProfile.stats || typeof repairedProfile.stats !== 'object') {
    repairedProfile.stats = createDefaultStats();
  } else {
    repairedProfile.stats = repairStats(repairedProfile.stats);
  }

  // Sincronizar XP e level
  const calculatedLevel = Math.floor(Math.sqrt(repairedProfile.xp / 300)) + 1;
  repairedProfile.level = calculatedLevel;
  repairedProfile.stats.xp = repairedProfile.xp;
  repairedProfile.stats.level = repairedProfile.level;

  // Garantir outras estruturas
  repairedProfile.achievements = repairedProfile.achievements || [];
  repairedProfile.gameHistory = repairedProfile.gameHistory || [];
  repairedProfile.franchiseStats = repairedProfile.franchiseStats || {};
  repairedProfile.badges = repairedProfile.badges || [];
  repairedProfile.titles = repairedProfile.titles || [];

  return repairedProfile;
}

// Função para reparar estatísticas
function repairStats(stats) {
  const repairedStats = { ...stats };

  // Valores padrão
  const defaults = {
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    perfectGames: 0,
    averageAttempts: 0,
    totalPlayTime: 0,
    fastestWin: null,
    longestSession: 0
  };

  // Aplicar valores padrão para campos ausentes ou inválidos
  Object.keys(defaults).forEach(key => {
    if (typeof repairedStats[key] !== 'number' && key !== 'fastestWin') {
      repairedStats[key] = defaults[key];
    } else if (typeof repairedStats[key] === 'number' && repairedStats[key] < 0) {
      repairedStats[key] = defaults[key];
    }
  });

  // Corrigir inconsistências matemáticas
  repairedStats.totalGames = repairedStats.wins + repairedStats.losses;
  
  if (repairedStats.totalGames > 0) {
    repairedStats.winRate = (repairedStats.wins / repairedStats.totalGames) * 100;
  } else {
    repairedStats.winRate = 0;
  }

  // Corrigir sequências
  if (repairedStats.currentStreak > repairedStats.bestStreak) {
    repairedStats.bestStreak = repairedStats.currentStreak;
  }

  // Garantir modeStats
  if (!repairedStats.modeStats || typeof repairedStats.modeStats !== 'object') {
    repairedStats.modeStats = {
      daily: { games: 0, wins: 0, bestStreak: 0, averageAttempts: 0, perfectGames: 0 },
      infinite: { games: 0, wins: 0, bestStreak: 0, totalSongsCompleted: 0, longestSession: 0 },
      multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0 }
    };
  }

  return repairedStats;
}

// Função para criar estatísticas padrão
function createDefaultStats() {
  return {
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    perfectGames: 0,
    averageAttempts: 0,
    totalPlayTime: 0,
    fastestWin: null,
    longestSession: 0,
    xp: 0,
    level: 1,
    modeStats: {
      daily: { games: 0, wins: 0, bestStreak: 0, averageAttempts: 0, perfectGames: 0 },
      infinite: { games: 0, wins: 0, bestStreak: 0, totalSongsCompleted: 0, longestSession: 0 },
      multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0 }
    }
  };
}

// Função para reparar estatísticas diárias
function repairDailyStats(dailyStats) {
  const repaired = { ...dailyStats };
  
  repaired.totalGames = Math.max(0, repaired.totalGames || 0);
  repaired.wins = Math.max(0, repaired.wins || 0);
  repaired.losses = Math.max(0, repaired.losses || 0);
  
  // Corrigir total
  if (repaired.totalGames !== (repaired.wins + repaired.losses)) {
    repaired.totalGames = repaired.wins + repaired.losses;
  }
  
  // Recalcular percentuais
  if (repaired.totalGames > 0) {
    repaired.winPercentage = Math.round((repaired.wins / repaired.totalGames) * 100);
  } else {
    repaired.winPercentage = 0;
  }
  
  return repaired;
}
