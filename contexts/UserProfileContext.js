import React, { createContext, useContext, useState, useEffect } from 'react';

const UserProfileContext = createContext();

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile deve ser usado dentro de UserProfileProvider');
  }
  return context;
};

export const UserProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Estrutura padrão do perfil
  const createDefaultProfile = () => {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: userId,
      username: `Player${Math.floor(Math.random() * 10000)}`,
      displayName: '',
      bio: '',
      avatar: '/default-avatar.png',
      level: 1,
      xp: 0,
      createdAt: new Date().toISOString(),
      
      // Estatísticas gerais
      stats: {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalPlayTime: 0, // em segundos
        averageAttempts: 0,
        perfectGames: 0, // acertou na primeira tentativa
        
        // Estatísticas por modo
        dailyMode: {
          gamesPlayed: 0,
          wins: 0,
          currentStreak: 0,
          bestStreak: 0
        },
        infiniteMode: {
          gamesPlayed: 0,
          bestStreak: 0,
          totalSongs: 0,
          averageStreak: 0
        },
        multiplayerMode: {
          gamesPlayed: 0,
          wins: 0,
          roomsCreated: 0,
          roomsJoined: 0
        }
      },
      
      // Conquistas desbloqueadas
      achievements: [],
      
      // Histórico recente (últimos 10 jogos)
      recentGames: [],
      
      // Preferências
      preferences: {
        showProfile: true,
        showStats: true,
        showAchievements: true,
        allowFriendRequests: true
      },
      
      // Dados de franquias favoritas
      franchiseStats: {},
      
      // Músicas favoritas (que mais acerta)
      favoriteSongs: []
    };
  };

  // Verificar se está no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Carregar perfil do localStorage
  useEffect(() => {
    if (isClient) {
      loadProfile();
    }
  }, [isClient]);

  const loadProfile = () => {
    try {
      setIsLoading(true);

      // Verificar se localStorage está disponível
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('localStorage não disponível, usando perfil temporário');
        const newProfile = createDefaultProfile();
        setProfile(newProfile);
        setIsLoading(false);
        return;
      }

      const savedProfile = localStorage.getItem('ludomusic_user_profile');

      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        // Verificar se o perfil tem todas as propriedades necessárias
        const defaultProfile = createDefaultProfile();
        const mergedProfile = mergeProfileData(defaultProfile, parsedProfile);
        setProfile(mergedProfile);
      } else {
        // Criar novo perfil
        const newProfile = createDefaultProfile();
        setProfile(newProfile);
        saveProfile(newProfile);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Em caso de erro, criar novo perfil
      const newProfile = createDefaultProfile();
      setProfile(newProfile);
      saveProfile(newProfile);
    } finally {
      setIsLoading(false);
    }
  };

  // Mesclar dados do perfil (para compatibilidade com versões antigas)
  const mergeProfileData = (defaultProfile, savedProfile) => {
    const merged = { ...defaultProfile };
    
    // Mesclar propriedades básicas
    Object.keys(savedProfile).forEach(key => {
      if (typeof savedProfile[key] === 'object' && savedProfile[key] !== null) {
        merged[key] = { ...defaultProfile[key], ...savedProfile[key] };
      } else {
        merged[key] = savedProfile[key];
      }
    });
    
    return merged;
  };

  // Salvar perfil no localStorage
  const saveProfile = (profileData) => {
    try {
      // Verificar se localStorage está disponível
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('localStorage não disponível, não é possível salvar perfil');
        return;
      }

      localStorage.setItem('ludomusic_user_profile', JSON.stringify(profileData));
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  // Atualizar perfil
  const updateProfile = (updates) => {
    if (!profile) return;
    
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);
  };

  // Atualizar estatísticas após um jogo
  const updateGameStats = (gameResult) => {
    if (!profile) return;

    const newStats = { ...profile.stats };
    const newProfile = { ...profile };

    // Estatísticas gerais
    newStats.totalGames += 1;
    
    if (gameResult.won) {
      newStats.totalWins += 1;
      newStats.currentStreak += 1;
      newStats.bestStreak = Math.max(newStats.bestStreak, newStats.currentStreak);
      
      // Jogo perfeito (acertou na primeira)
      if (gameResult.attempts === 1) {
        newStats.perfectGames += 1;
      }
    } else {
      newStats.totalLosses += 1;
      newStats.currentStreak = 0;
    }

    // Calcular taxa de vitória
    newStats.winRate = (newStats.totalWins / newStats.totalGames * 100);
    
    // Calcular média de tentativas
    const totalAttempts = (newStats.averageAttempts * (newStats.totalGames - 1)) + gameResult.attempts;
    newStats.averageAttempts = totalAttempts / newStats.totalGames;

    // Atualizar tempo de jogo
    if (gameResult.playTime) {
      newStats.totalPlayTime += gameResult.playTime;
    }

    // Estatísticas por modo
    if (gameResult.mode === 'daily') {
      newStats.dailyMode.gamesPlayed += 1;
      if (gameResult.won) {
        newStats.dailyMode.wins += 1;
        newStats.dailyMode.currentStreak += 1;
        newStats.dailyMode.bestStreak = Math.max(
          newStats.dailyMode.bestStreak, 
          newStats.dailyMode.currentStreak
        );
      } else {
        newStats.dailyMode.currentStreak = 0;
      }
    } else if (gameResult.mode === 'infinite') {
      newStats.infiniteMode.gamesPlayed += 1;
      newStats.infiniteMode.totalSongs += gameResult.songsCompleted || 1;
      if (gameResult.streak) {
        newStats.infiniteMode.bestStreak = Math.max(
          newStats.infiniteMode.bestStreak, 
          gameResult.streak
        );
        // Calcular média de streak
        const totalStreaks = newStats.infiniteMode.averageStreak * (newStats.infiniteMode.gamesPlayed - 1) + gameResult.streak;
        newStats.infiniteMode.averageStreak = totalStreaks / newStats.infiniteMode.gamesPlayed;
      }
    }

    // Atualizar estatísticas de franquia
    if (gameResult.song) {
      const franchise = gameResult.song.game;
      if (!newProfile.franchiseStats[franchise]) {
        newProfile.franchiseStats[franchise] = {
          gamesPlayed: 0,
          wins: 0,
          winRate: 0
        };
      }
      
      newProfile.franchiseStats[franchise].gamesPlayed += 1;
      if (gameResult.won) {
        newProfile.franchiseStats[franchise].wins += 1;
      }
      newProfile.franchiseStats[franchise].winRate = 
        (newProfile.franchiseStats[franchise].wins / newProfile.franchiseStats[franchise].gamesPlayed * 100);
    }

    // Adicionar ao histórico recente
    const recentGame = {
      id: Date.now(),
      date: new Date().toISOString(),
      mode: gameResult.mode,
      won: gameResult.won,
      attempts: gameResult.attempts,
      song: gameResult.song ? {
        title: gameResult.song.title,
        game: gameResult.song.game,
        artist: gameResult.song.artist
      } : null,
      playTime: gameResult.playTime || 0
    };

    newProfile.recentGames = [recentGame, ...profile.recentGames].slice(0, 10);

    // Calcular XP e nível
    const xpGained = calculateXP(gameResult);
    newProfile.xp += xpGained;
    newProfile.level = calculateLevel(newProfile.xp);

    // Verificar conquistas
    const newAchievements = checkAchievements(newProfile, gameResult);
    newProfile.achievements = [...new Set([...profile.achievements, ...newAchievements])];

    // Atualizar perfil
    newProfile.stats = newStats;
    setProfile(newProfile);
    saveProfile(newProfile);

    return { xpGained, newAchievements };
  };

  // Calcular XP baseado no resultado do jogo
  const calculateXP = (gameResult) => {
    let xp = 10; // XP base por jogar
    
    if (gameResult.won) {
      xp += 50; // Bônus por ganhar
      
      // Bônus por eficiência (menos tentativas = mais XP)
      const efficiencyBonus = Math.max(0, (7 - gameResult.attempts) * 10);
      xp += efficiencyBonus;
      
      // Bônus por jogo perfeito
      if (gameResult.attempts === 1) {
        xp += 100;
      }
    }
    
    return xp;
  };

  // Calcular nível baseado no XP
  const calculateLevel = (totalXP) => {
    // Fórmula: Level = sqrt(XP / 100) + 1
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
  };

  // Verificar conquistas desbloqueadas
  const checkAchievements = (profileData, gameResult) => {
    const achievements = [];
    const stats = profileData.stats;
    
    // Conquistas básicas
    if (stats.totalGames === 1) achievements.push('first_game');
    if (stats.totalWins === 1) achievements.push('first_win');
    if (stats.totalGames === 10) achievements.push('veteran');
    if (stats.totalGames === 50) achievements.push('experienced');
    if (stats.totalGames === 100) achievements.push('master');
    
    // Conquistas de streak
    if (stats.bestStreak === 5) achievements.push('streak_5');
    if (stats.bestStreak === 10) achievements.push('streak_10');
    if (stats.bestStreak === 25) achievements.push('streak_25');
    
    // Conquistas de eficiência
    if (stats.perfectGames === 1) achievements.push('perfect_first');
    if (stats.perfectGames === 10) achievements.push('perfect_master');
    if (stats.winRate >= 80 && stats.totalGames >= 20) achievements.push('high_accuracy');
    
    // Conquistas de tempo
    if (stats.totalPlayTime >= 3600) achievements.push('hour_played'); // 1 hora
    if (stats.totalPlayTime >= 36000) achievements.push('ten_hours_played'); // 10 horas
    
    return achievements.filter(achievement => !profileData.achievements.includes(achievement));
  };

  const value = {
    profile,
    isLoading,
    updateProfile,
    updateGameStats,
    loadProfile
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
