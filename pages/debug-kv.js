import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Debug.module.css';

const KVDebugPage = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug-kv');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      setError('Erro ao buscar informações de debug: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const getStatusColor = (status) => {
    if (status === 'DEFINIDA' || status === 'VÁLIDO' || status === true) return styles.success;
    if (status === 'NÃO DEFINIDA' || status === 'INVÁLIDO' || status === false) return styles.error;
    return styles.warning;
  };

  return (
    <>
      <Head>
        <title>Debug KV - LudoMusic</title>
        <meta name="description" content="Página de diagnóstico do Vercel KV" />
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        background: '#0a0a0a', 
        color: '#fff', 
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px',
            borderBottom: '1px solid #333',
            paddingBottom: '20px'
          }}>
            <h1 style={{ margin: 0, color: '#1DB954' }}>🔍 Debug - Vercel KV</h1>
            <div>
              <button 
                onClick={fetchDebugInfo} 
                disabled={loading}
                style={{
                  background: '#1DB954',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  marginRight: '10px'
                }}
              >
                🔄 {loading ? 'Carregando...' : 'Atualizar'}
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                style={{
                  background: '#333',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🏠 Voltar
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #333',
                borderTop: '3px solid #1DB954',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p>Carregando informações de debug...</p>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid #f44336',
              borderRadius: '8px',
              padding: '20px',
              color: '#f44336',
              marginBottom: '20px'
            }}>
              <h3>❌ Erro</h3>
              <p>{error}</p>
            </div>
          )}

          {debugInfo && (
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Ambiente */}
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ color: '#1DB954', marginTop: 0 }}>🌍 Ambiente</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#222', borderRadius: '4px' }}>
                    <strong>NODE_ENV:</strong>
                    <span className={debugInfo.isDevelopment ? styles.dev : styles.prod}>
                      {debugInfo.environment}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#222', borderRadius: '4px' }}>
                    <strong>Vercel:</strong>
                    <span className={getStatusColor(debugInfo.isVercel)}>
                      {debugInfo.isVercel ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#222', borderRadius: '4px' }}>
                    <strong>Vercel Env:</strong>
                    <span>{debugInfo.vercelEnv}</span>
                  </div>
                </div>
              </div>

              {/* Variáveis de Ambiente */}
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ color: '#1DB954', marginTop: 0 }}>🔑 Variáveis de Ambiente</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(debugInfo.envVars).map(([key, value]) => (
                    <div key={key} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px',
                      background: '#222',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${value === 'DEFINIDA' ? '#4caf50' : '#f44336'}`
                    }}>
                      <strong>{key}:</strong>
                      <span className={getStatusColor(value)}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validação */}
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ color: '#1DB954', marginTop: 0 }}>✅ Validação</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#222', borderRadius: '4px' }}>
                    <strong>Configuração KV:</strong>
                    <span className={getStatusColor(debugInfo.validation.hasKVConfig)}>
                      {debugInfo.validation.hasKVConfig ? 'Válida' : 'Inválida'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#222', borderRadius: '4px' }}>
                    <strong>Formato URL:</strong>
                    <span className={getStatusColor(debugInfo.validation.kvUrlFormat === 'VÁLIDO')}>
                      {debugInfo.validation.kvUrlFormat}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#222', borderRadius: '4px' }}>
                    <strong>Tamanho do Token:</strong>
                    <span>{debugInfo.validation.tokenLength} caracteres</span>
                  </div>
                </div>
              </div>

              {/* Teste de Conexão */}
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ color: '#1DB954', marginTop: 0 }}>🧪 Teste de Conexão KV</h3>
                {debugInfo.kvTest ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                      padding: '10px',
                      background: debugInfo.kvTest.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                      border: `1px solid ${debugInfo.kvTest.success ? '#4caf50' : '#f44336'}`,
                      borderRadius: '4px'
                    }}>
                      <strong>Status:</strong> {debugInfo.kvTest.message}
                    </div>
                    {debugInfo.kvTest.error && (
                      <div style={{
                        padding: '10px',
                        background: 'rgba(244, 67, 54, 0.1)',
                        border: '1px solid #f44336',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem'
                      }}>
                        <strong>Erro:</strong> {debugInfo.kvTest.error}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#ffc107' }}>Teste não executado</div>
                )}
              </div>

              {/* Recomendações */}
              {debugInfo.recommendations && debugInfo.recommendations.length > 0 && (
                <div style={{
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <h3 style={{ color: '#1DB954', marginTop: 0 }}>💡 Recomendações</h3>
                  <ul style={{ color: '#ffc107', paddingLeft: '20px' }}>
                    {debugInfo.recommendations.map((rec, index) => (
                      <li key={index} style={{ marginBottom: '8px', lineHeight: '1.4' }}>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
};

export default KVDebugPage;
