// API para resetar perfil do usuário
import { kv } from '@vercel/kv';
import { localProfiles, localSessions } from '../../../utils/storage';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// 🔒 Função para verificar se o usuário está autenticado
const verifyAuthentication = async (req) => {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '') ||
                      req.headers['x-session-token'] ||
                      req.query.sessionToken;

  if (!sessionToken) {
    return { authenticated: false, error: 'Token de sessão não fornecido' };
  }

  const sessionKey = `session:${sessionToken}`;
  let sessionData = null;

  try {
    if (isDevelopment && !hasKVConfig) {
      sessionData = localSessions.get(sessionKey);
    } else {
      sessionData = await kv.get(sessionKey);
    }

    if (!sessionData) {
      return { authenticated: false, error: 'Sessão inválida ou expirada' };
    }

    // Verificar se sessão expirou
    if (new Date() > new Date(sessionData.expiresAt)) {
      return { authenticated: false, error: 'Sessão expirada' };
    }

    return {
      authenticated: true,
      userId: sessionData.userId,
      username: sessionData.username
    };
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return { authenticated: false, error: 'Erro interno de autenticação' };
  }
};

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

    const { userId } = req.body;

    if (!userId) {
      console.error('❌ [RESET] ID do usuário não fornecido');
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Verificar se o userId corresponde ao usuário autenticado
    const expectedUserId = `auth_${authResult.username}`;
    console.log('🔄 [RESET] Verificando autorização:', { userId, expectedUserId });

    if (userId !== expectedUserId) {
      console.warn('⚠️ [RESET] Tentativa de resetar perfil de outro usuário:', { userId, expectedUserId });
      return res.status(403).json({ error: 'Não autorizado a resetar este perfil' });
    }

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
