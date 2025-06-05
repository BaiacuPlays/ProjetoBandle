import { createContext, useContext, useState, useEffect } from 'react';
import { achievements, calculateAchievementProgress } from '../data/achievements';
import { getUnlockedBadges, getAvailableTitles } from '../data/badges';
import { useAuth } from './AuthContext';

const UserProfileContext = createContext();

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
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
  const { isAuthenticated, getAuthenticatedUserId, getAuthenticatedUser, isLoading: authLoading, renewToken } = useAuth();
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
      // Verificar se está autenticado antes de tentar salvar
      if (!isAuthenticated) {
        return null;
      }

      // Verificar se tem token de sessão
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      if (!sessionToken) {
        return null;
      }

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



      // Usar o token já obtido anteriormente

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken || ''}`,
        },
        body: JSON.stringify({
          profile: cleanProfileData
        })
      });

      if (response.status === 401) {
        // Token expirado - tentar renovar
        console.log('🔄 Token expirado, tentando renovar...');
        const renewResult = await renewToken();

        if (renewResult.success) {
          // Tentar novamente com novo token
          const newSessionToken = localStorage.getItem('ludomusic_session_token');
          const retryResponse = await fetch('/api/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newSessionToken}`,
            },
            body: JSON.stringify({
              profile: cleanProfileData
            })
          });

          if (retryResponse.ok) {
            console.log('✅ Perfil salvo após renovação de token');
            return await retryResponse.json();
          } else {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(`Erro após renovação: ${retryResponse.status} - ${errorData.error || 'Erro desconhecido'}`);
          }
        } else {
          // Se renovação falhou, silenciar erro
          console.log('❌ Falha ao renovar token - perfil não sincronizado');
          throw new Error('Token expirado e renovação falhou');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erro HTTP: ${response.status} - ${errorData.error || 'Erro desconhecido'}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      // Log do erro mas não quebrar o fluxo
      console.log('⚠️ Erro ao salvar perfil no servidor:', error.message);
      throw error;
    }
  };

  // Carregar perfil do servidor
  const loadProfileFromServer = async (userId) => {
    // Não tentar carregar se userId for null/undefined
    if (!userId || userId === 'null' || userId === 'undefined') {
      return null;
    }

    // Verificar se está autenticado antes de tentar carregar
    if (!isAuthenticated) {
      return null;
    }

    try {
      // Obter token de sessão para autenticação
      const loadToken = localStorage.getItem('ludomusic_session_token');

      if (!loadToken) {
        return null;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loadToken}`
      };

      // A API /api/profile obtém o userId automaticamente do token de autenticação
      const response = await fetch(`/api/profile`, {
        headers
      });

      if (response.status === 404) {
        return null; // Perfil não existe no servidor
      }

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return null; // Retornar null em vez de throw para não quebrar o fluxo
    }
  };

  // Verificar se está no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sincronização automática quando a aba ganha foco (usuário volta de outro dispositivo)
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const handleFocus = async () => {
      console.log('🔄 Aba ganhou foco - verificando sincronização');
      try {
        // Recarregar perfil para sincronizar com possíveis mudanças de outros dispositivos
        await loadProfileInternal(userId);
      } catch (error) {
        console.warn('Erro na sincronização automática:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, userId]);

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
        // Chamar loadProfile diretamente aqui para evitar dependências circulares
        loadProfileInternal(id);
      } else if (!id || id === 'null' || id === 'undefined') {
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

        // Salvamento automático no servidor removido para evitar erros 401
      }
    }
  }, [isAuthenticated, profile, userId]);

  const loadProfileInternal = async (targetUserId) => {
    // Usar o userId passado como parâmetro ou o do estado
    const userIdToUse = targetUserId || userId;

    // Não carregar se userId não estiver pronto
    if (!userIdToUse || userIdToUse === 'null' || userIdToUse === 'undefined') {

      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // 1. SEMPRE tentar carregar do localStorage primeiro (mais rápido e confiável)
      let localProfile = null;
      if (typeof window !== 'undefined' && userIdToUse) {
        const savedProfile = localStorage.getItem(`ludomusic_profile_${userIdToUse}`);
        if (savedProfile) {
          try {
            localProfile = JSON.parse(savedProfile);


            // Validar integridade do perfil
            if (!localProfile.stats || !localProfile.achievements || localProfile.achievements === undefined) {
              throw new Error('Perfil corrompido - dados críticos ausentes');
            }
          } catch (error) {

            // Tentar carregar do backup
            const backupProfile = localStorage.getItem(`ludomusic_profile_backup_${userIdToUse}`);
            if (backupProfile) {
              try {
                localProfile = JSON.parse(backupProfile);
                // Restaurar perfil principal
                localStorage.setItem(`ludomusic_profile_${userIdToUse}`, backupProfile);
              } catch (backupError) {
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
              // Restaurar perfil principal
              localStorage.setItem(`ludomusic_profile_${userIdToUse}`, backupProfile);
            } catch (error) {
              localStorage.removeItem(`ludomusic_profile_backup_${userIdToUse}`);
            }
          }
        }
      }

      // 2. Tentar carregar do servidor em paralelo (para sincronização)
      let serverProfile = null;
      try {
        serverProfile = await loadProfileFromServer(userIdToUse);
      } catch (error) {
        // Silenciar erro de carregamento do servidor
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

        setProfile(updatedProfile);

        // Sincronizar com servidor em background (sem bloquear)
        if (serverProfile) {
          // Se servidor tem dados mais recentes, mesclar
          const serverTime = new Date(serverProfile.lastUpdated || 0).getTime();
          const localTime = new Date(updatedProfile.lastUpdated || 0).getTime();

          if (serverTime > localTime) {
            // Merge inteligente: combinar o melhor dos dois mundos
            const mergedProfile = {
              ...updatedProfile, // Base local
              // Manter dados não críticos do servidor
              preferences: serverProfile.preferences || updatedProfile.preferences,
              // Para estatísticas: usar os valores MAIORES (progresso nunca regride)
              stats: {
                ...updatedProfile.stats,
                totalGames: Math.max(updatedProfile.stats.totalGames || 0, serverProfile.stats?.totalGames || 0),
                wins: Math.max(updatedProfile.stats.wins || 0, serverProfile.stats?.wins || 0),
                bestStreak: Math.max(updatedProfile.stats.bestStreak || 0, serverProfile.stats?.bestStreak || 0),
                xp: Math.max(updatedProfile.stats.xp || 0, serverProfile.stats?.xp || 0),
                level: Math.max(updatedProfile.stats.level || 1, serverProfile.stats?.level || 1)
              },
              // Para conquistas: unir ambas as listas (sem duplicatas)
              achievements: [...new Set([
                ...(updatedProfile.achievements || []),
                ...(serverProfile.achievements || [])
              ])],
              // Para XP e level: usar o maior valor
              xp: Math.max(updatedProfile.xp || 0, serverProfile.xp || 0),
              level: Math.max(updatedProfile.level || 1, serverProfile.level || 1),
              lastUpdated: new Date().toISOString()
            };

            setProfile(mergedProfile);
            localStorage.setItem(`ludomusic_profile_${userIdToUse}`, JSON.stringify(mergedProfile));

            // Sincronizar dados mesclados de volta para o servidor
            try {
              await saveProfileToServer(mergedProfile);
              console.log('🔄 Dados mesclados sincronizados com servidor');
            } catch (error) {
              console.warn('Erro ao sincronizar dados mesclados:', error);
            }
          }
        }

        // Sincronização com servidor removida para evitar erros 401
        // A sincronização será feita apenas quando necessário
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

        setProfile(updatedProfile);
        localStorage.setItem(`ludomusic_profile_${userIdToUse}`, JSON.stringify(updatedProfile));
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

        setProfile(newProfile);
        localStorage.setItem(`ludomusic_profile_${userIdToUse}`, JSON.stringify(newProfile));

        // Salvamento no servidor removido para evitar erros 401
        // O perfil será salvo quando o usuário fizer login
      }
    } catch (error) {
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

        setProfile(emergencyProfile);
        localStorage.setItem(`ludomusic_profile_${userIdToUse}`, JSON.stringify(emergencyProfile));
      } catch (emergencyError) {
        // Se nem o perfil de emergência funcionar, deixar profile como null
        // O componente UserProfile vai mostrar a mensagem de erro
      }
    } finally {
      setIsLoading(false);

    }
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
      return null;
    }

    if (!profile || !userId) {
      return null;
    }

    try {
      const updatedProfile = ensureProfileStructure({
        ...profile,
        ...updates,
        lastUpdated: new Date().toISOString()
      });

      setProfile(updatedProfile);

      // SEMPRE salvar no localStorage primeiro (mais confiável)
      localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

      // Criar backup adicional
      localStorage.setItem(`ludomusic_profile_backup_${userId}`, JSON.stringify(updatedProfile));

      // Salvar no servidor em background (não bloquear)
      try {
        await saveProfileToServer(updatedProfile);
      } catch (error) {
        // Silenciar erro de sincronização
      }

      return updatedProfile;
    } catch (error) {
      throw error; // Re-throw para que o erro seja tratado pelo chamador
    }
  };

  // Calcular nível baseado no XP - SISTEMA REBALANCEADO
  // Fórmula: Level = floor(sqrt(XP / 300)) + 1
  // XP necessário para level N = (N-1)² * 300
  const calculateLevel = (xp) => {
    if (xp < 0) return 1;
    return Math.floor(Math.sqrt(xp / 300)) + 1;
  };

  // Calcular XP necessário para um nível específico
  const getXPForLevel = (level) => {
    if (level <= 1) return 0;
    return Math.pow(level - 1, 2) * 300;
  };

  // Calcular XP necessário para o próximo nível
  const getXPForNextLevel = (currentLevel) => {
    return Math.pow(currentLevel, 2) * 300;
  };

  // Verificar e desbloquear conquistas
  const checkAchievements = (updatedProfile) => {

    const newAchievements = [];

    // Verificar se achievements está importado corretamente
    if (!achievements || Object.keys(achievements).length === 0) {
      return updatedProfile;
    }

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
      console.log(`🎉 ${newAchievements.length} nova(s) conquista(s) desbloqueada(s):`, newAchievements);
      updatedProfile.achievements = [...updatedProfile.achievements, ...newAchievements];

      // Mostrar notificação de conquista (se habilitado) com delay para evitar IDs duplicados
      // Verificar se as notificações estão habilitadas (padrão: true se não definido)
      const showPopups = updatedProfile.preferences?.showAchievementPopups !== false;

      if (showPopups) {
        console.log('📢 Mostrando notificações de conquistas...');
        newAchievements.forEach((achievementId, index) => {
          const achievement = achievements[achievementId];
          if (achievement) {
            // Adicionar delay progressivo para evitar IDs duplicados
            setTimeout(() => {
              console.log(`🏆 Exibindo notificação para: ${achievement.title}`);
              showAchievementNotification(achievement);
            }, index * 100); // 100ms de delay entre cada notificação
          }
        });
      } else {
        console.log('🔇 Notificações de conquistas desabilitadas nas preferências');
      }
    } else {
      console.log('📝 Nenhuma conquista nova desbloqueada');
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
    console.log('🔔 Tentando mostrar notificação para:', achievement.title);

    // Verificar se a função global existe
    if (typeof window !== 'undefined' && window.showAchievementToast) {
      try {
        console.log('✅ Função showAchievementToast encontrada, chamando...');
        window.showAchievementToast(achievement);
        console.log('✅ Notificação enviada com sucesso');
      } catch (error) {
        console.error('❌ Erro ao mostrar notificação:', error);
      }
    } else {
      console.error('❌ Função showAchievementToast não encontrada no window');
      console.log('🔍 Window object:', typeof window);
      console.log('🔍 showAchievementToast:', typeof window?.showAchievementToast);

      // Tentar novamente após um pequeno delay
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.showAchievementToast) {
          console.log('🔄 Tentativa de retry bem-sucedida');
          window.showAchievementToast(achievement);
        } else {
          console.error('❌ Retry falhou - função ainda não disponível');
        }
      }, 100);
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

    // 🔒 VALIDAÇÃO CRÍTICA: Para modo diário, verificar no servidor se já jogou hoje
    if (gameStats.mode === 'daily') {
      try {
        const dailyToken = localStorage.getItem('ludomusic_session_token');
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD



        const validationResponse = await fetch('/api/validate-daily-game', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dailyToken}`
          },
          body: JSON.stringify({
            date: today,
            gameStats: gameStats
          })
        });

        if (!validationResponse.ok) {
          const errorData = await validationResponse.json();
          console.log('❌ Erro na validação do jogo diário:', errorData);

          if (errorData.error === 'Jogo diário já completado hoje') {
            console.log('🚫 Jogo diário já foi completado hoje - bloqueando atualização');
            return null;
          }

          // Se houve outro erro, também bloquear para segurança
          console.log('🚫 Erro na validação - bloqueando por segurança');
          return null;
        } else {
          console.log('✅ Validação do jogo diário passou - permitindo atualização');
        }
      } catch (error) {
        console.error('❌ Erro de rede na validação do jogo diário:', error);
        // Em caso de erro de rede, bloquear por segurança
        console.log('🚫 Erro de rede - bloqueando por segurança');
        return null;
      }
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
        points = 0,
        // 🔧 NOVOS PARÂMETROS para conquistas especiais
        isComeback = false,
        consecutiveLosses = 0,
        dailyGameCompleted = false,
        gameDate = null,
        sessionDuration = null
      } = gameStats;

      let updatedProfile = { ...profile };

      // Atualizar último login
      updatedProfile.lastLogin = new Date().toISOString();

      // Atualizar estatísticas gerais
      updatedProfile.stats.totalGames += 1;
      updatedProfile.stats.totalPlayTime += playTime;

      // 🔧 ATUALIZAR DADOS DE SESSÃO LONGA para conquista "Maratonista"
      if (sessionDuration && sessionDuration > (updatedProfile.stats.longestSession || 0)) {
        updatedProfile.stats.longestSession = sessionDuration;
      }

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
        id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
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
        xpGained: won ? (50 + (attempts === 1 ? 50 : 0)) : 10,
        // 🔧 NOVOS CAMPOS para conquistas especiais
        isComeback: isComeback || false,
        consecutiveLosses: consecutiveLosses || 0,
        dailyGameCompleted: dailyGameCompleted || false,
        gameDate: gameDate || null,
        sessionDuration: sessionDuration || null
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

      // GARANTIR que XP e level estão sincronizados
      updatedProfile.stats.xp = updatedProfile.xp;
      updatedProfile.stats.level = updatedProfile.level;

      // SEMPRE salvar localmente primeiro (crítico para não perder dados)
      setProfile(updatedProfile);
      localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

      // Backup adicional para estatísticas críticas
      localStorage.setItem(`ludomusic_profile_backup_${userId}`, JSON.stringify(updatedProfile));



      // Salvar no servidor em background (não bloquear)
      try {
        await saveProfileToServer(updatedProfile);
      } catch (error) {
        // Silenciar erro de sincronização
      }

      return updatedProfile;
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  };

  // Função para resetar perfil (para testes ou reset completo)
  const resetProfile = async () => {
    if (!userId || !profile) return false;

    try {
      // Obter token de sessão para autenticação
      const resetToken = localStorage.getItem('ludomusic_session_token');

      console.log('🔄 [FRONTEND] Iniciando reset de perfil...');
      console.log('🔄 [FRONTEND] UserId:', userId);
      console.log('🔄 [FRONTEND] SessionToken:', resetToken ? 'Presente' : 'Ausente');

      if (!resetToken) {
        console.error('❌ [FRONTEND] Token de sessão não encontrado');
        return false;
      }

      // Resetar no servidor - A API obtém o userId automaticamente do token
      const response = await fetch('/api/profile/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resetToken}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro ao resetar perfil no servidor:', errorData);
        return false;
      }

      const data = await response.json();
      console.log('✅ Perfil resetado no servidor:', data);

      // Limpar TODOS os dados locais relacionados ao usuário
      console.log('🧹 Limpando dados locais COMPLETAMENTE...');

      // Dados do perfil
      localStorage.removeItem(`ludomusic_profile_${userId}`);
      localStorage.removeItem(`ludomusic_profile_backup_${userId}`);

      // Dados de jogo
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes(`ludomusic_game_state_day_`) ||
          key.includes(`ludomusic_infinite_stats`) ||
          key.includes(`ludomusic_notifications_${userId}`) ||
          key.includes(`ludomusic_invitations_${userId}`) ||
          key.includes(`ludomusic_friends_${userId}`) ||
          key.includes(`ludomusic_friend_requests_${userId}`)
        )) {
          keysToRemove.push(key);
        }
      }

      // Remover todas as chaves encontradas
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removido: ${key}`);
      });

      // Limpar dados de tutorial para que apareça novamente
      localStorage.removeItem('ludomusic_tutorial_seen');

      // Limpar cookies de amigos
      import('../utils/cookies').then(({ FriendsCookies }) => {
        FriendsCookies.clearFriendsData();
      });

      // Atualizar estado com o novo perfil
      setProfile(data.profile);

      // Salvar novo perfil no localStorage
      localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(data.profile));

      console.log('✅ Reset de perfil concluído com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao resetar perfil:', error);
      return false;
    }
  };

  // Função para deletar conta permanentemente
  const deleteAccount = async () => {
    if (!userId || !profile) return false;

    try {
      // Obter token de sessão para autenticação
      const deleteToken = localStorage.getItem('ludomusic_session_token');

      console.log('🗑️ [FRONTEND] Iniciando deleção de conta...');
      console.log('🗑️ [FRONTEND] UserId:', userId);
      console.log('🗑️ [FRONTEND] SessionToken:', deleteToken ? 'Presente' : 'Ausente');

      if (!deleteToken) {
        console.error('❌ [FRONTEND] Token de sessão não encontrado');
        return false;
      }

      // Deletar do servidor - A API obtém o userId automaticamente do token
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deleteToken}`
        }
      });

      console.log('🗑️ [FRONTEND] Response status:', response.status);
      console.log('🗑️ [FRONTEND] Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      // Limpar TODOS os dados locais relacionados ao usuário
      console.log('🧹 Limpando dados locais COMPLETAMENTE...');

      // Dados do perfil
      localStorage.removeItem(`ludomusic_profile_${userId}`);
      localStorage.removeItem(`ludomusic_profile_backup_${userId}`);

      // Dados de autenticação
      localStorage.removeItem('ludomusic_user_id');
      localStorage.removeItem('ludomusic_session_token');
      localStorage.removeItem('ludomusic_user_data');

      // Dados de amigos
      localStorage.removeItem(`ludomusic_friends_${userId}`);
      localStorage.removeItem(`ludomusic_friend_requests_${userId}`);
      localStorage.removeItem(`ludomusic_sent_requests_${userId}`);

      // Limpar TODOS os dados relacionados ao jogo
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ludomusic_')) {
          keysToRemove.push(key);
        }
      }

      // Remover todas as chaves do ludomusic
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removido: ${key}`);
      });

      // Limpar sessionStorage também
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('ludomusic_')) {
          sessionKeysToRemove.push(key);
        }
      }

      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`🗑️ SessionStorage removido: ${key}`);
      });

      // Limpar cookies de autenticação e amigos
      import('../utils/cookies').then(({ AuthCookies, FriendsCookies }) => {
        AuthCookies.clearAuth();
        FriendsCookies.clearFriendsData();
      });

      // Dados de jogo
      localStorage.removeItem(`ludomusic_daily_progress_${userId}`);
      localStorage.removeItem(`ludomusic_infinite_progress_${userId}`);
      localStorage.removeItem(`ludomusic_game_stats_${userId}`);

      // Limpar cookies de autenticação
      try {
        document.cookie = 'ludomusic_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'ludomusic_user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'ludomusic_remember_me=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'ludomusic_friends=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'ludomusic_friend_requests=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } catch (error) {
        console.warn('⚠️ Erro ao limpar cookies:', error);
      }

      console.log('✅ Dados locais limpos completamente');

      // Limpar estado
      setProfile(null);
      setUserId(null);


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

        // XP baseado no número de rodadas e resultado
        const totalRounds = data.totalRounds || 10;
        const baseXP = Math.floor(totalRounds * 2.5); // 2.5 XP por rodada base

        if (data.won) {
          updatedProfile.socialStats.multiplayerWins += 1;
          // Vencedor ganha XP base + bônus de 50%
          xpGained = Math.floor(baseXP * 1.5);
        } else {
          // Perdedor ganha XP base
          xpGained = baseXP;
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

    // Verificar conquistas sociais (podem dar XP adicional)
    updatedProfile = checkAchievements(updatedProfile);

    // Recalcular level após XP das conquistas sociais
    const finalSocialLevel = calculateLevel(updatedProfile.xp);
    if (finalSocialLevel > updatedProfile.level) {
      updatedProfile.level = finalSocialLevel;
      if (typeof window !== 'undefined' && window.showLevelUpToast) {
        window.showLevelUpToast(finalSocialLevel);
      }
    }

    updatedProfile = checkAndUpdateBadges(updatedProfile);

    // GARANTIR sincronização de XP e level em stats
    updatedProfile.stats.xp = updatedProfile.xp;
    updatedProfile.stats.level = updatedProfile.level;

    setProfile(updatedProfile);

    // Salvar localmente também
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
