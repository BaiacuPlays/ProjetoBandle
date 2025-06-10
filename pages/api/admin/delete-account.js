import { kv } from '@vercel/kv';
import { localUsers, localProfiles, localSessions } from '../../../utils/storage';

// Configuração para desenvolvimento local
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_URL && process.env.KV_REST_API_URL;

// Função para verificar autenticação de admin
const verifyAdminAuth = (req) => {
  const authHeader = req.headers.authorization;
  const xAdminKey = req.headers['x-admin-key'];

  // Aceitar tanto Bearer token quanto x-admin-key
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const ADMIN_KEY = 'laikas2'; // Chave específica do painel

  // Verificar Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const password = authHeader.substring(7);
    return password === ADMIN_PASSWORD || password === ADMIN_KEY;
  }

  // Verificar x-admin-key header
  if (xAdminKey) {
    return xAdminKey === ADMIN_PASSWORD || xAdminKey === ADMIN_KEY;
  }

  return false;
};

export default async function handler(req, res) {
  // Aceitar tanto DELETE quanto POST para compatibilidade
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar autenticação de admin
  if (!verifyAdminAuth(req)) {
    console.log('❌ Autenticação de admin falhou');
    console.log('Headers:', req.headers.authorization, req.headers['x-admin-key']);
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { username, userId } = req.body;
  const targetUsername = username || userId; // Aceitar ambos para compatibilidade

  if (!targetUsername) {
    return res.status(400).json({ error: 'Username é obrigatório' });
  }

  console.log(`🗑️ [ADMIN DELETE] Iniciando deleção da conta: ${targetUsername}`);

  try {
    let deletedKeys = [];
    let errors = [];
    let cleanupActions = [];

    console.log(`🔍 Ambiente: ${isDevelopment ? 'desenvolvimento' : 'produção'}`);
    console.log(`🔍 KV Config: ${hasKVConfig ? 'disponível' : 'não disponível'}`);
    console.log(`🔍 Usando: ${(isDevelopment && !hasKVConfig) ? 'armazenamento local' : 'Vercel KV'}`);

    if (isDevelopment && !hasKVConfig) {
      // Em desenvolvimento local sem KV, remover dos Maps locais
      const authUsername = `auth_${targetUsername}`;
      let deletedKeys = [];
      let cleanupActions = [];



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
        if (userData && userData.username === targetUsername) {
          localUsers.delete(key);
          deletedKeys.push(key);
          console.log(`✅ Usuário local deletado por username: ${key}`);
        }
      }

      for (const [key, profileData] of localProfiles.entries()) {
        if (profileData && (profileData.username === targetUsername || key.includes(targetUsername))) {
          localProfiles.delete(key);
          deletedKeys.push(key);
          console.log(`✅ Perfil local deletado por username: ${key}`);
        }
      }

      cleanupActions.push(`Removido do armazenamento local em desenvolvimento`);

      console.log(`✅ Conta local ${targetUsername} removida completamente`);
      console.log(`📊 Chaves deletadas: ${deletedKeys.length}`);

      return res.status(200).json({
        success: true,
        message: `Conta '${targetUsername}' removida do armazenamento local`,
        deletedKeys,
        cleanupActions,
        totalDeleted: deletedKeys.length,
        errors: []
      });
    }

    // Em produção com KV, remover dados reais
    const authUsername = `auth_${targetUsername}`;

    console.log(`🗑️ Iniciando remoção da conta: ${targetUsername}`);
    console.log(`🔍 Procurando chaves para: ${targetUsername} e ${authUsername}`);

    // Chaves relacionadas ao usuário (testando ambos os formatos)
    const keysToDelete = [
      // Formato atual (sem auth_)
      `user:${targetUsername}`,
      `profile:${targetUsername}`,
      `friends:${targetUsername}`,
      `friend_requests:${targetUsername}`,
      `sent_requests:${targetUsername}`,
      `notifications:${targetUsername}`,
      `invites:${targetUsername}`,
      `sent_invites:${targetUsername}`,
      `sessions:${targetUsername}`,
      `referrals:${targetUsername}`,
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
          if (dailyData && dailyData.username === targetUsername) {
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
              friend.username !== targetUsername && friend.userId !== authUsername
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
              req.fromUsername !== targetUsername &&
              req.toUsername !== targetUsername
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
              !notif.message?.includes(targetUsername) &&
              notif.fromUserId !== authUsername &&
              notif.fromUsername !== targetUsername
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

    console.log(`✅ Conta ${targetUsername} removida completamente`);
    console.log(`📊 Chaves deletadas: ${deletedKeys.length}`);
    console.log(`🧹 Ações de limpeza: ${cleanupActions.length}`);
    console.log(`❌ Erros: ${errors.length}`);

    return res.status(200).json({
      success: true,
      message: `Conta '${targetUsername}' removida com sucesso`,
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
