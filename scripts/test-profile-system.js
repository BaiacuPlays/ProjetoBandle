/**
 * Script para testar e verificar o sistema de perfil
 * Verifica se os dados estão sendo salvos e carregados corretamente
 */

const { kv } = require('@vercel/kv');

// Simular dados de teste
const testUserId = 'test_profile_verification_' + Date.now();
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

async function testProfileSystem() {
  console.log('🧪 Iniciando teste do sistema de perfil...\n');

  try {
    // Teste 1: Salvar perfil no KV
    console.log('📝 Teste 1: Salvando perfil no Vercel KV...');
    const profileKey = `profile:${testUserId}`;

    await kv.set(profileKey, testProfile);
    console.log('✅ Perfil salvo com sucesso');

    // Teste 2: Carregar perfil do KV
    console.log('\n📖 Teste 2: Carregando perfil do Vercel KV...');
    const loadedProfile = await kv.get(profileKey);

    if (loadedProfile) {
      console.log('✅ Perfil carregado com sucesso');
      console.log('📊 Dados carregados:', {
        username: loadedProfile.username,
        level: loadedProfile.level,
        xp: loadedProfile.xp,
        totalGames: loadedProfile.stats.totalGames,
        achievements: loadedProfile.achievements.length
      });
    } else {
      console.log('❌ Falha ao carregar perfil');
      return;
    }

    // Teste 3: Verificar integridade dos dados
    console.log('\n🔍 Teste 3: Verificando integridade dos dados...');
    const dataIntegrityCheck = verifyDataIntegrity(loadedProfile, testProfile);

    if (dataIntegrityCheck.isValid) {
      console.log('✅ Integridade dos dados confirmada');
    } else {
      console.log('❌ Problemas de integridade encontrados:', dataIntegrityCheck.issues);
    }

    // Teste 4: Atualizar perfil
    console.log('\n🔄 Teste 4: Atualizando perfil...');
    const updatedProfile = {
      ...loadedProfile,
      xp: loadedProfile.xp + 100,
      level: loadedProfile.level + 1,
      stats: {
        ...loadedProfile.stats,
        totalGames: loadedProfile.stats.totalGames + 1,
        wins: loadedProfile.stats.wins + 1
      },
      lastUpdated: new Date().toISOString()
    };

    await kv.set(profileKey, updatedProfile);
    console.log('✅ Perfil atualizado com sucesso');

    // Teste 5: Verificar se a atualização foi persistida
    console.log('\n🔍 Teste 5: Verificando persistência da atualização...');
    const reloadedProfile = await kv.get(profileKey);

    if (reloadedProfile && reloadedProfile.xp === updatedProfile.xp) {
      console.log('✅ Atualização persistida corretamente');
      console.log('📊 Novos dados:', {
        xp: reloadedProfile.xp,
        level: reloadedProfile.level,
        totalGames: reloadedProfile.stats.totalGames
      });
    } else {
      console.log('❌ Falha na persistência da atualização');
    }

    // Teste 6: Limpeza
    console.log('\n🧹 Teste 6: Limpando dados de teste...');
    await kv.del(profileKey);
    console.log('✅ Dados de teste removidos');

    console.log('\n🎉 Todos os testes do sistema de perfil foram concluídos com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);

    // Tentar limpar dados de teste mesmo em caso de erro
    try {
      await kv.del(`profile:${testUserId}`);
      console.log('🧹 Dados de teste removidos após erro');
    } catch (cleanupError) {
      console.error('❌ Erro ao limpar dados de teste:', cleanupError);
    }
  }
}

function verifyDataIntegrity(loaded, original) {
  const issues = [];

  // Verificar campos obrigatórios
  const requiredFields = ['id', 'username', 'level', 'xp', 'stats', 'achievements'];

  for (const field of requiredFields) {
    if (!loaded[field] && loaded[field] !== 0) {
      issues.push(`Campo obrigatório ausente: ${field}`);
    }
  }

  // Verificar se os dados básicos coincidem
  if (loaded.username !== original.username) {
    issues.push('Username não coincide');
  }

  if (loaded.level !== original.level) {
    issues.push('Level não coincide');
  }

  if (loaded.xp !== original.xp) {
    issues.push('XP não coincide');
  }

  // Verificar estrutura de stats
  if (!loaded.stats || typeof loaded.stats !== 'object') {
    issues.push('Estrutura de stats inválida');
  } else {
    const requiredStats = ['totalGames', 'wins', 'losses', 'winRate'];
    for (const stat of requiredStats) {
      if (typeof loaded.stats[stat] !== 'number') {
        issues.push(`Stat obrigatória ausente ou inválida: ${stat}`);
      }
    }
  }

  // Verificar achievements
  if (!Array.isArray(loaded.achievements)) {
    issues.push('Achievements não é um array');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Teste específico para persistência de estatísticas durante login
 */
async function testLoginStatsPersistence() {
  console.log('🔐 Testando persistência de estatísticas durante login...\n');

  const testUsername = 'test_stats_user_' + Date.now();
  const testPassword = 'test123456';

  // Simular estatísticas antes do login
  const preLoginStats = {
    totalGames: 15,
    wins: 10,
    losses: 5,
    winRate: 66.67,
    currentStreak: 3,
    bestStreak: 7,
    totalPlayTime: 4500,
    perfectGames: 3,
    averageAttempts: 3.5,
    fastestWin: 35,
    modeStats: {
      daily: { games: 8, wins: 6, bestStreak: 4, averageAttempts: 3.2, perfectGames: 2 },
      infinite: { games: 5, wins: 3, bestStreak: 3, totalSongsCompleted: 25, longestSession: 12 },
      multiplayer: { games: 2, wins: 1, roomsCreated: 1, totalPoints: 180, bestRoundScore: 95 }
    }
  };

  try {
    console.log('📊 Estatísticas pré-login:', preLoginStats);

    // Teste 1: Simular dados no localStorage antes do login
    console.log('\n📝 Teste 1: Salvando estatísticas no localStorage...');
    const profileKey = `ludomusic_profile_auth_${testUsername}`;
    const testProfile = {
      id: `auth_${testUsername}`,
      username: testUsername,
      displayName: testUsername,
      level: 5,
      xp: 1500,
      achievements: ['first_win', 'streak_5'],
      stats: preLoginStats,
      gameHistory: [],
      franchiseStats: {},
      badges: [],
      titles: [],
      currentTitle: null,
      avatar: null,
      bio: '',
      preferences: {},
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      version: '1.0'
    };

    // Salvar no localStorage (simulando dados existentes)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(profileKey, JSON.stringify(testProfile));
      console.log('✅ Estatísticas salvas no localStorage');
    } else {
      console.log('⚠️ localStorage não disponível (ambiente Node.js)');
    }

    // Teste 2: Verificar se os dados persistem após "login"
    console.log('\n🔍 Teste 2: Verificando persistência após simulação de login...');

    if (typeof localStorage !== 'undefined') {
      const savedProfile = localStorage.getItem(profileKey);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        console.log('✅ Dados encontrados após login simulado');
        console.log('📊 Estatísticas recuperadas:', {
          totalGames: parsedProfile.stats.totalGames,
          wins: parsedProfile.stats.wins,
          winRate: parsedProfile.stats.winRate,
          currentStreak: parsedProfile.stats.currentStreak
        });

        // Verificar se as estatísticas coincidem
        const statsMatch =
          parsedProfile.stats.totalGames === preLoginStats.totalGames &&
          parsedProfile.stats.wins === preLoginStats.wins &&
          parsedProfile.stats.losses === preLoginStats.losses;

        if (statsMatch) {
          console.log('✅ Estatísticas mantidas corretamente');
        } else {
          console.log('❌ Estatísticas não coincidem!');
          console.log('Esperado:', preLoginStats);
          console.log('Encontrado:', parsedProfile.stats);
        }
      } else {
        console.log('❌ Dados não encontrados após login');
      }
    }

    // Teste 3: Simular atualização de estatísticas
    console.log('\n🎮 Teste 3: Simulando atualização de estatísticas...');

    if (typeof localStorage !== 'undefined') {
      const currentProfile = JSON.parse(localStorage.getItem(profileKey));
      if (currentProfile) {
        // Simular um jogo ganho
        currentProfile.stats.totalGames += 1;
        currentProfile.stats.wins += 1;
        currentProfile.stats.currentStreak += 1;
        currentProfile.stats.winRate = (currentProfile.stats.wins / currentProfile.stats.totalGames) * 100;
        currentProfile.lastUpdated = new Date().toISOString();

        localStorage.setItem(profileKey, JSON.stringify(currentProfile));
        console.log('✅ Estatísticas atualizadas');
        console.log('📊 Novas estatísticas:', {
          totalGames: currentProfile.stats.totalGames,
          wins: currentProfile.stats.wins,
          winRate: currentProfile.stats.winRate.toFixed(2) + '%'
        });
      }
    }

    // Teste 4: Verificar integridade após atualização
    console.log('\n🔍 Teste 4: Verificando integridade após atualização...');

    if (typeof localStorage !== 'undefined') {
      const updatedProfile = JSON.parse(localStorage.getItem(profileKey));
      if (updatedProfile) {
        const integrityCheck = verifyDataIntegrity(updatedProfile, testProfile);

        if (integrityCheck.isValid) {
          console.log('✅ Integridade mantida após atualização');
        } else {
          console.log('❌ Problemas de integridade detectados:', integrityCheck.issues);
        }
      }
    }

    // Teste 5: Limpeza
    console.log('\n🧹 Teste 5: Limpando dados de teste...');
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(profileKey);
      console.log('✅ Dados de teste removidos');
    }

    console.log('\n🎉 Teste de persistência de estatísticas concluído!');

  } catch (error) {
    console.error('❌ Erro durante teste de persistência:', error);
  }
}

/**
 * Teste de cenários problemáticos
 */
function testProblematicScenarios() {
  console.log('\n⚠️ Testando cenários problemáticos...\n');

  // Cenário 1: Dados corrompidos no localStorage
  console.log('🔧 Cenário 1: Dados corrompidos no localStorage');
  const corruptedKey = 'ludomusic_profile_corrupted_test';

  if (typeof localStorage !== 'undefined') {
    // Salvar dados corrompidos
    localStorage.setItem(corruptedKey, '{"invalid": json}');

    try {
      const data = localStorage.getItem(corruptedKey);
      JSON.parse(data);
      console.log('❌ Dados corrompidos não foram detectados');
    } catch (error) {
      console.log('✅ Corrupção detectada corretamente:', error.message);
    }

    localStorage.removeItem(corruptedKey);
  }

  // Cenário 2: Estatísticas inconsistentes
  console.log('\n🔧 Cenário 2: Estatísticas inconsistentes');
  const inconsistentStats = {
    totalGames: 10,
    wins: 8,
    losses: 5, // Inconsistente: 8 + 5 = 13, não 10
    winRate: 80
  };

  const issues = [];
  if (inconsistentStats.totalGames !== (inconsistentStats.wins + inconsistentStats.losses)) {
    issues.push('Total de jogos não confere com wins + losses');
  }

  if (issues.length > 0) {
    console.log('✅ Inconsistências detectadas:', issues);
  } else {
    console.log('❌ Inconsistências não foram detectadas');
  }

  console.log('\n✅ Teste de cenários problemáticos concluído!');
}

// Executar testes se chamado diretamente
if (require.main === module) {
  testProfileSystem().catch(console.error);
  testLoginStatsPersistence().catch(console.error);
  testProblematicScenarios();
}

module.exports = {
  testProfileSystem,
  verifyDataIntegrity,
  testLoginStatsPersistence,
  testProblematicScenarios
};
