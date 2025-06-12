import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from '../styles/CustomAnnouncement.module.css';

const CustomAnnouncement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar anúncios ativos
  useEffect(() => {
    fetchActiveAnnouncements();

    // Carregar anúncios dispensados do localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
    setDismissedAnnouncements(dismissed);
  }, []);

  const fetchActiveAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/announcements?active_only=true');
      const data = await response.json();

      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAnnouncement = (announcementId) => {
    const newDismissed = [...dismissedAnnouncements, announcementId];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  // Filtrar anúncios que não foram dispensados
  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedAnnouncements.includes(announcement.id)
  );

  if (loading || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className={styles.announcementContainer}>
      {visibleAnnouncements.map(announcement => (
        <AnnouncementItem
          key={announcement.id}
          announcement={announcement}
          onDismiss={() => dismissAnnouncement(announcement.id)}
        />
      ))}
    </div>
  );
};

const AnnouncementItem = ({ announcement, onDismiss }) => {
  const getTypeClass = (type) => {
    switch (type) {
      case 'success':
        return styles.success;
      case 'warning':
        return styles.warning;
      case 'error':
        return styles.error;
      case 'promotion':
        return styles.promotion;
      default:
        return styles.info;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`${styles.announcement} ${getTypeClass(announcement.type)}`}
      style={{
        borderLeftColor: announcement.color,
        backgroundColor: `${announcement.color}15`
      }}
    >
      <div className={styles.announcementContent}>
        <div className={styles.announcementHeader}>
          <div className={styles.announcementIcon}>
            {announcement.icon}
          </div>
          <div className={styles.announcementTitle}>
            {announcement.title}
          </div>
          <button
            className={styles.dismissButton}
            onClick={onDismiss}
            title="Dispensar anúncio"
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.announcementMessage}>
          {announcement.message}
        </div>

        <div className={styles.announcementFooter}>
          <span className={styles.announcementDate}>
            Válido até: {formatDate(announcement.endDate)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomAnnouncement;
