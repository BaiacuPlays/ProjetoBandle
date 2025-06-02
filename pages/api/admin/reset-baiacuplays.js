// API para resetar especificamente a conta BaiacuPlays
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Verificar se é método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar senha de admin
  const { adminPassword } = req.body;
  if (adminPassword !== 'reset123') {
    return res.status(401).json({ error: 'Senha de admin incorreta' });
  }

  try {
    console.log('🔄 [ADMIN] Iniciando reset da conta BaiacuPlays...');

    const username = 'baiacuplays';
    const userId = `auth_${username}`;
    const profileKey = `profile:${userId}`;

    // Criar novo perfil padrão para BaiacuPlays
    const newProfile = {
      id: userId,
      username: username,
      displayName: 'BaiacuPlays',
      level: 1,
      xp: 0,
      avatar: 'default',
      title: 'Novato',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      version: '1.0',
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalPlayTime: 0,
        perfectGames: 0,
        averageAttempts: 0,
        fastestWin: null,
        modeStats: {
          daily: { games: 0, wins: 0, bestStreak: 0, averageAttempts: 0, perfectGames: 0 },
          infinite: { games: 0, wins: 0, bestStreak: 0, totalSongsCompleted: 0, longestSession: 0 },
          multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0 }
        }
      },
      socialStats: {
        multiplayerGamesPlayed: 0,
        multiplayerWins: 0,
        friendsAdded: 0,
        gamesShared: 0,
        socialInteractions: 0
      },
      achievements: [],
      badges: [],
      gameHistory: [],
      preferences: {
        showNotifications: true,
        receiveNotifications: true,
        language: 'pt',
        theme: 'dark'
      },
      tutorialSeen: false
    };

    // Resetar perfil no KV
    await kv.set(profileKey, newProfile);
    console.log(`✅ Perfil resetado: ${profileKey}`);

    // Limpar dados de amigos
    const friendsKey = `friends:${userId}`;
    await kv.del(friendsKey);
    console.log(`✅ Lista de amigos deletada: ${friendsKey}`);

    // Limpar solicitações de amizade
    const friendRequestsKey = `friend_requests:${userId}`;
    await kv.del(friendRequestsKey);
    console.log(`✅ Solicitações de amizade deletadas: ${friendRequestsKey}`);

    const sentRequestsKey = `sent_requests:${userId}`;
    await kv.del(sentRequestsKey);
    console.log(`✅ Solicitações enviadas deletadas: ${sentRequestsKey}`);

    // Limpar progresso diário
    const dailyKeys = await kv.keys('daily:*');
    for (const dailyKey of dailyKeys) {
      try {
        const dailyData = await kv.get(dailyKey);
        if (dailyData && dailyData.userId === userId) {
          await kv.del(dailyKey);
          console.log(`✅ Progresso diário deletado: ${dailyKey}`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao verificar progresso diário ${dailyKey}:`, error);
      }
    }

    console.log(`🎉 [ADMIN] Conta BaiacuPlays resetada completamente!`);

    return res.status(200).json({
      success: true,
      message: 'Conta BaiacuPlays resetada com sucesso',
      profile: newProfile
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erro ao resetar conta BaiacuPlays:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
