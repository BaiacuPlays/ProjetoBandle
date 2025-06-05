// API específica para testar KV em produção
export default async function handler(req, res) {
  // Só permitir em produção ou com query param específico
  if (process.env.NODE_ENV === 'development' && !req.query.force) {
    return res.status(403).json({ 
      error: 'Este endpoint é apenas para produção. Use ?force=true para testar localmente.' 
    });
  }

  const testResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    tests: []
  };

  // Teste 1: Verificar variáveis de ambiente
  console.log('🔍 Teste 1: Verificando variáveis de ambiente...');
  const envTest = {
    name: 'Variáveis de Ambiente',
    status: 'EXECUTANDO',
    details: {}
  };

  try {
    envTest.details = {
      KV_REST_API_URL: process.env.KV_REST_API_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'DEFINIDA' : 'NÃO DEFINIDA',
      KV_URL: process.env.KV_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
      urlPreview: process.env.KV_REST_API_URL ? process.env.KV_REST_API_URL.substring(0, 40) + '...' : 'N/A',
      tokenLength: process.env.KV_REST_API_TOKEN ? process.env.KV_REST_API_TOKEN.length : 0
    };

    const hasRequiredVars = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
    envTest.status = hasRequiredVars ? 'PASSOU' : 'FALHOU';
    envTest.message = hasRequiredVars ? 'Variáveis necessárias estão definidas' : 'Variáveis KV não estão definidas';
  } catch (error) {
    envTest.status = 'ERRO';
    envTest.error = error.message;
  }

  testResults.tests.push(envTest);

  // Teste 2: Importar @vercel/kv
  console.log('🔍 Teste 2: Importando @vercel/kv...');
  const importTest = {
    name: 'Importação @vercel/kv',
    status: 'EXECUTANDO'
  };

  let kv = null;
  try {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
    importTest.status = 'PASSOU';
    importTest.message = 'Módulo @vercel/kv importado com sucesso';
    importTest.details = {
      hasKvInstance: !!kv,
      kvType: typeof kv
    };
  } catch (error) {
    importTest.status = 'FALHOU';
    importTest.error = error.message;
    importTest.stack = error.stack;
  }

  testResults.tests.push(importTest);

  // Teste 3: Operações KV (só se a importação funcionou)
  if (kv && envTest.status === 'PASSOU') {
    console.log('🔍 Teste 3: Testando operações KV...');
    const kvOpsTest = {
      name: 'Operações KV',
      status: 'EXECUTANDO',
      operations: []
    };

    try {
      // Operação 1: SET
      const testKey = `production-test:${Date.now()}`;
      const testValue = { 
        test: true, 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      };

      console.log(`📝 SET: ${testKey}`);
      await kv.set(testKey, testValue, { ex: 300 }); // Expira em 5 minutos
      kvOpsTest.operations.push({ operation: 'SET', status: 'SUCESSO', key: testKey });

      // Operação 2: GET
      console.log(`📖 GET: ${testKey}`);
      const retrieved = await kv.get(testKey);
      const getSuccess = retrieved && retrieved.test === true;
      kvOpsTest.operations.push({ 
        operation: 'GET', 
        status: getSuccess ? 'SUCESSO' : 'FALHOU',
        retrieved: !!retrieved,
        dataIntegrity: getSuccess
      });

      // Operação 3: EXISTS
      console.log(`🔍 EXISTS: ${testKey}`);
      const exists = await kv.exists(testKey);
      kvOpsTest.operations.push({ 
        operation: 'EXISTS', 
        status: exists ? 'SUCESSO' : 'FALHOU',
        exists 
      });

      // Operação 4: DEL
      console.log(`🗑️ DEL: ${testKey}`);
      await kv.del(testKey);
      kvOpsTest.operations.push({ operation: 'DEL', status: 'SUCESSO' });

      // Verificar se foi deletado
      const deletedCheck = await kv.get(testKey);
      kvOpsTest.operations.push({ 
        operation: 'DELETE_VERIFY', 
        status: !deletedCheck ? 'SUCESSO' : 'FALHOU',
        stillExists: !!deletedCheck
      });

      kvOpsTest.status = 'PASSOU';
      kvOpsTest.message = 'Todas as operações KV funcionaram corretamente';

    } catch (error) {
      kvOpsTest.status = 'FALHOU';
      kvOpsTest.error = error.message;
      kvOpsTest.stack = error.stack;
      kvOpsTest.errorType = error.constructor.name;
    }

    testResults.tests.push(kvOpsTest);
  }

  // Teste 4: Verificar dados existentes
  if (kv && envTest.status === 'PASSOU') {
    console.log('🔍 Teste 4: Verificando dados existentes...');
    const dataTest = {
      name: 'Dados Existentes',
      status: 'EXECUTANDO'
    };

    try {
      const userKeys = await kv.keys('user:*');
      const profileKeys = await kv.keys('profile:*');
      
      dataTest.status = 'PASSOU';
      dataTest.message = 'Dados existentes verificados';
      dataTest.details = {
        userKeys: userKeys.length,
        profileKeys: profileKeys.length,
        sampleUserKeys: userKeys.slice(0, 5),
        sampleProfileKeys: profileKeys.slice(0, 5)
      };
    } catch (error) {
      dataTest.status = 'FALHOU';
      dataTest.error = error.message;
    }

    testResults.tests.push(dataTest);
  }

  // Resultado final
  const allPassed = testResults.tests.every(test => test.status === 'PASSOU');
  testResults.overallStatus = allPassed ? 'TODOS_PASSARAM' : 'ALGUNS_FALHARAM';
  testResults.summary = {
    total: testResults.tests.length,
    passed: testResults.tests.filter(t => t.status === 'PASSOU').length,
    failed: testResults.tests.filter(t => t.status === 'FALHOU').length,
    errors: testResults.tests.filter(t => t.status === 'ERRO').length
  };

  console.log('📊 Resultado final dos testes:', testResults.summary);

  return res.status(200).json(testResults);
}
