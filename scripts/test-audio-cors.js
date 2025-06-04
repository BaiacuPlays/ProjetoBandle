// Script para testar CORS e proxy de áudio
const fetch = require('node-fetch');

// URLs de teste
const testUrls = [
  'https://pub-4d254faec6ec408ab584ea82049c2f79.r2.dev/a-short-hike/01. Beach Buds (Short Hike).mp3',
  'https://pub-4d254faec6ec408ab584ea82049c2f79.r2.dev/metroid/1%20-%20Intro.mp3'
];

const baseUrl = 'http://localhost:3000';

async function testDirectAccess(url) {
  console.log(`🔍 Testando acesso direto: ${url}`);
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 5000
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers CORS: ${response.headers.get('access-control-allow-origin') || 'Não encontrado'}`);
    
    return response.ok;
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return false;
  }
}

async function testProxyAccess(url) {
  const proxyUrl = `${baseUrl}/api/audio-proxy?url=${encodeURIComponent(url)}`;
  console.log(`🔄 Testando via proxy: ${proxyUrl}`);
  
  try {
    const response = await fetch(proxyUrl, { 
      method: 'HEAD',
      timeout: 5000
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers CORS: ${response.headers.get('access-control-allow-origin') || 'Não encontrado'}`);
    console.log(`   Content-Type: ${response.headers.get('content-type') || 'Não encontrado'}`);
    
    return response.ok;
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return false;
  }
}

async function testAudioStream(url) {
  const proxyUrl = `${baseUrl}/api/audio-proxy?url=${encodeURIComponent(url)}`;
  console.log(`🎵 Testando streaming de áudio: ${proxyUrl}`);
  
  try {
    const response = await fetch(proxyUrl, { 
      method: 'GET',
      headers: {
        'Range': 'bytes=0-1023' // Testar range request
      },
      timeout: 10000
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Length: ${response.headers.get('content-length') || 'Não encontrado'}`);
    console.log(`   Accept-Ranges: ${response.headers.get('accept-ranges') || 'Não encontrado'}`);
    console.log(`   Content-Range: ${response.headers.get('content-range') || 'Não encontrado'}`);
    
    if (response.ok) {
      const buffer = await response.buffer();
      console.log(`   ✅ Dados recebidos: ${buffer.length} bytes`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return false;
  }
}

async function checkServerStatus() {
  console.log('🌐 Verificando se o servidor está rodando...');
  
  try {
    const response = await fetch(`${baseUrl}/api/audio-proxy`, { 
      method: 'GET',
      timeout: 3000
    });
    
    if (response.status === 400) {
      console.log('✅ Servidor está rodando (API retornou erro esperado)');
      return true;
    }
    
    console.log(`⚠️ Resposta inesperada: ${response.status}`);
    return false;
  } catch (error) {
    console.log(`❌ Servidor não está rodando: ${error.message}`);
    console.log('💡 Execute: npm run dev');
    return false;
  }
}

async function runTests() {
  console.log('🎵 Teste de CORS e Proxy de Áudio - LudoMusic');
  console.log('==============================================\n');
  
  // Verificar se servidor está rodando
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    return;
  }
  
  console.log('');
  
  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    console.log(`📁 Teste ${i + 1}/${testUrls.length}`);
    console.log('='.repeat(50));
    
    // Teste 1: Acesso direto
    const directWorks = await testDirectAccess(url);
    console.log('');
    
    // Teste 2: Via proxy
    const proxyWorks = await testProxyAccess(url);
    console.log('');
    
    // Teste 3: Streaming
    if (proxyWorks) {
      await testAudioStream(url);
    } else {
      console.log('🚫 Pulando teste de streaming (proxy não funcionou)');
    }
    
    console.log('');
    console.log(`📊 Resultado:`);
    console.log(`   Acesso direto: ${directWorks ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`   Via proxy: ${proxyWorks ? '✅ OK' : '❌ FALHOU'}`);
    
    if (!directWorks && proxyWorks) {
      console.log('🎉 CORS resolvido via proxy!');
    } else if (directWorks) {
      console.log('✨ CORS funcionando diretamente!');
    } else {
      console.log('⚠️ Problemas de conectividade');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  }
  
  console.log('🏁 Testes concluídos!');
  console.log('\n💡 Dicas:');
  console.log('   - Se proxy funcionar: CORS será resolvido automaticamente');
  console.log('   - Se acesso direto funcionar: Melhor performance');
  console.log('   - Verifique o console do navegador para mais detalhes');
}

// Executar testes
runTests().catch(console.error);
