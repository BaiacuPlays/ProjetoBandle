// API para gerenciar lista de amigos
import { kv } from '@vercel/kv';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Storage local para desenvolvimento
const localFriends = new Map();

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
      // Buscar lista de amigos
      const friendsKey = `friends:${currentUserId}`;
      let friends = [];

      if (isDevelopment && !hasKVConfig) {
        friends = localFriends.get(friendsKey) || [];
      } else {
        friends = await kv.get(friendsKey) || [];
      }

      return res.status(200).json({
        success: true,
        friends: friends
      });

    } else if (method === 'DELETE') {
      // Remover amigo
      const { friendId } = req.body;

      if (!friendId) {
        return res.status(400).json({ error: 'ID do amigo é obrigatório' });
      }

      // Remover da lista do usuário atual
      const friendsKey1 = `friends:${currentUserId}`;
      let friends1 = [];

      if (isDevelopment && !hasKVConfig) {
        friends1 = localFriends.get(friendsKey1) || [];
      } else {
        friends1 = await kv.get(friendsKey1) || [];
      }

      friends1 = friends1.filter(friend => friend.id !== friendId);

      // Remover da lista do amigo
      const friendsKey2 = `friends:${friendId}`;
      let friends2 = [];

      if (isDevelopment && !hasKVConfig) {
        friends2 = localFriends.get(friendsKey2) || [];
      } else {
        friends2 = await kv.get(friendsKey2) || [];
      }

      friends2 = friends2.filter(friend => friend.id !== currentUserId);

      // Salvar listas atualizadas
      if (isDevelopment && !hasKVConfig) {
        localFriends.set(friendsKey1, friends1);
        localFriends.set(friendsKey2, friends2);
      } else {
        await kv.set(friendsKey1, friends1);
        await kv.set(friendsKey2, friends2);
      }

      console.log(`✅ Amizade removida: ${currentUserId} ↔ ${friendId}`);

      return res.status(200).json({
        success: true,
        message: 'Amigo removido com sucesso'
      });

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
