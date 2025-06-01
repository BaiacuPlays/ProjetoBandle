import React, { useState, useEffect } from 'react'; // Import useEffect
import { useUserProfile } from '../contexts/UserProfileContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { achievements, rarityColors, getAchievement, getNearAchievements } from '../data/achievements'; // Removed getAchievementStats as it wasn't used
import { badges, titles, getBadge, getTitle, getAvailableTitles } from '../data/badges';
import { FaTimes, FaEdit, FaTrophy, FaGamepad, FaClock, FaFire, FaStar, FaChartLine, FaCog, FaDownload, FaUpload, FaTrash, FaMedal } from 'react-icons/fa';
import ProfileTutorial from './ProfileTutorial';
import AvatarSelector from './AvatarSelector';
import UserAvatar from './UserAvatar';
import LoginModal from './LoginModal';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/UserProfile.module.css';

const UserProfile = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  // Bloquear/desbloquear scroll da página
  useModalScrollLock(isOpen);

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: ''
  });
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // Hook de autenticação
  const { isAuthenticated } = useAuth();

  // Hook do perfil com verificação de segurança
  // Destructure directly to avoid unnecessary intermediate variables and potential null issues
  const {
    profile,
    updateProfile,
    isLoading, // isLoading comes directly from the hook
    resetProfile,
    deleteAccount,
    exportProfile,
    importProfile,
    updatePreferences,
    markTutorialAsSeen,
    setCurrentTitle,
    updateAvatar,
    userId // Adicionar userId do contexto
  } = useUserProfile() || {}; // Add || {} to safely destructure if context is null/undefined

  // Inicializar formulário de edição e verificar tutorial
  useEffect(() => {
    if (profile && userId) {
      setEditForm({
        displayName: profile.displayName || '',
        bio: profile.bio || ''
      });

      // Verificar se deve mostrar o tutorial
      // Verificar tanto no perfil quanto no localStorage
      const hasSeenInProfile = profile.preferences?.hasSeenProfileTutorial;
      const hasSeenInStorage = localStorage.getItem(`ludomusic_tutorial_seen_${userId}`) === 'true';

      // Mostrar tutorial apenas se:
      // 1. Modal está aberto
      // 2. Usuário está autenticado
      // 3. Não viu o tutorial (nem no perfil nem no localStorage)
      // 4. Tutorial não está sendo mostrado atualmente
      if (isOpen && isAuthenticated && !hasSeenInProfile && !hasSeenInStorage && !showTutorial) {
        console.log('📚 Mostrando tutorial do perfil pela primeira vez');
        setShowTutorial(true);
      }
    }
  }, [profile, isOpen, isAuthenticated, userId, showTutorial]); // Depend on all relevant variables

  // Definir função handleCloseTutorial antes de usar
  const handleCloseTutorial = async () => {
    setShowTutorial(false);

    // Marcar tutorial como visto
    if (markTutorialAsSeen) {
      try {
        await markTutorialAsSeen();
        console.log('✅ Tutorial do perfil marcado como visto');
      } catch (error) {
        console.error('❌ Erro ao marcar tutorial como visto:', error);
      }
    }

    // Se usuário não está autenticado após o tutorial, fechar o modal
    // O componente irá automaticamente mostrar o login na próxima renderização
  };

  // If the modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  // Se deve mostrar tutorial, mostrar primeiro (independente de autenticação)
  if (showTutorial) {
    return (
      <ProfileTutorial onClose={handleCloseTutorial} />
    );
  }

  // Se não está autenticado, mostrar apenas o modal de login
  if (!isAuthenticated) {
    return (
      <LoginModal
        isOpen={true}
        onClose={onClose}
        onSuccess={(user) => {
          console.log('✅ Login realizado com sucesso:', user.displayName);
          // O perfil será automaticamente recarregado pelo contexto
        }}
      />
    );
  }

  // Show loading state first, if still loading
  if (isLoading) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.profileModal}>
          <div className={styles.profileHeader}>
            <button className={styles.closeButton} onClick={onClose}>
              <FaTimes />
            </button>
            <h2>Carregando Perfil...</h2>
          </div>
          <div className={styles.profileContent}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Carregando dados do perfil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug: verificar estado do perfil
  console.log('🔍 UserProfile - Estado atual:', {
    isAuthenticated,
    isLoading,
    profile: !!profile,
    userId,
    profileData: profile ? 'existe' : 'null'
  });

  // If there's no profile after loading (e.g., error in context), show an error message
  if (!profile) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.profileModal}>
          <div className={styles.profileHeader}>
            <button className={styles.closeButton} onClick={onClose}>
              <FaTimes />
            </button>
            <h2>Erro no Perfil</h2>
          </div>
          <div className={styles.profileContent}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Não foi possível carregar o perfil. Tente novamente mais tarde.</p>
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '0.5rem'
                  }}
                >
                  Recarregar Página
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Limpar Cache
                </button>
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
                <p>Se o problema persistir, tente:</p>
                <p>1. Recarregar a página</p>
                <p>2. Limpar o cache do navegador</p>
                <p>3. Fazer logout e login novamente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = () => {
    if (updateProfile) {
      updateProfile({
        displayName: editForm.displayName,
        bio: editForm.bio
      });
    }
    setIsEditing(false);
  };

  const handleExportProfile = () => {
    if (exportProfile) {
      const profileData = exportProfile();
      if (profileData) {
        const dataStr = JSON.stringify(profileData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ludomusic_profile_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleImportProfile = (event) => {
    const file = event.target.files[0];
    if (file && importProfile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const profileData = JSON.parse(e.target.result);
          const success = importProfile(profileData);
          if (success) {
            alert('Perfil importado com sucesso!');
          } else {
            alert('Erro ao importar perfil. Verifique se o arquivo é válido.');
          }
        } catch (error) {
          alert('Erro ao ler arquivo. Verifique se é um arquivo JSON válido.');
        }
      };
      reader.readAsText(file);
    }
    // Limpar o input
    event.target.value = '';
  };

  const handleResetProfile = () => {
    if (resetProfile) {
      resetProfile();
      setShowConfirmReset(false);
      alert('Perfil resetado com sucesso!');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteAccount) {
      const success = await deleteAccount();
      setShowConfirmDelete(false);

      if (success) {
        alert('Conta deletada com sucesso! Você será redirecionado para a página inicial.');
        // Fechar modal e redirecionar
        onClose();
        // Recarregar a página para limpar todos os estados
        window.location.reload();
      } else {
        alert('Erro ao deletar conta. Tente novamente.');
      }
    }
  };

  const handlePreferenceChange = (key, value) => {
    if (updatePreferences) {
      updatePreferences({ [key]: value });
    }
  };

  const handleAvatarChange = (avatarData) => {
    if (updateAvatar) {
      updateAvatar(avatarData);
      setShowAvatarSelector(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString) => {
    // Ensure dateString is valid before creating a Date object
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getXPForNextLevel = (currentLevel) => {
    return Math.pow(currentLevel, 2) * 100;
  };

  const getCurrentLevelXP = (currentLevel) => {
    return Math.pow(currentLevel - 1, 2) * 100;
  };

  const getLevelProgress = () => {
    if (!profile) return 0;
    const currentLevelXP = getCurrentLevelXP(profile.level);
    const nextLevelXP = getXPForNextLevel(profile.level);
    const progressXP = profile.xp - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    // Prevent division by zero if neededXP is 0 (e.g., at max level or initial state)
    return neededXP > 0 ? (progressXP / neededXP) * 100 : 100;
  };

  // Only calculate if profile exists
  const unlockedAchievements = profile?.achievements ? profile.achievements.map(id => getAchievement(id)).filter(Boolean) : [];
  const nearAchievements = profile?.stats ? getNearAchievements(profile.stats, profile.achievements || [], profile) : [];

  return (
    <>
      {/* Renderizar o modal de perfil */}
      {(
        <div className={styles.modalOverlay}>
          <div className={styles.profileModal}>
            <div className={styles.profileHeader}>
              <button className={styles.closeButton} onClick={onClose}>
                <FaTimes />
              </button>
              <h2>Perfil do Jogador</h2>
            </div>

            <div className={styles.profileContent}>
              {/* Informações básicas */}
              <div className={styles.profileBasicInfo}>
                <div className={styles.avatarSection}>
                  <UserAvatar
                    avatar={profile.avatar}
                    size="xlarge"
                    editable={true}
                    showEditIcon={true}
                    onClick={() => setShowAvatarSelector(true)}
                  />
                  <div className={styles.levelBadge}>
                    Nível {profile.level}
                  </div>
                </div>

                <div className={styles.userInfo}>
                  {isEditing ? (
                    <div className={styles.editForm}>
                      <input
                        type="text"
                        placeholder="Nome de exibição"
                        value={editForm.displayName}
                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                        className={styles.editInput}
                      />
                      <textarea
                        placeholder="Bio (opcional)"
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className={styles.editTextarea}
                        rows={3}
                      />
                      <div className={styles.editButtons}>
                        <button onClick={handleSaveProfile} className={styles.saveButton}>
                          Salvar
                        </button>
                        <button onClick={() => setIsEditing(false)} className={styles.cancelButton}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>
                        {profile.displayName || profile.username}
                        <button
                          onClick={() => setIsEditing(true)}
                          className={styles.editButton}
                        >
                          <FaEdit />
                        </button>
                      </h3>
                      {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
                      <p className={styles.joinDate}>
                        Jogando desde {formatDate(profile.createdAt)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Barra de XP */}
              <div className={styles.xpSection}>
                <div className={styles.xpInfo}>
                  <span>XP: {profile.xp}</span>
                  <span>Próximo nível: {Math.max(0, getXPForNextLevel(profile.level) - profile.xp)} XP</span> {/* Ensure XP doesn't go negative */}
                </div>
                <div className={styles.xpBar}>
                  <div
                    className={styles.xpProgress}
                    style={{ width: `${getLevelProgress()}%` }}
                  />
                </div>
              </div>

              {/* Abas */}
              <div className={styles.tabNavigation}>
                <button
                  className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <FaChartLine /> Visão Geral
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'achievements' ? styles.active : ''}`}
                  onClick={() => setActiveTab('achievements')}
                >
                  <FaTrophy /> Conquistas
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'badges' ? styles.active : ''}`}
                  onClick={() => setActiveTab('badges')}
                >
                  <FaMedal /> Badges
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <FaClock /> Histórico
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <FaCog /> Configurações
                </button>
              </div>

              {/* Conteúdo das abas */}
              <div className={styles.tabContent}>
                {activeTab === 'overview' && (
                  <div className={styles.overviewTab}>
                    {/* Estatísticas principais */}
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}>
                        <FaGamepad className={styles.statIcon} />
                        <div className={styles.statInfo}>
                          <span className={styles.statValue}>{profile.stats?.totalGames || 0}</span> {/* Added optional chaining */}
                          <span className={styles.statLabel}>Jogos Totais</span>
                        </div>
                      </div>

                      <div className={styles.statCard}>
                        <FaTrophy className={styles.statIcon} />
                        <div className={styles.statInfo}>
                          <span className={styles.statValue}>{(profile.stats?.winRate || 0).toFixed(1)}%</span> {/* Added optional chaining */}
                          <span className={styles.statLabel}>Taxa de Vitória</span>
                        </div>
                      </div>

                      <div className={styles.statCard}>
                        <FaFire className={styles.statIcon} />
                        <div className={styles.statInfo}>
                          <span className={styles.statValue}>{profile.stats?.bestStreak || 0}</span> {/* Added optional chaining */}
                          <span className={styles.statLabel}>Melhor Sequência</span>
                        </div>
                      </div>

                      <div className={styles.statCard}>
                        <FaClock className={styles.statIcon} />
                        <div className={styles.statInfo}>
                          <span className={styles.statValue}>{formatTime(profile.stats?.totalPlayTime || 0)}</span> {/* Added optional chaining */}
                          <span className={styles.statLabel}>Tempo Jogado</span>
                        </div>
                      </div>
                    </div>

                    {/* Estatísticas por modo */}
                    <div className={styles.modeStats}>
                      <h4>Estatísticas por Modo</h4>

                      <div className={styles.modeCard}>
                        <h5>Modo Diário</h5>
                        <div className={styles.modeInfo}>
                          <span>Jogos: {profile.stats?.modeStats?.daily?.games || 0}</span> {/* Added optional chaining */}
                          <span>Vitórias: {profile.stats?.modeStats?.daily?.wins || 0}</span> {/* Added optional chaining */}
                          <span>Melhor Sequência: {profile.stats?.modeStats?.daily?.bestStreak || 0}</span> {/* Changed from profile.stats.bestStreak to daily bestStreak */}
                        </div>
                      </div>

                      <div className={styles.modeCard}>
                        <h5>Modo Infinito</h5>
                        <div className={styles.modeInfo}>
                          <span>Sessões: {profile.stats?.modeStats?.infinite?.games || 0}</span> {/* Added optional chaining */}
                          <span>Melhor Sequência: {profile.stats?.modeStats?.infinite?.bestStreak || 0}</span> {/* Added optional chaining */}
                        </div>
                      </div>
                    </div>

                    {/* Top franquias */}
                    {profile.franchiseStats && Object.keys(profile.franchiseStats).length > 0 && (
                      <div className={styles.franchiseStats}>
                        <h4>Franquias Favoritas</h4>
                        <div className={styles.franchiseList}>
                          {Object.entries(profile.franchiseStats)
                            .sort((a, b) => b[1].winRate - a[1].winRate)
                            .slice(0, 5)
                            .map(([franchise, stats]) => (
                              <div key={franchise} className={styles.franchiseItem}>
                                <span className={styles.franchiseName}>{franchise}</span>
                                <span className={styles.franchiseWinRate}>
                                  {stats.winRate.toFixed(1)}% ({stats.wins}/{stats.gamesPlayed})
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'achievements' && (
                  <div className={styles.achievementsTab}>
                    <div className={styles.achievementsSummary}>
                      <h4>Conquistas Desbloqueadas: {unlockedAchievements.length}/{Object.keys(achievements).length}</h4>
                    </div>

                    {/* Conquistas próximas */}
                    {nearAchievements.length > 0 && (
                      <div className={styles.nearAchievements}>
                        <h5>Próximas Conquistas</h5>
                        {nearAchievements.slice(0, 3).map(achievement => (
                          <div key={achievement.id} className={styles.achievementItem}>
                            <span className={styles.achievementIcon}>{achievement.icon}</span>
                            <div className={styles.achievementInfo}>
                              <span className={styles.achievementTitle}>{achievement.title}</span>
                              <span className={styles.achievementDesc}>{achievement.description}</span>
                              <div className={styles.achievementProgress}>
                                <div
                                  className={styles.progressBar}
                                  style={{ width: `${achievement.progress}%` }}
                                />
                                <span>{achievement.progress?.toFixed(0) || 0}%</span> {/* Optional chaining for progress */}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Conquistas desbloqueadas */}
                    <div className={styles.unlockedAchievements}>
                      <h5>Conquistas Desbloqueadas</h5>
                      <div className={styles.achievementGrid}>
                        {unlockedAchievements.map(achievement => (
                          <div
                            key={achievement.id}
                            className={styles.achievementCard}
                            style={{ borderColor: rarityColors[achievement.rarity] }}
                          >
                            <span className={styles.achievementIcon}>{achievement.icon}</span>
                            <span className={styles.achievementTitle}>{achievement.title}</span>
                            <span className={styles.achievementDesc}>{achievement.description}</span>
                            <span
                              className={styles.achievementRarity}
                              style={{ color: rarityColors[achievement.rarity] }}
                            >
                              {achievement.rarity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'badges' && (
                  <div className={styles.badgesTab}>
                    <h4>Badges e Títulos</h4>

                    {/* Título Atual */}
                    {profile?.currentTitle && (
                      <div className={styles.currentTitleSection}>
                        <h5>Título Atual</h5>
                        <div className={styles.currentTitle}>
                          <span className={styles.titleIcon}>👑</span>
                          <span className={styles.titleText}>
                            {getTitle(profile.currentTitle)?.title || 'Título Desconhecido'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Títulos Disponíveis */}
                    {profile && (
                      <div className={styles.titlesSection}>
                        <h5>Títulos Disponíveis</h5>
                        <div className={styles.titlesGrid}>
                          <div
                            className={`${styles.titleOption} ${!profile.currentTitle ? styles.selected : ''}`}
                            onClick={() => setCurrentTitle && setCurrentTitle(null)}
                          >
                            <span className={styles.titleOptionText}>Sem Título</span>
                          </div>
                          {getAvailableTitles(profile).map(title => (
                            <div
                              key={title.id}
                              className={`${styles.titleOption} ${profile.currentTitle === title.id ? styles.selected : ''}`}
                              onClick={() => setCurrentTitle && setCurrentTitle(title.id)}
                            >
                              <span className={styles.titleOptionText}>{title.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Badges Desbloqueados */}
                    <div className={styles.badgesSection}>
                      <h5>Badges Desbloqueados ({profile?.badges?.length || 0})</h5>
                      {profile?.badges && profile.badges.length > 0 ? (
                        <div className={styles.badgesGrid}>
                          {profile.badges.map(badgeId => {
                            const badge = getBadge(badgeId);
                            if (!badge) return null;

                            return (
                              <div key={badgeId} className={styles.badgeItem}>
                                <div
                                  className={styles.badgeIcon}
                                  style={{ backgroundColor: badge.color }}
                                >
                                  {badge.icon}
                                </div>
                                <div className={styles.badgeInfo}>
                                  <div className={styles.badgeTitle}>{badge.title}</div>
                                  <div className={styles.badgeDescription}>{badge.description}</div>
                                  <div className={`${styles.badgeRarity} ${styles[badge.rarity]}`}>
                                    {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className={styles.noBadges}>Nenhum badge desbloqueado ainda. Continue jogando para conquistar seus primeiros badges!</p>
                      )}
                    </div>

                    {/* Próximos Badges */}
                    <div className={styles.nextBadgesSection}>
                      <h5>Próximos Badges</h5>
                      <div className={styles.nextBadgesGrid}>
                        {Object.values(badges).map(badge => { // Changed from .slice(0, 6) to show all
                          const isUnlocked = profile?.badges?.includes(badge.id);
                          if (isUnlocked) return null; // Only show badges that are not unlocked

                          return (
                            <div key={badge.id} className={styles.nextBadgeItem}>
                              <div
                                className={styles.nextBadgeIcon}
                                style={{ backgroundColor: badge.color }}
                              >
                                {badge.icon}
                              </div>
                              <div className={styles.nextBadgeInfo}>
                                <div className={styles.nextBadgeTitle}>{badge.title}</div>
                                <div className={styles.nextBadgeDescription}>{badge.description}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className={styles.historyTab}>
                    <h4>Jogos Recentes</h4>
                    {(profile.gameHistory || profile.recentGames || []).length > 0 ? (
                      <div className={styles.gameHistory}>
                        {(profile.gameHistory || profile.recentGames || []).map((game, index) => ( // Added index for key as game.id might not be unique
                          <div key={game.id || index} className={styles.gameItem}> {/* Fallback to index if no id */}
                            <div className={styles.gameResult}>
                              <span className={`${styles.resultIcon} ${game.won ? styles.win : styles.loss}`}>
                                {game.won ? '✅' : '❌'}
                              </span>
                              <div className={styles.gameInfo}>
                                <span className={styles.gameMode}>
                                  {game.mode === 'daily' ? 'Diário' :
                                    game.mode === 'infinite' ? 'Infinito' : 'Multiplayer'}
                                </span>
                                <span className={styles.gameDate}>{formatDate(game.date)}</span>
                              </div>
                            </div>

                            {game.song && (
                              <div className={styles.songInfo}>
                                <span className={styles.songTitle}>{game.song.title}</span>
                                <span className={styles.songGame}>{game.song.game}</span>
                              </div>
                            )}

                            <div className={styles.gameStats}>
                              <span>Tentativas: {game.attempts || 0}</span> {/* Added default 0 */}
                              <span>Tempo: {formatTime(game.playTime || 0)}</span> {/* Added default 0 */}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.noHistory}>Nenhum jogo registrado ainda.</p>
                    )}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className={styles.settingsTab}>
                    <h4>Configurações do Perfil</h4>

                    {/* Preferências */}
                    <div className={styles.settingsSection}>
                      <h5>Preferências</h5>

                      <div className={styles.settingItem}>
                        <label>
                          <input
                            type="checkbox"
                            checked={profile?.preferences?.showAchievementPopups || false}
                            onChange={(e) => handlePreferenceChange('showAchievementPopups', e.target.checked)}
                          />
                          Mostrar notificações de conquistas
                        </label>
                      </div>

                      <div className={styles.settingItem}>
                        <label>
                          <input
                            type="checkbox"
                            checked={profile?.preferences?.notifications || false}
                            onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                          />
                          Receber notificações
                        </label>
                      </div>
                    </div>

                    {/* Dados do Perfil */}
                    <div className={styles.settingsSection}>
                      <h5>Gerenciar Dados</h5>

                      <div className={styles.dataActions}>
                        <button
                          className={styles.exportButton}
                          onClick={handleExportProfile}
                        >
                          <FaDownload /> Exportar Perfil
                        </button>

                        <label className={styles.importButton}>
                          <FaUpload /> Importar Perfil
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportProfile}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Estatísticas do Perfil */}
                    <div className={styles.settingsSection}>
                      <h5>Estatísticas do Perfil</h5>
                      <div className={styles.profileStats}>
                        <div className={styles.statItem}>
                          <span>Criado em:</span>
                          <span>{formatDate(profile?.createdAt)}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span>Último acesso:</span>
                          <span>{formatDate(profile?.lastLogin)}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span>Total de XP:</span>
                          <span>{profile?.xp || 0}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span>Conquistas desbloqueadas:</span>
                          <span>{unlockedAchievements.length}/{Object.keys(achievements).length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Zona de Perigo */}
                    <div className={styles.settingsSection}>
                      <h5 className={styles.dangerZone}>Zona de Perigo</h5>

                      {!showConfirmReset ? (
                        <button
                          className={styles.resetButton}
                          onClick={() => setShowConfirmReset(true)}
                        >
                          <FaTrash /> Resetar Perfil
                        </button>
                      ) : (
                        <div className={styles.confirmReset}>
                          <p>⚠️ Esta ação não pode ser desfeita! Todos os seus dados serão perdidos.</p>
                          <div className={styles.confirmButtons}>
                            <button
                              className={styles.confirmResetButton}
                              onClick={handleResetProfile}
                            >
                              Sim, resetar tudo
                            </button>
                            <button
                              className={styles.cancelResetButton}
                              onClick={() => setShowConfirmReset(false)}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Botão Deletar Conta */}
                      {!showConfirmDelete ? (
                        <button
                          className={styles.deleteButton}
                          onClick={() => setShowConfirmDelete(true)}
                        >
                          <FaTrash /> Deletar Conta Permanentemente
                        </button>
                      ) : (
                        <div className={styles.confirmDelete}>
                          <p>🚨 ATENÇÃO: Esta ação é IRREVERSÍVEL!</p>
                          <p>Sua conta e todos os dados serão deletados permanentemente do servidor.</p>
                          <div className={styles.confirmButtons}>
                            <button
                              className={styles.confirmDeleteButton}
                              onClick={handleDeleteAccount}
                            >
                              Sim, deletar conta
                            </button>
                            <button
                              className={styles.cancelDeleteButton}
                              onClick={() => setShowConfirmDelete(false)}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Seletor de avatar */}
              {showAvatarSelector && (
                <AvatarSelector
                  currentAvatar={profile?.avatar}
                  onAvatarChange={handleAvatarChange}
                  onClose={() => setShowAvatarSelector(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile;