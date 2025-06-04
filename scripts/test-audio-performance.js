// Script de teste para verificar performance do sistema de áudio otimizado
import { audioCache, smartPreloader } from '../utils/audioCache.js';

// URLs de teste (substitua por URLs reais do seu projeto)
const testAudioUrls = [
  'https://pub-4d254faec6ec408ab584ea82049c2f79.r2.dev/audio/test1.mp3',
  'https://pub-4d254faec6ec408ab584ea82049c2f79.r2.dev/audio/test2.mp3',
  'https://pub-4d254faec6ec408ab584ea82049c2f79.r2.dev/audio/test3.mp3'
];

// Função para medir tempo de carregamento
const measureLoadTime = async (url) => {
  const startTime = performance.now();
  
  try {
    await audioCache.preloadImmediate(url);
    const endTime = performance.now();
    return endTime - startTime;
  } catch (error) {
    console.error(`Erro ao carregar ${url}:`, error);
    return null;
  }
};

// Função para medir tempo de reprodução
const measurePlayTime = async (url) => {
  const startTime = performance.now();
  
  try {
    await audioCache.playInstant(url);
    const endTime = performance.now();
    return endTime - startTime;
  } catch (error) {
    console.error(`Erro ao reproduzir ${url}:`, error);
    return null;
  }
};

// Teste de cache
const testCache = () => {
  console.log('🧪 Testando sistema de cache...');
  
  // Adicionar alguns áudios ao cache
  testAudioUrls.forEach((url, index) => {
    const audio = new Audio(url);
    audioCache.set(url, audio);
    console.log(`✅ Áudio ${index + 1} adicionado ao cache`);
  });
  
  // Verificar se estão no cache
  testAudioUrls.forEach((url, index) => {
    const inCache = audioCache.has(url);
    console.log(`${inCache ? '✅' : '❌'} Áudio ${index + 1} ${inCache ? 'está' : 'não está'} no cache`);
  });
  
  // Estatísticas do cache
  const stats = audioCache.getStats();
  console.log('📊 Estatísticas do cache:', stats);
};

// Teste de preload
const testPreload = async () => {
  console.log('🚀 Testando sistema de preload...');
  
  const results = [];
  
  for (let i = 0; i < testAudioUrls.length; i++) {
    const url = testAudioUrls[i];
    console.log(`⏳ Testando preload do áudio ${i + 1}...`);
    
    const loadTime = await measureLoadTime(url);
    if (loadTime !== null) {
      results.push({ url, loadTime });
      console.log(`✅ Áudio ${i + 1} carregado em ${loadTime.toFixed(2)}ms`);
    } else {
      console.log(`❌ Falha no carregamento do áudio ${i + 1}`);
    }
  }
  
  // Calcular média
  if (results.length > 0) {
    const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
    console.log(`📈 Tempo médio de carregamento: ${avgLoadTime.toFixed(2)}ms`);
  }
  
  return results;
};

// Teste de reprodução instantânea
const testInstantPlay = async () => {
  console.log('⚡ Testando reprodução instantânea...');
  
  const results = [];
  
  for (let i = 0; i < testAudioUrls.length; i++) {
    const url = testAudioUrls[i];
    
    // Garantir que está no cache
    if (!audioCache.has(url)) {
      await audioCache.preloadImmediate(url);
    }
    
    console.log(`⏳ Testando reprodução instantânea do áudio ${i + 1}...`);
    
    const playTime = await measurePlayTime(url);
    if (playTime !== null) {
      results.push({ url, playTime });
      console.log(`✅ Áudio ${i + 1} reproduzido em ${playTime.toFixed(2)}ms`);
    } else {
      console.log(`❌ Falha na reprodução do áudio ${i + 1}`);
    }
  }
  
  // Calcular média
  if (results.length > 0) {
    const avgPlayTime = results.reduce((sum, r) => sum + r.playTime, 0) / results.length;
    console.log(`📈 Tempo médio de reprodução: ${avgPlayTime.toFixed(2)}ms`);
  }
  
  return results;
};

// Teste de sistema inteligente
const testSmartPreloader = () => {
  console.log('🧠 Testando sistema inteligente de preload...');
  
  // Simular padrões de uso
  smartPreloader.registerUsage('song1', 'daily');
  smartPreloader.registerUsage('song2', 'daily');
  smartPreloader.registerUsage('song1', 'daily'); // song1 mais popular
  smartPreloader.registerUsage('song3', 'infinite');
  smartPreloader.registerUsage('song1', 'infinite');
  
  // Testar predições
  const mockSongs = [
    { id: 'song1', game: 'Game A', franchise: 'Franchise X', audioUrl: testAudioUrls[0] },
    { id: 'song2', game: 'Game B', franchise: 'Franchise X', audioUrl: testAudioUrls[1] },
    { id: 'song3', game: 'Game C', franchise: 'Franchise Y', audioUrl: testAudioUrls[2] }
  ];
  
  const predictions = smartPreloader.predictNext('song2', 'daily', mockSongs);
  console.log('🔮 Predições para próximas músicas:', predictions);
  
  return predictions;
};

// Teste de stress
const testStress = async () => {
  console.log('💪 Testando stress do sistema...');
  
  const iterations = 10;
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const url = testAudioUrls[i % testAudioUrls.length];
    const startTime = performance.now();
    
    try {
      // Simular uso intensivo
      await audioCache.preload(url, true);
      await audioCache.playInstant(url);
      
      const endTime = performance.now();
      results.push(endTime - startTime);
      
      console.log(`✅ Iteração ${i + 1}/${iterations} completada em ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error(`❌ Erro na iteração ${i + 1}:`, error);
    }
  }
  
  if (results.length > 0) {
    const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
    const minTime = Math.min(...results);
    const maxTime = Math.max(...results);
    
    console.log(`📊 Resultados do teste de stress:`);
    console.log(`   Tempo médio: ${avgTime.toFixed(2)}ms`);
    console.log(`   Tempo mínimo: ${minTime.toFixed(2)}ms`);
    console.log(`   Tempo máximo: ${maxTime.toFixed(2)}ms`);
  }
  
  return results;
};

// Função principal de teste
const runAllTests = async () => {
  console.log('🎵 Iniciando testes de performance do sistema de áudio...\n');
  
  try {
    // Teste 1: Cache
    testCache();
    console.log('\n');
    
    // Teste 2: Preload
    await testPreload();
    console.log('\n');
    
    // Teste 3: Reprodução instantânea
    await testInstantPlay();
    console.log('\n');
    
    // Teste 4: Sistema inteligente
    testSmartPreloader();
    console.log('\n');
    
    // Teste 5: Stress
    await testStress();
    console.log('\n');
    
    console.log('🎉 Todos os testes concluídos!');
    
    // Estatísticas finais
    const finalStats = audioCache.getStats();
    console.log('📊 Estatísticas finais do cache:', finalStats);
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
};

// Executar testes se o script for chamado diretamente
if (typeof window !== 'undefined') {
  // Executar no navegador
  window.testAudioPerformance = runAllTests;
  console.log('🌐 Testes disponíveis no navegador. Execute: testAudioPerformance()');
} else {
  // Executar no Node.js
  runAllTests();
}

export { runAllTests, testCache, testPreload, testInstantPlay, testSmartPreloader, testStress };
