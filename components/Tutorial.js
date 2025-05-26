import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from '../styles/Home.module.css';

const Tutorial = ({ isOpen, onClose, onStartPlaying }) => {
  const { t, isClient } = useLanguage();

  if (!isOpen) return null;

  const handleStartPlaying = () => {
    onStartPlaying();
    onClose();
  };

  return (
    <div className={styles.tutorialOverlay}>
      <div className={styles.tutorialModal}>
        <button
          className={styles.tutorialCloseButton}
          onClick={onClose}
          aria-label="Fechar tutorial"
        >
          ×
        </button>

        <div className={styles.tutorialHeader}>
          <h1 className={styles.tutorialTitle}>
            {isClient ? t('welcome_title') : 'Bem-vindo ao LudoMusic!'}
          </h1>
          <p className={styles.tutorialSubtitle}>
            {isClient ? t('welcome_subtitle') : 'O jogo de adivinhação de músicas de videogames'}
          </p>
        </div>

        <div className={styles.tutorialContent}>
          {/* O que é o LudoMusic */}
          <div className={styles.tutorialSection}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('tutorial_what_is') : 'O que é o LudoMusic?'}
            </h2>
            <p className={styles.tutorialDescription}>
              {isClient ? t('tutorial_what_is_desc') : 'LudoMusic é um jogo onde você ouve trechos de músicas de videogames e tenta adivinhar qual é a música. Teste seus conhecimentos musicais dos games!'}
            </p>
          </div>

          {/* Modos de Jogo */}
          <div className={styles.tutorialSection}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('tutorial_game_modes') : 'Modos de Jogo'}
            </h2>
            <div className={styles.tutorialModes}>
              <div className={styles.tutorialMode}>
                <h3 className={styles.tutorialModeTitle}>
                  {isClient ? t('tutorial_daily_mode') : 'Modo Diário'}
                </h3>
                <p className={styles.tutorialModeDesc}>
                  {isClient ? t('tutorial_daily_desc') : 'Uma nova música por dia para todos os jogadores. Você tem 6 tentativas para acertar!'}
                </p>
              </div>
              <div className={styles.tutorialMode}>
                <h3 className={styles.tutorialModeTitle}>
                  {isClient ? t('tutorial_infinite_mode') : 'Modo Infinito'}
                </h3>
                <p className={styles.tutorialModeDesc}>
                  {isClient ? t('tutorial_infinite_desc') : 'Jogue músicas aleatórias sem parar! Veja quantas você consegue acertar em sequência.'}
                </p>
              </div>
              <div className={styles.tutorialMode}>
                <h3 className={styles.tutorialModeTitle}>
                  {isClient ? t('tutorial_multiplayer_mode') : 'Modo Multiplayer'}
                </h3>
                <p className={styles.tutorialModeDesc}>
                  {isClient ? t('tutorial_multiplayer_desc') : 'Jogue com amigos em salas privadas! Compete para ver quem acerta mais músicas.'}
                </p>
                <p className={styles.tutorialModeDesc} style={{
                  color: '#ffc107',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginTop: '0.5rem'
                }}>
                  {isClient ? t('tutorial_multiplayer_beta') : '⚠️ Este modo está em BETA e pode apresentar problemas.'}
                </p>
              </div>
            </div>
          </div>

          {/* Como Jogar */}
          <div className={styles.tutorialSection}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('tutorial_how_to_play') : 'Como Jogar'}
            </h2>
            <ul className={styles.tutorialSteps}>
              <li className={styles.tutorialStep}>
                {isClient ? t('tutorial_step_1') : '1. Clique em "Reproduzir" para ouvir um trecho da música'}
              </li>
              <li className={styles.tutorialStep}>
                {isClient ? t('tutorial_step_2') : '2. Digite o nome da música no campo de busca'}
              </li>
              <li className={styles.tutorialStep}>
                {isClient ? t('tutorial_step_3') : '3. Selecione a música correta da lista de sugestões'}
              </li>
              <li className={styles.tutorialStep}>
                {isClient ? t('tutorial_step_4') : '4. Se errar, você ganha uma dica adicional (trecho mais longo)'}
              </li>
              <li className={styles.tutorialStep}>
                {isClient ? t('tutorial_step_5') : '5. Você tem até 6 tentativas para acertar!'}
              </li>
            </ul>
          </div>

          {/* Dicas */}
          <div className={styles.tutorialTips}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('tutorial_tips') : 'Dicas'}
            </h2>
            <div className={styles.tutorialTip}>
              {isClient ? t('tutorial_tip_1') : '• Use fones de ouvido para uma melhor experiência'}
            </div>
            <div className={styles.tutorialTip}>
              {isClient ? t('tutorial_tip_2') : '• Preste atenção nos detalhes da melodia'}
            </div>
            <div className={styles.tutorialTip}>
              {isClient ? t('tutorial_tip_3') : '• As músicas podem ser de qualquer videogame'}
            </div>
            <div className={styles.tutorialTip}>
              {isClient ? t('tutorial_tip_4') : '• Você pode pular tentativas se não souber'}
            </div>
          </div>

          {/* Botões */}
          <div className={styles.tutorialButtons}>
            <button
              className={styles.tutorialButton}
              onClick={handleStartPlaying}
            >
              {isClient ? t('tutorial_start_playing') : 'Começar a Jogar'}
            </button>
            <button
              className={styles.tutorialButtonSecondary}
              onClick={onClose}
            >
              {isClient ? t('tutorial_close') : 'Fechar Tutorial'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
