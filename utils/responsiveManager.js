// Sistema avançado de responsividade e adaptação de interface
export class ResponsiveManager {
  constructor() {
    this.breakpoints = {
      xs: 0,      // Extra small devices
      sm: 576,    // Small devices
      md: 768,    // Medium devices  
      lg: 992,    // Large devices
      xl: 1200,   // Extra large devices
      xxl: 1400   // Extra extra large devices
    };
    
    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.listeners = new Set();
    this.isInitialized = false;
    
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  // Inicializar sistema responsivo
  initialize() {
    if (this.isInitialized) return;
    
    // Listener para mudanças de tamanho
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Listener para mudanças de orientação
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    // Aplicar configurações iniciais
    this.applyResponsiveStyles();
    this.optimizeForDevice();
    
    this.isInitialized = true;
  }

  // Obter breakpoint atual
  getCurrentBreakpoint() {
    if (typeof window === 'undefined') return 'lg';
    
    const width = window.innerWidth;
    
    if (width >= this.breakpoints.xxl) return 'xxl';
    if (width >= this.breakpoints.xl) return 'xl';
    if (width >= this.breakpoints.lg) return 'lg';
    if (width >= this.breakpoints.md) return 'md';
    if (width >= this.breakpoints.sm) return 'sm';
    return 'xs';
  }

  // Manipular redimensionamento
  handleResize() {
    const newBreakpoint = this.getCurrentBreakpoint();
    
    if (newBreakpoint !== this.currentBreakpoint) {
      const oldBreakpoint = this.currentBreakpoint;
      this.currentBreakpoint = newBreakpoint;
      
      this.applyResponsiveStyles();
      this.notifyListeners('breakpointChange', { old: oldBreakpoint, new: newBreakpoint });
    }
    
    this.notifyListeners('resize', { 
      width: window.innerWidth, 
      height: window.innerHeight,
      breakpoint: this.currentBreakpoint
    });
  }

  // Manipular mudança de orientação
  handleOrientationChange() {
    setTimeout(() => {
      this.handleResize();
      this.optimizeForOrientation();
      this.notifyListeners('orientationChange', {
        orientation: this.getOrientation(),
        breakpoint: this.currentBreakpoint
      });
    }, 100); // Delay para aguardar mudança completa
  }

  // Obter orientação
  getOrientation() {
    if (typeof window === 'undefined') return 'landscape';
    
    if (window.screen && window.screen.orientation) {
      return window.screen.orientation.type.includes('portrait') ? 'portrait' : 'landscape';
    }
    
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  // Aplicar estilos responsivos
  applyResponsiveStyles() {
    if (typeof document === 'undefined') return;
    
    // Remover classes antigas
    Object.keys(this.breakpoints).forEach(bp => {
      document.body.classList.remove(`bp-${bp}`);
    });
    
    // Adicionar classe atual
    document.body.classList.add(`bp-${this.currentBreakpoint}`);
    
    // Aplicar otimizações específicas
    this.applyBreakpointOptimizations();
  }

  // Aplicar otimizações por breakpoint
  applyBreakpointOptimizations() {
    const body = document.body;
    
    // Remover todas as classes de otimização
    body.classList.remove('mobile-optimized', 'tablet-optimized', 'desktop-optimized', 'touch-optimized');
    
    switch (this.currentBreakpoint) {
      case 'xs':
      case 'sm':
        body.classList.add('mobile-optimized');
        this.optimizeForMobile();
        break;
        
      case 'md':
        body.classList.add('tablet-optimized');
        this.optimizeForTablet();
        break;
        
      case 'lg':
      case 'xl':
      case 'xxl':
        body.classList.add('desktop-optimized');
        this.optimizeForDesktop();
        break;
    }
    
    // Otimizações para touch
    if (this.isTouchDevice()) {
      body.classList.add('touch-optimized');
    }
  }

  // Otimizar para mobile
  optimizeForMobile() {
    // Reduzir animações em dispositivos móveis
    this.setAnimationLevel('minimal');
    
    // Otimizar tamanhos de fonte
    this.adjustFontSizes('mobile');
    
    // Otimizar espaçamentos
    this.adjustSpacing('compact');
    
    // Configurar viewport para mobile
    this.configureViewport('mobile');
  }

  // Otimizar para tablet
  optimizeForTablet() {
    this.setAnimationLevel('reduced');
    this.adjustFontSizes('tablet');
    this.adjustSpacing('normal');
    this.configureViewport('tablet');
  }

  // Otimizar para desktop
  optimizeForDesktop() {
    this.setAnimationLevel('full');
    this.adjustFontSizes('desktop');
    this.adjustSpacing('comfortable');
    this.configureViewport('desktop');
  }

  // Configurar nível de animações
  setAnimationLevel(level) {
    const body = document.body;
    
    body.classList.remove('animations-minimal', 'animations-reduced', 'animations-full');
    body.classList.add(`animations-${level}`);
    
    // Aplicar CSS custom properties
    const root = document.documentElement;
    
    switch (level) {
      case 'minimal':
        root.style.setProperty('--animation-duration', '0.1s');
        root.style.setProperty('--transition-duration', '0.1s');
        break;
      case 'reduced':
        root.style.setProperty('--animation-duration', '0.2s');
        root.style.setProperty('--transition-duration', '0.2s');
        break;
      case 'full':
        root.style.setProperty('--animation-duration', '0.3s');
        root.style.setProperty('--transition-duration', '0.3s');
        break;
    }
  }

  // Ajustar tamanhos de fonte
  adjustFontSizes(device) {
    const root = document.documentElement;
    
    const fontSizes = {
      mobile: {
        '--font-size-xs': '0.7rem',
        '--font-size-sm': '0.8rem',
        '--font-size-base': '0.9rem',
        '--font-size-lg': '1.1rem',
        '--font-size-xl': '1.3rem',
        '--font-size-xxl': '1.6rem'
      },
      tablet: {
        '--font-size-xs': '0.75rem',
        '--font-size-sm': '0.875rem',
        '--font-size-base': '1rem',
        '--font-size-lg': '1.25rem',
        '--font-size-xl': '1.5rem',
        '--font-size-xxl': '2rem'
      },
      desktop: {
        '--font-size-xs': '0.8rem',
        '--font-size-sm': '0.9rem',
        '--font-size-base': '1rem',
        '--font-size-lg': '1.25rem',
        '--font-size-xl': '1.5rem',
        '--font-size-xxl': '2.5rem'
      }
    };
    
    Object.entries(fontSizes[device] || fontSizes.desktop).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  // Ajustar espaçamentos
  adjustSpacing(type) {
    const root = document.documentElement;
    
    const spacings = {
      compact: {
        '--spacing-xs': '0.25rem',
        '--spacing-sm': '0.5rem',
        '--spacing-md': '0.75rem',
        '--spacing-lg': '1rem',
        '--spacing-xl': '1.5rem'
      },
      normal: {
        '--spacing-xs': '0.5rem',
        '--spacing-sm': '0.75rem',
        '--spacing-md': '1rem',
        '--spacing-lg': '1.5rem',
        '--spacing-xl': '2rem'
      },
      comfortable: {
        '--spacing-xs': '0.5rem',
        '--spacing-sm': '1rem',
        '--spacing-md': '1.5rem',
        '--spacing-lg': '2rem',
        '--spacing-xl': '3rem'
      }
    };
    
    Object.entries(spacings[type] || spacings.normal).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  // Configurar viewport
  configureViewport(device) {
    let viewport = document.querySelector('meta[name="viewport"]');
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    const viewportConfigs = {
      mobile: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
      tablet: 'width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes',
      desktop: 'width=device-width, initial-scale=1.0'
    };
    
    viewport.content = viewportConfigs[device] || viewportConfigs.desktop;
  }

  // Otimizar para orientação
  optimizeForOrientation() {
    const orientation = this.getOrientation();
    const body = document.body;
    
    body.classList.remove('orientation-portrait', 'orientation-landscape');
    body.classList.add(`orientation-${orientation}`);
    
    // Ajustes específicos para orientação em mobile
    if (this.isMobile() && orientation === 'landscape') {
      this.adjustForMobileLandscape();
    }
  }

  // Ajustar para landscape em mobile
  adjustForMobileLandscape() {
    const root = document.documentElement;
    root.style.setProperty('--mobile-landscape-height', '100vh');
    root.style.setProperty('--mobile-landscape-padding', '0.5rem');
  }

  // Otimizar para dispositivo específico
  optimizeForDevice() {
    if (typeof window === 'undefined') return;
    
    const body = document.body;
    
    // Detectar tipo de dispositivo
    if (this.isIOS()) {
      body.classList.add('device-ios');
      this.optimizeForIOS();
    } else if (this.isAndroid()) {
      body.classList.add('device-android');
      this.optimizeForAndroid();
    }
    
    // Detectar capacidades
    if (this.isTouchDevice()) {
      body.classList.add('device-touch');
      this.optimizeForTouch();
    }
    
    if (this.isHighDPI()) {
      body.classList.add('device-hidpi');
      this.optimizeForHighDPI();
    }
  }

  // Otimizações para iOS
  optimizeForIOS() {
    // Configurar safe areas
    const root = document.documentElement;
    root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
    root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
    
    // Prevenir zoom em inputs
    this.preventIOSZoom();
  }

  // Otimizações para Android
  optimizeForAndroid() {
    // Configurações específicas para Android
    const root = document.documentElement;
    root.style.setProperty('--android-keyboard-adjust', 'resize');
  }

  // Otimizações para touch
  optimizeForTouch() {
    const root = document.documentElement;
    root.style.setProperty('--touch-target-size', '44px');
    root.style.setProperty('--touch-spacing', '8px');
  }

  // Otimizações para high DPI
  optimizeForHighDPI() {
    const root = document.documentElement;
    root.style.setProperty('--border-width', '0.5px');
    root.style.setProperty('--shadow-blur', '0.5px');
  }

  // Prevenir zoom no iOS
  preventIOSZoom() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.style.fontSize === '' || parseFloat(input.style.fontSize) < 16) {
        input.style.fontSize = '16px';
      }
    });
  }

  // Verificações de dispositivo
  isMobile() {
    return this.currentBreakpoint === 'xs' || this.currentBreakpoint === 'sm';
  }

  isTablet() {
    return this.currentBreakpoint === 'md';
  }

  isDesktop() {
    return ['lg', 'xl', 'xxl'].includes(this.currentBreakpoint);
  }

  isTouchDevice() {
    return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }

  isIOS() {
    return typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  isAndroid() {
    return typeof window !== 'undefined' && /Android/.test(navigator.userAgent);
  }

  isHighDPI() {
    return typeof window !== 'undefined' && window.devicePixelRatio > 1;
  }

  // Sistema de listeners
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Erro no listener responsivo:', error);
      }
    });
  }

  // Obter informações do estado atual
  getState() {
    return {
      breakpoint: this.currentBreakpoint,
      orientation: this.getOrientation(),
      isMobile: this.isMobile(),
      isTablet: this.isTablet(),
      isDesktop: this.isDesktop(),
      isTouchDevice: this.isTouchDevice(),
      isIOS: this.isIOS(),
      isAndroid: this.isAndroid(),
      isHighDPI: this.isHighDPI(),
      viewport: {
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
      }
    };
  }

  // Limpeza
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize.bind(this));
      window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Instância global
export const responsiveManager = typeof window !== 'undefined' ? new ResponsiveManager() : null;
