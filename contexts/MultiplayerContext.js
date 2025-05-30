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

  // Controle de loading para ações assíncronas usando useRef para evitar race conditions
  const skipInProgressRef = useRef(false);
  const nextRoundInProgressRef = useRef(false);

  // Polling para atualizar o estado da sala
  useEffect(() => {
    if (!state.roomCode || !state.isConnected) {
      return;
    }

    let isActive = true;
    let consecutiveErrors = 0;
    const maxErrors = 8; // Aumentado para ser mais tolerante

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
              // Só mostrar erro se for muito persistente E não estivermos no meio de uma ação
              if (consecutiveErrors >= maxErrors && !state.loading) {
                dispatch({ type: ACTIONS.SET_ERROR, payload: 'Conexão perdida com a sala' });
              }
            } else {
              dispatch({ type: ACTIONS.SET_LOBBY_DATA, payload: data });
              consecutiveErrors = 0;

              // Limpar erro se havia um
              if (state.error && state.error.includes('Sala não encontrada')) {
                dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
              }
            }
          }
        } else {
          consecutiveErrors++;
          // Só mostrar erro se for muito persistente E não estivermos no meio de uma ação
          if (consecutiveErrors >= maxErrors * 2 && !state.loading) {
            if (isActive) {
              dispatch({ type: ACTIONS.SET_ERROR, payload: 'Problemas de conexão com o servidor' });
            }
          }
        }
      } catch (err) {
        consecutiveErrors++;
        // Ignorar erros de rede temporários e AbortError
        if (err.name !== 'AbortError' && consecutiveErrors >= maxErrors && isActive && !state.loading) {
          console.error('🚨 Erro persistente no polling:', err);
          dispatch({ type: ACTIONS.SET_ERROR, payload: 'Problemas de conexão' });
        }
      }
    };

    // Poll inicial após um pequeno delay
    const initialTimeout = setTimeout(pollLobby, 1000);

    // Poll adaptativo: mais frequente durante o jogo, menos frequente no lobby
    const getPollingInterval = () => {
      if (state.currentScreen === 'game' && state.lobbyData?.gameStarted) {
        return 3000; // 3 segundos durante o jogo
      }
      return 6000; // 6 segundos no lobby
    };

    let interval = setInterval(pollLobby, getPollingInterval());

    return () => {
      isActive = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [state.roomCode, state.isConnected, state.loading]);

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
          // NÃO mostrar erro de "Sala não encontrada" no contexto - deixar para o polling lidar
          if (!data.error || !data.error.includes('Sala não encontrada')) {
            // NUNCA mostrar erros de tentativas no contexto - deixar para o componente decidir
          }
          return { success: false, error: data.error };
        }
      } catch (err) {
        // NÃO mostrar erros de conexão temporários no contexto
        return { success: false, error: 'Erro de conexão' };
      }
    },

    // Próxima rodada (apenas host)
    nextRound: async () => {
      if (!state.roomCode) return { success: false, error: 'Dados inválidos' };
      if (nextRoundInProgressRef.current) return { success: false, error: 'Ação em andamento' };
      nextRoundInProgressRef.current = true;
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
          if (!data.error || !data.error.includes('Sala não encontrada')) {
            dispatch({ type: ACTIONS.SET_ERROR, payload: data.error || 'Erro ao avançar rodada' });
          }
          return { success: false, error: data.error };
        }
      } catch (err) {
        return { success: false, error: 'Erro de conexão' };
      } finally {
        nextRoundInProgressRef.current = false;
      }
    },

    // Pular rodada
    skipRound: async () => {
      if (!state.roomCode || !state.playerNickname) return { success: false, error: 'Dados inválidos' };
      if (skipInProgressRef.current) return { success: false, error: 'Ação em andamento' };
      skipInProgressRef.current = true;
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
          if (!data.error || !data.error.includes('Sala não encontrada')) {
            dispatch({ type: ACTIONS.SET_ERROR, payload: data.error || 'Erro ao pular rodada' });
          }
          return { success: false, error: data.error };
        }
      } catch (err) {
        return { success: false, error: 'Erro de conexão' };
      } finally {
        skipInProgressRef.current = false;
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
          // NÃO mostrar erro de "Sala não encontrada" no contexto - deixar para o polling lidar
          if (!data.error || !data.error.includes('Sala não encontrada')) {
            dispatch({ type: ACTIONS.SET_ERROR, payload: data.error || 'Erro ao resetar jogo' });
          }
          return { success: false, error: data.error };
        }
      } catch (err) {
        // NÃO mostrar erros de conexão temporários no contexto
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
