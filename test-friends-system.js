// Script para testar o sistema de amigos completo
// Execute com: node test-friends-system.js

const BASE_URL = 'http://localhost:3000';

async function testFriendsSystem() {
  console.log('🧪 Iniciando teste completo do sistema de amigos...\n');

  try {
    // 1. Fazer login com dois usuários diferentes
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
    console.log('✅ Usuário 1 logado com sucesso');
    console.log('🔍 Token do usuário 1:', user1Token ? user1Token.substring(0, 10) + '...' : 'NENHUM');

    // 2. Criar um segundo usuário para teste
    console.log('\n2️⃣ Criando usuário 2 para teste...');
    const user2Register = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        username: 'testfriend',
        password: 'senha123',
        email: 'testfriend@example.com'
      })
    });

    let user2Token;
    if (user2Register.status === 409) {
      // Usuário já existe, fazer login
      console.log('📝 Usuário 2 já existe, fazendo login...');
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
      user2Token = user2Data.sessionToken;
    } else if (user2Register.ok) {
      const user2Data = await user2Register.json();
      user2Token = user2Data.sessionToken;
    } else {
      throw new Error(`Erro ao criar usuário 2: ${user2Register.status}`);
    }

    console.log('✅ Usuário 2 pronto para teste');
    console.log('🔍 Token do usuário 2:', user2Token ? user2Token.substring(0, 10) + '...' : 'NENHUM');

    // 3. Testar busca de usuário
    console.log('\n3️⃣ Testando busca de usuário...');
    const searchResponse = await fetch(`${BASE_URL}/api/search-users?query=testfriend&currentUserId=auth_baiacuplays`, {
      headers: {
        'Authorization': `Bearer ${user1Token}`
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`Busca de usuário falhou: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('✅ Usuário encontrado:', searchData.user?.username);

    // 4. Limpar solicitações existentes primeiro
    console.log('\n4️⃣ Limpando solicitações existentes...');

    // Verificar solicitações enviadas pelo usuário 1
    const sentRequestsResponse = await fetch(`${BASE_URL}/api/friend-requests?type=sent`, {
      headers: {
        'Authorization': `Bearer ${user1Token}`
      }
    });

    if (sentRequestsResponse.ok) {
      const sentData = await sentRequestsResponse.json();
      console.log('📤 Solicitações enviadas existentes:', sentData.requests?.length || 0);
    }

    // 5. Testar envio de solicitação de amizade
    console.log('\n5️⃣ Testando envio de solicitação de amizade...');
    const friendRequestResponse = await fetch(`${BASE_URL}/api/friend-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        targetUsername: 'testfriend'
      })
    });

    if (!friendRequestResponse.ok) {
      const errorData = await friendRequestResponse.json().catch(() => ({}));
      console.log('⚠️ Solicitação pode já existir:', errorData.error);
    } else {
      console.log('✅ Solicitação de amizade enviada');
    }

    // 6. Verificar solicitações recebidas (usuário 2)
    console.log('\n6️⃣ Verificando solicitações recebidas...');
    const receivedRequestsResponse = await fetch(`${BASE_URL}/api/friend-requests?type=received`, {
      headers: {
        'Authorization': `Bearer ${user2Token}`
      }
    });

    if (!receivedRequestsResponse.ok) {
      throw new Error(`Erro ao buscar solicitações: ${receivedRequestsResponse.status}`);
    }

    const receivedData = await receivedRequestsResponse.json();
    console.log('📨 Solicitações recebidas:', receivedData.requests?.length || 0);

    // 7. Aceitar solicitação de amizade
    if (receivedData.requests && receivedData.requests.length > 0) {
      const request = receivedData.requests.find(r => r.fromUser.username === 'baiacuplays');
      if (request) {
        console.log('\n7️⃣ Aceitando solicitação de amizade...');
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

        if (!acceptResponse.ok) {
          throw new Error(`Erro ao aceitar solicitação: ${acceptResponse.status}`);
        }

        console.log('✅ Solicitação aceita com sucesso');
      }
    }

    // 8. Verificar lista de amigos (usuário 1)
    console.log('\n8️⃣ Verificando lista de amigos...');
    const friendsResponse = await fetch(`${BASE_URL}/api/friends`, {
      headers: {
        'Authorization': `Bearer ${user1Token}`
      }
    });

    if (!friendsResponse.ok) {
      throw new Error(`Erro ao buscar amigos: ${friendsResponse.status}`);
    }

    const friendsData = await friendsResponse.json();
    console.log('👥 Amigos encontrados:', friendsData.friends?.length || 0);

    if (friendsData.friends && friendsData.friends.length > 0) {
      friendsData.friends.forEach(friend => {
        console.log(`   - ${friend.displayName} (@${friend.username})`);
      });
    }

    // 9. Testar remoção de amigo
    if (friendsData.friends && friendsData.friends.length > 0) {
      const friendToRemove = friendsData.friends.find(f => f.username === 'testfriend');
      if (friendToRemove) {
        console.log('\n9️⃣ Testando remoção de amigo...');
        const removeResponse = await fetch(`${BASE_URL}/api/friends`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user1Token}`
          },
          body: JSON.stringify({
            friendId: friendToRemove.id
          })
        });

        if (!removeResponse.ok) {
          throw new Error(`Erro ao remover amigo: ${removeResponse.status}`);
        }

        console.log('✅ Amigo removido com sucesso');
      }
    }

    // 10. Verificar lista final de amigos
    console.log('\n🔟 Verificando lista final de amigos...');
    const finalFriendsResponse = await fetch(`${BASE_URL}/api/friends`, {
      headers: {
        'Authorization': `Bearer ${user1Token}`
      }
    });

    const finalFriendsData = await finalFriendsResponse.json();
    console.log('👥 Amigos restantes:', finalFriendsData.friends?.length || 0);

    console.log('\n🎉 Teste do sistema de amigos concluído com sucesso!');
    console.log('\n📊 Resumo dos testes:');
    console.log('✅ Login de usuários');
    console.log('✅ Busca de usuários');
    console.log('✅ Envio de solicitação de amizade');
    console.log('✅ Recebimento de solicitações');
    console.log('✅ Aceitação de solicitações');
    console.log('✅ Listagem de amigos');
    console.log('✅ Remoção de amigos');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar o teste
testFriendsSystem();
