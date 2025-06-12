// Configuração centralizada de polling para reduzir Function Invocations
// Todos os intervalos foram otimizados para reduzir drasticamente o uso de recursos

export const POLLING_INTERVALS = {
  // Dados críticos que precisam de atualização mais frequente
  MULTIPLAYER_GAME: 15 * 1000, // 15 segundos (durante o jogo)
  MULTIPLAYER_LOBBY: 30 * 1000, // 30 segundos (no lobby)
  
  // Dados importantes mas não críticos
  FRIENDS_REQUESTS: 5 * 60 * 1000, // 5 minutos
  NOTIFICATIONS: 10 * 60 * 1000, // 10 minutos
  USER_STATISTICS: 5 * 60 * 1000, // 5 minutos
  
  // Dados que mudam raramente
  GLOBAL_STATS: 30 * 60 * 1000, // 30 minutos
  DAILY_SONG: 60 * 60 * 1000, // 1 hora
  PROFILE_DATA: 10 * 60 * 1000, // 10 minutos
  
  // Verificações de sistema
  MARATHON_ACHIEVEMENT: 30 * 60 * 1000, // 30 minutos
  CACHE_CLEANUP: 60 * 60 * 1000, // 1 hora
  
  // Polling condicional (apenas quando necessário)
  FOCUS_CHECK: 0, // Apenas quando a janela ganha foco
  USER_INTERACTION: 0, // Apenas quando o usuário interage
};

// Configurações de cache para reduzir chamadas de API
export const CACHE_CONFIG = {
  // TTL (Time To Live) para diferentes tipos de dados
  GLOBAL_STATS: 30 * 60 * 1000, // 30 minutos
  USER_PROFILE: 10 * 60 * 1000, // 10 minutos
  USER_STATISTICS: 5 * 60 * 1000, // 5 minutos
  FRIENDS_DATA: 5 * 60 * 1000, // 5 minutos
  DAILY_SONG: 60 * 60 * 1000, // 1 hora
  MULTIPLAYER_DATA: 30 * 1000, // 30 segundos
  
  // Configurações de limpeza de cache
  MAX_ENTRIES: 100, // Máximo de entradas no cache
  CLEANUP_INTERVAL: 60 * 60 * 1000, // Limpeza a cada 1 hora
};

// Configurações de debouncing para operações de escrita
export const DEBOUNCE_CONFIG = {
  PROFILE_SAVE: 2 * 1000, // 2 segundos
  STATISTICS_SAVE: 1 * 1000, // 1 segundo
  SETTINGS_SAVE: 3 * 1000, // 3 segundos
  FRIENDS_UPDATE: 1 * 1000, // 1 segundo
  
  // Flush automático para garantir que dados não sejam perdidos
  AUTO_FLUSH_INTERVAL: 30 * 1000, // 30 segundos
};

// Configurações de retry para operações que falharam
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 segundo
  BACKOFF_MULTIPLIER: 2, // Dobrar o delay a cada tentativa
  MAX_DELAY: 10 * 1000, // Máximo 10 segundos
};

// Configurações específicas para diferentes ambientes
export const ENVIRONMENT_CONFIG = {
  development: {
    // Em desenvolvimento, usar intervalos menores para debug
    multiplier: 0.5, // Reduzir intervalos pela metade
    enableLogs: true,
    enableCache: true,
  },
  production: {
    // Em produção, usar intervalos otimizados
    multiplier: 1.0,
    enableLogs: false,
    enableCache: true,
  },
  test: {
    // Em testes, usar intervalos muito pequenos
    multiplier: 0.1,
    enableLogs: false,
    enableCache: false,
  }
};

// Função para obter intervalo ajustado pelo ambiente
export function getPollingInterval(key, environment = 'production') {
  const baseInterval = POLLING_INTERVALS[key] || 60000; // 1 minuto padrão
  const config = ENVIRONMENT_CONFIG[environment] || ENVIRONMENT_CONFIG.production;
  
  return Math.max(baseInterval * config.multiplier, 1000); // Mínimo 1 segundo
}

// Função para obter TTL de cache ajustado pelo ambiente
export function getCacheTTL(key, environment = 'production') {
  const baseTTL = CACHE_CONFIG[key] || 300000; // 5 minutos padrão
  const config = ENVIRONMENT_CONFIG[environment] || ENVIRONMENT_CONFIG.production;
  
  return Math.max(baseTTL * config.multiplier, 1000); // Mínimo 1 segundo
}

// Função para obter delay de debounce ajustado pelo ambiente
export function getDebounceDelay(key, environment = 'production') {
  const baseDelay = DEBOUNCE_CONFIG[key] || 1000; // 1 segundo padrão
  const config = ENVIRONMENT_CONFIG[environment] || ENVIRONMENT_CONFIG.production;
  
  return Math.max(baseDelay * config.multiplier, 100); // Mínimo 100ms
}

// Função para verificar se logs estão habilitados
export function isLoggingEnabled(environment = 'production') {
  const config = ENVIRONMENT_CONFIG[environment] || ENVIRONMENT_CONFIG.production;
  return config.enableLogs;
}

// Função para verificar se cache está habilitado
export function isCacheEnabled(environment = 'production') {
  const config = ENVIRONMENT_CONFIG[environment] || ENVIRONMENT_CONFIG.production;
  return config.enableCache;
}

// Estatísticas de uso para monitoramento
export class PollingStats {
  constructor() {
    this.stats = new Map();
    this.startTime = Date.now();
  }

  // Registrar uma chamada de polling
  recordPoll(key) {
    if (!this.stats.has(key)) {
      this.stats.set(key, { count: 0, lastCall: null });
    }
    
    const stat = this.stats.get(key);
    stat.count++;
    stat.lastCall = Date.now();
  }

  // Obter estatísticas
  getStats() {
    const result = {};
    const now = Date.now();
    const uptime = now - this.startTime;
    
    for (const [key, stat] of this.stats.entries()) {
      result[key] = {
        totalCalls: stat.count,
        callsPerMinute: (stat.count / (uptime / 60000)).toFixed(2),
        lastCall: stat.lastCall ? new Date(stat.lastCall).toISOString() : null,
        timeSinceLastCall: stat.lastCall ? now - stat.lastCall : null
      };
    }
    
    return {
      uptime: uptime,
      totalCalls: Array.from(this.stats.values()).reduce((sum, stat) => sum + stat.count, 0),
      breakdown: result
    };
  }

  // Resetar estatísticas
  reset() {
    this.stats.clear();
    this.startTime = Date.now();
  }
}

// Instância global de estatísticas
export const pollingStats = new PollingStats();

export default {
  POLLING_INTERVALS,
  CACHE_CONFIG,
  DEBOUNCE_CONFIG,
  RETRY_CONFIG,
  ENVIRONMENT_CONFIG,
  getPollingInterval,
  getCacheTTL,
  getDebounceDelay,
  isLoggingEnabled,
  isCacheEnabled,
  pollingStats
};
