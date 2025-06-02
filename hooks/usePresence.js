// Hook para gerenciar presença online
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePresence = () => {
  const { isAuthenticated } = useAuth();
  const heartbeatIntervalRef = useRef(null);
  const isOnlineRef = useRef(false);

  // Marcar como online
  const setOnline = async () => {
    if (!isAuthenticated || isOnlineRef.current) return;

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      
      const response = await fetch('/api/presence', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (response.ok) {
        isOnlineRef.current = true;
        console.log('✅ Status online definido');
        
        // Iniciar heartbeat a cada 60 segundos
        startHeartbeat();
      }
    } catch (error) {
      console.error('Erro ao definir status online:', error);
    }
  };

  // Marcar como offline
  const setOffline = async () => {
    if (!isOnlineRef.current) return;

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      
      await fetch('/api/presence', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      isOnlineRef.current = false;
      stopHeartbeat();
      console.log('✅ Status offline definido');
    } catch (error) {
      console.error('Erro ao definir status offline:', error);
    }
  };

  // Enviar heartbeat para manter online
  const sendHeartbeat = async () => {
    if (!isAuthenticated || !isOnlineRef.current) return;

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      
      await fetch('/api/presence', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
    } catch (error) {
      console.error('Erro no heartbeat:', error);
      // Se falhar, tentar reconectar
      isOnlineRef.current = false;
      setTimeout(setOnline, 5000);
    }
  };

  // Iniciar heartbeat
  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) return;

    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 120000); // 120 segundos - OTIMIZADO
  };

  // Parar heartbeat
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Buscar status de amigos
  const getFriendsPresence = async (friendIds) => {
    if (!isAuthenticated || !friendIds || friendIds.length === 0) {
      return {};
    }

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      const idsParam = friendIds.join(',');
      
      const response = await fetch(`/api/presence?friendIds=${encodeURIComponent(idsParam)}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.presence || {};
      }
    } catch (error) {
      console.error('Erro ao buscar presença dos amigos:', error);
    }

    return {};
  };

  // Efeito para gerenciar presença quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      setOnline();
    } else {
      setOffline();
    }

    return () => {
      setOffline();
    };
  }, [isAuthenticated]);

  // Efeito para detectar quando a página é fechada/recarregada
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isOnlineRef.current) {
        // Usar sendBeacon para garantir que a requisição seja enviada
        const sessionToken = localStorage.getItem('ludomusic_session_token');
        if (sessionToken) {
          navigator.sendBeacon('/api/presence', JSON.stringify({
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${sessionToken}`
            }
          }));
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Página ficou oculta - reduzir heartbeat
        stopHeartbeat();
      } else {
        // Página ficou visível - retomar heartbeat
        if (isAuthenticated && isOnlineRef.current) {
          sendHeartbeat();
          startHeartbeat();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopHeartbeat();
    };
  }, [isAuthenticated]);

  return {
    setOnline,
    setOffline,
    sendHeartbeat,
    getFriendsPresence,
    isOnline: isOnlineRef.current
  };
};
