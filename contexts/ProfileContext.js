import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUnlockedAchievements, checkAchievementUnlocked, achievements } from '../data/achievements';
import { getUnlockedBadges, checkBadgeUnlocked, badges } from '../data/badges';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile deve ser usado dentro de ProfileProvider');
  }
  return context;
};

// Estrutura padrão do perfil
const createDefaultProfile = (userId, username) => ({
  id: userId,
  username: username,
  displayName: username,
  bio: '',
  profilePhoto: '🎮',
  avatar: '🎮', // Compatibilidade com sistema antigo
  level: 1,
  xp: 0,
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),

  // Estatísticas do jogo
  stats: {
    totalGames: 0,
    wins: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    averageAttempts: 0,
    perfectGames: 0,
    totalPlayTime: 0,
    longestSession: 0,
    fastestWin: null,

    // Estatísticas por modo
    modeStats: {
      daily: {
        gamesPlayed: 0,
        wins: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastPlayedDate: null,
        hasPlayedToday: false
      },
      infinite: {
        games: 0,
        wins: 0,
        bestStreak: 0,
        currentStreak: 0,
        totalSongsCompleted: 0
      },
      multiplayer: {
        gamesPlayed: 0,
        wins: 0,
        roomsCreated: 0,
        roomsJoined: 0
      }
    }
  },

  // Conquistas e badges
  achievements: [],
  badges: [],

  // Histórico de jogos
  gameHistory: [],

  // Preferências
  preferences: {
    language: 'pt',
    theme: 'dark',
    soundEnabled: true,
    musicVolume: 0.7,
    effectsVolume: 0.5,
    notifications: true,
    autoplay: true,
    showHints: true,
    colorblindMode: false
  },

  // Sistema social
  social: {
    friends: [],
    friendRequests: [],
    blockedUsers: [],
    isProfilePublic: true,
    allowFriendRequests: true
  },

  // Títulos e customização
  titles: [],
  currentTitle: null,

  // Benefícios de doação
  donationBenefits: {
    isSupporter: false,
    benefits: [],
    expiresAt: null
  },

  // Estatísticas sociais
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
  },

  // Estatísticas de franquias
  franchiseStats: {},

  // Dados de dias consecutivos
  consecutiveData: {
    consecutiveDays: 0,
    lastPlayDate: null
  }
});

export const ProfileProvider = ({ children }) => {
  const { user, isAuthenticated, userId, username } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar perfil quando usuário faz login
  useEffect(() => {
    if (isAuthenticated && userId && username) {
      loadProfile();
    } else {
      setProfile(null);
      setError(null);
    }
  }, [isAuthenticated, userId, username]);

  // Função para carregar perfil
  const loadProfile = async () => {
    if (!userId || !username) return;

    setIsLoading(true);
    setError(null);

    try {
      // Tentar carregar do servidor
      const response = await fetch(`/api/profile?userId=${userId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          // Garantir que as estatísticas estejam inicializadas
          const profile = data.profile;
          if (!profile.stats?.modeStats?.infinite) {
            if (!profile.stats) profile.stats = {};
            if (!profile.stats.modeStats) profile.stats.modeStats = {};
            profile.stats.modeStats.infinite = {
              games: 0,
              wins: 0,
              bestStreak: 0,
              currentStreak: 0,
              totalSongsCompleted: 0
            };
            console.log('📊 Inicializando estatísticas do modo infinito no perfil carregado');
          }
          setProfile(profile);
          console.log('✅ Perfil carregado do servidor');
          return;
        }
      }

      // Se não encontrou no servidor, criar novo perfil
      const newProfile = createDefaultProfile(userId, username);
      await saveProfile(newProfile);
      setProfile(newProfile);
      console.log('✅ Novo perfil criado');

    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error);
      setError('Erro ao carregar perfil');

      // Em caso de erro, criar perfil local temporário
      const tempProfile = createDefaultProfile(userId, username);
      setProfile(tempProfile);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para salvar perfil
  const saveProfile = async (profileData) => {
    if (!profileData || !userId) return false;

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          profile: {
            ...profileData,
            lastUpdated: new Date().toISOString()
          }
        }),
      });

      if (response.ok) {
        console.log('✅ Perfil salvo no servidor');
        return true;
      } else {
        console.error('❌ Erro ao salvar perfil no servidor');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao salvar perfil:', error);
      return false;
    }
  };

  // Função para atualizar perfil
  const updateProfile = async (updates) => {
    if (!profile) return false;

    const updatedProfile = {
      ...profile,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    setProfile(updatedProfile);
    const saved = await saveProfile(updatedProfile);

    if (!saved) {
      console.warn('⚠️ Perfil atualizado localmente, mas não foi salvo no servidor');
    }

    return true;
  };

  // Função para atualizar estatísticas
  const updateStats = async (newStats) => {
    if (!profile) return false;

    return await updateProfile({
      stats: {
        ...profile.stats,
        ...newStats
      }
    });
  };

  // Função para atualizar preferências
  const updatePreferences = async (newPreferences) => {
    if (!profile) return false;

    return await updateProfile({
      preferences: {
        ...profile.preferences,
        ...newPreferences
      }
    });
  };

  // Função para verificar e desbloquear conquistas
  const checkAndUnlockAchievements = async (gameData = null) => {
    if (!profile) return [];

    const currentAchievements = profile.achievements || [];
    const newlyUnlocked = [];

    console.log('🔍 DEBUG - Verificando conquistas para perfil:', profile.username);
    console.log('🔍 DEBUG - Conquistas atuais no perfil:', currentAchievements);
    console.log('🔍 DEBUG - Estatísticas do perfil:', profile.stats);

    // Verificar todas as conquistas
    Object.values(achievements).forEach(achievement => {
      if (!currentAchievements.includes(achievement.id)) {
        const isUnlocked = checkAchievementUnlocked(achievement.id, profile.stats, profile);
        console.log(`🔍 DEBUG - ${achievement.id}: ${isUnlocked ? 'DESBLOQUEADA' : 'bloqueada'}`);
        if (isUnlocked) {
          newlyUnlocked.push(achievement.id);
        }
      }
    });

    // Se há novas conquistas, atualizar perfil
    if (newlyUnlocked.length > 0) {
      const updatedAchievements = [...currentAchievements, ...newlyUnlocked];

      console.log('🏆 DEBUG - Conquistas antes da atualização:', currentAchievements);
      console.log('🏆 DEBUG - Novas conquistas:', newlyUnlocked);
      console.log('🏆 DEBUG - Conquistas após atualização:', updatedAchievements);

      await updateProfile({
        achievements: updatedAchievements
      });

      console.log('🏆 Novas conquistas desbloqueadas:', newlyUnlocked);

      // Mostrar notificações para cada conquista desbloqueada
      newlyUnlocked.forEach(achievementId => {
        const achievement = achievements[achievementId];
        if (achievement && window.showAchievementToast) {
          window.showAchievementToast(achievement);
        }
      });
    }

    return newlyUnlocked;
  };

  // Função para verificar e desbloquear badges
  const checkAndUnlockBadges = async () => {
    if (!profile) return [];

    const currentBadges = profile.badges || [];
    const newlyUnlocked = [];

    // Verificar todos os badges
    Object.values(badges).forEach(badge => {
      if (!currentBadges.includes(badge.id)) {
        if (checkBadgeUnlocked(badge.id, profile)) {
          newlyUnlocked.push(badge.id);
        }
      }
    });

    // Se há novos badges, atualizar perfil
    if (newlyUnlocked.length > 0) {
      const updatedBadges = [...currentBadges, ...newlyUnlocked];
      await updateProfile({
        badges: updatedBadges
      });

      console.log('🎖️ Novos badges desbloqueados:', newlyUnlocked);
    }

    return newlyUnlocked;
  };

  // Função para atualizar estatísticas do jogo
  const updateGameStats = async (gameData) => {
    if (!profile) return false;

    const { won, attempts, mode, song, streak, songsCompleted, playTime, isComeback, consecutiveLosses, dailyGameCompleted, gameDate } = gameData;

    // Atualizar estatísticas básicas
    const newStats = { ...profile.stats };
    newStats.totalGames = (newStats.totalGames || 0) + 1;

    if (won) {
      newStats.wins = (newStats.wins || 0) + 1;

      // Atualizar streak
      if (mode === 'daily') {
        newStats.currentStreak = (newStats.currentStreak || 0) + 1;
        newStats.bestStreak = Math.max(newStats.bestStreak || 0, newStats.currentStreak);
      }

      // Verificar jogo perfeito (1 tentativa)
      if (attempts === 1) {
        newStats.perfectGames = (newStats.perfectGames || 0) + 1;
      }

      // Atualizar tempo mais rápido
      if (playTime && (!newStats.fastestWin || playTime < newStats.fastestWin)) {
        newStats.fastestWin = playTime;
      }
    } else {
      // Reset streak em caso de derrota no modo diário
      if (mode === 'daily') {
        newStats.currentStreak = 0;
      }
    }

    // Atualizar estatísticas por modo
    if (!newStats.modeStats) {
      newStats.modeStats = {
        daily: { games: 0, wins: 0, currentStreak: 0, bestStreak: 0, lastPlayedDate: null, hasPlayedToday: false },
        infinite: { games: 0, wins: 0, bestStreak: 0, currentStreak: 0, totalSongsCompleted: 0 },
        multiplayer: { games: 0, wins: 0, roomsCreated: 0, roomsJoined: 0 }
      };
    }

    // Atualizar estatísticas específicas do modo
    if (mode === 'daily') {
      newStats.modeStats.daily.games = (newStats.modeStats.daily.games || 0) + 1;
      if (won) {
        newStats.modeStats.daily.wins = (newStats.modeStats.daily.wins || 0) + 1;
        newStats.modeStats.daily.currentStreak = (newStats.modeStats.daily.currentStreak || 0) + 1;
        newStats.modeStats.daily.bestStreak = Math.max(newStats.modeStats.daily.bestStreak || 0, newStats.modeStats.daily.currentStreak);
      } else {
        newStats.modeStats.daily.currentStreak = 0;
      }
      newStats.modeStats.daily.lastPlayedDate = new Date().toISOString();
      newStats.modeStats.daily.hasPlayedToday = true;
    } else if (mode === 'infinite') {
      console.log('📊 Atualizando estatísticas do modo infinito:', { won, streak, songsCompleted });
      newStats.modeStats.infinite.games = (newStats.modeStats.infinite.games || 0) + 1;
      if (won) {
        newStats.modeStats.infinite.wins = (newStats.modeStats.infinite.wins || 0) + 1;
        // Para modo infinito, usar o streak passado como parâmetro
        if (streak) {
          newStats.modeStats.infinite.currentStreak = streak;
          newStats.modeStats.infinite.bestStreak = Math.max(newStats.modeStats.infinite.bestStreak || 0, streak);
          console.log('📊 Novo streak no modo infinito:', streak, 'Melhor:', newStats.modeStats.infinite.bestStreak);
        }
        if (songsCompleted) {
          newStats.modeStats.infinite.totalSongsCompleted = (newStats.modeStats.infinite.totalSongsCompleted || 0) + songsCompleted;
        }
      } else {
        // Quando perde no modo infinito, resetar streak atual
        newStats.modeStats.infinite.currentStreak = 0;
        console.log('📊 Resetando streak atual do modo infinito');
      }
      console.log('📊 Estatísticas do modo infinito atualizadas:', newStats.modeStats.infinite);
    } else if (mode === 'multiplayer') {
      newStats.modeStats.multiplayer.games = (newStats.modeStats.multiplayer.games || 0) + 1;
      if (won) {
        newStats.modeStats.multiplayer.wins = (newStats.modeStats.multiplayer.wins || 0) + 1;
      }
    }

    // Calcular taxa de vitória
    newStats.winRate = newStats.totalGames > 0 ? Math.round((newStats.wins / newStats.totalGames) * 100) : 0;

    // Atualizar dados de tempo nas estatísticas
    if (playTime) {
      newStats.totalPlayTime = (newStats.totalPlayTime || 0) + playTime;
      newStats.longestSession = Math.max(newStats.longestSession || 0, playTime);
    }

    // 🎯 CALCULAR E ADICIONAR XP
    let xpGained = 0;

    if (won) {
      if (attempts === 1) {
        xpGained += 100; // 🎯 Acertar na 1ª tentativa: +100 XP
      } else {
        xpGained += 50;  // 🎵 Vitória normal: +50 XP
      }

      // 🔥 Bônus por sequência: +10 XP por cada 5 vitórias seguidas
      if (mode === 'daily' && newStats.currentStreak > 0 && newStats.currentStreak % 5 === 0) {
        xpGained += 10;
      }
    } else {
      xpGained += 10; // 📚 Tentar mesmo perdendo: +10 XP
    }

    // Atualizar XP e recalcular nível
    const currentXP = profile.xp || 0;
    const newXP = currentXP + xpGained;
    const newLevel = Math.floor(Math.sqrt(newXP / 300)) + 1;

    console.log(`🎯 XP Ganho: +${xpGained} | Total: ${newXP} | Nível: ${newLevel}`);

    // Atualizar estatísticas de franquia
    const newFranchiseStats = { ...profile.franchiseStats };
    if (song && song.game) {
      const franchise = song.game;
      if (!newFranchiseStats[franchise]) {
        newFranchiseStats[franchise] = { games: 0, wins: 0, winRate: 0 };
      }
      newFranchiseStats[franchise].games += 1;
      if (won) {
        newFranchiseStats[franchise].wins += 1;
      }
      // Calcular winRate
      newFranchiseStats[franchise].winRate = newFranchiseStats[franchise].games > 0
        ? (newFranchiseStats[franchise].wins / newFranchiseStats[franchise].games) * 100
        : 0;
    }

    // Adicionar ao histórico de jogos
    const gameHistoryEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      mode,
      song: song ? { title: song.title, game: song.game, id: song.id } : null,
      won,
      attempts,
      playTime,
      isComeback,
      consecutiveLosses,
      gameDate
    };

    const newGameHistory = [...(profile.gameHistory || []), gameHistoryEntry];

    // Atualizar perfil com XP e nível
    const success = await updateProfile({
      xp: newXP,
      level: newLevel,
      stats: newStats,
      franchiseStats: newFranchiseStats,
      gameHistory: newGameHistory
    });

    if (success) {
      // Verificar conquistas e badges após atualizar estatísticas
      setTimeout(async () => {
        await checkAndUnlockAchievements(gameData);
        await checkAndUnlockBadges();
      }, 100);
    }

    return success;
  };

  // Função para recarregar dados
  const reloadProfile = async () => {
    if (isAuthenticated && userId) {
      await loadProfile();
    }
  };

  const value = {
    profile,
    isLoading,
    error,
    updateProfile,
    updateStats,
    updatePreferences,
    updateGameStats,
    checkAndUnlockAchievements,
    checkAndUnlockBadges,
    reloadProfile,
    saveProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
