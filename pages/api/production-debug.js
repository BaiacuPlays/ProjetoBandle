// Debug específico para produção
export default async function handler(req, res) {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: {
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'unknown'
    },
    kv: {
      hasUrl: !!process.env.KV_REST_API_URL,
      hasToken: !!process.env.KV_REST_API_TOKEN,
      urlLength: process.env.KV_REST_API_URL?.length || 0,
      tokenLength: process.env.KV_REST_API_TOKEN?.length || 0,
      urlPrefix: process.env.KV_REST_API_URL?.substring(0, 30) || 'undefined',
      tokenPrefix: process.env.KV_REST_API_TOKEN?.substring(0, 10) || 'undefined'
    },
    allKvVars: Object.keys(process.env).filter(key => key.includes('KV')),
    step: 'INIT'
  };

  try {
    // Teste 1: Verificar variáveis
    debug.step = 'CHECKING_VARS';
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      debug.error = 'Variáveis KV ausentes';
      debug.success = false;
      return res.status(200).json(debug);
    }

    // Teste 2: Tentar importar KV
    debug.step = 'IMPORTING_KV';
    const { kv } = await import('@vercel/kv');
    debug.importSuccess = true;

    // Teste 3: Teste básico com timeout
    debug.step = 'TESTING_KV';
    const testKey = `prod-test:${Date.now()}`;
    const testValue = { test: true, env: 'production', timestamp: Date.now() };

    // Timeout de 10 segundos para produção
    const testPromise = Promise.race([
      (async () => {
        await kv.set(testKey, testValue, { ex: 30 });
        const retrieved = await kv.get(testKey);
        await kv.del(testKey);
        return retrieved;
      })(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na operação KV')), 10000)
      )
    ]);

    const result = await testPromise;
    
    debug.step = 'SUCCESS';
    debug.success = true;
    debug.testResult = {
      sent: testValue,
      received: result,
      match: JSON.stringify(testValue) === JSON.stringify(result)
    };

  } catch (error) {
    debug.success = false;
    debug.error = {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5) // Primeiras 5 linhas do stack
    };
  }

  return res.status(200).json(debug);
}
