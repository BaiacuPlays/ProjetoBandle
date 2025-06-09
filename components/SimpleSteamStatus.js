// Componente simples para mostrar status do perfil
import React from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';

const SimpleSteamStatus = () => {
  const { isAuthenticated } = useAuth();
  const { profile, isLoading } = useProfile() || {};

  // Só mostrar se usuário estiver logado
  if (!isAuthenticated || !profile) {
    return null;
  }

  const getStatusColor = () => {
    if (isLoading) return '#3B82F6';
    return profile ? '#10B981' : '#EF4444';
  };

  const getStatusText = () => {
    if (isLoading) return '🔄 Carregando';
    return profile ? '✅ Perfil Ativo' : '❌ Erro';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      zIndex: 1000,
      border: `1px solid ${getStatusColor()}`,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: getStatusColor() }}>●</span>
        <span>{getStatusText()}</span>
      </div>
      <div style={{
        fontSize: '10px',
        color: '#9CA3AF',
        marginTop: '2px',
        textAlign: 'center'
      }}>
        Nível {profile?.level || 1} • {profile?.stats?.totalGames || 0} jogos
      </div>
    </div>
  );
};

export default SimpleSteamStatus;
