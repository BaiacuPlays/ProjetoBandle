// Configuração centralizada do Vercel KV com sistema robusto de fallback
import { kv } from '@vercel/kv';

// Verificar se estamos em ambiente de desenvolvimento
export const isDevelopment = process.env.NODE_ENV === 'development';

// Verificar se as variáveis KV estão configuradas (aceitar KV_URL ou KV_REST_API_URL)
export const hasKVConfig = !!(
  (process.env.KV_REST_API_URL || process.env.KV_URL) &&
  process.env.KV_REST_API_TOKEN
);

// Sistema de rate limiting para evitar spam de requisições
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.maxRequests = 10; // máximo de 10 requisições
    this.windowMs = 60000; // por minuto
  }

  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requests = this.requests.get(key);

    // Remover requisições antigas
    const validRequests = requests.filter(time => time > windowStart);
    this.requests.set(key, validRequests);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

const rateLimiter = new RateLimiter();

// Cache local para reduzir chamadas ao KV
class LocalCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100;
    this.ttl = 5 * 60 * 1000; // 5 minutos
  }

  set(key, value) {
    // Limpar cache se estiver muito grande
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Verificar se expirou
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

const localCache = new LocalCache();

// Em produção, sempre usar KV (já sabemos que funciona)
const shouldUseKV = !isDevelopment || hasKVConfig;

// Log de debug apenas uma vez para evitar spam
let hasLoggedConfig = false;
if (!hasLoggedConfig && !isDevelopment) {
  console.log('🔍 KV Config Check:', {
    KV_REST_API_URL: process.env.KV_REST_API_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
    KV_URL: process.env.KV_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'DEFINIDA' : 'NÃO DEFINIDA',
    hasKVConfig,
    shouldUseKV
  });
  hasLoggedConfig = true;
}

// Função para retry com backoff exponencial
async function retryWithBackoff(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Backoff exponencial: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Função wrapper para operações KV com fallback robusto
export const kvGet = async (key, fallbackStorage = null) => {
  // Verificar rate limiting
  if (!rateLimiter.isAllowed(`get:${key}`)) {
    console.warn(`⚠️ Rate limit atingido para chave: ${key}`);
    return fallbackStorage ? fallbackStorage.get(key) : null;
  }

  // Verificar cache local primeiro
  const cached = localCache.get(key);
  if (cached !== null) {
    return cached;
  }

  if (!shouldUseKV) {
    return fallbackStorage ? fallbackStorage.get(key) : null;
  }

  try {
    // Usar retry com backoff exponencial
    const result = await retryWithBackoff(async () => {
      return await kv.get(key);
    });

    // Salvar no cache local
    if (result !== null) {
      localCache.set(key, result);
    }

    // Se encontrou dados no KV, salvar no fallback para persistência local
    if (result && fallbackStorage) {
      fallbackStorage.set(key, result);
    }

    return result;
  } catch (error) {
    // Log apenas em desenvolvimento para evitar spam
    if (isDevelopment) {
      console.warn(`⚠️ Erro ao buscar chave ${key} no KV (usando fallback):`, error.message);
    }
    // Sempre usar fallback em caso de erro para evitar quebrar a aplicação
    return fallbackStorage ? fallbackStorage.get(key) : null;
  }
};

export const kvSet = async (key, value, options = {}, fallbackStorage = null) => {
  // Verificar rate limiting
  if (!rateLimiter.isAllowed(`set:${key}`)) {
    console.warn(`⚠️ Rate limit atingido para chave: ${key}`);
    if (fallbackStorage) {
      fallbackStorage.set(key, value);
    }
    return true;
  }

  // Atualizar cache local
  localCache.set(key, value);

  if (!shouldUseKV) {
    if (fallbackStorage) {
      fallbackStorage.set(key, value);
    }
    return true;
  }

  try {
    // Usar retry com backoff exponencial
    await retryWithBackoff(async () => {
      return await kv.set(key, value, options);
    });

    // Salvar no fallback também para redundância
    if (fallbackStorage) {
      fallbackStorage.set(key, value);
    }

    return true;
  } catch (error) {
    // Log apenas em desenvolvimento para evitar spam
    if (isDevelopment) {
      console.warn(`⚠️ Erro ao salvar chave ${key} no KV (usando fallback):`, error.message);
    }
    // Sempre usar fallback em caso de erro para evitar quebrar a aplicação
    if (fallbackStorage) {
      fallbackStorage.set(key, value);
      return true;
    }
    return false;
  }
};

export const kvDel = async (key, options = {}, fallbackStorage = null) => {
  // Verificar rate limiting
  if (!rateLimiter.isAllowed(`del:${key}`)) {
    console.warn(`⚠️ Rate limit atingido para chave: ${key}`);
    if (fallbackStorage) {
      fallbackStorage.delete(key);
    }
    return true;
  }

  // Remover do cache local
  localCache.cache.delete(key);

  if (!shouldUseKV) {
    if (fallbackStorage) {
      fallbackStorage.delete(key);
    }
    return true;
  }

  try {
    // Usar retry com backoff exponencial
    await retryWithBackoff(async () => {
      return await kv.del(key);
    });

    // Remover do fallback também
    if (fallbackStorage) {
      fallbackStorage.delete(key);
    }

    return true;
  } catch (error) {
    // Log apenas em desenvolvimento para evitar spam
    if (isDevelopment) {
      console.warn(`⚠️ Erro ao deletar chave ${key} no KV:`, error.message);
    }
    // Sempre usar fallback em caso de erro para evitar quebrar a aplicação
    if (fallbackStorage) {
      fallbackStorage.delete(key);
      return true;
    }
    return false;
  }
};

// Funções utilitárias para gerenciar o sistema
export const clearLocalCache = () => {
  localCache.clear();
};

export const getKVStatus = () => {
  return {
    isDevelopment,
    hasKVConfig,
    shouldUseKV,
    cacheSize: localCache.cache.size,
    rateLimiterSize: rateLimiter.requests.size
  };
};

// Função para testar conectividade KV
export const testKVConnection = async () => {
  if (!shouldUseKV) {
    return { success: false, error: 'KV não configurado' };
  }

  try {
    const testKey = `test:${Date.now()}`;
    const testValue = { test: true, timestamp: Date.now() };

    await kv.set(testKey, testValue, { ex: 10 });
    const retrieved = await kv.get(testKey);
    await kv.del(testKey);

    return {
      success: true,
      message: 'KV funcionando corretamente',
      testValue: retrieved
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Exportar instância do KV para uso direto quando necessário
export { kv };
