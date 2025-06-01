// Script para resetar todos os dados dos jogadores
// Execute com: node scripts/reset-all-players.js

const { kv } = require('@vercel/kv');

async function resetAllPlayers() {
  try {
    console.log('🔄 Iniciando reset de todos os jogadores...');

    // Buscar todos os usuários
    const users = await kv.keys('user:*');
    console.log(`📋 Encontrados ${users.length} usuários:`, users);

    for (const userKey of users) {
      const userData = await kv.get(userKey);
      if (userData) {
        console.log(`\n🧹 Resetando ${userData.username}...`);
        
        // Manter apenas dados essenciais
        const resetData = {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          profilePicture: userData.profilePicture || null,
          bio: userData.bio || null,
          joinDate: userData.joinDate,
          friends: userData.friends || [],
          
          // Resetar estatísticas
          xp: 0,
          level: 1,
          achievements: [],
          unlockedAchievements: [],
          badges: [],
          
          // Resetar estatísticas de jogo
          stats: {
            xp: 0,
            level: 1,
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
            bestStreak: 0,
            totalTimePlayed: 0,
            averageGuesses: 0,
            perfectGames: 0,
            
            // Estatísticas por modo
            daily: {
              gamesPlayed: 0,
              gamesWon: 0,
              bestStreak: 0
            },
            infinite: {
              gamesPlayed: 0,
              gamesWon: 0,
              bestStreak: 0
            },
            multiplayer: {
              gamesPlayed: 0,
              gamesWon: 0,
              bestStreak: 0
            }
          }
        };

        // Salvar dados resetados
        await kv.set(userKey, resetData);
        console.log(`✅ ${userData.username} resetado com sucesso!`);
      }
    }

    // Limpar dados de progresso diário
    const dailyKeys = await kv.keys('daily:*');
    console.log(`\n🗓️ Limpando ${dailyKeys.length} registros de progresso diário...`);
    
    for (const key of dailyKeys) {
      await kv.del(key);
    }

    // Limpar dados de salas de multiplayer
    const roomKeys = await kv.keys('room:*');
    console.log(`🏠 Limpando ${roomKeys.length} salas de multiplayer...`);
    
    for (const key of roomKeys) {
      await kv.del(key);
    }

    console.log('\n🎉 Reset completo! Todos os jogadores foram resetados.');
    console.log('📊 Dados mantidos: username, email, password, profilePicture, bio, joinDate, friends');
    console.log('🗑️ Dados resetados: XP, level, achievements, badges, stats, progresso diário, salas');

  } catch (error) {
    console.error('❌ Erro durante o reset:', error);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  resetAllPlayers().then(() => {
    console.log('\n✨ Script finalizado!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { resetAllPlayers };
