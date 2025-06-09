// Sistema de conquistas do LudoMusic
export const achievements = {
  // Conquistas básicas
  first_game: {
    id: 'first_game',
    title: 'Primeiro Passo',
    description: 'Jogue sua primeira partida',
    icon: '🎮',
    rarity: 'common',
    xpReward: 50
  },
  first_win: {
    id: 'first_win',
    title: 'Primeira Vitória',
    description: 'Acerte sua primeira música',
    icon: '🏆',
    rarity: 'common',
    xpReward: 100
  },
  veteran: {
    id: 'veteran',
    title: 'Veterano',
    description: 'Jogue 10 partidas',
    icon: '🎖️',
    rarity: 'common',
    xpReward: 200
  },
  experienced: {
    id: 'experienced',
    title: 'Experiente',
    description: 'Jogue 50 partidas',
    icon: '⭐',
    rarity: 'uncommon',
    xpReward: 500
  },
  master: {
    id: 'master',
    title: 'Mestre',
    description: 'Jogue 100 partidas',
    icon: '👑',
    rarity: 'rare',
    xpReward: 1000
  },

  // Conquistas de streak
  streak_5: {
    id: 'streak_5',
    title: 'Em Chamas',
    description: 'Acerte 5 músicas seguidas',
    icon: '🔥',
    rarity: 'uncommon',
    xpReward: 300
  },
  streak_10: {
    id: 'streak_10',
    title: 'Imparável',
    description: 'Acerte 10 músicas seguidas',
    icon: '⚡',
    rarity: 'rare',
    xpReward: 600
  },
  streak_25: {
    id: 'streak_25',
    title: 'Lendário',
    description: 'Acerte 25 músicas seguidas',
    icon: '🌟',
    rarity: 'legendary',
    xpReward: 1500
  },

  // Conquistas de eficiência
  perfect_first: {
    id: 'perfect_first',
    title: 'Acerto Perfeito',
    description: 'Acerte uma música na primeira tentativa',
    icon: '💎',
    rarity: 'uncommon',
    xpReward: 250
  },
  perfect_master: {
    id: 'perfect_master',
    title: 'Mestre da Perfeição',
    description: 'Acerte 10 músicas na primeira tentativa',
    icon: '💠',
    rarity: 'epic',
    xpReward: 800
  },
  high_accuracy: {
    id: 'high_accuracy',
    title: 'Precisão Cirúrgica',
    description: 'Mantenha 80% de taxa de acerto em 20+ jogos',
    icon: '🎯',
    rarity: 'epic',
    xpReward: 1000
  },

  // Conquistas de tempo
  hour_played: {
    id: 'hour_played',
    title: 'Dedicado',
    description: 'Jogue por 1 hora total',
    icon: '⏰',
    rarity: 'common',
    xpReward: 200
  },
  ten_hours_played: {
    id: 'ten_hours_played',
    title: 'Viciado',
    description: 'Jogue por 10 horas totais',
    icon: '⏳',
    rarity: 'rare',
    xpReward: 800
  },

  // Conquistas especiais
  speed_demon: {
    id: 'speed_demon',
    title: 'Demônio da Velocidade',
    description: 'Acerte uma música em menos de 5 segundos (tempo real)',
    icon: '💨',
    rarity: 'epic',
    xpReward: 500
  },
  franchise_master: {
    id: 'franchise_master',
    title: 'Especialista',
    description: 'Acerte 10 músicas da mesma franquia',
    icon: '🎪',
    rarity: 'rare',
    xpReward: 400
  },
  night_owl: {
    id: 'night_owl',
    title: 'Coruja Noturna',
    description: 'Jogue entre 00:00 e 06:00',
    icon: '🦉',
    rarity: 'uncommon',
    xpReward: 150
  },
  early_bird: {
    id: 'early_bird',
    title: 'Madrugador',
    description: 'Jogue entre 05:00 e 08:00',
    icon: '🐦',
    rarity: 'uncommon',
    xpReward: 150
  },

  // Conquistas de modo infinito
  infinite_starter: {
    id: 'infinite_starter',
    title: 'Infinito Iniciante',
    description: 'Complete 5 músicas no modo infinito',
    icon: '♾️',
    rarity: 'common',
    xpReward: 200
  },
  infinite_warrior: {
    id: 'infinite_warrior',
    title: 'Guerreiro Infinito',
    description: 'Complete 25 músicas no modo infinito',
    icon: '⚔️',
    rarity: 'rare',
    xpReward: 600
  },
  infinite_legend: {
    id: 'infinite_legend',
    title: 'Lenda Infinita',
    description: 'Complete 100 músicas no modo infinito',
    icon: '🏛️',
    rarity: 'legendary',
    xpReward: 2000
  },

  // Conquistas de multiplayer
  social_player: {
    id: 'social_player',
    title: 'Jogador Social',
    description: 'Jogue sua primeira partida multiplayer',
    icon: '👥',
    rarity: 'common',
    xpReward: 150
  },
  room_creator: {
    id: 'room_creator',
    title: 'Criador de Salas',
    description: 'Crie 5 salas multiplayer',
    icon: '🏠',
    rarity: 'uncommon',
    xpReward: 300
  },
  multiplayer_champion: {
    id: 'multiplayer_champion',
    title: 'Campeão Multiplayer',
    description: 'Vença 10 partidas multiplayer',
    icon: '🏅',
    rarity: 'rare',
    xpReward: 500
  },
  multiplayer_dominator: {
    id: 'multiplayer_dominator',
    title: 'Dominador Multiplayer',
    description: 'Vença 10 jogos multiplayer',
    icon: '👑',
    rarity: 'epic',
    xpReward: 750
  },

  // Conquistas de XP e nível
  level_5: {
    id: 'level_5',
    title: 'Ascensão',
    description: 'Alcance o nível 5',
    icon: '⬆️',
    rarity: 'common',
    xpReward: 100
  },
  level_10: {
    id: 'level_10',
    title: 'Veterano Experiente',
    description: 'Alcance o nível 10',
    icon: '🔟',
    rarity: 'uncommon',
    xpReward: 300
  },
  level_25: {
    id: 'level_25',
    title: 'Mestre Musical',
    description: 'Alcance o nível 25',
    icon: '🎼',
    rarity: 'rare',
    xpReward: 800
  },
  level_50: {
    id: 'level_50',
    title: 'Lenda Viva',
    description: 'Alcance o nível 50',
    icon: '👑',
    rarity: 'epic',
    xpReward: 2000
  },

  // Conquistas de tempo
  marathon_player: {
    id: 'marathon_player',
    title: 'Maratonista',
    description: 'Jogue por 5 horas em uma sessão',
    icon: '🏃',
    rarity: 'rare',
    xpReward: 600
  },
  daily_player: {
    id: 'daily_player',
    title: 'Jogador Diário',
    description: 'Complete o jogo diário por 3 dias consecutivos',
    icon: '📅',
    rarity: 'uncommon',
    xpReward: 300
  },

  // Conquistas especiais de performance
  lightning_fast: {
    id: 'lightning_fast',
    title: 'Raio Veloz',
    description: 'Acerte uma música em menos de 3 segundos (tempo real)',
    icon: '⚡',
    rarity: 'epic',
    xpReward: 750
  },
  perfectionist: {
    id: 'perfectionist',
    title: 'Perfeccionista',
    description: 'Acerte 25 músicas na primeira tentativa',
    icon: '💯',
    rarity: 'epic',
    xpReward: 1200
  },
  franchise_expert: {
    id: 'franchise_expert',
    title: 'Especialista em Franquia',
    description: 'Tenha 90% de acerto em uma franquia (mín. 20 jogos)',
    icon: '🎯',
    rarity: 'rare',
    xpReward: 500
  },

  // Conquistas sociais
  social_butterfly: {
    id: 'social_butterfly',
    title: 'Borboleta Social',
    description: 'Compartilhe 10 resultados',
    icon: '🦋',
    rarity: 'uncommon',
    xpReward: 250
  },
  influencer: {
    id: 'influencer',
    title: 'Influenciador',
    description: 'Refira 5 amigos para o jogo',
    icon: '📢',
    rarity: 'rare',
    xpReward: 800
  },

  // Conquistas de colecionador
  collector: {
    id: 'collector',
    title: 'Colecionador',
    description: 'Acerte músicas de 20 franquias diferentes',
    icon: '📚',
    rarity: 'rare',
    xpReward: 600
  },
  completionist: {
    id: 'completionist',
    title: 'Completista',
    description: 'Acerte músicas de todas as franquias disponíveis',
    icon: '🏆',
    rarity: 'legendary',
    xpReward: 3000
  },

  // Conquistas de resistência
  unstoppable: {
    id: 'unstoppable',
    title: 'Imparável',
    description: 'Vença 50 jogos consecutivos',
    icon: '🚀',
    rarity: 'legendary',
    xpReward: 2500
  },
  comeback_king: {
    id: 'comeback_king',
    title: 'Rei do Comeback',
    description: 'Vença após perder 5 jogos seguidos',
    icon: '👑',
    rarity: 'epic',
    xpReward: 400
  },
  daily_dedication: {
    id: 'daily_dedication',
    title: 'Dedicação Total',
    description: 'Jogue por 7 dias consecutivos (qualquer modo)',
    icon: '🔥',
    rarity: 'rare',
    xpReward: 500
  }
};

// Raridades e suas cores
export const rarityColors = {
  common: '#9CA3AF',     // Cinza
  uncommon: '#10B981',   // Verde
  rare: '#3B82F6',       // Azul
  epic: '#8B5CF6',       // Roxo
  legendary: '#F59E0B'   // Dourado
};

// Função para obter conquista por ID
export const getAchievement = (id) => {
  return achievements[id] || null;
};

// Função para obter todas as conquistas de uma raridade
export const getAchievementsByRarity = (rarity) => {
  return Object.values(achievements).filter(achievement => achievement.rarity === rarity);
};

// Função para calcular progresso de conquistas
export const calculateAchievementProgress = (achievementId, userStats, profile = null) => {
  const achievement = achievements[achievementId];
  if (!achievement) return 0;

  switch (achievementId) {
    // Conquistas básicas
    case 'first_game':
      return userStats.totalGames >= 1 ? 100 : 0;
    case 'first_win':
      return userStats.wins >= 1 ? 100 : 0;
    case 'veteran':
      return Math.min(100, (userStats.totalGames / 10) * 100);
    case 'experienced':
      return Math.min(100, (userStats.totalGames / 50) * 100);
    case 'master':
      return Math.min(100, (userStats.totalGames / 100) * 100);

    // Conquistas de streak
    case 'streak_5':
      return Math.min(100, (userStats.bestStreak / 5) * 100);
    case 'streak_10':
      return Math.min(100, (userStats.bestStreak / 10) * 100);
    case 'streak_25':
      return Math.min(100, (userStats.bestStreak / 25) * 100);

    // Conquistas de eficiência
    case 'perfect_first':
      return userStats.perfectGames >= 1 ? 100 : 0;
    case 'perfect_master':
      return Math.min(100, (userStats.perfectGames / 10) * 100);
    case 'perfectionist':
      return Math.min(100, (userStats.perfectGames / 25) * 100);
    case 'high_accuracy':
      if (userStats.totalGames < 20) return 0;
      return userStats.winRate >= 80 ? 100 : Math.min(100, (userStats.winRate / 80) * 100);

    // Conquistas de tempo
    case 'hour_played':
      return Math.min(100, (userStats.totalPlayTime / 3600) * 100);
    case 'ten_hours_played':
      return Math.min(100, (userStats.totalPlayTime / 36000) * 100);
    case 'marathon_player':
      // Verificar se há dados de sessão longa (5 horas)
      if (userStats.longestSession && userStats.longestSession >= 18000) { // 5 horas em segundos
        return 100;
      }
      // Verificar se há registro de sessão maratona no histórico
      if (profile?.gameHistory) {
        const marathonSession = profile.gameHistory.find(game =>
          game.mode === 'marathon_session' && game.playTime >= 18000
        );
        return marathonSession ? 100 : 0;
      }
      return 0;

    // Conquistas especiais
    case 'speed_demon':
      return userStats.fastestWin && userStats.fastestWin <= 5 ? 100 : 0;
    case 'lightning_fast':
      return userStats.fastestWin && userStats.fastestWin <= 3 ? 100 : 0;
    case 'franchise_master':
      if (!profile?.franchiseStats) return 0;
      const franchiseWith10 = Object.values(profile.franchiseStats).find(
        stats => stats.wins >= 10
      );
      return franchiseWith10 ? 100 : 0;
    case 'franchise_expert':
      if (!profile?.franchiseStats) return 0;
      const expertFranchise = Object.values(profile.franchiseStats).find(
        stats => stats.gamesPlayed >= 20 && stats.winRate >= 90
      );
      return expertFranchise ? 100 : 0;

    // Conquistas de modo infinito
    case 'infinite_starter':
      return Math.min(100, (userStats.modeStats?.infinite?.totalSongsCompleted / 5) * 100);
    case 'infinite_warrior':
      return Math.min(100, (userStats.modeStats?.infinite?.totalSongsCompleted / 25) * 100);
    case 'infinite_legend':
      return Math.min(100, (userStats.modeStats?.infinite?.totalSongsCompleted / 100) * 100);

    // Conquistas de multiplayer
    case 'social_player':
      return userStats.modeStats?.multiplayer?.games >= 1 ? 100 : 0;
    case 'room_creator':
      return Math.min(100, (userStats.modeStats?.multiplayer?.roomsCreated / 5) * 100);
    case 'multiplayer_champion':
      return Math.min(100, (userStats.modeStats?.multiplayer?.wins / 10) * 100);
    case 'multiplayer_dominator':
      return Math.min(100, ((profile?.socialStats?.multiplayerWins || 0) / 10) * 100);

    // Conquistas de nível
    case 'level_5':
      return profile?.level >= 5 ? 100 : Math.min(100, (profile?.level / 5) * 100);
    case 'level_10':
      return profile?.level >= 10 ? 100 : Math.min(100, (profile?.level / 10) * 100);
    case 'level_25':
      return profile?.level >= 25 ? 100 : Math.min(100, (profile?.level / 25) * 100);
    case 'level_50':
      return profile?.level >= 50 ? 100 : Math.min(100, (profile?.level / 50) * 100);

    // Conquistas sociais
    case 'social_butterfly':
      return Math.min(100, (profile?.socialStats?.gamesShared / 10) * 100);
    case 'influencer':
      return Math.min(100, (profile?.socialStats?.friendsReferred / 5) * 100);

    // Conquistas de colecionador
    case 'collector':
      if (!profile?.franchiseStats) return 0;
      const franchisesPlayed = Object.keys(profile.franchiseStats).length;
      return Math.min(100, (franchisesPlayed / 20) * 100);
    case 'completionist':
      // Precisa verificar contra total de franquias disponíveis
      if (!profile?.franchiseStats) return 0;
      // Por enquanto, usar um número fixo de franquias (será atualizado quando tivermos a lista completa)
      const totalFranchises = 50; // Número estimado de franquias no jogo
      const playedFranchises = Object.keys(profile.franchiseStats).length;
      return Math.min(100, (playedFranchises / totalFranchises) * 100);

    // Conquistas de resistência
    case 'unstoppable':
      return Math.min(100, (userStats.bestStreak / 50) * 100);
    case 'comeback_king':
      // Verificar se há registro de comeback no histórico
      if (profile?.gameHistory) {
        const comebackGame = profile.gameHistory.find(game =>
          game.won && game.isComeback && game.consecutiveLosses >= 5
        );
        return comebackGame ? 100 : 0;
      }
      return 0;
    case 'daily_dedication':
      // Verificar dias consecutivos (agora usando dados do perfil)
      if (profile?.consecutiveData?.consecutiveDays) {
        return profile.consecutiveData.consecutiveDays >= 7 ? 100 : Math.min(100, (profile.consecutiveData.consecutiveDays / 7) * 100);
      }
      return 0;

    case 'daily_player':
      // Verificar jogos diários consecutivos
      if (profile?.gameHistory) {
        const dailyGames = profile.gameHistory.filter(game => game.mode === 'daily' && game.won);
        const last3Days = [];
        const today = new Date();

        for (let i = 0; i < 3; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const hasGameOnDate = dailyGames.some(game =>
            game.date && game.date.split('T')[0] === dateStr
          );

          if (hasGameOnDate) {
            last3Days.push(dateStr);
          } else {
            break; // Quebrou a sequência
          }
        }

        return last3Days.length >= 3 ? 100 : Math.min(100, (last3Days.length / 3) * 100);
      }
      return 0;

    // Conquistas de modo infinito
    case 'infinite_starter':
      return Math.min(100, ((userStats.modeStats?.infinite?.totalSongsCompleted || 0) / 5) * 100);
    case 'infinite_warrior':
      return Math.min(100, ((userStats.modeStats?.infinite?.totalSongsCompleted || 0) / 25) * 100);
    case 'infinite_legend':
      return Math.min(100, ((userStats.modeStats?.infinite?.totalSongsCompleted || 0) / 100) * 100);

    // Conquistas de multiplayer
    case 'social_player':
      return (userStats.modeStats?.multiplayer?.games || 0) >= 1 ? 100 : 0;
    case 'room_creator':
      return Math.min(100, ((userStats.modeStats?.multiplayer?.roomsCreated || 0) / 5) * 100);
    case 'multiplayer_champion':
      return Math.min(100, ((userStats.modeStats?.multiplayer?.wins || 0) / 10) * 100);
    case 'multiplayer_dominator':
      return Math.min(100, ((userStats.modeStats?.multiplayer?.wins || 0) / 10) * 100);

    // Conquistas de tempo especiais
    case 'night_owl':
      // Verificar se há jogos noturnos no histórico
      if (profile?.gameHistory) {
        const nightGame = profile.gameHistory.find(game => {
          if (!game.date) return false;
          const hour = new Date(game.date).getHours();
          return hour >= 0 && hour < 6;
        });
        return nightGame ? 100 : 0;
      }
      return 0;

    case 'early_bird':
      // Verificar se há jogos matutinos no histórico
      if (profile?.gameHistory) {
        const morningGame = profile.gameHistory.find(game => {
          if (!game.date) return false;
          const hour = new Date(game.date).getHours();
          return hour >= 5 && hour < 8;
        });
        return morningGame ? 100 : 0;
      }
      return 0;

    default:
      return 0;
  }
};

// Função para obter conquistas próximas de serem desbloqueadas
export const getNearAchievements = (userStats, userAchievements, profile = null) => {
  const nearAchievements = [];

  Object.values(achievements).forEach(achievement => {
    if (!userAchievements.includes(achievement.id)) {
      const progress = calculateAchievementProgress(achievement.id, userStats, profile);
      if (progress >= 25) { // 25% ou mais de progresso
        nearAchievements.push({
          ...achievement,
          progress
        });
      }
    }
  });

  return nearAchievements.sort((a, b) => b.progress - a.progress);
};

// Função para verificar se uma conquista foi desbloqueada
export const checkAchievementUnlocked = (achievementId, userStats, profile = null) => {
  return calculateAchievementProgress(achievementId, userStats, profile) >= 100;
};

// Função para obter todas as conquistas desbloqueadas
export const getUnlockedAchievements = (userStats, profile = null) => {
  const unlockedAchievements = [];

  Object.values(achievements).forEach(achievement => {
    if (checkAchievementUnlocked(achievement.id, userStats, profile)) {
      unlockedAchievements.push(achievement.id);
    }
  });

  return unlockedAchievements;
};

// Função para obter estatísticas de conquistas
export const getAchievementStats = (userAchievements) => {
  const totalAchievements = Object.keys(achievements).length;
  const unlockedCount = userAchievements.length;
  const completionPercentage = (unlockedCount / totalAchievements) * 100;

  const rarityStats = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  };

  userAchievements.forEach(achievementId => {
    const achievement = achievements[achievementId];
    if (achievement) {
      rarityStats[achievement.rarity]++;
    }
  });

  return {
    total: totalAchievements,
    unlocked: unlockedCount,
    completionPercentage,
    rarityStats
  };
};
