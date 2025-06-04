// API para resetar perfil do usuário
import { kv } from '@vercel/kv';
import { localProfiles } from '../../../utils/storage';
import { verifyAuthentication } from '../../../utils/auth';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Função para criar perfil padrão
const createDefaultProfile = (userId, username, displayName) => {
  return {
    id: userId,
    username: username,
    displayName: displayName || username,
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
};

export default async function handler(req, res) {
  // Verificar se é método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔄 [RESET] Iniciando processo de reset de perfil...');
    console.log('🔄 [RESET] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔄 [RESET] Body:', JSON.stringify(req.body, null, 2));

    // Verificar autenticação
    const authResult = await verifyAuthentication(req);
    console.log('🔄 [RESET] Resultado da autenticação:', JSON.stringify(authResult, null, 2));

    if (!authResult.authenticated) {
      console.error('❌ [RESET] Falha na autenticação:', authResult.error);
      return res.status(401).json({ error: authResult.error });
    }

    // Obter userId do token de autenticação (mais seguro)
    const userId = authResult.userId;
    console.log('🔄 [RESET] UserId obtido do token:', userId);

    const profileKey = `profile:${userId}`;

    // Criar novo perfil padrão
    const newProfile = createDefaultProfile(userId, authResult.username, authResult.username);

    if (isDevelopment && !hasKVConfig) {
      // Usar armazenamento local em desenvolvimento
      console.log(`🔄 Resetando perfil ${authResult.username} (desenvolvimento)...`);
      localProfiles.set(profileKey, newProfile);
      console.log(`✅ Perfil resetado: ${profileKey}`);
    } else {
      // Usar Vercel KV em produção
      try {
        console.log(`🔄 Resetando perfil ${authResult.username}...`);
        await kv.set(profileKey, newProfile);
        console.log(`✅ Perfil resetado: ${profileKey}`);
      } catch (error) {
        console.error('Erro ao resetar perfil no KV:', error);
        return res.status(500).json({ error: 'Erro ao resetar perfil' });
      }
    }

    console.log(`🎉 [RESET] Perfil ${authResult.username} (${userId}) resetado com sucesso`);

    return res.status(200).json({
      success: true,
      message: 'Perfil resetado com sucesso',
      profile: newProfile
    });

  } catch (error) {
    console.error('❌ [RESET] Erro ao resetar perfil:', error);
    console.error('❌ [RESET] Stack trace:', error.stack);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
