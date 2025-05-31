import { useState, useEffect, useRef } from 'react';

// Hook para carregamento dinâmico das otimizações ultra-avançadas
export const useUltraAdvancedOptimizations = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [audioProcessor, setAudioProcessor] = useState(null);
  const [predictivePreloader, setPredictivePreloader] = useState(null);
  const [advancedCompression, setAdvancedCompression] = useState(null);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    // Só carregar no cliente
    if (typeof window === 'undefined' || loadingRef.current) {
      return;
    }

    loadingRef.current = true;

    const loadOptimizations = async () => {
      try {
        console.log('🚀 Carregando otimizações ultra-avançadas...');

        // Carregar módulos dinamicamente
        const [
          audioProcessorModule,
          predictivePreloaderModule,
          advancedCompressionModule
        ] = await Promise.all([
          import('../utils/audioProcessor.wasm').catch(err => {
            console.warn('AudioProcessor não disponível:', err);
            return null;
          }),
          import('../utils/predictivePreloader').catch(err => {
            console.warn('PredictivePreloader não disponível:', err);
            return null;
          }),
          import('../utils/advancedCompression').catch(err => {
            console.warn('AdvancedCompression não disponível:', err);
            return null;
          })
        ]);

        // Configurar instâncias
        if (audioProcessorModule?.useAudioProcessor) {
          const processor = audioProcessorModule.useAudioProcessor();
          setAudioProcessor(processor);
          console.log('✅ AudioProcessor carregado');
        }

        if (predictivePreloaderModule?.usePredictivePreloader) {
          const preloader = predictivePreloaderModule.usePredictivePreloader();
          setPredictivePreloader(preloader);
          console.log('✅ PredictivePreloader carregado');
        }

        if (advancedCompressionModule?.useAdvancedCompression) {
          const compression = advancedCompressionModule.useAdvancedCompression();
          setAdvancedCompression(compression);
          console.log('✅ AdvancedCompression carregado');
        }

        setIsLoaded(true);
        console.log('🎉 Todas as otimizações ultra-avançadas carregadas!');

      } catch (err) {
        console.error('❌ Erro ao carregar otimizações ultra-avançadas:', err);
        setError(err);
      } finally {
        loadingRef.current = false;
      }
    };

    // Carregar com delay para não bloquear o carregamento inicial
    const timer = setTimeout(loadOptimizations, 1000);

    return () => {
      clearTimeout(timer);
      loadingRef.current = false;
    };
  }, []);

  // Função para registrar interação do usuário (para ML)
  const recordUserInteraction = (data) => {
    if (predictivePreloader?.recordUserInteraction) {
      predictivePreloader.recordUserInteraction(data);
    }
  };

  // Função para prever próximas músicas
  const predictNextSongs = (currentContext, songsList, count = 5) => {
    if (predictivePreloader?.predictNextSongs) {
      return predictivePreloader.predictNextSongs(currentContext, songsList, count);
    }
    return [];
  };

  // Função para comprimir áudio
  const compressAudio = async (audioUrl, context = {}) => {
    if (advancedCompression?.compressAudio) {
      try {
        return await advancedCompression.compressAudio(audioUrl, context);
      } catch (error) {
        console.warn('Erro na compressão avançada:', error);
        return null;
      }
    }
    return null;
  };

  // Função para processar áudio com WASM
  const processAudio = async (audioBuffer, options = {}) => {
    if (audioProcessor?.compressAudio) {
      try {
        return await audioProcessor.compressAudio(audioBuffer, options);
      } catch (error) {
        console.warn('Erro no processamento WASM:', error);
        return audioBuffer; // Retornar original se falhar
      }
    }
    return audioBuffer;
  };

  // Função para obter estatísticas
  const getOptimizationStats = () => {
    const stats = {
      isLoaded,
      error: error?.message,
      modules: {
        audioProcessor: !!audioProcessor,
        predictivePreloader: !!predictivePreloader,
        advancedCompression: !!advancedCompression
      }
    };

    // Adicionar estatísticas específicas se disponíveis
    if (advancedCompression?.getStats) {
      stats.compression = advancedCompression.getStats();
    }

    if (audioProcessor?.isInitialized !== undefined) {
      stats.wasmInitialized = audioProcessor.isInitialized;
    }

    return stats;
  };

  // Função para preload inteligente
  const intelligentPreload = (currentSong, songsList) => {
    if (predictivePreloader?.preloadNext) {
      predictivePreloader.preloadNext(currentSong?.id, songsList);
    }
  };

  // Função para limpar recursos
  const cleanup = () => {
    if (audioProcessor?.destroy) {
      audioProcessor.destroy();
    }
    if (advancedCompression?.destroy) {
      advancedCompression.destroy();
    }
    if (predictivePreloader?.cleanup) {
      predictivePreloader.cleanup();
    }
  };

  return {
    // Estado
    isLoaded,
    error,
    
    // Instâncias
    audioProcessor,
    predictivePreloader,
    advancedCompression,
    
    // Funções
    recordUserInteraction,
    predictNextSongs,
    compressAudio,
    processAudio,
    getOptimizationStats,
    intelligentPreload,
    cleanup
  };
};

// Hook simplificado para verificar se as otimizações estão disponíveis
export const useOptimizationsStatus = () => {
  const [status, setStatus] = useState({
    webAssembly: false,
    webWorkers: false,
    serviceWorker: false,
    http3: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStatus = () => {
      setStatus({
        webAssembly: typeof WebAssembly !== 'undefined',
        webWorkers: typeof Worker !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
        http3: 'fetch' in window && 'Request' in window
      });
    };

    checkStatus();
  }, []);

  return status;
};

// Hook para monitoramento de performance em tempo real
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    audioLoadTime: 0,
    cacheHitRate: 0
  });

  const startTimer = (type) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        [type]: duration
      }));
      
      return duration;
    };
  };

  const recordMetric = (type, value) => {
    setMetrics(prev => ({
      ...prev,
      [type]: value
    }));
  };

  return {
    metrics,
    startTimer,
    recordMetric
  };
};
