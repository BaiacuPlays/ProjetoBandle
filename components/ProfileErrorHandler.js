import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../contexts/UserProfileContext';
import { loadProfileFromLocalStorage, repairProfile, saveProfileToLocalStorage } from '../utils/profilePersistence';

/**
 * Componente para detectar e corrigir erros no perfil do usuário
 * Este componente não renderiza nada visualmente, apenas monitora e corrige problemas
 */
const ProfileErrorHandler = () => {
  const { profile, userId, isLoading } = useUserProfile();
  const [hasAttemptedRepair, setHasAttemptedRepair] = useState(false);

  // Verificar e corrigir problemas no perfil
  useEffect(() => {
    // Só executar quando temos userId e não estamos carregando
    if (!userId || isLoading) return;

    // Se não temos perfil mas temos userId, tentar recuperar do localStorage
    if (!profile && !hasAttemptedRepair) {
      console.log('🔍 [ERROR-HANDLER] Perfil não encontrado, tentando recuperar...');
      
      // Marcar que já tentamos reparar para evitar loop
      setHasAttemptedRepair(true);
      
      // Tentar carregar do localStorage
      const localProfile = loadProfileFromLocalStorage(userId);
      
      if (localProfile) {
        console.log('✅ [ERROR-HANDLER] Perfil recuperado do localStorage');
        
        // Forçar recarregamento da página para aplicar o perfil recuperado
        window.location.reload();
      } else {
        console.log('❌ [ERROR-HANDLER] Não foi possível recuperar o perfil');
      }
    }
    
    // Se temos perfil mas está corrompido, tentar reparar
    if (profile && !hasAttemptedRepair) {
      // Verificar campos críticos
      const hasCriticalFields = profile.id && profile.stats && Array.isArray(profile.achievements);
      
      if (!hasCriticalFields) {
        console.log('🔧 [ERROR-HANDLER] Perfil corrompido detectado, tentando reparar...');
        
        // Marcar que já tentamos reparar para evitar loop
        setHasAttemptedRepair(true);
        
        // Tentar reparar o perfil
        const repairedProfile = repairProfile(profile, userId);
        
        if (repairedProfile) {
          console.log('✅ [ERROR-HANDLER] Perfil reparado com sucesso');
          
          // Salvar o perfil reparado
          saveProfileToLocalStorage(userId, repairedProfile);
          
          // Forçar recarregamento da página para aplicar o perfil reparado
          window.location.reload();
        } else {
          console.log('❌ [ERROR-HANDLER] Não foi possível reparar o perfil');
        }
      }
    }
  }, [profile, userId, isLoading, hasAttemptedRepair]);

  // Este componente não renderiza nada
  return null;
};

export default ProfileErrorHandler;