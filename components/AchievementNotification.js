import React, { useState, useEffect, useRef } from 'react';
import { FaTrophy, FaStar, FaTimes } from 'react-icons/fa';
import styles from '../styles/AchievementNotification.module.css';

const AchievementNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const achievementSoundRef = useRef(null);
  const levelUpSoundRef = useRef(null);
  const containerRef = useRef(null);

  // Função para tocar som de conquista
  const playAchievementSound = () => {
    try {
      // Verificar se o som está habilitado nas configurações
      const savedSettings = typeof window !== 'undefined' ? localStorage.getItem('bandle_settings') : null;
      let soundEnabled = true; // padrão habilitado

      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          soundEnabled = settings.sound !== false;
        } catch (error) {
          // Se erro ao parsear, manter som habilitado
        }
      }

      if (!soundEnabled) return;

      // Criar e tocar som de conquista
      if (!achievementSoundRef.current) {
        achievementSoundRef.current = new Audio();
        // Som de conquista - frequências que soam como "conquista desbloqueada"
        achievementSoundRef.current.volume = 0.3;
      }

      // Gerar som sintético de conquista (notas ascendentes)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Sequência de notas para som de conquista (C-E-G-C)
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      let noteIndex = 0;

      const playNote = () => {
        if (noteIndex < notes.length) {
          oscillator.frequency.setValueAtTime(notes[noteIndex], audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

          noteIndex++;
          if (noteIndex < notes.length) {
            setTimeout(playNote, 150);
          }
        }
      };

      oscillator.type = 'triangle';
      oscillator.start();
      playNote();

      setTimeout(() => {
        oscillator.stop();
      }, 800);

    } catch (error) {
      // Silent error handling - som é opcional
      console.warn('Não foi possível tocar som de conquista:', error);
    }
  };

  // Função para tocar som de level up - MELHORADA
  const playLevelUpSound = () => {
    try {
      // Verificar se o som está habilitado
      const savedSettings = typeof window !== 'undefined' ? localStorage.getItem('bandle_settings') : null;
      let soundEnabled = true;

      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          soundEnabled = settings.sound !== false;
        } catch (error) {
          // Se erro ao parsear, manter som habilitado
        }
      }

      if (!soundEnabled) return;

      console.log('🔊 Tocando som de level up...');

      // Som de level up mais elaborado e audível
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Criar múltiplos osciladores para um som mais rico
      const createLevelUpSound = () => {
        // Sequência de acordes ascendentes para level up (mais dramático)
        const chords = [
          [261.63, 329.63, 392.00], // C4-E4-G4
          [293.66, 369.99, 440.00], // D4-F#4-A4
          [329.63, 415.30, 493.88], // E4-G#4-B4
          [392.00, 493.88, 587.33], // G4-B4-D5
          [523.25, 659.25, 783.99], // C5-E5-G5
          [659.25, 830.61, 987.77]  // E5-G#5-B5
        ];

        let chordIndex = 0;

        const playChord = () => {
          if (chordIndex < chords.length) {
            const chord = chords[chordIndex];
            const oscillators = [];
            const gainNodes = [];

            // Criar osciladores para cada nota do acorde
            chord.forEach((frequency, i) => {
              const osc = audioContext.createOscillator();
              const gain = audioContext.createGain();

              osc.connect(gain);
              gain.connect(audioContext.destination);

              osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
              osc.type = i === 0 ? 'triangle' : 'sine'; // Primeira nota mais forte

              // Volume mais alto para level up
              const volume = i === 0 ? 0.25 : 0.15;
              gain.gain.setValueAtTime(volume, audioContext.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

              osc.start();
              oscillators.push(osc);
              gainNodes.push(gain);

              // Parar oscilador após 400ms
              setTimeout(() => {
                try {
                  osc.stop();
                } catch (e) {
                  // Ignorar erro se já parou
                }
              }, 400);
            });

            chordIndex++;
            if (chordIndex < chords.length) {
              setTimeout(playChord, 200); // 200ms entre acordes
            }
          }
        };

        playChord();
      };

      createLevelUpSound();

    } catch (error) {
      console.warn('Não foi possível tocar som de level up:', error);

      // Fallback: som mais simples se Web Audio API falhar
      try {
        const audio = new Audio();
        // Criar um som sintético simples como fallback
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.type = 'triangle';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

        oscillator.start();
        setTimeout(() => {
          try {
            oscillator.stop();
          } catch (e) {
            // Ignorar
          }
        }, 1000);

      } catch (fallbackError) {
        console.warn('Fallback de som também falhou:', fallbackError);
      }
    }
  };

  // Sistema para garantir visibilidade das notificações
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Garantir que as notificações sejam sempre visíveis quando a aba está ativa
      if (!document.hidden && notifications.length > 0) {
        setIsVisible(true);

        // Forçar reposicionamento se necessário
        if (containerRef.current) {
          containerRef.current.style.display = 'flex';
        }
      }
    };

    const handleScroll = () => {
      // Manter notificações visíveis durante scroll
      if (notifications.length > 0 && containerRef.current) {
        // Garantir que o container permaneça fixo e visível
        containerRef.current.style.position = 'fixed';
        containerRef.current.style.zIndex = '99999';
      }
    };

    // Adicionar listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [notifications.length]);

  useEffect(() => {
    // Contador para garantir IDs únicos
    let notificationCounter = 0;

    // Registrar funções globais para mostrar notificações
    window.showAchievementToast = (achievement) => {
      const uniqueId = `achievement_${Date.now()}_${++notificationCounter}_${Math.random().toString(36).substr(2, 9)}`;

      const notification = {
        id: uniqueId,
        type: 'achievement',
        achievement,
        timestamp: Date.now()
      };

      console.log('🏆 Mostrando notificação de conquista:', achievement.title, 'ID:', uniqueId);

      // Tocar som de conquista
      playAchievementSound();

      setNotifications(prev => [...prev, notification]);

      // Auto-remover após 6 segundos (aumentado para dar mais tempo para ver)
      setTimeout(() => {
        removeNotification(uniqueId);
      }, 6000);
    };

    window.showLevelUpToast = (newLevel) => {
      console.log('🎯 DEBUG: showLevelUpToast chamada com nível:', newLevel);

      const uniqueId = `levelup_${Date.now()}_${++notificationCounter}_${Math.random().toString(36).substr(2, 9)}`;

      const notification = {
        id: uniqueId,
        type: 'levelup',
        level: newLevel,
        timestamp: Date.now()
      };

      console.log('⭐ Mostrando notificação de level up:', newLevel, 'ID:', uniqueId);

      // Tocar som de level up com debug
      console.log('🔊 DEBUG: Chamando playLevelUpSound...');
      playLevelUpSound();

      setNotifications(prev => [...prev, notification]);

      // Auto-remover após 5 segundos (aumentado)
      setTimeout(() => {
        removeNotification(uniqueId);
      }, 5000);
    };

    // Cleanup
    return () => {
      delete window.showAchievementToast;
      delete window.showLevelUpToast;
    };
  }, []);

  const removeNotification = (id) => {
    console.log('🗑️ Removendo notificação:', id);
    setNotifications(prev => {
      const filtered = prev.filter(notif => notif.id !== id);
      console.log('📋 Notificações restantes:', filtered.length);
      return filtered;
    });
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#9CA3AF',
      uncommon: '#10B981',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B'
    };
    return colors[rarity] || colors.common;
  };

  if (notifications.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={styles.notificationContainer}
      style={{
        display: isVisible && notifications.length > 0 ? 'flex' : 'none',
        position: 'fixed',
        zIndex: 99999
      }}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${styles.notification} ${styles[notification.type]}`}
          style={notification.type === 'achievement' ? {
            borderColor: getRarityColor(notification.achievement.rarity)
          } : {}}
        >
          <button
            className={styles.closeButton}
            onClick={() => removeNotification(notification.id)}
          >
            <FaTimes />
          </button>

          {notification.type === 'achievement' ? (
            <div className={styles.achievementContent}>
              <div className={styles.achievementIcon}>
                <FaTrophy />
                <span className={styles.emoji}>{notification.achievement.icon}</span>
              </div>
              <div className={styles.achievementInfo}>
                <div className={styles.achievementTitle}>
                  Conquista Desbloqueada!
                </div>
                <div className={styles.achievementName}>
                  {notification.achievement.title}
                </div>
                <div className={styles.achievementDesc}>
                  {notification.achievement.description}
                </div>
                <div className={styles.xpReward}>
                  +{notification.achievement.xpReward} XP
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.levelUpContent}>
              <div className={styles.levelUpIcon}>
                <FaStar />
              </div>
              <div className={styles.levelUpInfo}>
                <div className={styles.levelUpTitle}>
                  Level Up!
                </div>
                <div className={styles.levelUpLevel}>
                  Nível {notification.level}
                </div>
                <div className={styles.levelUpDesc}>
                  Parabéns pelo seu progresso!
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AchievementNotification;
