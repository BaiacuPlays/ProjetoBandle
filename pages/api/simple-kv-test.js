// Teste simples para identificar problema específico do KV
export default async function handler(req, res) {
  const result = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    step: 'INICIANDO',
    error: null
  };

  try {
    // Passo 1: Verificar variáveis
    result.step = 'VERIFICANDO_VARIAVEIS';
    result.variables = {
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
      urlLength: process.env.KV_REST_API_URL ? process.env.KV_REST_API_URL.length : 0,
      tokenLength: process.env.KV_REST_API_TOKEN ? process.env.KV_REST_API_TOKEN.length : 0
    };

    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      throw new Error('Variáveis KV não definidas');
    }

    // Passo 2: Tentar importar
    result.step = 'IMPORTANDO_KV';
    const { kv } = await import('@vercel/kv');
    result.importSuccess = true;

    // Passo 3: Teste básico
    result.step = 'TESTANDO_OPERACAO_BASICA';
    const testKey = `simple-test:${Date.now()}`;
    const testValue = 'test-value';

    await kv.set(testKey, testValue);
    const retrieved = await kv.get(testKey);
    await kv.del(testKey);

    result.step = 'CONCLUIDO';
    result.success = true;
    result.testResult = {
      wrote: true,
      read: retrieved === testValue,
      deleted: true
    };

  } catch (error) {
    result.success = false;
    result.error = {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
  }

  return res.status(200).json(result);
}
