import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
import { COMPONENT_CONFIG } from '../config/audioConfig';

// Spinner otimizado para o botão
const OptimizedSpinner = memo(() => (
  <div style={{
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'optimizedSpin 0.8s linear infinite',
    display: 'inline-block'
  }}>
    <style jsx>{`
      @keyframes optimizedSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
));

OptimizedSpinner.displayName = 'OptimizedSpinner';

/**
 * Botão de play/pause ultra-otimizado com feedback visual instantâneo
 * Projetado para máxima responsividade e melhor UX
 */
const OptimizedPlayButton = memo(({
  isPlaying = false,
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  size = 20,
  style = {},
  ariaLabel,
  // Configurações de comportamento
  instantFeedback = true,
  scaleOnClick = true,
  showSpinner = true,
  debounceMs = 50,
  ...props
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  
  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  // Determinar ícone a ser exibido
  const getIcon = useCallback(() => {
    if (isLoading && showSpinner) {
      return <OptimizedSpinner />;
    }
    
    if (isLoading && !showSpinner) {
      return COMPONENT_CONFIG.PLAY_BUTTON.LOADING_ICON;
    }
    
    return isPlaying ? <FaPause size={size} /> : <FaPlay size={size} />;
  }, [isPlaying, isLoading, showSpinner, size]);
  
  // Handler de clique otimizado
  const handleClick = useCallback(async (e) => {
    if (disabled || isLoading) return;
    
    // Prevenir múltiplos cliques
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Feedback visual instantâneo
    if (instantFeedback && scaleOnClick) {
      setIsClicked(true);
      
      // Resetar feedback após animação
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      
      clickTimeoutRef.current = setTimeout(() => {
        setIsClicked(false);
      }, COMPONENT_CONFIG.PLAY_BUTTON.AUTO_ENABLE_TIMEOUT);
    }
    
    // Debounce do clique
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        if (onClick) {
          await onClick(e);
        }
      } catch (error) {
        console.warn('Erro no onClick do botão play:', error);
      } finally {
        // Garantir que o feedback visual seja removido
        setIsClicked(false);
      }
    }, debounceMs);
  }, [disabled, isLoading, onClick, instantFeedback, scaleOnClick, debounceMs]);
  
  // Handlers de hover para melhor UX
  const handleMouseEnter = useCallback(() => {
    if (!disabled && !isLoading) {
      setIsHovered(true);
    }
  }, [disabled, isLoading]);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  // Estilos dinâmicos
  const dynamicStyles = {
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: `scale(${
      isClicked && scaleOnClick 
        ? COMPONENT_CONFIG.PLAY_BUTTON.SCALE_FACTOR 
        : isHovered ? 1.05 : 1
    })`,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    outline: 'none',
    border: 'none',
    background: 'transparent',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...style
  };
  
  // Aria label dinâmico
  const getAriaLabel = useCallback(() => {
    if (ariaLabel) return ariaLabel;
    
    if (isLoading) return 'Carregando áudio...';
    return isPlaying ? 'Pausar áudio' : 'Reproduzir áudio';
  }, [ariaLabel, isLoading, isPlaying]);
  
  return (
    <button
      ref={buttonRef}
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      style={dynamicStyles}
      aria-label={getAriaLabel()}
      aria-pressed={isPlaying}
      type="button"
      role="button"
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {getIcon()}
      
      {/* Indicador de loading adicional se necessário */}
      {isLoading && !showSpinner && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '8px',
            height: '8px',
            backgroundColor: '#1DB954',
            borderRadius: '50%',
            animation: 'pulse 1.5s infinite'
          }}
        >
          <style jsx>{`
            @keyframes pulse {
              0% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.2); }
              100% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </button>
  );
});

OptimizedPlayButton.displayName = 'OptimizedPlayButton';

export default OptimizedPlayButton;
