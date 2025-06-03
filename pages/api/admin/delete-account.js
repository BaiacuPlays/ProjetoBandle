import { kv } from '@vercel/kv';

// Configuração para desenvolvimento local
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_URL && process.env.KV_REST_API_URL;

// Função para verificar autenticação de admin
const verifyAdminAuth = (req) => {
  const authHeader = req.headers.authorization;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const password = authHeader.substring(7);
  return password === ADMIN_PASSWORD;
};

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar autenticação de admin
  if (!verifyAdminAuth(req)) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username é obrigatório' });
  }

  try {
    let deletedKeys = [];
    let errors = [];
    let cleanupActions = [];

    if (isDevelopment && !hasKVConfig) {
      // Em desenvolvimento local sem KV, simular remoção
      return res.status(200).json({
        success: true,
        message: `Conta '${username}' removida (simulado em desenvolvimento)`,
        deletedKeys: [`user:auth_${username}`, `profile:auth_${username}`],
        cleanupActions: ['Simulação de limpeza em desenvolvimento'],
        errors: []
      });
    }

    // Em produção com KV, remover dados reais
    const authUsername = `auth_${username}`;
    
    console.log(`🗑️ Iniciando remoção da conta: ${username}`);

    // Chaves relacionadas ao usuário
    const keysToDelete = [
      `user:${authUsername}`,
      `profile:${authUsername}`,
      `friends:${authUsername}`,
      `friend_requests:${authUsername}`,
      `sent_requests:${authUsername}`,
      `notifications:${authUsername}`,
      `invites:${authUsername}`,
      `sent_invites:${authUsername}`,
      `sessions:${authUsername}`,
      `referrals:${authUsername}`
    ];

    // Deletar chaves principais
    for (const key of keysToDelete) {
      try {
        const deleted = await kv.del(key);
        if (deleted > 0) {
          deletedKeys.push(key);
          console.log(`✅ Chave deletada: ${key}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao deletar ${key}:`, error);
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
            console.log(`✅ Dados diários deletados: ${dailyKey}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao processar ${dailyKey}:`, error);
          errors.push(`Erro ao processar ${dailyKey}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar dados diários:`, error);
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
              friend.username !== username && friend.userId !== authUsername
            );
            
            if (filteredList.length !== originalLength) {
              await kv.set(friendKey, filteredList);
              friendsCleanedCount++;
              console.log(`✅ Referências removidas de ${friendKey}`);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao limpar ${friendKey}:`, error);
          errors.push(`Erro ao limpar ${friendKey}: ${error.message}`);
        }
      }
      
      if (friendsCleanedCount > 0) {
        cleanupActions.push(`Referências removidas de ${friendsCleanedCount} listas de amigos`);
      }
    } catch (error) {
      console.error(`❌ Erro ao limpar referências de amigos:`, error);
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
              req.fromUserId !== authUsername && 
              req.toUserId !== authUsername &&
              req.fromUsername !== username &&
              req.toUsername !== username
            );
            
            if (filteredRequests.length !== originalLength) {
              await kv.set(requestKey, filteredRequests);
              requestsCleanedCount++;
              console.log(`✅ Solicitações removidas de ${requestKey}`);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao limpar ${requestKey}:`, error);
          errors.push(`Erro ao limpar ${requestKey}: ${error.message}`);
        }
      }
      
      if (requestsCleanedCount > 0) {
        cleanupActions.push(`Solicitações removidas de ${requestsCleanedCount} listas`);
      }
    } catch (error) {
      console.error(`❌ Erro ao limpar solicitações:`, error);
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
              notif.fromUserId !== authUsername &&
              notif.fromUsername !== username
            );
            
            if (filteredNotifications.length !== originalLength) {
              await kv.set(notifKey, filteredNotifications);
              notificationsCleanedCount++;
              console.log(`✅ Notificações limpas de ${notifKey}`);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao limpar ${notifKey}:`, error);
          errors.push(`Erro ao limpar ${notifKey}: ${error.message}`);
        }
      }
      
      if (notificationsCleanedCount > 0) {
        cleanupActions.push(`Notificações limpas de ${notificationsCleanedCount} usuários`);
      }
    } catch (error) {
      console.error(`❌ Erro ao limpar notificações:`, error);
      errors.push(`Erro ao limpar notificações: ${error.message}`);
    }

    console.log(`✅ Conta ${username} removida completamente`);
    console.log(`📊 Chaves deletadas: ${deletedKeys.length}`);
    console.log(`🧹 Ações de limpeza: ${cleanupActions.length}`);
    console.log(`❌ Erros: ${errors.length}`);

    return res.status(200).json({
      success: true,
      message: `Conta '${username}' removida com sucesso`,
      deletedKeys,
      cleanupActions,
      totalDeleted: deletedKeys.length,
      errors
    });

  } catch (error) {
    console.error('Erro geral na remoção da conta:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
