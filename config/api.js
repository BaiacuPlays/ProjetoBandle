// Importar KV com verificação de ambiente
let kv = null;
try {
  if (process.env.NODE_ENV === 'production' || (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)) {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
  }
} catch (error) {
  console.warn('KV não disponível:', error.message);
}

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = (process.env.KV_REST_API_URL || process.env.KV_URL) && process.env.KV_REST_API_TOKEN;

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
  TIMEOUT: 5000, // Reduzido para 5 segundos para melhor responsividade

  // Configurações de retry
  RETRY_ATTEMPTS: 2, // Máximo 2 tentativas
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
    return { roomCode };
  },

  // Buscar sala
  getLobby(roomCode) {
    if (!roomCode) {
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

    const lobby = JSON.parse(data);
    return lobby;
  },

  // Entrar na sala
  joinRoom(roomCode, nickname) {
    const lobby = this.getLobby(roomCode);
    if (lobby.roomNotFound) {
      throw new Error('Sala não encontrada');
    }

    if (!lobby.players.includes(nickname)) {
      lobby.players.push(nickname);
      // Inicializar score do novo jogador
      if (lobby.gameState && lobby.gameState.scores) {
        lobby.gameState.scores[nickname] = 0;
      }
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
  // 🚀 TENTAR API REAL PRIMEIRO
  if (endpoint.includes('/api/lobby')) {

    try {
      // Tentar API real do Vercel primeiro
      const fullUrl = `${window.location.origin}${endpoint}`;
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (response.ok) {
        return response;
      } else {
        throw new Error('API falhou');
      }
    } catch (error) {
      // Fallback para localStorage

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

          // Obter número de rodadas (padrão: 10)
          const totalRounds = body.totalRounds || 10;

          // Importar músicas dinamicamente
          const { songs } = await import('../data/songs.js');

          // Selecionar músicas aleatórias baseado no número de rodadas
          const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
          const selectedSongs = shuffledSongs.slice(0, totalRounds);



          const scores = {};
          lobby.players.forEach(player => {
            scores[player] = 0;
          });

          const gameState = {
            currentRound: 1,
            totalRounds: totalRounds,
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

          const normalizeString = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');

          // Função para verificar títulos genéricos
          const isGenericTitle = (title) => {
            const genericTitles = [
              'main title', 'main theme', 'title theme', 'opening theme', 'intro',
              'menu theme', 'title screen', 'main menu', 'theme song', 'opening',
              'title', 'theme', 'main', 'intro theme', 'title music'
            ];
            const normalized = normalizeString(title);
            return genericTitles.some(generic => normalized === generic || normalized.includes(generic));
          };

          const normalizedGuess = normalize(body.guess);
          const normalizedCorrect = normalize(currentSong?.title || '');
          const normalizedGame = normalize(currentSong?.game || '');

          // Verificação melhorada para títulos exatos e genéricos
          let correct = normalizedGuess === normalizedCorrect;

          // Se não acertou exato e ambos são títulos genéricos, verificar se são do mesmo jogo
          if (!correct && isGenericTitle(body.guess) && isGenericTitle(currentSong?.title || '')) {
            const guessedSong = songs.find(song => normalizeString(song.title) === normalizeString(body.guess));
            if (guessedSong && normalizeString(guessedSong.game) === normalizeString(currentSong?.game || '')) {
              // Verificar se é exatamente a mesma música usando ID
              if (guessedSong.id === currentSong?.id) {
                correct = true;
              }
            }
          }

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

          // Atualizar estado da rodada
          if (allPlayersFinished) {
            gameState.roundFinished = true;
            if (gameState.roundWinners.length === 0) {
              gameState.roundWinners = ['NONE']; // Ninguém acertou
            }
          } else {
            // Garantir que jogadores que erraram sejam registrados corretamente
            lobby.players.forEach(player => {
              const playerAttempts = gameState.attempts[player] || 0;
              const playerWon = gameState.roundWinners.includes(player);
              if (!playerWon && playerAttempts >= 6) {
                gameState.guesses[player] = gameState.guesses[player] || [];
                gameState.guesses[player].push({
                  guess: 'FAILED',
                  correct: false,
                  gameCorrect: false,
                  attempt: playerAttempts,
                  type: 'fail',
                  tooLate: false
                });
              }
            });
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

// Função para salvar estatísticas
export async function saveStatistics(userId, gameResult, hintsUsed) {
  // Pular em desenvolvimento local sem KV configurado
  if (isDevelopment && !hasKVConfig) {
    console.log('Desenvolvimento local: estatísticas não salvas (KV não configurado)');
    return;
  }

  const statsKey = `stats:${userId}`;
  const globalStatsKey = 'stats:global';

  try {
    // Atualizar estatísticas do usuário
    const userStats = await safeKV.get(statsKey) || {
      wins: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      losses: 0
    };

    if (gameResult === 'win') {
      userStats.wins[hintsUsed] = (userStats.wins[hintsUsed] || 0) + 1;
    } else {
      userStats.losses += 1;
    }

    await safeKV.set(statsKey, userStats);

    // Atualizar estatísticas globais
    const globalStats = await safeKV.get(globalStatsKey) || {
      totalGames: 0,
      wins: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      losses: 0
    };

    globalStats.totalGames += 1;

    if (gameResult === 'win') {
      globalStats.wins[hintsUsed] = (globalStats.wins[hintsUsed] || 0) + 1;
    } else {
      globalStats.losses += 1;
    }

    await safeKV.set(globalStatsKey, globalStats);
  } catch (error) {
    console.error('Erro ao salvar estatísticas:', error);
  }
}

// Função para buscar estatísticas globais
export async function getGlobalStatistics() {
  // Retornar dados padrão em desenvolvimento local sem KV configurado
  if (isDevelopment && !hasKVConfig) {
    return {
      totalGames: 8446,
      wins: 0,
      losses: 0,
      averageAttempts: 3.2
    };
  }

  const globalStatsKey = 'stats:global';
  try {
    const stats = await safeKV.get(globalStatsKey) || {
      totalGames: 0,
      wins: 0,
      losses: 0,
      averageAttempts: 0
    };

    // Calcular média de tentativas se não existir
    if (!stats.averageAttempts && stats.wins && typeof stats.wins === 'object') {
      let totalAttempts = 0;
      let totalWins = 0;

      for (let i = 1; i <= 6; i++) {
        const winsAtAttempt = stats.wins[i] || 0;
        totalAttempts += winsAtAttempt * i;
        totalWins += winsAtAttempt;
      }

      stats.averageAttempts = totalWins > 0 ? Math.round((totalAttempts / totalWins) * 10) / 10 : 0;
    }

    return stats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas globais:', error);
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      averageAttempts: 0
    };
  }
}

// Encapsular lógica de salvar estatísticas em uma função
export function processStatistics(lobby, gameState) {
  lobby.players.forEach(player => {
    const playerAttempts = gameState.attempts[player] || 0;
    const playerWon = gameState.roundWinners.includes(player);

    if (playerWon) {
      // Jogador venceu, salvar estatísticas com base nas tentativas
      saveStatistics(player, 'win', playerAttempts);
    } else if (playerAttempts >= 6) {
      // Jogador perdeu, salvar estatísticas como derrota
      saveStatistics(player, 'loss', 7); // 7 representa erro
    }
  });
}

export default API_CONFIG;
