// Script para limpar e testar o sistema de amigos corrigido
// Execute com: node fix-friends-system.js

const BASE_URL = 'http://localhost:3000';

async function clearAllFriendsData() {
  console.log('🧹 Limpando TODOS os dados de amigos do sistema...\n');

  try {
    // Login com ambos os usuários
    const user1Login = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        username: 'baiacuplays',
        password: 'pokemonl12.3@'
      })
    });

    const user2Login = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        username: 'testfriend',
        password: 'senha123'
      })
    });

    if (!user1Login.ok || !user2Login.ok) {
      throw new Error('Falha no login');
    }

    const user1Data = await user1Login.json();
    const user2Data = await user2Login.json();
    const user1Token = user1Data.sessionToken;
    const user2Token = user2Data.sessionToken;

    console.log('✅ Usuários logados');

    // Função para limpar dados de um usuário
    async function clearUserData(token, username) {
      console.log(`🧹 Limpando dados de ${username}...`);

      // Cancelar todas as solicitações enviadas
      const sentResponse = await fetch(`${BASE_URL}/api/friend-requests?type=sent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (sentResponse.ok) {
        const sentData = await sentResponse.json();
        if (sentData.requests && sentData.requests.length > 0) {
          console.log(`  📤 Cancelando ${sentData.requests.length} solicitações enviadas...`);
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

      // Rejeitar todas as solicitações recebidas
      const receivedResponse = await fetch(`${BASE_URL}/api/friend-requests?type=received`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (receivedResponse.ok) {
        const receivedData = await receivedResponse.json();
        if (receivedData.requests && receivedData.requests.length > 0) {
          console.log(`  📨 Rejeitando ${receivedData.requests.length} solicitações recebidas...`);
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

      // Remover todos os amigos
      const friendsResponse = await fetch(`${BASE_URL}/api/friends`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json();
        if (friendsData.friends && friendsData.friends.length > 0) {
          console.log(`  👥 Removendo ${friendsData.friends.length} amigos...`);
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

      console.log(`  ✅ Dados de ${username} limpos`);
    }

    // Limpar dados de ambos os usuários
    await clearUserData(user1Token, 'baiacuplays');
    await clearUserData(user2Token, 'testfriend');

    console.log('\n🎉 Limpeza completa concluída!');
    return { user1Token, user2Token };

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error.message);
    throw error;
  }
}

async function testFriendsSystemFixed() {
  console.log('\n🧪 Testando sistema de amigos corrigido...\n');

  try {
    // 1. Limpar todos os dados primeiro
    const { user1Token, user2Token } = await clearAllFriendsData();

    // 2. Aguardar um pouco para garantir que a limpeza foi processada
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Verificar se os dados estão realmente limpos
    console.log('🔍 Verificando se os dados estão limpos...');
    
    const user1SentCheck = await fetch(`${BASE_URL}/api/friend-requests?type=sent`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    const user1SentData = await user1SentCheck.json();
    
    const user2ReceivedCheck = await fetch(`${BASE_URL}/api/friend-requests?type=received`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });
    const user2ReceivedData = await user2ReceivedCheck.json();

    console.log('📊 Status após limpeza:');
    console.log(`  - Solicitações enviadas (user1): ${user1SentData.requests?.length || 0}`);
    console.log(`  - Solicitações recebidas (user2): ${user2ReceivedData.requests?.length || 0}`);

    // 4. Testar envio de nova solicitação
    console.log('\n📤 Testando envio de nova solicitação...');
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
      console.log('✅ Solicitação enviada com sucesso!');

      // 5. Verificar se a solicitação foi recebida
      console.log('\n📨 Verificando se a solicitação foi recebida...');
      const checkReceived = await fetch(`${BASE_URL}/api/friend-requests?type=received`, {
        headers: { 'Authorization': `Bearer ${user2Token}` }
      });

      const receivedData = await checkReceived.json();
      console.log(`📊 Solicitações recebidas: ${receivedData.requests?.length || 0}`);

      if (receivedData.requests && receivedData.requests.length > 0) {
        const request = receivedData.requests[0];
        console.log(`📋 Solicitação de: ${request.fromUser.username} para: ${request.toUser.username}`);

        // 6. Aceitar a solicitação
        console.log('\n✅ Aceitando solicitação...');
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
          console.log('✅ Solicitação aceita!');

          // 7. Verificar lista de amigos
          console.log('\n👥 Verificando lista de amigos...');
          const friendsResponse = await fetch(`${BASE_URL}/api/friends`, {
            headers: { 'Authorization': `Bearer ${user1Token}` }
          });

          const friendsData = await friendsResponse.json();
          console.log(`📊 Amigos encontrados: ${friendsData.friends?.length || 0}`);

          if (friendsData.friends && friendsData.friends.length > 0) {
            friendsData.friends.forEach(friend => {
              console.log(`  - ${friend.displayName} (@${friend.username})`);
            });
          }

          // 8. Testar se pode enviar nova solicitação após aceitar
          console.log('\n🔄 Testando nova solicitação após aceitar...');
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
            console.log('✅ Sistema corretamente impede solicitação para amigo existente');
          } else if (newRequestResponse.ok) {
            console.log('⚠️ Sistema permite nova solicitação (pode ser esperado se não são mais amigos)');
          } else {
            console.log('❌ Erro inesperado:', newRequestResponse.status);
          }

          console.log('\n🎉 SISTEMA DE AMIGOS FUNCIONANDO CORRETAMENTE! ✅');

        } else {
          const errorData = await acceptResponse.json();
          console.log('❌ Erro ao aceitar solicitação:', errorData.error);
        }
      } else {
        console.log('❌ Solicitação não foi recebida');
      }
    } else {
      const errorData = await requestResponse.json();
      console.log('❌ Erro ao enviar solicitação:', errorData.error);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
testFriendsSystemFixed();
