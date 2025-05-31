import React, { createContext, useContext, useState, useEffect } from 'react';

const FriendsContext = createContext();

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends deve ser usado dentro de um FriendsProvider');
  }
  return context;
};

export const FriendsProvider = ({ children }) => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simular ID do usuário atual (em produção viria do sistema de auth)
  const currentUserId = typeof window !== 'undefined' ? 
    localStorage.getItem('ludomusic_user_id') || 'user_' + Math.random().toString(36).substr(2, 9) : 
    null;

  useEffect(() => {
    if (currentUserId && typeof window !== 'undefined') {
      localStorage.setItem('ludomusic_user_id', currentUserId);
      loadFriendsData();
    }
  }, [currentUserId]);

  // Carregar dados dos amigos
  const loadFriendsData = () => {
    try {
      setIsLoading(true);
      
      // Carregar amigos
      const savedFriends = localStorage.getItem(`ludomusic_friends_${currentUserId}`);
      if (savedFriends) {
        setFriends(JSON.parse(savedFriends));
      }

      // Carregar solicitações recebidas
      const savedRequests = localStorage.getItem(`ludomusic_friend_requests_${currentUserId}`);
      if (savedRequests) {
        setFriendRequests(JSON.parse(savedRequests));
      }

      // Carregar solicitações enviadas
      const savedSentRequests = localStorage.getItem(`ludomusic_sent_requests_${currentUserId}`);
      if (savedSentRequests) {
        setSentRequests(JSON.parse(savedSentRequests));
      }
    } catch (error) {
      console.error('Erro ao carregar dados de amigos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar dados no localStorage
  const saveFriendsData = (newFriends, newRequests, newSentRequests) => {
    try {
      if (newFriends !== undefined) {
        localStorage.setItem(`ludomusic_friends_${currentUserId}`, JSON.stringify(newFriends));
        setFriends(newFriends);
      }
      if (newRequests !== undefined) {
        localStorage.setItem(`ludomusic_friend_requests_${currentUserId}`, JSON.stringify(newRequests));
        setFriendRequests(newRequests);
      }
      if (newSentRequests !== undefined) {
        localStorage.setItem(`ludomusic_sent_requests_${currentUserId}`, JSON.stringify(newSentRequests));
        setSentRequests(newSentRequests);
      }
    } catch (error) {
      console.error('Erro ao salvar dados de amigos:', error);
    }
  };

  // Buscar usuário por código de amigo
  const searchUserByCode = async (friendCode) => {
    // Simular busca de usuário (em produção seria uma API)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simular alguns usuários para teste
        const mockUsers = [
          {
            id: 'user_123456',
            username: 'GamerPro',
            displayName: 'Gamer Pro',
            avatar: '🎮',
            level: 15,
            friendCode: 'GAMER123'
          },
          {
            id: 'user_789012',
            username: 'MusicLover',
            displayName: 'Music Lover',
            avatar: '🎵',
            level: 22,
            friendCode: 'MUSIC789'
          },
          {
            id: 'user_345678',
            username: 'ProPlayer',
            displayName: 'Pro Player',
            avatar: '⭐',
            level: 35,
            friendCode: 'PROPLAYER'
          }
        ];

        const user = mockUsers.find(u => 
          u.friendCode.toLowerCase() === friendCode.toLowerCase() ||
          u.username.toLowerCase() === friendCode.toLowerCase()
        );

        if (user && user.id !== currentUserId) {
          resolve(user);
        } else {
          resolve(null);
        }
      }, 500);
    });
  };

  // Enviar solicitação de amizade
  const sendFriendRequest = async (targetUser) => {
    try {
      // Verificar se já são amigos
      if (friends.find(f => f.id === targetUser.id)) {
        throw new Error('Vocês já são amigos!');
      }

      // Verificar se já enviou solicitação
      if (sentRequests.find(r => r.targetUserId === targetUser.id)) {
        throw new Error('Solicitação já enviada!');
      }

      const request = {
        id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromUserId: currentUserId,
        targetUserId: targetUser.id,
        targetUser: targetUser,
        sentAt: new Date().toISOString(),
        status: 'pending'
      };

      const newSentRequests = [...sentRequests, request];
      saveFriendsData(undefined, undefined, newSentRequests);

      // Simular envio para o outro usuário (em produção seria via API)
      // Por enquanto, vamos apenas adicionar à lista de solicitações enviadas

      return true;
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      throw error;
    }
  };

  // Aceitar solicitação de amizade
  const acceptFriendRequest = (requestId) => {
    try {
      const request = friendRequests.find(r => r.id === requestId);
      if (!request) {
        throw new Error('Solicitação não encontrada');
      }

      // Adicionar aos amigos
      const newFriend = {
        id: request.fromUserId,
        username: request.fromUser.username,
        displayName: request.fromUser.displayName,
        avatar: request.fromUser.avatar,
        level: request.fromUser.level,
        addedAt: new Date().toISOString(),
        status: 'online' // Simular status
      };

      const newFriends = [...friends, newFriend];
      
      // Remover da lista de solicitações
      const newRequests = friendRequests.filter(r => r.id !== requestId);

      saveFriendsData(newFriends, newRequests, undefined);

      return true;
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error);
      throw error;
    }
  };

  // Rejeitar solicitação de amizade
  const rejectFriendRequest = (requestId) => {
    try {
      const newRequests = friendRequests.filter(r => r.id !== requestId);
      saveFriendsData(undefined, newRequests, undefined);
      return true;
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      throw error;
    }
  };

  // Remover amigo
  const removeFriend = (friendId) => {
    try {
      const newFriends = friends.filter(f => f.id !== friendId);
      saveFriendsData(newFriends, undefined, undefined);
      return true;
    } catch (error) {
      console.error('Erro ao remover amigo:', error);
      throw error;
    }
  };

  // Cancelar solicitação enviada
  const cancelSentRequest = (requestId) => {
    try {
      const newSentRequests = sentRequests.filter(r => r.id !== requestId);
      saveFriendsData(undefined, undefined, newSentRequests);
      return true;
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error);
      throw error;
    }
  };

  // Gerar código de amigo único
  const generateFriendCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Obter amigos online
  const getOnlineFriends = () => {
    return friends.filter(friend => friend.status === 'online');
  };

  // Convidar amigo para multiplayer
  const inviteToMultiplayer = (friendId, roomCode) => {
    // Em produção, isso enviaria uma notificação real
    console.log(`Convite enviado para ${friendId} para a sala ${roomCode}`);

    // Simular notificação
    if (typeof window !== 'undefined' && window.showNotification) {
      const friend = friends.find(f => f.id === friendId);
      window.showNotification(`Convite enviado para ${friend?.displayName || 'amigo'}!`);
    }

    return true;
  };

  // Sistema de referência de amigos
  const referFriend = (friendEmail) => {
    // Simular envio de convite por email
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simular sucesso
        console.log(`Convite de referência enviado para ${friendEmail}`);

        // Atualizar estatísticas sociais do perfil
        if (typeof window !== 'undefined') {
          const userProfileContext = window.userProfileContext;
          if (userProfileContext && userProfileContext.updateSocialStats) {
            userProfileContext.updateSocialStats('refer_friend');
          }
        }

        resolve(true);
      }, 1000);
    });
  };

  // Obter link de referência
  const getReferralLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ludomusic.xyz';
    return `${baseUrl}?ref=${currentUserId}`;
  };

  // Processar referência (quando alguém entra via link)
  const processReferral = (referrerId) => {
    if (referrerId && referrerId !== currentUserId) {
      // Simular processamento de referência
      console.log(`Usuário ${currentUserId} foi referido por ${referrerId}`);

      // Em produção, isso seria processado no servidor
      // Por enquanto, apenas registrar localmente
      try {
        const referralData = {
          referrerId: referrerId,
          referredId: currentUserId,
          timestamp: Date.now()
        };

        localStorage.setItem(`ludomusic_referral_${currentUserId}`, JSON.stringify(referralData));

        return true;
      } catch (error) {
        console.error('Erro ao processar referência:', error);
        return false;
      }
    }
    return false;
  };

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
