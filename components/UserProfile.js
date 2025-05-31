import React, { useState } from 'react';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useLanguage } from '../contexts/LanguageContext';
import { achievements, rarityColors, getAchievement, getNearAchievements } from '../data/achievements';
import { FaTimes, FaEdit, FaTrophy, FaGamepad, FaClock, FaFire, FaStar, FaChartLine } from 'react-icons/fa';
import styles from '../styles/UserProfile.module.css';

const UserProfile = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useUserProfile();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: ''
  });

  if (!isOpen || !profile) return null;

  // Inicializar formulário de edição
  React.useEffect(() => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleSaveProfile = () => {
    updateProfile({
      displayName: editForm.displayName,
      bio: editForm.bio
    });
    setIsEditing(false);
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
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getXPForNextLevel = (currentLevel) => {
    return Math.pow(currentLevel, 2) * 100;
  };

  const getCurrentLevelXP = (currentLevel) => {
    return Math.pow(currentLevel - 1, 2) * 100;
  };

  const getLevelProgress = () => {
    const currentLevelXP = getCurrentLevelXP(profile.level);
    const nextLevelXP = getXPForNextLevel(profile.level);
    const progressXP = profile.xp - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    return (progressXP / neededXP) * 100;
  };

  const unlockedAchievements = profile.achievements.map(id => getAchievement(id)).filter(Boolean);
  const nearAchievements = getNearAchievements(profile.stats, profile.achievements);

  return (
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
              <img 
                src={profile.avatar} 
                alt="Avatar" 
                className={styles.avatar}
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
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
                    onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                    className={styles.editInput}
                  />
                  <textarea
                    placeholder="Bio (opcional)"
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
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
              <span>Próximo nível: {getXPForNextLevel(profile.level) - profile.xp} XP</span>
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
              className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FaClock /> Histórico
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
                      <span className={styles.statValue}>{profile.stats.totalGames}</span>
                      <span className={styles.statLabel}>Jogos Totais</span>
                    </div>
                  </div>
                  
                  <div className={styles.statCard}>
                    <FaTrophy className={styles.statIcon} />
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{profile.stats.winRate.toFixed(1)}%</span>
                      <span className={styles.statLabel}>Taxa de Vitória</span>
                    </div>
                  </div>
                  
                  <div className={styles.statCard}>
                    <FaFire className={styles.statIcon} />
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{profile.stats.bestStreak}</span>
                      <span className={styles.statLabel}>Melhor Sequência</span>
                    </div>
                  </div>
                  
                  <div className={styles.statCard}>
                    <FaClock className={styles.statIcon} />
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{formatTime(profile.stats.totalPlayTime)}</span>
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
                      <span>Jogos: {profile.stats.dailyMode.gamesPlayed}</span>
                      <span>Vitórias: {profile.stats.dailyMode.wins}</span>
                      <span>Melhor Sequência: {profile.stats.dailyMode.bestStreak}</span>
                    </div>
                  </div>
                  
                  <div className={styles.modeCard}>
                    <h5>Modo Infinito</h5>
                    <div className={styles.modeInfo}>
                      <span>Sessões: {profile.stats.infiniteMode.gamesPlayed}</span>
                      <span>Músicas Completadas: {profile.stats.infiniteMode.totalSongs}</span>
                      <span>Melhor Sequência: {profile.stats.infiniteMode.bestStreak}</span>
                    </div>
                  </div>
                </div>

                {/* Top franquias */}
                {Object.keys(profile.franchiseStats).length > 0 && (
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
                            <span>{achievement.progress.toFixed(0)}%</span>
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

            {activeTab === 'history' && (
              <div className={styles.historyTab}>
                <h4>Jogos Recentes</h4>
                {profile.recentGames.length > 0 ? (
                  <div className={styles.gameHistory}>
                    {profile.recentGames.map(game => (
                      <div key={game.id} className={styles.gameItem}>
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
                          <span>Tentativas: {game.attempts}</span>
                          <span>Tempo: {formatTime(game.playTime)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noHistory}>Nenhum jogo registrado ainda.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
