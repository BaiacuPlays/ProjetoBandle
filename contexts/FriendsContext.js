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

  // Carregar dados dos amigos do servidor
  const loadFriendsData = async () => {
    if (!currentUserId || !isAuthenticated) return;

    setIsLoading(true);

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');

      // Carregar amigos
      const friendsResponse = await fetch('/api/friends', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json();
        setFriends(friendsData.friends || []);
      }

      // Carregar solicitações recebidas
      const requestsResponse = await fetch('/api/friend-requests', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setFriendRequests(requestsData.requests || []);
      }

      console.log('✅ Dados de amigos carregados do servidor');
    } catch (error) {
      console.error('Erro ao carregar dados dos amigos:', error);
      // Fallback para localStorage em caso de erro
      try {
        const savedFriends = localStorage.getItem(`ludomusic_friends_${currentUserId}`);
        const savedRequests = localStorage.getItem(`ludomusic_friend_requests_${currentUserId}`);

        if (savedFriends) setFriends(JSON.parse(savedFriends));
        if (savedRequests) setFriendRequests(JSON.parse(savedRequests));
      } catch (localError) {
        console.error('Erro ao carregar dados locais:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar dados dos amigos no localStorage (backup)
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

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');

      const response = await fetch('/api/friend-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          toUserId: user.id,
          toUser: {
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar solicitação');
      }

      const data = await response.json();
      const request = data.request;

      // Adicionar à lista local de solicitações enviadas
      setSentRequests(prev => [...prev, request]);

      console.log('✅ Solicitação enviada com sucesso');
      return request;
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      throw error;
    }
  };

  // Aceitar solicitação de amizade
  const acceptFriendRequest = async (requestId) => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para aceitar solicitações de amizade');
    }

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');

      const response = await fetch('/api/friend-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          requestId: requestId,
          action: 'accept'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao aceitar solicitação');
      }

      // Recarregar dados do servidor
      await loadFriendsData();

      console.log('✅ Solicitação aceita com sucesso');
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error);
      throw error;
    }
  };

  // Rejeitar solicitação de amizade
  const rejectFriendRequest = async (requestId) => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para rejeitar solicitações de amizade');
    }

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');

      const response = await fetch('/api/friend-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          requestId: requestId,
          action: 'reject'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao rejeitar solicitação');
      }

      // Remover da lista local
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));

      console.log('✅ Solicitação rejeitada com sucesso');
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      throw error;
    }
  };

  // Remover amigo
  const removeFriend = async (friendId) => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para remover amigos');
    }

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');

      const response = await fetch('/api/friends', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          friendId: friendId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover amigo');
      }

      // Remover da lista local
      setFriends(prev => prev.filter(friend => friend.id !== friendId));

      console.log('✅ Amigo removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover amigo:', error);
      throw error;
    }
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

  // Salvar dados quando houver mudanças (backup local)
  useEffect(() => {
    if (isAuthenticated && currentUserId && (friends.length > 0 || friendRequests.length > 0)) {
      saveFriendsData();
    }
  }, [friends, friendRequests, sentRequests, isAuthenticated, currentUserId]);

  // Polling para verificar novas solicitações a cada 30 segundos
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;

    const interval = setInterval(() => {
      loadFriendsData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated, currentUserId]);

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
