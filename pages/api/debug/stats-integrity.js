// API para diagnóstico de integridade das estatísticas
import { safeKV } from '../../../utils/kv-fix';
import { verifyAuthentication } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const authResult = verifyAuthentication(req);
    if (!authResult.isValid) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const userId = authResult.userId;
    console.log('🔍 [STATS-DEBUG] Iniciando diagnóstico para userId:', userId);

    // Buscar perfil do usuário
    const profileKey = `user:${userId}`;
    const userProfile = await safeKV.get(profileKey);

    if (!userProfile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Buscar estatísticas diárias
    const dailyStatsKey = `stats:daily:${userId}`;
    const dailyStats = await safeKV.get(dailyStatsKey);

    // Verificar integridade do perfil
    const profileIntegrity = verifyProfileIntegrity(userProfile);
    
    // Verificar integridade das estatísticas
    const statsIntegrity = userProfile.stats ? verifyStatsIntegrity(userProfile.stats) : { isValid: false, issues: ['Stats não encontradas'] };

    // Verificar consistência entre perfil e estatísticas diárias
    const consistencyCheck = checkConsistency(userProfile, dailyStats);

    // Buscar backups no localStorage (simulado)
    const backupInfo = await getBackupInfo(userId);

    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      userId,
      profile: {
        exists: !!userProfile,
        username: userProfile?.username,
        level: userProfile?.level,
        xp: userProfile?.xp,
        lastUpdated: userProfile?.lastUpdated
      },
      profileIntegrity,
      statsIntegrity,
      consistencyCheck,
      dailyStats: {
        exists: !!dailyStats,
        totalGames: dailyStats?.totalGames,
        wins: dailyStats?.wins,
        losses: dailyStats?.losses
      },
      backupInfo,
      recommendations: generateRecommendations(profileIntegrity, statsIntegrity, consistencyCheck)
    };

    console.log('📊 [STATS-DEBUG] Relatório gerado:', diagnosticReport);
    return res.status(200).json(diagnosticReport);

  } catch (error) {
    console.error('❌ [STATS-DEBUG] Erro no diagnóstico:', error);
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

// Função para verificar consistência entre perfil e estatísticas diárias
function checkConsistency(profile, dailyStats) {
  const issues = [];

  if (!profile || !profile.stats) {
    issues.push('Perfil ou estatísticas do perfil ausentes');
    return { isValid: false, issues };
  }

  if (dailyStats) {
    // Verificar se as estatísticas diárias fazem sentido
    if (dailyStats.totalGames !== (dailyStats.wins + dailyStats.losses)) {
      issues.push('Estatísticas diárias inconsistentes');
    }
  }

  // Verificar se XP e level estão sincronizados
  const expectedLevel = Math.floor(Math.sqrt(profile.xp / 300)) + 1;
  if (profile.level !== expectedLevel) {
    issues.push(`Level inconsistente: atual ${profile.level}, esperado ${expectedLevel} para ${profile.xp} XP`);
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

// Função para obter informações de backup (simulada)
async function getBackupInfo(userId) {
  // Em um ambiente real, isso verificaria o localStorage do cliente
  // Por enquanto, retornamos informações básicas
  return {
    hasBackups: false,
    lastBackup: null,
    backupCount: 0,
    note: 'Informações de backup não disponíveis no servidor'
  };
}

// Função para gerar recomendações
function generateRecommendations(profileIntegrity, statsIntegrity, consistencyCheck) {
  const recommendations = [];

  if (!profileIntegrity.isValid) {
    recommendations.push('Reparar estrutura do perfil');
  }

  if (!statsIntegrity.isValid) {
    recommendations.push('Reparar estatísticas corrompidas');
  }

  if (!consistencyCheck.isValid) {
    recommendations.push('Sincronizar dados inconsistentes');
  }

  if (recommendations.length === 0) {
    recommendations.push('Perfil está íntegro');
  } else {
    recommendations.push('Executar verificação de integridade no frontend');
    recommendations.push('Criar backup antes de qualquer reparo');
  }

  return recommendations;
}
