import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Simular ID do usuário atual
  const currentUserId = typeof window !== 'undefined' ? 
    localStorage.getItem('ludomusic_user_id') || 'user_' + Math.random().toString(36).substr(2, 9) : 
    null;

  useEffect(() => {
    if (currentUserId && typeof window !== 'undefined') {
      localStorage.setItem('ludomusic_user_id', currentUserId);
      loadNotifications();
      loadInvitations();
      loadServerInvites(); // Carregar convites do servidor
    }
  }, [currentUserId]);

  // Carregar convites do servidor
  const loadServerInvites = async () => {
    if (!currentUserId) return;

    try {
      const response = await fetch(`/api/get-invites?userId=${currentUserId}`);
      const result = await response.json();

      if (result.success && result.invites.length > 0) {
        // Mesclar convites do servidor com os locais
        const serverInvites = result.invites;
        const localInviteIds = invitations.map(inv => inv.id);

        // Adicionar apenas convites novos
        const newInvites = serverInvites.filter(inv => !localInviteIds.includes(inv.id));

        if (newInvites.length > 0) {
          const updatedInvitations = [...invitations, ...newInvites];
          setInvitations(updatedInvitations);
          saveInvitations(updatedInvitations);

          // Adicionar notificações para os novos convites
          newInvites.forEach(invite => {
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
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar convites do servidor:', error);
    }
  };

  // Polling para verificar novos convites a cada 30 segundos
  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(loadServerInvites, 30000);
    return () => clearInterval(interval);
  }, [currentUserId, invitations]);

  // Carregar notificações salvas
  const loadNotifications = () => {
    try {
      const saved = localStorage.getItem(`ludomusic_notifications_${currentUserId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filtrar notificações antigas (mais de 24 horas)
        const recent = parsed.filter(n => Date.now() - n.timestamp < 24 * 60 * 60 * 1000);
        setNotifications(recent);
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
        // Filtrar convites expirados (mais de 1 hora)
        const active = parsed.filter(i => Date.now() - i.timestamp < 60 * 60 * 1000);
        setInvitations(active);
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

    try {
      // Enviar convite via API
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitation,
          currentUserId
        })
      });

      const result = await response.json();

      if (result.success) {
        // Adicionar à nossa lista de convites enviados
        const updatedInvitations = [...invitations, invitation];
        setInvitations(updatedInvitations);
        saveInvitations(updatedInvitations);

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
      console.error('Erro ao enviar convite:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Enviar Convite',
        message: 'Não foi possível enviar o convite. Tente novamente.'
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
