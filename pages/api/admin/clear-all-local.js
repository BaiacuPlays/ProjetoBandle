import { localUsers, localProfiles, localSessions } from '../../../utils/storage';

// Configuração para desenvolvimento local
const isDevelopment = process.env.NODE_ENV === 'development';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar autenticação de admin
  if (!verifyAdminAuth(req)) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (!isDevelopment) {
    return res.status(400).json({ 
      error: 'Esta operação só está disponível em desenvolvimento' 
    });
  }

  try {
    console.log('🧹 Iniciando limpeza completa dos dados locais...');

    let totalCleared = 0;
    let clearedItems = [];

    // Limpar localUsers
    const usersCount = localUsers.size;
    if (usersCount > 0) {
      const userKeys = Array.from(localUsers.keys());
      localUsers.clear();
      totalCleared += usersCount;
      clearedItems.push(`${usersCount} usuários`);
      console.log(`✅ ${usersCount} usuários removidos`);
    }

    // Limpar localProfiles
    const profilesCount = localProfiles.size;
    if (profilesCount > 0) {
      const profileKeys = Array.from(localProfiles.keys());
      localProfiles.clear();
      totalCleared += profilesCount;
      clearedItems.push(`${profilesCount} perfis`);
      console.log(`✅ ${profilesCount} perfis removidos`);
    }

    // Limpar localSessions
    const sessionsCount = localSessions.size;
    if (sessionsCount > 0) {
      const sessionKeys = Array.from(localSessions.keys());
      localSessions.clear();
      totalCleared += sessionsCount;
      clearedItems.push(`${sessionsCount} sessões`);
      console.log(`✅ ${sessionsCount} sessões removidas`);
    }

    console.log(`✅ Limpeza completa finalizada: ${totalCleared} itens removidos`);

    return res.status(200).json({
      success: true,
      message: 'Todos os dados locais foram limpos com sucesso',
      totalCleared,
      clearedItems,
      details: {
        users: usersCount,
        profiles: profilesCount,
        sessions: sessionsCount
      }
    });

  } catch (error) {
    console.error('Erro na limpeza dos dados locais:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
