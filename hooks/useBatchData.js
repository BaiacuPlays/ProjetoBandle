// Hook otimizado para buscar múltiplos dados em uma única chamada
// Reduz drasticamente o número de Function Invocations
import { useState, useEffect, useCallback } from 'react';
import { cachedFetch } from '../utils/api-cache';

export function useBatchData(types = [], userId = null, options = {}) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    interval = null, // Intervalo de atualização (null = sem polling)
    immediate = true // Buscar dados imediatamente
  } = options;

  const fetchData = useCallback(async () => {
    if (!types.length) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const params = new URLSearchParams({
        types: types.join(',')
      });
      
      if (userId) {
        params.append('userId', userId);
      }

      const response = await cachedFetch(`/api/batch-data?${params}`);
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data || {});
      } else {
        throw new Error('Erro ao buscar dados');
      }
    } catch (err) {
      setError(err.message);
      console.error('Erro no useBatchData:', err);
    } finally {
      setLoading(false);
    }
  }, [types.join(','), userId]);

  // Buscar dados iniciais
  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  // Polling otimizado (apenas se especificado)
  useEffect(() => {
    if (!interval) return;

    const intervalId = setInterval(fetchData, interval);
    return () => clearInterval(intervalId);
  }, [fetchData, interval]);

  // Função para refetch manual
  const refetch = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

// Hook específico para dados do usuário
export function useUserData(userId, options = {}) {
  return useBatchData(
    ['profile', 'statistics', 'friends'],
    userId,
    {
      interval: 10 * 60 * 1000, // 10 minutos
      ...options
    }
  );
}

// Hook específico para dados globais
export function useGlobalData(options = {}) {
  return useBatchData(
    ['globalStats', 'dailySong'],
    null,
    {
      interval: 30 * 60 * 1000, // 30 minutos
      ...options
    }
  );
}

// Hook específico para dados do jogo
export function useGameData(userId, options = {}) {
  return useBatchData(
    ['dailySong', 'statistics'],
    userId,
    {
      interval: 5 * 60 * 1000, // 5 minutos
      ...options
    }
  );
}

export default useBatchData;
