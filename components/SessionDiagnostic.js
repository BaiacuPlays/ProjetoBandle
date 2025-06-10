// Componente para diagnosticar problemas de sessão
import React, { useState, useEffect } from 'react';
import { FaSync, FaCheckCircle, FaExclamationTriangle, FaTimes, FaUser, FaCookie } from 'react-icons/fa';

const SessionDiagnostic = ({ onClose }) => {
  const [diagnostic, setDiagnostic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localData, setLocalData] = useState(null);

  const checkLocalStorage = () => {
    try {
      const data = {
        sessionToken: localStorage.getItem('ludomusic_session_token'),
        userData: localStorage.getItem('ludomusic_user_data'),
        lastCheck: localStorage.getItem('ludomusic_last_check'),
        cookies: document.cookie.includes('ludomusic_session_token'),
        storageSize: Object.keys(localStorage).filter(key => key.startsWith('ludomusic')).length
      };
      setLocalData(data);
      return data;
    } catch (error) {
      console.error('Erro ao verificar localStorage:', error);
      return null;
    }
  };

  const runDiagnostic = async () => {
    setLoading(true);
    
    try {
      // Verificar dados locais primeiro
      const localInfo = checkLocalStorage();
      
      if (!localInfo?.sessionToken) {
        setDiagnostic({
          success: false,
          error: 'Nenhum token de sessão encontrado',
          local: localInfo,
          suggestions: [
            'Faça login novamente',
            'Verifique se os cookies estão habilitados',
            'Limpe o cache do navegador se necessário'
          ]
        });
        return;
      }

      // Diagnosticar no servidor
      const response = await fetch('/api/debug/session-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: localInfo.sessionToken })
      });
      
      const data = await response.json();
      
      setDiagnostic({
        ...data,
        local: localInfo
      });

    } catch (error) {
      setDiagnostic({
        success: false,
        error: error.message,
        local: checkLocalStorage(),
        suggestions: ['Verifique sua conexão com a internet', 'Tente novamente em alguns segundos']
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    try {
      // Limpar localStorage
      localStorage.removeItem('ludomusic_session_token');
      localStorage.removeItem('ludomusic_user_data');
      localStorage.removeItem('ludomusic_last_check');

      // Limpar cookies
      document.cookie = 'ludomusic_session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'ludomusic_user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      alert('Sessão limpa! Recarregue a página e faça login novamente.');
      window.location.reload();
    } catch (error) {
      alert('Erro ao limpar sessão: ' + error.message);
    }
  };

  useEffect(() => {
    checkLocalStorage();
    runDiagnostic();
  }, []);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3>🔍 Diagnóstico de Sessão</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <FaTimes />
          </button>
        </div>
        
        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>
              <FaSync className="fa-spin" />
              <p>Analisando sessão...</p>
            </div>
          ) : (
            <>
              {/* Dados Locais */}
              <div style={styles.section}>
                <h4>📱 Dados Locais</h4>
                {localData && (
                  <div style={styles.dataGrid}>
                    <div style={styles.dataItem}>
                      <span>Token de Sessão:</span>
                      <span style={localData.sessionToken ? styles.success : styles.error}>
                        {localData.sessionToken ? 'Presente' : 'Ausente'}
                      </span>
                    </div>
                    <div style={styles.dataItem}>
                      <span>Dados do Usuário:</span>
                      <span style={localData.userData ? styles.success : styles.warning}>
                        {localData.userData ? 'Presente' : 'Ausente'}
                      </span>
                    </div>
                    <div style={styles.dataItem}>
                      <span>Cookies:</span>
                      <span style={localData.cookies ? styles.success : styles.warning}>
                        {localData.cookies ? 'Presente' : 'Ausente'}
                      </span>
                    </div>
                    <div style={styles.dataItem}>
                      <span>Itens LudoMusic:</span>
                      <span style={styles.info}>
                        {localData.storageSize} itens
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Diagnóstico do Servidor */}
              {diagnostic && (
                <div style={styles.section}>
                  <h4>🖥️ Validação do Servidor</h4>
                  {diagnostic.diagnostic ? (
                    <div style={styles.dataGrid}>
                      <div style={styles.dataItem}>
                        <span>Status:</span>
                        <span style={diagnostic.diagnostic.validation?.success ? styles.success : styles.error}>
                          {diagnostic.diagnostic.validation?.success ? 'Válido' : 'Inválido'}
                        </span>
                      </div>
                      {diagnostic.diagnostic.validation?.username && (
                        <div style={styles.dataItem}>
                          <span>Usuário:</span>
                          <span style={styles.success}>
                            {diagnostic.diagnostic.validation.username}
                          </span>
                        </div>
                      )}
                      <div style={styles.dataItem}>
                        <span>Formato do Token:</span>
                        <span style={styles.info}>
                          {diagnostic.diagnostic.token?.tokenFormat || 'Desconhecido'}
                        </span>
                      </div>
                      <div style={styles.dataItem}>
                        <span>Tamanho do Token:</span>
                        <span style={styles.info}>
                          {diagnostic.diagnostic.token?.tokenLength || 0} caracteres
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p style={styles.error}>Erro: {diagnostic.error}</p>
                  )}
                </div>
              )}

              {/* Sugestões */}
              {diagnostic?.diagnostic?.suggestions && (
                <div style={styles.section}>
                  <h4>💡 Sugestões</h4>
                  <ul style={styles.suggestions}>
                    {diagnostic.diagnostic.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ações */}
              <div style={styles.actions}>
                <button 
                  onClick={runDiagnostic} 
                  disabled={loading}
                  style={styles.button}
                >
                  <FaSync /> {loading ? 'Analisando...' : 'Executar Novamente'}
                </button>
                
                <button 
                  onClick={clearSession} 
                  style={{...styles.button, backgroundColor: '#f44336'}}
                >
                  <FaTimes /> Limpar Sessão
                </button>
              </div>

              {/* Informações Técnicas */}
              {diagnostic?.diagnostic?.environment && (
                <div style={styles.technical}>
                  <details>
                    <summary>🔧 Informações Técnicas</summary>
                    <pre style={styles.code}>
                      {JSON.stringify(diagnostic.diagnostic, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </>
          )}
        </div>
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
    maxWidth: '700px',
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
  loading: {
    textAlign: 'center',
    padding: '40px'
  },
  section: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px'
  },
  dataGrid: {
    display: 'grid',
    gap: '8px'
  },
  dataItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    backgroundColor: '#333',
    borderRadius: '4px'
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
  suggestions: {
    margin: '10px 0',
    paddingLeft: '20px'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
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
  technical: {
    marginTop: '20px',
    fontSize: '12px'
  },
  code: {
    backgroundColor: '#000',
    padding: '10px',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '11px',
    maxHeight: '200px'
  }
};

export default SessionDiagnostic;
