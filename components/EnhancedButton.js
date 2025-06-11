// 🎮 Botão aprimorado com game feel
import React, { useRef, useCallback } from 'react';
import { useGameFeel } from '../hooks/useGameFeel';
import styles from '../styles/EnhancedButton.module.css';

const EnhancedButton = React.forwardRef(({
  children,
  onClick,
  onHover,
  disabled = false,
  variant = 'primary', // primary, secondary, success, error, warning
  size = 'medium', // small, medium, large
  loading = false,
  showOverlay = true, // Permitir desabilitar overlay
  className = '',
  style = {},
  type = 'button',
  ...props
}, ref) => {
  const buttonRef = useRef(null);
  const gameFeel = useGameFeel();

  // Usar useImperativeHandle para expor métodos se necessário
  React.useImperativeHandle(ref, () => buttonRef.current);

  // Handler para hover
  const handleMouseEnter = useCallback((e) => {
    if (!disabled && !loading) {
      gameFeel.onHover(buttonRef.current);
      if (onHover) onHover(e);
    }
  }, [disabled, loading, gameFeel, onHover]);

  // Handler para mouse leave (limpar efeitos)
  const handleMouseLeave = useCallback((e) => {
    // Limpar qualquer efeito de hover quando sair
    if (buttonRef.current) {
      buttonRef.current.style.transform = '';
    }
  }, []);

  // Handler para click
  const handleClick = useCallback((e) => {
    if (disabled || loading) {
      gameFeel.onError(buttonRef.current);
      return;
    }

    // CORREÇÃO: Sempre usar buttonRef.current para garantir que o efeito seja aplicado ao botão correto
    gameFeel.onClick(buttonRef.current, e);
    if (onClick) onClick(e);
  }, [disabled, loading, gameFeel, onClick]);

  // Handler para focus
  const handleFocus = useCallback((e) => {
    if (!disabled && !loading) {
      gameFeel.onFocus(buttonRef.current);
    }
  }, [disabled, loading, gameFeel]);

  // Handler para blur
  const handleBlur = useCallback((e) => {
    gameFeel.onBlur(buttonRef.current);
  }, [gameFeel]);

  // Classes CSS dinâmicas
  const buttonClasses = [
    styles.enhancedButton,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={buttonRef}
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled || loading}
      style={style}
      {...props}
    >
      {loading && (
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
        </div>
      )}

      <span className={styles.buttonContent}>
        {children}
      </span>

      {/* Overlay para efeitos visuais - condicional */}
      {showOverlay && !loading && (
        <div className={styles.overlay}></div>
      )}
    </button>
  );
});

EnhancedButton.displayName = 'EnhancedButton';

// Variantes específicas para facilitar o uso
export const PrimaryButton = (props) => (
  <EnhancedButton variant="primary" {...props} />
);

export const SecondaryButton = (props) => (
  <EnhancedButton variant="secondary" {...props} />
);

export const SuccessButton = (props) => (
  <EnhancedButton variant="success" {...props} />
);

export const ErrorButton = (props) => (
  <EnhancedButton variant="error" {...props} />
);

export const WarningButton = (props) => (
  <EnhancedButton variant="warning" {...props} />
);

// Botão de tentativa específico para o jogo
export const AttemptButton = ({
  attempt,
  status,
  active = false,
  onClick,
  tooltip,
  ...props
}) => {
  const buttonRef = useRef(null);
  const gameFeel = useGameFeel();

  const handleClick = useCallback((e) => {
    if (status === 'success') {
      gameFeel.onSuccess(buttonRef.current, attempt);
    } else if (status === 'game') {
      gameFeel.onGameMatch(buttonRef.current);
    } else if (status === 'franchise') {
      gameFeel.onFranchiseMatch(buttonRef.current);
    } else if (status === 'fail') {
      gameFeel.onError(buttonRef.current);
    } else {
      gameFeel.onClick(buttonRef.current, e);
    }

    if (onClick) onClick(e);
  }, [status, attempt, gameFeel, onClick]);

  const handleHover = useCallback(() => {
    if (status !== 'disabled') {
      gameFeel.onHover(buttonRef.current);
    }
  }, [status, gameFeel]);

  const buttonClasses = [
    styles.attemptButton,
    styles[status] || styles.default,
    active && styles.active
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={buttonRef}
      className={buttonClasses}
      onClick={handleClick}
      onMouseEnter={handleHover}
      title={tooltip}
      disabled={status === 'disabled'}
      {...props}
    >
      {attempt}
    </button>
  );
};

// Botão de input aprimorado
export const InputButton = React.forwardRef(({
  children,
  isSubmitting = false,
  isShaking = false,
  onClick,
  ...props
}, ref) => {
  const gameFeel = useGameFeel();

  const handleClick = useCallback((e) => {
    if (isSubmitting) {
      if (ref?.current) {
        gameFeel.onError(ref.current);
      }
      return;
    }

    // CORREÇÃO: Garantir que o efeito seja aplicado ao botão correto
    if (ref?.current) {
      gameFeel.onClick(ref.current, e);
    }
    if (onClick) onClick(e);
  }, [isSubmitting, gameFeel, onClick, ref]);

  const buttonClasses = [
    styles.inputButton,
    isSubmitting && styles.submitting,
    isShaking && styles.shaking
  ].filter(Boolean).join(' ');

  return (
    <EnhancedButton
      ref={ref}
      className={buttonClasses}
      onClick={handleClick}
      disabled={isSubmitting}
      loading={isSubmitting}
      {...props}
    >
      {children}
    </EnhancedButton>
  );
});

InputButton.displayName = 'InputButton';

export default EnhancedButton;
