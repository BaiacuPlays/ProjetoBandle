import React, { useState } from 'react';
import { useFriends } from '../contexts/FriendsContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { FaTimes, FaUserPlus, FaSearch, FaUsers, FaUserFriends, FaPaperPlane, FaCheck, FaTimes as FaReject, FaTrash, FaGamepad, FaShare } from 'react-icons/fa';
import UserAvatar from './UserAvatar';
import MultiplayerInviteModal from './MultiplayerInviteModal';
import ReferralSystem from './ReferralSystem';
import styles from '../styles/FriendsManager.module.css';

const FriendsManager = ({ isOpen, onClose }) => {
  // Bloquear/desbloquear scroll da página
  useModalScrollLock(isOpen);
  const {
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
    inviteToMultiplayer
  } = useFriends();

  const { sendMultiplayerInvite } = useNotifications();
  const { profile } = useUserProfile();

  // Gerar código de amigo fixo baseado no perfil
  const getFriendCode = () => {
    // Tentar usar o ID do perfil primeiro, depois o currentUserId
    let baseId = profile?.id || currentUserId;

    // Se ainda não tiver ID, usar um padrão temporário
    if (!baseId) {
      return 'LOADING...';
    }

    // Usar o ID para gerar um código consistente
    const hash = baseId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const code = Math.abs(hash).toString(36).toUpperCase().substr(0, 6);
    return `PLAYER${code.padEnd(6, '0')}`;
  };

  const [activeTab, setActiveTab] = useState('friends');
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showReferralSystem, setShowReferralSystem] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchCode.trim()) {
      setSearchError('Digite um código de amigo');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const user = await searchUserByCode(searchCode.trim());
      if (user) {
        setSearchResult(user);
      } else {
        setSearchError('Usuário não encontrado');
      }
    } catch (error) {
      setSearchError('Erro ao buscar usuário');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (user) => {
    try {
      await sendFriendRequest(user);
      setSearchResult(null);
      setSearchCode('');
      alert('Solicitação enviada com sucesso!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      alert('Amigo adicionado com sucesso!');
    } catch (error) {
      alert('Erro ao aceitar solicitação');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
    } catch (error) {
      alert('Erro ao rejeitar solicitação');
    }
  };

  const handleRemoveFriend = async (friendId, friendName) => {
    if (confirm(`Tem certeza que deseja remover ${friendName} da sua lista de amigos?`)) {
      try {
        await removeFriend(friendId);
        alert('Amigo removido com sucesso');
      } catch (error) {
        alert('Erro ao remover amigo');
      }
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await cancelSentRequest(requestId);
    } catch (error) {
      alert('Erro ao cancelar solicitação');
    }
  };

  const handleInviteToGame = (friendId, friendName) => {
    setSelectedFriend({ id: friendId, name: friendName });
    setShowInviteModal(true);
  };

  const handleCreateRoomAndInvite = async () => {
    // Esta função será chamada pelo modal de convite
    // Por enquanto, simular criação de sala
    const roomCode = 'ROOM' + Math.random().toString(36).substr(2, 6).toUpperCase();

    if (selectedFriend) {
      sendMultiplayerInvite(
        selectedFriend.id,
        selectedFriend.name,
        roomCode,
        profile?.displayName || 'Jogador'
      );
    }

    return roomCode;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Amigos</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tab} ${activeTab === 'friends' ? styles.active : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <FaUsers /> Amigos ({friends.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'requests' ? styles.active : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <FaUserFriends /> Solicitações ({friendRequests.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'add' ? styles.active : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <FaUserPlus /> Adicionar
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'refer' ? styles.active : ''}`}
            onClick={() => setActiveTab('refer')}
          >
            <FaShare /> Convidar
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'friends' && (
            <div className={styles.friendsList}>
              {friends.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaUsers className={styles.emptyIcon} />
                  <p>Você ainda não tem amigos adicionados.</p>
                  <p>Use a aba "Adicionar" para encontrar e adicionar amigos!</p>
                </div>
              ) : (
                friends.map(friend => (
                  <div key={friend.id} className={styles.friendItem}>
                    <div className={styles.friendInfo}>
                      <UserAvatar
                        avatar={friend.avatar}
                        size="medium"
                        className={friend.status === 'online' ? styles.online : styles.offline}
                      />
                      <div className={styles.friendDetails}>
                        <span className={styles.friendName}>{friend.displayName}</span>
                        <span className={styles.friendUsername}>@{friend.username}</span>
                        <span className={styles.friendLevel}>Nível {friend.level}</span>
                      </div>
                    </div>
                    <div className={styles.friendActions}>
                      <button
                        className={styles.inviteButton}
                        onClick={() => handleInviteToGame(friend.id, friend.displayName)}
                        title="Convidar para jogar"
                      >
                        <FaGamepad />
                      </button>
                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemoveFriend(friend.id, friend.displayName)}
                        title="Remover amigo"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className={styles.requestsList}>
              <div className={styles.requestsSection}>
                <h4>Solicitações Recebidas ({friendRequests.length})</h4>
                {friendRequests.length === 0 ? (
                  <p className={styles.noRequests}>Nenhuma solicitação pendente</p>
                ) : (
                  friendRequests.map(request => (
                    <div key={request.id} className={styles.requestItem}>
                      <div className={styles.requestInfo}>
                        <UserAvatar
                          avatar={request.fromUser?.avatar}
                          size="medium"
                        />
                        <div className={styles.requestDetails}>
                          <span className={styles.requestName}>{request.fromUser?.displayName}</span>
                          <span className={styles.requestUsername}>@{request.fromUser?.username}</span>
                          <span className={styles.requestDate}>
                            {new Date(request.sentAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className={styles.requestActions}>
                        <button
                          className={styles.acceptButton}
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <FaCheck />
                        </button>
                        <button
                          className={styles.rejectButton}
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <FaReject />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.requestsSection}>
                <h4>Solicitações Enviadas ({sentRequests.length})</h4>
                {sentRequests.length === 0 ? (
                  <p className={styles.noRequests}>Nenhuma solicitação enviada</p>
                ) : (
                  sentRequests.map(request => (
                    <div key={request.id} className={styles.requestItem}>
                      <div className={styles.requestInfo}>
                        <UserAvatar
                          avatar={request.targetUser?.avatar}
                          size="medium"
                        />
                        <div className={styles.requestDetails}>
                          <span className={styles.requestName}>{request.targetUser?.displayName}</span>
                          <span className={styles.requestUsername}>@{request.targetUser?.username}</span>
                          <span className={styles.requestDate}>
                            Enviada em {new Date(request.sentAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className={styles.requestActions}>
                        <button
                          className={styles.cancelButton}
                          onClick={() => handleCancelRequest(request.id)}
                          title="Cancelar solicitação"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'add' && (
            <div className={styles.addFriend}>
              <div className={styles.searchSection}>
                <h4>Buscar Amigos</h4>
                <p>Digite o código de amigo ou nome de usuário:</p>
                
                <div className={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Ex: GAMER123 ou @username"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    className={styles.searchInput}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    className={styles.searchButton}
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? '...' : <FaSearch />}
                  </button>
                </div>

                {searchError && (
                  <p className={styles.searchError}>{searchError}</p>
                )}

                {searchResult && (
                  <div className={styles.searchResult}>
                    <div className={styles.userFound}>
                      <UserAvatar
                        avatar={searchResult.avatar}
                        size="large"
                      />
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{searchResult.displayName}</span>
                        <span className={styles.userUsername}>@{searchResult.username}</span>
                        <span className={styles.userLevel}>Nível {searchResult.level}</span>
                      </div>
                      <button
                        className={styles.addButton}
                        onClick={() => handleSendRequest(searchResult)}
                      >
                        <FaUserPlus /> Adicionar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.friendCodeSection}>
                <h4>Seu Código de Amigo</h4>
                <p>Compartilhe este código para que outros possam te adicionar:</p>
                <div className={styles.friendCode}>
                  <span>{getFriendCode()}</span>
                  <button
                    className={styles.copyButton}
                    onClick={() => {
                      navigator.clipboard.writeText(getFriendCode());
                      alert('Código copiado!');
                    }}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'refer' && (
            <div className={styles.referTab}>
              <div className={styles.referInfo}>
                <h4>Sistema de Referência</h4>
                <p>Convide amigos e ganhe recompensas especiais!</p>

                <button
                  className={styles.openReferralButton}
                  onClick={() => setShowReferralSystem(true)}
                >
                  <FaShare /> Abrir Sistema de Convites
                </button>
              </div>

              <div className={styles.referStats}>
                <h5>Suas Estatísticas de Referência:</h5>
                <div className={styles.referStatsGrid}>
                  <div className={styles.referStatItem}>
                    <span className={styles.referStatNumber}>
                      {profile?.socialStats?.friendsReferred || 0}
                    </span>
                    <span className={styles.referStatLabel}>Amigos Referidos</span>
                  </div>
                  <div className={styles.referStatItem}>
                    <span className={styles.referStatNumber}>
                      {(profile?.socialStats?.friendsReferred || 0) * 100}
                    </span>
                    <span className={styles.referStatLabel}>XP Ganho</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de convite para multiplayer */}
      <MultiplayerInviteModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setSelectedFriend(null);
        }}
        onCreateRoom={handleCreateRoomAndInvite}
      />

      {/* Sistema de referência */}
      <ReferralSystem
        isOpen={showReferralSystem}
        onClose={() => setShowReferralSystem(false)}
      />
    </div>
  );
};

export default FriendsManager;
