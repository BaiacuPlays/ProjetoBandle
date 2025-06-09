import React, { useState, useEffect } from 'react';
import { useProfile } from '../contexts/ProfileContext';

const ProfileStatus = () => {
  const { profile, isLoading } = useProfile() || {};
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const checkStatus = () => {
      setStatus({
        profile: !!profile,
        loading: isLoading,
        lastUpdate: profile?.lastUpdated || 'Nunca'
      });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [profile, isLoading]);

  if (!status) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 1000,
      maxWidth: '250px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        Status do Sistema
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: status.profile ? '#4CAF50' : '#f44336',
          marginRight: '8px'
        }}></span>
        Perfil: {status.profile ? 'Carregado' : 'Não carregado'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: status.storage.available ? '#4CAF50' : '#f44336',
          marginRight: '8px'
        }}></span>
        Storage: {status.storage.available ? 'OK' : 'Erro'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: status.loading ? '#FF9800' : '#4CAF50',
          marginRight: '8px'
        }}></span>
        Status: {status.loading ? 'Carregando...' : 'Pronto'}
      </div>

      {status.storage.available && (
        <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.8 }}>
          Usuários salvos: {status.storage.totalUsers || 0}
        </div>
      )}

      {profile && (
        <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.8 }}>
          Última atualização: {new Date(status.lastUpdate).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default ProfileStatus;
