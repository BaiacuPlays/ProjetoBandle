import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authDiagnostic from '../utils/authDiagnostic';
import styles from '../styles/AuthDebugPanel.module.css';

const AuthDebugPanel = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, isLoading, runAuthDiagnostic } = useAuth();
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Carregar logs iniciais
      setLogs(authDiagnostic.getLogs(20));
    }
  }, [isOpen]);

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const result = await runAuthDiagnostic();
      setDiagnosticData(result);
      setLogs(authDiagnostic.getLogs(20));
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearLogs = () => {
    authDiagnostic.clearLogs();
    setLogs([]);
  };

  const exportDiagnostic = () => {
    const data = authDiagnostic.exportDiagnostic();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-diagnostic-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🔍 Debug de Autenticação</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {/* Estado Atual */}
          <div className={styles.section}>
            <h3>📊 Estado Atual</h3>
            <div className={styles.statusGrid}>
              <div className={`${styles.statusItem} ${isAuthenticated ? styles.success : styles.error}`}>
                <span>Autenticado:</span>
                <strong>{isAuthenticated ? 'Sim' : 'Não'}</strong>
              </div>
              <div className={`${styles.statusItem} ${isLoading ? styles.warning : styles.success}`}>
                <span>Carregando:</span>
                <strong>{isLoading ? 'Sim' : 'Não'}</strong>
              </div>
              <div className={`${styles.statusItem} ${user ? styles.success : styles.error}`}>
                <span>Usuário:</span>
                <strong>{user ? user.username : 'Nenhum'}</strong>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className={styles.section}>
            <h3>🛠️ Ações</h3>
            <div className={styles.actions}>
              <button 
                className={styles.button}
                onClick={runDiagnostic}
                disabled={isRunning}
              >
                {isRunning ? '🔄 Executando...' : '🔍 Executar Diagnóstico'}
              </button>
              <button className={styles.button} onClick={clearLogs}>
                🗑️ Limpar Logs
              </button>
              <button className={styles.button} onClick={exportDiagnostic}>
                📥 Exportar Dados
              </button>
            </div>
          </div>

          {/* Resultado do Diagnóstico */}
          {diagnosticData && (
            <div className={styles.section}>
              <h3>📋 Resultado do Diagnóstico</h3>
              <div className={styles.diagnosticResult}>
                <div className={styles.resultItem}>
                  <h4>🍪 Cookies</h4>
                  <ul>
                    <li>Token: {diagnosticData.authState.cookies.hasToken ? '✅' : '❌'}</li>
                    <li>Dados: {diagnosticData.authState.cookies.hasUserData ? '✅' : '❌'}</li>
                    <li>Tamanho: {diagnosticData.authState.cookies.tokenLength} chars</li>
                  </ul>
                </div>
                
                <div className={styles.resultItem}>
                  <h4>💾 LocalStorage</h4>
                  <ul>
                    <li>Disponível: {diagnosticData.authState.localStorage.available ? '✅' : '❌'}</li>
                    <li>Token: {diagnosticData.authState.localStorage.hasToken ? '✅' : '❌'}</li>
                    <li>Sincronizado: {diagnosticData.authState.sync.tokensMatch ? '✅' : '❌'}</li>
                  </ul>
                </div>

                <div className={styles.resultItem}>
                  <h4>🔑 Validade do Token</h4>
                  <ul>
                    <li>Válido: {diagnosticData.tokenValidity.valid ? '✅' : '❌'}</li>
                    {!diagnosticData.tokenValidity.valid && (
                      <li>Motivo: {diagnosticData.tokenValidity.reason}</li>
                    )}
                    {diagnosticData.tokenValidity.error && (
                      <li>Erro: {diagnosticData.tokenValidity.error}</li>
                    )}
                  </ul>
                </div>

                {diagnosticData.tokenRenewal && (
                  <div className={styles.resultItem}>
                    <h4>🔄 Renovação</h4>
                    <ul>
                      <li>Sucesso: {diagnosticData.tokenRenewal.success ? '✅' : '❌'}</li>
                      {!diagnosticData.tokenRenewal.success && (
                        <li>Motivo: {diagnosticData.tokenRenewal.reason}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logs */}
          <div className={styles.section}>
            <h3>📝 Logs Recentes ({logs.length})</h3>
            <div className={styles.logs}>
              {logs.length === 0 ? (
                <p className={styles.noLogs}>Nenhum log disponível</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`${styles.logItem} ${styles[log.type]}`}>
                    <div className={styles.logHeader}>
                      <span className={styles.logType}>{log.type.toUpperCase()}</span>
                      <span className={styles.logTime}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={styles.logMessage}>{log.message}</div>
                    {log.data && (
                      <div className={styles.logData}>
                        <pre>{JSON.stringify(log.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPanel;
