import { useState } from 'react';
import Head from 'next/head';

export default function ResetBaiacuPlaysPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/reset-baiacuplays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminPassword: password
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Conta BaiacuPlays resetada com sucesso! Faça logout e login novamente.');
        setPassword('');
      } else {
        setError(data.error || 'Erro ao resetar conta');
      }
    } catch (err) {
      setError('Erro de conexão: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset BaiacuPlays - LudoMusic</title>
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
            🔄 Reset Conta BaiacuPlays
          </h1>
          
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Senha de Admin:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha de admin"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #555',
                  backgroundColor: '#333',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: loading ? '#666' : '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Resetando...' : 'Resetar Conta BaiacuPlays'}
            </button>
          </form>

          {message && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#27ae60',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#e74c3c',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#333',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <h3>⚠️ O que será resetado:</h3>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>Nível volta para 1</li>
              <li>XP volta para 0</li>
              <li>Todas as estatísticas zeradas</li>
              <li>Conquistas removidas</li>
              <li>Histórico de jogos limpo</li>
              <li>Lista de amigos removida</li>
              <li>Progresso diário resetado</li>
            </ul>
            <p style={{ margin: '0.5rem 0', color: '#f39c12' }}>
              <strong>Nota:</strong> Você precisará fazer logout e login novamente após o reset.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
