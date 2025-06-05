import { useState, useCallback, useRef, useEffect } from 'react';
import { AUDIO_CONFIG, ERROR_MESSAGES } from '../config/audioConfig';

/**
 * Hook otimizado para gerenciar o estado e comportamento do botão play
 * Foca em responsividade e feedback visual instantâneo
 */
export const useOptimizedPlayButton = (audioRef, browserCompatibility) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs para controle de timeouts
  const safetyTimeoutRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const playPromiseRef = useRef(null);
  
  // Configuração otimizada baseada no dispositivo
  const config = AUDIO_CONFIG.getOptimizedConfig();
  
  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);
  
  // Função para resetar estados
  const resetStates = useCallback(() => {
    setIsLoading(false);
    setIsDisabled(false);
    setError(null);
    
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  }, []);
  
  // Função para definir erro com timeout automático
  const setErrorWithTimeout = useCallback((errorMessage, duration = ERROR_MESSAGES.DISPLAY_DURATION.SHORT) => {
    setError(errorMessage);
    setTimeout(() => setError(null), duration);
  }, []);
  
  // Função principal de play/pause otimizada
  const handlePlayPause = useCallback(async (additionalChecks = () => true) => {
    // Verificações básicas
    if (!audioRef.current || isDisabled) {
      return false;
    }
    
    // Verificações adicionais (passadas como parâmetro)
    if (!additionalChecks()) {
      return false;
    }
    
    try {
      // Se está tocando, pausar imediatamente
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        resetStates();
        return true;
      }
      
      // Feedback visual instantâneo para play
      setIsLoading(true);
      
      // Timeout de segurança
      safetyTimeoutRef.current = setTimeout(() => {
        resetStates();
        setErrorWithTimeout(ERROR_MESSAGES.TIMEOUT);
      }, config.SAFETY_TIMEOUT);
      
      // Cancelar promise anterior se existir
      if (playPromiseRef.current) {
        try {
          playPromiseRef.current.catch(() => {}); // Silenciar erros
        } catch (e) {}
      }
      
      // Tentar reprodução
      let playPromise;
      
      if (audioRef.current.readyState >= 2) {
        // Áudio pronto - reprodução instantânea
        playPromise = browserCompatibility.playAudioInstant 
          ? browserCompatibility.playAudioInstant(audioRef.current)
          : audioRef.current.play();
      } else {
        // Áudio não pronto - método normal
        playPromise = browserCompatibility.playAudio 
          ? browserCompatibility.playAudio(audioRef.current)
          : audioRef.current.play();
      }
      
      playPromiseRef.current = playPromise;
      
      if (playPromise !== undefined) {
        await playPromise;
      }
      
      // Sucesso
      setIsPlaying(true);
      resetStates();
      return true;
      
    } catch (error) {
      resetStates();
      
      // Tratamento específico de erros
      if (error.name === 'AbortError') {
        return false; // Usuário cancelou, não mostrar erro
      }
      
      if (error.name === 'NotAllowedError') {
        setErrorWithTimeout(ERROR_MESSAGES.PERMISSION);
        return false;
      }
      
      if (error.message?.includes('network')) {
        setErrorWithTimeout(ERROR_MESSAGES.NETWORK);
      } else if (error.message?.includes('format') || error.message?.includes('suportado')) {
        setErrorWithTimeout(ERROR_MESSAGES.FORMAT);
      } else {
        setErrorWithTimeout(ERROR_MESSAGES.GENERIC);
      }
      
      return false;
    }
  }, [isPlaying, isDisabled, audioRef, browserCompatibility, config, resetStates, setErrorWithTimeout]);
  
  // Função para sincronizar estado com o elemento audio
  const syncWithAudioElement = useCallback(() => {
    if (audioRef.current) {
      const audioIsPlaying = !audioRef.current.paused && !audioRef.current.ended;
      if (audioIsPlaying !== isPlaying) {
        setIsPlaying(audioIsPlaying);
      }
    }
  }, [audioRef, isPlaying]);
  
  // Função para forçar pausa
  const forcePause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      resetStates();
    }
  }, [audioRef, resetStates]);
  
  // Função para definir loading manualmente
  const setLoadingState = useCallback((loading) => {
    setIsLoading(loading);
    if (!loading) {
      resetStates();
    }
  }, [resetStates]);
  
  return {
    // Estados
    isPlaying,
    isLoading,
    isDisabled,
    error,
    
    // Funções principais
    handlePlayPause,
    forcePause,
    syncWithAudioElement,
    
    // Funções de controle
    setLoadingState,
    setErrorWithTimeout,
    resetStates,
    
    // Configuração
    config
  };
};

export default useOptimizedPlayButton;
