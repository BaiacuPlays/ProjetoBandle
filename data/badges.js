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



// Função para verificar se um badge foi desbloqueado
export const checkBadgeUnlocked = (badgeId, profile) => {
  const badge = badges[badgeId];
  if (!badge || !profile) return false;

  const { requirement } = badge;

  switch (requirement.type) {
    case 'level':
      return profile.level >= requirement.value;

    case 'perfectGames':
      return profile.stats?.perfectGames >= requirement.value;

    case 'fastestWin':
      return profile.stats?.fastestWin && profile.stats.fastestWin <= requirement.value;

    case 'bestStreak':
      return profile.stats?.bestStreak >= requirement.value;

    case 'totalPlayTime':
      return profile.stats?.totalPlayTime >= requirement.value;

    case 'gamesShared':
      return profile.socialStats?.gamesShared >= requirement.value;

    case 'friendsReferred':
      return profile.socialStats?.friendsReferred >= requirement.value;

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

  // Primeiro, adicionar badges que estão salvos no perfil (já desbloqueados)
  const savedBadges = profile.badges || [];
  savedBadges.forEach(badgeId => {
    if (badges[badgeId] && !unlockedBadges.includes(badgeId)) {
      unlockedBadges.push(badgeId);
    }
  });

  // Depois, verificar badges que deveriam estar desbloqueados baseado nas estatísticas atuais
  Object.values(badges).forEach(badge => {
    if (!unlockedBadges.includes(badge.id) && checkBadgeUnlocked(badge.id, profile)) {
      unlockedBadges.push(badge.id);
    }
  });

  return unlockedBadges;
};



// Função para sincronizar badges do perfil com as estatísticas atuais
export const syncProfileBadges = (profile) => {
  if (!profile) return profile;

  const currentBadges = profile.badges || [];
  const shouldBeUnlocked = [];

  // Verificar quais badges deveriam estar desbloqueados
  Object.values(badges).forEach(badge => {
    if (checkBadgeUnlocked(badge.id, profile)) {
      shouldBeUnlocked.push(badge.id);
    }
  });

  // Combinar badges salvos com badges que deveriam estar desbloqueados
  const allUnlockedBadges = [...new Set([...currentBadges, ...shouldBeUnlocked])];

  // Retornar perfil atualizado se houver diferenças
  if (allUnlockedBadges.length !== currentBadges.length ||
      !allUnlockedBadges.every(badge => currentBadges.includes(badge))) {
    return {
      ...profile,
      badges: allUnlockedBadges
    };
  }

  return profile;
};

// Função para debug de badges de um perfil
export const debugBadges = (profile) => {
  if (!profile) {
    console.log('🔍 DEBUG BADGES: Perfil não fornecido');
    return;
  }

  console.log('🔍 DEBUG BADGES para usuário:', profile.username || profile.displayName);
  console.log('📊 Estatísticas do perfil:', {
    level: profile.level,
    xp: profile.xp,
    stats: profile.stats
  });

  const savedBadges = profile.badges || [];
  console.log('💾 Badges salvos no perfil:', savedBadges);

  const shouldBeUnlocked = [];
  Object.values(badges).forEach(badge => {
    const isUnlocked = checkBadgeUnlocked(badge.id, profile);
    console.log(`🎖️ ${badge.id} (${badge.title}):`, isUnlocked ? '✅ DESBLOQUEADO' : '❌ bloqueado');
    if (isUnlocked) {
      shouldBeUnlocked.push(badge.id);
    }
  });

  console.log('🎯 Badges que deveriam estar desbloqueados:', shouldBeUnlocked);
  console.log('🔄 Badges disponíveis para equipar:', getUnlockedBadges(profile));

  // Verificar inconsistências
  const missingFromSaved = shouldBeUnlocked.filter(badge => !savedBadges.includes(badge));
  const extraInSaved = savedBadges.filter(badge => !shouldBeUnlocked.includes(badge));

  if (missingFromSaved.length > 0) {
    console.warn('⚠️ Badges que deveriam estar salvos mas não estão:', missingFromSaved);
  }
  if (extraInSaved.length > 0) {
    console.warn('⚠️ Badges salvos que não deveriam estar desbloqueados:', extraInSaved);
  }
};

// Função para obter badge por ID
export const getBadge = (badgeId) => {
  return badges[badgeId] || null;
};

export default { badges, checkBadgeUnlocked, getUnlockedBadges, getBadge, syncProfileBadges, debugBadges };
