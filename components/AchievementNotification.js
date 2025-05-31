import React, { useState, useEffect } from 'react';
import { FaTrophy, FaStar, FaTimes } from 'react-icons/fa';
import styles from '../styles/AchievementNotification.module.css';

const AchievementNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Registrar funções globais para mostrar notificações
    window.showAchievementToast = (achievement) => {
      const notification = {
        id: Date.now(),
        type: 'achievement',
        achievement,
        timestamp: Date.now()
      };
      
      setNotifications(prev => [...prev, notification]);
      
      // Auto-remover após 5 segundos
      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
    };

    window.showLevelUpToast = (newLevel) => {
      const notification = {
        id: Date.now(),
        type: 'levelup',
        level: newLevel,
        timestamp: Date.now()
      };
      
      setNotifications(prev => [...prev, notification]);
      
      // Auto-remover após 4 segundos
      setTimeout(() => {
        removeNotification(notification.id);
      }, 4000);
    };

    // Cleanup
    return () => {
      delete window.showAchievementToast;
      delete window.showLevelUpToast;
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#9CA3AF',
      uncommon: '#10B981',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B'
    };
    return colors[rarity] || colors.common;
  };

  if (notifications.length === 0) return null;

  return (
    <div className={styles.notificationContainer}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${styles.notification} ${styles[notification.type]}`}
          style={notification.type === 'achievement' ? {
            borderColor: getRarityColor(notification.achievement.rarity)
          } : {}}
        >
          <button
            className={styles.closeButton}
            onClick={() => removeNotification(notification.id)}
          >
            <FaTimes />
          </button>

          {notification.type === 'achievement' ? (
            <div className={styles.achievementContent}>
              <div className={styles.achievementIcon}>
                <FaTrophy />
                <span className={styles.emoji}>{notification.achievement.icon}</span>
              </div>
              <div className={styles.achievementInfo}>
                <div className={styles.achievementTitle}>
                  Conquista Desbloqueada!
                </div>
                <div className={styles.achievementName}>
                  {notification.achievement.title}
                </div>
                <div className={styles.achievementDesc}>
                  {notification.achievement.description}
                </div>
                <div className={styles.xpReward}>
                  +{notification.achievement.xpReward} XP
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.levelUpContent}>
              <div className={styles.levelUpIcon}>
                <FaStar />
              </div>
              <div className={styles.levelUpInfo}>
                <div className={styles.levelUpTitle}>
                  Level Up!
                </div>
                <div className={styles.levelUpLevel}>
                  Nível {notification.level}
                </div>
                <div className={styles.levelUpDesc}>
                  Parabéns pelo seu progresso!
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AchievementNotification;
