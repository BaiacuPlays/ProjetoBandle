// Script para testar o sistema de amigos com limpeza prévia
// Execute com: node test-friends-clean.js

const BASE_URL = 'http://localhost:3000';

async function cleanFriendsData(token, userId) {
  console.log('🧹 Limpando dados de amigos...');
  
  try {
    // Buscar e cancelar todas as solicitações enviadas
    const sentResponse = await fetch(`${BASE_URL}/api/friend-requests?type=sent`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (sentResponse.ok) {
      const sentData = await sentResponse.json();
      if (sentData.requests && sentData.requests.length > 0) {
        console.log(`📤 Cancelando ${sentData.requests.length} solicitações enviadas...`);
        for (const request of sentData.requests) {
          await fetch(`${BASE_URL}/api/friend-requests`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ requestId: request.id })
          });
        }
      }
    }

    // Buscar e rejeitar todas as solicitações recebidas
    const receivedResponse = await fetch(`${BASE_URL}/api/friend-requests?type=received`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (receivedResponse.ok) {
      const receivedData = await receivedResponse.json();
      if (receivedData.requests && receivedData.requests.length > 0) {
        console.log(`📨 Rejeitando ${receivedData.requests.length} solicitações recebidas...`);
        for (const request of receivedData.requests) {
          await fetch(`${BASE_URL}/api/friend-requests`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ requestId: request.id, action: 'reject' })
          });
        }
      }
    }

    // Buscar e remover todos os amigos
    const friendsResponse = await fetch(`${BASE_URL}/api/friends`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (friendsResponse.ok) {
      const friendsData = await friendsResponse.json();
      if (friendsData.friends && friendsData.friends.length > 0) {
        console.log(`👥 Removendo ${friendsData.friends.length} amigos...`);
        for (const friend of friendsData.friends) {
          await fetch(`${BASE_URL}/api/friends`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ friendId: friend.id })
          });
        }
      }
    }

    console.log('✅ Limpeza concluída');
  } catch (error) {
    console.log('⚠️ Erro durante limpeza:', error.message);
  }
}

async function testFriendsSystemClean() {
  console.log('🧪 Iniciando teste limpo do sistema de amigos...\n');

  try {
    // 1. Login usuário 1
    console.log('1️⃣ Fazendo login com usuário 1 (baiacuplays)...');
    const user1Login = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        username: 'baiacuplays',
        password: 'pokemonl12.3@'
      })
    });

    if (!user1Login.ok) {
      throw new Error(`Login usuário 1 falhou: ${user1Login.status}`);
    }

    const user1Data = await user1Login.json();
    const user1Token = user1Data.sessionToken;
    console.log('✅ Usuário 1 logado');

    // 2. Login usuário 2
    console.log('\n2️⃣ Fazendo login com usuário 2 (testfriend)...');
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
      throw new Error(`Login usuário 2 falhou: ${user2Login.status}`);
    }

    const user2Data = await user2Login.json();
    const user2Token = user2Data.sessionToken;
    console.log('✅ Usuário 2 logado');

    // 3. Limpar dados de ambos os usuários
    await cleanFriendsData(user1Token, 'auth_baiacuplays');
    await cleanFriendsData(user2Token, 'auth_testfriend');

    // 4. Aguardar um pouco para garantir que a limpeza foi processada
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. Testar envio de nova solicitação
    console.log('\n3️⃣ Enviando nova solicitação de amizade...');
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
      console.log('✅ Solicitação enviada com sucesso');
    } else {
      const errorData = await requestResponse.json();
      console.log('❌ Erro ao enviar solicitação:', errorData.error);
      return;
    }

    // 6. Verificar se a solicitação foi recebida
    console.log('\n4️⃣ Verificando solicitações recebidas...');
    const receivedResponse = await fetch(`${BASE_URL}/api/friend-requests?type=received`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });

    if (!receivedResponse.ok) {
      throw new Error(`Erro ao buscar solicitações: ${receivedResponse.status}`);
    }

    const receivedData = await receivedResponse.json();
    console.log('📨 Solicitações recebidas:', receivedData.requests?.length || 0);

    if (receivedData.requests && receivedData.requests.length > 0) {
      const request = receivedData.requests[0];
      console.log('📋 Detalhes da solicitação:', {
        id: request.id,
        from: request.fromUser.username,
        to: request.toUser.username
      });

      // 7. Aceitar a solicitação
      console.log('\n5️⃣ Aceitando solicitação...');
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

        // 8. Verificar lista de amigos
        console.log('\n6️⃣ Verificando lista de amigos...');
        const friendsResponse = await fetch(`${BASE_URL}/api/friends`, {
          headers: { 'Authorization': `Bearer ${user1Token}` }
        });

        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          console.log('👥 Amigos do usuário 1:', friendsData.friends?.length || 0);
          
          if (friendsData.friends && friendsData.friends.length > 0) {
            friendsData.friends.forEach(friend => {
              console.log(`   - ${friend.displayName} (@${friend.username})`);
            });
          }
        }

        console.log('\n🎉 Teste completo bem-sucedido!');
      } else {
        const errorData = await acceptResponse.json();
        console.log('❌ Erro ao aceitar solicitação:', errorData.error);
      }
    } else {
      console.log('❌ Nenhuma solicitação foi recebida');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
testFriendsSystemClean();
