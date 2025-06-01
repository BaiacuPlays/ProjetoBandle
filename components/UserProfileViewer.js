// Componente para visualizar perfil de outros usuários
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../contexts/FriendsContext';
import styles from '../styles/UserProfileViewer.module.css';

const UserProfileViewer = ({ userId, username, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { sendFriendRequest, friends } = useFriends();
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Carregar perfil do usuário
  useEffect(() => {
    if (userId || username) {
      loadUserProfile();
    }
  }, [userId, username]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      const params = new URLSearchParams();
      
      if (userId) params.append('userId', userId);
      if (username) params.append('username', username);

      const headers = {
        'Content-Type': 'application/json'
      };

      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`/api/user-profile?${params.toString()}`, {
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
      console.error('Erro ao carregar perfil:', error);
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!profile || !isAuthenticated) return;

    setActionLoading(true);
    try {
      await sendFriendRequest({
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        avatar: profile.avatar
      });

      // Recarregar perfil para atualizar status de relacionamento
      await loadUserProfile();
      
      alert('Solicitação de amizade enviada!');
    } catch (error) {
      alert(error.message || 'Erro ao enviar solicitação');
    } finally {
      setActionLoading(false);
    }
  };

  const getRelationshipButton = () => {
    if (!isAuthenticated || !profile?.relationship) return null;

    const { isFriend, hasPendingRequest, requestType, isOwnProfile } = profile.relationship;

    if (isOwnProfile) {
      return (
        <button className={styles.ownProfileButton} disabled>
          👤 Seu Perfil
        </button>
      );
    }

    if (isFriend) {
      return (
        <button className={styles.friendButton} disabled>
          ✅ Amigos
        </button>
      );
    }

    if (hasPendingRequest) {
      if (requestType === 'sent') {
        return (
          <button className={styles.pendingButton} disabled>
            ⏳ Solicitação Enviada
          </button>
        );
      } else {
        return (
          <button className={styles.receivedButton} disabled>
            📩 Solicitação Recebida
          </button>
        );
      }
    }

    return (
      <button 
        className={styles.addFriendButton}
        onClick={handleAddFriend}
        disabled={actionLoading}
      >
        {actionLoading ? '⏳ Enviando...' : '➕ Adicionar Amigo'}
      </button>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getXPProgress = () => {
    if (!profile) return 0;
    const currentLevelXP = (profile.level - 1) * 1000;
    const nextLevelXP = profile.level * 1000;
    const progress = ((profile.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  if (isLoading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.error}>
            <h3>❌ Erro</h3>
            <p>{error}</p>
            <button onClick={onClose} className={styles.closeButton}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
          <h2>Perfil do Jogador</h2>
        </div>

        <div className={styles.content}>
          {/* Informações básicas */}
          <div className={styles.basicInfo}>
            <div className={styles.avatar}>
              {/* Renderizar avatar de forma segura */}
              {profile.avatar && typeof profile.avatar === 'string' && profile.avatar.length < 10 ?
                profile.avatar : '👤'
              }
            </div>
            <div className={styles.userInfo}>
              <h3 className={styles.displayName}>{profile.displayName}</h3>
              <p className={styles.username}>@{profile.username}</p>
              <div className={styles.level}>
                <span className={styles.levelBadge}>Nível {profile.level}</span>
                <div className={styles.xpBar}>
                  <div 
                    className={styles.xpProgress} 
                    style={{ width: `${getXPProgress()}%` }}
                  ></div>
                </div>
                <span className={styles.xpText}>{profile.xp} XP</span>
              </div>
            </div>
          </div>

          {/* Botão de relacionamento */}
          <div className={styles.actions}>
            {getRelationshipButton()}
          </div>

          {/* Estatísticas */}
          <div className={styles.statistics}>
            <h4>📊 Estatísticas</h4>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{profile.statistics.totalGames}</span>
                <span className={styles.statLabel}>Jogos</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{profile.statistics.gamesWon}</span>
                <span className={styles.statLabel}>Vitórias</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{profile.statistics.winRate}%</span>
                <span className={styles.statLabel}>Taxa de Vitória</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{profile.statistics.bestStreak}</span>
                <span className={styles.statLabel}>Melhor Sequência</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{profile.statistics.currentStreak}</span>
                <span className={styles.statLabel}>Sequência Atual</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{profile.statistics.perfectGames}</span>
                <span className={styles.statLabel}>Jogos Perfeitos</span>
              </div>
            </div>
          </div>

          {/* Conquistas */}
          {profile.achievements && profile.achievements.length > 0 && (
            <div className={styles.achievements}>
              <h4>🏆 Conquistas</h4>
              <div className={styles.achievementsList}>
                {profile.achievements.slice(0, 6).map((achievement, index) => (
                  <div key={index} className={styles.achievementItem}>
                    <span className={styles.achievementIcon}>{achievement.icon}</span>
                    <div className={styles.achievementInfo}>
                      <span className={styles.achievementName}>{achievement.name}</span>
                      <span className={styles.achievementDate}>
                        {formatDate(achievement.unlockedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {profile.achievements.length > 6 && (
                <p className={styles.moreAchievements}>
                  +{profile.achievements.length - 6} conquistas
                </p>
              )}
            </div>
          )}

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <div className={styles.badges}>
              <h4>🎖️ Badges</h4>
              <div className={styles.badgesList}>
                {profile.badges.map((badge, index) => (
                  <div key={index} className={styles.badgeItem}>
                    <span className={styles.badgeIcon}>{badge.icon}</span>
                    <span className={styles.badgeName}>{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações adicionais */}
          <div className={styles.additionalInfo}>
            <p className={styles.joinDate}>
              📅 Membro desde {formatDate(profile.createdAt)}
            </p>
            <p className={styles.lastActive}>
              🕒 Última atividade: {formatDate(profile.lastActiveAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileViewer;
