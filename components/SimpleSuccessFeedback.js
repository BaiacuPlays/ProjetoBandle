import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/SimpleSuccessFeedback.module.css';

const SimpleSuccessFeedback = ({
  isVisible,
  onComplete,
  message = '🎯 PRIMEIRA TENTATIVA!'
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const cleanupTimeoutRef = useRef(null);

  // Função de limpeza memoizada
  const handleComplete = useCallback(() => {
    setShowAnimation(false);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    // Limpar timeout anterior
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    if (isVisible) {
      // Mostrar animação
      setShowAnimation(true);

      // Limpar após animação completa
      cleanupTimeoutRef.current = setTimeout(() => {
        handleComplete();
      }, 2000);

    } else {
      // Reset quando não visível
      setShowAnimation(false);
    }

    // Cleanup function
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }
    };
  }, [isVisible, handleComplete]);

  if (!isVisible) return null;

  return (
    <div className={styles.overlay} onClick={handleComplete}>
      {/* Efeito de fundo sutil */}
      <div className={styles.background} />

      {/* Botão de fechar */}
      <button
        className={styles.closeButton}
        onClick={handleComplete}
        aria-label="Fechar"
        title="Clique para fechar"
      >
        ×
      </button>

      {/* Mensagem simples */}
      {showAnimation && (
        <div
          className={styles.messageContainer}
          onClick={(e) => e.stopPropagation()}
        >
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
