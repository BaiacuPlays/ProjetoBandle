// Contexto simples e confiável para sistema de amigos
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SimpleFriendsContext = createContext();

export const useSimpleFriends = () => {
  const context = useContext(SimpleFriendsContext);
  if (!context) {
    throw new Error('useSimpleFriends deve ser usado dentro de um SimpleFriendsProvider');
  }
  return context;
};

export const SimpleFriendsProvider = ({ children }) => {
  const { isAuthenticated, user, renewToken, isLoading: authLoading } = useAuth();

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Função para obter ID do usuário atual
  const getCurrentUserId = () => {
    if (user && user.username) {
      return `auth_${user.username}`;
    }
    return null;
  };

  // Função para salvar dados no cache local
  const saveFriendsCache = (friendsData, requestsData, sentData) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      localStorage.setItem(`simple_friends_${userId}`, JSON.stringify(friendsData));
      localStorage.setItem(`simple_requests_${userId}`, JSON.stringify(requestsData));
      localStorage.setItem(`simple_sent_${userId}`, JSON.stringify(sentData));
    } catch (error) {
      console.warn('Erro ao salvar cache dos amigos:', error);
    }
  };

  // Função para carregar dados do cache local
  const loadFriendsCache = () => {
    const userId = getCurrentUserId();
    if (!userId) return { friends: [], requests: [], sent: [] };

    try {
      const friendsData = localStorage.getItem(`simple_friends_${userId}`);
      const requestsData = localStorage.getItem(`simple_requests_${userId}`);
      const sentData = localStorage.getItem(`simple_sent_${userId}`);

      return {
        friends: friendsData ? JSON.parse(friendsData) : [],
        requests: requestsData ? JSON.parse(requestsData) : [],
        sent: sentData ? JSON.parse(sentData) : []
      };
    } catch (error) {
      console.warn('Erro ao carregar cache dos amigos:', error);
      return { friends: [], requests: [], sent: [] };
    }
  };

  // Função para limpar cache local
  const clearFriendsCache = () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      localStorage.removeItem(`simple_friends_${userId}`);
      localStorage.removeItem(`simple_requests_${userId}`);
      localStorage.removeItem(`simple_sent_${userId}`);
    } catch (error) {
      console.warn('Erro ao limpar cache dos amigos:', error);
    }
  };

  // Função para obter token de autenticação
  const getAuthToken = () => {
    // Tentar obter token de várias fontes
    const token = localStorage.getItem('ludomusic_session_token') ||
                  document.cookie.split('; ').find(row => row.startsWith('ludomusic_session='))?.split('=')[1];
    return token;
  };

  // Função para fazer requisições autenticadas com retry automático
  const apiRequest = async (url, options = {}) => {
    let token = getAuthToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };

    let response = await fetch(url, requestOptions);

    // Se recebeu 401, tentar renovar token uma vez
    if (response.status === 401) {
      console.log('🔄 Token expirado, tentando renovar...');
      try {
        const renewResult = await renewToken();

        if (renewResult?.success) {
          console.log('✅ Token renovado com sucesso');
          // Atualizar token e tentar novamente
          token = getAuthToken();
          requestOptions.headers['Authorization'] = `Bearer ${token}`;
          response = await fetch(url, requestOptions);
        } else {
          console.log('❌ Falha na renovação do token');
        }
      } catch (renewError) {
        console.log('❌ Erro ao renovar token:', renewError);
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro na requisição');
    }

    return response.json();
  };

  // Carregar dados dos amigos
  const loadFriendsData = async () => {
    if (!isAuthenticated || authLoading) return;

    // Verificar se há token antes de fazer requisições
    const token = getAuthToken();
    if (!token) {
      console.warn('Token não disponível ainda, aguardando...');
      return;
    }

    setIsLoading(true);
    try {
      // Carregar amigos
      const friendsData = await apiRequest('/api/simple-friends?action=friends');
      const friends = friendsData.friends || [];
      setFriends(friends);

      // Carregar solicitações recebidas
      const requestsData = await apiRequest('/api/simple-friends?action=requests');
      const requests = requestsData.requests || [];
      setRequests(requests);

      // Carregar solicitações enviadas
      const sentData = await apiRequest('/api/simple-friends?action=sent');
      const sent = sentData.sent || [];
      setSentRequests(sent);

      // Salvar no cache local
      saveFriendsCache(friends, requests, sent);

    } catch (error) {
      // Se o erro for de token não encontrado, não logar como erro (é esperado durante carregamento)
      if (error.message.includes('Token de autenticação não encontrado')) {
        console.warn('Token ainda não disponível, usando cache...');
      } else {
        console.error('Erro ao carregar dados dos amigos:', error);
      }

      // Em caso de erro, tentar carregar do cache
      const cachedData = loadFriendsCache();
      setFriends(cachedData.friends);
      setRequests(cachedData.requests);
      setSentRequests(cachedData.sent);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar usuário por código
  const searchUser = async (userCode) => {
    if (!userCode || !userCode.trim()) {
      throw new Error('Código do usuário é obrigatório');
    }

    if (!isAuthenticated || !user) {
      throw new Error('Você precisa estar logado para buscar usuários');
    }

    try {
      const currentUserId = `auth_${user.username}`;
      const response = await fetch(`/api/search-users?query=${encodeURIComponent(userCode.trim())}&currentUserId=${encodeURIComponent(currentUserId)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar usuário');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Usuário não encontrado');
      }

      return data.user;
    } catch (error) {
      throw error;
    }
  };

  // Enviar solicitação de amizade
  const sendFriendRequest = async (user) => {
    if (!user || !user.id) {
      throw new Error('Dados do usuário são obrigatórios');
    }

    try {
      await apiRequest('/api/simple-friends', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send_request',
          data: {
            toUserId: user.id,
            toUser: {
              username: user.username,
              displayName: user.displayName,
              avatar: user.avatar
            }
          }
        })
      });

      // Recarregar dados
      await loadFriendsData();
    } catch (error) {
      throw error;
    }
  };

  // Aceitar solicitação de amizade
  const acceptFriendRequest = async (requestId) => {
    if (!requestId) {
      throw new Error('ID da solicitação é obrigatório');
    }

    try {
      await apiRequest('/api/simple-friends', {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept_request',
          data: { requestId }
        })
      });

      // Recarregar dados
      await loadFriendsData();
    } catch (error) {
      throw error;
    }
  };

  // Rejeitar solicitação de amizade
  const rejectFriendRequest = async (requestId) => {
    if (!requestId) {
      throw new Error('ID da solicitação é obrigatório');
    }

    try {
      await apiRequest('/api/simple-friends', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reject_request',
          data: { requestId }
        })
      });

      // Recarregar dados
      await loadFriendsData();
    } catch (error) {
      throw error;
    }
  };

  // Remover amigo
  const removeFriend = async (friendId) => {
    if (!friendId) {
      throw new Error('ID do amigo é obrigatório');
    }

    try {
      await apiRequest('/api/simple-friends', {
        method: 'DELETE',
        body: JSON.stringify({
          action: 'remove_friend',
          data: { friendId }
        })
      });

      // Recarregar dados
      await loadFriendsData();
    } catch (error) {
      throw error;
    }
  };

  // Cancelar solicitação enviada
  const cancelSentRequest = async (requestId) => {
    if (!requestId) {
      throw new Error('ID da solicitação é obrigatório');
    }

    try {
      await apiRequest('/api/simple-friends', {
        method: 'POST',
        body: JSON.stringify({
          action: 'cancel_request',
          data: { requestId }
        })
      });

      // Recarregar dados
      await loadFriendsData();
    } catch (error) {
      throw error;
    }
  };

  // Carregar dados quando usuário faz login
  useEffect(() => {
    // Aguardar o AuthContext terminar de carregar antes de tomar qualquer ação
    if (authLoading) {
      return; // Ainda carregando, não fazer nada
    }

    if (isAuthenticated && user) {
      // Usuário autenticado - primeiro carregar do cache, depois do servidor
      const cachedData = loadFriendsCache();
      if (cachedData.friends.length > 0 || cachedData.requests.length > 0 || cachedData.sent.length > 0) {
        setFriends(cachedData.friends);
        setRequests(cachedData.requests);
        setSentRequests(cachedData.sent);
      }

      // Aguardar token estar disponível antes de carregar do servidor
      const waitForTokenAndLoad = async () => {
        let attempts = 0;
        const maxAttempts = 10; // máximo 1 segundo de espera

        const checkToken = () => {
          const token = getAuthToken();
          if (token) {
            loadFriendsData();
            return;
          }

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkToken, 100); // tentar novamente em 100ms
          } else {
            console.warn('Token não disponível após 1 segundo, usando apenas cache');
          }
        };

        checkToken();
      };

      waitForTokenAndLoad();
    } else {
      // Usuário não autenticado após carregamento completo - limpar dados e cache
      setFriends([]);
      setRequests([]);
      setSentRequests([]);
      clearFriendsCache();
    }
  }, [isAuthenticated, user?.username, authLoading]); // Usar user?.username em vez de user

  // Polling para verificar novas solicitações (a cada 10 MINUTOS)
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const interval = setInterval(() => {
      loadFriendsData();
    }, 10 * 60 * 1000); // 10 MINUTOS (era 60 segundos)

    return () => clearInterval(interval);
  }, [isAuthenticated, authLoading]);

  const value = {
    friends,
    requests,
    sentRequests,
    isLoading,
    searchUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    cancelSentRequest,
    loadFriendsData
  };

  return (
    <SimpleFriendsContext.Provider value={value}>
      {children}
    </SimpleFriendsContext.Provider>
  );
};

export default SimpleFriendsContext;
