import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import styles from '../styles/Home.module.css';

const Tutorial = ({ isOpen, onClose, onStartPlaying }) => {
  const { t, isClient } = useLanguage();
  const modalRef = useRef(null);

  // Bloquear/desbloquear scroll da página
  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  const handleStartPlaying = () => {
    onStartPlaying();
    onClose();
  };

  return (
    <div className={styles.tutorialOverlay}>
      <div className={styles.tutorialModal} ref={modalRef}>
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

          {/* Sistema de Dicas */}
          <div className={styles.tutorialSection}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('tutorial_hints_system') : 'Sistema de Dicas Progressivas'}
            </h2>
            <p className={styles.tutorialDescription}>
              {isClient ? t('tutorial_hints_desc') : 'A cada tentativa errada, você recebe dicas específicas para te ajudar:'}
            </p>
            <ul className={styles.tutorialSteps}>
              <li className={styles.tutorialStep}>
                <strong style={{ color: '#1DB954' }}>Tentativa 1:</strong> Apenas o áudio (trecho curto)
              </li>
              <li className={styles.tutorialStep}>
                <strong style={{ color: '#1DB954' }}>Tentativa 2:</strong> Duração da música completa
              </li>
              <li className={styles.tutorialStep}>
                <strong style={{ color: '#1DB954' }}>Tentativa 3:</strong> Ano de lançamento do jogo
              </li>
              <li className={styles.tutorialStep}>
                <strong style={{ color: '#1DB954' }}>Tentativa 4:</strong> Nome do artista/compositor
              </li>
              <li className={styles.tutorialStep}>
                <strong style={{ color: '#1DB954' }}>Tentativa 5:</strong> Console/plataforma do jogo
              </li>
              <li className={styles.tutorialStep}>
                <strong style={{ color: '#1DB954' }}>Tentativa 6:</strong> Nome da franquia/jogo
              </li>
            </ul>
            <div className={styles.tutorialTip} style={{ marginTop: '10px', background: 'rgba(29, 185, 84, 0.1)', border: '1px solid rgba(29, 185, 84, 0.3)', padding: '10px', borderRadius: '8px', color: '#e0e0e0' }}>
              💡 <strong style={{ color: '#1DB954' }}>Dica:</strong> Você pode clicar nos números das tentativas (1, 2, 3...) para rever dicas anteriores!
            </div>
          </div>

          {/* Sistema de XP e Progressão */}
          <div className={styles.tutorialSection}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('tutorial_xp_system') : 'Sistema de XP e Níveis'}
            </h2>
            <p className={styles.tutorialDescription}>
              {isClient ? t('tutorial_xp_desc') : 'Ganhe experiência (XP) jogando e suba de nível para desbloquear conquistas:'}
            </p>
            <ul className={styles.tutorialSteps}>
              <li className={styles.tutorialStep}>
                🎯 <strong style={{ color: '#1DB954' }}>Acertar na 1ª tentativa:</strong> +100 XP
              </li>
              <li className={styles.tutorialStep}>
                🎵 <strong style={{ color: '#1DB954' }}>Vitória normal:</strong> +50 XP
              </li>
              <li className={styles.tutorialStep}>
                🔥 <strong style={{ color: '#1DB954' }}>Bônus por sequência:</strong> +10 XP a cada 5 vitórias seguidas
              </li>
              <li className={styles.tutorialStep}>
                📚 <strong style={{ color: '#1DB954' }}>Tentar mesmo perdendo:</strong> +10 XP
              </li>
            </ul>
            <div className={styles.tutorialTip} style={{ marginTop: '10px', background: 'rgba(156, 39, 176, 0.1)', border: '1px solid rgba(156, 39, 176, 0.3)', padding: '10px', borderRadius: '8px', color: '#e0e0e0' }}>
              ⭐ <strong style={{ color: '#9c27b0' }}>Seu nível aumenta automaticamente</strong> conforme você ganha XP. Acesse seu perfil para ver o progresso!
            </div>
          </div>

          {/* Sistema de Conquistas */}
          <div className={styles.tutorialSection}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('tutorial_achievements') : 'Sistema de Conquistas'}
            </h2>
            <p className={styles.tutorialDescription}>
              {isClient ? t('tutorial_achievements_desc') : 'Desbloqueie conquistas especiais jogando e explorando o jogo:'}
            </p>
            <div className={styles.tutorialModes}>
              <div className={styles.tutorialMode}>
                <h4 style={{ color: '#1DB954', margin: '0 0 0.5rem 0' }}>🎮 Conquistas por Jogos</h4>
                <p style={{ color: '#c0c0c0', margin: 0 }}>Jogue partidas para desbloquear (Veterano, Experiente, Mestre)</p>
              </div>
              <div className={styles.tutorialMode}>
                <h4 style={{ color: '#1DB954', margin: '0 0 0.5rem 0' }}>🔥 Conquistas por Sequência</h4>
                <p style={{ color: '#c0c0c0', margin: 0 }}>Acerte músicas em sequência (5, 10, 25 seguidas)</p>
              </div>
              <div className={styles.tutorialMode}>
                <h4 style={{ color: '#1DB954', margin: '0 0 0.5rem 0' }}>⚡ Conquistas por Velocidade</h4>
                <p style={{ color: '#c0c0c0', margin: 0 }}>Acerte rapidamente ou ouça a música completa</p>
              </div>
            </div>
            <div className={styles.tutorialTip} style={{ marginTop: '10px', background: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)', padding: '10px', borderRadius: '8px', color: '#e0e0e0' }}>
              🏆 <strong style={{ color: '#ff9800' }}>Cada conquista</strong> te dá XP extra e aparece no seu perfil!
            </div>
          </div>

          {/* Diferenças entre Modos */}
          <div className={styles.tutorialSection}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('tutorial_mode_differences') : 'Diferenças entre os Modos'}
            </h2>
            <div className={styles.tutorialModes}>
              <div className={styles.tutorialMode}>
                <h4 style={{ color: '#1DB954', margin: '0 0 0.5rem 0' }}>🗓️ Modo Diário</h4>
                <p style={{ color: '#c0c0c0', margin: '0.3rem 0' }}>• Feedback visual completo com efeitos</p>
                <p style={{ color: '#c0c0c0', margin: '0.3rem 0' }}>• Estatísticas compartilhadas com outros jogadores</p>
                <p style={{ color: '#c0c0c0', margin: '0.3rem 0' }}>• Uma música por dia para todos</p>
              </div>
              <div className={styles.tutorialMode}>
                <h4 style={{ color: '#1DB954', margin: '0 0 0.5rem 0' }}>♾️ Modo Infinito</h4>
                <p style={{ color: '#c0c0c0', margin: '0.3rem 0' }}>• Feedback simplificado</p>
                <p style={{ color: '#c0c0c0', margin: '0.3rem 0' }}>• Foco na sequência de acertos</p>
                <p style={{ color: '#c0c0c0', margin: '0.3rem 0' }}>• Músicas aleatórias ilimitadas</p>
              </div>
              <div className={styles.tutorialMode}>
                <h4 style={{ color: '#1DB954', margin: '0 0 0.5rem 0' }}>👥 Modo Multiplayer</h4>
                <p style={{ color: '#c0c0c0', margin: '0.3rem 0' }}>• Sistema de pontuação especial:</p>
                <p style={{ fontSize: '0.9rem', color: '#b0b0b0', margin: '0.3rem 0' }}>
                  6 pts (sem dicas) • 5 pts (1 dica) • 4 pts (2 dicas)<br/>
                  3 pts (3 dicas) • 2 pts (4 dicas) • 1 pt (5 dicas)
                </p>
                <p style={{ color: '#c0c0c0', margin: '0.3rem 0' }}>• Compete em tempo real com amigos</p>
              </div>
            </div>
          </div>

          {/* Dicas Gerais */}
          <div className={styles.tutorialTips}>
            <h2 className={styles.tutorialSectionTitle}>
              {isClient ? t('tutorial_tips') : 'Dicas Importantes'}
            </h2>
            <div className={styles.tutorialTip}>
              {isClient ? t('tutorial_tip_1') : '🎧 Use fones de ouvido para uma melhor experiência'}
            </div>
            <div className={styles.tutorialTip}>
              {isClient ? t('tutorial_tip_2') : '🎵 Preste atenção nos detalhes da melodia'}
            </div>
            <div className={styles.tutorialTip}>
              {isClient ? t('tutorial_tip_3') : '🎮 As músicas podem ser de qualquer videogame'}
            </div>
            <div className={styles.tutorialTip}>
              {isClient ? t('tutorial_tip_4') : '⏭️ Você pode pular tentativas se não souber'}
            </div>
            <div className={styles.tutorialTip}>
              🔄 <strong style={{ color: '#1DB954' }}>Clique nos números das tentativas</strong> para navegar entre dicas
            </div>
            <div className={styles.tutorialTip}>
              👤 <strong style={{ color: '#1DB954' }}>Acesse seu perfil</strong> para ver conquistas e estatísticas
            </div>
            <div className={styles.tutorialTip}>
              🏆 <strong style={{ color: '#1DB954' }}>Acerte na primeira tentativa</strong> para ganhar mais XP
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
