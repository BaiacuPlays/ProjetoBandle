// Hook que GARANTE que usuários logados sempre tenham dados
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';

export const useGuaranteedProfile = () => {
  const { isAuthenticated, getAuthenticatedUserId, getAuthenticatedUser } = useAuth();
  const { profile, userId, isLoading } = useUserProfile();
  const [isGuaranteed, setIsGuaranteed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lastCheck, setLastCheck] = useState(Date.now());

  // Função para forçar carregamento de dados
  const forceLoadProfile = async () => {
    if (!isAuthenticated) return false;

    const authUserId = getAuthenticatedUserId();
    if (!authUserId) return false;

    console.log('🔄 [GUARANTEED] Forçando carregamento de perfil para:', authUserId);

    try {
      // Tentar múltiplas estratégias de carregamento

      // ESTRATÉGIA 1: localStorage
      const localProfileKey = `ludomusic_profile_${authUserId}`;
      const localProfileData = localStorage.getItem(localProfileKey);

      if (localProfileData) {
        try {
          const localProfile = JSON.parse(localProfileData);
          console.log('✅ [GUARANTEED] Perfil encontrado no localStorage');
          return true;
        } catch (error) {
          console.warn('⚠️ [GUARANTEED] Erro ao parsear perfil local:', error);
        }
      }

      // ESTRATÉGIA 2: Backups
      const backupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`ludomusic_profile_backup_${authUserId}_`)) {
          backupKeys.push(key);
        }
      }

      if (backupKeys.length > 0) {
        // Usar backup mais recente
        backupKeys.sort((a, b) => {
          const timestampA = parseInt(a.split('_').pop());
          const timestampB = parseInt(b.split('_').pop());
          return timestampB - timestampA;
        });

        const backupData = localStorage.getItem(backupKeys[0]);
        if (backupData) {
          const backupProfile = JSON.parse(backupData);
          // Restaurar como perfil principal
          localStorage.setItem(localProfileKey, JSON.stringify(backupProfile));
          console.log('🔄 [GUARANTEED] Perfil restaurado do backup');
          return true;
        }
      }

      // ESTRATÉGIA 3: Servidor normal
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      if (sessionToken) {
        try {
          const response = await fetch('/api/profile', {
            headers: {
              'Authorization': `Bearer ${sessionToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.profile) {
              localStorage.setItem(localProfileKey, JSON.stringify(data.profile));
              console.log('🌐 [GUARANTEED] Perfil carregado do servidor');
              return true;
            }
          }
        } catch (error) {
          console.warn('⚠️ [GUARANTEED] Erro ao carregar do servidor:', error);
        }
      }

      // ESTRATÉGIA 3.5: API de EMERGÊNCIA (NUNCA FALHA)
      if (sessionToken) {
        try {
          console.log('🆘 [GUARANTEED] Usando API de emergência');
          const emergencyResponse = await fetch('/api/emergency-profile', {
            headers: {
              'Authorization': `Bearer ${sessionToken}`
            }
          });

          if (emergencyResponse.ok) {
            const emergencyData = await emergencyResponse.json();
            if (emergencyData.profile) {
              localStorage.setItem(localProfileKey, JSON.stringify(emergencyData.profile));
              console.log('✅ [GUARANTEED] Perfil de emergência carregado');
              return true;
            }
          }
        } catch (error) {
          console.warn('⚠️ [GUARANTEED] Erro na API de emergência:', error);
        }
      }

      // ESTRATÉGIA 4: Criar perfil de emergência
      console.log('🆘 [GUARANTEED] Criando perfil de emergência');
      const authenticatedUser = getAuthenticatedUser();

      const emergencyProfile = {
        id: authUserId,
        username: authenticatedUser?.username || `Jogador_${authUserId.slice(-6)}`,
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
        }
      };

      localStorage.setItem(localProfileKey, JSON.stringify(emergencyProfile));
      console.log('✅ [GUARANTEED] Perfil de emergência criado');

      // Forçar reload da página para aplicar o perfil
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      return true;
    } catch (error) {
      console.error('❌ [GUARANTEED] Erro crítico ao forçar carregamento:', error);
      return false;
    }
  };

  // Verificação contínua
  useEffect(() => {
    if (!isAuthenticated) {
      setIsGuaranteed(false);
      return;
    }

    const authUserId = getAuthenticatedUserId();

    // Verificar se temos dados válidos
    const hasValidData = profile && userId && profile.id === authUserId;

    if (hasValidData) {
      setIsGuaranteed(true);
      setAttempts(0);
      return;
    }

    // Se não temos dados válidos e não estamos carregando
    if (!isLoading && !hasValidData) {
      const now = Date.now();

      // Evitar tentativas muito frequentes
      if (now - lastCheck < 5000) return;

      setLastCheck(now);
      setAttempts(prev => prev + 1);

      console.log(`🚨 [GUARANTEED] Usuário logado sem dados (tentativa ${attempts + 1})`);

      // Tentar forçar carregamento
      forceLoadProfile().then(success => {
        if (success) {
          console.log('✅ [GUARANTEED] Carregamento forçado bem-sucedido');
        } else {
          console.log('❌ [GUARANTEED] Carregamento forçado falhou');
        }
      });
    }
  }, [isAuthenticated, profile, userId, isLoading, attempts, lastCheck]);

  // Verificação de emergência a cada 30 segundos
  useEffect(() => {
    if (!isAuthenticated) return;

    const emergencyCheck = setInterval(() => {
      const authUserId = getAuthenticatedUserId();
      const hasValidData = profile && userId && profile.id === authUserId;

      if (!hasValidData && !isLoading) {
        console.log('🚨 [EMERGENCY] Verificação de emergência - dados ausentes');
        forceLoadProfile();
      }
    }, 30000);

    return () => clearInterval(emergencyCheck);
  }, [isAuthenticated, profile, userId, isLoading]);

  return {
    isGuaranteed,
    hasValidData: isAuthenticated && profile && userId,
    attempts,
    forceReload: forceLoadProfile
  };
};
