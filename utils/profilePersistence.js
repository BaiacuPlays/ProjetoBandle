/**
 * Utilitário para garantir a persistência do perfil do usuário
 * Implementa mecanismos de backup e recuperação para evitar perda de dados
 */

// Salvar perfil no localStorage com backup
export const saveProfileToLocalStorage = (userId, profileData) => {
  if (!userId || !profileData) return false;
  
  try {
    // Salvar no localStorage principal
    localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(profileData));
    
    // Salvar em um backup separado
    localStorage.setItem(`ludomusic_profile_backup_${userId}`, JSON.stringify({
      ...profileData,
      _backupTimestamp: Date.now()
    }));
    
    // Salvar um snapshot periódico (a cada hora)
    const lastSnapshotTime = localStorage.getItem(`ludomusic_profile_snapshot_time_${userId}`);
    const now = Date.now();
    if (!lastSnapshotTime || (now - parseInt(lastSnapshotTime)) > 3600000) { // 1 hora
      localStorage.setItem(`ludomusic_profile_snapshot_${userId}`, JSON.stringify({
        ...profileData,
        _snapshotTimestamp: now
      }));
      localStorage.setItem(`ludomusic_profile_snapshot_time_${userId}`, now.toString());
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar perfil no localStorage:', error);
    return false;
  }
};

// Carregar perfil do localStorage com recuperação de backup
export const loadProfileFromLocalStorage = (userId) => {
  if (!userId) return null;
  
  try {
    // Tentar carregar do localStorage principal
    const profileStr = localStorage.getItem(`ludomusic_profile_${userId}`);
    if (profileStr) {
      try {
        return JSON.parse(profileStr);
      } catch (parseError) {
        console.error('❌ Erro ao parsear perfil do localStorage:', parseError);
      }
    }
    
    // Se falhou, tentar carregar do backup
    const backupStr = localStorage.getItem(`ludomusic_profile_backup_${userId}`);
    if (backupStr) {
      try {
        const backupProfile = JSON.parse(backupStr);
        console.log('🔄 Recuperando perfil do backup');
        
        // Restaurar o backup no localStorage principal
        localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(backupProfile));
        
        return backupProfile;
      } catch (backupError) {
        console.error('❌ Erro ao parsear backup do perfil:', backupError);
      }
    }
    
    // Se ainda falhou, tentar carregar do snapshot
    const snapshotStr = localStorage.getItem(`ludomusic_profile_snapshot_${userId}`);
    if (snapshotStr) {
      try {
        const snapshotProfile = JSON.parse(snapshotStr);
        console.log('🔄 Recuperando perfil do snapshot');
        
        // Restaurar o snapshot no localStorage principal
        localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(snapshotProfile));
        
        return snapshotProfile;
      } catch (snapshotError) {
        console.error('❌ Erro ao parsear snapshot do perfil:', snapshotError);
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao carregar perfil do localStorage:', error);
    return null;
  }
};

// Verificar integridade do perfil
export const verifyProfileIntegrity = (profile) => {
  if (!profile) return false;
  
  // Verificar campos obrigatórios
  const requiredFields = ['id', 'username', 'stats', 'achievements'];
  for (const field of requiredFields) {
    if (!profile[field]) {
      console.error(`❌ Perfil corrompido: campo ${field} ausente`);
      return false;
    }
  }
  
  // Verificar estrutura de stats
  if (!profile.stats.totalGames && profile.stats.totalGames !== 0) {
    console.error('❌ Perfil corrompido: stats.totalGames ausente');
    return false;
  }
  
  // Verificar se achievements é um array
  if (!Array.isArray(profile.achievements)) {
    console.error('❌ Perfil corrompido: achievements não é um array');
    return false;
  }
  
  return true;
};

// Reparar perfil corrompido
export const repairProfile = (profile, userId) => {
  if (!profile || !userId) return null;
  
  // Estrutura base para garantir que todos os campos existam
  const baseProfile = {
    id: userId,
    username: profile.username || `Jogador_${userId.slice(-6)}`,
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    avatar: profile.avatar || '/default-avatar.svg',
    level: profile.level || 1,
    xp: profile.xp || 0,
    createdAt: profile.createdAt || new Date().toISOString(),
    lastLogin: profile.lastLogin || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    stats: {
      totalGames: profile.stats?.totalGames || 0,
      wins: profile.stats?.wins || 0,
      losses: profile.stats?.losses || 0,
      winRate: profile.stats?.winRate || 0,
      currentStreak: profile.stats?.currentStreak || 0,
      bestStreak: profile.stats?.bestStreak || 0,
      totalPlayTime: profile.stats?.totalPlayTime || 0,
      perfectGames: profile.stats?.perfectGames || 0,
      averageAttempts: profile.stats?.averageAttempts || 0,
      fastestWin: profile.stats?.fastestWin || null,
      modeStats: {
        daily: {
          games: profile.stats?.modeStats?.daily?.games || 0,
          wins: profile.stats?.modeStats?.daily?.wins || 0,
          bestStreak: profile.stats?.modeStats?.daily?.bestStreak || 0,
          averageAttempts: profile.stats?.modeStats?.daily?.averageAttempts || 0,
          perfectGames: profile.stats?.modeStats?.daily?.perfectGames || 0
        },
        infinite: {
          games: profile.stats?.modeStats?.infinite?.games || 0,
          wins: profile.stats?.modeStats?.infinite?.wins || 0,
          bestStreak: profile.stats?.modeStats?.infinite?.bestStreak || 0,
          totalSongsCompleted: profile.stats?.modeStats?.infinite?.totalSongsCompleted || 0,
          longestSession: profile.stats?.modeStats?.infinite?.longestSession || 0
        },
        multiplayer: {
          games: profile.stats?.modeStats?.multiplayer?.games || 0,
          wins: profile.stats?.modeStats?.multiplayer?.wins || 0,
          roomsCreated: profile.stats?.modeStats?.multiplayer?.roomsCreated || 0,
          totalPoints: profile.stats?.modeStats?.multiplayer?.totalPoints || 0,
          bestRoundScore: profile.stats?.modeStats?.multiplayer?.bestRoundScore || 0
        }
      }
    },
    achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
    gameHistory: Array.isArray(profile.gameHistory) ? profile.gameHistory : [],
    franchiseStats: profile.franchiseStats || {},
    preferences: {
      theme: 'dark',
      language: 'pt',
      notifications: true,
      showAchievementPopups: true,
      hasSeenProfileTutorial: false,
      ...profile.preferences
    },
    badges: Array.isArray(profile.badges) ? profile.badges : [],
    titles: Array.isArray(profile.titles) ? profile.titles : [],
    currentTitle: profile.currentTitle || null,
    socialStats: {
      gamesShared: 0,
      friendsReferred: 0,
      friendsAdded: 0,
      multiplayerGamesPlayed: 0,
      multiplayerWins: 0,
      invitesSent: 0,
      invitesAccepted: 0,
      socialInteractions: 0,
      helpfulActions: 0,
      ...profile.socialStats
    }
  };
  
  console.log('🔧 Perfil reparado com sucesso');
  return baseProfile;
};

// Sincronizar perfil entre localStorage e estado
export const syncProfileWithLocalStorage = (userId, currentProfile, setProfile) => {
  if (!userId || !setProfile) return;
  
  try {
    // Carregar perfil do localStorage
    const localProfile = loadProfileFromLocalStorage(userId);
    
    // Se não há perfil local ou o perfil atual é mais recente, salvar o atual no localStorage
    if (!localProfile || (currentProfile && new Date(currentProfile.lastUpdated) > new Date(localProfile.lastUpdated))) {
      if (currentProfile) {
        saveProfileToLocalStorage(userId, currentProfile);
      }
      return;
    }
    
    // Se o perfil local é mais recente, atualizar o estado
    if (localProfile && (!currentProfile || new Date(localProfile.lastUpdated) > new Date(currentProfile.lastUpdated))) {
      setProfile(localProfile);
      console.log('🔄 Perfil atualizado do localStorage');
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar perfil com localStorage:', error);
  }
};