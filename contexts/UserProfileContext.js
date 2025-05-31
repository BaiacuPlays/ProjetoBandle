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

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/profile?userId=${userId}`);
      const data = await response.json();
      
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Em caso de erro, criar perfil local temporário
      const tempProfile = {
        id: userId,
        username: `Jogador_${userId?.slice(-6) || '000000'}`,
        displayName: '',
        bio: '',
        avatar: '/default-avatar.png',
        level: 1,
        xp: 0,
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          currentStreak: 0,
          bestStreak: 0
        },
        achievements: [],
        gameHistory: []
      };
      setProfile(tempProfile);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar perfil
  const updateProfile = async (updates) => {
    if (!profile || !userId) return;

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          updates
        }),
      });

      const data = await response.json();
      
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      // Fallback: atualizar localmente
      setProfile(prev => ({ ...prev, ...updates }));
    }
  };

  // Atualizar estatísticas do jogo
  const updateGameStats = async (gameStats) => {
    if (!profile || !userId) return;

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          gameStats
        }),
      });

      const data = await response.json();
      
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      // Fallback: atualizar localmente
      if (gameStats.won) {
        setProfile(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            totalGames: prev.stats.totalGames + 1,
            wins: prev.stats.wins + 1,
            currentStreak: prev.stats.currentStreak + 1,
            bestStreak: Math.max(prev.stats.bestStreak, prev.stats.currentStreak + 1)
          },
          xp: prev.xp + 50
        }));
      } else {
        setProfile(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            totalGames: prev.stats.totalGames + 1,
            losses: prev.stats.losses + 1,
            currentStreak: 0
          },
          xp: prev.xp + 10
        }));
      }
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
