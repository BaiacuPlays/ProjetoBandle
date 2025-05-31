import { useEffect, useCallback, useRef } from 'react';

// Hook para otimização de performance
export const usePerformanceOptimization = () => {
  const debounceTimers = useRef(new Map());
  const throttleTimers = useRef(new Map());

  // Função de debounce otimizada
  const debounce = useCallback((func, delay, key = 'default') => {
    return (...args) => {
      const timer = debounceTimers.current.get(key);
      if (timer) {
        clearTimeout(timer);
      }
      
      const newTimer = setTimeout(() => {
        func.apply(this, args);
        debounceTimers.current.delete(key);
      }, delay);
      
      debounceTimers.current.set(key, newTimer);
    };
  }, []);

  // Função de throttle otimizada
  const throttle = useCallback((func, delay, key = 'default') => {
    return (...args) => {
      if (!throttleTimers.current.has(key)) {
        func.apply(this, args);
        throttleTimers.current.set(key, true);
        
        setTimeout(() => {
          throttleTimers.current.delete(key);
        }, delay);
      }
    };
  }, []);

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      debounceTimers.current.clear();
      throttleTimers.current.clear();
    };
  }, []);

  // Função para otimizar re-renders
  const optimizeRender = useCallback((dependencies, callback) => {
    const depsString = JSON.stringify(dependencies);
    return debounce(callback, 16, `render_${depsString}`); // 16ms = ~60fps
  }, [debounce]);

  // Função para otimizar eventos de áudio
  const optimizeAudioEvent = useCallback((callback) => {
    return throttle(callback, 100, 'audio_event'); // Max 10 eventos por segundo
  }, [throttle]);

  // Função para otimizar atualizações de progresso
  const optimizeProgressUpdate = useCallback((callback) => {
    return throttle(callback, 50, 'progress_update'); // Max 20 atualizações por segundo
  }, [throttle]);

  return {
    debounce,
    throttle,
    optimizeRender,
    optimizeAudioEvent,
    optimizeProgressUpdate
  };
};

// Hook para monitoramento de performance
export const usePerformanceMonitor = () => {
  const performanceData = useRef({
    audioLoadTimes: [],
    renderTimes: [],
    errorCounts: {}
  });

  const recordAudioLoadTime = useCallback((startTime, endTime, url) => {
    const loadTime = endTime - startTime;
    performanceData.current.audioLoadTimes.push({
      url,
      loadTime,
      timestamp: Date.now()
    });

    // Manter apenas os últimos 50 registros
    if (performanceData.current.audioLoadTimes.length > 50) {
      performanceData.current.audioLoadTimes.shift();
    }
  }, []);

  const recordError = useCallback((errorType, details) => {
    if (!performanceData.current.errorCounts[errorType]) {
      performanceData.current.errorCounts[errorType] = 0;
    }
    performanceData.current.errorCounts[errorType]++;
    
    console.warn(`Performance Error [${errorType}]:`, details);
  }, []);

  const getPerformanceStats = useCallback(() => {
    const audioTimes = performanceData.current.audioLoadTimes;
    const avgLoadTime = audioTimes.length > 0 
      ? audioTimes.reduce((sum, item) => sum + item.loadTime, 0) / audioTimes.length 
      : 0;

    return {
      averageAudioLoadTime: avgLoadTime,
      totalErrors: Object.values(performanceData.current.errorCounts).reduce((sum, count) => sum + count, 0),
      errorBreakdown: { ...performanceData.current.errorCounts },
      recentAudioLoads: audioTimes.slice(-10)
    };
  }, []);

  return {
    recordAudioLoadTime,
    recordError,
    getPerformanceStats
  };
};

// Hook para otimização de memória
export const useMemoryOptimization = () => {
  const cleanup = useCallback(() => {
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
  }, []);

  const optimizeMemoryUsage = useCallback(() => {
    // Executar limpeza a cada 5 minutos
    const interval = setInterval(cleanup, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [cleanup]);

  useEffect(() => {
    const cleanupInterval = optimizeMemoryUsage();
    return cleanupInterval;
  }, [optimizeMemoryUsage]);

  return {
    cleanup,
    optimizeMemoryUsage
  };
};
