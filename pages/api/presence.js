// API para gerenciar presença online dos usuários
import { kv } from '@vercel/kv';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Storage local para desenvolvimento
const localPresence = new Map();

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

    if (method === 'POST') {
      // Marcar usuário como online
      const presenceData = {
        userId: currentUserId,
        username: authResult.username,
        status: 'online',
        lastSeen: new Date().toISOString(),
        heartbeat: Date.now()
      };

      const presenceKey = `presence:${currentUserId}`;

      if (isDevelopment && !hasKVConfig) {
        localPresence.set(presenceKey, presenceData);
      } else {
        // Salvar com TTL de 2 minutos (120 segundos)
        await kv.setex(presenceKey, 120, presenceData);
      }

      return res.status(200).json({
        success: true,
        message: 'Status online atualizado'
      });

    } else if (method === 'DELETE') {
      // Marcar usuário como offline
      const presenceKey = `presence:${currentUserId}`;

      if (isDevelopment && !hasKVConfig) {
        localPresence.delete(presenceKey);
      } else {
        await kv.del(presenceKey);
      }

      return res.status(200).json({
        success: true,
        message: 'Status offline definido'
      });

    } else if (method === 'GET') {
      // Buscar status de amigos específicos
      const { friendIds } = req.query;
      
      if (!friendIds) {
        return res.status(400).json({ error: 'IDs dos amigos são obrigatórios' });
      }

      const friendIdList = Array.isArray(friendIds) ? friendIds : friendIds.split(',');
      const presenceStatus = {};

      for (const friendId of friendIdList) {
        const presenceKey = `presence:${friendId}`;
        let presenceData = null;

        if (isDevelopment && !hasKVConfig) {
          presenceData = localPresence.get(presenceKey);
          
          // Verificar se o heartbeat não é muito antigo (2 minutos)
          if (presenceData && (Date.now() - presenceData.heartbeat) > 120000) {
            localPresence.delete(presenceKey);
            presenceData = null;
          }
        } else {
          presenceData = await kv.get(presenceKey);
        }

        presenceStatus[friendId] = presenceData ? 'online' : 'offline';
      }

      return res.status(200).json({
        success: true,
        presence: presenceStatus
      });

    } else if (method === 'PUT') {
      // Heartbeat - manter usuário online
      const presenceKey = `presence:${currentUserId}`;
      
      if (isDevelopment && !hasKVConfig) {
        const existingData = localPresence.get(presenceKey);
        if (existingData) {
          existingData.heartbeat = Date.now();
          existingData.lastSeen = new Date().toISOString();
          localPresence.set(presenceKey, existingData);
        }
      } else {
        const existingData = await kv.get(presenceKey);
        if (existingData) {
          existingData.heartbeat = Date.now();
          existingData.lastSeen = new Date().toISOString();
          await kv.setex(presenceKey, 120, existingData);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Heartbeat atualizado'
      });

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de presença:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
