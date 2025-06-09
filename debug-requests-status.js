// Script para debugar status das solicitações
// Execute com: node debug-requests-status.js

const BASE_URL = 'http://localhost:3000';

async function debugRequestsStatus() {
  console.log('🔍 Debugando status das solicitações...\n');

  try {
    // 1. Login usuário 1
    const user1Login = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        username: 'baiacuplays',
        password: 'pokemonl12.3@'
      })
    });

    const user1Data = await user1Login.json();
    const user1Token = user1Data.sessionToken;

    // 2. Login usuário 2
    const user2Login = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        username: 'testfriend',
        password: 'senha123'
      })
    });

    const user2Data = await user2Login.json();
    const user2Token = user2Data.sessionToken;

    // 3. Tentar enviar solicitação e capturar resposta detalhada
    console.log('📤 Tentando enviar solicitação...');
    const requestResponse = await fetch(`${BASE_URL}/api/friend-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        targetUsername: 'testfriend'
      })
    });

    const responseText = await requestResponse.text();
    console.log('📋 Status da resposta:', requestResponse.status);
    console.log('📋 Resposta completa:', responseText);

    // 4. Verificar se há solicitações com status não-pending
    console.log('\n🔍 Verificando todas as solicitações (incluindo não-pending)...');
    
    // Verificar solicitações recebidas pelo usuário 2 (todas, não apenas pending)
    const user2ReceivedResponse = await fetch(`${BASE_URL}/api/friend-requests?type=received`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });
    
    if (user2ReceivedResponse.ok) {
      const receivedData = await user2ReceivedResponse.json();
      console.log('📨 Solicitações recebidas pelo testfriend:', receivedData.requests?.length || 0);
      if (receivedData.requests && receivedData.requests.length > 0) {
        receivedData.requests.forEach((req, index) => {
          console.log(`   ${index + 1}. De: ${req.fromUser.username} | Status: ${req.status} | ID: ${req.id} | Timestamp: ${req.timestamp}`);
        });
      }
    }

    // 5. Verificar se há dados persistentes que não estão sendo mostrados na API
    console.log('\n🔍 Tentando verificar dados brutos...');
    
    // Fazer uma segunda tentativa de envio para ver se o erro persiste
    console.log('\n📤 Segunda tentativa de envio...');
    const secondRequestResponse = await fetch(`${BASE_URL}/api/friend-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        targetUsername: 'testfriend'
      })
    });

    const secondResponseText = await secondRequestResponse.text();
    console.log('📋 Status da segunda tentativa:', secondRequestResponse.status);
    console.log('📋 Resposta da segunda tentativa:', secondResponseText);

  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
  }
}

// Executar o debug
debugRequestsStatus();
