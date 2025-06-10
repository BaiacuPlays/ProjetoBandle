// Componente de ranking de jogadores
import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaTrophy, FaGamepad, FaFire, FaMedal, FaUser, FaCrown, FaStar } from 'react-icons/fa';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import SimpleUserAvatar from './SimpleUserAvatar';
import UserBadge from './UserBadge';
import styles from '../styles/PlayersRanking.module.css';

const PlayersRanking = ({ isOpen, onClose, onViewProfile }) => {
  useModalScrollLock(isOpen);

  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('xp');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Carregar jogadores
  const loadPlayers = async (search = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        sortBy,
        limit: '100',
        search: search.trim()
      });

      const response = await fetch(`/api/players-ranking?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao carregar ranking');
      }
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar jogadores quando modal abre ou sortBy muda
  useEffect(() => {
    if (isOpen) {
      loadPlayers(searchTerm);
    }
  }, [isOpen, sortBy]);

  // Busca com debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (isOpen) {
        loadPlayers(searchTerm);
      }
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchTerm]);

  // Função para obter ícone do ranking
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <FaCrown style={{ color: '#FFD700' }} />;
      case 2: return <FaMedal style={{ color: '#C0C0C0' }} />;
      case 3: return <FaMedal style={{ color: '#CD7F32' }} />;
      default: return <span className={styles.rankNumber}>#{rank}</span>;
    }
  };

  // Função para obter cor do nível
  const getLevelColor = (level) => {
    if (level >= 50) return '#FFD700'; // Dourado
    if (level >= 25) return '#9C27B0'; // Roxo
    if (level >= 10) return '#2196F3'; // Azul
    if (level >= 5) return '#4CAF50'; // Verde
    return '#FFC107'; // Amarelo
  };

  // Opções de ordenação
  const sortOptions = [
    { value: 'xp', label: 'XP Total', icon: <FaStar /> },
    { value: 'level', label: 'Nível', icon: <FaCrown /> },
    { value: 'wins', label: 'Vitórias', icon: <FaTrophy /> },
    { value: 'winRate', label: 'Taxa de Vitória', icon: <FaFire /> },
    { value: 'streak', label: 'Melhor Sequência', icon: <FaGamepad /> },
    { value: 'games', label: 'Jogos Totais', icon: <FaGamepad /> },
    { value: 'achievements', label: 'Conquistas', icon: <FaMedal /> },
    { value: 'recent', label: 'Mais Ativos', icon: <FaUser /> }
  ];

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2>🏆 Ranking de Jogadores</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Controles */}
        <div className={styles.controls}>
          {/* Busca */}
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar jogador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Ordenação */}
          <div className={styles.sortContainer}>
            <label>Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conteúdo */}
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Carregando ranking...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>❌ {error}</p>
              <button onClick={() => loadPlayers(searchTerm)} className={styles.retryButton}>
                Tentar Novamente
              </button>
            </div>
          ) : players.length === 0 ? (
            <div className={styles.empty}>
              <p>Nenhum jogador encontrado</p>
            </div>
          ) : (
            <div className={styles.playersList}>
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`${styles.playerItem} ${player.isCurrentUser ? styles.currentUser : ''}`}
                  onClick={() => onViewProfile && onViewProfile(player.id, player.username)}
                >
                  {/* Ranking */}
                  <div className={styles.rankContainer}>
                    {getRankIcon(player.rank)}
                  </div>

                  {/* Avatar e Info */}
                  <div className={styles.playerInfo}>
                    <SimpleUserAvatar
                      avatar={player.avatar}
                      size="medium"
                    />
                    <div className={styles.playerDetails}>
                      <div className={styles.playerName}>
                        {player.displayName}
                        <UserBadge badgeId={player.selectedBadge} size="small" />
                        {player.isCurrentUser && <span className={styles.youBadge}>Você</span>}
                      </div>
                      <div className={styles.playerUsername}>@{player.username}</div>
                      {player.bio && (
                        <div className={styles.playerBio}>{player.bio}</div>
                      )}
                    </div>
                  </div>

                  {/* Nível */}
                  <div className={styles.levelContainer}>
                    <div
                      className={styles.levelBadge}
                      style={{ backgroundColor: getLevelColor(player.level) }}
                    >
                      Nível {player.level}
                    </div>
                    <div className={styles.xpText}>{player.xp} XP</div>
                  </div>

                  {/* Estatísticas */}
                  <div className={styles.statsContainer}>
                    <div className={styles.statItem}>
                      <FaTrophy className={styles.statIcon} />
                      <span>{player.stats.totalWins}</span>
                    </div>
                    <div className={styles.statItem}>
                      <FaGamepad className={styles.statIcon} />
                      <span>{player.stats.totalGames}</span>
                    </div>
                    <div className={styles.statItem}>
                      <FaFire className={styles.statIcon} />
                      <span>{player.stats.winRate}%</span>
                    </div>
                    <div className={styles.statItem}>
                      <FaMedal className={styles.statIcon} />
                      <span>{player.achievementsCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p>Total de jogadores: {players.length}</p>
          <p>Clique em um jogador para ver o perfil completo</p>
        </div>
      </div>
    </div>
  );
};

export default PlayersRanking;
