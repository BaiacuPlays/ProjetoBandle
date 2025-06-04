// Sistema de badges e títulos especiais
export const badges = {
  // Badges de nível
  level_rookie: {
    id: 'level_rookie',
    title: 'Novato',
    description: 'Alcançou o nível 5',
    icon: '🌱',
    color: '#10B981',
    requirement: { type: 'level', value: 5 },
    rarity: 'common'
  },
  level_veteran: {
    id: 'level_veteran',
    title: 'Veterano',
    description: 'Alcançou o nível 15',
    icon: '⚔️',
    color: '#3B82F6',
    requirement: { type: 'level', value: 15 },
    rarity: 'uncommon'
  },
  level_expert: {
    id: 'level_expert',
    title: 'Especialista',
    description: 'Alcançou o nível 30',
    icon: '🎯',
    color: '#8B5CF6',
    requirement: { type: 'level', value: 30 },
    rarity: 'rare'
  },
  level_master: {
    id: 'level_master',
    title: 'Mestre',
    description: 'Alcançou o nível 50',
    icon: '👑',
    color: '#F59E0B',
    requirement: { type: 'level', value: 50 },
    rarity: 'epic'
  },
  level_legend: {
    id: 'level_legend',
    title: 'Lenda',
    description: 'Alcançou o nível 100',
    icon: '🌟',
    color: '#EF4444',
    requirement: { type: 'level', value: 100 },
    rarity: 'legendary'
  },

  // Badges de performance
  perfectionist: {
    id: 'perfectionist',
    title: 'Perfeccionista',
    description: 'Acertou 50 músicas na primeira tentativa',
    icon: '💯',
    color: '#1DB954',
    requirement: { type: 'perfectGames', value: 50 },
    rarity: 'epic'
  },
  speed_demon: {
    id: 'speed_demon',
    title: 'Demônio da Velocidade',
    description: 'Acertou uma música em menos de 2 segundos',
    icon: '⚡',
    color: '#FBBF24',
    requirement: { type: 'fastestWin', value: 2 },
    rarity: 'legendary'
  },
  streak_master: {
    id: 'streak_master',
    title: 'Mestre das Sequências',
    description: 'Conseguiu uma sequência de 25 vitórias',
    icon: '🔥',
    color: '#EF4444',
    requirement: { type: 'bestStreak', value: 25 },
    rarity: 'epic'
  },

  // Badges de dedicação
  daily_warrior: {
    id: 'daily_warrior',
    title: 'Guerreiro Diário',
    description: 'Jogou por 30 dias consecutivos',
    icon: '📅',
    color: '#6366F1',
    requirement: { type: 'dailyStreak', value: 30 },
    rarity: 'rare'
  },
  marathon_runner: {
    id: 'marathon_runner',
    title: 'Maratonista',
    description: 'Jogou por mais de 10 horas',
    icon: '🏃',
    color: '#059669',
    requirement: { type: 'totalPlayTime', value: 36000 }, // 10 horas em segundos
    rarity: 'uncommon'
  },

  // Badges sociais
  social_butterfly: {
    id: 'social_butterfly',
    title: 'Borboleta Social',
    description: 'Compartilhou 25 resultados',
    icon: '🦋',
    color: '#EC4899',
    requirement: { type: 'gamesShared', value: 25 },
    rarity: 'uncommon'
  },
  influencer: {
    id: 'influencer',
    title: 'Influenciador',
    description: 'Referiu 10 amigos',
    icon: '📢',
    color: '#F59E0B',
    requirement: { type: 'friendsReferred', value: 10 },
    rarity: 'rare'
  },

  // Badges de colecionador
  franchise_explorer: {
    id: 'franchise_explorer',
    title: 'Explorador de Franquias',
    description: 'Jogou músicas de 15 franquias diferentes',
    icon: '🗺️',
    color: '#8B5CF6',
    requirement: { type: 'franchisesPlayed', value: 15 },
    rarity: 'rare'
  },
  completionist: {
    id: 'completionist',
    title: 'Completista',
    description: 'Jogou músicas de todas as franquias',
    icon: '🏆',
    color: '#F59E0B',
    requirement: { type: 'allFranchises', value: true },
    rarity: 'legendary'
  },

  // Badges especiais
  early_adopter: {
    id: 'early_adopter',
    title: 'Adotante Inicial',
    description: 'Um dos primeiros jogadores do LudoMusic',
    icon: '🚀',
    color: '#1DB954',
    requirement: { type: 'special', value: 'early_adopter' },
    rarity: 'legendary'
  },

  // Badges de doação
  supporter_temp: {
    id: 'supporter_temp',
    title: 'Apoiador',
    description: 'Apoiou o LudoMusic com uma doação',
    icon: '💝',
    color: '#ff6b6b',
    requirement: { type: 'donation', value: 5 },
    rarity: 'special',
    temporary: true
  },
  supporter_permanent: {
    id: 'supporter_permanent',
    title: 'Apoiador',
    description: 'Apoiador permanente do LudoMusic',
    icon: '💝',
    color: '#ff6b6b',
    requirement: { type: 'donation', value: 15 },
    rarity: 'special',
    permanent: true
  },
  premium_supporter: {
    id: 'premium_supporter',
    title: 'Apoiador Premium',
    description: 'Apoiador premium do LudoMusic',
    icon: '⭐',
    color: '#ffd700',
    requirement: { type: 'donation', value: 30 },
    rarity: 'epic',
    permanent: true
  },
  vip_supporter: {
    id: 'vip_supporter',
    title: 'VIP',
    description: 'Apoiador VIP do LudoMusic',
    icon: '👑',
    color: '#9333ea',
    requirement: { type: 'donation', value: 50 },
    rarity: 'legendary',
    permanent: true
  },
  beta_tester: {
    id: 'beta_tester',
    title: 'Testador Beta',
    description: 'Ajudou a testar recursos em desenvolvimento',
    icon: '🧪',
    color: '#6366F1',
    requirement: { type: 'special', value: 'beta_tester' },
    rarity: 'epic'
  },
  bug_hunter: {
    id: 'bug_hunter',
    title: 'Caçador de Bugs',
    description: 'Reportou bugs importantes',
    icon: '🐛',
    color: '#EF4444',
    requirement: { type: 'special', value: 'bug_hunter' },
    rarity: 'rare'
  }
};

// Títulos que podem ser exibidos no perfil
export const titles = {
  // Títulos de nível
  rookie: {
    id: 'rookie',
    title: 'Novato',
    badgeRequired: 'level_rookie'
  },
  veteran: {
    id: 'veteran',
    title: 'Veterano',
    badgeRequired: 'level_veteran'
  },
  expert: {
    id: 'expert',
    title: 'Especialista',
    badgeRequired: 'level_expert'
  },
  master: {
    id: 'master',
    title: 'Mestre Musical',
    badgeRequired: 'level_master'
  },
  legend: {
    id: 'legend',
    title: 'Lenda Viva',
    badgeRequired: 'level_legend'
  },

  // Títulos especiais
  perfectionist: {
    id: 'perfectionist',
    title: 'O Perfeccionista',
    badgeRequired: 'perfectionist'
  },
  speed_demon: {
    id: 'speed_demon',
    title: 'Raio Veloz',
    badgeRequired: 'speed_demon'
  },
  streak_master: {
    id: 'streak_master',
    title: 'Mestre das Sequências',
    badgeRequired: 'streak_master'
  },
  completionist: {
    id: 'completionist',
    title: 'O Completista',
    badgeRequired: 'completionist'
  },
  early_adopter: {
    id: 'early_adopter',
    title: 'Pioneiro',
    badgeRequired: 'early_adopter'
  },

  // Títulos de doação
  supporter: {
    id: 'supporter',
    title: 'Apoiador',
    badgeRequired: 'supporter_permanent'
  },
  premium_supporter: {
    id: 'premium_supporter',
    title: 'Apoiador Premium',
    badgeRequired: 'premium_supporter'
  },
  vip_supporter: {
    id: 'vip_supporter',
    title: 'VIP',
    badgeRequired: 'vip_supporter'
  }
};

// Função para verificar se um badge foi desbloqueado
export const checkBadgeUnlocked = (badgeId, profile) => {
  const badge = badges[badgeId];
  if (!badge || !profile) return false;

  const { requirement } = badge;

  switch (requirement.type) {
    case 'level':
      return profile.level >= requirement.value;

    case 'perfectGames':
      return profile.stats.perfectGames >= requirement.value;

    case 'fastestWin':
      return profile.stats.fastestWin && profile.stats.fastestWin <= requirement.value;

    case 'bestStreak':
      return profile.stats.bestStreak >= requirement.value;

    case 'totalPlayTime':
      return profile.stats.totalPlayTime >= requirement.value;

    case 'gamesShared':
      return profile.socialStats.gamesShared >= requirement.value;

    case 'friendsReferred':
      return profile.socialStats.friendsReferred >= requirement.value;

    case 'franchisesPlayed':
      return Object.keys(profile.franchiseStats || {}).length >= requirement.value;

    case 'allFranchises':
      // Implementar verificação de todas as franquias
      return false; // Por enquanto

    case 'special':
      return profile.specialBadges && profile.specialBadges.includes(requirement.value);

    default:
      return false;
  }
};

// Função para obter todos os badges desbloqueados
export const getUnlockedBadges = (profile) => {
  if (!profile) return [];

  const unlockedBadges = [];
  
  Object.values(badges).forEach(badge => {
    if (checkBadgeUnlocked(badge.id, profile)) {
      unlockedBadges.push(badge.id);
    }
  });

  return unlockedBadges;
};

// Função para obter títulos disponíveis
export const getAvailableTitles = (profile) => {
  if (!profile) return [];

  const unlockedBadges = getUnlockedBadges(profile);
  const availableTitles = [];

  Object.values(titles).forEach(title => {
    if (unlockedBadges.includes(title.badgeRequired)) {
      availableTitles.push(title);
    }
  });

  return availableTitles;
};

// Função para obter badge por ID
export const getBadge = (badgeId) => {
  return badges[badgeId] || null;
};

// Função para obter título por ID
export const getTitle = (titleId) => {
  return titles[titleId] || null;
};

export default { badges, titles, checkBadgeUnlocked, getUnlockedBadges, getAvailableTitles, getBadge, getTitle };
