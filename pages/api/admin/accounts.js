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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar autenticação de admin
  if (!verifyAdminAuth(req)) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    let accounts = [];

    if (isDevelopment && !hasKVConfig) {
      // Em desenvolvimento local sem KV, retornar dados simulados
      accounts = [
        {
          username: 'testuser1',
          displayName: 'Usuário Teste 1',
          email: 'test1@example.com',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          username: 'testuser2',
          displayName: 'Usuário Teste 2',
          email: 'test2@example.com',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          username: 'inactiveuser',
          displayName: 'Usuário Inativo',
          email: 'inactive@example.com',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastLoginAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    } else {
      // Em produção com KV, buscar dados reais
      const userKeys = await kv.keys('user:*');
      
      for (const key of userKeys) {
        try {
          const userData = await kv.get(key);
          if (userData && userData.username) {
            accounts.push({
              username: userData.username,
              displayName: userData.displayName || userData.username,
              email: userData.email || null,
              createdAt: userData.createdAt || new Date().toISOString(),
              lastLoginAt: userData.lastLoginAt || null
            });
          }
        } catch (error) {
          console.error(`Erro ao processar usuário ${key}:`, error);
        }
      }
    }

    // Ordenar por data de criação (mais recentes primeiro)
    accounts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      accounts,
      total: accounts.length
    });

  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
