import React, { useState, useEffect } from 'react';
import styles from '../styles/Debug.module.css';

const KVDebugPanel = ({ isOpen, onClose }) => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug-kv');
      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      setError('Erro ao buscar informações de debug: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDebugInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>🔍 Debug - Vercel KV</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.content}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Carregando informações de debug...</p>
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              <h3>❌ Erro</h3>
              <p>{error}</p>
            </div>
          )}
          
          {debugInfo && (
            <div className={styles.debugInfo}>
              <div className={styles.section}>
                <h3>🌍 Ambiente</h3>
                <div className={styles.infoGrid}>
                  <div>
                    <strong>NODE_ENV:</strong> 
                    <span className={debugInfo.isDevelopment ? styles.dev : styles.prod}>
                      {debugInfo.environment}
                    </span>
                  </div>
                  <div>
                    <strong>Vercel:</strong> 
                    <span className={debugInfo.isVercel ? styles.success : styles.warning}>
                      {debugInfo.isVercel ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div>
                    <strong>Vercel Env:</strong> {debugInfo.vercelEnv}
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3>🔑 Variáveis de Ambiente</h3>
                <div className={styles.envVars}>
                  {Object.entries(debugInfo.envVars).map(([key, value]) => (
                    <div key={key} className={styles.envVar}>
                      <strong>{key}:</strong>
                      <span className={value === 'DEFINIDA' ? styles.success : styles.error}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h3>✅ Validação</h3>
                <div className={styles.validation}>
                  <div>
                    <strong>Configuração KV:</strong>
                    <span className={debugInfo.validation.hasKVConfig ? styles.success : styles.error}>
                      {debugInfo.validation.hasKVConfig ? 'Válida' : 'Inválida'}
                    </span>
                  </div>
                  <div>
                    <strong>Formato URL:</strong>
                    <span className={debugInfo.validation.kvUrlFormat === 'VÁLIDO' ? styles.success : styles.error}>
                      {debugInfo.validation.kvUrlFormat}
                    </span>
                  </div>
                  <div>
                    <strong>Tamanho do Token:</strong> {debugInfo.validation.tokenLength} caracteres
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3>🧪 Teste de Conexão KV</h3>
                {debugInfo.kvTest ? (
                  <div className={styles.kvTest}>
                    <div className={debugInfo.kvTest.success ? styles.success : styles.error}>
                      <strong>Status:</strong> {debugInfo.kvTest.message}
                    </div>
                    {debugInfo.kvTest.error && (
                      <div className={styles.errorDetails}>
                        <strong>Erro:</strong> {debugInfo.kvTest.error}
                      </div>
                    )}
                    {debugInfo.kvTest.testPassed !== undefined && (
                      <div>
                        <strong>Teste de Leitura/Escrita:</strong> 
                        <span className={debugInfo.kvTest.testPassed ? styles.success : styles.error}>
                          {debugInfo.kvTest.testPassed ? 'Passou' : 'Falhou'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.warning}>Teste não executado</div>
                )}
              </div>

              {debugInfo.recommendations && debugInfo.recommendations.length > 0 && (
                <div className={styles.section}>
                  <h3>💡 Recomendações</h3>
                  <ul className={styles.recommendations}>
                    {debugInfo.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <button onClick={fetchDebugInfo} className={styles.refreshButton} disabled={loading}>
            🔄 Atualizar
          </button>
          <button onClick={onClose} className={styles.closeButton}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default KVDebugPanel;
