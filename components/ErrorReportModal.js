import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FaTimes, FaPaperPlane, FaBug } from 'react-icons/fa';
import styles from '../styles/ErrorReportModal.module.css';

const ErrorReportModal = ({ isOpen, onClose, currentSong = null, gameResult = null }) => {
  const { t, isClient } = useLanguage();
  const [errorReport, setErrorReport] = useState({
    type: 'error',
    description: '',
    email: '',
    submitting: false,
    submitted: false,
    error: null,
    successMessage: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setErrorReport(prev => ({
      ...prev,
      [name]: value,
      error: null // Limpar erro quando usuário digita
    }));
  };

  const handleTypeChange = (type) => {
    setErrorReport(prev => ({
      ...prev,
      type: type,
      error: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação básica
    if (!errorReport.description.trim()) {
      setErrorReport(prev => ({
        ...prev,
        error: 'Por favor, descreva o problema encontrado.'
      }));
      return;
    }

    setErrorReport(prev => ({
      ...prev,
      submitting: true,
      error: null
    }));

    try {
      // Preparar dados do relatório
      const reportData = {
        type: errorReport.type,
        description: errorReport.description.trim(),
        email: errorReport.email.trim() || '',
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        gameContext: currentSong ? {
          game: currentSong.game,
          title: currentSong.title,
          gameResult: gameResult
        } : null
      };

      // Tentar enviar via API (que usa Discord webhook)
      const response = await fetch('/api/send-error-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setErrorReport({
          type: 'error',
          description: '',
          email: '',
          submitting: false,
          submitted: true,
          error: null,
          successMessage: result.message || 'Relatório enviado com sucesso!'
        });
      } else {
        throw new Error(result.message || 'Erro ao enviar relatório');
      }
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);

      // Fallback: abrir cliente de email
      const subject = encodeURIComponent(`Relatório de ${errorReport.type === 'error' ? 'Erro' : errorReport.type === 'suggestion' ? 'Sugestão' : 'Novo Jogo'} - LudoMusic`);
      const body = encodeURIComponent(
        `Tipo: ${errorReport.type === 'error' ? 'Erro' : errorReport.type === 'suggestion' ? 'Sugestão' : 'Novo Jogo/Jogos'}\n\n` +
        `Descrição: ${errorReport.description}\n\n` +
        `Email para contato: ${errorReport.email || 'Não informado'}\n\n` +
        `Contexto do jogo: ${currentSong ? `${currentSong.game} - ${currentSong.title}` : 'Não aplicável'}\n\n` +
        `URL: ${window.location.href}\n` +
        `Navegador: ${navigator.userAgent}\n` +
        `Data: ${new Date().toLocaleString('pt-BR')}`
      );

      window.open(`mailto:andreibonatto8@gmail.com?subject=${subject}&body=${body}`, '_blank');

      setErrorReport({
        type: 'error',
        description: '',
        email: '',
        submitting: false,
        submitted: true,
        error: null,
        successMessage: 'Cliente de email aberto! Por favor, envie o email que foi preparado automaticamente.'
      });
    }
  };

  const handleClose = () => {
    if (!errorReport.submitting) {
      setErrorReport({
        type: 'error',
        description: '',
        email: '',
        submitting: false,
        submitted: false,
        error: null,
        successMessage: null
      });
      onClose();
    }
  };

  const handleNewReport = () => {
    setErrorReport({
      type: 'error',
      description: '',
      email: '',
      submitting: false,
      submitted: false,
      error: null,
      successMessage: null
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <FaBug className={styles.headerIcon} />
            <h3>{isClient ? t('error_report_title') : 'Relatório de Erro'}</h3>
          </div>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={errorReport.submitting}
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.content}>
          {errorReport.submitted ? (
            <div className={styles.successContent}>
              <div className={styles.successIcon}>✅</div>
              <h4>Obrigado pelo seu relatório!</h4>
              <p>{errorReport.successMessage}</p>
              <p className={styles.emailInfo}>
                📧 Os relatórios são enviados para: andreibonatto8@gmail.com
              </p>
              <div className={styles.buttonGroup}>
                <button
                  className={styles.secondaryButton}
                  onClick={handleNewReport}
                >
                  Enviar outro relatório
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={handleClose}
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Tipo de relatório */}
              <div className={styles.typeSelector}>
                <label>Tipo de relatório:</label>
                <div className={styles.typeOptions}>
                  <button
                    type="button"
                    className={`${styles.typeOption} ${errorReport.type === 'error' ? styles.active : ''}`}
                    onClick={() => handleTypeChange('error')}
                  >
                    🐛 Erro
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeOption} ${errorReport.type === 'suggestion' ? styles.active : ''}`}
                    onClick={() => handleTypeChange('suggestion')}
                  >
                    💡 Sugestão
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeOption} ${errorReport.type === 'newgame' ? styles.active : ''}`}
                    onClick={() => handleTypeChange('newgame')}
                  >
                    🎮 Novo jogo/jogos
                  </button>
                </div>
              </div>

              {/* Contexto atual do jogo */}
              {currentSong && (
                <div className={styles.gameContext}>
                  <label>Música atual:</label>
                  <div className={styles.contextInfo}>
                    <strong>{currentSong.game}</strong> - {currentSong.title}
                  </div>
                </div>
              )}

              {/* Descrição */}
              <div className={styles.formGroup}>
                <label htmlFor="description">
                  {errorReport.type === 'error' ? 'Descrição do erro:' :
                   errorReport.type === 'suggestion' ? 'Sua sugestão:' :
                   'Quais jogos gostaria de ver no LudoMusic?'}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={errorReport.description}
                  onChange={handleInputChange}
                  placeholder={
                    errorReport.type === 'error' ? 'Descreva o problema que você encontrou...' :
                    errorReport.type === 'suggestion' ? 'Descreva sua sugestão de melhoria...' :
                    'Liste os jogos que gostaria de ver adicionados...'
                  }
                  rows={4}
                  className={styles.textarea}
                  required
                />
              </div>

              {/* Email */}
              <div className={styles.formGroup}>
                <label htmlFor="email">Seu email (opcional):</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={errorReport.email}
                  onChange={handleInputChange}
                  placeholder="Seu email para contato (opcional)"
                  className={styles.input}
                />
              </div>

              {/* Erro */}
              {errorReport.error && (
                <div className={styles.errorMessage}>
                  {errorReport.error}
                </div>
              )}

              {/* Botões */}
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleClose}
                  disabled={errorReport.submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={errorReport.submitting}
                >
                  {errorReport.submitting ? (
                    'Enviando...'
                  ) : (
                    <>
                      <FaPaperPlane />
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorReportModal;
