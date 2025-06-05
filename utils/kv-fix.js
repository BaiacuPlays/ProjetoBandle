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
    // Em produção, sempre tentar usar KV
    if (process.env.NODE_ENV === 'production') {
      const { kv } = await import('@vercel/kv');

      // Testar conexão básica
      const testKey = `test:${Date.now()}`;
      await kv.set(testKey, { test: true }, { ex: 10 });
      await kv.del(testKey);

      console.log('✅ KV funcionando em produção');
      return {
        instance: kv,
        isWorking: true,
        error: null
      };
    }

    // Em desenvolvimento, verificar se as variáveis estão definidas
    const configCheck = checkKVConfiguration();
    if (!configCheck.isValid) {
      console.warn('⚠️ Variáveis KV não configuradas, usando fallback');
      return {
        instance: null,
        isWorking: false,
        error: 'Variáveis KV não configuradas'
      };
    }

    const { kv } = await import('@vercel/kv');

    // Testar conexão básica
    const testKey = `test:${Date.now()}`;
    await kv.set(testKey, { test: true }, { ex: 10 });
    await kv.del(testKey);

    return {
      instance: kv,
      isWorking: true,
      error: null
    };
  } catch (error) {
    console.warn('⚠️ KV não disponível, usando fallback:', error.message);
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

    if (!this.isWorking && this.isDevelopment) {
      console.warn('⚠️ KV não está funcionando, usando fallback em memória');
    }
  }

  async get(key) {
    await this.initialize();

    if (this.isWorking && this.kvInstance) {
      try {
        const result = await this.kvInstance.get(key);
        console.log(`🔍 SafeKV GET ${key}:`, result ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
        return result;
      } catch (error) {
        console.warn(`⚠️ Erro ao buscar ${key} no KV, usando fallback:`, error.message);
      }
    }

    // Fallback para armazenamento em memória
    const fallbackResult = this.fallbackStorage.get(key) || null;
    console.log(`🔄 SafeKV GET ${key} (fallback):`, fallbackResult ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
    return fallbackResult;
  }

  async set(key, value, options = {}) {
    await this.initialize();

    if (this.isWorking && this.kvInstance) {
      try {
        await this.kvInstance.set(key, value, options);
        console.log(`💾 SafeKV SET ${key}: SALVO NO KV`);
        // Também salvar no fallback para consistência
        this.fallbackStorage.set(key, value);
        return true;
      } catch (error) {
        console.warn(`⚠️ Erro ao salvar ${key} no KV, usando fallback:`, error.message);
      }
    }

    // Fallback para armazenamento em memória
    this.fallbackStorage.set(key, value);
    console.log(`🔄 SafeKV SET ${key}: SALVO NO FALLBACK`);
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
        if (this.isDevelopment) {
          console.warn(`⚠️ Erro ao deletar ${key} no KV, usando fallback:`, error.message);
        }
      }
    }

    // Fallback para armazenamento em memória
    this.fallbackStorage.delete(key);
    return true;
  }

  async keys(pattern) {
    await this.initialize();

    if (this.isWorking && this.kvInstance) {
      try {
        return await this.kvInstance.keys(pattern);
      } catch (error) {
        if (this.isDevelopment) {
          console.warn(`⚠️ Erro ao buscar chaves ${pattern} no KV, usando fallback:`, error.message);
        }
      }
    }

    // Fallback para armazenamento em memória
    const keys = Array.from(this.fallbackStorage.keys());
    if (pattern === '*') return keys;

    // Simular pattern matching básico
    const regex = new RegExp(pattern.replace('*', '.*'));
    return keys.filter(key => regex.test(key));
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
