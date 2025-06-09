import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { AuthCookies } from '../utils/cookies';
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
  const { isAuthenticated, userId } = useAuth();
  const currentUserId = isAuthenticated ? userId : null;

  useEffect(() => {
    if (currentUserId && isAuthenticated) {
      loadNotifications();
      loadInvitations();
      loadServerInvites(); // Carregar convites do servidor
    }
  }, [currentUserId, isAuthenticated]);

  // Carregar convites do servidor
  const loadServerInvites = async () => {
    if (!currentUserId || !isAuthenticated) {
      return;
    }

    try {
      // Obter token de múltiplas fontes
      const sessionToken = localStorage.getItem('ludomusic_session_token') ||
                           (typeof window !== 'undefined' && window.AuthCookies?.getSessionToken?.());

      const response = await fetch(`/api/get-invites?userId=${currentUserId}`, {
        headers: {
          'Authorization': sessionToken ? `Bearer ${sessionToken}` : undefined,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        return;
      }

      const result = await response.json();

      if (result.success) {
        const serverInvites = result.invites || [];

        // IMPORTANTE: Filtrar apenas convites onde o usuário atual é o DESTINATÁRIO
        const receivedInvites = serverInvites.filter(invite => {
          const isRecipient = invite.toUserId === currentUserId;
          const isNotSender = invite.fromUserId !== currentUserId;

          return isRecipient && isNotSender;
        });

        if (receivedInvites.length > 0) {
          // Mesclar convites do servidor com os locais
          const localInviteIds = invitations.map(inv => inv.id);

          // Adicionar apenas convites novos
          const newInvites = receivedInvites.filter(inv => !localInviteIds.includes(inv.id));

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

              // Mostrar notificação do navegador se permitido
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Novo Convite para Multiplayer!', {
                  body: `${invite.hostName} te convidou para jogar`,
                  icon: '/favicon.ico'
                });
              }
            });
          }
        }
      }
    } catch (error) {
      // Silent error handling
    }
  };

  // Polling OTIMIZADO para verificar novos convites e notificações - REDUZIDO para 30 segundos
  useEffect(() => {
    if (!currentUserId || !isAuthenticated) return;

    // Verificação inicial
    loadServerInvites();
    loadServerNotifications();

    const optimizedConfig = getOptimizedConfig();
    const interval = setInterval(() => {
      loadServerInvites();
      loadServerNotifications();
    }, optimizedConfig.polling.notifications); // Otimizado automaticamente
    return () => clearInterval(interval);
  }, [currentUserId, isAuthenticated]);

  // Polling adicional quando a página ganha foco
  useEffect(() => {
    if (!currentUserId || !isAuthenticated) return;

    const handleFocus = () => {
      loadServerInvites();
      loadServerNotifications();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUserId, isAuthenticated]);

  // Carregar notificações do servidor
  const loadServerNotifications = async () => {
    if (!currentUserId || !isAuthenticated) return;

    try {
      // Obter token de múltiplas fontes
      const sessionToken = localStorage.getItem('ludomusic_session_token') ||
                           (typeof window !== 'undefined' && window.AuthCookies?.getSessionToken?.());
      if (!sessionToken) return;

      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const serverNotifications = await response.json();

        // Converter notificações do servidor para o formato local
        const formattedNotifications = serverNotifications.map(notif => ({
          id: notif.id,
          type: notif.type,
          title: getNotificationTitle(notif.type, notif.message),
          message: notif.message,
          timestamp: new Date(notif.createdAt).getTime(),
          read: notif.read,
          data: notif.data || {}
        }));

        // Mesclar com notificações locais (manter notificações que não vieram do servidor)
        const localNotifications = notifications.filter(n => !n.id.startsWith('notif_server_'));
        const mergedNotifications = [...formattedNotifications, ...localNotifications]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50); // Máximo 50 notificações

        setNotifications(mergedNotifications);
        saveNotifications(mergedNotifications);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  // Função auxiliar para gerar títulos de notificação
  const getNotificationTitle = (type, message) => {
    switch (type) {
      case 'friend_request':
        return 'Novo Pedido de Amizade!';
      case 'friend_accepted':
        return 'Pedido Aceito!';
      case 'multiplayer_invite':
        return 'Convite para Multiplayer!';
      default:
        return 'Nova Notificação';
    }
  };

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
          saveNotifications(recent);
        }
      }
    } catch (error) {
      // Silent error handling
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
          saveInvitations(active);
        }
      }
    } catch (error) {
      // Silent error handling
    }
  };

  // Salvar notificações
  const saveNotifications = (newNotifications) => {
    try {
      localStorage.setItem(`ludomusic_notifications_${currentUserId}`, JSON.stringify(newNotifications));
    } catch (error) {
      // Silent error handling
    }
  };

  // Salvar convites
  const saveInvitations = (newInvitations) => {
    try {
      localStorage.setItem(`ludomusic_invitations_${currentUserId}`, JSON.stringify(newInvitations));
    } catch (error) {
      // Silent error handling
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

    // Também limpar notificações lidas após um pequeno delay para melhor UX
    setTimeout(() => {
      clearReadNotifications();
    }, 1000);
  };

  // Remover notificação
  const removeNotification = (notificationId) => {
    const updated = notifications.filter(n => n.id !== notificationId);
    setNotifications(updated);
    saveNotifications(updated);

    // Também remover do servidor se o usuário estiver autenticado
    if (currentUserId && currentUserId.startsWith('auth_')) {
      removeNotificationFromServer(notificationId);
    }
  };

  // Limpar notificações lidas
  const clearReadNotifications = () => {
    const updated = notifications.filter(n => !n.read);
    setNotifications(updated);
    saveNotifications(updated);
  };

  // Remover notificação do servidor
  const removeNotificationFromServer = async (notificationId) => {
    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token') ||
                           AuthCookies.getSessionToken();

      if (!sessionToken) return;

      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ notificationId })
      });
    } catch (error) {
      console.error('Erro ao remover notificação do servidor:', error);
    }
  };

  // 🔄 SINCRONIZAÇÃO: Remover notificação por requestId (para sincronizar com aba de amigos)
  const removeNotificationByRequestId = (requestId) => {
    const updated = notifications.filter(n =>
      !(n.type === 'friend_request' && n.data?.requestId === requestId)
    );
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
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Delay progressivo
            continue;
          } else {
            // Erro do cliente ou última tentativa
            break;
          }
        } catch (fetchError) {
          attempts++;
          if (attempts < maxAttempts) {
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
    removeNotificationByRequestId,
    clearReadNotifications,
    sendMultiplayerInvite,
    acceptMultiplayerInvite,
    declineMultiplayerInvite,
    requestNotificationPermission,
    getUnreadCount,
    getPendingInvites,
    currentUserId
  };

  // 🔄 SINCRONIZAÇÃO: Expor contexto globalmente para sincronização entre contextos
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.NotificationContext = value;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.NotificationContext;
      }
    };
  }, [value]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
