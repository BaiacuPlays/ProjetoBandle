import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUnlockedAchievements, checkAchievementUnlocked, achievements } from '../data/achievements';
import { getUnlockedBadges, checkBadgeUnlocked, badges, syncProfileBadges } from '../data/badges';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile deve ser usado dentro de ProfileProvider');
  }
  return context;
};

// Estrutura padrão do perfil
const createDefaultProfile = (userId, username) => ({
  id: userId,
  username: username,
  displayName: username,
  bio: '',
  profilePhoto: '🎮',
  avatar: '🎮', // Compatibilidade com sistema antigo
  level: 1,
  xp: 0,
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),

  // Estatísticas do jogo
  stats: {
    totalGames: 0,
    wins: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    averageAttempts: 0,
    perfectGames: 0,
    totalPlayTime: 0,
    longestSession: 0,
    fastestWin: null,

    // Estatísticas por modo
    modeStats: {
      daily: {
        gamesPlayed: 0,
        wins: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastPlayedDate: null,
        hasPlayedToday: false
      },
      infinite: {
        games: 0,
        wins: 0,
        bestStreak: 0,
        currentStreak: 0,
        totalSongsCompleted: 0
      },
      multiplayer: {
        gamesPlayed: 0,
        wins: 0,
        roomsCreated: 0,
        roomsJoined: 0
      }
    }
  },

  // Conquistas e badges
  achievements: [],
  badges: [],
  selectedBadge: null, // Badge selecionada para exibição

  // Histórico de jogos
  gameHistory: [],

  // Preferências
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

  // Sistema social
  social: {
    friends: [],
    friendRequests: [],
    blockedUsers: [],
    isProfilePublic: true,
    allowFriendRequests: true
  },



  // Benefícios de doação
  donationBenefits: {
    isSupporter: false,
    benefits: [],
    expiresAt: null
  },

  // Estatísticas sociais
  socialStats: {
    gamesShared: 0,
    friendsReferred: 0,
    friendsAdded: 0,
    multiplayerGamesPlayed: 0,
    multiplayerWins: 0,
    invitesSent: 0,
    invitesAccepted: 0,
    socialInteractions: 0,
    helpfulActions: 0
  },

  // Estatísticas de franquias
  franchiseStats: {},

  // Dados de dias consecutivos
  consecutiveData: {
    consecutiveDays: 0,
    lastPlayDate: null
  }
});

export const ProfileProvider = ({ children }) => {
  const { user, isAuthenticated, userId, username } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar perfil quando usuário faz login
  useEffect(() => {
    if (isAuthenticated && userId && username) {
      loadProfile();
    } else {
      setProfile(null);
      setError(null);
    }
  }, [isAuthenticated, userId, username]);

  // Função para carregar perfil
  const loadProfile = async () => {
    if (!userId || !username) return;

    setIsLoading(true);
    setError(null);

    try {
      // Tentar carregar do servidor
      const response = await fetch(`/api/profile?userId=${userId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          // Garantir que as estatísticas estejam inicializadas
          let profile = data.profile;
          if (!profile.stats?.modeStats?.infinite) {
            if (!profile.stats) profile.stats = {};
            if (!profile.stats.modeStats) profile.stats.modeStats = {};
            profile.stats.modeStats.infinite = {
              games: 0,
              wins: 0,
              bestStreak: 0,
              currentStreak: 0,
              totalSongsCompleted: 0
            };
            console.log('📊 Inicializando estatísticas do modo infinito no perfil carregado');
          }

          // Sincronizar badges com estatísticas atuais
          const syncedProfile = syncProfileBadges(profile);
          if (syncedProfile !== profile) {
            console.log('🎖️ Badges sincronizadas com estatísticas atuais');
            profile = syncedProfile;
            // Salvar perfil atualizado
            await saveProfile(profile);
          }

          setProfile(profile);
          console.log('✅ Perfil carregado do servidor');
          return;
        }
      }

      // Se não encontrou no servidor, criar novo perfil
      const newProfile = createDefaultProfile(userId, username);
      await saveProfile(newProfile);
      setProfile(newProfile);
      console.log('✅ Novo perfil criado');

    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error);
      setError('Erro ao carregar perfil');

      // Em caso de erro, criar perfil local temporário
      const tempProfile = createDefaultProfile(userId, username);
      setProfile(tempProfile);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para salvar perfil
  const saveProfile = async (profileData) => {
    if (!profileData || !userId) return false;

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          profile: {
            ...profileData,
            lastUpdated: new Date().toISOString()
          }
        }),
      });

      if (response.ok) {
        console.log('✅ Perfil salvo no servidor');
        return true;
      } else {
        console.error('❌ Erro ao salvar perfil no servidor');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao salvar perfil:', error);
      return false;
    }
  };

  // Função para atualizar perfil
  const updateProfile = async (updates) => {
    if (!profile) return false;

    const updatedProfile = {
      ...profile,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    setProfile(updatedProfile);
    const saved = await saveProfile(updatedProfile);

    if (!saved) {
      console.warn('⚠️ Perfil atualizado localmente, mas não foi salvo no servidor');
    }

    return true;
  };

  // Função para atualizar estatísticas
  const updateStats = async (newStats) => {
    if (!profile) return false;

    return await updateProfile({
      stats: {
        ...profile.stats,
        ...newStats
      }
    });
  };

  // Função para atualizar preferências
  const updatePreferences = async (newPreferences) => {
    if (!profile) return false;

    return await updateProfile({
      preferences: {
        ...profile.preferences,
        ...newPreferences
      }
    });
  };

  // Função para verificar e desbloquear conquistas
  const checkAndUnlockAchievements = async (gameData = null) => {
    if (!profile) return [];

    const currentAchievements = profile.achievements || [];
    const newlyUnlocked = [];

    console.log('🔍 DEBUG - Verificando conquistas para perfil:', profile.username);
    console.log('🔍 DEBUG - Conquistas atuais no perfil:', currentAchievements);
    console.log('🔍 DEBUG - Estatísticas do perfil:', profile.stats);

    // Verificar todas as conquistas
    Object.values(achievements).forEach(achievement => {
      if (!currentAchievements.includes(achievement.id)) {
        const isUnlocked = checkAchievementUnlocked(achievement.id, profile.stats, profile);
        console.log(`🔍 DEBUG - ${achievement.id}: ${isUnlocked ? 'DESBLOQUEADA' : 'bloqueada'}`);
        if (isUnlocked) {
          newlyUnlocked.push(achievement.id);
        }
      }
    });

    // Se há novas conquistas, atualizar perfil
    if (newlyUnlocked.length > 0) {
      const updatedAchievements = [...currentAchievements, ...newlyUnlocked];

      console.log('🏆 DEBUG - Conquistas antes da atualização:', currentAchievements);
      console.log('🏆 DEBUG - Novas conquistas:', newlyUnlocked);
      console.log('🏆 DEBUG - Conquistas após atualização:', updatedAchievements);

      await updateProfile({
        achievements: updatedAchievements
      });

      console.log('🏆 Novas conquistas desbloqueadas:', newlyUnlocked);

      // Mostrar notificações para cada conquista desbloqueada
      newlyUnlocked.forEach(achievementId => {
        const achievement = achievements[achievementId];
        if (achievement && window.showAchievementToast) {
          window.showAchievementToast(achievement);
        }
      });
    }

    return newlyUnlocked;
  };

  // Função para verificar e desbloquear badges
  const checkAndUnlockBadges = async () => {
    if (!profile) return [];

    const currentBadges = profile.badges || [];
    const newlyUnlocked = [];

    // Verificar todos os badges
    Object.values(badges).forEach(badge => {
      if (!currentBadges.includes(badge.id)) {
        if (checkBadgeUnlocked(badge.id, profile)) {
          newlyUnlocked.push(badge.id);
        }
      }
    });

    // Se há novos badges, atualizar perfil
    if (newlyUnlocked.length > 0) {
      const updatedBadges = [...currentBadges, ...newlyUnlocked];
      await updateProfile({
        badges: updatedBadges
      });

      console.log('🎖️ Novos badges desbloqueados:', newlyUnlocked);
    }

    return newlyUnlocked;
  };

  // Função para atualizar estatísticas do jogo
  const updateGameStats = async (gameData) => {
    if (!profile) return false;

    const { won, attempts, mode, song, streak, songsCompleted, playTime, isComeback, consecutiveLosses, dailyGameCompleted, gameDate } = gameData;

    // Atualizar estatísticas básicas
    const newStats = { ...profile.stats };
    newStats.totalGames = (newStats.totalGames || 0) + 1;

    if (won) {
      newStats.wins = (newStats.wins || 0) + 1;

      // Atualizar streak
      if (mode === 'daily') {
        newStats.currentStreak = (newStats.currentStreak || 0) + 1;
        newStats.bestStreak = Math.max(newStats.bestStreak || 0, newStats.currentStreak);
      }

      // Verificar jogo perfeito (1 tentativa)
      if (attempts === 1) {
        newStats.perfectGames = (newStats.perfectGames || 0) + 1;
      }

      // Atualizar tempo mais rápido
      if (playTime && (!newStats.fastestWin || playTime < newStats.fastestWin)) {
        newStats.fastestWin = playTime;
      }
    } else {
      // Reset streak em caso de derrota no modo diário
      if (mode === 'daily') {
        newStats.currentStreak = 0;
      }
    }

    // Atualizar estatísticas por modo
    if (!newStats.modeStats) {
      newStats.modeStats = {
        daily: { games: 0, wins: 0, currentStreak: 0, bestStreak: 0, lastPlayedDate: null, hasPlayedToday: false },
        infinite: { games: 0, wins: 0, bestStreak: 0, currentStreak: 0, totalSongsCompleted: 0 },
        multiplayer: { games: 0, wins: 0, roomsCreated: 0, roomsJoined: 0 }
      };
    }

    // Atualizar estatísticas específicas do modo
    if (mode === 'daily') {
      newStats.modeStats.daily.games = (newStats.modeStats.daily.games || 0) + 1;
      if (won) {
        newStats.modeStats.daily.wins = (newStats.modeStats.daily.wins || 0) + 1;
        newStats.modeStats.daily.currentStreak = (newStats.modeStats.daily.currentStreak || 0) + 1;
        newStats.modeStats.daily.bestStreak = Math.max(newStats.modeStats.daily.bestStreak || 0, newStats.modeStats.daily.currentStreak);
      } else {
        newStats.modeStats.daily.currentStreak = 0;
      }
      newStats.modeStats.daily.lastPlayedDate = new Date().toISOString();
      newStats.modeStats.daily.hasPlayedToday = true;

      // 📅 SISTEMA DE DIAS CONSECUTIVOS para conquista "Daily Dedication"
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const currentConsecutiveData = profile.consecutiveData || {
        consecutiveDays: 0,
        lastPlayDate: null,
        longestStreak: 0
      };

      const lastPlayDate = currentConsecutiveData.lastPlayDate;

      if (lastPlayDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastPlayDate === yesterdayStr) {
          // Jogou ontem, continuar sequência
          currentConsecutiveData.consecutiveDays += 1;
        } else if (lastPlayDate !== today) {
          // Quebrou a sequência, resetar
          currentConsecutiveData.consecutiveDays = 1;
        }
        // Se lastPlayDate === today, não fazer nada (já jogou hoje)
      } else {
        // Primeiro jogo, iniciar sequência
        currentConsecutiveData.consecutiveDays = 1;
      }

      // Atualizar data do último jogo
      currentConsecutiveData.lastPlayDate = today;

      // Atualizar maior sequência
      currentConsecutiveData.longestStreak = Math.max(
        currentConsecutiveData.longestStreak || 0,
        currentConsecutiveData.consecutiveDays
      );

      // Salvar dados de dias consecutivos no perfil
      profile.consecutiveData = currentConsecutiveData;

      // 🔥 SISTEMA DE RETORNO APÓS 30 DIAS para conquista "Phoenix Rising"
      const lastGameDate = profile.lastGameDate;
      if (lastGameDate) {
        const daysSinceLastGame = Math.floor((Date.now() - new Date(lastGameDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastGame >= 30) {
          newStats.returnedAfter30Days = true;
          console.log('🔥 Phoenix Rising: Usuário retornou após', daysSinceLastGame, 'dias');
        }
      }

      // Atualizar data do último jogo
      profile.lastGameDate = new Date().toISOString();
    } else if (mode === 'infinite') {
      console.log('📊 Atualizando estatísticas do modo infinito:', { won, streak, songsCompleted });
      newStats.modeStats.infinite.games = (newStats.modeStats.infinite.games || 0) + 1;
      if (won) {
        newStats.modeStats.infinite.wins = (newStats.modeStats.infinite.wins || 0) + 1;
        // Para modo infinito, usar o streak passado como parâmetro
        if (streak) {
          newStats.modeStats.infinite.currentStreak = streak;
          newStats.modeStats.infinite.bestStreak = Math.max(newStats.modeStats.infinite.bestStreak || 0, streak);
          console.log('📊 Novo streak no modo infinito:', streak, 'Melhor:', newStats.modeStats.infinite.bestStreak);
        }
        if (songsCompleted) {
          newStats.modeStats.infinite.totalSongsCompleted = (newStats.modeStats.infinite.totalSongsCompleted || 0) + songsCompleted;
        }
      } else {
        // Quando perde no modo infinito, resetar streak atual
        newStats.modeStats.infinite.currentStreak = 0;
        console.log('📊 Resetando streak atual do modo infinito');
      }
      console.log('📊 Estatísticas do modo infinito atualizadas:', newStats.modeStats.infinite);
    } else if (mode === 'multiplayer') {
      newStats.modeStats.multiplayer.gamesPlayed = (newStats.modeStats.multiplayer.gamesPlayed || 0) + 1;
      if (won) {
        newStats.modeStats.multiplayer.wins = (newStats.modeStats.multiplayer.wins || 0) + 1;
      }
    }

    // Calcular taxa de vitória
    newStats.winRate = newStats.totalGames > 0 ? Math.round((newStats.wins / newStats.totalGames) * 100) : 0;

    // Atualizar dados de tempo nas estatísticas
    if (playTime) {
      newStats.totalPlayTime = (newStats.totalPlayTime || 0) + playTime;
      newStats.longestSession = Math.max(newStats.longestSession || 0, playTime);

      // 🏃 CONQUISTAS DE VELOCIDADE
      if (won) {
        // Speed Demon: Acertar em 3 segundos ou menos
        if (playTime <= 3) {
          newStats.fastestGuess = Math.min(newStats.fastestGuess || 999, playTime);
        }

        // Lightning Fast: Acertar rápido (menos de 5 segundos)
        if (playTime <= 5) {
          newStats.fastGuesses = (newStats.fastGuesses || 0) + 1;
        }
      }

      // Patient Listener: Ouvir música completa (mais de 25 segundos)
      if (playTime >= 25) {
        newStats.fullListenCount = (newStats.fullListenCount || 0) + 1;
      }
    }

    // 🎯 CALCULAR E ADICIONAR XP
    let xpGained = 0;

    if (won) {
      if (attempts === 1) {
        xpGained += 100; // 🎯 Acertar na 1ª tentativa: +100 XP
      } else {
        xpGained += 50;  // 🎵 Vitória normal: +50 XP
      }

      // 🔥 Bônus por sequência: +10 XP por cada 5 vitórias seguidas
      if (mode === 'daily' && newStats.currentStreak > 0 && newStats.currentStreak % 5 === 0) {
        xpGained += 10;
      }
    } else {
      xpGained += 10; // 📚 Tentar mesmo perdendo: +10 XP
    }

    // Atualizar XP e recalcular nível
    const currentXP = profile.xp || 0;
    const currentLevel = profile.level || 1;
    const newXP = currentXP + xpGained;
    const newLevel = Math.floor(Math.sqrt(newXP / 300)) + 1;

    console.log(`🎯 XP Ganho: +${xpGained} | Total: ${newXP} | Nível: ${currentLevel} → ${newLevel}`);

    // 🎉 VERIFICAR SE HOUVE LEVEL UP
    const leveledUp = newLevel > currentLevel;
    if (leveledUp) {
      console.log(`🎉 LEVEL UP! Nível ${currentLevel} → ${newLevel}`);
    }

    // 🎮 COLETAR ESTATÍSTICAS ESPECÍFICAS PARA CONQUISTAS
    if (song && won) {
      // 🎵 CONQUISTAS DE COMPOSITOR/ARTISTA
      const songTitle = song.title?.toLowerCase() || '';
      const gameTitle = song.game?.toLowerCase() || '';

      // Toby Fox (Undertale, Deltarune)
      if (gameTitle.includes('undertale') || gameTitle.includes('deltarune')) {
        newStats.tobyFoxSongs = (newStats.tobyFoxSongs || 0) + 1;
      }

      // David Wise (Donkey Kong Country)
      if (gameTitle.includes('donkey kong country') || gameTitle.includes('dkc')) {
        newStats.davidWiseSongs = (newStats.davidWiseSongs || 0) + 1;
      }

      // 🎮 CONQUISTAS DE GÊNERO/CATEGORIA
      // Horror games
      const horrorGames = ['resident evil', 'silent hill', 'dead space', 'outlast', 'amnesia', 'phasmophobia', 'five nights'];
      if (horrorGames.some(horror => gameTitle.includes(horror))) {
        newStats.horrorGamesCorrect = (newStats.horrorGamesCorrect || 0) + 1;
      }

      // Indie games
      const indieGames = ['celeste', 'hollow knight', 'cuphead', 'ori and', 'shovel knight', 'katana zero', 'pizza tower', 'a hat in time'];
      if (indieGames.some(indie => gameTitle.includes(indie))) {
        newStats.indieGamesCorrect = (newStats.indieGamesCorrect || 0) + 1;
      }

      // RPG games
      const rpgGames = ['final fantasy', 'chrono trigger', 'persona', 'dragon quest', 'tales of', 'xenoblade', 'fire emblem'];
      if (rpgGames.some(rpg => gameTitle.includes(rpg))) {
        newStats.rpgGamesCorrect = (newStats.rpgGamesCorrect || 0) + 1;
      }

      // Nintendo games
      const nintendoGames = ['mario', 'zelda', 'pokemon', 'metroid', 'kirby', 'donkey kong', 'star fox', 'f-zero'];
      if (nintendoGames.some(nintendo => gameTitle.includes(nintendo))) {
        newStats.nintendoGamesCorrect = (newStats.nintendoGamesCorrect || 0) + 1;
      }

      // PlayStation games
      const playstationGames = ['god of war', 'uncharted', 'last of us', 'horizon', 'bloodborne', 'gran turismo'];
      if (playstationGames.some(ps => gameTitle.includes(ps))) {
        newStats.playstationGamesCorrect = (newStats.playstationGamesCorrect || 0) + 1;
      }

      // Retro 90s games
      const retro90sGames = ['sonic', 'street fighter', 'mega man', 'castlevania', 'contra', 'double dragon'];
      if (retro90sGames.some(retro => gameTitle.includes(retro))) {
        newStats.retro90sCorrect = (newStats.retro90sCorrect || 0) + 1;
      }

      // 🔤 CONQUISTAS DE PADRÕES
      // Alphabet Collector: Músicas que começam com letras específicas
      const firstLetter = songTitle.charAt(0);
      if (firstLetter.match(/[a-z]/)) {
        if (!newStats.alphabetLetters) newStats.alphabetLetters = 0;
        newStats.alphabetLetters += 1;
      }

      // Number Hunter: Músicas com números no título
      if (songTitle.match(/\d/)) {
        newStats.numberedSongs = (newStats.numberedSongs || 0) + 1;
      }

      // 🎯 CONQUISTAS DE DESCOBERTA
      // Contar gêneros únicos descobertos (baseado no jogo)
      const genres = new Set(newStats.genresDiscovered || []);
      if (horrorGames.some(horror => gameTitle.includes(horror))) genres.add('horror');
      if (indieGames.some(indie => gameTitle.includes(indie))) genres.add('indie');
      if (rpgGames.some(rpg => gameTitle.includes(rpg))) genres.add('rpg');
      if (nintendoGames.some(nintendo => gameTitle.includes(nintendo))) genres.add('nintendo');
      if (playstationGames.some(ps => gameTitle.includes(ps))) genres.add('playstation');
      newStats.genresDiscovered = genres.size;

      // Contar décadas descobertas (estimativa baseada no jogo)
      const decades = new Set(newStats.decadesDiscovered || []);
      if (retro90sGames.some(retro => gameTitle.includes(retro))) decades.add('90s');
      if (gameTitle.includes('mario') || gameTitle.includes('zelda')) decades.add('80s');
      if (indieGames.some(indie => gameTitle.includes(indie))) decades.add('2010s');
      newStats.decadesDiscovered = decades.size;

      // 🏆 CONQUISTAS ESPECIAIS
      // Music Savant: Músicas únicas corretas
      if (!newStats.uniqueSongsCorrect) newStats.uniqueSongsCorrect = 0;
      newStats.uniqueSongsCorrect += 1;

      // Century Club: Total de acertos
      if (!newStats.totalCorrect) newStats.totalCorrect = 0;
      newStats.totalCorrect += 1;
    }

    // 🕐 CONQUISTAS DE TIMING
    const currentHour = new Date().getHours();

    // Midnight Gamer: Jogar entre 0h-6h (qualquer resultado)
    if (currentHour >= 0 && currentHour < 6) {
      newStats.midnightGames = (newStats.midnightGames || 0) + 1;
    }

    // Early Bird: Jogar entre 5h-8h (qualquer resultado)
    if (currentHour >= 5 && currentHour < 8) {
      newStats.earlyBirdGames = (newStats.earlyBirdGames || 0) + 1;
    }

    // Night Owl: Jogar entre 22h-4h (qualquer resultado)
    if (currentHour >= 22 || currentHour < 4) {
      newStats.nightOwlGames = (newStats.nightOwlGames || 0) + 1;
    }

    // 🏆 CONQUISTAS DE PERSISTÊNCIA
    // Never Give Up: Continuar jogando após 10 derrotas consecutivas
    if (consecutiveLosses >= 10 && won) {
      newStats.continuedAfter10Losses = true;
    }

    // Weekend Warrior: Jogar nos fins de semana
    const currentDay = new Date().getDay(); // 0 = domingo, 6 = sábado
    if ((currentDay === 0 || currentDay === 6) && won) {
      newStats.consecutiveWeekends = (newStats.consecutiveWeekends || 0) + 1;
    }

    // 🎮 CONQUISTAS DE CONSOLE/PLATAFORMA
    if (song && won) {
      const gameTitle = song.game?.toLowerCase() || '';
      const consoles = new Set(newStats.consolesDiscovered || []);

      // Detectar consoles baseado nos jogos
      if (gameTitle.includes('mario') || gameTitle.includes('zelda') || gameTitle.includes('pokemon')) {
        consoles.add('nintendo');
      }
      if (gameTitle.includes('god of war') || gameTitle.includes('uncharted') || gameTitle.includes('last of us')) {
        consoles.add('playstation');
      }
      if (gameTitle.includes('halo') || gameTitle.includes('gears of war') || gameTitle.includes('forza')) {
        consoles.add('xbox');
      }
      if (gameTitle.includes('half-life') || gameTitle.includes('counter-strike') || gameTitle.includes('portal')) {
        consoles.add('pc');
      }
      if (gameTitle.includes('sonic') || gameTitle.includes('streets of rage')) {
        consoles.add('sega');
      }

      newStats.consolesDiscovered = consoles.size;
    }

    // Atualizar estatísticas de franquia
    const newFranchiseStats = { ...profile.franchiseStats };
    if (song && song.game) {
      const franchise = song.game;
      if (!newFranchiseStats[franchise]) {
        newFranchiseStats[franchise] = { games: 0, wins: 0, winRate: 0 };
      }
      newFranchiseStats[franchise].games += 1;
      if (won) {
        newFranchiseStats[franchise].wins += 1;
      }
      // Calcular winRate
      newFranchiseStats[franchise].winRate = newFranchiseStats[franchise].games > 0
        ? (newFranchiseStats[franchise].wins / newFranchiseStats[franchise].games) * 100
        : 0;
    }

    // Adicionar ao histórico de jogos
    const gameHistoryEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      mode,
      song: song ? { title: song.title, game: song.game, id: song.id } : null,
      won,
      attempts,
      playTime,
      isComeback,
      consecutiveLosses,
      gameDate
    };

    const newGameHistory = [...(profile.gameHistory || []), gameHistoryEntry];

    // Atualizar perfil com XP e nível
    const success = await updateProfile({
      xp: newXP,
      level: newLevel,
      stats: newStats,
      franchiseStats: newFranchiseStats,
      gameHistory: newGameHistory
    });

    if (success) {
      // 🎉 MOSTRAR NOTIFICAÇÃO DE LEVEL UP
      if (leveledUp && window.showLevelUpToast) {
        console.log(`🎉 Chamando showLevelUpToast para nível ${newLevel}`);
        setTimeout(() => {
          window.showLevelUpToast(newLevel);
        }, 500); // Pequeno delay para garantir que a UI foi atualizada
      }

      // Verificar conquistas e badges após atualizar estatísticas
      setTimeout(async () => {
        await checkAndUnlockAchievements(gameData);
        await checkAndUnlockBadges();
      }, 100);
    }

    return success;
  };

  // Função para atualizar estatísticas sociais
  const updateSocialStats = async (action, data = {}) => {
    if (!profile) return false;

    const newSocialStats = { ...profile.socialStats };
    let xpGained = 0;

    switch (action) {
      case 'share_game':
        newSocialStats.gamesShared = (newSocialStats.gamesShared || 0) + 1;
        xpGained = 5; // +5 XP por compartilhar
        break;

      case 'multiplayer_game':
        newSocialStats.multiplayerGamesPlayed = (newSocialStats.multiplayerGamesPlayed || 0) + 1;

        // XP baseado no número de rodadas
        const baseXP = Math.floor((data.totalRounds || 10) * 2); // 2 XP por rodada
        xpGained = baseXP;

        if (data.won) {
          newSocialStats.multiplayerWins = (newSocialStats.multiplayerWins || 0) + 1;
          xpGained += Math.floor(baseXP * 0.5); // +50% XP bônus para vencedor
        }
        break;

      case 'room_created':
        // 🏆 CONQUISTA PARTY STARTER: Criar salas multiplayer
        const newStats = { ...profile.stats };
        if (!newStats.modeStats) {
          newStats.modeStats = {
            daily: { games: 0, wins: 0, currentStreak: 0, bestStreak: 0, lastPlayedDate: null, hasPlayedToday: false },
            infinite: { games: 0, wins: 0, bestStreak: 0, currentStreak: 0, totalSongsCompleted: 0 },
            multiplayer: { gamesPlayed: 0, wins: 0, roomsCreated: 0, roomsJoined: 0 }
          };
        }
        newStats.modeStats.multiplayer.roomsCreated = (newStats.modeStats.multiplayer.roomsCreated || 0) + 1;

        // Atualizar perfil com nova estatística
        await updateProfile({ stats: newStats });

        xpGained = 10; // +10 XP por criar sala
        break;

      case 'friend_added':
        newSocialStats.friendsAdded = (newSocialStats.friendsAdded || 0) + 1;
        xpGained = 10; // +10 XP por adicionar amigo
        break;

      case 'invite_sent':
        newSocialStats.invitesSent = (newSocialStats.invitesSent || 0) + 1;
        xpGained = 2; // +2 XP por convite enviado
        break;

      case 'invite_accepted':
        newSocialStats.invitesAccepted = (newSocialStats.invitesAccepted || 0) + 1;
        xpGained = 15; // +15 XP por convite aceito
        break;

      case 'social_interaction':
        newSocialStats.socialInteractions = (newSocialStats.socialInteractions || 0) + 1;
        xpGained = 1; // +1 XP por interação social
        break;

      case 'helpful_action':
        newSocialStats.helpfulActions = (newSocialStats.helpfulActions || 0) + 1;
        xpGained = 5; // +5 XP por ação útil
        break;

      case 'friend_referred':
        // 🏆 CONQUISTA INFLUENCER: Referir amigos
        newSocialStats.friendsReferred = (newSocialStats.friendsReferred || 0) + 1;
        xpGained = 50; // +50 XP por referir amigo
        break;

      default:
        console.warn('Ação social desconhecida:', action);
        return false;
    }

    // Atualizar XP e nível
    const currentXP = profile.xp || 0;
    const currentLevel = profile.level || 1;
    const newXP = currentXP + xpGained;
    const newLevel = Math.floor(Math.sqrt(newXP / 300)) + 1;

    console.log(`🤝 Ação social: ${action} | XP: +${xpGained} | Total: ${newXP}`);

    // Verificar level up
    const leveledUp = newLevel > currentLevel;
    if (leveledUp) {
      console.log(`🎉 LEVEL UP social! Nível ${currentLevel} → ${newLevel}`);
    }

    // Atualizar perfil
    const success = await updateProfile({
      xp: newXP,
      level: newLevel,
      socialStats: newSocialStats
    });

    if (success && leveledUp && window.showLevelUpToast) {
      setTimeout(() => {
        window.showLevelUpToast(newLevel);
      }, 500);
    }

    return success;
  };

  // Função para recarregar dados
  const reloadProfile = async () => {
    if (isAuthenticated && userId) {
      await loadProfile();
    }
  };

  const value = {
    profile,
    isLoading,
    error,
    updateProfile,
    updateStats,
    updatePreferences,
    updateGameStats,
    updateSocialStats,
    checkAndUnlockAchievements,
    checkAndUnlockBadges,
    reloadProfile,
    saveProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
