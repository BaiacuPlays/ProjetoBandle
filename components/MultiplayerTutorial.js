import React, { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import styles from '../styles/Home.module.css';

const MultiplayerTutorial = ({ isOpen, onClose }) => {
  const { t, isClient } = useLanguage();
  const modalRef = useRef(null);

  // Bloquear/desbloquear scroll da página
  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className={styles.tutorialOverlay}>
      <div className={styles.tutorialModal} ref={modalRef}>
        <button
          className={styles.tutorialCloseButton}
          onClick={onClose}
          aria-label="Fechar tutorial multiplayer"
        >
          ×
        </button>

        <div className={styles.tutorialHeader}>
          <h1 className={styles.tutorialTitle}>
            {isClient ? t('multiplayer_tutorial_title') : '👥 Como Jogar Multiplayer'}
          </h1>
          <p className={styles.tutorialSubtitle}>
            {isClient ? t('multiplayer_tutorial_subtitle') : 'Guia completo para jogar com amigos'}
          </p>
        </div>

        <div className={styles.tutorialContent}>
          {/* Criando uma Sala */}
          <div className={styles.tutorialSection}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('multiplayer_creating_room') : '🏠 Criando uma Sala'}
            </h2>
            <ul className={styles.tutorialSteps}>
              <li className={styles.tutorialStep}>
                1. Clique em "Multiplayer" na tela inicial
              </li>
              <li className={styles.tutorialStep}>
                2. Clique em "Criar Sala"
              </li>
              <li className={styles.tutorialStep}>
                3. Escolha seu apelido (nickname)
              </li>
              <li className={styles.tutorialStep}>
                4. Defina o número de rodadas (padrão: 10)
              </li>
              <li className={styles.tutorialStep}>
                5. Compartilhe o código da sala com seus amigos
              </li>
            </ul>
          </div>

          {/* Entrando em uma Sala */}
          <div className={styles.tutorialSection}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('multiplayer_joining_room') : '🚪 Entrando em uma Sala'}
            </h2>
            <ul className={styles.tutorialSteps}>
              <li className={styles.tutorialStep}>
                1. Clique em "Multiplayer" na tela inicial
              </li>
              <li className={styles.tutorialStep}>
                2. Clique em "Entrar em Sala"
              </li>
              <li className={styles.tutorialStep}>
                3. Digite o código da sala que recebeu
              </li>
              <li className={styles.tutorialStep}>
                4. Escolha seu apelido (nickname)
              </li>
              <li className={styles.tutorialStep}>
                5. Aguarde o criador da sala iniciar o jogo
              </li>
            </ul>
          </div>

          {/* Sistema de Pontuação */}
          <div className={styles.tutorialSection}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('multiplayer_scoring') : '🏆 Sistema de Pontuação'}
            </h2>
            <p className={styles.tutorialDescription}>
              No multiplayer, você ganha pontos baseado em quantas dicas precisou usar:
            </p>
            <div className={styles.tutorialModes}>
              <div className={styles.tutorialMode}>
                <h3 className={styles.tutorialModeTitle}>🎯 Sem Dicas</h3>
                <p className={styles.tutorialModeDesc}><strong>6 pontos</strong> - Acertou na primeira tentativa!</p>
              </div>
              <div className={styles.tutorialMode}>
                <h3 className={styles.tutorialModeTitle}>🔍 Com Dicas</h3>
                <p className={styles.tutorialModeDesc}>
                  <strong>5 pontos</strong> (1 dica) • <strong>4 pontos</strong> (2 dicas)<br/>
                  <strong>3 pontos</strong> (3 dicas) • <strong>2 pontos</strong> (4 dicas)<br/>
                  <strong>1 ponto</strong> (5 dicas)
                </p>
              </div>
            </div>
            <div className={styles.tutorialTip} style={{ marginTop: '10px', background: '#e8f5e8', padding: '10px', borderRadius: '8px' }}>
              🏅 <strong>Vence quem tiver mais pontos</strong> ao final de todas as rodadas!
            </div>
          </div>

          {/* Mecânicas Especiais */}
          <div className={styles.tutorialSection}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('multiplayer_mechanics') : '⚡ Mecânicas Especiais'}
            </h2>
            <ul className={styles.tutorialSteps}>
              <li className={styles.tutorialStep}>
                <strong>🔄 Navegação entre Dicas:</strong> Clique nos números das tentativas para rever dicas anteriores
              </li>
              <li className={styles.tutorialStep}>
                <strong>⏱️ Sem Limite de Tempo:</strong> Não há pressa, pense bem antes de responder
              </li>
              <li className={styles.tutorialStep}>
                <strong>🎵 Mesma Música:</strong> Todos os jogadores ouvem a mesma música em cada rodada
              </li>
              <li className={styles.tutorialStep}>
                <strong>🏁 Rodadas Simultâneas:</strong> Todos jogam ao mesmo tempo, sem esperar
              </li>
              <li className={styles.tutorialStep}>
                <strong>🤝 Desempate:</strong> Em caso de empate, há uma rodada extra de desempate
              </li>
            </ul>
          </div>

          {/* Dicas para Multiplayer */}
          <div className={styles.tutorialTips}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('multiplayer_tips') : '💡 Dicas para Multiplayer'}
            </h2>
            <div className={styles.tutorialTip}>
              🎯 <strong>Seja estratégico:</strong> Às vezes vale a pena usar uma dica para ter certeza
            </div>
            <div className={styles.tutorialTip}>
              🎧 <strong>Use fones de ouvido:</strong> Essencial para ouvir bem os detalhes
            </div>
            <div className={styles.tutorialTip}>
              🤔 <strong>Pense antes de responder:</strong> Não há limite de tempo, use isso a seu favor
            </div>
            <div className={styles.tutorialTip}>
              👥 <strong>Comunique-se:</strong> Use chat de voz ou texto para interagir com amigos
            </div>
            <div className={styles.tutorialTip}>
              🔄 <strong>Revise as dicas:</strong> Clique nos números para rever informações anteriores
            </div>
          </div>

          {/* Botão de Fechar */}
          <div className={styles.tutorialButtons}>
            <button
              className={styles.tutorialButton}
              onClick={onClose}
            >
              {isClient ? t('multiplayer_tutorial_close') : 'Entendi, Vamos Jogar!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerTutorial;
