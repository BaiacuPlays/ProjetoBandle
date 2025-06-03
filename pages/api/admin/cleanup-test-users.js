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

// Lista de usuários de teste para remover
const TEST_USERS = [
  'newuser123',
  'referrer123', 
  'testuser1',
  'testuser2'
];

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar autenticação de admin
  if (!verifyAdminAuth(req)) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    let deletedKeys = [];
    let errors = [];

    if (isDevelopment && !hasKVConfig) {
      // Em desenvolvimento local sem KV, simular remoção
      return res.status(200).json({
        success: true,
        message: 'Usuários de teste removidos (simulado em desenvolvimento)',
        deletedUsers: TEST_USERS,
        deletedKeys: TEST_USERS.map(user => `user:auth_${user}`),
        errors: []
      });
    }

    // Em produção com KV, remover dados reais
    for (const username of TEST_USERS) {
      try {
        const authUsername = `auth_${username}`;
        
        // Chaves relacionadas ao usuário
        const keysToDelete = [
          `user:${authUsername}`,
          `profile:${authUsername}`,
          `friends:${authUsername}`,
          `friend_requests:${authUsername}`,
          `sent_requests:${authUsername}`,
          `notifications:${authUsername}`,
          `invites:${authUsername}`,
          `sent_invites:${authUsername}`
        ];

        // Tentar deletar cada chave
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
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao buscar dados diários:`, error);
        }

        // Limpar referências em listas de amigos de outros usuários
        try {
          const allFriendKeys = await kv.keys('friends:*');
          for (const friendKey of allFriendKeys) {
            try {
              const friendsList = await kv.get(friendKey);
              if (friendsList && Array.isArray(friendsList)) {
                const filteredList = friendsList.filter(friend => 
                  friend.username !== username && friend.userId !== authUsername
                );
                if (filteredList.length !== friendsList.length) {
                  await kv.set(friendKey, filteredList);
                  console.log(`✅ Referências removidas de ${friendKey}`);
                }
              }
            } catch (error) {
              console.error(`❌ Erro ao limpar ${friendKey}:`, error);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao limpar referências de amigos:`, error);
        }

        // Limpar solicitações de amizade pendentes
        try {
          const allRequestKeys = await kv.keys('friend_requests:*');
          for (const requestKey of allRequestKeys) {
            try {
              const requests = await kv.get(requestKey);
              if (requests && Array.isArray(requests)) {
                const filteredRequests = requests.filter(req => 
                  req.fromUserId !== authUsername && req.toUserId !== authUsername
                );
                if (filteredRequests.length !== requests.length) {
                  await kv.set(requestKey, filteredRequests);
                  console.log(`✅ Solicitações removidas de ${requestKey}`);
                }
              }
            } catch (error) {
              console.error(`❌ Erro ao limpar ${requestKey}:`, error);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao limpar solicitações:`, error);
        }

        console.log(`✅ Usuário ${username} removido completamente`);

      } catch (error) {
        console.error(`❌ Erro ao remover usuário ${username}:`, error);
        errors.push(`Erro ao remover ${username}: ${error.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `${TEST_USERS.length} usuários de teste removidos`,
      deletedUsers: TEST_USERS,
      deletedKeys,
      totalDeleted: deletedKeys.length,
      errors
    });

  } catch (error) {
    console.error('Erro geral na limpeza:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
