// Modal simples e funcional para gerenciar amigos
import React, { useState } from 'react';
import { useSimpleFriends } from '../contexts/SimpleFriendsContext';
import { useFriends } from '../contexts/FriendsContext';
import { FaTimes, FaUsers, FaUserPlus, FaSearch, FaCheck, FaTimes as FaReject, FaTrash, FaShare, FaEye } from 'react-icons/fa';
import ReferralSystem from './ReferralSystem';
import UserAvatar from './UserAvatar';
import styles from '../styles/SimpleFriendsModal.module.css';

const SimpleFriendsModal = ({ isOpen, onClose, onViewProfile }) => {
  const {
    friends,
    requests,
    sentRequests,
    isLoading,
    searchUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
  } = useSimpleFriends();

  // Sistema de convites por link
  const { getReferralLink } = useFriends();

  const [activeTab, setActiveTab] = useState('friends');
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showReferralSystem, setShowReferralSystem] = useState(false);

  if (!isOpen) return null;

  // Buscar usuário
  const handleSearch = async () => {
    if (!searchCode.trim()) {
      setSearchError('Digite um código de usuário');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const user = await searchUser(searchCode.trim());
      setSearchResult(user);
    } catch (error) {
      setSearchError(error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Enviar solicitação
  const handleSendRequest = async (user) => {
    try {
      await sendFriendRequest(user);
      setSearchResult(null);
      setSearchCode('');
      alert('Solicitação enviada com sucesso!');
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  };

  // Aceitar solicitação
  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      alert('Solicitação aceita!');
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  };

  // Rejeitar solicitação
  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      alert('Solicitação rejeitada');
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  };

  // Remover amigo
  const handleRemoveFriend = async (friendId, friendName) => {
    if (confirm(`Tem certeza que deseja remover ${friendName} dos seus amigos?`)) {
      try {
        await removeFriend(friendId);
        alert('Amigo removido');
      } catch (error) {
        alert(`Erro: ${error.message}`);
      }
    }
  };

  // Visualizar perfil do amigo
  const handleViewProfile = (friend) => {
    if (onViewProfile) {
      onViewProfile(friend.id, friend.username);
    }
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

        <div className={styles.tabs}>
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
            <FaCheck /> Solicitações ({requests.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'add' ? styles.active : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <FaUserPlus /> Adicionar
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'invite' ? styles.active : ''}`}
            onClick={() => setActiveTab('invite')}
          >
            <FaShare /> Convidar por Link
          </button>
        </div>

        <div className={styles.content}>
          {isLoading && (
            <div className={styles.loading}>Carregando...</div>
          )}

          {activeTab === 'friends' && (
            <div className={styles.friendsList}>
              {friends.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaUsers className={styles.emptyIcon} />
                  <p>Você ainda não tem amigos adicionados.</p>
                  <p>Use a aba "Adicionar" para encontrar amigos!</p>
                </div>
              ) : (
                friends.map(friend => (
                  <div key={friend.id} className={styles.friendItem}>
                    <div className={styles.friendInfo}>
                      <UserAvatar
                        avatar={friend.avatar}
                        size="medium"
                      />
                      <div className={styles.friendDetails}>
                        <span className={styles.name}>{friend.displayName}</span>
                        <span className={styles.username}>@{friend.username}</span>
                      </div>
                    </div>
                    <div className={styles.friendActions}>
                      <button
                        className={styles.viewProfileButton}
                        onClick={() => handleViewProfile(friend)}
                        title="Ver perfil"
                      >
                        <FaEye />
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
              {requests.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaCheck className={styles.emptyIcon} />
                  <p>Nenhuma solicitação pendente.</p>
                </div>
              ) : (
                requests.map(request => (
                  <div key={request.id} className={styles.requestItem}>
                    <div className={styles.requestInfo}>
                      <UserAvatar
                        avatar={request.fromUser.avatar}
                        size="medium"
                      />
                      <div className={styles.requestDetails}>
                        <span className={styles.name}>{request.fromUser.displayName}</span>
                        <span className={styles.username}>@{request.fromUser.username}</span>
                      </div>
                    </div>
                    <div className={styles.requestActions}>
                      <button
                        className={styles.acceptButton}
                        onClick={() => handleAcceptRequest(request.id)}
                        title="Aceitar"
                      >
                        <FaCheck />
                      </button>
                      <button
                        className={styles.rejectButton}
                        onClick={() => handleRejectRequest(request.id)}
                        title="Rejeitar"
                      >
                        <FaReject />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <div className={styles.addFriend}>
              <div className={styles.searchSection}>
                <h3>Buscar Usuário</h3>
                <div className={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Digite o nome de usuário"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searchLoading}
                    className={styles.searchButton}
                  >
                    {searchLoading ? '...' : <FaSearch />}
                  </button>
                </div>
                
                {searchError && (
                  <div className={styles.error}>{searchError}</div>
                )}

                {searchResult && (
                  <div className={styles.searchResult}>
                    <div className={styles.userInfo}>
                      <UserAvatar
                        avatar={searchResult.avatar}
                        size="medium"
                      />
                      <div className={styles.userDetails}>
                        <span className={styles.name}>{searchResult.displayName}</span>
                        <span className={styles.username}>@{searchResult.username}</span>
                      </div>
                    </div>
                    <button
                      className={styles.addButton}
                      onClick={() => handleSendRequest(searchResult)}
                    >
                      <FaUserPlus /> Adicionar
                    </button>
                  </div>
                )}
              </div>

              {sentRequests.length > 0 && (
                <div className={styles.sentSection}>
                  <h3>Solicitações Enviadas ({sentRequests.length})</h3>
                  <div className={styles.sentList}>
                    {sentRequests.map(request => (
                      <div key={request.id} className={styles.sentItem}>
                        <UserAvatar
                          avatar={request.toUser.avatar}
                          size="medium"
                        />
                        <div className={styles.sentDetails}>
                          <span className={styles.name}>{request.toUser.displayName}</span>
                          <span className={styles.status}>Pendente</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'invite' && (
            <div className={styles.inviteSection}>
              <div className={styles.inviteInfo}>
                <h3>🎮 Convide Amigos para o LudoMusic!</h3>
                <p>
                  Compartilhe seu link de convite e ganhe XP quando seus amigos se cadastrarem!
                  Cada amigo que você trouxer te dá <strong>100 XP</strong> de bônus.
                </p>
              </div>

              <div className={styles.inviteActions}>
                <button
                  className={styles.openReferralButton}
                  onClick={() => setShowReferralSystem(true)}
                >
                  <FaShare /> Abrir Sistema de Convites Completo
                </button>
              </div>

              <div className={styles.quickShare}>
                <h4>Compartilhamento Rápido:</h4>
                <div className={styles.linkPreview}>
                  <input
                    type="text"
                    value={getReferralLink()}
                    readOnly
                    className={styles.linkInput}
                  />
                  <button
                    className={styles.copyLinkButton}
                    onClick={() => {
                      navigator.clipboard.writeText(getReferralLink());
                      alert('✅ Link copiado!');
                    }}
                  >
                    📋 Copiar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Sistema de Referência Completo */}
      <ReferralSystem
        isOpen={showReferralSystem}
        onClose={() => setShowReferralSystem(false)}
      />
    </div>
  );
};

export default SimpleFriendsModal;
