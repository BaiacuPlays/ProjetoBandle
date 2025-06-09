import React, { useState } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/StatsDiagnostic.module.css';

const StatsDiagnostic = ({ isOpen, onClose }) => {
  const { profile } = useProfile() || {};
  const { isAuthenticated, userId } = useAuth();
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [repairResult, setRepairResult] = useState(null);

  // Executar diagnóstico
  const runDiagnostic = async () => {
    if (!isAuthenticated || !userId) {
      alert('Você precisa estar logado para executar o diagnóstico');
      return;
    }

    setIsRunning(true);
    setDiagnosticResult(null);
    setRepairResult(null);

    try {
      const response = await fetch('/api/debug/stats-integrity', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ludomusic_session_token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setDiagnosticResult(result);
      } else {
        const error = await response.json();
        alert(`Erro no diagnóstico: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao executar diagnóstico:', error);
      alert('Erro de rede ao executar diagnóstico');
    } finally {
      setIsRunning(false);
    }
  };

  // Executar reparo
  const runRepair = async () => {
    if (!isAuthenticated || !userId) {
      alert('Você precisa estar logado para executar o reparo');
      return;
    }

    if (!confirm('Tem certeza que deseja reparar as estatísticas? Um backup será criado automaticamente.')) {
      return;
    }

    setIsRunning(true);
    setRepairResult(null);

    try {
      const response = await fetch('/api/repair-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ludomusic_session_token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setRepairResult(result);

        if (result.success) {
          alert('Estatísticas reparadas com sucesso! Recarregue a página para ver as mudanças.');
        } else {
          alert(`Reparo falhou. Problemas restantes: ${result.remainingIssues.join(', ')}`);
        }
      } else {
        const error = await response.json();
        alert(`Erro no reparo: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao executar reparo:', error);
      alert('Erro de rede ao executar reparo');
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>🔧 Diagnóstico de Estatísticas</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Informações do Perfil</h3>
            <div className={styles.info}>
              <p><strong>Usuário:</strong> {profile?.username || 'N/A'}</p>
              <p><strong>Level:</strong> {profile?.level || 'N/A'}</p>
              <p><strong>XP:</strong> {profile?.xp || 'N/A'}</p>
              <p><strong>Total de Jogos:</strong> {profile?.stats?.totalGames || 'N/A'}</p>
              <p><strong>Vitórias:</strong> {profile?.stats?.wins || 'N/A'}</p>
              <p><strong>Derrotas:</strong> {profile?.stats?.losses || 'N/A'}</p>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.diagnosticButton}
              onClick={runDiagnostic}
              disabled={isRunning || !isAuthenticated}
            >
              {isRunning ? '🔍 Executando...' : '🔍 Executar Diagnóstico'}
            </button>

            {diagnosticResult && !diagnosticResult.profileIntegrity.isValid && (
              <button
                className={styles.repairButton}
                onClick={runRepair}
                disabled={isRunning}
              >
                {isRunning ? '🔧 Reparando...' : '🔧 Reparar Estatísticas'}
              </button>
            )}
          </div>

          {diagnosticResult && (
            <div className={styles.results}>
              <h3>Resultado do Diagnóstico</h3>

              <div className={styles.resultSection}>
                <h4>Integridade do Perfil</h4>
                <div className={`${styles.status} ${diagnosticResult.profileIntegrity.isValid ? styles.success : styles.error}`}>
                  {diagnosticResult.profileIntegrity.isValid ? '✅ Íntegro' : '❌ Problemas Detectados'}
                </div>
                {!diagnosticResult.profileIntegrity.isValid && (
                  <ul className={styles.issues}>
                    {diagnosticResult.profileIntegrity.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={styles.resultSection}>
                <h4>Integridade das Estatísticas</h4>
                <div className={`${styles.status} ${diagnosticResult.statsIntegrity.isValid ? styles.success : styles.error}`}>
                  {diagnosticResult.statsIntegrity.isValid ? '✅ Íntegras' : '❌ Problemas Detectados'}
                </div>
                {!diagnosticResult.statsIntegrity.isValid && (
                  <ul className={styles.issues}>
                    {diagnosticResult.statsIntegrity.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={styles.resultSection}>
                <h4>Consistência dos Dados</h4>
                <div className={`${styles.status} ${diagnosticResult.consistencyCheck.isValid ? styles.success : styles.error}`}>
                  {diagnosticResult.consistencyCheck.isValid ? '✅ Consistente' : '❌ Inconsistências Detectadas'}
                </div>
                {!diagnosticResult.consistencyCheck.isValid && (
                  <ul className={styles.issues}>
                    {diagnosticResult.consistencyCheck.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={styles.resultSection}>
                <h4>Recomendações</h4>
                <ul className={styles.recommendations}>
                  {diagnosticResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {repairResult && (
            <div className={styles.repairResults}>
              <h3>Resultado do Reparo</h3>

              <div className={styles.resultSection}>
                <div className={`${styles.status} ${repairResult.success ? styles.success : styles.error}`}>
                  {repairResult.success ? '✅ Reparo Bem-sucedido' : '❌ Reparo Falhou'}
                </div>

                <div className={styles.repairInfo}>
                  <p><strong>Problemas Encontrados:</strong> {repairResult.issuesFound.length}</p>
                  <p><strong>Problemas Corrigidos:</strong> {repairResult.issuesFixed}</p>
                  <p><strong>Backup Criado:</strong> {repairResult.backupKey}</p>
                </div>

                {repairResult.remainingIssues.length > 0 && (
                  <div>
                    <h4>Problemas Restantes:</h4>
                    <ul className={styles.issues}>
                      {repairResult.remainingIssues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.warning}>
            <p><strong>⚠️ Aviso:</strong> Este é um diagnóstico técnico. Use apenas se estiver enfrentando problemas com suas estatísticas.</p>
            <p>Um backup automático será criado antes de qualquer reparo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDiagnostic;
