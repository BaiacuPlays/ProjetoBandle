import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getOptimizedConfig } from '../utils/performanceOptimizer';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [invitations, setInvitations] = useState([]);

  // Usar o sistema de autenticação adequado
  const { isAuthenticated, getAuthenticatedUserId } = useAuth();
  const currentUserId = isAuthenticated ? getAuthenticatedUserId() : null;

  useEffect(() => {
    if (currentUserId && isAuthenticated) {
      console.log('🔐 NotificationContext: Usuário autenticado detectado:', currentUserId);
      loadNotifications();
      loadInvitations();
      loadServerInvites(); // Carregar convites do servidor
    }
  }, [currentUserId, isAuthenticated]);

  // Carregar convites do servidor
  const loadServerInvites = async () => {
    if (!currentUserId || !isAuthenticated) {
      console.log('❌ Não é possível carregar convites: usuário não autenticado ou currentUserId não definido');
      console.log('❌ currentUserId:', currentUserId);
      console.log('❌ isAuthenticated:', isAuthenticated);
      return;
    }

    try {
      console.log(`🔍 Verificando convites para usuário: ${currentUserId}`);

      const response = await fetch(`/api/get-invites?userId=${currentUserId}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        console.error('❌ Erro ao buscar convites:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Detalhes do erro:', errorData);
        return;
      }

      const result = await response.json();
      console.log(`📥 Resposta da API de convites:`, result);

      if (result.success) {
        const serverInvites = result.invites || [];
        console.log(`📊 Total de convites no servidor: ${serverInvites.length}`);

        // IMPORTANTE: Filtrar apenas convites onde o usuário atual é o DESTINATÁRIO
        const receivedInvites = serverInvites.filter(invite => {
          const isRecipient = invite.toUserId === currentUserId;
          const isNotSender = invite.fromUserId !== currentUserId;

          console.log(`📋 Convite ${invite.id}: toUserId=${invite.toUserId}, fromUserId=${invite.fromUserId}, currentUserId=${currentUserId}`);
          console.log(`📋 É destinatário: ${isRecipient}, Não é remetente: ${isNotSender}`);

          return isRecipient && isNotSender;
        });

        console.log(`📊 Convites válidos RECEBIDOS: ${receivedInvites.length} de ${serverInvites.length} total`);

        if (receivedInvites.length > 0) {
          // Mesclar convites do servidor com os locais
          const localInviteIds = invitations.map(inv => inv.id);
          console.log(`📊 Convites locais existentes: ${localInviteIds.length}`);

          // Adicionar apenas convites novos
          const newInvites = receivedInvites.filter(inv => !localInviteIds.includes(inv.id));

          if (newInvites.length > 0) {
            console.log(`📨 ${newInvites.length} novos convites RECEBIDOS encontrados:`, newInvites);

            const updatedInvitations = [...invitations, ...newInvites];
            setInvitations(updatedInvitations);
            saveInvitations(updatedInvitations);

            // Adicionar notificações para os novos convites
            newInvites.forEach(invite => {
              console.log(`🔔 Criando notificação para convite RECEBIDO de ${invite.hostName}`);

              addNotification({
                type: 'multiplayer_invite',
                title: 'Novo Convite para Multiplayer!',
                message: `${invite.hostName} te convidou para jogar`,
                data: {
                  roomCode: invite.roomCode,
                  hostName: invite.hostName,
                  inviteId: invite.id
                }
              });

              // Mostrar notificação do navegador se permitido
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Novo Convite para Multiplayer!', {
                  body: `${invite.hostName} te convidou para jogar`,
                  icon: '/favicon.ico'
                });
              }
            });
          } else {
            console.log('📥 Nenhum convite novo encontrado');
          }
        } else {
          console.log('📥 Nenhum convite RECEBIDO no servidor');
        }
      } else {
        console.error('❌ API retornou erro:', result.error);
      }
    } catch (error) {
      console.error('❌ Erro de rede ao carregar convites do servidor:', error);
    }
  };

  // Polling OTIMIZADO para verificar novos convites - REDUZIDO para 30 segundos
  useEffect(() => {
    if (!currentUserId || !isAuthenticated) return;

    // Verificação inicial
    loadServerInvites();

    const optimizedConfig = getOptimizedConfig();
    const interval = setInterval(loadServerInvites, optimizedConfig.polling.notifications); // Otimizado automaticamente
    return () => clearInterval(interval);
  }, [currentUserId, isAuthenticated]);

  // Polling adicional quando a página ganha foco
  useEffect(() => {
    if (!currentUserId || !isAuthenticated) return;

    const handleFocus = () => {
      console.log('🔍 Página ganhou foco, verificando novos convites...');
      loadServerInvites();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUserId, isAuthenticated]);

  // Carregar notificações salvas
  const loadNotifications = () => {
    try {
      const saved = localStorage.getItem(`ludomusic_notifications_${currentUserId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filtrar notificações antigas (mais de 24 horas) E salvar a lista filtrada
        const recent = parsed.filter(n => Date.now() - n.timestamp < 24 * 60 * 60 * 1000);
        setNotifications(recent);

        // IMPORTANTE: Salvar a lista filtrada para remover notificações expiradas
        if (recent.length !== parsed.length) {
          console.log(`🧹 Removendo ${parsed.length - recent.length} notificações expiradas`);
          saveNotifications(recent);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  // Carregar convites salvos
  const loadInvitations = () => {
    try {
      const saved = localStorage.getItem(`ludomusic_invitations_${currentUserId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filtrar convites expirados (mais de 1 hora) E salvar a lista filtrada
        const active = parsed.filter(i => Date.now() - i.timestamp < 60 * 60 * 1000);
        setInvitations(active);

        // IMPORTANTE: Salvar a lista filtrada para remover convites expirados
        if (active.length !== parsed.length) {
          console.log(`🧹 Removendo ${parsed.length - active.length} convites expirados`);
          saveInvitations(active);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
    }
  };

  // Salvar notificações
  const saveNotifications = (newNotifications) => {
    try {
      localStorage.setItem(`ludomusic_notifications_${currentUserId}`, JSON.stringify(newNotifications));
    } catch (error) {
      console.error('Erro ao salvar notificações:', error);
    }
  };

  // Salvar convites
  const saveInvitations = (newInvitations) => {
    try {
      localStorage.setItem(`ludomusic_invitations_${currentUserId}`, JSON.stringify(newInvitations));
    } catch (error) {
      console.error('Erro ao salvar convites:', error);
    }
  };

  // Adicionar notificação
  const addNotification = (notification) => {
    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
      ...notification
    };

    const updated = [newNotification, ...notifications].slice(0, 50); // Máximo 50 notificações
    setNotifications(updated);
    saveNotifications(updated);

    // Mostrar notificação do navegador se permitido
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/Logo.png',
        tag: newNotification.id
      });
    }

    return newNotification.id;
  };

  // Marcar notificação como lida
  const markAsRead = (notificationId) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    saveNotifications(updated);
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  // Remover notificação
  const removeNotification = (notificationId) => {
    const updated = notifications.filter(n => n.id !== notificationId);
    setNotifications(updated);
    saveNotifications(updated);
  };

  // Enviar convite para multiplayer
  const sendMultiplayerInvite = async (friendId, friendName, roomCode, hostName) => {
    const invitation = {
      id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'multiplayer_invite',
      fromUserId: currentUserId,
      toUserId: friendId,
      hostName: hostName,
      friendName: friendName,
      roomCode: roomCode,
      timestamp: Date.now(),
      status: 'pending' // 'pending', 'accepted', 'declined', 'expired'
    };

    console.log('📤 Enviando convite:', invitation);

    try {
      // Enviar convite via API com retry
      let response;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          // Obter token de sessão para autenticação
          const sessionToken = localStorage.getItem('ludomusic_session_token');

          response = await fetch('/api/send-invite', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': sessionToken ? `Bearer ${sessionToken}` : undefined
            },
            body: JSON.stringify({
              invitation,
              currentUserId
            })
          });

          if (response.ok) {
            break; // Sucesso, sair do loop
          } else if (response.status >= 500 && attempts < maxAttempts - 1) {
            // Erro do servidor, tentar novamente
            attempts++;
            console.log(`⚠️ Tentativa ${attempts} falhou, tentando novamente...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Delay progressivo
            continue;
          } else {
            // Erro do cliente ou última tentativa
            break;
          }
        } catch (fetchError) {
          attempts++;
          if (attempts < maxAttempts) {
            console.log(`⚠️ Erro de rede na tentativa ${attempts}, tentando novamente...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            continue;
          } else {
            throw fetchError;
          }
        }
      }

      const result = await response.json();

      if (result.success) {
        // NÃO adicionar à nossa lista de convites - apenas convites RECEBIDOS devem aparecer aqui
        // O convite foi enviado com sucesso, mas não deve aparecer nas nossas notificações

        console.log('✅ Convite enviado com sucesso para:', friendName);

        // Notificar sucesso
        addNotification({
          type: 'success',
          title: 'Convite Enviado!',
          message: `Convite enviado para ${friendName}`
        });

        return invitation.id;
      } else {
        throw new Error(result.error || 'Erro ao enviar convite');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar convite:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Enviar Convite',
        message: `Não foi possível enviar o convite para ${friendName}. Tente novamente.`
      });
      return null;
    }
  };

  // Aceitar convite de multiplayer
  const acceptMultiplayerInvite = (inviteId, roomCode) => {
    // Marcar convite como aceito
    const updated = invitations.map(i => 
      i.id === inviteId ? { ...i, status: 'accepted' } : i
    );
    setInvitations(updated);
    saveInvitations(updated);

    // Redirecionar para o multiplayer com o código da sala
    if (typeof window !== 'undefined') {
      window.location.href = `/multiplayer?roomCode=${roomCode}&autoJoin=true`;
    }
  };

  // Recusar convite de multiplayer
  const declineMultiplayerInvite = (inviteId) => {
    const updated = invitations.map(i => 
      i.id === inviteId ? { ...i, status: 'declined' } : i
    );
    setInvitations(updated);
    saveInvitations(updated);
  };

  // Solicitar permissão para notificações
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Obter notificações não lidas
  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  // Obter convites pendentes
  const getPendingInvites = () => {
    return invitations.filter(i => i.status === 'pending');
  };

  const value = {
    notifications,
    invitations,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    sendMultiplayerInvite,
    acceptMultiplayerInvite,
    declineMultiplayerInvite,
    requestNotificationPermission,
    getUnreadCount,
    getPendingInvites,
    currentUserId
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
