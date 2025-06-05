import { useEffect, useState } from 'react';

export const useServiceWorker = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Service Worker DESABILITADO temporariamente para correção de bugs
    console.log('Service Worker desabilitado para correção');
    setIsSupported(false);
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      setRegistration(reg);
      setIsRegistered(true);

      console.log('Service Worker registrado:', reg);

      // Verificar atualizações
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });

      // Escutar mensagens do Service Worker
      navigator.serviceWorker.addEventListener('message', handleMessage);

    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
    }
  };

  const handleMessage = (event) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'CACHE_SIZE':
        console.log('Tamanho do cache:', data.size, 'entradas');
        break;
      
      case 'CACHE_CLEARED':
        console.log('Cache limpo com sucesso');
        break;
    }
  };

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const getCacheSize = async () => {
    if (!registration || !registration.active) return 0;
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_SIZE') {
          resolve(event.data.size);
        }
      };
      
      registration.active.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );
    });
  };

  const clearCache = async () => {
    if (!registration || !registration.active) return;
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          resolve();
        }
      };
      
      registration.active.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  };

  return {
    isSupported,
    isRegistered,
    updateAvailable,
    updateServiceWorker,
    getCacheSize,
    clearCache
  };
};

// Hook para cache de recursos
export const useResourceCache = () => {
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    size: 0
  });

  const updateCacheStats = (hit = false) => {
    setCacheStats(prev => ({
      ...prev,
      hits: hit ? prev.hits + 1 : prev.hits,
      misses: hit ? prev.misses : prev.misses + 1
    }));
  };

  const getCacheHitRatio = () => {
    const total = cacheStats.hits + cacheStats.misses;
    return total > 0 ? (cacheStats.hits / total * 100).toFixed(1) : 0;
  };

  return {
    cacheStats,
    updateCacheStats,
    getCacheHitRatio
  };
};

// Hook para preload inteligente
export const useIntelligentPreload = () => {
  const [preloadQueue, setPreloadQueue] = useState([]);
  const [isPreloading, setIsPreloading] = useState(false);

  const addToPreloadQueue = (resources) => {
    setPreloadQueue(prev => [...prev, ...resources.filter(r => !prev.includes(r))]);
  };

  const processPreloadQueue = async () => {
    if (isPreloading || preloadQueue.length === 0) return;
    
    setIsPreloading(true);
    
    try {
      // Preload em lotes de 3 para não sobrecarregar
      const batch = preloadQueue.slice(0, 3);
      
      await Promise.allSettled(
        batch.map(resource => {
          if (resource.endsWith('.mp3') || resource.includes('/audio/')) {
            return preloadAudio(resource);
          } else if (resource.endsWith('.png') || resource.endsWith('.jpg')) {
            return preloadImage(resource);
          }
          return Promise.resolve();
        })
      );
      
      setPreloadQueue(prev => prev.slice(3));
    } catch (error) {
      console.error('Erro no preload:', error);
    } finally {
      setIsPreloading(false);
    }
  };

  const preloadAudio = (src) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.oncanplaythrough = resolve;
      audio.onerror = reject;
      audio.src = src;
    });
  };

  const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    });
  };

  // Processar fila automaticamente
  useEffect(() => {
    if (preloadQueue.length > 0 && !isPreloading) {
      const timer = setTimeout(processPreloadQueue, 1000);
      return () => clearTimeout(timer);
    }
  }, [preloadQueue, isPreloading]);

  return {
    addToPreloadQueue,
    preloadQueue,
    isPreloading
  };
};
