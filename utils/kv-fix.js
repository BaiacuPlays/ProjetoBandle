// Utilitário para diagnosticar e corrigir problemas com Vercel KV

/**
 * Função para verificar se as variáveis de ambiente KV estão configuradas corretamente
 */
export function checkKVConfiguration() {
  const config = {
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_URL: process.env.KV_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    NODE_ENV: process.env.NODE_ENV
  };

  const issues = [];
  const recommendations = [];

  // Verificar se pelo menos uma URL está definida
  if (!config.KV_REST_API_URL && !config.KV_URL) {
    issues.push('Nenhuma URL do KV definida (KV_REST_API_URL ou KV_URL)');
    recommendations.push('Definir KV_REST_API_URL no Vercel ou no arquivo .env.local');
  }

  // Verificar se o token está definido
  if (!config.KV_REST_API_TOKEN) {
    issues.push('Token do KV não definido (KV_REST_API_TOKEN)');
    recommendations.push('Definir KV_REST_API_TOKEN no Vercel ou no arquivo .env.local');
  }

  // Verificar formato da URL
  const url = config.KV_REST_API_URL || config.KV_URL;
  if (url && !url.startsWith('https://')) {
    issues.push('URL do KV deve começar com https://');
    recommendations.push('Verificar se a URL está no formato correto');
  }

  // Verificar tamanho do token
  if (config.KV_REST_API_TOKEN && config.KV_REST_API_TOKEN.length < 20) {
    issues.push('Token do KV parece muito curto');
    recommendations.push('Verificar se o token está completo');
  }

  return {
    isValid: issues.length === 0,
    config: {
      ...config,
      // Mascarar valores sensíveis
      KV_REST_API_TOKEN: config.KV_REST_API_TOKEN ? 
        config.KV_REST_API_TOKEN.substring(0, 10) + '...' : null
    },
    issues,
    recommendations
  };
}

/**
 * Função para criar uma instância KV com fallback seguro
 */
export async function createSafeKVInstance() {
  try {
    const { kv } = await import('@vercel/kv');
    
    // Testar conexão básica
    const testKey = `test:${Date.now()}`;
    await kv.set(testKey, { test: true }, { ex: 10 }); // Expira em 10 segundos
    await kv.del(testKey);
    
    return {
      instance: kv,
      isWorking: true,
      error: null
    };
  } catch (error) {
    console.error('❌ Erro ao criar instância KV:', error);
    return {
      instance: null,
      isWorking: false,
      error: error.message
    };
  }
}

/**
 * Wrapper seguro para operações KV com fallback automático
 */
export class SafeKV {
  constructor() {
    this.kvInstance = null;
    this.isInitialized = false;
    this.fallbackStorage = new Map();
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  async initialize() {
    if (this.isInitialized) return;

    const kvResult = await createSafeKVInstance();
    this.kvInstance = kvResult.instance;
    this.isWorking = kvResult.isWorking;
    this.isInitialized = true;

    if (!this.isWorking) {
      console.warn('⚠️ KV não está funcionando, usando fallback em memória');
    }
  }

  async get(key) {
    await this.initialize();

    if (this.isWorking && this.kvInstance) {
      try {
        return await this.kvInstance.get(key);
      } catch (error) {
        console.warn(`⚠️ Erro ao buscar ${key} no KV, usando fallback:`, error.message);
      }
    }

    // Fallback para armazenamento em memória
    return this.fallbackStorage.get(key) || null;
  }

  async set(key, value, options = {}) {
    await this.initialize();

    if (this.isWorking && this.kvInstance) {
      try {
        await this.kvInstance.set(key, value, options);
        // Também salvar no fallback para consistência
        this.fallbackStorage.set(key, value);
        return true;
      } catch (error) {
        console.warn(`⚠️ Erro ao salvar ${key} no KV, usando fallback:`, error.message);
      }
    }

    // Fallback para armazenamento em memória
    this.fallbackStorage.set(key, value);
    return true;
  }

  async del(key) {
    await this.initialize();

    if (this.isWorking && this.kvInstance) {
      try {
        await this.kvInstance.del(key);
        this.fallbackStorage.delete(key);
        return true;
      } catch (error) {
        console.warn(`⚠️ Erro ao deletar ${key} no KV, usando fallback:`, error.message);
      }
    }

    // Fallback para armazenamento em memória
    this.fallbackStorage.delete(key);
    return true;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isWorking: this.isWorking,
      fallbackSize: this.fallbackStorage.size,
      isDevelopment: this.isDevelopment
    };
  }
}

// Instância global do SafeKV
export const safeKV = new SafeKV();

/**
 * Função para gerar relatório de diagnóstico completo
 */
export async function generateKVDiagnosticReport() {
  const configCheck = checkKVConfiguration();
  const kvTest = await createSafeKVInstance();
  
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    configuration: configCheck,
    connectionTest: kvTest,
    recommendations: [
      ...configCheck.recommendations,
      ...(kvTest.isWorking ? [] : [
        'Verificar se o projeto Vercel tem KV habilitado',
        'Verificar se as variáveis de ambiente estão definidas no Vercel',
        'Tentar redeployar o projeto no Vercel'
      ])
    ]
  };
}

export default safeKV;
