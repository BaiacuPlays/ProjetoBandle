import React from 'react';
import { getBadge } from '../data/badges';
import styles from '../styles/UserBadge.module.css';

const UserBadge = ({ badgeId, size = 'small', showTooltip = true }) => {
  if (!badgeId) return null;

  const badge = getBadge(badgeId);
  if (!badge) return null;

  const sizeClass = styles[size] || styles.small;

  return (
    <div 
      className={`${styles.userBadge} ${sizeClass}`}
      style={{ color: badge.color }}
      title={showTooltip ? `${badge.title}\n${badge.description}` : undefined}
    >
      <span className={styles.badgeIcon}>
        {badge.icon}
      </span>
    </div>
  );
};

export default UserBadge;
