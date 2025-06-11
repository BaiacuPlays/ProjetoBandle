// 🎮 Input aprimorado com game feel
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useGameFeel } from '../hooks/useGameFeel';
import styles from '../styles/EnhancedInput.module.css';

const EnhancedInput = React.forwardRef(({
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  placeholder = '',
  disabled = false,
  error = false,
  success = false,
  loading = false,
  showSuggestions = false,
  suggestions = [],
  onSuggestionClick,
  className = '',
  style = {},
  autoComplete = 'off',
  ...props
}, ref) => {
  const inputRef = useRef(null);

  // Usar useImperativeHandle para expor métodos se necessário
  React.useImperativeHandle(ref, () => inputRef.current);
  const gameFeel = useGameFeel();
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Handler para mudança de valor
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;

    // Feedback de digitação
    if (newValue !== value) {
      gameFeel.onTyping();
      setIsTyping(true);

      // Parar indicador de digitação após um tempo
      setTimeout(() => setIsTyping(false), 200);
    }

    if (onChange) onChange(e);
  }, [value, onChange, gameFeel]);

  // Handler para focus
  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    gameFeel.onFocus(inputRef.current);
    if (onFocus) onFocus(e);
  }, [gameFeel, onFocus]);

  // Handler para blur
  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    gameFeel.onBlur(inputRef.current);
    // Delay para não interferir com sugestões
    setTimeout(() => {
      if (onBlur) onBlur(e);
    }, 100);
  }, [gameFeel, onBlur]);

  // Handler para teclas
  const handleKeyDown = useCallback((e) => {
    // Feedback para Enter
    if (e.key === 'Enter') {
      gameFeel.onClick(inputRef.current, e);
    }

    if (onKeyDown) onKeyDown(e);
  }, [gameFeel, onKeyDown]);

  // Handler para clique em sugestão
  const handleSuggestionClick = useCallback((suggestion, e) => {
    gameFeel.onClick(e.target, e);
    if (onSuggestionClick) onSuggestionClick(suggestion);
  }, [gameFeel, onSuggestionClick]);

  // Efeito para erro
  useEffect(() => {
    if (error && inputRef.current) {
      gameFeel.onError(inputRef.current);
    }
  }, [error, gameFeel]);

  // Efeito para sucesso
  useEffect(() => {
    if (success && inputRef.current) {
      gameFeel.onSuccess(inputRef.current);
    }
  }, [success, gameFeel]);

  // Classes CSS dinâmicas
  const inputClasses = [
    styles.enhancedInput,
    isFocused && styles.focused,
    error && styles.error,
    success && styles.success,
    disabled && styles.disabled,
    loading && styles.loading,
    isTyping && styles.typing,
    className
  ].filter(Boolean).join(' ');

  const containerClasses = [
    styles.inputContainer,
    showSuggestions && suggestions.length > 0 && styles.withSuggestions
  ].filter(Boolean).join(' ');



  return (
    <div className={containerClasses} style={style}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          autoComplete={autoComplete}
          {...props}
        />

        {/* Indicador de carregamento */}
        {loading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.spinner}></div>
          </div>
        )}

        {/* Indicador de digitação */}
        {isTyping && !loading && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingDot}></div>
            <div className={styles.typingDot}></div>
            <div className={styles.typingDot}></div>
          </div>
        )}

        {/* Overlay para efeitos visuais */}
        <div className={styles.inputOverlay}></div>
      </div>

      {/* Lista de sugestões */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className={styles.suggestionsList}>
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className={styles.suggestionItem}
              onClick={(e) => handleSuggestionClick(suggestion, e)}
              onMouseEnter={(e) => gameFeel.onHover(e.target)}
            >
              {typeof suggestion === 'string' ? suggestion : suggestion.displayText || suggestion.title || suggestion.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

EnhancedInput.displayName = 'EnhancedInput';

// Componente específico para busca de músicas - VERSÃO SUPER SIMPLES
export const MusicSearchInput = React.forwardRef(({
  songs = [],
  onSongSelect,
  maxSuggestions = 10,
  ...props
}, ref) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filtrar quando o valor muda
  useEffect(() => {
    if (props.value && props.value.length > 0) {
      const searchTerm = props.value.toLowerCase();

      const filtered = songs.filter(song =>
        song.title?.toLowerCase().includes(searchTerm) ||
        song.game?.toLowerCase().includes(searchTerm) ||
        song.artist?.toLowerCase().includes(searchTerm)
      ).slice(0, maxSuggestions);

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [props.value, songs, maxSuggestions]);

  const handleSongSelect = (song) => {
    setShowSuggestions(false);
    if (onSongSelect) onSongSelect(song);
  };

  return (
    <EnhancedInput
      {...props}
      ref={ref}
      showSuggestions={showSuggestions}
      suggestions={suggestions.map(song => ({
        ...song,
        displayText: `${song.game} - ${song.title}`
      }))}
      onSuggestionClick={handleSongSelect}
      onBlur={() => {
        setTimeout(() => setShowSuggestions(false), 200);
        if (props.onBlur) props.onBlur();
      }}
    />
  );
});

MusicSearchInput.displayName = 'MusicSearchInput';

export default EnhancedInput;
