import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { cachedFetch } from '../utils/api-cache';
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
        // Usar cache para reduzir chamadas de API
        const response = await cachedFetch('/api/global-stats');
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
        // Fallback para dados iniciais
        setStats({
          totalGames: 0,
          averageAttempts: 3.2
        });
        setLoading(false);
      }
    };

    fetchGlobalStats();

    // Atualizar a cada 30 minutos (reduzido de 5 minutos)
    const interval = setInterval(fetchGlobalStats, 30 * 60 * 1000);

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
