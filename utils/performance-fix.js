// Sistema de correção de performance para evitar travamento do site
// Este arquivo deve ser importado no início da aplicação

class PerformanceFix {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production' || 
                       typeof window !== 'undefined' && 
                       (window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1');
    
    this.init();
  }

  init() {
    // Aplicar correções imediatamente
    this.disableConsoleInProduction();
    this.optimizeTimers();
    this.preventMemoryLeaks();
    this.optimizeEventListeners();
  }

  // Desabilitar completamente console em produção
  disableConsoleInProduction() {
    if (!this.isProduction) return;

    if (typeof window !== 'undefined') {
      // Salvar console original para debug se necessário
      window._originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug,
        trace: console.trace,
        time: console.time,
        timeEnd: console.timeEnd
      };

      // Função vazia ultra-otimizada
      const noop = () => {};

      // Substituir TODOS os métodos de console
      console.log = noop;
      console.warn = noop;
      console.error = noop;
      console.info = noop;
      console.debug = noop;
      console.trace = noop;
      console.time = noop;
      console.timeEnd = noop;
      console.group = noop;
      console.groupEnd = noop;
      console.table = noop;
      console.count = noop;
      console.countReset = noop;
      console.clear = noop;
      console.dir = noop;
      console.dirxml = noop;
      console.assert = noop;

      // Função para restaurar console se necessário
      window.restoreConsole = () => {
        Object.assign(console, window._originalConsole);
        console.log('🔧 Console restaurado para debug');
      };
    }
  }

  // Otimizar timers para reduzir overhead
  optimizeTimers() {
    if (typeof window !== 'undefined') {
      // Salvar funções originais
      const originalSetInterval = window.setInterval;
      const originalSetTimeout = window.setTimeout;

      // Lista de intervalos ativos para limpeza
      this.activeIntervals = new Set();
      this.activeTimeouts = new Set();

      // Wrapper otimizado para setInterval
      window.setInterval = (callback, delay, ...args) => {
        // Aumentar delay mínimo em produção para reduzir overhead
        const optimizedDelay = this.isProduction ? Math.max(delay, 1000) : delay;
        
        const intervalId = originalSetInterval.call(window, callback, optimizedDelay, ...args);
        this.activeIntervals.add(intervalId);
        
        return intervalId;
      };

      // Wrapper otimizado para setTimeout
      window.setTimeout = (callback, delay, ...args) => {
        const timeoutId = originalSetTimeout.call(window, callback, delay, ...args);
        this.activeTimeouts.add(timeoutId);
        
        return timeoutId;
      };

      // Wrapper para clearInterval
      const originalClearInterval = window.clearInterval;
      window.clearInterval = (intervalId) => {
        this.activeIntervals.delete(intervalId);
        return originalClearInterval.call(window, intervalId);
      };

      // Wrapper para clearTimeout
      const originalClearTimeout = window.clearTimeout;
      window.clearTimeout = (timeoutId) => {
        this.activeTimeouts.delete(timeoutId);
        return originalClearTimeout.call(window, timeoutId);
      };
    }
  }

  // Prevenir vazamentos de memória
  preventMemoryLeaks() {
    if (typeof window !== 'undefined') {
      // Limpar timers quando a página for descarregada
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });

      // Limpar timers quando a aba perder foco (opcional)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.isProduction) {
          // Pausar timers não críticos quando a aba não está visível
          this.pauseNonCriticalTimers();
        }
      });
    }
  }

  // Otimizar event listeners
  optimizeEventListeners() {
    if (typeof window !== 'undefined') {
      // Throttle para eventos de scroll e resize
      let scrollTimeout;
      let resizeTimeout;

      const originalAddEventListener = window.addEventListener;
      
      window.addEventListener = (event, handler, options) => {
        if (event === 'scroll' && this.isProduction) {
          // Throttle scroll events
          const throttledHandler = (...args) => {
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => {
              handler(...args);
              scrollTimeout = null;
            }, 100);
          };
          return originalAddEventListener.call(window, event, throttledHandler, options);
        }
        
        if (event === 'resize' && this.isProduction) {
          // Throttle resize events
          const throttledHandler = (...args) => {
            if (resizeTimeout) return;
            resizeTimeout = setTimeout(() => {
              handler(...args);
              resizeTimeout = null;
            }, 250);
          };
          return originalAddEventListener.call(window, event, throttledHandler, options);
        }
        
        return originalAddEventListener.call(window, event, handler, options);
      };
    }
  }

  // Pausar timers não críticos
  pauseNonCriticalTimers() {
    // Esta função pode ser expandida para pausar timers específicos
    // quando a aba não está visível
  }

  // Limpeza geral
  cleanup() {
    // Limpar todos os intervalos ativos
    if (this.activeIntervals) {
      this.activeIntervals.forEach(intervalId => {
        clearInterval(intervalId);
      });
      this.activeIntervals.clear();
    }

    // Limpar todos os timeouts ativos
    if (this.activeTimeouts) {
      this.activeTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      this.activeTimeouts.clear();
    }
  }

  // Método para verificar performance
  getPerformanceInfo() {
    return {
      isProduction: this.isProduction,
      activeIntervals: this.activeIntervals ? this.activeIntervals.size : 0,
      activeTimeouts: this.activeTimeouts ? this.activeTimeouts.size : 0,
      memoryUsage: typeof performance !== 'undefined' && performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null
    };
  }
}

// Criar instância global
const performanceFix = new PerformanceFix();

// Exportar para uso em outros módulos
export default performanceFix;

// Função para aplicar correções manualmente
export const applyPerformanceFixes = () => {
  return performanceFix;
};

// Função para obter informações de performance
export const getPerformanceInfo = () => {
  return performanceFix.getPerformanceInfo();
};

// Função para restaurar console (debug)
export const restoreConsole = () => {
  if (typeof window !== 'undefined' && window.restoreConsole) {
    window.restoreConsole();
  }
};

// Função para limpeza manual
export const cleanup = () => {
  performanceFix.cleanup();
};

// Auto-aplicar em produção
if (typeof window !== 'undefined') {
  // Aplicar correções assim que o script for carregado
  console.log('🚀 Performance fixes aplicadas');
}
