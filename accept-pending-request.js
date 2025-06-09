// Script para aceitar a solicitação pendente e testar o sistema
// Execute com: node accept-pending-request.js

const BASE_URL = 'http://localhost:3000';

async function acceptPendingRequest() {
  console.log('🔧 Aceitando solicitação pendente...\n');

  try {
    // Login com usuário 2 (testfriend) que deve ter a solicitação pendente
    const user2Login = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        username: 'testfriend',
        password: 'senha123'
      })
    });

    if (!user2Login.ok) {
      throw new Error(`Login falhou: ${user2Login.status}`);
    }

    const user2Data = await user2Login.json();
    const user2Token = user2Data.sessionToken;
    console.log('✅ Usuário testfriend logado');

    // Verificar solicitações recebidas
    console.log('\n📨 Verificando solicitações recebidas...');
    const receivedResponse = await fetch(`${BASE_URL}/api/friend-requests?type=received`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });

    if (!receivedResponse.ok) {
      throw new Error(`Erro ao buscar solicitações: ${receivedResponse.status}`);
    }

    const receivedData = await receivedResponse.json();
    console.log('📊 Solicitações recebidas:', receivedData.requests?.length || 0);

    if (receivedData.requests && receivedData.requests.length > 0) {
      // Aceitar a primeira solicitação
      const request = receivedData.requests[0];
      console.log(`📋 Aceitando solicitação de: ${request.fromUser.username}`);
      console.log(`📋 ID da solicitação: ${request.id}`);

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
        console.log('✅ Solicitação aceita com sucesso!');

        // Verificar se agora são amigos
        console.log('\n👥 Verificando lista de amigos...');
        const friendsResponse = await fetch(`${BASE_URL}/api/friends`, {
          headers: { 'Authorization': `Bearer ${user2Token}` }
        });

        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          console.log(`📊 Amigos: ${friendsData.friends?.length || 0}`);
          
          if (friendsData.friends && friendsData.friends.length > 0) {
            friendsData.friends.forEach(friend => {
              console.log(`  - ${friend.displayName} (@${friend.username})`);
            });
          }
        }

        // Testar se agora pode enviar nova solicitação
        console.log('\n🧪 Testando nova solicitação após aceitar...');
        
        // Login com usuário 1
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
          console.log('✅ Sistema corretamente impede nova solicitação (já são amigos)');
        } else if (newRequestResponse.ok) {
          console.log('✅ Nova solicitação enviada (sistema permite)');
        } else {
          const errorData = await newRequestResponse.json();
          console.log('❌ Erro inesperado:', errorData.error);
        }

        console.log('\n🎉 Sistema de amigos funcionando corretamente!');

      } else {
        const errorData = await acceptResponse.json();
        console.log('❌ Erro ao aceitar solicitação:', errorData.error);
      }
    } else {
      console.log('📭 Nenhuma solicitação pendente encontrada');
      
      // Testar envio de nova solicitação
      console.log('\n🧪 Testando envio de nova solicitação...');
      
      // Login com usuário 1
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

      if (requestResponse.ok) {
        console.log('✅ Nova solicitação enviada com sucesso!');
        
        // Verificar se foi recebida
        const checkReceived = await fetch(`${BASE_URL}/api/friend-requests?type=received`, {
          headers: { 'Authorization': `Bearer ${user2Token}` }
        });

        const checkData = await checkReceived.json();
        console.log(`📨 Solicitações recebidas após envio: ${checkData.requests?.length || 0}`);
        
        console.log('\n🎉 Sistema de amigos funcionando corretamente!');
      } else {
        const errorData = await requestResponse.json();
        console.log('❌ Erro ao enviar nova solicitação:', errorData.error);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante o processo:', error.message);
  }
}

// Executar o script
acceptPendingRequest();
