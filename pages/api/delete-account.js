// API para usuário deletar sua própria conta
import { verifyAuthentication } from '../../utils/auth';
import { localUsers, localProfiles, localSessions } from '../../utils/storage';
import { isDevelopment, hasKVConfig, kvGet, kvSet, kvDel } from '../../utils/kv-config';

// Importação segura do KV
let kv = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
  }
} catch (error) {
  // KV não disponível
}

// Função para invalidar todas as sessões de um usuário (copiada de auth.js)
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

    console.log(`🔒 [DELETE] Invalidando ${userSessions.length} sessões para usuário: ${username}`);

    // Invalidar cada sessão
    for (const sessionToken of userSessions) {
      const sessionKey = `session:${sessionToken}`;

      if (isDevelopment && !hasKVConfig) {
        localSessions.delete(sessionKey);
      } else {
        await kv.del(sessionKey);
      }
    }

    // Limpar lista de sessões do usuário
    if (isDevelopment && !hasKVConfig) {
      localSessions.delete(userSessionsKey);
    } else {
      await kv.del(userSessionsKey);
    }

    console.log(`✅ [DELETE] Sessões invalidadas para usuário: ${username}`);
    return userSessions.length;
  } catch (error) {
    console.error(`❌ [DELETE] Erro ao invalidar sessões do usuário ${username}:`, error);
    return 0;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const authResult = await verifyAuthentication(req);
    if (!authResult.authenticated) {
      console.warn('⚠️ Tentativa de deletar conta sem autenticação:', authResult.error);
      return res.status(401).json({ error: authResult.error });
    }

    const userId = authResult.userId;
    const username = authResult.username;

    console.log(`🗑️ [DELETE ACCOUNT] Iniciando deleção da conta: ${username} (${userId})`);

    let deletedKeys = [];
    let errors = [];
    let cleanupActions = [];

    // 🔒 PRIMEIRO: Invalidar todas as sessões do usuário para impedir novos logins
    try {
      const invalidatedSessions = await invalidateUserSessions(username);
      if (invalidatedSessions > 0) {
        cleanupActions.push(`${invalidatedSessions} sessões invalidadas`);
      }
    } catch (error) {
      console.error(`❌ [DELETE] Erro ao invalidar sessões:`, error);
      errors.push(`Erro ao invalidar sessões: ${error.message}`);
    }

    if (isDevelopment && !hasKVConfig) {
      // Em desenvolvimento local, usar storage local


      // Deletar do storage local
      const userKey = `user:${username.toLowerCase()}`; // Chave correta do usuário
      const profileKey = `profile:${userId}`;

      if (localUsers.has(userKey)) {
        localUsers.delete(userKey);
        deletedKeys.push(userKey);

      }

      if (localProfiles.has(profileKey)) {
        localProfiles.delete(profileKey);
        deletedKeys.push(profileKey);

      }

      // Limpar sessões
      for (const [sessionKey, sessionData] of localSessions.entries()) {
        if (sessionData.userId === userId) {
          localSessions.delete(sessionKey);
          deletedKeys.push(sessionKey);
          console.log(`✅ [DEV] Sessão removida: ${sessionKey}`);
        }
      }

      cleanupActions.push('Dados removidos do storage local de desenvolvimento');

    } else {
      // Em produção, usar Vercel KV
      console.log(`🗑️ [PROD] Deletando conta ${username} do Vercel KV...`);

      // Chaves relacionadas ao usuário
      const keysToDelete = [
        `user:${username.toLowerCase()}`, // Chave correta do usuário (por username, não userId)
        `profile:${userId}`,
        `friends:${userId}`,
        `friend_requests:${userId}`,
        `sent_requests:${userId}`,
        `notifications:${userId}`,
        `invites:${userId}`,
        `sent_invites:${userId}`,
        `sessions:${userId}`,
        `referrals:${userId}`,
        `user_sessions:${username}` // Lista de sessões do usuário
      ];

      // Deletar chaves principais
      for (const key of keysToDelete) {
        try {
          // Verificar se a chave existe antes de deletar
          const exists = await kv.get(key);
          console.log(`🔍 [PROD] Verificando chave ${key}: ${exists ? 'EXISTE' : 'NÃO EXISTE'}`);

          const deleted = await kv.del(key);
          if (deleted > 0) {
            deletedKeys.push(key);
            console.log(`✅ [PROD] Chave deletada: ${key}`);
          } else {
            console.log(`⚠️ [PROD] Chave não encontrada para deletar: ${key}`);
          }
        } catch (error) {
          console.error(`❌ [PROD] Erro ao deletar ${key}:`, error);
          errors.push(`Erro ao deletar ${key}: ${error.message}`);
        }
      }

      // Buscar e remover dados diários (daily_*)
      try {
        const dailyKeys = await kv.keys(`daily_*`);
        for (const dailyKey of dailyKeys) {
          try {
            const dailyData = await kv.get(dailyKey);
            if (dailyData && dailyData.username === username) {
              await kv.del(dailyKey);
              deletedKeys.push(dailyKey);
              console.log(`✅ [PROD] Dados diários deletados: ${dailyKey}`);
            }
          } catch (error) {
            console.error(`❌ [PROD] Erro ao processar ${dailyKey}:`, error);
            errors.push(`Erro ao processar ${dailyKey}: ${error.message}`);
          }
        }
      } catch (error) {
        console.error(`❌ [PROD] Erro ao buscar dados diários:`, error);
        errors.push(`Erro ao buscar dados diários: ${error.message}`);
      }

      // Limpar referências em listas de amigos de outros usuários
      try {
        const allFriendKeys = await kv.keys('friends:*');
        let friendsCleanedCount = 0;

        for (const friendKey of allFriendKeys) {
          try {
            const friendsList = await kv.get(friendKey);
            if (friendsList && Array.isArray(friendsList)) {
              const originalLength = friendsList.length;
              const filteredList = friendsList.filter(friend =>
                friend.username !== username && friend.userId !== userId
              );

              if (filteredList.length !== originalLength) {
                await kv.set(friendKey, filteredList);
                friendsCleanedCount++;
                console.log(`✅ [PROD] Referências removidas de ${friendKey}`);
              }
            }
          } catch (error) {
            console.error(`❌ [PROD] Erro ao limpar ${friendKey}:`, error);
            errors.push(`Erro ao limpar ${friendKey}: ${error.message}`);
          }
        }

        if (friendsCleanedCount > 0) {
          cleanupActions.push(`Referências removidas de ${friendsCleanedCount} listas de amigos`);
        }
      } catch (error) {
        console.error(`❌ [PROD] Erro ao limpar referências de amigos:`, error);
        errors.push(`Erro ao limpar referências de amigos: ${error.message}`);
      }

      // Limpar solicitações de amizade pendentes
      try {
        const allRequestKeys = await kv.keys('friend_requests:*');
        const allSentRequestKeys = await kv.keys('sent_requests:*');
        let requestsCleanedCount = 0;

        for (const requestKey of [...allRequestKeys, ...allSentRequestKeys]) {
          try {
            const requests = await kv.get(requestKey);
            if (requests && Array.isArray(requests)) {
              const originalLength = requests.length;
              const filteredRequests = requests.filter(req =>
                req.fromUserId !== userId &&
                req.toUserId !== userId &&
                req.fromUsername !== username &&
                req.toUsername !== username
              );

              if (filteredRequests.length !== originalLength) {
                await kv.set(requestKey, filteredRequests);
                requestsCleanedCount++;
                console.log(`✅ [PROD] Solicitações removidas de ${requestKey}`);
              }
            }
          } catch (error) {
            console.error(`❌ [PROD] Erro ao limpar ${requestKey}:`, error);
            errors.push(`Erro ao limpar ${requestKey}: ${error.message}`);
          }
        }

        if (requestsCleanedCount > 0) {
          cleanupActions.push(`Solicitações removidas de ${requestsCleanedCount} listas`);
        }
      } catch (error) {
        console.error(`❌ [PROD] Erro ao limpar solicitações:`, error);
        errors.push(`Erro ao limpar solicitações: ${error.message}`);
      }

      // Limpar notificações que mencionam este usuário
      try {
        const allNotificationKeys = await kv.keys('notifications:*');
        let notificationsCleanedCount = 0;

        for (const notifKey of allNotificationKeys) {
          try {
            const notifications = await kv.get(notifKey);
            if (notifications && Array.isArray(notifications)) {
              const originalLength = notifications.length;
              const filteredNotifications = notifications.filter(notif =>
                !notif.message?.includes(username) &&
                notif.fromUserId !== userId &&
                notif.fromUsername !== username
              );

              if (filteredNotifications.length !== originalLength) {
                await kv.set(notifKey, filteredNotifications);
                notificationsCleanedCount++;
                console.log(`✅ [PROD] Notificações limpas de ${notifKey}`);
              }
            }
          } catch (error) {
            console.error(`❌ [PROD] Erro ao limpar ${notifKey}:`, error);
            errors.push(`Erro ao limpar ${notifKey}: ${error.message}`);
          }
        }

        if (notificationsCleanedCount > 0) {
          cleanupActions.push(`Notificações limpas de ${notificationsCleanedCount} usuários`);
        }
      } catch (error) {
        console.error(`❌ [PROD] Erro ao limpar notificações:`, error);
        errors.push(`Erro ao limpar notificações: ${error.message}`);
      }
    }

    console.log(`✅ [DELETE ACCOUNT] Conta ${username} removida completamente`);
    console.log(`📊 [DELETE ACCOUNT] Chaves deletadas: ${deletedKeys.length}`);
    console.log(`🧹 [DELETE ACCOUNT] Ações de limpeza: ${cleanupActions.length}`);
    console.log(`❌ [DELETE ACCOUNT] Erros: ${errors.length}`);

    return res.status(200).json({
      success: true,
      message: `Conta '${username}' removida com sucesso`,
      deletedKeys,
      cleanupActions,
      totalDeleted: deletedKeys.length,
      errors
    });

  } catch (error) {
    console.error('❌ [DELETE ACCOUNT] Erro geral na remoção da conta:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
