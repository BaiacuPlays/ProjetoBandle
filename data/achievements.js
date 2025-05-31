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
    description: 'Acerte uma música em menos de 5 segundos',
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
export const calculateAchievementProgress = (achievementId, userStats) => {
  const achievement = achievements[achievementId];
  if (!achievement) return 0;

  switch (achievementId) {
    case 'veteran':
      return Math.min(100, (userStats.totalGames / 10) * 100);
    case 'experienced':
      return Math.min(100, (userStats.totalGames / 50) * 100);
    case 'master':
      return Math.min(100, (userStats.totalGames / 100) * 100);
    case 'streak_5':
      return Math.min(100, (userStats.bestStreak / 5) * 100);
    case 'streak_10':
      return Math.min(100, (userStats.bestStreak / 10) * 100);
    case 'streak_25':
      return Math.min(100, (userStats.bestStreak / 25) * 100);
    case 'perfect_master':
      return Math.min(100, (userStats.perfectGames / 10) * 100);
    case 'hour_played':
      return Math.min(100, (userStats.totalPlayTime / 3600) * 100);
    case 'ten_hours_played':
      return Math.min(100, (userStats.totalPlayTime / 36000) * 100);
    case 'infinite_starter':
      return Math.min(100, (userStats.infiniteMode?.totalSongs / 5) * 100);
    case 'infinite_warrior':
      return Math.min(100, (userStats.infiniteMode?.totalSongs / 25) * 100);
    case 'infinite_legend':
      return Math.min(100, (userStats.infiniteMode?.totalSongs / 100) * 100);
    case 'multiplayer_champion':
      return Math.min(100, (userStats.multiplayerMode?.wins / 10) * 100);
    case 'room_creator':
      return Math.min(100, (userStats.multiplayerMode?.roomsCreated / 5) * 100);
    default:
      return 0;
  }
};

// Função para obter conquistas próximas de serem desbloqueadas
export const getNearAchievements = (userStats, userAchievements) => {
  const nearAchievements = [];
  
  Object.values(achievements).forEach(achievement => {
    if (!userAchievements.includes(achievement.id)) {
      const progress = calculateAchievementProgress(achievement.id, userStats);
      if (progress >= 50) { // 50% ou mais de progresso
        nearAchievements.push({
          ...achievement,
          progress
        });
      }
    }
  });
  
  return nearAchievements.sort((a, b) => b.progress - a.progress);
};
