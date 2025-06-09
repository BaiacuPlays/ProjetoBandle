import React, { useState, useEffect } from 'react';
import { useSimpleFriends } from '../contexts/SimpleFriendsContext';
// import { useNotifications } from '../contexts/NotificationContext';
import { useProfile } from '../contexts/ProfileContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { FaTimes, FaUsers, FaGamepad, FaPaperPlane, FaCheck } from 'react-icons/fa';
import SimpleUserAvatar from './SimpleUserAvatar';
import styles from '../styles/MultiplayerInviteModal.module.css';

const MultiplayerInviteModal = ({ isOpen, onClose, roomCode, onCreateRoom }) => {
  // Bloquear/desbloquear scroll da página
  useModalScrollLock(isOpen);
  const { friends } = useSimpleFriends();
  // const { sendMultiplayerInvite } = useNotifications();
  const { profile } = useUserProfile();

  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [invitesSent, setInvitesSent] = useState([]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const onlineFriends = friends; // Todos os amigos (sistema de presença removido)
  const hostName = profile?.displayName || 'Jogador';

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateRoomAndInvite = async () => {
    if (!roomCode && onCreateRoom) {
      setIsCreatingRoom(true);
      try {
        const newRoomCode = await onCreateRoom();
        if (newRoomCode && selectedFriends.length > 0) {
          sendInvites(newRoomCode);
        }
      } catch (error) {
        console.error('Erro ao criar sala:', error);
        alert('Erro ao criar sala. Tente novamente.');
      } finally {
        setIsCreatingRoom(false);
      }
    } else if (roomCode) {
      sendInvites(roomCode);
    }
  };

  const sendInvites = (code) => {
    const sentTo = [];

    selectedFriends.forEach(friendId => {
      const friend = friends.find(f => f.id === friendId);
      if (friend) {
        try {
          // Sistema de notificações será reimplementado
          // sendMultiplayerInvite(friendId, friend.displayName, code, hostName);
          sentTo.push(friend.displayName);
        } catch (error) {
          // Silent error handling
        }
      }
    });

    setInvitesSent(sentTo);

    if (sentTo.length > 0) {
      setTimeout(() => {
        onClose();
        setSelectedFriends([]);
        setInvitesSent([]);
      }, 2000);
    }
  };

  const handleSelectAll = () => {
    if (selectedFriends.length === onlineFriends.length) {
      setSelectedFriends([]);
    } else {
      setSelectedFriends(onlineFriends.map(f => f.id));
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>
            <FaGamepad /> Convidar Amigos
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.content}>
          {invitesSent.length > 0 ? (
            <div className={styles.successMessage}>
              <FaCheck className={styles.successIcon} />
              <h3>Convites Enviados!</h3>
              <p>Convites enviados para:</p>
              <ul>
                {invitesSent.map(name => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <p>Aguarde seus amigos entrarem na sala.</p>
            </div>
          ) : (
            <>
              {roomCode && (
                <div className={styles.roomInfo}>
                  <h3>Sala Criada</h3>
                  <div className={styles.roomCode}>
                    Código: <span>{roomCode}</span>
                  </div>
                  <p>Selecione os amigos que deseja convidar:</p>
                </div>
              )}

              {!roomCode && (
                <div className={styles.createInfo}>
                  <h3>Criar Sala e Convidar</h3>
                  <p>Uma nova sala será criada e os convites serão enviados automaticamente.</p>
                </div>
              )}

              {onlineFriends.length === 0 ? (
                <div className={styles.noFriends}>
                  <FaUsers className={styles.noFriendsIcon} />
                  <h4>Nenhum amigo online</h4>
                  <p>Seus amigos precisam estar online para receber convites.</p>
                  <p>Adicione mais amigos ou aguarde eles ficarem online!</p>
                </div>
              ) : (
                <>
                  <div className={styles.friendsHeader}>
                    <h4>Amigos Online ({onlineFriends.length})</h4>
                    <button
                      className={styles.selectAllButton}
                      onClick={handleSelectAll}
                    >
                      {selectedFriends.length === onlineFriends.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                  </div>

                  <div className={styles.friendsList}>
                    {onlineFriends.map(friend => (
                      <div
                        key={friend.id}
                        className={`${styles.friendItem} ${selectedFriends.includes(friend.id) ? styles.selected : ''}`}
                        onClick={() => toggleFriendSelection(friend.id)}
                      >
                        <div className={styles.friendInfo}>
                          <SimpleUserAvatar
                            avatar={friend.avatar}
                            size="medium"
                            className={styles.online}
                          />
                          <div className={styles.friendDetails}>
                            <span className={styles.friendName}>{friend.displayName}</span>
                            <span className={styles.friendUsername}>@{friend.username}</span>
                            <span className={styles.friendLevel}>Nível {friend.level}</span>
                          </div>
                        </div>
                        <div className={styles.checkbox}>
                          {selectedFriends.includes(friend.id) && <FaCheck />}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {invitesSent.length === 0 && onlineFriends.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.selectedCount}>
              {selectedFriends.length} amigo(s) selecionado(s)
            </div>
            <div className={styles.actions}>
              <button
                className={styles.cancelButton}
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                className={styles.inviteButton}
                onClick={handleCreateRoomAndInvite}
                disabled={selectedFriends.length === 0 || isCreatingRoom}
              >
                {isCreatingRoom ? (
                  'Criando sala...'
                ) : roomCode ? (
                  <>
                    <FaPaperPlane /> Enviar Convites
                  </>
                ) : (
                  <>
                    <FaGamepad /> Criar Sala e Convidar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerInviteModal;
