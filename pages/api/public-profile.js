// API para buscar perfis públicos de outros usuários
import { kv } from '@vercel/kv';
import { localUsers, localProfiles } from '../../utils/storage';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Função para verificar autenticação (opcional para perfis públicos)
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
      const { localSessions } = require('./auth');
      sessionData = localSessions.get(sessionKey);
    } else {
      sessionData = await kv.get(sessionKey);
    }

    if (!sessionData) {
      return { authenticated: false, error: 'Sessão inválida ou expirada' };
    }

    if (new Date() > new Date(sessionData.expiresAt)) {
      return { authenticated: false, error: 'Sessão expirada' };
    }

    return {
      authenticated: true,
      userId: `auth_${sessionData.username}`,
      username: sessionData.username
    };
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return { authenticated: false, error: 'Erro interno de autenticação' };
  }
};

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { userId, username } = req.query;

    if (!userId && !username) {
      return res.status(400).json({ error: 'ID do usuário ou username é obrigatório' });
    }

    // Verificar autenticação (opcional - pode ver perfis públicos sem estar logado)
    const authResult = await verifyAuthentication(req);
    const isAuthenticated = authResult.authenticated;

    let targetUserId = userId;
    let targetUsername = username;

    // Se foi fornecido username, converter para userId
    if (username && !userId) {
      targetUserId = `auth_${username}`;
      targetUsername = username;
    } else if (userId && !username) {
      // Extrair username do userId
      targetUsername = userId.replace('auth_', '');
    }

    // Buscar dados do usuário
    const userKey = `user:${targetUsername}`;
    let userData = null;

    if (isDevelopment && !hasKVConfig) {
      userData = localUsers.get(userKey);
    } else {
      userData = await kv.get(userKey);
    }

    if (!userData) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar perfil do usuário
    const profileKey = `profile:${targetUserId}`;
    let profileData = null;

    if (isDevelopment && !hasKVConfig) {
      profileData = localProfiles.get(profileKey);
    } else {
      profileData = await kv.get(profileKey);
    }

    // Dados públicos básicos do usuário
    const publicProfile = {
      id: targetUserId,
      username: userData.username,
      displayName: userData.displayName || userData.username,
      createdAt: userData.createdAt,
      lastLoginAt: userData.lastLoginAt
    };

    // Se tem perfil, adicionar dados públicos do perfil
    if (profileData) {
      publicProfile.avatar = profileData.avatar || '👤';
      publicProfile.level = profileData.level || 1;
      publicProfile.xp = profileData.xp || 0;
      publicProfile.title = profileData.title || null;
      publicProfile.bio = profileData.bio || null;
      
      // Estatísticas públicas (se existirem)
      if (profileData.stats) {
        publicProfile.stats = {
          totalGames: profileData.stats.totalGames || 0,
          totalWins: profileData.stats.totalWins || 0,
          totalScore: profileData.stats.totalScore || 0,
          averageScore: profileData.stats.averageScore || 0,
          bestStreak: profileData.stats.bestStreak || 0,
          perfectGames: profileData.stats.perfectGames || 0
        };
      }

      // Conquistas públicas (apenas as desbloqueadas)
      if (profileData.achievements) {
        const unlockedAchievements = Object.entries(profileData.achievements)
          .filter(([_, achievement]) => achievement.unlocked)
          .reduce((acc, [key, achievement]) => {
            acc[key] = {
              unlocked: true,
              unlockedAt: achievement.unlockedAt,
              progress: achievement.progress
            };
            return acc;
          }, {});
        
        publicProfile.achievements = unlockedAchievements;
      }

      // Badges públicos (apenas os ativos)
      if (profileData.badges) {
        const activeBadges = Object.entries(profileData.badges)
          .filter(([_, badge]) => badge.unlocked)
          .reduce((acc, [key, badge]) => {
            acc[key] = {
              unlocked: true,
              unlockedAt: badge.unlockedAt
            };
            return acc;
          }, {});
        
        publicProfile.badges = activeBadges;
      }
    }

    // Se o usuário está autenticado, pode ver informações adicionais
    if (isAuthenticated) {
      // Verificar se são amigos
      const friendsKey = `friends:${authResult.userId}`;
      let friends = [];

      if (isDevelopment && !hasKVConfig) {
        const { localFriendRequests } = require('./friend-requests');
        friends = localFriendRequests.get(friendsKey) || [];
      } else {
        friends = await kv.get(friendsKey) || [];
      }

      const isFriend = friends.some(friend => friend.id === targetUserId);
      publicProfile.isFriend = isFriend;

      // Se são amigos, mostrar informações adicionais
      if (isFriend && profileData) {
        publicProfile.friendsSince = friends.find(f => f.id === targetUserId)?.addedAt;
        
        // Estatísticas mais detalhadas para amigos
        if (profileData.stats) {
          publicProfile.stats.gamesThisWeek = profileData.stats.gamesThisWeek || 0;
          publicProfile.stats.gamesThisMonth = profileData.stats.gamesThisMonth || 0;
          publicProfile.stats.favoriteGenre = profileData.stats.favoriteGenre || null;
        }
      }
    }

    // Verificar status online
    const presenceKey = `presence:${targetUserId}`;
    let isOnline = false;

    if (isDevelopment && !hasKVConfig) {
      const { localPresence } = require('./presence');
      const presenceData = localPresence.get(presenceKey);
      isOnline = presenceData && (Date.now() - presenceData.heartbeat) < 120000;
    } else {
      const presenceData = await kv.get(presenceKey);
      isOnline = !!presenceData;
    }

    publicProfile.isOnline = isOnline;
    publicProfile.lastSeen = isOnline ? 'Agora' : (userData.lastLoginAt ? new Date(userData.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca');

    console.log(`👁️ Perfil público visualizado: ${targetUsername} por ${authResult.username || 'anônimo'}`);

    return res.status(200).json({
      success: true,
      profile: publicProfile
    });

  } catch (error) {
    console.error('Erro na API de perfil público:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
