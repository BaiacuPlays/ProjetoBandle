import React, { useState } from 'react';
import { getBadge, getUnlockedBadges, debugBadges } from '../data/badges';
import { useProfile } from '../contexts/ProfileContext';
import styles from '../styles/BadgeSelector.module.css';

const BadgeSelector = ({ profile }) => {
  const { updateProfile } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const unlockedBadges = getUnlockedBadges(profile);
  const selectedBadge = profile.selectedBadge;

  const handleBadgeSelect = async (badgeId) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await updateProfile({ selectedBadge: badgeId });
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao selecionar badge:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveBadge = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await updateProfile({ selectedBadge: null });
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao remover badge:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (unlockedBadges.length === 0) {
    // Debug para identificar problemas
    console.log('🔍 BadgeSelector: Nenhuma badge disponível, executando debug...');
    debugBadges(profile);

    return (
      <div className={styles.noBadges}>
        <p>Você ainda não desbloqueou nenhuma badge para exibir.</p>
        <p>Continue jogando para conquistar suas primeiras badges!</p>
      </div>
    );
  }

  const selectedBadgeData = selectedBadge ? getBadge(selectedBadge) : null;

  return (
    <div className={styles.badgeSelector}>
      <div className={styles.header}>
        <h4>Badge Exibida</h4>
        <p>Escolha uma badge para exibir ao lado do seu nome</p>
      </div>

      <div className={styles.currentBadge}>
        {selectedBadgeData ? (
          <div className={styles.selectedBadgeDisplay}>
            <div
              className={styles.badgePreview}
              style={{ color: selectedBadgeData.color }}
            >
              <span className={styles.badgeIcon}>{selectedBadgeData.icon}</span>
              <div className={styles.badgeInfo}>
                <span className={styles.badgeTitle}>{selectedBadgeData.title}</span>
                <span className={styles.badgeDescription}>{selectedBadgeData.description}</span>
              </div>
            </div>
            <button
              className={styles.removeButton}
              onClick={handleRemoveBadge}
              disabled={isUpdating}
            >
              Remover
            </button>
          </div>
        ) : (
          <div className={styles.noBadgeSelected}>
            <span>Nenhuma badge selecionada</span>
          </div>
        )}
      </div>

      <button
        className={styles.selectButton}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
      >
        {isOpen ? 'Fechar Seleção' : 'Escolher Badge'}
      </button>

      {isOpen && (
        <div className={styles.badgesList}>
          {unlockedBadges.map(badgeId => {
            const badge = getBadge(badgeId);
            if (!badge) return null;

            const isSelected = selectedBadge === badgeId;

            return (
              <div
                key={badgeId}
                className={`${styles.badgeOption} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleBadgeSelect(badgeId)}
                style={{ borderColor: badge.color }}
              >
                <div
                  className={styles.badgeIcon}
                  style={{ color: badge.color }}
                >
                  {badge.icon}
                </div>
                <div className={styles.badgeDetails}>
                  <span className={styles.badgeTitle}>{badge.title}</span>
                  <span className={styles.badgeDescription}>{badge.description}</span>
                  <span className={`${styles.badgeRarity} ${styles[badge.rarity]}`}>
                    {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                  </span>
                </div>
                {isSelected && (
                  <div className={styles.selectedIndicator}>✓</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BadgeSelector;
