// Teste específico para verificar conquistas no modo infinito
console.log('🧪 TESTE DE CONQUISTAS NO MODO INFINITO');
console.log('=====================================');

// Simular dados de jogo no modo infinito
const mockInfiniteGameData = {
  won: true,
  attempts: 1,
  mode: 'infinite',
  song: {
    title: 'Test Song',
    game: 'Test Game',
    id: 'test_song_1'
  },
  streak: 5,
  songsCompleted: 1,
  playTime: 15,
  isComeback: false,
  consecutiveLosses: 0
};

// Simular ProfileContext para modo infinito
const mockInfiniteProfile = {
  id: 'test_user_infinite',
  username: 'InfinitePlayer',
  xp: 0,
  level: 1,
  stats: {
    totalGames: 0,
    wins: 0,
    perfectGames: 0,
    currentStreak: 0,
    bestStreak: 0,
    winRate: 0,
    totalPlayTime: 0,
    longestSession: 0,
    fastestWin: null
  },
  achievements: [],
  franchiseStats: {},
  gameHistory: []
};

// Função para simular updateGameStats no modo infinito
function simulateInfiniteGameStats(profile, gameData) {
  const { won, attempts, mode, song, streak, songsCompleted, playTime, isComeback, consecutiveLosses } = gameData;

  console.log(`\n🎮 SIMULANDO JOGO NO MODO ${mode.toUpperCase()}:`);
  console.log(`Vitória: ${won}, Tentativas: ${attempts}, Streak: ${streak}`);

  // Atualizar estatísticas básicas
  const newStats = { ...profile.stats };
  newStats.totalGames = (newStats.totalGames || 0) + 1;

  if (won) {
    newStats.wins = (newStats.wins || 0) + 1;

    // No modo infinito, não há currentStreak nas stats gerais
    // O streak é mantido separadamente no estado do jogo

    // Verificar jogo perfeito (1 tentativa)
    if (attempts === 1) {
      newStats.perfectGames = (newStats.perfectGames || 0) + 1;
    }

    // Atualizar tempo mais rápido
    if (playTime && (!newStats.fastestWin || playTime < newStats.fastestWin)) {
      newStats.fastestWin = playTime;
    }
  }

  // Calcular taxa de vitória
  newStats.winRate = newStats.totalGames > 0 ? Math.round((newStats.wins / newStats.totalGames) * 100) : 0;

  // Atualizar dados de tempo nas estatísticas
  if (playTime) {
    newStats.totalPlayTime = (newStats.totalPlayTime || 0) + playTime;
    newStats.longestSession = Math.max(newStats.longestSession || 0, playTime);
  }

  // 🎯 CALCULAR E ADICIONAR XP
  let xpGained = 0;
  
  if (won) {
    if (attempts === 1) {
      xpGained += 100; // 🎯 Acertar na 1ª tentativa: +100 XP
    } else {
      xpGained += 50;  // 🎵 Vitória normal: +50 XP
    }
    
    // No modo infinito, não há bônus por sequência de 5 vitórias
    // (isso é específico do modo diário)
  } else {
    xpGained += 10; // 📚 Tentar mesmo perdendo: +10 XP
  }

  // Atualizar XP e recalcular nível
  const currentXP = profile.xp || 0;
  const newXP = currentXP + xpGained;
  const newLevel = Math.floor(Math.sqrt(newXP / 300)) + 1;

  console.log(`🎯 XP Ganho: +${xpGained} | Total: ${newXP} | Nível: ${newLevel}`);

  // Verificar conquistas específicas do modo infinito
  const achievements = [];

  // 🎯 Primeira Vitória
  if (newStats.wins === 1) {
    achievements.push('first_win');
    console.log('🏆 Conquista desbloqueada: Primeira Vitória!');
  }

  // 🎯 Acerto na Primeira (modo infinito)
  if (won && attempts === 1) {
    achievements.push('perfect_guess');
    console.log('🏆 Conquista desbloqueada: Acerto na Primeira!');
  }

  // 🎯 Velocista (vitória em menos de 20 segundos)
  if (won && playTime && playTime < 20) {
    achievements.push('speed_demon');
    console.log('🏆 Conquista desbloqueada: Velocista!');
  }

  // 🎯 Sequência de 5 no modo infinito
  if (mode === 'infinite' && streak >= 5) {
    achievements.push('infinite_streak_5');
    console.log('🏆 Conquista desbloqueada: Sequência Infinita de 5!');
  }

  // 🎯 Sequência de 10 no modo infinito
  if (mode === 'infinite' && streak >= 10) {
    achievements.push('infinite_streak_10');
    console.log('🏆 Conquista desbloqueada: Sequência Infinita de 10!');
  }

  // 🎯 Maratona (100 jogos totais)
  if (newStats.totalGames >= 100) {
    achievements.push('marathon');
    console.log('🏆 Conquista desbloqueada: Maratona!');
  }

  // 🎯 Perfecionista (50 jogos perfeitos)
  if (newStats.perfectGames >= 50) {
    achievements.push('perfectionist');
    console.log('🏆 Conquista desbloqueada: Perfecionista!');
  }

  // Simular exibição de pop-ups de conquistas
  if (achievements.length > 0) {
    console.log('\n🎉 SIMULANDO POP-UPS DE CONQUISTAS:');
    achievements.forEach((achievementId, index) => {
      setTimeout(() => {
        console.log(`📱 Pop-up ${index + 1}: Conquista "${achievementId}" exibida!`);
        
        // Simular chamada da função global
        if (typeof window !== 'undefined' && window.showAchievementToast) {
          const mockAchievement = {
            id: achievementId,
            title: `Conquista ${achievementId}`,
            description: `Descrição da conquista ${achievementId}`,
            icon: '🏆',
            rarity: 'common',
            xpReward: 100
          };
          window.showAchievementToast(mockAchievement);
        }
      }, index * 1000);
    });
  }

  // Atualizar perfil
  const updatedProfile = {
    ...profile,
    xp: newXP,
    level: newLevel,
    stats: newStats,
    achievements: [...(profile.achievements || []), ...achievements]
  };

  return { updatedProfile, xpGained, achievements };
}

// Simular sequência de jogos no modo infinito
console.log('\n🎮 SIMULANDO SEQUÊNCIA NO MODO INFINITO:');

let currentProfile = { ...mockInfiniteProfile };

const infiniteGameSequence = [
  { ...mockInfiniteGameData, attempts: 1, streak: 1, description: 'Primeira vitória perfeita' },
  { ...mockInfiniteGameData, attempts: 2, streak: 2, description: 'Segunda vitória' },
  { ...mockInfiniteGameData, attempts: 1, streak: 3, playTime: 15, description: 'Terceira vitória rápida' },
  { ...mockInfiniteGameData, attempts: 1, streak: 4, description: 'Quarta vitória perfeita' },
  { ...mockInfiniteGameData, attempts: 1, streak: 5, description: 'Quinta vitória - Sequência de 5!' },
  { ...mockInfiniteGameData, attempts: 3, streak: 6, description: 'Sexta vitória' },
  { ...mockInfiniteGameData, attempts: 1, streak: 7, description: 'Sétima vitória perfeita' },
  { ...mockInfiniteGameData, attempts: 2, streak: 8, description: 'Oitava vitória' },
  { ...mockInfiniteGameData, attempts: 1, streak: 9, description: 'Nona vitória perfeita' },
  { ...mockInfiniteGameData, attempts: 1, streak: 10, description: 'Décima vitória - Sequência de 10!' },
];

infiniteGameSequence.forEach((game, index) => {
  console.log(`\n--- JOGO INFINITO ${index + 1}: ${game.description} ---`);
  console.log(`Antes: XP=${currentProfile.xp}, Nível=${currentProfile.level}, Vitórias=${currentProfile.stats.wins}`);
  
  const result = simulateInfiniteGameStats(currentProfile, game);
  currentProfile = result.updatedProfile;
  
  console.log(`Depois: XP=${currentProfile.xp}, Nível=${currentProfile.level}, Vitórias=${currentProfile.stats.wins}`);
  console.log(`XP ganho: +${result.xpGained}, Conquistas: ${result.achievements.length}`);
  
  if (result.achievements.length > 0) {
    console.log(`🏆 Conquistas desbloqueadas: ${result.achievements.join(', ')}`);
  }
});

console.log('\n📊 RESULTADO FINAL DO MODO INFINITO:');
console.log('XP Total:', currentProfile.xp);
console.log('Nível:', currentProfile.level);
console.log('Jogos Totais:', currentProfile.stats.totalGames);
console.log('Vitórias:', currentProfile.stats.wins);
console.log('Taxa de Vitória:', currentProfile.stats.winRate + '%');
console.log('Jogos Perfeitos:', currentProfile.stats.perfectGames);
console.log('Conquistas Desbloqueadas:', currentProfile.achievements.length);

console.log('\n✅ TESTE DE CONQUISTAS NO MODO INFINITO CONCLUÍDO!');
console.log('O sistema deve exibir pop-ups de conquistas no modo infinito da mesma forma que no modo diário.');
console.log('Verifique se a função window.showAchievementToast está sendo chamada corretamente.');
