import { useState, useEffect } from 'react';
import { getGlobalStatistics } from '../config/api';
import { useLanguage } from '../contexts/LanguageContext';
import ShareButton from './ShareButton';
import styles from '../styles/Statistics.module.css';

// Função para gerar UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const Statistics = ({ isOpen, onClose, gameResult = null, isInfiniteMode = false, isMultiplayerMode = false, currentSong = null }) => {
  const { t, isClient } = useLanguage();
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
              ? (isClient ? t('infinite_statistics') : 'Estatísticas do Modo Infinito')
              : (isClient ? t('statistics') : 'Estatísticas')
            }
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* Estatísticas Globais Simplificadas - APENAS no modo diário */}
          {stats && !isInfiniteMode && !isMultiplayerMode && (
            <div className={styles.simpleStatsSection}>
              <div className={styles.simpleStatsMessage}>
                {isClient
                  ? t('global_stats_message')
                    .replace('{totalPlayers}', stats.totalGames || 0)
                    .replace('{averageAttempts}', stats.averageAttempts || 3.2)
                  : `${stats.totalGames || 0} pessoas já adivinharam / ${stats.averageAttempts || 3.2} tentativas médias`
                }
              </div>
            </div>
          )}

          {/* Resultado da Partida Atual */}
          {gameResult && (
            <div className={styles.gameResultSection}>
              <div className={styles.resultText}>
                {gameResult.won
                  ? `${isClient ? t('won_in_attempts') : 'Acertou em'} ${gameResult.attempts} ${gameResult.attempts === 1 ? 'tentativa' : 'tentativas'}!`
                  : `${isClient ? t('lost_game') : 'Não conseguiu acertar'} 😔`
                }
              </div>
            </div>
          )}

          {/* Estatísticas do Modo Infinito */}
          {isInfiniteMode && infiniteStats && (
            <div className={styles.infiniteStatsSection}>
              <div className={styles.infiniteStatsGrid}>
                <div className={styles.infiniteStatItem}>
                  <span className={styles.infiniteStatNumber}>{infiniteStats.bestRecord}</span>
                  <span className={styles.infiniteStatLabel}>
                    {isClient ? t('best_record') : 'Melhor Recorde'}
                  </span>
                </div>
                <div className={styles.infiniteStatItem}>
                  <span className={styles.infiniteStatNumber}>{infiniteStats.currentStreak}</span>
                  <span className={styles.infiniteStatLabel}>
                    {isClient ? t('current_streak') : 'Sequência Atual'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerButtons}>
            <ShareButton
              gameResult={gameResult}
              currentSong={currentSong}
              isInfiniteMode={isInfiniteMode}
              infiniteStats={infiniteStats}
            />
            <button className={styles.continueButton} onClick={onClose}>
              {isClient ? t('continue') : 'Continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
