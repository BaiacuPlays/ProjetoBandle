/**
 * Utilitário para sincronização de perfil entre localStorage e sessionStorage
 * Implementa mecanismos para garantir que o perfil esteja sempre disponível
 */

// Sincronizar perfil entre localStorage e sessionStorage
export const syncProfileBetweenStorages = (userId) => {
  if (!userId || typeof window === 'undefined') return;
  
  try {
    // Verificar se há perfil no localStorage
    const localProfileKey = `ludomusic_profile_${userId}`;
    const localProfileStr = localStorage.getItem(localProfileKey);
    
    // Verificar se há perfil no sessionStorage
    const sessionProfileKey = `ludomusic_session_profile_${userId}`;
    const sessionProfileStr = sessionStorage.getItem(sessionProfileKey);
    
    if (localProfileStr && !sessionProfileStr) {
      // Se há perfil no localStorage mas não no sessionStorage, copiar para sessionStorage
      sessionStorage.setItem(sessionProfileKey, localProfileStr);
      console.log('🔄 Perfil copiado do localStorage para sessionStorage');
    } else if (!localProfileStr && sessionProfileStr) {
      // Se há perfil no sessionStorage mas não no localStorage, copiar para localStorage
      localStorage.setItem(localProfileKey, sessionProfileStr);
      console.log('🔄 Perfil copiado do sessionStorage para localStorage');
    } else if (localProfileStr && sessionProfileStr) {
      // Se há perfil em ambos, verificar qual é mais recente
      try {
        const localProfile = JSON.parse(localProfileStr);
        const sessionProfile = JSON.parse(sessionProfileStr);
        
        const localDate = new Date(localProfile.lastUpdated);
        const sessionDate = new Date(sessionProfile.lastUpdated);
        
        if (localDate > sessionDate) {
          // Se o perfil do localStorage é mais recente, atualizar sessionStorage
          sessionStorage.setItem(sessionProfileKey, localProfileStr);
          console.log('🔄 Perfil do localStorage mais recente, atualizado no sessionStorage');
        } else if (sessionDate > localDate) {
          // Se o perfil do sessionStorage é mais recente, atualizar localStorage
          localStorage.setItem(localProfileKey, sessionProfileStr);
          console.log('🔄 Perfil do sessionStorage mais recente, atualizado no localStorage');
        }
      } catch (error) {
        console.error('❌ Erro ao comparar perfis:', error);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar perfil entre storages:', error);
  }
};

// Configurar sincronização automática
export const setupAutoSync = (userId) => {
  if (!userId || typeof window === 'undefined') return () => {};
  
  // Sincronizar imediatamente
  syncProfileBetweenStorages(userId);
  
  // Configurar sincronização periódica
  const intervalId = setInterval(() => {
    syncProfileBetweenStorages(userId);
  }, 10000); // A cada 10 segundos
  
  // Configurar sincronização em eventos de visibilidade
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      syncProfileBetweenStorages(userId);
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Configurar sincronização em eventos de storage
  const handleStorageChange = (event) => {
    if (event.key === `ludomusic_profile_${userId}` || event.key === `ludomusic_session_profile_${userId}`) {
      syncProfileBetweenStorages(userId);
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Retornar função de limpeza
  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('storage', handleStorageChange);
  };
};

// Exportar função para uso direto
export const initProfileSync = (userId) => {
  if (!userId) return;
  
  // Configurar sincronização automática
  const cleanup = setupAutoSync(userId);
  
  // Retornar função de limpeza
  return cleanup;
};