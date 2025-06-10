import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';

// Configuração para desenvolvimento local
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_URL && process.env.KV_REST_API_URL;

// Função para verificar autenticação de admin
const verifyAdminAuth = (req) => {
  const adminKey = req.headers['x-admin-key'];
  return adminKey === 'admin123' || adminKey === 'laikas2';
};

// Função para descriptografar senha (se necessário)
const decryptPassword = async (hashedPassword) => {
  // Como as senhas são hasheadas com bcrypt, não é possível descriptografá-las
  // Retornar uma indicação de que a senha está hasheada
  return '[SENHA HASHEADA]';
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar autenticação de admin
  if (!verifyAdminAuth(req)) {
    return res.status(401).json({ error: 'Acesso negado - Admin apenas' });
  }

  try {
    console.log('🔐 [ADMIN] Buscando usuários com senhas...');

    const profiles = [];

    if (isDevelopment && !hasKVConfig) {
      // Dados de demonstração para desenvolvimento local
      console.log('🔐 [ADMIN] Usando dados demo (desenvolvimento local)');
      profiles.push(
        {
          id: 'auth_baiacuplays',
          username: 'baiacuplays',
          displayName: 'BaiacuPlays',
          password: 'pokemonl12.3@',
          level: 5,
          xp: 2500,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          isActive: true,
          stats: {
            totalGames: 25,
            wins: 18,
            losses: 7,
            winRate: 72,
            currentStreak: 3,
            bestStreak: 8,
            perfectGames: 5,
            averageAttempts: 3.2,
            totalPlayTime: 1800
          },
          achievements: 12,
          badges: 8
        },
        {
          id: 'auth_testuser',
          username: 'testuser',
          displayName: 'Usuário Teste',
          password: 'senha123',
          level: 3,
          xp: 1200,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: false,
          stats: {
            totalGames: 15,
            wins: 8,
            losses: 7,
            winRate: 53,
            currentStreak: 0,
            bestStreak: 4,
            perfectGames: 2,
            averageAttempts: 4.1,
            totalPlayTime: 900
          },
          achievements: 6,
          badges: 3
        }
      );
    } else {
      // Buscar dados reais do KV
      console.log('🔐 [ADMIN] Buscando dados reais do KV...');

      try {
        // Buscar todos os usuários
        const userKeys = await kv.keys('user:*');
        console.log(`🔐 [ADMIN] Encontradas ${userKeys.length} chaves de usuário`);

        for (const userKey of userKeys) {
          try {
            const userData = await kv.get(userKey);
            if (userData && userData.username) {
              const username = userData.username;
              const userId = `auth_${username}`;

              // Buscar perfil do usuário
              const profileKey = `profile:${userId}`;
              const profileData = await kv.get(profileKey);

              // Tentar recuperar senha em texto claro (se disponível)
              let passwordDisplay = '[SENHA HASHEADA]';

              // Para usuários específicos conhecidos, mostrar senha real
              if (username === 'baiacuplays') {
                passwordDisplay = 'pokemonl12.3@';
              } else if (userData.plainPassword) {
                // Se por algum motivo a senha em texto claro foi salva (não recomendado)
                passwordDisplay = userData.plainPassword;
              } else {
                // Mostrar hash truncado para referência
                passwordDisplay = userData.hashedPassword ?
                  `[HASH: ${userData.hashedPassword.substring(0, 20)}...]` :
                  '[SENHA HASHEADA]';
              }

              // Montar dados do perfil com senha
              const profile = {
                id: userId,
                username: username,
                displayName: userData.displayName || username,
                password: passwordDisplay,
                email: userData.email || null,
                level: profileData?.level || 1,
                xp: profileData?.xp || 0,
                createdAt: userData.createdAt || new Date().toISOString(),
                lastLogin: userData.lastLoginAt || null,
                isActive: userData.lastLoginAt ?
                  (new Date() - new Date(userData.lastLoginAt)) < (7 * 24 * 60 * 60 * 1000) : false,
                stats: profileData?.stats || {
                  totalGames: 0,
                  wins: 0,
                  losses: 0,
                  winRate: 0,
                  currentStreak: 0,
                  bestStreak: 0,
                  perfectGames: 0,
                  averageAttempts: 0,
                  totalPlayTime: 0
                },
                achievements: profileData?.achievements?.length || 0,
                badges: profileData?.badges?.length || 0
              };

              profiles.push(profile);
            }
          } catch (error) {
            console.error(`🔐 [ADMIN] Erro ao processar usuário ${userKey}:`, error);
          }
        }
      } catch (error) {
        console.error('🔐 [ADMIN] Erro ao buscar usuários do KV:', error);
        throw error;
      }
    }

    console.log(`🔐 [ADMIN] Retornando ${profiles.length} perfis com senhas`);

    return res.status(200).json({
      success: true,
      profiles: profiles,
      total: profiles.length,
      message: `${profiles.length} usuários encontrados`
    });

  } catch (error) {
    console.error('🔐 [ADMIN] Erro ao buscar usuários com senhas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
