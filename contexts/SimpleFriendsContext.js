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
  const { isAuthenticated, user } = useAuth();
  
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Função para obter token de autenticação
  const getAuthToken = () => {
    return localStorage.getItem('ludomusic_session_token');
  };

  // Função para fazer requisições autenticadas
  const apiRequest = async (url, options = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro na requisição');
    }

    return response.json();
  };

  // Carregar dados dos amigos
  const loadFriendsData = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      // Carregar amigos
      const friendsData = await apiRequest('/api/simple-friends?action=friends');
      setFriends(friendsData.friends || []);

      // Carregar solicitações recebidas
      const requestsData = await apiRequest('/api/simple-friends?action=requests');
      setRequests(requestsData.requests || []);

      // Carregar solicitações enviadas
      const sentData = await apiRequest('/api/simple-friends?action=sent');
      setSentRequests(sentData.sent || []);

    } catch (error) {
      console.error('Erro ao carregar dados dos amigos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar usuário por código
  const searchUser = async (userCode) => {
    if (!userCode || !userCode.trim()) {
      throw new Error('Código do usuário é obrigatório');
    }

    try {
      const data = await apiRequest(`/api/simple-friends?action=search&query=${encodeURIComponent(userCode.trim())}`);
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

  // Carregar dados quando usuário faz login
  useEffect(() => {
    if (isAuthenticated && user) {
      loadFriendsData();
    } else {
      // Limpar dados quando usuário faz logout
      setFriends([]);
      setRequests([]);
      setSentRequests([]);
    }
  }, [isAuthenticated, user]);

  // Polling para verificar novas solicitações (a cada 60 segundos)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadFriendsData();
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
    loadFriendsData
  };

  return (
    <SimpleFriendsContext.Provider value={value}>
      {children}
    </SimpleFriendsContext.Provider>
  );
};

export default SimpleFriendsContext;
