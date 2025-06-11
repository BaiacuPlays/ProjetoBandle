// ✨ Sistema de efeitos visuais para melhorar o game feel
export class GameFeelEffects {
  constructor() {
    this.enabled = true;
    this.loadSettings();
  }

  // Carregar configurações do usuário
  loadSettings() {
    try {
      if (typeof window !== 'undefined') {
        const savedSettings = localStorage.getItem('bandle_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          this.enabled = settings.animations !== false;
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações de animações:', error);
    }
  }

  // Verificar se está habilitado
  isEnabled() {
    this.loadSettings();
    return this.enabled;
  }

  // 🎯 SCREEN SHAKE EFFECT
  screenShake(element = document.body, intensity = 5, duration = 300) {
    if (!this.isEnabled()) return;

    const originalTransform = element.style.transform;
    let startTime = null;

    const shake = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        const shakeIntensity = intensity * (1 - progress);
        const x = (Math.random() - 0.5) * shakeIntensity;
        const y = (Math.random() - 0.5) * shakeIntensity;
        
        element.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
        requestAnimationFrame(shake);
      } else {
        element.style.transform = originalTransform;
      }
    };

    requestAnimationFrame(shake);
  }

  // 🌟 PARTICLE BURST EFFECT
  createParticleBurst(x, y, color = '#1DB954', count = 8) {
    if (!this.isEnabled()) return;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 4px;
        height: 4px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        animation: particleBurst 0.6s ease-out forwards;
      `;

      // Direção aleatória
      const angle = (i / count) * Math.PI * 2;
      const velocity = 50 + Math.random() * 30;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      particle.style.setProperty('--vx', `${vx}px`);
      particle.style.setProperty('--vy', `${vy}px`);

      document.body.appendChild(particle);

      // Remover após animação
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 600);
    }

    // Adicionar CSS da animação se não existir
    this.ensureParticleCSS();
  }

  // 💫 RIPPLE EFFECT
  createRipple(element, x, y, color = 'rgba(29, 185, 84, 0.3)') {
    if (!this.isEnabled()) return;

    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('div');
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.cssText = `
      position: absolute;
      left: ${x - rect.left - size/2}px;
      top: ${y - rect.top - size/2}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      transform: scale(0);
      animation: rippleEffect 0.6s ease-out;
    `;

    // Garantir que o elemento pai tenha position relative
    const originalPosition = element.style.position;
    if (!originalPosition || originalPosition === 'static') {
      element.style.position = 'relative';
    }

    element.appendChild(ripple);

    // Remover após animação
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);

    this.ensureRippleCSS();
  }

  // 🎨 GLOW EFFECT
  addGlowEffect(element, color = '#1DB954', duration = 1000) {
    if (!this.isEnabled()) return;

    const originalBoxShadow = element.style.boxShadow;
    element.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
    element.style.transition = `box-shadow 0.3s ease`;

    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;
    }, duration);
  }

  // 🔄 PULSE EFFECT
  pulseEffect(element, scale = 1.1, duration = 200) {
    if (!this.isEnabled()) return;

    const originalTransform = element.style.transform;
    element.style.transition = `transform ${duration}ms ease`;
    element.style.transform = `${originalTransform} scale(${scale})`;

    setTimeout(() => {
      element.style.transform = originalTransform;
    }, duration);
  }

  // 📈 FLOAT UP EFFECT
  floatUpEffect(element, distance = 20, duration = 500) {
    if (!this.isEnabled()) return;

    const originalTransform = element.style.transform;
    element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
    element.style.transform = `${originalTransform} translateY(-${distance}px)`;
    element.style.opacity = '0.7';

    setTimeout(() => {
      element.style.transform = originalTransform;
      element.style.opacity = '1';
    }, duration);
  }

  // 🎯 BOUNCE EFFECT
  bounceEffect(element, intensity = 0.1, duration = 300) {
    if (!this.isEnabled()) return;

    element.style.animation = `bounceEffect ${duration}ms ease`;
    element.style.setProperty('--bounce-intensity', intensity);

    setTimeout(() => {
      element.style.animation = '';
    }, duration);

    this.ensureBounceCSS();
  }

  // 🌈 COLOR FLASH EFFECT
  colorFlash(element, color = '#1DB954', duration = 200) {
    if (!this.isEnabled()) return;

    const originalBackground = element.style.backgroundColor;
    element.style.transition = `background-color ${duration}ms ease`;
    element.style.backgroundColor = color;

    setTimeout(() => {
      element.style.backgroundColor = originalBackground;
    }, duration);
  }

  // 🔧 UTILITY METHODS

  // Garantir que o CSS das partículas existe
  ensureParticleCSS() {
    if (!document.getElementById('particle-burst-css')) {
      const style = document.createElement('style');
      style.id = 'particle-burst-css';
      style.textContent = `
        @keyframes particleBurst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--vx), var(--vy)) scale(0);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Garantir que o CSS do ripple existe
  ensureRippleCSS() {
    if (!document.getElementById('ripple-effect-css')) {
      const style = document.createElement('style');
      style.id = 'ripple-effect-css';
      style.textContent = `
        @keyframes rippleEffect {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Garantir que o CSS do bounce existe
  ensureBounceCSS() {
    if (!document.getElementById('bounce-effect-css')) {
      const style = document.createElement('style');
      style.id = 'bounce-effect-css';
      style.textContent = `
        @keyframes bounceEffect {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(calc(1 + var(--bounce-intensity))); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Ativar/desativar efeitos
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// Instância global
export const gameFeelEffects = new GameFeelEffects();

// Funções de conveniência
export const screenShake = (element, intensity, duration) => 
  gameFeelEffects.screenShake(element, intensity, duration);
export const particleBurst = (x, y, color, count) => 
  gameFeelEffects.createParticleBurst(x, y, color, count);
export const rippleEffect = (element, x, y, color) => 
  gameFeelEffects.createRipple(element, x, y, color);
export const glowEffect = (element, color, duration) => 
  gameFeelEffects.addGlowEffect(element, color, duration);
export const pulseEffect = (element, scale, duration) => 
  gameFeelEffects.pulseEffect(element, scale, duration);
export const floatUpEffect = (element, distance, duration) => 
  gameFeelEffects.floatUpEffect(element, distance, duration);
export const bounceEffect = (element, intensity, duration) => 
  gameFeelEffects.bounceEffect(element, intensity, duration);
export const colorFlash = (element, color, duration) => 
  gameFeelEffects.colorFlash(element, color, duration);
