// API para buscar usuários por código de amigo ou username
import { kv } from '@vercel/kv';
import { localUsers, localProfiles } from '../../utils/storage';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = (process.env.KV_REST_API_URL || process.env.KV_URL) && process.env.KV_REST_API_TOKEN;

// Função para gerar código de amigo baseado no username
const generateFriendCode = (username) => {
  const hash = username.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const code = Math.abs(hash).toString(36).toUpperCase().substr(0, 6);
  return `PLAYER${code.padEnd(6, '0')}`;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { query: searchQuery, currentUserId } = req.query;

    if (!searchQuery || !currentUserId) {
      return res.status(400).json({ error: 'Query e currentUserId são obrigatórios' });
    }

    const searchTerm = searchQuery.toLowerCase().trim();
    let foundUser = null;

    if (isDevelopment && !hasKVConfig) {
      // Buscar em armazenamento local (desenvolvimento)
      for (const [key, userData] of localUsers.entries()) {
        if (key.startsWith('user:')) {
          const friendCode = generateFriendCode(userData.username);

          // Buscar por username ou código de amigo
          if (userData.username.toLowerCase() === searchTerm ||
              friendCode.toLowerCase() === searchTerm) {

            // Não retornar o próprio usuário
            const userAuthId = `auth_${userData.username}`;
            if (userAuthId !== currentUserId) {
              // Buscar perfil do usuário para obter avatar e nível
              let userProfile = null;
              try {
                if (isDevelopment && !hasKVConfig) {
                  // Buscar perfil local
                  const profileKey = `profile:${userAuthId}`;
                  userProfile = localProfiles?.get?.(profileKey);
                  console.log('Perfil local encontrado:', profileKey, userProfile);
                } else {
                  // Buscar perfil no KV
                  const profileKey = `profile:${userAuthId}`;
                  userProfile = await kv.get(profileKey);
                  console.log('Perfil KV encontrado:', profileKey, userProfile);
                }
              } catch (error) {
                console.warn('Erro ao buscar perfil do usuário:', error);
              }

              foundUser = {
                id: userAuthId,
                username: userData.username,
                displayName: userData.displayName,
                avatar: userProfile?.avatar || userData.avatar || '👤', // Tentar avatar do perfil, depois do userData, depois padrão
                level: userProfile?.level || 1, // Nível do perfil ou padrão
                friendCode: friendCode
              };
              break;
            }
          }
        }
      }
    } else {
      // Buscar no Vercel KV (produção)
      try {
        const userKeys = await kv.keys('user:*');

        for (const key of userKeys) {
          const userData = await kv.get(key);
          if (userData) {
            const friendCode = generateFriendCode(userData.username);

            // Buscar por username ou código de amigo
            if (userData.username.toLowerCase() === searchTerm ||
                friendCode.toLowerCase() === searchTerm) {

              // Não retornar o próprio usuário
              const userAuthId = `auth_${userData.username}`;
              if (userAuthId !== currentUserId) {
                // Buscar perfil do usuário para obter avatar e nível
                let userProfile = null;
                try {
                  const profileKey = `profile:${userAuthId}`;
                  userProfile = await kv.get(profileKey);
                  console.log('Perfil KV encontrado (produção):', profileKey, userProfile);
                } catch (error) {
                  console.warn('Erro ao buscar perfil do usuário:', error);
                }

                foundUser = {
                  id: userAuthId,
                  username: userData.username,
                  displayName: userData.displayName,
                  avatar: userProfile?.profilePhoto || userProfile?.avatar || userData.avatar || '👤', // Tentar profilePhoto, depois avatar do perfil, depois do userData, depois padrão
                  level: userProfile?.level || 1, // Nível do perfil ou padrão
                  friendCode: friendCode
                };
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar no KV:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }

    if (foundUser) {
      return res.status(200).json({
        success: true,
        user: foundUser
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

  } catch (error) {
    console.error('Erro na API de busca de usuários:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
