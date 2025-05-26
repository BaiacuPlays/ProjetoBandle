import { useState, useEffect, useCallback } from 'react';
import * as multiplayerApi from '../utils/multiplayerApi';

export const useMultiplayer = () => {
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [lobbyData, setLobbyData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Polling para atualizar o estado da sala
  useEffect(() => {
    if (!roomCode || !isConnected) {
      return;
    }

    const pollLobby = async () => {
      try {
        const data = await multiplayerApi.getLobbyData(roomCode);

        if (data.roomNotFound) {
          setIsConnected(false);
          setError('Sala não encontrada');
          return;
        }

        setLobbyData(data);
      } catch (err) {
        setError('Erro de conexão');
      }
    };

    // Poll inicial
    pollLobby();

    // Poll a cada 2 segundos
    const interval = setInterval(pollLobby, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [roomCode, isConnected]);

  // Criar sala
  const createRoom = useCallback(async (playerNickname) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await multiplayerApi.createRoom(playerNickname);

      if (result.success) {
        setRoomCode(result.roomCode);
        setNickname(playerNickname);
        setIsConnected(true);
        return { success: true, roomCode: result.roomCode };
      } else {
        setError(result.error || 'Erro ao criar sala');
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError('Erro de conexão');
      return { success: false, error: 'Erro de conexão' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Entrar na sala
  const joinRoom = useCallback(async (playerNickname, code) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await multiplayerApi.joinRoom(playerNickname, code);

      if (result.success) {
        setRoomCode(code);
        setNickname(playerNickname);
        setIsConnected(true);
        return { success: true };
      } else {
        setError(result.error || 'Erro ao entrar na sala');
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError('Erro de conexão');
      return { success: false, error: 'Erro de conexão' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Iniciar jogo
  const startGame = useCallback(async () => {
    if (!roomCode || !nickname) return { success: false, error: 'Dados inválidos' };

    try {
      const result = await multiplayerApi.startGame(roomCode, nickname);
      return { success: result.success, error: result.error };
    } catch (err) {
      return { success: false, error: 'Erro de conexão' };
    }
  }, [roomCode, nickname]);

  // Fazer tentativa
  const makeGuess = useCallback(async (guess) => {
    if (!roomCode || !nickname) return { success: false, error: 'Dados inválidos' };

    try {
      const result = await multiplayerApi.makeGuess(roomCode, nickname, guess);
      return {
        success: result.success,
        error: result.error,
        correct: result.data?.correct,
        winner: result.data?.winner,
        attempts: result.data?.attempts
      };
    } catch (err) {
      return { success: false, error: 'Erro de conexão' };
    }
  }, [roomCode, nickname]);

  // Próxima rodada
  const nextRound = useCallback(async () => {
    if (!roomCode || !nickname) return { success: false, error: 'Dados inválidos' };

    try {
      const result = await multiplayerApi.nextRound(roomCode, nickname);
      return { success: result.success, error: result.error };
    } catch (err) {
      return { success: false, error: 'Erro de conexão' };
    }
  }, [roomCode, nickname]);

  // Sair da sala
  const leaveRoom = useCallback(async () => {
    if (!roomCode || !nickname) return { success: false, error: 'Dados inválidos' };

    try {
      const result = await multiplayerApi.leaveRoom(roomCode, nickname);

      if (result.success) {
        setRoomCode('');
        setNickname('');
        setLobbyData(null);
        setIsConnected(false);
      }

      return { success: result.success, error: result.error };
    } catch (err) {
      return { success: false, error: 'Erro de conexão' };
    }
  }, [roomCode, nickname]);

  // Resetar jogo
  const resetGame = useCallback(async () => {
    if (!roomCode || !nickname) return { success: false, error: 'Dados inválidos' };

    try {
      const result = await multiplayerApi.resetGame(roomCode, nickname);
      return { success: result.success, error: result.error };
    } catch (err) {
      return { success: false, error: 'Erro de conexão' };
    }
  }, [roomCode, nickname]);

  return {
    roomCode,
    nickname,
    lobbyData,
    isLoading,
    error,
    isConnected,
    createRoom,
    joinRoom,
    startGame,
    makeGuess,
    nextRound,
    leaveRoom,
    resetGame,
    setError
  };
};
