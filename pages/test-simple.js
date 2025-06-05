import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function TestSimple() {
  const [message, setMessage] = useState('Carregando...');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testAuth = async () => {
      try {
        const token = localStorage.getItem('ludomusic_session_token');
        if (!token) {
          setMessage('Não logado');
          return;
        }

        const response = await fetch('/api/auth', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setMessage('Logado com sucesso!');
        } else {
          setMessage('Erro de autenticação');
        }
      } catch (err) {
        setError(err.message);
        setMessage('Erro na requisição');
      }
    };

    testAuth();
  }, []);

  const testProfile = async () => {
    try {
      const token = localStorage.getItem('ludomusic_session_token');
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Perfil carregado: ' + JSON.stringify(data, null, 2));
      } else {
        const errorData = await response.json();
        setMessage('Erro no perfil: ' + errorData.error);
      }
    } catch (err) {
      setMessage('Erro na requisição do perfil: ' + err.message);
    }
  };

  return (
    <>
      <Head>
        <title>Teste Simples - Ludomusic</title>
      </Head>
      
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        <h1>🧪 Teste Simples do Ludomusic</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h2>Status:</h2>
          <p>{message}</p>
        </div>

        {user && (
          <div style={{ marginBottom: '20px' }}>
            <h2>Usuário:</h2>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: '20px', color: 'red' }}>
            <h2>Erro:</h2>
            <p>{error}</p>
          </div>
        )}

        <div>
          <button onClick={testProfile} style={{ padding: '10px 20px', margin: '10px' }}>
            Testar Perfil
          </button>
          
          <button onClick={() => window.location.href = '/'} style={{ padding: '10px 20px', margin: '10px' }}>
            Ir para Site Principal
          </button>
        </div>

        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f0f0' }}>
          <h3>🔧 Debug Info:</h3>
          <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
          <p><strong>Token:</strong> {typeof window !== 'undefined' && localStorage.getItem('ludomusic_session_token') ? 'PRESENTE' : 'AUSENTE'}</p>
          <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
        </div>
      </div>
    </>
  );
}
