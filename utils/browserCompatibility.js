// Sistema de compatibilidade entre navegadores para áudio
class BrowserCompatibility {
  constructor() {
    this.browserInfo = this.detectBrowser();
    this.audioConfig = this._initializeAudioConfig();
  }

  // Configuração simplificada de áudio
  _initializeAudioConfig() {
    // Configuração única e simples para todos os navegadores
    return {
      preload: 'metadata',
      crossOrigin: null, // Removido para evitar problemas de CORS
      timeout: 3000, // Timeout reduzido
      playTimeout: 2000, // Timeout de play reduzido
      loadDelay: 50, // Delay mínimo
      maxRetries: 1 // Apenas 1 retry
    };
  }

  // Detecção simplificada de navegador
  detectBrowser() {
    if (typeof window === 'undefined') {
      return { name: 'unknown', version: 0, isProblematic: false };
    }

    const userAgent = window.navigator.userAgent;

    // Simplificado: apenas detectar se é Chrome/Firefox (estáveis) ou outros (problemáticos)
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      return { name: 'chrome', version: 0, isProblematic: false };
    } else if (userAgent.includes('Firefox')) {
      return { name: 'firefox', version: 0, isProblematic: false };
    } else {
      // Todos os outros navegadores são considerados problemáticos
      return { name: 'other', version: 0, isProblematic: true };
    }
  }



  // Configuração simplificada do elemento de áudio
  configureAudioElement(audio) {
    // Configuração mínima e universal
    audio.preload = 'metadata';
    audio.removeAttribute('crossorigin'); // Remove CORS para evitar problemas
    audio.muted = false;
    audio.playsInline = true; // Para mobile
    return audio;
  }

  // Método simplificado para reproduzir áudio
  async playAudio(audio) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao reproduzir áudio'));
      }, 2000); // Timeout fixo de 2 segundos

      const cleanup = () => {
        clearTimeout(timeout);
      };

      // Tentar reproduzir diretamente
      this.attemptPlay(audio, cleanup, resolve, reject);
    });
  }

  // Tentativa simplificada de reprodução
  async attemptPlay(audio, cleanup, resolve, reject) {
    try {
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
        // Navegadores antigos
        cleanup();
        resolve();
      }
    } catch (error) {
      cleanup();
      this.handlePlayError(error, reject);
    }
  }

  // Tratamento simplificado de erros
  handlePlayError(error, reject) {
    let userMessage = 'Erro ao reproduzir áudio';

    switch (error.name) {
      case 'NotAllowedError':
        userMessage = 'Clique em qualquer lugar para permitir reprodução de áudio';
        break;
      case 'NotSupportedError':
        userMessage = 'Formato de áudio não suportado';
        break;
      case 'AbortError':
        userMessage = 'Reprodução cancelada';
        break;
      default:
        userMessage = 'Erro ao reproduzir áudio. Tente novamente.';
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

  // Reset simplificado de áudio
  resetAudio(audio) {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (error) {
      console.warn('Erro ao resetar áudio:', error);
    }
  }
}

// Instância global
export const browserCompatibility = new BrowserCompatibility();

// Hook para usar a compatibilidade
export const useBrowserCompatibility = () => {
  return browserCompatibility;
};
