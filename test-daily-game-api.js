// Script de teste para a API de validação do jogo diário
const testDailyGameAPI = async () => {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Testando API de validação do jogo diário...');
  
  // Teste 1: Sem token (deve retornar 401)
  console.log('\n1️⃣ Teste sem token de autenticação:');
  try {
    const response = await fetch(`${baseURL}/api/validate-daily-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: '2024-01-15',
        gameStats: {
          won: false,
          attempts: 0,
          mode: 'daily',
          song: { title: 'check_only', game: 'check_only', id: 'check_only' },
          playTime: 0
        }
      })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Resposta:', data);
    
    if (response.status === 401) {
      console.log('✅ Teste 1 passou - 401 retornado corretamente');
    } else {
      console.log('❌ Teste 1 falhou - esperado 401');
    }
  } catch (error) {
    console.log('❌ Erro no teste 1:', error.message);
  }
  
  // Teste 2: Token inválido (deve retornar 401)
  console.log('\n2️⃣ Teste com token inválido:');
  try {
    const response = await fetch(`${baseURL}/api/validate-daily-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token_invalido_123'
      },
      body: JSON.stringify({
        date: '2024-01-15',
        gameStats: {
          won: false,
          attempts: 0,
          mode: 'daily',
          song: { title: 'check_only', game: 'check_only', id: 'check_only' },
          playTime: 0
        }
      })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Resposta:', data);
    
    if (response.status === 401) {
      console.log('✅ Teste 2 passou - 401 retornado corretamente');
    } else {
      console.log('❌ Teste 2 falhou - esperado 401');
    }
  } catch (error) {
    console.log('❌ Erro no teste 2:', error.message);
  }
  
  // Teste 3: Sem data (deve retornar 400)
  console.log('\n3️⃣ Teste sem data:');
  try {
    const response = await fetch(`${baseURL}/api/validate-daily-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token_invalido_123'
      },
      body: JSON.stringify({
        gameStats: {
          won: false,
          attempts: 0,
          mode: 'daily',
          song: { title: 'check_only', game: 'check_only', id: 'check_only' },
          playTime: 0
        }
      })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Resposta:', data);
    
    if (response.status === 400 || response.status === 401) {
      console.log('✅ Teste 3 passou - erro retornado corretamente');
    } else {
      console.log('❌ Teste 3 falhou - esperado 400 ou 401');
    }
  } catch (error) {
    console.log('❌ Erro no teste 3:', error.message);
  }
  
  // Teste 4: Método inválido (deve retornar 405)
  console.log('\n4️⃣ Teste com método inválido:');
  try {
    const response = await fetch(`${baseURL}/api/validate-daily-game`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Resposta:', data);
    
    if (response.status === 405) {
      console.log('✅ Teste 4 passou - 405 retornado corretamente');
    } else {
      console.log('❌ Teste 4 falhou - esperado 405');
    }
  } catch (error) {
    console.log('❌ Erro no teste 4:', error.message);
  }
  
  console.log('\n🏁 Testes concluídos!');
};

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testDailyGameAPI();
} else {
  // Browser environment
  window.testDailyGameAPI = testDailyGameAPI;
  console.log('Função testDailyGameAPI disponível no console do navegador');
}

module.exports = { testDailyGameAPI };
