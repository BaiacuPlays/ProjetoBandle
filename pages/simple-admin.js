import { useState, useEffect } from 'react';
import Head from 'next/head';
import UserBadge from '../components/UserBadge';

export default function SimpleAdmin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const authenticate = () => {
    if (password === 'ludomusic_admin_2024_secure' || password === 'admin123') {
      setIsAuthenticated(true);
      loadUsers();
    } else {
      setMessage('Senha incorreta');
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Adicionar timestamp para evitar cache
      const response = await fetch(`/api/players-ranking?limit=1000&t=${Date.now()}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.players || []);
        setMessage(`${data.players?.length || 0} usuários carregados`);
      } else {
        setMessage('Erro ao carregar usuários');
      }
    } catch (error) {
      setMessage('Erro de conexão');
    }
    setLoading(false);
  };

  // Função removida - não necessária em produção

  const debugStorage = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/storage-info');
      const result = await response.json();

      if (response.ok && result.success) {
        setMessage(`🔍 Local: ${result.storage.users.count} usuários, ${result.storage.profiles.count} perfis, ${result.storage.sessions.count} sessões.`);
      } else {
        setMessage(`❌ Erro no debug local: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      setMessage(`❌ Erro: ${error.message}`);
    }
    setLoading(false);
  };

  const debugKV = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/kv-info', {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });
      const result = await response.json();

      if (response.ok && result.success) {
        console.log('🔍 DEBUG - Vercel KV:', result.kv);
        setMessage(`🔍 KV: ${result.kv.userKeys} usuários, ${result.kv.profileKeys} perfis, ${result.kv.totalKeys} chaves totais. Veja o console!`);
      } else {
        setMessage(`❌ Erro no debug KV: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      setMessage(`❌ Erro: ${error.message}`);
    }
    setLoading(false);
  };

  const deleteUser = async (username) => {
    if (!confirm(`Deletar usuário ${username}? Esta ação não pode ser desfeita!`)) {
      return;
    }

    console.log(`🗑️ Tentando deletar usuário: ${username}`);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${password}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });

      const result = await response.json();
      console.log('🔍 Resultado da deleção:', result);

      if (response.ok && result.success) {
        setMessage(`✅ Usuário ${username} deletado! Chaves: ${result.deletedKeys?.join(', ') || 'nenhuma'}`);
        console.log('✅ Chaves deletadas:', result.deletedKeys);

        // Aguardar um pouco antes de recarregar
        setTimeout(() => {
          console.log('🔄 Recarregando lista de usuários...');
          loadUsers();
        }, 1000);
      } else {
        setMessage(`❌ Erro ao deletar: ${result.error || 'Erro desconhecido'}`);
        console.error('❌ Erro na deleção:', result);
      }
    } catch (error) {
      setMessage(`❌ Erro: ${error.message}`);
      console.error('❌ Erro na requisição:', error);
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin Simples - LudoMusic</title>
        </Head>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#1a1a1a',
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            background: '#2a2a2a',
            padding: '40px',
            borderRadius: '10px',
            textAlign: 'center',
            minWidth: '300px'
          }}>
            <h1>🔐 Admin Simples</h1>
            <input
              type="password"
              placeholder="Senha de admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && authenticate()}
              style={{
                width: '100%',
                padding: '10px',
                margin: '10px 0',
                borderRadius: '5px',
                border: '1px solid #555',
                background: '#333',
                color: 'white',
                fontSize: '16px'
              }}
            />
            <button
              onClick={authenticate}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Entrar
            </button>
            {message && (
              <div style={{
                marginTop: '10px',
                color: message.includes('incorreta') ? '#ff4444' : '#44ff44'
              }}>
                {message}
              </div>
            )}
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
              Senhas válidas: ludomusic_admin_2024_secure ou admin123
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Simples - Gerenciar Usuários</title>
      </Head>
      <div style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '20px',
            background: '#2a2a2a',
            borderRadius: '10px'
          }}>
            <h1>👥 Gerenciar Usuários</h1>
            <div>
              <button
                onClick={loadUsers}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                {loading ? '⟳ Carregando...' : '🔄 Atualizar'}
              </button>
              <button
                onClick={clearAllLocalData}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                🧹 Limpar Tudo
              </button>
              <button
                onClick={debugStorage}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#9C27B0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                🔍 Local
              </button>
              <button
                onClick={debugKV}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#673AB7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                🔍 KV
              </button>
              <button
                onClick={() => setIsAuthenticated(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🚪 Sair
              </button>
            </div>
          </div>

          {message && (
            <div style={{
              padding: '10px',
              marginBottom: '20px',
              backgroundColor: message.includes('❌') ? '#4a1a1a' : '#1a4a1a',
              border: `1px solid ${message.includes('❌') ? '#ff4444' : '#44ff44'}`,
              borderRadius: '5px'
            }}>
              {message}
            </div>
          )}

          <div style={{
            background: '#2a2a2a',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '15px 20px',
              backgroundColor: '#333',
              borderBottom: '1px solid #555',
              fontWeight: 'bold'
            }}>
              Total de usuários: {users.length}
            </div>

            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {users.map((user, index) => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 20px',
                    borderBottom: index < users.length - 1 ? '1px solid #333' : 'none',
                    backgroundColor: user.isCurrentUser ? '#1a3a1a' : 'transparent'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{user.displayName}</span>
                      <UserBadge badgeId={user.selectedBadge} size="small" />
                      {user.isCurrentUser && (
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: '#4CAF50',
                          borderRadius: '10px',
                          fontSize: '10px'
                        }}>
                          VOCÊ
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      @{user.username} • Nível {user.level} • {user.xp} XP
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {user.stats.totalGames} jogos • {user.stats.totalWins} vitórias • {user.stats.winRate}% taxa
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', marginRight: '15px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        #{user.rank}
                      </div>
                    </div>

                    {!user.isCurrentUser && (
                      <button
                        onClick={() => deleteUser(user.username)}
                        disabled={loading}
                        style={{
                          padding: '8px 15px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Deletar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {users.length === 0 && !loading && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#888'
            }}>
              Nenhum usuário encontrado. Clique em "Atualizar" para carregar.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
