// API para gerenciar solicitações de amizade
import { kv } from '@vercel/kv';
import { localUsers, localProfiles } from '../../utils/storage';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Storage local para desenvolvimento
const localFriendRequests = new Map();

// Função para verificar autenticação
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
    // Verificar autenticação
    const authResult = await verifyAuthentication(req);
    if (!authResult.authenticated) {
      return res.status(401).json({ error: authResult.error });
    }

    const currentUserId = authResult.userId;

    if (method === 'GET') {
      // Buscar solicitações recebidas
      const requestsKey = `friend_requests:${currentUserId}`;
      let requests = [];

      if (isDevelopment && !hasKVConfig) {
        requests = localFriendRequests.get(requestsKey) || [];
      } else {
        requests = await kv.get(requestsKey) || [];
      }

      // Filtrar apenas solicitações pendentes e não expiradas (últimos 7 dias)
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      const validRequests = requests.filter(request => 
        request.status === 'pending' && 
        new Date(request.timestamp).getTime() > sevenDaysAgo
      );

      return res.status(200).json({
        success: true,
        requests: validRequests
      });

    } else if (method === 'POST') {
      // Enviar solicitação de amizade
      const { toUserId, toUser } = req.body;

      if (!toUserId || !toUser) {
        return res.status(400).json({ error: 'Dados da solicitação incompletos' });
      }

      // Verificar se não está tentando adicionar a si mesmo
      if (toUserId === currentUserId) {
        return res.status(400).json({ error: 'Você não pode adicionar a si mesmo' });
      }

      // Buscar dados do usuário atual para incluir na solicitação
      let currentUserProfile = null;
      const currentProfileKey = `profile:${currentUserId}`;
      
      if (isDevelopment && !hasKVConfig) {
        currentUserProfile = localProfiles.get(currentProfileKey);
      } else {
        currentUserProfile = await kv.get(currentProfileKey);
      }

      const request = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromUserId: currentUserId,
        toUserId: toUserId,
        fromUser: {
          username: authResult.username,
          displayName: currentUserProfile?.displayName || authResult.username,
          avatar: currentUserProfile?.avatar || '👤',
          bio: currentUserProfile?.bio || ''
        },
        toUser: toUser,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      // Salvar na lista de solicitações do destinatário
      const toRequestsKey = `friend_requests:${toUserId}`;
      let toRequests = [];

      if (isDevelopment && !hasKVConfig) {
        toRequests = localFriendRequests.get(toRequestsKey) || [];
      } else {
        toRequests = await kv.get(toRequestsKey) || [];
      }

      // Verificar se já existe solicitação pendente
      const existingRequest = toRequests.find(req => 
        req.fromUserId === currentUserId && req.status === 'pending'
      );

      if (existingRequest) {
        return res.status(409).json({ error: 'Solicitação já enviada para este usuário' });
      }

      toRequests.push(request);

      if (isDevelopment && !hasKVConfig) {
        localFriendRequests.set(toRequestsKey, toRequests);
      } else {
        await kv.set(toRequestsKey, toRequests);
      }

      // Salvar na lista de solicitações enviadas do remetente
      const fromSentKey = `sent_requests:${currentUserId}`;
      let sentRequests = [];

      if (isDevelopment && !hasKVConfig) {
        sentRequests = localFriendRequests.get(fromSentKey) || [];
      } else {
        sentRequests = await kv.get(fromSentKey) || [];
      }

      sentRequests.push(request);

      if (isDevelopment && !hasKVConfig) {
        localFriendRequests.set(fromSentKey, sentRequests);
      } else {
        await kv.set(fromSentKey, sentRequests);
      }

      console.log(`✅ Solicitação de amizade enviada: ${currentUserId} → ${toUserId}`);

      return res.status(200).json({
        success: true,
        message: 'Solicitação enviada com sucesso',
        request: request
      });

    } else if (method === 'PUT') {
      // Aceitar ou rejeitar solicitação
      const { requestId, action } = req.body; // action: 'accept' ou 'reject'

      if (!requestId || !action) {
        return res.status(400).json({ error: 'ID da solicitação e ação são obrigatórios' });
      }

      const requestsKey = `friend_requests:${currentUserId}`;
      let requests = [];

      if (isDevelopment && !hasKVConfig) {
        requests = localFriendRequests.get(requestsKey) || [];
      } else {
        requests = await kv.get(requestsKey) || [];
      }

      const requestIndex = requests.findIndex(req => req.id === requestId);
      if (requestIndex === -1) {
        return res.status(404).json({ error: 'Solicitação não encontrada' });
      }

      const request = requests[requestIndex];

      if (action === 'accept') {
        // Marcar como aceita
        requests[requestIndex].status = 'accepted';
        
        // Adicionar aos amigos de ambos os usuários
        const friendsKey1 = `friends:${currentUserId}`;
        const friendsKey2 = `friends:${request.fromUserId}`;

        // Amigos do usuário atual
        let friends1 = [];
        if (isDevelopment && !hasKVConfig) {
          friends1 = localFriendRequests.get(friendsKey1) || [];
        } else {
          friends1 = await kv.get(friendsKey1) || [];
        }

        friends1.push({
          id: request.fromUserId,
          username: request.fromUser.username,
          displayName: request.fromUser.displayName,
          avatar: request.fromUser.avatar,
          bio: request.fromUser.bio || '',
          addedAt: new Date().toISOString(),
          status: 'offline'
        });

        // Amigos do remetente
        let friends2 = [];
        if (isDevelopment && !hasKVConfig) {
          friends2 = localFriendRequests.get(friendsKey2) || [];
        } else {
          friends2 = await kv.get(friendsKey2) || [];
        }

        friends2.push({
          id: currentUserId,
          username: authResult.username,
          displayName: request.toUser.displayName,
          avatar: request.toUser.avatar,
          bio: request.toUser.bio || '',
          addedAt: new Date().toISOString(),
          status: 'offline'
        });

        // Salvar listas de amigos
        if (isDevelopment && !hasKVConfig) {
          localFriendRequests.set(friendsKey1, friends1);
          localFriendRequests.set(friendsKey2, friends2);
        } else {
          await kv.set(friendsKey1, friends1);
          await kv.set(friendsKey2, friends2);
        }

      } else if (action === 'reject') {
        // Marcar como rejeitada
        requests[requestIndex].status = 'rejected';
      }

      // Atualizar lista de solicitações
      if (isDevelopment && !hasKVConfig) {
        localFriendRequests.set(requestsKey, requests);
      } else {
        await kv.set(requestsKey, requests);
      }

      console.log(`✅ Solicitação ${action === 'accept' ? 'aceita' : 'rejeitada'}: ${requestId}`);

      return res.status(200).json({
        success: true,
        message: `Solicitação ${action === 'accept' ? 'aceita' : 'rejeitada'} com sucesso`
      });

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de solicitações de amizade:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
