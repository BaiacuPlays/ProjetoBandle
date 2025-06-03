// Modal para fim de jogo do modo infinito
import React from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import styles from '../styles/InfiniteGameOverModal.module.css';

const InfiniteGameOverModal = ({ 
  isOpen, 
  onClose, 
  onPlayAgain, 
  infiniteStreak, 
  infiniteBestRecord, 
  isNewRecord 
}) => {
  useModalScrollLock(isOpen);
  const { t } = useLanguage();

  if (!isOpen) return null;

  // Renderizar o modal usando portal diretamente no body
  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {t('infinite_game_over') || 'Fim da Sequência!'}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className={styles.content}>
          {/* Novo recorde */}
          {isNewRecord && (
            <div className={styles.newRecord}>
              🏆 {t('new_record') || 'Novo Recorde!'}
            </div>
          )}

          {/* Estatísticas */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{infiniteStreak}</div>
              <div className={styles.statLabel}>
                {infiniteStreak === 1 ? 'Música' : 'Músicas'}
              </div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statValue}>{infiniteBestRecord}</div>
              <div className={styles.statLabel}>Melhor Sequência</div>
            </div>
          </div>

          {/* Mensagem */}
          <div className={styles.message}>
            {t('streak_of')?.replace('{count}', infiniteStreak) ||
             `Você conseguiu uma sequência de ${infiniteStreak} ${infiniteStreak === 1 ? 'música' : 'músicas'}!`}
          </div>

          {/* Botões */}
          <div className={styles.actions}>
            <button
              className={styles.playAgainButton}
              onClick={onPlayAgain}
              type="button"
            >
              🎮 {t('play_again_infinite') || 'Jogar Novamente'}
            </button>

            <button
              className={styles.closeModalButton}
              onClick={onClose}
              type="button"
            >
              📊 Ver Estatísticas
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InfiniteGameOverModal;
