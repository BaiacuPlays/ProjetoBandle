import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMultiplayerContext } from '../contexts/MultiplayerContext';
import { songs } from '../data/songs';
import styles from '../styles/Multiplayer.module.css';
import gameStyles from '../styles/Home.module.css';
import { FaPlay, FaPause, FaVolumeUp, FaFastForward } from 'react-icons/fa';

const MultiplayerGame = ({ onBackToLobby }) => {

  const { t, isClient } = useLanguage();
  const { state, actions } = useMultiplayerContext();
  const {
    playerNickname: nickname,
    lobbyData,
    error
  } = state;

  // Detecção de navegador para compatibilidade
  const [browserInfo, setBrowserInfo] = useState(null);

  useEffect(() => {
    const detectBrowser = () => {
      const ua = navigator.userAgent;
      const info = {
        isIE: /MSIE|Trident/.test(ua),
        isEdge: /Edge/.test(ua),
        isChrome: /Chrome/.test(ua) && !/Edge/.test(ua),
        isFirefox: /Firefox/.test(ua),
        isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
        isMobile: /Mobile|Android|iPhone|iPad/.test(ua),
        supportsAudioContext: !!(window.AudioContext || window.webkitAudioContext),
        supportsPromises: typeof Promise !== 'undefined',
        supportsFetch: typeof fetch !== 'undefined'
      };

      console.log('🌐 BROWSER INFO:', info);
      setBrowserInfo(info);

      // Avisos para navegadores problemáticos
      if (info.isIE) {
        alert('⚠️ Internet Explorer não é suportado. Use Chrome, Firefox ou Edge.');
      }

      if (info.isMobile) {
        console.log('📱 DISPOSITIVO MÓVEL DETECTADO - Pode haver limitações de áudio');
      }
    };

    detectBrowser();
  }, []);



  const [guess, setGuess] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isShaking, setIsShaking] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const audioRef = useRef(null);
  const inputRef = useRef(null);

  const gameState = lobbyData?.gameState;
  const currentSong = lobbyData?.currentSong;
  const isHost = lobbyData?.host === nickname;
  const roundWinners = gameState?.roundWinners || [];
  const roundFinished = gameState?.roundFinished || false;
  const gameFinished = gameState?.gameFinished;
  const myAttempts = gameState?.attempts?.[nickname] || 0;


  // Tempos de duração iguais ao single player
  const maxClipDurations = [0.6, 1.2, 2.0, 3.0, 3.5, 4.2];

  // Verificar se o jogador atual é um dos vencedores
  const iAmWinner = roundWinners.includes(nickname);

  // Determinar qual música tocar
  let songToPlay = currentSong;
  if (!songToPlay && gameState?.songs && gameState.songs.length > 0) {
    const currentRoundIndex = (gameState.currentRound || 1) - 1;
    songToPlay = gameState.songs[currentRoundIndex];
  }

  // Garantir que temos uma música válida para tocar
  if (!songToPlay && gameState?.currentSong) {
    // Tentar encontrar a música pelo título na lista de músicas
    songToPlay = songs.find(song =>
      song.title.trim().toLowerCase() === gameState.currentSong.trim().toLowerCase()
    );
  }



  // Função para gerar tempo determinístico
  const getDeterministicStartTime = (duration, songId) => {
    const maxStart = Math.max(0, duration - 10);
    const seed = (songId * 31) % 997;
    const deterministicRandom = (seed / 997);
    return deterministicRandom * maxStart;
  };

  // Configurar áudio quando a música muda
  useEffect(() => {
    let songToUse = currentSong;

    // Se não temos currentSong, tentar obter da lista de músicas do gameState
    if (!songToUse && gameState?.songs && gameState.songs.length > 0) {
      const currentRoundIndex = (gameState.currentRound || 1) - 1;
      songToUse = gameState.songs[currentRoundIndex];
    }

    // Se ainda não temos música, tentar buscar pelo título no gameState
    if (!songToUse && gameState?.currentSong) {
      songToUse = songs.find(song =>
        song.title.trim().toLowerCase() === gameState.currentSong.trim().toLowerCase()
      );
    }



    if (songToUse && audioRef.current) {
      const handleLoadedMetadata = () => {
        const duration = audioRef.current.duration || 0;
        const startTimeToUse = getDeterministicStartTime(duration, songToUse.id);
        setStartTime(startTimeToUse);
        audioRef.current.currentTime = startTimeToUse;
        setAudioProgress(0);

      };

      const handleError = () => {

      };

      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('error', handleError);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('error', handleError);
        }
      };
    }
  }, [currentSong, gameState?.songs, gameState?.currentRound, gameState?.currentSong]);

  // Controle de progresso do áudio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const maxDuration = iAmWinner
      ? 15 // Se EU ganhei, posso tocar mais tempo
      : maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1];

    const updateProgress = () => {
      const currentTime = audio.currentTime - startTime;

      // Sempre parar após 15 segundos, independente do status
      if (currentTime >= 15) {
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = startTime;
        setAudioProgress(0);
      } else if (!iAmWinner && currentTime >= maxDuration) {
        // Parar baseado nas tentativas apenas se EU não ganhei
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = startTime;
        setAudioProgress(0);
      } else {
        setAudioProgress(currentTime);
      }
    };

    const updatePlay = () => {
      setIsPlaying(!audio.paused);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play', updatePlay);
    audio.addEventListener('pause', updatePlay);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('play', updatePlay);
      audio.removeEventListener('pause', updatePlay);
    };
  }, [startTime, myAttempts, iAmWinner]);

  // Reset do estado do áudio e interface quando a rodada muda
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setAudioProgress(0);

      if (startTime !== undefined) {
        audioRef.current.currentTime = startTime;
      }
    }

    setGuess('');
    setShowSuggestions(false);
    setFilteredSuggestions([]);
    setIsShaking(false);
  }, [gameState?.currentRound, startTime]);

  // Garantir que o áudio seja configurado corretamente quando a URL muda
  useEffect(() => {
    if (audioRef.current && songToPlay?.audioUrl) {
      audioRef.current.pause();
      setIsPlaying(false);
      setAudioProgress(0);
      audioRef.current.load();
    }
  }, [songToPlay?.audioUrl]);

  // Normalizar string para comparação - IGUAL AO JOGO NORMAL
  const normalize = str => str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase() // Converte para minúsculo
    .replace(/[^a-z0-9]/g, ''); // Remove tudo que não for letra ou número

  // Função de prioridade - IGUAL AO JOGO NORMAL
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

  // Filtrar sugestões - EXATAMENTE IGUAL AO JOGO NORMAL
  const filterSuggestions = (value) => {
    if (value.length > 0) {
      // Divide o valor de busca em palavras, mas como normalize remove espaços,
      // vamos dividir antes de normalizar para manter a lógica correta
      const originalWords = value.trim().split(/\s+/).filter(word => word.length > 0);
      const searchWords = originalWords.map(word => normalize(word)).filter(word => word.length > 1);

      // Se não há palavras válidas (apenas palavras de 1 letra), não mostrar sugestões
      if (searchWords.length === 0) {
        setFilteredSuggestions([]);
        setShowSuggestions(false);
        return [];
      }

      const suggestions = songs
        .filter(song => {
          const nTitle = normalize(song.title);
          const nGame = normalize(song.game);
          const nArtist = normalize(song.artist);

          // Verifica se pelo menos uma palavra da busca está presente em algum dos campos
          return searchWords.some(word =>
            nTitle.includes(word) ||
            nGame.includes(word) ||
            nArtist.includes(word)
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
        })
        .slice(0, 20); // Otimizado: 20 sugestões para melhor performance

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

  const handleInputFocus = () => {
    // IGUAL AO JOGO NORMAL - só filtra se já tem texto
    if (guess.trim()) {
      filterSuggestions(guess);
    } else {
      // Otimizado: menos sugestões aleatórias
      const randomSuggestions = songs.slice(0, 8);
      setFilteredSuggestions(randomSuggestions);
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setGuess(suggestion.title);
    setShowSuggestions(false);
  };

  const handleGuess = async (e) => {
    e.preventDefault();
    if (roundFinished || !guess.trim() || isSubmitting) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // Verificar se a música existe na lista
    const normalizedGuess = normalize(guess);
    const songExists = songs.some(song => {
      const normalizedTitle = normalize(song.title);
      return normalizedTitle === normalizedGuess;
    });

    if (!songExists) {
      actions.setError(isClient ? t('select_from_list') : 'Selecione uma música da lista');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setTimeout(() => actions.setError(''), 3000); // Limpar erro após 3 segundos
      return;
    }

    setIsSubmitting(true);
    const result = await actions.makeGuess(guess.trim());
    setIsSubmitting(false);

    if (result.success) {
      setGuess('');
      setShowSuggestions(false);

      if (result.correct) {
        if (result.tooLate) {
          actions.setError(result.message || 'Alguém já havia acertado primeiro!');
          setTimeout(() => actions.setError(''), 4000);
        } else {
          actions.setError('');
        }
      } else if (result.gameCorrect) {
        actions.setError('Jogo correto! Tente adivinhar a música específica.');
        setTimeout(() => actions.setError(''), 3000);
      }
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleNextRound = async () => {
    await actions.nextRound();
  };

  const handleSkip = async () => {
    await actions.skipRound();
  };

  // Função para gerar dicas progressivas - IGUAL AO JOGO NORMAL
  const getProgressiveHint = (song, hintIdx) => {
    if (!song) return null;
    if (hintIdx === 0) return null;
    if (hintIdx === 1) {
      // Tentar obter duração real do áudio, senão usar padrão
      if (audioRef.current && audioRef.current.duration) {
        const duration = audioRef.current.duration;
        const min = Math.floor(duration / 60) || 0;
        const sec = Math.floor(duration % 60) || 0;
        const formatted = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        return `Duração: ${formatted}`;
      }
      return `Duração: ~3:00`; // Fallback
    }
    if (hintIdx === 2) return `Ano de lançamento: ${song.year}`;
    if (hintIdx === 3) return `Artista: ${song.artist}`;
    if (hintIdx === 4) return `Console: ${song.console || 'Desconhecido'}`;
    if (hintIdx >= 5) return `Franquia: ${song.game}`;
    return null;
  };

  const handleLeaveGame = async () => {
    actions.reset();
    onBackToLobby();
  };

  const handleResetGame = async () => {
    await actions.resetGame();
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    const currentTime = audioRef.current.currentTime - startTime;
    const maxDuration = iAmWinner
      ? 15
      : maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1];

    if (currentTime >= 15 || (!iAmWinner && currentTime >= maxDuration)) {
      audioRef.current.currentTime = startTime;
      setAudioProgress(0);
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (audioRef.current.currentTime < startTime || audioRef.current.currentTime > startTime + maxDuration) {
        audioRef.current.currentTime = startTime;
        setAudioProgress(0);
      }

      // Melhor compatibilidade com navegadores
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('🚨 ERRO DE REPRODUÇÃO:', {
            error: error.message,
            browser: navigator.userAgent,
            audioState: {
              readyState: audioRef.current?.readyState,
              networkState: audioRef.current?.networkState,
              src: audioRef.current?.src
            }
          });

          // Tentar forçar interação do usuário
          if (error.name === 'NotAllowedError') {
            alert('⚠️ Clique em qualquer lugar da página para permitir reprodução de áudio!');
          }
        });
      }
    }
  };

  // Calcular pontuações finais
  const getFinalScores = () => {
    if (!gameState?.scores) return [];

    return Object.entries(gameState.scores)
      .map(([player, score]) => ({ player, score }))
      .sort((a, b) => b.score - a.score);
  };

  const finalScores = getFinalScores();
  const maxScore = finalScores.length > 0 ? finalScores[0].score : 0;
  const winners = finalScores.filter(item => item.score === maxScore);

  if (!lobbyData || !lobbyData.gameStarted || !gameState) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            {isClient ? t('loading') : 'Carregando...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.gameContainer}>
          {/* Header do jogo */}
          <div className={styles.gameHeader}>
            <div className={styles.roundInfo}>
              {gameFinished ? (
                isClient ? t('game_finished') : 'Jogo Finalizado!'
              ) : gameState.isTiebreaker ? (
                isClient ? t('tiebreaker_round') : 'Rodada de Desempate'
              ) : (
                `${isClient ? t('round') : 'Rodada'} ${gameState.currentRound}/${gameState.totalRounds}`
              )}
            </div>

            <div className={styles.scoreBoard}>
              {Object.entries(gameState.scores || {}).map(([player, score], index) => (
                <div
                  key={`${player}-${index}`}
                  className={`${styles.scoreItem} ${player === nickname ? styles.currentPlayer : ''}`}
                >
                  {player}: {score}
                </div>
              ))}
            </div>
          </div>

          {/* Dicas progressivas - IGUAL AO JOGO NORMAL */}
          {getProgressiveHint(songToPlay, myAttempts) && !gameFinished && !roundFinished && (
            <div className={styles.hintBox}>
              <strong>Dica:</strong> {getProgressiveHint(songToPlay, myAttempts)}
            </div>
          )}

          {gameFinished ? (
            /* Tela de fim de jogo */
            <div style={{ textAlign: 'center' }}>
              <h2>{isClient ? t('final_scores') : 'Pontuação Final'}</h2>

              {/* Explicação do sistema de pontuação */}
              <div className={styles.pointsExplanation}>
                <p>Sistema de Pontuação:</p>
                <p>6 pontos (sem dicas) • 5 pontos (1 dica) • 4 pontos (2 dicas) • 3 pontos (3 dicas) • 2 pontos (4 dicas) • 1 ponto (5 dicas)</p>
              </div>

              <div style={{ margin: '30px 0' }}>
                {finalScores.map((item, index) => (
                  <div key={item.player} className={styles.scoreItem} style={{
                    margin: '10px auto',
                    maxWidth: '300px',
                    fontSize: index === 0 ? '1.2rem' : '1rem',
                    fontWeight: index === 0 ? 'bold' : 'normal'
                  }}>
                    #{index + 1} {item.player}: {item.score} pontos
                  </div>
                ))}
              </div>

              <div className={`${styles.message} ${styles.messageSuccess}`}>
                {winners.length === 1
                  ? `${isClient ? t('winner') : 'Vencedor'}: ${winners[0].player}!`
                  : `${isClient ? t('tie') : 'Empate'}! ${winners.map(w => w.player).join(', ')}`
                }
              </div>

              <div className={styles.buttonGroup}>
                <button
                  className={styles.secondaryButton}
                  onClick={handleLeaveGame}
                >
                  {isClient ? t('back_to_lobby') : 'Voltar ao Lobby'}
                </button>

                {isHost && (
                  <button
                    className={styles.primaryButton}
                    onClick={handleResetGame}
                  >
                    {isClient ? t('play_again') : 'Jogar Novamente'}
                  </button>
                )}
              </div>

              {/* Botão voltar para o menu principal */}
              <div style={{ marginTop: '15px' }}>
                <button
                  className={styles.secondaryButton}
                  onClick={() => window.location.href = '/'}
                  style={{
                    background: 'linear-gradient(45deg, #666, #888)',
                    width: '100%'
                  }}
                >
                  🏠 Voltar ao Menu Principal
                </button>
              </div>
            </div>
          ) : (
            /* Jogo em andamento */
            <>
              {/* Player de áudio */}
              <div className={gameStyles.audioModernBox}>
                <div className={gameStyles.customAudioPlayer}>
                  <div className={gameStyles.audioPlayerRow}>
                    <span className={gameStyles.audioTime}>
                      {new Date(audioProgress * 1000).toISOString().substring(14, 19)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={Math.min(15, iAmWinner ? 15 : (maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1]))}
                      step={0.01}
                      value={audioProgress}
                      onChange={e => {
                        if (audioRef.current && isPlaying) {
                          const value = Number(e.target.value);
                          // Garantir que não exceda 15 segundos
                          const clampedValue = Math.min(value, 15);
                          audioRef.current.currentTime = startTime + clampedValue;
                          setAudioProgress(clampedValue);
                        }
                      }}
                      className={gameStyles.audioSeekbarCustom}
                      disabled={!songToPlay}
                    />
                    <span className={gameStyles.audioTime}>
                      {new Date(Math.min(15, iAmWinner ? 15 : (maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1])) * 1000).toISOString().substring(14, 19)}
                    </span>
                  </div>
                  <div className={gameStyles.audioVolumeRow}>
                    <button
                      className={gameStyles.audioPlayBtnCustom}
                      onClick={handlePlayPause}
                      disabled={!songToPlay}
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
                      onChange={e => {
                        setVolume(Number(e.target.value));
                        if (audioRef.current) {
                          audioRef.current.volume = Number(e.target.value);
                        }
                      }}
                      className={gameStyles.audioVolumeCustom}
                    />
                  </div>
                  <audio
                    ref={audioRef}
                    src={songToPlay?.audioUrl}
                    style={{ display: 'none' }}
                    onError={() => {
                      actions.setError('Erro ao carregar áudio');
                    }}
                  />
                </div>
              </div>

              {/* Informação de pontuação */}
              <div className={gameStyles.pointsInfo}>
                <span className={gameStyles.pointsText}>
                  {myAttempts === 0 ? '6 pontos' :
                   myAttempts === 1 ? '5 pontos' :
                   myAttempts === 2 ? '4 pontos' :
                   myAttempts === 3 ? '3 pontos' :
                   myAttempts === 4 ? '2 pontos' :
                   myAttempts === 5 ? '1 ponto' : '0 pontos'}
                  {myAttempts < 6 && ' se acertar agora'}
                </span>
              </div>

              {/* Tentativas */}
              <div className={gameStyles.attemptsRow}>
                {[...Array(6)].map((_, idx) => {
                  let buttonClass = gameStyles.attemptInactive;

                  // Obter histórico de tentativas
                  const myGuesses = gameState?.guesses?.[nickname] || [];
                  const attemptGuess = myGuesses[idx];

                  // Usar o histórico de tentativas como fonte principal
                  if (attemptGuess) {
                    if (attemptGuess.correct && !attemptGuess.tooLate) {
                      // Acertou a música e foi o primeiro - VERDE
                      buttonClass = gameStyles.attemptSuccess;
                    } else if (attemptGuess.gameCorrect && !attemptGuess.correct) {
                      // Acertou o jogo mas não a música - AMARELO
                      buttonClass = gameStyles.attemptGame;
                    } else if (attemptGuess.type === 'skipped') {
                      // Skip - VERMELHO
                      buttonClass = gameStyles.attemptFail;
                    } else {
                      // Errou ou chegou tarde - VERMELHO
                      buttonClass = gameStyles.attemptFail;
                    }
                  } else if (idx < myAttempts) {
                    // Fallback: se não temos histórico mas sabemos que houve tentativa
                    // NÃO assumir que a última tentativa foi correta só porque o jogador venceu
                    // O histórico deve ser a fonte da verdade
                    buttonClass = gameStyles.attemptFail;
                  }

                  // Tooltip com a tentativa feita
                  const tooltipText = attemptGuess
                    ? attemptGuess.type === 'skipped'
                      ? 'Pulou'
                      : attemptGuess.guess
                    : '';

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`${gameStyles.attemptButton} ${buttonClass}`}
                      disabled
                      title={tooltipText}
                      style={{ cursor: tooltipText ? 'help' : 'default' }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}

                {/* Botão de Skip - IGUAL AO JOGO NORMAL */}
                <button
                  type="button"
                  className={`${gameStyles.attemptButton} ${gameStyles.attemptInactive}`}
                  onClick={handleSkip}
                  disabled={roundFinished || myAttempts >= 6 || iAmWinner}
                  style={{ marginLeft: '10px' }}
                >
                  {isClient ? t('skip') : 'Pular'} <FaFastForward style={{ marginLeft: 4, fontSize: '1em', verticalAlign: 'middle' }} />
                </button>
              </div>

              {/* Formulário de tentativa - LOGO APÓS OS NÚMEROS */}
              {!roundFinished && !iAmWinner && (
                <form onSubmit={handleGuess} className={gameStyles.guessFormModern} autoComplete="off" style={{ marginTop: '15px' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={guess}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={isClient ? t('song_input_placeholder') : 'Digite o nome da música...'}
                    disabled={myAttempts >= 6}
                    className={gameStyles.guessInputModern}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  <button
                    type="submit"
                    disabled={myAttempts >= 6 || !guess.trim() || isSubmitting}
                    className={`${gameStyles.guessButtonModern} ${isShaking ? gameStyles.shake : ''}`}
                  >
                    {isSubmitting ? 'Enviando...' : (isClient ? t('guess') : 'Adivinhar')}
                  </button>
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <ul className={gameStyles.suggestionsListModern}>
                      {filteredSuggestions.map((suggestion, suggestionIndex) => (
                        <li
                          key={`mp-suggestion-${suggestion.id}-${suggestionIndex}`}
                          className={gameStyles.suggestionItemModern}
                          onMouseDown={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion.game} - {suggestion.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </form>
              )}

              {/* Mensagem quando esgotou tentativas */}
              {myAttempts >= 6 && !roundFinished && !iAmWinner && (
                <div className={`${styles.message} ${styles.messageWarning}`} style={{ marginTop: '15px' }}>
                  <div style={{ fontSize: '1rem', marginBottom: '8px' }}>
                    😔 Você esgotou suas tentativas!
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    Aguardando outros jogadores terminarem...
                  </div>
                </div>
              )}



              {/* Suas tentativas em tempo real */}
              {gameState?.guesses?.[nickname]?.length > 0 && !roundFinished && (
                <div style={{ marginTop: '15px' }}>
                  <div style={{
                    marginBottom: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    color: '#4ecdc4',
                    textAlign: 'center'
                  }}>
                    Suas Tentativas
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px',
                    backdropFilter: 'blur(10px)',
                    maxHeight: '100px',
                    overflowY: 'auto'
                  }}>
                    {gameState.guesses[nickname].map((guessData, index) => (
                      <div key={`live-guess-${index}-${guessData.attempt || index}`} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: index === gameState.guesses[nickname].length - 1 ? '0' : '6px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: guessData.correct
                          ? 'rgba(46, 125, 50, 0.8)'
                          : guessData.gameCorrect
                            ? 'rgba(245, 124, 0, 0.8)'
                            : guessData.type === 'skipped'
                              ? 'rgba(97, 97, 97, 0.8)'
                              : 'rgba(198, 40, 40, 0.8)',
                        border: `2px solid ${
                          guessData.correct
                            ? '#4caf50'
                            : guessData.gameCorrect
                              ? '#ff9800'
                              : guessData.type === 'skipped'
                                ? '#757575'
                                : '#f44336'
                        }`,
                        fontSize: '0.9rem'
                      }}>
                        <span style={{
                          color: '#ffffff',
                          fontWeight: '600',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                        }}>
                          {index + 1}. {guessData.type === 'skipped' ? 'Pulou' : guessData.guess}
                        </span>
                        <span style={{
                          fontSize: '1rem',
                          filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.8))'
                        }}>
                          {guessData.correct ? '✅' :
                           guessData.gameCorrect ? '🎮' :
                           guessData.type === 'skipped' ? '⏭️' : '❌'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status dos Jogadores - COMPACTO */}
              <div style={{ marginTop: '15px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '10px',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center'
                }}>
                  {lobbyData?.players?.map((player, playerIndex) => {
                    const playerAttempts = gameState?.attempts?.[player] || 0;
                    const playerWon = roundWinners.includes(player);
                    const playerFinished = playerWon || playerAttempts >= 6;
                    const isCurrentPlayer = player === nickname;

                    return (
                      <div key={`compact-player-${player}-${playerIndex}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: isCurrentPlayer
                          ? 'rgba(78, 205, 196, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isCurrentPlayer
                          ? '1px solid rgba(78, 205, 196, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.8rem'
                      }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: playerWon ? '#4caf50' : playerFinished ? '#ff9800' : '#2196f3',
                          boxShadow: `0 0 4px ${playerWon ? '#4caf50' : playerFinished ? '#ff9800' : '#2196f3'}50`
                        }}></div>
                        <span style={{
                          color: isCurrentPlayer ? '#4ecdc4' : '#fff',
                          fontWeight: isCurrentPlayer ? 'bold' : 'normal'
                        }}>
                          {player}
                        </span>
                        <span style={{
                          color: playerWon ? '#4caf50' : playerFinished ? '#ff9800' : '#ccc',
                          fontSize: '0.75rem'
                        }}>
                          {playerWon ? '✅' :
                           playerFinished ? '😔' :
                           `${playerAttempts}/6`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conteúdo quando o jogador acertou */}
              {iAmWinner && !roundFinished && (
                /* Jogador acertou mas está esperando outros */
                <div className={`${styles.message} ${styles.messageSuccess}`}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                    🎉 Parabéns! Você acertou!
                  </div>
                  <div style={{ fontSize: '1rem', marginBottom: '15px' }}>
                    <strong>{songToPlay?.game} - {songToPlay?.title}</strong>
                  </div>
                  <div className={styles.pointsEarned}>
                    +{Math.max(0, 6 - myAttempts + 1)} pontos!
                  </div>
                  <div style={{ marginTop: '15px', fontSize: '0.9rem', opacity: 0.8 }}>
                    Aguardando outros jogadores terminarem suas tentativas...
                  </div>

                  {/* Histórico de tentativas do jogador */}
                  <div style={{ marginTop: '20px' }}>
                    <div style={{
                      marginBottom: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      color: '#4ecdc4',
                      textAlign: 'center'
                    }}>
                      Suas Tentativas
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '15px',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {gameState?.guesses?.[nickname]?.length > 0 ? (
                        gameState.guesses[nickname].map((guessData, index) => (
                          <div key={`guess-${index}-${guessData.attempt || index}`} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '5px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: guessData.correct
                              ? 'rgba(76, 175, 80, 0.2)'
                              : guessData.gameCorrect
                                ? 'rgba(255, 193, 7, 0.2)'
                                : guessData.type === 'skipped'
                                  ? 'rgba(158, 158, 158, 0.2)'
                                  : 'rgba(244, 67, 54, 0.2)',
                            border: `1px solid ${
                              guessData.correct
                                ? 'rgba(76, 175, 80, 0.4)'
                                : guessData.gameCorrect
                                  ? 'rgba(255, 193, 7, 0.4)'
                                  : guessData.type === 'skipped'
                                    ? 'rgba(158, 158, 158, 0.4)'
                                    : 'rgba(244, 67, 54, 0.4)'
                            }`
                          }}>
                            <span style={{
                              color: guessData.correct
                                ? '#4caf50'
                                : guessData.gameCorrect
                                  ? '#ffc107'
                                  : guessData.type === 'skipped'
                                    ? '#9e9e9e'
                                    : '#f44336'
                            }}>
                              {guessData.type === 'skipped' ? '⏭️ Pulou' : guessData.guess}
                            </span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                              {guessData.correct ? '✅' :
                               guessData.gameCorrect ? '🎮' :
                               guessData.type === 'skipped' ? '⏭️' : '❌'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: 'center', opacity: 0.6 }}>
                          Nenhuma tentativa ainda
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status dos outros jogadores */}
                  <div style={{ marginTop: '20px' }}>
                    <div style={{
                      marginBottom: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      color: '#4ecdc4',
                      textAlign: 'center'
                    }}>
                      Status dos Jogadores
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '15px',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {lobbyData?.players?.map((player, playerIndex) => {
                        const playerAttempts = gameState?.attempts?.[player] || 0;
                        const playerWon = roundWinners.includes(player);
                        const playerFinished = playerWon || playerAttempts >= 6;
                        const isCurrentPlayer = player === nickname;

                        return (
                          <div key={`player-status-${player}-${playerIndex}`} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: playerIndex === lobbyData.players.length - 1 ? '0' : '10px',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: isCurrentPlayer
                              ? 'rgba(78, 205, 196, 0.15)'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isCurrentPlayer
                              ? '1px solid rgba(78, 205, 196, 0.3)'
                              : '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'all 0.3s ease'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: playerWon ? '#4caf50' : playerFinished ? '#ff9800' : '#2196f3',
                                boxShadow: `0 0 8px ${playerWon ? '#4caf50' : playerFinished ? '#ff9800' : '#2196f3'}50`
                              }}></div>
                              <span style={{
                                fontWeight: isCurrentPlayer ? 'bold' : 'normal',
                                color: isCurrentPlayer ? '#4ecdc4' : '#fff',
                                fontSize: '0.9rem'
                              }}>
                                {player}
                                {isCurrentPlayer && <span style={{
                                  fontSize: '0.7rem',
                                  opacity: 0.7,
                                  marginLeft: '6px'
                                }}>(você)</span>}
                              </span>
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span style={{
                                fontSize: '0.8rem',
                                color: playerWon ? '#4caf50' : playerFinished ? '#ff9800' : '#ccc',
                                fontWeight: '500'
                              }}>
                                {playerWon ? 'Acertou' :
                                 playerFinished ? 'Terminou' :
                                 `${playerAttempts}/6`}
                              </span>
                              <span style={{ fontSize: '1rem' }}>
                                {playerWon ? '🎉' :
                                 playerFinished ? '😔' :
                                 '🎮'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagem final da rodada - SÓ QUANDO TERMINOU */}
              {roundFinished && (
                <div style={{
                  background: roundWinners.includes('NONE')
                    ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 152, 0, 0.15))'
                    : 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(139, 195, 74, 0.15))',
                  border: `2px solid ${roundWinners.includes('NONE') ? '#ffc107' : '#4caf50'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  margin: '20px 0',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: roundWinners.includes('NONE') ? '#ffc107' : '#4caf50',
                    marginBottom: '10px',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)'
                  }}>
                    {roundWinners.includes('NONE')
                      ? (isClient ? t('no_one_guessed') : 'Ninguém acertou a música!')
                      : roundWinners.length === 1
                        ? roundWinners[0] === nickname
                          ? (isClient ? t('congratulations') : 'Parabéns! Você acertou!')
                          : `${roundWinners[0]} ${isClient ? t('player_guessed_correctly') : 'acertou a música!'}`
                        : roundWinners.length === lobbyData.players.length
                          ? (isClient ? 'Todos acertaram!' : 'Todos acertaram!')
                          : `${roundWinners.length} jogadores acertaram: ${roundWinners.join(', ')}`
                    }
                  </div>

                  {/* Informações da música com melhor legibilidade */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '15px',
                    margin: '15px 0',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      textAlign: 'center',
                      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
                    }}>
                      {songToPlay?.game} - {songToPlay?.title}
                    </div>
                  </div>

                  {/* Mostrar pontos ganhos se o jogador atual ganhou */}
                  {iAmWinner && (
                    <div className={styles.pointsEarned}>
                      +{Math.max(0, 6 - myAttempts + 1)} pontos!
                    </div>
                  )}

                  {/* Histórico de tentativas na tela final */}
                  {gameState?.guesses?.[nickname]?.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{
                        marginBottom: '12px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#4ecdc4',
                        textAlign: 'center',
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)'
                      }}>
                        Suas Tentativas desta Rodada
                      </div>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        padding: '15px',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        backdropFilter: 'blur(10px)'
                      }}>
                        {gameState.guesses[nickname].map((guessData, index) => (
                          <div key={`final-guess-${index}-${guessData.attempt || index}`} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '4px',
                            padding: '3px 6px',
                            borderRadius: '3px',
                            background: guessData.correct
                              ? 'rgba(76, 175, 80, 0.2)'
                              : guessData.gameCorrect
                                ? 'rgba(255, 193, 7, 0.2)'
                                : guessData.type === 'skipped'
                                  ? 'rgba(158, 158, 158, 0.2)'
                                  : 'rgba(244, 67, 54, 0.2)',
                            fontSize: '0.8rem'
                          }}>
                            <span style={{
                              color: guessData.correct
                                ? '#4caf50'
                                : guessData.gameCorrect
                                  ? '#ffc107'
                                  : guessData.type === 'skipped'
                                    ? '#9e9e9e'
                                    : '#f44336',
                              fontWeight: 'bold',
                              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                            }}>
                              {index + 1}. {guessData.type === 'skipped' ? 'Pulou' : guessData.guess}
                            </span>
                            <span style={{ fontSize: '0.7rem' }}>
                              {guessData.correct ? '✅' :
                               guessData.gameCorrect ? '🎮' :
                               guessData.type === 'skipped' ? '⏭️' : '❌'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botão próxima rodada (apenas para host) */}
              {roundFinished && isHost && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                    className={styles.primaryButton}
                    onClick={handleNextRound}
                  >
                    {isClient ? t('next_round') : 'Próxima Rodada'}
                  </button>
                </div>
              )}

              {/* Mensagens de status */}
              {roundFinished && !isHost && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(63, 81, 181, 0.15))',
                  border: '2px solid #2196f3',
                  borderRadius: '12px',
                  padding: '15px',
                  margin: '20px 0',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#2196f3',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)'
                  }}>
                    Aguardando anfitrião avançar para a próxima rodada...
                  </div>
                </div>
              )}


            </>
          )}

          {error && (
            <div className={`${styles.message} ${styles.messageError}`}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGame;
