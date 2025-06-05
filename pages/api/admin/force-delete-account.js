// API para forçar deleção completa de conta (para debug e correção)
import { kv } from '@vercel/kv';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = (process.env.KV_REST_API_URL || process.env.KV_URL) && process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  // Verificar se é método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar senha de admin (simples proteção)
  const { adminPassword, username } = req.body;
  if (adminPassword !== 'reset123') {
    return res.status(401).json({ error: 'Senha de admin incorreta' });
  }

  if (!username) {
    return res.status(400).json({ error: 'Username é obrigatório' });
  }

  try {
    console.log(`🗑️ [FORCE DELETE] Iniciando deleção forçada da conta: ${username}`);

    const userId = `auth_${username}`;
    const userKey = `user:${username}`;
    const profileKey = `profile:${userId}`;
    const friendsKey = `friends:${userId}`;
    const friendRequestsKey = `friend_requests:${userId}`;
    const sentRequestsKey = `sent_requests:${userId}`;

    const deletionResults = {
      username: username,
      userId: userId,
      deletedKeys: [],
      errors: [],
      cleanupActions: []
    };

    if (isDevelopment && !hasKVConfig) {
      // Limpeza no storage local
      const { localUsers, localSessions } = require('../../../utils/storage');

      // Deletar usuário
      if (localUsers.has(userKey)) {
        localUsers.delete(userKey);
        deletionResults.deletedKeys.push(userKey);
      }

      // Deletar sessões
      for (const [sessionKey, sessionData] of localSessions.entries()) {
        if (sessionData.username === username) {
          localSessions.delete(sessionKey);
          deletionResults.deletedKeys.push(sessionKey);
        }
      }

    } else {
      // Limpeza no Vercel KV

      // 1. Deletar dados principais
      const mainKeys = [userKey, profileKey, friendsKey, friendRequestsKey, sentRequestsKey];

      for (const key of mainKeys) {
        try {
          const exists = await kv.exists(key);
          if (exists) {
            await kv.del(key);
            deletionResults.deletedKeys.push(key);
            console.log(`✅ Deletado: ${key}`);
          }
        } catch (error) {
          deletionResults.errors.push(`Erro ao deletar ${key}: ${error.message}`);
          console.error(`❌ Erro ao deletar ${key}:`, error);
        }
      }

      // 2. Deletar todas as sessões do usuário
      try {
        const sessionKeys = await kv.keys('session:*');
        for (const sessionKey of sessionKeys) {
          try {
            const sessionData = await kv.get(sessionKey);
            if (sessionData && sessionData.username === username) {
              await kv.del(sessionKey);
              deletionResults.deletedKeys.push(sessionKey);
              console.log(`✅ Sessão deletada: ${sessionKey}`);
            }
          } catch (error) {
            deletionResults.errors.push(`Erro ao deletar sessão ${sessionKey}: ${error.message}`);
          }
        }
      } catch (error) {
        deletionResults.errors.push(`Erro ao buscar sessões: ${error.message}`);
      }

      // 3. Deletar dados diários
      try {
        const dailyKeys = await kv.keys('daily:*');
        for (const dailyKey of dailyKeys) {
          try {
            const dailyData = await kv.get(dailyKey);
            if (dailyData && dailyData.userId === userId) {
              await kv.del(dailyKey);
              deletionResults.deletedKeys.push(dailyKey);
              console.log(`✅ Dados diários deletados: ${dailyKey}`);
            }
          } catch (error) {
            deletionResults.errors.push(`Erro ao deletar dados diários ${dailyKey}: ${error.message}`);
          }
        }
      } catch (error) {
        deletionResults.errors.push(`Erro ao buscar dados diários: ${error.message}`);
      }

      // 4. Remover das listas de amigos de outros usuários
      try {
        const allFriendsKeys = await kv.keys('friends:*');
        for (const friendsListKey of allFriendsKeys) {
          if (friendsListKey === friendsKey) continue; // Já deletado acima

          try {
            const friendsList = await kv.get(friendsListKey) || [];
            const originalLength = friendsList.length;
            const filteredList = friendsList.filter(friend => friend.id !== userId);

            if (filteredList.length !== originalLength) {
              await kv.set(friendsListKey, filteredList);
              deletionResults.cleanupActions.push(`Removido de lista de amigos: ${friendsListKey}`);
              console.log(`✅ Removido da lista de amigos: ${friendsListKey}`);
            }
          } catch (error) {
            deletionResults.errors.push(`Erro ao limpar lista de amigos ${friendsListKey}: ${error.message}`);
          }
        }
      } catch (error) {
        deletionResults.errors.push(`Erro ao buscar listas de amigos: ${error.message}`);
      }

      // 5. Remover solicitações pendentes em outras listas
      try {
        const allRequestKeys = await kv.keys('friend_requests:*');
        for (const requestKey of allRequestKeys) {
          if (requestKey === friendRequestsKey) continue; // Já deletado acima

          try {
            const requests = await kv.get(requestKey) || [];
            const originalLength = requests.length;
            const filteredRequests = requests.filter(req => req.fromUserId !== userId);

            if (filteredRequests.length !== originalLength) {
              await kv.set(requestKey, filteredRequests);
              deletionResults.cleanupActions.push(`Removido solicitações de: ${requestKey}`);
              console.log(`✅ Removido solicitações de: ${requestKey}`);
            }
          } catch (error) {
            deletionResults.errors.push(`Erro ao limpar solicitações ${requestKey}: ${error.message}`);
          }
        }
      } catch (error) {
        deletionResults.errors.push(`Erro ao buscar solicitações: ${error.message}`);
      }
    }

    const success = deletionResults.errors.length === 0;
    const summary = success ?
      `✅ Conta ${username} foi completamente deletada` :
      `⚠️ Conta ${username} foi parcialmente deletada com ${deletionResults.errors.length} erros`;

    console.log(`🎉 [FORCE DELETE] ${summary}`);
    console.log(`📊 Chaves deletadas: ${deletionResults.deletedKeys.length}`);
    console.log(`🧹 Ações de limpeza: ${deletionResults.cleanupActions.length}`);
    console.log(`❌ Erros: ${deletionResults.errors.length}`);

    return res.status(success ? 200 : 207).json({
      success: success,
      summary: summary,
      ...deletionResults
    });

  } catch (error) {
    console.error('❌ Erro durante a deleção forçada:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
