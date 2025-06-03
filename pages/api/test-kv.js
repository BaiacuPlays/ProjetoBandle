// API de teste para verificar se o KV está funcionando
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Apenas permitir em desenvolvimento ou com senha admin
  const isAdmin = req.headers.authorization === 'Bearer admin123';
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev && !isAdmin) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    // Verificar variáveis de ambiente
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      KV_REST_API_URL: process.env.KV_REST_API_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'DEFINIDA' : 'NÃO DEFINIDA',
      KV_URL: process.env.KV_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
      REDIS_URL: process.env.REDIS_URL ? 'DEFINIDA' : 'NÃO DEFINIDA'
    };

    // Testar operação básica do KV
    const testKey = 'test:' + Date.now();
    const testValue = { message: 'Teste KV', timestamp: Date.now() };

    // Tentar salvar
    await kv.set(testKey, testValue, { ex: 60 }); // Expira em 60 segundos
    
    // Tentar recuperar
    const retrieved = await kv.get(testKey);
    
    // Limpar teste
    await kv.del(testKey);

    return res.status(200).json({
      success: true,
      message: 'KV funcionando corretamente',
      envCheck,
      testResult: {
        saved: testValue,
        retrieved: retrieved,
        match: JSON.stringify(testValue) === JSON.stringify(retrieved)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      envCheck: {
        NODE_ENV: process.env.NODE_ENV,
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'DEFINIDA' : 'NÃO DEFINIDA'
      }
    });
  }
}
