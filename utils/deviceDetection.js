// Sistema avançado de detecção de dispositivos e navegadores
export class DeviceDetector {
  constructor() {
    this.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    this.platform = typeof navigator !== 'undefined' ? navigator.platform : '';
    this.deviceInfo = this.detectDevice();
    this.browserInfo = this.detectBrowser();
    this.capabilities = this.detectCapabilities();
  }

  // Detectar tipo de dispositivo
  detectDevice() {
    const ua = this.userAgent.toLowerCase();
    
    return {
      // Tipos de dispositivo
      isMobile: /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua),
      isTablet: /tablet|ipad|playbook|silk/i.test(ua),
      isDesktop: !/mobile|tablet|android|iphone|ipod|ipad|blackberry|iemobile|opera mini|playbook|silk/i.test(ua),
      
      // Sistemas operacionais
      isIOS: /iphone|ipad|ipod/i.test(ua),
      isAndroid: /android/i.test(ua),
      isWindows: /windows/i.test(ua),
      isMac: /macintosh|mac os x/i.test(ua),
      isLinux: /linux/i.test(ua),
      
      // Dispositivos específicos
      isIPhone: /iphone/i.test(ua),
      isIPad: /ipad/i.test(ua),
      isIPod: /ipod/i.test(ua),
      
      // Características da tela
      screenWidth: typeof window !== 'undefined' ? window.screen.width : 0,
      screenHeight: typeof window !== 'undefined' ? window.screen.height : 0,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      
      // Orientação
      orientation: typeof window !== 'undefined' && window.screen.orientation 
        ? window.screen.orientation.type 
        : 'unknown',
      
      // Touch support
      hasTouch: typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    };
  }

  // Detectar navegador
  detectBrowser() {
    const ua = this.userAgent;
    
    return {
      // Navegadores principais
      isChrome: /chrome/i.test(ua) && !/edge|edg/i.test(ua),
      isFirefox: /firefox/i.test(ua),
      isSafari: /safari/i.test(ua) && !/chrome|chromium/i.test(ua),
      isEdge: /edge|edg/i.test(ua),
      isOpera: /opera|opr/i.test(ua),
      isIE: /msie|trident/i.test(ua),
      
      // Navegadores móveis
      isSamsungBrowser: /samsungbrowser/i.test(ua),
      isUCBrowser: /ucbrowser/i.test(ua),
      
      // Versões
      chromeVersion: this.extractVersion(ua, /chrome\/(\d+)/i),
      firefoxVersion: this.extractVersion(ua, /firefox\/(\d+)/i),
      safariVersion: this.extractVersion(ua, /version\/(\d+)/i),
      edgeVersion: this.extractVersion(ua, /edge\/(\d+)/i),
      
      // WebView
      isWebView: /wv|webview/i.test(ua),
      
      // Engine
      isWebKit: /webkit/i.test(ua),
      isBlink: /blink/i.test(ua) || (/chrome/i.test(ua) && !/edge/i.test(ua)),
      isGecko: /gecko/i.test(ua) && !/webkit/i.test(ua)
    };
  }

  // Detectar capacidades do navegador
  detectCapabilities() {
    if (typeof window === 'undefined') {
      return {
        webAssembly: false,
        webWorkers: false,
        serviceWorker: false,
        webAudio: false,
        localStorage: false,
        sessionStorage: false,
        indexedDB: false,
        webGL: false,
        canvas: false,
        svg: false,
        css3: false,
        flexbox: false,
        grid: false,
        fetch: false,
        promises: false,
        es6: false,
        webRTC: false,
        geolocation: false,
        deviceOrientation: false,
        vibration: false,
        fullscreen: false,
        clipboard: false,
        share: false,
        notifications: false
      };
    }

    return {
      // APIs modernas
      webAssembly: typeof WebAssembly !== 'undefined',
      webWorkers: typeof Worker !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      webAudio: !!(window.AudioContext || window.webkitAudioContext),
      
      // Storage
      localStorage: this.testStorage('localStorage'),
      sessionStorage: this.testStorage('sessionStorage'),
      indexedDB: 'indexedDB' in window,
      
      // Graphics
      webGL: this.testWebGL(),
      canvas: !!document.createElement('canvas').getContext,
      svg: !!(document.createElementNS && document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect),
      
      // CSS
      css3: this.testCSS3(),
      flexbox: this.testFlexbox(),
      grid: this.testGrid(),
      
      // JavaScript
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      es6: this.testES6(),
      
      // Device APIs
      webRTC: !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia),
      geolocation: 'geolocation' in navigator,
      deviceOrientation: 'DeviceOrientationEvent' in window,
      vibration: 'vibrate' in navigator,
      
      // Browser APIs
      fullscreen: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled),
      clipboard: !!(navigator.clipboard && navigator.clipboard.writeText),
      share: 'share' in navigator,
      notifications: 'Notification' in window
    };
  }

  // Extrair versão do navegador
  extractVersion(ua, regex) {
    const match = ua.match(regex);
    return match ? parseInt(match[1]) : 0;
  }

  // Testar storage
  testStorage(type) {
    try {
      const storage = window[type];
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Testar WebGL
  testWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  // Testar CSS3
  testCSS3() {
    const div = document.createElement('div');
    return 'borderRadius' in div.style;
  }

  // Testar Flexbox
  testFlexbox() {
    const div = document.createElement('div');
    return 'flex' in div.style || 'webkitFlex' in div.style;
  }

  // Testar CSS Grid
  testGrid() {
    const div = document.createElement('div');
    return 'grid' in div.style || 'msGrid' in div.style;
  }

  // Testar ES6
  testES6() {
    try {
      return typeof Symbol !== 'undefined' && typeof Promise !== 'undefined';
    } catch (e) {
      return false;
    }
  }

  // Obter configuração otimizada baseada no dispositivo
  getOptimizedConfig() {
    const config = {
      // Configurações de performance
      maxCacheSize: 15,
      preloadCount: 3,
      debounceDelay: 200,
      throttleDelay: 50,
      
      // Configurações de qualidade
      audioQuality: 'high',
      compressionLevel: 0.8,
      
      // Configurações de UI
      animationsEnabled: true,
      transitionsEnabled: true,
      shadowsEnabled: true,
      
      // Configurações de rede
      timeoutDuration: 5000,
      retryAttempts: 2
    };

    // Ajustes para dispositivos móveis
    if (this.deviceInfo.isMobile) {
      config.maxCacheSize = 8;
      config.preloadCount = 2;
      config.debounceDelay = 300;
      config.audioQuality = 'medium';
      config.compressionLevel = 0.6;
      config.timeoutDuration = 8000;
      config.retryAttempts = 3;
    }

    // Ajustes para tablets
    if (this.deviceInfo.isTablet) {
      config.maxCacheSize = 12;
      config.preloadCount = 3;
      config.audioQuality = 'high';
      config.compressionLevel = 0.7;
    }

    // Ajustes para conexões lentas (estimativa baseada em características)
    if (this.deviceInfo.isMobile && this.deviceInfo.isAndroid) {
      config.audioQuality = 'medium';
      config.compressionLevel = 0.5;
      config.animationsEnabled = false;
      config.shadowsEnabled = false;
    }

    // Ajustes para navegadores antigos
    if (this.browserInfo.isIE || this.browserInfo.chromeVersion < 60) {
      config.animationsEnabled = false;
      config.transitionsEnabled = false;
      config.shadowsEnabled = false;
      config.maxCacheSize = 5;
      config.preloadCount = 1;
    }

    // Ajustes para dispositivos com pouca memória
    if (this.deviceInfo.screenWidth < 768 || this.deviceInfo.pixelRatio < 2) {
      config.maxCacheSize = Math.max(3, config.maxCacheSize / 2);
      config.preloadCount = 1;
      config.shadowsEnabled = false;
    }

    return config;
  }

  // Verificar se o dispositivo é compatível
  isCompatible() {
    const issues = [];

    // Verificações críticas
    if (this.browserInfo.isIE) {
      issues.push('Internet Explorer não é suportado');
    }

    if (!this.capabilities.fetch) {
      issues.push('Fetch API não disponível');
    }

    if (!this.capabilities.localStorage) {
      issues.push('LocalStorage não disponível');
    }

    if (!this.capabilities.webAudio && !document.createElement('audio').canPlayType) {
      issues.push('Reprodução de áudio não suportada');
    }

    return {
      compatible: issues.length === 0,
      issues,
      warnings: this.getCompatibilityWarnings()
    };
  }

  // Obter avisos de compatibilidade
  getCompatibilityWarnings() {
    const warnings = [];

    if (!this.capabilities.webWorkers) {
      warnings.push('Web Workers não disponíveis - performance reduzida');
    }

    if (!this.capabilities.serviceWorker) {
      warnings.push('Service Worker não disponível - sem cache offline');
    }

    if (!this.capabilities.webAssembly) {
      warnings.push('WebAssembly não disponível - processamento mais lento');
    }

    if (this.browserInfo.chromeVersion > 0 && this.browserInfo.chromeVersion < 70) {
      warnings.push('Versão do Chrome desatualizada - algumas funcionalidades podem não funcionar');
    }

    if (this.deviceInfo.isMobile && this.deviceInfo.screenWidth < 360) {
      warnings.push('Tela muito pequena - interface pode ficar comprimida');
    }

    return warnings;
  }
}

// Instância global
export const deviceDetector = typeof window !== 'undefined' ? new DeviceDetector() : null;

// Hook para usar detecção de dispositivo
export const useDeviceDetection = () => {
  return deviceDetector;
};
