// Script para testar a integridade das estatísticas
// Execute com: node scripts/test-stats-integrity.js

const { safeKV } = require('../utils/kv-fix');

async function testStatsIntegrity() {
  console.log('🔍 Iniciando teste de integridade das estatísticas...');
  
  try {
    // Simular dados corrompidos
    const corruptedProfile = {
      id: 'test-user-123',
      username: 'TestUser',
      level: -1, // Valor inválido
      xp: -100, // Valor inválido
      stats: {
        totalGames: 10,
        wins: 7,
        losses: 2, // Total não confere (7+2=9, não 10)
        winRate: 50, // Taxa incorreta (deveria ser 70%)
        currentStreak: 15,
        bestStreak: 10, // Inconsistente (current > best)
        perfectGames: -1 // Valor negativo
      }
    };

    console.log('📊 Dados corrompidos simulados:', corruptedProfile);

    // Testar verificação de integridade
    const integrityCheck = verifyProfileIntegrity(corruptedProfile);
    console.log('🔍 Resultado da verificação:', integrityCheck);

    // Testar reparo
    const repairedProfile = repairProfile(corruptedProfile, 'test-user-123');
    console.log('🔧 Perfil reparado:', repairedProfile);

    // Verificar se o reparo foi bem-sucedido
    const postRepairCheck = verifyProfileIntegrity(repairedProfile);
    console.log('✅ Verificação pós-reparo:', postRepairCheck);

    if (postRepairCheck.isValid) {
      console.log('✅ Teste de integridade passou! Reparo funcionou corretamente.');
    } else {
      console.log('❌ Teste de integridade falhou! Problemas persistem:', postRepairCheck.issues);
    }

    // Testar estatísticas diárias
    const corruptedDailyStats = {
      totalGames: 5,
      wins: 3,
      losses: 3, // Total não confere
      winPercentage: 80, // Percentual incorreto
      averageAttempts: -2 // Valor negativo
    };

    console.log('\n📊 Testando estatísticas diárias corrompidas:', corruptedDailyStats);
    
    const dailyStatsCheck = verifyDailyStatsIntegrity(corruptedDailyStats);
    console.log('🔍 Verificação de estatísticas diárias:', dailyStatsCheck);

    const repairedDailyStats = repairDailyStats(corruptedDailyStats);
    console.log('🔧 Estatísticas diárias reparadas:', repairedDailyStats);

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
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

// Função para verificar integridade das estatísticas diárias
function verifyDailyStatsIntegrity(dailyStats) {
  const issues = [];
  
  if (dailyStats.totalGames !== (dailyStats.wins + dailyStats.losses)) {
    issues.push('Total de jogos não confere com wins + losses');
  }

  if (dailyStats.totalGames > 0) {
    const calculatedPercentage = Math.round((dailyStats.wins / dailyStats.totalGames) * 100);
    if (Math.abs(dailyStats.winPercentage - calculatedPercentage) > 1) {
      issues.push('Percentual de vitória inconsistente');
    }
  }

  if (dailyStats.averageAttempts < 0) {
    issues.push('Média de tentativas negativa');
  }

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

  // Reparar estatísticas
  if (!repairedProfile.stats || typeof repairedProfile.stats !== 'object') {
    repairedProfile.stats = createDefaultStats();
  } else {
    repairedProfile.stats = repairStats(repairedProfile.stats);
  }

  // Sincronizar XP e level
  const calculatedLevel = Math.floor(Math.sqrt(repairedProfile.xp / 300)) + 1;
  repairedProfile.level = calculatedLevel;

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
    perfectGames: 0
  };

  // Aplicar valores padrão para campos ausentes ou inválidos
  Object.keys(defaults).forEach(key => {
    if (typeof repairedStats[key] !== 'number' || repairedStats[key] < 0) {
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
    fastestWin: null
  };
}

// Função para reparar estatísticas diárias
function repairDailyStats(dailyStats) {
  const repaired = { ...dailyStats };
  
  repaired.totalGames = Math.max(0, repaired.totalGames || 0);
  repaired.wins = Math.max(0, repaired.wins || 0);
  repaired.losses = Math.max(0, repaired.losses || 0);
  repaired.averageAttempts = Math.max(0, repaired.averageAttempts || 0);
  
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

// Executar teste se chamado diretamente
if (require.main === module) {
  testStatsIntegrity();
}

module.exports = {
  testStatsIntegrity,
  verifyProfileIntegrity,
  verifyStatsIntegrity,
  repairProfile,
  repairStats
};
