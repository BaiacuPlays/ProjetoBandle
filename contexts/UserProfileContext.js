import { createContext, useContext, useState, useEffect } from 'react';
import { achievements, calculateAchievementProgress } from '../data/achievements';
import { getUnlockedBadges, getAvailableTitles } from '../data/badges';
import { useAuth } from './AuthContext';
import { saveProfileToLocalStorage, loadProfileFromLocalStorage, verifyProfileIntegrity, repairProfile } from '../utils/profilePersistence';
import { initProfileSync } from '../utils/profileSync';

const UserProfileContext = createContext();

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    console.log('❌ [HOOK] Contexto não encontrado! Retornando objeto vazio');
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

  // SISTEMA ULTRA-ROBUSTO: GARANTIR que usuários logados SEMPRE tenham dados
  const getUserId = () => {
    if (typeof window === 'undefined') return null;

    // PRIORIDADE 1: Usuário autenticado
    if (isAuthenticated) {
      const authId = getAuthenticatedUserId();
      if (authId) {
        console.log('✅ [USER-ID] ID obtido via autenticação:', authId);
        return authId;
      }
    }

    // PRIORIDADE 2: Fallback para dados salvos (caso autenticação falhe temporariamente)
    try {
      const savedUserId = localStorage.getItem('ludomusic_user_id');
      const sessionToken = localStorage.getItem('ludomusic_session_token');

      if (savedUserId && sessionToken) {
        console.log('🔄 [USER-ID] ID obtido via fallback localStorage:', savedUserId);
        return savedUserId;
      }
    } catch (error) {
      console.warn('⚠️ [USER-ID] Erro ao acessar localStorage:', error);
    }

    // PRIORIDADE 3: Tentar obter dos cookies
    try {
      const userData = document.cookie
        .split('; ')
        .find(row => row.startsWith('ludomusic_user_data='));

      if (userData) {
        const userDataValue = decodeURIComponent(userData.split('=')[1]);
        const parsedData = JSON.parse(userDataValue);
        if (parsedData.username) {
          const cookieUserId = `auth_${parsedData.username}`;
          console.log('🍪 [USER-ID] ID obtido via cookies:', cookieUserId);
          return cookieUserId;
        }
      }
    } catch (error) {
      console.warn('⚠️ [USER-ID] Erro ao acessar cookies:', error);
    }

    console.log('❌ [USER-ID] Nenhum ID encontrado');
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

      // Salvar localmente também para garantir persistência
      if (userId) {
        localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(cleanProfileData));
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
      console.log('🔍 [API] Resposta da API /profile:', result);
      return result;
    } catch (error) {
      console.error('❌ [API] Erro ao carregar perfil da API:', error);
      return null; // Retornar null em vez de throw para não quebrar o fluxo
    }
  };

  // Função para verificação periódica de integridade (SILENCIOSA)
  const performPeriodicIntegrityCheck = async () => {
    if (!profile || !userId) return;

    try {
      // Verificar integridade do perfil SILENCIOSAMENTE
      if (!verifyProfileIntegrity(profile)) {
        const repairedProfile = repairProfile(profile, userId);
        if (repairedProfile) {
          setProfile(repairedProfile);
          saveProfileToLocalStorage(userId, repairedProfile);

          // Tentar sincronizar com o servidor SILENCIOSAMENTE
          try {
            await saveProfileToServerWithRetry(repairedProfile, userId);
          } catch (error) {
            // Erro silencioso
          }
        }
      }

      // Verificar integridade das estatísticas SILENCIOSAMENTE
      const statsCheck = verifyStatsIntegrity(profile.stats);
      if (!statsCheck.isValid) {
        const repairedStats = repairStats(profile.stats, statsCheck.issues);
        const updatedProfile = { ...profile, stats: repairedStats };

        setProfile(updatedProfile);
        saveProfileToLocalStorage(userId, updatedProfile);

        try {
          await saveProfileToServerWithRetry(updatedProfile, userId);
        } catch (error) {
          // Erro silencioso
        }
      }

      // Limpar backups antigos SILENCIOSAMENTE
      cleanupOldBackups(userId);

    } catch (error) {
      // Erro silencioso - não travar o site
    }
  };

  // SISTEMA DE GARANTIA ABSOLUTA: Usuários logados SEMPRE têm dados - VERSÃO INFALÍVEL
  const ensureUserDataExists = async (userIdToEnsure) => {
    if (!userIdToEnsure) return null;

    // GARANTINDO DADOS SILENCIOSAMENTE para usuário logado
    const authenticatedUser = getAuthenticatedUser();
    let profile = null;

    // ETAPA 1: Verificar localStorage COM REPARO AUTOMÁTICO (SILENCIOSO)
    try {
      profile = loadProfileFromLocalStorage(userIdToEnsure);
      if (profile) {
        // SEMPRE atualizar dados de autenticação para usuários logados
        if (authenticatedUser && isAuthenticated) {
          profile.username = authenticatedUser.username;
          profile.displayName = authenticatedUser.displayName || profile.displayName;
          profile.lastLogin = new Date().toISOString();
          profile.lastUpdated = new Date().toISOString();

          // Verificar e reparar integridade SILENCIOSAMENTE
          if (!verifyProfileIntegrity(profile)) {
            profile = repairProfile(profile, userIdToEnsure);
          }

          // Salvar dados atualizados SILENCIOSAMENTE
          saveProfileToLocalStorage(userIdToEnsure, profile);
        }

        return profile;
      }
    } catch (error) {
      // Erro silencioso
    }

    // ETAPA 2: Verificar TODOS os backups disponíveis (SILENCIOSO)
    try {
      const backupKeys = [];

      // Procurar backups normais SILENCIOSAMENTE
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith(`ludomusic_profile_backup_${userIdToEnsure}_`) ||
          key.startsWith(`ludomusic_profile_snapshot_${userIdToEnsure}`) ||
          key.startsWith(`ludomusic_emergency_profile_${userIdToEnsure}`)
        )) {
          backupKeys.push(key);
        }
      }

      if (backupKeys.length > 0) {
        // Tentar cada backup até encontrar um válido SILENCIOSAMENTE
        for (const backupKey of backupKeys) {
          try {
            const backupData = localStorage.getItem(backupKey);
            if (backupData) {
              profile = JSON.parse(backupData);

              // Verificar se o backup é válido
              if (profile && profile.id === userIdToEnsure) {
                // Atualizar dados de autenticação
                if (authenticatedUser && isAuthenticated) {
                  profile.username = authenticatedUser.username;
                  profile.displayName = authenticatedUser.displayName || profile.displayName;
                  profile.lastLogin = new Date().toISOString();
                  profile.lastUpdated = new Date().toISOString();
                }

                // Reparar se necessário
                if (!verifyProfileIntegrity(profile)) {
                  profile = repairProfile(profile, userIdToEnsure);
                }

                // Salvar como perfil principal
                saveProfileToLocalStorage(userIdToEnsure, profile);
                return profile;
              }
            }
          } catch (error) {
            // Erro silencioso
          }
        }
      }
    } catch (error) {
      // Erro silencioso
    }

    // ETAPA 3: Tentar carregar do servidor COM MÚLTIPLAS TENTATIVAS (SILENCIOSO)
    for (let attempt = 1; attempt <= 2; attempt++) { // Reduzido para 2 tentativas
      try {
        profile = await loadProfileFromServer(userIdToEnsure);
        if (profile) {
          // Atualizar dados de autenticação
          if (authenticatedUser && isAuthenticated) {
            profile.username = authenticatedUser.username;
            profile.displayName = authenticatedUser.displayName || profile.displayName;
            profile.lastLogin = new Date().toISOString();
            profile.lastUpdated = new Date().toISOString();
          }

          // Salvar localmente
          saveProfileToLocalStorage(userIdToEnsure, profile);
          return profile;
        }
      } catch (error) {
        if (attempt < 2) {
          // Aguardar antes da próxima tentativa (reduzido)
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
    }

    // ETAPA 3.5: USAR API DE EMERGÊNCIA COMO ÚLTIMO RECURSO DO SERVIDOR (SILENCIOSO)
    try {
      const emergencyResponse = await fetch('/api/emergency-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ludomusic_session_token')}`
        }
      });

      if (emergencyResponse.ok) {
        const emergencyData = await emergencyResponse.json();
        if (emergencyData.success && emergencyData.profile) {
          profile = emergencyData.profile;

          // Atualizar dados de autenticação
          if (authenticatedUser && isAuthenticated) {
            profile.username = authenticatedUser.username;
            profile.displayName = authenticatedUser.displayName || profile.displayName;
            profile.lastLogin = new Date().toISOString();
            profile.lastUpdated = new Date().toISOString();
          }

          // Salvar localmente
          saveProfileToLocalStorage(userIdToEnsure, profile);
          return profile;
        }
      }
    } catch (error) {
      // Erro silencioso
    }

    // ETAPA 4: CRIAR PERFIL DE EMERGÊNCIA - NUNCA PODE FALHAR! (SILENCIOSO)
    // Criar perfil de emergência com dados mínimos mas funcionais
    const emergencyProfile = {
      id: userIdToEnsure,
      username: authenticatedUser?.username || `Jogador_${userIdToEnsure.slice(-6)}`,
      displayName: authenticatedUser?.displayName || '',
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
      },
      // Marcar como perfil de emergência para debugging
      _isEmergencyProfile: true,
      _emergencyCreatedAt: new Date().toISOString(),
      _emergencyReason: 'Usuário logado sem dados - perfil criado automaticamente'
    };

    // SALVAR EM MÚLTIPLOS LOCAIS SILENCIOSAMENTE
    try {
      saveProfileToLocalStorage(userIdToEnsure, emergencyProfile);
      localStorage.setItem(`ludomusic_emergency_profile_${userIdToEnsure}`, JSON.stringify(emergencyProfile));
      sessionStorage.setItem(`ludomusic_session_profile_${userIdToEnsure}`, JSON.stringify(emergencyProfile));

      // Tentar salvar no servidor SILENCIOSAMENTE
      saveProfileToServer(emergencyProfile).catch(() => {
        // Erro silencioso
      });

    } catch (error) {
      // Erro silencioso
    }

    // SEMPRE retornar o perfil
    return emergencyProfile;
  };

  // Função auxiliar para criar perfil de emergência
  const createEmergencyProfile = (userId, authenticatedUser) => {
    return {
      id: userId,
      username: authenticatedUser?.username || `Jogador_${userId.slice(-6)}`,
      displayName: authenticatedUser?.displayName || '',
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
      },
      _isEmergencyProfile: true,
      _emergencyCreatedAt: new Date().toISOString()
    };
  };

  // SISTEMA DE MONITORAMENTO CRÍTICO: Usuários logados SEMPRE devem ter dados
  useEffect(() => {
    setIsClient(true);

    // VERIFICAÇÃO CRÍTICA: Se usuário está autenticado, DEVE ter dados (SILENCIOSO)
    if (isAuthenticated) {
      const userIdToLoad = getUserId();
      if (userIdToLoad) {
        // Usar sistema de garantia SILENCIOSAMENTE
        ensureUserDataExists(userIdToLoad).then(guaranteedProfile => {
          if (guaranteedProfile) {
            setProfile(guaranteedProfile);
            setUserId(userIdToLoad);
            setIsLoading(false);
          } else {
            // Sistema de emergência SILENCIOSO
            const emergencyProfile = createEmergencyProfile(userIdToLoad, getAuthenticatedUser());
            setProfile(emergencyProfile);
            setUserId(userIdToLoad);
            setIsLoading(false);
          }
        }).catch(error => {
          // PROTOCOLO DE EMERGÊNCIA FINAL SILENCIOSO
          try {
            const emergencyProfile = createEmergencyProfile(userIdToLoad, getAuthenticatedUser());
            setProfile(emergencyProfile);
            setUserId(userIdToLoad);
            setIsLoading(false);

            // Salvar em todos os locais possíveis SILENCIOSAMENTE
            localStorage.setItem(`ludomusic_profile_${userIdToLoad}`, JSON.stringify(emergencyProfile));
            localStorage.setItem(`ludomusic_emergency_profile_${userIdToLoad}`, JSON.stringify(emergencyProfile));
            sessionStorage.setItem(`ludomusic_session_profile_${userIdToLoad}`, JSON.stringify(emergencyProfile));
          } catch (finalError) {
            // PERFIL MÍNIMO ABSOLUTO SILENCIOSO
            const minimalProfile = {
              id: userIdToLoad,
              username: getAuthenticatedUser()?.username || 'Usuário',
              displayName: getAuthenticatedUser()?.displayName || '',
              level: 1,
              xp: 0,
              stats: {
                totalGames: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                currentStreak: 0,
                bestStreak: 0,
                modeStats: {}
              },
              achievements: [],
              gameHistory: [],
              _isMinimalProfile: true,
              _createdAt: new Date().toISOString()
            };

            setProfile(minimalProfile);
            setUserId(userIdToLoad);
            setIsLoading(false);
          }
        });
      }
    }

    // Verificar se já temos um userId no localStorage (fallback)
    const storedUserId = localStorage.getItem('ludomusic_user_id');
    if (storedUserId && isAuthenticated && !userId) {
      // Carregar perfil do localStorage usando o sistema de persistência
      const localProfile = loadProfileFromLocalStorage(storedUserId);

      if (localProfile) {
        // Verificar integridade do perfil SILENCIOSAMENTE
        if (!verifyProfileIntegrity(localProfile)) {
          const repairedProfile = repairProfile(localProfile, storedUserId);
          if (repairedProfile) {
            setProfile(repairedProfile);
            setUserId(storedUserId);
            saveProfileToLocalStorage(storedUserId, repairedProfile);
          }
        } else {
          setProfile(localProfile);
          setUserId(storedUserId);
        }
      }
    }

    // Configurar verificação periódica de integridade SILENCIOSA
    const intervalId = setInterval(() => {
      if (profile && userId) {
        // Verificar e sincronizar perfil a cada 60 segundos (reduzido frequência)
        if (!verifyProfileIntegrity(profile)) {
          const repairedProfile = repairProfile(profile, userId);
          if (repairedProfile) {
            setProfile(repairedProfile);
            saveProfileToLocalStorage(userId, repairedProfile);
          }
        }
      }
    }, 60000); // 60 segundos (reduzido de 30s)

    return () => clearInterval(intervalId);
  }, [isAuthenticated, profile, userId]);

  // Sincronização automática quando a aba ganha foco (usuário volta de outro dispositivo)
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const handleFocus = async () => {
      try {
        // Recarregar perfil SILENCIOSAMENTE
        await loadProfileInternal(userId);
      } catch (error) {
        // Erro silencioso
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, userId]);

  // Configurar sincronização automática entre localStorage e sessionStorage
  useEffect(() => {
    if (!userId) return;

    // Iniciar sincronização automática
    const cleanup = initProfileSync(userId);

    // Limpar ao desmontar
    return cleanup;
  }, [userId]);

  // Aguardar autenticação e então carregar perfil
  useEffect(() => {
    if (!authLoading && isClient) {
      const id = getUserId();

      // Só carregar se o userId mudou ou se não temos perfil ainda
      if (id && id !== 'null' && id !== 'undefined' && id !== userId) {
        console.log('🔄 [PROFILE] UserID mudou de', userId, 'para', id);
        setUserId(id);

        // Primeiro tentar carregar do localStorage para exibição imediata
        const localProfileKey = `ludomusic_profile_${id}`;
        const localProfileStr = localStorage.getItem(localProfileKey);

        if (localProfileStr) {
          try {
            const localProfile = JSON.parse(localProfileStr);
            console.log('📋 [PROFILE] Carregando perfil do localStorage primeiro:', localProfile.username);
            setProfile(localProfile);
          } catch (error) {
            console.error('❌ [PROFILE] Erro ao carregar perfil do localStorage:', error);
          }
        }

        // Chamar loadProfile para sincronizar com o servidor
        loadProfileInternal(id);
      } else if (!id || id === 'null' || id === 'undefined') {
        setIsLoading(false);
      }
    }
  }, [authLoading, isAuthenticated, isClient]); // REMOVIDO userId da dependência para evitar loop

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
          displayName: authenticatedUser.displayName,
          lastUpdated: new Date().toISOString()
        };

        setProfile(updatedProfile);

        // Salvar na Vercel KV
        saveProfileToServer(updatedProfile).catch(error => {
          console.warn('Erro ao sincronizar dados de login:', error);
        });
      }
    }
  }, [isAuthenticated, profile, userId]);

  // Sincronização automática quando a página é carregada ou atualizada
  useEffect(() => {
    if (isAuthenticated && userId) {
      console.log('🔄 Página carregada/atualizada - sincronizando perfil');

      // Primeiro tentar carregar do localStorage usando o sistema de persistência
      const localProfile = loadProfileFromLocalStorage(userId);

      if (localProfile) {
        // Verificar integridade do perfil
        if (!verifyProfileIntegrity(localProfile)) {
          console.log('🔧 Perfil corrompido, tentando reparar...');
          const repairedProfile = repairProfile(localProfile, userId);
          if (repairedProfile) {
            console.log('📋 Perfil reparado aplicado ao estado');
            setProfile(repairedProfile);
            setIsLoading(false);
            // Salvar o perfil reparado
            saveProfileToLocalStorage(userId, repairedProfile);
          }
        } else {
          console.log('📋 Perfil íntegro encontrado no localStorage, aplicando ao estado');
          setProfile(localProfile);
          setIsLoading(false);
        }
      }

      // Depois sincronizar com o servidor
      loadProfileInternal(userId);
    }
  }, [isAuthenticated, userId]);

  const loadProfileInternal = async (targetUserId) => {
    // Usar o userId passado como parâmetro ou o do estado
    const userIdToUse = targetUserId || userId;

    // Não carregar se userId não estiver pronto
    if (!userIdToUse || userIdToUse === 'null' || userIdToUse === 'undefined') {
      console.log('❌ [PROFILE] UserID inválido:', userIdToUse);
      setIsLoading(false);
      return;
    }

    console.log('🔄 [PROFILE] Carregando perfil para userId:', userIdToUse);

    try {
      setIsLoading(true);

      // Carregar perfil do localStorage usando o sistema de persistência com recuperação de backup
      let localProfile = loadProfileFromLocalStorage(userIdToUse);

      if (localProfile) {
        console.log('📋 [PROFILE] Perfil encontrado no localStorage:', localProfile.username);

        // Verificar integridade do perfil
        if (!verifyProfileIntegrity(localProfile)) {
          console.log('🔧 [PROFILE] Perfil corrompido, tentando reparar...');
          localProfile = repairProfile(localProfile, userIdToUse);
        }

        // Aplicar perfil local imediatamente para garantir que temos dados na UI
        if (!profile) {
          setProfile(localProfile);
        }
      }

      // SISTEMA SIMPLIFICADO: SEMPRE carregar da Vercel KV
      let serverProfile = null;
      try {
        serverProfile = await loadProfileFromServer(userIdToUse);
        console.log('🔍 [DEBUG] Perfil carregado da Vercel KV:', !!serverProfile, serverProfile?.username);
      } catch (error) {
        console.log('❌ [DEBUG] Erro ao carregar da Vercel KV:', error);
      }

      // Decidir qual perfil usar (servidor ou local)
      let finalProfile = null;

      if (serverProfile) {
        // USAR PERFIL DA VERCEL KV
        console.log('✅ [PROFILE] Usando perfil da Vercel KV:', serverProfile.username);
        const authenticatedUser = getAuthenticatedUser();
        finalProfile = serverProfile;

        // Atualizar dados de autenticação se necessário
        if (authenticatedUser && (
          serverProfile.username !== authenticatedUser.username ||
          serverProfile.displayName !== authenticatedUser.displayName
        )) {
          finalProfile = {
            ...serverProfile,
            username: authenticatedUser.username,
            displayName: authenticatedUser.displayName,
            lastUpdated: new Date().toISOString()
          };

          // Salvar de volta na Vercel KV
          try {
            await saveProfileToServer(finalProfile);
            console.log('🔄 Dados de autenticação atualizados na Vercel KV');
          } catch (error) {
            console.warn('Erro ao atualizar dados de autenticação:', error);
          }
        }

        // Salvar no localStorage usando o sistema de persistência com múltiplos backups
        saveProfileToLocalStorage(userIdToUse, finalProfile);
      } else if (localProfile) {
        // Se não conseguiu carregar do servidor mas tem perfil local, usar o local
        console.log('📋 [PROFILE] Usando perfil do localStorage:', localProfile.username);
        finalProfile = localProfile;

        // Tentar salvar no servidor para sincronizar
        try {
          await saveProfileToServer(localProfile);
          console.log('🔄 Perfil local sincronizado com o servidor');
        } catch (error) {
          console.warn('⚠️ Não foi possível sincronizar perfil local com o servidor:', error);
        }
      } else {
        // CRIAR NOVO PERFIL E SALVAR NA VERCEL KV
        console.log('🆕 [PROFILE] Criando novo perfil para:', userIdToUse);
        const authenticatedUser = getAuthenticatedUser();

        finalProfile = {
          id: userIdToUse,
          username: authenticatedUser?.username || `Jogador_${userIdToUse?.slice(-6) || '000000'}`,
          displayName: authenticatedUser?.displayName || '',
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

        // SALVAR NOVO PERFIL NA VERCEL KV E NO LOCALSTORAGE
        try {
          await saveProfileToServer(finalProfile);
          localStorage.setItem(localProfileKey, JSON.stringify(finalProfile));
          console.log('✅ [PROFILE] Novo perfil salvo na Vercel KV e localStorage:', finalProfile.username);
        } catch (error) {
          console.warn('❌ Erro ao salvar novo perfil na Vercel KV:', error);
          // Mesmo com erro, salvar no localStorage usando o sistema de persistência
          saveProfileToLocalStorage(userIdToUse, finalProfile);
        }
      }

      // Atualizar o estado com o perfil final
      setProfile(finalProfile);
      console.log('✅ [PROFILE] Perfil final definido no estado:', finalProfile.username);

    } catch (error) {
      console.error('❌ [PROFILE] Erro crítico ao carregar perfil:', error);
      // Em caso de erro, tentar usar o perfil do localStorage como fallback usando o sistema de persistência
      try {
        const localProfile = loadProfileFromLocalStorage(userIdToUse);
        if (localProfile) {
          // Verificar integridade do perfil
          if (!verifyProfileIntegrity(localProfile)) {
            console.log('🔧 [PROFILE] Perfil de fallback corrompido, tentando reparar...');
            const repairedProfile = repairProfile(localProfile, userIdToUse);
            if (repairedProfile) {
              setProfile(repairedProfile);
              console.log('🔄 [PROFILE] Usando perfil reparado como fallback após erro');
              // Salvar o perfil reparado
              saveProfileToLocalStorage(userIdToUse, repairedProfile);
            }
          } else {
            setProfile(localProfile);
            console.log('🔄 [PROFILE] Usando perfil do localStorage como fallback após erro');
          }
        }
      } catch (fallbackError) {
        console.error('❌ [PROFILE] Erro ao usar fallback do localStorage:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // MONITORAMENTO CRÍTICO: Verificar se usuário logado tem dados
  useEffect(() => {
    if (!isAuthenticated) return;

    const criticalMonitoring = setInterval(() => {
      const currentUserId = getUserId();

      // VERIFICAÇÃO CRÍTICA: Usuário logado DEVE ter dados
      if (currentUserId && !profile) {
        console.log('🚨 [CRITICAL] Usuário logado sem dados detectado! Corrigindo...');

        // Forçar carregamento de dados
        ensureUserDataExists(currentUserId).then(guaranteedProfile => {
          if (guaranteedProfile) {
            setProfile(guaranteedProfile);
            setUserId(currentUserId);
            console.log('✅ [CRITICAL] Dados restaurados para usuário logado');
          }
        }).catch(error => {
          console.error('❌ [CRITICAL] Falha crítica ao restaurar dados:', error);
        });
      }

      // Verificar se userId mudou (troca de usuário)
      if (currentUserId && currentUserId !== userId) {
        console.log('🔄 [CRITICAL] Mudança de usuário detectada:', userId, '->', currentUserId);
        setUserId(currentUserId);

        // Carregar dados do novo usuário
        ensureUserDataExists(currentUserId).then(guaranteedProfile => {
          if (guaranteedProfile) {
            setProfile(guaranteedProfile);
            console.log('✅ [CRITICAL] Dados carregados para novo usuário');
          }
        });
      }
    }, 10000); // Verificar a cada 10 segundos

    return () => clearInterval(criticalMonitoring);
  }, [isAuthenticated, profile, userId]);

  // SISTEMA DE MONITORAMENTO CRÍTICO: Verificar se usuário logado tem dados (SILENCIOSO)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Verificação crítica a cada 30 segundos (reduzido de 10s)
    const criticalMonitoring = setInterval(() => {
      const currentUserId = getUserId();

      if (currentUserId && isAuthenticated) {
        // VERIFICAÇÃO CRÍTICA: Usuário logado SEM dados (SEM LOGS)
        if (!profile || !userId || userId !== currentUserId) {
          // Forçar carregamento de dados SILENCIOSAMENTE
          ensureUserDataExists(currentUserId).then(guaranteedProfile => {
            if (guaranteedProfile) {
              setProfile(guaranteedProfile);
              setUserId(currentUserId);
            }
          }).catch(() => {
            // Erro silencioso - não travar o site
          });
        }
      }
    }, 30000); // 30 segundos (reduzido de 10s)

    // Verificação de integridade a cada 10 minutos (reduzido de 5min)
    const integrityInterval = setInterval(() => {
      if (profile && userId) {
        performPeriodicIntegrityCheck();
      }
    }, 10 * 60 * 1000); // 10 minutos

    return () => {
      clearInterval(criticalMonitoring);
      clearInterval(integrityInterval);
    };
  }, [isAuthenticated, profile, userId]);

  // Função para garantir estrutura válida do perfil
  const ensureProfileStructure = (profileData) => {
    const baseProfile = {
      id: profileData.id || userId,
      username: profileData.username || `Jogador_${(profileData.id || userId)?.slice(-6) || '000000'}`,
      displayName: profileData.displayName || '',
      bio: profileData.bio || '',
      avatar: profileData.avatar || null,
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
      console.warn('⚠️ Tentativa de atualizar perfil sem autenticação');
      return null;
    }

    if (!profile || !userId) {
      console.warn('⚠️ Perfil ou userId não disponível para atualização');
      return null;
    }

    try {
      const updatedProfile = ensureProfileStructure({
        ...profile,
        ...updates,
        lastUpdated: new Date().toISOString()
      });

      // Atualizar estado local
      setProfile(updatedProfile);

      // SALVAR DIRETAMENTE NA VERCEL KV
      try {
        await saveProfileToServer(updatedProfile);
        console.log('✅ [PROFILE] Perfil atualizado na Vercel KV');
      } catch (error) {
        console.error('❌ Erro ao salvar perfil na Vercel KV:', error);
        throw error; // Re-throw para que o erro seja tratado pelo chamador
      }

      return updatedProfile;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      throw error;
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
    // VERIFICAÇÃO DE SEGURANÇA SILENCIOSA
    if (!isAuthenticated || !userId) {
      return null;
    }

    // Se não temos perfil, tentar carregar do localStorage usando o sistema de persistência
    if (!profile) {
      const localProfile = loadProfileFromLocalStorage(userId);

      if (localProfile) {
        // Verificar integridade do perfil SILENCIOSAMENTE
        if (!verifyProfileIntegrity(localProfile)) {
          const repairedProfile = repairProfile(localProfile, userId);
          if (repairedProfile) {
            setProfile(repairedProfile);
            saveProfileToLocalStorage(userId, repairedProfile);
          } else {
            return null;
          }
        } else {
          setProfile(localProfile);
        }
      } else {
        return null;
      }
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
          if (errorData.error === 'Jogo diário já completado hoje') {
            return null;
          }
          return null;
        }
      } catch (error) {
        // Erro silencioso
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

      // CRIAR BACKUP SILENCIOSAMENTE
      const backupProfile = JSON.parse(JSON.stringify(profile));
      const backupKey = `ludomusic_profile_backup_${userId}_${Date.now()}`;
      try {
        localStorage.setItem(backupKey, JSON.stringify(backupProfile));
      } catch (error) {
        // Erro silencioso
      }

      // Validar perfil SILENCIOSAMENTE
      if (!updatedProfile.stats || !updatedProfile.achievements) {
        throw new Error('Perfil corrompido - dados críticos ausentes');
      }

      // VERIFICAR INTEGRIDADE DAS ESTATÍSTICAS SILENCIOSAMENTE
      const statsIntegrityCheck = verifyStatsIntegrity(updatedProfile.stats);
      if (!statsIntegrityCheck.isValid) {
        updatedProfile.stats = repairStats(updatedProfile.stats, statsIntegrityCheck.issues);
      }

      // GARANTIR que XP e level estão sincronizados
      updatedProfile.stats.xp = updatedProfile.xp;
      updatedProfile.stats.level = updatedProfile.level;

      // SEMPRE salvar localmente primeiro (crítico para não perder dados)
      setProfile(updatedProfile);

      // Usar o sistema de persistência com múltiplos backups
      saveProfileToLocalStorage(userId, updatedProfile);

      // Salvar no servidor SILENCIOSAMENTE
      try {
        await saveProfileToServerWithRetry(updatedProfile, userId);
      } catch (error) {
        // Tentar novamente em 5 segundos SILENCIOSAMENTE
        setTimeout(async () => {
          try {
            await saveProfileToServerWithRetry(updatedProfile, userId);
          } catch (retryError) {
            // Erro silencioso
          }
        }, 5000);
      }

      return updatedProfile;
    } catch (error) {
      // Em caso de erro crítico, tentar restaurar do backup SILENCIOSAMENTE
      try {
        const backupProfile = await restoreFromBackup(userId);
        if (backupProfile) {
          setProfile(backupProfile);
          return backupProfile;
        }
      } catch (backupError) {
        // Erro silencioso
      }

      // Se tudo falhar, retornar o perfil original
      return profile;
    }
  };

  // Função para verificar integridade das estatísticas
  const verifyStatsIntegrity = (stats) => {
    const issues = [];

    // Verificar se campos obrigatórios existem
    const requiredFields = ['totalGames', 'wins', 'losses', 'winRate', 'currentStreak', 'bestStreak'];
    requiredFields.forEach(field => {
      if (typeof stats[field] !== 'number') {
        issues.push(`Campo ${field} ausente ou inválido`);
      }
    });

    // Verificar consistência matemática
    if (stats.totalGames !== (stats.wins + stats.losses)) {
      issues.push('Total de jogos não confere com wins + losses');
    }

    if (stats.totalGames > 0) {
      const calculatedWinRate = (stats.wins / stats.totalGames) * 100;
      if (Math.abs(stats.winRate - calculatedWinRate) > 0.1) {
        issues.push('Taxa de vitória inconsistente');
      }
    }

    if (stats.currentStreak > stats.bestStreak) {
      issues.push('Sequência atual maior que a melhor sequência');
    }

    // Verificar valores negativos
    requiredFields.forEach(field => {
      if (stats[field] < 0) {
        issues.push(`Campo ${field} com valor negativo`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  };

  // Função para reparar estatísticas corrompidas
  const repairStats = (stats, issues) => {
    const repairedStats = { ...stats };

    // Garantir que todos os campos obrigatórios existem
    const defaults = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      currentStreak: 0,
      bestStreak: 0,
      perfectGames: 0,
      averageAttempts: 0,
      totalPlayTime: 0,
      fastestWin: null,
      longestSession: 0,
      modeStats: {},
      xp: 0,
      level: 1
    };

    Object.keys(defaults).forEach(key => {
      if (typeof repairedStats[key] !== 'number' && key !== 'fastestWin' && key !== 'modeStats') {
        repairedStats[key] = defaults[key];
      }
    });

    // Corrigir inconsistências matemáticas
    if (repairedStats.totalGames !== (repairedStats.wins + repairedStats.losses)) {
      repairedStats.totalGames = repairedStats.wins + repairedStats.losses;
    }

    // Recalcular taxa de vitória
    if (repairedStats.totalGames > 0) {
      repairedStats.winRate = (repairedStats.wins / repairedStats.totalGames) * 100;
    } else {
      repairedStats.winRate = 0;
    }

    // Corrigir sequências
    if (repairedStats.currentStreak > repairedStats.bestStreak) {
      repairedStats.bestStreak = repairedStats.currentStreak;
    }

    // Garantir valores não negativos
    Object.keys(repairedStats).forEach(key => {
      if (typeof repairedStats[key] === 'number' && repairedStats[key] < 0) {
        repairedStats[key] = 0;
      }
    });

    // Garantir que modeStats existe
    if (!repairedStats.modeStats || typeof repairedStats.modeStats !== 'object') {
      repairedStats.modeStats = {};
    }

    return repairedStats;
  };

  // Função para restaurar perfil do backup mais recente
  const restoreFromBackup = async (userIdToRestore) => {
    try {
      // Procurar por backups no localStorage
      const backupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`ludomusic_profile_backup_${userIdToRestore}_`)) {
          backupKeys.push(key);
        }
      }

      if (backupKeys.length === 0) {
        console.log('📋 [RECOVERY] Nenhum backup encontrado');
        return null;
      }

      // Ordenar por timestamp (mais recente primeiro)
      backupKeys.sort((a, b) => {
        const timestampA = parseInt(a.split('_').pop());
        const timestampB = parseInt(b.split('_').pop());
        return timestampB - timestampA;
      });

      // Tentar restaurar do backup mais recente
      for (const backupKey of backupKeys) {
        try {
          const backupData = localStorage.getItem(backupKey);
          if (backupData) {
            const backupProfile = JSON.parse(backupData);

            // Verificar integridade do backup
            if (verifyProfileIntegrity(backupProfile)) {
              console.log('✅ [RECOVERY] Backup válido encontrado:', backupKey);
              return backupProfile;
            } else {
              console.warn('⚠️ [RECOVERY] Backup corrompido:', backupKey);
            }
          }
        } catch (error) {
          console.warn('⚠️ [RECOVERY] Erro ao processar backup:', backupKey, error);
        }
      }

      console.log('❌ [RECOVERY] Nenhum backup válido encontrado');
      return null;
    } catch (error) {
      console.error('❌ [RECOVERY] Erro ao restaurar do backup:', error);
      return null;
    }
  };

  // Função para limpar backups antigos (manter apenas os 5 mais recentes)
  const cleanupOldBackups = (userIdToClean) => {
    try {
      const backupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`ludomusic_profile_backup_${userIdToClean}_`)) {
          backupKeys.push(key);
        }
      }

      if (backupKeys.length > 5) {
        // Ordenar por timestamp (mais antigo primeiro)
        backupKeys.sort((a, b) => {
          const timestampA = parseInt(a.split('_').pop());
          const timestampB = parseInt(b.split('_').pop());
          return timestampA - timestampB;
        });

        // Remover os backups mais antigos
        const toRemove = backupKeys.slice(0, backupKeys.length - 5);
        toRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log('🗑️ [CLEANUP] Backup antigo removido:', key);
        });
      }
    } catch (error) {
      console.warn('⚠️ [CLEANUP] Erro ao limpar backups antigos:', error);
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
    try {
      // Validar avatar antes de salvar (se não for null)
      if (avatarData !== null && avatarData !== undefined) {
        if (typeof avatarData === 'string') {
          // Verificar tamanho se for imagem base64
          if (avatarData.startsWith('data:image/')) {
            const base64Size = Math.ceil((avatarData.length * 3) / 4);
            if (base64Size > 500000) { // 500KB
              throw new Error('Avatar muito grande (máximo 500KB)');
            }
          }
          // Para emojis e outros tipos, ser mais permissivo
          // Apenas verificar se não é excessivamente longo
          else if (avatarData.length > 50) { // Aumentado significativamente
            throw new Error('Avatar muito longo');
          }
        } else {
          throw new Error('Avatar deve ser uma string ou null');
        }
      }

      // Criar cópia do perfil com o novo avatar
      const updatedProfile = {
        ...profile,
        avatar: avatarData,
        lastUpdated: new Date().toISOString()
      };

      // Atualizar estado local imediatamente
      console.log('🔄 [UserProfileContext] Atualizando estado local com avatar:', avatarData ? 'Avatar presente' : 'Removendo avatar');
      setProfile(updatedProfile);
      console.log('✅ [UserProfileContext] Estado local atualizado:', updatedProfile.avatar ? 'Avatar definido' : 'Avatar removido');

      // Salvar no servidor usando a função existente
      try {
        console.log('💾 [UserProfileContext] Salvando no servidor...');
        await saveProfileToServer(updatedProfile);
        console.log('✅ [UserProfileContext] Salvo no servidor com sucesso');
      } catch (serverError) {
        console.error('❌ [UserProfileContext] Erro no servidor:', serverError);
        // Em caso de erro no servidor, reverter o estado local
        setProfile(profile);
        throw new Error('Erro ao salvar no servidor: ' + serverError.message);
      }

      // Salvar no localStorage como backup
      if (userId) {
        try {
          localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));
          localStorage.setItem(`ludomusic_profile_backup_${userId}`, JSON.stringify(updatedProfile));
          console.log('✅ Avatar salvo no localStorage');
        } catch (localError) {
          console.warn('⚠️ Erro ao salvar avatar no localStorage:', localError.message);
        }
      }

      return updatedProfile;
    } catch (error) {
      console.error('❌ Erro ao atualizar avatar:', error);
      throw error;
    }
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
