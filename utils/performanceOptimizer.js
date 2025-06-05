// Sistema de otimização de performance ultra-agressivo
// Remove TODOS os overheads desnecessários em produção

class PerformanceOptimizer {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production' || 
                       typeof window !== 'undefined' && 
                       (window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1');
    
    this.optimizations = {
      disableConsole: true,
      reducePolling: true,
      disableDebugFeatures: true,
      optimizeTimers: true,
      enableMemoryCleanup: true
    };
    
    this.init();
  }
  
  init() {
    if (this.isProduction) {
      // Temporariamente desabilitado para debug
      // this.disableConsoleInProduction();
      this.optimizeGlobalPerformance();
      this.setupMemoryCleanup();
    }
  }
  
  // Desabilitar COMPLETAMENTE console em produção
  disableConsoleInProduction() {
    if (typeof window !== 'undefined') {
      // Salvar referências originais para debug se necessário
      window._originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug
      };

      // Substituir por funções vazias
      console.log = () => {};
      console.warn = () => {};
      console.info = () => {};
      console.debug = () => {};

      // Manter apenas errors críticos mas limitados
      let errorCount = 0;
      const maxErrors = 5; // Reduzido para 5

      console.error = (...args) => {
        if (errorCount < maxErrors) {
          // Filtrar erros conhecidos e não críticos (LISTA EXPANDIDA)
          const errorMessage = args.join(' ').toLowerCase();
          const isKnownError = [
            'network error',
            'fetch failed',
            'audio',
            'cors',
            'loading',
            'conquista',
            'achievement',
            'estatística',
            'timer',
            'sessão',
            'derrotas',
            'dias consecutivos',
            'maratonista',
            'comeback',
            'salas criadas',
            'multiplayer',
            'perfil',
            'profile',
            'stats',
            'game',
            'música',
            'song'
          ].some(keyword => errorMessage.includes(keyword));

          // Filtrar apenas erros REALMENTE críticos
          const isCriticalError = [
            'uncaught',
            'unhandled',
            'fatal',
            'security',
            'critical'
          ].some(keyword => errorMessage.includes(keyword));

          // Mostrar apenas se for crítico E não for conhecido
          if (isCriticalError && !isKnownError) {
            window._originalConsole.error('🚨 ERRO CRÍTICO:', ...args);
            errorCount++;
          }
        }
      };

      // Função para restaurar console em caso de debug necessário
      window.restoreConsole = () => {
        Object.assign(console, window._originalConsole);
        window._originalConsole.log('🔧 Console restaurado para debug');
      };
    }
  }
  
  // Otimizações globais de performance
  optimizeGlobalPerformance() {
    if (typeof window !== 'undefined') {
      // Desabilitar animações desnecessárias em dispositivos lentos
      if (this.isSlowDevice()) {
        document.documentElement.style.setProperty('--animation-duration', '0.1s');
        document.documentElement.style.setProperty('--transition-duration', '0.1s');
      }
      
      // Otimizar scroll performance
      document.documentElement.style.setProperty('scroll-behavior', 'auto');
      
      // Reduzir qualidade de imagens em dispositivos lentos
      if (this.isSlowDevice()) {
        this.optimizeImages();
      }
    }
  }
  
  // Detectar dispositivos lentos
  isSlowDevice() {
    if (typeof navigator === 'undefined') return false;
    
    // Verificar hardware
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const deviceMemory = navigator.deviceMemory || 1;
    
    // Dispositivo lento se tem poucos cores ou pouca memória
    return hardwareConcurrency <= 2 || deviceMemory <= 2;
  }
  
  // Otimizar imagens para dispositivos lentos
  optimizeImages() {
    if (typeof document === 'undefined') return;
    
    // Reduzir qualidade de imagens
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && !img.dataset.optimized) {
        img.style.imageRendering = 'pixelated';
        img.dataset.optimized = 'true';
      }
    });
  }
  
  // Sistema de limpeza de memória
  setupMemoryCleanup() {
    if (typeof window === 'undefined') return;
    
    // Limpeza a cada 5 minutos
    setInterval(() => {
      this.cleanupMemory();
    }, 300000);
    
    // Limpeza quando a página perde foco
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.cleanupMemory();
      }
    });
  }
  
  // Limpeza agressiva de memória
  cleanupMemory() {
    if (typeof window === 'undefined') return;
    
    try {
      // Forçar garbage collection se disponível
      if (window.gc) {
        window.gc();
      }
      
      // Limpar caches desnecessários
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('old') || name.includes('temp')) {
              caches.delete(name);
            }
          });
        });
      }
      
      // Limpar localStorage antigo
      this.cleanupLocalStorage();
      
    } catch (error) {
      // Silencioso em produção
    }
  }
  
  // Limpeza de localStorage
  cleanupLocalStorage() {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Remover chaves antigas ou temporárias
        if (key && (
          key.includes('temp_') ||
          key.includes('cache_') ||
          key.includes('debug_')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
    } catch (error) {
      // Silencioso
    }
  }
  
  // Otimizar intervalos de polling
  optimizePollingIntervals() {
    return {
      notifications: this.isProduction ? 60000 : 30000, // 60s em produção
      friends: this.isProduction ? 120000 : 60000,      // 120s em produção
      multiplayer: this.isProduction ? 15000 : 10000,   // 15s em produção
      presence: this.isProduction ? 180000 : 120000     // 180s em produção
    };
  }
  
  // Verificar se deve executar operação custosa
  shouldExecuteExpensiveOperation() {
    if (!this.isProduction) return true;
    
    // Em produção, verificar se o dispositivo não está sobrecarregado
    if (typeof performance !== 'undefined' && performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
      return memoryUsage < 0.8; // Só executar se uso de memória < 80%
    }
    
    return true;
  }
  
  // Debounce otimizado para produção
  createOptimizedDebounce(func, delay) {
    let timeoutId;
    const optimizedDelay = this.isProduction ? Math.max(delay, 100) : delay;
    
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (this.shouldExecuteExpensiveOperation()) {
          func.apply(null, args);
        }
      }, optimizedDelay);
    };
  }
  
  // Throttle otimizado para produção
  createOptimizedThrottle(func, delay) {
    let lastCall = 0;
    const optimizedDelay = this.isProduction ? Math.max(delay, 200) : delay;
    
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= optimizedDelay && this.shouldExecuteExpensiveOperation()) {
        lastCall = now;
        func.apply(null, args);
      }
    };
  }
  
  // Obter configurações otimizadas
  getOptimizedConfig() {
    return {
      polling: this.optimizePollingIntervals(),
      animations: {
        duration: this.isSlowDevice() ? 100 : 300,
        enabled: !this.isSlowDevice()
      },
      logging: {
        enabled: !this.isProduction,
        maxLogsPerMinute: this.isProduction ? 0 : 50
      },
      memory: {
        cleanupInterval: 300000, // 5 minutos
        maxCacheSize: this.isSlowDevice() ? 5 : 10
      }
    };
  }
}

// Instância global
const performanceOptimizer = new PerformanceOptimizer();

export default performanceOptimizer;

// Exports para uso direto
export const optimizedDebounce = (func, delay) => 
  performanceOptimizer.createOptimizedDebounce(func, delay);

export const optimizedThrottle = (func, delay) => 
  performanceOptimizer.createOptimizedThrottle(func, delay);

export const getOptimizedConfig = () => 
  performanceOptimizer.getOptimizedConfig();

export const shouldExecuteExpensiveOperation = () => 
  performanceOptimizer.shouldExecuteExpensiveOperation();
