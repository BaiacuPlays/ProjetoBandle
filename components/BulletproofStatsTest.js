/**
 * Componente de teste para o sistema de estatísticas à prova de balas
 */

import { useState } from 'react';
import { useBulletproofStats } from '../hooks/useBulletproofStats';
import styles from '../styles/BulletproofStatsTest.module.css';

const BulletproofStatsTest = () => {
  const {
    profile,
    isLoading,
    error,
    lastUpdate,
    loadProfile,
    updateGameStats,
    forceRecalculate,
    validateStats,
    repairStats,
    resetProfile,
    isReady
  } = useBulletproofStats();

  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addTestResult = (test, success, message, data = null) => {
    const result = {
      id: Date.now(),
      test,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Manter últimos 10
  };

  const runTest = async (testName, testFunction) => {
    try {
      console.log(`🧪 [TEST] Executando: ${testName}`);
      const result = await testFunction();
      addTestResult(testName, true, 'Sucesso', result);
      return result;
    } catch (error) {
      console.error(`❌ [TEST] Falha em ${testName}:`, error);
      addTestResult(testName, false, error.message);
      throw error;
    }
  };

  const testLoadProfile = async () => {
    await runTest('Carregar Perfil', async () => {
      await loadProfile();
      if (!profile) throw new Error('Perfil não carregado');
      return { username: profile.username, totalGames: profile.stats.totalGames };
    });
  };

  const testUpdateStats = async () => {
    await runTest('Atualizar Estatísticas', async () => {
      const gameData = {
        won: true,
        attempts: 2,
        mode: 'daily',
        playTime: 120,
        song: { title: 'Teste', game: 'Jogo Teste' }
      };
      
      const result = await updateGameStats(gameData);
      return { 
        totalGames: result.stats.totalGames,
        wins: result.stats.wins,
        lastGame: result.gameHistory[0]
      };
    });
  };

  const testValidation = async () => {
    await runTest('Validar Estatísticas', async () => {
      const validation = await validateStats();
      return {
        isValid: validation.isValid,
        errors: validation.errors
      };
    });
  };

  const testRecalculate = async () => {
    await runTest('Forçar Recálculo', async () => {
      const result = await forceRecalculate();
      return {
        success: result.success,
        totalGames: result.profile.stats.totalGames,
        backupKey: result.backupKey
      };
    });
  };

  const testRepair = async () => {
    await runTest('Reparar Estatísticas', async () => {
      const result = await repairStats();
      return {
        success: result.success,
        changes: result.changes ? 'Sim' : 'Nenhuma',
        backupKey: result.backupKey
      };
    });
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    try {
      await testLoadProfile();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testValidation();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testUpdateStats();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testRecalculate();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testRepair();
      
      addTestResult('Todos os Testes', true, 'Todos os testes passaram!');
      
    } catch (error) {
      addTestResult('Todos os Testes', false, `Falha nos testes: ${error.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🛡️ Sistema de Estatísticas À Prova de Balas</h2>
        <p>Teste e monitore o sistema de estatísticas robusto</p>
      </div>

      {/* Status do Sistema */}
      <div className={styles.statusSection}>
        <h3>Status do Sistema</h3>
        <div className={styles.statusGrid}>
          <div className={`${styles.statusCard} ${isReady ? styles.success : styles.warning}`}>
            <span className={styles.statusIcon}>{isReady ? '✅' : '⏳'}</span>
            <div>
              <div className={styles.statusLabel}>Sistema</div>
              <div className={styles.statusValue}>{isReady ? 'Pronto' : 'Carregando'}</div>
            </div>
          </div>
          
          <div className={`${styles.statusCard} ${profile ? styles.success : styles.error}`}>
            <span className={styles.statusIcon}>{profile ? '👤' : '❌'}</span>
            <div>
              <div className={styles.statusLabel}>Perfil</div>
              <div className={styles.statusValue}>{profile ? profile.username : 'Não carregado'}</div>
            </div>
          </div>
          
          <div className={`${styles.statusCard} ${error ? styles.error : styles.success}`}>
            <span className={styles.statusIcon}>{error ? '⚠️' : '✅'}</span>
            <div>
              <div className={styles.statusLabel}>Erro</div>
              <div className={styles.statusValue}>{error || 'Nenhum'}</div>
            </div>
          </div>
          
          <div className={styles.statusCard}>
            <span className={styles.statusIcon}>🕒</span>
            <div>
              <div className={styles.statusLabel}>Última Atualização</div>
              <div className={styles.statusValue}>
                {lastUpdate ? formatDate(lastUpdate) : 'Nunca'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas Atuais */}
      {profile && (
        <div className={styles.statsSection}>
          <h3>Estatísticas Atuais</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{profile.stats.totalGames}</div>
              <div className={styles.statLabel}>Jogos Totais</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{profile.stats.wins}</div>
              <div className={styles.statLabel}>Vitórias</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{profile.stats.winRate.toFixed(1)}%</div>
              <div className={styles.statLabel}>Taxa de Vitória</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{profile.stats.bestStreak}</div>
              <div className={styles.statLabel}>Melhor Sequência</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{profile.gameHistory?.length || 0}</div>
              <div className={styles.statLabel}>Histórico</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{profile.achievements?.length || 0}</div>
              <div className={styles.statLabel}>Conquistas</div>
            </div>
          </div>
        </div>
      )}

      {/* Controles de Teste */}
      <div className={styles.controlsSection}>
        <h3>Controles de Teste</h3>
        <div className={styles.buttonGrid}>
          <button 
            onClick={testLoadProfile}
            disabled={isRunningTests}
            className={styles.testButton}
          >
            🔄 Carregar Perfil
          </button>
          
          <button 
            onClick={testUpdateStats}
            disabled={isRunningTests || !profile}
            className={styles.testButton}
          >
            🎮 Simular Jogo
          </button>
          
          <button 
            onClick={testValidation}
            disabled={isRunningTests || !profile}
            className={styles.testButton}
          >
            ✅ Validar Stats
          </button>
          
          <button 
            onClick={testRecalculate}
            disabled={isRunningTests || !profile}
            className={styles.testButton}
          >
            🔄 Recalcular
          </button>
          
          <button 
            onClick={testRepair}
            disabled={isRunningTests || !profile}
            className={styles.testButton}
          >
            🔧 Reparar
          </button>
          
          <button 
            onClick={runAllTests}
            disabled={isRunningTests}
            className={`${styles.testButton} ${styles.primaryButton}`}
          >
            {isRunningTests ? '⏳ Executando...' : '🚀 Executar Todos'}
          </button>
        </div>
      </div>

      {/* Resultados dos Testes */}
      <div className={styles.resultsSection}>
        <h3>Resultados dos Testes</h3>
        {testResults.length === 0 ? (
          <p className={styles.noResults}>Nenhum teste executado ainda</p>
        ) : (
          <div className={styles.resultsList}>
            {testResults.map(result => (
              <div 
                key={result.id}
                className={`${styles.resultItem} ${result.success ? styles.success : styles.error}`}
              >
                <div className={styles.resultHeader}>
                  <span className={styles.resultIcon}>
                    {result.success ? '✅' : '❌'}
                  </span>
                  <span className={styles.resultTest}>{result.test}</span>
                  <span className={styles.resultTime}>
                    {formatDate(result.timestamp)}
                  </span>
                </div>
                <div className={styles.resultMessage}>{result.message}</div>
                {result.data && (
                  <div className={styles.resultData}>
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulletproofStatsTest;
