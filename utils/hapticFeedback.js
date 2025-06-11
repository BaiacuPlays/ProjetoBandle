// 📱 Sistema de Haptic Feedback para dispositivos móveis
export class HapticFeedback {
  constructor() {
    this.isSupported = this.checkSupport();
    this.enabled = true;
    this.loadSettings();
  }

  // Verificar se o dispositivo suporta haptic feedback
  checkSupport() {
    return (
      typeof window !== 'undefined' &&
      'navigator' in window &&
      ('vibrate' in navigator || 'webkitVibrate' in navigator)
    );
  }

  // Carregar configurações do usuário
  loadSettings() {
    try {
      if (typeof window !== 'undefined') {
        const savedSettings = localStorage.getItem('bandle_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          this.enabled = settings.haptic !== false;
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações de haptic:', error);
    }
  }

  // Verificar se está habilitado
  isEnabled() {
    this.loadSettings();
    return this.enabled && this.isSupported;
  }

  // Vibração básica
  vibrate(pattern) {
    if (!this.isEnabled()) return;

    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      } else if (navigator.webkitVibrate) {
        navigator.webkitVibrate(pattern);
      }
    } catch (error) {
      console.warn('Erro ao executar haptic feedback:', error);
    }
  }

  // 🎮 PADRÕES DE VIBRAÇÃO PARA GAME FEEL

  // Feedback leve para hover/focus
  light() {
    this.vibrate(10);
  }

  // Feedback médio para cliques
  medium() {
    this.vibrate(25);
  }

  // Feedback forte para sucessos
  strong() {
    this.vibrate(50);
  }

  // Feedback de erro - padrão duplo
  error() {
    this.vibrate([30, 50, 30]);
  }

  // Feedback de sucesso - padrão crescente
  success() {
    this.vibrate([20, 30, 40]);
  }

  // Feedback de acerto perfeito - padrão especial
  perfect() {
    this.vibrate([50, 100, 50, 100, 100]);
  }

  // Feedback de primeira tentativa - padrão único
  firstTry() {
    this.vibrate([30, 50, 30, 50, 30, 100]);
  }

  // Feedback de notificação
  notification() {
    this.vibrate([20, 50, 20]);
  }

  // Feedback de carregamento - pulso suave
  loading() {
    this.vibrate([15, 30, 15]);
  }

  // Feedback de skip - slide
  skip() {
    this.vibrate([40, 20, 20]);
  }

  // Ativar/desativar haptic feedback
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// Instância global
export const hapticFeedback = new HapticFeedback();

// Funções de conveniência
export const hapticLight = () => hapticFeedback.light();
export const hapticMedium = () => hapticFeedback.medium();
export const hapticStrong = () => hapticFeedback.strong();
export const hapticError = () => hapticFeedback.error();
export const hapticSuccess = () => hapticFeedback.success();
export const hapticPerfect = () => hapticFeedback.perfect();
export const hapticFirstTry = () => hapticFeedback.firstTry();
export const hapticNotification = () => hapticFeedback.notification();
export const hapticLoading = () => hapticFeedback.loading();
export const hapticSkip = () => hapticFeedback.skip();
