// API unificada para sistema de amigos - SIMPLES E CONFIÁVEL
import { kv } from '@vercel/kv';
import { verifyAuthentication } from '../../utils/auth';

// Configuração de ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// Storage local para desenvolvimento
const localStorage = {
  friends: new Map(),
  requests: new Map(),
  users: new Map()
};

// Função para sanitizar entrada
const sanitize = (input, maxLength = 100) => {
  if (!input) return '';
  return String(input).trim().substring(0, maxLength);
};

// Função para obter dados do KV ou storage local
const getData = async (key) => {
  if (isDevelopment && !hasKVConfig) {
    return localStorage.friends.get(key) || localStorage.requests.get(key) || localStorage.users.get(key);
  }
  return await kv.get(key);
};

// Função para salvar dados no KV ou storage local
const setData = async (key, value) => {
  if (isDevelopment && !hasKVConfig) {
    if (key.includes('friends:')) {
      localStorage.friends.set(key, value);
    } else if (key.includes('requests:')) {
      localStorage.requests.set(key, value);
    } else {
      localStorage.users.set(key, value);
    }
  } else {
    await kv.set(key, value);
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
    const currentUsername = authResult.username;

    if (method === 'GET') {
      const { action } = req.query;

      if (action === 'friends') {
        // Buscar lista de amigos
        const friendsKey = `friends:${currentUserId}`;
        const friends = await getData(friendsKey) || [];
        
        return res.status(200).json({ friends });

      } else if (action === 'requests') {
        // Buscar solicitações recebidas
        const requestsKey = `requests:${currentUserId}`;
        const requests = await getData(requestsKey) || [];
        
        return res.status(200).json({ requests });

      } else if (action === 'sent') {
        // Buscar solicitações enviadas
        const sentKey = `sent:${currentUserId}`;
        const sent = await getData(sentKey) || [];
        
        return res.status(200).json({ sent });

      } else if (action === 'search') {
        // Buscar usuário por código
        const { query } = req.query;
        if (!query) {
          return res.status(400).json({ error: 'Código de busca é obrigatório' });
        }

        // Buscar usuário no sistema de autenticação
        const userKey = `user:${query.toLowerCase()}`;
        let userData = null;

        if (isDevelopment && !hasKVConfig) {
          // Importar storage local do sistema de auth
          const { localUsers } = require('./auth');
          userData = localUsers?.get?.(userKey);
        } else {
          userData = await kv.get(userKey);
        }

        if (!userData) {
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Retornar dados públicos do usuário
        const publicUser = {
          id: `auth_${userData.username}`,
          username: userData.username,
          displayName: userData.displayName || userData.username,
          avatar: '👤',
          level: 1
        };

        return res.status(200).json({ user: publicUser });

      } else {
        return res.status(400).json({ error: 'Ação não especificada' });
      }

    } else if (method === 'POST') {
      const { action, data } = req.body;

      if (action === 'send_request') {
        // Enviar solicitação de amizade
        const { toUserId, toUser } = data;
        
        if (!toUserId || !toUser) {
          return res.status(400).json({ error: 'Dados da solicitação incompletos' });
        }

        // Verificar se não está tentando adicionar a si mesmo
        if (toUserId === currentUserId) {
          return res.status(400).json({ error: 'Você não pode adicionar a si mesmo' });
        }

        // Verificar se já são amigos
        const friendsKey = `friends:${currentUserId}`;
        const friends = await getData(friendsKey) || [];
        
        if (friends.some(friend => friend.id === toUserId)) {
          return res.status(400).json({ error: 'Este usuário já é seu amigo' });
        }

        // Verificar se já existe solicitação pendente
        const requestsKey = `requests:${toUserId}`;
        const requests = await getData(requestsKey) || [];
        
        if (requests.some(req => req.fromUserId === currentUserId)) {
          return res.status(400).json({ error: 'Solicitação já enviada' });
        }

        // Criar solicitação
        const request = {
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fromUserId: currentUserId,
          toUserId: sanitize(toUserId),
          fromUser: {
            username: currentUsername,
            displayName: sanitize(currentUsername),
            avatar: '👤'
          },
          toUser: {
            username: sanitize(toUser.username),
            displayName: sanitize(toUser.displayName),
            avatar: '👤'
          },
          timestamp: new Date().toISOString(),
          status: 'pending'
        };

        // Adicionar à lista de solicitações do destinatário
        requests.push(request);
        await setData(requestsKey, requests);

        // Adicionar à lista de enviadas do remetente
        const sentKey = `sent:${currentUserId}`;
        const sent = await getData(sentKey) || [];
        sent.push(request);
        await setData(sentKey, sent);

        return res.status(200).json({ success: true, request });

      } else if (action === 'accept_request') {
        // Aceitar solicitação de amizade
        const { requestId } = data;
        
        if (!requestId) {
          return res.status(400).json({ error: 'ID da solicitação é obrigatório' });
        }

        // Buscar solicitação
        const requestsKey = `requests:${currentUserId}`;
        const requests = await getData(requestsKey) || [];
        
        const requestIndex = requests.findIndex(req => req.id === requestId);
        if (requestIndex === -1) {
          return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        const request = requests[requestIndex];

        // Adicionar aos amigos de ambos os usuários
        const myFriendsKey = `friends:${currentUserId}`;
        const theirFriendsKey = `friends:${request.fromUserId}`;
        
        const myFriends = await getData(myFriendsKey) || [];
        const theirFriends = await getData(theirFriendsKey) || [];

        // Adicionar amigo à minha lista
        myFriends.push({
          id: request.fromUserId,
          username: request.fromUser.username,
          displayName: request.fromUser.displayName,
          avatar: request.fromUser.avatar,
          addedAt: new Date().toISOString()
        });

        // Adicionar amigo à lista dele
        theirFriends.push({
          id: currentUserId,
          username: currentUsername,
          displayName: currentUsername,
          avatar: '👤',
          addedAt: new Date().toISOString()
        });

        // Salvar listas de amigos
        await setData(myFriendsKey, myFriends);
        await setData(theirFriendsKey, theirFriends);

        // Remover solicitação
        requests.splice(requestIndex, 1);
        await setData(requestsKey, requests);

        // Remover da lista de enviadas do remetente
        const sentKey = `sent:${request.fromUserId}`;
        const sent = await getData(sentKey) || [];
        const sentIndex = sent.findIndex(req => req.id === requestId);
        if (sentIndex !== -1) {
          sent.splice(sentIndex, 1);
          await setData(sentKey, sent);
        }

        return res.status(200).json({ success: true });

      } else if (action === 'reject_request') {
        // Rejeitar solicitação de amizade
        const { requestId } = data;
        
        if (!requestId) {
          return res.status(400).json({ error: 'ID da solicitação é obrigatório' });
        }

        // Remover solicitação
        const requestsKey = `requests:${currentUserId}`;
        const requests = await getData(requestsKey) || [];
        
        const requestIndex = requests.findIndex(req => req.id === requestId);
        if (requestIndex === -1) {
          return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        const request = requests[requestIndex];
        requests.splice(requestIndex, 1);
        await setData(requestsKey, requests);

        // Remover da lista de enviadas do remetente
        const sentKey = `sent:${request.fromUserId}`;
        const sent = await getData(sentKey) || [];
        const sentIndex = sent.findIndex(req => req.id === requestId);
        if (sentIndex !== -1) {
          sent.splice(sentIndex, 1);
          await setData(sentKey, sent);
        }

        return res.status(200).json({ success: true });

      } else {
        return res.status(400).json({ error: 'Ação não reconhecida' });
      }

    } else if (method === 'DELETE') {
      const { action, data } = req.body;

      if (action === 'remove_friend') {
        // Remover amigo
        const { friendId } = data;
        
        if (!friendId) {
          return res.status(400).json({ error: 'ID do amigo é obrigatório' });
        }

        // Remover da minha lista
        const myFriendsKey = `friends:${currentUserId}`;
        const myFriends = await getData(myFriendsKey) || [];
        const myIndex = myFriends.findIndex(friend => friend.id === friendId);
        
        if (myIndex !== -1) {
          myFriends.splice(myIndex, 1);
          await setData(myFriendsKey, myFriends);
        }

        // Remover da lista dele
        const theirFriendsKey = `friends:${friendId}`;
        const theirFriends = await getData(theirFriendsKey) || [];
        const theirIndex = theirFriends.findIndex(friend => friend.id === currentUserId);
        
        if (theirIndex !== -1) {
          theirFriends.splice(theirIndex, 1);
          await setData(theirFriendsKey, theirFriends);
        }

        return res.status(200).json({ success: true });

      } else {
        return res.status(400).json({ error: 'Ação não reconhecida' });
      }

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de amigos:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
