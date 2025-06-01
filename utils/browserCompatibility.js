// Sistema de compatibilidade entre navegadores para áudio
class BrowserCompatibility {
  constructor() {
    this.browserInfo = this.detectBrowser();
    this.audioConfig = this.getAudioConfig();
  }

  // Detectar navegador e versão
  detectBrowser() {
    if (typeof window === 'undefined') {
      return { name: 'unknown', version: 0, isProblematic: false };
    }
    
    const userAgent = window.navigator.userAgent;
    let browser = { name: 'unknown', version: 0, isProblematic: false };

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser.name = 'chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      browser.version = match ? parseInt(match[1]) : 0;
      browser.isProblematic = false; // Chrome é o mais estável
    } else if (userAgent.includes('Firefox')) {
      browser.name = 'firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      browser.version = match ? parseInt(match[1]) : 0;
      browser.isProblematic = false; // Firefox funciona bem
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser.name = 'safari';
      const match = userAgent.match(/Version\/(\d+)/);
      browser.version = match ? parseInt(match[1]) : 0;
      browser.isProblematic = true; // Safari tem problemas com áudio
    } else if (userAgent.includes('Edg')) {
      browser.name = 'edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      browser.version = match ? parseInt(match[1]) : 0;
      browser.isProblematic = true; // Edge pode ter problemas
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      browser.name = 'opera';
      browser.isProblematic = true; // Opera pode ter problemas
    }

    // Detectar versões antigas problemáticas
    if (browser.name === 'chrome' && browser.version < 80) {
      browser.isProblematic = true;
    }
    if (browser.name === 'firefox' && browser.version < 75) {
      browser.isProblematic = true;
    }

    return browser;
  }

  // Configurações específicas por navegador
  getAudioConfig() {
    const config = {
      preload: 'metadata',
      crossOrigin: 'anonymous',
      useWebWorker: true,
      maxRetries: 3,
      timeout: 5000,
      playTimeout: 3000,
      loadDelay: 100,
      useCache: true,
      forceReload: false
    };

    switch (this.browserInfo.name) {
      case 'safari':
        return {
          ...config,
          preload: 'none', // Safari tem problemas com preload
          crossOrigin: null, // Não usar crossOrigin no Safari
          useWebWorker: false,
          timeout: 8000,
          playTimeout: 5000,
          loadDelay: 300,
          forceReload: true
        };

      case 'edge':
        return {
          ...config,
          useWebWorker: false,
          timeout: 7000,
          playTimeout: 4000,
          loadDelay: 200,
          maxRetries: 2
        };

      case 'opera':
        return {
          ...config,
          useWebWorker: false,
          timeout: 6000,
          playTimeout: 4000,
          loadDelay: 200
        };

      case 'firefox':
        return {
          ...config,
          crossOrigin: null, // Firefox às vezes tem problemas com CORS
          useWebWorker: false,
          loadDelay: 150
        };

      case 'chrome':
      default:
        return config; // Chrome usa configuração padrão
    }
  }

  // Configurar elemento de áudio com configurações específicas do navegador
  configureAudioElement(audio) {
    const config = this.audioConfig;

    if (config.preload) {
      audio.preload = config.preload;
    }

    if (config.crossOrigin) {
      audio.crossOrigin = config.crossOrigin;
    } else {
      audio.removeAttribute('crossorigin');
    }

    // Configurações específicas para navegadores problemáticos
    if (this.browserInfo.isProblematic) {
      // Desabilitar algumas otimizações para melhor compatibilidade
      audio.muted = false; // Garantir que não está mudo
      
      // Para Safari, configurações especiais
      if (this.browserInfo.name === 'safari') {
        audio.playsInline = true;
        audio.controls = false;
      }
    }

    return audio;
  }

  // Método para reproduzir áudio com fallbacks específicos do navegador
  async playAudio(audio) {
    const config = this.audioConfig;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao reproduzir áudio'));
      }, config.playTimeout);

      const cleanup = () => {
        clearTimeout(timeout);
      };

      // Para navegadores problemáticos, usar abordagem mais conservadora
      if (this.browserInfo.isProblematic) {
        // Verificar se o áudio está pronto
        if (audio.readyState < 2) { // HAVE_CURRENT_DATA
          audio.addEventListener('canplay', () => {
            this.attemptPlay(audio, cleanup, resolve, reject);
          }, { once: true });
          return;
        }
      }

      this.attemptPlay(audio, cleanup, resolve, reject);
    });
  }

  // Tentar reproduzir com tratamento de erros específico
  async attemptPlay(audio, cleanup, resolve, reject) {
    try {
      // Para Safari, aguardar um pouco antes de tentar reproduzir
      if (this.browserInfo.name === 'safari') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            cleanup();
            resolve();
          })
          .catch((error) => {
            cleanup();
            this.handlePlayError(error, reject);
          });
      } else {
        // Navegadores muito antigos que não retornam Promise
        cleanup();
        resolve();
      }
    } catch (error) {
      cleanup();
      this.handlePlayError(error, reject);
    }
  }

  // Tratar erros específicos de reprodução
  handlePlayError(error, reject) {
    let userMessage = 'Erro ao reproduzir áudio';

    switch (error.name) {
      case 'NotAllowedError':
        userMessage = 'Clique em qualquer lugar para permitir reprodução de áudio';
        break;
      case 'NotSupportedError':
        userMessage = 'Formato de áudio não suportado neste navegador';
        break;
      case 'AbortError':
        userMessage = 'Reprodução cancelada';
        break;
      default:
        if (this.browserInfo.isProblematic) {
          userMessage = `Problema de compatibilidade com ${this.browserInfo.name}. Tente atualizar o navegador.`;
        }
    }

    reject(new Error(userMessage));
  }

  // Verificar se o navegador precisa de tratamento especial
  needsSpecialHandling() {
    return this.browserInfo.isProblematic;
  }

  // Obter informações do navegador
  getBrowserInfo() {
    return this.browserInfo;
  }

  // Obter configurações de áudio
  getAudioConfig() {
    return this.audioConfig;
  }

  // Método para resetar áudio com configurações específicas do navegador
  resetAudio(audio) {
    try {
      audio.pause();
      
      if (this.browserInfo.name === 'safari') {
        // Safari precisa de um reset mais agressivo
        audio.currentTime = 0;
        audio.removeAttribute('src');
        audio.load();
      } else {
        // Outros navegadores
        audio.currentTime = 0;
      }
    } catch (error) {
      console.warn('Erro ao resetar áudio:', error);
    }
  }

  // Verificar se o navegador suporta recursos específicos
  checkFeatureSupport() {
    const support = {
      webAudio: !!(window.AudioContext || window.webkitAudioContext),
      mediaSource: !!window.MediaSource,
      webWorkers: !!window.Worker,
      fetch: !!window.fetch,
      promises: typeof Promise !== 'undefined'
    };

    return support;
  }
}

// Instância global
export const browserCompatibility = new BrowserCompatibility();

// Hook para usar a compatibilidade
export const useBrowserCompatibility = () => {
  return browserCompatibility;
};
