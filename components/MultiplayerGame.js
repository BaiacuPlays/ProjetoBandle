import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMultiplayerContext } from '../contexts/MultiplayerContext';
import { songs } from '../data/songs';
import styles from '../styles/Multiplayer.module.css';
import gameStyles from '../styles/Home.module.css';
import { FaPlay, FaPause, FaVolumeUp, FaFastForward } from 'react-icons/fa';

const MultiplayerGame = ({ onBackToLobby }) => {
  console.log('🎮 JOGO - MultiplayerGame renderizado');

  const { t, isClient } = useLanguage();
  const { state, actions } = useMultiplayerContext();
  const {
    playerNickname: nickname,
    lobbyData,
    error
  } = state;

  console.log('🎮 JOGO - lobbyData:', lobbyData);
  console.log('🎮 JOGO - gameStarted:', lobbyData?.gameStarted);

  const [guess, setGuess] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
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
  const maxClipDurations = [0.6, 1.2, 2.0, 3.0, 3.5, 4.2];

  // Verificar se o jogador atual é um dos vencedores
  const iAmWinner = roundWinners.includes(nickname);
  const hasWinners = roundWinners.length > 0 && !roundWinners.includes('NONE');

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

    console.log('🎵 AUDIO - Configurando áudio para:', songToUse?.title);

    if (songToUse && audioRef.current) {
      const handleLoadedMetadata = () => {
        const duration = audioRef.current.duration || 0;
        const startTimeToUse = getDeterministicStartTime(duration, songToUse.id);
        setStartTime(startTimeToUse);
        audioRef.current.currentTime = startTimeToUse;
        setAudioProgress(0);
        console.log('🎵 AUDIO - Metadata carregada, startTime:', startTimeToUse);
      };

      const handleError = () => {
        console.error('🎵 AUDIO - Erro ao carregar áudio:', songToUse.audioUrl);
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

    const maxDuration = hasWinners
      ? 15 // Se alguém já ganhou, pode tocar mais tempo
      : maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1];

    const updateProgress = () => {
      const currentTime = audio.currentTime - startTime;
      if (!hasWinners && currentTime >= maxDuration) {
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
  }, [startTime, myAttempts, hasWinners]);

  // Reset do estado do áudio e interface quando a rodada muda
  useEffect(() => {
    console.log('🎵 ROUND CHANGE - Rodada mudou:', gameState?.currentRound);

    if (audioRef.current) {
      // Pausar o áudio
      audioRef.current.pause();
      setIsPlaying(false);

      // Resetar progresso
      setAudioProgress(0);

      // Resetar posição do áudio para o início
      if (startTime !== undefined) {
        audioRef.current.currentTime = startTime;
      }

      console.log('🎵 ROUND CHANGE - Estado do áudio resetado');
    }

    // Resetar estado da interface
    setGuess('');
    setShowSuggestions(false);
    setFilteredSuggestions([]);
    setIsShaking(false);

    console.log('🎮 ROUND CHANGE - Interface resetada');
  }, [gameState?.currentRound, startTime]);

  // Garantir que o áudio seja configurado corretamente quando a URL muda
  useEffect(() => {
    if (audioRef.current && songToPlay?.audioUrl) {
      console.log('🎵 AUDIO URL - Nova URL de áudio:', songToPlay.audioUrl);

      // Pausar qualquer reprodução anterior
      audioRef.current.pause();
      setIsPlaying(false);
      setAudioProgress(0);

      // Forçar o carregamento da nova música
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
        .slice(0, 50); // Limitar a 50 sugestões para performance

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
      // Se não tem texto, mostrar algumas sugestões aleatórias
      const randomSuggestions = songs.slice(0, 10);
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
    if (roundFinished || !guess.trim()) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // Verificar se a música existe na lista
    const normalizedGuess = normalize(guess);
    const songExists = songs.some(song => normalize(song.title) === normalizedGuess);

    if (!songExists) {
      actions.setError(isClient ? t('select_from_list') : 'Selecione uma música da lista');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setTimeout(() => actions.setError(''), 3000); // Limpar erro após 3 segundos
      return;
    }

    console.log('🎮 GAME - Fazendo tentativa:', guess);
    const result = await actions.makeGuess(guess.trim());

    if (result.success) {
      console.log('🎮 GAME - Tentativa enviada com sucesso:', result);
      setGuess('');
      setShowSuggestions(false);

      if (result.correct) {
        if (result.tooLate) {
          console.log('🎮 GAME - Acertou, mas chegou tarde!');
          // Mostrar mensagem de que chegou tarde
          actions.setError(result.message || 'Alguém já havia acertado primeiro!');
          setTimeout(() => actions.setError(''), 4000);
        } else {
          console.log('🎮 GAME - Acertou a música!');
          // Limpar qualquer erro anterior
          actions.setError('');
        }
      } else if (result.gameCorrect) {
        console.log('🎮 GAME - Acertou o jogo mas não a música!');
        // Feedback visual para jogo correto
        actions.setError('Jogo correto! Tente adivinhar a música específica.');
        setTimeout(() => actions.setError(''), 3000);
      }
    } else {
      console.log('🎮 GAME - Tentativa não aceita:', result.error);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      // NUNCA mostrar erros de tentativas - deixar o jogo fluir naturalmente
      // Os erros importantes já são tratados pelo contexto
    }
  };

  const handleNextRound = async () => {
    console.log('🎮 GAME - Avançando para próxima rodada');
    const result = await actions.nextRound();

    if (result.success) {
      console.log('🎮 GAME - Próxima rodada iniciada');
    } else {
      console.log('🎮 GAME - Erro ao avançar rodada:', result.error);
    }
  };

  const handleSkip = async () => {
    console.log('🎮 GAME - Pulando rodada');
    const result = await actions.skipRound();

    if (result.success) {
      console.log('🎮 GAME - Rodada pulada');
    } else {
      console.log('🎮 GAME - Erro ao pular rodada:', result.error);
    }
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
    // TODO: Implementar resetGame no contexto
    console.log('🎮 GAME - Reset do jogo');
    onBackToLobby();
  };

  const handlePlayPause = () => {
    if (!audioRef.current) {
      console.log('🎵 PLAY - Áudio ref não disponível');
      return;
    }

    console.log('🎵 PLAY - Tentando play/pause, isPlaying:', isPlaying);

    const currentTime = audioRef.current.currentTime - startTime;
    const maxDuration = hasWinners
      ? 15
      : maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1];

    // Se o tempo atual excedeu o máximo permitido, resetar para o início
    if (currentTime >= maxDuration) {
      audioRef.current.currentTime = startTime;
      setAudioProgress(0);
      console.log('🎵 PLAY - Resetando para o início devido ao tempo limite');
    }

    if (isPlaying) {
      audioRef.current.pause();
      console.log('🎵 PLAY - Pausando áudio');
    } else {
      // Garantir que o áudio está na posição correta antes de tocar
      if (audioRef.current.currentTime < startTime || audioRef.current.currentTime > startTime + maxDuration) {
        audioRef.current.currentTime = startTime;
        setAudioProgress(0);
        console.log('🎵 PLAY - Ajustando posição antes de tocar');
      }

      audioRef.current.play().then(() => {
        console.log('🎵 PLAY - Áudio iniciado com sucesso');
      }).catch(error => {
        console.error('🎵 PLAY - Erro ao iniciar áudio:', error);
      });
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

  // Verificar se o jogo foi iniciado e se temos os dados necessários
  console.log('🎮 GAME - Verificando condições:', {
    lobbyData: !!lobbyData,
    gameStarted: lobbyData?.gameStarted,
    gameState: !!gameState
  });

  if (!lobbyData || !lobbyData.gameStarted || !gameState) {
    console.log('🎮 GAME - Mostrando tela de loading');
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

  console.log('🎮 GAME - Condições atendidas, renderizando jogo');

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
              {Object.entries(gameState.scores || {}).map(([player, score]) => (
                <div
                  key={player}
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
                      max={hasWinners ? 15 : (maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1])}
                      step={0.01}
                      value={audioProgress}
                      onChange={e => {
                        if (audioRef.current && isPlaying) {
                          const value = Number(e.target.value);
                          audioRef.current.currentTime = startTime + value;
                          setAudioProgress(value);
                        }
                      }}
                      className={gameStyles.audioSeekbarCustom}
                      disabled={!songToPlay}
                    />
                    <span className={gameStyles.audioTime}>
                      {new Date((hasWinners ? 15 : (maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1])) * 1000).toISOString().substring(14, 19)}
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
                    onError={() => actions.setError('Erro ao carregar áudio')}
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

                  // Debug: Log do estado das tentativas
                  if (idx === 0) {
                    console.log('🎨 DEBUG - Estado das tentativas:', {
                      nickname: nickname,
                      myAttempts: myAttempts,
                      guesses: gameState?.guesses?.[nickname],
                      roundWinners: roundWinners
                    });
                  }

                  if (idx < myAttempts) {
                    // Verificar o histórico de tentativas para determinar a cor
                    const myGuesses = gameState?.guesses?.[nickname] || [];
                    const attemptGuess = myGuesses[idx];

                    console.log('🎨 COLOR - Tentativa', idx + 1, ':', attemptGuess);

                    if (attemptGuess) {
                      if (attemptGuess.correct && !attemptGuess.tooLate) {
                        // Acertou a música e foi o primeiro - VERDE
                        buttonClass = gameStyles.attemptSuccess;
                        console.log('🎨 COLOR - Verde (acertou)');
                      } else if (attemptGuess.gameCorrect && !attemptGuess.correct) {
                        // Acertou o jogo mas não a música - AMARELO
                        buttonClass = gameStyles.attemptGame;
                        console.log('🎨 COLOR - Amarelo (jogo correto)');
                      } else if (attemptGuess.type === 'skipped') {
                        // Skip - VERMELHO
                        buttonClass = gameStyles.attemptFail;
                        console.log('🎨 COLOR - Vermelho (skip)');
                      } else {
                        // Errou ou chegou tarde - VERMELHO
                        buttonClass = gameStyles.attemptFail;
                        console.log('🎨 COLOR - Vermelho (erro/tarde)');
                      }
                    } else {
                      // Fallback para lógica anterior se não tiver histórico
                      if (iAmWinner && idx === myAttempts - 1) {
                        buttonClass = gameStyles.attemptSuccess;
                        console.log('🎨 COLOR - Verde (fallback - vencedor)');
                      } else {
                        buttonClass = gameStyles.attemptFail;
                        console.log('🎨 COLOR - Vermelho (fallback)');
                      }
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`${gameStyles.attemptButton} ${buttonClass}`}
                      disabled
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
                  disabled={roundFinished || myAttempts >= 6}
                  style={{ marginLeft: '10px' }}
                >
                  {isClient ? t('skip') : 'Pular'} <FaFastForward style={{ marginLeft: 4, fontSize: '1em', verticalAlign: 'middle' }} />
                </button>
              </div>

              {/* Formulário de tentativa */}
              {!roundFinished ? (
                <>
                  <form onSubmit={handleGuess} className={gameStyles.guessFormModern} autoComplete="off">
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
                      disabled={myAttempts >= 6 || !guess.trim()}
                      className={`${gameStyles.guessButtonModern} ${isShaking ? gameStyles.shake : ''}`}
                    >
                      {isClient ? t('guess') : 'Adivinhar'}
                    </button>
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <ul className={gameStyles.suggestionsListModern}>
                        {filteredSuggestions.map(suggestion => (
                          <li
                            key={suggestion.id}
                            className={gameStyles.suggestionItemModern}
                            onMouseDown={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion.game} - {suggestion.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </form>
                </>
              ) : (
                <div className={`${styles.message} ${
                  roundWinners.includes('NONE') ? styles.messageWarning : styles.messageSuccess
                }`}>
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
                  <br />
                  <strong>{songToPlay?.game} - {songToPlay?.title}</strong>

                  {/* Mostrar pontos ganhos se o jogador atual ganhou */}
                  {iAmWinner && (
                    <div className={styles.pointsEarned}>
                      +{Math.max(0, 6 - myAttempts + 1)} pontos!
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
                <div className={`${styles.message} ${styles.messageInfo}`}>
                  Aguardando anfitrião avançar para a próxima rodada...
                </div>
              )}

              {/* Mensagem apenas quando o jogador esgotou tentativas MAS a rodada ainda não acabou */}
              {myAttempts >= 6 && !roundFinished && (
                <div className={`${styles.message} ${styles.messageWarning}`}>
                  Você esgotou suas tentativas para esta rodada. Aguardando outros jogadores...
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
