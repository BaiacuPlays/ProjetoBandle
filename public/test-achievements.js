// Script para testar conquistas melhoradas no console do navegador
// Execute no console: testAchievements()

window.testAchievements = function() {
  console.log('🏆 Iniciando teste de conquistas melhoradas...');

  // Verificar se as funções existem
  if (!window.showAchievementToast) {
    console.error('❌ Função showAchievementToast não encontrada!');
    return;
  }

  if (!window.showLevelUpToast) {
    console.error('❌ Função showLevelUpToast não encontrada!');
    return;
  }

  console.log('✅ Funções de notificação encontradas!');

  // Teste 1: Conquista única
  console.log('🧪 Teste 1: Conquista única');
  window.showAchievementToast({
    id: 'test_single',
    title: 'Teste de Posicionamento',
    description: 'Esta conquista deve aparecer no centro-direita da tela com som',
    icon: '🎯',
    rarity: 'epic',
    xpReward: 500
  });

  // Teste 2: Level up após 3 segundos
  setTimeout(() => {
    console.log('⭐ Teste 2: Level up');
    window.showLevelUpToast(10);
  }, 3000);

  // Teste 3: Múltiplas conquistas após 6 segundos
  setTimeout(() => {
    console.log('🎯 Teste 3: Múltiplas conquistas');

    const conquistas = [
      {
        id: 'test_common',
        title: 'Conquista Comum',
        description: 'Teste de raridade comum',
        icon: '🥉',
        rarity: 'common',
        xpReward: 100
      },
      {
        id: 'test_rare',
        title: 'Conquista Rara',
        description: 'Teste de raridade rara',
        icon: '🥈',
        rarity: 'rare',
        xpReward: 300
      },
      {
        id: 'test_legendary',
        title: 'Conquista Lendária',
        description: 'Teste de raridade lendária',
        icon: '🥇',
        rarity: 'legendary',
        xpReward: 1000
      }
    ];

    conquistas.forEach((conquista, index) => {
      setTimeout(() => {
        window.showAchievementToast(conquista);
      }, index * 2000);
    });
  }, 6000);

  // Teste 4: Teste de scroll após 15 segundos
  setTimeout(() => {
    console.log('📜 Teste 4: Teste de visibilidade com scroll');

    // Rolar para baixo
    window.scrollTo({ top: 1000, behavior: 'smooth' });

    // Mostrar conquista após rolar
    setTimeout(() => {
      window.showAchievementToast({
        id: 'scroll_test',
        title: 'Teste de Scroll',
        description: 'Esta conquista deve aparecer mesmo com a página rolada para baixo',
        icon: '📜',
        rarity: 'epic',
        xpReward: 750
      });

      // Voltar ao topo após 3 segundos
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 3000);
    }, 1500);
  }, 15000);

  console.log('🎉 Todos os testes foram agendados! Observe as notificações nos próximos 20 segundos.');
  console.log('📋 Checklist de verificação:');
  console.log('  ✅ As notificações aparecem no centro-direita da tela?');
  console.log('  ✅ Os sons são reproduzidos (conquista e level up diferentes)?');
  console.log('  ✅ As animações são suaves (bounce, glow, shimmer)?');
  console.log('  ✅ As notificações permanecem visíveis durante o scroll?');
  console.log('  ✅ As cores das bordas mudam conforme a raridade?');
  console.log('  ✅ As notificações desaparecem automaticamente após 6 segundos?');
};

// Função para testar apenas som
window.testAchievementSound = function() {
  console.log('🔊 Testando apenas o som de conquista...');

  if (window.showAchievementToast) {
    window.showAchievementToast({
      id: 'sound_test',
      title: 'Teste de Som',
      description: 'Foque no som desta conquista',
      icon: '🔊',
      rarity: 'rare',
      xpReward: 200
    });
  }
};

// Função para testar apenas level up
window.testLevelUpSound = function() {
  console.log('🔊 Testando apenas o som de level up...');

  if (window.showLevelUpToast) {
    console.log('✅ Função showLevelUpToast encontrada, chamando...');
    window.showLevelUpToast(99);
  } else {
    console.error('❌ Função showLevelUpToast NÃO encontrada!');
    console.log('🔍 Funções disponíveis no window:', Object.keys(window).filter(key => key.includes('Toast')));
  }
};

// Função para testar som diretamente (bypass da notificação)
window.testDirectLevelUpSound = function() {
  console.log('🔊 Testando som de level up diretamente...');

  try {
    // Som de level up direto
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Som simples e audível
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.type = 'square'; // Tipo mais audível
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // Volume alto
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, 1000);

    console.log('✅ Som direto tocado!');
  } catch (error) {
    console.error('❌ Erro ao tocar som direto:', error);
  }
};

// Instruções
console.log('🎮 Scripts de teste de conquistas carregados!');
console.log('📝 Comandos disponíveis:');
console.log('  testAchievements() - Teste completo');
console.log('  testAchievementSound() - Teste apenas som de conquista');
console.log('  testLevelUpSound() - Teste apenas som de level up');
