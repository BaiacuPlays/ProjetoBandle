// Configurações otimizadas para áudio e UX
export const AUDIO_CONFIG = {
  // Timeouts para melhor UX (valores ultra-reduzidos)
  PLAY_TIMEOUT: 300, // Timeout para reprodução ultra-reduzido
  LOAD_TIMEOUT: 800, // Timeout para carregamento reduzido
  SAFETY_TIMEOUT: 500, // Timeout de segurança ultra-reduzido

  // Debounce e throttle ultra-otimizados
  PLAY_DEBOUNCE: 25, // Debounce do botão play ultra-reduzido
  VOLUME_THROTTLE: 50, // Throttle do controle de volume

  // Delays para feedback visual
  VISUAL_FEEDBACK_DELAY: 150, // Duração do feedback visual
  CLICK_SCALE_DURATION: 150, // Duração da animação de clique

  // Configurações de retry
  MAX_RETRIES: 1, // Máximo de tentativas
  RETRY_DELAY: 500, // Delay entre tentativas

  // Configurações de cache
  CACHE_SIZE: 15, // Tamanho do cache de áudio
  PRELOAD_COUNT: 3, // Quantidade de músicas para preload

  // Configurações de qualidade baseadas no dispositivo
  getOptimizedConfig: (isMobile = false, isSlowDevice = false) => {
    const baseConfig = { ...AUDIO_CONFIG };

    if (isMobile) {
      baseConfig.PLAY_TIMEOUT = 800;
      baseConfig.LOAD_TIMEOUT = 1500;
      baseConfig.PLAY_DEBOUNCE = 100;
      baseConfig.CACHE_SIZE = 8;
      baseConfig.PRELOAD_COUNT = 2;
    }

    if (isSlowDevice) {
      baseConfig.PLAY_TIMEOUT = 1000;
      baseConfig.LOAD_TIMEOUT = 2000;
      baseConfig.PLAY_DEBOUNCE = 150;
      baseConfig.CACHE_SIZE = 5;
      baseConfig.PRELOAD_COUNT = 1;
    }

    return baseConfig;
  }
};

// Configurações específicas para diferentes componentes
export const COMPONENT_CONFIG = {
  PLAY_BUTTON: {
    // Estados visuais
    LOADING_ICON: '⏳',
    LOADING_SPINNER: true, // Usar spinner customizado
    SCALE_ON_CLICK: true,
    SCALE_FACTOR: 0.95,

    // Comportamento ultra-responsivo
    INSTANT_FEEDBACK: true,
    DISABLE_ON_LOADING: true,
    AUTO_ENABLE_TIMEOUT: 500 // Reduzido para melhor responsividade
  },

  AUDIO_PLAYER: {
    // Preload
    PRELOAD_MODE: 'metadata', // 'auto', 'metadata', 'none'
    CROSS_ORIGIN: null, // Para evitar problemas de CORS

    // Eventos
    PROGRESS_UPDATE_INTERVAL: 100, // ms
    VOLUME_CHANGE_THROTTLE: 50, // ms

    // Qualidade
    QUALITY_AUTO_ADJUST: true,
    COMPRESSION_LEVEL: 0.8
  }
};

// Mensagens de erro otimizadas
export const ERROR_MESSAGES = {
  TIMEOUT: 'Áudio demorou para carregar. Tente novamente.',
  NETWORK: 'Erro de rede. Verifique sua conexão.',
  FORMAT: 'Formato de áudio não suportado.',
  PERMISSION: 'Clique em qualquer lugar da página para habilitar o áudio.',
  GENERIC: 'Erro ao reproduzir. Tentando novamente...',

  // Durações das mensagens
  DISPLAY_DURATION: {
    SHORT: 2000, // 2 segundos
    MEDIUM: 3000, // 3 segundos
    LONG: 5000 // 5 segundos
  }
};

// Configurações de performance baseadas no dispositivo
export const PERFORMANCE_CONFIG = {
  // Detecção de dispositivo
  MOBILE_BREAKPOINT: 768,
  SLOW_DEVICE_THRESHOLD: {
    MEMORY: 0.8, // 80% de uso de memória
    CPU_CORES: 2, // Menos de 2 cores
    CONNECTION: 'slow-2g' // Conexão lenta
  },

  // Otimizações automáticas
  AUTO_OPTIMIZE: true,
  REDUCE_ANIMATIONS_ON_SLOW: true,
  REDUCE_CACHE_ON_LOW_MEMORY: true,

  // Monitoramento
  PERFORMANCE_MONITORING: true,
  LOG_SLOW_OPERATIONS: true,
  SLOW_OPERATION_THRESHOLD: 1000 // ms
};

export default AUDIO_CONFIG;
