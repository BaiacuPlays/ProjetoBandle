import { useState } from 'react';
import Head from 'next/head';

export default function AdminCheck() {
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Digite a senha de admin');
      return;
    }

    if (!username) {
      setError('Digite o username para verificar');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/check-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminPassword: password,
          username: username
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Erro desconhecido');
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
        <title>Admin Check Account - LudoMusic</title>
      </Head>
      
      <div style={{ 
        padding: '20px', 
        maxWidth: '800px', 
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>🔍 Admin Check Account - LudoMusic</h1>
        <p>Esta página permite verificar se uma conta foi completamente deletada do sistema.</p>
        
        <form onSubmit={handleCheck}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
              Senha de Admin:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha de admin"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                marginBottom: '10px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>
              Username para verificar:
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite o username da conta"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#ccc' : '#007bff',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Verificando...' : '🔍 Verificar Conta'}
          </button>
        </form>

        {error && (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            color: '#721c24',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '20px'
          }}>
            <strong>❌ Erro:</strong> {error}
          </div>
        )}

        {result && (
          <div style={{
            background: result.accountExists ? '#f8d7da' : '#d4edda',
            border: result.accountExists ? '1px solid #f5c6cb' : '1px solid #c3e6cb',
            color: result.accountExists ? '#721c24' : '#155724',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '20px'
          }}>
            <h3>{result.summary}</h3>
            
            <div style={{ marginTop: '15px' }}>
              <strong>Detalhes da verificação:</strong>
              <ul style={{ marginTop: '10px' }}>
                <li>Username: <code>{result.username}</code></li>
                <li>User ID: <code>{result.userId}</code></li>
                <li>Dados do usuário: {result.checks.user ? '❌ Existe' : '✅ Deletado'}</li>
                <li>Perfil: {result.checks.profile ? '❌ Existe' : '✅ Deletado'}</li>
                <li>Sessões ativas: {result.checks.sessions.length > 0 ? `❌ ${result.checks.sessions.length} encontradas` : '✅ Nenhuma'}</li>
                <li>Lista de amigos: {result.checks.friends ? '❌ Existe' : '✅ Deletada'}</li>
                <li>Solicitações recebidas: {result.checks.friendRequests ? '❌ Existe' : '✅ Deletadas'}</li>
                <li>Solicitações enviadas: {result.checks.sentRequests ? '❌ Existe' : '✅ Deletadas'}</li>
                
                {result.checks.dailyData && (
                  <li>Dados diários: {result.checks.dailyData.length > 0 ? `❌ ${result.checks.dailyData.length} encontrados` : '✅ Nenhum'}</li>
                )}
                
                {result.checks.appearsInOtherFriendsLists && (
                  <li>Aparece em listas de amigos: {result.checks.appearsInOtherFriendsLists.length > 0 ? `❌ ${result.checks.appearsInOtherFriendsLists.length} listas` : '✅ Nenhuma'}</li>
                )}
                
                {result.checks.appearsInOtherRequests && (
                  <li>Aparece em solicitações: {result.checks.appearsInOtherRequests.length > 0 ? `❌ ${result.checks.appearsInOtherRequests.length} listas` : '✅ Nenhuma'}</li>
                )}
              </ul>
              
              {result.checks.sessions && result.checks.sessions.length > 0 && (
                <details style={{ marginTop: '10px' }}>
                  <summary>Ver sessões encontradas</summary>
                  <ul style={{ marginTop: '5px' }}>
                    {result.checks.sessions.map((session, index) => (
                      <li key={index}><code>{session}</code></li>
                    ))}
                  </ul>
                </details>
              )}
              
              {result.checks.dailyData && result.checks.dailyData.length > 0 && (
                <details style={{ marginTop: '10px' }}>
                  <summary>Ver dados diários encontrados</summary>
                  <ul style={{ marginTop: '5px' }}>
                    {result.checks.dailyData.map((data, index) => (
                      <li key={index}><code>{data}</code></li>
                    ))}
                  </ul>
                </details>
              )}
              
              {result.checks.appearsInOtherFriendsLists && result.checks.appearsInOtherFriendsLists.length > 0 && (
                <details style={{ marginTop: '10px' }}>
                  <summary>Ver listas de amigos onde aparece</summary>
                  <ul style={{ marginTop: '5px' }}>
                    {result.checks.appearsInOtherFriendsLists.map((list, index) => (
                      <li key={index}><code>{list}</code></li>
                    ))}
                  </ul>
                </details>
              )}
              
              {result.checks.appearsInOtherRequests && result.checks.appearsInOtherRequests.length > 0 && (
                <details style={{ marginTop: '10px' }}>
                  <summary>Ver listas de solicitações onde aparece</summary>
                  <ul style={{ marginTop: '5px' }}>
                    {result.checks.appearsInOtherRequests.map((req, index) => (
                      <li key={index}><code>{req}</code></li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
