// Script para debugar dados do sistema de amigos
// Execute com: node debug-friends-data.js

const BASE_URL = 'http://localhost:3000';

async function debugFriendsData() {
  console.log('🔍 Debugando dados do sistema de amigos...\n');

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

    // 3. Verificar dados do usuário 1
    console.log('\n📊 DADOS DO USUÁRIO 1 (baiacuplays):');
    
    // Solicitações enviadas
    const user1SentResponse = await fetch(`${BASE_URL}/api/friend-requests?type=sent`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    
    if (user1SentResponse.ok) {
      const sentData = await user1SentResponse.json();
      console.log('📤 Solicitações enviadas:', sentData.requests?.length || 0);
      if (sentData.requests && sentData.requests.length > 0) {
        sentData.requests.forEach((req, index) => {
          console.log(`   ${index + 1}. Para: ${req.toUser.username} | Status: ${req.status} | ID: ${req.id}`);
        });
      }
    } else {
      console.log('❌ Erro ao buscar solicitações enviadas:', user1SentResponse.status);
    }

    // Solicitações recebidas
    const user1ReceivedResponse = await fetch(`${BASE_URL}/api/friend-requests?type=received`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    
    if (user1ReceivedResponse.ok) {
      const receivedData = await user1ReceivedResponse.json();
      console.log('📨 Solicitações recebidas:', receivedData.requests?.length || 0);
      if (receivedData.requests && receivedData.requests.length > 0) {
        receivedData.requests.forEach((req, index) => {
          console.log(`   ${index + 1}. De: ${req.fromUser.username} | Status: ${req.status} | ID: ${req.id}`);
        });
      }
    } else {
      console.log('❌ Erro ao buscar solicitações recebidas:', user1ReceivedResponse.status);
    }

    // Lista de amigos
    const user1FriendsResponse = await fetch(`${BASE_URL}/api/friends`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    
    if (user1FriendsResponse.ok) {
      const friendsData = await user1FriendsResponse.json();
      console.log('👥 Amigos:', friendsData.friends?.length || 0);
      if (friendsData.friends && friendsData.friends.length > 0) {
        friendsData.friends.forEach((friend, index) => {
          console.log(`   ${index + 1}. ${friend.displayName} (@${friend.username}) | ID: ${friend.id}`);
        });
      }
    } else {
      console.log('❌ Erro ao buscar amigos:', user1FriendsResponse.status);
    }

    // 4. Verificar dados do usuário 2
    console.log('\n📊 DADOS DO USUÁRIO 2 (testfriend):');
    
    // Solicitações enviadas
    const user2SentResponse = await fetch(`${BASE_URL}/api/friend-requests?type=sent`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });
    
    if (user2SentResponse.ok) {
      const sentData = await user2SentResponse.json();
      console.log('📤 Solicitações enviadas:', sentData.requests?.length || 0);
      if (sentData.requests && sentData.requests.length > 0) {
        sentData.requests.forEach((req, index) => {
          console.log(`   ${index + 1}. Para: ${req.toUser.username} | Status: ${req.status} | ID: ${req.id}`);
        });
      }
    } else {
      console.log('❌ Erro ao buscar solicitações enviadas:', user2SentResponse.status);
    }

    // Solicitações recebidas
    const user2ReceivedResponse = await fetch(`${BASE_URL}/api/friend-requests?type=received`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });
    
    if (user2ReceivedResponse.ok) {
      const receivedData = await user2ReceivedResponse.json();
      console.log('📨 Solicitações recebidas:', receivedData.requests?.length || 0);
      if (receivedData.requests && receivedData.requests.length > 0) {
        receivedData.requests.forEach((req, index) => {
          console.log(`   ${index + 1}. De: ${req.fromUser.username} | Status: ${req.status} | ID: ${req.id}`);
        });
      }
    } else {
      console.log('❌ Erro ao buscar solicitações recebidas:', user2ReceivedResponse.status);
    }

    // Lista de amigos
    const user2FriendsResponse = await fetch(`${BASE_URL}/api/friends`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });
    
    if (user2FriendsResponse.ok) {
      const friendsData = await user2FriendsResponse.json();
      console.log('👥 Amigos:', friendsData.friends?.length || 0);
      if (friendsData.friends && friendsData.friends.length > 0) {
        friendsData.friends.forEach((friend, index) => {
          console.log(`   ${index + 1}. ${friend.displayName} (@${friend.username}) | ID: ${friend.id}`);
        });
      }
    } else {
      console.log('❌ Erro ao buscar amigos:', user2FriendsResponse.status);
    }

    console.log('\n🔍 Debug concluído!');

  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
  }
}

// Executar o debug
debugFriendsData();
