import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';

export default function TestProfile() {
  const { user, isAuthenticated, login, logout, userId, username } = useAuth();
  const { profile, isLoading, error, updateProfile, updateStats, updatePreferences, reloadProfile } = useProfile();
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [testMessage, setTestMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await login(loginForm.username, loginForm.password);
      if (result.success) {
        setTestMessage('Login realizado com sucesso!');
      } else {
        setTestMessage('Erro no login: ' + result.error);
      }
    } catch (error) {
      setTestMessage('Erro no login: ' + error.message);
    }
  };

  const handleTestUpdateProfile = async () => {
    if (!profile) return;
    
    try {
      await updateProfile({
        displayName: 'Teste Atualizado',
        bio: 'Bio de teste atualizada em ' + new Date().toLocaleTimeString()
      });
      setTestMessage('Perfil atualizado com sucesso!');
    } catch (error) {
      setTestMessage('Erro ao atualizar perfil: ' + error.message);
    }
  };

  const handleTestUpdateStats = async () => {
    if (!profile) return;
    
    try {
      await updateStats({
        totalGames: (profile.stats?.totalGames || 0) + 1,
        wins: (profile.stats?.wins || 0) + 1
      });
      setTestMessage('Estatísticas atualizadas com sucesso!');
    } catch (error) {
      setTestMessage('Erro ao atualizar estatísticas: ' + error.message);
    }
  };

  const handleReloadProfile = async () => {
    try {
      await reloadProfile();
      setTestMessage('Perfil recarregado com sucesso!');
    } catch (error) {
      setTestMessage('Erro ao recarregar perfil: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Teste do Sistema de Perfil</h1>
      
      {/* Status de Autenticação */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Status de Autenticação</h2>
        <p><strong>Autenticado:</strong> {isAuthenticated ? '✅ Sim' : '❌ Não'}</p>
        <p><strong>User ID:</strong> {userId || 'N/A'}</p>
        <p><strong>Username:</strong> {username || 'N/A'}</p>
        <p><strong>User Object:</strong> {user ? JSON.stringify(user) : 'N/A'}</p>
      </div>

      {/* Login Form */}
      {!isAuthenticated && (
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Username:</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                style={{ marginLeft: '1rem', padding: '0.5rem' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Password:</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                style={{ marginLeft: '1rem', padding: '0.5rem' }}
              />
            </div>
            <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>
              Login
            </button>
          </form>
        </div>
      )}

      {/* Status do Perfil */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Status do Perfil</h2>
        <p><strong>Carregando:</strong> {isLoading ? '⏳ Sim' : '✅ Não'}</p>
        <p><strong>Erro:</strong> {error || '✅ Nenhum'}</p>
        <p><strong>Perfil Existe:</strong> {profile ? '✅ Sim' : '❌ Não'}</p>
        
        {profile && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <h3>Dados do Perfil:</h3>
            <p><strong>ID:</strong> {profile.id}</p>
            <p><strong>Username:</strong> {profile.username}</p>
            <p><strong>Display Name:</strong> {profile.displayName}</p>
            <p><strong>Bio:</strong> {profile.bio || 'Vazia'}</p>
            <p><strong>Foto:</strong> {profile.profilePhoto || 'Não definida'}</p>
            <p><strong>Level:</strong> {profile.level}</p>
            <p><strong>XP:</strong> {profile.xp}</p>
            <p><strong>Total de Jogos:</strong> {profile.stats?.totalGames || 0}</p>
            <p><strong>Vitórias:</strong> {profile.stats?.wins || 0}</p>
            <p><strong>Criado em:</strong> {profile.createdAt}</p>
            <p><strong>Último Login:</strong> {profile.lastLoginAt}</p>
          </div>
        )}
      </div>

      {/* Testes */}
      {isAuthenticated && (
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>Testes</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button 
              onClick={handleTestUpdateProfile}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Testar Atualizar Perfil
            </button>
            <button 
              onClick={handleTestUpdateStats}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Testar Atualizar Stats
            </button>
            <button 
              onClick={handleReloadProfile}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Recarregar Perfil
            </button>
            <button 
              onClick={logout}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Mensagens de Teste */}
      {testMessage && (
        <div style={{ padding: '1rem', backgroundColor: '#e8f5e8', border: '1px solid #4CAF50', borderRadius: '4px' }}>
          <strong>Resultado do Teste:</strong> {testMessage}
        </div>
      )}
    </div>
  );
}
