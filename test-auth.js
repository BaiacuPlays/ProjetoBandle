// Teste direto da API de autenticação
const testAuth = async () => {
  console.log('🧪 Testando API de autenticação...');
  
  try {
    // Teste de registro
    const registerResponse = await fetch('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'register',
        username: 'TestUser123',
        password: 'password123',
        email: 'test@example.com'
      })
    });
    
    console.log('📝 Resposta do registro:', registerResponse.status);
    const registerData = await registerResponse.text();
    console.log('📄 Dados do registro:', registerData);
    
    if (registerResponse.ok) {
      const parsedData = JSON.parse(registerData);
      console.log('✅ Registro bem-sucedido!', parsedData);
      
      // Teste de login
      const loginResponse = await fetch('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          username: 'TestUser123',
          password: 'password123'
        })
      });
      
      console.log('🔐 Resposta do login:', loginResponse.status);
      const loginData = await loginResponse.text();
      console.log('📄 Dados do login:', loginData);
      
    } else {
      console.error('❌ Erro no registro:', registerData);
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
};

// Executar teste
testAuth();
