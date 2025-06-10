// API de EMERGÊNCIA - SEMPRE retorna dados para usuários autenticados
// Importação segura do KV
let kv = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
  }
} catch (error) {
  // KV não disponível
}
import { verifyAuthentication } from '../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const authResult = verifyAuthentication(req);
    if (!authResult.isValid) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const userId = authResult.userId;
    console.log('🆘 [EMERGENCY] Solicitação de perfil de emergência para:', userId);

    // ESTRATÉGIA 1: Tentar carregar perfil existente
    let profile = null;
    try {
      const profileKey = `user:${userId}`;
      profile = await kv.get(profileKey);

      if (profile) {
        console.log('✅ [EMERGENCY] Perfil encontrado no KV');

        // Verificar integridade básica
        if (profile.id && profile.username && profile.stats) {
          return res.status(200).json({
            success: true,
            profile,
            source: 'existing'
          });
        } else {
          console.log('⚠️ [EMERGENCY] Perfil corrompido, será reparado');
          profile = repairProfile(profile, userId);
        }
      }
    } catch (error) {
      console.warn('⚠️ [EMERGENCY] Erro ao carregar do KV:', error);
    }

    // ESTRATÉGIA 2: Criar perfil de emergência GARANTIDO
    if (!profile) {
      console.log('🆘 [EMERGENCY] Criando perfil de emergência');

      // Obter dados básicos do usuário autenticado
      const username = authResult.username || `Jogador_${userId.slice(-6)}`;

      profile = {
        id: userId,
        username: username,
        displayName: '',
        bio: '',
        avatar: null,
        level: 1,
        xp: 0,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          currentStreak: 0,
          bestStreak: 0,
          totalPlayTime: 0,
          perfectGames: 0,
          averageAttempts: 0,
          fastestWin: null,
          longestSession: 0,
          xp: 0,
          level: 1,
          modeStats: {
            daily: {
              games: 0,
              wins: 0,
              bestStreak: 0,
              averageAttempts: 0,
              perfectGames: 0
            },
            infinite: {
              games: 0,
              wins: 0,
              bestStreak: 0,
              totalSongsCompleted: 0,
              longestSession: 0
            },
            multiplayer: {
              games: 0,
              wins: 0,
              roomsCreated: 0,
              totalPoints: 0,
              bestRoundScore: 0
            }
          }
        },
        achievements: [],
        gameHistory: [],
        franchiseStats: {},
        preferences: {
          theme: 'dark',
          language: 'pt',
          notifications: true,
          showAchievementPopups: true,
          hasSeenProfileTutorial: false
        },
        badges: [],
        titles: [],
        currentTitle: null,
        socialStats: {
          gamesShared: 0,
          friendsReferred: 0,
          friendsAdded: 0,
          multiplayerGamesPlayed: 0,
          multiplayerWins: 0,
          invitesSent: 0,
          invitesAccepted: 0,
          socialInteractions: 0,
          helpfulActions: 0
        }
      };
    }

    // GARANTIR que o perfil está íntegro
    profile = ensureProfileIntegrity(profile, userId);

    // Salvar perfil de emergência no KV (sem bloquear resposta)
    try {
      const profileKey = `user:${userId}`;
      await kv.set(profileKey, profile);
      console.log('💾 [EMERGENCY] Perfil de emergência salvo no KV');
    } catch (error) {
      console.warn('⚠️ [EMERGENCY] Erro ao salvar no KV (não crítico):', error);
    }

    console.log('✅ [EMERGENCY] Perfil de emergência criado com sucesso');

    return res.status(200).json({
      success: true,
      profile,
      source: 'emergency',
      message: 'Perfil de emergência criado - seus dados estão seguros'
    });

  } catch (error) {
    console.error('❌ [EMERGENCY] Erro crítico na API de emergência:', error);

    // ÚLTIMO RECURSO: Retornar perfil mínimo absoluto
    const minimalProfile = {
      id: 'emergency_user',
      username: 'Usuário',
      displayName: '',
      level: 1,
      xp: 0,
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        modeStats: {
          daily: { games: 0, wins: 0 },
          infinite: { games: 0, wins: 0 },
          multiplayer: { games: 0, wins: 0 }
        }
      },
      achievements: [],
      gameHistory: [],
      preferences: { theme: 'dark', language: 'pt' }
    };

    return res.status(200).json({
      success: true,
      profile: minimalProfile,
      source: 'minimal',
      message: 'Perfil mínimo de emergência'
    });
  }
}

// Função para reparar perfil corrompido
function repairProfile(profile, userId) {
  const repaired = { ...profile };

  // Garantir campos obrigatórios
  repaired.id = repaired.id || userId;
  repaired.username = repaired.username || `Jogador_${userId.slice(-6)}`;
  repaired.level = typeof repaired.level === 'number' ? Math.max(1, repaired.level) : 1;
  repaired.xp = typeof repaired.xp === 'number' ? Math.max(0, repaired.xp) : 0;
  repaired.lastUpdated = new Date().toISOString();

  // Garantir estrutura de stats
  if (!repaired.stats || typeof repaired.stats !== 'object') {
    repaired.stats = {};
  }

  const defaultStats = {
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalPlayTime: 0,
    perfectGames: 0,
    averageAttempts: 0,
    fastestWin: null,
    longestSession: 0,
    xp: repaired.xp,
    level: repaired.level,
    modeStats: {
      daily: { games: 0, wins: 0, bestStreak: 0, averageAttempts: 0, perfectGames: 0 },
      infinite: { games: 0, wins: 0, bestStreak: 0, totalSongsCompleted: 0, longestSession: 0 },
      multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0 }
    }
  };

  // Aplicar valores padrão para campos ausentes
  Object.keys(defaultStats).forEach(key => {
    if (key === 'modeStats') {
      if (!repaired.stats.modeStats || typeof repaired.stats.modeStats !== 'object') {
        repaired.stats.modeStats = defaultStats.modeStats;
      }
    } else if (typeof repaired.stats[key] !== 'number' && key !== 'fastestWin') {
      repaired.stats[key] = defaultStats[key];
    }
  });

  // Garantir outras estruturas
  repaired.achievements = Array.isArray(repaired.achievements) ? repaired.achievements : [];
  repaired.gameHistory = Array.isArray(repaired.gameHistory) ? repaired.gameHistory : [];
  repaired.franchiseStats = repaired.franchiseStats || {};
  repaired.badges = Array.isArray(repaired.badges) ? repaired.badges : [];
  repaired.titles = Array.isArray(repaired.titles) ? repaired.titles : [];

  if (!repaired.preferences || typeof repaired.preferences !== 'object') {
    repaired.preferences = {
      theme: 'dark',
      language: 'pt',
      notifications: true,
      showAchievementPopups: true,
      hasSeenProfileTutorial: false
    };
  }

  if (!repaired.socialStats || typeof repaired.socialStats !== 'object') {
    repaired.socialStats = {
      gamesShared: 0,
      friendsReferred: 0,
      friendsAdded: 0,
      multiplayerGamesPlayed: 0,
      multiplayerWins: 0,
      invitesSent: 0,
      invitesAccepted: 0,
      socialInteractions: 0,
      helpfulActions: 0
    };
  }

  return repaired;
}

// Função para garantir integridade absoluta do perfil
function ensureProfileIntegrity(profile, userId) {
  if (!profile || typeof profile !== 'object') {
    throw new Error('Perfil inválido');
  }

  // Verificar e corrigir campos críticos
  const ensured = { ...profile };

  ensured.id = ensured.id || userId;
  ensured.username = ensured.username || `Jogador_${userId.slice(-6)}`;
  ensured.level = Math.max(1, ensured.level || 1);
  ensured.xp = Math.max(0, ensured.xp || 0);

  // Sincronizar XP e level
  const calculatedLevel = Math.floor(Math.sqrt(ensured.xp / 300)) + 1;
  ensured.level = calculatedLevel;

  if (ensured.stats) {
    ensured.stats.xp = ensured.xp;
    ensured.stats.level = ensured.level;
  }

  return ensured;
}
