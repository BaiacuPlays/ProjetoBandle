import React, { memo, useMemo } from 'react';
import { FaVolumeUp, FaFastForward } from 'react-icons/fa';
import OptimizedPlayButton from './OptimizedPlayButton';

// Componente de botão de play memoizado e ultra-otimizado
export const MemoizedPlayButton = memo(({
  isPlaying,
  onClick,
  disabled,
  isLoading,
  className,
  size = 20,
  ...props
}) => {
  return (
    <OptimizedPlayButton
      isPlaying={isPlaying}
      isLoading={isLoading}
      disabled={disabled}
      onClick={onClick}
      className={className}
      size={size}
      instantFeedback={true}
      scaleOnClick={true}
      showSpinner={true}
      debounceMs={25} // Reduzido para melhor responsividade
      {...props}
    />
  );
});

MemoizedPlayButton.displayName = 'MemoizedPlayButton';

// Componente de controle de volume memoizado
export const MemoizedVolumeControl = memo(({
  volume,
  onChange,
  disabled,
  className
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <FaVolumeUp color="#fff" style={{ marginRight: 8 }} />
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={onChange}
        className={className}
        disabled={disabled}
      />
    </div>
  );
});

MemoizedVolumeControl.displayName = 'MemoizedVolumeControl';

// Componente de progresso de áudio memoizado
export const MemoizedAudioProgress = memo(({
  progress,
  duration,
  onChange,
  disabled,
  className
}) => {
  const timeDisplay = useMemo(() => {
    const currentTime = Math.min(duration, progress);
    return new Date(currentTime * 1000).toISOString().substring(14, 19);
  }, [progress, duration]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="range"
        min={0}
        max={duration}
        step={0.1}
        value={progress}
        onChange={onChange}
        className={className}
        disabled={disabled}
      />
      <span style={{ color: '#fff', fontSize: '0.9em', minWidth: '45px' }}>
        {timeDisplay}
      </span>
    </div>
  );
});

MemoizedAudioProgress.displayName = 'MemoizedAudioProgress';

// Componente de tentativas memoizado
export const MemoizedAttempts = memo(({
  attempts,
  maxAttempts,
  history,
  onAttemptClick,
  styles
}) => {
  const attemptButtons = useMemo(() => {
    return [...Array(maxAttempts)].map((_, idx) => {
      let statusClass = styles.attemptInactive;

      if (history[idx]) {
        if (history[idx].type === 'success') {
          statusClass = styles.attemptSuccess;
        } else if (history[idx].type === 'fail') {
          if (history[idx].subtype === 'same_game') {
            statusClass = styles.attemptGame;
          } else if (history[idx].subtype === 'same_franchise') {
            statusClass = styles.attemptFranchise;
          } else {
            statusClass = styles.attemptFail;
          }
        } else if (history[idx].type === 'skipped') {
          statusClass = styles.attemptFail;
        }
      }

      return (
        <button
          key={idx}
          type="button"
          className={`${styles.attemptButton} ${statusClass}`}
          disabled={idx > attempts}
          onClick={() => idx <= attempts && onAttemptClick(idx)}
          tabIndex={idx > attempts ? -1 : 0}
        >
          {idx + 1}
        </button>
      );
    });
  }, [maxAttempts, history, attempts, onAttemptClick, styles]);

  return <div className={styles.attemptsRow}>{attemptButtons}</div>;
});

MemoizedAttempts.displayName = 'MemoizedAttempts';

// Componente de histórico memoizado
export const MemoizedHistory = memo(({ history, styles }) => {
  const historyItems = useMemo(() => {
    return history.map((item, idx) => (
      <div key={`history-${idx}-${item.type || 'unknown'}`} className={styles.historyItem}>
        {item?.type === 'skipped' && (
          <span className={styles.historySkipped}>❌ Pulou!</span>
        )}
        {item?.type === 'fail' && (
          <span className={
            item.subtype === 'same_game' ? styles.historyFailButCorrectGame :
            item.subtype === 'same_franchise' ? styles.historyFailButCorrectFranchise :
            styles.historyFail
          }>
            {item.subtype === 'same_game' ? '🎮' :
             item.subtype === 'same_franchise' ? '🔶' :
             '❌'} {item.value}
          </span>
        )}
        {item?.type === 'success' && (
          <span className={styles.historySuccess}>✅ {item.value}</span>
        )}
      </div>
    ));
  }, [history, styles]);

  return <div className={styles.historyBox}>{historyItems}</div>;
});

MemoizedHistory.displayName = 'MemoizedHistory';

// Componente de sugestões memoizado
export const MemoizedSuggestions = memo(({
  suggestions,
  onSuggestionClick,
  showEasterEgg,
  onEasterEggClick,
  styles
}) => {
  const suggestionItems = useMemo(() => {
    const items = suggestions.map((suggestion, suggestionIndex) => (
      <li
        key={`suggestion-${suggestion.id}-${suggestionIndex}`}
        className={styles.suggestionItemModern}
        onMouseDown={() => onSuggestionClick(suggestion)}
      >
        {suggestion.game} - {suggestion.title}
      </li>
    ));

    if (showEasterEgg) {
      items.push(
        <li
          key="easter-egg"
          className={styles.suggestionItemModern}
          onMouseDown={onEasterEggClick}
          style={{
            fontStyle: 'italic',
            opacity: 0.7,
            borderTop: '1px solid rgba(29, 185, 84, 0.3)',
            marginTop: '0.5rem',
            paddingTop: '0.75rem'
          }}
        >
          ??? - ???
        </li>
      );
    }

    return items;
  }, [suggestions, onSuggestionClick, showEasterEgg, onEasterEggClick, styles]);

  return <ul className={styles.suggestionsListModern}>{suggestionItems}</ul>;
});

MemoizedSuggestions.displayName = 'MemoizedSuggestions';

// Componente de timer memoizado
export const MemoizedTimer = memo(({ timer, formatTimer, styles }) => {
  const formattedTime = useMemo(() => formatTimer(timer), [timer, formatTimer]);

  return (
    <div className={styles.timerBox}>
      Novo jogo em: <span className={styles.timer}>{formattedTime}</span>
    </div>
  );
});

MemoizedTimer.displayName = 'MemoizedTimer';
