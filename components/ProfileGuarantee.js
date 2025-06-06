// Componente que GARANTE que usuários logados vejam seus dados
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useGuaranteedProfile } from '../hooks/useGuaranteedProfile';
import styles from '../styles/ProfileGuarantee.module.css';

const ProfileGuarantee = ({ children }) => {
  const { isAuthenticated, getAuthenticatedUserId } = useAuth();
  const { profile, userId, isLoading } = useUserProfile();
  const { isGuaranteed, hasValidData, attempts, forceReload } = useGuaranteedProfile();
  
  const [showForceButton, setShowForceButton] = useState(false);
  const [isForcing, setIsForcing] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Mostrar botão de força após várias tentativas falharam
  useEffect(() => {
    if (isAuthenticated && !hasValidData && attempts >= 3) {
      setShowForceButton(true);
    } else {
      setShowForceButton(false);
    }
  }, [isAuthenticated, hasValidData, attempts]);

  // Countdown para reload automático
  useEffect(() => {
    if (isAuthenticated && !hasValidData && attempts >= 5) {
      setCountdown(10);
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            window.location.reload();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isAuthenticated, hasValidData, attempts]);

  const handleForceReload = async () => {
    setIsForcing(true);
    try {
      await forceReload();
      // Aguardar um pouco e recarregar a página
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Erro ao forçar reload:', error);
      setIsForcing(false);
    }
  };

  // Se usuário não está autenticado, mostrar conteúdo normalmente
  if (!isAuthenticated) {
    return children;
  }

  // Se temos dados válidos, mostrar conteúdo normalmente
  if (hasValidData) {
    return children;
  }

  // Se está carregando normalmente, mostrar loading
  if (isLoading && attempts < 2) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Carregando seus dados...</p>
      </div>
    );
  }

  // Se houve problemas no carregamento, mostrar interface de recuperação
  return (
    <div className={styles.guaranteeContainer}>
      <div className={styles.guaranteeModal}>
        <div className={styles.header}>
          <h2>🔄 Carregando seus dados</h2>
        </div>
        
        <div className={styles.content}>
          <div className={styles.status}>
            <div className={styles.statusIcon}>
              {attempts < 3 ? '🔍' : attempts < 5 ? '⚠️' : '🚨'}
            </div>
            
            <div className={styles.statusText}>
              {attempts < 3 && (
                <p>Buscando seus dados... (Tentativa {attempts}/3)</p>
              )}
              
              {attempts >= 3 && attempts < 5 && (
                <p>Dificuldade para carregar seus dados. Tentando métodos alternativos...</p>
              )}
              
              {attempts >= 5 && (
                <p>Problemas persistentes detectados. Recarregando automaticamente em {countdown}s...</p>
              )}
            </div>
          </div>

          <div className={styles.details}>
            <p><strong>Usuário:</strong> {getAuthenticatedUserId()}</p>
            <p><strong>Status:</strong> {isAuthenticated ? 'Autenticado' : 'Não autenticado'}</p>
            <p><strong>Perfil:</strong> {profile ? 'Carregado' : 'Ausente'}</p>
            <p><strong>Tentativas:</strong> {attempts}</p>
          </div>

          {showForceButton && (
            <div className={styles.actions}>
              <button 
                className={styles.forceButton}
                onClick={handleForceReload}
                disabled={isForcing}
              >
                {isForcing ? (
                  <>
                    <span className={styles.spinner}></span>
                    Forçando carregamento...
                  </>
                ) : (
                  '🔧 Forçar Carregamento'
                )}
              </button>
              
              <button 
                className={styles.reloadButton}
                onClick={() => window.location.reload()}
              >
                🔄 Recarregar Página
              </button>
            </div>
          )}

          <div className={styles.info}>
            <p>
              <strong>ℹ️ O que está acontecendo?</strong><br/>
              Estamos garantindo que seus dados apareçam corretamente. 
              Como você está logado, seus dados DEVEM estar visíveis.
            </p>
            
            <details className={styles.technical}>
              <summary>Detalhes técnicos</summary>
              <ul>
                <li>Verificando localStorage...</li>
                <li>Verificando backups...</li>
                <li>Tentando carregar do servidor...</li>
                <li>Criando perfil de emergência se necessário...</li>
              </ul>
            </details>
          </div>
        </div>
      </div>
      
      {/* Overlay escuro */}
      <div className={styles.overlay}></div>
    </div>
  );
};

export default ProfileGuarantee;
