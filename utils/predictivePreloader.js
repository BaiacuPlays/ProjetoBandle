// Sistema de Preload Preditivo com Machine Learning
// Analisa padrões de uso para prever próximas músicas

class PredictivePreloader {
  constructor() {
    this.userPatterns = new Map();
    this.gamePatterns = new Map();
    this.timePatterns = new Map();
    this.sessionData = [];
    this.mlModel = null;
    this.isTraining = false;
    this.predictionCache = new Map();
    this.initializeML();
  }

  // Inicializar modelo de ML simples
  initializeML() {
    // Modelo de regressão linear simples para predição
    this.mlModel = {
      weights: {
        timeOfDay: 0.3,
        gameFrequency: 0.4,
        sequencePattern: 0.2,
        userPreference: 0.1
      },

      // Função de predição
      predict: (features) => {
        let score = 0;
        for (const [feature, value] of Object.entries(features)) {
          score += (this.mlModel.weights[feature] || 0) * value;
        }
        return Math.max(0, Math.min(1, score));
      },

      // Atualizar pesos baseado no feedback
      updateWeights: (features, actualOutcome, learningRate = 0.01) => {
        const prediction = this.mlModel.predict(features);
        const error = actualOutcome - prediction;

        for (const [feature, value] of Object.entries(features)) {
          if (this.mlModel.weights[feature] !== undefined) {
            this.mlModel.weights[feature] += learningRate * error * value;
          }
        }
      }
    };
  }

  // Registrar interação do usuário
  recordUserInteraction(data) {
    const interaction = {
      timestamp: Date.now(),
      songId: data.songId,
      game: data.game,
      action: data.action, // 'play', 'skip', 'complete'
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      sessionId: this.getSessionId()
    };

    this.sessionData.push(interaction);
    this.updatePatterns(interaction);

    // Limitar dados da sessão
    if (this.sessionData.length > 100) {
      this.sessionData = this.sessionData.slice(-50);
    }
  }

  // Atualizar padrões de uso
  updatePatterns(interaction) {
    const { songId, game, timeOfDay, action } = interaction;

    // Padrões por usuário
    if (!this.userPatterns.has(songId)) {
      this.userPatterns.set(songId, { plays: 0, skips: 0, completes: 0 });
    }
    const userPattern = this.userPatterns.get(songId);
    userPattern[action === 'play' ? 'plays' : action === 'skip' ? 'skips' : 'completes']++;

    // Padrões por jogo
    if (!this.gamePatterns.has(game)) {
      this.gamePatterns.set(game, new Map());
    }
    const gamePattern = this.gamePatterns.get(game);
    if (!gamePattern.has(songId)) {
      gamePattern.set(songId, 0);
    }
    gamePattern.set(songId, gamePattern.get(songId) + 1);

    // Padrões por horário
    if (!this.timePatterns.has(timeOfDay)) {
      this.timePatterns.set(timeOfDay, new Map());
    }
    const timePattern = this.timePatterns.get(timeOfDay);
    if (!timePattern.has(songId)) {
      timePattern.set(songId, 0);
    }
    timePattern.set(songId, timePattern.get(songId) + 1);
  }

  // Prever próximas músicas
  predictNextSongs(currentContext, songsList, count = 5) {
    const cacheKey = `${currentContext.songId}-${currentContext.game}-${count}`;

    // Verificar cache de predições
    if (this.predictionCache.has(cacheKey)) {
      const cached = this.predictionCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // Cache por 1 minuto
        return cached.predictions;
      }
    }

    const predictions = [];
    const currentTime = new Date().getHours();

    for (const song of songsList) {
      if (song.id === currentContext.songId) continue;

      const features = this.extractFeatures(song, currentContext, currentTime);
      const score = this.mlModel.predict(features);

      predictions.push({
        song,
        score,
        confidence: this.calculateConfidence(features),
        reasons: this.explainPrediction(features)
      });
    }

    // Ordenar por score e pegar os top N
    predictions.sort((a, b) => b.score - a.score);
    const topPredictions = predictions.slice(0, count);

    // Cachear resultado
    this.predictionCache.set(cacheKey, {
      predictions: topPredictions,
      timestamp: Date.now()
    });

    return topPredictions;
  }

  // Extrair features para ML
  extractFeatures(song, currentContext, timeOfDay) {
    const features = {};

    // Feature: Horário do dia (normalizado 0-1)
    features.timeOfDay = this.getTimeOfDayScore(song.id, timeOfDay);

    // Feature: Frequência do jogo
    features.gameFrequency = this.getGameFrequencyScore(song.game, currentContext.game);

    // Feature: Padrão de sequência
    features.sequencePattern = this.getSequencePatternScore(song.id, currentContext.songId);

    // Feature: Preferência do usuário
    features.userPreference = this.getUserPreferenceScore(song.id);

    return features;
  }

  // Score baseado no horário
  getTimeOfDayScore(songId, timeOfDay) {
    const timePattern = this.timePatterns.get(timeOfDay);
    if (!timePattern || !timePattern.has(songId)) return 0.1;

    const songPlays = timePattern.get(songId);
    const totalPlays = Array.from(timePattern.values()).reduce((sum, plays) => sum + plays, 0);

    return totalPlays > 0 ? songPlays / totalPlays : 0.1;
  }

  // Score baseado na frequência do jogo
  getGameFrequencyScore(songGame, currentGame) {
    if (songGame === currentGame) return 1.0;

    const gamePattern = this.gamePatterns.get(currentGame);
    if (!gamePattern) return 0.2;

    // Verificar se jogos são relacionados (mesmo franchise, etc.)
    const similarity = this.calculateGameSimilarity(songGame, currentGame);
    return similarity;
  }

  // Score baseado em padrões de sequência
  getSequencePatternScore(songId, currentSongId) {
    // Analisar sequências históricas
    const sequences = this.findSequencePatterns(currentSongId);

    for (const sequence of sequences) {
      if (sequence.includes(songId)) {
        const position = sequence.indexOf(songId);
        const currentPosition = sequence.indexOf(currentSongId);

        if (position === currentPosition + 1) {
          return 0.9; // Próxima música na sequência
        }
      }
    }

    return 0.1;
  }

  // Score de preferência do usuário
  getUserPreferenceScore(songId) {
    const userPattern = this.userPatterns.get(songId);
    if (!userPattern) return 0.3;

    const { plays, skips, completes } = userPattern;
    const total = plays + skips + completes;

    if (total === 0) return 0.3;

    // Calcular score baseado em interações positivas
    const positiveScore = (plays + completes * 2) / (total + skips);
    return Math.max(0, Math.min(1, positiveScore));
  }

  // Encontrar padrões de sequência
  findSequencePatterns(currentSongId) {
    const sequences = [];
    const sessionSequences = this.extractSessionSequences();

    for (const sequence of sessionSequences) {
      if (sequence.includes(currentSongId)) {
        sequences.push(sequence);
      }
    }

    return sequences;
  }

  // Extrair sequências da sessão
  extractSessionSequences() {
    const sequences = [];
    let currentSequence = [];

    for (let i = 0; i < this.sessionData.length; i++) {
      const interaction = this.sessionData[i];

      if (interaction.action === 'play') {
        currentSequence.push(interaction.songId);
      } else if (interaction.action === 'skip' || interaction.action === 'complete') {
        if (currentSequence.length > 1) {
          sequences.push([...currentSequence]);
        }
        currentSequence = [];
      }
    }

    return sequences;
  }

  // Calcular similaridade entre jogos
  calculateGameSimilarity(game1, game2) {
    if (game1 === game2) return 1.0;

    // Lógica simples de similaridade (pode ser expandida)
    const game1Lower = game1.toLowerCase();
    const game2Lower = game2.toLowerCase();

    // Verificar palavras em comum
    const words1 = game1Lower.split(/\s+/);
    const words2 = game2Lower.split(/\s+/);

    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);

    return similarity;
  }

  // Calcular confiança da predição
  calculateConfidence(features) {
    const featureValues = Object.values(features);
    const variance = this.calculateVariance(featureValues);

    // Confiança inversamente proporcional à variância
    return Math.max(0.1, Math.min(1.0, 1 - variance));
  }

  // Explicar predição
  explainPrediction(features) {
    const reasons = [];

    if (features.timeOfDay > 0.7) {
      reasons.push('Frequentemente tocada neste horário');
    }

    if (features.gameFrequency > 0.8) {
      reasons.push('Mesmo jogo ou franchise');
    }

    if (features.sequencePattern > 0.8) {
      reasons.push('Padrão de sequência identificado');
    }

    if (features.userPreference > 0.7) {
      reasons.push('Alta preferência do usuário');
    }

    return reasons;
  }

  // Treinar modelo com feedback
  trainWithFeedback(predictedSong, actualSong, context) {
    if (this.isTraining) return;

    this.isTraining = true;

    try {
      const features = this.extractFeatures(predictedSong, context, new Date().getHours());
      const actualOutcome = predictedSong.id === actualSong.id ? 1 : 0;

      this.mlModel.updateWeights(features, actualOutcome);

      // Limpar cache de predições
      this.predictionCache.clear();

    } finally {
      this.isTraining = false;
    }
  }

  // Utilitários
  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    return this.sessionId;
  }

  // Limpar dados antigos
  cleanup() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    this.sessionData = this.sessionData.filter(
      interaction => interaction.timestamp > oneWeekAgo
    );

    this.predictionCache.clear();
  }
}

// Instância global lazy
let predictivePreloaderInstance = null;

const getPredictivePreloader = () => {
  if (!predictivePreloaderInstance && typeof window !== 'undefined') {
    predictivePreloaderInstance = new PredictivePreloader();
  }
  return predictivePreloaderInstance;
};

export const predictivePreloader = getPredictivePreloader();

// Hook para usar o preloader preditivo
export const usePredictivePreloader = () => {
  return getPredictivePreloader();
};
