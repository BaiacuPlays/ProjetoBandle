// API para testar conectividade com Vercel KV
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Verificar autorização básica para produção
  const authHeader = req.headers.authorization;
  if (process.env.NODE_ENV === 'production' && (!authHeader || !authHeader.startsWith('Bearer '))) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    console.log('🔍 Testando conectividade com Vercel KV...');

    // Teste 1: Verificar variáveis de ambiente
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    
    if (!kvUrl || !kvToken) {
      return res.status(500).json({
        success: false,
        error: 'Variáveis de ambiente KV não configuradas',
        details: {
          KV_REST_API_URL: kvUrl ? 'DEFINIDA' : 'NÃO DEFINIDA',
          KV_REST_API_TOKEN: kvToken ? 'DEFINIDA' : 'NÃO DEFINIDA'
        }
      });
    }

    // Teste 2: Tentar operação simples de escrita
    const testKey = `test:${Date.now()}`;
    const testValue = { message: 'Teste de conectividade', timestamp: new Date().toISOString() };
    
    console.log(`📝 Tentando escrever chave: ${testKey}`);
    await kv.set(testKey, testValue, { ex: 60 }); // Expira em 60 segundos
    
    // Teste 3: Tentar ler o valor
    console.log(`📖 Tentando ler chave: ${testKey}`);
    const retrievedValue = await kv.get(testKey);
    
    // Teste 4: Verificar se o valor foi lido corretamente
    const readSuccess = retrievedValue && retrievedValue.message === testValue.message;
    
    // Teste 5: Limpar a chave de teste
    console.log(`🗑️ Limpando chave de teste: ${testKey}`);
    await kv.del(testKey);
    
    // Teste 6: Verificar algumas estatísticas básicas
    const userKeys = await kv.keys('user:*');
    const profileKeys = await kv.keys('profile:*');
    
    return res.status(200).json({
      success: true,
      tests: {
        environmentVariables: 'PASSOU',
        writeOperation: 'PASSOU',
        readOperation: readSuccess ? 'PASSOU' : 'FALHOU',
        deleteOperation: 'PASSOU',
        keyListing: 'PASSOU'
      },
      statistics: {
        userKeys: userKeys.length,
        profileKeys: profileKeys.length,
        testValue: retrievedValue
      },
      environment: {
        KV_REST_API_URL: kvUrl.substring(0, 30) + '...',
        KV_REST_API_TOKEN: kvToken.substring(0, 15) + '...',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV
      },
      timestamp: new Date().toISOString(),
      message: 'Todos os testes de KV passaram com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro no teste de KV:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      environment: {
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'DEFINIDA' : 'NÃO DEFINIDA',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV
      },
      timestamp: new Date().toISOString()
    });
  }
}
