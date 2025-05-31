// Página para redefinir senha
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import styles from '../styles/ResetPasswordPage.module.css';

const ResetPassword = () => {
  const router = useRouter();
  const { token } = router.query;
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  // Verificar validade do token ao carregar
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/password-reset?token=${token}`);
      const data = await response.json();

      if (data.success && data.valid) {
        setTokenValid(true);
        setUserEmail(data.email || '');
      } else {
        setTokenValid(false);
        setError(data.error || 'Token inválido ou expirado');
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      setTokenValid(false);
      setError('Erro ao verificar token');
    }
  };

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
    if (!formData.newPassword) {
      setError('Nova senha é obrigatória');
      return false;
    }

    if (formData.newPassword.length < 6) {
      setError('Nova senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
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
      const response = await fetch('/api/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset',
          token,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFormData({
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.error || 'Erro ao redefinir senha');
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Se ainda está verificando o token
  if (tokenValid === null) {
    return (
      <>
        <Head>
          <title>Redefinir Senha - LudoMusic</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Verificando token...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Se token é inválido
  if (tokenValid === false) {
    return (
      <>
        <Head>
          <title>Token Inválido - LudoMusic</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.errorState}>
              <FaTimesCircle className={styles.errorIcon} />
              <h2>Token Inválido</h2>
              <p>{error}</p>
              <div className={styles.actions}>
                <Link href="/" className={styles.homeButton}>
                  Voltar ao Início
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Se senha foi redefinida com sucesso
  if (success) {
    return (
      <>
        <Head>
          <title>Senha Redefinida - LudoMusic</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.successState}>
              <FaCheckCircle className={styles.successIcon} />
              <h2>Senha Redefinida!</h2>
              <p>Sua senha foi redefinida com sucesso.</p>
              <p>Agora você pode fazer login com sua nova senha.</p>
              <div className={styles.actions}>
                <Link href="/" className={styles.loginButton}>
                  Fazer Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Formulário de redefinição
  return (
    <>
      <Head>
        <title>Redefinir Senha - LudoMusic</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>Redefinir Senha</h1>
            {userEmail && (
              <p className={styles.emailInfo}>
                Para: <strong>{userEmail}</strong>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Campo Nova Senha */}
            <div className={styles.inputGroup}>
              <label htmlFor="newPassword" className={styles.label}>
                <FaLock /> Nova Senha
              </label>
              <div className={styles.passwordContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Digite sua nova senha"
                  disabled={isLoading}
                  autoComplete="new-password"
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

            {/* Campo Confirmar Senha */}
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                <FaLock /> Confirmar Nova Senha
              </label>
              <div className={styles.passwordContainer}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Confirme sua nova senha"
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
                  Redefinindo...
                </span>
              ) : (
                'Redefinir Senha'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <Link href="/" className={styles.backLink}>
              Voltar ao LudoMusic
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
