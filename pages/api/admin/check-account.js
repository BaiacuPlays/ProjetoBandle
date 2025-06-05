// API para verificar se uma conta existe (para debug)
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
    console.log(`🔍 Verificando conta: ${username}`);

    const userId = `auth_${username}`;
    const userKey = `user:${username}`;
    const profileKey = `profile:${userId}`;
    const friendsKey = `friends:${userId}`;
    const friendRequestsKey = `friend_requests:${userId}`;
    const sentRequestsKey = `sent_requests:${userId}`;

    const results = {
      username: username,
      userId: userId,
      checks: {}
    };

    if (isDevelopment && !hasKVConfig) {
      // Verificar no storage local
      const { localUsers, localSessions } = require('../../../utils/storage');

      results.checks.user = localUsers.has(userKey);
      results.checks.profile = false; // Não implementado no local storage
      results.checks.sessions = [];

      // Verificar sessões
      for (const [sessionKey, sessionData] of localSessions.entries()) {
        if (sessionData.username === username) {
          results.checks.sessions.push(sessionKey);
        }
      }

      results.checks.friends = false; // Não implementado no local storage
      results.checks.friendRequests = false;
      results.checks.sentRequests = false;

    } else {
      // Verificar no Vercel KV
      results.checks.user = await kv.exists(userKey);
      results.checks.profile = await kv.exists(profileKey);
      results.checks.friends = await kv.exists(friendsKey);
      results.checks.friendRequests = await kv.exists(friendRequestsKey);
      results.checks.sentRequests = await kv.exists(sentRequestsKey);

      // Verificar sessões
      const sessionKeys = await kv.keys('session:*');
      results.checks.sessions = [];

      for (const sessionKey of sessionKeys) {
        const sessionData = await kv.get(sessionKey);
        if (sessionData && sessionData.username === username) {
          results.checks.sessions.push(sessionKey);
        }
      }

      // Verificar dados diários
      const dailyKeys = await kv.keys('daily:*');
      results.checks.dailyData = [];

      for (const dailyKey of dailyKeys) {
        const dailyData = await kv.get(dailyKey);
        if (dailyData && dailyData.userId === userId) {
          results.checks.dailyData.push(dailyKey);
        }
      }

      // Verificar se aparece em listas de amigos de outros usuários
      const allFriendsKeys = await kv.keys('friends:*');
      results.checks.appearsInOtherFriendsLists = [];

      for (const friendsListKey of allFriendsKeys) {
        if (friendsListKey === friendsKey) continue; // Pular própria lista

        const friendsList = await kv.get(friendsListKey) || [];
        const appearsInList = friendsList.some(friend => friend.id === userId);

        if (appearsInList) {
          results.checks.appearsInOtherFriendsLists.push(friendsListKey);
        }
      }

      // Verificar solicitações pendentes em outras listas
      const allRequestKeys = await kv.keys('friend_requests:*');
      results.checks.appearsInOtherRequests = [];

      for (const requestKey of allRequestKeys) {
        if (requestKey === friendRequestsKey) continue; // Pular própria lista

        const requests = await kv.get(requestKey) || [];
        const appearsInRequests = requests.some(req => req.fromUserId === userId);

        if (appearsInRequests) {
          results.checks.appearsInOtherRequests.push(requestKey);
        }
      }
    }

    // Determinar se a conta existe
    const accountExists = results.checks.user ||
                         results.checks.profile ||
                         results.checks.sessions.length > 0 ||
                         results.checks.friends ||
                         results.checks.friendRequests ||
                         results.checks.sentRequests ||
                         (results.checks.dailyData && results.checks.dailyData.length > 0) ||
                         (results.checks.appearsInOtherFriendsLists && results.checks.appearsInOtherFriendsLists.length > 0) ||
                         (results.checks.appearsInOtherRequests && results.checks.appearsInOtherRequests.length > 0);

    results.accountExists = accountExists;
    results.summary = accountExists ?
      '❌ Conta ainda existe (não foi completamente deletada)' :
      '✅ Conta foi completamente deletada';

    console.log(`🔍 Resultado da verificação:`, results);

    return res.status(200).json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
