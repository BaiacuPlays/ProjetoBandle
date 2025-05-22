import { useState, useEffect, useRef } from 'react';
import { songs, getRandomSong } from '../data/songs';
import styles from '../styles/Home.module.css';
import { FaPlay, FaPause, FaVolumeUp, FaFastForward, FaQuestionCircle } from 'react-icons/fa';
import MusicInfoFetcher from '../components/MusicInfoFetcher';
import Footer from '../components/Footer';

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
  const [currentClipDuration, setCurrentClipDuration] = useState(0.3);
  const [showHint, setShowHint] = useState(false);
  const [history, setHistory] = useState([]); // histórico de tentativas
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [startTime, setStartTime] = useState(0); // Novo estado para armazenar o tempo inicial
  const [timer, setTimer] = useState(GAME_INTERVAL);
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [activeHint, setActiveHint] = useState(0);
  const inputRef = useRef(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Função para gerar um tempo aleatório dentro da duração da música
  const getRandomStartTime = (duration) => {
    // Deixa uma margem de 10 segundos no final da música
    const maxStart = Math.max(0, duration - 10);
    return Math.random() * maxStart;
  };

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
        setCurrentClipDuration(0.3);
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
      const duration = audioRef.current.duration || 0;
      setAudioDuration(duration);
      // Define um ponto de início aleatório quando a música carrega
      const randomStart = getRandomStartTime(duration);
      setStartTime(randomStart);
      audioRef.current.currentTime = randomStart;
    }
  };

  // Atualiza progresso e play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const currentTime = audio.currentTime - startTime;
      if (!gameOver && currentTime >= currentClipDuration) {
        audio.pause();
        setIsPlaying(false);
        // Reset para o início do trecho quando atingir o limite
        audio.currentTime = startTime;
        setAudioProgress(0);
      } else {
        setAudioProgress(currentTime);
      }
    };

    const updatePlay = () => {
      // Verifica se já atingiu o limite antes de permitir o play
      const currentTime = audio.currentTime - startTime;
      if (!gameOver && currentTime >= currentClipDuration) {
        audio.pause();
        setIsPlaying(false);
        // Reset para o início do trecho
        audio.currentTime = startTime;
        setAudioProgress(0);
      } else {
        setIsPlaying(!audio.paused);
      }
    };

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
  }, [audioRef.current, currentClipDuration, startTime, gameOver]);

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
    
    // Check if there's no guess selected
    if (!guess.trim()) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500); // Remove shake after animation ends
      return;
    }
    
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
      setCurrentClipDuration(0.3);
      setShowHint(false);
      setHistory([]);
      setAudioProgress(0);
      setStartTime(0); // Reseta o tempo inicial
      setGameStartTime(Date.now());
    } catch (error) {
      setAudioError(true);
      setMessage('Erro ao carregar a música.');
    } finally {
      setIsLoading(false);
    }
  };

  const normalize = str => str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase() // Converte para minúsculo
    .replace(/[^a-z0-9]/g, ''); // Remove tudo que não for letra ou número

  const getPriority = (song, value) => {
    const nTitle = normalize(song.title);
    const nGame = normalize(song.game);
    const nArtist = normalize(song.artist);
    const nValue = normalize(value);

    // Se o valor buscado está contido no título da música, prioriza
    if (nTitle.includes(nValue)) return 1;
    // Se o valor buscado está contido no nome do jogo, prioriza em segundo lugar
    if (nGame.includes(nValue)) return 2;
    // Se o valor buscado está contido no nome do artista, prioriza em terceiro lugar
    if (nArtist.includes(nValue)) return 3;
    return 4;
  };

  const filterSuggestions = (value) => {
    if (value.length > 0) {
      const nValue = normalize(value);
      
      // Divide o valor de busca em palavras
      const searchWords = nValue.split(/\s+/).filter(word => word.length > 0);
      
      const suggestions = songs
        .filter(song => {
          const nTitle = normalize(song.title);
          const nGame = normalize(song.game);
          const nArtist = normalize(song.artist);

          // Verifica se pelo menos uma palavra da busca está presente em algum dos campos
          // Ignora apenas palavras com uma única letra
          return searchWords.some(word => 
            (word.length > 1 && (
              nTitle.includes(word) ||
              nGame.includes(word) ||
              nArtist.includes(word)
            ))
          );
        })
        .sort((a, b) => {
          const pa = getPriority(a, value);
          const pb = getPriority(b, value);
          if (pa !== pb) return pa - pb;
          // Dentro da prioridade, ordena por nome do jogo e título
          const gameCmp = normalize(a.game).localeCompare(normalize(b.game));
          if (gameCmp !== 0) return gameCmp;
          return normalize(a.title).localeCompare(normalize(b.title));
        });
      
      setFilteredSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
    return [];
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setGuess(value);
    filterSuggestions(value);
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
    if (hintIdx === 3) return `Artista: ${currentSong.artist}`;
    if (hintIdx === 4) return `Console: ${currentSong.console || 'Desconhecido'}`;
    if (hintIdx >= 5) return `Franquia: ${currentSong.game}`;
    return null;
  }

  useEffect(() => {
    setCurrentClipDuration(0.3 + activeHint * 0.2);
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      audioRef.current.pause();
      setAudioProgress(0);
      setIsPlaying(false);
    }
  }, [activeHint, startTime]);

  useEffect(() => {
    setActiveHint(attempts);
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      audioRef.current.pause();
      setAudioProgress(0);
      setIsPlaying(false);
    }
  }, [attempts, startTime]);

  // Função para atualizar as informações da música
  const handleMusicInfoLoaded = (updatedSong) => {
    setCurrentSong(updatedSong);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className={styles.darkBg} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className={styles.topBar}>
          <div className={styles.titleBarContainer}>
            <span className={styles.titleBar}>Adivinhe a música tocada pela banda</span>
            <button
              className={styles.helpButton}
              onClick={() => setShowInstructions(true)}
              aria-label="Ajuda"
            >
              <FaQuestionCircle size={24} />
            </button>
          </div>
          {getProgressiveHint(currentSong, activeHint) && !gameOver && (
            <div className={styles.hintBoxModern} style={{ marginTop: 12, marginBottom: 0, maxWidth: 420, textAlign: 'center' }}>
              <strong>Dica:</strong> {getProgressiveHint(currentSong, activeHint)}
            </div>
          )}
        </div>

        {showInstructions && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <button
                className={styles.closeButton}
                onClick={() => setShowInstructions(false)}
              >
                ×
              </button>
              <h2>Como Jogar</h2>
              <div className={styles.modalContent}>
                <p>1. Clique play para ouvir um trecho da música.</p>
                <p>2. Procure pela música que você acha que o trecho pertence.</p>
                <p>3. Clique skip para passar para o próximo trecho.</p>
                <p>4. Se você errar, revelaremos um trecho adicional da música para ajudar.</p>
                <p>5. Você tem 6 tentativas no total.</p>
                <div className={styles.legendBox}>
                  <div className={styles.legendItem}>
                    <span className={styles.legendCorrect}>✅</span> = Correto
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendIncorrect}>❌</span> = Incorreto
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendFromGame}>▲</span> = Música errada, mas do jogo correto
                  </div>
                </div>
                <p className={styles.goodLuck}>Boa Sorte!</p>
              </div>
            </div>
          </div>
        )}

        <div className={styles.gameAreaModern}>
          <div className={styles.audioModernBox}>
            <div className={styles.customAudioPlayer}>
              <div className={styles.audioPlayerRow}>
                <span className={styles.audioTime}>{new Date(audioProgress * 1000).toISOString().substr(14, 5)}</span>
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
                        audioRef.current.currentTime = startTime;
                      }
                      setAudioProgress(0);
                      return;
                    }
                    if (value > currentClipDuration) value = currentClipDuration;
                    if (audioRef.current) {
                      audioRef.current.currentTime = startTime + value;
                      setAudioProgress(value);
                    }
                  } }
                  className={styles.audioSeekbarCustom}
                  disabled={gameOver || audioError || !audioDuration} />
                <span className={styles.audioTime} style={{ marginLeft: 10 }}>
                  {audioDuration
                    ? new Date(currentClipDuration * 1000).toISOString().substr(14, 5)
                    : '00:00'}
                </span>
              </div>
              <div className={styles.audioVolumeRow}>
                <button
                  className={styles.audioPlayBtnCustom}
                  onClick={() => {
                    if (!audioRef.current) return;

                    const currentTime = audioRef.current.currentTime - startTime;
                    if (currentTime >= currentClipDuration) {
                      // Se já passou do limite, volta para o início do trecho
                      audioRef.current.currentTime = startTime;
                      setAudioProgress(0);
                    }

                    if (isPlaying) {
                      audioRef.current.pause();
                    } else {
                      audioRef.current.play();
                    }
                  } }
                  disabled={audioError || !audioDuration}
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
                  disabled={audioError} />
              </div>
              <audio
                ref={audioRef}
                src={currentSong?.audioUrl}
                style={{ display: 'none' }}
                onEnded={handleAudioEnded}
                onError={() => {
                  setAudioError(true);
                  setMessage('Erro ao carregar o áudio. Verifique se o arquivo existe.');
                } }
                onLoadedMetadata={handleLoadedMetadata} />
            </div>
          </div>
          <div className={styles.attemptsRow}>
            {[...Array(MAX_ATTEMPTS)].map((_, idx) => {
              let statusClass = styles.attemptInactive;
              if (history[idx]) {
                if (history[idx].type === 'success') {
                  statusClass = styles.attemptSuccess;
                } else if (history[idx].type === 'fail') {
                  // Checa se o jogo está correto
                  const isFromCorrectGame = history[idx]?.type === 'fail' &&
                    currentSong?.game &&
                    songs.find(s => s.title === history[idx].value)?.game === currentSong.game;
                  if (isFromCorrectGame) {
                    statusClass = styles.attemptGame;
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
                  className={styles.attemptButton + ' ' + statusClass}
                  disabled={idx > attempts}
                  onClick={() => idx <= attempts && setActiveHint(idx)}
                  tabIndex={idx > attempts ? -1 : 0}
                >
                  {idx + 1}
                </button>
              );
            })}
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
              ref={inputRef}
              type="text"
              value={guess}
              onChange={handleInputChange}
              placeholder="Digite o nome da música..."
              disabled={gameOver || audioError}
              className={styles.guessInputModern}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
            <button
              type="submit"
              disabled={gameOver || audioError}
              className={`${styles.guessButtonModern} ${isShaking ? styles.shake : ''}`}
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
                    {suggestion.title} - {suggestion.game}
                  </li>
                ))}
              </ul>
            )}
          </form>
          <div className={styles.historyBox}>
            {history.map((item, idx) => {
              const isFromCorrectGame = item?.type === 'fail' &&
                currentSong?.game &&
                songs.find(s => s.title === item.value)?.game === currentSong.game;
              return (
                <div key={idx} className={styles.historyItem}>
                  {item?.type === 'skipped' && <span className={styles.historySkipped}>❌ Skipped!</span>}
                  {item?.type === 'fail' && (
                    <span className={isFromCorrectGame ? styles.historyFailButCorrectGame : styles.historyFail}>
                      {isFromCorrectGame ? '▲' : '❌'} {item.value}
                    </span>
                  )}
                  {item?.type === 'success' && <span className={styles.historySuccess}>✅ {item.value}</span>}
                </div>
              );
            })}
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
        {currentSong && (
          <MusicInfoFetcher
            song={currentSong}
            onInfoLoaded={handleMusicInfoLoaded} />
        )}
      </div>
      <Footer />
    </div>
  );
};