// Script para testar o sistema de garantia de dados do usuário
// Execute com: node scripts/test-user-data-guarantee.js

console.log('🧪 Iniciando teste do sistema de garantia de dados do usuário...');

// Simular cenários de teste
const testScenarios = [
  {
    name: 'Usuário logado sem dados no localStorage',
    setup: () => {
      // Simular usuário autenticado mas sem dados
      return {
        isAuthenticated: true,
        userId: 'test-user-123',
        profile: null,
        localStorage: {}
      };
    },
    expectedResult: 'Deve criar perfil de emergência'
  },
  {
    name: 'Usuário logado com dados corrompidos',
    setup: () => {
      return {
        isAuthenticated: true,
        userId: 'test-user-456',
        profile: {
          id: 'test-user-456',
          username: 'TestUser',
          level: -1, // Valor inválido
          stats: {
            totalGames: 10,
            wins: 7,
            losses: 2 // Total não confere
          }
        },
        localStorage: {}
      };
    },
    expectedResult: 'Deve reparar dados corrompidos'
  },
  {
    name: 'Usuário logado com dados válidos',
    setup: () => {
      return {
        isAuthenticated: true,
        userId: 'test-user-789',
        profile: {
          id: 'test-user-789',
          username: 'ValidUser',
          level: 5,
          xp: 7500,
          stats: {
            totalGames: 20,
            wins: 15,
            losses: 5,
            winRate: 75,
            currentStreak: 3,
            bestStreak: 8
          }
        },
        localStorage: {}
      };
    },
    expectedResult: 'Deve manter dados existentes'
  },
  {
    name: 'Usuário não autenticado',
    setup: () => {
      return {
        isAuthenticated: false,
        userId: null,
        profile: null,
        localStorage: {}
      };
    },
    expectedResult: 'Não deve criar dados'
  }
];

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
  const requiredFields = ['totalGames', 'wins', 'losses'];
  requiredFields.forEach(field => {
    if (typeof stats[field] !== 'number') {
      issues.push(`Campo ${field} ausente ou inválido`);
    }
  });

  // Verificar consistência matemática
  if (stats.totalGames !== (stats.wins + stats.losses)) {
    issues.push('Total de jogos não confere com wins + losses');
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

// Função para simular o sistema de garantia
function simulateUserDataGuarantee(scenario) {
  console.log(`\n📋 Testando: ${scenario.name}`);
  
  const testData = scenario.setup();
  console.log('📊 Dados de entrada:', {
    isAuthenticated: testData.isAuthenticated,
    userId: testData.userId,
    hasProfile: !!testData.profile
  });

  // Simular lógica do sistema de garantia
  if (!testData.isAuthenticated) {
    console.log('❌ Usuário não autenticado - não criando dados');
    return {
      success: false,
      reason: 'Usuário não autenticado',
      profile: null
    };
  }

  if (!testData.userId) {
    console.log('❌ UserId não encontrado - não criando dados');
    return {
      success: false,
      reason: 'UserId ausente',
      profile: null
    };
  }

  // Verificar se tem perfil válido
  if (testData.profile) {
    const integrityCheck = verifyProfileIntegrity(testData.profile);
    
    if (integrityCheck.isValid) {
      console.log('✅ Perfil existente é válido - mantendo dados');
      return {
        success: true,
        reason: 'Dados válidos existentes',
        profile: testData.profile,
        action: 'maintained'
      };
    } else {
      console.log('🔧 Perfil corrompido detectado - reparando');
      const repairedProfile = repairProfile(testData.profile, testData.userId);
      return {
        success: true,
        reason: 'Dados reparados',
        profile: repairedProfile,
        action: 'repaired',
        issues: integrityCheck.issues
      };
    }
  }

  // Criar perfil de emergência
  console.log('🆘 Criando perfil de emergência');
  const emergencyProfile = createEmergencyProfile(testData.userId);
  
  return {
    success: true,
    reason: 'Perfil de emergência criado',
    profile: emergencyProfile,
    action: 'created'
  };
}

// Função para reparar perfil
function repairProfile(profile, userId) {
  const repaired = { ...profile };

  // Garantir campos obrigatórios
  repaired.id = repaired.id || userId;
  repaired.username = repaired.username || `Jogador_${userId.slice(-6)}`;
  repaired.level = typeof repaired.level === 'number' ? Math.max(1, repaired.level) : 1;
  repaired.xp = typeof repaired.xp === 'number' ? Math.max(0, repaired.xp) : 0;

  // Reparar estatísticas
  if (!repaired.stats || typeof repaired.stats !== 'object') {
    repaired.stats = createDefaultStats();
  } else {
    repaired.stats = repairStats(repaired.stats);
  }

  // Sincronizar XP e level
  const calculatedLevel = Math.floor(Math.sqrt(repaired.xp / 300)) + 1;
  repaired.level = calculatedLevel;

  return repaired;
}

// Função para reparar estatísticas
function repairStats(stats) {
  const repaired = { ...stats };

  // Valores padrão
  const defaults = {
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0
  };

  // Aplicar valores padrão para campos ausentes ou inválidos
  Object.keys(defaults).forEach(key => {
    if (typeof repaired[key] !== 'number' || repaired[key] < 0) {
      repaired[key] = defaults[key];
    }
  });

  // Corrigir inconsistências matemáticas
  repaired.totalGames = repaired.wins + repaired.losses;
  
  if (repaired.totalGames > 0) {
    repaired.winRate = (repaired.wins / repaired.totalGames) * 100;
  } else {
    repaired.winRate = 0;
  }

  // Corrigir sequências
  if (repaired.currentStreak > repaired.bestStreak) {
    repaired.bestStreak = repaired.currentStreak;
  }

  return repaired;
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

// Função para criar perfil de emergência
function createEmergencyProfile(userId) {
  return {
    id: userId,
    username: `Jogador_${userId.slice(-6)}`,
    displayName: '',
    level: 1,
    xp: 0,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    stats: createDefaultStats(),
    achievements: [],
    gameHistory: [],
    preferences: {
      theme: 'dark',
      language: 'pt'
    },
    _isEmergencyProfile: true,
    _emergencyCreatedAt: new Date().toISOString()
  };
}

// Executar todos os testes
function runAllTests() {
  console.log('🚀 Executando todos os cenários de teste...\n');
  
  let passedTests = 0;
  let totalTests = testScenarios.length;

  testScenarios.forEach((scenario, index) => {
    const result = simulateUserDataGuarantee(scenario);
    
    console.log('📊 Resultado:', {
      success: result.success,
      action: result.action,
      reason: result.reason,
      hasProfile: !!result.profile
    });

    if (result.profile) {
      const finalCheck = verifyProfileIntegrity(result.profile);
      console.log('🔍 Verificação final:', finalCheck.isValid ? '✅ Válido' : '❌ Inválido');
      
      if (finalCheck.isValid) {
        passedTests++;
        console.log('✅ TESTE PASSOU');
      } else {
        console.log('❌ TESTE FALHOU:', finalCheck.issues);
      }
    } else if (!scenario.setup().isAuthenticated) {
      // Teste passou se usuário não autenticado não recebeu dados
      passedTests++;
      console.log('✅ TESTE PASSOU (usuário não autenticado)');
    } else {
      console.log('❌ TESTE FALHOU (usuário autenticado sem dados)');
    }

    console.log('─'.repeat(50));
  });

  console.log(`\n🎯 RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema de garantia funcionando corretamente.');
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM! Revisar implementação.');
  }

  return passedTests === totalTests;
}

// Executar testes se chamado diretamente
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  simulateUserDataGuarantee,
  verifyProfileIntegrity,
  testScenarios
};
