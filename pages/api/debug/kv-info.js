import { kv } from '@vercel/kv';

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
    console.log('🔍 Buscando informações do Vercel KV...');

    // Buscar todas as chaves de usuários
    const userKeys = await kv.keys('user:*');
    console.log(`📊 Encontradas ${userKeys.length} chaves de usuário:`, userKeys);

    const usersData = [];
    for (const key of userKeys.slice(0, 10)) { // Limitar a 10 para não sobrecarregar
      try {
        const userData = await kv.get(key);
        usersData.push({
          key,
          username: userData?.username,
          displayName: userData?.displayName,
          hasData: !!userData
        });
      } catch (error) {
        console.error(`Erro ao buscar ${key}:`, error);
      }
    }

    // Buscar chaves de perfil
    const profileKeys = await kv.keys('profile:*');
    console.log(`📊 Encontradas ${profileKeys.length} chaves de perfil`);

    // Buscar outras chaves relacionadas
    const allKeys = await kv.keys('*');
    const keysByType = {};
    
    allKeys.forEach(key => {
      const type = key.split(':')[0];
      if (!keysByType[type]) {
        keysByType[type] = 0;
      }
      keysByType[type]++;
    });

    console.log('📊 Resumo das chaves por tipo:', keysByType);

    return res.status(200).json({
      success: true,
      kv: {
        totalKeys: allKeys.length,
        userKeys: userKeys.length,
        profileKeys: profileKeys.length,
        keysByType,
        sampleUsers: usersData,
        allUserKeys: userKeys
      }
    });

  } catch (error) {
    console.error('Erro ao buscar informações do KV:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
