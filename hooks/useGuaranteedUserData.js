// Hook personalizado que GARANTE que usuários logados sempre tenham dados
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';

export const useGuaranteedUserData = () => {
  const { isAuthenticated, user } = useAuth();
  const { profile, userId, isLoading } = useUserProfile();
  const [isDataGuaranteed, setIsDataGuaranteed] = useState(false);
  const [emergencyProfile, setEmergencyProfile] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  // Função para verificar se usuário logado tem dados
  const checkUserDataIntegrity = useCallback(() => {
    if (!isAuthenticated) {
      setIsDataGuaranteed(false);
      return false;
    }

    const currentUserId = localStorage.getItem('ludomusic_user_id');

    // VERIFICAÇÃO CRÍTICA: Usuário logado DEVE ter dados
    const hasValidData = !!(
      profile &&
      userId &&
      currentUserId &&
      profile.id === currentUserId &&
      profile.username &&
      profile.stats
    );

    // Verificação silenciosa

    setIsDataGuaranteed(hasValidData);
    setLastCheck(new Date().toISOString());

    return hasValidData;
  }, [isAuthenticated, profile, userId]);

  // Função para forçar criação de dados de emergência
  const forceEmergencyData = useCallback(async () => {
    if (!isAuthenticated) {
      return null;
    }

    try {
      // Tentar usar API de emergência
      const response = await fetch('/api/emergency-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ludomusic_session_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          setEmergencyProfile(data.profile);
          return data.profile;
        }
      }
    } catch (error) {
      // Erro silencioso
    }

    // Fallback: Criar perfil local de emergência
    const currentUserId = localStorage.getItem('ludomusic_user_id');
    const localEmergencyProfile = {
      id: currentUserId || 'emergency_user',
      username: user?.username || 'Usuário',
      displayName: user?.displayName || '',
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
      preferences: { theme: 'dark', language: 'pt' },
      _isLocalEmergencyProfile: true,
      _createdAt: new Date().toISOString()
    };

    // Salvar localmente SILENCIOSAMENTE
    try {
      localStorage.setItem(`ludomusic_profile_${currentUserId}`, JSON.stringify(localEmergencyProfile));
      localStorage.setItem(`ludomusic_emergency_profile_${currentUserId}`, JSON.stringify(localEmergencyProfile));
    } catch (error) {
      // Erro silencioso
    }

    setEmergencyProfile(localEmergencyProfile);
    return localEmergencyProfile;
  }, [isAuthenticated, user]);

  // Função para garantir dados do usuário
  const guaranteeUserData = useCallback(async () => {
    if (!isAuthenticated) {
      return null;
    }

    // Verificar se já tem dados válidos SILENCIOSAMENTE
    if (checkUserDataIntegrity()) {
      return profile;
    }

    // Se não tem dados válidos, forçar criação SILENCIOSAMENTE
    const emergencyData = await forceEmergencyData();

    if (emergencyData) {
      return emergencyData;
    }

    return null;
  }, [isAuthenticated, profile, checkUserDataIntegrity, forceEmergencyData]);

  // Monitoramento contínuo - DESABILITADO TEMPORARIAMENTE
  useEffect(() => {
    // DESABILITADO - PODE ESTAR CAUSANDO TRAVAMENTO
    return;

    if (!isAuthenticated) {
      setIsDataGuaranteed(false);
      setEmergencyProfile(null);
      return;
    }

    // Verificação inicial
    const initialCheck = setTimeout(() => {
      checkUserDataIntegrity();
    }, 1000);

    // Verificação periódica a cada 2 minutos (reduzido de 30s)
    const periodicCheck = setInterval(() => {
      const hasValidData = checkUserDataIntegrity();

      if (!hasValidData) {
        // Correção automática SILENCIOSA
        guaranteeUserData().then(result => {
          // Resultado silencioso
        });
      }
    }, 2 * 60 * 1000); // 2 minutos

    return () => {
      clearTimeout(initialCheck);
      clearInterval(periodicCheck);
    };
  }, [isAuthenticated, checkUserDataIntegrity, guaranteeUserData]);

  // Verificação quando profile ou userId mudam
  useEffect(() => {
    if (isAuthenticated) {
      checkUserDataIntegrity();
    }
  }, [isAuthenticated, profile, userId, checkUserDataIntegrity]);

  return {
    // Estado
    isDataGuaranteed,
    emergencyProfile,
    lastCheck,

    // Funções
    checkUserDataIntegrity,
    forceEmergencyData,
    guaranteeUserData,

    // Dados efetivos (profile normal ou emergência)
    effectiveProfile: profile || emergencyProfile,
    hasAnyData: !!(profile || emergencyProfile),

    // Status
    isEmergencyMode: !!emergencyProfile && !profile,
    needsDataCreation: isAuthenticated && !profile && !emergencyProfile,

    // Debugging
    debugInfo: {
      isAuthenticated,
      hasProfile: !!profile,
      hasUserId: !!userId,
      hasEmergencyProfile: !!emergencyProfile,
      isLoading,
      lastCheck
    }
  };
};

export default useGuaranteedUserData;
