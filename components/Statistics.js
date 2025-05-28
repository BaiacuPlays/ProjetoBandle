import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getGlobalStatistics } from '../config/api';
import styles from '../styles/Statistics.module.css';

const Statistics = ({ isOpen, onClose, gameResult = null, isInfiniteMode = false }) => {
  const { t, isClient } = useLanguage();
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    attemptDistribution: [0, 0, 0, 0, 0, 0], // Tentativas 1-6
    winPercentage: 0,
    averageAttempts: 0
  });

  const [infiniteStats, setInfiniteStats] = useState({
    bestRecord: 0,
    currentStreak: 0,
    totalSongsCompleted: 0,
    totalGamesPlayed: 0
  });

  // Carregar estatísticas do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isInfiniteMode) {
        loadInfiniteStatistics();
      } else {
        loadStatistics();
      }
    }
  }, [isOpen, isInfiniteMode]);

  // Salvar resultado do jogo atual quando o modal abrir
  useEffect(() => {
    if (isOpen && gameResult && !isInfiniteMode) {
      saveGameResult(gameResult);
      loadStatistics(); // Recarregar após salvar
    }
  }, [isOpen, gameResult, isInfiniteMode]);

  useEffect(() => {
    async function fetchGlobalStats() {
      const globalStats = await getGlobalStatistics();
      setStats((prevStats) => ({
        ...prevStats,
        totalGames: globalStats.totalGames,
        wins: globalStats.wins,
        losses: globalStats.losses,
        winPercentage: ((globalStats.wins / globalStats.totalGames) * 100).toFixed(2)
      }));
    }

    fetchGlobalStats();
  }, []);

  const loadStatistics = () => {
    try {
      const savedStats = localStorage.getItem('ludomusic_statistics');
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        setStats(parsedStats);
      }
    } catch (error) {
      // Erro ao carregar estatísticas
    }
  };

  const loadInfiniteStatistics = () => {
    try {
      const savedStats = localStorage.getItem('ludomusic_infinite_stats');
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        setInfiniteStats({
          bestRecord: parsedStats.bestRecord || 0,
          currentStreak: parsedStats.currentStreak || 0,
          totalSongsCompleted: parsedStats.usedSongs ? parsedStats.usedSongs.length : 0,
          totalGamesPlayed: parsedStats.totalGamesPlayed || 0
        });
      }
    } catch (error) {
      // Erro ao carregar estatísticas do modo infinito
    }
  };

  const saveGameResult = (result) => {
    try {
      const savedStats = localStorage.getItem('ludomusic_statistics');
      let currentStats = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        attemptDistribution: [0, 0, 0, 0, 0, 0],
        winPercentage: 0,
        averageAttempts: 0
      };

      if (savedStats) {
        currentStats = JSON.parse(savedStats);
      }

      // Atualizar estatísticas com o novo resultado
      currentStats.totalGames++;

      if (result.won) {
        currentStats.wins++;
        // result.attempts é o número de tentativas usadas (1-6)
        const attemptIndex = Math.min(Math.max(result.attempts - 1, 0), 5);
        currentStats.attemptDistribution[attemptIndex]++;
      } else {
        currentStats.losses++;
      }

      // Calcular percentuais
      currentStats.winPercentage = currentStats.totalGames > 0
        ? Math.round((currentStats.wins / currentStats.totalGames) * 100)
        : 0;

      // Calcular média de tentativas (apenas para vitórias)
      if (currentStats.wins > 0) {
        let totalAttempts = 0;
        currentStats.attemptDistribution.forEach((count, index) => {
          totalAttempts += count * (index + 1);
        });
        currentStats.averageAttempts = Math.round((totalAttempts / currentStats.wins) * 10) / 10;
      }

      localStorage.setItem('ludomusic_statistics', JSON.stringify(currentStats));
    } catch (error) {
      // Erro ao salvar resultado
    }
  };

  const getAttemptPercentage = (attemptIndex) => {
    if (stats.totalGames === 0) return 0;
    return Math.round((stats.attemptDistribution[attemptIndex] / stats.totalGames) * 100);
  };

  const getLossPercentage = () => {
    if (stats.totalGames === 0) return 0;
    return Math.round((stats.losses / stats.totalGames) * 100);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>
            {isInfiniteMode
              ? (isClient ? t('infinite_statistics') : 'Estatísticas do Modo Infinito')
              : (isClient ? t('statistics') : 'Estatísticas')
            }
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {isInfiniteMode ? (
            /* Estatísticas do modo infinito */
            <div className={styles.generalStats}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{infiniteStats.bestRecord}</div>
                <div className={styles.statLabel}>
                  {isClient ? t('best_record') : 'Melhor Recorde'}
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{infiniteStats.currentStreak}</div>
                <div className={styles.statLabel}>
                  {isClient ? t('current_streak') : 'Sequência Atual'}
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{infiniteStats.totalSongsCompleted}</div>
                <div className={styles.statLabel}>
                  {isClient ? t('songs_completed') : 'Músicas Completadas'}
                </div>
              </div>
            </div>
          ) : (
            /* Estatísticas do modo normal */
            <div className={styles.generalStats}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{stats.totalGames}</div>
                <div className={styles.statLabel}>
                  {isClient ? t('total_games') : 'Partidas Jogadas'}
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{stats.winPercentage}%</div>
                <div className={styles.statLabel}>
                  {isClient ? t('win_percentage') : 'Taxa de Vitória'}
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{stats.averageAttempts}</div>
                <div className={styles.statLabel}>
                  {isClient ? t('average_attempts') : 'Média de Tentativas'}
                </div>
              </div>
            </div>
          )}

          {/* Distribuição de tentativas - apenas no modo normal */}
          {!isInfiniteMode && (
            <div className={styles.distributionSection}>
              <h3>{isClient ? t('attempt_distribution') : 'Distribuição de Acertos'}</h3>
              <div className={styles.distributionChart}>
                {[1, 2, 3, 4, 5, 6].map((attempt, index) => {
                  const percentage = getAttemptPercentage(index);
                  const count = stats.attemptDistribution[index];
                  return (
                    <div key={attempt} className={styles.chartRow}>
                      <div className={styles.attemptNumber}>{attempt}</div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className={styles.percentageText}>
                        {percentage}% ({count})
                      </div>
                    </div>
                  );
                })}

                {/* Linha para derrotas */}
                <div className={styles.chartRow}>
                  <div className={styles.attemptNumber}>❌</div>
                  <div className={styles.progressBar}>
                    <div
                      className={`${styles.progressFill} ${styles.lossBar}`}
                      style={{ width: `${getLossPercentage()}%` }}
                    ></div>
                  </div>
                  <div className={styles.percentageText}>
                    {getLossPercentage()}% ({stats.losses})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resultado atual - apenas no modo normal */}
          {!isInfiniteMode && gameResult && (
            <div className={styles.currentResult}>
              <h4>{isClient ? t('current_game') : 'Partida Atual'}</h4>
              <div className={styles.resultText}>
                {gameResult.won
                  ? `${isClient ? t('won_in_attempts') : 'Acertou em'} ${gameResult.attempts} ${gameResult.attempts === 1 ? 'tentativa' : 'tentativas'}!`
                  : `${isClient ? t('lost_game') : 'Não conseguiu acertar'} 😔`
                }
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.continueButton} onClick={onClose}>
            {isClient ? t('continue') : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
