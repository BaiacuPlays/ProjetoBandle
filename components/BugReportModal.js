import React, { useState, useEffect } from 'react';
import { FaTimes, FaBug, FaPaperPlane } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import styles from '../styles/BugReportModal.module.css';

const BugReportModal = ({ isOpen, onClose, currentSong }) => {
  const { t, isClient } = useLanguage();
  useModalScrollLock(isOpen);

  const [formData, setFormData] = useState({
    description: '',
    email: '',
    category: 'bug'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

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

  // Resetar form quando modal abre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        description: '',
        email: '',
        category: 'bug'
      });
      setSubmitStatus(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      setSubmitStatus({ type: 'error', message: 'Por favor, descreva o problema.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Coletar informações do sistema
      const systemInfo = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        currentSong: currentSong ? {
          title: currentSong.title,
          game: currentSong.game,
          id: currentSong.id
        } : null,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        language: navigator.language
      };

      const reportData = {
        ...formData,
        systemInfo,
        type: 'user_report'
      };

      const response = await fetch('/api/bug-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        setSubmitStatus({ 
          type: 'success', 
          message: 'Relatório enviado com sucesso! Obrigado pelo feedback.' 
        });
        
        // Fechar modal após 2 segundos
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error('Erro ao enviar relatório');
      }
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: 'Erro ao enviar relatório. Tente novamente.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>
            <FaBug className={styles.icon} />
            <h2>{isClient ? t('report_bug') : 'Reportar Problema'}</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            Encontrou um bug ou tem uma sugestão? Nos ajude a melhorar o LudoMusic!
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="category">Tipo de Relatório</label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={styles.select}
              >
                <option value="bug">🐛 Bug/Erro</option>
                <option value="suggestion">💡 Sugestão</option>
                <option value="audio">🎵 Problema de Áudio</option>
                <option value="ui">🎨 Problema de Interface</option>
                <option value="other">❓ Outro</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="description">Descrição do Problema *</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o problema ou sugestão em detalhes..."
                className={styles.textarea}
                rows={5}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="email">Email (opcional)</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="seu@email.com (para receber atualizações)"
                className={styles.input}
              />
            </div>

            {currentSong && (
              <div className={styles.songInfo}>
                <h4>🎵 Música Atual:</h4>
                <p>{currentSong.game} - {currentSong.title}</p>
              </div>
            )}

            {submitStatus && (
              <div className={`${styles.status} ${styles[submitStatus.type]}`}>
                {submitStatus.message}
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || !formData.description.trim()}
              >
                {isSubmitting ? (
                  'Enviando...'
                ) : (
                  <>
                    <FaPaperPlane />
                    Enviar Relatório
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BugReportModal;
