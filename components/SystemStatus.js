// Componente para mostrar status do sistema e permitir limpeza de cache
import React, { useState, useEffect } from 'react';
import { FaSync, FaTrash, FaCheckCircle, FaExclamationTriangle, FaTimes, FaUser } from 'react-icons/fa';
import SessionDiagnostic from './SessionDiagnostic';

const SystemStatus = ({ onClose }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSessionDiagnostic, setShowSessionDiagnostic] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/debug/clear-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      });

      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    }
  };

  const clearCache = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/debug/clear-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache' })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('✅ Cache limpo com sucesso!');
        await fetchStatus();
      } else {
        setMessage('❌ Erro ao limpar cache');
      }
    } catch (error) {
      setMessage('❌ Erro na requisição');
      console.error('Erro ao limpar cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostic = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/debug/clear-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full-diagnostic' })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('✅ Diagnóstico completo realizado!');
        setStatus(data.diagnostic.status);
      } else {
        setMessage('❌ Erro no diagnóstico');
      }
    } catch (error) {
      setMessage('❌ Erro na requisição');
      console.error('Erro no diagnóstico:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (!status) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.header}>
            <h3>🔧 Status do Sistema</h3>
            <button onClick={onClose} style={styles.closeButton}>
              <FaTimes />
            </button>
          </div>
          <div style={styles.content}>
            <p>Carregando status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3>🔧 Status do Sistema</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <FaTimes />
          </button>
        </div>

        <div style={styles.content}>
          <div style={styles.statusGrid}>
            <div style={styles.statusItem}>
              <span>Ambiente:</span>
              <span style={status.isDevelopment ? styles.warning : styles.success}>
                {status.isDevelopment ? 'Desenvolvimento' : 'Produção'}
              </span>
            </div>

            <div style={styles.statusItem}>
              <span>KV Configurado:</span>
              <span style={status.hasKVConfig ? styles.success : styles.error}>
                {status.hasKVConfig ? 'Sim' : 'Não'}
              </span>
            </div>

            <div style={styles.statusItem}>
              <span>Usando KV:</span>
              <span style={status.shouldUseKV ? styles.success : styles.warning}>
                {status.shouldUseKV ? 'Sim' : 'Fallback Local'}
              </span>
            </div>

            <div style={styles.statusItem}>
              <span>Cache Local:</span>
              <span style={styles.info}>
                {status.cacheSize} itens
              </span>
            </div>

            <div style={styles.statusItem}>
              <span>Rate Limiter:</span>
              <span style={styles.info}>
                {status.rateLimiterSize} chaves
              </span>
            </div>
          </div>

          {message && (
            <div style={styles.message}>
              {message}
            </div>
          )}

          <div style={styles.actions}>
            <button
              onClick={clearCache}
              disabled={loading}
              style={styles.button}
            >
              <FaTrash /> {loading ? 'Limpando...' : 'Limpar Cache'}
            </button>

            <button
              onClick={runDiagnostic}
              disabled={loading}
              style={styles.button}
            >
              <FaSync /> {loading ? 'Executando...' : 'Diagnóstico Completo'}
            </button>

            <button
              onClick={fetchStatus}
              disabled={loading}
              style={styles.button}
            >
              <FaCheckCircle /> Atualizar Status
            </button>

            <button
              onClick={() => setShowSessionDiagnostic(true)}
              disabled={loading}
              style={{...styles.button, backgroundColor: '#2196F3'}}
            >
              <FaUser /> Diagnóstico de Sessão
            </button>
          </div>

          <div style={styles.help}>
            <h4>💡 Dicas:</h4>
            <ul>
              <li>Se estiver com problemas de performance, tente "Limpar Cache"</li>
              <li>Se o KV não estiver funcionando, use "Diagnóstico Completo"</li>
              <li>Em desenvolvimento, é normal usar Fallback Local</li>
              <li>Atualize a página após limpar o cache</li>
            </ul>
          </div>
        </div>

        {/* Modal de Diagnóstico de Sessão */}
        {showSessionDiagnostic && (
          <SessionDiagnostic onClose={() => setShowSessionDiagnostic(false)} />
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '0',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    border: '2px solid #333'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #333',
    backgroundColor: '#2a2a2a'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '5px'
  },
  content: {
    padding: '20px'
  },
  statusGrid: {
    display: 'grid',
    gap: '10px',
    marginBottom: '20px'
  },
  statusItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px'
  },
  success: {
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  warning: {
    color: '#FF9800',
    fontWeight: 'bold'
  },
  error: {
    color: '#f44336',
    fontWeight: 'bold'
  },
  info: {
    color: '#2196F3',
    fontWeight: 'bold'
  },
  message: {
    padding: '10px',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '20px'
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '14px'
  },
  help: {
    backgroundColor: '#2a2a2a',
    padding: '15px',
    borderRadius: '6px',
    fontSize: '14px'
  }
};

export default SystemStatus;
