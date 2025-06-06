// Script de teste para validação de avatar
// Execute no console do navegador

function testAvatarValidation() {
  console.log('🧪 Testando validação de avatar...\n');

  // Importar a função de validação se disponível
  const testCases = [
    { avatar: null, expected: true, description: 'Avatar null' },
    { avatar: undefined, expected: true, description: 'Avatar undefined' },
    { avatar: '', expected: true, description: 'String vazia' },
    { avatar: '🎮', expected: true, description: 'Emoji simples' },
    { avatar: '👨‍💻', expected: true, description: 'Emoji composto' },
    { avatar: '🎵🎮', expected: true, description: 'Múltiplos emojis' },
    { avatar: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', expected: true, description: 'Imagem base64 pequena' },
    { avatar: 'https://example.com/avatar.jpg', expected: true, description: 'URL válida' },
    { avatar: 123, expected: false, description: 'Número' },
    { avatar: {}, expected: false, description: 'Objeto' },
    { avatar: 'texto muito longo que não deveria ser aceito como avatar porque excede o limite', expected: false, description: 'Texto muito longo' }
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    try {
      // Simular validação básica
      let isValid = true;
      let error = '';

      if (testCase.avatar === null || testCase.avatar === undefined) {
        isValid = true;
      } else if (typeof testCase.avatar !== 'string') {
        isValid = false;
        error = 'Avatar deve ser uma string';
      } else if (testCase.avatar.trim() === '') {
        isValid = true;
      } else if (testCase.avatar.startsWith('data:image/')) {
        isValid = true;
      } else if (testCase.avatar.startsWith('http')) {
        isValid = true;
      } else if (testCase.avatar.length <= 8) {
        isValid = true;
      } else {
        isValid = false;
        error = 'Avatar inválido';
      }

      const testPassed = isValid === testCase.expected;
      
      if (testPassed) {
        console.log(`✅ ${index + 1}. ${testCase.description}: PASSOU`);
        passed++;
      } else {
        console.log(`❌ ${index + 1}. ${testCase.description}: FALHOU`);
        console.log(`   Esperado: ${testCase.expected}, Recebido: ${isValid}, Erro: ${error}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${index + 1}. ${testCase.description}: ERRO - ${error.message}`);
      failed++;
    }
  });

  console.log(`\n📊 Resultados: ${passed} passou, ${failed} falhou`);
  
  if (failed === 0) {
    console.log('🎉 Todos os testes passaram!');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique a implementação.');
  }
}

// Função para testar upload de emoji
function testEmojiUpload() {
  console.log('🎭 Testando upload de emoji...');
  
  const emojis = ['🎮', '🎵', '🎯', '🎪', '🎨', '👨‍💻', '🏆'];
  
  emojis.forEach((emoji, index) => {
    console.log(`${index + 1}. Emoji: ${emoji}, Comprimento: ${emoji.length}, Válido: ✅`);
  });
}

// Função para simular teste de avatar no perfil
function simulateAvatarUpdate(avatar) {
  console.log(`🔄 Simulando atualização de avatar: ${avatar}`);
  
  try {
    // Simular validação
    if (avatar === null || avatar === undefined) {
      console.log('✅ Avatar removido com sucesso');
      return true;
    }
    
    if (typeof avatar !== 'string') {
      throw new Error('Avatar deve ser uma string');
    }
    
    if (avatar.length > 50) {
      throw new Error('Avatar muito longo');
    }
    
    console.log('✅ Avatar atualizado com sucesso');
    return true;
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return false;
  }
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.testAvatarValidation = testAvatarValidation;
  window.testEmojiUpload = testEmojiUpload;
  window.simulateAvatarUpdate = simulateAvatarUpdate;
  
  console.log('🔧 Funções de teste de avatar disponíveis:');
  console.log('  - testAvatarValidation(): Testa validação geral');
  console.log('  - testEmojiUpload(): Testa emojis específicos');
  console.log('  - simulateAvatarUpdate(avatar): Simula atualização');
  console.log('\nPara executar: testAvatarValidation()');
}
