import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from '../styles/GlobalStats.module.css';

const GlobalStats = ({ showInDailyMode = true }) => {
  const { t, isClient } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Se showInDailyMode for false, não renderizar
  if (!showInDailyMode) {
    return null;
  }

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        // Tentar buscar dados reais da API
        const response = await fetch('/api/global-stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalGames: data.totalGames || 0,
            averageAttempts: data.averageAttempts || 3.2
          });
        } else {
          // Fallback para dados iniciais
          setStats({
            totalGames: 0,
            averageAttempts: 3.2
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar estatísticas globais:', error);
        // Fallback para dados iniciais
        setStats({
          totalGames: 0,
          averageAttempts: 3.2
        });
        setLoading(false);
      }
    };

    fetchGlobalStats();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchGlobalStats, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return null;
  }

  return (
    <div className={styles.globalStatsContainer}>
      <div className={styles.globalStatsMessage}>
        {stats.totalGames > 0 ? (
          isClient
            ? t('global_stats_message')
              .replace('{totalPlayers}', stats.totalGames)
              .replace('{averageAttempts}', Math.round(stats.averageAttempts))
            : `${stats.totalGames} pessoas já adivinharam hoje / ${Math.round(stats.averageAttempts)} tentativas médias`
        ) : (
          isClient
            ? t('no_stats_yet') || 'Seja o primeiro a jogar hoje!'
            : 'Seja o primeiro a jogar hoje!'
        )}
      </div>
    </div>
  );
};

export default GlobalStats;
