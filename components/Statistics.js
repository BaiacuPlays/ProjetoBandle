import { useState, useEffect } from 'react';
import { getGlobalStatistics } from '../config/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import ShareButton from './ShareButton';
import ActionButtons from './ActionButtons';
import styles from '../styles/Statistics.module.css';

// Função para gerar UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const Statistics = ({ isOpen, onClose, gameResult = null, isInfiniteMode = false, isMultiplayerMode = false, currentSong = null, infiniteCurrentStreak = null }) => {
  const { t, isClient } = useLanguage();
  const { profile, isLoading: profileLoading } = useProfile() || {};
  const { isAuthenticated } = useAuth();

  // Bloquear/desbloquear scroll da página
  useModalScrollLock(isOpen);

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

        // Verificar integridade dos dados recebidos
        const integrityCheck = verifyStatsIntegrity(data);
        if (!integrityCheck.isValid) {
          console.warn('⚠️ [STATS] Estatísticas com problemas de integridade:', integrityCheck.issues);

          // Tentar reparar automaticamente
          const repairedStats = repairStatsData(data);
          setStats(repairedStats);

          // Log do reparo
          console.log('🔧 [STATS] Estatísticas reparadas automaticamente');
        } else {
          setStats(data);
        }
      }
    } catch (error) {
      console.error('❌ [STATS] Erro ao buscar estatísticas:', error);
    }
  };

  // Função para verificar integridade das estatísticas
  const verifyStatsIntegrity = (statsData) => {
    const issues = [];

    // Verificar campos obrigatórios
    const requiredFields = ['totalGames', 'wins', 'losses', 'winPercentage', 'averageAttempts'];
    requiredFields.forEach(field => {
      if (typeof statsData[field] !== 'number') {
        issues.push(`Campo ${field} ausente ou inválido`);
      }
    });

    // Verificar consistência matemática
    if (statsData.totalGames !== (statsData.wins + statsData.losses)) {
      issues.push('Total de jogos não confere com wins + losses');
    }

    // Verificar valores negativos
    if (statsData.totalGames < 0 || statsData.wins < 0 || statsData.losses < 0) {
      issues.push('Valores negativos detectados');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  };

  // Função para reparar dados de estatísticas
  const repairStatsData = (statsData) => {
    const repaired = { ...statsData };

    // Garantir valores padrão
    repaired.totalGames = Math.max(0, repaired.totalGames || 0);
    repaired.wins = Math.max(0, repaired.wins || 0);
    repaired.losses = Math.max(0, repaired.losses || 0);
    repaired.winPercentage = repaired.winPercentage || 0;
    repaired.averageAttempts = repaired.averageAttempts || 0;
    repaired.attemptDistribution = repaired.attemptDistribution || [0, 0, 0, 0, 0, 0];

    // Corrigir total de jogos
    if (repaired.totalGames !== (repaired.wins + repaired.losses)) {
      repaired.totalGames = repaired.wins + repaired.losses;
    }

    // Recalcular percentual de vitória
    if (repaired.totalGames > 0) {
      repaired.winPercentage = Math.round((repaired.wins / repaired.totalGames) * 100);
    } else {
      repaired.winPercentage = 0;
    }

    return repaired;
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
          // CORREÇÃO: Usar a prop infiniteCurrentStreak se disponível (quando o jogo acabou de terminar)
          // caso contrário usar o valor salvo no localStorage
          currentStreak: infiniteCurrentStreak !== null ? infiniteCurrentStreak : (parsedStats.currentStreak || 0),
          totalSongsCompleted: parsedStats.usedSongs ? parsedStats.usedSongs.length : 0,
          totalGamesPlayed: parsedStats.totalGamesPlayed || 0
        });
      }
    } catch (error) {
      // erro ao carregar estatísticas do modo infinito
    }
  };

  // Carregar estatísticas do perfil do usuário (se autenticado)
  const loadProfileStatistics = () => {
    if (!isAuthenticated || !profile) return;

    try {
      // Usar estatísticas do perfil para modo diário
      if (!isInfiniteMode && profile.stats) {
        const profileStats = profile.stats;

        // Calcular média de tentativas corretamente
        let averageAttempts = 0;
        if (profileStats.attemptDistribution && profileStats.wins > 0) {
          let totalAttempts = 0;
          profileStats.attemptDistribution.forEach((count, index) => {
            totalAttempts += count * (index + 1);
          });
          averageAttempts = totalAttempts / profileStats.wins;
        }

        setStats({
          totalGames: profileStats.totalGames || 0,
          wins: profileStats.wins || 0,
          losses: profileStats.losses || 0,
          attemptDistribution: profileStats.attemptDistribution || [0, 0, 0, 0, 0, 0],
          winPercentage: profileStats.winRate || 0,
          averageAttempts: averageAttempts || 0
        });
      }

      // Usar estatísticas do perfil para modo infinito
      if (isInfiniteMode) {
        const infiniteData = profile.stats?.modeStats?.infinite;
        console.log('📊 Carregando estatísticas do modo infinito do perfil:', infiniteData);

        // Se não existem dados do modo infinito, inicializar com zeros
        if (!infiniteData) {
          console.log('📊 Inicializando estatísticas do modo infinito com valores padrão');
          setInfiniteStats({
            bestRecord: 0,
            currentStreak: 0,
            totalSongsCompleted: 0,
            totalGamesPlayed: 0
          });
        } else {
          setInfiniteStats({
            bestRecord: infiniteData.bestStreak || 0,
            currentStreak: infiniteData.currentStreak || 0,
            totalSongsCompleted: infiniteData.totalSongsCompleted || 0,
            totalGamesPlayed: infiniteData.games || 0
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas do perfil:', error);
    }
  };

  // Efeito para carregar estatísticas ao abrir o modal
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      if (isAuthenticated && profile) {
        // Se usuário está autenticado, usar estatísticas do perfil
        loadProfileStatistics();
      } else {
        // Fallback para sistema antigo (usuários anônimos)
        if (isInfiniteMode) {
          loadInfiniteStatistics();
        } else {
          loadStatistics();
        }
      }
    }
  }, [isOpen, isInfiniteMode, isAuthenticated, profile, infiniteCurrentStreak]);

  // Efeito para salvar resultado do jogo atual ao abrir o modal (modo diário)
  useEffect(() => {
    if (isOpen && gameResult && !isInfiniteMode) {
      if (isAuthenticated && profile) {
        // Para usuários autenticados, as estatísticas já são salvas pelo UserProfileContext
        // Apenas recarregar as estatísticas do perfil
        loadProfileStatistics();
      } else {
        // Para usuários anônimos, usar sistema antigo
        saveGameResult(gameResult).then(() => loadStatistics());
      }
    }
  }, [isOpen, gameResult, isInfiniteMode, isAuthenticated, profile]);

  // Estatísticas globais (apenas para exibição geral, não sobrescrever dados do usuário)
  const [globalStats, setGlobalStats] = useState({
    totalGames: 0,
    averageAttempts: 3
  });

  useEffect(() => {
    async function fetchGlobalStats() {
      try {
        const stats = await getGlobalStatistics();
        setGlobalStats({
          totalGames: stats.totalGames || 0,
          averageAttempts: stats.averageAttempts || 3
        });
      } catch (error) {
        // Silent error handling
      }
    }

    if (!isInfiniteMode && !isMultiplayerMode) {
      fetchGlobalStats();
    }
  }, [isInfiniteMode, isMultiplayerMode]);

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
          {!isInfiniteMode && !isMultiplayerMode && (
            <div className={styles.simpleStatsSection}>
              <div className={styles.simpleStatsMessage}>
                {isClient
                  ? t('global_stats_message')
                    .replace('{totalPlayers}', globalStats.totalGames || 0)
                    .replace('{averageAttempts}', Math.round(globalStats.averageAttempts || 3))
                  : `${globalStats.totalGames || 0} pessoas já adivinharam hoje / ${Math.round(globalStats.averageAttempts || 3)} tentativas médias`
                }
              </div>
            </div>
          )}

          {/* Estatísticas Pessoais do Usuário - APENAS para usuários autenticados */}
          {isAuthenticated && profile && !isInfiniteMode && !isMultiplayerMode && (
            <div className={styles.personalStatsSection}>
              <h3>Suas Estatísticas</h3>
              <div className={styles.personalStatsGrid}>
                <div className={styles.personalStatItem}>
                  <span className={styles.personalStatNumber}>{stats.totalGames}</span>
                  <span className={styles.personalStatLabel}>Jogos Totais</span>
                </div>
                <div className={styles.personalStatItem}>
                  <span className={styles.personalStatNumber}>{stats.wins}</span>
                  <span className={styles.personalStatLabel}>Vitórias</span>
                </div>
                <div className={styles.personalStatItem}>
                  <span className={styles.personalStatNumber}>{Math.round(stats.winPercentage)}%</span>
                  <span className={styles.personalStatLabel}>Taxa de Vitória</span>
                </div>
                <div className={styles.personalStatItem}>
                  <span className={styles.personalStatNumber}>{(stats.averageAttempts || 0).toFixed(1)}</span>
                  <span className={styles.personalStatLabel}>Média de Tentativas</span>
                </div>
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

        {/* Botões de Ação - Aparecem após acertar */}
        {gameResult && gameResult.won && (
          <ActionButtons
            gameResult={gameResult}
            currentSong={currentSong}
            isInfiniteMode={isInfiniteMode}
            infiniteStats={infiniteStats}
          />
        )}

        <div className={styles.footer}>
          <div className={styles.footerButtons}>
            {/* Manter o ShareButton original como fallback */}
            {(!gameResult || !gameResult.won) && (
              <ShareButton
                gameResult={gameResult}
                currentSong={currentSong}
                isInfiniteMode={isInfiniteMode}
                infiniteStats={infiniteStats}
              />
            )}
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
