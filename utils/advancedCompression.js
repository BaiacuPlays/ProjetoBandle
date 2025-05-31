// Sistema de Compressão Avançada para LudoMusic
// Compressão inteligente baseada em contexto e qualidade adaptativa

class AdvancedCompressionSystem {
  constructor() {
    this.compressionWorkers = [];
    this.compressionQueue = [];
    this.isProcessing = false;
    this.compressionStats = {
      totalCompressed: 0,
      totalSaved: 0,
      averageRatio: 0
    };
    this.qualityProfiles = this.initializeQualityProfiles();
    this.initializeWorkers();
  }

  // Perfis de qualidade para diferentes cenários
  initializeQualityProfiles() {
    return {
      // Ultra alta qualidade para primeira reprodução
      ultra: {
        bitrate: 320,
        quality: 0.95,
        sampleRate: 44100,
        channels: 2,
        useCase: 'first_play'
      },

      // Alta qualidade para reproduções frequentes
      high: {
        bitrate: 256,
        quality: 0.85,
        sampleRate: 44100,
        channels: 2,
        useCase: 'frequent_play'
      },

      // Qualidade média para preload
      medium: {
        bitrate: 192,
        quality: 0.75,
        sampleRate: 44100,
        channels: 2,
        useCase: 'preload'
      },

      // Baixa qualidade para preview
      low: {
        bitrate: 128,
        quality: 0.6,
        sampleRate: 22050,
        channels: 1,
        useCase: 'preview'
      },

      // Qualidade mínima para conexões lentas
      minimal: {
        bitrate: 96,
        quality: 0.5,
        sampleRate: 22050,
        channels: 1,
        useCase: 'slow_connection'
      }
    };
  }

  // Inicializar workers de compressão
  initializeWorkers() {
    // Verificar se está no browser
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    const workerCount = Math.min((navigator.hardwareConcurrency || 2), 4);

    for (let i = 0; i < workerCount; i++) {
      this.createCompressionWorker(i);
    }
  }

  createCompressionWorker(id) {
    // Verificar se Worker está disponível
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers não disponíveis');
      return;
    }

    const workerCode = `
      // Worker de compressão avançada
      class AudioCompressor {
        constructor() {
          this.algorithms = {
            'mp3': this.compressMp3.bind(this),
            'ogg': this.compressOgg.bind(this),
            'wav': this.compressWav.bind(this),
            'aac': this.compressAac.bind(this)
          };
        }

        async compress(audioData, options) {
          const { format, quality, bitrate, sampleRate, channels } = options;

          try {
            const compressor = this.algorithms[format] || this.algorithms['mp3'];
            const result = await compressor(audioData, options);

            return {
              success: true,
              data: result.data,
              originalSize: audioData.byteLength,
              compressedSize: result.data.byteLength,
              compressionRatio: result.data.byteLength / audioData.byteLength,
              quality: options.quality,
              metadata: result.metadata
            };
          } catch (error) {
            return {
              success: false,
              error: error.message,
              originalSize: audioData.byteLength
            };
          }
        }

        async compressMp3(audioData, options) {
          // Simulação de compressão MP3 avançada
          const { quality, bitrate } = options;
          const targetRatio = this.calculateCompressionRatio(quality, bitrate);

          const compressed = await this.applyCompressionAlgorithm(audioData, targetRatio);

          return {
            data: compressed,
            metadata: {
              format: 'mp3',
              bitrate: bitrate,
              quality: quality,
              algorithm: 'advanced_mp3'
            }
          };
        }

        async compressOgg(audioData, options) {
          // Simulação de compressão OGG Vorbis
          const { quality } = options;
          const targetRatio = quality * 0.7; // OGG geralmente mais eficiente

          const compressed = await this.applyCompressionAlgorithm(audioData, targetRatio);

          return {
            data: compressed,
            metadata: {
              format: 'ogg',
              quality: quality,
              algorithm: 'vorbis'
            }
          };
        }

        async compressWav(audioData, options) {
          // Compressão WAV (principalmente redução de sample rate)
          const { sampleRate, channels } = options;
          const reductionFactor = (44100 / sampleRate) * (2 / channels);

          const compressed = await this.applyCompressionAlgorithm(audioData, 1 / reductionFactor);

          return {
            data: compressed,
            metadata: {
              format: 'wav',
              sampleRate: sampleRate,
              channels: channels,
              algorithm: 'pcm_reduction'
            }
          };
        }

        async compressAac(audioData, options) {
          // Simulação de compressão AAC
          const { quality, bitrate } = options;
          const targetRatio = this.calculateCompressionRatio(quality, bitrate) * 0.8; // AAC mais eficiente

          const compressed = await this.applyCompressionAlgorithm(audioData, targetRatio);

          return {
            data: compressed,
            metadata: {
              format: 'aac',
              bitrate: bitrate,
              quality: quality,
              algorithm: 'advanced_aac'
            }
          };
        }

        calculateCompressionRatio(quality, bitrate) {
          // Calcular ratio baseado na qualidade e bitrate
          const baseRatio = quality;
          const bitrateAdjustment = Math.min(bitrate / 320, 1);
          return baseRatio * bitrateAdjustment;
        }

        async applyCompressionAlgorithm(audioData, targetRatio) {
          // Algoritmo de compressão simulado
          const targetSize = Math.floor(audioData.byteLength * targetRatio);
          const compressed = new ArrayBuffer(targetSize);

          const sourceView = new Uint8Array(audioData);
          const targetView = new Uint8Array(compressed);

          // Aplicar compressão por amostragem inteligente
          const step = sourceView.length / targetSize;

          for (let i = 0; i < targetSize; i++) {
            const sourceIndex = Math.floor(i * step);

            // Aplicar filtro de suavização
            if (sourceIndex > 0 && sourceIndex < sourceView.length - 1) {
              const prev = sourceView[sourceIndex - 1];
              const curr = sourceView[sourceIndex];
              const next = sourceView[sourceIndex + 1];

              // Média ponderada para suavização
              targetView[i] = Math.floor((prev * 0.25 + curr * 0.5 + next * 0.25));
            } else {
              targetView[i] = sourceView[sourceIndex] || 0;
            }
          }

          return compressed;
        }
      }

      const compressor = new AudioCompressor();

      self.onmessage = async function(e) {
        const { id, audioData, options } = e.data;

        try {
          const result = await compressor.compress(audioData, options);
          self.postMessage({ id, ...result });
        } catch (error) {
          self.postMessage({
            id,
            success: false,
            error: error.message
          });
        }
      };
    `;

    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));

      worker.onmessage = (e) => this.handleWorkerMessage(e.data);
      worker.onerror = (error) => console.error(`Worker ${id} error:`, error);

      this.compressionWorkers.push({
        id,
        worker,
        busy: false
      });

    } catch (error) {
      console.warn(`Não foi possível criar worker ${id}:`, error);
    }
  }

  // Comprimir áudio com qualidade adaptativa
  async compressAudio(audioUrl, context = {}) {
    const profile = this.selectQualityProfile(context);
    const audioData = await this.fetchAudioData(audioUrl);

    if (!audioData) {
      throw new Error('Não foi possível carregar áudio para compressão');
    }

    return new Promise((resolve, reject) => {
      const compressionId = Date.now().toString(36) + Math.random().toString(36);

      this.compressionQueue.push({
        id: compressionId,
        audioData,
        options: {
          format: this.detectAudioFormat(audioUrl),
          ...profile
        },
        resolve,
        reject,
        timestamp: Date.now()
      });

      this.processQueue();
    });
  }

  // Selecionar perfil de qualidade baseado no contexto
  selectQualityProfile(context) {
    const {
      isFirstPlay = false,
      isFrequentlyPlayed = false,
      isPreload = false,
      isPreview = false,
      connectionSpeed = 'fast',
      deviceType = 'desktop'
    } = context;

    if (connectionSpeed === 'slow' || deviceType === 'mobile') {
      return this.qualityProfiles.minimal;
    }

    if (isPreview) {
      return this.qualityProfiles.low;
    }

    if (isPreload) {
      return this.qualityProfiles.medium;
    }

    if (isFrequentlyPlayed) {
      return this.qualityProfiles.high;
    }

    if (isFirstPlay) {
      return this.qualityProfiles.ultra;
    }

    return this.qualityProfiles.medium;
  }

  // Processar fila de compressão
  async processQueue() {
    if (this.isProcessing || this.compressionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.compressionQueue.length > 0) {
      const availableWorker = this.compressionWorkers.find(w => !w.busy);

      if (!availableWorker) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const task = this.compressionQueue.shift();
      availableWorker.busy = true;

      availableWorker.worker.postMessage({
        id: task.id,
        audioData: task.audioData,
        options: task.options
      });

      // Armazenar callback para este worker
      availableWorker.currentTask = task;
    }

    this.isProcessing = false;
  }

  // Manipular resposta do worker
  handleWorkerMessage(data) {
    const { id, success, error, ...result } = data;

    const worker = this.compressionWorkers.find(w =>
      w.currentTask && w.currentTask.id === id
    );

    if (!worker) return;

    const task = worker.currentTask;
    worker.busy = false;
    worker.currentTask = null;

    if (success) {
      // Atualizar estatísticas
      this.updateCompressionStats(result);
      task.resolve(result);
    } else {
      task.reject(new Error(error));
    }

    // Continuar processando fila
    this.processQueue();
  }

  // Buscar dados de áudio
  async fetchAudioData(audioUrl) {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error('Falha ao carregar áudio');
      return await response.arrayBuffer();
    } catch (error) {
      console.error('Erro ao buscar áudio:', error);
      return null;
    }
  }

  // Detectar formato de áudio
  detectAudioFormat(audioUrl) {
    const extension = audioUrl.split('.').pop().toLowerCase();
    const formatMap = {
      'mp3': 'mp3',
      'ogg': 'ogg',
      'wav': 'wav',
      'aac': 'aac',
      'm4a': 'aac'
    };
    return formatMap[extension] || 'mp3';
  }

  // Atualizar estatísticas de compressão
  updateCompressionStats(result) {
    this.compressionStats.totalCompressed++;
    this.compressionStats.totalSaved += (result.originalSize - result.compressedSize);

    const totalRatio = this.compressionStats.averageRatio * (this.compressionStats.totalCompressed - 1);
    this.compressionStats.averageRatio = (totalRatio + result.compressionRatio) / this.compressionStats.totalCompressed;
  }

  // Obter estatísticas
  getStats() {
    return {
      ...this.compressionStats,
      queueLength: this.compressionQueue.length,
      activeWorkers: this.compressionWorkers.filter(w => w.busy).length,
      totalWorkers: this.compressionWorkers.length
    };
  }

  // Limpeza
  destroy() {
    this.compressionWorkers.forEach(({ worker }) => {
      worker.terminate();
    });
    this.compressionWorkers = [];
    this.compressionQueue = [];
  }
}

// Instância global lazy
let advancedCompressionInstance = null;

const getAdvancedCompression = () => {
  if (!advancedCompressionInstance && typeof window !== 'undefined') {
    advancedCompressionInstance = new AdvancedCompressionSystem();
  }
  return advancedCompressionInstance;
};

export const advancedCompression = getAdvancedCompression();

// Hook para usar compressão avançada
export const useAdvancedCompression = () => {
  return getAdvancedCompression();
};
