// Componente para visualizar perfil de outros usuários
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSimpleFriends } from '../contexts/SimpleFriendsContext';
import styles from '../styles/UserProfileViewer.module.css';
import { getBadge } from '../data/badges';
import { getAchievement } from '../data/achievements';

const UserProfileViewer = ({ isOpen, userId, username, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { sendFriendRequest, friends } = useSimpleFriends();
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Carregar perfil do usuário
  useEffect(() => {
    if (isOpen && (userId || username)) {
      loadUserProfile();
    }
  }, [isOpen, userId, username]);



  // Função para sincronizar dados locais para o servidor
  const syncLocalDataToServer = async (localData) => {
    try {
      console.log('📤 Enviando dados locais para servidor:', localData);

      const response = await fetch('/api/sync-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'BaiacuPlays',
          localData: localData
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sincronização bem-sucedida:', result);
        // Recarregar o perfil após sincronização
        loadUserProfile();
      } else {
        console.error('❌ Erro na sincronização:', response.status);
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar dados:', error);
    }
  };

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

    const xp = profile.xp || profile.stats?.xp || 0;

    // Calcular o nível correto baseado no XP
    const calculatedLevel = Math.floor(xp / 1000) + 1;
    const level = calculatedLevel;

    const currentLevelXP = (level - 1) * 1000;
    const nextLevelXP = level * 1000;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    const finalProgress = Math.max(0, Math.min(100, progress));



    return finalProgress;
  };

  // Bloquear scroll da página quando modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Se não estiver aberto, não renderizar nada
  if (!isOpen) return null;

  if (isLoading) {
    const loadingContent = (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando perfil...</p>
          </div>
        </div>
      </div>
    );
    return typeof document !== 'undefined'
      ? createPortal(loadingContent, document.body)
      : null;
  }

  if (error) {
    const errorContent = (
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
    return typeof document !== 'undefined'
      ? createPortal(errorContent, document.body)
      : null;
  }

  if (!profile) {
    return null;
  }

  // Verificar sincronização para BaiacuPlays
  if (typeof window !== 'undefined' && profile.username === 'BaiacuPlays') {
    const localProfile = localStorage.getItem('ludomusic_profile_auth_BaiacuPlays');
    if (localProfile) {
      try {
        const parsedLocal = JSON.parse(localProfile);

        // Se os dados locais têm XP/level mas o servidor não, sincronizar
        if (parsedLocal.xp > 0 && (profile.xp === 0 || profile.xp === undefined)) {
          console.log('🔄 SINCRONIZANDO: Local XP=' + parsedLocal.xp + ', Servidor XP=' + profile.xp);
          syncLocalDataToServer(parsedLocal);
        }
      } catch (e) {
        console.log('❌ Erro ao parsear dados locais:', e);
      }
    }
  }

  const modalContent = (
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
              {profile.avatar && typeof profile.avatar === 'string' ? (
                profile.avatar.startsWith('http') || profile.avatar.startsWith('/') || profile.avatar.startsWith('data:') ? (
                  <img
                    src={profile.avatar}
                    alt="Avatar"
                    className={styles.avatarImage}
                  />
                ) : (
                  profile.avatar
                )
              ) : '👤'}
            </div>
            <div className={styles.userInfo}>
              <h3 className={styles.displayName}>{profile.displayName}</h3>
              <p className={styles.username}>@{profile.username}</p>
              {profile.bio && (
                <p className={styles.bio}>{profile.bio}</p>
              )}
              <div className={styles.level}>
                <span className={styles.levelBadge}>
                  Nível {Math.floor((profile.xp || profile.stats?.xp || 0) / 1000) + 1}
                </span>
                <div className={styles.xpBar}>
                  <div
                    className={styles.xpProgress}
                    style={{ width: `${getXPProgress()}%` }}
                  ></div>
                </div>
                <span className={styles.xpText}>
                  {profile.xp || profile.stats?.xp || 0} XP
                </span>
              </div>
            </div>
          </div>

          {/* Botão de relacionamento */}
          <div className={styles.actions}>
            {getRelationshipButton()}
          </div>

          {/* Estatísticas */}
          <div className={styles.statistics}>
            <h4>📊 Estatísticas de Jogo</h4>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {profile.statistics?.totalGames || profile.totalGames || 0}
                </span>
                <span className={styles.statLabel}>Partidas Jogadas</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {profile.statistics?.gamesWon || profile.gamesWon || 0}
                </span>
                <span className={styles.statLabel}>Vitórias</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {Math.round(profile.statistics?.winRate || 0)}%
                </span>
                <span className={styles.statLabel}>Taxa de Vitória</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {profile.statistics?.bestStreak || profile.bestStreak || 0}
                </span>
                <span className={styles.statLabel}>Melhor Sequência</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {profile.statistics?.currentStreak || profile.currentStreak || 0}
                </span>
                <span className={styles.statLabel}>Sequência Atual</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {profile.statistics?.perfectGames || 0}
                </span>
                <span className={styles.statLabel}>Jogos Perfeitos</span>
              </div>
            </div>
          </div>

          {/* Conquistas */}
          <div className={styles.achievements}>
            <h4>🏆 Conquistas</h4>
            {(() => {
              const achievements = profile.achievements || profile.unlockedAchievements || [];

              if (achievements && achievements.length > 0) {
                return (
                  <div className={styles.achievementsList}>
                    {achievements.map((achievementId, index) => {
                      const achievementData = getAchievement(achievementId);
                      if (!achievementData) return null;
                      return (
                        <div key={index} className={styles.achievementItem} title={achievementData.description}>
                          <span className={styles.achievementIcon}>{achievementData.icon}</span>
                          <div className={styles.achievementInfo}>
                            <span className={styles.achievementName}>{achievementData.title}</span>
                            <span className={styles.achievementDate}>
                              Desbloqueada
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              } else {
                return (
                  <p className={styles.noAchievements}>
                    Nenhuma conquista desbloqueada ainda
                  </p>
                );
              }
            })()}
          </div>

          {/* Badges */}
          <div className={styles.badges}>
            <h4>🎖️ Badges</h4>
            {profile.badges && profile.badges.length > 0 ? (
              <div className={styles.badgesList}>
                {profile.badges.map((badgeId, index) => {
                  const badgeData = getBadge(badgeId);
                  if (!badgeData) return null;
                  return (
                    <div key={index} className={styles.badgeItem} title={badgeData.description}>
                      <span className={styles.badgeIcon}>{badgeData.icon}</span>
                      <span className={styles.badgeName}>{badgeData.title}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.noBadges}>
                Nenhuma badge conquistada ainda
              </p>
            )}
          </div>

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

  // Usar portal para renderizar no body
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return null;
};

export default UserProfileViewer;
