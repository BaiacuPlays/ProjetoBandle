// Teste rápido do sistema de XP e nível
console.log('🧪 TESTE DO SISTEMA DE XP E NÍVEL');
console.log('================================');

// Simular dados de perfil
const testProfile = {
  id: 'test_user',
  username: 'TestUser',
  xp: 0,
  level: 1,
  stats: {
    totalGames: 0,
    wins: 0,
    perfectGames: 0
  }
};

// Função para calcular nível baseado no XP (sistema rebalanceado)
function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 300)) + 1;
}

// Função para calcular XP necessário para próximo nível
function getXPForLevel(level) {
  return Math.pow(level - 1, 2) * 300;
}

// Função para calcular XP necessário para próximo nível
function getXPForNextLevel(currentLevel) {
  return Math.pow(currentLevel, 2) * 300;
}

// Função para calcular progresso do nível atual
function getLevelProgress(xp) {
  const level = calculateLevel(xp);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForNextLevel(level);
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.max(0, Math.min(100, progress));
}

// Função para simular ganho de XP baseado no tutorial
function calculateXPGain(won, attempts, isComeback = false, streak = 0) {
  let xp = 0;
  
  if (won) {
    if (attempts === 1) {
      xp += 100; // 🎯 Acertar na 1ª tentativa: +100 XP
    } else {
      xp += 50;  // 🎵 Vitória normal: +50 XP
    }
    
    // 🔥 Bônus por sequência: +10 XP por cada 5 vitórias seguidas
    if (streak > 0 && streak % 5 === 0) {
      xp += 10;
    }
  } else {
    xp += 10; // 📚 Tentar mesmo perdendo: +10 XP
  }
  
  return xp;
}

// Testes do sistema
console.log('\n📊 TESTANDO CÁLCULOS DE NÍVEL:');
console.log('XP: 0 → Nível:', calculateLevel(0));
console.log('XP: 300 → Nível:', calculateLevel(300));
console.log('XP: 1200 → Nível:', calculateLevel(1200));
console.log('XP: 2700 → Nível:', calculateLevel(2700));

console.log('\n📈 TESTANDO XP NECESSÁRIO PARA NÍVEIS:');
for (let level = 1; level <= 10; level++) {
  const xpNeeded = getXPForLevel(level);
  const nextLevelXP = getXPForNextLevel(level);
  console.log(`Nível ${level}: ${xpNeeded} XP → Próximo nível: ${nextLevelXP} XP (diferença: ${nextLevelXP - xpNeeded} XP)`);
}

console.log('\n🎮 TESTANDO GANHO DE XP:');
console.log('Vitória na 1ª tentativa:', calculateXPGain(true, 1), 'XP');
console.log('Vitória na 3ª tentativa:', calculateXPGain(true, 3), 'XP');
console.log('Derrota:', calculateXPGain(false, 6), 'XP');
console.log('Vitória com streak de 5:', calculateXPGain(true, 2, false, 5), 'XP');

console.log('\n🔄 SIMULANDO PROGRESSÃO:');
let currentXP = 0;
let currentLevel = 1;

const gameResults = [
  { won: true, attempts: 1, description: 'Vitória perfeita' },
  { won: true, attempts: 3, description: 'Vitória normal' },
  { won: false, attempts: 6, description: 'Derrota' },
  { won: true, attempts: 2, description: 'Vitória rápida' },
  { won: true, attempts: 1, description: 'Vitória perfeita' },
];

gameResults.forEach((game, index) => {
  const xpGained = calculateXPGain(game.won, game.attempts);
  currentXP += xpGained;
  const newLevel = calculateLevel(currentXP);
  const progress = getLevelProgress(currentXP);
  
  console.log(`Jogo ${index + 1}: ${game.description} → +${xpGained} XP`);
  console.log(`  Total XP: ${currentXP} | Nível: ${newLevel} | Progresso: ${progress.toFixed(1)}%`);
  
  if (newLevel > currentLevel) {
    console.log(`  🎉 SUBIU DE NÍVEL! ${currentLevel} → ${newLevel}`);
    currentLevel = newLevel;
  }
  console.log('');
});

console.log('\n✅ TESTE CONCLUÍDO!');
console.log('O sistema de XP parece estar funcionando corretamente.');
console.log('Verifique se os valores estão sendo aplicados no jogo real.');
