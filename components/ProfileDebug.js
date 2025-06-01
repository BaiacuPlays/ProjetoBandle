// Componente de debug para verificar dados do perfil
import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useAuth } from '../contexts/AuthContext';

const ProfileDebug = () => {
  const { profile, userId } = useUserProfile();
  const { isAuthenticated, user } = useAuth();
  const [localStorageData, setLocalStorageData] = useState(null);
  const [serverData, setServerData] = useState(null);

  useEffect(() => {
    // Verificar dados do localStorage
    if (userId) {
      const localData = localStorage.getItem(`ludomusic_profile_${userId}`);
      if (localData) {
        try {
          setLocalStorageData(JSON.parse(localData));
        } catch (error) {
          console.error('Erro ao parsear dados locais:', error);
        }
      }
    }
  }, [userId]);

  const fetchServerData = async () => {
    if (!userId) return;
    
    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      const response = await fetch(`/api/user-profile?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setServerData(data.profile);
      } else {
        console.error('Erro ao buscar dados do servidor:', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do servidor:', error);
    }
  };

  const testProfileAPI = async () => {
    if (!userId) return;
    
    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      const response = await fetch(`/api/profile?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      const data = await response.json();
      console.log('📊 Resposta da API /api/profile:', data);
    } catch (error) {
      console.error('Erro ao testar API profile:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', background: '#1a1a1a', color: 'white', margin: '20px' }}>
        <h3>🔍 Debug do Perfil</h3>
        <p>❌ Usuário não autenticado</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#1a1a1a', color: 'white', margin: '20px', borderRadius: '10px' }}>
      <h3>🔍 Debug do Perfil</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>👤 Dados de Autenticação:</h4>
        <pre style={{ background: '#2a2a2a', padding: '10px', borderRadius: '5px', fontSize: '12px' }}>
          {JSON.stringify({
            isAuthenticated,
            userId,
            user: user ? {
              username: user.username,
              displayName: user.displayName
            } : null
          }, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>📱 Perfil do Contexto:</h4>
        <pre style={{ background: '#2a2a2a', padding: '10px', borderRadius: '5px', fontSize: '12px' }}>
          {JSON.stringify(profile ? {
            id: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            bio: profile.bio,
            avatar: profile.avatar,
            level: profile.level,
            xp: profile.xp,
            stats: profile.stats
          } : null, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>💾 Dados do localStorage:</h4>
        <pre style={{ background: '#2a2a2a', padding: '10px', borderRadius: '5px', fontSize: '12px' }}>
          {JSON.stringify(localStorageData ? {
            id: localStorageData.id,
            username: localStorageData.username,
            displayName: localStorageData.displayName,
            bio: localStorageData.bio,
            avatar: localStorageData.avatar,
            level: localStorageData.level,
            xp: localStorageData.xp,
            stats: localStorageData.stats
          } : null, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={fetchServerData}
          style={{ 
            background: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '5px',
            marginRight: '10px'
          }}
        >
          🌐 Buscar Dados do Servidor
        </button>
        
        <button 
          onClick={testProfileAPI}
          style={{ 
            background: '#2196F3', 
            color: 'white', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '5px'
          }}
        >
          🧪 Testar API Profile
        </button>
      </div>

      {serverData && (
        <div style={{ marginBottom: '20px' }}>
          <h4>🌐 Dados do Servidor:</h4>
          <pre style={{ background: '#2a2a2a', padding: '10px', borderRadius: '5px', fontSize: '12px' }}>
            {JSON.stringify(serverData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ProfileDebug;
