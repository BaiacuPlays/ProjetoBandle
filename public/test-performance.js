// Script para testar as otimizações de performance
// Execute no console do navegador: loadScript('/test-performance.js')

(function() {
  'use strict';
  
  console.log('🚀 INICIANDO TESTE DE PERFORMANCE...');
  
  // Função para carregar o script
  window.loadScript = function(src) {
    const script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
  };
  
  // Teste 1: Verificar se console está desabilitado em produção
  function testConsoleOptimization() {
    console.log('📊 Testando otimização de console...');
    
    const isProduction = window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
      console.log('🔍 Ambiente de produção detectado');
      console.log('✅ Se você vê esta mensagem, o console NÃO foi desabilitado');
      console.log('❌ Se você NÃO vê esta mensagem, o console foi desabilitado corretamente');
    } else {
      console.log('🔍 Ambiente de desenvolvimento detectado');
      console.log('✅ Console deve funcionar normalmente em desenvolvimento');
    }
  }
  
  // Teste 2: Monitorar requisições de rede
  function testNetworkOptimization() {
    console.log('📊 Testando otimização de rede...');
    
    let requestCount = 0;
    const startTime = Date.now();
    
    // Interceptar fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      requestCount++;
      console.log(`📤 Requisição #${requestCount}: ${args[0]}`);
      return originalFetch.apply(this, args);
    };
    
    // Contar requisições por minuto
    setTimeout(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const requestsPerMinute = (requestCount / elapsed) * 60;
      
      console.log(`📊 RESULTADO REDE:`);
      console.log(`   Total de requisições: ${requestCount}`);
      console.log(`   Tempo decorrido: ${elapsed.toFixed(1)}s`);
      console.log(`   Requisições por minuto: ${requestsPerMinute.toFixed(1)}`);
      
      if (requestsPerMinute > 20) {
        console.log(`❌ MUITAS REQUISIÇÕES! Esperado: <15/min, Atual: ${requestsPerMinute.toFixed(1)}/min`);
      } else {
        console.log(`✅ Requisições otimizadas! ${requestsPerMinute.toFixed(1)}/min está dentro do esperado`);
      }
      
      // Restaurar fetch original
      window.fetch = originalFetch;
    }, 60000); // 1 minuto
  }
  
  // Teste 3: Verificar uso de memória
  function testMemoryOptimization() {
    console.log('📊 Testando otimização de memória...');
    
    if (performance.memory) {
      const memory = performance.memory;
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
      const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
      const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1);
      
      console.log(`📊 MEMÓRIA ATUAL:`);
      console.log(`   Usado: ${usedMB} MB`);
      console.log(`   Total: ${totalMB} MB`);
      console.log(`   Limite: ${limitMB} MB`);
      console.log(`   Uso: ${((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100).toFixed(1)}%`);
      
      // Monitorar por 5 minutos
      let maxUsed = memory.usedJSHeapSize;
      const memoryInterval = setInterval(() => {
        const currentMemory = performance.memory;
        if (currentMemory.usedJSHeapSize > maxUsed) {
          maxUsed = currentMemory.usedJSHeapSize;
        }
        
        const currentUsedMB = (currentMemory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        const maxUsedMB = (maxUsed / 1024 / 1024).toFixed(1);
        
        console.log(`💾 Memória: ${currentUsedMB} MB (máx: ${maxUsedMB} MB)`);
      }, 30000); // A cada 30 segundos
      
      // Parar monitoramento após 5 minutos
      setTimeout(() => {
        clearInterval(memoryInterval);
        const finalMaxMB = (maxUsed / 1024 / 1024).toFixed(1);
        console.log(`📊 RESULTADO MEMÓRIA: Pico máximo foi ${finalMaxMB} MB`);
        
        if (maxUsed > 100 * 1024 * 1024) { // 100MB
          console.log(`❌ USO DE MEMÓRIA ALTO! Pico: ${finalMaxMB} MB`);
        } else {
          console.log(`✅ Uso de memória otimizado! Pico: ${finalMaxMB} MB`);
        }
      }, 300000); // 5 minutos
    } else {
      console.log('❌ performance.memory não disponível neste navegador');
    }
  }
  
  // Teste 4: Verificar intervals ativos
  function testIntervalOptimization() {
    console.log('📊 Testando otimização de intervals...');
    
    // Interceptar setInterval
    const originalSetInterval = window.setInterval;
    const activeIntervals = new Set();
    
    window.setInterval = function(callback, delay, ...args) {
      const intervalId = originalSetInterval.call(this, callback, delay, ...args);
      activeIntervals.add({ id: intervalId, delay, callback: callback.toString().substring(0, 100) });
      
      console.log(`⏰ Novo interval criado: ${delay}ms - ${callback.toString().substring(0, 50)}...`);
      console.log(`📊 Total de intervals ativos: ${activeIntervals.size}`);
      
      return intervalId;
    };
    
    // Interceptar clearInterval
    const originalClearInterval = window.clearInterval;
    window.clearInterval = function(intervalId) {
      activeIntervals.forEach(interval => {
        if (interval.id === intervalId) {
          activeIntervals.delete(interval);
          console.log(`🗑️ Interval removido: ${interval.delay}ms`);
        }
      });
      
      return originalClearInterval.call(this, intervalId);
    };
    
    // Relatório a cada minuto
    const reportInterval = originalSetInterval(() => {
      console.log(`📊 INTERVALS ATIVOS: ${activeIntervals.size}`);
      activeIntervals.forEach(interval => {
        console.log(`   - ${interval.delay}ms: ${interval.callback.substring(0, 50)}...`);
      });
      
      if (activeIntervals.size > 6) {
        console.log(`❌ MUITOS INTERVALS! Esperado: <6, Atual: ${activeIntervals.size}`);
      } else {
        console.log(`✅ Intervals otimizados! ${activeIntervals.size} ativos`);
      }
    }, 60000);
    
    // Parar relatório após 10 minutos
    setTimeout(() => {
      originalClearInterval(reportInterval);
      console.log('📊 Monitoramento de intervals finalizado');
    }, 600000);
  }
  
  // Teste 5: Verificar performance geral
  function testOverallPerformance() {
    console.log('📊 Testando performance geral...');
    
    const startTime = performance.now();
    let frameCount = 0;
    let lastTime = startTime;
    
    function measureFPS() {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime - lastTime >= 1000) { // A cada segundo
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        console.log(`🎯 FPS: ${fps}`);
        
        if (fps < 30) {
          console.log(`❌ FPS BAIXO! ${fps} FPS (esperado: >30)`);
        } else if (fps >= 60) {
          console.log(`✅ FPS EXCELENTE! ${fps} FPS`);
        } else {
          console.log(`✅ FPS BOM! ${fps} FPS`);
        }
      }
      
      requestAnimationFrame(measureFPS);
    }
    
    requestAnimationFrame(measureFPS);
  }
  
  // Executar todos os testes
  function runAllTests() {
    console.log('🚀 EXECUTANDO TODOS OS TESTES DE PERFORMANCE...');
    console.log('⏱️ Duração total: ~10 minutos');
    console.log('📊 Monitore o console para ver os resultados');
    
    testConsoleOptimization();
    testNetworkOptimization();
    testMemoryOptimization();
    testIntervalOptimization();
    testOverallPerformance();
    
    console.log('✅ Todos os testes iniciados! Aguarde os resultados...');
  }
  
  // Expor funções globalmente
  window.testPerformance = {
    runAll: runAllTests,
    console: testConsoleOptimization,
    network: testNetworkOptimization,
    memory: testMemoryOptimization,
    intervals: testIntervalOptimization,
    fps: testOverallPerformance
  };
  
  console.log('🔧 COMANDOS DISPONÍVEIS:');
  console.log('   testPerformance.runAll() - Executar todos os testes');
  console.log('   testPerformance.console() - Testar console');
  console.log('   testPerformance.network() - Testar rede');
  console.log('   testPerformance.memory() - Testar memória');
  console.log('   testPerformance.intervals() - Testar intervals');
  console.log('   testPerformance.fps() - Testar FPS');
  
})();
