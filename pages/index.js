import { useState, useEffect, useRef } from 'react';
import { songs } from '../data/songs';
import styles from '../styles/Home.module.css';
import { FaPlay, FaPause, FaVolumeUp, FaFastForward, FaQuestionCircle, FaBars } from 'react-icons/fa';
import MusicInfoFetcher from '../components/MusicInfoFetcher';
import Footer from '../components/Footer';
import GameMenu from '../components/GameMenu';
import { useLanguage } from '../contexts/LanguageContext';

const MAX_ATTEMPTS = 6;
const GAME_INTERVAL = 24 * 60 * 60 * 1000; // 24h em ms

const TIMEZONE_API = 'http://worldtimeapi.org/api/timezone/America/Sao_Paulo';

export default function Home() {
  const { t, language, isClient } = useLanguage();
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
  const [timer, setTimer] = useState(null);
  const audioRef = useRef(null);
  const [activeHint, setActiveHint] = useState(0);
  const inputRef = useRef(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [currentDay, setCurrentDay] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  // Tempos máximos de reprodução por tentativa
  const maxClipDurations = [0.6, 1.2, 2.0, 3.0, 3.5, 4.2];

  // Limite máximo de reprodução em segundos
  const MAX_PLAY_TIME = 15;
  const fadeOutDuration = 1; // segundos
  const fadeOutSteps = 10;
  const fadeOutStepTime = fadeOutDuration / fadeOutSteps;
  const originalVolumeRef = useRef(volume);

  // Função para gerar um tempo determinístico dentro da duração da música com base no dia
  const getDeterministicStartTime = (duration, day) => {
    // Deixa uma margem de 10 segundos no final da música
    const maxStart = Math.max(0, duration - 10);

    // Usa o dia como semente para gerar um número determinístico entre 0 e 1
    // Multiplicamos o dia por um número primo para melhor distribuição
    const seed = (day * 31) % 997; // Usando números primos para melhor distribuição
    const deterministicRandom = (seed / 997); // Valor entre 0 e 1

    return deterministicRandom * maxStart;
  };

  // Função para buscar data/hora de São Paulo
  const fetchSaoPauloTime = async () => {
    try {
      const res = await fetch(TIMEZONE_API);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data;
    } catch (e) {
      // Fallback: usar data local do navegador
      const now = new Date();
      return {
        datetime: now.toISOString(),
        fallback: true
      };
    }
  };



  // Carregar música do minuto ao montar
  useEffect(() => {
    const loadMusicOfTheDay = async () => {
      setIsLoading(true);
      let timeData;
      try {
        timeData = await fetchSaoPauloTime();
      } catch (e) {
        timeData = {
          datetime: new Date().toISOString(),
          fallback: true
        };
      }
      const now = new Date(timeData.datetime);
      // Calcular o dia do ano
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
      setCurrentDay(dayOfYear);
      // Seleciona a música do dia de forma determinística e fixa
      const song = songs[dayOfYear % songs.length];
      setCurrentSong(song);
      // Calcular tempo até a próxima meia-noite
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      setTimer(nextMidnight - now);
      setIsLoading(false);
    };
    loadMusicOfTheDay();
  }, []);

  // Atualizar timer a cada segundo
  useEffect(() => {
    if (timer === null) return;
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev > 1000) return prev - 1000;
        // Quando zerar, recarrega a música do dia
        window.location.reload();
        return 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Atualiza duração do áudio ao carregar
  const handleLoadedMetadata = () => {
    if (audioRef.current && currentDay !== null) {
      const duration = audioRef.current.duration || 0;
      setAudioDuration(duration);

      // Verifica se já existe um tempo de início salvo para o dia atual
      const savedStartTimeKey = `bandle_start_time_day_${currentDay}`;
      let startTimeToUse;

      const savedStartTime = localStorage.getItem(savedStartTimeKey);
      if (savedStartTime) {
        // Usa o tempo salvo se existir
        startTimeToUse = parseFloat(savedStartTime);
      } else {
        // Gera um novo tempo determinístico baseado no dia e salva no localStorage
        startTimeToUse = getDeterministicStartTime(duration, currentDay);
        localStorage.setItem(savedStartTimeKey, startTimeToUse.toString());
      }

      setStartTime(startTimeToUse);
      audioRef.current.currentTime = startTimeToUse;

      // Aplicar configurações de som
      const savedSettings = localStorage.getItem('bandle_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          audioRef.current.muted = !settings.sound;
        } catch (error) {
          console.error('Erro ao aplicar configurações de som:', error);
        }
      }

      // Limpa o estado de erro quando o áudio carrega com sucesso
      setAudioError(false);
      if (message === 'Erro ao carregar o áudio. Verifique se o arquivo existe.') {
        setMessage('');
      }
    }
  };

  // Atualiza progresso e play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Tempo máximo para a tentativa atual
    const maxDuration = gameOver
      ? MAX_PLAY_TIME
      : maxClipDurations[attempts] || maxClipDurations[maxClipDurations.length - 1];

    let fadeOutTimeout = null;
    let fadeOutInterval = null;

    const updateProgress = () => {
      const currentTime = audio.currentTime - startTime;
      if (!gameOver && currentTime >= maxDuration) {
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = startTime;
        setAudioProgress(0);
      } else if (gameOver && currentTime >= MAX_PLAY_TIME) {
        // FADE OUT após 15s se o jogo acabou
        if (!fadeOutInterval) {
          let step = 0;
          originalVolumeRef.current = audio.volume;
          fadeOutInterval = setInterval(() => {
            step++;
            audio.volume = originalVolumeRef.current * (1 - step / fadeOutSteps);
            if (step >= fadeOutSteps) {
              clearInterval(fadeOutInterval);
              audio.pause();
              setIsPlaying(false);
              audio.currentTime = startTime;
              setAudioProgress(0);
              audio.volume = originalVolumeRef.current;
            }
          }, fadeOutStepTime * 1000);
        }
      } else {
        setAudioProgress(currentTime);
      }
    };

    const updatePlay = () => {
      const currentTime = audio.currentTime - startTime;
      if (!gameOver && currentTime >= maxDuration) {
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = startTime;
        setAudioProgress(0);
      } else if (gameOver && currentTime >= MAX_PLAY_TIME) {
        // FADE OUT após 15s se o jogo acabou
        if (!fadeOutInterval) {
          let step = 0;
          originalVolumeRef.current = audio.volume;
          fadeOutInterval = setInterval(() => {
            step++;
            audio.volume = originalVolumeRef.current * (1 - step / fadeOutSteps);
            if (step >= fadeOutSteps) {
              clearInterval(fadeOutInterval);
              audio.pause();
              setIsPlaying(false);
              audio.currentTime = startTime;
              setAudioProgress(0);
              audio.volume = originalVolumeRef.current;
            }
          }, fadeOutStepTime * 1000);
        }
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
      if (fadeOutInterval) clearInterval(fadeOutInterval);
      if (fadeOutTimeout) clearTimeout(fadeOutTimeout);
    };
  }, [audioRef.current, startTime, gameOver, attempts]);

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

    // Verifica se a música existe na lista
    const normalizedGuess = normalize(guess);
    const songExists = songs.some(song => normalize(song.title) === normalizedGuess);

    if (!songExists) {
      setMessage(t('select_from_list'));
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
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
      setMessage(t('congratulations'));
      setGameOver(true);
      result = { type: 'success', value: selectedGuess };
    } else if (newAttempts >= MAX_ATTEMPTS) {
      setMessage(`${t('game_over')} ${currentSong.title} - ${currentSong.artist}`);
      setGameOver(true);
      result = { type: 'fail', value: selectedGuess };
    } else {
      setMessage(t('try_again'));
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
    setMessage(t('skipped'));
    if (attempts + 1 >= MAX_ATTEMPTS) {
      setMessage(`${t('game_over')} ${currentSong.title} - ${currentSong.artist}`);
      setGameOver(true);
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

  // Limpa erros de áudio quando a música muda
  useEffect(() => {
    if (currentSong?.audioUrl) {
      // Reseta o estado de erro quando uma nova música é carregada
      setAudioError(false);
      if (message === 'Erro ao carregar o áudio. Verifique se o arquivo existe.') {
        setMessage('');
      }
    }
  }, [currentSong?.audioUrl, message]);

  // Persistência do estado de jogo terminado
  useEffect(() => {
    if (gameOver && currentDay !== null) {
      localStorage.setItem('bandle_gameover_day', currentDay);
      localStorage.setItem('bandle_gameover_history', JSON.stringify(history));
      localStorage.setItem('bandle_gameover_message', message);
    }
  }, [gameOver, currentDay, history, message]);

  // Limpa dados antigos do localStorage
  const cleanupOldLocalStorageData = (currentDay) => {
    // Mantém apenas os dados do dia atual e do dia anterior
    const keysToKeep = [
      `bandle_start_time_day_${currentDay}`,
      `bandle_start_time_day_${currentDay - 1}`,
      'bandle_gameover_day',
      'bandle_gameover_history',
      'bandle_gameover_message'
    ];

    // Procura por chaves antigas relacionadas ao bandle
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bandle_') && !keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    }
  };

  // Ao carregar, verifica se o usuário já terminou o desafio do dia
  useEffect(() => {
    if (currentDay !== null) {
      // Limpa dados antigos
      cleanupOldLocalStorageData(currentDay);

      const savedDay = localStorage.getItem('bandle_gameover_day');
      if (savedDay && Number(savedDay) === currentDay) {
        setGameOver(true);
        const savedHistory = localStorage.getItem('bandle_gameover_history');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        const savedMessage = localStorage.getItem('bandle_gameover_message');
        if (savedMessage) setMessage(savedMessage);
      }
    }
  }, [currentDay]);

  // Aplicar configurações salvas ao carregar e escutar mudanças
  useEffect(() => {
    // Função para aplicar as configurações
    const applySettings = () => {
      const savedSettings = localStorage.getItem('bandle_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          console.log('Aplicando configurações no componente principal:', settings);

          // Aplicar modo daltônico
          if (settings.daltonicMode) {
            document.body.classList.add('daltonism');
          } else {
            document.body.classList.remove('daltonism');
          }

          // Aplicar configuração de som
          if (audioRef.current) {
            audioRef.current.muted = !settings.sound;
          }

          // Aplicar configuração de animações
          if (!settings.animations) {
            document.body.classList.add('no-animations');
          } else {
            document.body.classList.remove('no-animations');
          }

          // Aplicar idioma
          if (settings.language) {
            document.documentElement.lang = settings.language;
          }
        } catch (error) {
          console.error('Erro ao aplicar configurações:', error);
        }
      }
    };

    // Aplicar configurações iniciais
    applySettings();

    // Escutar eventos de mudança de configurações
    const handleSettingsChanged = (event) => {
      console.log('Evento de mudança de configurações recebido:', event.detail);

      // Aplicar todas as configurações novamente
      if (event.detail) {
        // Aplicar modo daltônico
        if (event.detail.daltonicMode) {
          document.body.classList.add('daltonism');
        } else {
          document.body.classList.remove('daltonism');
        }

        // Aplicar configuração de som
        if (audioRef.current) {
          audioRef.current.muted = !event.detail.sound;

          // Garantir que o volume seja restaurado quando o som for ativado
          if (event.detail.sound && audioRef.current.volume === 0) {
            audioRef.current.volume = 0.7; // Volume padrão
          }
        }

        // Aplicar configuração de animações
        if (!event.detail.animations) {
          document.body.classList.add('no-animations');
        } else {
          document.body.classList.remove('no-animations');
        }

        // Aplicar idioma
        if (event.detail.language) {
          document.documentElement.lang = event.detail.language;
        }
      }
    };

    // Adicionar listener para o evento personalizado
    document.addEventListener('bandleSettingsChanged', handleSettingsChanged);

    // Adicionar listener para mudanças no localStorage
    window.addEventListener('storage', applySettings);

    // Limpar listeners ao desmontar
    return () => {
      document.removeEventListener('bandleSettingsChanged', handleSettingsChanged);
      window.removeEventListener('storage', applySettings);
    };
  }, []);

  // Já estamos usando isClient do contexto de idioma

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          {/* Usar texto fixo no servidor e tradução apenas no cliente */}
          {isClient ? t('loading') : 'Carregando...'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className={styles.darkBg} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className={styles.topBar}>
          <div className={styles.titleBarContainer}>
            <button
              className={styles.menuButton}
              onClick={() => setShowMenu(true)}
              aria-label="Menu"
            >
              <FaBars size={24} />
            </button>
            <img src="/Logo.png" alt="Logo" className={styles.logo} />
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
                <p>Aviso: Após dar play na musica, ela pode demorar um pouco para carregar, é normal</p>
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
                <span className={styles.audioTime}>{new Date(audioProgress * 1000).toISOString().substring(14, 19)}</span>
                <input
                  type="range"
                  min={0}
                  max={maxClipDurations[attempts] || maxClipDurations[maxClipDurations.length - 1]}
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
                    if (value > maxClipDurations[attempts] || value > maxClipDurations[maxClipDurations.length - 1]) value = maxClipDurations[attempts] || maxClipDurations[maxClipDurations.length - 1];
                    if (audioRef.current) {
                      audioRef.current.currentTime = startTime + value;
                      setAudioProgress(value);
                    }
                  } }
                  className={styles.audioSeekbarCustom}
                  disabled={gameOver || audioError || !audioDuration} />
                <span className={styles.audioTime} style={{ marginLeft: 10 }}>
                  {audioDuration
                    ? new Date(
                        (maxClipDurations[attempts] ?? maxClipDurations[maxClipDurations.length - 1]) * 1000
                      ).toISOString().substring(14, 19)
                    : '00:00'}
                </span>
              </div>
              <div className={styles.audioVolumeRow}>
                <button
                  className={styles.audioPlayBtnCustom}
                  onClick={() => {
                    if (!audioRef.current) return;

                    const currentTime = audioRef.current.currentTime - startTime;
                    if (currentTime >= maxClipDurations[attempts] || currentTime >= maxClipDurations[maxClipDurations.length - 1]) {
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
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleAudioEnded}
                onError={() => {
                  setAudioError(true);
                  setMessage('Erro ao carregar o áudio. Verifique se o arquivo existe.');
                }}
                onCanPlay={() => {
                  setAudioError(false);
                  if (message === 'Erro ao carregar o áudio. Verifique se o arquivo existe.') {
                    setMessage('');
                  }
                }} />
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
              {isClient ? t('skip') : 'Skip'} <FaFastForward style={{ marginLeft: 4, fontSize: '1em', verticalAlign: 'middle' }} />
            </button>
          </div>
          <form onSubmit={handleGuess} className={styles.guessFormModern} autoComplete="off">
            <input
              ref={inputRef}
              type="text"
              value={guess}
              onChange={handleInputChange}
              placeholder={isClient ? t('song_input_placeholder') : 'Digite o nome da música...'}
              disabled={gameOver || audioError}
              className={styles.guessInputModern}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
            <button
              type="submit"
              disabled={gameOver || audioError || !guess.trim()}
              className={`${styles.guessButtonModern} ${isShaking ? styles.shake : ''}`}
            >
              {isClient ? t('guess') : 'Adivinhar'}
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
          <div className={styles.timerBox}>
            Novo jogo em: <span className={styles.timer}>{formatTimer(timer)}</span>
          </div>
        </div>
        {currentSong && (
          <MusicInfoFetcher
            song={currentSong}
            onInfoLoaded={handleMusicInfoLoaded} />
        )}

        {/* Menu do jogo */}
        <GameMenu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
        />
      </div>
      <Footer />
    </div>
  );
};