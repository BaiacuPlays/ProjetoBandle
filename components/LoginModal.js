// Modal de Login/Registro
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useLanguage } from '../contexts/LanguageContext';
import ForgotPasswordModal from './ForgotPasswordModal';
import styles from '../styles/LoginModal.module.css';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';

const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { register, login } = useAuth();
  const { profile } = useUserProfile();
  const { t } = useLanguage();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (!formData.username.trim()) {
      setError('Nome de usuário é obrigatório');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Nome de usuário deve ter pelo menos 3 caracteres');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Nome de usuário pode conter apenas letras, números e underscore');
      return false;
    }

    if (!formData.password) {
      setError('Senha é obrigatória');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (!isLoginMode && formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      return false;
    }

    return true;
  };

  // Função para submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      let result;
      
      if (isLoginMode) {
        result = await login(formData.username, formData.password);
      } else {
        // Passar ID do perfil anônimo para migração
        const anonymousUserId = profile?.id || null;
        result = await register(formData.username, formData.password, formData.email, anonymousUserId);
      }

      if (result.success) {
        // Sucesso - fechar modal e notificar
        onSuccess && onSuccess(result.user);
        onClose();
        
        // Resetar formulário
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          email: ''
        });
      } else {
        setError(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro no formulário:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para alternar entre login e registro
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      email: ''
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isLoginMode ? 'Entrar na Conta' : 'Criar Conta'}
          </h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            <FaTimes />
          </button>
        </div>

        {/* Descrição */}
        <div className={styles.description}>
          {isLoginMode ? (
            <p>Entre com sua conta para acessar seu perfil de qualquer lugar!</p>
          ) : (
            <p>Crie uma conta para salvar seu progresso permanentemente!</p>
          )}
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Campo Username */}
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>
              <FaUser /> Nome de Usuário
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Digite seu nome de usuário"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          {/* Campo Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              <FaLock /> Senha
            </label>
            <div className={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Digite sua senha"
                disabled={isLoading}
                autoComplete={isLoginMode ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Campo Email (apenas no registro) */}
          {!isLoginMode && (
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                <FaUser /> Email (opcional)
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Digite seu email (para recuperação de senha)"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          )}

          {/* Campo Confirmar Senha (apenas no registro) */}
          {!isLoginMode && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                <FaLock /> Confirmar Senha
              </label>
              <div className={styles.passwordContainer}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Confirme sua senha"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          )}

          {/* Mensagem de Erro */}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Link Esqueci Senha (apenas no login) */}
          {isLoginMode && (
            <div className={styles.forgotPasswordSection}>
              <button
                type="button"
                className={styles.forgotPasswordButton}
                onClick={() => setShowForgotPassword(true)}
                disabled={isLoading}
              >
                Esqueci minha senha
              </button>
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
                {isLoginMode ? 'Entrando...' : 'Criando conta...'}
              </span>
            ) : (
              isLoginMode ? 'Entrar' : 'Criar Conta'
            )}
          </button>
        </form>

        {/* Toggle entre Login/Registro */}
        <div className={styles.toggleSection}>
          <p>
            {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </p>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={toggleMode}
            disabled={isLoading}
          >
            {isLoginMode ? 'Criar Conta' : 'Fazer Login'}
          </button>
        </div>

        {/* Informação sobre migração (apenas no registro) */}
        {!isLoginMode && profile && (
          <div className={styles.migrationInfo}>
            <p>✨ Seu progresso atual será mantido na nova conta!</p>
          </div>
        )}
      </div>

      {/* Modal de Esqueci Senha */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBack={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default LoginModal;
