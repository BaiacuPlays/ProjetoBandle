/**
 * Hook para sistema de estatísticas à prova de balas
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useBulletproofStats = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const { isAuthenticated } = useAuth();

  /**
   * Fazer requisição para a API com retry automático
   */
  const apiRequest = useCallback(async (method, data = null, retries = 3) => {
    const sessionToken = localStorage.getItem('ludomusic_session_token');
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const options = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
          }
        };

        if (data && method !== 'GET') {
          options.body = JSON.stringify(data);
        }

        const response = await fetch('/api/bulletproof-stats', options);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        return result;

      } catch (error) {
        console.error(`❌ [BULLETPROOF-HOOK] Tentativa ${attempt}/${retries}:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }, []);

  /**
   * Carregar perfil
   */
  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 [BULLETPROOF-HOOK] Carregando perfil...');
      
      const result = await apiRequest('GET');
      
      if (result.success && result.profile) {
        setProfile(result.profile);
        setLastUpdate(new Date().toISOString());
        console.log('✅ [BULLETPROOF-HOOK] Perfil carregado:', result.profile.username);
      } else {
        throw new Error('Perfil não encontrado na resposta');
      }
      
    } catch (error) {
      console.error('❌ [BULLETPROOF-HOOK] Erro ao carregar perfil:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, apiRequest]);

  /**
   * Atualizar estatísticas de jogo
   */
  const updateGameStats = useCallback(async (gameData) => {
    if (!isAuthenticated || !profile) {
      throw new Error('Usuário não autenticado ou perfil não carregado');
    }

    try {
      console.log('🎮 [BULLETPROOF-HOOK] Atualizando estatísticas:', gameData);
      
      const result = await apiRequest('POST', {
        action: 'update-game',
        gameData
      });

      if (result.success && result.profile) {
        setProfile(result.profile);
        setLastUpdate(new Date().toISOString());
        console.log('✅ [BULLETPROOF-HOOK] Estatísticas atualizadas');
        return result.profile;
      } else {
        throw new Error(result.error || 'Falha ao atualizar estatísticas');
      }
      
    } catch (error) {
      console.error('❌ [BULLETPROOF-HOOK] Erro ao atualizar stats:', error);
      throw error;
    }
  }, [isAuthenticated, profile, apiRequest]);

  /**
   * Forçar recálculo completo
   */
  const forceRecalculate = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🔄 [BULLETPROOF-HOOK] Forçando recálculo...');
      
      const result = await apiRequest('POST', {
        action: 'force-recalculate'
      });

      if (result.success && result.profile) {
        setProfile(result.profile);
        setLastUpdate(new Date().toISOString());
        console.log('✅ [BULLETPROOF-HOOK] Recálculo concluído');
        return {
          success: true,
          profile: result.profile,
          message: result.message,
          backupKey: result.backupKey
        };
      } else {
        throw new Error(result.error || 'Falha no recálculo');
      }
      
    } catch (error) {
      console.error('❌ [BULLETPROOF-HOOK] Erro no recálculo:', error);
      throw error;
    }
  }, [isAuthenticated, apiRequest]);

  /**
   * Validar estatísticas
   */
  const validateStats = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('✅ [BULLETPROOF-HOOK] Validando estatísticas...');
      
      const result = await apiRequest('POST', {
        action: 'validate'
      });

      return {
        isValid: result.validation.isValid,
        errors: result.validation.errors,
        profile: result.profile,
        repairedProfile: result.repairedProfile
      };
      
    } catch (error) {
      console.error('❌ [BULLETPROOF-HOOK] Erro na validação:', error);
      throw error;
    }
  }, [isAuthenticated, apiRequest]);

  /**
   * Reparar estatísticas
   */
  const repairStats = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🔧 [BULLETPROOF-HOOK] Reparando estatísticas...');
      
      const result = await apiRequest('POST', {
        action: 'repair'
      });

      if (result.success && result.profile) {
        setProfile(result.profile);
        setLastUpdate(new Date().toISOString());
        console.log('✅ [BULLETPROOF-HOOK] Reparo concluído');
        return {
          success: true,
          profile: result.profile,
          message: result.message,
          backupKey: result.backupKey,
          changes: result.changes
        };
      } else {
        throw new Error(result.error || 'Falha no reparo');
      }
      
    } catch (error) {
      console.error('❌ [BULLETPROOF-HOOK] Erro no reparo:', error);
      throw error;
    }
  }, [isAuthenticated, apiRequest]);

  /**
   * Salvar perfil completo
   */
  const saveProfile = useCallback(async (profileData) => {
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('💾 [BULLETPROOF-HOOK] Salvando perfil...');
      
      const result = await apiRequest('PUT', {
        profile: profileData
      });

      if (result.success && result.profile) {
        setProfile(result.profile);
        setLastUpdate(new Date().toISOString());
        console.log('✅ [BULLETPROOF-HOOK] Perfil salvo');
        return result.profile;
      } else {
        throw new Error(result.error || 'Falha ao salvar perfil');
      }
      
    } catch (error) {
      console.error('❌ [BULLETPROOF-HOOK] Erro ao salvar:', error);
      throw error;
    }
  }, [isAuthenticated, apiRequest]);

  /**
   * Resetar perfil
   */
  const resetProfile = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🗑️ [BULLETPROOF-HOOK] Resetando perfil...');
      
      const result = await apiRequest('DELETE');

      if (result.success && result.profile) {
        setProfile(result.profile);
        setLastUpdate(new Date().toISOString());
        console.log('✅ [BULLETPROOF-HOOK] Perfil resetado');
        return {
          success: true,
          profile: result.profile,
          message: result.message,
          backupKey: result.backupKey
        };
      } else {
        throw new Error(result.error || 'Falha ao resetar perfil');
      }
      
    } catch (error) {
      console.error('❌ [BULLETPROOF-HOOK] Erro no reset:', error);
      throw error;
    }
  }, [isAuthenticated, apiRequest]);

  // Carregar perfil automaticamente quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
      setError(null);
    }
  }, [isAuthenticated, loadProfile]);

  // Auto-validação periódica (a cada 5 minutos)
  useEffect(() => {
    if (!isAuthenticated || !profile) return;

    const interval = setInterval(async () => {
      try {
        const validation = await validateStats();
        if (!validation.isValid) {
          console.warn('⚠️ [BULLETPROOF-HOOK] Estatísticas inválidas detectadas, reparando...');
          await repairStats();
        }
      } catch (error) {
        console.warn('⚠️ [BULLETPROOF-HOOK] Erro na validação automática:', error.message);
      }
    }, 300000); // 5 minutos

    return () => clearInterval(interval);
  }, [isAuthenticated, profile, validateStats, repairStats]);

  return {
    // Estado
    profile,
    isLoading,
    error,
    lastUpdate,
    
    // Ações
    loadProfile,
    updateGameStats,
    forceRecalculate,
    validateStats,
    repairStats,
    saveProfile,
    resetProfile,
    
    // Utilitários
    isReady: !isLoading && !error && profile !== null
  };
};
