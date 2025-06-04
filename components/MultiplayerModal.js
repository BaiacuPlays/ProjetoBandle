// Modal completo para multiplayer com abas
import React, { useState, useEffect } from 'react';
import { FaTimes, FaGamepad, FaCog, FaBell, FaQuestionCircle } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationCenter from './NotificationCenter';
import styles from '../styles/MultiplayerModal.module.css';

const MultiplayerModal = ({ isOpen, onClose }) => {
  const { t, isClient } = useLanguage();
  const [activeTab, setActiveTab] = useState('howToPlay');

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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🎮 Multiplayer</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'howToPlay' ? styles.active : ''}`}
            onClick={() => setActiveTab('howToPlay')}
          >
            <FaQuestionCircle /> Como jogar
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaCog /> Configurações
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'notifications' ? styles.active : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FaBell /> Notificações
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'howToPlay' && (
            <div className={styles.howToPlay}>
              <h3>🎯 Como Jogar Multiplayer</h3>
              
              <div className={styles.section}>
                <h4>📝 Criando uma Sala:</h4>
                <ul>
                  <li>Clique em "Criar Sala"</li>
                  <li>Digite seu nickname</li>
                  <li>Compartilhe o código da sala com amigos</li>
                  <li>Configure o número de rodadas (5-20)</li>
                  <li>Inicie o jogo quando todos estiverem prontos</li>
                </ul>
              </div>

              <div className={styles.section}>
                <h4>🚪 Entrando em uma Sala:</h4>
                <ul>
                  <li>Clique em "Entrar na Sala"</li>
                  <li>Digite seu nickname</li>
                  <li>Insira o código da sala recebido</li>
                  <li>Aguarde o anfitrião iniciar o jogo</li>
                </ul>
              </div>

              <div className={styles.section}>
                <h4>🎵 Durante o Jogo:</h4>
                <ul>
                  <li>Ouça a música e tente adivinhar o nome</li>
                  <li>Você tem até 6 tentativas por rodada</li>
                  <li>Ganha pontos quem acertar primeiro</li>
                  <li>Acompanhe o placar em tempo real</li>
                </ul>
              </div>

              <div className={styles.section}>
                <h4>🏆 Sistema de Pontuação:</h4>
                <ul>
                  <li><strong>Música correta:</strong> 3 pontos</li>
                  <li><strong>Jogo correto:</strong> 1 ponto</li>
                  <li><strong>Resposta errada:</strong> 0 pontos</li>
                  <li><strong>Desempate:</strong> Rodada extra decisiva</li>
                </ul>
              </div>

              <div className={styles.section}>
                <h4>💎 Recompensas XP:</h4>
                <ul>
                  <li>XP é distribuído proporcionalmente às rodadas</li>
                  <li>Mais rodadas = mais XP total</li>
                  <li>Vencedor ganha XP bônus</li>
                  <li>Todos os participantes ganham XP base</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={styles.settings}>
              <h3>⚙️ Configurações do Multiplayer</h3>
              
              <div className={styles.settingGroup}>
                <h4>🎮 Configurações de Sala (Anfitrião)</h4>
                <div className={styles.settingItem}>
                  <span>Número de Rodadas:</span>
                  <span>5, 10, 15 ou 20 rodadas</span>
                </div>
                <div className={styles.settingItem}>
                  <span>Máximo de Jogadores:</span>
                  <span>4 jogadores por sala</span>
                </div>
                <div className={styles.settingItem}>
                  <span>Tempo por Rodada:</span>
                  <span>Ilimitado (até 6 tentativas)</span>
                </div>
              </div>

              <div className={styles.settingGroup}>
                <h4>🔊 Configurações de Áudio</h4>
                <div className={styles.settingItem}>
                  <span>Volume da Música:</span>
                  <span>Controlado individualmente</span>
                </div>
                <div className={styles.settingItem}>
                  <span>Efeitos Sonoros:</span>
                  <span>Configurável no menu principal</span>
                </div>
              </div>

              <div className={styles.settingGroup}>
                <h4>👥 Sistema de Convites</h4>
                <div className={styles.settingItem}>
                  <span>Convidar Amigos:</span>
                  <span>Disponível na sala de espera</span>
                </div>
                <div className={styles.settingItem}>
                  <span>Notificações:</span>
                  <span>Receba convites em tempo real</span>
                </div>
              </div>

              <div className={styles.tip}>
                💡 <strong>Dica:</strong> Use o sistema de amigos para convidar pessoas facilmente para suas salas!
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className={styles.notifications}>
              <h3>🔔 Central de Notificações</h3>
              <p>Gerencie seus convites e notificações do multiplayer:</p>
              
              <div className={styles.notificationCenter}>
                <NotificationCenter />
              </div>
              
              <div className={styles.notificationInfo}>
                <h4>📱 Tipos de Notificação:</h4>
                <ul>
                  <li><strong>Convites para Sala:</strong> Quando amigos te convidam</li>
                  <li><strong>Solicitações de Amizade:</strong> Novos pedidos de amizade</li>
                  <li><strong>Jogo Iniciado:</strong> Quando uma partida começa</li>
                  <li><strong>Conquistas:</strong> Novos badges e níveis</li>
                </ul>
              </div>

              <div className={styles.tip}>
                🔔 <strong>Permissões:</strong> Ative as notificações do navegador para não perder convites!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerModal;
