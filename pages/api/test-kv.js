// API para testar conexão com Vercel KV
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // Testar se KV está disponível
    const testKey = 'test_connection';
    const testValue = { timestamp: new Date().toISOString(), test: true };

    // Tentar escrever
    await kv.set(testKey, testValue, { ex: 60 }); // Expira em 60 segundos

    // Tentar ler
    const readValue = await kv.get(testKey);

    // Limpar teste
    await kv.del(testKey);

    return res.status(200).json({
      success: true,
      message: 'Vercel KV está funcionando corretamente',
      test: {
        written: testValue,
        read: readValue,
        match: JSON.stringify(testValue) === JSON.stringify(readValue)
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasKVUrl: !!process.env.KV_REST_API_URL,
        hasKVToken: !!process.env.KV_REST_API_TOKEN,
        kvUrlPreview: process.env.KV_REST_API_URL ? 
          process.env.KV_REST_API_URL.substring(0, 30) + '...' : 'Not set'
      }
    });

  } catch (error) {
    console.error('Erro ao testar KV:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasKVUrl: !!process.env.KV_REST_API_URL,
        hasKVToken: !!process.env.KV_REST_API_TOKEN
      }
    });
  }
}
