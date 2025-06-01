// Componente para gerenciar presença online automaticamente
import { useEffect } from 'react';
import { usePresence } from '../hooks/usePresence';
import { useAuth } from '../contexts/AuthContext';

const PresenceManager = () => {
  const { isAuthenticated } = useAuth();
  const { setOnline, setOffline } = usePresence();

  useEffect(() => {
    if (isAuthenticated) {
      // Marcar como online quando autenticado
      setOnline();
    } else {
      // Marcar como offline quando não autenticado
      setOffline();
    }
  }, [isAuthenticated, setOnline, setOffline]);

  // Este componente não renderiza nada
  return null;
};

export default PresenceManager;
