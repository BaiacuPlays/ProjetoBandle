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
  // 🔒 SISTEMA DE AMIGOS DESABILITADO - APENAS PARA USUÁRIOS AUTENTICADOS
  // Por enquanto, retornar um provider vazio para evitar problemas de SSR
  const [friends] = useState([]);
  const [friendRequests] = useState([]);
  const [sentRequests] = useState([]);
  const [isLoading] = useState(false);
  const currentUserId = null; // Desabilitado por segurança

  // 🔒 FUNÇÕES DESABILITADAS POR SEGURANÇA
  const loadFriendsData = () => {
    console.warn('Sistema de amigos desabilitado para usuários não autenticados');
  };

  const saveFriendsData = () => {
    throw new Error('Você precisa estar logado para usar o sistema de amigos');
  };

  const searchUserByCode = async () => {
    throw new Error('Você precisa estar logado para buscar usuários');
  };

  const sendFriendRequest = async () => {
    throw new Error('Você precisa estar logado para enviar solicitações de amizade');
  };

  const acceptFriendRequest = () => {
    throw new Error('Você precisa estar logado para aceitar solicitações de amizade');
  };

  const rejectFriendRequest = () => {
    throw new Error('Você precisa estar logado para rejeitar solicitações de amizade');
  };

  const removeFriend = () => {
    throw new Error('Você precisa estar logado para remover amigos');
  };

  const cancelSentRequest = () => {
    throw new Error('Você precisa estar logado para cancelar solicitações');
  };

  const generateFriendCode = () => {
    throw new Error('Você precisa estar logado para gerar código de amigo');
  };

  const getOnlineFriends = () => {
    return [];
  };

  const inviteToMultiplayer = () => {
    throw new Error('Você precisa estar logado para convidar amigos');
  };

  const referFriend = () => {
    throw new Error('Você precisa estar logado para referenciar amigos');
  };

  const getReferralLink = () => {
    throw new Error('Você precisa estar logado para obter link de referência');
  };

  const processReferral = () => {
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
