import { useState, useEffect } from 'react';
import styles from '../styles/SimpleSuccessFeedback.module.css';

const SimpleSuccessFeedback = ({ 
  isVisible, 
  onComplete,
  message = '🎯 PRIMEIRA TENTATIVA!'
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Mostrar animação
      setShowAnimation(true);
      
      // Limpar após animação completa
      const cleanup = setTimeout(() => {
        setShowAnimation(false);
        if (onComplete) onComplete();
      }, 2000); // Mais rápido que o feedback completo

      return () => clearTimeout(cleanup);
    } else {
      // Reset quando não visível
      setShowAnimation(false);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      {/* Efeito de fundo sutil */}
      <div className={styles.background} />
      
      {/* Mensagem simples */}
      {showAnimation && (
        <div className={styles.messageContainer}>
          <div className={styles.emoji}>🎯</div>
          <h1 className={styles.title}>{message}</h1>
        </div>
      )}

      {/* Efeito de brilho sutil */}
      <div className={styles.glowEffect} />
    </div>
  );
};

export default SimpleSuccessFeedback;
