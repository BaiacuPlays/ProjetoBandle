import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { songs } from '../data/songs';
import styles from '../styles/Home.module.css';
import { FaPlay, FaPause, FaVolumeUp, FaFastForward, FaQuestionCircle, FaBars } from 'react-icons/fa';
import MusicInfoFetcher from '../components/MusicInfoFetcher';
import Footer from '../components/Footer';
import GameMenu from '../components/GameMenu';
import Statistics from '../components/Statistics';
import Tutorial from '../components/Tutorial';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchTimezone } from '../config/api';

const MAX_ATTEMPTS = 6;
const GAME_INTERVAL = 24 * 60 * 60 * 1000; // 24h em ms

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
  const [showSacabambapis, setShowSacabambapis] = useState(false);
  const [isPlayButtonDisabled, setIsPlayButtonDisabled] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Estados do modo infinito
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [infiniteStreak, setInfiniteStreak] = useState(0);
  const [infiniteBestRecord, setInfiniteBestRecord] = useState(0);
  const [infiniteUsedSongs, setInfiniteUsedSongs] = useState([]);
  const [infiniteGameOver, setInfiniteGameOver] = useState(false);
  const [showNextSongButton, setShowNextSongButton] = useState(false);

  // Tempos máximos de reprodução por tentativa
  const maxClipDurations = [0.6, 1.2, 2.0, 3.0, 3.5, 4.2];

  // Limite máximo de reprodução em segundos
  const MAX_PLAY_TIME = 15;
  const fadeOutDuration = 1; // segundos
  const fadeOutSteps = 10;
  const fadeOutStepTime = fadeOutDuration / fadeOutSteps;
  const originalVolumeRef = useRef(volume);

  // Função para gerar um número determinístico baseado no dia
  const getDeterministicRandom = (day, seed = 0) => {
    // Usa o dia e seed como entrada para gerar um número determinístico
    // Algoritmo simples mas eficaz para gerar números pseudo-aleatórios
    const x = Math.sin(day * 12.9898 + seed * 78.233) * 43758.5453;
    return x - Math.floor(x); // Retorna apenas a parte decimal (0-1)
  };

  // Função para gerar um tempo determinístico dentro da duração da música com base no dia
  const getDeterministicStartTime = (duration, day) => {
    // Deixa uma margem de 10 segundos no final da música
    const maxStart = Math.max(0, duration - 10);

    // Usa função determinística para gerar tempo de início
    const deterministicRandom = getDeterministicRandom(day, 1);

    return deterministicRandom * maxStart;
  };

  // Função para selecionar música determinística baseada no dia (versão simples, sem histórico)
  const getDeterministicSongSimple = (day) => {
    // Usar função determinística para selecionar diretamente da lista completa
    const deterministicRandom = getDeterministicRandom(day, 0);
    const index = Math.floor(deterministicRandom * songs.length);
    return songs[index];
  };

  // Função para selecionar música determinística baseada no dia (versão com histórico para modo infinito)
  const getDeterministicSong = (day) => {
    // Obter histórico de músicas dos últimos 30 dias
    const musicHistory = getMusicHistory();

    // Filtrar músicas que não foram tocadas nos últimos 30 dias
    const availableSongs = songs.filter(song => {
      const lastPlayedDay = musicHistory[song.id];
      return !lastPlayedDay || (day - lastPlayedDay) >= 30;
    });

    // Se não há músicas disponíveis (todas foram tocadas recentemente), usar todas as músicas
    const songsToChooseFrom = availableSongs.length > 0 ? availableSongs : songs;

    // Usar função determinística para selecionar da lista filtrada
    const deterministicRandom = getDeterministicRandom(day, 0);
    const index = Math.floor(deterministicRandom * songsToChooseFrom.length);
    const selectedSong = songsToChooseFrom[index];

    // Registrar no histórico apenas se for uma nova seleção para este dia
    const savedSongKey = `ludomusic_daily_song_day_${day}`;
    const existingSongId = localStorage.getItem(savedSongKey);

    if (!existingSongId || existingSongId !== selectedSong.id.toString()) {
      saveMusicHistory(selectedSong.id, day);
    }

    return selectedSong;
  };

  // Função para obter histórico de músicas tocadas
  const getMusicHistory = () => {
    try {
      const history = localStorage.getItem('ludomusic_daily_history');
      return history ? JSON.parse(history) : {};
    } catch {
      return {};
    }
  };

  // Função para salvar música no histórico
  const saveMusicHistory = (songId, day) => {
    try {
      const history = getMusicHistory();
      history[songId] = day;

      // Limpar entradas muito antigas (mais de 60 dias para ter margem)
      const cutoffDay = day - 60;
      Object.keys(history).forEach(id => {
        if (history[id] < cutoffDay) {
          delete history[id];
        }
      });

      localStorage.setItem('ludomusic_daily_history', JSON.stringify(history));
    } catch (error) {
      console.warn('Erro ao salvar histórico de músicas:', error);
    }
  };

  // Função para calcular o dia do ano
  const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Funções do modo infinito
  const getRandomInfiniteSong = (usedSongs = infiniteUsedSongs) => {
    // Filtra músicas que ainda não foram usadas
    const availableSongs = songs.filter(song => !usedSongs.includes(song.id));

    // Se não há músicas disponíveis, o jogador completou todas
    if (availableSongs.length === 0) {
      return null;
    }

    // Seleciona uma música aleatória das disponíveis
    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    return availableSongs[randomIndex];
  };

  const resetAudioState = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setAudioProgress(0);
      setAudioError(false);
    }
  };

  const loadInfiniteStats = () => {
    if (typeof window !== 'undefined') {
      try {
        const savedStats = localStorage.getItem('ludomusic_infinite_stats');
        if (savedStats) {
          const stats = JSON.parse(savedStats);
          setInfiniteBestRecord(stats.bestRecord || 0);
          setInfiniteStreak(stats.currentStreak || 0);
          setInfiniteUsedSongs(stats.usedSongs || []);

          // Retorna o estado do jogo salvo para poder restaurar
          return stats.currentGameState || null;
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas do modo infinito:', error);
      }
    }
    return null;
  };

  const saveInfiniteStats = (streak, bestRecord, usedSongs, currentGameState = null) => {
    if (typeof window !== 'undefined') {
      try {
        const stats = {
          currentStreak: streak,
          bestRecord: bestRecord,
          usedSongs: usedSongs,
          lastPlayed: Date.now(),
          // Salva o estado atual do jogo se fornecido (para continuar depois)
          currentGameState: currentGameState
        };
        localStorage.setItem('ludomusic_infinite_stats', JSON.stringify(stats));
      } catch (error) {
        console.error('Erro ao salvar estatísticas do modo infinito:', error);
      }
    }
  };

  const startInfiniteMode = () => {
    // Para o áudio atual se estiver tocando
    resetAudioState();

    setIsInfiniteMode(true);
    setInfiniteGameOver(false);
    setGameOver(false);

    // Verifica se há estado salvo do jogo para restaurar
    const savedStats = typeof window !== 'undefined' ? localStorage.getItem('ludomusic_infinite_stats') : null;
    let savedGameState = null;

    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats);
        savedGameState = stats.currentGameState;
      } catch (error) {
        console.error('Erro ao carregar estado salvo:', error);
      }
    }

    if (savedGameState && savedGameState.currentSong) {
      // Restaura o estado do jogo salvo
      setAttempts(savedGameState.attempts || 0);
      setHistory(savedGameState.history || []);
      setMessage(savedGameState.message || '');
      setShowHint(savedGameState.showHint || false);
      setActiveHint(savedGameState.activeHint || 0);
      setCurrentClipDuration(savedGameState.currentClipDuration || 0.3);
      setCurrentSong(savedGameState.currentSong);

      // Limpa o estado salvo já que foi restaurado
      saveInfiniteStats(infiniteStreak, infiniteBestRecord, infiniteUsedSongs, null);
    } else {
      // Inicia um novo jogo
      setAttempts(0);
      setHistory([]);
      setMessage('');
      setShowHint(false);
      setActiveHint(0);
      setGuess('');
      setShowSuggestions(false);

      // Carrega uma nova música para o modo infinito
      const newSong = getRandomInfiniteSong();
      if (newSong) {
        setCurrentSong(newSong);
        // O tempo de início será configurado pelo handleLoadedMetadata normal
      } else {
        // Todas as músicas foram completadas
        setMessage(t('all_songs_completed'));
        setInfiniteGameOver(true);
      }
    }
  };

  const nextInfiniteSong = () => {
    // Para o áudio atual
    resetAudioState();

    // Adiciona a música atual à lista de usadas
    const newUsedSongs = [...infiniteUsedSongs, currentSong.id];
    setInfiniteUsedSongs(newUsedSongs);

    // Incrementa a sequência
    const newStreak = infiniteStreak + 1;
    setInfiniteStreak(newStreak);

    // Atualiza o melhor recorde se necessário
    let newBestRecord = infiniteBestRecord;
    if (newStreak > infiniteBestRecord) {
      newBestRecord = newStreak;
      setInfiniteBestRecord(newBestRecord);
    }

    // Salva as estatísticas
    saveInfiniteStats(newStreak, newBestRecord, newUsedSongs);

    // Reseta o estado do jogo para a próxima música
    setAttempts(0);
    setHistory([]);
    setMessage('');
    setGameOver(false);
    setShowHint(false);
    setActiveHint(0);
    setGuess('');
    setShowSuggestions(false);
    setShowNextSongButton(false);

    // Carrega a próxima música
    const nextSong = getRandomInfiniteSong(newUsedSongs);
    if (nextSong) {
      setCurrentSong(nextSong);
      // O tempo de início será configurado pelo handleLoadedMetadata normal
    } else {
      // Todas as músicas foram completadas
      setMessage(t('all_songs_completed'));
      setInfiniteGameOver(true);
    }
  };

  const endInfiniteMode = () => {
    setInfiniteGameOver(true);
    setGameOver(true);

    // Salva o recorde final
    let finalBestRecord = infiniteBestRecord;
    if (infiniteStreak > infiniteBestRecord) {
      finalBestRecord = infiniteStreak;
      setInfiniteBestRecord(finalBestRecord);
    }

    // Reseta a sequência atual mas mantém as músicas usadas
    saveInfiniteStats(0, finalBestRecord, infiniteUsedSongs);

    // Mostra estatísticas após um delay
    setTimeout(() => setShowStatistics(true), 800);
  };

  const resetInfiniteMode = () => {
    setInfiniteStreak(0);
    setInfiniteUsedSongs([]);
    saveInfiniteStats(0, infiniteBestRecord, []);
    startInfiniteMode();
  };

  const switchToDailyMode = () => {
    // Para o áudio atual
    resetAudioState();

    // Se estiver no modo infinito e houver um jogo em andamento, salva o estado atual
    if (isInfiniteMode && !gameOver && !infiniteGameOver) {
      const currentGameState = {
        currentSong: currentSong,
        attempts: attempts,
        history: history,
        message: message,
        showHint: showHint,
        activeHint: activeHint,
        currentClipDuration: currentClipDuration
      };

      // Salva o estado atual para poder continuar depois
      saveInfiniteStats(infiniteStreak, infiniteBestRecord, infiniteUsedSongs, currentGameState);
    }

    // Reseta todos os estados do modo infinito (mas mantém as estatísticas salvas)
    setIsInfiniteMode(false);
    setInfiniteGameOver(false);
    setShowNextSongButton(false);

    // Carrega a música do dia usando o currentDay já calculado
    // Se currentDay ainda não foi definido, usa o dia local como fallback
    const dayToUse = currentDay !== null ? currentDay : getDayOfYear();

    // Primeiro, tenta recuperar a música salva para o dia
    const savedSongKey = `ludomusic_daily_song_day_${dayToUse}`;
    const savedSongId = localStorage.getItem(savedSongKey);

    let dailySong;
    if (savedSongId) {
      // Usa a música salva se existir
      dailySong = songs.find(s => s.id.toString() === savedSongId);
      if (!dailySong) {
        // Se a música salva não existe mais, gera uma nova determinística
        dailySong = getDeterministicSongSimple(dayToUse);
        localStorage.setItem(savedSongKey, dailySong.id.toString());
      }
    } else {
      // Gera nova música determinística para o dia
      dailySong = getDeterministicSongSimple(dayToUse);
      localStorage.setItem(savedSongKey, dailySong.id.toString());
    }

    setCurrentSong(dailySong);

    // Agora carrega o estado salvo do jogo diário (se existir)
    const loadSavedDailyGameState = () => {
      if (typeof window === 'undefined') return;

      try {
        const savedState = localStorage.getItem(`ludomusic_game_state_day_${dayToUse}`);

        if (savedState) {
          const parsedState = JSON.parse(savedState);

          if (parsedState.day === dayToUse) {
            setAttempts(parsedState.attempts || 0);
            setHistory(parsedState.history || []);
            setMessage(parsedState.message || '');
            setGameOver(parsedState.gameOver || false);
            setShowHint(parsedState.showHint || false);
            setActiveHint(parsedState.activeHint || 0);
            setCurrentClipDuration(parsedState.currentClipDuration || 0.3);
            setGameResult(parsedState.gameOver ? { won: false, attempts: parsedState.attempts } : null);
            return;
          }
        }
      } catch (error) {
        console.error('Erro ao carregar estado do jogo diário:', error);
      }

      // Se não conseguiu carregar o estado, reseta para o estado inicial
      setAttempts(0);
      setHistory([]);
      setMessage('');
      setGameOver(false);
      setShowHint(false);
      setActiveHint(0);
      setGuess('');
      setShowSuggestions(false);
      setShowStatistics(false);
      setGameResult(null);
    };

    // Carrega o estado salvo
    loadSavedDailyGameState();
  };



  // Carregar estatísticas do modo infinito ao montar
  useEffect(() => {
    loadInfiniteStats();
  }, []);

  // Verificar se é a primeira visita do usuário
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const hasSeenTutorial = localStorage.getItem('ludomusic_tutorial_seen');
        if (!hasSeenTutorial || hasSeenTutorial !== 'true') {
          // É a primeira visita, mostrar tutorial
          setShowTutorial(true);
        }
      } catch (error) {
        // Em caso de erro, não mostrar o tutorial
        console.error('Erro ao verificar tutorial:', error);
      }
    }
  }, []); // Remover dependência do isClient

  // Carregar música do minuto ao montar
  useEffect(() => {
    const loadMusicOfTheDay = async () => {
      setIsLoading(true);

      // Primeiro, verificar se já temos dados salvos para hoje
      const savedDayKey = 'ludomusic_current_day';
      const savedDay = localStorage.getItem(savedDayKey);

      let timeData;
      try {
        timeData = await fetchTimezone();
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

      // Verificar se o dia mudou desde a última visita
      const dayChanged = savedDay && parseInt(savedDay) !== dayOfYear;

      // Salvar o dia atual
      localStorage.setItem(savedDayKey, dayOfYear.toString());
      setCurrentDay(dayOfYear);

      // SISTEMA DETERMINÍSTICO: A música é sempre a mesma para o mesmo dia
      // Verificar se já temos a música salva para hoje
      const savedSongKey = `ludomusic_daily_song_day_${dayOfYear}`;
      const savedSongId = localStorage.getItem(savedSongKey);

      let song;
      if (savedSongId && !dayChanged) {
        // Usar a música salva se for o mesmo dia
        song = songs.find(s => s.id.toString() === savedSongId);
        if (!song) {
          // Se a música salva não existe mais, gerar uma nova
          song = getDeterministicSongSimple(dayOfYear);
          localStorage.setItem(savedSongKey, song.id.toString());
        }
      } else {
        // Gerar nova música para o dia
        song = getDeterministicSongSimple(dayOfYear);
        localStorage.setItem(savedSongKey, song.id.toString());
      }

      // Limpa músicas de dias anteriores (mantém apenas os últimos 3 dias)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ludomusic_daily_song_day_')) {
          const dayFromKey = parseInt(key.replace('ludomusic_daily_song_day_', ''));
          if (dayFromKey < dayOfYear - 2) {
            localStorage.removeItem(key);
          }
        }
      }

      // Usar URL original sem codificação - mais compatível com Vercel
      const songWithEncodedUrl = { ...song, audioUrl: song.audioUrl };

      setCurrentSong(songWithEncodedUrl);
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


    if (audioRef.current) {
      const duration = audioRef.current.duration || 0;
      setAudioDuration(duration);

      let startTimeToUse;

      if (isInfiniteMode) {
        // No modo infinito, gera um tempo aleatório
        startTimeToUse = Math.random() * Math.max(0, duration - 10);
      } else if (currentDay !== null) {
        // No modo normal, usa o sistema determinístico baseado no dia
        const savedStartTimeKey = `ludomusic_start_time_day_${currentDay}`;
        const savedStartTime = localStorage.getItem(savedStartTimeKey);

        if (savedStartTime) {
          // Usa o tempo salvo se existir
          startTimeToUse = parseFloat(savedStartTime);
        } else {
          // Gera um novo tempo determinístico baseado no dia e salva no localStorage
          startTimeToUse = getDeterministicStartTime(duration, currentDay);
          localStorage.setItem(savedStartTimeKey, startTimeToUse.toString());
        }
      } else {
        // Fallback para tempo aleatório
        startTimeToUse = Math.random() * Math.max(0, duration - 10);
      }

      setStartTime(startTimeToUse);
      audioRef.current.currentTime = startTimeToUse;



      // Aplicar configurações de som
      if (typeof window !== 'undefined') {
        try {
          const savedSettings = localStorage.getItem('bandle_settings');
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            audioRef.current.muted = !settings.sound;
          }
        } catch (error) {
          // console.error('Erro ao aplicar configurações de som:', error);
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
    const maxDuration = (gameOver && !isInfiniteMode)
      ? MAX_PLAY_TIME
      : maxClipDurations[attempts] || maxClipDurations[maxClipDurations.length - 1];

    let fadeOutTimeout = null;
    let fadeOutInterval = null;

    const updateProgress = () => {
      try {
        if (!audio || audio.paused || audio.ended || !audio.duration || isNaN(audio.duration)) return;

        const currentTime = audio.currentTime - startTime;

        // Sempre atualizar o progresso primeiro
        setAudioProgress(Math.max(0, currentTime));

        // Verificar se excedeu o tempo limite
        if ((!gameOver || isInfiniteMode) && currentTime >= maxDuration) {
          // Para o áudio e volta para o início
          audio.pause();
          setIsPlaying(false);
          audio.currentTime = startTime;
          setAudioProgress(0);
        } else if (gameOver && !isInfiniteMode && currentTime >= MAX_PLAY_TIME) {
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
        }
      } catch (error) {
        // console.error('Erro ao atualizar progresso:', error);
      }
    };

    const updatePlay = () => {
      try {
        if (audio.paused || audio.ended) {
          setIsPlaying(false);
        } else {
          setIsPlaying(!audio.paused && !audio.ended);
        }
      } catch (error) {
        // console.error('Erro ao atualizar play:', error);
      }
    };

    const handleAudioError = (e) => {
      // console.error('❌ ERRO NO ELEMENTO DE ÁUDIO:', e);
      setAudioError(true);
      setMessage('Erro ao carregar o áudio. Tentando novamente...');
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play', updatePlay);
    audio.addEventListener('pause', updatePlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleAudioError);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('play', updatePlay);
      audio.removeEventListener('pause', updatePlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleAudioError);
      if (fadeOutInterval) clearInterval(fadeOutInterval);
      if (fadeOutTimeout) clearTimeout(fadeOutTimeout);
    };
  }, [startTime, gameOver, attempts, isInfiniteMode, maxClipDurations]);

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
      result = { type: 'success', value: selectedGuess };

      if (isInfiniteMode) {
        // No modo infinito, mostra botão para próxima música
        setGameOver(true);
        setShowNextSongButton(true);
      } else {
        // No modo normal, termina o jogo
        setGameOver(true);
        setGameResult({ won: true, attempts: newAttempts });
        setTimeout(() => setShowStatistics(true), 800);
      }
    } else if (newAttempts >= MAX_ATTEMPTS) {
      setMessage(`${t('game_over')} ${currentSong.game} - ${currentSong.title}`);
      result = { type: 'fail', value: selectedGuess };

      if (isInfiniteMode) {
        // No modo infinito, termina a sequência
        endInfiniteMode();
      } else {
        // No modo normal, termina o jogo
        setGameOver(true);
        setGameResult({ won: false, attempts: newAttempts });
        setTimeout(() => setShowStatistics(true), 800);
      }
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
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setShowHint(true);
    setHistory(prev => [...prev, { type: 'skipped' }]);
    setMessage(t('skipped'));

    if (newAttempts >= MAX_ATTEMPTS) {
      setMessage(`${t('game_over')} ${currentSong.game} - ${currentSong.title}`);

      if (isInfiniteMode) {
        // No modo infinito, termina a sequência
        endInfiniteMode();
      } else {
        // No modo normal, termina o jogo
        setGameOver(true);
        setGameResult({ won: false, attempts: newAttempts });
        setTimeout(() => setShowStatistics(true), 800);
      }
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
    if (audioRef.current && startTime !== undefined) {
      audioRef.current.currentTime = startTime;
      audioRef.current.pause();
      setAudioProgress(0);
      setIsPlaying(false);
    }
  }, [activeHint, startTime]);

  useEffect(() => {
    setActiveHint(attempts);
    if (audioRef.current && startTime !== undefined) {
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
      if (message === 'Erro ao carregar o áudio. Verifique se o arquivo existe.' ||
          message === 'Erro ao carregar o áudio. Tentando novamente...' ||
          message === 'Erro ao reproduzir o áudio. Tentando novamente...') {
        setMessage('');
      }

      // No modo infinito, força o recarregamento do áudio com um pequeno delay
      if (isInfiniteMode && audioRef.current) {
        setIsPlaying(false); // Reset play state only in infinite mode
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
          }
        }, 100);
      }
    }
  }, [currentSong?.audioUrl, isInfiniteMode]);

  // Funções para lidar com o tutorial
  const handleCloseTutorial = () => {
    setShowTutorial(false);
    // Marcar que o usuário já viu o tutorial
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ludomusic_tutorial_seen', 'true');
        // Verificar se foi salvo corretamente
        const saved = localStorage.getItem('ludomusic_tutorial_seen');
        if (saved !== 'true') {
          console.warn('Tutorial não foi salvo corretamente no localStorage');
        }
      } catch (error) {
        console.error('Erro ao salvar tutorial visto:', error);
      }
    }
  };

  const handleStartPlaying = () => {
    setShowTutorial(false);
    // Marcar que o usuário já viu o tutorial
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ludomusic_tutorial_seen', 'true');
        // Verificar se foi salvo corretamente
        const saved = localStorage.getItem('ludomusic_tutorial_seen');
        if (saved !== 'true') {
          console.warn('Tutorial não foi salvo corretamente no localStorage');
        }
      } catch (error) {
        console.error('Erro ao salvar tutorial visto:', error);
      }
    }
  };

  // Função para ativar o easter egg do sacabambapis
  const triggerSacabambapis = () => {
    // Mostrar efeito visual
    setShowSacabambapis(true);

    // Tocar som do vine boom
    const vineAudio = new Audio('/vine.mp3');
    vineAudio.volume = 0.7;
    vineAudio.play().catch(() => {
      // Silenciar erro de áudio
    });

    // Após 2 segundos, esconde o efeito
    setTimeout(() => {
      setShowSacabambapis(false);
    }, 2000);
  };

  // Função para salvar o estado completo do jogo
  const saveGameState = (gameState) => {
    if (currentDay !== null && typeof window !== 'undefined') {
      const stateToSave = {
        day: currentDay,
        attempts: gameState.attempts,
        history: gameState.history,
        message: gameState.message,
        gameOver: gameState.gameOver,
        showHint: gameState.showHint,
        activeHint: gameState.activeHint,
        currentClipDuration: gameState.currentClipDuration,
        timestamp: Date.now()
      };


      localStorage.setItem(`ludomusic_game_state_day_${currentDay}`, JSON.stringify(stateToSave));

      // Manter compatibilidade com o sistema antigo para jogos terminados
      if (gameState.gameOver) {
        localStorage.setItem('ludomusic_gameover_day', currentDay);
        localStorage.setItem('ludomusic_gameover_history', JSON.stringify(gameState.history));
        localStorage.setItem('ludomusic_gameover_message', gameState.message);
      }
    }
  };

  // Estado para controlar se já carregou o estado salvo
  const [hasLoadedSavedState, setHasLoadedSavedState] = useState(false);

  // Persistência do estado do jogo (salva sempre que houver mudanças importantes)
  useEffect(() => {
    // Só salva se já carregou o estado inicial para evitar sobrescrever dados salvos
    // E apenas no modo diário (modo infinito tem seu próprio sistema de salvamento)
    if (currentDay !== null && hasLoadedSavedState && !isInfiniteMode) {
      const gameState = {
        attempts,
        history,
        message,
        gameOver,
        showHint,
        activeHint,
        currentClipDuration
      };
      saveGameState(gameState);
    }
  }, [attempts, history, message, gameOver, showHint, activeHint, currentClipDuration, currentDay, hasLoadedSavedState, isInfiniteMode]);

  // Limpa dados antigos do localStorage
  const cleanupOldLocalStorageData = (currentDay) => {
    if (typeof window === 'undefined') return; // Verificação SSR

    try {
      // Mantém apenas os dados do dia atual e dos 2 dias anteriores
      const keysToKeep = [
        `ludomusic_start_time_day_${currentDay}`,
        `ludomusic_start_time_day_${currentDay - 1}`,
        `ludomusic_start_time_day_${currentDay - 2}`,
        `ludomusic_game_state_day_${currentDay}`,
        `ludomusic_game_state_day_${currentDay - 1}`,
        `ludomusic_game_state_day_${currentDay - 2}`,
        `ludomusic_daily_song_day_${currentDay}`,
        `ludomusic_daily_song_day_${currentDay - 1}`,
        `ludomusic_daily_song_day_${currentDay - 2}`,
        'ludomusic_gameover_day',
        'ludomusic_gameover_history',
        'ludomusic_gameover_message',
        'ludomusic_settings',
        'ludomusic_statistics',
        'ludomusic_infinite_stats',
        'ludomusic_daily_history', // Histórico de músicas para controle de repetições
        'ludomusic_tutorial_seen', // Tutorial visto pelo usuário
        'ludomusic_current_day' // Dia atual salvo
      ];

      // Procura por chaves antigas relacionadas ao ludomusic
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ludomusic_') && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      // console.error('Erro ao limpar localStorage:', error);
    }
  };

  // Ao carregar, verifica se há estado salvo do jogo para o dia atual
  useEffect(() => {
    if (currentDay !== null) {
      // Limpa dados antigos
      cleanupOldLocalStorageData(currentDay);

      // Função para carregar o estado salvo (definida localmente para evitar dependências)
      const loadSavedGameState = () => {
        if (typeof window === 'undefined') return false; // Verificação SSR

        try {
          const savedState = localStorage.getItem(`ludomusic_game_state_day_${currentDay}`);

          if (savedState) {
            const parsedState = JSON.parse(savedState);

            if (parsedState.day === currentDay) {
              setAttempts(parsedState.attempts || 0);
              setHistory(parsedState.history || []);
              setMessage(parsedState.message || '');
              setGameOver(parsedState.gameOver || false);
              setShowHint(parsedState.showHint || false);
              setActiveHint(parsedState.activeHint || 0);
              setCurrentClipDuration(parsedState.currentClipDuration || 0.3);
              return true; // Estado carregado com sucesso
            }
          }
        } catch (error) {
          // console.error('❌ Erro ao carregar estado do jogo:', error);
        }
        return false; // Nenhum estado carregado
      };

      // Tenta carregar o estado completo do jogo primeiro
      const stateLoaded = loadSavedGameState();

      // Se não conseguiu carregar o estado completo, verifica o sistema antigo (compatibilidade)
      if (!stateLoaded) {
        const savedDay = localStorage.getItem('ludomusic_gameover_day');
        if (savedDay && Number(savedDay) === currentDay) {
          setGameOver(true);
          const savedHistory = localStorage.getItem('ludomusic_gameover_history');
          if (savedHistory) setHistory(JSON.parse(savedHistory));
          const savedMessage = localStorage.getItem('ludomusic_gameover_message');
          if (savedMessage) setMessage(savedMessage);
        }
      }

      // Marca que já tentou carregar o estado (independente de ter encontrado ou não)
      setHasLoadedSavedState(true);
    }
  }, [currentDay]);

  // Aplicar configurações salvas ao carregar e escutar mudanças
  useEffect(() => {
    // Função para aplicar as configurações
    const applySettings = () => {
      if (typeof window === 'undefined') return; // Verificação SSR

      try {
        const savedSettings = localStorage.getItem('bandle_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);

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
        }
      } catch (error) {
        // console.error('Erro ao aplicar configurações:', error);
      }
    };

    // Aplicar configurações iniciais
    applySettings();

    // Escutar eventos de mudança de configurações
    const handleSettingsChanged = (event) => {
      if (typeof window === 'undefined') return; // Verificação SSR

      try {
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
      } catch (error) {
        // console.error('Erro ao aplicar configurações:', error);
      }
    };

    // Adicionar listener para o evento personalizado
    document.addEventListener('ludomusicSettingsChanged', handleSettingsChanged);

    // Adicionar listener para mudanças no localStorage
    window.addEventListener('storage', applySettings);

    // Limpar listeners ao desmontar
    return () => {
      document.removeEventListener('ludomusicSettingsChanged', handleSettingsChanged);
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
    <>
      <Head>
        <title>LudoMusic - Adivinhe a Música dos Seus Jogos Favoritos | Jogo Musical Gratuito</title>
        <meta name="description" content="🎮 Teste seus conhecimentos musicais dos videogames! Ouça trechos de mais de 1000 músicas de jogos famosos e adivinhe o nome. Jogue sozinho ou com amigos no modo multiplayer. Totalmente gratuito!" />
        <meta name="keywords" content="jogo musical, videogame música, quiz musical, adivinhar música games, trilha sonora jogos, ludomusic, bandle, heardle games" />
        <link rel="canonical" href="https://ludomusic.xyz" />

        {/* Open Graph específico para a home */}
        <meta property="og:title" content="LudoMusic - Adivinhe a Música dos Seus Jogos Favoritos" />
        <meta property="og:description" content="🎮 Teste seus conhecimentos musicais dos videogames! Mais de 1000 músicas de jogos famosos. Jogue sozinho ou com amigos!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ludomusic.xyz" />
        <meta property="og:image" content="https://ludomusic.xyz/Logo.png" />

        {/* Twitter Card específico */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LudoMusic - Jogo Musical de Videogames" />
        <meta name="twitter:description" content="🎮 Teste seus conhecimentos musicais! Mais de 1000 músicas de jogos famosos." />

        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎵</text></svg>" />
      </Head>
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

          {/* Seletor de modo */}
          <div className={styles.modeSelector}>
            <button
              className={`${styles.modeButton} ${!isInfiniteMode ? styles.modeActive : ''}`}
              onClick={() => {
                if (isInfiniteMode) {
                  switchToDailyMode();
                }
              }}
              disabled={!isInfiniteMode}
            >
              {isClient ? t('daily_mode') : 'Modo Diário'}
            </button>
            <button
              className={`${styles.modeButton} ${isInfiniteMode ? styles.modeActive : ''}`}
              onClick={() => {
                if (!isInfiniteMode) {
                  startInfiniteMode();
                }
              }}
              disabled={isInfiniteMode}
            >
              {isClient ? t('infinite_mode') : 'Modo Infinito'}
            </button>
          </div>

          {/* Estatísticas do modo infinito */}
          {isInfiniteMode && (
            <div className={styles.infiniteStats}>
              <div className={styles.infiniteStat}>
                <span className={styles.infiniteStatLabel}>
                  {isClient ? t('current_streak') : 'Sequência Atual'}:
                </span>
                <span className={styles.infiniteStatValue}>{infiniteStreak}</span>
              </div>
              <div className={styles.infiniteStat}>
                <span className={styles.infiniteStatLabel}>
                  {isClient ? t('best_record') : 'Melhor Recorde'}:
                </span>
                <span className={styles.infiniteStatValue}>{infiniteBestRecord}</span>
              </div>
              <div className={styles.infiniteStat}>
                <span className={styles.infiniteStatLabel}>
                  {isClient ? t('songs_completed') : 'Músicas Completadas'}:
                </span>
                <span className={styles.infiniteStatValue}>{infiniteUsedSongs.length}/{songs.length}</span>
              </div>
            </div>
          )}
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
                  max={(gameOver && !isInfiniteMode) ? MAX_PLAY_TIME : (maxClipDurations[attempts] || maxClipDurations[maxClipDurations.length - 1])}
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
                    const maxAllowed = (gameOver && !isInfiniteMode) ? MAX_PLAY_TIME : (maxClipDurations[attempts] || maxClipDurations[maxClipDurations.length - 1]);
                    if (value > maxAllowed) value = maxAllowed;
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
                        ((gameOver && !isInfiniteMode) ? MAX_PLAY_TIME : (maxClipDurations[attempts] ?? maxClipDurations[maxClipDurations.length - 1])) * 1000
                      ).toISOString().substring(14, 19)
                    : '00:00'}
                </span>
              </div>
              <div className={styles.audioVolumeRow}>
                <button
                  className={styles.audioPlayBtnCustom}
                  onClick={() => {
                    if (!audioRef.current || isPlayButtonDisabled) {
                      return;
                    }

                    // Desabilita o botão temporariamente para evitar duplo clique
                    setIsPlayButtonDisabled(true);
                    setTimeout(() => setIsPlayButtonDisabled(false), 300);

                    // Se não há duração mas há URL, tentar forçar carregamento
                    if (!audioDuration && currentSong?.audioUrl) {
                      audioRef.current.load();
                      return;
                    }

                    // Verificar se o startTime está definido
                    if (startTime === undefined) {
                      return;
                    }

                    const currentTime = audioRef.current.currentTime - startTime;
                    const maxAllowed = (gameOver && !isInfiniteMode) ? MAX_PLAY_TIME : (maxClipDurations[attempts] || maxClipDurations[maxClipDurations.length - 1]);

                    if (currentTime >= maxAllowed || currentTime < 0) {
                      // Se já passou do limite ou está antes do início, volta para o início do trecho
                      audioRef.current.currentTime = startTime;
                      setAudioProgress(0);
                    }

                    if (isPlaying) {
                      audioRef.current.pause();
                    } else {
                      audioRef.current.play().catch(error => {
                        console.error('Erro ao reproduzir áudio:', error);
                        setAudioError(true);
                        setMessage('Erro ao reproduzir o áudio. Tentando novamente...');
                      });
                    }
                  } }
                  disabled={audioError || (!audioDuration && !currentSong?.audioUrl) || isPlayButtonDisabled}
                  style={{
                    opacity: (audioError || !audioDuration) ? 0.5 : 1,
                    cursor: (audioError || !audioDuration) ? 'not-allowed' : 'pointer'
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
                  onChange={e => setVolume(Number(e.target.value))}
                  className={styles.audioVolumeCustom}
                  disabled={audioError} />
              </div>
              <audio
                ref={audioRef}
                src={currentSong?.audioUrl}
                style={{ display: 'none' }}
                preload="auto"
                crossOrigin="anonymous"
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleAudioEnded}
                onError={(e) => {
                  // console.error('🚨 ERRO DE ÁUDIO:', {
                  //   currentSong: currentSong,
                  //   audioUrl: currentSong?.audioUrl,
                  //   error: e,
                  //   audioElement: audioRef.current,
                  //   networkState: audioRef.current?.networkState,
                  //   readyState: audioRef.current?.readyState
                  // });
                  setAudioError(true);
                  setMessage('Erro ao carregar o áudio. Tentando novamente...');

                  // Tentar recarregar o áudio após um pequeno delay
                  setTimeout(() => {
                    if (audioRef.current && currentSong?.audioUrl) {
                      // console.log('🔄 Tentando recarregar áudio...');
                      audioRef.current.load();
                    }
                  }, 1000);
                }}
                onCanPlay={() => {
                  // console.log('✅ ÁUDIO PODE SER REPRODUZIDO');
                  setAudioError(false);
                  if (message === 'Erro ao carregar o áudio. Tentando novamente...' || message === 'Erro ao carregar o áudio. Verifique se o arquivo existe.') {
                    setMessage('');
                  }
                }}
                onLoadStart={() => {
                  // console.log('🔄 INICIANDO CARREGAMENTO DO ÁUDIO');
                }}
                onLoadedData={() => {
                  // console.log('📊 DADOS DO ÁUDIO CARREGADOS');
                }}
                onCanPlayThrough={() => {
                  // console.log('🎵 ÁUDIO TOTALMENTE CARREGADO');
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
                {filteredSuggestions.map((suggestion, suggestionIndex) => (
                  <li
                    key={`suggestion-${suggestion.id}-${suggestionIndex}`}
                    className={styles.suggestionItemModern}
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.game} - {suggestion.title}
                  </li>
                ))}
                <li
                  className={styles.suggestionItemModern}
                  onMouseDown={triggerSacabambapis}
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
          <div className={styles.historyBox}>
            {history.map((item, idx) => {
              const isFromCorrectGame = item?.type === 'fail' &&
                currentSong?.game &&
                songs.find(s => s.title === item.value)?.game === currentSong.game;
              return (
                <div key={`history-${idx}-${item.type || 'unknown'}`} className={styles.historyItem}>
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

          {/* Botão Próxima Música no modo infinito */}
          {isInfiniteMode && showNextSongButton && (
            <div className={styles.nextSongContainer}>
              <button
                className={styles.nextSongButton}
                onClick={nextInfiniteSong}
              >
                {isClient ? t('next_song') : 'Próxima Música'}
                <FaFastForward style={{ marginLeft: 8, fontSize: '1em' }} />
              </button>
            </div>
          )}

          {!isInfiniteMode && (
            <div className={styles.timerBox}>
              Novo jogo em: <span className={styles.timer}>{formatTimer(timer)}</span>
            </div>
          )}

          {isInfiniteMode && infiniteGameOver && (
            <div className={styles.infiniteGameOverBox}>
              <h3>{isClient ? t('infinite_game_over') : 'Fim da Sequência!'}</h3>
              {infiniteStreak > infiniteBestRecord && (
                <p className={styles.newRecord}>
                  {isClient ? t('new_record') : 'Novo Recorde!'}
                </p>
              )}
              <p>
                {isClient
                  ? t('streak_of').replace('{count}', infiniteStreak)
                  : `Sequência de ${infiniteStreak} músicas`
                }
              </p>
              <button
                className={styles.playAgainButton}
                onClick={resetInfiniteMode}
              >
                {isClient ? t('play_again_infinite') : 'Jogar Novamente'}
              </button>
            </div>
          )}
        </div>


        {/* Menu do jogo */}
        <GameMenu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
        />

        {/* Efeito visual do sacabambapis */}
        {showSacabambapis && (
          <div className={styles.sacabambapis}>
            <img
              src="/sacabambapis.png"
              alt="Sacabambapis"
              className={styles.sacabambapisImage}
            />
          </div>
        )}

        {/* Modal de estatísticas */}
        <Statistics
          isOpen={showStatistics}
          onClose={() => setShowStatistics(false)}
          gameResult={gameResult}
          isInfiniteMode={isInfiniteMode}
        />

        {/* Tutorial de boas-vindas */}
        <Tutorial
          isOpen={showTutorial}
          onClose={handleCloseTutorial}
          onStartPlaying={handleStartPlaying}
        />
        </div>
        <Footer />
      </div>
    </>
  );
};