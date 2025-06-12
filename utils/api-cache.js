// Sistema de cache para APIs - Reduz drasticamente as chamadas de função
class APICache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  // Configurações de cache por endpoint
  getCacheConfig(endpoint) {
    const configs = {
      '/api/global-stats': { ttl: 30 * 60 * 1000 }, // 30 minutos
      '/api/statistics': { ttl: 5 * 60 * 1000 }, // 5 minutos
      '/api/profile': { ttl: 10 * 60 * 1000 }, // 10 minutos
      '/api/friends': { ttl: 5 * 60 * 1000 }, // 5 minutos
      '/api/multiplayer': { ttl: 30 * 1000 }, // 30 segundos
      '/api/admin/daily-song': { ttl: 60 * 60 * 1000 }, // 1 hora
      default: { ttl: 2 * 60 * 1000 } // 2 minutos padrão
    };

    for (const [pattern, config] of Object.entries(configs)) {
      if (endpoint.includes(pattern)) {
        return config;
      }
    }
    return configs.default;
  }

  // Gerar chave de cache
  generateKey(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body || '';
    return `${method}:${url}:${body}`;
  }

  // Verificar se cache é válido
  isValid(key) {
    if (!this.cache.has(key)) return false;
    
    const timestamp = this.timestamps.get(key);
    const config = this.getCacheConfig(key);
    
    return Date.now() - timestamp < config.ttl;
  }

  // Buscar do cache
  get(key) {
    if (this.isValid(key)) {
      return this.cache.get(key);
    }
    return null;
  }

  // Salvar no cache
  set(key, data) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
    
    // Limpar cache antigo (máximo 100 entradas)
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.timestamps.delete(oldestKey);
    }
  }

  // Limpar cache específico
  clear(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }
  }

  // Limpar todo o cache
  clearAll() {
    this.cache.clear();
    this.timestamps.clear();
  }
}

// Instância global do cache
const apiCache = new APICache();

// Função wrapper para fetch com cache
export async function cachedFetch(url, options = {}) {
  const key = apiCache.generateKey(url, options);
  
  // Tentar buscar do cache primeiro
  const cached = apiCache.get(key);
  if (cached) {
    console.log(`📦 Cache HIT: ${url}`);
    return {
      ok: true,
      json: async () => cached,
      status: 200
    };
  }

  console.log(`🌐 Cache MISS: ${url}`);
  
  try {
    // Fazer requisição real
    const response = await fetch(url, options);
    
    if (response.ok) {
      const data = await response.json();
      
      // Salvar no cache apenas se for GET e sucesso
      if (!options.method || options.method === 'GET') {
        apiCache.set(key, data);
      }
      
      return {
        ok: true,
        json: async () => data,
        status: response.status
      };
    }
    
    return response;
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
}

// Função para invalidar cache quando dados mudam
export function invalidateCache(pattern) {
  apiCache.clear(pattern);
}

// Função para limpar cache periodicamente
export function setupCacheCleanup() {
  // Limpar cache a cada 1 hora
  setInterval(() => {
    console.log('🧹 Limpando cache antigo...');
    apiCache.clearAll();
  }, 60 * 60 * 1000);
}

export default apiCache;
