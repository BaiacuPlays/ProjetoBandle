import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { apiRequest } from '../config/api';

// Estado inicial
const initialState = {
  roomCode: '',
  playerNickname: '',
  lobbyData: null,
  isLoading: false,
  error: '',
  isConnected: false,
  currentScreen: 'lobby' // 'lobby' | 'game'
};

// Actions
const ACTIONS = {
  SET_ROOM_CODE: 'SET_ROOM_CODE',
  SET_PLAYER_NICKNAME: 'SET_PLAYER_NICKNAME',
  SET_LOBBY_DATA: 'SET_LOBBY_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CONNECTED: 'SET_CONNECTED',
  SET_CURRENT_SCREEN: 'SET_CURRENT_SCREEN',
  RESET: 'RESET'
};

// Reducer
function multiplayerReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_ROOM_CODE:
      return { ...state, roomCode: action.payload };
    case ACTIONS.SET_PLAYER_NICKNAME:
      return { ...state, playerNickname: action.payload };
    case ACTIONS.SET_LOBBY_DATA:
      return { ...state, lobbyData: action.payload };
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.SET_CONNECTED:
      return { ...state, isConnected: action.payload };
    case ACTIONS.SET_CURRENT_SCREEN:
      return { ...state, currentScreen: action.payload };
    case ACTIONS.RESET:
      return initialState;
    default:
      return state;
  }
}

// Context
const MultiplayerContext = createContext();

// Provider
export function MultiplayerProvider({ children }) {
  const [state, dispatch] = useReducer(multiplayerReducer, initialState);

  // Polling para atualizar o estado da sala
  useEffect(() => {
    if (!state.roomCode || !state.isConnected) {
      return;
    }

    let isActive = true;
    let consecutiveErrors = 0;
    const maxErrors = 5;

    const pollLobby = async () => {
      if (!isActive) return;

      try {
        const response = await apiRequest(`/api/lobby?roomCode=${state.roomCode}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!isActive) return;

        if (response.ok) {
          const data = await response.json();
          if (isActive) {
            // Verificar se a sala foi encontrada
            if (data.roomNotFound) {
              consecutiveErrors++;
              if (consecutiveErrors >= maxErrors) {
                dispatch({ type: ACTIONS.SET_ERROR, payload: 'Conexão perdida com a sala' });
              }
            } else {
              dispatch({ type: ACTIONS.SET_LOBBY_DATA, payload: data });
              consecutiveErrors = 0;

              // Limpar erro se havia um
              if (state.error) {
                dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
              }
            }
          }
        } else {
          consecutiveErrors++;
          // Só mostrar erro se for muito persistente
          if (consecutiveErrors >= maxErrors * 2) {
            if (isActive) {
              dispatch({ type: ACTIONS.SET_ERROR, payload: 'Problemas de conexão com o servidor' });
            }
          }
        }
      } catch (err) {
        consecutiveErrors++;
        // Ignorar erros de rede temporários
        if (consecutiveErrors >= maxErrors && isActive) {
          dispatch({ type: ACTIONS.SET_ERROR, payload: 'Problemas de conexão' });
        }
      }
    };

    // Poll inicial após um pequeno delay
    const initialTimeout = setTimeout(pollLobby, 500);

    // Poll a cada 4 segundos
    const interval = setInterval(pollLobby, 4000);

    return () => {
      isActive = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [state.roomCode, state.isConnected]);

  // Actions
  const actions = {
    setRoomCode: (roomCode) => dispatch({ type: ACTIONS.SET_ROOM_CODE, payload: roomCode }),
    setPlayerNickname: (nickname) => dispatch({ type: ACTIONS.SET_PLAYER_NICKNAME, payload: nickname }),
    setLobbyData: (data) => dispatch({ type: ACTIONS.SET_LOBBY_DATA, payload: data }),
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
    setConnected: (connected) => dispatch({ type: ACTIONS.SET_CONNECTED, payload: connected }),
    setCurrentScreen: (screen) => dispatch({ type: ACTIONS.SET_CURRENT_SCREEN, payload: screen }),
    reset: () => dispatch({ type: ACTIONS.RESET }),

    // Criar sala
    createRoom: async (playerNickname) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: '' });

      try {
        const response = await apiRequest('/api/lobby', {
          method: 'POST',
          body: JSON.stringify({ nickname: playerNickname })
        });

        if (response.ok) {
          const data = await response.json();
          dispatch({ type: ACTIONS.SET_ROOM_CODE, payload: data.roomCode });
          dispatch({ type: ACTIONS.SET_PLAYER_NICKNAME, payload: playerNickname });
          dispatch({ type: ACTIONS.SET_CONNECTED, payload: true });

          const lobbyResponse = await apiRequest(`/api/lobby?roomCode=${data.roomCode}`);
          if (lobbyResponse.ok) {
            const lobbyData = await lobbyResponse.json();
            dispatch({ type: ACTIONS.SET_LOBBY_DATA, payload: lobbyData });
          }

          return data;
        } else {
          const errorData = await response.json();
          dispatch({ type: ACTIONS.SET_ERROR, payload: errorData.error || 'Erro ao criar sala' });
          throw new Error(errorData.error);
        }
      } catch (err) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Erro de conexão' });
        throw err;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    // Entrar na sala
    joinRoom: async (roomCode, playerNickname) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: '' });

      try {
        const response = await apiRequest('/api/lobby', {
          method: 'PUT',
          body: JSON.stringify({ roomCode, nickname: playerNickname })
        });

        if (response.ok) {
          const data = await response.json();
          dispatch({ type: ACTIONS.SET_ROOM_CODE, payload: roomCode });
          dispatch({ type: ACTIONS.SET_PLAYER_NICKNAME, payload: playerNickname });
          dispatch({ type: ACTIONS.SET_LOBBY_DATA, payload: data });
          dispatch({ type: ACTIONS.SET_CONNECTED, payload: true });
          return data;
        } else {
          const errorData = await response.json();
          dispatch({ type: ACTIONS.SET_ERROR, payload: errorData.error || 'Erro ao entrar na sala' });
          throw new Error(errorData.error);
        }
      } catch (err) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Erro de conexão' });
        throw err;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    // Iniciar jogo
    startGame: async () => {
      if (!state.roomCode) return;

      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: '' });

      try {
        const response = await apiRequest('/api/lobby', {
          method: 'PATCH',
          body: JSON.stringify({ roomCode: state.roomCode, action: 'start' })
        });

        if (response.ok) {
          const data = await response.json();
          dispatch({ type: ACTIONS.SET_LOBBY_DATA, payload: data });
          dispatch({ type: ACTIONS.SET_CURRENT_SCREEN, payload: 'game' });
          return data;
        } else {
          const errorData = await response.json();
          dispatch({ type: ACTIONS.SET_ERROR, payload: errorData.error || 'Erro ao iniciar jogo' });
          throw new Error(errorData.error);
        }
      } catch (err) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Erro de conexão' });
        throw err;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    // Fazer tentativa
    makeGuess: async (guess) => {
      if (!state.roomCode || !state.playerNickname) return { success: false, error: 'Dados inválidos' };

      try {
        const response = await apiRequest('/api/lobby', {
          method: 'PATCH',
          body: JSON.stringify({
            roomCode: state.roomCode,
            action: 'guess',
            nickname: state.playerNickname,
            guess
          })
        });

        const data = await response.json();

        if (response.ok) {
          // Atualizar dados do lobby com a resposta
          if (data.lobbyData) {
            dispatch({ type: ACTIONS.SET_LOBBY_DATA, payload: data.lobbyData });
          }
          return {
            success: true,
            correct: data.correct,
            gameCorrect: data.gameCorrect,
            winner: data.winner,
            attempts: data.attempts,
            tooLate: data.tooLate,
            message: data.message
          };
        } else {
          // NUNCA mostrar erros de tentativas no contexto - deixar para o componente decidir
          return { success: false, error: data.error };
        }
      } catch (err) {
        // Só mostrar erro de conexão se for crítico
        return { success: false, error: 'Erro de conexão' };
      }
    },

    // Próxima rodada (apenas host)
    nextRound: async () => {
      if (!state.roomCode) return { success: false, error: 'Dados inválidos' };

      try {
        const response = await apiRequest('/api/lobby', {
          method: 'PATCH',
          body: JSON.stringify({
            roomCode: state.roomCode,
            action: 'nextRound',
            nickname: state.playerNickname
          })
        });

        const data = await response.json();

        if (response.ok) {
          if (data.lobbyData) {
            dispatch({ type: ACTIONS.SET_LOBBY_DATA, payload: data.lobbyData });
          }
          return { success: true };
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: data.error || 'Erro ao avançar rodada' });
          return { success: false, error: data.error };
        }
      } catch (err) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Erro de conexão' });
        return { success: false, error: 'Erro de conexão' };
      }
    },

    // Pular rodada
    skipRound: async () => {
      if (!state.roomCode || !state.playerNickname) return { success: false, error: 'Dados inválidos' };

      try {
        const response = await apiRequest('/api/lobby', {
          method: 'PATCH',
          body: JSON.stringify({
            roomCode: state.roomCode,
            action: 'skip',
            nickname: state.playerNickname
          })
        });

        const data = await response.json();

        if (response.ok) {
          if (data.lobbyData) {
            dispatch({ type: ACTIONS.SET_LOBBY_DATA, payload: data.lobbyData });
          }
          return { success: true };
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: data.error || 'Erro ao pular rodada' });
          return { success: false, error: data.error };
        }
      } catch (err) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Erro de conexão' });
        return { success: false, error: 'Erro de conexão' };
      }
    },

    // Resetar jogo (apenas host)
    resetGame: async () => {
      if (!state.roomCode || !state.playerNickname) return { success: false, error: 'Dados inválidos' };

      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: '' });

      try {
        const response = await apiRequest('/api/lobby', {
          method: 'PATCH',
          body: JSON.stringify({
            roomCode: state.roomCode,
            action: 'reset',
            nickname: state.playerNickname
          })
        });

        const data = await response.json();

        if (response.ok) {
          if (data.lobbyData) {
            dispatch({ type: ACTIONS.SET_LOBBY_DATA, payload: data.lobbyData });
          }
          // Voltar para a tela de lobby
          dispatch({ type: ACTIONS.SET_CURRENT_SCREEN, payload: 'lobby' });
          return { success: true };
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: data.error || 'Erro ao resetar jogo' });
          return { success: false, error: data.error };
        }
      } catch (err) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Erro de conexão' });
        return { success: false, error: 'Erro de conexão' };
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }
  };

  return (
    <MultiplayerContext.Provider value={{ state, actions }}>
      {children}
    </MultiplayerContext.Provider>
  );
}

// Hook para usar o contexto
export function useMultiplayerContext() {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayerContext deve ser usado dentro de MultiplayerProvider');
  }
  return context;
}
