// API para diagnosticar problemas com Vercel KV
export default async function handler(req, res) {
  // Verificar se estamos em desenvolvimento
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log detalhado das variáveis para debug
  console.log('🔍 DEBUG KV - Variáveis de ambiente:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    KV_REST_API_URL: process.env.KV_REST_API_URL ? `${process.env.KV_REST_API_URL.substring(0, 30)}...` : 'NÃO DEFINIDA',
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? `${process.env.KV_REST_API_TOKEN.substring(0, 15)}...` : 'NÃO DEFINIDA',
    KV_URL: process.env.KV_URL ? `${process.env.KV_URL.substring(0, 30)}...` : 'NÃO DEFINIDA',
  });

  // Coletar informações de debug
  const debugInfo = {
    environment: process.env.NODE_ENV,
    isDevelopment,
    timestamp: new Date().toISOString(),

    // Verificar variáveis de ambiente (sem expor valores sensíveis)
    envVars: {
      KV_REST_API_URL: process.env.KV_REST_API_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'DEFINIDA' : 'NÃO DEFINIDA',
      KV_URL: process.env.KV_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
      KV_REST_API_READ_ONLY_TOKEN: process.env.KV_REST_API_READ_ONLY_TOKEN ? 'DEFINIDA' : 'NÃO DEFINIDA',
    },
    
    // Verificar se as variáveis têm valores válidos
    validation: {
      hasKVConfig: !!(
        (process.env.KV_REST_API_URL || process.env.KV_URL) &&
        process.env.KV_REST_API_TOKEN
      ),
      kvUrlFormat: process.env.KV_REST_API_URL ? 
        (process.env.KV_REST_API_URL.startsWith('https://') ? 'VÁLIDO' : 'INVÁLIDO') : 
        'NÃO DEFINIDA',
      tokenLength: process.env.KV_REST_API_TOKEN ? 
        process.env.KV_REST_API_TOKEN.length : 0
    }
  };
  
  // Tentar importar e testar o KV
  let kvTestResult = null;
  try {
    console.log('🧪 Tentando importar @vercel/kv...');
    const { kv } = await import('@vercel/kv');
    console.log('✅ @vercel/kv importado com sucesso');

    // Teste básico de conexão
    const testKey = 'debug:test';
    const testValue = { test: true, timestamp: Date.now() };

    console.log('📝 Tentando escrever no KV...');
    await kv.set(testKey, testValue);
    console.log('✅ Escrita no KV bem-sucedida');

    console.log('📖 Tentando ler do KV...');
    const retrieved = await kv.get(testKey);
    console.log('✅ Leitura do KV bem-sucedida:', retrieved);

    console.log('🗑️ Tentando deletar do KV...');
    await kv.del(testKey);
    console.log('✅ Deleção do KV bem-sucedida');

    kvTestResult = {
      success: true,
      message: 'KV funcionando corretamente',
      testPassed: retrieved && retrieved.test === true,
      details: {
        writeSuccess: true,
        readSuccess: !!retrieved,
        deleteSuccess: true,
        dataIntegrity: retrieved && retrieved.test === true
      }
    };

  } catch (error) {
    console.error('❌ Erro no teste KV:', error);
    kvTestResult = {
      success: false,
      message: 'Erro ao testar KV',
      error: error.message,
      stack: error.stack,
      errorType: error.constructor.name
    };
  }
  
  // Verificar se estamos no Vercel
  const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
  
  const response = {
    ...debugInfo,
    isVercel,
    vercelEnv: process.env.VERCEL_ENV || 'local',
    kvTest: kvTestResult,
    
    // Recomendações baseadas no diagnóstico
    recommendations: []
  };
  
  // Adicionar recomendações
  if (!debugInfo.validation.hasKVConfig) {
    response.recommendations.push('Configurar variáveis KV_REST_API_URL e KV_REST_API_TOKEN no Vercel');
  }
  
  if (!isVercel && isDevelopment) {
    response.recommendations.push('Em desenvolvimento local, certifique-se de que o arquivo .env.local existe e contém as variáveis KV');
  }
  
  if (kvTestResult && !kvTestResult.success) {
    response.recommendations.push('Verificar se as credenciais KV estão corretas no painel do Vercel');
  }
  
  return res.status(200).json(response);
}
