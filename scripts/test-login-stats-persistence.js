/**
 * Script para testar a persistência das estatísticas durante o login
 * Verifica se os dados são mantidos corretamente durante login/logout/relogin
 */

// Simular dados de teste
const testUser = {
  username: 'test_stats_user',
  password: 'test123',
  displayName: 'Test Stats User'
};

const testStats = {
  totalGames: 25,
  wins: 18,
  losses: 7,
  winRate: 72,
  currentStreak: 5,
  bestStreak: 12,
  totalPlayTime: 7200,
  perfectGames: 8,
  averageAttempts: 2.8,
  fastestWin: 35,
  modeStats: {
    daily: { games: 15, wins: 12, bestStreak: 8, averageAttempts: 2.5, perfectGames: 5 },
    infinite: { games: 8, wins: 5, bestStreak: 3, totalSongsCompleted: 45, longestSession: 12 },
    multiplayer: { games: 2, wins: 1, roomsCreated: 1, totalPoints: 180, bestRoundScore: 95 }
  }
};

async function testLoginStatsPersistence() {
  console.log('🧪 Iniciando teste de persistência de estatísticas durante login...\n');

  try {
    // Fase 1: Preparar dados de teste
    console.log('📋 Fase 1: Preparando dados de teste...');
    const userId = `auth_${testUser.username}`;
    const profileKey = `ludomusic_profile_${userId}`;
    
    // Criar perfil de teste com estatísticas
    const testProfile = {
      id: userId,
      username: testUser.username,
      displayName: testUser.displayName,
      level: 8,
      xp: 2400,
      achievements: ['first_win', 'streak_5', 'perfectionist'],
      stats: testStats,
      gameHistory: [
        {
          id: 'game_1',
          date: new Date().toISOString(),
          mode: 'daily',
          won: true,
          attempts: 2,
          playTime: 120,
          xpGained: 80
        },
        {
          id: 'game_2',
          date: new Date(Date.now() - 86400000).toISOString(),
          mode: 'daily',
          won: true,
          attempts: 1,
          playTime: 45,
          xpGained: 100
        }
      ],
      franchiseStats: {
        'Test Game': { gamesPlayed: 5, wins: 4, winRate: 80 }
      },
      badges: ['early_bird', 'perfectionist'],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      version: '1.0'
    };

    // Salvar perfil inicial
    localStorage.setItem(profileKey, JSON.stringify(testProfile));
    console.log('✅ Perfil de teste criado com estatísticas');
    console.log(`📊 Stats iniciais: ${testStats.totalGames} jogos, ${testStats.wins} vitórias`);

    // Fase 2: Simular processo de login
    console.log('\n🔑 Fase 2: Simulando processo de login...');
    
    // Simular dados de autenticação
    const sessionToken = 'test_session_' + Date.now();
    const userData = {
      username: testUser.username,
      displayName: testUser.displayName,
      email: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    // Salvar dados de autenticação
    localStorage.setItem('ludomusic_session_token', sessionToken);
    localStorage.setItem('ludomusic_user_data', JSON.stringify(userData));
    console.log('✅ Dados de autenticação salvos');

    // Verificar se o perfil ainda existe após "login"
    const profileAfterLogin = localStorage.getItem(profileKey);
    if (profileAfterLogin) {
      const profile = JSON.parse(profileAfterLogin);
      console.log('✅ Perfil mantido após login');
      console.log(`📊 Stats após login: ${profile.stats.totalGames} jogos, ${profile.stats.wins} vitórias`);
      
      // Verificar integridade das estatísticas
      if (profile.stats.totalGames === testStats.totalGames && 
          profile.stats.wins === testStats.wins) {
        console.log('✅ Estatísticas mantidas corretamente');
      } else {
        console.log('❌ Estatísticas alteradas durante o login!');
        console.log('Esperado:', testStats);
        console.log('Encontrado:', profile.stats);
      }
    } else {
      console.log('❌ Perfil perdido durante o login!');
    }

    // Fase 3: Simular atualização de estatísticas
    console.log('\n🎮 Fase 3: Simulando atualização de estatísticas...');
    
    const currentProfile = JSON.parse(localStorage.getItem(profileKey));
    if (currentProfile) {
      // Simular um jogo ganho
      currentProfile.stats.totalGames += 1;
      currentProfile.stats.wins += 1;
      currentProfile.stats.winRate = (currentProfile.stats.wins / currentProfile.stats.totalGames) * 100;
      currentProfile.stats.currentStreak += 1;
      currentProfile.xp += 80;
      currentProfile.lastUpdated = new Date().toISOString();

      // Adicionar ao histórico
      currentProfile.gameHistory.unshift({
        id: 'game_new',
        date: new Date().toISOString(),
        mode: 'daily',
        won: true,
        attempts: 3,
        playTime: 90,
        xpGained: 80
      });

      localStorage.setItem(profileKey, JSON.stringify(currentProfile));
      console.log('✅ Estatísticas atualizadas');
      console.log(`📊 Novas stats: ${currentProfile.stats.totalGames} jogos, ${currentProfile.stats.wins} vitórias`);
    }

    // Fase 4: Simular logout
    console.log('\n🚪 Fase 4: Simulando logout...');
    
    // Remover dados de autenticação
    localStorage.removeItem('ludomusic_session_token');
    localStorage.removeItem('ludomusic_user_data');
    console.log('✅ Dados de autenticação removidos');

    // Verificar se o perfil ainda existe após logout
    const profileAfterLogout = localStorage.getItem(profileKey);
    if (profileAfterLogout) {
      const profile = JSON.parse(profileAfterLogout);
      console.log('✅ Perfil mantido após logout');
      console.log(`📊 Stats após logout: ${profile.stats.totalGames} jogos, ${profile.stats.wins} vitórias`);
    } else {
      console.log('❌ Perfil perdido durante o logout!');
    }

    // Fase 5: Simular relogin
    console.log('\n🔄 Fase 5: Simulando relogin...');
    
    // Simular novo login
    const newSessionToken = 'test_session_relogin_' + Date.now();
    localStorage.setItem('ludomusic_session_token', newSessionToken);
    localStorage.setItem('ludomusic_user_data', JSON.stringify(userData));
    console.log('✅ Relogin simulado');

    // Verificar se o perfil e estatísticas foram mantidos
    const profileAfterRelogin = localStorage.getItem(profileKey);
    if (profileAfterRelogin) {
      const profile = JSON.parse(profileAfterRelogin);
      console.log('✅ Perfil recuperado após relogin');
      console.log(`📊 Stats após relogin: ${profile.stats.totalGames} jogos, ${profile.stats.wins} vitórias`);
      
      // Verificar se as atualizações foram mantidas
      if (profile.stats.totalGames === testStats.totalGames + 1) {
        console.log('✅ Atualizações de estatísticas mantidas');
      } else {
        console.log('❌ Atualizações de estatísticas perdidas!');
      }
    } else {
      console.log('❌ Perfil não encontrado após relogin!');
    }

    // Fase 6: Verificar integridade final
    console.log('\n🔍 Fase 6: Verificação final de integridade...');
    
    const finalProfile = JSON.parse(localStorage.getItem(profileKey));
    if (finalProfile) {
      const integrityCheck = verifyStatsIntegrity(finalProfile.stats);
      if (integrityCheck.isValid) {
        console.log('✅ Integridade das estatísticas confirmada');
      } else {
        console.log('❌ Problemas de integridade encontrados:', integrityCheck.issues);
      }

      // Verificar histórico de jogos
      if (finalProfile.gameHistory && finalProfile.gameHistory.length > 0) {
        console.log(`✅ Histórico mantido: ${finalProfile.gameHistory.length} jogos`);
      } else {
        console.log('❌ Histórico de jogos perdido!');
      }
    }

    // Fase 7: Limpeza
    console.log('\n🧹 Fase 7: Limpando dados de teste...');
    localStorage.removeItem(profileKey);
    localStorage.removeItem('ludomusic_session_token');
    localStorage.removeItem('ludomusic_user_data');
    console.log('✅ Dados de teste removidos');

    console.log('\n🎉 Teste de persistência de estatísticas concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

function verifyStatsIntegrity(stats) {
  const issues = [];

  // Verificar campos obrigatórios
  const requiredFields = ['totalGames', 'wins', 'losses', 'winRate'];
  for (const field of requiredFields) {
    if (typeof stats[field] !== 'number') {
      issues.push(`Campo ${field} ausente ou inválido`);
    }
  }

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

// Executar teste se chamado diretamente
if (require.main === module) {
  testLoginStatsPersistence().catch(console.error);
}

module.exports = { testLoginStatsPersistence, verifyStatsIntegrity };
