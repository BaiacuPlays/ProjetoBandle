// Script para testar as estatísticas do modo infinito
console.log('🧪 TESTE DAS ESTATÍSTICAS DO MODO INFINITO');

// Simular estrutura do perfil
const mockProfile = {
  id: 'test_user',
  username: 'TestUser',
  stats: {
    totalGames: 0,
    wins: 0,
    winRate: 0,
    modeStats: {
      daily: {
        games: 0,
        wins: 0,
        currentStreak: 0,
        bestStreak: 0
      },
      infinite: {
        games: 0,
        wins: 0,
        bestStreak: 0,
        currentStreak: 0,
        totalSongsCompleted: 0
      }
    }
  }
};

// Função para simular updateGameStats
function simulateUpdateGameStats(profile, gameData) {
  const { won, attempts, mode, streak, songsCompleted } = gameData;
  
  console.log(`\n🎮 SIMULANDO JOGO NO MODO ${mode.toUpperCase()}:`);
  console.log(`Vitória: ${won}, Tentativas: ${attempts}, Streak: ${streak}`);
  
  const newStats = { ...profile.stats };
  newStats.totalGames = (newStats.totalGames || 0) + 1;
  
  if (won) {
    newStats.wins = (newStats.wins || 0) + 1;
  }
  
  // Calcular taxa de vitória
  newStats.winRate = newStats.totalGames > 0 ? Math.round((newStats.wins / newStats.totalGames) * 100) : 0;
  
  // Atualizar estatísticas por modo
  if (!newStats.modeStats) {
    newStats.modeStats = {
      daily: { games: 0, wins: 0, currentStreak: 0, bestStreak: 0 },
      infinite: { games: 0, wins: 0, bestStreak: 0, currentStreak: 0, totalSongsCompleted: 0 }
    };
  }
  
  if (mode === 'infinite') {
    console.log('📊 Atualizando estatísticas do modo infinito:', { won, streak, songsCompleted });
    newStats.modeStats.infinite.games = (newStats.modeStats.infinite.games || 0) + 1;
    if (won) {
      newStats.modeStats.infinite.wins = (newStats.modeStats.infinite.wins || 0) + 1;
      if (streak) {
        newStats.modeStats.infinite.currentStreak = streak;
        newStats.modeStats.infinite.bestStreak = Math.max(newStats.modeStats.infinite.bestStreak || 0, streak);
        console.log('📊 Novo streak no modo infinito:', streak, 'Melhor:', newStats.modeStats.infinite.bestStreak);
      }
      if (songsCompleted) {
        newStats.modeStats.infinite.totalSongsCompleted = (newStats.modeStats.infinite.totalSongsCompleted || 0) + songsCompleted;
      }
    } else {
      newStats.modeStats.infinite.currentStreak = 0;
      console.log('📊 Resetando streak atual do modo infinito');
    }
    console.log('📊 Estatísticas do modo infinito atualizadas:', newStats.modeStats.infinite);
  }
  
  return { ...profile, stats: newStats };
}

// Simular sequência de jogos no modo infinito
console.log('\n🎯 SIMULANDO SEQUÊNCIA DE VITÓRIAS NO MODO INFINITO:');

let testProfile = { ...mockProfile };

// Vitória 1
testProfile = simulateUpdateGameStats(testProfile, {
  won: true,
  attempts: 3,
  mode: 'infinite',
  streak: 1,
  songsCompleted: 1
});

// Vitória 2
testProfile = simulateUpdateGameStats(testProfile, {
  won: true,
  attempts: 2,
  mode: 'infinite',
  streak: 2,
  songsCompleted: 1
});

// Vitória 3
testProfile = simulateUpdateGameStats(testProfile, {
  won: true,
  attempts: 1,
  mode: 'infinite',
  streak: 3,
  songsCompleted: 1
});

// Derrota (fim da sequência)
testProfile = simulateUpdateGameStats(testProfile, {
  won: false,
  attempts: 6,
  mode: 'infinite',
  streak: 3,
  songsCompleted: 0
});

// Nova sequência - Vitória 1
testProfile = simulateUpdateGameStats(testProfile, {
  won: true,
  attempts: 4,
  mode: 'infinite',
  streak: 1,
  songsCompleted: 1
});

// Nova sequência - Vitória 2
testProfile = simulateUpdateGameStats(testProfile, {
  won: true,
  attempts: 2,
  mode: 'infinite',
  streak: 2,
  songsCompleted: 1
});

console.log('\n📊 RESULTADO FINAL:');
console.log('Estatísticas Gerais:', testProfile.stats);
console.log('Estatísticas do Modo Infinito:', testProfile.stats.modeStats.infinite);

console.log('\n✅ TESTE CONCLUÍDO');

// Verificar se as estatísticas estão corretas
const infiniteStats = testProfile.stats.modeStats.infinite;
console.log('\n🔍 VERIFICAÇÃO:');
console.log(`Jogos: ${infiniteStats.games} (esperado: 6)`);
console.log(`Vitórias: ${infiniteStats.wins} (esperado: 5)`);
console.log(`Melhor Streak: ${infiniteStats.bestStreak} (esperado: 3)`);
console.log(`Streak Atual: ${infiniteStats.currentStreak} (esperado: 2)`);
console.log(`Total de Músicas: ${infiniteStats.totalSongsCompleted} (esperado: 5)`);

if (infiniteStats.games === 6 && infiniteStats.wins === 5 && infiniteStats.bestStreak === 3 && infiniteStats.currentStreak === 2 && infiniteStats.totalSongsCompleted === 5) {
  console.log('✅ TESTE PASSOU - Todas as estatísticas estão corretas!');
} else {
  console.log('❌ TESTE FALHOU - Algumas estatísticas estão incorretas!');
}
