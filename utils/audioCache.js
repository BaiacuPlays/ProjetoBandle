// Sistema de cache inteligente para áudio com melhor compatibilidade entre navegadores
class AudioCache {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.maxCacheSize = 10; // Reduzido para melhor performance
    this.availabilityCache = new Map();
    this.lastUsed = new Map();
    this.preloadWorker = null;
    this.loadingPromises = new Map(); // Para evitar carregamentos duplicados
    this.browserInfo = this.detectBrowser();
    this.initializeWorker();
  }

  // Detectar navegador para ajustes específicos
  detectBrowser() {
    if (typeof window === 'undefined') return { name: 'unknown', version: 0 };

    const userAgent = window.navigator.userAgent;
    let browser = { name: 'unknown', version: 0 };

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser.name = 'chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      browser.version = match ? parseInt(match[1]) : 0;
    } else if (userAgent.includes('Firefox')) {
      browser.name = 'firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      browser.version = match ? parseInt(match[1]) : 0;
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser.name = 'safari';
      const match = userAgent.match(/Version\/(\d+)/);
      browser.version = match ? parseInt(match[1]) : 0;
    } else if (userAgent.includes('Edg')) {
      browser.name = 'edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      browser.version = match ? parseInt(match[1]) : 0;
    }

    return browser;
  }

  // Inicializar Web Worker para preload em background (com fallback)
  initializeWorker() {
    // Desabilitar Web Worker em navegadores problemáticos
    if (this.browserInfo.name === 'safari' || this.browserInfo.name === 'firefox') {
      console.log('Web Worker desabilitado para melhor compatibilidade');
      return;
    }

    if (typeof window !== 'undefined' && window.Worker) {
      try {
        const workerCode = `
          self.onmessage = function(e) {
            const { type, url } = e.data;

            if (type === 'preload') {
              fetch(url, {
                method: 'HEAD',
                cache: 'force-cache',
                mode: 'cors'
              })
                .then(response => {
                  self.postMessage({
                    type: 'preload_complete',
                    url,
                    success: response.ok
                  });
                })
                .catch(() => {
                  self.postMessage({
                    type: 'preload_complete',
                    url,
                    success: false
                  });
                });
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.preloadWorker = new Worker(URL.createObjectURL(blob));

        this.preloadWorker.onmessage = (e) => {
          const { type, url, success } = e.data;
          if (type === 'preload_complete') {
            this.availabilityCache.set(url, success);
          }
        };

        this.preloadWorker.onerror = (error) => {
          console.warn('Erro no Web Worker:', error);
          this.preloadWorker = null;
        };
      } catch (error) {
        console.warn('Web Worker não disponível:', error);
        this.preloadWorker = null;
      }
    }
  }

  // Verificar se áudio está em cache
  has(url) {
    return this.cache.has(url);
  }

  // Obter áudio do cache
  get(url) {
    if (this.cache.has(url)) {
      this.lastUsed.set(url, Date.now());
      return this.cache.get(url);
    }
    return null;
  }

  // Adicionar áudio ao cache
  set(url, audio) {
    // Limpar cache se estiver cheio
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed();
    }

    this.cache.set(url, audio);
    this.lastUsed.set(url, Date.now());
  }

  // Remover item menos usado com cleanup adequado
  evictLeastUsed() {
    let oldestUrl = null;
    let oldestTime = Date.now();

    for (const [url, time] of this.lastUsed) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestUrl = url;
      }
    }

    if (oldestUrl) {
      const audio = this.cache.get(oldestUrl);
      if (audio) {
        try {
          // Cleanup mais robusto
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        } catch (error) {
          console.warn('Erro ao limpar áudio do cache:', error);
        }
      }
      this.cache.delete(oldestUrl);
      this.lastUsed.delete(oldestUrl);
      this.loadingPromises.delete(oldestUrl);
    }
  }

  // Pré-carregar áudio com melhor tratamento de erros e compatibilidade
  async preload(url) {
    if (this.has(url)) return this.get(url);

    // Evitar carregamentos duplicados
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    const loadPromise = new Promise((resolve, reject) => {
      const audio = new Audio();

      // Configurações específicas por navegador
      if (this.browserInfo.name === 'safari') {
        audio.preload = 'none'; // Safari tem problemas com preload
      } else {
        audio.preload = 'metadata';
      }

      // CrossOrigin apenas se necessário
      if (this.browserInfo.name !== 'firefox') {
        audio.crossOrigin = 'anonymous';
      }

      // Timeout mais conservador para navegadores lentos
      const timeoutDuration = this.browserInfo.name === 'safari' ? 8000 : 5000;
      const timeout = setTimeout(() => {
        this.loadingPromises.delete(url);
        reject(new Error('Timeout ao carregar áudio'));
      }, timeoutDuration);

      const cleanup = () => {
        clearTimeout(timeout);
        this.loadingPromises.delete(url);
      };

      audio.oncanplay = () => {
        cleanup();
        this.set(url, audio);
        resolve(audio);
      };

      audio.onerror = (e) => {
        cleanup();
        console.warn('Erro ao pré-carregar áudio:', url, e);
        reject(new Error('Erro ao carregar áudio'));
      };

      audio.onabort = () => {
        cleanup();
        reject(new Error('Carregamento abortado'));
      };

      try {
        audio.src = url;
      } catch (error) {
        cleanup();
        reject(error);
      }
    });

    this.loadingPromises.set(url, loadPromise);
    return loadPromise;
  }

  // Verificar disponibilidade com cache e melhor tratamento de erros
  async checkAvailability(url) {
    if (this.availabilityCache.has(url)) {
      return this.availabilityCache.get(url);
    }

    // Usar Web Worker se disponível (apenas para Chrome)
    if (this.preloadWorker && this.browserInfo.name === 'chrome') {
      this.preloadWorker.postMessage({ type: 'preload', url });
      // Retornar true temporariamente, será atualizado pelo worker
      return true;
    }

    try {
      // Timeout mais curto para verificação de disponibilidade
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'force-cache',
        mode: 'cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const isAvailable = response.ok;
      this.availabilityCache.set(url, isAvailable);
      return isAvailable;
    } catch (error) {
      console.warn('Erro ao verificar disponibilidade:', url, error.name);
      // Em caso de erro, assumir que está disponível para não bloquear
      this.availabilityCache.set(url, true);
      return true;
    }
  }

  // Preload inteligente de próximas músicas
  preloadNext(currentSongId, songsList) {
    if (!songsList || songsList.length === 0) return;

    const currentIndex = songsList.findIndex(song => song.id === currentSongId);
    if (currentIndex === -1) return;

    // Preload próximas 3 músicas
    const nextSongs = songsList.slice(currentIndex + 1, currentIndex + 4);

    nextSongs.forEach(song => {
      if (!this.has(song.audioUrl)) {
        this.preload(song.audioUrl).catch(() => {
          // Ignorar erros de preload
        });
      }
    });
  }

  // Preload baseado em padrões de uso
  intelligentPreload(userHistory = []) {
    if (userHistory.length < 3) return;

    // Analisar padrões dos últimos jogos
    const recentGames = userHistory.slice(-5);
    const gameFrequency = {};

    recentGames.forEach(game => {
      if (game.game) {
        gameFrequency[game.game] = (gameFrequency[game.game] || 0) + 1;
      }
    });

    // Preload músicas dos jogos mais jogados
    const topGames = Object.entries(gameFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([game]) => game);

    // Implementar preload baseado em preferências
    // (seria necessário acesso à lista de músicas aqui)
  }

  // Limpar cache com cleanup robusto
  clear() {
    for (const audio of this.cache.values()) {
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch (error) {
        console.warn('Erro ao limpar áudio:', error);
      }
    }
    this.cache.clear();
    this.lastUsed.clear();
    this.loadingPromises.clear();
    this.availabilityCache.clear();
  }

  // Método para obter informações do navegador
  getBrowserInfo() {
    return this.browserInfo;
  }

  // Método para forçar limpeza de recursos
  forceCleanup() {
    // Cancelar todas as promises de carregamento
    for (const [url, promise] of this.loadingPromises) {
      promise.catch(() => {}); // Ignorar erros
    }
    this.loadingPromises.clear();

    // Limpar worker se existir
    if (this.preloadWorker) {
      try {
        this.preloadWorker.terminate();
        this.preloadWorker = null;
      } catch (error) {
        console.warn('Erro ao terminar worker:', error);
      }
    }

    this.clear();
  }
}

// Instância global do cache
export const audioCache = new AudioCache();

// Hook para usar o cache
export const useAudioCache = () => {
  return audioCache;
};
