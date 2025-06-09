import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UserProfileContext = createContext();

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile deve ser usado dentro de UserProfileProvider');
  }
  return context;
};

const createDefaultProfile = (userId, username) => ({
  id: userId,
  username: username,
  displayName: '',
  bio: '',
  avatar: '/default-avatar.svg',
  level: 1,
  xp: 0,
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  stats: {
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalPlayTime: 0,
    perfectGames: 0,
    averageAttempts: 0,
    fastestWin: null,
    xp: 0,
    level: 1,
    modeStats: {
      daily: { games: 0, wins: 0, bestStreak: 0, averageAttempts: 0, perfectGames: 0 },
      infinite: { games: 0, wins: 0, bestStreak: 0, totalSongsCompleted: 0, longestSession: 0 },
      multiplayer: { games: 0, wins: 0, roomsCreated: 0, totalPoints: 0, bestRoundScore: 0 }
    }
  },
  achievements: [],
  badges: [],
  gameHistory: [],
  preferences: {
    language: 'pt',
    theme: 'dark',
    soundEnabled: true,
    musicVolume: 0.7,
    effectsVolume: 0.5,
    notifications: true,
    autoplay: true,
    showHints: true,
    colorblindMode: false
  },
  social: {
    friends: [],
    friendRequests: [],
    blockedUsers: [],
    isProfilePublic: true,
    allowFriendRequests: true
  },
  titles: [],
  currentTitle: null,
  donationBenefits: {
    isSupporter: false,
    benefits: [],
    expiresAt: null
  }
});

export const UserProfileProvider = ({ children }) => {
  const { user, isAuthenticated, userId } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const saveProfile = async (profileData) => {
    if (!isAuthenticated || !userId) {
      throw new Error('Usuário não autenticado');
    }

    const sessionToken = localStorage.getItem('ludomusic_session_token');
    if (!sessionToken) {
      throw new Error('Token de sessão não encontrado');
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          profile: {
            ...profileData,
            id: userId,
            lastUpdated: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erro ao salvar: ${response.status} - ${errorData.error || 'Erro desconhecido'}`);
      }

      const result = await response.json();
      console.log('✅ Perfil salvo:', result);
      return result.profile;
    } catch (error) {
      console.error('❌ Erro ao salvar perfil:', error);
      throw error;
    }
  };

  const loadProfile = async (userId) => {
    console.log('🔍 loadProfile chamado com userId:', userId);

    if (!userId || !isAuthenticated) {
      console.log('❌ loadProfile: condições não atendidas:', { userId, isAuthenticated });
      return null;
    }

    const sessionToken = localStorage.getItem('ludomusic_session_token');
    if (!sessionToken) {
      console.log('❌ loadProfile: token de sessão não encontrado');
      return null;
    }

    try {
      console.log('🌐 Fazendo requisição para:', `/api/profile?userId=${userId}`);
      const response = await fetch(`/api/profile?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      console.log('📡 Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('📭 Perfil não encontrado (404)');
          return null;
        }
        throw new Error(`Erro ao carregar: ${response.status}`);
      }

      const result = await response.json();
      console.log('📦 Dados recebidos da API:', result);
      return result.profile;
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('🔄 UserProfile useEffect triggered:', { isAuthenticated, userId, username: user?.username });

    const loadUserProfile = async () => {
      if (!isAuthenticated || !userId || !user?.username) {
        console.log('❌ Condições não atendidas para carregar perfil:', { isAuthenticated, userId, username: user?.username });
        setProfile(null);
        return;
      }

      console.log('🔄 Iniciando carregamento do perfil para:', user.username);
      setIsLoading(true);

      try {
        console.log('🔍 Tentando carregar perfil existente...');
        let userProfile = await loadProfile(userId);

        if (!userProfile) {
          console.log('📝 Perfil não encontrado, criando novo perfil para:', user.username);
          userProfile = createDefaultProfile(userId, user.username);
          console.log('💾 Salvando novo perfil...');
          await saveProfile(userProfile);
          console.log('✅ Novo perfil salvo com sucesso');
        }

        setProfile(userProfile);
        console.log('✅ Perfil carregado com sucesso:', userProfile.username);
      } catch (error) {
        console.error('❌ Erro ao carregar perfil do usuário:', error);
        console.log('🔄 Criando perfil básico como fallback...');
        const basicProfile = createDefaultProfile(userId, user.username);
        setProfile(basicProfile);
        console.log('✅ Perfil básico criado');
      } finally {
        setIsLoading(false);
        console.log('🏁 Carregamento do perfil finalizado');
      }
    };

    loadUserProfile();
  }, [isAuthenticated, userId, user?.username]); // Usar user?.username em vez de user

  const updateProfile = async (updates) => {
    if (!profile) {
      throw new Error('Perfil não carregado');
    }

    try {
      const updatedProfile = {
        ...profile,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      const savedProfile = await saveProfile(updatedProfile);
      setProfile(savedProfile);
      return savedProfile;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  const updateStats = async (newStats) => {
    if (!profile) return;

    try {
      const updatedProfile = {
        ...profile,
        stats: {
          ...profile.stats,
          ...newStats,
          xp: newStats.xp || profile.xp,
          level: newStats.level || profile.level
        },
        xp: newStats.xp || profile.xp,
        level: newStats.level || profile.level,
        lastUpdated: new Date().toISOString()
      };

      const savedProfile = await saveProfile(updatedProfile);
      setProfile(savedProfile);
      return savedProfile;
    } catch (error) {
      console.error('❌ Erro ao atualizar estatísticas:', error);
      throw error;
    }
  };

  const resetProfile = async () => {
    if (!profile) return;

    try {
      const resetProfile = createDefaultProfile(userId, user.username);
      const savedProfile = await saveProfile(resetProfile);
      setProfile(savedProfile);
      return savedProfile;
    } catch (error) {
      console.error('❌ Erro ao resetar perfil:', error);
      throw error;
    }
  };

  // Função para atualizar estatísticas de jogo e calcular XP
  const updateGameStats = async (gameData) => {
    if (!profile) return;

    try {
      const { won, attempts, mode, playTime = 0 } = gameData;

      // Calcular XP baseado no resultado
      let xpGained = 0;
      if (won) {
        // XP por vitória baseado no número de tentativas (menos tentativas = mais XP)
        const baseXP = 50;
        const attemptBonus = Math.max(0, (7 - attempts) * 10); // Bônus por acertar rápido
        xpGained = baseXP + attemptBonus;
      } else {
        // XP por participação mesmo perdendo
        xpGained = 10;
      }

      // Atualizar estatísticas
      const currentStats = profile.stats || {};
      const newStats = {
        ...currentStats,
        totalGames: (currentStats.totalGames || 0) + 1,
        wins: won ? (currentStats.wins || 0) + 1 : (currentStats.wins || 0),
        losses: !won ? (currentStats.losses || 0) + 1 : (currentStats.losses || 0),
        totalPlayTime: (currentStats.totalPlayTime || 0) + playTime,
        xp: (currentStats.xp || 0) + xpGained
      };

      // Calcular winRate
      if (newStats.totalGames > 0) {
        newStats.winRate = Math.round((newStats.wins / newStats.totalGames) * 100);
      }

      // Calcular nível baseado no XP
      const totalXP = (profile.xp || 0) + xpGained;
      const newLevel = Math.floor(Math.sqrt(totalXP / 300)) + 1;

      // Atualizar perfil
      const updatedProfile = {
        ...profile,
        xp: totalXP,
        level: newLevel,
        stats: newStats,
        lastUpdated: new Date().toISOString()
      };

      const savedProfile = await saveProfile(updatedProfile);
      setProfile(savedProfile);

      console.log(`🎮 Jogo concluído: ${won ? 'Vitória' : 'Derrota'} | XP ganho: +${xpGained} | XP total: ${totalXP}`);

      return savedProfile;
    } catch (error) {
      console.error('❌ Erro ao atualizar estatísticas do jogo:', error);
      throw error;
    }
  };

  const value = {
    profile,
    isLoading,
    updateProfile,
    updateStats,
    updateGameStats,
    resetProfile,
    userId
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
