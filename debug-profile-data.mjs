// Script para debugar dados do perfil
import pkg from './utils/storage.js';
const { localProfiles } = pkg;

console.log('🔍 Verificando dados salvos no localStorage...\n');

// Listar todas as chaves de perfil
const profileKeys = [];
for (const [key, value] of localProfiles.entries()) {
  if (key.startsWith('profile:')) {
    profileKeys.push(key);
  }
}

console.log(`📋 Encontradas ${profileKeys.length} chaves de perfil:`);
profileKeys.forEach(key => console.log(`  - ${key}`));
console.log('');

// Verificar dados do BaiacuPlays
const baiacuKey = 'profile:auth_baiacuplays';
const baiacuProfile = localProfiles.get(baiacuKey);

if (baiacuProfile) {
  console.log('👤 Dados do BaiacuPlays:');
  console.log('  Username:', baiacuProfile.username);
  console.log('  DisplayName:', baiacuProfile.displayName);
  console.log('  Level:', baiacuProfile.level);
  console.log('  XP:', baiacuProfile.xp);
  console.log('  Bio:', baiacuProfile.bio);
  console.log('');
  
  console.log('📊 Estatísticas:');
  if (baiacuProfile.stats) {
    console.log('  stats.totalGames:', baiacuProfile.stats.totalGames);
    console.log('  stats.wins:', baiacuProfile.stats.wins);
    console.log('  stats.winRate:', baiacuProfile.stats.winRate);
    console.log('  stats.currentStreak:', baiacuProfile.stats.currentStreak);
    console.log('  stats.bestStreak:', baiacuProfile.stats.bestStreak);
  } else {
    console.log('  ❌ Objeto stats não encontrado');
  }
  
  console.log('');
  console.log('📊 Estatísticas diretas no perfil:');
  console.log('  totalGames:', baiacuProfile.totalGames);
  console.log('  gamesWon:', baiacuProfile.gamesWon);
  console.log('  currentStreak:', baiacuProfile.currentStreak);
  console.log('  bestStreak:', baiacuProfile.bestStreak);
  
  console.log('');
  console.log('🏆 Conquistas:', baiacuProfile.achievements?.length || 0);
  console.log('🎖️ Badges:', baiacuProfile.badges?.length || 0);
  
  console.log('');
  console.log('📅 Datas:');
  console.log('  createdAt:', baiacuProfile.createdAt);
  console.log('  lastLogin:', baiacuProfile.lastLogin);
  console.log('  lastUpdated:', baiacuProfile.lastUpdated);
  
} else {
  console.log('❌ Perfil do BaiacuPlays não encontrado');
}
