// API para buscar ranking de jogadores
import { kv } from '@vercel/kv';
import { localUsers, localProfiles } from '../../utils/storage';
import { verifyAuthentication } from '../../utils/auth';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Função para gerar código de amigo baseado no username
const generateFriendCode = (username) => {
  const hash = username.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const code = Math.abs(hash).toString(36).toUpperCase().substr(0, 6);
  return `PLAYER${code.padEnd(6, '0')}`;
};

// Função para calcular nível baseado no XP
const calculateLevel = (xp) => {
  return Math.floor((xp || 0) / 1000) + 1;
};

// Função para sanitizar dados
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().substring(0, 100); // Limitar tamanho
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { sortBy = 'xp', limit = 50, search = '' } = req.query;
    
    // Verificar autenticação (opcional para ranking público)
    let currentUserId = null;
    try {
      const authResult = await verifyAuthentication(req);
      if (authResult.authenticated) {
        currentUserId = authResult.userId;
      }
    } catch (error) {
      // Ignorar erro de autenticação para ranking público
    }

    let players = [];

    if (isDevelopment && !hasKVConfig) {
      // Buscar em armazenamento local (desenvolvimento)
      for (const [key, userData] of localUsers.entries()) {
        if (key.startsWith('user:')) {
          const userAuthId = `auth_${userData.username}`;
          
          // Buscar perfil do usuário
          let userProfile = null;
          try {
            const profileKey = `profile:${userAuthId}`;
            userProfile = localProfiles?.get?.(profileKey);
          } catch (error) {
            console.warn('Erro ao buscar perfil local:', error);
          }

          // Criar objeto do jogador
          const player = {
            id: userAuthId,
            username: sanitizeString(userData.username),
            displayName: sanitizeString(userData.displayName || userData.username),
            avatar: userProfile?.avatar || userData.avatar || '👤',
            bio: sanitizeString(userProfile?.bio || ''),
            level: calculateLevel(userProfile?.xp || 0),
            xp: userProfile?.xp || 0,
            title: userProfile?.currentTitle || null,
            friendCode: generateFriendCode(userData.username),
            
            // Estatísticas
            stats: {
              totalGames: userProfile?.stats?.totalGames || 0,
              totalWins: userProfile?.stats?.totalWins || 0,
              winRate: userProfile?.stats?.totalGames > 0 
                ? Math.round((userProfile?.stats?.totalWins / userProfile?.stats?.totalGames) * 100) 
                : 0,
              bestStreak: userProfile?.stats?.bestStreak || 0,
              currentStreak: userProfile?.stats?.currentStreak || 0,
              perfectGames: userProfile?.stats?.perfectGames || 0,
              averageScore: userProfile?.stats?.averageScore || 0
            },

            // Conquistas e badges (apenas contadores para ranking)
            achievementsCount: userProfile?.achievements ? Object.keys(userProfile.achievements).length : 0,
            badgesCount: userProfile?.badges ? Object.keys(userProfile.badges).length : 0,

            // Datas
            createdAt: userData.createdAt,
            lastLoginAt: userData.lastLoginAt
          };

          players.push(player);
        }
      }
    } else {
      // Buscar no Vercel KV (produção)
      try {
        const userKeys = await kv.keys('user:*');
        
        for (const key of userKeys) {
          const userData = await kv.get(key);
          if (userData) {
            const userAuthId = `auth_${userData.username}`;
            
            // Buscar perfil do usuário
            let userProfile = null;
            try {
              const profileKey = `profile:${userAuthId}`;
              userProfile = await kv.get(profileKey);
            } catch (error) {
              console.warn('Erro ao buscar perfil KV:', error);
            }

            // Criar objeto do jogador
            const player = {
              id: userAuthId,
              username: sanitizeString(userData.username),
              displayName: sanitizeString(userData.displayName || userData.username),
              avatar: userProfile?.avatar || userData.avatar || '👤',
              bio: sanitizeString(userProfile?.bio || ''),
              level: calculateLevel(userProfile?.xp || 0),
              xp: userProfile?.xp || 0,
              title: userProfile?.currentTitle || null,
              friendCode: generateFriendCode(userData.username),
              
              // Estatísticas
              stats: {
                totalGames: userProfile?.stats?.totalGames || 0,
                totalWins: userProfile?.stats?.totalWins || 0,
                winRate: userProfile?.stats?.totalGames > 0 
                  ? Math.round((userProfile?.stats?.totalWins / userProfile?.stats?.totalGames) * 100) 
                  : 0,
                bestStreak: userProfile?.stats?.bestStreak || 0,
                currentStreak: userProfile?.stats?.currentStreak || 0,
                perfectGames: userProfile?.stats?.perfectGames || 0,
                averageScore: userProfile?.stats?.averageScore || 0
              },

              // Conquistas e badges (apenas contadores para ranking)
              achievementsCount: userProfile?.achievements ? Object.keys(userProfile.achievements).length : 0,
              badgesCount: userProfile?.badges ? Object.keys(userProfile.badges).length : 0,

              // Datas
              createdAt: userData.createdAt,
              lastLoginAt: userData.lastLoginAt
            };

            players.push(player);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar no KV:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }

    // Filtrar por busca se fornecida
    if (search) {
      const searchTerm = search.toLowerCase().trim();
      players = players.filter(player => 
        player.username.toLowerCase().includes(searchTerm) ||
        player.displayName.toLowerCase().includes(searchTerm) ||
        player.friendCode.toLowerCase().includes(searchTerm)
      );
    }

    // Ordenar jogadores
    players.sort((a, b) => {
      switch (sortBy) {
        case 'level':
          return b.level - a.level || b.xp - a.xp;
        case 'wins':
          return b.stats.totalWins - a.stats.totalWins;
        case 'winRate':
          return b.stats.winRate - a.stats.winRate || b.stats.totalGames - a.stats.totalGames;
        case 'streak':
          return b.stats.bestStreak - a.stats.bestStreak;
        case 'games':
          return b.stats.totalGames - a.stats.totalGames;
        case 'achievements':
          return b.achievementsCount - a.achievementsCount;
        case 'recent':
          return new Date(b.lastLoginAt || 0) - new Date(a.lastLoginAt || 0);
        case 'xp':
        default:
          return b.xp - a.xp;
      }
    });

    // Limitar resultados
    const limitedPlayers = players.slice(0, parseInt(limit));

    // Adicionar posição no ranking
    const playersWithRank = limitedPlayers.map((player, index) => ({
      ...player,
      rank: index + 1,
      isCurrentUser: player.id === currentUserId
    }));

    return res.status(200).json({
      success: true,
      players: playersWithRank,
      total: players.length,
      sortBy,
      search: search || null
    });

  } catch (error) {
    console.error('Erro na API de ranking de jogadores:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
