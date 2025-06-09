/**
 * Componente de teste para o sistema de conquistas
 */

import { useState, useEffect } from 'react';
import { useUserProfile } from '../contexts/UserProfileContext';
import { achievements, calculateAchievementProgress, getAchievementStats } from '../data/achievements';
import styles from '../styles/AchievementSystemTest.module.css';

const AchievementSystemTest = () => {
  const { profile, updateStats } = useUserProfile();
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [achievementProgress, setAchievementProgress] = useState({});

  // Calcular progresso de todas as conquistas
  useEffect(() => {
    if (profile && profile.stats) {
      const progress = {};
      Object.values(achievements).forEach(achievement => {
        progress[achievement.id] = {
          progress: calculateAchievementProgress(achievement.id, profile.stats, profile),
          unlocked: profile.achievements?.includes(achievement.id) || false,
          achievement
        };
      });
      setAchievementProgress(progress);
    }
  }, [profile]);

  const addTestResult = (test, success, message, data = null) => {
    const result = {
      id: Date.now() + Math.random(),
      test,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]);
  };

  const simulateGame = async (gameType) => {
    try {
      let gameData;

      switch (gameType) {
        case 'first_game':
          gameData = {
            won: true,
            attempts: 3,
            mode: 'daily',
            playTime: 45,
            song: { title: 'Teste', game: 'Jogo Teste' }
          };
          break;

        case 'perfect_game':
          gameData = {
            won: true,
            attempts: 1,
            mode: 'daily',
            playTime: 15,
            song: { title: 'Perfeito', game: 'Jogo Teste' }
          };
          break;

        case 'speed_game':
          gameData = {
            won: true,
            attempts: 1,
            mode: 'daily',
            playTime: 4, // Menos de 5 segundos
            song: { title: 'Rápido', game: 'Jogo Teste' }
          };
          break;

        case 'infinite_game':
          gameData = {
            won: true,
            attempts: 2,
            mode: 'infinite',
            playTime: 120,
            songsCompleted: 3,
            song: { title: 'Infinito', game: 'Jogo Teste' }
          };
          break;

        case 'multiplayer_game':
          gameData = {
            won: true,
            attempts: 2,
            mode: 'multiplayer',
            playTime: 90,
            points: 150,
            song: { title: 'Multi', game: 'Jogo Teste' }
          };
          break;

        case 'night_game':
          // Simular jogo noturno
          const nightDate = new Date();
          nightDate.setHours(2, 0, 0, 0); // 02:00
          gameData = {
            won: true,
            attempts: 2,
            mode: 'daily',
            playTime: 60,
            song: { title: 'Noturno', game: 'Jogo Teste' },
            gameDate: nightDate.toISOString()
          };
          break;

        default:
          gameData = {
            won: true,
            attempts: 2,
            mode: 'daily',
            playTime: 30,
            song: { title: 'Padrão', game: 'Jogo Teste' }
          };
      }

      const result = await updateStats(gameData);

      addTestResult(
        `Simular ${gameType}`,
        true,
        `Jogo simulado com sucesso`,
        {
          newAchievements: result.newAchievements?.length || 0,
          totalGames: result.stats.totalGames,
          totalAchievements: result.achievements?.length || 0
        }
      );

      return result;

    } catch (error) {
      addTestResult(
        `Simular ${gameType}`,
        false,
        `Erro: ${error.message}`
      );
      throw error;
    }
  };

  const testAchievementProgress = () => {
    try {
      const stats = getAchievementStats(profile.achievements || []);

      addTestResult(
        'Progresso de Conquistas',
        true,
        `${stats.unlocked}/${stats.total} conquistas (${stats.completionPercentage.toFixed(1)}%)`,
        stats
      );

    } catch (error) {
      addTestResult(
        'Progresso de Conquistas',
        false,
        `Erro: ${error.message}`
      );
    }
  };

  const testSpecificAchievement = (achievementId) => {
    try {
      const achievement = achievements[achievementId];
      if (!achievement) {
        throw new Error('Conquista não encontrada');
      }

      const progress = calculateAchievementProgress(achievementId, profile.stats, profile);
      const isUnlocked = profile.achievements?.includes(achievementId) || false;

      addTestResult(
        `Teste: ${achievement.title}`,
        true,
        `Progresso: ${progress.toFixed(1)}% | ${isUnlocked ? 'Desbloqueada' : 'Bloqueada'}`,
        { progress, isUnlocked, achievement }
      );

    } catch (error) {
      addTestResult(
        `Teste: ${achievementId}`,
        false,
        `Erro: ${error.message}`
      );
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    try {
      // Teste 1: Progresso atual
      testAchievementProgress();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Teste 2: Simular jogo básico
      await simulateGame('first_game');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Teste 3: Simular jogo perfeito
      await simulateGame('perfect_game');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Teste 4: Simular jogo rápido
      await simulateGame('speed_game');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Teste 5: Testar conquistas específicas
      testSpecificAchievement('first_game');
      testSpecificAchievement('perfect_first');
      testSpecificAchievement('speed_demon');

      addTestResult('Todos os Testes', true, 'Todos os testes de conquistas concluídos!');

    } catch (error) {
      addTestResult('Todos os Testes', false, `Falha nos testes: ${error.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2>⏳ Carregando sistema de conquistas...</h2>
        </div>
      </div>
    );
  }

  const achievementStats = getAchievementStats(profile.achievements || []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🏆 Teste do Sistema de Conquistas</h2>
        <p>Teste e monitore o funcionamento das conquistas</p>
      </div>

      {/* Estatísticas Gerais */}
      <div className={styles.statsSection}>
        <h3>📊 Estatísticas de Conquistas</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{achievementStats.unlocked}</div>
            <div className={styles.statLabel}>Desbloqueadas</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{achievementStats.total}</div>
            <div className={styles.statLabel}>Total</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{achievementStats.completionPercentage.toFixed(1)}%</div>
            <div className={styles.statLabel}>Progresso</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{achievementStats.rarityStats.legendary}</div>
            <div className={styles.statLabel}>Lendárias</div>
          </div>
        </div>
      </div>

      {/* Controles de Teste */}
      <div className={styles.controlsSection}>
        <h3>🎮 Simulações de Jogo</h3>
        <div className={styles.buttonGrid}>
          <button onClick={() => simulateGame('first_game')} disabled={isRunningTests} className={styles.testButton}>
            🎮 Jogo Básico
          </button>
          <button onClick={() => simulateGame('perfect_game')} disabled={isRunningTests} className={styles.testButton}>
            💎 Jogo Perfeito
          </button>
          <button onClick={() => simulateGame('speed_game')} disabled={isRunningTests} className={styles.testButton}>
            💨 Jogo Rápido
          </button>
          <button onClick={() => simulateGame('infinite_game')} disabled={isRunningTests} className={styles.testButton}>
            ♾️ Modo Infinito
          </button>
          <button onClick={() => simulateGame('multiplayer_game')} disabled={isRunningTests} className={styles.testButton}>
            👥 Multiplayer
          </button>
          <button onClick={() => simulateGame('night_game')} disabled={isRunningTests} className={styles.testButton}>
            🦉 Jogo Noturno
          </button>
        </div>

        <div className={styles.buttonGrid}>
          <button onClick={testAchievementProgress} disabled={isRunningTests} className={styles.testButton}>
            📈 Verificar Progresso
          </button>
          <button onClick={runAllTests} disabled={isRunningTests} className={`${styles.testButton} ${styles.primaryButton}`}>
            {isRunningTests ? '⏳ Executando...' : '🚀 Executar Todos'}
          </button>
        </div>
      </div>

      {/* Progresso das Conquistas */}
      <div className={styles.achievementsSection}>
        <h3>🏆 Progresso das Conquistas</h3>
        <div className={styles.achievementsList}>
          {Object.values(achievementProgress)
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 10)
            .map(({ achievement, progress, unlocked }) => (
              <div
                key={achievement.id}
                className={`${styles.achievementItem} ${unlocked ? styles.unlocked : ''}`}
                onClick={() => testSpecificAchievement(achievement.id)}
              >
                <div className={styles.achievementIcon}>{achievement.icon}</div>
                <div className={styles.achievementInfo}>
                  <div className={styles.achievementTitle}>{achievement.title}</div>
                  <div className={styles.achievementDesc}>{achievement.description}</div>
                  <div className={styles.achievementProgress}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>{progress.toFixed(0)}%</span>
                  </div>
                </div>
                <div className={`${styles.achievementStatus} ${unlocked ? styles.unlocked : ''}`}>
                  {unlocked ? '✅' : '🔒'}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Resultados dos Testes */}
      <div className={styles.resultsSection}>
        <h3>📋 Resultados dos Testes</h3>
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

export default AchievementSystemTest;
