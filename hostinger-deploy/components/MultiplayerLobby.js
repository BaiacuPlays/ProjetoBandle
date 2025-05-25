import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMultiplayerContext } from '../contexts/MultiplayerContext';
import styles from '../styles/Multiplayer.module.css';

const MultiplayerLobby = ({ onGameStart }) => {
  const { t, isClient } = useLanguage();
  const { state, actions } = useMultiplayerContext();
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
      await actions.createRoom(formData.nickname.trim());
      setMode('waiting');
      actions.setError(''); // Limpar qualquer erro anterior
    } catch (err) {
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
      await actions.startGame();
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
            <h1 className={styles.title}>
              {isClient ? t('multiplayer') : 'Multiplayer'}
            </h1>

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

            {error && (
              <div className={`${styles.message} ${styles.messageError}`}>
                {error}
              </div>
            )}
          </div>
        </div>
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
      </div>
    );
  }

  // Loading
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          {isClient ? t('loading') : 'Carregando...'}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLobby;
