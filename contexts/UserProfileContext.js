import React, { createContext, useContext, useState, useEffect } from 'react';

const UserProfileContext = createContext();

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    console.warn('useUserProfile usado fora do UserProfileProvider');
    return {
      profile: null,
      isLoading: false,
      updateProfile: () => {},
      updateGameStats: () => {}
    };
  }
  return context;
};

export const UserProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [userId, setUserId] = useState(null);

  // Gerar ou recuperar ID do usuário
  const getUserId = () => {
    if (typeof window === 'undefined') return null;
    
    let storedUserId = localStorage.getItem('ludomusic_user_id');
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ludomusic_user_id', storedUserId);
    }
    return storedUserId;
  };

  // Verificar se está no cliente
  useEffect(() => {
    setIsClient(true);
    const id = getUserId();
    setUserId(id);
  }, []);

  // Carregar perfil quando o componente montar
  useEffect(() => {
    if (isClient && userId) {
      loadProfile();
    }
  }, [isClient, userId]);

  const loadProfile = () => {
    try {
      setIsLoading(true);

      // Tentar carregar do localStorage
      const savedProfile = localStorage.getItem(`ludomusic_profile_${userId}`);

      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
      } else {
        // Criar novo perfil
        const newProfile = {
          id: userId,
          username: `Jogador_${userId?.slice(-6) || '000000'}`,
          displayName: '',
          bio: '',
          avatar: '/default-avatar.svg',
          level: 1,
          xp: 0,
          createdAt: new Date().toISOString(),
          stats: {
            totalGames: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            currentStreak: 0,
            bestStreak: 0,
            totalPlayTime: 0,
            modeStats: {
              daily: { games: 0, wins: 0 },
              infinite: { games: 0, wins: 0, bestStreak: 0 }
            }
          },
          achievements: [],
          gameHistory: []
        };

        setProfile(newProfile);
        localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(newProfile));
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar perfil
  const updateProfile = (updates) => {
    if (!profile || !userId) return;

    try {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);

      // Salvar no localStorage
      localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

      return updatedProfile;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  // Atualizar estatísticas do jogo
  const updateGameStats = (gameStats) => {
    if (!profile || !userId) return;

    try {
      let updatedProfile;

      if (gameStats.won) {
        updatedProfile = {
          ...profile,
          stats: {
            ...profile.stats,
            totalGames: profile.stats.totalGames + 1,
            wins: profile.stats.wins + 1,
            currentStreak: profile.stats.currentStreak + 1,
            bestStreak: Math.max(profile.stats.bestStreak, profile.stats.currentStreak + 1),
            winRate: ((profile.stats.wins + 1) / (profile.stats.totalGames + 1)) * 100
          },
          xp: profile.xp + 50
        };
      } else {
        updatedProfile = {
          ...profile,
          stats: {
            ...profile.stats,
            totalGames: profile.stats.totalGames + 1,
            losses: profile.stats.losses + 1,
            currentStreak: 0,
            winRate: (profile.stats.wins / (profile.stats.totalGames + 1)) * 100
          },
          xp: profile.xp + 10
        };
      }

      setProfile(updatedProfile);
      localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(updatedProfile));

      return updatedProfile;
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  };

  const value = {
    profile,
    isLoading,
    updateProfile,
    updateGameStats
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
