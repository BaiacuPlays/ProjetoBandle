// API para autenticação de usuários
import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';
import { localUsers, localSessions } from '../../utils/storage';

// Tornar disponível globalmente para outros módulos
global.localSessions = localSessions;

// Exportar para outros módulos
export { localSessions };

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Função para gerar token de sessão
const generateSessionToken = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
};

// 🔒 FUNÇÃO DE SEGURANÇA: Invalidar todas as sessões de um usuário
// NOTA: Esta função está desabilitada para permitir múltiplas sessões simultâneas
// Isso permite que o usuário faça login em múltiplos dispositivos sem perder progresso
const invalidateUserSessions = async (username) => {
  try {
    const userSessionsKey = `user_sessions:${username}`;
    let userSessions = [];

    // Obter lista de sessões do usuário
    if (isDevelopment && !hasKVConfig) {
      userSessions = localSessions.get(userSessionsKey) || [];
    } else {
      userSessions = await kv.get(userSessionsKey) || [];
    }

    console.log(`🔒 [DESABILITADO] Invalidação de ${userSessions.length} sessões para usuário: ${username}`);

    // COMENTADO: Invalidar cada sessão
    // for (const sessionToken of userSessions) {
    //   const sessionKey = `session:${sessionToken}`;
    //   if (isDevelopment && !hasKVConfig) {
    //     localSessions.delete(sessionKey);
    //   } else {
    //     await kv.del(sessionKey);
    //   }
    // }

    // Limpar lista de sessões do usuário
    if (isDevelopment && !hasKVConfig) {
      localSessions.delete(userSessionsKey);
    } else {
      await kv.del(userSessionsKey);
    }

    console.log(`✅ Sessões anteriores invalidadas para usuário: ${username}`);
  } catch (error) {
    console.error(`❌ Erro ao invalidar sessões do usuário ${username}:`, error);
  }
};

// Função para validar dados de entrada
const validateUserData = (username, password, email = null) => {
  if (!username || typeof username !== 'string') {
    throw new Error('Nome de usuário é obrigatório');
  }

  if (username.length < 3 || username.length > 20) {
    throw new Error('Nome de usuário deve ter entre 3 e 20 caracteres');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error('Nome de usuário pode conter apenas letras, números e underscore');
  }

  if (!password || typeof password !== 'string') {
    throw new Error('Senha é obrigatória');
  }

  if (password.length < 6) {
    throw new Error('Senha deve ter pelo menos 6 caracteres');
  }

  // Validar email se fornecido
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }
  }

  return true;
};

// Função para hash da senha
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Função para verificar senha
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'POST') {
      const { action, username, password, email, anonymousUserId } = req.body;

      if (action === 'register') {
        // Registrar novo usuário
        try {
          validateUserData(username, password, email);
        } catch (error) {
          return res.status(400).json({ error: error.message });
        }

        // Extrair código de referência se fornecido
        const { referralCode } = req.body;

        const userKey = `user:${username.toLowerCase()}`;
        
        // Verificar se usuário já existe
        let existingUser = null;
        if (isDevelopment && !hasKVConfig) {
          existingUser = localUsers.get(userKey);
        } else {
          existingUser = await kv.get(userKey);
        }

        if (existingUser) {
          return res.status(409).json({ error: 'Nome de usuário já existe' });
        }

        // Criar hash da senha
        const hashedPassword = await hashPassword(password);

        // Criar dados do usuário
        const userData = {
          username: username.toLowerCase(),
          displayName: username,
          email: email || null,
          hashedPassword,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          anonymousUserId: anonymousUserId || null // Para migração de perfil anônimo
        };

        // Salvar usuário
        if (isDevelopment && !hasKVConfig) {
          localUsers.set(userKey, userData);
        } else {
          await kv.set(userKey, userData);
        }

        // 🔒 SEGURANÇA: Permitir múltiplas sessões simultâneas
        // Comentado para permitir login em múltiplos dispositivos
        // await invalidateUserSessions(userData.username);

        // Gerar token de sessão
        const sessionToken = generateSessionToken();
        const sessionData = {
          username: userData.username,
          displayName: userData.displayName,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
        };

        // Salvar sessão
        const sessionKey = `session:${sessionToken}`;
        if (isDevelopment && !hasKVConfig) {
          localSessions.set(sessionKey, sessionData);
          // Registrar sessão ativa para este usuário
          const userSessionsKey = `user_sessions:${userData.username}`;
          const userSessions = localSessions.get(userSessionsKey) || [];
          userSessions.push(sessionToken);
          localSessions.set(userSessionsKey, userSessions);
        } else {
          await kv.set(sessionKey, sessionData, { ex: 30 * 24 * 60 * 60 }); // 30 dias
          // Registrar sessão ativa para este usuário
          const userSessionsKey = `user_sessions:${userData.username}`;
          const userSessions = await kv.get(userSessionsKey) || [];
          userSessions.push(sessionToken);
          await kv.set(userSessionsKey, userSessions, { ex: 30 * 24 * 60 * 60 });
        }

        console.log(`✅ Usuário registrado: ${username}`);

        // Processar referral se fornecido
        let referralMessage = '';
        if (referralCode) {
          try {
            // Simular processamento de referral (em produção, seria uma chamada interna)
            console.log(`🎁 Processando referral com código: ${referralCode}`);
            referralMessage = 'Referral processado! O usuário que te convidou ganhou XP.';
          } catch (referralError) {
            console.error('Erro ao processar referral:', referralError);
            // Não falhar o registro por causa do referral
          }
        }

        return res.status(201).json({
          success: true,
          message: 'Usuário registrado com sucesso',
          referralMessage,
          sessionToken,
          user: {
            username: userData.username,
            displayName: userData.displayName
          }
        });

      } else if (action === 'login') {
        // Login do usuário
        try {
          validateUserData(username, password);
        } catch (error) {
          return res.status(400).json({ error: error.message });
        }

        const userKey = `user:${username.toLowerCase()}`;
        
        // Buscar usuário
        let userData = null;
        if (isDevelopment && !hasKVConfig) {
          userData = localUsers.get(userKey);
        } else {
          userData = await kv.get(userKey);
        }

        if (!userData) {
          return res.status(401).json({ error: 'Usuário ou senha incorretos' });
        }

        // Verificar senha
        const passwordValid = await verifyPassword(password, userData.hashedPassword);
        if (!passwordValid) {
          return res.status(401).json({ error: 'Usuário ou senha incorretos' });
        }

        // Atualizar último login
        userData.lastLoginAt = new Date().toISOString();
        if (isDevelopment && !hasKVConfig) {
          localUsers.set(userKey, userData);
        } else {
          await kv.set(userKey, userData);
        }

        // 🔒 SEGURANÇA: Permitir múltiplas sessões simultâneas
        // Comentado para permitir login em múltiplos dispositivos
        // await invalidateUserSessions(userData.username);

        // Gerar token de sessão
        const sessionToken = generateSessionToken();
        const sessionData = {
          username: userData.username,
          displayName: userData.displayName,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
        };

        // Salvar sessão
        const sessionKey = `session:${sessionToken}`;
        if (isDevelopment && !hasKVConfig) {
          localSessions.set(sessionKey, sessionData);
          // Registrar sessão ativa para este usuário
          const userSessionsKey = `user_sessions:${userData.username}`;
          const userSessions = localSessions.get(userSessionsKey) || [];
          userSessions.push(sessionToken);
          localSessions.set(userSessionsKey, userSessions);
        } else {
          await kv.set(sessionKey, sessionData, { ex: 30 * 24 * 60 * 60 }); // 30 dias
          // Registrar sessão ativa para este usuário
          const userSessionsKey = `user_sessions:${userData.username}`;
          const userSessions = await kv.get(userSessionsKey) || [];
          userSessions.push(sessionToken);
          await kv.set(userSessionsKey, userSessions, { ex: 30 * 24 * 60 * 60 });
        }



        console.log(`✅ Login realizado: ${username}`);

        return res.status(200).json({
          success: true,
          message: 'Login realizado com sucesso',
          sessionToken,
          user: {
            username: userData.username,
            displayName: userData.displayName
          }
        });

      } else if (action === 'logout') {
        // Logout do usuário
        const { sessionToken } = req.body;

        if (sessionToken) {
          const sessionKey = `session:${sessionToken}`;

          // Obter dados da sessão antes de deletar para saber qual usuário
          let sessionData = null;
          if (isDevelopment && !hasKVConfig) {
            sessionData = localSessions.get(sessionKey);
            localSessions.delete(sessionKey);
          } else {
            sessionData = await kv.get(sessionKey);
            await kv.del(sessionKey);
          }

          // Remover sessão da lista de sessões ativas do usuário
          if (sessionData && sessionData.username) {
            const userSessionsKey = `user_sessions:${sessionData.username}`;

            if (isDevelopment && !hasKVConfig) {
              const userSessions = localSessions.get(userSessionsKey) || [];
              const updatedSessions = userSessions.filter(token => token !== sessionToken);
              if (updatedSessions.length > 0) {
                localSessions.set(userSessionsKey, updatedSessions);
              } else {
                localSessions.delete(userSessionsKey);
              }
            } else {
              const userSessions = await kv.get(userSessionsKey) || [];
              const updatedSessions = userSessions.filter(token => token !== sessionToken);
              if (updatedSessions.length > 0) {
                await kv.set(userSessionsKey, updatedSessions, { ex: 30 * 24 * 60 * 60 });
              } else {
                await kv.del(userSessionsKey);
              }
            }


          }
        }

        return res.status(200).json({
          success: true,
          message: 'Logout realizado com sucesso'
        });

      } else if (action === 'renew') {
        // Renovar token de sessão
        const { sessionToken, username } = req.body;

        if (!sessionToken || !username) {
          return res.status(400).json({ error: 'Token de sessão e username são obrigatórios' });
        }

        // Verificar se a sessão atual existe e é válida
        const sessionKey = `session:${sessionToken}`;
        let sessionData = null;

        if (isDevelopment && !hasKVConfig) {
          sessionData = localSessions.get(sessionKey);
        } else {
          sessionData = await kv.get(sessionKey);
        }

        if (!sessionData || sessionData.username !== username) {
          return res.status(401).json({ error: 'Sessão inválida para renovação' });
        }

        // Buscar dados atualizados do usuário
        const userKey = `user:${username}`;
        let userData = null;

        if (isDevelopment && !hasKVConfig) {
          userData = localUsers.get(userKey);
        } else {
          userData = await kv.get(userKey);
        }

        if (!userData) {
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Gerar novo token de sessão
        const newSessionToken = generateSessionToken();
        const newSessionData = {
          username: userData.username,
          displayName: userData.displayName,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
        };

        // Salvar nova sessão
        const newSessionKey = `session:${newSessionToken}`;
        if (isDevelopment && !hasKVConfig) {
          localSessions.set(newSessionKey, newSessionData);
          // Remover sessão antiga
          localSessions.delete(sessionKey);
        } else {
          await kv.set(newSessionKey, newSessionData);
          // Remover sessão antiga
          await kv.del(sessionKey);
        }

        // Atualizar último login
        userData.lastLoginAt = new Date().toISOString();
        if (isDevelopment && !hasKVConfig) {
          localUsers.set(userKey, userData);
        } else {
          await kv.set(userKey, userData);
        }

        return res.status(200).json({
          success: true,
          sessionToken: newSessionToken,
          user: {
            username: userData.username,
            displayName: userData.displayName,
            email: userData.email,
            createdAt: userData.createdAt,
            lastLoginAt: userData.lastLoginAt
          }
        });

      } else {
        return res.status(400).json({ error: 'Ação inválida' });
      }

    } else if (method === 'GET') {
      // Verificar sessão
      const { sessionToken } = req.query;

      if (!sessionToken) {
        return res.status(401).json({ error: 'Token de sessão não fornecido' });
      }

      const sessionKey = `session:${sessionToken}`;
      let sessionData = null;

      if (isDevelopment && !hasKVConfig) {
        sessionData = localSessions.get(sessionKey);
      } else {
        sessionData = await kv.get(sessionKey);
      }

      if (!sessionData) {
        return res.status(401).json({ error: 'Sessão inválida ou expirada' });
      }

      // Verificar se sessão expirou
      if (new Date() > new Date(sessionData.expiresAt)) {
        // Remover sessão expirada
        if (isDevelopment && !hasKVConfig) {
          localSessions.delete(sessionKey);
        } else {
          await kv.del(sessionKey);
        }
        return res.status(401).json({ error: 'Sessão expirada' });
      }

      return res.status(200).json({
        success: true,
        user: {
          username: sessionData.username,
          displayName: sessionData.displayName
        }
      });

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de autenticação:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
