import { kv } from '@vercel/kv';
import { localUsers, localProfiles, localSessions } from '../../../utils/storage';

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

    console.log(`🔍 Ambiente: ${isDevelopment ? 'desenvolvimento' : 'produção'}`);
    console.log(`🔍 KV Config: ${hasKVConfig ? 'disponível' : 'não disponível'}`);
    console.log(`🔍 Usando: ${(isDevelopment && !hasKVConfig) ? 'armazenamento local' : 'Vercel KV'}`);

    if (isDevelopment && !hasKVConfig) {
      // Em desenvolvimento local sem KV, remover dos Maps locais
      const authUsername = `auth_${username}`;
      let deletedKeys = [];
      let cleanupActions = [];

      console.log(`🗑️ Removendo conta local: ${username}`);

      // Chaves para remover do armazenamento local
      const keysToDelete = [
        `user:${authUsername}`,
        `profile:${authUsername}`,
        `sessions:${authUsername}`
      ];

      // Deletar do armazenamento local
      for (const key of keysToDelete) {
        if (localUsers.has(key)) {
          localUsers.delete(key);
          deletedKeys.push(key);
          console.log(`✅ Chave local deletada: ${key}`);
        }
        if (localProfiles.has(key)) {
          localProfiles.delete(key);
          deletedKeys.push(key);
          console.log(`✅ Perfil local deletado: ${key}`);
        }
        if (localSessions.has(key)) {
          localSessions.delete(key);
          deletedKeys.push(key);
          console.log(`✅ Sessão local deletada: ${key}`);
        }
      }

      // Buscar por username também (caso a chave seja diferente)
      for (const [key, userData] of localUsers.entries()) {
        if (userData && userData.username === username) {
          localUsers.delete(key);
          deletedKeys.push(key);
          console.log(`✅ Usuário local deletado por username: ${key}`);
        }
      }

      for (const [key, profileData] of localProfiles.entries()) {
        if (profileData && (profileData.username === username || key.includes(username))) {
          localProfiles.delete(key);
          deletedKeys.push(key);
          console.log(`✅ Perfil local deletado por username: ${key}`);
        }
      }

      cleanupActions.push(`Removido do armazenamento local em desenvolvimento`);

      console.log(`✅ Conta local ${username} removida completamente`);
      console.log(`📊 Chaves deletadas: ${deletedKeys.length}`);

      return res.status(200).json({
        success: true,
        message: `Conta '${username}' removida do armazenamento local`,
        deletedKeys,
        cleanupActions,
        totalDeleted: deletedKeys.length,
        errors: []
      });
    }

    // Em produção com KV, remover dados reais
    const authUsername = `auth_${username}`;

    console.log(`🗑️ Iniciando remoção da conta: ${username}`);
    console.log(`🔍 Procurando chaves para: ${username} e ${authUsername}`);

    // Chaves relacionadas ao usuário (testando ambos os formatos)
    const keysToDelete = [
      // Formato atual (sem auth_)
      `user:${username}`,
      `profile:${username}`,
      `friends:${username}`,
      `friend_requests:${username}`,
      `sent_requests:${username}`,
      `notifications:${username}`,
      `invites:${username}`,
      `sent_invites:${username}`,
      `sessions:${username}`,
      `referrals:${username}`,
      // Formato antigo (com auth_)
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

    // Verificar quais chaves existem antes de deletar
    console.log(`🔍 Verificando existência das chaves...`);
    const existingKeys = [];

    for (const key of keysToDelete) {
      try {
        const exists = await kv.get(key);
        if (exists !== null) {
          existingKeys.push(key);
          console.log(`✅ Encontrado: ${key}`);
        } else {
          console.log(`⚠️ Não encontrado: ${key}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar ${key}:`, error);
      }
    }

    console.log(`📊 Total de chaves encontradas: ${existingKeys.length}`);

    // Deletar apenas as chaves que existem
    for (const key of existingKeys) {
      try {
        const deleted = await kv.del(key);
        if (deleted > 0) {
          deletedKeys.push(key);
          console.log(`🗑️ Deletado: ${key}`);
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
