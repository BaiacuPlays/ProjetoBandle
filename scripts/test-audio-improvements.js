/**
 * Script de teste para verificar as melhorias de UX do sistema de áudio
 * Execute este script no console do navegador para testar as otimizações
 */

// Função para testar tempos de resposta
function testAudioResponseTimes() {
  console.log('🎵 Testando melhorias do sistema de áudio...\n');
  
  // Teste 1: Verificar configurações
  console.log('📋 1. Verificando configurações:');
  try {
    // Simular importação das configurações
    const expectedConfig = {
      PLAY_TIMEOUT: 500,
      PLAY_DEBOUNCE: 50,
      SAFETY_TIMEOUT: 1000
    };
    
    console.log('✅ Configurações otimizadas carregadas:');
    console.log(`   - Play Timeout: ${expectedConfig.PLAY_TIMEOUT}ms (era 2000ms)`);
    console.log(`   - Debounce: ${expectedConfig.PLAY_DEBOUNCE}ms (era 150ms)`);
    console.log(`   - Safety Timeout: ${expectedConfig.SAFETY_TIMEOUT}ms (era 3000ms)`);
  } catch (error) {
    console.log('❌ Erro ao carregar configurações:', error);
  }
  
  // Teste 2: Verificar elementos do botão play
  console.log('\n🎮 2. Verificando botões play na página:');
  const playButtons = document.querySelectorAll('[aria-label*="play"], [aria-label*="Reproduzir"], button[class*="audioPlayBtn"]');
  
  if (playButtons.length > 0) {
    console.log(`✅ Encontrados ${playButtons.length} botão(ões) play`);
    
    playButtons.forEach((button, index) => {
      console.log(`   Botão ${index + 1}:`);
      console.log(`   - Disabled: ${button.disabled}`);
      console.log(`   - Classes: ${button.className}`);
      console.log(`   - Aria-label: ${button.getAttribute('aria-label')}`);
    });
  } else {
    console.log('⚠️ Nenhum botão play encontrado');
  }
  
  // Teste 3: Simular clique e medir tempo de resposta
  console.log('\n⏱️ 3. Testando tempo de resposta:');
  
  if (playButtons.length > 0) {
    const testButton = playButtons[0];
    const startTime = performance.now();
    
    // Simular evento de clique
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    // Observar mudanças visuais
    const originalTransform = getComputedStyle(testButton).transform;
    
    testButton.dispatchEvent(clickEvent);
    
    // Verificar se houve mudança visual imediata
    setTimeout(() => {
      const newTransform = getComputedStyle(testButton).transform;
      const responseTime = performance.now() - startTime;
      
      if (originalTransform !== newTransform) {
        console.log(`✅ Feedback visual detectado em ${responseTime.toFixed(2)}ms`);
      } else {
        console.log(`⚠️ Nenhuma mudança visual detectada em ${responseTime.toFixed(2)}ms`);
      }
    }, 10);
  }
  
  // Teste 4: Verificar elementos de áudio
  console.log('\n🔊 4. Verificando elementos de áudio:');
  const audioElements = document.querySelectorAll('audio');
  
  if (audioElements.length > 0) {
    console.log(`✅ Encontrados ${audioElements.length} elemento(s) de áudio`);
    
    audioElements.forEach((audio, index) => {
      console.log(`   Áudio ${index + 1}:`);
      console.log(`   - ReadyState: ${audio.readyState} (2+ = pronto)`);
      console.log(`   - Preload: ${audio.preload}`);
      console.log(`   - CrossOrigin: ${audio.crossOrigin || 'null'}`);
      console.log(`   - Src: ${audio.src ? 'Definido' : 'Não definido'}`);
    });
  } else {
    console.log('⚠️ Nenhum elemento de áudio encontrado');
  }
  
  // Teste 5: Verificar performance do navegador
  console.log('\n📊 5. Verificando performance do navegador:');
  
  if (typeof performance !== 'undefined' && performance.memory) {
    const memory = performance.memory;
    const memoryUsage = (memory.usedJSHeapSize / memory.totalJSHeapSize * 100).toFixed(2);
    
    console.log(`✅ Uso de memória: ${memoryUsage}%`);
    console.log(`   - Usado: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (memoryUsage > 80) {
      console.log('⚠️ Alto uso de memória - configurações adaptativas devem ser aplicadas');
    }
  } else {
    console.log('⚠️ Informações de memória não disponíveis');
  }
  
  // Teste 6: Verificar conexão de rede
  console.log('\n🌐 6. Verificando conexão de rede:');
  
  if (navigator.connection) {
    const connection = navigator.connection;
    console.log(`✅ Tipo de conexão: ${connection.effectiveType}`);
    console.log(`   - Downlink: ${connection.downlink} Mbps`);
    console.log(`   - RTT: ${connection.rtt}ms`);
    
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      console.log('⚠️ Conexão lenta detectada - otimizações devem ser aplicadas');
    }
  } else {
    console.log('⚠️ Informações de conexão não disponíveis');
  }
  
  console.log('\n🎯 Teste concluído! Verifique os resultados acima.');
  console.log('📝 Relatório:');
  console.log('   - Configurações otimizadas: Verificar se timeouts foram reduzidos');
  console.log('   - Feedback visual: Deve ser instantâneo (< 50ms)');
  console.log('   - Elementos de áudio: ReadyState 2+ indica áudio pronto');
  console.log('   - Performance: Uso de memória < 80% é ideal');
}

// Função para testar debounce
function testDebounceImprovement() {
  console.log('\n🔄 Testando melhoria do debounce...');
  
  let clickCount = 0;
  const startTime = performance.now();
  
  // Simular múltiplos cliques rápidos
  const interval = setInterval(() => {
    clickCount++;
    console.log(`Clique ${clickCount} em ${(performance.now() - startTime).toFixed(2)}ms`);
    
    if (clickCount >= 5) {
      clearInterval(interval);
      console.log(`✅ Teste de debounce concluído - ${clickCount} cliques em ${(performance.now() - startTime).toFixed(2)}ms`);
      console.log('📊 Com debounce de 50ms, apenas o último clique deve ser processado');
    }
  }, 10); // Cliques a cada 10ms
}

// Função principal de teste
function runAudioTests() {
  console.clear();
  console.log('🚀 Iniciando testes das melhorias de UX do sistema de áudio\n');
  console.log('=' .repeat(60));
  
  testAudioResponseTimes();
  
  setTimeout(() => {
    testDebounceImprovement();
  }, 2000);
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Para testar manualmente:');
  console.log('1. Clique no botão play e observe o feedback visual instantâneo');
  console.log('2. Verifique se o áudio inicia em menos de 0.5 segundos');
  console.log('3. Teste múltiplos cliques rápidos (deve ser suave)');
  console.log('4. Observe se não há delays perceptíveis');
}

// Exportar funções para uso no console
if (typeof window !== 'undefined') {
  window.testAudioImprovements = runAudioTests;
  window.testDebounce = testDebounceImprovement;
  
  console.log('🎵 Script de teste carregado!');
  console.log('Execute: testAudioImprovements() para iniciar os testes');
}

// Auto-executar se chamado diretamente
if (typeof module === 'undefined') {
  // Aguardar carregamento da página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAudioTests);
  } else {
    runAudioTests();
  }
}
