import { useState, useEffect, useCallback } from 'react';

export const useMultiplayer = () => {
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [lobbyData, setLobbyData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Polling para atualizar o estado da sala
  useEffect(() => {
    console.log('🔄 HOOK - useEffect polling:', { roomCode, isConnected });
    if (!roomCode || !isConnected) {
      console.log('🔄 HOOK - Polling não iniciado - faltam dados');
      return;
    }

    const pollLobby = async () => {
      console.log('🔄 HOOK - Fazendo polling para sala:', roomCode);
      try {
        const response = await fetch(`/api/lobby?roomCode=${roomCode}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔄 HOOK - Dados recebidos:', data);
          setLobbyData(data);
        } else {
          const errorData = await response.json();
          console.log('🔄 HOOK - Erro na resposta:', errorData);
          setError(errorData.error || 'Erro ao buscar dados da sala');
        }
      } catch (err) {
        console.log('🔄 HOOK - Erro de conexão:', err);
        setError('Erro de conexão');
      }
    };

    // Poll inicial
    console.log('🔄 HOOK - Iniciando polling...');
    pollLobby();

    // Poll a cada 2 segundos
    const interval = setInterval(pollLobby, 2000);

    return () => {
      console.log('🔄 HOOK - Parando polling');
      clearInterval(interval);
    };
  }, [roomCode, isConnected]);

  // Criar sala
  const createRoom = useCallback(async (playerNickname) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/lobby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: playerNickname }),
      });

      const data = await response.json();

      if (response.ok) {
        setRoomCode(data.roomCode);
        setNickname(playerNickname);
        setIsConnected(true);
        return { success: true, roomCode: data.roomCode };
      } else {
        setError(data.error || 'Erro ao criar sala');
        return { success: false, error: data.error };
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
      const response = await fetch('/api/lobby', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: playerNickname, roomCode: code }),
      });

      const data = await response.json();

      if (response.ok) {
        setRoomCode(code);
        setNickname(playerNickname);
        setIsConnected(true);
        return { success: true };
      } else {
        setError(data.error || 'Erro ao entrar na sala');
        return { success: false, error: data.error };
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
      const response = await fetch('/api/lobby', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode,
          action: 'start',
          nickname
        }),
      });

      const data = await response.json();
      return { success: response.ok, error: data.error };
    } catch (err) {
      return { success: false, error: 'Erro de conexão' };
    }
  }, [roomCode, nickname]);

  // Fazer tentativa
  const makeGuess = useCallback(async (guess) => {
    if (!roomCode || !nickname) return { success: false, error: 'Dados inválidos' };

    try {
      const response = await fetch('/api/lobby', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode,
          action: 'guess',
          nickname,
          guess
        }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        error: data.error,
        correct: data.correct,
        winner: data.winner,
        attempts: data.attempts
      };
    } catch (err) {
      return { success: false, error: 'Erro de conexão' };
    }
  }, [roomCode, nickname]);

  // Próxima rodada
  const nextRound = useCallback(async () => {
    if (!roomCode || !nickname) return { success: false, error: 'Dados inválidos' };

    try {
      const response = await fetch('/api/lobby', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode,
          action: 'next_round',
          nickname
        }),
      });

      const data = await response.json();
      return { success: response.ok, error: data.error };
    } catch (err) {
      return { success: false, error: 'Erro de conexão' };
    }
  }, [roomCode, nickname]);

  // Sair da sala
  const leaveRoom = useCallback(async () => {
    if (!roomCode || !nickname) return { success: false, error: 'Dados inválidos' };

    try {
      const response = await fetch('/api/lobby', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode,
          action: 'leave_game',
          nickname
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRoomCode('');
        setNickname('');
        setLobbyData(null);
        setIsConnected(false);
      }

      return { success: response.ok, error: data.error };
    } catch (err) {
      return { success: false, error: 'Erro de conexão' };
    }
  }, [roomCode, nickname]);

  // Resetar jogo
  const resetGame = useCallback(async () => {
    if (!roomCode || !nickname) return { success: false, error: 'Dados inválidos' };

    try {
      const response = await fetch('/api/lobby', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode,
          action: 'reset_game',
          nickname
        }),
      });

      const data = await response.json();
      return { success: response.ok, error: data.error };
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
