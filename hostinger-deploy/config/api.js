// Configuração da API local
const API_CONFIG = {
  // URL base para APIs locais do Next.js
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',

  // Endpoints
  ENDPOINTS: {
    LOBBY: '/api/lobby',
    MUSIC_INFO: '/api/music-info',
    TIMEZONE: '/api/timezone'
  },

  // Configurações de timeout
  TIMEOUT: 5000, // Reduzido para 5 segundos

  // Configurações de retry
  RETRY_ATTEMPTS: 1, // Reduzido para 1 tentativa
  RETRY_DELAY: 500
};

// 🚨 SISTEMA DE FALLBACK COMPLETO USANDO LOCALSTORAGE
const LocalStorageAPI = {
  // Gerar código de sala
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Criar sala
  createRoom(nickname) {
    const roomCode = this.generateRoomCode();
    const lobby = {
      players: [nickname],
      created: Date.now(),
      host: nickname,
      gameStarted: false,
      currentRound: 1,
      songs: [],
      scores: {},
      currentSong: null,
      gameState: {
        currentRound: 0,
        totalRounds: 10,
        songs: [],
        scores: {},
        currentSong: null,
        roundStartTime: null,
        roundWinners: [],
        roundFinished: false,
        gameFinished: false,
        attempts: {},
        guesses: {},
        isTiebreaker: false
      }
    };

    localStorage.setItem(`lobby:${roomCode}`, JSON.stringify(lobby));
    console.log('🔄 FALLBACK - Sala criada:', roomCode, lobby);
    return { roomCode };
  },

  // Buscar sala
  getLobby(roomCode) {
    const data = localStorage.getItem(`lobby:${roomCode}`);
    if (!data) {
      return {
        players: [],
        host: null,
        gameStarted: false,
        roomNotFound: true,
        gameState: {
          currentRound: 0,
          totalRounds: 10,
          songs: [],
          scores: {},
          currentSong: null,
          roundStartTime: null,
          roundWinners: [],
          roundFinished: false,
          gameFinished: false,
          attempts: {},
          guesses: {},
          isTiebreaker: false
        },
        currentSong: null
      };
    }
    return JSON.parse(data);
  },

  // Entrar na sala
  joinRoom(roomCode, nickname) {
    const lobby = this.getLobby(roomCode);
    if (lobby.roomNotFound) {
      throw new Error('Sala não encontrada');
    }

    if (!lobby.players.includes(nickname)) {
      lobby.players.push(nickname);
      localStorage.setItem(`lobby:${roomCode}`, JSON.stringify(lobby));
    }

    return lobby;
  },

  // Atualizar sala
  updateLobby(roomCode, updates) {
    const lobby = this.getLobby(roomCode);
    if (lobby.roomNotFound) {
      throw new Error('Sala não encontrada');
    }

    const updatedLobby = { ...lobby, ...updates };
    localStorage.setItem(`lobby:${roomCode}`, JSON.stringify(updatedLobby));
    return updatedLobby;
  }
};

// Função helper para fazer requests com fallback automático
export const apiRequest = async (endpoint, options = {}) => {
  // 🚨 FALLBACK IMEDIATO PARA MULTIPLAYER
  if (endpoint.includes('/api/lobby')) {
    console.log('🔄 USANDO FALLBACK LOCALSTORAGE para:', endpoint, options);

    try {
      if (options.method === 'POST') {
        // Criar sala
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        const result = LocalStorageAPI.createRoom(body.nickname);

        return {
          ok: true,
          json: async () => result
        };
      }

      if (options.method === 'GET' || !options.method) {
        // Buscar sala
        const url = new URL(endpoint, 'http://localhost');
        const roomCode = url.searchParams.get('roomCode');
        const result = LocalStorageAPI.getLobby(roomCode);

        return {
          ok: true,
          json: async () => result
        };
      }

      if (options.method === 'PUT') {
        // Entrar na sala
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        const result = LocalStorageAPI.joinRoom(body.roomCode, body.nickname);

        return {
          ok: true,
          json: async () => result
        };
      }

      if (options.method === 'PATCH') {
        // Ações do jogo
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;

        if (body.action === 'start') {
          // Iniciar jogo - selecionar músicas aleatórias
          const lobby = LocalStorageAPI.getLobby(body.roomCode);
          if (lobby.roomNotFound) {
            return { ok: false, json: async () => ({ error: 'Sala não encontrada' }) };
          }

          // Importar músicas dinamicamente
          const { songs } = await import('../data/songs.js');

          // Selecionar músicas aleatórias
          const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
          const selectedSongs = shuffledSongs.slice(0, 10);



          const scores = {};
          lobby.players.forEach(player => {
            scores[player] = 0;
          });

          const gameState = {
            currentRound: 1,
            totalRounds: 10,
            songs: selectedSongs,
            scores: scores,
            currentSong: selectedSongs[0]?.title || null,
            roundStartTime: Date.now(),
            roundWinners: [],
            roundFinished: false,
            gameFinished: false,
            attempts: {},
            guesses: {},
            isTiebreaker: false
          };



          const updatedLobby = LocalStorageAPI.updateLobby(body.roomCode, {
            gameStarted: true,
            gameState
          });



          return {
            ok: true,
            json: async () => ({ success: true, lobbyData: updatedLobby })
          };
        }

        // Fazer tentativa
        if (body.action === 'guess') {
          const lobby = LocalStorageAPI.getLobby(body.roomCode);
          if (lobby.roomNotFound) {
            return { ok: false, json: async () => ({ error: 'Sala não encontrada' }) };
          }

          // Importar músicas para validação
          const { songs } = await import('../data/songs.js');

          const gameState = lobby.gameState;
          const currentSongIndex = (gameState.currentRound || 1) - 1;
          const currentSong = gameState.songs[currentSongIndex];



          // Normalizar strings para comparação
          const normalize = str => str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

          const normalizedGuess = normalize(body.guess);
          const normalizedCorrect = normalize(currentSong?.title || '');
          const normalizedGame = normalize(currentSong?.game || '');

          // Verificar se acertou a música CORRETA da rodada atual
          const correct = normalizedGuess === normalizedCorrect;

          // Verificar se acertou o jogo correto (mas não a música específica)
          let gameCorrect = false;
          if (!correct && currentSong?.game) {
            // Verificar se a tentativa corresponde a QUALQUER música do mesmo jogo
            const songsFromSameGame = songs.filter(song =>
              normalize(song.game) === normalizedGame
            );
            gameCorrect = songsFromSameGame.some(song =>
              normalize(song.title) === normalizedGuess
            );


          }

          // Atualizar tentativas do jogador
          if (!gameState.attempts[body.nickname]) {
            gameState.attempts[body.nickname] = 0;
          }
          gameState.attempts[body.nickname]++;

          let winner = false;
          let message = '';

          if (correct) {
            // Jogador acertou!
            if (!gameState.roundWinners.includes(body.nickname)) {
              gameState.roundWinners.push(body.nickname);
              winner = true;

              // Calcular pontos (6 - tentativas usadas)
              const points = Math.max(0, 6 - gameState.attempts[body.nickname]);
              gameState.scores[body.nickname] = (gameState.scores[body.nickname] || 0) + points;

              message = `Parabéns! Você acertou e ganhou ${points} pontos!`;
            }
          } else if (gameCorrect) {
            message = 'Jogo correto, mas música errada!';
          } else {
            message = 'Tentativa incorreta.';
          }

          // Salvar tentativa no histórico
          if (!gameState.guesses[body.nickname]) {
            gameState.guesses[body.nickname] = [];
          }
          gameState.guesses[body.nickname].push({
            guess: body.guess,
            correct: correct,
            gameCorrect: gameCorrect,
            attempt: gameState.attempts[body.nickname],
            type: correct ? 'success' : (gameCorrect ? 'gameCorrect' : 'fail'),
            tooLate: false
          });

          // Verificar se todos os jogadores terminaram (esgotaram tentativas OU acertaram)
          const allPlayersFinished = lobby.players.every(player => {
            const playerAttempts = gameState.attempts[player] || 0;
            const playerWon = gameState.roundWinners.includes(player);
            return playerAttempts >= 6 || playerWon;
          });

          if (allPlayersFinished) {
            gameState.roundFinished = true;
            if (gameState.roundWinners.length === 0) {
              gameState.roundWinners = ['NONE']; // Ninguém acertou
            }
          }

          // Salvar estado atualizado
          const updatedLobby = LocalStorageAPI.updateLobby(body.roomCode, {
            gameState
          });



          return {
            ok: true,
            json: async () => ({
              success: true,
              correct,
              gameCorrect,
              winner,
              attempts: gameState.attempts[body.nickname],
              message,
              lobbyData: updatedLobby
            })
          };
        }

        // Próxima rodada
        if (body.action === 'nextRound') {
          const lobby = LocalStorageAPI.getLobby(body.roomCode);
          if (lobby.roomNotFound) {
            return { ok: false, json: async () => ({ error: 'Sala não encontrada' }) };
          }

          const gameState = lobby.gameState;

          // Avançar para próxima rodada
          gameState.currentRound++;
          gameState.roundWinners = [];
          gameState.roundFinished = false;
          gameState.roundStartTime = Date.now();

          // Resetar tentativas e histórico para a nova rodada
          gameState.attempts = {};
          gameState.guesses = {};

          // Verificar se o jogo terminou
          if (gameState.currentRound > gameState.totalRounds) {
            gameState.gameFinished = true;
          } else {
            // Atualizar música atual
            const currentSongIndex = gameState.currentRound - 1;
            gameState.currentSong = gameState.songs[currentSongIndex]?.title || null;
          }

          const updatedLobby = LocalStorageAPI.updateLobby(body.roomCode, {
            gameState
          });

          console.log('🔄 FALLBACK - Próxima rodada:', gameState.currentRound);

          return {
            ok: true,
            json: async () => ({
              success: true,
              lobbyData: updatedLobby
            })
          };
        }

        // Pular rodada
        if (body.action === 'skip') {
          const lobby = LocalStorageAPI.getLobby(body.roomCode);
          if (lobby.roomNotFound) {
            return { ok: false, json: async () => ({ error: 'Sala não encontrada' }) };
          }

          const gameState = lobby.gameState;

          // Atualizar tentativas do jogador (pular conta como tentativa)
          if (!gameState.attempts[body.nickname]) {
            gameState.attempts[body.nickname] = 0;
          }
          gameState.attempts[body.nickname]++;

          // Salvar skip no histórico
          if (!gameState.guesses[body.nickname]) {
            gameState.guesses[body.nickname] = [];
          }
          gameState.guesses[body.nickname].push({
            guess: 'SKIP',
            correct: false,
            gameCorrect: false,
            attempt: gameState.attempts[body.nickname],
            type: 'skipped',
            tooLate: false
          });

          // Verificar se todos os jogadores terminaram (esgotaram tentativas OU acertaram)
          const allPlayersFinished = lobby.players.every(player => {
            const playerAttempts = gameState.attempts[player] || 0;
            const playerWon = gameState.roundWinners.includes(player);
            return playerAttempts >= 6 || playerWon;
          });

          if (allPlayersFinished) {
            gameState.roundFinished = true;
            if (gameState.roundWinners.length === 0) {
              gameState.roundWinners = ['NONE']; // Ninguém acertou
            }
          }

          const updatedLobby = LocalStorageAPI.updateLobby(body.roomCode, {
            gameState
          });



          return {
            ok: true,
            json: async () => ({
              success: true,
              lobbyData: updatedLobby
            })
          };
        }

        // Reset do jogo
        if (body.action === 'reset') {
          const lobby = LocalStorageAPI.getLobby(body.roomCode);
          if (lobby.roomNotFound) {
            return { ok: false, json: async () => ({ error: 'Sala não encontrada' }) };
          }

          // Resetar estado do jogo
          const gameState = {
            currentRound: 0,
            totalRounds: 10,
            songs: [],
            scores: {},
            currentSong: null,
            roundStartTime: null,
            roundWinners: [],
            roundFinished: false,
            gameFinished: false,
            attempts: {},
            guesses: {},
            isTiebreaker: false
          };

          const updatedLobby = LocalStorageAPI.updateLobby(body.roomCode, {
            gameStarted: false,
            gameState
          });



          return {
            ok: true,
            json: async () => ({
              success: true,
              lobbyData: updatedLobby
            })
          };
        }

        // Sair do jogo
        if (body.action === 'leave') {
          const lobby = LocalStorageAPI.getLobby(body.roomCode);
          if (lobby.roomNotFound) {
            return { ok: false, json: async () => ({ error: 'Sala não encontrada' }) };
          }

          // Remover jogador da sala
          lobby.players = lobby.players.filter(player => player !== body.nickname);

          // Se era o host, transferir para outro jogador
          if (lobby.host === body.nickname && lobby.players.length > 0) {
            lobby.host = lobby.players[0];
          }

          // Se não há mais jogadores, deletar a sala
          if (lobby.players.length === 0) {
            localStorage.removeItem(`lobby:${body.roomCode}`);
            return {
              ok: true,
              json: async () => ({ success: true, roomDeleted: true })
            };
          }

          const updatedLobby = LocalStorageAPI.updateLobby(body.roomCode, lobby);



          return {
            ok: true,
            json: async () => ({
              success: true,
              lobbyData: updatedLobby
            })
          };
        }

        // Outras ações do jogo
        const result = LocalStorageAPI.updateLobby(body.roomCode, {
          gameStarted: body.action === 'start'
        });

        return {
          ok: true,
          json: async () => result
        };
      }

    } catch (error) {
      console.error('🔄 FALLBACK ERROR:', error);
      return {
        ok: false,
        json: async () => ({ error: error.message })
      };
    }
  }

  // Para outras APIs, tentar normalmente com fallback
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    console.warn(`🔄 API falhou, usando fallback:`, error.message);

    // Fallback para timezone
    if (endpoint.includes('timezone')) {
      return {
        ok: true,
        json: async () => ({
          datetime: new Date().toISOString(),
          fallback: true
        })
      };
    }

    // Fallback para music-info
    if (endpoint.includes('music-info')) {
      return {
        ok: true,
        json: async () => ({
          artist: 'Unknown Artist',
          year: 'Unknown Year',
          album: 'Unknown Album',
          console: 'Unknown Platform'
        })
      };
    }

    throw error;
  }
};

// Função para buscar timezone (fallback para API externa)
export const fetchTimezone = async () => {
  try {
    // Primeiro tenta a API externa
    const response = await apiRequest(API_CONFIG.ENDPOINTS.TIMEZONE);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('API externa falhou, usando fallback local:', error.message);

    // Fallback: usar data local do navegador
    const now = new Date();
    return {
      datetime: now.toISOString(),
      fallback: true
    };
  }
};

// Função para buscar informações de música
export const fetchMusicInfo = async (title, game) => {
  try {
    const params = new URLSearchParams({
      title: title,
      game: game
    });

    const response = await apiRequest(`${API_CONFIG.ENDPOINTS.MUSIC_INFO}?${params}`);
    const data = await response.json();
    return data;
  } catch (error) {


    // Retorna dados padrão em caso de erro
    return {
      artist: 'Unknown Artist',
      year: 'Unknown Year',
      album: 'Unknown Album',
      console: 'Unknown Platform'
    };
  }
};

export default API_CONFIG;
