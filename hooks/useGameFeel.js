// 🎮 Hook para integrar todos os efeitos de game feel
import { useCallback, useRef } from 'react';
import { 
  playHoverSound, 
  playClickSound, 
  playErrorSound, 
  playTypingSound, 
  playSkipSound, 
  playLoadingSound,
  playNotificationSound,
  playSuccessSound,
  playPerfectSound,
  playFirstTrySound
} from '../utils/soundEffects';
import { 
  hapticLight, 
  hapticMedium, 
  hapticStrong, 
  hapticError, 
  hapticSuccess, 
  hapticPerfect, 
  hapticFirstTry,
  hapticNotification,
  hapticLoading,
  hapticSkip
} from '../utils/hapticFeedback';
import { 
  screenShake, 
  particleBurst, 
  rippleEffect, 
  glowEffect, 
  pulseEffect, 
  floatUpEffect, 
  bounceEffect, 
  colorFlash 
} from '../utils/gameFeelEffects';

export const useGameFeel = () => {
  const lastFeedbackTime = useRef(0);

  // Debounce para evitar spam de efeitos
  const debounce = useCallback((fn, delay = 100) => {
    const now = Date.now();
    if (now - lastFeedbackTime.current > delay) {
      lastFeedbackTime.current = now;
      fn();
    }
  }, []);

  // 🎯 FEEDBACK PARA HOVER
  const onHover = useCallback((element) => {
    debounce(() => {
      playHoverSound();
      hapticLight();
      if (element) {
        pulseEffect(element, 1.05, 150);
      }
    }, 50);
  }, [debounce]);

  // 🎯 FEEDBACK PARA CLICK
  const onClick = useCallback((element, event) => {
    playClickSound();
    hapticMedium();
    
    if (element && event) {
      const rect = element.getBoundingClientRect();
      const x = event.clientX;
      const y = event.clientY;
      rippleEffect(element, x, y);
      bounceEffect(element, 0.1, 200);
    }
  }, []);

  // 🎯 FEEDBACK PARA ERRO
  const onError = useCallback((element) => {
    playErrorSound();
    hapticError();
    
    if (element) {
      screenShake(element, 3, 300);
      colorFlash(element, '#e74c3c', 200);
    }
  }, []);

  // 🎯 FEEDBACK PARA SUCESSO
  const onSuccess = useCallback((element, attempt = 1) => {
    if (attempt === 1) {
      playFirstTrySound();
      hapticFirstTry();
    } else {
      playSuccessSound();
      hapticSuccess();
    }

    if (element) {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      particleBurst(centerX, centerY, '#27ae60', 12);
      glowEffect(element, '#27ae60', 1000);
      floatUpEffect(element, 10, 400);
    }
  }, []);

  // 🎯 FEEDBACK PARA ACERTO PERFEITO
  const onPerfect = useCallback((element) => {
    playPerfectSound();
    hapticPerfect();

    if (element) {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Múltiplas explosões de partículas
      setTimeout(() => particleBurst(centerX, centerY, '#FFD700', 15), 0);
      setTimeout(() => particleBurst(centerX, centerY, '#1DB954', 12), 200);
      setTimeout(() => particleBurst(centerX, centerY, '#FF6B6B', 10), 400);
      
      glowEffect(element, '#FFD700', 1500);
      screenShake(document.body, 2, 200);
    }
  }, []);

  // 🎯 FEEDBACK PARA DIGITAÇÃO
  const onTyping = useCallback(() => {
    debounce(() => {
      playTypingSound();
    }, 100);
  }, [debounce]);

  // 🎯 FEEDBACK PARA SKIP
  const onSkip = useCallback((element) => {
    playSkipSound();
    hapticSkip();
    
    if (element) {
      colorFlash(element, '#ff9800', 300);
      floatUpEffect(element, 15, 300);
    }
  }, []);

  // 🎯 FEEDBACK PARA CARREGAMENTO
  const onLoading = useCallback((element) => {
    playLoadingSound();
    hapticLoading();
    
    if (element) {
      pulseEffect(element, 1.1, 500);
    }
  }, []);

  // 🎯 FEEDBACK PARA NOTIFICAÇÃO
  const onNotification = useCallback((element) => {
    playNotificationSound();
    hapticNotification();
    
    if (element) {
      bounceEffect(element, 0.15, 400);
      glowEffect(element, '#1DB954', 800);
    }
  }, []);

  // 🎯 FEEDBACK PARA ACERTO DE JOGO (AMARELO)
  const onGameMatch = useCallback((element) => {
    playClickSound();
    hapticMedium();
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      particleBurst(centerX, centerY, '#ffd700', 8);
      glowEffect(element, '#ffd700', 600);
    }
  }, []);

  // 🎯 FEEDBACK PARA ACERTO DE FRANQUIA (LARANJA)
  const onFranchiseMatch = useCallback((element) => {
    playClickSound();
    hapticMedium();
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      particleBurst(centerX, centerY, '#ff9800', 6);
      glowEffect(element, '#ff9800', 500);
    }
  }, []);

  // 🎯 FEEDBACK PARA FOCUS EM INPUT
  const onFocus = useCallback((element) => {
    hapticLight();
    
    if (element) {
      glowEffect(element, '#1DB954', 300);
    }
  }, []);

  // 🎯 FEEDBACK PARA BLUR EM INPUT
  const onBlur = useCallback((element) => {
    if (element) {
      element.style.boxShadow = '';
    }
  }, []);

  // 🎯 FEEDBACK PARA ACHIEVEMENT
  const onAchievement = useCallback((element) => {
    playPerfectSound();
    hapticPerfect();
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Explosão especial para achievements
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          particleBurst(centerX, centerY, '#FFD700', 20);
        }, i * 150);
      }
      
      screenShake(document.body, 4, 500);
      glowEffect(element, '#FFD700', 2000);
    }
  }, []);

  return {
    // Eventos básicos
    onHover,
    onClick,
    onError,
    onSuccess,
    onPerfect,
    onTyping,
    onSkip,
    onLoading,
    onNotification,
    onFocus,
    onBlur,
    onAchievement,
    
    // Eventos específicos do jogo
    onGameMatch,
    onFranchiseMatch,
    
    // Efeitos diretos (para uso manual)
    effects: {
      screenShake,
      particleBurst,
      rippleEffect,
      glowEffect,
      pulseEffect,
      floatUpEffect,
      bounceEffect,
      colorFlash
    }
  };
};
