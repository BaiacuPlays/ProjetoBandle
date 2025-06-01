import { useState } from 'react';
import Head from 'next/head';

export default function AdminReset() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!password) {
      setError('Digite a senha de admin');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/reset-all-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminPassword: password,
          action: 'reset'
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

  const handleDeleteAll = async () => {
    if (!password) {
      setError('Digite a senha de admin primeiro');
      return;
    }

    const confirmed = window.confirm(
      '⚠️ ATENÇÃO: Esta ação irá DELETAR COMPLETAMENTE todas as contas!\n\n' +
      'Isso inclui:\n' +
      '- Todas as contas de usuário\n' +
      '- Todos os perfis\n' +
      '- Todas as sessões\n' +
      '- Todos os dados de amigos\n' +
      '- Todos os dados de progresso\n\n' +
      'Esta ação é IRREVERSÍVEL!\n\n' +
      'Tem certeza que deseja continuar?'
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/reset-all-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminPassword: password,
          action: 'delete'
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
        <title>Admin Reset - LudoMusic</title>
      </Head>
      
      <div style={{ 
        padding: '20px', 
        maxWidth: '600px', 
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>🔧 Admin Reset - LudoMusic</h1>
        <p>Esta página permite resetar todos os dados dos jogadores (XP, níveis, conquistas, etc.)</p>
        
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>⚠️ ATENÇÃO:</strong> Esta ação irá:
          <ul>
            <li>Resetar XP e níveis de todos os jogadores para 0/1</li>
            <li>Limpar todas as conquistas e badges</li>
            <li>Resetar todas as estatísticas de jogo</li>
            <li>Limpar progresso diário</li>
            <li>Remover salas de multiplayer ativas</li>
          </ul>
          <strong>Dados mantidos:</strong> username, email, senha, foto de perfil, bio, data de entrada, amigos
        </div>

        <div style={{
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>🗑️ NOVA OPÇÃO - DELETAR TODAS AS CONTAS:</strong>
          <p>Para deletar COMPLETAMENTE todas as contas (não apenas resetar), use o botão vermelho abaixo.</p>
          <p><strong>CUIDADO:</strong> Esta ação remove TUDO - contas, perfis, amigos, sessões, etc.</p>
        </div>

        <form onSubmit={handleReset}>
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
                fontSize: '16px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#ccc' : '#28a745',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginRight: '10px'
            }}
          >
            {loading ? '🔄 Resetando...' : '🔄 Resetar Dados dos Jogadores'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleDeleteAll}
            style={{
              background: loading ? '#ccc' : '#dc3545',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Deletando...' : '🗑️ DELETAR TODAS AS CONTAS'}
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
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            color: '#155724',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '20px'
          }}>
            <strong>✅ Sucesso!</strong> {result.message}
            
            <div style={{ marginTop: '10px' }}>
              <strong>Detalhes:</strong>
              <ul>
                {result.details.usersReset && (
                  <li>Usuários resetados: {result.details.usersReset.length}</li>
                )}
                {result.details.usersDeleted !== undefined && (
                  <li>Usuários deletados: {result.details.usersDeleted}</li>
                )}
                {result.details.profilesDeleted !== undefined && (
                  <li>Perfis deletados: {result.details.profilesDeleted}</li>
                )}
                {result.details.sessionsDeleted !== undefined && (
                  <li>Sessões deletadas: {result.details.sessionsDeleted}</li>
                )}
                {result.details.friendDataDeleted !== undefined && (
                  <li>Dados de amigos deletados: {result.details.friendDataDeleted}</li>
                )}
                {result.details.dailyRecordsDeleted !== undefined && (
                  <li>Registros diários removidos: {result.details.dailyRecordsDeleted}</li>
                )}
                {result.details.roomsDeleted !== undefined && (
                  <li>Salas removidas: {result.details.roomsDeleted}</li>
                )}
              </ul>

              {result.details.usersReset && result.details.usersReset.length > 0 && (
                <details style={{ marginTop: '10px' }}>
                  <summary>Ver usuários resetados</summary>
                  <ul style={{ marginTop: '5px' }}>
                    {result.details.usersReset.map((user, index) => (
                      <li key={index}>{user}</li>
                    ))}
                  </ul>
                </details>
              )}

              {result.details.accountsDeleted && result.details.accountsDeleted.length > 0 && (
                <details style={{ marginTop: '10px' }}>
                  <summary>Ver contas deletadas</summary>
                  <ul style={{ marginTop: '5px' }}>
                    {result.details.accountsDeleted.map((account, index) => (
                      <li key={index}>{account}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
          <strong>Dica:</strong> A senha de admin está no código fonte da API. 
          Após o reset, todos os jogadores precisarão fazer login novamente para ver os dados atualizados.
        </div>
      </div>
    </>
  );
}
