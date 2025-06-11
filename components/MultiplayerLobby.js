import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMultiplayerContext } from '../contexts/MultiplayerContext';
import { useFriends } from '../contexts/FriendsContext';
import { FaUserPlus, FaQuestionCircle } from 'react-icons/fa';
import MultiplayerInviteModal from './MultiplayerInviteModal';
import MultiplayerModal from './MultiplayerModal';
import styles from '../styles/Multiplayer.module.css';

const MultiplayerLobby = ({ onGameStart }) => {
  const { t, isClient } = useLanguage();
  const { state, actions } = useMultiplayerContext();
  const { friends } = useFriends();
  const {
    roomCode,
    playerNickname: nickname,
    lobbyData,
    isLoading,
    error
  } = state;

  const [formData, setFormData] = useState({
    nickname: '',
    roomCode: ''
  });
  const [mode, setMode] = useState('menu'); // 'menu', 'create', 'join', 'waiting'
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [selectedRounds, setSelectedRounds] = useState(10); // Número de rodadas selecionado

  // Detectar quando o jogo foi iniciado (backup do polling)
  useEffect(() => {
    if (lobbyData && lobbyData.gameStarted && mode === 'waiting') {
      onGameStart();
    }
  }, [lobbyData?.gameStarted, onGameStart, mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!formData.nickname.trim()) {
      actions.setError(isClient ? t('nickname_required') : 'Nickname é obrigatório');
      setTimeout(() => actions.setError(''), 3000);
      return;
    }

    try {
      const result = await actions.createRoom(formData.nickname.trim());
      console.log('Room creation result:', result);
      setMode('waiting');
      actions.setError(''); // Limpar qualquer erro anterior
    } catch (err) {
      console.error('Error in handleCreateRoom:', err);
      console.error('Error stack:', err.stack);
      // Erro já foi tratado no contexto
      setTimeout(() => actions.setError(''), 5000);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!formData.nickname.trim()) {
      actions.setError(isClient ? t('nickname_required') : 'Nickname é obrigatório');
      setTimeout(() => actions.setError(''), 3000);
      return;
    }
    if (!formData.roomCode.trim()) {
      actions.setError(isClient ? t('room_code_required') : 'Código da sala é obrigatório');
      setTimeout(() => actions.setError(''), 3000);
      return;
    }

    try {
      await actions.joinRoom(formData.roomCode.trim().toUpperCase(), formData.nickname.trim());
      setMode('waiting');
      actions.setError(''); // Limpar qualquer erro anterior
    } catch (err) {
      // Erro já foi tratado no contexto
      setTimeout(() => actions.setError(''), 5000);
    }
  };

  const handleStartGame = async () => {
    if (isLoading) return;

    try {
      await actions.startGame(selectedRounds);
      onGameStart();
    } catch (err) {
      // Erro já foi tratado no contexto
    }
  };

  const handleLeaveRoom = async () => {
    actions.reset();
    setMode('menu');
    setFormData({ nickname: '', roomCode: '' });
  };

  const isHost = lobbyData?.host === nickname;
  const canStartGame = (lobbyData?.players?.length || 0) >= 2;

  // Menu inicial
  if (mode === 'menu') {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.lobbyContainer}>
            <div className={styles.titleContainer}>
              <h1 className={styles.title}>
                {isClient ? t('multiplayer') : 'Multiplayer'}
              </h1>
              <div className={styles.headerButtons}>
                <button
                  className={styles.helpButton}
                  onClick={() => setShowMultiplayerModal(true)}
                  title="Como jogar e configurações"
                >
                  <FaQuestionCircle />
                  <span style={{ marginLeft: '8px', fontSize: '14px' }}>Ajuda</span>
                </button>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button
                className={styles.primaryButton}
                onClick={() => setMode('create')}
                disabled={isLoading}
              >
                {isClient ? t('create_room') : 'Criar Sala'}
              </button>

              <button
                className={styles.secondaryButton}
                onClick={() => setMode('join')}
                disabled={isLoading}
              >
                {isClient ? t('join_room') : 'Entrar na Sala'}
              </button>
            </div>

            {/* Botão voltar para o menu principal */}
            <div style={{ marginTop: '20px' }}>
              <button
                className={styles.secondaryButton}
                onClick={() => window.location.href = '/'}
                style={{
                  background: 'linear-gradient(45deg, #666, #888)',
                  width: '100%'
                }}
              >
                🏠 Voltar ao Menu Principal
              </button>
            </div>

            {error && (
              <div className={`${styles.message} ${styles.messageError}`}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Modal sempre disponível */}
        <MultiplayerModal
          isOpen={showMultiplayerModal}
          onClose={() => setShowMultiplayerModal(false)}
        />
      </div>
    );
  }

  // Formulário para criar sala
  if (mode === 'create') {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.lobbyContainer}>
            <h1 className={styles.title}>
              {isClient ? t('create_room') : 'Criar Sala'}
            </h1>

            <form onSubmit={handleCreateRoom} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {isClient ? t('nickname') : 'Nickname'}
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  placeholder={isClient ? t('nickname') : 'Seu nickname'}
                  className={styles.input}
                  maxLength={20}
                  required
                />
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setMode('menu')}
                  disabled={isLoading}
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={isLoading || !formData.nickname.trim()}
                >
                  {isLoading
                    ? (isClient ? t('creating_room') : 'Criando sala...')
                    : (isClient ? t('create_room') : 'Criar Sala')
                  }
                </button>
              </div>
            </form>

            {error && (
              <div className={`${styles.message} ${styles.messageError}`}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Modal sempre disponível */}
        <MultiplayerModal
          isOpen={showMultiplayerModal}
          onClose={() => setShowMultiplayerModal(false)}
        />
      </div>
    );
  }

  // Formulário para entrar na sala
  if (mode === 'join') {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.lobbyContainer}>
            <h1 className={styles.title}>
              {isClient ? t('join_room') : 'Entrar na Sala'}
            </h1>

            <form onSubmit={handleJoinRoom} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {isClient ? t('nickname') : 'Nickname'}
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  placeholder={isClient ? t('nickname') : 'Seu nickname'}
                  className={styles.input}
                  maxLength={20}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {isClient ? t('room_code') : 'Código da Sala'}
                </label>
                <input
                  type="text"
                  name="roomCode"
                  value={formData.roomCode}
                  onChange={handleInputChange}
                  placeholder="ABC123"
                  className={styles.input}
                  maxLength={6}
                  style={{ textTransform: 'uppercase' }}
                  required
                />
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setMode('menu')}
                  disabled={isLoading}
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={isLoading || !formData.nickname.trim() || !formData.roomCode.trim()}
                >
                  {isLoading
                    ? (isClient ? t('joining_room') : 'Entrando na sala...')
                    : (isClient ? t('join_room') : 'Entrar na Sala')
                  }
                </button>
              </div>
            </form>

            {error && (
              <div className={`${styles.message} ${styles.messageError}`}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Modal sempre disponível */}
        <MultiplayerModal
          isOpen={showMultiplayerModal}
          onClose={() => setShowMultiplayerModal(false)}
        />
      </div>
    );
  }

  // Sala de espera
  if (mode === 'waiting' && lobbyData) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.waitingRoom}>
            <h1 className={styles.title}>
              {isClient ? t('waiting_for_players') : 'Aguardando Jogadores'}
            </h1>

            <div className={styles.roomCode}>
              {roomCode}
            </div>

            <p>Compartilhe este código com outros jogadores</p>

            {/* Botão para convidar amigos */}
            {friends.length > 0 && (
              <div style={{ margin: '20px 0' }}>
                <button
                  className={styles.secondaryButton}
                  onClick={() => setShowInviteModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #1DB954, #1ed760)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    maxWidth: '300px',
                    margin: '0 auto'
                  }}
                >
                  <FaUserPlus />
                  {isClient ? t('invite_friends') : 'Convidar Amigos'}
                </button>
              </div>
            )}

            {/* Configuração de rodadas (apenas para anfitrião) */}
            {isHost && (
              <div style={{ margin: '20px 0' }}>
                <h3 style={{
                  color: '#4ecdc4',
                  fontSize: '1rem',
                  marginBottom: '10px',
                  textAlign: 'center'
                }}>
                  Configurações da Partida
                </h3>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '15px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}>
                    Número de Rodadas:
                  </label>
                  <select
                    value={selectedRounds}
                    onChange={(e) => setSelectedRounds(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '1rem',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <option value={5} style={{ background: '#2a2a2a', color: '#fff' }}>5 Rodadas</option>
                    <option value={10} style={{ background: '#2a2a2a', color: '#fff' }}>10 Rodadas (Padrão)</option>
                    <option value={15} style={{ background: '#2a2a2a', color: '#fff' }}>15 Rodadas</option>
                    <option value={20} style={{ background: '#2a2a2a', color: '#fff' }}>20 Rodadas</option>
                  </select>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginTop: '8px',
                    textAlign: 'center'
                  }}>
                    XP será distribuído proporcionalmente ao número de rodadas
                  </p>
                </div>
              </div>
            )}

            <div className={styles.playersList}>
              <h3 className={styles.playersTitle}>
                {isClient ? t('players_in_room') : 'Jogadores na sala'} ({lobbyData?.players?.length || 0})
              </h3>

              {lobbyData?.players?.map((player, index) => (
                <div key={`player-${player}-${index}`} className={styles.playerItem}>
                  <span className={styles.playerName}>{player}</span>
                  {player === lobbyData.host && (
                    <span className={styles.hostBadge}>ANFITRIÃO</span>
                  )}
                </div>
              )) || []}
            </div>

            {isHost ? (
              <div className={styles.buttonGroup}>
                <button
                  className={styles.secondaryButton}
                  onClick={handleLeaveRoom}
                  disabled={isLoading}
                >
                  {isClient ? t('leave_room') : 'Sair da Sala'}
                </button>

                <button
                  className={styles.primaryButton}
                  onClick={handleStartGame}
                  disabled={isLoading || !canStartGame}
                >
                  {isClient ? t('start_game') : 'Iniciar Jogo'}
                </button>
              </div>
            ) : (
              <div className={styles.buttonGroup}>
                <button
                  className={styles.secondaryButton}
                  onClick={handleLeaveRoom}
                  disabled={isLoading}
                >
                  {isClient ? t('leave_room') : 'Sair da Sala'}
                </button>

                <div className={`${styles.message} ${styles.messageInfo}`}>
                  {isClient ? t('waiting_for_host') : 'Aguardando anfitrião iniciar o jogo...'}
                </div>
              </div>
            )}

            {/* Botão voltar para o menu principal */}
            <div style={{ marginTop: '15px' }}>
              <button
                className={styles.secondaryButton}
                onClick={() => window.location.href = '/'}
                style={{
                  background: 'linear-gradient(45deg, #666, #888)',
                  width: '100%'
                }}
              >
                🏠 Voltar ao Menu Principal
              </button>
            </div>

            {!canStartGame && (
              <div className={`${styles.message} ${styles.messageWarning}`}>
                {isClient ? t('minimum_players') : 'Mínimo 2 jogadores para iniciar'}
              </div>
            )}

            {error && (
              <div className={`${styles.message} ${styles.messageError}`}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Modal de convite de amigos */}
        <MultiplayerInviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          roomCode={roomCode}
        />

        {/* Modal completo do multiplayer */}
        <MultiplayerModal
          isOpen={showMultiplayerModal}
          onClose={() => setShowMultiplayerModal(false)}
        />
      </div>
    );
  }

  // Loading
  const loadingContent = (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          {isClient ? t('loading') : 'Carregando...'}
        </div>
      </div>

      {/* Modal sempre disponível */}
      <MultiplayerModal
        isOpen={showMultiplayerModal}
        onClose={() => setShowMultiplayerModal(false)}
      />
    </div>
  );

  return loadingContent;
};

export default MultiplayerLobby;
