import React, { createContext, useContext, useState, useEffect } from 'react';
import { achievements, calculateAchievementProgress } from '../data/achievements';
import { getUnlockedBadges, getAvailableTitles } from '../data/badges';
import { useAuth } from './AuthContext';

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
  const { isAuthenticated, getAuthenticatedUserId, getAuthenticatedUser, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [userId, setUserId] = useState(null);

  // Gerar ou recuperar ID do usuário
  const getUserId = () => {
    if (typeof window === 'undefined') return null;

    // Se usuário está autenticado, usar ID autenticado
    if (isAuthenticated) {
      const authId = getAuthenticatedUserId();
      if (authId) return authId;
    }

    // Caso contrário, usar ID anônimo
    let storedUserId = localStorage.getItem('ludomusic_user_id');
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ludomusic_user_id', storedUserId);
    }
    return storedUserId;
  };

  // Salvar perfil no servidor
  const saveProfileToServer = async (profileData) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profileData.id,
          profileData
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Perfil salvo no servidor:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao salvar perfil no servidor:', error);
      throw error;
    }
  };

  // Carregar perfil do servidor
  const loadProfileFromServer = async (userId) => {
    try {
      const response = await fetch(`/api/profile?userId=${userId}`);

      if (response.status === 404) {
        return null; // Perfil não existe no servidor
      }

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Perfil carregado do servidor:', result);
      return result.profile;
    } catch (error) {
      console.error('❌ Erro ao carregar perfil do servidor:', error);
      throw error;
    }
  };

  // Verificar se está no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Aguardar autenticação e então carregar perfil
  useEffect(() => {
    if (!authLoading && isClient) {
      const id = getUserId();
      setUserId(id);

      if (id) {
        loadProfile();
      }
    }
  }, [authLoading, isAuthenticated, isClient]);

  // Atualizar perfil quando usuário faz login
  useEffect(() => {
    if (isAuthenticated && profile && userId) {
      const authenticatedUser = getAuthenticatedUser();

      console.log('🔄 Verificando se perfil precisa ser atualizado após login...');
      console.log('🔍 Usuário autenticado:', authenticatedUser);
      console.log('🔍 Perfil atual:', {
        username: profile.username,
        displayName: profile.displayName
      });

      if (authenticatedUser && (
        profile.username !== authenticatedUser.username ||
        profile.displayName !== authenticatedUser.displayName
      )) {
        console.log('🔄 Atualizando perfil com dados de autenticação...');

        const updatedProfile = {
          ...profile,
          username: authenticatedUser.username,
          displayName: authenticatedUser.displayName
        };

        setProfile(updatedProfile);
        localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

        // Salvar no servidor
        saveProfileToServer(updatedProfile).then(() => {
          console.log('✅ Perfil atualizado e sincronizado com servidor');
        }).catch(error => {
          console.warn('Erro ao sincronizar perfil:', error);
        });
      }
    }
  }, [isAuthenticated, profile, userId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);

      // 1. Tentar carregar do servidor primeiro
      let serverProfile = null;
      try {
        serverProfile = await loadProfileFromServer(userId);
      } catch (error) {
        console.warn('Não foi possível carregar do servidor, tentando localStorage');
      }

      // 2. Se não encontrou no servidor, tentar localStorage
      let localProfile = null;
      const savedProfile = localStorage.getItem(`ludomusic_profile_${userId}`);
      if (savedProfile) {
        localProfile = JSON.parse(savedProfile);
      }

      // 3. Decidir qual perfil usar
      if (serverProfile) {
        // Usar perfil do servidor, mas atualizar com dados de autenticação se necessário
        const authenticatedUser = getAuthenticatedUser();
        let updatedProfile = serverProfile;

        // Debug: verificar dados de autenticação
        console.log('🔍 Debug - Dados de autenticação:', authenticatedUser);
        console.log('🔍 Debug - Perfil do servidor:', {
          username: serverProfile.username,
          displayName: serverProfile.displayName
        });

        // Se usuário está autenticado e o perfil não tem os dados corretos, atualizar
        if (authenticatedUser && (
          serverProfile.username !== authenticatedUser.username ||
          serverProfile.displayName !== authenticatedUser.displayName
        )) {
          updatedProfile = {
            ...serverProfile,
            username: authenticatedUser.username,
            displayName: authenticatedUser.displayName
          };

          // Salvar perfil atualizado no servidor
          try {
            await saveProfileToServer(updatedProfile);
            console.log('🔄 Perfil atualizado com dados de autenticação');
          } catch (error) {
            console.warn('Não foi possível salvar perfil atualizado no servidor:', error);
          }
        }

        setProfile(updatedProfile);
        localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));
        console.log('📥 Perfil carregado do servidor');
      } else if (localProfile) {
        // Usar perfil local, mas verificar se precisa atualizar com dados de autenticação
        const authenticatedUser = getAuthenticatedUser();
        let updatedProfile = localProfile;

        console.log('🔍 Debug LOCAL - Dados de autenticação:', authenticatedUser);
        console.log('🔍 Debug LOCAL - Perfil local:', {
          username: localProfile.username,
          displayName: localProfile.displayName
        });

        // Se usuário está autenticado e o perfil não tem os dados corretos, atualizar
        if (authenticatedUser && (
          localProfile.username !== authenticatedUser.username ||
          localProfile.displayName !== authenticatedUser.displayName
        )) {
          updatedProfile = {
            ...localProfile,
            username: authenticatedUser.username,
            displayName: authenticatedUser.displayName
          };

          console.log('🔄 Perfil LOCAL atualizado com dados de autenticação');

          // Salvar perfil atualizado localmente e no servidor
          localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

          try {
            await saveProfileToServer(updatedProfile);
            console.log('💾 Perfil LOCAL sincronizado com servidor');
          } catch (error) {
            console.warn('Não foi possível sincronizar perfil local com servidor:', error);
          }
        }

        setProfile(updatedProfile);
        console.log('📱 Perfil carregado do localStorage');

        // Tentar migrar para servidor em background
        try {
          await saveProfileToServer(localProfile);
          console.log('🔄 Perfil migrado para servidor');
        } catch (error) {
          console.warn('Não foi possível migrar perfil para servidor:', error);
        }
      } else {
        // Criar novo perfil
        const authenticatedUser = getAuthenticatedUser();

        console.log('🆕 Criando novo perfil...');
        console.log('🔍 Dados de autenticação disponíveis:', authenticatedUser);

        const newProfile = {
          id: userId,
          username: authenticatedUser?.username || `Jogador_${userId?.slice(-6) || '000000'}`,
          displayName: authenticatedUser?.displayName || '',
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

        // Salvar novo perfil no servidor
        try {
          await saveProfileToServer(newProfile);
          console.log('✨ Novo perfil criado e salvo no servidor');
        } catch (error) {
          console.warn('Não foi possível salvar novo perfil no servidor:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar perfil
  const updateProfile = async (updates) => {
    if (!profile || !userId) return;

    try {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);

      // Salvar no localStorage
      localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

      // Salvar no servidor
      try {
        await saveProfileToServer(updatedProfile);
        console.log('💾 Perfil atualizado no servidor');
      } catch (error) {
        console.warn('Não foi possível atualizar perfil no servidor:', error);
      }

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

    console.log('🏆 Verificando conquistas para perfil:', {
      totalGames: updatedProfile.stats.totalGames,
      wins: updatedProfile.stats.wins,
      level: updatedProfile.level,
      currentAchievements: updatedProfile.achievements.length
    });

    Object.values(achievements).forEach(achievement => {
      if (!updatedProfile.achievements.includes(achievement.id)) {
        const progress = calculateAchievementProgress(achievement.id, updatedProfile.stats, updatedProfile);

        // Log para conquistas básicas
        if (['first_game', 'first_win', 'veteran'].includes(achievement.id)) {
          console.log(`🎯 ${achievement.id}: ${progress}% (${achievement.title})`);
        }

        if (progress >= 100) {
          newAchievements.push(achievement.id);
          updatedProfile.xp += achievement.xpReward;
          console.log(`✅ Conquista desbloqueada: ${achievement.title} (+${achievement.xpReward} XP)`);
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
  const updateGameStats = async (gameStats) => {
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

      // Salvar no servidor
      try {
        await saveProfileToServer(updatedProfile);
        console.log('📊 Estatísticas atualizadas no servidor');
      } catch (error) {
        console.warn('Não foi possível atualizar estatísticas no servidor:', error);
      }

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

  // Função para deletar conta permanentemente
  const deleteAccount = async () => {
    if (!userId || !profile) return false;

    try {
      // Deletar do servidor
      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      // Deletar dados locais
      localStorage.removeItem(`ludomusic_profile_${userId}`);
      localStorage.removeItem('ludomusic_user_id');

      // Limpar estado
      setProfile(null);
      setUserId(null);

      console.log('🗑️ Conta deletada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar conta:', error);
      return false;
    }
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
  const importProfile = async (profileData) => {
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

      // Salvar no servidor
      try {
        await saveProfileToServer(importedProfile);
        console.log('📥 Perfil importado e salvo no servidor');
      } catch (error) {
        console.warn('Não foi possível salvar perfil importado no servidor:', error);
      }

      return true;
    } catch (error) {
      console.error('Erro ao importar perfil:', error);
      return false;
    }
  };

  // Função para atualizar preferências
  const updatePreferences = async (newPreferences) => {
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

    // Salvar no servidor
    try {
      await saveProfileToServer(updatedProfile);
      console.log('⚙️ Preferências atualizadas no servidor');
    } catch (error) {
      console.warn('Não foi possível atualizar preferências no servidor:', error);
    }

    return updatedProfile;
  };

  // Função para adicionar estatísticas sociais
  const updateSocialStats = async (action, data = {}) => {
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

    // Salvar no servidor
    try {
      await saveProfileToServer(updatedProfile);
      console.log('🤝 Estatísticas sociais atualizadas no servidor');
    } catch (error) {
      console.warn('Não foi possível atualizar estatísticas sociais no servidor:', error);
    }

    return updatedProfile;
  };

  // Função para marcar tutorial como visto
  const markTutorialAsSeen = async () => {
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

    // Salvar no servidor
    try {
      await saveProfileToServer(updatedProfile);
      console.log('📚 Tutorial marcado como visto no servidor');
    } catch (error) {
      console.warn('Não foi possível atualizar tutorial no servidor:', error);
    }

    return updatedProfile;
  };

  // Função para alterar título atual
  const setCurrentTitle = async (titleId) => {
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

    // Salvar no servidor
    try {
      await saveProfileToServer(updatedProfile);
      console.log('🏆 Título atualizado no servidor');
    } catch (error) {
      console.warn('Não foi possível atualizar título no servidor:', error);
    }

    return updatedProfile;
  };

  // Função para atualizar avatar
  const updateAvatar = async (avatarData) => {
    if (!profile || !userId) return;

    const updatedProfile = {
      ...profile,
      avatar: avatarData
    };

    setProfile(updatedProfile);
    localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

    // Salvar no servidor
    try {
      await saveProfileToServer(updatedProfile);
      console.log('🖼️ Avatar atualizado no servidor');
    } catch (error) {
      console.warn('Não foi possível atualizar avatar no servidor:', error);
    }

    return updatedProfile;
  };

  const value = {
    profile,
    isLoading,
    updateProfile,
    updateGameStats,
    resetProfile,
    deleteAccount,
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
