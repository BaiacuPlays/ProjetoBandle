import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMultiplayerContext } from '../contexts/MultiplayerContext';
import { useProfile } from '../contexts/ProfileContext';
import { songs } from '../data/songs';
import styles from '../styles/Multiplayer.module.css';
import gameStyles from '../styles/Home.module.css';
import { FaPlay, FaPause, FaVolumeUp, FaFastForward } from 'react-icons/fa';
import { browserCompatibility } from '../utils/browserCompatibility';
import BrowserCompatibilityWarning from './BrowserCompatibilityWarning';
// Imports temporariamente desabilitados para SSR
// import { audioCache } from '../utils/audioCache';
// import { useAudioPreloader } from '../hooks/useAudioPreloader';
// import { useAudioProxy } from '../utils/audioProxy';
import { useSimpleAudioProxy } from '../utils/simpleAudioProxy';

const MultiplayerGame = ({ onBackToLobby }) => {

  const { t, isClient } = useLanguage();
  const { state, actions } = useMultiplayerContext();
  const { updateProfile } = useProfile() || {};
  const {
    playerNickname: nickname,
    lobbyData,
    error
  } = state;

  // Detecção de navegador para compatibilidade
  const [browserInfo, setBrowserInfo] = useState(null);

  // Hook para proxy de áudio (resolve problemas de CORS) - TESTE SIMPLIFICADO
  const { songs: processedSongs, isReady } = useSimpleAudioProxy(songs);

  // Usar músicas processadas (com proxy se necessário)
  const songsToUse = processedSongs || songs;

  // Cache de áudio temporariamente desabilitado para correção

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

      setBrowserInfo(info);

      // Avisos para navegadores problemáticos
      if (info.isIE) {
        alert('⚠️ Internet Explorer não é suportado. Use Chrome, Firefox ou Edge.');
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
  const [isPlayButtonDisabled, setIsPlayButtonDisabled] = useState(false);
  const [isSkipLoading, setIsSkipLoading] = useState(false);
  const [isNextRoundLoading, setIsNextRoundLoading] = useState(false);
  const [audioLoadError, setAudioLoadError] = useState(false);
  const [audioLoadRetries, setAudioLoadRetries] = useState(0);
  const [connectionError, setConnectionError] = useState(false);
  const [activeHint, setActiveHint] = useState(0); // CORREÇÃO: Estado para navegar entre dicas

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
    // Primeiro, tentar encontrar pelo ID se disponível
    if (typeof gameState.currentSong === 'object' && gameState.currentSong.id !== undefined) {
      songToPlay = songs.find(song => song.id === gameState.currentSong.id);
    } else if (typeof gameState.currentSong === 'string') {
      // Fallback: tentar encontrar pelo título na lista de músicas
      songToPlay = songs.find(song =>
        song.title.trim().toLowerCase() === gameState.currentSong.trim().toLowerCase()
      );
    }
  }

  // Processar URL através do proxy para resolver CORS
  if (songToPlay?.audioUrl) {
    songToPlay = {
      ...songToPlay,
      audioUrl: processedSongs.find(s => s.id === songToPlay.id)?.audioUrl || songToPlay.audioUrl
    };
  }



  // Função para gerar tempo determinístico
  const getDeterministicStartTime = (duration, songId) => {
    // Garante que sempre haja pelo menos 15 segundos restantes
    const maxStart = Math.max(0, duration - 15);
    const seed = (songId * 31) % 997;
    const deterministicRandom = (seed / 997);
    return deterministicRandom * maxStart;
  };

  // Configurar áudio quando a música muda - OTIMIZADO
  useEffect(() => {
    let songToUse = currentSong;

    // Se não temos currentSong, tentar obter da lista de músicas do gameState
    if (!songToUse && gameState?.songs && gameState.songs.length > 0) {
      const currentRoundIndex = (gameState.currentRound || 1) - 1;
      songToUse = gameState.songs[currentRoundIndex];
    }

    // Se ainda não temos música, tentar buscar pelo ID ou título no gameState
    if (!songToUse && gameState?.currentSong) {
      // Primeiro, tentar encontrar pelo ID se disponível
      if (typeof gameState.currentSong === 'object' && gameState.currentSong.id !== undefined) {
        songToUse = songs.find(song => song.id === gameState.currentSong.id);
      } else if (typeof gameState.currentSong === 'string') {
        // Fallback: tentar encontrar pelo título
        songToUse = songs.find(song =>
          song.title.trim().toLowerCase() === gameState.currentSong.trim().toLowerCase()
        );
      }
    }

    if (songToUse && audioRef.current) {
      // Limpar listeners anteriores antes de adicionar novos
      const audio = audioRef.current;

      const handleLoadedMetadata = () => {
        if (!audio || audio !== audioRef.current) return; // Verificação de segurança



        const duration = audio.duration || 0;

        // Verificar se a duração é válida (mínimo 30 segundos para garantir 15s de reprodução + 15s de margem)
        if (!duration || isNaN(duration) || duration < 30) {
          setAudioLoadError(true);

          return;
        }

        // Áudio carregado com sucesso - limpar TODOS os estados de loading
        setAudioLoadError(false);
        setAudioLoadRetries(0);
        setConnectionError(false);
        // CORREÇÃO: Garantir que botão de play seja habilitado
        setIsPlayButtonDisabled(false);

        const startTimeToUse = getDeterministicStartTime(duration, songToUse.id);
        setStartTime(startTimeToUse);

        // Verificação adicional antes de definir currentTime
        if (audio === audioRef.current && !isNaN(startTimeToUse)) {
          audio.currentTime = startTimeToUse;
          setAudioProgress(0);
        }
      };

      const handleError = (e) => {
        if (!audio || audio !== audioRef.current) return; // Verificação de segurança

        setAudioLoadError(true);

        // Tentar recarregar automaticamente até 3 vezes com debounce
        if (audioLoadRetries < 3) {
          const retryDelay = Math.min(2000 * (audioLoadRetries + 1), 8000); // Max 8s
          setTimeout(() => {
            if (audio === audioRef.current) { // Verificar se ainda é o mesmo elemento
              setAudioLoadRetries(prev => prev + 1);
              audio.load();
            }
          }, retryDelay);
        } else {
          setConnectionError(true);
        }
      };

      // Remover listeners existentes primeiro
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);

      // Adicionar novos listeners
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);

      return () => {
        // Cleanup mais robusto
        if (audio) {
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('error', handleError);
        }
      };
    }
  }, [currentSong, gameState?.songs, gameState?.currentRound, gameState?.currentSong, audioLoadRetries]);

  // Controle de progresso do áudio - OTIMIZADO
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const maxDuration = (iAmWinner || myAttempts >= 6)
      ? 15 // Se EU ganhei OU esgotei minhas tentativas, posso tocar mais tempo
      : maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1];

    const updateProgress = () => {
      // Verificações de segurança mais robustas
      if (!audio || audio !== audioRef.current || startTime === null || startTime === undefined) return;

      try {
        const currentTime = audio.currentTime - startTime;

        // Limitar o seekbar para não passar de 15s
        if (currentTime > 15) {
          audio.currentTime = startTime + 15;
          setAudioProgress(15);
          audio.pause();
          setIsPlaying(false);
          audio.volume = volume;
          return;
        }

        // Fade out nos últimos 2 segundos quando limitado a 15s
        if ((iAmWinner || myAttempts >= 6) && currentTime >= 13 && currentTime < 15) {
          const fadeProgress = (15 - currentTime) / 2; // de 1 para 0
          audio.volume = Math.max(0, volume * fadeProgress);
        } else {
          audio.volume = volume;
        }

        // Sempre parar após 15 segundos, independente do status
        if (currentTime >= 15) {
          audio.pause();
          setIsPlaying(false);
          if (!isNaN(startTime)) {
            audio.currentTime = startTime;
          }
          setAudioProgress(0);
          audio.volume = volume;
          return;
        }

        // Parar baseado nas tentativas apenas se EU não ganhei E não esgotei tentativas
        if (!iAmWinner && myAttempts < 6 && currentTime >= maxDuration) {
          audio.pause();
          setIsPlaying(false);
          if (!isNaN(startTime)) {
            audio.currentTime = startTime;
          }
          setAudioProgress(0);
          audio.volume = volume;
          return;
        }

        setAudioProgress(currentTime);
      } catch (error) {
        // Silent error handling
      }
    };

    const updatePlay = () => {
      if (audio === audioRef.current) {
        setIsPlaying(!audio.paused && !audio.ended);
      }
    };

    // Remover listeners existentes primeiro
    audio.removeEventListener('timeupdate', updateProgress);
    audio.removeEventListener('play', updatePlay);
    audio.removeEventListener('pause', updatePlay);

    // Adicionar novos listeners
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play', updatePlay);
    audio.addEventListener('pause', updatePlay);

    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('play', updatePlay);
        audio.removeEventListener('pause', updatePlay);
        // Garante que o volume volte ao normal ao desmontar
        try {
          audio.volume = volume;
        } catch (error) {
          // Ignorar erros de volume
        }
      }
    };
  }, [startTime, myAttempts, iAmWinner, volume]);

  // Reset do estado do áudio e interface quando a rodada muda - OTIMIZADO
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        setIsPlaying(false);
        setAudioProgress(0);

        if (startTime !== undefined && !isNaN(startTime)) {
          audio.currentTime = startTime;
        }
      } catch (error) {
        // Silent error handling
      }
    }

    // Reset da interface
    setGuess('');
    setShowSuggestions(false);
    setFilteredSuggestions([]);
    setIsShaking(false);

    // Reset dos estados de erro de áudio
    setAudioLoadError(false);
    setAudioLoadRetries(0);

    // Reset dos estados de loading
    setIsPlayButtonDisabled(false);
    setIsSkipLoading(false);

    // Reset do activeHint para nova rodada
    setActiveHint(0);
  }, [gameState?.currentRound, startTime]);

  // CORREÇÃO: Sincronizar activeHint com tentativas (igual ao modo diário)
  useEffect(() => {
    setActiveHint(myAttempts);
  }, [myAttempts]);

  // Garantir que o áudio seja configurado corretamente quando a URL muda - OTIMIZADO
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && songToPlay?.audioUrl) {
      try {
        audio.pause();
        setIsPlaying(false);
        setAudioProgress(0);

        // Debounce reduzido para melhor responsividade
        const loadTimeout = setTimeout(() => {
          if (audio === audioRef.current && songToPlay?.audioUrl) {
            audio.load();
          }
        }, 100); // Reduzido de 300 para 100ms

        return () => clearTimeout(loadTimeout);
      } catch (error) {
        // Silent error handling
      }
    }
  }, [songToPlay?.audioUrl]);



  // Estado para controlar se XP já foi distribuído
  const [xpDistributed, setXpDistributed] = useState(false);

  // Detectar fim do jogo e distribuir XP (APENAS UMA VEZ)
  useEffect(() => {
    if (gameFinished && gameState && updateSocialStats && !xpDistributed) {
      // Marcar como distribuído IMEDIATAMENTE para evitar execuções múltiplas
      setXpDistributed(true);

      // Verificar se o jogador atual é um dos vencedores
      const finalScores = Object.entries(gameState.scores || {})
        .map(([player, score]) => ({ player, score }))
        .sort((a, b) => b.score - a.score);

      const maxScore = finalScores.length > 0 ? finalScores[0].score : 0;
      const winners = finalScores.filter(item => item.score === maxScore);
      const isWinner = winners.some(winner => winner.player === nickname);

      // Distribuir XP baseado no resultado e número de rodadas
      updateSocialStats('multiplayer_game', {
        won: isWinner,
        totalRounds: gameState.totalRounds || 10
      });
    }
  }, [gameFinished, gameState, updateSocialStats, xpDistributed, nickname]);

  // Reset do controle de XP quando o jogo reinicia
  useEffect(() => {
    if (!gameFinished) {
      setXpDistributed(false);
    }
  }, [gameFinished]);

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
        .slice(0, 50); // Mostrar até 50 sugestões para busca completa

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
      // Otimizado: cache de sugestões aleatórias
      if (filteredSuggestions.length === 0) {
        const randomSuggestions = songs.slice(0, 6); // Reduzido para 6
        setFilteredSuggestions(randomSuggestions);
      }
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
    if (isNextRoundLoading) return;
    setIsNextRoundLoading(true);
    await actions.nextRound();
    setIsNextRoundLoading(false);
  };

  const handleSkip = async () => {
    if (isSkipLoading) return;
    setIsSkipLoading(true);
    await actions.skipRound();
    setIsSkipLoading(false);
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
    const audio = audioRef.current;
    if (!audio || isPlayButtonDisabled || startTime === null || startTime === undefined) return;

    // Desabilita o botão temporariamente para evitar duplo clique
    setIsPlayButtonDisabled(true);
    setTimeout(() => setIsPlayButtonDisabled(false), 300);

    try {
      const currentTime = audio.currentTime - startTime;
      const maxDuration = (iAmWinner || myAttempts >= 6)
        ? 15
        : maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1];

      if (isPlaying) {
        audio.pause();
      } else {
        // Verificar se precisa resetar o tempo
        if (currentTime >= 15 || (!iAmWinner && myAttempts < 6 && currentTime >= maxDuration) || currentTime < 0) {
          if (!isNaN(startTime)) {
            audio.currentTime = startTime;
            setAudioProgress(0);
          }
        }

        // Verificar se o áudio está pronto para tocar
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
          // Melhor compatibilidade com navegadores
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              // Apenas erros importantes para o usuário
              if (error.name === 'NotAllowedError') {
                actions.setError('Clique em qualquer lugar para permitir reprodução de áudio');
              } else if (error.name === 'NotSupportedError') {
                actions.setError('Formato de áudio não suportado neste navegador');
              } else if (error.name === 'AbortError') {
                // Ignorar AbortError
              } else {
                actions.setError('Erro ao reproduzir áudio. Tente novamente.');
              }
            });
          }
        } else {
          // Áudio não está pronto, tentar carregar
          audio.load();
          actions.setError('Carregando áudio...');
          setTimeout(() => actions.setError(''), 2000);
        }
      }
    } catch (error) {
      actions.setError('Erro ao controlar reprodução de áudio');
      setTimeout(() => actions.setError(''), 3000);
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

          {/* Dicas progressivas - CORREÇÃO: Usar activeHint para permitir navegação */}
          {getProgressiveHint(songToPlay, activeHint) && !gameFinished && !roundFinished && (
            <div className={styles.hintBox}>
              <strong>Dica:</strong> {getProgressiveHint(songToPlay, activeHint)}
              {activeHint !== myAttempts && (
                <span style={{
                  marginLeft: '10px',
                  fontSize: '0.8rem',
                  opacity: 0.7,
                  fontStyle: 'italic'
                }}>
                  (Tentativa {activeHint + 1})
                </span>
              )}
            </div>
          )}

          {/* CORREÇÃO: Instrução sobre navegação entre dicas */}
          {myAttempts > 0 && !gameFinished && !roundFinished && (
            <div style={{
              fontSize: '0.75rem',
              opacity: 0.6,
              textAlign: 'center',
              marginTop: '5px',
              fontStyle: 'italic'
            }}>
              💡 Clique nos números das tentativas para rever dicas anteriores
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
                      max={Math.min(15, (iAmWinner || myAttempts >= 6) ? 15 : (maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1]))}
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
                      {new Date(Math.min(15, (iAmWinner || myAttempts >= 6) ? 15 : (maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1])) * 1000).toISOString().substring(14, 19)}
                    </span>
                  </div>
                  <div className={gameStyles.audioVolumeRow}>
                    <button
                      className={gameStyles.audioPlayBtnCustom}
                      onClick={async (e) => {
                        if (!songToPlay || isPlayButtonDisabled) return;

                        // Feedback visual instantâneo
                        e.target.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                          if (e.target) e.target.style.transform = 'scale(1)';
                        }, 150);

                        // Cache temporariamente desabilitado - usar método tradicional diretamente

                        // Fallback para método tradicional
                        if (!audioRef.current || !audioRef.current.duration) {
                          actions.setError('Áudio ainda carregando, aguarde...');
                          setTimeout(() => actions.setError(''), 2000);
                          return;
                        }

                        if (startTime === null || startTime === undefined) {
                          return;
                        }

                        // Desabilitar botão temporariamente (tempo ainda mais reduzido)
                        setIsPlayButtonDisabled(true);
                        setTimeout(() => setIsPlayButtonDisabled(false), 100); // Reduzido para 100ms para melhor UX

                        try {
                          const currentTime = audioRef.current.currentTime - startTime;
                          const maxDuration = (iAmWinner || myAttempts >= 6) ? 15 : maxClipDurations[myAttempts] || maxClipDurations[maxClipDurations.length - 1];

                          if (isPlaying) {
                            // Pausar
                            audioRef.current.pause();
                          } else {
                            // Reproduzir
                            if (currentTime >= 15 || (!iAmWinner && myAttempts < 6 && currentTime >= maxDuration) || currentTime < 0) {
                              audioRef.current.currentTime = startTime;
                              setAudioProgress(0);
                            }

                            if (audioRef.current.paused) {
                              // Usar método instantâneo se áudio está pronto
                              if (audioRef.current.readyState >= 2) {
                                await browserCompatibility.playAudioInstant(audioRef.current);
                                // CORREÇÃO: Limpar loading após reprodução instantânea
                                setIsPlayButtonDisabled(false);
                              } else {
                                await browserCompatibility.playAudio(audioRef.current);
                                // CORREÇÃO: Limpar loading após reprodução normal
                                setIsPlayButtonDisabled(false);
                              }
                            }
                          }
                        } catch (error) {
                          if (error.name !== 'AbortError') {
                            actions.setError(error.message || 'Erro ao reproduzir o áudio. Tentando novamente...');
                            setTimeout(() => actions.setError(''), 3000);
                          }
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          e.target.click();
                        }
                      }}
                      aria-label={isPlaying ? (isClient ? t('pause') : 'Pausar') : (isClient ? t('play') : 'Reproduzir')}
                      aria-pressed={isPlaying}
                      tabIndex={0}
                      role="button"
                      disabled={!songToPlay || isPlayButtonDisabled}
                      style={{
                        position: 'relative',
                        outline: 'none',
                        transition: 'box-shadow 0.2s'
                      }}
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
                    ref={(el) => {
                      if (el) {
                        audioRef.current = el;
                        // Configurar elemento com compatibilidade específica do navegador
                        browserCompatibility.configureAudioElement(el);
                        // Configuração otimizada para reprodução instantânea
                        el.preload = 'auto'; // Carrega tudo para reprodução instantânea
                        // Não definir crossOrigin para URLs do proxy (evita problemas de CORS)
                        if (!songToPlay?.audioUrl?.includes('/api/audio-proxy')) {
                          el.crossOrigin = 'anonymous';
                        }

                        // Cache temporariamente desabilitado
                      }
                    }}
                    src={songToPlay?.audioUrl}
                    style={{ display: 'none' }}
                    onError={(e) => {
                      // Tratamento de erro mais robusto
                      const errorCode = e.target.error?.code;

                      if (errorCode === 4) {
                        actions.setError('Formato de áudio não suportado');
                      } else if (errorCode === 2) {
                        actions.setError('Erro de rede ao carregar áudio');
                      } else if (errorCode === 3) {
                        actions.setError('Áudio corrompido ou incompleto');
                      } else if (errorCode === 1) {
                        actions.setError('Carregamento de áudio foi interrompido');
                      } else {
                        actions.setError('Erro desconhecido ao carregar áudio');
                      }

                      // Marcar erro para tentar novamente
                      setAudioLoadError(true);
                    }}
                    onCanPlay={() => {
                      // Áudio pronto para tocar - limpar TODOS os estados de loading
                      setAudioLoadError(false);
                      setConnectionError(false);
                      setAudioLoadRetries(0);
                      // CORREÇÃO: Garantir que botão de play seja habilitado
                      setIsPlayButtonDisabled(false);
                    }}
                    onLoadStart={() => {
                      // Começou a carregar
                      setAudioLoadError(false);
                    }}
                    onWaiting={() => {
                      // Aguardando dados
                    }}
                    onStalled={() => {
                      // Carregamento travou
                    }}
                    onSuspend={() => {
                      // Download suspenso
                    }}
                    onAbort={() => {
                      // Carregamento abortado
                    }}
                  />
                </div>
              </div>

              {/* Indicadores de estado de carregamento/erro */}
              {audioLoadError && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(229, 57, 53, 0.15))',
                  border: '2px solid #f44336',
                  borderRadius: '8px',
                  padding: '12px',
                  margin: '10px 0',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ color: '#f44336', fontWeight: 'bold', marginBottom: '5px' }}>
                    ⚠️ Erro ao carregar áudio
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    {connectionError
                      ? 'Verifique sua conexão e recarregue a página'
                      : `Tentando novamente... (${audioLoadRetries}/3)`
                    }
                  </div>
                  {connectionError && (
                    <button
                      onClick={() => {
                        setAudioLoadError(false);
                        setAudioLoadRetries(0);
                        setConnectionError(false);
                        if (audioRef.current) {
                          audioRef.current.load();
                        }
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Tentar Novamente
                    </button>
                  )}
                </div>
              )}



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
                    } else if (attemptGuess.subtype === 'same_game') {
                      // Mesmo jogo, música diferente - AMARELO
                      buttonClass = gameStyles.attemptGame;
                    } else if (attemptGuess.subtype === 'same_franchise') {
                      // Mesma franquia, jogo diferente - LARANJA
                      buttonClass = gameStyles.attemptFranchise;
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
                      disabled={idx > myAttempts} // CORREÇÃO: Só desabilitar se ainda não chegou nessa tentativa
                      title={tooltipText || (idx <= myAttempts ? 'Clique para ver a dica desta tentativa' : '')}
                      style={{
                        cursor: idx <= myAttempts ? 'pointer' : 'default',
                        opacity: activeHint === idx ? 1 : (idx <= myAttempts ? 0.8 : 0.5),
                        transform: activeHint === idx ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        if (idx <= myAttempts) {
                          setActiveHint(idx);
                        }
                      }}
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
                  disabled={roundFinished || myAttempts >= 6 || iAmWinner || isSkipLoading}
                  style={{ marginLeft: '10px', opacity: isSkipLoading ? 0.6 : 1 }}
                >
                  {isSkipLoading ? (isClient ? t('loading') : 'Carregando...') : (<>{isClient ? t('skip') : 'Pular'} <FaFastForward style={{ marginLeft: 4, fontSize: '1em', verticalAlign: 'middle' }} /></>)}
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
                    <ul className={gameStyles.suggestionsListModern} style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      scrollbarWidth: 'thin'
                    }}>
                      {filteredSuggestions.map((suggestion, suggestionIndex) => (
                        <li
                          key={`mp-suggestion-${suggestion.id}-${suggestionIndex}`}
                          className={gameStyles.suggestionItemModern}
                          onMouseDown={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion.game} - {suggestion.title}
                        </li>
                      ))}
                      <li
                        className={gameStyles.suggestionItemModern}
                        onMouseDown={() => {
                          // Função para ativar o easter egg do sacabambapis
                          const triggerSacabambapis = () => {
                            // Criar elemento para mostrar o efeito
                            const easterEggDiv = document.createElement('div');
                            easterEggDiv.style.cssText = `
                              position: fixed;
                              top: 0;
                              left: 0;
                              width: 100vw;
                              height: 100vh;
                              background: rgba(0, 0, 0, 0.9);
                              display: flex;
                              justify-content: center;
                              align-items: center;
                              z-index: 9999;
                              animation: sacabambapisAppear 2s ease-out;
                            `;

                            const img = document.createElement('img');
                            img.src = '/sacabambapis.png';
                            img.alt = 'Sacabambapis';
                            img.style.cssText = `
                              max-width: 80vw;
                              max-height: 80vh;
                              object-fit: contain;
                              animation: sacabambapisZoom 2s ease-out;
                              filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5));
                            `;

                            easterEggDiv.appendChild(img);
                            document.body.appendChild(easterEggDiv);

                            // Tocar som do vine boom
                            const vineAudio = new Audio('/vine.mp3');
                            vineAudio.volume = 0.7;
                            vineAudio.play().catch(() => {});

                            // Remover após 2 segundos
                            setTimeout(() => {
                              document.body.removeChild(easterEggDiv);
                            }, 2000);
                          };
                          triggerSacabambapis();
                        }}
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
                          : guessData.subtype === 'same_game'
                            ? 'rgba(255, 215, 0, 0.8)'
                            : guessData.subtype === 'same_franchise'
                              ? 'rgba(255, 152, 0, 0.8)'
                              : guessData.type === 'skipped'
                                ? 'rgba(97, 97, 97, 0.8)'
                                : 'rgba(198, 40, 40, 0.8)',
                        border: `2px solid ${
                          guessData.correct
                            ? '#4caf50'
                            : guessData.subtype === 'same_game'
                              ? '#ffd700'
                              : guessData.subtype === 'same_franchise'
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
                           guessData.subtype === 'same_game' ? '🎮' :
                           guessData.subtype === 'same_franchise' ? '🔶' :
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
                              : guessData.subtype === 'same_game'
                                ? 'rgba(255, 215, 0, 0.2)'
                                : guessData.subtype === 'same_franchise'
                                  ? 'rgba(255, 152, 0, 0.2)'
                                  : guessData.type === 'skipped'
                                    ? 'rgba(158, 158, 158, 0.2)'
                                    : 'rgba(244, 67, 54, 0.2)',
                            border: `1px solid ${
                              guessData.correct
                                ? 'rgba(76, 175, 80, 0.4)'
                                : guessData.subtype === 'same_game'
                                  ? 'rgba(255, 215, 0, 0.4)'
                                  : guessData.subtype === 'same_franchise'
                                    ? 'rgba(255, 152, 0, 0.4)'
                                    : guessData.type === 'skipped'
                                      ? 'rgba(158, 158, 158, 0.4)'
                                      : 'rgba(244, 67, 54, 0.4)'
                            }`
                          }}>
                            <span style={{
                              color: guessData.correct
                                ? '#4caf50'
                                : guessData.subtype === 'same_game'
                                  ? '#ffd700'
                                  : guessData.subtype === 'same_franchise'
                                    ? '#ff9800'
                                    : guessData.type === 'skipped'
                                      ? '#9e9e9e'
                                      : '#f44336'
                            }}>
                              {guessData.type === 'skipped' ? '⏭️ Pulou' : guessData.guess}
                            </span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                              {guessData.correct ? '✅' :
                               guessData.subtype === 'same_game' ? '🎮' :
                               guessData.subtype === 'same_franchise' ? '🔶' :
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
                              : guessData.subtype === 'same_game'
                                ? 'rgba(255, 215, 0, 0.2)'
                                : guessData.subtype === 'same_franchise'
                                  ? 'rgba(255, 152, 0, 0.2)'
                                  : guessData.type === 'skipped'
                                    ? 'rgba(158, 158, 158, 0.2)'
                                    : 'rgba(244, 67, 54, 0.2)',
                            fontSize: '0.8rem'
                          }}>
                            <span style={{
                              color: guessData.correct
                                ? '#4caf50'
                                : guessData.subtype === 'same_game'
                                  ? '#ffd700'
                                  : guessData.subtype === 'same_franchise'
                                    ? '#ff9800'
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
                               guessData.subtype === 'same_game' ? '🎮' :
                               guessData.subtype === 'same_franchise' ? '🔶' :
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
                    disabled={isNextRoundLoading}
                    style={{ opacity: isNextRoundLoading ? 0.6 : 1 }}
                  >
                    {isNextRoundLoading ? (isClient ? t('loading') : 'Carregando...') : (isClient ? t('next_round') : 'Próxima Rodada')}
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

      {/* Aviso de compatibilidade do navegador */}
      <BrowserCompatibilityWarning />
    </div>
  );
};

export default MultiplayerGame;
