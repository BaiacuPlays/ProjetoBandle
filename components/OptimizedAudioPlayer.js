import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { audioCache } from '../utils/audioCache';

const OptimizedAudioPlayer = ({
  src,
  onLoadedMetadata,
  onCanPlay,
  onError,
  onEnded,
  onTimeUpdate,
  volume = 1,
  autoPlay = false,
  preload = 'auto',
  className,
  style = { display: 'none' },
  ...props
}) => {
  const audioRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Configurar áudio otimizado
  const configureAudio = useCallback((audio) => {
    if (!audio) return;
    
    audio.preload = preload;
    audio.crossOrigin = 'anonymous';
    audio.playsInline = true;
    audio.volume = volume;
    
    // Remover listeners antigos
    audio.onloadedmetadata = null;
    audio.oncanplay = null;
    audio.onerror = null;
    audio.onended = null;
    audio.ontimeupdate = null;
    
    // Adicionar novos listeners
    audio.onloadedmetadata = (e) => {
      setIsReady(true);
      setError(null);
      onLoadedMetadata?.(e);
    };
    
    audio.oncanplay = (e) => {
      setIsReady(true);
      setError(null);
      onCanPlay?.(e);
    };
    
    audio.onerror = (e) => {
      setError(e.target.error);
      setIsReady(false);
      onError?.(e);
    };
    
    audio.onended = (e) => {
      onEnded?.(e);
    };
    
    audio.ontimeupdate = (e) => {
      onTimeUpdate?.(e);
    };
  }, [volume, preload, onLoadedMetadata, onCanPlay, onError, onEnded, onTimeUpdate]);

  // Carregar áudio do cache ou criar novo
  const loadAudio = useCallback(async (url) => {
    if (!url) return;
    
    try {
      setError(null);
      setIsReady(false);
      
      // Tentar obter do cache primeiro
      let cachedAudio = audioCache.get(url);
      
      if (cachedAudio) {
        // Usar áudio do cache
        audioRef.current = cachedAudio;
        configureAudio(cachedAudio);
        
        // Se já está pronto, disparar eventos
        if (cachedAudio.readyState >= 2) {
          setIsReady(true);
          onLoadedMetadata?.({ target: cachedAudio });
          onCanPlay?.({ target: cachedAudio });
        }
      } else {
        // Criar novo áudio e adicionar ao cache
        const audio = new Audio();
        audioRef.current = audio;
        configureAudio(audio);
        
        // Preload imediato para reprodução instantânea
        audio.src = url;
        audioCache.set(url, audio);
      }
      
      // Auto-play se solicitado
      if (autoPlay && audioRef.current) {
        try {
          await audioRef.current.play();
        } catch (playError) {
          console.warn('Auto-play falhou:', playError);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar áudio:', error);
      setError(error);
    }
  }, [configureAudio, autoPlay, onLoadedMetadata, onCanPlay]);

  // Efeito para carregar áudio quando src muda
  useEffect(() => {
    if (src) {
      loadAudio(src);
    }
    
    return () => {
      // Cleanup - não remover do cache, apenas limpar referência
      if (audioRef.current) {
        audioRef.current.onloadedmetadata = null;
        audioRef.current.oncanplay = null;
        audioRef.current.onerror = null;
        audioRef.current.onended = null;
        audioRef.current.ontimeupdate = null;
      }
    };
  }, [src, loadAudio]);

  // Métodos públicos para controle do áudio
  const play = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      console.error('Erro ao reproduzir:', error);
      throw error;
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const setCurrentTime = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((vol) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  }, []);

  // Propriedades computadas
  const audioProperties = useMemo(() => {
    if (!audioRef.current) return {};
    
    return {
      duration: audioRef.current.duration || 0,
      currentTime: audioRef.current.currentTime || 0,
      paused: audioRef.current.paused,
      ended: audioRef.current.ended,
      readyState: audioRef.current.readyState,
      volume: audioRef.current.volume
    };
  }, [isReady]);

  // Expor métodos através de ref
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.optimizedPlay = play;
      audioRef.current.optimizedPause = pause;
      audioRef.current.optimizedSetCurrentTime = setCurrentTime;
      audioRef.current.optimizedSetVolume = setVolume;
      audioRef.current.optimizedProperties = audioProperties;
    }
  }, [play, pause, setCurrentTime, setVolume, audioProperties]);

  // Renderizar elemento de áudio invisível (para compatibilidade)
  return (
    <audio
      ref={audioRef}
      className={className}
      style={style}
      {...props}
    />
  );
};

// Hook para usar o player otimizado
export const useOptimizedAudio = (src, options = {}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoadedMetadata = useCallback((e) => {
    setDuration(e.target.duration || 0);
    setIsLoading(false);
    options.onLoadedMetadata?.(e);
  }, [options]);

  const handleCanPlay = useCallback((e) => {
    setIsLoading(false);
    options.onCanPlay?.(e);
  }, [options]);

  const handleError = useCallback((e) => {
    setError(e.target.error);
    setIsLoading(false);
    setIsPlaying(false);
    options.onError?.(e);
  }, [options]);

  const handleTimeUpdate = useCallback((e) => {
    setCurrentTime(e.target.currentTime || 0);
    options.onTimeUpdate?.(e);
  }, [options]);

  const handleEnded = useCallback((e) => {
    setIsPlaying(false);
    options.onEnded?.(e);
  }, [options]);

  const play = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      setIsLoading(true);
      await audioRef.current.optimizedPlay();
      setIsPlaying(true);
      setError(null);
    } catch (error) {
      setError(error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.optimizedPause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.optimizedSetCurrentTime(time);
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((volume) => {
    if (audioRef.current) {
      audioRef.current.optimizedSetVolume(volume);
    }
  }, []);

  return {
    audioRef,
    isPlaying,
    duration,
    currentTime,
    isLoading,
    error,
    play,
    pause,
    seek,
    setVolume,
    AudioComponent: (props) => (
      <OptimizedAudioPlayer
        ref={audioRef}
        src={src}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        {...options}
        {...props}
      />
    )
  };
};

export default OptimizedAudioPlayer;
