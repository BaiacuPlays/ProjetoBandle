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
      userId: null,
      updateProfile: () => {},
      updateGameStats: () => {},
      resetProfile: () => {},
      deleteAccount: () => {},
      exportProfile: () => {},
      importProfile: () => {},
      updatePreferences: () => {},
      updateSocialStats: () => {},
      calculateLevel: () => {},
      markTutorialAsSeen: () => {},
      setCurrentTitle: () => {},
      updateAvatar: () => {}
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

  // Gerar ou recuperar ID do usuário - APENAS PARA USUÁRIOS AUTENTICADOS
  const getUserId = () => {
    if (typeof window === 'undefined') return null;

    // APENAS usuários autenticados podem ter perfis
    if (isAuthenticated) {
      const authId = getAuthenticatedUserId();
      if (authId) return authId;
    }

    // NÃO permitir perfis para usuários não autenticados
    return null;
  };

  // Salvar perfil no servidor
  const saveProfileToServer = async (profileData) => {
    try {
      // Limpar e preparar dados para envio
      const cleanProfileData = {
        ...profileData,
        lastUpdated: new Date().toISOString()
      };

      // Garantir que campos obrigatórios existem
      if (!cleanProfileData.id) {
        cleanProfileData.id = userId;
      }

      if (!cleanProfileData.stats) {
        cleanProfileData.stats = {
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
        };
      }

      console.log('🌐 Enviando perfil para servidor:', {
        userId: cleanProfileData.id,
        hasStats: !!cleanProfileData.stats,
        xp: cleanProfileData.xp,
        level: cleanProfileData.level
      });

      // Obter token de sessão para autenticação
      const sessionToken = typeof window !== 'undefined' ?
        localStorage.getItem('ludomusic_session_token') : null;

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || '',
        },
        body: JSON.stringify({
          userId: cleanProfileData.id,
          profileData: cleanProfileData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro HTTP do servidor:', response.status, errorData);
        throw new Error(`Erro HTTP: ${response.status} - ${errorData.error || 'Erro desconhecido'}`);
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
    // Não tentar carregar se userId for null/undefined
    if (!userId || userId === 'null' || userId === 'undefined') {
      console.log('⚠️ UserId inválido, não carregando do servidor:', userId);
      return null;
    }

    try {
      console.log('🌐 Carregando perfil do servidor para userId:', userId);
      const response = await fetch(`/api/profile?userId=${userId}`);

      if (response.status === 404) {
        console.log('ℹ️ Perfil não encontrado no servidor (primeira vez)');
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
      return null; // Retornar null em vez de throw para não quebrar o fluxo
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

      // Só atualizar userId se mudou
      if (id !== userId) {
        setUserId(id);
      }

      // Só carregar perfil se tiver um ID válido e ainda não tiver perfil
      if (id && id !== 'null' && id !== 'undefined' && !profile) {
        console.log('🔑 UserId válido encontrado, carregando perfil:', id);
        // Chamar loadProfile diretamente aqui para evitar dependências circulares
        loadProfileInternal(id);
      } else if (!id || id === 'null' || id === 'undefined') {
        console.log('⚠️ UserId inválido, não carregando perfil:', id);
        setIsLoading(false);
      }
    }
  }, [authLoading, isAuthenticated, isClient, userId, profile]);

  // Atualizar perfil quando usuário faz login
  useEffect(() => {
    if (isAuthenticated && profile && userId) {
      const authenticatedUser = getAuthenticatedUser();



      if (authenticatedUser && (
        profile.username !== authenticatedUser.username ||
        profile.displayName !== authenticatedUser.displayName
      )) {


        const updatedProfile = {
          ...profile,
          username: authenticatedUser.username,
          displayName: authenticatedUser.displayName
        };

        setProfile(updatedProfile);
        localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

        // Salvar no servidor
        saveProfileToServer(updatedProfile).catch(error => {
          console.warn('Erro ao sincronizar perfil:', error);
        });
      }
    }
  }, [isAuthenticated, profile, userId]);

  const loadProfileInternal = async (targetUserId) => {
    // Usar o userId passado como parâmetro ou o do estado
    const userIdToUse = targetUserId || userId;

    // Não carregar se userId não estiver pronto
    if (!userIdToUse || userIdToUse === 'null' || userIdToUse === 'undefined') {
      console.log('⚠️ UserId não está pronto, aguardando...', userIdToUse);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Carregando perfil para userId:', userIdToUse);
      console.log('🔍 Estado atual - isAuthenticated:', isAuthenticated, 'isClient:', isClient);

      // 1. SEMPRE tentar carregar do localStorage primeiro (mais rápido e confiável)
      let localProfile = null;
      if (typeof window !== 'undefined' && userIdToUse) {
        const savedProfile = localStorage.getItem(`ludomusic_profile_${userIdToUse}`);
        if (savedProfile) {
          try {
            localProfile = JSON.parse(savedProfile);
            console.log('📱 Perfil encontrado no localStorage:', localProfile);

            // Validar integridade do perfil
            if (!localProfile.stats || !localProfile.achievements || localProfile.achievements === undefined) {
              console.warn('⚠️ Perfil local corrompido (dados ausentes), tentando backup...');
              throw new Error('Perfil corrompido - dados críticos ausentes');
            }
          } catch (error) {
            console.error('❌ Erro ao parsear perfil do localStorage:', error);

            // Tentar carregar do backup
            const backupProfile = localStorage.getItem(`ludomusic_profile_backup_${userIdToUse}`);
            if (backupProfile) {
              try {
                localProfile = JSON.parse(backupProfile);
                console.log('🔄 Perfil recuperado do backup:', localProfile);
                // Restaurar perfil principal
                localStorage.setItem(`ludomusic_profile_${userIdToUse}`, backupProfile);
              } catch (backupError) {
                console.error('❌ Backup também corrompido:', backupError);
                // Remover dados corrompidos
                localStorage.removeItem(`ludomusic_profile_${userIdToUse}`);
                localStorage.removeItem(`ludomusic_profile_backup_${userIdToUse}`);
              }
            } else {
              // Remover dados corrompidos
              localStorage.removeItem(`ludomusic_profile_${userIdToUse}`);
            }
          }
        } else {
          // Se não tem perfil principal, tentar backup
          const backupProfile = localStorage.getItem(`ludomusic_profile_backup_${userIdToUse}`);
          if (backupProfile) {
            try {
              localProfile = JSON.parse(backupProfile);
              console.log('🔄 Perfil carregado do backup (sem principal):', localProfile);
              // Restaurar perfil principal
              localStorage.setItem(`ludomusic_profile_${userIdToUse}`, backupProfile);
            } catch (error) {
              console.error('❌ Erro ao carregar backup:', error);
              localStorage.removeItem(`ludomusic_profile_backup_${userIdToUse}`);
            }
          }
        }
      }

      // 2. Tentar carregar do servidor em paralelo (para sincronização)
      let serverProfile = null;
      try {
        serverProfile = await loadProfileFromServer(userIdToUse);
        console.log('🌐 Perfil carregado do servidor:', serverProfile);
      } catch (error) {
        console.warn('⚠️ Não foi possível carregar do servidor:', error);
      }

      // 3. Decidir qual perfil usar - PRIORIZAR LOCALSTORAGE
      if (localProfile) {
        // USAR PERFIL LOCAL COMO PRINCIPAL (mais confiável)
        const authenticatedUser = getAuthenticatedUser();
        let updatedProfile = localProfile;

        // Se usuário está autenticado e o perfil não tem os dados corretos, atualizar
        if (authenticatedUser && (
          localProfile.username !== authenticatedUser.username ||
          localProfile.displayName !== authenticatedUser.displayName
        )) {
          updatedProfile = {
            ...localProfile,
            username: authenticatedUser.username,
            displayName: authenticatedUser.displayName,
            lastUpdated: new Date().toISOString()
          };

          // Salvar perfil atualizado localmente
          localStorage.setItem(`ludomusic_profile_${userIdToUse}`, JSON.stringify(updatedProfile));
        }

        console.log('✅ Definindo perfil local atualizado:', updatedProfile);
        setProfile(updatedProfile);
        console.log('✅ Perfil carregado do localStorage (prioridade)');

        // Sincronizar com servidor em background (sem bloquear)
        if (serverProfile) {
          // Se servidor tem dados mais recentes, mesclar
          const serverTime = new Date(serverProfile.lastUpdated || 0).getTime();
          const localTime = new Date(updatedProfile.lastUpdated || 0).getTime();

          if (serverTime > localTime) {
            console.log('🔄 Servidor tem dados mais recentes, mesclando...');
            // Mesclar dados importantes do servidor, mas manter progresso local
            const mergedProfile = {
              ...updatedProfile, // Base local
              // Manter apenas dados não críticos do servidor
              preferences: serverProfile.preferences || updatedProfile.preferences,
              // Manter estatísticas locais (mais importantes)
              stats: updatedProfile.stats,
              achievements: updatedProfile.achievements,
              xp: updatedProfile.xp,
              level: updatedProfile.level,
              lastUpdated: new Date().toISOString()
            };

            setProfile(mergedProfile);
            localStorage.setItem(`ludomusic_profile_${userIdToUse}`, JSON.stringify(mergedProfile));
          }
        }

        // Tentar sincronizar com servidor em background
        try {
          await saveProfileToServer(updatedProfile);
          console.log('🔄 Perfil sincronizado com servidor');
        } catch (error) {
          console.warn('⚠️ Não foi possível sincronizar com servidor:', error);
        }
      } else if (serverProfile) {
        // Só usar servidor se não tiver dados locais
        const authenticatedUser = getAuthenticatedUser();
        let updatedProfile = serverProfile;

        if (authenticatedUser && (
          serverProfile.username !== authenticatedUser.username ||
          serverProfile.displayName !== authenticatedUser.displayName
        )) {
          updatedProfile = {
            ...serverProfile,
            username: authenticatedUser.username,
            displayName: authenticatedUser.displayName,
            lastUpdated: new Date().toISOString()
          };
        }

        console.log('🌐 Definindo perfil do servidor:', updatedProfile);
        setProfile(updatedProfile);
        localStorage.setItem(`ludomusic_profile_${userIdToUse}`, JSON.stringify(updatedProfile));
        console.log('📥 Perfil carregado do servidor (sem dados locais)');
      } else {
        // Criar novo perfil
        const authenticatedUser = getAuthenticatedUser();



        const newProfile = {
          id: userIdToUse,
          username: authenticatedUser?.username || `Jogador_${userIdToUse?.slice(-6) || '000000'}`,
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

        console.log('🆕 Definindo novo perfil:', newProfile);
        setProfile(newProfile);
        localStorage.setItem(`ludomusic_profile_${userIdToUse}`, JSON.stringify(newProfile));

        // Salvar novo perfil no servidor
        try {
          await saveProfileToServer(newProfile);
          console.log('✨ Novo perfil criado e salvo no servidor');
        } catch (error) {
          console.warn('Não foi possível salvar novo perfil no servidor:', error);
        }
      }
    } catch (error) {
      console.error('❌ ERRO CRÍTICO ao carregar perfil:', error);

      // Em caso de erro crítico, tentar criar um perfil básico
      try {
        const authenticatedUser = getAuthenticatedUser();
        const emergencyProfile = {
          id: userIdToUse,
          username: authenticatedUser?.username || `Jogador_${userIdToUse?.slice(-6) || '000000'}`,
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
            perfectGames: 0,
            averageAttempts: 0,
            fastestWin: null,
            modeStats: {
              daily: { games: 0, wins: 0, bestStreak: 0, averageAttempts: 0, perfectGames: 0 },
              infinite: { games: 0, wins: 0, bestStreak: 0, totalSongsCompleted: 0, longestSession: 0 },
              multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0 }
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

        console.log('🚨 Criando perfil de emergência devido ao erro:', emergencyProfile);
        setProfile(emergencyProfile);
        localStorage.setItem(`ludomusic_profile_${userIdToUse}`, JSON.stringify(emergencyProfile));
      } catch (emergencyError) {
        console.error('❌ Falha ao criar perfil de emergência:', emergencyError);
        // Se nem o perfil de emergência funcionar, deixar profile como null
        // O componente UserProfile vai mostrar a mensagem de erro
      }
    } finally {
      setIsLoading(false);
      console.log('🏁 LoadProfile finalizado - profile definido:', !!profile);
    }
  };

  // Função pública para carregar perfil (usa userId do estado)
  const loadProfile = () => {
    return loadProfileInternal(userId);
  };

  // Função para garantir estrutura válida do perfil
  const ensureProfileStructure = (profileData) => {
    const baseProfile = {
      id: profileData.id || userId,
      username: profileData.username || `Jogador_${(profileData.id || userId)?.slice(-6) || '000000'}`,
      displayName: profileData.displayName || '',
      bio: profileData.bio || '',
      avatar: profileData.avatar || '/default-avatar.svg',
      level: profileData.level || 1,
      xp: profileData.xp || 0,
      createdAt: profileData.createdAt || new Date().toISOString(),
      lastLogin: profileData.lastLogin || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      stats: {
        totalGames: profileData.stats?.totalGames || 0,
        wins: profileData.stats?.wins || 0,
        losses: profileData.stats?.losses || 0,
        winRate: profileData.stats?.winRate || 0,
        currentStreak: profileData.stats?.currentStreak || 0,
        bestStreak: profileData.stats?.bestStreak || 0,
        totalPlayTime: profileData.stats?.totalPlayTime || 0,
        perfectGames: profileData.stats?.perfectGames || 0,
        averageAttempts: profileData.stats?.averageAttempts || 0,
        fastestWin: profileData.stats?.fastestWin || null,
        modeStats: {
          daily: {
            games: profileData.stats?.modeStats?.daily?.games || 0,
            wins: profileData.stats?.modeStats?.daily?.wins || 0,
            bestStreak: profileData.stats?.modeStats?.daily?.bestStreak || 0,
            averageAttempts: profileData.stats?.modeStats?.daily?.averageAttempts || 0,
            perfectGames: profileData.stats?.modeStats?.daily?.perfectGames || 0
          },
          infinite: {
            games: profileData.stats?.modeStats?.infinite?.games || 0,
            wins: profileData.stats?.modeStats?.infinite?.wins || 0,
            bestStreak: profileData.stats?.modeStats?.infinite?.bestStreak || 0,
            totalSongsCompleted: profileData.stats?.modeStats?.infinite?.totalSongsCompleted || 0,
            longestSession: profileData.stats?.modeStats?.infinite?.longestSession || 0
          },
          multiplayer: {
            games: profileData.stats?.modeStats?.multiplayer?.games || 0,
            wins: profileData.stats?.modeStats?.multiplayer?.wins || 0,
            roomsCreated: profileData.stats?.modeStats?.multiplayer?.roomsCreated || 0,
            totalPoints: profileData.stats?.modeStats?.multiplayer?.totalPoints || 0,
            bestRoundScore: profileData.stats?.modeStats?.multiplayer?.bestRoundScore || 0
          }
        }
      },
      achievements: profileData.achievements || [],
      gameHistory: profileData.gameHistory || [],
      franchiseStats: profileData.franchiseStats || {},
      preferences: {
        theme: 'dark',
        language: 'pt',
        notifications: true,
        showAchievementPopups: true,
        hasSeenProfileTutorial: false,
        ...profileData.preferences
      },
      badges: profileData.badges || [],
      titles: profileData.titles || [],
      currentTitle: profileData.currentTitle || null,
      socialStats: {
        gamesShared: 0,
        friendsReferred: 0,
        friendsAdded: 0,
        multiplayerGamesPlayed: 0,
        multiplayerWins: 0,
        invitesSent: 0,
        invitesAccepted: 0,
        socialInteractions: 0,
        helpfulActions: 0,
        ...profileData.socialStats
      }
    };

    return baseProfile;
  };

  // Atualizar perfil
  const updateProfile = async (updates) => {
    // 🔒 VERIFICAÇÃO DE SEGURANÇA: Apenas usuários autenticados podem atualizar perfil
    if (!isAuthenticated) {
      console.warn('⚠️ Tentativa de atualizar perfil sem autenticação bloqueada');
      return null;
    }

    if (!profile || !userId) {
      console.warn('⚠️ Perfil ou userId não disponível');
      return null;
    }

    try {
      console.log('🔄 Atualizando perfil com:', updates);
      console.log('📊 Perfil atual antes da atualização:', {
        xp: profile.xp,
        achievements: profile.achievements?.length || 0,
        totalGames: profile.stats?.totalGames || 0
      });

      const updatedProfile = ensureProfileStructure({
        ...profile,
        ...updates,
        lastUpdated: new Date().toISOString()
      });

      console.log('📊 Perfil após ensureProfileStructure:', {
        xp: updatedProfile.xp,
        achievements: updatedProfile.achievements?.length || 0,
        totalGames: updatedProfile.stats?.totalGames || 0
      });

      setProfile(updatedProfile);

      // SEMPRE salvar no localStorage primeiro (mais confiável)
      localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

      // Criar backup adicional
      localStorage.setItem(`ludomusic_profile_backup_${userId}`, JSON.stringify(updatedProfile));

      console.log('💾 Perfil atualizado localmente');

      // Salvar no servidor em background (não bloquear)
      try {
        await saveProfileToServer(updatedProfile);
        console.log('🌐 Perfil sincronizado com servidor');
      } catch (error) {
        console.warn('⚠️ Não foi possível sincronizar com servidor (dados salvos localmente):', error);
      }

      return updatedProfile;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      throw error; // Re-throw para que o erro seja tratado pelo chamador
    }
  };

  // Calcular nível baseado no XP
  // Fórmula: Level = floor(sqrt(XP / 100)) + 1
  // XP necessário para level N = (N-1)² * 100
  const calculateLevel = (xp) => {
    if (xp < 0) return 1;
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  };

  // Calcular XP necessário para um nível específico
  const getXPForLevel = (level) => {
    if (level <= 1) return 0;
    return Math.pow(level - 1, 2) * 100;
  };

  // Calcular XP necessário para o próximo nível
  const getXPForNextLevel = (currentLevel) => {
    return Math.pow(currentLevel, 2) * 100;
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

      // Mostrar notificação de conquista (se habilitado) com delay para evitar IDs duplicados
      if (updatedProfile.preferences.showAchievementPopups) {
        newAchievements.forEach((achievementId, index) => {
          const achievement = achievements[achievementId];
          if (achievement) {
            // Adicionar delay progressivo para evitar IDs duplicados
            setTimeout(() => {
              showAchievementNotification(achievement);
            }, index * 100); // 100ms de delay entre cada notificação
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
    console.log('🎯 Tentando mostrar notificação para:', achievement.title);

    // Verificar se a função global existe
    if (typeof window !== 'undefined' && window.showAchievementToast) {
      try {
        window.showAchievementToast(achievement);
        console.log('✅ Notificação enviada com sucesso para:', achievement.title);
      } catch (error) {
        console.error('❌ Erro ao mostrar notificação:', error);
      }
    } else {
      console.warn('⚠️ Função showAchievementToast não encontrada');
    }
  };

  // Atualizar estatísticas do jogo (VERSÃO AVANÇADA)
  const updateGameStats = async (gameStats) => {
    // 🔒 VERIFICAÇÃO DE SEGURANÇA: Apenas usuários autenticados podem atualizar estatísticas
    if (!isAuthenticated) {
      console.warn('⚠️ Tentativa de atualizar estatísticas sem autenticação bloqueada');
      return null;
    }

    if (!profile || !userId) {
      console.warn('⚠️ Perfil ou userId não disponível');
      return null;
    }

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
      const oldLevel = updatedProfile.level;
      const newLevel = calculateLevel(updatedProfile.xp);
      const xpForCurrentLevel = getXPForLevel(oldLevel);
      const xpForNextLevel = getXPForNextLevel(oldLevel);

      console.log(`🔢 Debug Level Up:`, {
        currentXP: updatedProfile.xp,
        oldLevel: oldLevel,
        newLevel: newLevel,
        xpForCurrentLevel: xpForCurrentLevel,
        xpForNextLevel: xpForNextLevel,
        xpNeededForNext: xpForNextLevel - updatedProfile.xp
      });

      if (newLevel > updatedProfile.level) {
        updatedProfile.level = newLevel;
        console.log(`🆙 LEVEL UP! ${oldLevel} → ${newLevel}`);
        // Mostrar notificação de level up
        if (typeof window !== 'undefined' && window.showLevelUpToast) {
          window.showLevelUpToast(newLevel);
        }
      } else if (newLevel < updatedProfile.level) {
        // Isso não deveria acontecer, mas vamos corrigir se acontecer
        console.warn(`⚠️ Level inconsistente detectado! XP: ${updatedProfile.xp}, Level atual: ${updatedProfile.level}, Level calculado: ${newLevel}`);
        updatedProfile.level = newLevel;
      }

      // Verificar conquistas ANTES do level up final (conquistas podem dar XP adicional)
      updatedProfile = checkAchievements(updatedProfile);

      // Recalcular level após XP das conquistas
      const finalLevel = calculateLevel(updatedProfile.xp);
      if (finalLevel > updatedProfile.level) {
        console.log(`🆙 LEVEL UP POR CONQUISTAS! ${updatedProfile.level} → ${finalLevel}`);
        updatedProfile.level = finalLevel;
        if (typeof window !== 'undefined' && window.showLevelUpToast) {
          window.showLevelUpToast(finalLevel);
        }
      }

      // Verificar e atualizar badges
      updatedProfile = checkAndUpdateBadges(updatedProfile);

      // Validar perfil antes de salvar
      if (!updatedProfile.stats || !updatedProfile.achievements) {
        console.error('❌ Perfil corrompido detectado! Não salvando.');
        throw new Error('Perfil corrompido - dados críticos ausentes');
      }

      // SEMPRE salvar localmente primeiro (crítico para não perder dados)
      setProfile(updatedProfile);
      localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

      // Backup adicional para estatísticas críticas
      localStorage.setItem(`ludomusic_profile_backup_${userId}`, JSON.stringify(updatedProfile));

      console.log('💾 Estatísticas salvas localmente:', {
        xp: updatedProfile.xp,
        level: updatedProfile.level,
        totalGames: updatedProfile.stats.totalGames,
        wins: updatedProfile.stats.wins
      });

      // Salvar no servidor em background (não bloquear)
      try {
        await saveProfileToServer(updatedProfile);
        console.log('🌐 Estatísticas sincronizadas com servidor');
      } catch (error) {
        console.warn('⚠️ Não foi possível sincronizar com servidor (dados salvos localmente):', error);
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
      // Obter token de sessão para autenticação
      const sessionToken = localStorage.getItem('ludomusic_session_token');

      // Deletar do servidor
      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      // Limpar TODOS os dados locais relacionados ao usuário
      localStorage.removeItem(`ludomusic_profile_${userId}`);
      localStorage.removeItem('ludomusic_user_id');
      localStorage.removeItem('ludomusic_session_token');
      localStorage.removeItem('ludomusic_user_data');

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
    // 🔒 VERIFICAÇÃO DE SEGURANÇA: Apenas usuários autenticados podem atualizar estatísticas sociais
    if (!isAuthenticated) {
      console.warn('⚠️ Tentativa de atualizar estatísticas sociais sem autenticação bloqueada');
      return null;
    }

    if (!profile || !userId) {
      console.warn('⚠️ Perfil ou userId não disponível');
      return null;
    }

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
      const oldLevel = updatedProfile.level;
      const newLevel = calculateLevel(updatedProfile.xp);

      console.log(`🔢 Debug Social Level Up:`, {
        action: action,
        xpGained: xpGained,
        currentXP: updatedProfile.xp,
        oldLevel: oldLevel,
        newLevel: newLevel
      });

      if (newLevel > updatedProfile.level) {
        updatedProfile.level = newLevel;
        console.log(`🆙 SOCIAL LEVEL UP! ${oldLevel} → ${newLevel}`);
        if (typeof window !== 'undefined' && window.showLevelUpToast) {
          window.showLevelUpToast(newLevel);
        }
      }
    }

    // Verificar conquistas sociais (podem dar XP adicional)
    updatedProfile = checkAchievements(updatedProfile);

    // Recalcular level após XP das conquistas sociais
    const finalSocialLevel = calculateLevel(updatedProfile.xp);
    if (finalSocialLevel > updatedProfile.level) {
      console.log(`🆙 SOCIAL LEVEL UP POR CONQUISTAS! ${updatedProfile.level} → ${finalSocialLevel}`);
      updatedProfile.level = finalSocialLevel;
      if (typeof window !== 'undefined' && window.showLevelUpToast) {
        window.showLevelUpToast(finalSocialLevel);
      }
    }

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
      },
      lastUpdated: new Date().toISOString()
    };

    setProfile(updatedProfile);
    localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

    // Também salvar uma flag específica para o tutorial
    localStorage.setItem(`ludomusic_tutorial_seen_${userId}`, 'true');

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
    userId, // Adicionar userId ao contexto
    updateProfile,
    updateGameStats,
    resetProfile,
    deleteAccount,
    exportProfile,
    importProfile,
    updatePreferences,
    updateSocialStats,
    calculateLevel,
    getXPForLevel,
    getXPForNextLevel,
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
