// API para gerenciar perfis de usuário no servidor
import { kv } from '@vercel/kv';
import { localProfiles, localSessions } from '../../utils/storage';

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

// Função para validar dados do perfil
const validateProfile = (profileData) => {
  console.log('🔍 Validando perfil:', JSON.stringify(profileData, null, 2));

  if (!profileData || typeof profileData !== 'object') {
    console.error('❌ Dados de perfil inválidos:', typeof profileData);
    throw new Error('Dados de perfil inválidos');
  }

  if (!profileData.id || typeof profileData.id !== 'string') {
    console.error('❌ ID do usuário inválido:', profileData.id);
    throw new Error('ID do usuário é obrigatório');
  }

  // Validação mais flexível para stats
  if (!profileData.stats || typeof profileData.stats !== 'object') {
    console.warn('⚠️ Estatísticas ausentes, criando estrutura padrão');
    profileData.stats = {
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
    };
  }

  console.log('✅ Perfil validado com sucesso');
  return true;
};

// Função para sanitizar dados do perfil (remover dados sensíveis se houver)
const sanitizeProfile = (profileData) => {
  // Por enquanto, retorna todos os dados
  // No futuro, pode remover campos sensíveis se necessário
  return profileData;
};

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      // Buscar perfil do usuário
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
      }

      const profileKey = `profile:${userId}`;
      let profile = null;

      if (isDevelopment && !hasKVConfig) {
        // Usar armazenamento local em desenvolvimento
        profile = localProfiles.get(profileKey);
      } else {
        // Usar Vercel KV em produção
        try {
          profile = await kv.get(profileKey);
        } catch (error) {
          console.error('Erro ao acessar KV:', error);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
      }

      if (!profile) {
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }

      return res.status(200).json({
        success: true,
        profile: sanitizeProfile(profile)
      });

    } else if (method === 'POST') {
      // 🔒 VERIFICAR AUTENTICAÇÃO ANTES DE SALVAR PERFIL
      const authResult = await verifyAuthentication(req);
      if (!authResult.authenticated) {
        console.warn('⚠️ Tentativa de salvar perfil sem autenticação:', authResult.error);
        return res.status(401).json({ error: authResult.error });
      }

      // Criar ou atualizar perfil
      console.log('📝 Recebendo dados para salvar perfil:', req.body);

      const { userId, profileData } = req.body;

      // Verificar se o userId corresponde ao usuário autenticado
      const expectedUserId = `auth_${authResult.username}`;
      if (userId !== expectedUserId) {
        console.warn('⚠️ Tentativa de salvar perfil de outro usuário:', { userId, expectedUserId });
        return res.status(403).json({ error: 'Não autorizado a modificar este perfil' });
      }

      if (!userId) {
        console.error('❌ ID do usuário não fornecido');
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
      }

      if (!profileData) {
        console.error('❌ Dados do perfil não fornecidos');
        return res.status(400).json({ error: 'Dados do perfil são obrigatórios' });
      }

      // Validar dados do perfil
      try {
        validateProfile(profileData);
      } catch (error) {
        console.error('❌ Erro na validação:', error.message);
        return res.status(400).json({
          error: error.message,
          receivedData: isDevelopment ? profileData : undefined
        });
      }

      // Adicionar timestamp de atualização
      const updatedProfile = {
        ...profileData,
        id: userId, // Garantir que o ID está correto
        lastSyncedAt: new Date().toISOString(),
        version: profileData.version || '1.0'
      };

      const profileKey = `profile:${userId}`;

      if (isDevelopment && !hasKVConfig) {
        // Usar armazenamento local em desenvolvimento
        localProfiles.set(profileKey, updatedProfile);
      } else {
        // Usar Vercel KV em produção
        try {
          await kv.set(profileKey, updatedProfile);
        } catch (error) {
          console.error('Erro ao salvar perfil no KV:', error);
          return res.status(500).json({ error: 'Erro ao salvar perfil' });
        }
      }

      console.log(`✅ Perfil ${userId} salvo com sucesso`);

      return res.status(200).json({
        success: true,
        message: 'Perfil salvo com sucesso',
        profile: sanitizeProfile(updatedProfile)
      });

    } else if (method === 'DELETE') {
      // Deletar conta do usuário
      const authResult = await authenticateRequest(req);
      if (!authResult.success) {
        return res.status(401).json({ error: authResult.error });
      }

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
      }

      // Verificar se o userId corresponde ao usuário autenticado
      const expectedUserId = `auth_${authResult.username}`;
      if (userId !== expectedUserId) {
        console.warn('⚠️ Tentativa de deletar conta de outro usuário:', { userId, expectedUserId });
        return res.status(403).json({ error: 'Não autorizado a deletar esta conta' });
      }

      const profileKey = `profile:${userId}`;
      const userKey = `user:${authResult.username}`;

      if (isDevelopment && !hasKVConfig) {
        // Usar armazenamento local em desenvolvimento
        const { localProfiles, localUsers, localSessions } = require('./auth');

        // Deletar perfil
        localProfiles.delete(profileKey);

        // Deletar usuário
        localUsers.delete(userKey);

        // Deletar todas as sessões do usuário
        for (const [sessionKey, sessionData] of localSessions.entries()) {
          if (sessionData.username === authResult.username) {
            localSessions.delete(sessionKey);
          }
        }
      } else {
        // Usar Vercel KV em produção
        try {
          // Deletar perfil
          await kv.del(profileKey);

          // Deletar usuário
          await kv.del(userKey);

          // Deletar sessão atual
          if (authResult.sessionToken) {
            await kv.del(`session:${authResult.sessionToken}`);
          }

          // Buscar e deletar outras sessões do usuário
          const sessionKeys = await kv.keys('session:*');
          for (const sessionKey of sessionKeys) {
            const sessionData = await kv.get(sessionKey);
            if (sessionData && sessionData.username === authResult.username) {
              await kv.del(sessionKey);
            }
          }
        } catch (error) {
          console.error('Erro ao deletar conta do KV:', error);
          return res.status(500).json({ error: 'Erro ao deletar conta' });
        }
      }

      console.log(`🗑️ Conta ${authResult.username} (${userId}) deletada completamente`);

      return res.status(200).json({
        success: true,
        message: 'Conta deletada com sucesso'
      });

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de perfil:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
