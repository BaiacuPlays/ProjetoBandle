import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usePresence } from '../hooks/usePresence';

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
  const { getFriendsPresence } = usePresence();

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
        const friendsList = friendsData.friends || [];

        console.log('👥 Amigos carregados:', friendsList.length);

        // Buscar status de presença dos amigos
        if (friendsList.length > 0) {
          try {
            const friendIds = friendsList.map(friend => friend.id);
            const presenceStatus = await getFriendsPresence(friendIds);

            // Atualizar status dos amigos
            const friendsWithStatus = friendsList.map(friend => ({
              ...friend,
              // Garantir que avatar e level estão presentes
              avatar: friend.avatar || '👤',
              level: friend.level || 1,
              displayName: friend.displayName || friend.username || 'Jogador',
              status: presenceStatus[friend.id] || 'offline'
            }));

            setFriends(friendsWithStatus);
            console.log('✅ Status de presença atualizado para', friendsWithStatus.length, 'amigos');
          } catch (presenceError) {
            console.warn('Erro ao buscar presença dos amigos:', presenceError);
            // Usar dados básicos sem status de presença
            const friendsWithDefaults = friendsList.map(friend => ({
              ...friend,
              avatar: friend.avatar || '👤',
              level: friend.level || 1,
              displayName: friend.displayName || friend.username || 'Jogador',
              status: 'offline'
            }));
            setFriends(friendsWithDefaults);
          }
        } else {
          setFriends(friendsList);
        }
      } else {
        console.error('Erro ao carregar amigos:', friendsResponse.status);
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

  // Atualizar apenas status de presença dos amigos
  const updateFriendsPresence = async () => {
    if (!currentUserId || !isAuthenticated || friends.length === 0) return;

    try {
      const friendIds = friends.map(friend => friend.id);
      const presenceStatus = await getFriendsPresence(friendIds);

      setFriends(prevFriends =>
        prevFriends.map(friend => ({
          ...friend,
          status: presenceStatus[friend.id] || 'offline'
        }))
      );
    } catch (error) {
      console.error('Erro ao atualizar presença dos amigos:', error);
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
  const inviteToMultiplayer = async (friendId, friendName, roomCode, hostName) => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para convidar amigos');
    }

    if (!friendId || !roomCode || !hostName) {
      throw new Error('Dados do convite incompletos');
    }

    try {
      console.log(`📤 Enviando convite para ${friendName} (${friendId}) para sala ${roomCode}`);

      const invitation = {
        id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'multiplayer_invite',
        fromUserId: currentUserId,
        toUserId: friendId,
        hostName: hostName,
        friendName: friendName,
        roomCode: roomCode,
        timestamp: Date.now(),
        status: 'pending'
      };

      const sessionToken = localStorage.getItem('ludomusic_session_token');

      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          invitation,
          currentUserId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Convite enviado com sucesso:', data);
        return { success: true, inviteId: data.inviteId };
      } else {
        const errorData = await response.json();
        console.error('❌ Erro ao enviar convite:', errorData);
        throw new Error(errorData.error || 'Erro ao enviar convite');
      }
    } catch (error) {
      console.error('❌ Erro na função inviteToMultiplayer:', error);
      throw error;
    }
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

  // Polling para atualizar presença dos amigos a cada 15 segundos
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;

    const presenceInterval = setInterval(() => {
      updateFriendsPresence();
    }, 15000); // 15 segundos

    return () => clearInterval(presenceInterval);
  }, [isAuthenticated, currentUserId, friends.length]);

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
    updateFriendsPresence,
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
