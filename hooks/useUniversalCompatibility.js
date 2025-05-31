import { useState, useEffect, useRef } from 'react';

// Hook principal para compatibilidade universal
export const useUniversalCompatibility = () => {
  const [isReady, setIsReady] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [browserInfo, setBrowserInfo] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [responsiveState, setResponsiveState] = useState(null);
  const [compatibilityIssues, setCompatibilityIssues] = useState([]);
  const [optimizedConfig, setOptimizedConfig] = useState(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || initRef.current) return;
    
    initRef.current = true;
    initializeCompatibility();
  }, []);

  const initializeCompatibility = async () => {
    try {
      // Carregar módulos dinamicamente
      const [
        { deviceDetector },
        { polyfillManager },
        { responsiveManager }
      ] = await Promise.all([
        import('../utils/deviceDetection'),
        import('../utils/polyfills'),
        import('../utils/responsiveManager')
      ]);

      // Aguardar polyfills estarem prontos
      let attempts = 0;
      while (!polyfillManager?.isReady() && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (deviceDetector) {
        setDeviceInfo(deviceDetector.deviceInfo);
        setBrowserInfo(deviceDetector.browserInfo);
        setCapabilities(deviceDetector.capabilities);
        setOptimizedConfig(deviceDetector.getOptimizedConfig());
        
        const compatibility = deviceDetector.isCompatible();
        setCompatibilityIssues(compatibility.issues.concat(compatibility.warnings));
      }

      if (responsiveManager) {
        setResponsiveState(responsiveManager.getState());
        
        // Listener para mudanças responsivas
        const unsubscribe = responsiveManager.addListener((event, data) => {
          if (event === 'breakpointChange' || event === 'orientationChange') {
            setResponsiveState(responsiveManager.getState());
          }
        });

        // Cleanup
        return () => unsubscribe();
      }

      setIsReady(true);
      console.log('✅ Compatibilidade universal inicializada');

    } catch (error) {
      console.error('❌ Erro ao inicializar compatibilidade:', error);
      setIsReady(true); // Continuar mesmo com erro
    }
  };

  // Função para aplicar configurações otimizadas
  const applyOptimizations = () => {
    if (!optimizedConfig) return;

    // Aplicar configurações de cache
    if (window.audioCache) {
      window.audioCache.maxCacheSize = optimizedConfig.maxCacheSize;
    }

    // Aplicar configurações de UI
    const root = document.documentElement;
    
    if (!optimizedConfig.animationsEnabled) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
      document.body.classList.add('no-animations');
    }

    if (!optimizedConfig.shadowsEnabled) {
      root.style.setProperty('--box-shadow', 'none');
      document.body.classList.add('no-shadows');
    }

    // Aplicar configurações de rede
    if (window.fetch) {
      const originalFetch = window.fetch;
      window.fetch = function(url, options = {}) {
        return originalFetch(url, {
          ...options,
          timeout: optimizedConfig.timeoutDuration
        });
      };
    }
  };

  // Função para verificar suporte a feature
  const supportsFeature = (feature) => {
    if (!capabilities) return false;
    return capabilities[feature] || false;
  };

  // Função para obter configuração otimizada para contexto
  const getContextConfig = (context = {}) => {
    if (!optimizedConfig) return {};

    const config = { ...optimizedConfig };

    // Ajustes baseados no contexto
    if (context.isPreload) {
      config.audioQuality = 'medium';
      config.compressionLevel = 0.6;
    }

    if (context.isBackground) {
      config.debounceDelay = config.debounceDelay * 2;
      config.throttleDelay = config.throttleDelay * 2;
    }

    if (context.isLowPower) {
      config.animationsEnabled = false;
      config.shadowsEnabled = false;
      config.maxCacheSize = Math.max(3, config.maxCacheSize / 2);
    }

    return config;
  };

  // Função para reportar problema de compatibilidade
  const reportCompatibilityIssue = (issue) => {
    setCompatibilityIssues(prev => [...prev, issue]);
    console.warn('⚠️ Problema de compatibilidade:', issue);
  };

  // Função para obter fallback para feature não suportada
  const getFallback = (feature, fallbackValue = null) => {
    if (supportsFeature(feature)) {
      return null; // Feature suportada, não precisa de fallback
    }
    
    const fallbacks = {
      webWorkers: () => {
        // Simular Web Worker com setTimeout
        return {
          postMessage: (data) => {
            setTimeout(() => {
              if (typeof data.callback === 'function') {
                data.callback(data);
              }
            }, 0);
          },
          terminate: () => {}
        };
      },
      
      webAssembly: () => {
        // Fallback JavaScript para WebAssembly
        return {
          instantiate: () => Promise.resolve({
            instance: {
              exports: {
                process: (data) => data // Processamento básico
              }
            }
          })
        };
      },
      
      serviceWorker: () => {
        // Fallback para Service Worker
        return {
          register: () => Promise.resolve({
            addEventListener: () => {},
            postMessage: () => {}
          })
        };
      },
      
      webAudio: () => {
        // Fallback para Web Audio API
        return {
          createGain: () => ({ connect: () => {}, gain: { value: 1 } }),
          createOscillator: () => ({ 
            connect: () => {}, 
            start: () => {}, 
            stop: () => {},
            frequency: { value: 440 }
          }),
          destination: {}
        };
      }
    };

    return fallbacks[feature] ? fallbacks[feature]() : fallbackValue;
  };

  // Função para executar código com fallback
  const executeWithFallback = async (primaryFn, fallbackFn) => {
    try {
      return await primaryFn();
    } catch (error) {
      console.warn('Executando fallback devido a erro:', error);
      return await fallbackFn();
    }
  };

  // Função para otimizar baseado no dispositivo
  const optimizeForDevice = () => {
    if (!deviceInfo || !browserInfo) return;

    // Otimizações para mobile
    if (deviceInfo.isMobile) {
      // Reduzir qualidade de animações
      document.body.classList.add('mobile-optimized');
      
      // Configurar viewport para mobile
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      }
    }

    // Otimizações para iOS
    if (deviceInfo.isIOS) {
      document.body.classList.add('ios-optimized');
      
      // Prevenir zoom em inputs
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        if (parseFloat(getComputedStyle(input).fontSize) < 16) {
          input.style.fontSize = '16px';
        }
      });
    }

    // Otimizações para navegadores antigos
    if (browserInfo.isIE || browserInfo.chromeVersion < 60) {
      document.body.classList.add('legacy-browser');
      
      // Desabilitar features modernas
      const root = document.documentElement;
      root.style.setProperty('--use-modern-features', '0');
    }
  };

  // Aplicar otimizações quando estiver pronto
  useEffect(() => {
    if (isReady && optimizedConfig) {
      applyOptimizations();
      optimizeForDevice();
    }
  }, [isReady, optimizedConfig]);

  return {
    // Estado
    isReady,
    deviceInfo,
    browserInfo,
    capabilities,
    responsiveState,
    compatibilityIssues,
    optimizedConfig,
    
    // Funções
    supportsFeature,
    getContextConfig,
    reportCompatibilityIssue,
    getFallback,
    executeWithFallback,
    optimizeForDevice,
    
    // Helpers
    isMobile: deviceInfo?.isMobile || false,
    isTablet: deviceInfo?.isTablet || false,
    isDesktop: deviceInfo?.isDesktop || false,
    isTouchDevice: deviceInfo?.hasTouch || false,
    isIOS: deviceInfo?.isIOS || false,
    isAndroid: deviceInfo?.isAndroid || false,
    
    // Breakpoint atual
    breakpoint: responsiveState?.breakpoint || 'lg',
    orientation: responsiveState?.orientation || 'landscape'
  };
};

// Hook simplificado para verificações rápidas
export const useDeviceInfo = () => {
  const { deviceInfo, browserInfo, isReady } = useUniversalCompatibility();
  
  return {
    isReady,
    isMobile: deviceInfo?.isMobile || false,
    isTablet: deviceInfo?.isTablet || false,
    isDesktop: deviceInfo?.isDesktop || false,
    isTouchDevice: deviceInfo?.hasTouch || false,
    isIOS: deviceInfo?.isIOS || false,
    isAndroid: deviceInfo?.isAndroid || false,
    isChrome: browserInfo?.isChrome || false,
    isFirefox: browserInfo?.isFirefox || false,
    isSafari: browserInfo?.isSafari || false,
    isEdge: browserInfo?.isEdge || false
  };
};

// Hook para responsividade
export const useResponsive = () => {
  const { responsiveState, isReady } = useUniversalCompatibility();
  
  return {
    isReady,
    breakpoint: responsiveState?.breakpoint || 'lg',
    orientation: responsiveState?.orientation || 'landscape',
    isMobile: responsiveState?.isMobile || false,
    isTablet: responsiveState?.isTablet || false,
    isDesktop: responsiveState?.isDesktop || false,
    viewport: responsiveState?.viewport || { width: 0, height: 0 }
  };
};

// Hook para capacidades do navegador
export const useBrowserCapabilities = () => {
  const { capabilities, supportsFeature, getFallback, isReady } = useUniversalCompatibility();
  
  return {
    isReady,
    capabilities: capabilities || {},
    supportsFeature,
    getFallback,
    
    // Shortcuts para features importantes
    hasWebAssembly: supportsFeature('webAssembly'),
    hasWebWorkers: supportsFeature('webWorkers'),
    hasServiceWorker: supportsFeature('serviceWorker'),
    hasWebAudio: supportsFeature('webAudio'),
    hasLocalStorage: supportsFeature('localStorage'),
    hasFetch: supportsFeature('fetch')
  };
};
