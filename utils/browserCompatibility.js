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
      timeout: 1500, // Timeout reduzido para melhor UX
      playTimeout: 500, // Timeout de play muito reduzido
      loadDelay: 25, // Delay mínimo reduzido
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

  // Método ultra-otimizado para reproduzir áudio
  async playAudio(audio) {
    return new Promise((resolve, reject) => {
      // Timeout reduzido para melhor UX
      const timeout = setTimeout(() => {
        // Só rejeitar se o áudio realmente não conseguiu reproduzir
        if (audio.paused && audio.readyState < 2) {
          reject(new Error('Timeout ao reproduzir áudio'));
        } else {
          resolve(); // Se está tocando ou carregado, considerar sucesso
        }
      }, this.audioConfig.playTimeout); // Usar configuração dinâmica

      const cleanup = () => {
        clearTimeout(timeout);
      };

      // Tentar reproduzir diretamente
      this.attemptPlay(audio, cleanup, resolve, reject);
    });
  }

  // Método para reprodução instantânea (sem timeout)
  async playAudioInstant(audio) {
    try {
      // Se o áudio está pronto, reproduzir imediatamente
      if (audio.readyState >= 2) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          return await playPromise;
        }
        return Promise.resolve();
      }

      // Se não está pronto, usar método normal com timeout reduzido
      return this.playAudio(audio);
    } catch (error) {
      this.handlePlayError(error, (err) => { throw err; });
    }
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
    let userMessage = '';

    switch (error.name) {
      case 'NotAllowedError':
        userMessage = 'Clique em qualquer lugar para permitir reprodução de áudio';
        break;
      case 'NotSupportedError':
        userMessage = 'Formato de áudio não suportado';
        break;
      case 'AbortError':
        // Não mostrar erro para abort (usuário cancelou)
        return;
      default:
        // Para outros erros, apenas log sem mostrar mensagem
        console.warn('Erro de reprodução (silenciado):', error);
        return;
    }

    // Só rejeitar se houver uma mensagem específica para o usuário
    if (userMessage) {
      reject(new Error(userMessage));
    }
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
      // Silent error handling
    }
  }
}

// Instância global
export const browserCompatibility = new BrowserCompatibility();

// Hook para usar a compatibilidade
export const useBrowserCompatibility = () => {
  return browserCompatibility;
};
