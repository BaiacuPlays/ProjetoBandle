// Modal para visualizar perfis públicos de outros usuários - Estilo Steam
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSimpleFriends } from '../contexts/SimpleFriendsContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { getAchievement } from '../data/achievements';
import { getBadge } from '../data/badges';
import { FaTimes, FaUserPlus, FaGamepad, FaTrophy, FaMedal, FaStar, FaMusic, FaClock, FaFire } from 'react-icons/fa';
import styles from '../styles/PublicProfileModal.module.css';

const PublicProfileModal = ({ isOpen, onClose, userId, username, friendData }) => {
  useModalScrollLock(isOpen);
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { sendFriendRequest, friends } = useSimpleFriends();
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar perfil quando modal abrir
  useEffect(() => {
    if (isOpen && (userId || username)) {
      // Se temos dados do amigo, usar eles primeiro
      if (friendData) {
        setProfile({
          id: friendData.id,
          username: friendData.username,
          displayName: friendData.displayName || friendData.username,
          avatar: friendData.avatar || '👤',
          bio: friendData.bio || '',
          level: friendData.level || 1,
          xp: friendData.xp || 0,
          isFriend: true,
          isOnline: friendData.status === 'online',
          lastSeen: friendData.status === 'online' ? 'Agora' : 'Offline',
          // Dados básicos para estatísticas (serão carregados da API se necessário)
          stats: {
            totalGames: 0,
            totalWins: 0,
            totalScore: 0,
            averageScore: 0,
            bestStreak: 0,
            perfectGames: 0
          },
          achievements: {},
          badges: {}
        });
        setIsLoading(false);

        // Carregar dados completos em background
        loadProfile();
      } else {
        loadProfile();
      }
    }
  }, [isOpen, userId, username, friendData]);

  const loadProfile = async () => {
    // Se não temos dados do amigo, mostrar loading
    if (!friendData) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      const params = new URLSearchParams();

      if (userId) params.append('userId', userId);
      if (username) params.append('username', username);

      const headers = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`/api/public-profile?${params.toString()}`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Dados da API public-profile:', data.profile);
        console.log('📊 Estatísticas da API:', data.profile?.stats);

        // Se já temos dados do amigo, mesclar com os dados da API
        if (friendData) {
          setProfile(prevProfile => ({
            ...prevProfile,
            ...data.profile,
            // Manter dados básicos do amigo se a API não retornar
            avatar: data.profile.avatar || prevProfile.avatar,
            bio: data.profile.bio || prevProfile.bio,
            displayName: data.profile.displayName || prevProfile.displayName,
            level: data.profile.level || prevProfile.level,
            xp: data.profile.xp || prevProfile.xp
          }));
        } else {
          setProfile(data.profile);
        }
      } else {
        const errorData = await response.json();
        // Se temos dados do amigo, não mostrar erro
        if (!friendData) {
          setError(errorData.error || 'Erro ao carregar perfil');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil público:', error);
      // Se temos dados do amigo, não mostrar erro
      if (!friendData) {
        setError('Erro de conexão');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!profile || !isAuthenticated) return;

    try {
      await sendFriendRequest({
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        avatar: profile.avatar
      });
      
      // Recarregar perfil para atualizar status de amizade
      loadProfile();
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      alert(error.message || 'Erro ao enviar solicitação de amizade');
    }
  };

  const isAlreadyFriend = profile && friends.some(friend => friend.id === profile.id);
  const canAddFriend = isAuthenticated && profile && !profile.isFriend && !isAlreadyFriend;

  // Função para calcular taxa de vitória
  const getWinRate = () => {
    if (!profile?.stats?.totalGames || profile.stats.totalGames === 0) return 0;
    const wins = profile.stats.totalWins || profile.stats.gamesWon || profile.stats.wins || 0;
    return Math.round((wins / profile.stats.totalGames) * 100);
  };

  const getAchievementRarity = (achievementId) => {
    const achievement = getAchievement(achievementId);
    return achievement?.rarity || 'common';
  };

  // Função para obter cor do nível
  const getLevelColor = (level) => {
    if (level >= 50) return '#FFD700'; // Dourado
    if (level >= 30) return '#C0392B'; // Vermelho
    if (level >= 20) return '#8E44AD'; // Roxo
    if (level >= 10) return '#3498DB'; // Azul
    return '#27AE60'; // Verde
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header com background gradient - estilo Steam */}
        <div className={styles.header}>
          <div className={styles.headerBackground}></div>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>
              {profile ? `${profile.displayName}` : 'Carregando...'}
            </h2>
            {profile && (
              <div className={styles.headerStats}>
                <span className={styles.headerLevel} style={{ color: getLevelColor(profile.level) }}>
                  Nível {profile.level}
                </span>
              </div>
            )}
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.content}>
          {isLoading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Carregando perfil...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>❌ {error}</p>
              <button onClick={loadProfile} className={styles.retryButton}>
                Tentar novamente
              </button>
            </div>
          )}

          {profile && !isLoading && (
            <div className={styles.profileContent}>
              {/* Cabeçalho principal do perfil - estilo Steam */}
              <div className={styles.profileHeader}>
                <div className={styles.avatarContainer}>
                  <div className={styles.avatarFrame}>
                    <div className={styles.avatar}>
                      {profile.avatar && typeof profile.avatar === 'string' ? (
                        profile.avatar.startsWith('http') || profile.avatar.startsWith('data:') ? (
                          <img src={profile.avatar} alt="Avatar" className={styles.avatarImage} />
                        ) : (
                          <span className={styles.avatarEmoji}>{profile.avatar}</span>
                        )
                      ) : (
                        <span className={styles.avatarEmoji}>👤</span>
                      )}
                    </div>
                    <div className={styles.levelBadge} style={{ backgroundColor: getLevelColor(profile.level) }}>
                      {profile.level}
                    </div>
                  </div>

                  <div className={styles.onlineStatus}>
                    <div className={`${styles.statusIndicator} ${profile.isOnline ? styles.online : styles.offline}`}>
                      <span className={styles.statusDot}></span>
                      <span className={styles.statusText}>
                        {profile.isOnline ? 'Online agora' : `Visto em ${profile.lastSeen}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.profileInfo}>
                  <div className={styles.nameSection}>
                    <h3 className={styles.displayName}>{profile.displayName}</h3>
                    <p className={styles.username}>@{profile.username}</p>
                  </div>

                  {profile.title && (
                    <div className={styles.titleBadge}>
                      <FaTrophy className={styles.titleIcon} />
                      {profile.title}
                    </div>
                  )}

                  <div className={styles.levelInfo}>
                    <div className={styles.levelText}>
                      <FaStar className={styles.levelIcon} />
                      Nível {profile.level}
                    </div>
                    <div className={styles.xpText}>
                      {profile.xp.toLocaleString()} XP
                    </div>
                  </div>

                  {profile.bio && (
                    <div className={styles.bio}>
                      <p>"{profile.bio}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações do perfil */}
              <div className={styles.profileActions}>
                {canAddFriend && (
                  <button onClick={handleAddFriend} className={styles.addFriendButton}>
                    <FaUserPlus />
                    Adicionar Amigo
                  </button>
                )}

                {profile.isFriend && (
                  <div className={styles.friendStatus}>
                    <div className={styles.friendBadge}>
                      <FaUserPlus className={styles.friendIcon} />
                      <span>Amigos</span>
                    </div>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className={styles.loginPrompt}>
                    <p>Faça login para adicionar como amigo</p>
                  </div>
                )}
              </div>

              {/* Seção de estatísticas principais - estilo Steam */}
              {console.log('🔍 DEBUG - Verificando stats:', profile.stats)}
              {console.log('🔍 DEBUG - Condição stats:', !!profile.stats)}
              {profile.stats && (
                <div className={styles.statsShowcase}>
                  <h3 className={styles.sectionTitle}>
                    <FaTrophy className={styles.sectionIcon} />
                    Estatísticas de Jogo
                  </h3>

                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <FaGamepad />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>{profile.stats.totalGames}</div>
                        <div className={styles.statLabel}>Partidas Jogadas</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <FaTrophy />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>{profile.stats.totalWins || profile.stats.gamesWon || profile.stats.wins || 0}</div>
                        <div className={styles.statLabel}>Vitórias</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <FaFire />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>{profile.stats.bestStreak}</div>
                        <div className={styles.statLabel}>Melhor Sequência</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <FaStar />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>{getWinRate()}%</div>
                        <div className={styles.statLabel}>Taxa de Vitória</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <FaMusic />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>{profile.stats.perfectGames}</div>
                        <div className={styles.statLabel}>Jogos Perfeitos</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <FaClock />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statValue}>{Math.round(profile.stats.averageScore)}</div>
                        <div className={styles.statLabel}>Pontuação Média</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Seção de Conquistas - estilo Steam */}
              {profile.achievements && Object.keys(profile.achievements).length > 0 && (
                <div className={styles.achievementsShowcase}>
                  <h3 className={styles.sectionTitle}>
                    <FaTrophy className={styles.sectionIcon} />
                    Conquistas Desbloqueadas ({Object.keys(profile.achievements).length})
                  </h3>

                  <div className={styles.achievementsList}>
                    {Object.entries(profile.achievements).slice(0, 8).map(([key, achievement]) => {
                      const achievementData = getAchievement(key);
                      const rarity = getAchievementRarity(key);
                      return (
                        <div
                          key={key}
                          className={`${styles.achievementCard} ${styles[rarity]}`}
                          title={`${achievementData?.title || key}\n${achievementData?.description || ''}\nDesbloqueado em ${new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}`}
                        >
                          <div className={styles.achievementIcon}>
                            {achievementData?.icon || '🏆'}
                          </div>
                          <div className={styles.achievementInfo}>
                            <div className={styles.achievementTitle}>
                              {achievementData?.title || key}
                            </div>
                            <div className={styles.achievementDescription}>
                              {achievementData?.description || 'Conquista desbloqueada'}
                            </div>
                            <div className={styles.achievementDate}>
                              {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <div className={styles.achievementRarity}>
                            <FaMedal className={styles.rarityIcon} />
                            {rarity}
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(profile.achievements).length > 8 && (
                      <div className={styles.moreAchievements}>
                        <FaTrophy />
                        <span>+{Object.keys(profile.achievements).length - 8} conquistas adicionais</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Seção de Badges - estilo Steam */}
              {profile.badges && Object.keys(profile.badges).length > 0 && (
                <div className={styles.badgesShowcase}>
                  <h3 className={styles.sectionTitle}>
                    <FaMedal className={styles.sectionIcon} />
                    Coleção de Badges ({Object.keys(profile.badges).length})
                  </h3>

                  <div className={styles.badgesList}>
                    {Object.entries(profile.badges).slice(0, 12).map(([key, badge]) => {
                      const badgeData = getBadge(key);
                      return (
                        <div
                          key={key}
                          className={`${styles.badgeCard} ${styles[badgeData?.rarity || 'common']}`}
                          title={`${badgeData?.title || key}\n${badgeData?.description || ''}\nDesbloqueado em ${new Date(badge.unlockedAt).toLocaleDateString('pt-BR')}`}
                        >
                          <div className={styles.badgeIcon} style={{ color: badgeData?.color }}>
                            {badgeData?.icon || '🎖️'}
                          </div>
                          <div className={styles.badgeTitle}>
                            {badgeData?.title || key}
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(profile.badges).length > 12 && (
                      <div className={styles.moreBadges}>
                        <FaMedal />
                        <span>+{Object.keys(profile.badges).length - 12} badges</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informações adicionais - estilo Steam */}
              <div className={styles.additionalInfo}>
                <div className={styles.memberInfo}>
                  <div className={styles.infoItem}>
                    <FaClock className={styles.infoIcon} />
                    <span>Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {profile.lastLoginAt && (
                    <div className={styles.infoItem}>
                      <FaGamepad className={styles.infoIcon} />
                      <span>Último login: {new Date(profile.lastLoginAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfileModal;
