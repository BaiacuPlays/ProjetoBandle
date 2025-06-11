import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/SuccessFeedback.module.css';

const SuccessFeedback = ({
  isVisible,
  onComplete,
  type = 'success', // 'success', 'perfect', 'firstTry'
  attempts = 1,
  songTitle = '',
  gameTitle = ''
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showText, setShowText] = useState(false);
  const [particles, setParticles] = useState([]);

  // Usar refs para timeouts para garantir limpeza adequada
  const textTimeoutRef = useRef(null);
  const cleanupTimeoutRef = useRef(null);

  // Função de limpeza memoizada para evitar re-criações desnecessárias
  const handleComplete = useCallback(() => {
    setShowConfetti(false);
    setShowText(false);
    setParticles([]);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Função para limpar todos os timeouts
  const clearAllTimeouts = useCallback(() => {
    if (textTimeoutRef.current) {
      clearTimeout(textTimeoutRef.current);
      textTimeoutRef.current = null;
    }
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Limpar timeouts anteriores
    clearAllTimeouts();

    if (isVisible) {
      // Iniciar animações em sequência
      setShowConfetti(true);

      // Gerar partículas de confete (reduzidas)
      generateParticles();

      // Mostrar texto após pequeno delay
      textTimeoutRef.current = setTimeout(() => {
        setShowText(true);
      }, 100);

      // Limpar após animação completa - 2 SEGUNDOS
      cleanupTimeoutRef.current = setTimeout(() => {
        handleComplete();
      }, 2000);

    } else {
      // Reset quando não visível
      setShowConfetti(false);
      setShowText(false);
      setParticles([]);
    }

    // Cleanup function
    return () => {
      clearAllTimeouts();
    };
  }, [isVisible, handleComplete, clearAllTimeouts]);

  const generateParticles = () => {
    const newParticles = [];
    // REDUZIR DRASTICAMENTE O NÚMERO DE PARTÍCULAS
    const particleCount = type === 'firstTry' ? 15 : type === 'perfect' ? 12 : 10;

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 3, // Partículas menores
        color: getRandomColor(),
        delay: Math.random() * 0.3, // Delay menor
        duration: Math.random() * 1.5 + 1 // Duração menor
      });
    }

    setParticles(newParticles);
  };

  const getRandomColor = () => {
    const colors = [
      '#1DB954', '#1ed760', '#FFD700', '#FF6B6B',
      '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getSuccessMessage = () => {
    switch (type) {
      case 'firstTry':
        return {
          title: '🎯 PERFEITO!',
          subtitle: 'Acertou na primeira tentativa!',
          emoji: '🎉'
        };
      case 'perfect':
        return {
          title: '⭐ EXCELENTE!',
          subtitle: `Acertou em ${attempts} tentativa${attempts > 1 ? 's' : ''}!`,
          emoji: '🌟'
        };
      default:
        return {
          title: '🎵 CORRETO!',
          subtitle: `Parabéns! Você acertou!`,
          emoji: '🎊'
        };
    }
  };

  const message = getSuccessMessage();

  if (!isVisible) return null;

  return (
    <div className={styles.overlay} onClick={handleComplete}>
      {/* Efeito de fundo */}
      <div className={`${styles.background} ${styles[type]}`} />

      {/* Botão de fechar */}
      <button
        className={styles.closeButton}
        onClick={handleComplete}
        aria-label="Fechar"
        title="Clique para fechar"
      >
        ×
      </button>

      {/* Partículas de confete */}
      {showConfetti && (
        <div className={styles.confettiContainer}>
          {particles.map(particle => (
            <div
              key={particle.id}
              className={styles.particle}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Texto principal */}
      {showText && (
        <div
          className={`${styles.messageContainer} ${styles[type]}`}
          onClick={(e) => e.stopPropagation()} // Evitar fechar ao clicar no conteúdo
        >
          <div className={styles.emoji}>{message.emoji}</div>
          <h1 className={styles.title}>{message.title}</h1>
          <p className={styles.subtitle}>{message.subtitle}</p>

          {/* Informações da música */}
          {(songTitle || gameTitle) && (
            <div className={styles.songInfo}>
              <div className={styles.songTitle}>
                {gameTitle && <span className={styles.gameTitle}>{gameTitle}</span>}
                {songTitle && <span className={styles.musicTitle}>{songTitle}</span>}
              </div>
            </div>
          )}


        </div>
      )}

      {/* Efeitos de brilho */}
      <div className={styles.glowEffect} />

      {/* Ondas de energia */}
      <div className={styles.energyWaves}>
        <div className={styles.wave} />
        <div className={styles.wave} />
        <div className={styles.wave} />
      </div>
    </div>
  );
};

export default SuccessFeedback;
