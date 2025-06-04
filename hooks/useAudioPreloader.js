import { useEffect, useCallback, useRef } from 'react';
import { audioCache, smartPreloader } from '../utils/audioCache';

export const useAudioPreloader = (currentSong, gameMode, allSongs) => {
  const preloadedRef = useRef(new Set());
  const lastSongRef = useRef(null);

  // Verificar se estamos no cliente
  const isClient = typeof window !== 'undefined';

  // Preload da música atual com prioridade máxima
  const preloadCurrentSong = useCallback(async (song) => {
    if (!isClient || !song?.audioUrl) return;

    try {
      // Preload imediato da música atual
      await audioCache.preload(song.audioUrl, true);

      // Registrar uso para o sistema inteligente
      if (song.id) {
        smartPreloader.registerUsage(song.id, gameMode);
      }
    } catch (error) {
      console.warn('Erro no preload da música atual:', error);
    }
  }, [gameMode, isClient]);

  // Preload inteligente de próximas músicas
  const preloadNextSongs = useCallback(async (currentSong, mode, songs) => {
    if (!isClient || !currentSong?.id || !songs) return;

    try {
      // Usar sistema inteligente para prever próximas músicas
      await smartPreloader.preloadPredicted(currentSong.id, mode, songs);
    } catch (error) {
      console.warn('Erro no preload inteligente:', error);
    }
  }, [isClient]);

  // Preload de músicas relacionadas (mesmo jogo/franquia)
  const preloadRelatedSongs = useCallback(async (currentSong, songs) => {
    if (!currentSong || !songs) return;
    
    try {
      // Músicas do mesmo jogo
      const sameGameSongs = songs
        .filter(song => 
          song.game === currentSong.game && 
          song.id !== currentSong.id &&
          song.audioUrl &&
          !preloadedRef.current.has(song.audioUrl)
        )
        .slice(0, 3);

      // Músicas da mesma franquia
      const sameFranchiseSongs = songs
        .filter(song => 
          song.franchise === currentSong.franchise && 
          song.game !== currentSong.game &&
          song.audioUrl &&
          !preloadedRef.current.has(song.audioUrl)
        )
        .slice(0, 2);

      // Preload em background
      const toPreload = [...sameGameSongs, ...sameFranchiseSongs];
      
      for (const song of toPreload) {
        audioCache.preload(song.audioUrl);
        preloadedRef.current.add(song.audioUrl);
      }
    } catch (error) {
      console.warn('Erro no preload de músicas relacionadas:', error);
    }
  }, []);

  // Preload agressivo baseado em modo de jogo
  const preloadByGameMode = useCallback(async (mode, songs) => {
    if (!songs) return;
    
    try {
      let songsToPreload = [];
      
      switch (mode) {
        case 'daily':
          // No modo diário, preload de músicas populares
          songsToPreload = songs
            .filter(song => song.audioUrl)
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);
          break;
          
        case 'infinite':
          // No modo infinito, preload mais agressivo
          songsToPreload = songs
            .filter(song => song.audioUrl)
            .sort(() => Math.random() - 0.5)
            .slice(0, 8);
          break;
          
        case 'multiplayer':
          // No multiplayer, preload de músicas populares
          songsToPreload = songs
            .filter(song => song.audioUrl)
            .sort(() => Math.random() - 0.5)
            .slice(0, 6);
          break;
          
        default:
          songsToPreload = songs
            .filter(song => song.audioUrl)
            .slice(0, 3);
      }
      
      // Preload em background
      for (const song of songsToPreload) {
        if (!preloadedRef.current.has(song.audioUrl)) {
          audioCache.preload(song.audioUrl);
          preloadedRef.current.add(song.audioUrl);
        }
      }
    } catch (error) {
      console.warn('Erro no preload por modo de jogo:', error);
    }
  }, []);

  // Limpar cache de URLs preloadadas quando necessário
  const clearPreloadedCache = useCallback(() => {
    preloadedRef.current.clear();
  }, []);

  // Efeito principal para preload da música atual
  useEffect(() => {
    if (currentSong && currentSong !== lastSongRef.current) {
      preloadCurrentSong(currentSong);
      lastSongRef.current = currentSong;
    }
  }, [currentSong, preloadCurrentSong]);

  // Efeito para preload inteligente
  useEffect(() => {
    if (currentSong && allSongs) {
      // Delay para não interferir com o carregamento da música atual
      const timer = setTimeout(() => {
        preloadNextSongs(currentSong, gameMode, allSongs);
        preloadRelatedSongs(currentSong, allSongs);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentSong, gameMode, allSongs, preloadNextSongs, preloadRelatedSongs]);

  // Efeito para preload baseado no modo de jogo
  useEffect(() => {
    if (gameMode && allSongs) {
      // Delay maior para preload de background
      const timer = setTimeout(() => {
        preloadByGameMode(gameMode, allSongs);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [gameMode, allSongs, preloadByGameMode]);

  // Função para forçar preload de uma música específica
  const forcePreload = useCallback(async (song) => {
    if (!isClient || !song?.audioUrl) return false;

    try {
      await audioCache.preload(song.audioUrl, true);
      preloadedRef.current.add(song.audioUrl);
      return true;
    } catch (error) {
      console.warn('Erro no preload forçado:', error);
      return false;
    }
  }, [isClient]);

  // Função para verificar se uma música está em cache
  const isInCache = useCallback((song) => {
    if (!isClient || !song?.audioUrl) return false;
    return audioCache.has(song.audioUrl);
  }, [isClient]);

  // Função para obter estatísticas do cache
  const getCacheStats = useCallback(() => {
    if (!isClient) return { size: 0, maxSize: 0, preloadQueue: 0, isPreloading: false, urls: [], preloadedUrls: [] };
    return {
      ...audioCache.getStats(),
      preloadedUrls: Array.from(preloadedRef.current)
    };
  }, [isClient]);

  // Função para reprodução instantânea
  const playInstant = useCallback(async (song) => {
    if (!isClient || !song?.audioUrl) return null;

    try {
      return await audioCache.playInstant(song.audioUrl);
    } catch (error) {
      console.warn('Erro na reprodução instantânea:', error);
      return null;
    }
  }, [isClient]);

  return {
    preloadCurrentSong,
    preloadNextSongs,
    preloadRelatedSongs,
    forcePreload,
    isInCache,
    getCacheStats,
    clearPreloadedCache,
    playInstant
  };
};

// Hook simplificado para uso básico
export const useSimpleAudioPreloader = (audioUrl) => {
  const preloadedRef = useRef(false);

  useEffect(() => {
    if (audioUrl && !preloadedRef.current) {
      audioCache.preload(audioUrl, true);
      preloadedRef.current = true;
    }
  }, [audioUrl]);

  const isReady = useCallback(() => {
    return audioCache.has(audioUrl);
  }, [audioUrl]);

  const playInstant = useCallback(async () => {
    if (!audioUrl) return null;
    return await audioCache.playInstant(audioUrl);
  }, [audioUrl]);

  return { isReady, playInstant };
};
