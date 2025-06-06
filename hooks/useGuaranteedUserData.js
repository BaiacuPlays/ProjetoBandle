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

    console.log('🔍 [GUARANTEED] Verificação de integridade:', {
      isAuthenticated,
      hasProfile: !!profile,
      hasUserId: !!userId,
      hasCurrentUserId: !!currentUserId,
      idsMatch: profile?.id === currentUserId,
      hasUsername: !!profile?.username,
      hasStats: !!profile?.stats,
      hasValidData
    });

    setIsDataGuaranteed(hasValidData);
    setLastCheck(new Date().toISOString());

    return hasValidData;
  }, [isAuthenticated, profile, userId]);

  // Função para forçar criação de dados de emergência
  const forceEmergencyData = useCallback(async () => {
    if (!isAuthenticated) {
      console.warn('⚠️ [GUARANTEED] Usuário não autenticado, não é possível criar dados de emergência');
      return null;
    }

    console.log('🆘 [GUARANTEED] FORÇANDO criação de dados de emergência');

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
          console.log('✅ [GUARANTEED] Dados de emergência obtidos da API');
          setEmergencyProfile(data.profile);
          return data.profile;
        }
      }
    } catch (error) {
      console.warn('⚠️ [GUARANTEED] Erro na API de emergência:', error);
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

    // Salvar localmente
    try {
      localStorage.setItem(`ludomusic_profile_${currentUserId}`, JSON.stringify(localEmergencyProfile));
      localStorage.setItem(`ludomusic_emergency_profile_${currentUserId}`, JSON.stringify(localEmergencyProfile));
      console.log('💾 [GUARANTEED] Perfil de emergência local criado e salvo');
    } catch (error) {
      console.warn('⚠️ [GUARANTEED] Erro ao salvar perfil de emergência local:', error);
    }

    setEmergencyProfile(localEmergencyProfile);
    return localEmergencyProfile;
  }, [isAuthenticated, user]);

  // Função para garantir dados do usuário
  const guaranteeUserData = useCallback(async () => {
    if (!isAuthenticated) {
      return null;
    }

    console.log('🛡️ [GUARANTEED] Garantindo dados do usuário...');

    // Verificar se já tem dados válidos
    if (checkUserDataIntegrity()) {
      console.log('✅ [GUARANTEED] Dados já estão íntegros');
      return profile;
    }

    // Se não tem dados válidos, forçar criação
    console.log('⚠️ [GUARANTEED] Dados ausentes ou inválidos, forçando criação...');
    const emergencyData = await forceEmergencyData();
    
    if (emergencyData) {
      console.log('✅ [GUARANTEED] Dados de emergência criados com sucesso');
      return emergencyData;
    }

    console.error('❌ [GUARANTEED] FALHA CRÍTICA: Não foi possível garantir dados do usuário');
    return null;
  }, [isAuthenticated, profile, checkUserDataIntegrity, forceEmergencyData]);

  // Monitoramento contínuo
  useEffect(() => {
    if (!isAuthenticated) {
      setIsDataGuaranteed(false);
      setEmergencyProfile(null);
      return;
    }

    // Verificação inicial
    const initialCheck = setTimeout(() => {
      checkUserDataIntegrity();
    }, 1000);

    // Verificação periódica a cada 30 segundos
    const periodicCheck = setInterval(() => {
      const hasValidData = checkUserDataIntegrity();
      
      if (!hasValidData) {
        console.warn('🚨 [GUARANTEED] USUÁRIO LOGADO SEM DADOS DETECTADO!');
        console.warn('🚨 [GUARANTEED] Iniciando correção automática...');
        
        guaranteeUserData().then(result => {
          if (result) {
            console.log('✅ [GUARANTEED] Correção automática bem-sucedida');
          } else {
            console.error('❌ [GUARANTEED] Correção automática falhou');
          }
        });
      }
    }, 30000); // 30 segundos

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
