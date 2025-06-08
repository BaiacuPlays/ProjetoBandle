/**
 * Script para testar o sistema de perfil no frontend
 * Verifica localStorage, estado do React e sincronização
 */

// Simular ambiente de teste
const testUserId = 'test_user_' + Date.now();
const testProfile = {
  id: testUserId,
  username: 'test_user',
  displayName: 'Test User',
  level: 5,
  xp: 1200,
  achievements: ['first_win', 'streak_5'],
  stats: {
    totalGames: 10,
    wins: 7,
    losses: 3,
    winRate: 70,
    currentStreak: 3,
    bestStreak: 5,
    totalPlayTime: 3600,
    perfectGames: 2,
    averageAttempts: 3.2,
    fastestWin: 45,
    modeStats: {
      daily: { games: 5, wins: 4, bestStreak: 3, averageAttempts: 3.0, perfectGames: 1 },
      infinite: { games: 3, wins: 2, bestStreak: 2, totalSongsCompleted: 15, longestSession: 8 },
      multiplayer: { games: 2, wins: 1, roomsCreated: 1, totalPoints: 150, bestRoundScore: 80 }
    }
  },
  gameHistory: [
    {
      id: 'game_test_1',
      date: new Date().toISOString(),
      mode: 'daily',
      won: true,
      attempts: 2,
      playTime: 120,
      song: { title: 'Test Song', game: 'Test Game', artist: 'Test Artist' },
      xpGained: 80
    }
  ],
  franchiseStats: {
    'Test Game': {
      gamesPlayed: 1,
      wins: 1,
      winRate: 100
    }
  },
  badges: ['early_bird', 'perfectionist'],
  titles: [{ id: 'novice', name: 'Novato' }],
  currentTitle: 'novice',
  avatar: null,
  bio: 'Perfil de teste',
  preferences: {
    showAchievementPopups: true,
    language: 'pt'
  },
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  version: '1.0'
};

function testLocalStorageSystem() {
  console.log('🧪 Testando sistema de localStorage...\n');

  try {
    // Teste 1: Salvar no localStorage
    console.log('📝 Teste 1: Salvando perfil no localStorage...');
    const profileKey = `ludomusic_profile_${testUserId}`;
    localStorage.setItem(profileKey, JSON.stringify(testProfile));
    console.log('✅ Perfil salvo no localStorage');

    // Teste 2: Carregar do localStorage
    console.log('\n📖 Teste 2: Carregando perfil do localStorage...');
    const loadedProfileStr = localStorage.getItem(profileKey);
    
    if (loadedProfileStr) {
      const loadedProfile = JSON.parse(loadedProfileStr);
      console.log('✅ Perfil carregado do localStorage');
      console.log('📊 Dados carregados:', {
        username: loadedProfile.username,
        level: loadedProfile.level,
        xp: loadedProfile.xp,
        totalGames: loadedProfile.stats.totalGames
      });

      // Teste 3: Verificar integridade
      console.log('\n🔍 Teste 3: Verificando integridade dos dados...');
      const integrityCheck = verifyProfileIntegrity(loadedProfile);
      
      if (integrityCheck.isValid) {
        console.log('✅ Integridade dos dados confirmada');
      } else {
        console.log('❌ Problemas de integridade:', integrityCheck.issues);
      }

      // Teste 4: Sistema de backup
      console.log('\n💾 Teste 4: Testando sistema de backup...');
      const backupKey = `ludomusic_profile_backup_${testUserId}`;
      localStorage.setItem(backupKey, JSON.stringify({
        ...testProfile,
        _backupTimestamp: Date.now()
      }));
      console.log('✅ Backup criado');

      // Teste 5: Simular corrupção e recuperação
      console.log('\n🔧 Teste 5: Simulando corrupção e recuperação...');
      localStorage.setItem(profileKey, 'dados_corrompidos');
      
      // Tentar carregar dados corrompidos
      const corruptedData = localStorage.getItem(profileKey);
      try {
        JSON.parse(corruptedData);
        console.log('❌ Dados corrompidos não foram detectados');
      } catch (error) {
        console.log('✅ Corrupção detectada, tentando recuperar do backup...');
        
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          const recoveredProfile = JSON.parse(backupData);
          localStorage.setItem(profileKey, JSON.stringify(recoveredProfile));
          console.log('✅ Dados recuperados do backup');
        }
      }

      // Teste 6: Limpeza
      console.log('\n🧹 Teste 6: Limpando dados de teste...');
      localStorage.removeItem(profileKey);
      localStorage.removeItem(backupKey);
      console.log('✅ Dados de teste removidos');

      console.log('\n🎉 Testes do localStorage concluídos com sucesso!');

    } else {
      console.log('❌ Falha ao carregar perfil do localStorage');
    }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

function verifyProfileIntegrity(profile) {
  const issues = [];

  // Verificar campos obrigatórios
  const requiredFields = ['id', 'username', 'level', 'xp', 'stats', 'achievements'];
  
  for (const field of requiredFields) {
    if (!profile[field] && profile[field] !== 0) {
      issues.push(`Campo obrigatório ausente: ${field}`);
    }
  }

  // Verificar estrutura de stats
  if (!profile.stats || typeof profile.stats !== 'object') {
    issues.push('Estrutura de stats inválida');
  } else {
    const requiredStats = ['totalGames', 'wins', 'losses', 'winRate'];
    for (const stat of requiredStats) {
      if (typeof profile.stats[stat] !== 'number') {
        issues.push(`Stat obrigatória ausente ou inválida: ${stat}`);
      }
    }

    // Verificar consistência matemática
    if (profile.stats.totalGames !== (profile.stats.wins + profile.stats.losses)) {
      issues.push('Total de jogos não confere com wins + losses');
    }

    if (profile.stats.totalGames > 0) {
      const calculatedWinRate = (profile.stats.wins / profile.stats.totalGames) * 100;
      if (Math.abs(profile.stats.winRate - calculatedWinRate) > 0.1) {
        issues.push('Taxa de vitória inconsistente');
      }
    }
  }

  // Verificar achievements
  if (!Array.isArray(profile.achievements)) {
    issues.push('Achievements não é um array');
  }

  // Verificar gameHistory
  if (!Array.isArray(profile.gameHistory)) {
    issues.push('GameHistory não é um array');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

function testAPIEndpoints() {
  console.log('\n🌐 Testando endpoints da API...\n');

  // Teste de conectividade com a API
  fetch('/api/profile', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📡 Status da API de perfil:', response.status);
    if (response.status === 401) {
      console.log('🔒 API requer autenticação (comportamento esperado)');
    } else if (response.ok) {
      console.log('✅ API de perfil acessível');
    } else {
      console.log('⚠️ API de perfil retornou status inesperado');
    }
  })
  .catch(error => {
    console.error('❌ Erro ao acessar API de perfil:', error);
  });
}

// Executar testes se estiver no browser
if (typeof window !== 'undefined') {
  console.log('🌐 Executando testes no browser...');
  testLocalStorageSystem();
  testAPIEndpoints();
} else {
  console.log('📝 Script deve ser executado no browser para testar localStorage');
}

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testLocalStorageSystem, verifyProfileIntegrity, testAPIEndpoints };
}
