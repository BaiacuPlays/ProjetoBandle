// Modal para visualizar perfis públicos de outros usuários
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../contexts/FriendsContext';
import useModalScrollLock from '../hooks/useModalScrollLock';
import styles from '../styles/PublicProfileModal.module.css';

const PublicProfileModal = ({ isOpen, onClose, userId, username }) => {
  useModalScrollLock(isOpen);
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { sendFriendRequest, friends } = useFriends();
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar perfil quando modal abrir
  useEffect(() => {
    if (isOpen && (userId || username)) {
      loadProfile();
    }
  }, [isOpen, userId, username]);

  const loadProfile = async () => {
    setIsLoading(true);
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
        setProfile(data.profile);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao carregar perfil');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil público:', error);
      setError('Erro de conexão');
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

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {profile ? `Perfil de ${profile.displayName}` : 'Carregando...'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
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
              {/* Cabeçalho do perfil */}
              <div className={styles.profileHeader}>
                <div className={styles.avatarSection}>
                  <div className={styles.avatar}>
                    {profile.avatar}
                  </div>
                  <div className={styles.onlineStatus}>
                    <span className={`${styles.statusDot} ${profile.isOnline ? styles.online : styles.offline}`}></span>
                    {profile.isOnline ? 'Online' : `Visto em ${profile.lastSeen}`}
                  </div>
                </div>
                
                <div className={styles.profileInfo}>
                  <h3 className={styles.displayName}>{profile.displayName}</h3>
                  <p className={styles.username}>@{profile.username}</p>
                  
                  {profile.title && (
                    <div className={styles.title}>🏆 {profile.title}</div>
                  )}
                  
                  <div className={styles.level}>
                    Nível {profile.level} • {profile.xp} XP
                  </div>
                  
                  {profile.bio && (
                    <p className={styles.bio}>{profile.bio}</p>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className={styles.actions}>
                {canAddFriend && (
                  <button onClick={handleAddFriend} className={styles.addFriendButton}>
                    ➕ Adicionar como amigo
                  </button>
                )}
                
                {profile.isFriend && (
                  <div className={styles.friendBadge}>
                    ✅ Vocês são amigos
                    {profile.friendsSince && (
                      <span className={styles.friendsSince}>
                        desde {new Date(profile.friendsSince).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                )}
                
                {!isAuthenticated && (
                  <p className={styles.loginPrompt}>
                    Faça login para adicionar como amigo
                  </p>
                )}
              </div>

              {/* Estatísticas */}
              {profile.stats && (
                <div className={styles.statsSection}>
                  <h4>📊 Estatísticas</h4>
                  <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{profile.stats.totalGames}</span>
                      <span className={styles.statLabel}>Jogos</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{profile.stats.totalWins}</span>
                      <span className={styles.statLabel}>Vitórias</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{profile.stats.bestStreak}</span>
                      <span className={styles.statLabel}>Melhor Sequência</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{profile.stats.perfectGames}</span>
                      <span className={styles.statLabel}>Jogos Perfeitos</span>
                    </div>
                  </div>
                  
                  {profile.stats.averageScore > 0 && (
                    <div className={styles.averageScore}>
                      Pontuação média: {profile.stats.averageScore.toFixed(1)}
                    </div>
                  )}
                </div>
              )}

              {/* Conquistas */}
              {profile.achievements && Object.keys(profile.achievements).length > 0 && (
                <div className={styles.achievementsSection}>
                  <h4>🏆 Conquistas ({Object.keys(profile.achievements).length})</h4>
                  <div className={styles.achievementsList}>
                    {Object.entries(profile.achievements).slice(0, 6).map(([key, achievement]) => (
                      <div key={key} className={styles.achievementItem}>
                        <span className={styles.achievementIcon}>🏆</span>
                        <span className={styles.achievementName}>{key}</span>
                      </div>
                    ))}
                    {Object.keys(profile.achievements).length > 6 && (
                      <div className={styles.moreAchievements}>
                        +{Object.keys(profile.achievements).length - 6} mais
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Badges */}
              {profile.badges && Object.keys(profile.badges).length > 0 && (
                <div className={styles.badgesSection}>
                  <h4>🎖️ Badges ({Object.keys(profile.badges).length})</h4>
                  <div className={styles.badgesList}>
                    {Object.entries(profile.badges).slice(0, 8).map(([key, badge]) => (
                      <div key={key} className={styles.badgeItem}>
                        🎖️
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informações adicionais */}
              <div className={styles.additionalInfo}>
                <p className={styles.joinDate}>
                  Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfileModal;
