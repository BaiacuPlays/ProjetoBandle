import { useRef, useEffect, useState, useCallback } from 'react';
import { audioCache } from '../utils/audioCache';

const OptimizedAudioPlayer = ({ 
  src, 
  onLoadedMetadata, 
  onError, 
  onCanPlay, 
  onEnded,
  volume = 1,
  crossOrigin = "anonymous",
  style = { display: 'none' }
}) => {
  const audioRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Função otimizada para carregar áudio
  const loadAudio = useCallback(async (audioUrl) => {
    if (!audioUrl || !audioRef.current) return;

    setIsLoading(true);
    setRetryCount(0);

    try {
      // Verificar se o áudio está em cache
      const cachedAudio = audioCache.get(audioUrl);
      
      if (cachedAudio) {
        // Usar áudio do cache
        const audio = audioRef.current;
        audio.src = audioUrl;
        audio.volume = volume;
        
        // Disparar eventos manualmente para compatibilidade
        if (onLoadedMetadata) {
          setTimeout(() => onLoadedMetadata(), 0);
        }
        if (onCanPlay) {
          setTimeout(() => onCanPlay(), 0);
        }
        
        setIsLoading(false);
        return;
      }

      // Verificar disponibilidade primeiro
      const isAvailable = await audioCache.checkAvailability(audioUrl);
      
      if (!isAvailable) {
        throw new Error('Áudio não disponível');
      }

      // Carregar áudio normalmente
      const audio = audioRef.current;
      audio.src = audioUrl;
      audio.volume = volume;
      audio.load();

    } catch (error) {
      console.error('Erro ao carregar áudio otimizado:', error);
      if (onError) {
        onError({ target: { error: { code: 2, message: error.message } } });
      }
      setIsLoading(false);
    }
  }, [volume, onLoadedMetadata, onCanPlay, onError]);

  // Função de retry com backoff exponencial
  const retryLoad = useCallback(() => {
    if (retryCount < maxRetries && src) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        loadAudio(src);
      }, delay);
    }
  }, [retryCount, maxRetries, src, loadAudio]);

  // Carregar áudio quando src muda
  useEffect(() => {
    if (src) {
      loadAudio(src);
    }
  }, [src, loadAudio]);

  // Atualizar volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handlers otimizados
  const handleLoadedMetadata = useCallback((e) => {
    setIsLoading(false);
    setRetryCount(0);
    
    // Adicionar ao cache
    if (src) {
      audioCache.set(src, audioRef.current);
    }
    
    if (onLoadedMetadata) {
      onLoadedMetadata(e);
    }
  }, [src, onLoadedMetadata]);

  const handleError = useCallback((e) => {
    console.error('Erro no áudio otimizado:', e.target.error);
    setIsLoading(false);
    
    // Tentar novamente se não excedeu o limite
    if (retryCount < maxRetries) {
      retryLoad();
    } else if (onError) {
      onError(e);
    }
  }, [retryCount, maxRetries, retryLoad, onError]);

  const handleCanPlay = useCallback((e) => {
    setIsLoading(false);
    if (onCanPlay) {
      onCanPlay(e);
    }
  }, [onCanPlay]);

  return (
    <audio
      ref={audioRef}
      style={style}
      preload="metadata"
      crossOrigin={crossOrigin}
      onLoadedMetadata={handleLoadedMetadata}
      onError={handleError}
      onCanPlay={handleCanPlay}
      onEnded={onEnded}
    />
  );
};

export default OptimizedAudioPlayer;
