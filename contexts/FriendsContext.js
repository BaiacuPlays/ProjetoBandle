import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { FriendsCookies, AuthCookies } from '../utils/cookies';
import { getOptimizedConfig } from '../utils/performanceOptimizer';

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

  // ID do usuário atual (apenas se autenticado) - memoizado para performance
  const currentUserId = useMemo(() => {
    return isAuthenticated && user ? `auth_${user.username}` : null;
  }, [isAuthenticated, user]);

  // SISTEMA OTIMIZADO: Carregar dados instantaneamente quando usuário está autenticado
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      // 1. Carregar dados dos cookies SINCRONAMENTE (sem await/delay)
      const savedFriends = FriendsCookies.getFriendsData();
      const savedRequests = FriendsCookies.getFriendRequests();

      // Verificar integridade dos dados
      const integrity = FriendsCookies.checkDataIntegrity();



      // 2. Definir dados IMEDIATAMENTE (operação síncrona) - com verificação mais robusta
      if (savedFriends && savedFriends.length > 0 && integrity && integrity.anySourceWorking) {
        // Garantir que os amigos têm todos os campos necessários
        const friendsWithDefaults = savedFriends.map(friend => ({
          ...friend,
          avatar: friend.avatar || '👤',
          level: friend.level || 1,
          displayName: friend.displayName || friend.username || 'Jogador'
          // status removido - sistema de presença desabilitado
        }));

        // Definir estado SINCRONAMENTE
        setFriends(friendsWithDefaults);
        setFriendRequests(savedRequests || []);

        // Sistema de presença removido - dados carregados instantaneamente
      } else {
        // 4. Se não há dados nos cookies, carregar do servidor
        loadFriendsData(false); // Modo foreground
      }
    } else {
      // Limpar dados quando não autenticado
      setFriends([]);
      setFriendRequests([]);
      setSentRequests([]);
    }
  }, [isAuthenticated, currentUserId]);

  // Sistema de presença removido - função removida

  // Carregar dados dos amigos do servidor
  const loadFriendsData = async (backgroundMode = false) => {
    if (!currentUserId || !isAuthenticated) {
      return;
    }

    // Verificar se já está carregando para evitar múltiplas chamadas simultâneas
    if (isLoading && !backgroundMode) {
      return;
    }

    if (!backgroundMode) {
      setIsLoading(true);
    }

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

        // Sistema de presença removido - usar dados básicos
        if (friendsList.length > 0) {
          const friendsWithDefaults = friendsList.map(friend => ({
            ...friend,
            avatar: friend.avatar || '👤',
            level: friend.level || 1,
            displayName: friend.displayName || friend.username || 'Jogador'
            // status removido - sistema de presença desabilitado
          }));

          setFriends(friendsWithDefaults);

          // Salvar nos cookies após carregar com sucesso
          FriendsCookies.saveFriendsData(friendsWithDefaults, friendRequests);
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

      // Carregar solicitações enviadas
      const sentRequestsResponse = await fetch('/api/friend-requests?type=sent', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (sentRequestsResponse.ok) {
        const sentRequestsData = await sentRequestsResponse.json();
        const sentRequestsList = sentRequestsData.requests || [];
        setSentRequests(sentRequestsList);

        // Salvar no localStorage como backup
        localStorage.setItem(`ludomusic_sent_requests_${currentUserId}`, JSON.stringify(sentRequestsList));
      }
    } catch (error) {
      // Fallback para localStorage em caso de erro
      try {
        const savedFriends = localStorage.getItem(`ludomusic_friends_${currentUserId}`);
        const savedRequests = localStorage.getItem(`ludomusic_friend_requests_${currentUserId}`);
        const savedSentRequests = localStorage.getItem(`ludomusic_sent_requests_${currentUserId}`);

        if (savedFriends) {
          const friendsList = JSON.parse(savedFriends);
          setFriends(friendsList);
        }
        if (savedRequests) {
          const requestsList = JSON.parse(savedRequests);
          setFriendRequests(requestsList);
        }
        if (savedSentRequests) {
          const sentRequestsList = JSON.parse(savedSentRequests);
          setSentRequests(sentRequestsList);
        }
      } catch (localError) {
        // Silent error handling
      }
    } finally {
      if (!backgroundMode) {
        setIsLoading(false);
      }
    }
  };

  // Sistema de presença removido - função removida

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
      // Silent error handling
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
      throw error;
    }
  };

  // Enviar solicitação de amizade
  const sendFriendRequest = async (user) => {
    console.log('🔍 [DEBUG] Enviando solicitação de amizade para:', user);
    console.log('🔍 [DEBUG] isAuthenticated:', isAuthenticated);
    console.log('🔍 [DEBUG] currentUserId:', currentUserId);

    if (!isAuthenticated || !currentUserId) {
      console.log('❌ [DEBUG] Usuário não autenticado');
      throw new Error('Você precisa estar logado para enviar solicitações de amizade');
    }

    // Verificar se já é amigo
    if (friends.some(friend => friend.id === user.id)) {
      console.log('❌ [DEBUG] Usuário já é amigo');
      throw new Error('Este usuário já é seu amigo');
    }

    // Verificar se já enviou solicitação
    if (sentRequests.some(request => request.toUserId === user.id)) {
      console.log('❌ [DEBUG] Solicitação já enviada');
      throw new Error('Você já enviou uma solicitação para este usuário');
    }

    try {
      // Obter token de múltiplas fontes
      const sessionToken = localStorage.getItem('ludomusic_session_token') ||
                           AuthCookies.getSessionToken();

      console.log('🔍 [DEBUG] Token encontrado:', sessionToken ? 'SIM' : 'NÃO');

      if (!sessionToken) {
        console.log('❌ [DEBUG] Token não encontrado');
        throw new Error('Token de sessão não encontrado. Faça login novamente.');
      }

      console.log('🔍 [DEBUG] Enviando requisição para API...');

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

      console.log('🔍 [DEBUG] Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ [DEBUG] Erro da API:', errorData);
        throw new Error(errorData.error || 'Erro ao enviar solicitação');
      }

      const data = await response.json();
      const request = data.request;

      // Adicionar à lista local de solicitações enviadas
      setSentRequests(prev => [...prev, request]);
      return request;
    } catch (error) {
      throw error;
    }
  };

  // Aceitar solicitação de amizade
  const acceptFriendRequest = async (requestId) => {
    console.log('🔍 [DEBUG] Aceitando solicitação:', requestId);

    if (!isAuthenticated) {
      console.log('❌ [DEBUG] Usuário não autenticado');
      throw new Error('Você precisa estar logado para aceitar solicitações de amizade');
    }

    try {
      // Obter token de múltiplas fontes
      const sessionToken = localStorage.getItem('ludomusic_session_token') ||
                           AuthCookies.getSessionToken();

      console.log('🔍 [DEBUG] Token encontrado:', sessionToken ? 'SIM' : 'NÃO');

      if (!sessionToken) {
        console.log('❌ [DEBUG] Token não encontrado');
        throw new Error('Token de sessão não encontrado. Faça login novamente.');
      }

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

      // Verificar se há mudanças nas solicitações enviadas também
      await checkForNewFriendRequests();

      // 🔄 SINCRONIZAÇÃO: Remover notificação correspondente se existir
      if (typeof window !== 'undefined' && window.NotificationContext) {
        const { removeNotificationByRequestId } = window.NotificationContext;
        if (removeNotificationByRequestId) {
          removeNotificationByRequestId(requestId);
        }
      }
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
      // Obter token de múltiplas fontes
      const sessionToken = localStorage.getItem('ludomusic_session_token') ||
                           AuthCookies.getSessionToken();

      if (!sessionToken) {
        throw new Error('Token de sessão não encontrado. Faça login novamente.');
      }

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

      // 🔄 SINCRONIZAÇÃO: Remover notificação correspondente se existir
      if (typeof window !== 'undefined' && window.NotificationContext) {
        const { removeNotificationByRequestId } = window.NotificationContext;
        if (removeNotificationByRequestId) {
          removeNotificationByRequestId(requestId);
        }
      }
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
      throw error;
    }
  };

  // Cancelar solicitação enviada
  const cancelSentRequest = async (requestId) => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para cancelar solicitações');
    }

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');

      const response = await fetch('/api/friend-requests', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ requestId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cancelar solicitação');
      }

      // Remover da lista local
      setSentRequests(prev => prev.filter(req => req.id !== requestId));

      // Atualizar localStorage
      const updatedSentRequests = sentRequests.filter(req => req.id !== requestId);
      localStorage.setItem(`ludomusic_sent_requests_${currentUserId}`, JSON.stringify(updatedSentRequests));

    } catch (error) {
      throw error;
    }
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
      throw error;
    }
  };

  // Funções de referência
  const referFriend = async (email) => {
    if (!isAuthenticated) {
      throw new Error('Você precisa estar logado para referenciar amigos');
    }

    if (!email || !email.includes('@')) {
      throw new Error('Email inválido');
    }

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          action: 'send_invite',
          email: email.trim().toLowerCase()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar convite');
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const getReferralLink = () => {
    if (!isAuthenticated || !currentUserId) {
      return `${window.location.origin}?ref=DEMO123`;
    }

    // Gerar código de referência baseado no ID do usuário
    const referralCode = currentUserId.replace('auth_', '').slice(-8).toUpperCase();
    return `${window.location.origin}?ref=${referralCode}`;
  };

  const processReferral = async (referralCode) => {
    if (!referralCode || !isAuthenticated) {
      return false;
    }

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          action: 'process_referral',
          referralCode: referralCode.toUpperCase()
        })
      });

      const data = await response.json();
      return response.ok ? data : false;
    } catch (error) {
      return false;
    }
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
        // Se temos amigos no estado mas não nos cookies, recriar cookies
        if (friends.length > 0 && !integrity.cookiesWorking && !integrity.backupWorking) {
          FriendsCookies.saveFriendsData(friends, friendRequests);
        }

        // Se não temos amigos no estado mas temos nos cookies, recarregar
        if (friends.length === 0 && integrity.anySourceWorking) {
          const savedFriends = FriendsCookies.getFriendsData();
          const savedRequests = FriendsCookies.getFriendRequests();

          if (savedFriends.length > 0) {
            const friendsWithDefaults = savedFriends.map(friend => ({
              ...friend,
              avatar: friend.avatar || '👤',
              level: friend.level || 1,
              displayName: friend.displayName || friend.username || 'Jogador'
              // status removido - sistema de presença desabilitado
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

    // Verificação menos frequente para reduzir overhead
    const interval = setInterval(monitorCookies, 10000); // A cada 10 segundos

    // Verificação apenas no foco da janela
    const handleFocus = () => {
      monitorCookies();
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

  // Polling ULTRA-OTIMIZADO para verificar novas solicitações - REDUZIDO para 60 segundos
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;

    // Verificação inicial imediata
    checkForNewFriendRequests();

    // Polling ULTRA-OTIMIZADO com configuração automática
    const optimizedConfig = getOptimizedConfig();
    const interval = setInterval(() => {
      checkForNewFriendRequests();
    }, optimizedConfig.polling.friends); // Otimizado automaticamente

    // Verificar quando a janela ganha foco (usuário volta para a aba)
    const handleFocus = () => {
      checkForNewFriendRequests();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, currentUserId]);

  // Função para verificar novas solicitações de amizade (com debounce)
  const checkForNewFriendRequests = useCallback(async () => {
    if (!isAuthenticated || !currentUserId) return;

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      if (!sessionToken) return;

      // Verificar solicitações recebidas
      const receivedResponse = await fetch('/api/friend-requests', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (receivedResponse.ok) {
        const receivedData = await receivedResponse.json();
        const newRequests = receivedData.requests || [];

        // Verificar se há novas solicitações comparando com o estado atual
        const currentRequestIds = friendRequests.map(req => req.id);
        const actualNewRequests = newRequests.filter(req => !currentRequestIds.includes(req.id));

        if (actualNewRequests.length > 0) {
          // Process new requests silently
        }

        // Atualizar estado sempre (para remover solicitações processadas)
        setFriendRequests(newRequests);

        // Atualizar localStorage
        localStorage.setItem(`ludomusic_friend_requests_${currentUserId}`, JSON.stringify(newRequests));
      }

      // Verificar solicitações enviadas (para remover as que foram aceitas/rejeitadas)
      const sentResponse = await fetch('/api/friend-requests?type=sent', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (sentResponse.ok) {
        const sentData = await sentResponse.json();
        const updatedSentRequests = sentData.requests || [];

        // Verificar se alguma solicitação enviada foi removida (aceita/rejeitada)
        const currentSentIds = sentRequests.map(req => req.id);
        const removedSentRequests = currentSentIds.filter(id =>
          !updatedSentRequests.some(req => req.id === id)
        );

        if (removedSentRequests.length > 0) {
          // Process removed requests silently
        }

        // Atualizar estado das solicitações enviadas
        setSentRequests(updatedSentRequests);

        // Atualizar localStorage
        localStorage.setItem(`ludomusic_sent_requests_${currentUserId}`, JSON.stringify(updatedSentRequests));
      }

    } catch (error) {
      // Silent error handling
    }
  }, [isAuthenticated, currentUserId, friendRequests, sentRequests]);

  // Sistema de presença removido - polling removido

  // Polling duplicado removido - já está sendo feito no useEffect anterior



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

  // 🔄 SINCRONIZAÇÃO: Expor contexto globalmente para testes e sincronização
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.FriendsContext = value;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.FriendsContext;
      }
    };
  }, [value]);

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
};

export default FriendsContext;
