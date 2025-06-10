// API para resetar todos os jogadores - APENAS PARA DESENVOLVIMENTO
// Importação segura do KV
let kv = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
  }
} catch (error) {
  // KV não disponível
}

export default async function handler(req, res) {
  // Verificar se é método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar senha de admin (simples proteção)
  const { adminPassword, action = 'reset' } = req.body;
  if (adminPassword !== 'reset123') {
    return res.status(401).json({ error: 'Senha de admin incorreta' });
  }

  try {
    // Verificar se é para deletar completamente ou apenas resetar
    if (action === 'delete') {
      return await deleteAllAccounts(res);
    } else {
      return await resetAllPlayers(res);
    }
  } catch (error) {
    console.error('❌ Erro durante a operação:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}

// Função para deletar TODAS as contas completamente
async function deleteAllAccounts(res) {
  console.log('🗑️ Iniciando DELEÇÃO COMPLETA de todas as contas...');

  // Buscar todos os tipos de dados
  const users = await kv.keys('user:*');
  const profiles = await kv.keys('profile:*');
  const sessions = await kv.keys('session:*');
  const dailyKeys = await kv.keys('daily:*');
  const roomKeys = await kv.keys('room:*');
  const friendKeys = await kv.keys('friends:*');

  console.log(`📋 Encontrados para deletar:`);
  console.log(`   - ${users.length} usuários`);
  console.log(`   - ${profiles.length} perfis`);
  console.log(`   - ${sessions.length} sessões`);
  console.log(`   - ${dailyKeys.length} registros diários`);
  console.log(`   - ${roomKeys.length} salas`);
  console.log(`   - ${friendKeys.length} dados de amigos`);

  const deletedResults = [];

  // Deletar todos os usuários
  for (const userKey of users) {
    const userData = await kv.get(userKey);
    if (userData) {
      await kv.del(userKey);
      deletedResults.push(`🗑️ Usuário ${userData.username} deletado`);
      console.log(`🗑️ Usuário ${userData.username} deletado completamente`);
    }
  }

  // Deletar todos os perfis
  for (const profileKey of profiles) {
    await kv.del(profileKey);
  }

  // Deletar todas as sessões
  for (const sessionKey of sessions) {
    await kv.del(sessionKey);
  }

  // Deletar dados diários
  for (const key of dailyKeys) {
    await kv.del(key);
  }

  // Deletar salas
  for (const key of roomKeys) {
    await kv.del(key);
  }

  // Deletar dados de amigos
  for (const key of friendKeys) {
    await kv.del(key);
  }

  console.log('🎉 DELEÇÃO COMPLETA finalizada!');

  return res.status(200).json({
    success: true,
    message: 'TODAS as contas foram deletadas completamente!',
    details: {
      accountsDeleted: deletedResults,
      usersDeleted: users.length,
      profilesDeleted: profiles.length,
      sessionsDeleted: sessions.length,
      dailyRecordsDeleted: dailyKeys.length,
      roomsDeleted: roomKeys.length,
      friendDataDeleted: friendKeys.length
    }
  });
}

// Função para resetar dados (manter contas, resetar progresso)
async function resetAllPlayers(res) {
  console.log('🔄 Iniciando reset de todos os jogadores...');

  // Buscar todos os usuários
  const users = await kv.keys('user:*');
  console.log(`📋 Encontrados ${users.length} usuários:`, users);

  for (const userKey of users) {
    const userData = await kv.get(userKey);
    if (userData) {
      console.log(`🧹 Resetando ${userData.username}...`);

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
      resetResults.push(`✅ ${userData.username} resetado`);
      console.log(`✅ ${userData.username} resetado com sucesso!`);
    }
  }

  // Limpar dados de progresso diário
  const dailyKeys = await kv.keys('daily:*');
  console.log(`🗓️ Limpando ${dailyKeys.length} registros de progresso diário...`);

  for (const key of dailyKeys) {
    await kv.del(key);
  }

  // Limpar dados de salas de multiplayer
  const roomKeys = await kv.keys('room:*');
  console.log(`🏠 Limpando ${roomKeys.length} salas de multiplayer...`);

  for (const key of roomKeys) {
    await kv.del(key);
  }

  console.log('🎉 Reset completo!');

  return res.status(200).json({
    success: true,
    message: 'Reset completo realizado com sucesso!',
    details: {
      usersReset: resetResults,
      dailyRecordsDeleted: dailyKeys.length,
      roomsDeleted: roomKeys.length
    }
  });
}
