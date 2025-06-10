import { useState, useEffect } from 'react';
import styles from '../styles/ToastNotification.module.css';

const ToastNotification = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Função global para mostrar toast
    window.showToast = (message, type = 'info', duration = 3000) => {
      const id = Date.now() + Math.random();
      const newToast = {
        id,
        message,
        type, // 'success', 'error', 'warning', 'info'
        duration
      };

      setToasts(prev => [...prev, newToast]);

      // Auto remover após duração
      setTimeout(() => {
        removeToast(id);
      }, duration);
    };

    // Função removida - agora é gerenciada pelo AchievementNotification.js

    // Função global para abrir modal de doação
    window.openDonationModal = () => {
      try {
        // Disparar evento customizado para abrir modal de doação
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('openDonationModal'));
        }
      } catch (error) {
        console.warn('⚠️ Erro ao abrir modal de doação:', error);
      }
    };

    return () => {
      delete window.showToast;
      delete window.openDonationModal;
      // showLevelUpToast não é mais gerenciado aqui
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
          onClick={() => removeToast(toast.id)}
        >
          <span className={styles.icon}>{getToastIcon(toast.type)}</span>
          <span className={styles.message}>{toast.message}</span>
          <button
            className={styles.closeButton}
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;
