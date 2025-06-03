// Script para limpar usuários de teste via terminal
// Uso: node scripts/cleanup-test-users.js

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const TEST_USERS = [
  'newuser123',
  'referrer123', 
  'testuser1',
  'testuser2'
];

async function cleanupTestUsers() {
  console.log('🧹 Script de Limpeza de Usuários de Teste');
  console.log('=====================================');
  console.log('\nUsuários que serão removidos:');
  TEST_USERS.forEach(user => console.log(`- ${user}`));
  
  return new Promise((resolve) => {
    rl.question('\n⚠️  Tem certeza que deseja continuar? (s/N): ', async (answer) => {
      if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'sim') {
        console.log('❌ Operação cancelada.');
        rl.close();
        resolve();
        return;
      }

      try {
        console.log('\n🔄 Executando limpeza...');
        
        const response = await fetch('http://localhost:3000/api/admin/cleanup-test-users', {
          method: 'DELETE',
          headers: { 
            'Authorization': 'Bearer admin123',
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();

        if (response.ok && result.success) {
          console.log('\n✅ Limpeza concluída com sucesso!');
          console.log(`📊 ${result.message}`);
          console.log(`🗑️  Chaves deletadas: ${result.totalDeleted}`);
          if (result.errors && result.errors.length > 0) {
            console.log(`⚠️  Erros: ${result.errors.length}`);
            result.errors.forEach(error => console.log(`   - ${error}`));
          }
        } else {
          console.log(`❌ Erro na limpeza: ${result.error || 'Erro desconhecido'}`);
        }
      } catch (error) {
        console.error('❌ Erro ao executar limpeza:', error.message);
        console.log('\n💡 Certifique-se de que o servidor está rodando em http://localhost:3000');
      }

      rl.close();
      resolve();
    });
  });
}

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'admin123' })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Servidor não está rodando ou não está acessível.');
    console.log('💡 Execute "npm run dev" primeiro e tente novamente.');
    process.exit(1);
  }

  await cleanupTestUsers();
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { cleanupTestUsers };
