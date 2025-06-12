// Modal completo para multiplayer com abas
import { useState, useEffect } from 'react';
import { FaTimes, FaCog, FaQuestionCircle } from 'react-icons/fa';
import styles from '../styles/MultiplayerModal.module.css';

const MultiplayerModal = ({ isOpen, onClose }) => {
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
                  <li>A cada erro, você recebe dicas progressivas</li>
                  <li>Clique nos números das tentativas para rever dicas</li>
                  <li>Acompanhe o placar em tempo real</li>
                </ul>
              </div>

              <div className={styles.section}>
                <h4>💡 Sistema de Dicas Progressivas:</h4>
                <ul>
                  <li><strong>Tentativa 1:</strong> Apenas o áudio (trecho curto)</li>
                  <li><strong>Tentativa 2:</strong> Duração da música completa</li>
                  <li><strong>Tentativa 3:</strong> Ano de lançamento do jogo</li>
                  <li><strong>Tentativa 4:</strong> Nome do artista/compositor</li>
                  <li><strong>Tentativa 5:</strong> Console/plataforma do jogo</li>
                  <li><strong>Tentativa 6:</strong> Nome da franquia/jogo</li>
                </ul>
              </div>

              <div className={styles.section}>
                <h4>🏆 Sistema de Pontuação:</h4>
                <p style={{ marginBottom: '10px', fontSize: '0.9rem', opacity: 0.8 }}>
                  Pontos baseados no número de dicas utilizadas:
                </p>
                <ul>
                  <li><strong>6 pontos:</strong> Acertou sem usar dicas (1ª tentativa)</li>
                  <li><strong>5 pontos:</strong> Acertou usando 1 dica (2ª tentativa)</li>
                  <li><strong>4 pontos:</strong> Acertou usando 2 dicas (3ª tentativa)</li>
                  <li><strong>3 pontos:</strong> Acertou usando 3 dicas (4ª tentativa)</li>
                  <li><strong>2 pontos:</strong> Acertou usando 4 dicas (5ª tentativa)</li>
                  <li><strong>1 ponto:</strong> Acertou usando 5 dicas (6ª tentativa)</li>
                  <li><strong>0 pontos:</strong> Não acertou a música</li>
                </ul>
                <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '6px', fontSize: '0.85rem', color: '#e0e0e0' }}>
                  🏅 <strong style={{ color: '#ffd700' }}>Estratégia:</strong> Às vezes vale a pena usar uma dica para ter certeza da resposta!
                </div>
              </div>

              <div className={styles.section}>
                <h4>⚡ Mecânicas Especiais:</h4>
                <ul>
                  <li><strong>🔄 Navegação entre Dicas:</strong> Clique nos números das tentativas para rever dicas anteriores</li>
                  <li><strong>⏱️ Sem Limite de Tempo:</strong> Não há pressa, pense bem antes de responder</li>
                  <li><strong>🎵 Mesma Música:</strong> Todos os jogadores ouvem a mesma música em cada rodada</li>
                  <li><strong>🏁 Rodadas Simultâneas:</strong> Todos jogam ao mesmo tempo, sem esperar</li>
                  <li><strong>🤝 Desempate:</strong> Em caso de empate, há uma rodada extra de desempate</li>
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

              <div className={styles.section}>
                <h4>💡 Dicas para Multiplayer:</h4>
                <ul>
                  <li>🎯 <strong>Seja estratégico:</strong> Às vezes vale a pena usar uma dica para ter certeza</li>
                  <li>🎧 <strong>Use fones de ouvido:</strong> Essencial para ouvir bem os detalhes</li>
                  <li>🤔 <strong>Pense antes de responder:</strong> Não há limite de tempo, use isso a seu favor</li>
                  <li>👥 <strong>Comunique-se:</strong> Use chat de voz ou texto para interagir com amigos</li>
                  <li>🔄 <strong>Revise as dicas:</strong> Clique nos números para rever informações anteriores</li>
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
                  <span>Ilimitado</span>
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
        </div>
      </div>
    </div>
  );
};

export default MultiplayerModal;
