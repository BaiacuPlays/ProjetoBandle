// Sistema de cache inteligente para áudio
class AudioCache {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.maxCacheSize = 15; // Aumentado para 15 áudios
    this.availabilityCache = new Map();
    this.lastUsed = new Map();
    this.preloadWorker = null;
    this.initializeWorker();
  }

  // Inicializar Web Worker para preload em background
  initializeWorker() {
    if (typeof window !== 'undefined' && window.Worker) {
      try {
        const workerCode = `
          self.onmessage = function(e) {
            const { type, url } = e.data;

            if (type === 'preload') {
              fetch(url, { method: 'HEAD', cache: 'force-cache' })
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
      } catch (error) {
        console.warn('Web Worker não disponível:', error);
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

  // Remover item menos usado
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
        audio.src = '';
        audio.load();
      }
      this.cache.delete(oldestUrl);
      this.lastUsed.delete(oldestUrl);
    }
  }

  // Pré-carregar áudio
  async preload(url) {
    if (this.has(url)) return this.get(url);

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'metadata'; // Só metadata, não o arquivo completo
      audio.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao carregar áudio'));
      }, 5000);

      audio.oncanplay = () => {
        clearTimeout(timeout);
        this.set(url, audio);
        resolve(audio);
      };

      audio.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Erro ao carregar áudio'));
      };

      audio.src = url;
    });
  }

  // Verificar disponibilidade com cache
  async checkAvailability(url) {
    if (this.availabilityCache.has(url)) {
      return this.availabilityCache.get(url);
    }

    // Usar Web Worker se disponível
    if (this.preloadWorker) {
      this.preloadWorker.postMessage({ type: 'preload', url });
      // Retornar true temporariamente, será atualizado pelo worker
      return true;
    }

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'force-cache'
      });
      const isAvailable = response.ok;
      this.availabilityCache.set(url, isAvailable);
      return isAvailable;
    } catch (error) {
      this.availabilityCache.set(url, false);
      return false;
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

  // Limpar cache
  clear() {
    for (const audio of this.cache.values()) {
      audio.src = '';
      audio.load();
    }
    this.cache.clear();
    this.lastUsed.clear();
  }
}

// Instância global do cache
export const audioCache = new AudioCache();

// Hook para usar o cache
export const useAudioCache = () => {
  return audioCache;
};
