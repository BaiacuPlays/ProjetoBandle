import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Script from 'next/script';

import { songs } from '../data/songs';
import styles from '../styles/Home.module.css';
import { FaFastForward, FaQuestionCircle, FaBars, FaUser, FaUsers, FaTrophy } from 'react-icons/fa';

import Footer from '../components/Footer';
import GameMenu from '../components/GameMenu';
import Statistics from '../components/Statistics';
import Tutorial from '../components/Tutorial';
import UserProfile from '../components/UserProfile';
import SimpleFriendsModal from '../components/SimpleFriendsModal';
import UserProfileViewer from '../components/UserProfileViewer';
import PlayersRanking from '../components/PlayersRanking';
import NotificationCenter from '../components/NotificationCenter';
import GlobalStats from '../components/GlobalStats';
import AchievementNotification from '../components/AchievementNotification';
import SuccessFeedback from '../components/SuccessFeedback';
import SimpleSuccessFeedback from '../components/SimpleSuccessFeedback';
import CustomAnnouncement from '../components/CustomAnnouncement';

import BrowserCompatibilityWarning from '../components/BrowserCompatibilityWarning';
import BugReportModal from '../components/BugReportModal';

import { useLanguage } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchTimezone } from '../config/api';
import { browserCompatibility } from '../utils/browserCompatibility';
import { useServiceWorker } from '../hooks/useServiceWorker';
// Imports dinâmicos para evitar problemas de SSR
// import { audioCache } from '../utils/audioCache';
// import { useAudioPreloader } from '../hooks/useAudioPreloader';
// import { useAudioProxy } from '../utils/audioProxy';
import { simpleAudioProxy, useSimpleAudioProxy } from '../utils/simpleAudioProxy';
// Hooks removidos para melhor performance
import {
  MemoizedPlayButton,
  MemoizedVolumeControl,
  MemoizedSuggestions
} from '../components/MemoizedComponents';

// Componentes de monetização
import DonationButton from '../components/DonationButton';

// Utilitários de feedback
import { playSuccessSound, playPerfectSound, playFirstTrySound } from '../utils/soundEffects';

// 🎮 Novos componentes aprimorados com game feel
import { useGameFeel } from '../hooks/useGameFeel';
import EnhancedButton, { AttemptButton, InputButton } from '../components/EnhancedButton';
import EnhancedInput, { MusicSearchInput } from '../components/EnhancedInput';

const MAX_ATTEMPTS = 6;


export default function Home() {
  const { t, isClient } = useLanguage();
  const { isAuthenticated } = useAuth();

  // Hook do perfil com verificação de segurança
  const profileContext = useProfile();
  const updateGameStats = profileContext?.updateGameStats || (() => {});

  // 🎮 Hook para efeitos de game feel
  const gameFeel = useGameFeel();

  // Hooks
  useServiceWorker(); // Registrar service worker sem usar a variável

  // Verificação básica das músicas (sem logs detalhados)
  useEffect(() => {
    if (!songs || songs.length === 0) {
      // Lista de músicas não carregada - erro silencioso
    }
  }, []);

  // Hook para proxy de áudio (resolve problemas de CORS)
  const { songs: processedSongs, isReady } = useSimpleAudioProxy(songs);

  // Usar músicas processadas (com proxy se necessário)
  const songsToUse = processedSongs || songs || [];



  // Cache de áudio temporariamente desabilitado

  // Sistema de cache simplificado para correção
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Cache simplificado sem imports dinâmicos
    }
  }, []);

  // Funções de performance simples
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  const throttle = useCallback((func, delay) => {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(null, args);
      }
    };
  }, []);

  // Hooks removidos para melhor performance
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

  // 🕐 TIMER REAL para conquistas de velocidade
  const [gameStartTime, setGameStartTime] = useState(null); // Timestamp real do início do jogo

  // 🏃 TIMER DE SESSÃO para conquista "Maratonista"
  const [sessionStartTime, setSessionStartTime] = useState(null); // Timestamp do início da sessão

  // 👑 RASTREAMENTO DE COMEBACK para conquista "Rei do Comeback"
  const [consecutiveLosses, setConsecutiveLosses] = useState(0); // Derrotas consecutivas
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
  const [showBugReport, setShowBugReport] = useState(false);
  const [isPlayLoading, setIsPlayLoading] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);
  const [isSkipLoading, setIsSkipLoading] = useState(false);
  const [audioLoadTimeout, setAudioLoadTimeout] = useState(null);
  const [playPromiseRef, setPlayPromiseRef] = useState(null);
  const [audioLoadError, setAudioLoadError] = useState(false);
  const [audioLoadRetries, setAudioLoadRetries] = useState(0);
  const [connectionError, setConnectionError] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioLoadingMessage, setAudioLoadingMessage] = useState('');

  // Estados de monetização removidos

  // Estados do modo infinito
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [infiniteStreak, setInfiniteStreak] = useState(0);
  const [infiniteBestRecord, setInfiniteBestRecord] = useState(0);
  const [infiniteUsedSongs, setInfiniteUsedSongs] = useState([]);
  const [infiniteGameOver, setInfiniteGameOver] = useState(false);
  const [showNextSongButton, setShowNextSongButton] = useState(false);

  // Estados do perfil
  const [showProfile, setShowProfile] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showUserProfileViewer, setShowUserProfileViewer] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showPlayersRanking, setShowPlayersRanking] = useState(false);

  // Estados do feedback de sucesso
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [successFeedbackType, setSuccessFeedbackType] = useState('success');
  const [successFeedbackData, setSuccessFeedbackData] = useState({});

  // Estados do feedback simplificado (infinito)
  const [showSimpleFeedback, setShowSimpleFeedback] = useState(false);

  // Estado para debug do dropdown
  const [showSelectFromListError, setShowSelectFromListError] = useState(false);

  // Estado para controlar carregamento da música diária
  const [isDailyMusicLoaded, setIsDailyMusicLoaded] = useState(false);
  const [isDailyMusicLoading, setIsDailyMusicLoading] = useState(false);

  // Estado para contador de jogos (para anúncios - removido mas mantido para compatibilidade)
  const [gamesPlayedCount, setGamesPlayedCount] = useState(0);



  // Tempos máximos de reprodução por tentativa
  const maxClipDurations = [0.6, 1.2, 2.0, 3.0, 3.5, 4.2];

  // Limite máximo de reprodução em segundos
  const MAX_PLAY_TIME = 15;


  // Função para gerar um número determinístico baseado no dia
  const getDeterministicRandom = (day, seed = 0) => {
    // Usa o dia e seed como entrada para gerar um número determinístico
    // Algoritmo simples mas eficaz para gerar números pseudo-aleatórios
    const x = Math.sin(day * 12.9898 + seed * 78.233) * 43758.5453;
    return x - Math.floor(x); // Retorna apenas a parte decimal (0-1)
  };

  // Função para gerar um tempo determinístico dentro da duração da música com base no dia
  const getDeterministicStartTime = (duration, day) => {
    // Deixa uma margem de 15 segundos no final da música para garantir que nunca toque os últimos 15 segundos
    const maxStart = Math.max(0, duration - 15);

    // Usa função determinística para gerar tempo de início
    const deterministicRandom = getDeterministicRandom(day, 1);

    return deterministicRandom * maxStart;
  };

  // Função para selecionar música determinística baseada no dia (versão simples, sem histórico)
  const getDeterministicSongSimple = (day) => {
    // SEMPRE usar songsToUse (músicas processadas pelo proxy) se disponível
    // Se não estiver pronto, retornar null para aguardar
    const availableSongs = songsToUse;

    // Verificar se há músicas disponíveis (processadas pelo proxy)
    if (!availableSongs || availableSongs.length === 0) {
      console.log('🎵 [DEBUG] Aguardando músicas serem processadas pelo proxy...');
      return null; // Retorna null para aguardar o proxy processar
    }

    // Usar função determinística para selecionar diretamente da lista completa
    const deterministicRandom = getDeterministicRandom(day, 0);
    const index = Math.floor(deterministicRandom * availableSongs.length);
    const selectedSong = availableSongs[index];

    if (!selectedSong) {
      console.error('❌ Música não encontrada no índice:', index, 'de', availableSongs.length);
      console.error('❌ Música não encontrada para o dia:', day);
      return null;
    }

    console.log(`🎵 [DEBUG] Música determinística para o dia ${day}:`, selectedSong.title, 'por', selectedSong.artist, 'de', selectedSong.game);

    return selectedSong;
  };

  // Função centralizada para carregar música do dia
  const loadDailyMusic = useCallback(async (forceReload = false) => {
    // Evitar carregamentos múltiplos simultâneos
    if (isDailyMusicLoading && !forceReload) {
      console.log('🎵 [DEBUG] Carregamento já em andamento, ignorando...');
      return;
    }

    // Se já carregou e não é reload forçado, ignorar
    if (isDailyMusicLoaded && !forceReload) {
      console.log('🎵 [DEBUG] Música diária já carregada, ignorando...');
      return;
    }

    // Se não há músicas processadas ainda, aguardar
    if (!songsToUse || songsToUse.length === 0) {
      console.log('🎵 [DEBUG] Aguardando músicas serem processadas...');
      return;
    }

    setIsDailyMusicLoading(true);
    console.log('🎵 [DEBUG] Iniciando carregamento da música diária...');

    try {
      // Obter dados de tempo
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
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

      console.log(`🎵 [DEBUG] Dia do ano calculado: ${dayOfYear} (${now.toDateString()})`);

      // Salvar o dia atual
      localStorage.setItem('ludomusic_current_day', dayOfYear.toString());
      setCurrentDay(dayOfYear);

      // Verificar se usuário já jogou hoje
      const hasPlayedToday = await checkDailyGameStatus();

      // Selecionar música
      let song;
      if (
        now.getFullYear() === 2025 &&
        now.getMonth() === 4 && // Maio é mês 4 (zero-based)
        now.getDate() === 28
      ) {
        song = songsToUse.find(s => s.title === 'Crowdfunding Single');
        console.log('🎵 [DEBUG] Override especial 28/05/2025: Crowdfunding Single');
      } else {
        song = getDeterministicSongSimple(dayOfYear);
      }

      if (!song) {
        console.error('❌ [DEBUG] Falha ao obter música do dia');
        setIsLoading(false);
        setIsDailyMusicLoading(false);
        return;
      }

      // Processar URL através do proxy
      const songWithProxyUrl = {
        ...song,
        audioUrl: song?.audioUrl ? simpleAudioProxy.getAudioUrl(song.audioUrl) : ''
      };

      console.log('🎵 [DEBUG] Música do dia carregada:', songWithProxyUrl.title);
      setCurrentSong(songWithProxyUrl);
      setIsDailyMusicLoaded(true);

      // Carregar estado do jogo se já jogou hoje
      if (hasPlayedToday) {
        console.log('🎵 [DEBUG] Usuário já jogou hoje, carregando estado salvo...');
        try {
          const savedState = localStorage.getItem(`ludomusic_game_state_day_${dayOfYear}`);
          if (savedState) {
            const parsedState = JSON.parse(savedState);
            if (parsedState.day === dayOfYear && parsedState.gameOver) {
              setAttempts(parsedState.attempts || 6);
              setHistory(parsedState.history || []);
              setMessage(parsedState.message || 'Você já jogou hoje!');
              setGameOver(true);
              setShowHint(true);
              setActiveHint(0);
              setCurrentClipDuration(15);
              setGameResult(parsedState.gameResult || { won: false, attempts: parsedState.attempts || 6 });
            }
          } else {
            setGameOver(true);
            setMessage('Você já jogou hoje! Volte amanhã para uma nova música.');
            setShowHint(true);
            setActiveHint(0);
            setCurrentClipDuration(15);
          }
        } catch (error) {
          setGameOver(true);
          setMessage('Você já jogou hoje! Volte amanhã para uma nova música.');
          setShowHint(true);
          setActiveHint(0);
          setCurrentClipDuration(15);
        }
      }

      // Configurar timer para próxima meia-noite
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      setTimer(nextMidnight - now);
      setIsLoading(false);

    } catch (error) {
      console.error('❌ [DEBUG] Erro ao carregar música do dia:', error);
      setIsLoading(false);
    } finally {
      setIsDailyMusicLoading(false);
    }
  }, [songsToUse, isDailyMusicLoading, isDailyMusicLoaded]);

  // Função para verificar se usuário já jogou hoje
  const checkDailyGameStatus = useCallback(async () => {
    try {
      if (!currentDay) return false;

      // Verificação simplificada apenas no localStorage
      const savedState = localStorage.getItem(`ludomusic_game_state_day_${currentDay}`);

      if (savedState) {
        const parsedState = JSON.parse(savedState);
        return parsedState.day === currentDay && parsedState.gameOver;
      }

      return false; // Pode jogar
    } catch (error) {
      console.log('Erro na verificação do status:', error);
      return false; // Em caso de erro, permitir jogar
    }
  }, [currentDay]);





  // Função para calcular o dia do ano
  const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Funções do modo infinito
  const getRandomInfiniteSong = (usedSongs = infiniteUsedSongs) => {
    // Verificar se as músicas processadas pelo proxy estão disponíveis
    if (!songsToUse || songsToUse.length === 0) {
      return null;
    }

    // Filtra músicas que ainda não foram usadas
    const availableSongs = songsToUse.filter(song => !usedSongs.includes(song.id));

    // Se não há músicas disponíveis, o jogador completou todas
    if (availableSongs.length === 0) {
      return null;
    }

    // Seleciona uma música aleatória das disponíveis
    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    return availableSongs[randomIndex];
  };

  const resetAudioState = () => {
    // Limpar timeouts pendentes
    if (audioLoadTimeout) {
      clearTimeout(audioLoadTimeout);
      setAudioLoadTimeout(null);
    }

    // Cancelar promise de play pendente
    if (playPromiseRef) {
      try {
        playPromiseRef.catch(() => {}); // Silenciar erros da promise cancelada
      } catch (e) {}
      setPlayPromiseRef(null);
    }

    // Resetar estados de loading
    setIsPlayLoading(false);
    setPendingPlay(false);
    setIsPlayButtonDisabled(false);

    // Resetar estados de erro de carregamento
    setAudioLoadError(false);
    setAudioLoadRetries(0);
    setConnectionError(false);

    // Resetar áudio
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setAudioProgress(0);
      } catch (error) {
        // Silent error handling
      }
    }
  };

  // Função para ativar feedback de sucesso (modo diário)
  const triggerSuccessFeedback = (attempts, song) => {
    // Determinar tipo de feedback baseado no número de tentativas
    let feedbackType = 'success';
    if (attempts === 1) {
      feedbackType = 'firstTry';
      playFirstTrySound();
      // Feedback visual especial para primeira tentativa
      if (inputRef.current) {
        gameFeel.onPerfect(inputRef.current);
      }
    } else if (attempts <= 2) {
      feedbackType = 'perfect';
      playPerfectSound();
      // Feedback visual para acerto perfeito
      if (inputRef.current) {
        gameFeel.onSuccess(inputRef.current, attempts);
      }
    } else {
      feedbackType = 'success';
      playSuccessSound();
      // Feedback visual para sucesso normal
      if (inputRef.current) {
        gameFeel.onSuccess(inputRef.current, attempts);
      }
    }

    // Configurar dados do feedback
    setSuccessFeedbackType(feedbackType);
    setSuccessFeedbackData({
      attempts,
      songTitle: song?.title || '',
      gameTitle: song?.game || ''
    });

    // Mostrar feedback
    setShowSuccessFeedback(true);
  };

  // Função para lidar com o fim do feedback de sucesso
  const handleSuccessFeedbackComplete = () => {
    setShowSuccessFeedback(false);

    // Abrir modal de estatísticas após o feedback terminar (apenas no modo diário)
    if (!isInfiniteMode && gameOver) {
      setTimeout(() => {
        setShowStatistics(true);
      }, 300); // Pequeno delay para transição suave
    }
  };

  // Função para ativar feedback simplificado (modo infinito)
  const triggerSimpleFeedback = (attempts) => {
    // Só mostrar se for primeira tentativa
    if (attempts === 1) {
      playFirstTrySound();
      setShowSimpleFeedback(true);
      // Feedback visual especial para primeira tentativa no modo infinito
      if (inputRef.current) {
        gameFeel.onPerfect(inputRef.current);
      }
    } else {
      // Feedback visual para outros acertos no modo infinito
      if (inputRef.current) {
        gameFeel.onSuccess(inputRef.current, attempts);
      }
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
        // Silent error handling
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
        // Silent error handling
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
        // Silent error handling
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

      // Limpa o estado salvo já que foi restaurado, usando os valores do localStorage
      if (savedStats) {
        try {
          const stats = JSON.parse(savedStats);
          saveInfiniteStats(stats.currentStreak || 0, stats.bestRecord || 0, stats.usedSongs || [], null);
        } catch (error) {
          // Silent error handling
          saveInfiniteStats(infiniteStreak, infiniteBestRecord, infiniteUsedSongs, null);
        }
      } else {
        saveInfiniteStats(infiniteStreak, infiniteBestRecord, infiniteUsedSongs, null);
      }
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
        // 🕐 Iniciar timer real para conquistas de velocidade
        setGameStartTime(Date.now());
        // O tempo de início será configurado pelo handleLoadedMetadata normal
      } else {
        // Todas as músicas foram completadas
        setMessage(t('all_songs_completed'));
        setInfiniteGameOver(true);
      }
    }
  };

  // nextInfiniteSong será declarado após os estados

  const endInfiniteMode = () => {
    setInfiniteGameOver(true);
    setGameOver(true);

    // Salva o recorde final
    let finalBestRecord = infiniteBestRecord;
    if (infiniteStreak > infiniteBestRecord) {
      finalBestRecord = infiniteStreak;
      setInfiniteBestRecord(finalBestRecord);
    }

    // CORREÇÃO: Manter a sequência atual para mostrar no modal de estatísticas
    // Só resetar quando começar um novo jogo
    saveInfiniteStats(infiniteStreak, finalBestRecord, infiniteUsedSongs);

    // Mostra estatísticas diretamente
    setTimeout(() => {
      setShowStatistics(true);
    }, 500);
  };

  const resetInfiniteMode = () => {
    setInfiniteGameOver(false); // Fechar o modal primeiro
    // CORREÇÃO: Resetar a sequência aqui quando começar um novo jogo
    setInfiniteStreak(0);
    setInfiniteUsedSongs([]);
    saveInfiniteStats(0, infiniteBestRecord, []);
    startInfiniteMode();
  };

  // switchToDailyMode será declarado após os estados

  // 📅 FUNÇÃO PARA RASTREAR DIAS CONSECUTIVOS
  // Removida - agora é tratada pelo servidor via updateGameStats

  // Carregar estatísticas do modo infinito ao montar
  useEffect(() => {
    loadInfiniteStats();
  }, []);

  // 🏃 INICIALIZAR SESSÃO para conquista "Maratonista"
  useEffect(() => {
    // Inicializar timer de sessão apenas uma vez quando o componente monta
    if (!sessionStartTime) {
      const now = Date.now();
      setSessionStartTime(now);

      // Salvar no localStorage para persistir entre recarregamentos
      localStorage.setItem('ludomusic_session_start', now.toString());
    }

    // 👑 CARREGAR DERROTAS CONSECUTIVAS do localStorage
    try {
      const savedLosses = localStorage.getItem('ludomusic_consecutive_losses');
      if (savedLosses) {
        const losses = parseInt(savedLosses, 10);
        if (!isNaN(losses)) {
          setConsecutiveLosses(losses);
        }
      }
    } catch (error) {
      // Silent error handling
    }
  }, []);

  // 🏃 VERIFICAR CONQUISTA MARATONISTA periodicamente
  useEffect(() => {
    const checkMarathonAchievement = () => {
      if (!sessionStartTime || !updateGameStats) return;

      const currentTime = Date.now();
      const sessionDuration = (currentTime - sessionStartTime) / 1000; // em segundos
      const sessionHours = sessionDuration / 3600; // em horas

      // Se jogou por 5 horas ou mais, desbloquear conquista
      if (sessionHours >= 5) {
        // Simular um jogo para ativar o sistema de conquistas
        try {
          updateGameStats({
            won: true,
            attempts: 1,
            mode: 'marathon_session',
            song: { title: 'Sessão Maratona', game: 'Sistema', id: 'marathon' },
            playTime: Math.floor(sessionDuration),
            sessionDuration: sessionDuration
          });
        } catch (error) {
          // Silent error handling
        }
      }
    };

    // Verificar a cada 30 minutos (reduzido de 5 minutos)
    const interval = setInterval(checkMarathonAchievement, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime, updateGameStats]);

  // Carregar música do dia quando proxy estiver pronto (movido para depois dos estados)

  // Listener para abrir modal de doação
  useEffect(() => {
    const handleOpenDonationModal = () => {
      setShowDonationModal(true);
    };

    window.addEventListener('openDonationModal', handleOpenDonationModal);
    return () => window.removeEventListener('openDonationModal', handleOpenDonationModal);
  }, []);

  // Listener para abrir modal de bug report
  useEffect(() => {
    const handleOpenBugReport = () => {
      setShowBugReport(true);
    };

    window.addEventListener('openBugReport', handleOpenBugReport);
    window.openBugReport = handleOpenBugReport; // Função global
    return () => {
      window.removeEventListener('openBugReport', handleOpenBugReport);
      delete window.openBugReport;
    };
  }, []);

  // Função auxiliar para fazer chamadas autenticadas com retry
  const makeAuthenticatedRequest = async (url, options = {}) => {
    let sessionToken = localStorage.getItem('ludomusic_session_token');
    if (!sessionToken) {
      throw new Error('Token de sessão não encontrado');
    }

    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
        ...options.headers
      }
    };

    let response = await fetch(url, requestOptions);

    // Se recebeu 401, tentar renovar token uma vez
    if (response.status === 401) {
      try {
        const { renewToken } = useAuth();
        const renewResult = await renewToken();

        if (renewResult?.success) {
          // Atualizar token e tentar novamente
          sessionToken = localStorage.getItem('ludomusic_session_token');
          requestOptions.headers['Authorization'] = `Bearer ${sessionToken}`;
          response = await fetch(url, requestOptions);
        }
      } catch (renewError) {
        // Silent error handling
      }
    }

    return response;
  };

  // 🔒 Verificar jogo diário quando usuário faz login (baseado no estado de autenticação)
  useEffect(() => {
    const checkDailyGameAfterLogin = async () => {
      if (!isAuthenticated || isInfiniteMode) {
        return; // Só verificar se estiver autenticado e no modo diário (não infinito)
      }

      try {
        const sessionToken = localStorage.getItem('ludomusic_session_token');
        if (!sessionToken) {
          return;
        }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

        // Calcular dia do ano para verificações
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

        // 🔒 SEGURANÇA CRÍTICA: Verificar se há dados de jogo anônimo no localStorage
        const anonymousGameState = localStorage.getItem(`ludomusic_game_state_day_${dayOfYear}`);



        // TEMPORARIAMENTE DESABILITADO PARA DEBUG - SIMULAR SUCESSO
        const response = { ok: true, status: 200 };

        if (response.ok) {

          if (errorData.error === 'Jogo diário já completado hoje') {
            // Usuário já jogou hoje no servidor - carregar estado salvo
            try {
              const savedState = localStorage.getItem(`ludomusic_game_state_day_${dayOfYear}`);
              if (savedState) {
                const parsedState = JSON.parse(savedState);
                if (parsedState.day === dayOfYear && parsedState.gameOver) {
                  // Restaurar estado final
                  setAttempts(parsedState.attempts || 6);
                  setHistory(parsedState.history || []);
                  setMessage(parsedState.message || 'Você já jogou hoje!');
                  setGameOver(true);
                  setShowHint(true); // Mostrar resposta
                  setActiveHint(0);
                  setCurrentClipDuration(15); // Permitir ouvir música completa
                  setGameResult(parsedState.gameResult || { won: false, attempts: parsedState.attempts || 6 });

                  // Não mostrar estatísticas automaticamente ao carregar estado salvo
                  // O modal só deve aparecer após completar um jogo, não ao entrar no site
                }
              } else {
                // Se não há estado salvo, mostrar mensagem genérica
                setGameOver(true);
                setMessage('Você já jogou hoje! Volte amanhã para uma nova música.');
                setShowHint(true);
                setActiveHint(0);
                setCurrentClipDuration(15);
              }
            } catch (error) {
              // Fallback: mostrar que já jogou
              setGameOver(true);
              setMessage('Você já jogou hoje! Volte amanhã para uma nova música.');
              setShowHint(true);
            }
          }
        } else {
          // Usuário PODE jogar hoje no servidor
          // 🔒 VERIFICAÇÃO CRÍTICA: Se há dados anônimos no localStorage, LIMPAR
          if (anonymousGameState) {

            // Limpar todos os dados de jogo do localStorage para evitar conflitos
            localStorage.removeItem(`ludomusic_game_state_day_${dayOfYear}`);
            localStorage.removeItem('ludomusic_gameover_day');
            localStorage.removeItem('ludomusic_gameover_history');
            localStorage.removeItem('ludomusic_gameover_message');
            localStorage.removeItem('ludomusic_backup_state');

            // Resetar estado do jogo para permitir jogar
            setGameOver(false);
            setMessage('');
            setAttempts(0);
            setHistory([]);
            setShowHint(false);
            setActiveHint(0);
            setCurrentClipDuration(0.3);
            setGameResult(null);
            setShowStatistics(false);
          }
        }
      } catch (error) {
        // Silent error handling
      }
    };

    // Aguardar um pouco para garantir que o componente foi montado
    const timeoutId = setTimeout(checkDailyGameAfterLogin, 1000);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated]); // Executar quando autenticação mudar

  // Controle de anúncios removido

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
      }
    }
  }, []); // Remover dependência do isClient



  // Carregar música do dia ao montar
  useEffect(() => {
    if (songsToUse && songsToUse.length > 0 && !isDailyMusicLoaded && !isInfiniteMode) {
      console.log('🎵 [DEBUG] Iniciando carregamento inicial da música diária...');
      loadDailyMusic();
    }
  }, [songsToUse, isDailyMusicLoaded, isInfiniteMode, loadDailyMusic]);



  // Timer funcionando corretamente
  useEffect(() => {
    if (timer === null) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev > 1000) {
          return prev - 1000;
        } else {
          // Timer chegou a zero, recarregar página
          window.location.reload();
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);



  // Sistema robusto de configuração de áudio (igual ao multiplayer) - CORRIGIDO
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.audioUrl) return;

    const handleLoadedMetadata = () => {
      if (!audio || audio !== audioRef.current) return; // Verificação de segurança

      const duration = audio.duration || 0;

      // Verificar se a duração é válida (mínimo 30 segundos para garantir 15s de reprodução + 15s de margem)
      if (!duration || isNaN(duration) || duration < 30) {
        setAudioError(true);
        setMessage('Arquivo de áudio inválido ou muito curto (mínimo 30 segundos).');
        // Resetar estados de loading em caso de erro
        setIsPlayLoading(false);
        setPendingPlay(false);
        return;
      }

      setAudioDuration(duration);

      // Limpar TODOS os estados de loading quando metadata carrega
      setIsAudioLoading(false);
      setAudioLoadingMessage('');
      setAudioLoadError(false);
      setConnectionError(false);
      setAudioLoadRetries(0);
      // CORREÇÃO: Limpar também o estado do botão de play
      setIsPlayLoading(false);
      setIsPlayButtonDisabled(false);

      let startTimeToUse;

      try {
        if (isInfiniteMode) {
          // No modo infinito, gera um tempo aleatório garantindo que nunca toque os últimos 15 segundos
          startTimeToUse = Math.random() * Math.max(0, duration - 15);
        } else if (currentDay !== null) {
          // No modo normal, usa o sistema determinístico baseado no dia (sem localStorage)
          startTimeToUse = getDeterministicStartTime(duration, currentDay);
        } else {
          // Fallback para tempo aleatório garantindo que nunca toque os últimos 15 segundos
          startTimeToUse = Math.random() * Math.max(0, duration - 15);
        }

        // Garantir que o startTime é válido e nunca permita tocar os últimos 15 segundos
        startTimeToUse = Math.max(0, Math.min(startTimeToUse, duration - 15));

        setStartTime(startTimeToUse);

        // Verificação adicional antes de definir currentTime (igual ao multiplayer)
        if (audio === audioRef.current && !isNaN(startTimeToUse)) {
          audio.currentTime = startTimeToUse;
          setAudioProgress(0);
        }
      } catch (error) {
        // Fallback seguro garantindo que nunca toque os últimos 15 segundos
        const fallbackTime = Math.random() * Math.max(0, duration - 15);
        setStartTime(fallbackTime);
        if (audio === audioRef.current && !isNaN(fallbackTime)) {
          audio.currentTime = fallbackTime;
          setAudioProgress(0);
        }
      }

      // Aplicar configurações de som
      if (typeof window !== 'undefined') {
        try {
          const savedSettings = localStorage.getItem('bandle_settings');
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            audio.muted = !settings.sound;
          }
        } catch (error) {
          // Silent error handling
        }
      }

      // Limpa o estado de erro quando o áudio carrega com sucesso
      setAudioError(false);

      // Limpar qualquer mensagem de erro de áudio ou carregamento
      if (message && (
        message.includes('Erro ao carregar o áudio') ||
        message.includes('Erro ao reproduzir o áudio') ||
        message.includes('Formato de áudio não suportado') ||
        message.includes('Erro de rede') ||
        message.includes('Áudio ainda carregando, aguarde...')
      )) {
        setMessage('');
      }
      // Se o usuário clicou play enquanto carregava, já inicia a reprodução
      if (pendingPlay) {
        setPendingPlay(false);
        setTimeout(() => {
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
          }
          setIsPlayLoading(false);
        }, 0);
      }
    };

    const handleError = (e) => {
      if (!audio || audio !== audioRef.current) return; // Verificação de segurança

      console.error('❌ Erro no elemento audio:', {
        errorCode: e.target.error?.code,
        errorMessage: e.target.error?.message,
        src: e.target.src
      });

      setAudioError(true);
      setIsAudioLoading(false);
      setAudioLoadingMessage('');

      // Tratamento de erro mais específico
      const errorCode = e.target.error?.code;
      let errorMessage = 'Erro ao carregar o áudio.';

      if (errorCode === 4) {
        errorMessage = 'Formato de áudio não suportado neste navegador.';
      } else if (errorCode === 2) {
        errorMessage = 'Erro de rede ao carregar áudio. Verifique sua conexão.';
      } else if (errorCode === 3) {
        errorMessage = 'Áudio corrompido ou incompleto.';
      } else if (errorCode === 1) {
        errorMessage = 'Carregamento de áudio foi interrompido.';
      }

      setMessage(errorMessage);

      // Tentar recarregar automaticamente até 3 vezes com debounce (igual ao multiplayer)
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

    const handleCanPlay = () => {
      if (!audio || audio !== audioRef.current) return; // Verificação de segurança

      // Limpar TODOS os estados de loading quando áudio está pronto para tocar
      setIsAudioLoading(false);
      setAudioLoadingMessage('');
      setAudioLoadError(false);
      setConnectionError(false);
      setAudioLoadRetries(0);
      // CORREÇÃO: Garantir que o botão de play seja habilitado quando áudio está pronto
      setIsPlayLoading(false);
      setIsPlayButtonDisabled(false);

      // Limpar mensagem de carregamento quando áudio está pronto
      if (message && message.includes('Áudio ainda carregando, aguarde...')) {
        setMessage('');
      }
    };

    // Remover listeners existentes primeiro (igual ao multiplayer)
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    audio.removeEventListener('error', handleError);
    audio.removeEventListener('canplay', handleCanPlay);

    // Adicionar novos listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      // Cleanup mais robusto (igual ao multiplayer)
      if (audio) {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('canplay', handleCanPlay);
      }
    };
  }, [currentSong?.audioUrl, isInfiniteMode, currentDay, audioLoadRetries, pendingPlay, message]);

  // Controle de progresso do áudio - OTIMIZADO (igual ao multiplayer)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      // Verificações de segurança mais robustas (igual ao multiplayer)
      if (!audio || audio !== audioRef.current || startTime === null || startTime === undefined) return;

      try {
        const currentTime = Math.max(0, audio.currentTime - startTime);
        setAudioProgress(currentTime);

        // Verificar limites apenas se estiver tocando
        if (!audio.paused) {
          // Determinar duração máxima baseada no estado do jogo
          let maxDuration;
          if (gameOver && !isInfiniteMode) {
            // Quando o jogo terminou no modo diário, sempre permitir 15 segundos
            maxDuration = MAX_PLAY_TIME;
          } else if (gameOver && isInfiniteMode) {
            // Quando o modo infinito terminou (perdeu), também permitir 15 segundos
            maxDuration = MAX_PLAY_TIME;
          } else {
            // Durante o jogo, usar duração baseada nas tentativas
            maxDuration = maxClipDurations[attempts] || maxClipDurations[maxClipDurations.length - 1];
          }

          const shouldStop = currentTime >= maxDuration;

          // Fade out nos últimos 2 segundos quando limitado a 15s
          if ((gameOver && !isInfiniteMode) || (gameOver && isInfiniteMode && infiniteGameOver)) {
            if (currentTime >= 13 && currentTime < 15) {
              const fadeProgress = (15 - currentTime) / 2; // de 1 para 0
              audio.volume = Math.max(0, volume * fadeProgress);
            } else {
              audio.volume = volume;
            }
          } else {
            audio.volume = volume;
          }

          if (shouldStop) {
            // Para imediatamente e reseta
            audio.pause();
            setIsPlaying(false);
            if (!isNaN(startTime)) {
              audio.currentTime = startTime;
            }
            setAudioProgress(0);
            audio.volume = volume; // Restaura volume original
          }
        }
      } catch (error) {
        // Silent error handling
      }
    };

    const updatePlay = () => {
      if (audio === audioRef.current) {
        setIsPlaying(!audio.paused && !audio.ended);
      }
    };

    // Remover listeners existentes primeiro (igual ao multiplayer)
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
        // Garante que o volume volte ao normal ao desmontar (igual ao multiplayer)
        try {
          audio.volume = volume;
        } catch (error) {
          // Ignorar erros de volume
        }
      }
    };
  }, [startTime, gameOver, attempts, volume, isInfiniteMode, infiniteGameOver]);

  // Atualiza volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Configurar elemento audio quando criado (movido para depois dos estados)

  // Cleanup quando o componente desmonta
  useEffect(() => {
    return () => {

      // Limpar timeouts
      if (audioLoadTimeout) {
        clearTimeout(audioLoadTimeout);
      }

      // Cancelar promise de play pendente
      if (playPromiseRef) {
        try {
          playPromiseRef.catch(() => {}); // Silenciar erros da promise cancelada
        } catch (e) {}
      }

      // Parar e limpar áudio
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.src = '';
        } catch (error) {
          // Silent error handling
        }
      }
    };
  }, []);

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
      // Feedback de erro para campo vazio
      if (inputRef.current) {
        gameFeel.onError(inputRef.current);
      }
      return;
    }

    // Verifica se a música existe na lista
    const normalizedGuess = normalize(guess);
    let songExists;

    if (guess.includes(' - ')) {
      // Formato "Jogo - Título"
      const [gameGuess, titleGuess] = guess.split(' - ');
      songExists = songs.some(song =>
        normalize(song.game) === normalize(gameGuess) &&
        normalize(song.title) === normalize(titleGuess)
      );
    } else {
      // Formato tradicional - apenas título
      songExists = songs.some(song => normalize(song.title) === normalizedGuess);
    }

    if (!songExists) {
      setShowSelectFromListError(true); // só mostra após submit
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      // CORREÇÃO: Limpar erro automaticamente após 3 segundos
      setTimeout(() => setShowSelectFromListError(false), 3000);
      // Feedback de erro para música não encontrada
      if (inputRef.current) {
        gameFeel.onError(inputRef.current);
      }
      return;
    }

    setShowSelectFromListError(false); // limpa erro ao acertar
    submitGuess(guess);
  };

  // Função para detectar franquia de um jogo
  const detectFranchise = (gameName) => {
    const normalized = gameName.trim().toLowerCase();

    // Mapeamento de franquias conhecidas
    const franchiseMap = {
      // Mario franchise
      'mario': [
        'super mario', 'mario kart', 'mario party', 'mario paint', 'paper mario',
        'mario tennis', 'mario golf', 'mario strikers', 'mario baseball',
        'new super mario bros', 'super mario bros', 'mario vs donkey kong'
      ],
      // Zelda franchise
      'zelda': [
        'the legend of zelda', 'legend of zelda', 'zelda'
      ],
      // Sonic franchise
      'sonic': [
        'sonic the hedgehog', 'sonic', 'sonic adventure', 'sonic unleashed',
        'sonic generations', 'sonic forces', 'sonic mania', 'sonic colors'
      ],
      // Pokemon franchise
      'pokemon': [
        'pokemon', 'pokémon', 'pokémon black white', 'pokémon diamond/pearl', 'pokémon heartgold soulsilver', 'pokémon fire red leaf green', 'pokémon ruby sapphire', 'pokémon emerald', 'pokémon crystal', 'pokémon red blue', 'pokémon yellow', 'pokémon gold silver', 'pokémon x y', 'pokémon sun moon', 'pokémon sword shield', 'pokémon scarlet violet'
      ],
      // Final Fantasy franchise
      'final fantasy': [
        'final fantasy'
      ],
      // Assassin's Creed franchise
      'assassins creed': [
        "assassin's creed", 'assassins creed'
      ],
      // Call of Duty franchise
      'call of duty': [
        'call of duty'
      ],
      // Grand Theft Auto franchise
      'gta': [
        'grand theft auto', 'gta'
      ],
      // Dark Souls franchise
      'souls': [
        'dark souls', 'demon souls', 'bloodborne', 'elden ring', 'sekiro'
      ],
      // Metroid franchise
      'metroid': [
        'metroid', 'super metroid'
      ],
      // Donkey Kong franchise
      'donkey kong': [
        'donkey kong'
      ],
      // Street Fighter franchise
      'street fighter': [
        'street fighter'
      ],
      // Tekken franchise
      'tekken': [
        'tekken'
      ],
      // Mortal Kombat franchise
      'mortal kombat': [
        'mortal kombat'
      ]
    };

    // Procura por correspondências nas franquias
    for (const [franchise, patterns] of Object.entries(franchiseMap)) {
      for (const pattern of patterns) {
        if (normalized.includes(pattern)) {
          return franchise;
        }
      }
    }

    // Se não encontrou uma franquia específica, usa a primeira palavra significativa
    const words = normalized.split(' ').filter(word => word.length > 2);
    return words.length > 0 ? words[0] : normalized;
  };

  // Função para verificar o tipo de acerto
  const checkGuessType = (guess, currentSong) => {
    const normalizeString = (str) => str.trim().toLowerCase();

    // Verificar se o guess está no formato "Jogo - Título"
    let guessedSong;
    if (guess.includes(' - ')) {
      const [gameGuess, titleGuess] = guess.split(' - ');
      guessedSong = songsToUse.find(song =>
        normalizeString(song.game) === normalizeString(gameGuess) &&
        normalizeString(song.title) === normalizeString(titleGuess)
      );
    } else {
      // Formato tradicional - apenas título
      guessedSong = songsToUse.find(song => normalizeString(song.title) === normalizeString(guess));
    }

    // Procurar por título genérico em qualquer música da franquia
    const isGenericTitle = (title, internalTitle) => {
      const genericTitles = [
        'main title', 'main theme', 'title theme', 'opening theme', 'intro',
        'menu theme', 'title screen', 'main menu', 'theme song', 'opening',
        'title', 'theme', 'main', 'intro theme', 'title music'
      ];
      const normalizedTitle = normalizeString(title);
      const normalizedInternalTitle = internalTitle ? normalizeString(internalTitle) : '';

      return genericTitles.some(generic =>
        normalizedTitle === generic || normalizedTitle.includes(generic) ||
        normalizedInternalTitle.includes(generic)
      );
    };
    if (!guessedSong) {
      return { type: 'fail', subtype: 'not_found' };
    }

    // Verificar se acertou a música exata
    let isExactMatch = false;

    if (guess.includes(' - ')) {
      // Formato "Jogo - Título" - verificar se é exatamente a mesma música
      if (guessedSong && guessedSong.id === currentSong.id) {
        isExactMatch = true;
      }
    } else {
      // Formato tradicional - apenas título
      if (normalizeString(guess) === normalizeString(currentSong.title)) {
        // Só considera correto se o jogo também for o mesmo
        if (normalizeString(guessedSong.game) === normalizeString(currentSong.game)) {
          isExactMatch = true;
        }
      }
    }

    if (isExactMatch) {
      return { type: 'success', subtype: 'exact' };
    }

    // Se não é match exato, mas é mesmo título e jogo diferente
    if (!guess.includes(' - ') && normalizeString(guess) === normalizeString(currentSong.title)) {
      // Mesmo título, mas jogo diferente: franquia ou errado
      const currentFranchise = detectFranchise(currentSong.game);
      const guessedFranchise = detectFranchise(guessedSong.game);
      if (currentFranchise === guessedFranchise && currentFranchise.length > 2) {
        return { type: 'fail', subtype: 'same_franchise' };
      } else {
        return { type: 'fail', subtype: 'wrong' };
      }
    }

    const currentGameNormalized = normalizeString(currentSong.game);
    const guessedGameNormalized = normalizeString(guessedSong.game);
    const currentFranchise = detectFranchise(currentSong.game);
    const guessedFranchise = detectFranchise(guessedSong.game);

    // NOVO ajuste: se o título do palpite é genérico E a música atual também é genérica
    if (isGenericTitle(guess, currentSong.internalTitle) && isGenericTitle(currentSong.title, currentSong.internalTitle)) {
      const currentFranchise = detectFranchise(currentSong.game);
      const guessedFranchise = detectFranchise(guessedSong.game);

      if (currentFranchise === guessedFranchise && currentFranchise.length > 2) {
        // Verifica se o título genérico corresponde exatamente à música correta usando ID
        if (normalizeString(guess) === normalizeString(currentSong.title)) {
          // Verificar se é exatamente a mesma música usando ID
          if (guessedSong.id === currentSong.id) {
            return { type: 'success', subtype: 'generic_title_exact_match' };
          } else {
            return { type: 'fail', subtype: 'generic_title_wrong_song' };
          }
        } else {
          return { type: 'fail', subtype: 'generic_title_wrong_song' };
        }
      } else {
        return { type: 'fail', subtype: 'generic_title_wrong_franchise' };
      }
    }

    // Verificação para mesmo jogo (incluindo títulos genéricos)
    if (currentGameNormalized === guessedGameNormalized) {
      // Mesmo jogo, música diferente - AMARELO
      return { type: 'fail', subtype: 'same_game' };
    }

    // Verificar se são da mesma franquia usando a nova lógica
    if (currentFranchise === guessedFranchise && currentFranchise.length > 2) {
      // Mesma franquia, jogo diferente - LARANJA
      return { type: 'fail', subtype: 'same_franchise' };
    } else {
      // Completamente errado - VERMELHO
      return { type: 'fail', subtype: 'wrong' };
    }
  };

  const submitGuess = async (selectedGuess) => {
    // 🔒 VERIFICAÇÃO ADICIONAL DE SEGURANÇA: Verificar se usuário já jogou hoje
    if (!isInfiniteMode && isAuthenticated) {
      try {
        const sessionToken = localStorage.getItem('ludomusic_session_token');
        if (sessionToken) {
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

          const response = await fetch('/api/validate-daily-game', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
              date: dateStr,
              gameStats: {
                won: false,
                attempts: 0,
                mode: 'daily',
                song: { title: 'check_only', game: 'check_only', id: 'check_only' },
                playTime: 0
              }
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error === 'Jogo diário já completado hoje') {
              // Usuário já jogou hoje - bloquear tentativa
              setGameOver(true);
              setMessage('Você já jogou hoje! Volte amanhã para uma nova música.');
              setShowHint(true);
              setActiveHint(0);
              setCurrentClipDuration(15);
              return; // Sair da função sem processar o guess
            }
          }
        }
      } catch (error) {
        console.warn('Erro na validação do jogo diário:', error);
        // Em caso de erro de rede, permitir continuar (para não bloquear usuários offline)
      }
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setShowSuggestions(false);
    setGuess('');
    let result = null;

    const guessResult = checkGuessType(selectedGuess, currentSong);

    if (guessResult.type === 'success') {
      try {
        setMessage(t('congratulations'));
        result = { type: 'success', value: selectedGuess, subtype: guessResult.subtype };

        // 🎉 ATIVAR FEEDBACK BASEADO NO MODO
        if (isInfiniteMode) {
          // Modo infinito: feedback simplificado apenas para primeira tentativa
          triggerSimpleFeedback(newAttempts);
        } else {
          // Modo diário: feedback completo
          triggerSuccessFeedback(newAttempts, currentSong);
        }
      } catch (error) {
        console.error('Erro ao processar acerto da música:', error);
        // Reportar erro para o sistema de monitoramento
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'exception', {
            description: `Erro ao acertar música: ${error.message}`,
            fatal: false
          });
        }
        // Continuar com o processamento mesmo com erro no feedback
        setMessage(t('congratulations'));
        result = { type: 'success', value: selectedGuess, subtype: guessResult.subtype };
      }

      if (isInfiniteMode) {
        // No modo infinito, mostra botão para próxima música
        setGameOver(true);
        setShowNextSongButton(true);

        // Atualizar estatísticas do perfil para modo infinito
        if (updateGameStats) {
          try {
            // 🕐 Calcular tempo real de jogo para conquistas de velocidade
            const realPlayTime = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : Math.floor(audioProgress);

            // 👑 VERIFICAR CONQUISTA "REI DO COMEBACK"
            const isComeback = consecutiveLosses >= 5;
            if (isComeback) {
              console.log('👑 Conquista Rei do Comeback desbloqueada! Vitória após', consecutiveLosses, 'derrotas consecutivas');
            }

            updateGameStats({
              won: true,
              attempts: newAttempts,
              mode: 'infinite',
              song: currentSong,
              streak: infiniteStreak + 1,
              songsCompleted: 1,
              playTime: realPlayTime,
              isComeback: isComeback,
              consecutiveLosses: consecutiveLosses
            });

            // Resetar contador de derrotas consecutivas após vitória
            setConsecutiveLosses(0);
            localStorage.setItem('ludomusic_consecutive_losses', '0');
          } catch (error) {
            // Silent error handling
          }
        }
      } else {
        // No modo normal, termina o jogo
        setGameOver(true);
        const gameResultData = { won: true, attempts: newAttempts };
        setGameResult(gameResultData);

        // Atualizar estatísticas do perfil
        if (updateGameStats) {
          try {
            // 🕐 Calcular tempo real de jogo para conquistas de velocidade
            const realPlayTime = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : Math.floor(audioProgress);

            // 👑 VERIFICAR CONQUISTA "REI DO COMEBACK"
            const isComeback = consecutiveLosses >= 5;
            if (isComeback) {
              console.log('👑 Conquista Rei do Comeback desbloqueada! Vitória após', consecutiveLosses, 'derrotas consecutivas');
            }

            // 📅 RASTREAR DIAS CONSECUTIVOS para conquista "Dedicação Diária"
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            // updateConsecutiveDays será tratado pelo servidor via updateGameStats

            updateGameStats({
              won: true,
              attempts: newAttempts,
              mode: 'daily',
              song: currentSong,
              playTime: realPlayTime,
              isComeback: isComeback,
              consecutiveLosses: consecutiveLosses,
              dailyGameCompleted: true,
              gameDate: today
            });

            // Resetar contador de derrotas consecutivas após vitória
            setConsecutiveLosses(0);
            localStorage.setItem('ludomusic_consecutive_losses', '0');
          } catch (error) {
            // Silent error handling
          }
        }

        // Incrementar contador de jogos para anúncios
        setGamesPlayedCount(prev => prev + 1);
        // Estatísticas serão abertas após o feedback de sucesso terminar
      }
    } else if (newAttempts >= MAX_ATTEMPTS) {


      const gameOverMessage = currentSong
        ? `${t('game_over')} ${currentSong.game} - ${currentSong.title}`
        : `${t('game_over')} Música não identificada`;

      setMessage(gameOverMessage);
      result = { type: 'fail', value: selectedGuess, subtype: guessResult.subtype };

      if (isInfiniteMode) {
        // No modo infinito, termina a sequência
        // Atualizar estatísticas do perfil para fim do modo infinito
        if (updateGameStats) {
          try {
            // 🕐 Calcular tempo real de jogo para conquistas de velocidade
            const realPlayTime = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : Math.floor(audioProgress);

            // 👑 INCREMENTAR DERROTAS CONSECUTIVAS para conquista "Rei do Comeback"
            const newConsecutiveLosses = consecutiveLosses + 1;
            setConsecutiveLosses(newConsecutiveLosses);
            localStorage.setItem('ludomusic_consecutive_losses', newConsecutiveLosses.toString());
            console.log('👑 Derrotas consecutivas:', newConsecutiveLosses);

            updateGameStats({
              won: false,
              attempts: newAttempts,
              mode: 'infinite',
              song: currentSong,
              streak: infiniteStreak,
              songsCompleted: infiniteUsedSongs.length,
              playTime: realPlayTime,
              consecutiveLosses: newConsecutiveLosses
            });
          } catch (error) {
            // Silent error handling
          }
        }

        endInfiniteMode();
      } else {
        // No modo normal, termina o jogo
        setGameOver(true);
        const gameResultData = { won: false, attempts: newAttempts };
        setGameResult(gameResultData);

        // Atualizar estatísticas do perfil
        // 🕐 Calcular tempo real de jogo para conquistas de velocidade
        const realPlayTime = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : Math.floor(audioProgress);

        // 👑 INCREMENTAR DERROTAS CONSECUTIVAS para conquista "Rei do Comeback"
        const newConsecutiveLosses = consecutiveLosses + 1;
        setConsecutiveLosses(newConsecutiveLosses);
        localStorage.setItem('ludomusic_consecutive_losses', newConsecutiveLosses.toString());
        console.log('👑 Derrotas consecutivas:', newConsecutiveLosses);

        // 📅 RASTREAR DIAS CONSECUTIVOS para conquista "Dedicação Diária"
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        // updateConsecutiveDays será tratado pelo servidor via updateGameStats

        updateGameStats({
          won: false,
          attempts: newAttempts,
          mode: 'daily',
          song: currentSong,
          playTime: realPlayTime,
          consecutiveLosses: newConsecutiveLosses,
          dailyGameCompleted: true,
          gameDate: today
        });

        // Incrementar contador de jogos para anúncios
        setGamesPlayedCount(prev => prev + 1);
        setTimeout(() => setShowStatistics(true), 800);
      }
    } else {
      // Mensagens específicas baseadas no tipo de erro
      if (guessResult.subtype === 'same_game') {
        setMessage('Jogo correto! Tente adivinhar a música específica.');
      } else if (guessResult.subtype === 'same_franchise') {
        setMessage('Franquia correta! Mas é de outro jogo da série.');
      } else {
        setMessage(t('try_again'));
      }
      setShowHint(true);
      result = { type: 'fail', value: selectedGuess, subtype: guessResult.subtype };
    }
    setHistory(prev => [...prev, result]);
  };

  // Skip
  const handleSkip = async () => {
    if (gameOver || isSkipLoading) return;
    setIsSkipLoading(true);

    // 🔒 VERIFICAÇÃO ADICIONAL DE SEGURANÇA: Verificar se usuário já jogou hoje
    if (!isInfiniteMode && isAuthenticated) {
      try {
        const sessionToken = localStorage.getItem('ludomusic_session_token');
        if (sessionToken) {
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

          const response = await fetch('/api/validate-daily-game', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
              date: dateStr,
              gameStats: {
                won: false,
                attempts: 0,
                mode: 'daily',
                song: { title: 'check_only', game: 'check_only', id: 'check_only' },
                playTime: 0
              }
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error === 'Jogo diário já completado hoje') {
              // Usuário já jogou hoje - bloquear tentativa
              setGameOver(true);
              setMessage('Você já jogou hoje! Volte amanhã para uma nova música.');
              setShowHint(true);
              setActiveHint(0);
              setCurrentClipDuration(15);
              setIsSkipLoading(false);
              return; // Sair da função sem processar o skip
            }
          }
        }
      } catch (error) {
        // Em caso de erro de rede, permitir continuar (para não bloquear usuários offline)
      }
    }

    try {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShowHint(true);
      setHistory(prev => [...prev, { type: 'skipped' }]);
      setMessage(t('skipped'));

      if (newAttempts >= MAX_ATTEMPTS) {


        const gameOverMessage = currentSong
          ? `${t('game_over')} ${currentSong.game} - ${currentSong.title}`
          : `${t('game_over')} Música não identificada`;

        setMessage(gameOverMessage);
        if (isInfiniteMode) {
          endInfiniteMode();
        } else {
          setGameOver(true);
          const gameResultData = { won: false, attempts: newAttempts };
          setGameResult(gameResultData);

          // Atualizar estatísticas do perfil
          if (updateGameStats) {
            try {
              // 🕐 Calcular tempo real de jogo para conquistas de velocidade
              const realPlayTime = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : Math.floor(audioProgress);

              // 👑 INCREMENTAR DERROTAS CONSECUTIVAS para conquista "Rei do Comeback"
              const newConsecutiveLosses = consecutiveLosses + 1;
              setConsecutiveLosses(newConsecutiveLosses);
              localStorage.setItem('ludomusic_consecutive_losses', newConsecutiveLosses.toString());
              console.log('👑 Derrotas consecutivas:', newConsecutiveLosses);

              // 📅 RASTREAR DIAS CONSECUTIVOS para conquista "Dedicação Diária"
              const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
              // updateConsecutiveDays será tratado pelo servidor via updateGameStats

              updateGameStats({
                won: false,
                attempts: newAttempts,
                mode: 'daily',
                song: currentSong,
                playTime: realPlayTime,
                consecutiveLosses: newConsecutiveLosses,
                dailyGameCompleted: true,
                gameDate: today
              });
            } catch (error) {
              // Silent error handling
            }
          }

          // Incrementar contador de jogos para anúncios
          setGamesPlayedCount(prev => prev + 1);
          // Estatísticas serão abertas após o feedback de sucesso terminar (se houver)
        }
      }
    } finally {
      setTimeout(() => setIsSkipLoading(false), 100); // Garante atualização visual
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
    const previousValue = guess;

    setGuess(value);
    filterSuggestions(value);

    // CORREÇÃO: Limpar erro de seleção quando usuário começar a digitar
    if (showSelectFromListError && value !== previousValue) {
      setShowSelectFromListError(false);
    }

    // Feedback de digitação apenas quando há mudança real no valor
    if (value !== previousValue && value.length > previousValue.length) {
      gameFeel.onTyping();
    }

    // Força mostrar sugestões se for '?'
    if (value.trim() === '?') {
      setShowSuggestions(true);
    }
  };

  const handleInputFocus = () => {
    // CORREÇÃO: Limpar erro quando usuário foca no campo
    if (showSelectFromListError) {
      setShowSelectFromListError(false);
    }

    // Mostrar sugestões se já tem texto
    if (guess.trim()) {
      filterSuggestions(guess);
    } else {
      // Mostrar algumas sugestões aleatórias
      const randomSuggestions = songsToUse.slice(0, 6);
      setFilteredSuggestions(randomSuggestions);
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay para permitir clique em sugestão
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleSuggestionClick = (suggestion) => {
    // CORREÇÃO: Limpar erro quando usuário seleciona uma sugestão válida
    if (showSelectFromListError) {
      setShowSelectFromListError(false);
    }

    // Para músicas com nomes genéricos, usar formato "Jogo - Título"
    // Para músicas únicas, usar apenas o título
    const isGenericTitle = (title) => {
      const genericTitles = [
        'main title', 'main theme', 'title theme', 'opening theme', 'intro',
        'menu theme', 'title screen', 'main menu', 'theme song', 'opening',
        'title', 'theme', 'main', 'intro theme', 'title music', 'tower'
      ];
      const normalizedTitle = title.trim().toLowerCase();
      return genericTitles.some(generic =>
        normalizedTitle === generic || normalizedTitle.includes(generic)
      );
    };

    if (isGenericTitle(suggestion.title)) {
      // Para títulos genéricos, usar formato completo
      setGuess(`${suggestion.game} - ${suggestion.title}`);
    } else {
      // Para títulos únicos, usar apenas o título
      setGuess(suggestion.title);
    }
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
    // No modo infinito, não reseta o áudio quando activeHint muda (apenas quando startTime muda)
    if (audioRef.current && startTime !== undefined && !isInfiniteMode) {
      audioRef.current.currentTime = startTime;
      audioRef.current.pause();
      setAudioProgress(0);
      setIsPlaying(false);
    }
  }, [activeHint, startTime]);

  useEffect(() => {
    setActiveHint(attempts);
    // No modo infinito, não reseta o áudio quando faz um palpite (apenas quando startTime muda)
    if (audioRef.current && startTime !== undefined && !isInfiniteMode) {
      audioRef.current.currentTime = startTime;
      audioRef.current.pause();
      setAudioProgress(0);
      setIsPlaying(false);
    }
  }, [attempts, startTime]);



  // Limpa erros de áudio quando a música muda (movido para depois dos estados)

  // Funções que usam currentSong (movidas para depois dos estados)
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
      // 🕐 Iniciar timer real para conquistas de velocidade
      setGameStartTime(Date.now());
      // O tempo de início será configurado pelo handleLoadedMetadata normal
    } else {
      // Todas as músicas foram completadas
      setMessage(t('all_songs_completed'));
      setInfiniteGameOver(true);
    }
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

    // Carrega a música do dia usando a função centralizada
    console.log('🎵 [DEBUG] Voltando para modo diário...');
    setIsDailyMusicLoaded(false); // Resetar para permitir recarregamento
    loadDailyMusic(true); // Forçar reload

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
        // Silent error handling
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

      // 🕐 Iniciar timer real para conquistas de velocidade
      setGameStartTime(Date.now());
    };

    // Carrega o estado salvo
    loadSavedDailyGameState();
  };

  // Fallback para carregar música diária se não foi carregada ainda
  useEffect(() => {
    // Aguardar um pouco para garantir que tudo esteja inicializado
    const loadTimer = setTimeout(() => {
      if (songsToUse && songsToUse.length > 0 && !currentSong && !isInfiniteMode && !isDailyMusicLoaded) {
        console.log('🎵 [DEBUG] Fallback: carregando música diária...');
        loadDailyMusic();
      }
    }, 500); // Aguardar mais tempo para garantir que o carregamento principal tenha chance

    return () => clearTimeout(loadTimer);
  }, [songsToUse, currentSong, isInfiniteMode, isDailyMusicLoaded, loadDailyMusic]);

  // useEffect para configurar elemento audio (movido para depois dos estados)
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      // Configurar elemento com compatibilidade específica do navegador
      browserCompatibility.configureAudioElement(audio);

      // Cache temporariamente desabilitado
    }
  }, [currentSong?.audioUrl]);

  // useEffect para limpar erros de áudio (movido para depois dos estados)
  useEffect(() => {
    if (currentSong?.audioUrl) {
      // Reseta o estado de erro quando uma nova música é carregada
      setAudioError(false);
      setAudioLoadError(false);
      setAudioLoadRetries(0);
      setConnectionError(false);
      // CORREÇÃO: Limpar erro de seleção quando nova música carrega
      setShowSelectFromListError(false);

      // Limpar mensagens de erro de áudio específicas
      if (message && (
        message.includes('Erro ao carregar o áudio') ||
        message.includes('Erro ao reproduzir o áudio') ||
        message.includes('Formato de áudio não suportado') ||
        message.includes('Erro de rede') ||
        message.includes('Áudio ainda carregando') ||
        message.includes('Áudio corrompido') ||
        message.includes('Carregamento de áudio foi interrompido') ||
        message.includes('Erro desconhecido ao carregar áudio')
      )) {
        setMessage('');
      }

      // Sistema otimizado de carregamento de áudio (igual ao multiplayer)
      const audio = audioRef.current;
      if (audio && currentSong?.audioUrl) {
        try {
          audio.pause();
          setIsPlaying(false);
          setAudioProgress(0);
          setIsAudioLoading(true);
          setAudioLoadingMessage('Carregando música...');

          // Debounce reduzido para melhor responsividade (igual ao multiplayer)
          const loadTimeout = setTimeout(() => {
            if (audio === audioRef.current && currentSong?.audioUrl) {
              audio.load();
            }
          }, 100); // Reduzido de 300 para 100ms

          return () => clearTimeout(loadTimeout);
        } catch (error) {
          // Silent error handling
          setIsAudioLoading(false);
          setAudioLoadingMessage('');
        }
      }
    }
  }, [currentSong?.audioUrl]);

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
          // Silent warning
        }
      } catch (error) {
        // Silent error handling
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
          // Silent warning
        }
      } catch (error) {
        // Silent error handling
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
      try {
        const stateToSave = {
          day: currentDay,
          attempts: gameState.attempts,
          history: gameState.history,
          message: gameState.message,
          gameOver: gameState.gameOver,
          showHint: gameState.showHint,
          activeHint: gameState.activeHint,
          currentClipDuration: gameState.currentClipDuration,
          gameResult: gameState.gameResult, // Salvar gameResult também
          timestamp: Date.now()
        };

        const stateKey = `ludomusic_game_state_day_${currentDay}`;
        localStorage.setItem(stateKey, JSON.stringify(stateToSave));

        // Manter compatibilidade com o sistema antigo para jogos terminados
        if (gameState.gameOver) {
          localStorage.setItem('ludomusic_gameover_day', currentDay.toString());
          localStorage.setItem('ludomusic_gameover_history', JSON.stringify(gameState.history));
          localStorage.setItem('ludomusic_gameover_message', gameState.message);
        }
      } catch (error) {
        // Silent error handling
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

      // Backup adicional para dados críticos
      if (typeof window !== 'undefined') {
        try {
          const backupData = {
            day: currentDay,
            attempts,
            history,
            gameOver,
            timestamp: Date.now()
          };
          localStorage.setItem('ludomusic_backup_state', JSON.stringify(backupData));
        } catch (error) {
          // Silent error handling
        }
      }
    }
  }, [attempts, history, message, gameOver, showHint, activeHint, currentClipDuration, currentDay, hasLoadedSavedState]);

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
        'ludomusic_profile_tutorial_seen', // Tutorial do perfil visto
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
      // Silent error handling
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

              // Se o jogo estava terminado, definir o resultado
              if (parsedState.gameOver) {
                const won = parsedState.history && parsedState.history.some(h => h.correct);
                setGameResult({ won, attempts: parsedState.attempts || 0 });

                // Não mostrar estatísticas automaticamente ao carregar estado salvo
                // O modal só deve aparecer após completar um jogo, não ao entrar no site
              }

              return true; // Estado carregado com sucesso
            }
          }
        } catch (error) {
          // Limpar estado corrompido
          localStorage.removeItem(`ludomusic_game_state_day_${currentDay}`);
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
          if (savedHistory) {
            const history = JSON.parse(savedHistory);
            setHistory(history);

            // Definir gameResult baseado no histórico
            const won = history && history.some(h => h.correct);
            setGameResult({ won, attempts: history.length || 6 });
          }
          const savedMessage = localStorage.getItem('ludomusic_gameover_message');
          if (savedMessage) setMessage(savedMessage);

          // Não mostrar estatísticas automaticamente para sistema antigo
          // O modal só deve aparecer após completar um jogo, não ao entrar no site
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
        // Erro ao aplicar configurações
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
        // Silent error handling
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
        <title>LudoMusic - Adivinhe a Música dos Seus Jogos Favoritos!</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="Teste seus conhecimentos musicais dos videogames! Ouça trechos de músicas de jogos famosos e adivinhe o nome. Jogue sozinho ou com amigos no modo multiplayer. Mais de 1000 músicas de games clássicos e modernos." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://ludomusic.xyz" />
      </Head>



      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div className={styles.darkBg} style={{ flex: 1, display: 'flex', flexDirection: 'column' }} data-bis_skin_checked="1">
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
            <div className={styles.headerButtons}>
              <DonationButton />
              <NotificationCenter />
              <button
                className={styles.helpButton}
                onClick={() => setShowPlayersRanking(true)}
                aria-label="Ranking"
              >
                <FaTrophy size={24} />
              </button>
              <button
                className={styles.helpButton}
                onClick={() => setShowProfile(true)}
                aria-label="Perfil"
              >
                <FaUser size={24} />
              </button>
              <button
                className={styles.helpButton}
                onClick={() => setShowFriends(true)}
                aria-label="Amigos"
              >
                <FaUsers size={24} />
              </button>
              <button
                className={styles.helpButton}
                onClick={() => setShowInstructions(true)}
                aria-label="Ajuda"
              >
                <FaQuestionCircle size={24} />
              </button>
            </div>
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
                    <span className={styles.legendCorrect} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>✅</span>
                      <span>Verde</span>
                    </span> = Acertou a música
                  </div>
                  <div className={styles.legendItem}>
                    <span style={{ color: '#ffd700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>🎮</span>
                      <span>Amarelo</span>
                    </span> = Franquia certa e jogo certo, mas música errada
                  </div>
                  <div className={styles.legendItem}>
                    <span style={{ color: '#ff9800', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>🔶</span>
                      <span>Laranja</span>
                    </span> = Franquia certa, mas jogo errado
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendIncorrect} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>❌</span>
                      <span>Vermelho</span>
                    </span> = Completamente errado
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
                  max={gameOver ? MAX_PLAY_TIME : (maxClipDurations[attempts] || maxClipDurations[maxClipDurations.length - 1])}
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
                    const maxAllowed = gameOver ? MAX_PLAY_TIME : (maxClipDurations[attempts] || maxClipDurations[maxClipDurations.length - 1]);
                    if (value > maxAllowed) value = maxAllowed;
                    if (audioRef.current) {
                      audioRef.current.currentTime = startTime + value;
                      setAudioProgress(value);
                    }
                  }}
                  className={styles.audioSeekbarCustom}
                  disabled={audioError || !audioDuration} />
                <span className={styles.audioTime} style={{ marginLeft: 10 }}>
                  {audioDuration
                    ? new Date(
                        (gameOver ? MAX_PLAY_TIME : (maxClipDurations[attempts] ?? maxClipDurations[maxClipDurations.length - 1])) * 1000
                      ).toISOString().substring(14, 19)
                    : '00:00'}
                </span>
              </div>
              <div className={styles.audioVolumeRow}>
                <MemoizedPlayButton
                  isPlaying={isPlaying}
                  isLoading={isPlayLoading}
                  disabled={audioError || (!audioDuration && !currentSong?.audioUrl) || isPlayButtonDisabled}
                  className={styles.audioPlayBtnCustom}
                  instantFeedback={true}
                  scaleOnClick={true}
                  showSpinner={true}
                  debounceMs={25} // Reduzido para melhor responsividade
                  onClick={debounce(async () => {
                    if (!currentSong?.audioUrl || isPlayButtonDisabled || audioError) {
                      return;
                    }

                    if (!audioRef.current) {
                      return;
                    }

                    // Definir loading imediatamente para feedback visual
                    setIsPlayLoading(true);

                    // Timeout de segurança mais curto para melhor responsividade
                    const safetyTimeout = setTimeout(() => {
                      setIsPlayLoading(false);
                      setIsPlayButtonDisabled(false);
                    }, 500); // Reduzido para 500ms para melhor UX

                    try {
                      // Se áudio não carregou ainda, mostrar mensagem e aguardar carregamento
                      if (!audioDuration && currentSong?.audioUrl) {
                        setMessage('Áudio ainda carregando, aguarde...');
                        // Usar uma referência mais robusta para limpar a mensagem
                        const loadingMessage = 'Áudio ainda carregando, aguarde...';
                        setTimeout(() => {
                          setMessage(prevMessage => {
                            if (prevMessage === loadingMessage) {
                              return '';
                            }
                            return prevMessage;
                          });
                        }, 2000);
                        setPendingPlay(true);
                        audioRef.current.load();
                        return;
                      }

                      // Fallback para método tradicional - verificar se áudio está pronto
                      if (!audioRef.current || !audioRef.current.duration) {
                        setMessage('Áudio ainda carregando, aguarde...');
                        // Usar uma referência mais robusta para limpar a mensagem
                        const loadingMessage = 'Áudio ainda carregando, aguarde...';
                        setTimeout(() => {
                          setMessage(prevMessage => {
                            if (prevMessage === loadingMessage) {
                              return '';
                            }
                            return prevMessage;
                          });
                        }, 2000);
                        return;
                      }

                      if (startTime === null || startTime === undefined) {
                        return;
                      }

                      const currentTime = audioRef.current.currentTime - startTime;
                      const maxAllowed = (gameOver && !isInfiniteMode) || (gameOver && isInfiniteMode && infiniteGameOver) ? MAX_PLAY_TIME : (maxClipDurations[attempts] || maxClipDurations[maxClipDurations.length - 1]);

                      if (isPlaying) {
                        // Pausar - ação instantânea
                        audioRef.current.pause();
                        setIsPlaying(false);
                        setIsPlayLoading(false);
                        clearTimeout(safetyTimeout);
                        return;
                      } else {
                        // Reproduzir
                        if (currentTime >= maxAllowed || currentTime < 0 || audioRef.current.currentTime < startTime) {
                          audioRef.current.currentTime = startTime;
                          setAudioProgress(0);
                        }

                        if (audioRef.current.paused) {
                          // Usar método instantâneo se áudio está pronto (igual ao multiplayer)
                          if (audioRef.current.readyState >= 2) {
                            await browserCompatibility.playAudioInstant(audioRef.current);
                            // CORREÇÃO: Limpar loading imediatamente após reprodução instantânea
                            setIsPlayLoading(false);
                            setIsPlayButtonDisabled(false);
                          } else {
                            // Se não está pronto, mostrar loading
                            setIsAudioLoading(true);
                            setAudioLoadingMessage('Carregando música...');
                            await browserCompatibility.playAudio(audioRef.current);
                            // CORREÇÃO: Limpar loading após reprodução normal
                            setIsPlayLoading(false);
                            setIsPlayButtonDisabled(false);
                          }
                        }
                      }

                      // CORREÇÃO: Garantir que todos os estados sejam limpos após sucesso
                      clearTimeout(safetyTimeout);
                      setIsPlayLoading(false);
                      setIsPlayButtonDisabled(false);
                      setIsAudioLoading(false);
                      setAudioLoadingMessage('');

                    } catch (error) {
                      clearTimeout(safetyTimeout);
                      setIsPlayLoading(false);
                      setIsPlayButtonDisabled(false);

                      // Ignorar erros de abort (usuário cancelou)
                      if (error.name === 'AbortError') {
                        return;
                      }

                      // Ignorar erros de interação (usuário precisa interagir primeiro)
                      if (error.name === 'NotAllowedError') {
                        setMessage('Clique em qualquer lugar da página para habilitar o áudio.');
                        return;
                      }

                      // Só mostrar erro se for um erro real de reprodução
                      if (error.message && error.message.includes('não suportado')) {
                        setAudioError(true);
                        setMessage('Formato de áudio não suportado.');
                      } else if (error.message && error.message.includes('network')) {
                        setMessage('Erro de rede. Verifique sua conexão.');
                      } else {
                        // Log do erro para debug, mas não mostrar mensagem genérica
                        console.warn('Erro de reprodução (silenciado):', error);
                      }
                    }
                  }, 25, 'play_button')} // Reduzido para 25ms para melhor responsividade
                />
                <MemoizedVolumeControl
                  volume={volume}
                  onChange={throttle(e => setVolume(Number(e.target.value)), 50, 'volume')}
                  disabled={audioError}
                  className={styles.audioVolumeCustom}
                />
              </div>
              <audio
                ref={audioRef}
                src={currentSong?.audioUrl}
                preload="auto"
                crossOrigin={currentSong?.audioUrl?.includes('/api/audio-proxy') ? undefined : 'anonymous'}
                style={{ display: 'none' }}
                onEnded={handleAudioEnded}
              />
            </div>

            {/* Indicador de carregamento de áudio (igual ao multiplayer) */}
            {isAudioLoading && audioLoadingMessage && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15), rgba(30, 215, 96, 0.15))',
                border: '2px solid #1db954',
                borderRadius: '8px',
                padding: '12px',
                margin: '10px 0',
                textAlign: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ color: '#1db954', fontWeight: 'bold', marginBottom: '5px' }}>
                  🎵 {audioLoadingMessage}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  Aguarde um momento...
                </div>
              </div>
            )}

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

          </div>

          {/* Estatísticas Globais apenas no modo diário - OCULTAR durante feedback de sucesso */}
          {!isInfiniteMode && !showSuccessFeedback && <GlobalStats showInDailyMode={true} />}

          <div className={styles.attemptsRow}>
            {[...Array(MAX_ATTEMPTS)].map((_, idx) => {
              let buttonClass = styles.attemptInactive;
              let tooltip = '';

              if (history[idx]) {
                // Se há histórico para esta tentativa, usar a cor baseada no resultado
                if (history[idx].type === 'success') {
                  buttonClass = styles.attemptSuccess;
                  tooltip = `Tentativa ${idx + 1}: ✅ ${history[idx].value}`;
                } else if (history[idx].type === 'fail') {
                  if (history[idx].subtype === 'same_game') {
                    buttonClass = styles.attemptGame;
                    tooltip = `Tentativa ${idx + 1}: 🎮 ${history[idx].value} (jogo correto)`;
                  } else if (history[idx].subtype === 'same_franchise') {
                    buttonClass = styles.attemptFranchise;
                    tooltip = `Tentativa ${idx + 1}: 🔶 ${history[idx].value} (franquia correta)`;
                  } else {
                    buttonClass = styles.attemptFail;
                    tooltip = `Tentativa ${idx + 1}: ❌ ${history[idx].value}`;
                  }
                } else if (history[idx].type === 'skipped') {
                  buttonClass = styles.attemptFail;
                  tooltip = `Tentativa ${idx + 1}: ⏭️ Pulou`;
                }
              } else if (idx > attempts) {
                // Tentativas futuras (ainda não disponíveis) - cinza inativo
                buttonClass = styles.attemptInactive;
                tooltip = '';
              } else {
                // CORREÇÃO: Tentativas disponíveis (sem histórico ainda) - devem ficar disponíveis mas não verdes
                // Verde só quando acerta a música (styles.attemptSuccess)
                buttonClass = styles.attemptAvailable;
                tooltip = `Clique para ver a dica da tentativa ${idx + 1}`;
              }



              return (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.attemptButton} ${buttonClass} ${activeHint === idx ? styles.attemptActive : ''}`}
                  onClick={() => {
                    if (idx <= attempts) {
                      setActiveHint(idx);
                      gameFeel.onHover(); // Feedback adicional
                    }
                  }}
                  title={tooltip}
                  disabled={idx > attempts}
                >
                  {idx + 1}
                </button>
              );
            })}

            <EnhancedButton
              variant="secondary"
              size="medium"
              showOverlay={false} // Desabilitar overlay problemático
              onClick={(e) => {
                if (!isSkipLoading && !gameOver && !audioError && attempts < MAX_ATTEMPTS) {
                  // CORREÇÃO: Garantir que o efeito seja aplicado ao botão, não ao ícone
                  const buttonElement = e.currentTarget; // currentTarget sempre é o botão
                  gameFeel.onSkip(buttonElement);
                  handleSkip();
                }
              }}
              disabled={gameOver || audioError || attempts >= MAX_ATTEMPTS || isSkipLoading}
              loading={isSkipLoading}
              className={styles.skipButton}
              style={{
                // Forçar reset de transform quando loading
                transform: isSkipLoading ? 'none' : undefined
              }}
            >
              {isClient ? t('skip') : 'Skip'} <FaFastForward style={{ marginLeft: 4, fontSize: '1em', verticalAlign: 'middle' }} />
            </EnhancedButton>
          </div>
          <form onSubmit={handleGuess} className={styles.guessFormModern} autoComplete="off">
            <div className={styles.inputContainer}>
              <EnhancedInput
                ref={inputRef}
                value={guess}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={isClient ? t('song_input_placeholder') : 'Digite o nome da música...'}
                disabled={gameOver || audioError}
                error={showSelectFromListError}
                className={styles.guessInputModern}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <MemoizedSuggestions
                  suggestions={filteredSuggestions}
                  onSuggestionClick={handleSuggestionClick}
                  showEasterEgg={guess.trim() === '?'}
                  onEasterEggClick={triggerSacabambapis}
                  styles={styles}
                />
              )}
            </div>

            <InputButton
              type="submit"
              disabled={gameOver || audioError || !guess.trim()}
              isShaking={isShaking}
              onClick={(e) => {
                // CORREÇÃO: Usar currentTarget para garantir que o efeito seja aplicado ao botão
                const buttonElement = e.currentTarget;
                if (!gameOver && !audioError && guess.trim()) {
                  gameFeel.onClick(buttonElement, e);
                } else {
                  gameFeel.onError(buttonElement);
                }
              }}
            >
              {isClient ? t('guess') : 'Adivinhar'}
            </InputButton>

            {showSelectFromListError && (
              <div className={styles.messageModern + ' ' + styles.error}>
                {t('select_from_list')}
              </div>
            )}
          </form>
          <div className={styles.historyBox}>
            {history.map((item, idx) => {
              return (
                <div key={`history-${idx}-${item.type || 'unknown'}`} className={styles.historyItem}>
                  {item?.type === 'skipped' && <span className={styles.historySkipped}>❌ Pulou!</span>}
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
              <EnhancedButton
                variant="primary"
                size="large"
                onClick={(e) => {
                  // CORREÇÃO: Usar currentTarget para garantir que o efeito seja aplicado ao botão
                  gameFeel.onSuccess(e.currentTarget);
                  nextInfiniteSong();
                }}
                className={styles.nextSongButton}
              >
                {isClient ? t('next_song') : 'Próxima Música'}
                <FaFastForward style={{ marginLeft: 8, fontSize: '1em' }} />
              </EnhancedButton>
            </div>
          )}

          {/* Botão Jogar Novamente quando modo infinito termina */}
          {isInfiniteMode && infiniteGameOver && !showNextSongButton && (
            <div className={styles.nextSongContainer}>
              <EnhancedButton
                variant="success"
                size="large"
                onClick={(e) => {
                  // CORREÇÃO: Usar currentTarget para garantir que o efeito seja aplicado ao botão
                  gameFeel.onNotification(e.currentTarget);
                  resetInfiniteMode();
                }}
                className={styles.playAgainButton}
              >
                🎮 {isClient ? t('play_again_infinite') : 'Jogar Novamente'}
              </EnhancedButton>
            </div>
          )}

          {!isInfiniteMode && (
            <div className={styles.timerBox}>
              Novo jogo em: <span className={styles.timer}>{formatTimer(timer)}</span>
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
          onClose={() => {
            setShowStatistics(false);
            // CORREÇÃO: Não resetar a sequência aqui - deixar para quando começar um novo jogo
            // O modal deve mostrar a sequência atual corretamente
          }}
          gameResult={gameResult}
          isInfiniteMode={isInfiniteMode}
          currentSong={currentSong}
          infiniteCurrentStreak={isInfiniteMode ? infiniteStreak : null}
        />

        {/* Tutorial de boas-vindas */}
        <Tutorial
          isOpen={showTutorial}
          onClose={handleCloseTutorial}
          onStartPlaying={handleStartPlaying}
        />

        {/* Perfil do usuário */}
        {showProfile && (
          <UserProfile
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
          />
        )}

        {/* Novo sistema de amigos */}
        <SimpleFriendsModal
          isOpen={showFriends}
          onClose={() => setShowFriends(false)}
          onViewProfile={(userId) => {
            setSelectedUserId(userId);
            setShowUserProfileViewer(true);
            setShowFriends(false);
          }}
        />

        {/* Visualizador de perfil de usuário */}
        <UserProfileViewer
          isOpen={showUserProfileViewer}
          onClose={() => {
            setShowUserProfileViewer(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
        />

        {/* Ranking de jogadores */}
        <PlayersRanking
          isOpen={showPlayersRanking}
          onClose={() => setShowPlayersRanking(false)}
          onViewProfile={(userId) => {
            setSelectedUserId(userId);
            setShowUserProfileViewer(true);
            setShowPlayersRanking(false);
          }}
        />

        {/* Componentes de monetização removidos */}

        </div>

        {/* Anúncios removidos */}
        <Footer />

        {/* Sistema de notificações */}
        <AchievementNotification />

        {/* Anúncios customizados do admin */}
        <CustomAnnouncement />

        {/* Feedback de sucesso completo (modo diário) */}
        <SuccessFeedback
          isVisible={showSuccessFeedback}
          onComplete={handleSuccessFeedbackComplete}
          type={successFeedbackType}
          attempts={successFeedbackData.attempts}
          songTitle={successFeedbackData.songTitle}
          gameTitle={successFeedbackData.gameTitle}
        />

        {/* Feedback simplificado (modo infinito) */}
        <SimpleSuccessFeedback
          isVisible={showSimpleFeedback}
          onComplete={() => setShowSimpleFeedback(false)}
          message="🎯 PRIMEIRA TENTATIVA!"
        />

        {/* Aviso de compatibilidade do navegador */}
        <BrowserCompatibilityWarning />

        {/* Modal de relatório de bug */}
        <BugReportModal
          isOpen={showBugReport}
          onClose={() => setShowBugReport(false)}
          currentSong={currentSong}
        />

      </div>

      {/* Scripts de anúncios removidos */}

      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'GA_MEASUREMENT_ID');
        `}
      </Script>
    </>
  );
};