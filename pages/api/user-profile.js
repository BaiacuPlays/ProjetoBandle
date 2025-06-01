// API para visualizar perfis de outros usuários
import { kv } from '@vercel/kv';
import { localUsers, localProfiles } from '../../utils/storage';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Função para verificar autenticação (opcional para visualização pública)
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
      // Buscar no storage local
      const { localSessions } = require('./auth');
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

  try {
    if (method === 'GET') {
      // Buscar perfil de usuário específico
      const { userId, username } = req.query;

      if (!userId && !username) {
        return res.status(400).json({ error: 'ID do usuário ou username é obrigatório' });
      }

      let targetUserId = userId;
      
      // Se foi fornecido username, converter para userId
      if (username && !userId) {
        targetUserId = `auth_${username}`;
      }

      // Buscar perfil do usuário
      const profileKey = `profile:${targetUserId}`;
      let userProfile = null;

      if (isDevelopment && !hasKVConfig) {
        userProfile = localProfiles.get(profileKey);
      } else {
        userProfile = await kv.get(profileKey);
      }

      if (!userProfile) {
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }

      // Buscar dados básicos do usuário (username, displayName)
      let userData = null;
      const userKey = `user:${userProfile.username || username}`;

      try {
        if (isDevelopment && !hasKVConfig) {
          userData = localUsers.get(userKey);
        } else {
          userData = await kv.get(userKey);
        }
      } catch (error) {
        console.warn('Erro ao buscar dados do usuário:', error);
      }

      // Verificar se o usuário solicitante está autenticado
      const authResult = await verifyAuthentication(req);
      const isOwnProfile = authResult.authenticated && authResult.userId === targetUserId;
      const isAuthenticated = authResult.authenticated;

      console.log('🔍 Dados encontrados:', {
        userProfile: !!userProfile,
        userData: !!userData,
        isAuthenticated,
        isOwnProfile
      });

      // Preparar dados do perfil para retorno
      const publicProfile = {
        id: targetUserId,
        username: userProfile.username || (userData ? userData.username : 'Usuário'),
        displayName: userProfile.displayName || (userData ? userData.displayName : 'Jogador'),
        avatar: userProfile.avatar || '👤',
        level: userProfile.level || 1,
        xp: userProfile.xp || 0,
        totalGames: userProfile.totalGames || 0,
        gamesWon: userProfile.gamesWon || 0,
        currentStreak: userProfile.currentStreak || 0,
        bestStreak: userProfile.bestStreak || 0,
        createdAt: userProfile.createdAt || new Date().toISOString(),
        lastActiveAt: userProfile.lastActiveAt || userProfile.createdAt || new Date().toISOString(),
        
        // Estatísticas públicas
        statistics: {
          totalGames: userProfile.stats?.totalGames || 0,
          gamesWon: userProfile.stats?.wins || 0,
          winRate: userProfile.stats?.winRate || 0,
          currentStreak: userProfile.stats?.currentStreak || 0,
          bestStreak: userProfile.stats?.bestStreak || 0,
          perfectGames: userProfile.stats?.perfectGames || 0
        },

        // Conquistas públicas (apenas desbloqueadas)
        achievements: (userProfile.achievements || []).filter(achievement => achievement.unlockedAt),
        
        // Badges públicos
        badges: userProfile.badges || [],
        
        // Informações de relacionamento (se autenticado)
        relationship: isAuthenticated ? {
          isFriend: false, // Será calculado se necessário
          hasPendingRequest: false, // Será calculado se necessário
          isOwnProfile: isOwnProfile
        } : null
      };

      // Se for o próprio perfil, incluir dados privados
      if (isOwnProfile) {
        publicProfile.email = userData ? userData.email : null;
        publicProfile.settings = userProfile.settings || {};
        publicProfile.privateStats = userProfile.privateStats || {};
      }

      // Se estiver autenticado, verificar relacionamento de amizade
      if (isAuthenticated && !isOwnProfile) {
        try {
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
          publicProfile.relationship.isFriend = isFriend;

          // Verificar solicitações pendentes
          const requestsKey = `friend_requests:${authResult.userId}`;
          const sentRequestsKey = `sent_requests:${authResult.userId}`;
          
          let receivedRequests = [];
          let sentRequests = [];
          
          if (isDevelopment && !hasKVConfig) {
            const { localFriendRequests } = require('./friend-requests');
            receivedRequests = localFriendRequests.get(requestsKey) || [];
            sentRequests = localFriendRequests.get(sentRequestsKey) || [];
          } else {
            receivedRequests = await kv.get(requestsKey) || [];
            sentRequests = await kv.get(sentRequestsKey) || [];
          }

          const hasReceivedRequest = receivedRequests.some(req => req.fromUserId === targetUserId && req.status === 'pending');
          const hasSentRequest = sentRequests.some(req => req.toUserId === targetUserId && req.status === 'pending');
          
          publicProfile.relationship.hasPendingRequest = hasReceivedRequest || hasSentRequest;
          publicProfile.relationship.requestType = hasReceivedRequest ? 'received' : (hasSentRequest ? 'sent' : null);
        } catch (error) {
          console.error('Erro ao verificar relacionamento:', error);
          // Continuar sem informações de relacionamento
        }
      }

      console.log(`👤 Perfil visualizado: ${userProfile.displayName} por ${authResult.authenticated ? authResult.username : 'anônimo'}`);

      return res.status(200).json({
        success: true,
        profile: publicProfile
      });

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de perfil de usuário:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
