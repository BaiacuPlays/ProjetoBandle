import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FriendsContext = createContext();

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends deve ser usado dentro de um FriendsProvider');
  }
  return context;
};

export const FriendsProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ID do usuário atual (apenas se autenticado)
  const currentUserId = isAuthenticated && user ? `auth_${user.username}` : null;

  // Carregar dados dos amigos do localStorage
  const loadFriendsData = () => {
    if (!currentUserId) return;

    try {
      const savedFriends = localStorage.getItem(`ludomusic_friends_${currentUserId}`);
      const savedRequests = localStorage.getItem(`ludomusic_friend_requests_${currentUserId}`);
      const savedSentRequests = localStorage.getItem(`ludomusic_sent_requests_${currentUserId}`);

      if (savedFriends) setFriends(JSON.parse(savedFriends));
      if (savedRequests) setFriendRequests(JSON.parse(savedRequests));
      if (savedSentRequests) setSentRequests(JSON.parse(savedSentRequests));
    } catch (error) {
      console.error('Erro ao carregar dados dos amigos:', error);
    }
  };

  // Salvar dados dos amigos no localStorage
  const saveFriendsData = () => {
    if (!currentUserId) return;

    try {
      localStorage.setItem(`ludomusic_friends_${currentUserId}`, JSON.stringify(friends));
      localStorage.setItem(`ludomusic_friend_requests_${currentUserId}`, JSON.stringify(friendRequests));
      localStorage.setItem(`ludomusic_sent_requests_${currentUserId}`, JSON.stringify(sentRequests));
    } catch (error) {
      console.error('Erro ao salvar dados dos amigos:', error);
    }
  };

  // Buscar usuário por código ou username
  const searchUserByCode = async (searchQuery) => {
    if (!isAuthenticated || !currentUserId) {
      throw new Error('Você precisa estar logado para buscar usuários');
    }

    try {
      const response = await fetch(`/api/search-users?query=${encodeURIComponent(searchQuery)}&currentUserId=${encodeURIComponent(currentUserId)}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar usuário');
      }

      const data = await response.json();
      return data.user || null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  };

  // Enviar solicitação de amizade
  const sendFriendRequest = async (user) => {
    if (!isAuthenticated || !currentUserId) {
      throw new Error('Você precisa estar logado para enviar solicitações de amizade');
    }

    // Verificar se já é amigo
    if (friends.some(friend => friend.id === user.id)) {
      throw new Error('Este usuário já é seu amigo');
    }

    // Verificar se já enviou solicitação
    if (sentRequests.some(request => request.toUserId === user.id)) {
      throw new Error('Você já enviou uma solicitação para este usuário');
    }

    const request = {
      id: Date.now().toString(),
      fromUserId: currentUserId,
      toUserId: user.id,
      fromUser: {
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar
      },
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    setSentRequests(prev => [...prev, request]);
    return request;
  };

  // Aceitar solicitação de amizade
  const acceptFriendRequest = (requestId) => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para aceitar solicitações de amizade');
    }

    const request = friendRequests.find(req => req.id === requestId);
    if (request) {
      // Adicionar aos amigos
      const newFriend = {
        id: request.fromUserId,
        username: request.fromUser.username,
        displayName: request.fromUser.displayName,
        avatar: request.fromUser.avatar,
        status: 'offline'
      };

      setFriends(prev => [...prev, newFriend]);
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    }
  };

  // Rejeitar solicitação de amizade
  const rejectFriendRequest = (requestId) => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para rejeitar solicitações de amizade');
    }

    setFriendRequests(prev => prev.filter(req => req.id !== requestId));
  };

  // Remover amigo
  const removeFriend = (friendId) => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para remover amigos');
    }

    setFriends(prev => prev.filter(friend => friend.id !== friendId));
  };

  // Cancelar solicitação enviada
  const cancelSentRequest = (requestId) => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para cancelar solicitações');
    }

    setSentRequests(prev => prev.filter(req => req.id !== requestId));
  };

  // Gerar código de amigo
  const generateFriendCode = () => {
    if (!isAuthenticated || !user) {
      throw new Error('Você precisa estar logado para gerar código de amigo');
    }

    const hash = user.username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const code = Math.abs(hash).toString(36).toUpperCase().substr(0, 6);
    return `PLAYER${code.padEnd(6, '0')}`;
  };

  // Obter amigos online
  const getOnlineFriends = () => {
    return friends.filter(friend => friend.status === 'online');
  };

  // Convidar para multiplayer
  const inviteToMultiplayer = (friendId, roomCode) => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para convidar amigos');
    }

    // Implementar lógica de convite
    console.log(`Convidando amigo ${friendId} para sala ${roomCode}`);
  };

  // Funções de referência (placeholder)
  const referFriend = () => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para referenciar amigos');
    }
  };

  const getReferralLink = () => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para obter link de referência');
    }
  };

  const processReferral = () => {
    return false;
  };

  // Carregar dados quando o usuário fizer login
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      loadFriendsData();
    }
  }, [isAuthenticated, currentUserId]);

  // Salvar dados quando houver mudanças
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      saveFriendsData();
    }
  }, [friends, friendRequests, sentRequests, isAuthenticated, currentUserId]);

  const value = {
    friends,
    friendRequests,
    sentRequests,
    isLoading,
    currentUserId,
    searchUserByCode,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    cancelSentRequest,
    generateFriendCode,
    getOnlineFriends,
    inviteToMultiplayer,
    loadFriendsData,
    referFriend,
    getReferralLink,
    processReferral
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
};

export default FriendsContext;
