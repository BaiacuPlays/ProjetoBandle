// API para gerenciar perfis de usuário no servidor
import { localProfiles, localUsers } from '../../utils/storage';
import { verifyAuthentication } from '../../utils/auth';
import { isDevelopment, hasKVConfig, kvGet, kvSet, kvDel } from '../../utils/kv-config';

// Função para calcular XP baseado no desempenho
const calculateXP = (gameStats) => {
  if (!gameStats.won) return 0;

  let xp = 50; // XP base por vitória

  // Bônus por performance
  if (gameStats.attempts === 1) {
    xp += 50; // Perfeito
  } else if (gameStats.attempts <= 2) {
    xp += 30; // Muito bom
  } else if (gameStats.attempts <= 3) {
    xp += 20; // Bom
  } else if (gameStats.attempts <= 4) {
    xp += 10; // Regular
  }

  return xp;
};

// Função para calcular nível baseado no XP - SISTEMA REBALANCEADO
const calculateLevel = (xp) => {
  return Math.floor(Math.sqrt(xp / 300)) + 1;
};

// Função para verificar conquistas
const checkAchievements = (profile, gameStats) => {
  const newAchievements = [];
  const stats = profile.stats;

  // Conquistas básicas
  if (stats.totalGames === 1 && !profile.achievements.includes('first_game')) {
    newAchievements.push('first_game');
  }

  if (stats.wins === 1 && !profile.achievements.includes('first_win')) {
    newAchievements.push('first_win');
  }

  // Conquistas de volume
  if (stats.totalGames >= 10 && !profile.achievements.includes('veteran')) {
    newAchievements.push('veteran');
  }

  if (stats.totalGames >= 50 && !profile.achievements.includes('experienced')) {
    newAchievements.push('experienced');
  }

  if (stats.totalGames >= 100 && !profile.achievements.includes('master')) {
    newAchievements.push('master');
  }

  // Conquistas de streak
  if (stats.bestStreak >= 5 && !profile.achievements.includes('streak_5')) {
    newAchievements.push('streak_5');
  }

  if (stats.bestStreak >= 10 && !profile.achievements.includes('streak_10')) {
    newAchievements.push('streak_10');
  }

  // Conquistas de performance
  if (gameStats.won && gameStats.attempts === 1 && !profile.achievements.includes('perfect_first')) {
    newAchievements.push('perfect_first');
  }

  // Conquistas de nível
  if (profile.level >= 5 && !profile.achievements.includes('level_5')) {
    newAchievements.push('level_5');
  }

  if (profile.level >= 10 && !profile.achievements.includes('level_10')) {
    newAchievements.push('level_10');
  }

  return newAchievements;
};

export default async function handler(req, res) {
  const { method } = req;

  try {
    // Verificar autenticação para todos os métodos
    const authResult = await verifyAuthentication(req);
    if (!authResult.authenticated) {
      console.warn('⚠️ Tentativa de acessar perfil sem autenticação:', authResult.error);
      return res.status(401).json({ error: authResult.error });
    }

    if (method === 'GET') {
      // Buscar perfil do usuário autenticado

      const userId = authResult.userId;
      const profileKey = `profile:${userId}`;
      let profile = null;

      // Usar função centralizada do KV
      profile = await kvGet(profileKey, localProfiles);

      if (!profile) {
        // Criar perfil padrão se não existir
        profile = {
          id: userId,
          username: authResult.username,
          level: 1,
          xp: 0,
          achievements: [],
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
            modeStats: {
              daily: { games: 0, wins: 0, bestStreak: 0, averageAttempts: 0, perfectGames: 0 },
              infinite: { games: 0, wins: 0, bestStreak: 0, totalSongsCompleted: 0, longestSession: 0 },
              multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0 }
            }
          },
          createdAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          version: '1.0'
        };

        // Salvar o perfil padrão
        await kvSet(profileKey, profile, {}, localProfiles);

        console.log(`✅ Perfil padrão criado para ${authResult.username}`);
      }

      return res.status(200).json(profile);

    } else if (method === 'POST') {
      // 🔒 VERIFICAR AUTENTICAÇÃO ANTES DE SALVAR PERFIL
      const authResult = await verifyAuthentication(req);
      if (!authResult.authenticated) {
        console.warn('⚠️ Tentativa de salvar perfil sem autenticação:', authResult.error);
        return res.status(401).json({ error: authResult.error });
      }

      const { action, profile: profileData } = req.body;

      // Se não há action, assumir que é para salvar perfil diretamente
      if (!action && profileData) {
        try {
          const userId = authResult.userId;
          const profileKey = `profile:${userId}`;

          // Salvar perfil atualizado
          await kvSet(profileKey, profileData, {}, localProfiles);

          return res.status(200).json({
            success: true,
            message: 'Perfil salvo com sucesso',
            profile: profileData
          });

        } catch (error) {
          console.error('Erro ao salvar perfil:', error);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
      }

      // Verificar se é uma ação específica (como updateGameStats)
      if (action === 'updateGameStats') {
        // Implementar updateGameStats inline
        try {
          const { gameStats } = req.body;
          const userId = authResult.userId;
          const profileKey = `profile:${userId}`;

          // Carregar perfil atual
          let profile = await kvGet(profileKey, localProfiles);

          if (!profile) {
            return res.status(404).json({ error: 'Perfil não encontrado' });
          }

          // Calcular XP ganho
          const xpGained = calculateXP(gameStats);
          const oldLevel = profile.level || 1;
          const newXP = (profile.xp || 0) + xpGained;
          const newLevel = calculateLevel(newXP);

          // Atualizar estatísticas
          const stats = profile.stats || {};
          stats.totalGames = (stats.totalGames || 0) + 1;

          if (gameStats.won) {
            stats.wins = (stats.wins || 0) + 1;
            stats.currentStreak = (stats.currentStreak || 0) + 1;
            stats.bestStreak = Math.max(stats.bestStreak || 0, stats.currentStreak);

            if (gameStats.attempts === 1) {
              stats.perfectGames = (stats.perfectGames || 0) + 1;
            }
          } else {
            stats.losses = (stats.losses || 0) + 1;
            stats.currentStreak = 0;
          }

          stats.winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0;
          stats.totalPlayTime = (stats.totalPlayTime || 0) + (gameStats.playTime || 0);

          // Atualizar perfil
          profile.xp = newXP;
          profile.level = newLevel;
          profile.stats = stats;
          profile.lastSyncedAt = new Date().toISOString();

          // Verificar conquistas
          const newAchievements = checkAchievements(profile, gameStats);
          if (newAchievements.length > 0) {
            profile.achievements = [...(profile.achievements || []), ...newAchievements];

            // XP bônus por conquistas
            const achievementXP = newAchievements.length * 50;
            profile.xp += achievementXP;
            profile.level = calculateLevel(profile.xp);
          }

          // Salvar perfil atualizado
          await kvSet(profileKey, profile, {}, localProfiles);

          const levelUp = newLevel > oldLevel;

          return res.status(200).json({
            success: true,
            xpGained: xpGained + (newAchievements.length * 50),
            newLevel: profile.level,
            levelUp,
            newAchievements,
            profile: profile
          });

        } catch (error) {
          console.error('Erro ao atualizar estatísticas:', error);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
      } else if (action === 'resetProfile') {
        // Implementar resetProfile inline
        try {
          const userId = authResult.userId;
          const profileKey = `profile:${userId}`;

          // Criar perfil limpo
          const cleanProfile = {
            id: userId,
            username: authResult.username,
            level: 1,
            xp: 0,
            achievements: [],
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
              modeStats: {
                daily: { games: 0, wins: 0, bestStreak: 0, averageAttempts: 0, perfectGames: 0 },
                infinite: { games: 0, wins: 0, bestStreak: 0, totalSongsCompleted: 0, longestSession: 0 },
                multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0 }
              }
            },
            createdAt: new Date().toISOString(),
            lastSyncedAt: new Date().toISOString(),
            version: '1.0'
          };

          // Salvar perfil resetado
          await kvSet(profileKey, cleanProfile, {}, localProfiles);

          return res.status(200).json({
            success: true,
            message: 'Perfil resetado com sucesso',
            profile: cleanProfile
          });

        } catch (error) {
          console.error('Erro ao resetar perfil:', error);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
      }

      return res.status(400).json({ error: 'Ação não reconhecida' });

    } else if (method === 'DELETE') {
      // 🔒 VERIFICAR AUTENTICAÇÃO ANTES DE DELETAR PERFIL
      const authResult = await verifyAuthentication(req);
      if (!authResult.authenticated) {
        console.warn('⚠️ Tentativa de deletar perfil sem autenticação:', authResult.error);
        return res.status(401).json({ error: authResult.error });
      }

      try {
        const userId = authResult.userId;
        const profileKey = `profile:${userId}`;

        console.log(`🗑️ [DELETE] Iniciando deleção de perfil para ${authResult.username} (${userId})`);

        // Deletar perfil
        await kvDel(profileKey, {}, localProfiles);

        console.log(`✅ [DELETE] Perfil ${authResult.username} deletado com sucesso`);

        return res.status(200).json({
          success: true,
          message: 'Perfil deletado com sucesso'
        });

      } catch (error) {
        console.error('❌ Erro ao deletar perfil:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

    } else if (method === 'PUT' || method === 'POST') {
      const authResult = await verifyAuthentication(req);
      if (!authResult.authenticated) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const userId = authResult.userId;
      const profileKey = `profile:${userId}`;
      const updates = req.body;

      // Validar dados do avatar se estiver presente
      if (updates.avatar !== undefined) {
        if (updates.avatar === null) {
          // Permitir remover avatar
        } else {
          // Importar utilitário de validação
          const { validateAvatar } = require('../../utils/avatarUtils');

          const validation = validateAvatar(updates.avatar);
          if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
          }
        }
      }

      // Buscar perfil existente
      let currentProfile = await kvGet(profileKey, localProfiles);
      if (!currentProfile) {
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }

      // Atualizar perfil com novos dados
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      // Salvar no KV
      await kvSet(profileKey, updatedProfile, localProfiles);

      return res.status(200).json({
        profile: updatedProfile,
        message: 'Perfil atualizado com sucesso'
      });
    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('❌ [ERROR] Erro na API de perfil:', error);
    console.error('❌ [ERROR] Stack trace:', error.stack);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
