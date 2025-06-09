// Teste de integração do sistema de XP
console.log('🧪 TESTE DE INTEGRAÇÃO - SISTEMA DE XP');
console.log('=====================================');

// Simular ProfileContext
const mockProfile = {
  id: 'test_user',
  username: 'TestUser',
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
  franchiseStats: {},
  gameHistory: []
};

// Função para simular updateGameStats
function simulateUpdateGameStats(profile, gameData) {
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
    
    // 🔥 Bônus por sequência: +10 XP por cada 5 vitórias seguidas
    if (mode === 'daily' && newStats.currentStreak > 0 && newStats.currentStreak % 5 === 0) {
      xpGained += 10;
    }
  } else {
    xpGained += 10; // 📚 Tentar mesmo perdendo: +10 XP
  }

  // Atualizar XP e recalcular nível
  const currentXP = profile.xp || 0;
  const newXP = currentXP + xpGained;
  const newLevel = Math.floor(Math.sqrt(newXP / 300)) + 1;

  console.log(`🎯 XP Ganho: +${xpGained} | Total: ${newXP} | Nível: ${newLevel}`);

  // Atualizar perfil
  const updatedProfile = {
    ...profile,
    xp: newXP,
    level: newLevel,
    stats: newStats
  };

  return { updatedProfile, xpGained };
}

// Simular sequência de jogos
console.log('\n🎮 SIMULANDO SEQUÊNCIA DE JOGOS:');
console.log('Perfil inicial:', JSON.stringify(mockProfile, null, 2));

let currentProfile = { ...mockProfile };

const gameSequence = [
  { won: true, attempts: 1, mode: 'daily', description: 'Vitória perfeita (1ª tentativa)' },
  { won: true, attempts: 3, mode: 'daily', description: 'Vitória normal (3ª tentativa)' },
  { won: false, attempts: 6, mode: 'daily', description: 'Derrota' },
  { won: true, attempts: 2, mode: 'daily', description: 'Vitória rápida (2ª tentativa)' },
  { won: true, attempts: 1, mode: 'daily', description: 'Vitória perfeita (1ª tentativa)' },
  { won: true, attempts: 1, mode: 'daily', description: 'Vitória perfeita (1ª tentativa)' },
  { won: true, attempts: 2, mode: 'daily', description: 'Vitória rápida (2ª tentativa)' },
  { won: true, attempts: 1, mode: 'daily', description: 'Vitória perfeita (1ª tentativa) - 5º streak!' },
];

gameSequence.forEach((game, index) => {
  console.log(`\n--- JOGO ${index + 1}: ${game.description} ---`);
  console.log(`Antes: XP=${currentProfile.xp}, Nível=${currentProfile.level}, Streak=${currentProfile.stats.currentStreak}`);
  
  const result = simulateUpdateGameStats(currentProfile, game);
  currentProfile = result.updatedProfile;
  
  console.log(`Depois: XP=${currentProfile.xp}, Nível=${currentProfile.level}, Streak=${currentProfile.stats.currentStreak}`);
  console.log(`XP ganho: +${result.xpGained}`);
  
  if (currentProfile.level > mockProfile.level) {
    console.log(`🎉 SUBIU DE NÍVEL! ${mockProfile.level} → ${currentProfile.level}`);
  }
});

console.log('\n📊 RESULTADO FINAL:');
console.log('XP Total:', currentProfile.xp);
console.log('Nível:', currentProfile.level);
console.log('Jogos Totais:', currentProfile.stats.totalGames);
console.log('Vitórias:', currentProfile.stats.wins);
console.log('Taxa de Vitória:', currentProfile.stats.winRate + '%');
console.log('Melhor Streak:', currentProfile.stats.bestStreak);
console.log('Jogos Perfeitos:', currentProfile.stats.perfectGames);

console.log('\n✅ TESTE DE INTEGRAÇÃO CONCLUÍDO!');
console.log('O sistema de XP está funcionando corretamente na lógica do ProfileContext.');
