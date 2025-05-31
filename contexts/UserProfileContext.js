import React, { createContext, useContext, useState, useEffect } from 'react';
import { achievements, calculateAchievementProgress } from '../data/achievements';
import { getUnlockedBadges, getAvailableTitles } from '../data/badges';

const UserProfileContext = createContext();

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    console.warn('useUserProfile usado fora do UserProfileProvider');
    return {
      profile: null,
      isLoading: false,
      updateProfile: () => {},
      updateGameStats: () => {}
    };
  }
  return context;
};

export const UserProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [userId, setUserId] = useState(null);

  // Gerar ou recuperar ID do usuário
  const getUserId = () => {
    if (typeof window === 'undefined') return null;
    
    let storedUserId = localStorage.getItem('ludomusic_user_id');
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ludomusic_user_id', storedUserId);
    }
    return storedUserId;
  };

  // Verificar se está no cliente
  useEffect(() => {
    setIsClient(true);
    const id = getUserId();
    setUserId(id);
  }, []);

  // Carregar perfil quando o componente montar
  useEffect(() => {
    if (isClient && userId) {
      loadProfile();
    }
  }, [isClient, userId]);

  const loadProfile = () => {
    try {
      setIsLoading(true);

      // Tentar carregar do localStorage
      const savedProfile = localStorage.getItem(`ludomusic_profile_${userId}`);

      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
      } else {
        // Criar novo perfil
        const newProfile = {
          id: userId,
          username: `Jogador_${userId?.slice(-6) || '000000'}`,
          displayName: '',
          bio: '',
          avatar: '/default-avatar.svg',
          level: 1,
          xp: 0,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          stats: {
            totalGames: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            currentStreak: 0,
            bestStreak: 0,
            totalPlayTime: 0,
            perfectGames: 0, // Jogos acertados na primeira tentativa
            averageAttempts: 0,
            fastestWin: null, // Tempo da vitória mais rápida
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
          franchiseStats: {}, // Estatísticas por franquia
          preferences: {
            theme: 'dark',
            language: 'pt',
            notifications: true,
            showAchievementPopups: true,
            hasSeenProfileTutorial: false
          },
          badges: [], // Badges especiais conquistados
          titles: [], // Títulos desbloqueados
          currentTitle: null, // Título atualmente exibido
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

        setProfile(newProfile);
        localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(newProfile));
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar perfil
  const updateProfile = (updates) => {
    if (!profile || !userId) return;

    try {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);

      // Salvar no localStorage
      localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

      return updatedProfile;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  // Calcular nível baseado no XP
  const calculateLevel = (xp) => {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  };

  // Verificar e desbloquear conquistas
  const checkAchievements = (updatedProfile) => {
    const newAchievements = [];

    Object.values(achievements).forEach(achievement => {
      if (!updatedProfile.achievements.includes(achievement.id)) {
        const progress = calculateAchievementProgress(achievement.id, updatedProfile.stats, updatedProfile);
        if (progress >= 100) {
          newAchievements.push(achievement.id);
          updatedProfile.xp += achievement.xpReward;
        }
      }
    });

    if (newAchievements.length > 0) {
      updatedProfile.achievements = [...updatedProfile.achievements, ...newAchievements];

      // Mostrar notificação de conquista (se habilitado)
      if (updatedProfile.preferences.showAchievementPopups) {
        newAchievements.forEach(achievementId => {
          const achievement = achievements[achievementId];
          if (achievement) {
            showAchievementNotification(achievement);
          }
        });
      }
    }

    return updatedProfile;
  };

  // Verificar e atualizar badges
  const checkAndUpdateBadges = (updatedProfile) => {
    const currentBadges = updatedProfile.badges || [];
    const unlockedBadges = getUnlockedBadges(updatedProfile);
    const newBadges = unlockedBadges.filter(badgeId => !currentBadges.includes(badgeId));

    if (newBadges.length > 0) {
      updatedProfile.badges = [...currentBadges, ...newBadges];

      // Atualizar títulos disponíveis
      updatedProfile.titles = getAvailableTitles(updatedProfile);

      // Se não tem título atual e tem títulos disponíveis, definir o primeiro
      if (!updatedProfile.currentTitle && updatedProfile.titles.length > 0) {
        updatedProfile.currentTitle = updatedProfile.titles[0].id;
      }
    }

    return updatedProfile;
  };

  // Mostrar notificação de conquista
  const showAchievementNotification = (achievement) => {
    // Criar notificação visual
    if (typeof window !== 'undefined' && window.showAchievementToast) {
      window.showAchievementToast(achievement);
    }
  };

  // Atualizar estatísticas do jogo (VERSÃO AVANÇADA)
  const updateGameStats = (gameStats) => {
    if (!profile || !userId) return;

    try {
      const {
        won,
        attempts,
        mode = 'daily',
        song,
        playTime = 0,
        streak = 0,
        songsCompleted = 0,
        points = 0
      } = gameStats;

      let updatedProfile = { ...profile };

      // Atualizar último login
      updatedProfile.lastLogin = new Date().toISOString();

      // Atualizar estatísticas gerais
      updatedProfile.stats.totalGames += 1;
      updatedProfile.stats.totalPlayTime += playTime;

      if (won) {
        updatedProfile.stats.wins += 1;
        updatedProfile.stats.currentStreak += 1;
        updatedProfile.stats.bestStreak = Math.max(
          updatedProfile.stats.bestStreak,
          updatedProfile.stats.currentStreak
        );

        // XP baseado na performance
        let xpGained = 50; // XP base por vitória

        // Bônus por tentativas (menos tentativas = mais XP)
        if (attempts === 1) {
          xpGained += 50; // Perfeito!
          updatedProfile.stats.perfectGames += 1;
        } else if (attempts <= 2) {
          xpGained += 30; // Muito bom
        } else if (attempts <= 3) {
          xpGained += 20; // Bom
        } else if (attempts <= 4) {
          xpGained += 10; // Regular
        }

        // Bônus por streak
        if (updatedProfile.stats.currentStreak >= 5) {
          xpGained += Math.floor(updatedProfile.stats.currentStreak / 5) * 10;
        }

        // Verificar tempo mais rápido
        if (!updatedProfile.stats.fastestWin || playTime < updatedProfile.stats.fastestWin) {
          updatedProfile.stats.fastestWin = playTime;
        }

        updatedProfile.xp += xpGained;
      } else {
        updatedProfile.stats.losses += 1;
        updatedProfile.stats.currentStreak = 0;
        updatedProfile.xp += 10; // XP mínimo por tentar
      }

      // Calcular taxa de vitória
      updatedProfile.stats.winRate = (updatedProfile.stats.wins / updatedProfile.stats.totalGames) * 100;

      // Calcular média de tentativas
      const totalAttempts = updatedProfile.gameHistory.reduce((sum, game) => sum + (game.attempts || 0), 0) + attempts;
      updatedProfile.stats.averageAttempts = totalAttempts / updatedProfile.stats.totalGames;

      // Atualizar estatísticas por modo
      if (!updatedProfile.stats.modeStats[mode]) {
        updatedProfile.stats.modeStats[mode] = {
          games: 0,
          wins: 0,
          bestStreak: 0
        };
      }

      const modeStats = updatedProfile.stats.modeStats[mode];
      modeStats.games += 1;

      if (won) {
        modeStats.wins += 1;
        if (mode === 'daily') {
          modeStats.bestStreak = Math.max(modeStats.bestStreak || 0, updatedProfile.stats.currentStreak);
          if (attempts === 1) {
            modeStats.perfectGames = (modeStats.perfectGames || 0) + 1;
          }
          const totalModeAttempts = updatedProfile.gameHistory
            .filter(game => game.mode === mode)
            .reduce((sum, game) => sum + (game.attempts || 0), 0) + attempts;
          modeStats.averageAttempts = totalModeAttempts / modeStats.games;
        } else if (mode === 'infinite') {
          modeStats.totalSongsCompleted = (modeStats.totalSongsCompleted || 0) + songsCompleted;
          modeStats.bestStreak = Math.max(modeStats.bestStreak || 0, streak);
          modeStats.longestSession = Math.max(modeStats.longestSession || 0, songsCompleted);
        } else if (mode === 'multiplayer') {
          modeStats.totalPoints = (modeStats.totalPoints || 0) + points;
          modeStats.bestRoundScore = Math.max(modeStats.bestRoundScore || 0, points);
        }
      }

      // Atualizar estatísticas por franquia
      if (song && song.game) {
        if (!updatedProfile.franchiseStats[song.game]) {
          updatedProfile.franchiseStats[song.game] = {
            gamesPlayed: 0,
            wins: 0,
            winRate: 0
          };
        }

        const franchiseStats = updatedProfile.franchiseStats[song.game];
        franchiseStats.gamesPlayed += 1;
        if (won) {
          franchiseStats.wins += 1;
        }
        franchiseStats.winRate = (franchiseStats.wins / franchiseStats.gamesPlayed) * 100;
      }

      // Adicionar ao histórico
      const gameRecord = {
        id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
        mode,
        won,
        attempts,
        playTime,
        song: song ? {
          title: song.title,
          game: song.game,
          artist: song.artist || song.composer
        } : null,
        xpGained: won ? (50 + (attempts === 1 ? 50 : 0)) : 10
      };

      updatedProfile.gameHistory = [gameRecord, ...updatedProfile.gameHistory].slice(0, 100); // Manter apenas os últimos 100 jogos

      // Atualizar nível
      const newLevel = calculateLevel(updatedProfile.xp);
      if (newLevel > updatedProfile.level) {
        updatedProfile.level = newLevel;
        // Mostrar notificação de level up
        if (typeof window !== 'undefined' && window.showLevelUpToast) {
          window.showLevelUpToast(newLevel);
        }
      }

      // Verificar conquistas
      updatedProfile = checkAchievements(updatedProfile);

      // Verificar e atualizar badges
      updatedProfile = checkAndUpdateBadges(updatedProfile);

      setProfile(updatedProfile);
      localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

      return updatedProfile;
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  };

  // Função para resetar perfil (para testes ou reset completo)
  const resetProfile = () => {
    if (!userId) return;

    localStorage.removeItem(`ludomusic_profile_${userId}`);
    setProfile(null);
    loadProfile();
  };

  // Função para exportar dados do perfil
  const exportProfile = () => {
    if (!profile) return null;

    return {
      ...profile,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  };

  // Função para importar dados do perfil
  const importProfile = (profileData) => {
    if (!profileData || !userId) return false;

    try {
      // Validar estrutura básica
      if (!profileData.id || !profileData.stats) {
        throw new Error('Dados de perfil inválidos');
      }

      // Manter o ID atual do usuário
      const importedProfile = {
        ...profileData,
        id: userId,
        importedAt: new Date().toISOString()
      };

      setProfile(importedProfile);
      localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(importedProfile));

      return true;
    } catch (error) {
      console.error('Erro ao importar perfil:', error);
      return false;
    }
  };

  // Função para atualizar preferências
  const updatePreferences = (newPreferences) => {
    if (!profile || !userId) return;

    const updatedProfile = {
      ...profile,
      preferences: {
        ...profile.preferences,
        ...newPreferences
      }
    };

    setProfile(updatedProfile);
    localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

    return updatedProfile;
  };

  // Função para adicionar estatísticas sociais
  const updateSocialStats = (action, data = {}) => {
    if (!profile || !userId) return;

    let updatedProfile = { ...profile };
    let xpGained = 0;

    switch (action) {
      case 'share_game':
        updatedProfile.socialStats.gamesShared += 1;
        updatedProfile.socialStats.socialInteractions += 1;
        xpGained = 25;
        break;
      case 'refer_friend':
        updatedProfile.socialStats.friendsReferred += 1;
        updatedProfile.socialStats.socialInteractions += 1;
        xpGained = 100;
        break;
      case 'add_friend':
        updatedProfile.socialStats.friendsAdded += 1;
        updatedProfile.socialStats.socialInteractions += 1;
        xpGained = 50;
        break;
      case 'send_invite':
        updatedProfile.socialStats.invitesSent += 1;
        updatedProfile.socialStats.socialInteractions += 1;
        xpGained = 10;
        break;
      case 'accept_invite':
        updatedProfile.socialStats.invitesAccepted += 1;
        updatedProfile.socialStats.socialInteractions += 1;
        xpGained = 15;
        break;
      case 'multiplayer_game':
        updatedProfile.socialStats.multiplayerGamesPlayed += 1;
        if (data.won) {
          updatedProfile.socialStats.multiplayerWins += 1;
          xpGained = 75;
        } else {
          xpGained = 25;
        }
        break;
      case 'helpful_action':
        updatedProfile.socialStats.helpfulActions += 1;
        updatedProfile.socialStats.socialInteractions += 1;
        xpGained = 20;
        break;
      default:
        return;
    }

    // Adicionar XP ganho
    if (xpGained > 0) {
      updatedProfile.xp += xpGained;

      // Verificar level up
      const newLevel = calculateLevel(updatedProfile.xp);
      if (newLevel > updatedProfile.level) {
        updatedProfile.level = newLevel;
        if (typeof window !== 'undefined' && window.showLevelUpToast) {
          window.showLevelUpToast(newLevel);
        }
      }
    }

    // Verificar conquistas sociais
    updatedProfile = checkAchievements(updatedProfile);
    updatedProfile = checkAndUpdateBadges(updatedProfile);

    setProfile(updatedProfile);
    localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

    return updatedProfile;
  };

  // Função para marcar tutorial como visto
  const markTutorialAsSeen = () => {
    if (!profile || !userId) return;

    const updatedProfile = {
      ...profile,
      preferences: {
        ...profile.preferences,
        hasSeenProfileTutorial: true
      }
    };

    setProfile(updatedProfile);
    localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

    return updatedProfile;
  };

  // Função para alterar título atual
  const setCurrentTitle = (titleId) => {
    if (!profile || !userId) return;

    const availableTitles = getAvailableTitles(profile);
    const titleExists = availableTitles.find(title => title.id === titleId);

    if (!titleExists && titleId !== null) return;

    const updatedProfile = {
      ...profile,
      currentTitle: titleId
    };

    setProfile(updatedProfile);
    localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

    return updatedProfile;
  };

  // Função para atualizar avatar
  const updateAvatar = (avatarData) => {
    if (!profile || !userId) return;

    const updatedProfile = {
      ...profile,
      avatar: avatarData
    };

    setProfile(updatedProfile);
    localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

    return updatedProfile;
  };

  const value = {
    profile,
    isLoading,
    updateProfile,
    updateGameStats,
    resetProfile,
    exportProfile,
    importProfile,
    updatePreferences,
    updateSocialStats,
    calculateLevel,
    markTutorialAsSeen,
    setCurrentTitle,
    updateAvatar
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
