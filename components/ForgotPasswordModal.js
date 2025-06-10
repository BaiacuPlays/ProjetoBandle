// Modal para solicitar reset de senha
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from '../styles/ForgotPasswordModal.module.css';
import { FaEnvelope, FaUser, FaTimes, FaArrowLeft } from 'react-icons/fa';

const ForgotPasswordModal = ({ isOpen, onClose, onBack }) => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    emailOrUsername: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Não renderizar se não estiver aberto
  if (!isOpen) return null;

  // Função para lidar com mudanças nos inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro ao digitar
    if (error) setError('');
  };

  // Função para validar formulário
  const validateForm = () => {
    if (!formData.emailOrUsername.trim()) {
      setError('Email ou nome de usuário é obrigatório');
      return false;
    }

    return true;
  };

  // Função para submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🔑 [FORGOT-PASSWORD] Iniciando submit do formulário');
    console.log('🔑 [FORGOT-PASSWORD] Dados do formulário:', formData);

    if (!validateForm()) {
      console.log('🔑 [FORGOT-PASSWORD] Validação falhou');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const input = formData.emailOrUsername.trim();

      // Determinar se é email ou username
      const isEmail = input.includes('@');
      const requestData = {
        action: 'request',
        [isEmail ? 'email' : 'username']: input
      };

      console.log('🔑 [FORGOT-PASSWORD] Dados da requisição:', requestData);
      console.log('🔑 [FORGOT-PASSWORD] URL:', '/api/password-reset');

      const response = await fetch('/api/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('🔑 [FORGOT-PASSWORD] Status da resposta:', response.status);
      console.log('🔑 [FORGOT-PASSWORD] Headers da resposta:', response.headers);

      const data = await response.json();
      console.log('🔑 [FORGOT-PASSWORD] Dados da resposta:', data);

      if (data.success) {
        console.log('🔑 [FORGOT-PASSWORD] Sucesso! Mostrando tela de confirmação');
        setSuccess(true);
        setFormData({ emailOrUsername: '' });
      } else {
        console.log('🔑 [FORGOT-PASSWORD] Erro na resposta:', data.error);
        setError(data.error || 'Erro ao solicitar reset de senha');
      }
    } catch (error) {
      console.error('🔑 [FORGOT-PASSWORD] Erro na requisição:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para voltar ao login
  const handleBackToLogin = () => {
    setSuccess(false);
    setError('');
    setFormData({ emailOrUsername: '' });
    onBack && onBack();
  };

  // Função para fechar modal
  const handleClose = () => {
    setSuccess(false);
    setError('');
    setFormData({ emailOrUsername: '' });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {onBack && (
              <button
                className={styles.backButton}
                onClick={handleBackToLogin}
                type="button"
              >
                <FaArrowLeft />
              </button>
            )}
            <h2 className={styles.title}>
              Esqueci a Senha
            </h2>
          </div>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            type="button"
          >
            <FaTimes />
          </button>
        </div>

        {!success ? (
          <>
            {/* Descrição */}
            <div className={styles.description}>
              <p>Digite seu email ou nome de usuário para receber um link de redefinição de senha.</p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Campo Email/Username */}
              <div className={styles.inputGroup}>
                <label htmlFor="emailOrUsername" className={styles.label}>
                  <FaEnvelope /> Email ou Nome de Usuário
                </label>
                <input
                  type="text"
                  id="emailOrUsername"
                  name="emailOrUsername"
                  value={formData.emailOrUsername}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Digite seu email ou nome de usuário"
                  disabled={isLoading}
                  autoComplete="username email"
                />
              </div>

              {/* Mensagem de Erro */}
              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}

              {/* Botão Submit */}
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className={styles.loading}>
                    Enviando...
                  </span>
                ) : (
                  'Enviar Link de Reset'
                )}
              </button>
            </form>

            {/* Voltar ao Login */}
            {onBack && (
              <div className={styles.backSection}>
                <p>Lembrou da senha?</p>
                <button
                  type="button"
                  className={styles.backLinkButton}
                  onClick={handleBackToLogin}
                  disabled={isLoading}
                >
                  Voltar ao Login
                </button>
              </div>
            )}
          </>
        ) : (
          /* Tela de Sucesso */
          <div className={styles.successContent}>
            <div className={styles.successIcon}>
              <FaEnvelope />
            </div>

            <h3 className={styles.successTitle}>
              Email Enviado!
            </h3>

            <div className={styles.successDescription}>
              <p>Se o email/usuário existir em nossa base de dados, você receberá um link para redefinir sua senha.</p>
              <p>Verifique sua caixa de entrada e também a pasta de spam.</p>
            </div>

            <div className={styles.successActions}>
              <button
                type="button"
                className={styles.successButton}
                onClick={handleBackToLogin}
              >
                Voltar ao Login
              </button>

              <button
                type="button"
                className={styles.resendButton}
                onClick={() => setSuccess(false)}
              >
                Enviar Novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
