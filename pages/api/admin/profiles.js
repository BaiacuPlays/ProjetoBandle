// Importação condicional do KV
let kv = null;
try {
  const kvModule = await import('@vercel/kv');
  kv = kvModule.kv;
} catch (error) {
  console.log('⚠️ [ADMIN] Vercel KV não disponível (ambiente local)');
}

export default async function handler(req, res) {
  // Verificar se é uma requisição GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificação básica de admin (você pode melhorar isso)
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== 'ludomusic_admin_2024') {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    console.log('🔍 [ADMIN] Buscando todos os perfis...');

    // Se KV não estiver disponível (ambiente local), retornar dados mock
    if (!kv) {
      console.log('📊 [ADMIN] Usando dados mock (ambiente local)');
      const mockProfiles = [
        {
          id: 'user_123456',
          username: 'TestUser1',
          displayName: 'Usuário de Teste 1',
          level: 5,
          xp: 2500,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
          socialStats: {
            multiplayerGamesPlayed: 5,
            multiplayerWins: 3,
            friendsAdded: 2,
            gamesShared: 8,
            socialInteractions: 15
          },
          achievements: 12,
          badges: 8,
          gameHistory: 25,
          isActive: true,
          daysSinceCreation: 30,
          daysSinceLastLogin: 2
        },
        {
          id: 'user_789012',
          username: 'TestUser2',
          displayName: 'Usuário de Teste 2',
          level: 3,
          xp: 900,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          lastLogin: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          stats: {
            totalGames: 12,
            wins: 8,
            losses: 4,
            winRate: 66.7,
            currentStreak: 0,
            bestStreak: 4,
            perfectGames: 2,
            averageAttempts: 3.8,
            totalPlayTime: 720
          },
          socialStats: {
            multiplayerGamesPlayed: 0,
            multiplayerWins: 0,
            friendsAdded: 1,
            gamesShared: 3,
            socialInteractions: 4
          },
          achievements: 6,
          badges: 3,
          gameHistory: 12,
          isActive: false,
          daysSinceCreation: 15,
          daysSinceLastLogin: 10
        }
      ];

      return res.status(200).json({
        success: true,
        profiles: mockProfiles,
        total: mockProfiles.length,
        timestamp: new Date().toISOString(),
        environment: 'local'
      });
    }

    // Buscar todas as chaves que começam com 'profile:'
    const profileKeys = await kv.keys('profile:*');
    console.log(`📊 [ADMIN] Encontradas ${profileKeys.length} chaves de perfil`);

    if (profileKeys.length === 0) {
      return res.status(200).json({
        success: true,
        profiles: [],
        total: 0
      });
    }

    // Buscar todos os perfis
    const profiles = [];
    
    // Processar em lotes para evitar timeout
    const batchSize = 10;
    for (let i = 0; i < profileKeys.length; i += batchSize) {
      const batch = profileKeys.slice(i, i + batchSize);
      
      const batchProfiles = await Promise.all(
        batch.map(async (key) => {
          try {
            const profile = await kv.get(key);
            if (profile) {
              return {
                id: profile.id,
                username: profile.username,
                displayName: profile.displayName,
                level: profile.level || 1,
                xp: profile.xp || 0,
                createdAt: profile.createdAt,
                lastLogin: profile.lastLogin,
                lastUpdated: profile.lastUpdated,
                stats: {
                  totalGames: profile.stats?.totalGames || 0,
                  wins: profile.stats?.wins || 0,
                  losses: profile.stats?.losses || 0,
                  winRate: profile.stats?.winRate || 0,
                  currentStreak: profile.stats?.currentStreak || 0,
                  bestStreak: profile.stats?.bestStreak || 0,
                  perfectGames: profile.stats?.perfectGames || 0,
                  averageAttempts: profile.stats?.averageAttempts || 0,
                  totalPlayTime: profile.stats?.totalPlayTime || 0
                },
                socialStats: {
                  multiplayerGamesPlayed: profile.socialStats?.multiplayerGamesPlayed || 0,
                  multiplayerWins: profile.socialStats?.multiplayerWins || 0,
                  friendsAdded: profile.socialStats?.friendsAdded || 0,
                  gamesShared: profile.socialStats?.gamesShared || 0,
                  socialInteractions: profile.socialStats?.socialInteractions || 0
                },
                achievements: profile.achievements?.length || 0,
                badges: profile.badges?.length || 0,
                gameHistory: profile.gameHistory?.length || 0,
                // Estatísticas calculadas
                isActive: profile.lastLogin && new Date(profile.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Ativo nos últimos 7 dias
                daysSinceCreation: profile.createdAt ? Math.floor((Date.now() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24)) : 0,
                daysSinceLastLogin: profile.lastLogin ? Math.floor((Date.now() - new Date(profile.lastLogin)) / (1000 * 60 * 60 * 24)) : 999
              };
            }
            return null;
          } catch (error) {
            console.error(`❌ [ADMIN] Erro ao carregar perfil ${key}:`, error);
            return null;
          }
        })
      );

      profiles.push(...batchProfiles.filter(p => p !== null));
    }

    // Ordenar por nível (maior para menor) e depois por XP
    profiles.sort((a, b) => {
      if (b.level !== a.level) {
        return b.level - a.level;
      }
      return b.xp - a.xp;
    });

    console.log(`✅ [ADMIN] ${profiles.length} perfis carregados com sucesso`);

    return res.status(200).json({
      success: true,
      profiles,
      total: profiles.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erro ao buscar perfis:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
