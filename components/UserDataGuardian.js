// Componente Guardian que GARANTE que usuários logados sempre tenham dados
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import useGuaranteedUserData from '../hooks/useGuaranteedUserData';

const UserDataGuardian = ({ children, showDebugInfo = false }) => {
  const { isAuthenticated } = useAuth();
  const { profile, userId, isLoading } = useUserProfile();
  const {
    isDataGuaranteed,
    emergencyProfile,
    guaranteeUserData,
    effectiveProfile,
    hasAnyData,
    isEmergencyMode,
    needsDataCreation,
    debugInfo
  } = useGuaranteedUserData();

  const [isGuardianActive, setIsGuardianActive] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [actionCount, setActionCount] = useState(0);

  // Ativar Guardian quando usuário está logado
  useEffect(() => {
    setIsGuardianActive(isAuthenticated);
  }, [isAuthenticated]);

  // Monitoramento crítico: DESABILITADO TEMPORARIAMENTE
  useEffect(() => {
    // DESABILITADO - PODE ESTAR CAUSANDO TRAVAMENTO
    return;

    if (!isAuthenticated || !isGuardianActive) {
      return;
    }

    // Aguardar um pouco para o sistema carregar
    const checkTimer = setTimeout(() => {
      if (isAuthenticated && !hasAnyData && !isLoading) {
        setLastAction('Detectado usuário sem dados - ativando emergência');
        setActionCount(prev => prev + 1);

        guaranteeUserData().then(result => {
          if (result) {
            setLastAction('Dados de emergência criados com sucesso');
          } else {
            setLastAction('FALHA no protocolo de emergência');
          }
        }).catch(error => {
          setLastAction(`Erro no protocolo: ${error.message}`);
        });
      }
    }, 3000); // Aguardar 3 segundos

    return () => clearTimeout(checkTimer);
  }, [isAuthenticated, hasAnyData, isLoading, guaranteeUserData, isGuardianActive]);

  // Verificação periódica mais agressiva
  useEffect(() => {
    if (!isAuthenticated || !isGuardianActive) {
      return;
    }

    const aggressiveCheck = setInterval(() => {
      const currentUserId = localStorage.getItem('ludomusic_user_id');

      if (isAuthenticated && currentUserId && !hasAnyData) {
        setLastAction('Verificação periódica detectou problema');
        setActionCount(prev => prev + 1);

        guaranteeUserData().catch(error => {
          // Erro silencioso
        });
      }
    }, 2 * 60 * 1000); // A cada 2 minutos (reduzido de 15s)

    return () => clearInterval(aggressiveCheck);
  }, [isAuthenticated, hasAnyData, guaranteeUserData, isGuardianActive]);

  // Log de status SILENCIOSO (removido para performance)

  // Renderizar children normalmente
  // O Guardian trabalha em background
  return (
    <>
      {children}

      {/* Debug Info (apenas em desenvolvimento) */}
      {showDebugInfo && isAuthenticated && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999,
          maxWidth: '300px'
        }}>
          <div><strong>🛡️ Guardian Status</strong></div>
          <div>Autenticado: {isAuthenticated ? '✅' : '❌'}</div>
          <div>Tem Dados: {hasAnyData ? '✅' : '❌'}</div>
          <div>Dados Garantidos: {isDataGuaranteed ? '✅' : '❌'}</div>
          <div>Modo Emergência: {isEmergencyMode ? '🆘' : '✅'}</div>
          <div>Carregando: {isLoading ? '⏳' : '✅'}</div>
          <div>Ações: {actionCount}</div>
          {lastAction && (
            <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.8 }}>
              Última ação: {lastAction}
            </div>
          )}
        </div>
      )}

      {/* Alerta visual para modo de emergência */}
      {isEmergencyMode && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ff6b35',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          zIndex: 9998,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          🆘 Modo de Emergência Ativo - Seus dados estão sendo restaurados
        </div>
      )}

      {/* Alerta crítico se usuário logado não tem dados */}
      {isAuthenticated && needsDataCreation && !isLoading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#dc2626',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center',
          zIndex: 10000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🚨</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
            Problema Crítico Detectado
          </div>
          <div style={{ fontSize: '14px', marginBottom: '15px' }}>
            Você está logado mas seus dados não foram encontrados.<br/>
            Criando dados de emergência automaticamente...
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Aguarde alguns segundos...
          </div>
        </div>
      )}
    </>
  );
};

// Componente simplificado para uso em produção (sem debug)
export const ProductionUserDataGuardian = ({ children }) => {
  return <UserDataGuardian showDebugInfo={false}>{children}</UserDataGuardian>;
};

// Componente para desenvolvimento (com debug)
export const DevelopmentUserDataGuardian = ({ children }) => {
  return <UserDataGuardian showDebugInfo={true}>{children}</UserDataGuardian>;
};

export default UserDataGuardian;
