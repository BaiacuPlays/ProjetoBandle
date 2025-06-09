// Teste final do sistema de amigos
// Execute com: node final-friends-test.js

const BASE_URL = 'http://localhost:3000';

async function finalFriendsTest() {
  console.log('🎯 Teste final do sistema de amigos...\n');

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

    console.log('✅ Ambos os usuários logados');

    // 3. Verificar se há solicitações pendentes
    console.log('\n📨 Verificando solicitações pendentes...');
    const receivedResponse = await fetch(`${BASE_URL}/api/friend-requests?type=received`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });

    const receivedData = await receivedResponse.json();
    console.log(`📊 Solicitações recebidas: ${receivedData.requests?.length || 0}`);

    if (receivedData.requests && receivedData.requests.length > 0) {
      // Aceitar a primeira solicitação
      const request = receivedData.requests[0];
      console.log(`📋 Aceitando solicitação de: ${request.fromUser.username}`);

      const acceptResponse = await fetch(`${BASE_URL}/api/friend-requests`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user2Token}`
        },
        body: JSON.stringify({
          requestId: request.id,
          action: 'accept'
        })
      });

      if (acceptResponse.ok) {
        console.log('✅ Solicitação aceita');
      }
    }

    // 4. Aguardar um pouco para processamento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. Verificar lista de amigos de ambos os usuários
    console.log('\n👥 Verificando lista de amigos...');

    // Usuário 1
    const friends1Response = await fetch(`${BASE_URL}/api/friends`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    const friends1Data = await friends1Response.json();
    console.log(`📊 Amigos do usuário 1 (baiacuplays): ${friends1Data.friends?.length || 0}`);

    // Usuário 2
    const friends2Response = await fetch(`${BASE_URL}/api/friends`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });
    const friends2Data = await friends2Response.json();
    console.log(`📊 Amigos do usuário 2 (testfriend): ${friends2Data.friends?.length || 0}`);

    // 6. Testar envio de nova solicitação (deve falhar se já são amigos)
    console.log('\n🧪 Testando nova solicitação...');
    const newRequestResponse = await fetch(`${BASE_URL}/api/friend-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        targetUsername: 'testfriend'
      })
    });

    if (newRequestResponse.status === 409) {
      console.log('✅ Sistema corretamente impede nova solicitação');
    } else if (newRequestResponse.ok) {
      console.log('⚠️ Sistema permite nova solicitação');
    } else {
      const errorData = await newRequestResponse.json();
      console.log('❌ Erro:', errorData.error);
    }

    // 7. Resultado final
    const totalFriends1 = friends1Data.friends?.length || 0;
    const totalFriends2 = friends2Data.friends?.length || 0;

    console.log('\n🎯 RESULTADO FINAL:');
    console.log(`👥 Usuário 1 tem ${totalFriends1} amigos`);
    console.log(`👥 Usuário 2 tem ${totalFriends2} amigos`);

    if (totalFriends1 > 0 && totalFriends2 > 0) {
      console.log('🎉 SISTEMA DE AMIGOS FUNCIONANDO! ✅');
    } else {
      console.log('❌ Sistema de amigos com problemas');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
finalFriendsTest();
