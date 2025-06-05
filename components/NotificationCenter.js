import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useFriends } from '../contexts/FriendsContext';
import { FaBell, FaTimes, FaCheck, FaGamepad, FaUsers, FaTrophy, FaInfo } from 'react-icons/fa';
import styles from '../styles/NotificationCenter.module.css';

const NotificationCenter = () => {
  const {
    notifications,
    invitations,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearReadNotifications,
    acceptMultiplayerInvite,
    declineMultiplayerInvite,
    getUnreadCount,
    getPendingInvites
  } = useNotifications();

  const { acceptFriendRequest, rejectFriendRequest } = useFriends();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');

  const unreadCount = getUnreadCount();
  const pendingInvites = getPendingInvites();

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(`.${styles.notificationCenter}`)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'multiplayer_invite':
        return <FaGamepad className={styles.iconMultiplayer} />;
      case 'friend_request':
        return <FaUsers className={styles.iconFriend} />;
      case 'achievement':
        return <FaTrophy className={styles.iconAchievement} />;
      case 'info':
      default:
        return <FaInfo className={styles.iconInfo} />;
    }
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Ações específicas por tipo de notificação
    if (notification.type === 'multiplayer_invite' && notification.data?.roomCode) {
      acceptMultiplayerInvite(notification.data.inviteId, notification.data.roomCode);
    }
  };

  const handleAcceptFriendRequest = async (notification) => {
    try {
      await acceptFriendRequest(notification.data.requestId);
      removeNotification(notification.id);

      // 🔄 SINCRONIZAÇÃO: A função acceptFriendRequest já cuida da sincronização
      // com a aba de amigos através do recarregamento de dados
    } catch (error) {
      console.error('Erro ao aceitar pedido de amizade:', error);
      // Mostrar erro para o usuário
      alert('Erro ao aceitar pedido de amizade: ' + error.message);
    }
  };

  const handleRejectFriendRequest = async (notification) => {
    try {
      await rejectFriendRequest(notification.data.requestId);
      removeNotification(notification.id);

      // 🔄 SINCRONIZAÇÃO: A função rejectFriendRequest já cuida da sincronização
      // com a aba de amigos através da atualização da lista local
    } catch (error) {
      console.error('Erro ao rejeitar pedido de amizade:', error);
      // Mostrar erro para o usuário
      alert('Erro ao rejeitar pedido de amizade: ' + error.message);
    }
  };

  return (
    <div className={styles.notificationCenter}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificações"
      >
        <FaBell size={20} />
        {(unreadCount > 0 || pendingInvites.length > 0) && (
          <span className={styles.badge}>
            {unreadCount + pendingInvites.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Notificações</h3>
            <div className={styles.headerActions}>
              {(notifications.length > 0 || invitations.length > 0) && (
                <button
                  className={styles.markAllRead}
                  onClick={markAllAsRead}
                >
                  Marcar todas como lidas
                </button>
              )}
              {notifications.filter(n => n.read).length > 0 && (
                <button
                  className={styles.clearRead}
                  onClick={clearReadNotifications}
                  title="Limpar notificações lidas"
                >
                  🗑️ Limpar lidas
                </button>
              )}
            </div>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'notifications' ? styles.active : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notificações ({unreadCount})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'invites' ? styles.active : ''}`}
              onClick={() => setActiveTab('invites')}
            >
              Convites ({pendingInvites.length})
            </button>
          </div>

          <div className={styles.content}>
            {activeTab === 'notifications' && (
              <div className={styles.notificationsList}>
                {notifications.length === 0 ? (
                  <div className={styles.empty}>
                    <FaBell className={styles.emptyIcon} />
                    <p>Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''} ${notification.type === 'friend_request' ? styles.friendRequest : ''}`}
                    >
                      <div className={styles.notificationIcon}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className={styles.notificationContent}>
                        <div className={styles.notificationTitle}>
                          {notification.title}
                        </div>
                        <div className={styles.notificationMessage}>
                          {notification.message}
                        </div>
                        <div className={styles.notificationTime}>
                          {formatTime(notification.timestamp)}
                        </div>

                        {/* Ações para pedidos de amizade */}
                        {notification.type === 'friend_request' && notification.data?.requestId && (
                          <div className={styles.friendRequestActions}>
                            <button
                              className={styles.acceptButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptFriendRequest(notification);
                              }}
                            >
                              <FaCheck /> Aceitar
                            </button>
                            <button
                              className={styles.declineButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectFriendRequest(notification);
                              }}
                            >
                              <FaTimes /> Recusar
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Botão de remover apenas para notificações que não são pedidos de amizade */}
                      {notification.type !== 'friend_request' && (
                        <button
                          className={styles.removeButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'invites' && (
              <div className={styles.invitesList}>
                {pendingInvites.length === 0 ? (
                  <div className={styles.empty}>
                    <FaGamepad className={styles.emptyIcon} />
                    <p>Nenhum convite pendente</p>
                  </div>
                ) : (
                  pendingInvites.map(invite => (
                    <div key={invite.id} className={styles.inviteItem}>
                      <div className={styles.inviteIcon}>
                        <FaGamepad className={styles.iconMultiplayer} />
                      </div>
                      <div className={styles.inviteContent}>
                        <div className={styles.inviteTitle}>
                          Convite para Multiplayer
                        </div>
                        <div className={styles.inviteMessage}>
                          {invite.hostName} te convidou para jogar
                        </div>
                        <div className={styles.inviteRoom}>
                          Sala: {invite.roomCode}
                        </div>
                        <div className={styles.inviteTime}>
                          {formatTime(invite.timestamp)}
                        </div>
                      </div>
                      <div className={styles.inviteActions}>
                        <button
                          className={styles.acceptButton}
                          onClick={() => acceptMultiplayerInvite(invite.id, invite.roomCode)}
                        >
                          <FaCheck /> Aceitar
                        </button>
                        <button
                          className={styles.declineButton}
                          onClick={() => declineMultiplayerInvite(invite.id)}
                        >
                          <FaTimes /> Recusar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
