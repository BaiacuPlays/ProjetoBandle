import { useState, useEffect, useRef } from 'react';
import { songs, getRandomSong } from '../data/songs';
import styles from '../styles/Home.module.css';
import { FaPlay, FaPause, FaVolumeUp, FaFastForward } from 'react-icons/fa';

const MAX_ATTEMPTS = 6;
const GAME_INTERVAL = 24 * 60 * 60 * 1000; // 24h em ms

export default function Home() {
  const [currentSong, setCurrentSong] = useState(null);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [currentClipDuration, setCurrentClipDuration] = useState(1);
  const [showHint, setShowHint] = useState(false);
  const [history, setHistory] = useState([]); // histórico de tentativas
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [timer, setTimer] = useState(GAME_INTERVAL);
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [activeHint, setActiveHint] = useState(0);

  // Timer para novo jogo (simula 24h)
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - gameStartTime;
      setTimer(GAME_INTERVAL - (elapsed % GAME_INTERVAL));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStartTime]);

  // Carregar música
  useEffect(() => {
    const loadSong = async () => {
      setIsLoading(true);
      try {
        const song = await getRandomSong();
        setCurrentSong(song);
        setAudioError(false);
        setCurrentClipDuration(1);
        setShowHint(false);
        setHistory([]);
        setAttempts(0);
        setGameOver(false);
        setGuess('');
        setGameStartTime(Date.now());
        setAudioProgress(0);
      } catch (error) {
        setAudioError(true);
        setMessage('Erro ao carregar a música.');
      } finally {
        setIsLoading(false);
      }
    };
    loadSong();
  }, []);

  // Atualiza duração do áudio ao carregar
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration || 0);
    }
  };

  // Atualiza progresso e play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => {
      // Se passar do tempo liberado, trava
      if (audio.currentTime > currentClipDuration) {
        audio.currentTime = currentClipDuration;
        audio.pause();
        setIsPlaying(false);
      }
      setAudioProgress(audio.currentTime);
    };
    const updatePlay = () => setIsPlaying(!audio.paused);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play', updatePlay);
    audio.addEventListener('pause', updatePlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('play', updatePlay);
      audio.removeEventListener('pause', updatePlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [audioRef.current, currentClipDuration]);

  // Atualiza volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Quando áudio termina
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Guess
  const handleGuess = (e) => {
    e.preventDefault();
    if (gameOver) return;
    submitGuess(guess);
  };

  const submitGuess = (selectedGuess) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setShowSuggestions(false);
    setGuess('');
    let result = null;
    if (selectedGuess.toLowerCase() === currentSong.title.toLowerCase()) {
      setMessage('Parabéns! Você acertou!');
      setGameOver(true);
      result = { type: 'success', value: selectedGuess };
    } else if (newAttempts >= MAX_ATTEMPTS) {
      setMessage(`Game Over! A música era ${currentSong.title} - ${currentSong.artist}`);
      setGameOver(true);
      result = { type: 'fail', value: selectedGuess };
    } else {
      setMessage('Tente novamente!');
      setShowHint(true);
      result = { type: 'fail', value: selectedGuess };
    }
    setHistory(prev => [...prev, result]);
  };

  // Skip
  const handleSkip = () => {
    if (gameOver) return;
    setAttempts(a => a + 1);
    setShowHint(true);
    setHistory(prev => [...prev, { type: 'skipped' }]);
    setMessage('Pulado! Próxima dica liberada.');
    if (attempts + 1 >= MAX_ATTEMPTS) {
      setMessage(`Game Over! A música era ${currentSong.title} - ${currentSong.artist}`);
      setGameOver(true);
    }
  };

  // Novo jogo
  const startNewGame = async () => {
    setIsLoading(true);
    try {
      const song = await getRandomSong();
      setCurrentSong(song);
      setGuess('');
      setMessage('');
      setGameOver(false);
      setAttempts(0);
      setAudioError(false);
      setShowSuggestions(false);
      setCurrentClipDuration(1);
      setShowHint(false);
      setHistory([]);
      setAudioProgress(0);
      setGameStartTime(Date.now());
    } catch (error) {
      setAudioError(true);
      setMessage('Erro ao carregar a música.');
    } finally {
      setIsLoading(false);
    }
  };

  // Autocomplete
  const handleInputChange = (e) => {
    const value = e.target.value;
    setGuess(value);
    if (value.length > 0) {
      const suggestions = songs.filter(song =>
        song.title.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setGuess(suggestion.title);
    setShowSuggestions(false);
  };

  // Timer format
  const formatTimer = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Função para gerar dicas progressivas
  function getProgressiveHint(currentSong, hintIdx) {
    if (!currentSong) return null;
    if (hintIdx === 0) return null;
    if (hintIdx === 1) {
      const min = Math.floor(audioDuration / 60) || 0;
      const sec = Math.floor(audioDuration % 60) || 0;
      const formatted = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
      return `Duração: ${formatted}`;
    }
    if (hintIdx === 2) return `Ano de lançamento: ${currentSong.year}`;
    if (hintIdx === 3) return `Gênero: ${currentSong.genre}`;
    if (hintIdx === 4) return `Álbum: ${currentSong.album || 'Desconhecido'}`;
    if (hintIdx >= 5) return `Artista: ${currentSong.artist}`;
    return null;
  }

  useEffect(() => {
    setCurrentClipDuration(activeHint + 1);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
      setAudioProgress(0);
      setIsPlaying(false);
    }
  }, [activeHint]);

  useEffect(() => {
    setActiveHint(attempts);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
      setAudioProgress(0);
      setIsPlaying(false);
    }
  }, [attempts]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className={styles.darkBg}>
      <div className={styles.topBar}>
        <span className={styles.titleBar}>Adivinhe a música tocada pela banda</span>
        {getProgressiveHint(currentSong, activeHint) && !gameOver && (
          <div className={styles.hintBoxModern} style={{ marginTop: 12, marginBottom: 0, maxWidth: 420, textAlign: 'center' }}>
            <strong>Dica:</strong> {getProgressiveHint(currentSong, activeHint)}
          </div>
        )}
      </div>
      <div className={styles.gameAreaModern}>
        <div className={styles.audioModernBox}>
          <div className={styles.customAudioPlayer}>
            <div className={styles.audioPlayerRow}>
              <span className={styles.audioTime}>{
                new Date(audioProgress * 1000).toISOString().substr(14, 5)
              }</span>
              <input
                type="range"
                min={0}
                max={currentClipDuration}
                step={0.01}
                value={audioProgress}
                onChange={e => {
                  let value = Number(e.target.value);
                  if (!isPlaying) {
                    value = 0;
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0;
                    }
                    setAudioProgress(0);
                    return;
                  }
                  if (value > currentClipDuration) value = currentClipDuration;
                  if (audioRef.current) {
                    audioRef.current.currentTime = value;
                    setAudioProgress(value);
                  }
                }}
                className={styles.audioSeekbarCustom}
                disabled={gameOver || audioError || !audioDuration}
              />
              <span className={styles.audioTime} style={{ marginLeft: 10 }}>
                {audioDuration
                  ? new Date(audioDuration * 1000).toISOString().substr(14, 5)
                  : '00:00'}
              </span>
            </div>
            <div className={styles.audioVolumeRow}>
              <button
                className={styles.audioPlayBtnCustom}
                onClick={() => {
                  if (!audioRef.current) return;
                  if (isPlaying) {
                    audioRef.current.pause();
                  } else {
                    audioRef.current.play();
                  }
                }}
                disabled={gameOver || audioError || !audioDuration}
              >
                {isPlaying ? (
                  <FaPause color="#fff" size={20} />
                ) : (
                  <FaPlay color="#fff" size={20} />
                )}
              </button>
              <FaVolumeUp color="#fff" style={{ marginRight: 8 }} />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className={styles.audioVolumeCustom}
                disabled={gameOver || audioError}
              />
            </div>
            <audio
              ref={audioRef}
              src={currentSong?.audioUrl}
              style={{ display: 'none' }}
              onEnded={handleAudioEnded}
              onError={() => {
                setAudioError(true);
                setMessage('Erro ao carregar o áudio. Verifique se o arquivo existe.');
              }}
              onLoadedMetadata={handleLoadedMetadata}
            />
          </div>
        </div>
        <div className={styles.attemptsRow}>
          {[...Array(MAX_ATTEMPTS)].map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.attemptButton + ' ' + styles.attemptInactive}
              disabled={idx > attempts}
              onClick={() => idx <= attempts && setActiveHint(idx)}
              tabIndex={idx > attempts ? -1 : 0}
            >
              {idx + 1}
            </button>
          ))}
          <button
            type="button"
            className={styles.attemptButton + ' ' + styles.attemptInactive}
            onClick={handleSkip}
            disabled={gameOver || audioError || attempts >= MAX_ATTEMPTS}
          >
            Skip <FaFastForward style={{ marginLeft: 4, fontSize: '1em', verticalAlign: 'middle' }} />
          </button>
        </div>
        <form onSubmit={handleGuess} className={styles.guessFormModern} autoComplete="off">
          <input
            type="text"
            value={guess}
            onChange={handleInputChange}
            placeholder="Digite o nome da música..."
            disabled={gameOver || audioError}
            className={styles.guessInputModern}
            onFocus={() => guess.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <button
            type="submit"
            disabled={gameOver || audioError}
            className={styles.guessButtonModern}
          >
            Adivinhar
          </button>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <ul className={styles.suggestionsListModern}>
              {filteredSuggestions.map(suggestion => (
                <li
                  key={suggestion.id}
                  className={styles.suggestionItemModern}
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.artist} - {suggestion.title}
                </li>
              ))}
            </ul>
          )}
        </form>
        <div className={styles.historyBox}>
          {history.map((item, idx) => (
            <div key={idx} className={styles.historyItem}>
              {item?.type === 'skipped' && <span className={styles.historySkipped}>❌ Skipped!</span>}
              {item?.type === 'fail' && <span className={styles.historyFail}>❌ {item.value}</span>}
              {item?.type === 'success' && <span className={styles.historySuccess}>✅ {item.value}</span>}
            </div>
          ))}
        </div>
        {message && (
          <div className={`${styles.messageModern} ${audioError ? styles.error : ''}`}>
            {message}
          </div>
        )}
        {gameOver && (
          <button
            className={styles.newGameButtonModern}
            onClick={startNewGame}
          >
            Jogar Novamente
          </button>
        )}
        <div className={styles.timerBox}>
          Novo jogo em: <span className={styles.timer}>{formatTimer(timer)}</span>
        </div>
      </div>
    </div>
  );
} 