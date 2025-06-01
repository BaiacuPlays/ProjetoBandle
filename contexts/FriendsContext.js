import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { usePresence } from '../hooks/usePresence';
import { FriendsCookies } from '../utils/cookies';

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

  // ID do usuário atual (apenas se autenticado) - memoizado para performance
  const currentUserId = useMemo(() => {
    return isAuthenticated && user ? `auth_${user.username}` : null;
  }, [isAuthenticated, user]);

  // SISTEMA OTIMIZADO: Carregar dados instantaneamente quando usuário está autenticado
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      console.log('🔐 Usuário autenticado detectado:', currentUserId);
      console.log('🍪 DEBUG - Verificando cookies...');

      // 1. Carregar dados dos cookies SINCRONAMENTE (sem await/delay)
      const savedFriends = FriendsCookies.getFriendsData();
      const savedRequests = FriendsCookies.getFriendRequests();

      console.log('🍪 DEBUG - Amigos dos cookies:', savedFriends);
      console.log('🍪 DEBUG - Solicitações dos cookies:', savedRequests);

      // Verificar integridade dos dados
      const integrity = FriendsCookies.checkDataIntegrity();
      console.log('🔍 DEBUG - Integridade dos cookies:', integrity);



      // 2. Definir dados IMEDIATAMENTE (operação síncrona) - com verificação mais robusta
      if (savedFriends && savedFriends.length > 0 && integrity && integrity.anySourceWorking) {
        // Garantir que os amigos têm todos os campos necessários
        const friendsWithDefaults = savedFriends.map(friend => ({
          ...friend,
          avatar: friend.avatar || '👤',
          level: friend.level || 1,
          displayName: friend.displayName || friend.username || 'Jogador',
          status: friend.status || 'offline'
        }));

        // Definir estado SINCRONAMENTE
        setFriends(friendsWithDefaults);
        setFriendRequests(savedRequests || []);
        console.log('⚡ Dados dos amigos carregados INSTANTANEAMENTE dos cookies');
        console.log('⚡ Estado definido - friends.length:', friendsWithDefaults.length);

        // 3. Atualizar presença em background (não bloqueia)
        setTimeout(() => {
          updateFriendsPresenceInBackground(friendsWithDefaults);
        }, 100); // Pequeno delay para não interferir na renderização inicial

        // 4. Salvar novamente para reforçar os cookies (proteção contra F5 rápido)
        setTimeout(() => {
          FriendsCookies.saveFriendsData(friendsWithDefaults, savedRequests || []);
        }, 500);
      } else {
        // 4. Se não há dados nos cookies, carregar do servidor
        console.log('📭 Nenhum dado nos cookies ou cookies corrompidos, carregando do servidor...');
        loadFriendsData();
      }
    } else {
      // Limpar dados quando não autenticado
      setFriends([]);
      setFriendRequests([]);
      setSentRequests([]);
    }
  }, [isAuthenticated, currentUserId]);

  // Função para atualizar presença em background (sem bloquear exibição)
  const updateFriendsPresenceInBackground = async (currentFriendsList) => {
    if (!isAuthenticated || currentFriendsList.length === 0) return;

    try {
      console.log('🔄 Atualizando presença em background...');
      const friendIds = currentFriendsList.map(friend => friend.id);
      const presenceStatus = await getFriendsPresence(friendIds);

      // Atualizar apenas o status, mantendo todos os outros dados
      setFriends(prevFriends =>
        prevFriends.map(friend => ({
          ...friend,
          status: presenceStatus[friend.id] || friend.status || 'offline'
        }))
      );

      console.log('✅ Status de presença atualizado em background');
    } catch (error) {
      console.warn('⚠️ Erro ao buscar presença em background (não afeta exibição):', error);
      // Não fazer nada - manter dados existentes
    }
  };

  // Carregar dados dos amigos do servidor
  const loadFriendsData = async () => {
    if (!currentUserId || !isAuthenticated) {
      console.log('❌ Não é possível carregar dados: usuário não autenticado ou ID não definido');
      return;
    }

    // Verificar se já está carregando para evitar múltiplas chamadas simultâneas
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');

      if (!sessionToken) {
        setIsLoading(false);
        return;
      }

      // Carregar amigos
      const friendsResponse = await fetch('/api/friends', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json();
        const friendsList = friendsData.friends || [];

        // Salvar no localStorage como backup
        localStorage.setItem(`ludomusic_friends_${currentUserId}`, JSON.stringify(friendsList));

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

            // Salvar nos cookies após carregar com sucesso
            FriendsCookies.saveFriendsData(friendsWithStatus, friendRequests);
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

            // Salvar nos cookies mesmo sem status de presença
            FriendsCookies.saveFriendsData(friendsWithDefaults, friendRequests);
          }
        } else {
          setFriends(friendsList);
          // Salvar nos cookies
          FriendsCookies.saveFriendsData(friendsList, friendRequests);
        }
      }

      // Carregar solicitações recebidas
      const requestsResponse = await fetch('/api/friend-requests', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        const requestsList = requestsData.requests || [];
        setFriendRequests(requestsList);

        // Salvar nos cookies (atualizar com as solicitações mais recentes)
        FriendsCookies.saveFriendsData(friends, requestsList);

        // Salvar no localStorage como backup
        localStorage.setItem(`ludomusic_friend_requests_${currentUserId}`, JSON.stringify(requestsList));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados dos amigos:', error);
      // Fallback para localStorage em caso de erro
      try {
        const savedFriends = localStorage.getItem(`ludomusic_friends_${currentUserId}`);
        const savedRequests = localStorage.getItem(`ludomusic_friend_requests_${currentUserId}`);

        if (savedFriends) {
          const friendsList = JSON.parse(savedFriends);
          setFriends(friendsList);
        }
        if (savedRequests) {
          const requestsList = JSON.parse(savedRequests);
          setFriendRequests(requestsList);
        }
      } catch (localError) {
        console.error('❌ Erro ao carregar dados locais:', localError);
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

  // Salvar dados dos amigos nos cookies
  const saveFriendsData = () => {
    if (!currentUserId || !isAuthenticated) return;

    try {
      // Salvar nos cookies
      FriendsCookies.saveFriendsData(friends, friendRequests);

      // Manter backup no localStorage
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
      setFriendRequests(prev => {
        const updatedRequests = prev.filter(req => req.id !== requestId);
        // Salvar nos cookies
        FriendsCookies.saveFriendsData(friends, updatedRequests);
        return updatedRequests;
      });
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
      setFriends(prev => {
        const updatedFriends = prev.filter(friend => friend.id !== friendId);
        // Salvar nos cookies
        FriendsCookies.saveFriendsData(updatedFriends, friendRequests);
        return updatedFriends;
      });
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

    // Validar IDs antes de enviar
    if (!currentUserId) {
      throw new Error('ID do usuário atual não encontrado');
    }

    if (friendId === currentUserId) {
      throw new Error('Você não pode convidar a si mesmo');
    }

    try {
      const invitation = {
        id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'multiplayer_invite',
        fromUserId: currentUserId,  // Quem está enviando (host)
        toUserId: friendId,         // Quem vai receber (amigo)
        hostName: hostName,         // Nome do host
        friendName: friendName,     // Nome do amigo
        roomCode: roomCode,
        timestamp: Date.now(),
        status: 'pending'
      };

      const sessionToken = localStorage.getItem('ludomusic_session_token');

      if (!sessionToken) {
        throw new Error('Token de sessão não encontrado');
      }

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
        return { success: true, inviteId: data.inviteId };
      } else {
        const errorData = await response.json();
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



  // Recarregar dados quando a página ganha foco (usuário volta para a aba)
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;

    const handleFocus = () => {
      loadFriendsData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, currentUserId]);

  // Salvar dados quando houver mudanças (backup local)
  useEffect(() => {
    if (isAuthenticated && currentUserId && (friends.length > 0 || friendRequests.length > 0)) {
      saveFriendsData();
    }
  }, [friends, friendRequests, sentRequests, isAuthenticated, currentUserId]);

  // Sistema de monitoramento de cookies - verificar a cada 5 segundos
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;

    const monitorCookies = () => {
      const integrity = FriendsCookies.checkDataIntegrity();

      if (integrity) {
        console.log('🔍 Monitoramento de cookies:', integrity);

        // Se temos amigos no estado mas não nos cookies, recriar cookies
        if (friends.length > 0 && !integrity.cookiesWorking && !integrity.backupWorking) {
          console.log('⚠️ DETECTADO: Amigos no estado mas cookies perdidos! Recriando...');
          FriendsCookies.saveFriendsData(friends, friendRequests);
        }

        // Se não temos amigos no estado mas temos nos cookies, recarregar
        if (friends.length === 0 && integrity.anySourceWorking) {
          console.log('⚠️ DETECTADO: Cookies existem mas estado vazio! Recarregando...');
          const savedFriends = FriendsCookies.getFriendsData();
          const savedRequests = FriendsCookies.getFriendRequests();

          if (savedFriends.length > 0) {
            const friendsWithDefaults = savedFriends.map(friend => ({
              ...friend,
              avatar: friend.avatar || '👤',
              level: friend.level || 1,
              displayName: friend.displayName || friend.username || 'Jogador',
              status: friend.status || 'offline'
            }));
            setFriends(friendsWithDefaults);
            setFriendRequests(savedRequests);

            // Reforçar salvamento
            FriendsCookies.saveFriendsData(friendsWithDefaults, savedRequests);
          }
        }
      }
    };

    // Verificar imediatamente
    monitorCookies();

    // Verificar mais frequentemente para detectar problemas rapidamente
    const interval = setInterval(monitorCookies, 2000); // A cada 2 segundos

    // Verificação adicional após eventos de foco/blur da janela
    const handleFocus = () => {
      console.log('🔍 Janela focada - verificando cookies...');
      setTimeout(monitorCookies, 100);
    };

    const handleBeforeUnload = () => {
      // Salvar dados antes de sair da página
      if (friends.length > 0) {
        FriendsCookies.saveFriendsData(friends, friendRequests);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated, currentUserId, friends.length, friendRequests.length]);

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
