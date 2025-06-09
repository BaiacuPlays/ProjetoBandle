import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import AdSuppressor from '../components/AdSuppressor';
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

import BrowserCompatibilityWarning from '../components/BrowserCompatibilityWarning';
import BugReportModal from '../components/BugReportModal';

import { useLanguage } from '../contexts/LanguageContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchTimezone } from '../config/api';
import { browserCompatibility } from '../utils/browserCompatibility';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { optimizedDebounce, optimizedThrottle } from '../utils/performanceOptimizer';
// Imports dinâmicos para evitar problemas de SSR
// import { audioCache } from '../utils/audioCache';
// import { useAudioPreloader } from '../hooks/useAudioPreloader';
// import { useAudioProxy } from '../utils/audioProxy';
import { simpleAudioProxy } from '../utils/simpleAudioProxy';
// Hooks removidos para melhor performance
import {
  MemoizedPlayButton,
  MemoizedVolumeControl
} from '../components/MemoizedComponents';

// Componentes de monetização
import DonationButton from '../components/DonationButton';
import { HeaderAd, BetweenGamesAd, SimpleInterstitialAd } from '../components/AdBanner';

const MAX_ATTEMPTS = 6;


export default function Home() {
  const { t, isClient } = useLanguage();
  const { isAuthenticated } = useAuth();

  // Hook do perfil com verificação de segurança
  let updateGameStats = () => {};
  try {
    const userProfile = useUserProfile();
    if (userProfile?.updateGameStats) {
      updateGameStats = userProfile.updateGameStats;
    }
  } catch (error) {
    // UserProfile context not available - silent fallback
  }

  // Hooks
  useServiceWorker(); // Registrar service worker sem usar a variável

  // Verificação básica das músicas (sem logs detalhados)
  useEffect(() => {
    if (!songs || songs.length === 0) {
      console.error('❌ Erro: Lista de músicas não carregada');
    } else {
      console.log('✅ Músicas carregadas:', songs.length);
    }
  }, []);

  // Usar músicas diretamente (teste simples)
  const songsToUse = songs || [];



  // Cache de áudio temporariamente desabilitado

  // Sistema de cache simplificado para correção
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Cache simplificado sem imports dinâmicos
      console.log('Sistema de cache simplificado carregado');
    }
  }, []);

  // Funções de performance ULTRA-OTIMIZADAS
  const debounce = useCallback((func, delay) => {
    return optimizedDebounce(func, delay);
  }, []);

  const throttle = useCallback((func, delay) => {
    return optimizedThrottle(func, delay);
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

  // Estados de monetização
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [gamesPlayedCount, setGamesPlayedCount] = useState(0);

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
    // Deixa uma margem de 10 segundos no final da música
    const maxStart = Math.max(0, duration - 10);

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



    return selectedSong;
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
    // Verificar se as músicas processadas pelo proxy estão disponíveis
    if (!songsToUse || songsToUse.length === 0) {
      console.warn('⏳ Aguardando músicas processadas pelo proxy para modo infinito...');
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

    // Reseta a sequência atual mas mantém as músicas usadas
    setInfiniteStreak(0); // Atualiza o estado local também
    saveInfiniteStats(0, finalBestRecord, infiniteUsedSongs);

    // Mostra estatísticas diretamente
    setTimeout(() => {
      setShowStatistics(true);
    }, 500);
  };

  const resetInfiniteMode = () => {
    setInfiniteGameOver(false); // Fechar o modal primeiro
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

      console.log('🏃 Sessão iniciada para conquista Maratonista');
    }

    // 👑 CARREGAR DERROTAS CONSECUTIVAS do localStorage
    try {
      const savedLosses = localStorage.getItem('ludomusic_consecutive_losses');
      if (savedLosses) {
        const losses = parseInt(savedLosses, 10);
        if (!isNaN(losses)) {
          setConsecutiveLosses(losses);
          console.log('👑 Derrotas consecutivas carregadas:', losses);
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar derrotas consecutivas:', error);
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
        console.log('🏃 Conquista Maratonista desbloqueada! Sessão de', sessionHours.toFixed(2), 'horas');

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
          console.warn('Erro ao registrar conquista maratonista:', error);
        }
      }
    };

    // Verificar a cada 5 minutos
    const interval = setInterval(checkMarathonAchievement, 5 * 60 * 1000);

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
      console.log('🔄 Token expirado, tentando renovar...');
      try {
        const { renewToken } = useAuth();
        const renewResult = await renewToken();

        if (renewResult?.success) {
          console.log('✅ Token renovado com sucesso');
          // Atualizar token e tentar novamente
          sessionToken = localStorage.getItem('ludomusic_session_token');
          requestOptions.headers['Authorization'] = `Bearer ${sessionToken}`;
          response = await fetch(url, requestOptions);
        } else {
          console.log('❌ Falha na renovação do token');
        }
      } catch (renewError) {
        console.log('❌ Erro ao renovar token:', renewError);
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

        console.log('🔍 Verificação do jogo diário temporariamente desabilitada para debug');

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
            console.log('🧹 LIMPEZA: Removendo dados de jogo anônimo ao fazer login');

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

  // Controle de anúncios intersticiais
  useEffect(() => {
    // Mostrar anúncio intersticial a cada 5 jogos
    if (gamesPlayedCount > 0 && gamesPlayedCount % 5 === 0) {
      setShowInterstitialAd(true);
    }
  }, [gamesPlayedCount]);

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



  // Carregar música do minuto ao montar
  useEffect(() => {
    const loadMusicOfTheDay = async () => {
      setIsLoading(true);

      // Chave para salvar o dia atual
      const savedDayKey = 'ludomusic_current_day';

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

      // Verificar se o dia mudou desde a última visita (para futuras funcionalidades)

      // Salvar o dia atual
      localStorage.setItem(savedDayKey, dayOfYear.toString());
      setCurrentDay(dayOfYear);

      // 🔒 VERIFICAÇÃO DE JOGO DIÁRIO - Simplificada para evitar travamento
      const checkDailyGameStatus = async () => {
        try {
          // Verificação simplificada apenas no localStorage
          const savedState = localStorage.getItem(`ludomusic_game_state_day_${dayOfYear}`);

          if (savedState) {
            const parsedState = JSON.parse(savedState);
            return parsedState.day === dayOfYear && parsedState.gameOver;
          }

          return false; // Pode jogar
        } catch (error) {
          console.log('Erro na verificação do status:', error);
          return false; // Em caso de erro, permitir jogar
        }
      };

      const hasPlayedToday = await checkDailyGameStatus();

      // --- OVERRIDE ESPECIAL PARA 28/05/2025 ---
      // Se a data for 28/05/2025, força a música 'Crowdfunding Single'
      let song;
      if (
        now.getFullYear() === 2025 &&
        now.getMonth() === 4 && // Maio é mês 4 (zero-based)
        now.getDate() === 28
      ) {
        song = songsToUse.find(s => s.title === 'Crowdfunding Single');
      } else {
        // SISTEMA DETERMINÍSTICO: A música é sempre a mesma para o mesmo dia
        // Gera música determinística baseada APENAS no dia (sem localStorage)
        song = getDeterministicSongSimple(dayOfYear);
      }

      // Verificar se song existe antes de usar
      if (!song) {
        console.error('❌ Música não encontrada para o dia:', dayOfYear);
        setIsLoading(false);
        return;
      }

      // Processar URL através do proxy para resolver CORS
      const songWithProxyUrl = {
        ...song,
        audioUrl: song?.audioUrl ? simpleAudioProxy.getAudioUrl(song.audioUrl) : ''
      };

      setCurrentSong(songWithProxyUrl);

      // 🔒 Se usuário já jogou hoje, carregar estado final do jogo
      if (hasPlayedToday) {
        // Carregar estado salvo do localStorage
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
            // Se não há estado salvo mas já jogou, bloquear mesmo assim
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
          setActiveHint(0);
          setCurrentClipDuration(15);
        }
      }

      // Calcular tempo até a próxima meia-noite
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      setTimer(nextMidnight - now);
      setIsLoading(false);
    };
    loadMusicOfTheDay();
  }, []); // Remover dependência do isClient

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

  // Atualiza duração do áudio ao carregar
  const handleLoadedMetadata = () => {
    if (!audioRef.current || !currentSong) return;



    const duration = audioRef.current.duration || 0;

    // Verificar se a duração é válida
    if (!duration || isNaN(duration) || duration < 10) {
      setAudioError(true);
      setMessage('Arquivo de áudio inválido ou muito curto.');
      // Resetar estados de loading em caso de erro
      setIsPlayLoading(false);
      setPendingPlay(false);
      return;
    }

    setAudioDuration(duration);

    let startTimeToUse;

    try {
      if (isInfiniteMode) {
        // No modo infinito, gera um tempo aleatório
        startTimeToUse = Math.random() * Math.max(0, duration - 10);
      } else if (currentDay !== null) {
        // No modo normal, usa o sistema determinístico baseado no dia (sem localStorage)
        startTimeToUse = getDeterministicStartTime(duration, currentDay);
      } else {
        // Fallback para tempo aleatório
        startTimeToUse = Math.random() * Math.max(0, duration - 10);
      }

      // Garantir que o startTime é válido
      startTimeToUse = Math.max(0, Math.min(startTimeToUse, duration - 10));

      setStartTime(startTimeToUse);
      audioRef.current.currentTime = startTimeToUse;
      setAudioProgress(0);
    } catch (error) {
      // Fallback seguro
      const fallbackTime = Math.random() * Math.max(0, duration - 10);
      setStartTime(fallbackTime);
      audioRef.current.currentTime = fallbackTime;
      setAudioProgress(0);
    }

    // Aplicar configurações de som
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('bandle_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          audioRef.current.muted = !settings.sound;
        }
      } catch (error) {
        // Silent error handling
      }
    }

    // Limpa o estado de erro quando o áudio carrega com sucesso
    setAudioError(false);

    // Limpar qualquer mensagem de erro de áudio
    if (message && (
      message.includes('Erro ao carregar o áudio') ||
      message.includes('Erro ao reproduzir o áudio') ||
      message.includes('Formato de áudio não suportado') ||
      message.includes('Erro de rede')
    )) {
      setMessage('');
    }
    // Se o usuário clicou play enquanto carregava, já inicia a reprodução
    if (pendingPlay) {
      setPendingPlay(false);
      setTimeout(() => {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
        setIsPlayLoading(false);
      }, 0);
    }
  };

  // Atualiza progresso e play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      try {
        // Verificações básicas
        if (!audio || audio.ended || !audio.duration || isNaN(audio.duration) || startTime === null) {
          return;
        }

        const currentTime = Math.max(0, audio.currentTime - startTime);

        // Atualizar progresso sempre
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
            audio.currentTime = startTime;
            setAudioProgress(0);
            audio.volume = volume; // Restaura volume original
          }
        }
      } catch (error) {
        // Silent error handling
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
        // Silent error handling
      }
    };

    const handleAudioError = (e) => {
      // Só mostrar erro se for um erro real de carregamento
      const errorCode = e?.target?.error?.code;
      if (errorCode === 4) {
        setAudioError(true);
        setMessage('Formato de áudio não suportado.');
      } else if (errorCode === 2) {
        setAudioError(true);
        setMessage('Erro de rede ao carregar áudio.');
      } else if (errorCode === 3) {
        setAudioError(true);
        setMessage('Áudio corrompido ou incompleto.');
      } else {
        // Para outros erros, apenas log sem mostrar mensagem
        console.warn('Erro de áudio (silenciado):', e?.target?.error);
      }
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

    };
  }, [startTime, gameOver, attempts, volume]);

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
  const [showSelectFromListError, setShowSelectFromListError] = useState(false);

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
      setMessage(t('congratulations'));
      result = { type: 'success', value: selectedGuess, subtype: guessResult.subtype };

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
        setTimeout(() => setShowStatistics(true), 800);
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
          setTimeout(() => setShowStatistics(true), 800);
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
    setGuess(value);
    filterSuggestions(value);
    // Força mostrar sugestões se for '?'
    if (value.trim() === '?') {
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion) => {
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

    // Carrega a música do dia usando o currentDay já calculado
    // Se currentDay ainda não foi definido, usa o dia local como fallback
    const dayToUse = currentDay !== null ? currentDay : getDayOfYear();

    // Gera música determinística baseada APENAS no dia (sem localStorage)
    const dailySong = getDeterministicSongSimple(dayToUse);

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

  // useEffect que usa currentSong (movido para depois dos estados)
  useEffect(() => {
    // Aguardar um pouco para garantir que tudo esteja inicializado
    const loadTimer = setTimeout(() => {
      if (songsToUse && songsToUse.length > 0 && !currentSong && !isInfiniteMode) {



        const dayOfYear = getDayOfYear();


        const song = getDeterministicSongSimple(dayOfYear);
        if (song) {
          // Processar URL através do proxy para resolver CORS
          const songWithProxy = {
            ...song,
            audioUrl: song?.audioUrl ? simpleAudioProxy.getAudioUrl(song.audioUrl) : ''
          };
          setCurrentSong(songWithProxy);
          setIsLoading(false);
          // Configurar timer para próxima meia-noite
          const now = new Date();
          const nextMidnight = new Date(now);
          nextMidnight.setHours(24, 0, 0, 0);
          const timeUntilMidnight = nextMidnight - now;
          setTimer(timeUntilMidnight);
        } else {
          console.error('❌ Falha ao carregar música do dia');
        }
      } else {

      }
    }, 100); // Aguardar 100ms para garantir que tudo esteja pronto

    return () => clearTimeout(loadTimer);
  }, [songsToUse, currentSong, isInfiniteMode]);

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

      // No modo infinito, força o recarregamento do áudio com um pequeno delay
      // APENAS quando a URL da música muda, não quando o modo muda
      if (isInfiniteMode && audioRef.current) {
        setIsPlaying(false); // Reset play state only in infinite mode
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
          }
        }, 100);
      }
    }
  }, [currentSong?.audioUrl]); // Removido isInfiniteMode das dependências

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


      <AdSuppressor />
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
                  disabled={audioError || (!audioDuration && !currentSong?.audioUrl) || isPlayButtonDisabled || isPlayLoading}
                  className={styles.audioPlayBtnCustom}
                  onClick={debounce(async () => {
                    if (!currentSong?.audioUrl || isPlayButtonDisabled || audioError) {
                      return;
                    }

                    if (!audioRef.current) {
                      return;
                    }

                    // Definir loading imediatamente para feedback visual
                    setIsPlayLoading(true);

                    // Timeout de segurança reduzido para melhor UX
                    const safetyTimeout = setTimeout(() => {
                      setIsPlayLoading(false);
                      setIsPlayButtonDisabled(false);
                    }, 1000); // Reduzido de 3000 para 1000ms

                    try {
                      // Se áudio não carregou ainda, mostrar mensagem e aguardar carregamento
                      if (!audioDuration && currentSong?.audioUrl) {
                        setMessage('Áudio ainda carregando, aguarde...');
                        setTimeout(() => {
                          if (message === 'Áudio ainda carregando, aguarde...') {
                            setMessage('');
                          }
                        }, 2000);
                        setPendingPlay(true);
                        audioRef.current.load();
                        return;
                      }

                      // Fallback para método tradicional - verificar se áudio está pronto
                      if (!audioRef.current || !audioRef.current.duration) {
                        setMessage('Áudio ainda carregando, aguarde...');
                        setTimeout(() => {
                          if (message === 'Áudio ainda carregando, aguarde...') {
                            setMessage('');
                          }
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
                          // Tentar reprodução instantânea se áudio está pronto
                          if (audioRef.current.readyState >= 2) {
                            await browserCompatibility.playAudioInstant(audioRef.current);
                          } else {
                            await browserCompatibility.playAudio(audioRef.current);
                          }
                        }
                      }

                      clearTimeout(safetyTimeout);
                      setIsPlayLoading(false);
                      setIsPlayButtonDisabled(false);

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
                  }, 50, 'play_button')} // Reduzido de 150 para 50ms
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
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleAudioEnded}
                onError={(e) => {
                  console.error('❌ Erro no elemento audio:', {
                    errorCode: e.target.error?.code,
                    errorMessage: e.target.error?.message,
                    src: e.target.src
                  });

                  // Resetar todos os estados de loading
                  setIsPlayLoading(false);
                  setPendingPlay(false);
                  setIsPlayButtonDisabled(false);
                  setAudioError(true);

                  // Limpar timeout se existir
                  if (audioLoadTimeout) {
                    clearTimeout(audioLoadTimeout);
                    setAudioLoadTimeout(null);
                  }

                  // Tratamento de erro mais robusto
                  const errorCode = e.target.error?.code;

                  if (errorCode === 4) {
                    setMessage('Formato de áudio não suportado');
                  } else if (errorCode === 2) {
                    setMessage('Erro de rede ao carregar áudio');
                  } else if (errorCode === 3) {
                    setMessage('Áudio corrompido ou incompleto');
                  } else if (errorCode === 1) {
                    setMessage('Carregamento de áudio foi interrompido');
                  } else {
                    setMessage('Erro desconhecido ao carregar áudio');
                  }

                  // Marcar erro para tentar novamente
                  setAudioLoadError(true);
                  setAudioLoadRetries(prev => prev + 1);

                  // Se muitos erros, marcar como erro de conexão
                  if (audioLoadRetries >= 3) {
                    setConnectionError(true);
                  }
                }}
                onCanPlay={() => {
                  // Áudio pronto para tocar
                  setAudioError(false);
                  setIsPlayLoading(false);
                  setIsPlayButtonDisabled(false);
                  setAudioLoadError(false);
                  setConnectionError(false);
                  setAudioLoadRetries(0);

                  // Limpar timeout se existir
                  if (audioLoadTimeout) {
                    clearTimeout(audioLoadTimeout);
                    setAudioLoadTimeout(null);
                  }

                  // Limpar mensagens de erro de áudio e reprodução
                  if (message && (
                    message.includes('Erro ao carregar o áudio') ||
                    message.includes('Erro ao reproduzir o áudio') ||
                    message.includes('Formato de áudio não suportado') ||
                    message.includes('Erro de rede') ||
                    message.includes('Clique em qualquer lugar') ||
                    message.includes('Áudio ainda carregando') ||
                    message.includes('Áudio corrompido') ||
                    message.includes('Carregamento de áudio foi interrompido') ||
                    message.includes('Erro desconhecido ao carregar áudio')
                  )) {
                    setMessage('');
                  }

                  // Se havia um play pendente, executar agora
                  if (pendingPlay) {
                    setPendingPlay(false);
                    setTimeout(async () => {
                      if (audioRef.current && audioRef.current.paused) {
                        try {
                          await browserCompatibility.playAudio(audioRef.current);
                        } catch (error) {
                          console.warn('Erro no play pendente:', error);
                        }
                      }
                    }, 100);
                  }
                }}
                onLoadStart={() => {
                  // Áudio iniciando carregamento
                }}
                onLoadedData={() => {
                  // Dados do áudio carregados
                }}
                onCanPlayThrough={() => {
                  // Áudio totalmente carregado
                }} />
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

          </div>

          {/* Estatísticas Globais apenas no modo diário */}
          {!isInfiniteMode && <GlobalStats showInDailyMode={true} />}

          <div className={styles.attemptsRow}>
            {[...Array(MAX_ATTEMPTS)].map((_, idx) => {
              let statusClass = styles.attemptInactive;
              if (history[idx]) {
                if (history[idx].type === 'success') {
                  // Verde - Acertou a música
                  statusClass = styles.attemptSuccess;
                } else if (history[idx].type === 'fail') {
                  // Usar o subtype para determinar a cor
                  if (history[idx].subtype === 'same_game') {
                    // Amarelo - Mesmo jogo, música diferente
                    statusClass = styles.attemptGame;
                  } else if (history[idx].subtype === 'same_franchise') {
                    // Laranja - Mesma franquia, jogo diferente (vamos usar uma nova classe)
                    statusClass = styles.attemptFranchise;
                  } else {
                    // Vermelho - Completamente errado
                    statusClass = styles.attemptFail;
                  }
                } else if (history[idx].type === 'skipped') {
                  // Vermelho - Pulou
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
              disabled={gameOver || audioError || attempts >= MAX_ATTEMPTS || isSkipLoading}
            >
              {isSkipLoading ? (isClient ? t('loading') : 'Carregando...') : (isClient ? t('skip') : 'Skip')} <FaFastForward style={{ marginLeft: 4, fontSize: '1em', verticalAlign: 'middle' }} />
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
            {showSelectFromListError && (
              <div className={styles.messageModern + ' ' + styles.error}>
                {t('select_from_list')}
              </div>
            )}
            {showSuggestions && (filteredSuggestions.length > 0 || guess.trim() === '?') && (
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
                {/* Easter egg só aparece se o campo for exatamente '?' */}
                {guess.trim() === '?' && (
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
                )}
              </ul>
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
              <button
                className={styles.nextSongButton}
                onClick={nextInfiniteSong}
              >
                {isClient ? t('next_song') : 'Próxima Música'}
                <FaFastForward style={{ marginLeft: 8, fontSize: '1em' }} />
              </button>
            </div>
          )}

          {/* Botão Jogar Novamente quando modo infinito termina */}
          {isInfiniteMode && infiniteGameOver && !showNextSongButton && (
            <div className={styles.nextSongContainer}>
              <button
                className={styles.playAgainButton}
                onClick={resetInfiniteMode}
              >
                🎮 {isClient ? t('play_again_infinite') : 'Jogar Novamente'}
              </button>
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
          onClose={() => setShowStatistics(false)}
          gameResult={gameResult}
          isInfiniteMode={isInfiniteMode}
          currentSong={currentSong}
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

        {/* Componentes de monetização */}
        <SimpleInterstitialAd
          isOpen={showInterstitialAd}
          onClose={() => setShowInterstitialAd(false)}
        />

        </div>

        {/* Anúncios */}
        <HeaderAd />

        <BetweenGamesAd />
        <Footer />

        {/* Sistema de notificações */}
        <AchievementNotification />

        {/* Aviso de compatibilidade do navegador */}
        <BrowserCompatibilityWarning />

        {/* Modal de relatório de bug */}
        <BugReportModal
          isOpen={showBugReport}
          onClose={() => setShowBugReport(false)}
          currentSong={currentSong}
        />

      </div>

      {/* Detector de bloqueador de anúncios */}
      <Script
        src="/ads.js"
        strategy="beforeInteractive"
        id="adblock-detector"
      />

      {/* Google AdSense - carregado condicionalmente */}
      <Script
        id="adsense-script"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            try {
              if (window.canRunAds === true) {
                // AdBlock não detectado, carregar AdSense
                (function() {
                  const script = document.createElement('script');
                  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1007836460713451';
                  script.async = true;
                  script.crossOrigin = 'anonymous';
                  script.onerror = function() {
                    console.log('📢 AdSense bloqueado pelo navegador - isso é normal com bloqueadores de anúncios');
                  };
                  document.head.appendChild(script);
                })();
              } else {
                console.log('📢 Bloqueador de anúncios detectado');
              }
            } catch (e) {
              // Silenciar erros
            }
          `
        }}
      />

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