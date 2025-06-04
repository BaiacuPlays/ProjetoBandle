// Sistema de cache LRU ultra-otimizado para áudio
class AudioCache {
  constructor(maxSize = 15) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.preloadQueue = new Set();
    this.isPreloading = false;
  }

  // Verificar se áudio está em cache
  has(url) {
    return this.cache.has(url);
  }

  // Obter áudio do cache
  get(url) {
    if (this.cache.has(url)) {
      const audio = this.cache.get(url);
      // Mover para o final (LRU)
      this.cache.delete(url);
      this.cache.set(url, audio);
      return audio;
    }
    return null;
  }

  // Adicionar áudio ao cache
  set(url, audio) {
    // Remover se já existe
    if (this.cache.has(url)) {
      this.cache.delete(url);
    }
    
    // Remover o mais antigo se cache está cheio
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      const oldAudio = this.cache.get(firstKey);
      if (oldAudio) {
        oldAudio.pause();
        oldAudio.src = '';
      }
      this.cache.delete(firstKey);
    }
    
    this.cache.set(url, audio);
  }

  // Preload agressivo de áudio
  async preload(url, priority = false) {
    if (this.has(url)) {
      return this.get(url);
    }

    if (priority) {
      return this.preloadImmediate(url);
    }

    this.preloadQueue.add(url);
    this.processPreloadQueue();
    return null;
  }

  // Preload imediato (para áudio atual)
  async preloadImmediate(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      // Configuração ultra-otimizada
      audio.preload = 'auto'; // Carrega tudo para reprodução instantânea
      audio.crossOrigin = 'anonymous';
      audio.playsInline = true;
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout no preload'));
      }, 3000);

      audio.oncanplaythrough = () => {
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

  // Processar fila de preload em background
  async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.size === 0) return;
    
    this.isPreloading = true;
    
    try {
      const urls = Array.from(this.preloadQueue).slice(0, 3);
      
      await Promise.allSettled(
        urls.map(async (url) => {
          if (!this.has(url)) {
            const audio = new Audio();
            audio.preload = 'metadata';
            audio.crossOrigin = 'anonymous';
            audio.playsInline = true;
            
            return new Promise((resolve) => {
              const timeout = setTimeout(resolve, 2000);
              
              audio.oncanplay = () => {
                clearTimeout(timeout);
                this.set(url, audio);
                resolve();
              };
              
              audio.onerror = () => {
                clearTimeout(timeout);
                resolve();
              };
              
              audio.src = url;
            });
          }
        })
      );
      
      urls.forEach(url => this.preloadQueue.delete(url));
    } finally {
      this.isPreloading = false;
      
      // Continuar processando se ainda há itens na fila
      if (this.preloadQueue.size > 0) {
        setTimeout(() => this.processPreloadQueue(), 1000);
      }
    }
  }

  // Criar áudio otimizado
  createOptimizedAudio(url) {
    const audio = new Audio();
    audio.preload = 'auto';
    // Não definir crossOrigin para URLs do proxy (evita problemas de CORS)
    if (!url.includes('/api/audio-proxy')) {
      audio.crossOrigin = 'anonymous';
    }
    audio.playsInline = true;
    audio.volume = 1;
    audio.src = url;
    return audio;
  }

  // Reprodução ultra-rápida
  async playInstant(url) {
    let audio = this.get(url);
    
    if (!audio) {
      // Se não está em cache, criar e tentar reproduzir imediatamente
      audio = this.createOptimizedAudio(url);
      this.set(url, audio);
    }

    // Resetar posição
    audio.currentTime = 0;
    
    try {
      // Tentar reproduzir imediatamente
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      return audio;
    } catch (error) {
      // Se falhar, aguardar carregamento
      if (audio.readyState < 2) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout')), 1000);
          
          audio.oncanplay = () => {
            clearTimeout(timeout);
            resolve();
          };
          
          audio.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Erro de carregamento'));
          };
        });
        
        return audio.play().then(() => audio);
      }
      throw error;
    }
  }

  // Limpar cache
  clear() {
    this.cache.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.cache.clear();
    this.preloadQueue.clear();
  }

  // Estatísticas do cache
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      preloadQueue: this.preloadQueue.size,
      isPreloading: this.isPreloading,
      urls: Array.from(this.cache.keys())
    };
  }
}

// Instância global do cache (apenas no cliente)
export const audioCache = typeof window !== 'undefined' ? new AudioCache() : {
  has: () => false,
  get: () => null,
  set: () => {},
  preload: () => Promise.resolve(null),
  preloadImmediate: () => Promise.resolve(null),
  playInstant: () => Promise.resolve(null),
  clear: () => {},
  getStats: () => ({ size: 0, maxSize: 0, preloadQueue: 0, isPreloading: false, urls: [] })
};

// Preload inteligente baseado em padrões
export class SmartPreloader {
  constructor() {
    this.patterns = new Map();
    this.recentSongs = [];
  }

  // Registrar padrão de uso
  registerUsage(songId, gameMode) {
    const key = `${gameMode}:${songId}`;
    const count = this.patterns.get(key) || 0;
    this.patterns.set(key, count + 1);
    
    this.recentSongs.unshift(songId);
    if (this.recentSongs.length > 20) {
      this.recentSongs.pop();
    }
  }

  // Prever próximas músicas
  predictNext(currentSongId, gameMode, allSongs) {
    const predictions = [];
    
    // Músicas populares no modo atual
    const modePattern = `${gameMode}:`;
    const popularInMode = Array.from(this.patterns.entries())
      .filter(([key]) => key.startsWith(modePattern))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([key]) => key.split(':')[1]);
    
    predictions.push(...popularInMode);
    
    // Músicas recentes (excluindo a atual)
    const recentOthers = this.recentSongs
      .filter(id => id !== currentSongId)
      .slice(0, 3);
    
    predictions.push(...recentOthers);
    
    // Músicas aleatórias do mesmo jogo
    if (allSongs && currentSongId) {
      const currentSong = allSongs.find(s => s.id === currentSongId);
      if (currentSong) {
        const sameGame = allSongs
          .filter(s => s.game === currentSong.game && s.id !== currentSongId)
          .slice(0, 2);
        predictions.push(...sameGame.map(s => s.id));
      }
    }
    
    // Remover duplicatas e retornar top 5
    return [...new Set(predictions)].slice(0, 5);
  }

  // Preload baseado em predições
  async preloadPredicted(currentSongId, gameMode, allSongs) {
    const predictions = this.predictNext(currentSongId, gameMode, allSongs);
    
    for (const songId of predictions) {
      const song = allSongs?.find(s => s.id === songId);
      if (song?.audioUrl) {
        audioCache.preload(song.audioUrl);
      }
    }
  }
}

export const smartPreloader = typeof window !== 'undefined' ? new SmartPreloader() : {
  registerUsage: () => {},
  predictNext: () => [],
  preloadPredicted: () => Promise.resolve()
};
