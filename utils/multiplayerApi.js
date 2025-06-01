import { apiRequest } from '../config/api';

// Funções para interagir com a API do multiplayer

export const createRoom = async (nickname) => {
  try {
    const response = await apiRequest('/api/lobby', {
      method: 'POST',
      body: JSON.stringify({ nickname })
    });

    const data = await response.json();
    return { success: true, roomCode: data.roomCode };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const joinRoom = async (nickname, roomCode) => {
  try {
    const response = await apiRequest('/api/lobby', {
      method: 'PUT',
      body: JSON.stringify({ nickname, roomCode })
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Erro de conexão' };
  }
};

export const getLobbyData = async (roomCode) => {
  try {
    const response = await apiRequest(`/api/lobby?roomCode=${roomCode}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    // Retorna dados vazios em caso de erro
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
        guesses: {}
      },
      currentSong: null
    };
  }
};

export const performLobbyAction = async (roomCode, action, nickname, guess = null) => {
  try {
    const body = {
      roomCode,
      action,
      nickname
    };

    if (guess) {
      body.guess = guess;
    }

    const response = await apiRequest('/api/lobby', {
      method: 'PATCH',
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return { success: response.ok, data, error: data.error };
  } catch (error) {
    return { success: false, error: 'Erro de conexão' };
  }
};

// Funções específicas para ações do jogo
export const startGame = async (roomCode, nickname, totalRounds = 10) => {
  try {
    const response = await apiRequest('/api/lobby', {
      method: 'PATCH',
      body: JSON.stringify({
        roomCode,
        action: 'start',
        nickname,
        totalRounds
      })
    });

    const data = await response.json();
    return { success: response.ok, data, error: data.error };
  } catch (error) {
    return { success: false, error: 'Erro de conexão' };
  }
};

export const makeGuess = async (roomCode, nickname, guess) => {
  return performLobbyAction(roomCode, 'guess', nickname, guess);
};

export const nextRound = async (roomCode, nickname) => {
  return performLobbyAction(roomCode, 'next_round', nickname);
};

export const leaveRoom = async (roomCode, nickname) => {
  return performLobbyAction(roomCode, 'leave', nickname);
};

export const resetGame = async (roomCode, nickname) => {
  return performLobbyAction(roomCode, 'reset_game', nickname);
};
