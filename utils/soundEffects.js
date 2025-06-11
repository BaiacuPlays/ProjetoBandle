// Utilitário para efeitos sonoros do jogo
export class SoundEffects {
  constructor() {
    this.audioContext = null;
    this.soundEnabled = true;
    this.volume = 0.3;
    this.initAudioContext();
    this.loadSettings();
  }

  // Inicializar contexto de áudio
  initAudioContext() {
    try {
      // Verificar se estamos no lado do cliente
      if (typeof window !== 'undefined') {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (error) {
      console.warn('Web Audio API não suportada:', error);
    }
  }

  // Carregar configurações do usuário
  loadSettings() {
    try {
      const savedSettings = typeof window !== 'undefined' ? localStorage.getItem('bandle_settings') : null;
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.soundEnabled = settings.sound !== false;
        this.volume = settings.volume || 0.3;
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações de som:', error);
    }
  }

  // Verificar se o som está habilitado
  isSoundEnabled() {
    this.loadSettings(); // Recarregar configurações
    return this.soundEnabled;
  }

  // Som de sucesso/vitória - melodia alegre
  playSuccessSound() {
    if (!this.isSoundEnabled() || !this.audioContext) return;

    try {
      // Melodia de sucesso: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const durations = [0.15, 0.15, 0.15, 0.4];

      let startTime = this.audioContext.currentTime;

      notes.forEach((frequency, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'triangle';

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + durations[index]);

        oscillator.start(startTime);
        oscillator.stop(startTime + durations[index]);

        startTime += durations[index] * 0.8; // Sobreposição leve
      });

    } catch (error) {
      console.warn('Erro ao tocar som de sucesso:', error);
    }
  }

  // Som de acerto perfeito - mais elaborado
  playPerfectSound() {
    if (!this.isSoundEnabled() || !this.audioContext) return;

    try {
      // Acorde de vitória: C5 + E5 + G5 seguido de C6
      const chord = [523.25, 659.25, 783.99];
      const finalNote = 1046.50;

      const startTime = this.audioContext.currentTime;

      // Tocar acorde
      chord.forEach(frequency => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'triangle';

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.7, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.5);
      });

      // Nota final mais alta
      setTimeout(() => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(finalNote, this.audioContext.currentTime);
        oscillator.type = 'triangle';

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.6);
      }, 300);

    } catch (error) {
      console.warn('Erro ao tocar som perfeito:', error);
    }
  }

  // Som de primeira tentativa - extra especial
  playFirstTrySound() {
    if (!this.isSoundEnabled() || !this.audioContext) return;

    try {
      // Sequência especial para primeira tentativa
      const melody = [
        { freq: 523.25, duration: 0.1 }, // C5
        { freq: 659.25, duration: 0.1 }, // E5
        { freq: 783.99, duration: 0.1 }, // G5
        { freq: 1046.50, duration: 0.15 }, // C6
        { freq: 1318.51, duration: 0.2 }, // E6
        { freq: 1567.98, duration: 0.3 }  // G6
      ];

      let startTime = this.audioContext.currentTime;

      melody.forEach((note, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(note.freq, startTime);
        oscillator.type = 'triangle';

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.8, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);

        startTime += note.duration * 0.7; // Sobreposição
      });

    } catch (error) {
      console.warn('Erro ao tocar som de primeira tentativa:', error);
    }
  }

  // 🎵 NOVOS EFEITOS SONOROS PARA GAME FEEL

  // Som de hover nos botões
  playHoverSound() {
    if (!this.isSoundEnabled() || !this.audioContext) return;
    this.playTone(800, 0.05, this.volume * 0.3, 'sine');
  }

  // Som de click nos botões
  playClickSound() {
    if (!this.isSoundEnabled() || !this.audioContext) return;
    this.playTone(1000, 0.08, this.volume * 0.4, 'triangle');
  }

  // Som de erro/falha
  playErrorSound() {
    if (!this.isSoundEnabled() || !this.audioContext) return;
    this.playChord([200, 150, 100], 0.3, this.volume * 0.5, 'sawtooth');
  }

  // Som de digitação
  playTypingSound() {
    if (!this.isSoundEnabled() || !this.audioContext) return;
    this.playTone(600 + Math.random() * 200, 0.03, this.volume * 0.2, 'square');
  }

  // Som de skip
  playSkipSound() {
    if (!this.isSoundEnabled() || !this.audioContext) return;
    this.playSlide(400, 200, 0.4, this.volume * 0.4);
  }

  // Som de carregamento
  playLoadingSound() {
    if (!this.isSoundEnabled() || !this.audioContext) return;
    this.playArpeggio([440, 554, 659, 880], 0.1, this.volume * 0.3);
  }

  // Som de notificação
  playNotificationSound() {
    if (!this.isSoundEnabled() || !this.audioContext) return;
    this.playChord([523.25, 659.25], 0.2, this.volume * 0.4, 'triangle');
  }

  // 🔧 FUNÇÕES AUXILIARES PARA CRIAR SONS

  // Tocar um tom simples
  playTone(frequency, duration, volume = this.volume, type = 'sine') {
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Erro ao tocar tom:', error);
    }
  }

  // Tocar um acorde
  playChord(frequencies, duration, volume = this.volume, type = 'sine') {
    frequencies.forEach(freq => {
      this.playTone(freq, duration, volume * 0.7, type);
    });
  }

  // Tocar um slide de frequência
  playSlide(startFreq, endFreq, duration, volume = this.volume) {
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
      oscillator.type = 'triangle';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Erro ao tocar slide:', error);
    }
  }

  // Tocar um arpejo
  playArpeggio(frequencies, noteDuration, volume = this.volume) {
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, noteDuration, volume, 'triangle');
      }, index * noteDuration * 500);
    });
  }

  // Atualizar volume
  setVolume(newVolume) {
    this.volume = Math.max(0, Math.min(1, newVolume));
  }

  // Ativar/desativar som
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }
}

// Instância global
export const soundEffects = new SoundEffects();

// Funções de conveniência existentes
export const playSuccessSound = () => soundEffects.playSuccessSound();
export const playPerfectSound = () => soundEffects.playPerfectSound();
export const playFirstTrySound = () => soundEffects.playFirstTrySound();

// Novas funções de conveniência para game feel
export const playHoverSound = () => soundEffects.playHoverSound();
export const playClickSound = () => soundEffects.playClickSound();
export const playErrorSound = () => soundEffects.playErrorSound();
export const playTypingSound = () => soundEffects.playTypingSound();
export const playSkipSound = () => soundEffects.playSkipSound();
export const playLoadingSound = () => soundEffects.playLoadingSound();
export const playNotificationSound = () => soundEffects.playNotificationSound();
