// Utilitário centralizado para verificação de autenticação
import { kv } from '@vercel/kv';
import { localSessions } from './storage';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Função centralizada para verificar autenticação
export const verifyAuthentication = async (req) => {
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
      sessionData = localSessions.get(sessionKey);
    } else {
      sessionData = await kv.get(sessionKey);
    }

    if (!sessionData) {
      return { authenticated: false, error: 'Sessão inválida ou expirada' };
    }

    // Verificar se sessão expirou
    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);

    if (now > expiresAt) {
      // Limpar sessão expirada automaticamente
      try {
        if (isDevelopment && !hasKVConfig) {
          localSessions.delete(sessionKey);
        } else {
          await kv.del(sessionKey);
        }
      } catch (cleanupError) {
        console.warn('Erro ao limpar sessão expirada:', cleanupError);
      }
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

// Middleware para APIs que requerem autenticação
export const requireAuth = (handler) => {
  return async (req, res) => {
    const authResult = await verifyAuthentication(req);
    
    if (!authResult.authenticated) {
      return res.status(401).json({ error: authResult.error });
    }

    // Adicionar dados de autenticação ao request
    req.auth = authResult;
    
    return handler(req, res);
  };
};

// Função para verificar se usuário é o proprietário do recurso
export const verifyOwnership = (userId, resourceUserId) => {
  return userId === resourceUserId;
};

// Função para sanitizar dados de entrada
export const sanitizeInput = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove caracteres de controle
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ''); // Remove caracteres não-ASCII suspeitos
};

// Função para validar formato de email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função para validar username
export const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  
  // Username deve ter 3-20 caracteres, apenas letras, números e underscore
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Função para validar senha
export const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  // Senha deve ter pelo menos 6 caracteres
  return password.length >= 6;
};
