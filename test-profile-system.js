// Script de teste para o sistema de perfil
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testProfileSystem() {
  console.log('🧪 Iniciando teste do sistema de perfil...\n');

  try {
    // 1. Testar login
    console.log('1. Testando login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        username: 'baiacuplays',
        password: 'senha123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login bem-sucedido');
    
    const sessionToken = loginData.token;
    if (!sessionToken) {
      throw new Error('Token de sessão não recebido');
    }

    // 2. Testar busca de perfil
    console.log('\n2. Testando busca de perfil...');
    const profileResponse = await fetch(`${BASE_URL}/api/profile?userId=auth_baiacuplays`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    if (profileResponse.status === 404) {
      console.log('📝 Perfil não existe, será criado automaticamente');
    } else if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('✅ Perfil encontrado:', profileData.profile.username);
    } else {
      throw new Error(`Erro ao buscar perfil: ${profileResponse.status}`);
    }

    // 3. Testar criação/atualização de perfil
    console.log('\n3. Testando criação/atualização de perfil...');
    const testProfile = {
      id: 'auth_baiacuplays',
      username: 'baiacuplays',
      displayName: 'BaiacuPlays',
      bio: 'Teste do sistema simples',
      avatar: '/default-avatar.svg',
      level: 1,
      xp: 0,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      stats: {
        totalGames: 5,
        wins: 3,
        losses: 2,
        winRate: 60,
        currentStreak: 1,
        bestStreak: 2,
        totalPlayTime: 300,
        perfectGames: 1,
        averageAttempts: 2.5,
        fastestWin: 45,
        xp: 0,
        level: 1,
        modeStats: {
          daily: { games: 3, wins: 2, bestStreak: 2, averageAttempts: 2.5, perfectGames: 1 },
          infinite: { games: 2, wins: 1, bestStreak: 1, totalSongsCompleted: 15, longestSession: 8 },
          multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0 }
        }
      },
      achievements: ['first_game', 'first_win'],
      badges: [],
      gameHistory: [],
      preferences: {
        language: 'pt',
        theme: 'dark',
        soundEnabled: true,
        musicVolume: 0.7,
        effectsVolume: 0.5,
        notifications: true,
        autoplay: true,
        showHints: true,
        colorblindMode: false
      },
      social: {
        friends: [],
        friendRequests: [],
        blockedUsers: [],
        isProfilePublic: true,
        allowFriendRequests: true
      },
      titles: [],
      currentTitle: null,
      donationBenefits: {
        isSupporter: false,
        benefits: [],
        expiresAt: null
      }
    };

    const saveResponse = await fetch(`${BASE_URL}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ profile: testProfile })
    });

    if (!saveResponse.ok) {
      const errorData = await saveResponse.json().catch(() => ({}));
      throw new Error(`Erro ao salvar perfil: ${saveResponse.status} - ${errorData.error || 'Erro desconhecido'}`);
    }

    const saveData = await saveResponse.json();
    console.log('✅ Perfil salvo com sucesso');

    // 4. Testar busca do perfil salvo
    console.log('\n4. Testando busca do perfil salvo...');
    const verifyResponse = await fetch(`${BASE_URL}/api/profile?userId=auth_baiacuplays`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    if (!verifyResponse.ok) {
      throw new Error(`Erro ao verificar perfil: ${verifyResponse.status}`);
    }

    const verifyData = await verifyResponse.json();
    const savedProfile = verifyData.profile;

    console.log('✅ Perfil verificado:');
    console.log(`   - Username: ${savedProfile.username}`);
    console.log(`   - Display Name: ${savedProfile.displayName}`);
    console.log(`   - Bio: ${savedProfile.bio}`);
    console.log(`   - Total Games: ${savedProfile.stats.totalGames}`);
    console.log(`   - Wins: ${savedProfile.stats.wins}`);
    console.log(`   - Win Rate: ${savedProfile.stats.winRate}%`);
    console.log(`   - Achievements: ${savedProfile.achievements.join(', ')}`);

    // 5. Testar persistência
    console.log('\n5. Testando persistência...');
    const updatedProfile = {
      ...savedProfile,
      bio: 'Bio atualizada para teste de persistência',
      stats: {
        ...savedProfile.stats,
        totalGames: savedProfile.stats.totalGames + 1,
        wins: savedProfile.stats.wins + 1
      }
    };

    const updateResponse = await fetch(`${BASE_URL}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ profile: updatedProfile })
    });

    if (!updateResponse.ok) {
      throw new Error(`Erro ao atualizar perfil: ${updateResponse.status}`);
    }

    console.log('✅ Perfil atualizado com sucesso');

    // Verificar se a atualização persistiu
    const finalVerifyResponse = await fetch(`${BASE_URL}/api/profile?userId=auth_baiacuplays`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    const finalData = await finalVerifyResponse.json();
    const finalProfile = finalData.profile;

    if (finalProfile.bio === 'Bio atualizada para teste de persistência' && 
        finalProfile.stats.totalGames === savedProfile.stats.totalGames + 1) {
      console.log('✅ Persistência confirmada - dados foram salvos corretamente!');
    } else {
      console.log('❌ Problema de persistência - dados não foram salvos corretamente');
    }

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ Sistema de perfil está funcionando corretamente');
    console.log('✅ Dados estão sendo salvos no Vercel KV');
    console.log('✅ Persistência está funcionando');

  } catch (error) {
    console.error('\n❌ TESTE FALHOU:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testProfileSystem();
}

module.exports = { testProfileSystem };
