import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isVisible) {
      // Iniciar animações em sequência
      setShowConfetti(true);

      // Gerar partículas de confete (reduzidas)
      generateParticles();

      // Mostrar texto após pequeno delay
      setTimeout(() => {
        setShowText(true);
      }, 100);

      // Limpar após animação completa - REDUZIDO PARA 2 SEGUNDOS
      const cleanup = setTimeout(() => {
        setShowConfetti(false);
        setShowText(false);
        setParticles([]);
        if (onComplete) onComplete();
      }, 2000);

      return () => clearTimeout(cleanup);
    } else {
      // Reset quando não visível
      setShowConfetti(false);
      setShowText(false);
      setParticles([]);
    }
  }, [isVisible, onComplete]);

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
    <div className={styles.overlay}>
      {/* Efeito de fundo */}
      <div className={`${styles.background} ${styles[type]}`} />

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
        <div className={`${styles.messageContainer} ${styles[type]}`}>
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

          {/* Pontos ganhos */}
          {attempts && (
            <div className={styles.pointsInfo}>
              <span className={styles.points}>
                +{Math.max(0, 6 - attempts + 1)} pontos!
              </span>
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
