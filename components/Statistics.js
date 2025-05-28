import { useState, useEffect } from 'react';
import { getGlobalStatistics } from '../config/api';
import styles from '../styles/Statistics.module.css';

// Função para gerar UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const Statistics = ({ isOpen, onClose, gameResult = null, isInfiniteMode = false }) => {
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    attemptDistribution: [0, 0, 0, 0, 0, 0],
    winPercentage: 0,
    averageAttempts: 0
  });

  const [infiniteStats, setInfiniteStats] = useState({
    bestRecord: 0,
    currentStreak: 0,
    totalSongsCompleted: 0,
    totalGamesPlayed: 0
  });

  // Obter ou criar o identificador anônimo do usuário
  function getUserId() {
    if (typeof window === 'undefined') return null;
    let id = localStorage.getItem('ludomusic_userid');
    if (!id) {
      id = generateUUID();
      localStorage.setItem('ludomusic_userid', id);
    }
    return id;
  }

  // Carregar estatísticas do backend (modo diário)
  const loadStatistics = async () => {
    const userid = getUserId();
    if (!userid) return;
    try {
      const res = await fetch(`/api/statistics?userid=${userid}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      // erro ao buscar estatísticas
    }
  };

  // Salvar resultado do jogo atual no backend (modo diário)
  const saveGameResult = async (result) => {
    const userid = getUserId();
    if (!userid) return;
    try {
      await fetch(`/api/statistics?userid=${userid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          won: result.won,
          attempts: result.attempts
        })
      });
    } catch (error) {
      // erro ao salvar estatísticas
    }
  };

  // Carregar estatísticas do localStorage (modo infinito)
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
      // erro ao carregar estatísticas do modo infinito
    }
  };

  // Efeito para carregar estatísticas ao abrir o modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isInfiniteMode) {
        loadInfiniteStatistics();
      } else {
        loadStatistics();
      }
    }
  }, [isOpen, isInfiniteMode]);

  // Efeito para salvar resultado do jogo atual ao abrir o modal (modo diário)
  useEffect(() => {
    if (isOpen && gameResult && !isInfiniteMode) {
      saveGameResult(gameResult).then(() => loadStatistics());
    }
  }, [isOpen, gameResult, isInfiniteMode]);

  // Estatísticas globais (opcional, se quiser manter)
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
              ? 'Estatísticas do Modo Infinito'
              : 'Estatísticas'
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
                <div className={styles.statLabel}>Melhor Recorde</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{infiniteStats.currentStreak}</div>
                <div className={styles.statLabel}>Sequência Atual</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{infiniteStats.totalSongsCompleted}</div>
                <div className={styles.statLabel}>Músicas Completadas</div>
              </div>
            </div>
          ) : (
            /* Estatísticas do modo normal */
            <div className={styles.generalStats}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{stats.totalGames}</div>
                <div className={styles.statLabel}>Partidas Jogadas</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{stats.winPercentage}%</div>
                <div className={styles.statLabel}>Taxa de Vitória</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{stats.averageAttempts}</div>
                <div className={styles.statLabel}>Média de Tentativas</div>
              </div>
            </div>
          )}

          {/* Distribuição de tentativas - apenas no modo normal */}
          {!isInfiniteMode && (
            <div className={styles.distributionSection}>
              <h3>Distribuição de Acertos</h3>
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
              <h4>Partida Atual</h4>
              <div className={styles.resultText}>
                {gameResult.won
                  ? `Acertou em ${gameResult.attempts} ${gameResult.attempts === 1 ? 'tentativa' : 'tentativas'}!`
                  : 'Não conseguiu acertar 😔'
                }
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.continueButton} onClick={onClose}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
