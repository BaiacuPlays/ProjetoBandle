/**
 * Página de teste para o sistema de estatísticas à prova de balas
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AchievementSystemTest from '../components/AchievementSystemTest';
import styles from '../styles/TestPage.module.css';

const TestBulletproofPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [showTest, setShowTest] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    // Mostrar teste apenas se estiver autenticado
    setShowTest(isAuthenticated);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.loginPrompt}>
          <h1>🔐 Acesso Restrito</h1>
          <p>Você precisa estar logado para acessar o teste do sistema de estatísticas.</p>
          <p>Por favor, faça login para continuar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🧪 Teste do Sistema de Estatísticas</h1>
        <p>Bem-vindo, <strong>{user?.username}</strong>! Esta página permite testar o novo sistema de estatísticas à prova de balas.</p>

        <div className={styles.infoBox}>
          <h3>ℹ️ Sobre este Sistema</h3>
          <ul>
            <li><strong>À Prova de Balas:</strong> Nunca perde dados, sempre salva na Vercel KV</li>
            <li><strong>Auto-Reparo:</strong> Detecta e corrige problemas automaticamente</li>
            <li><strong>Backup Automático:</strong> Cria backups antes de qualquer alteração</li>
            <li><strong>Validação Contínua:</strong> Verifica integridade das estatísticas</li>
            <li><strong>Retry Automático:</strong> Tenta novamente em caso de falha</li>
          </ul>
        </div>

        <div className={styles.warningBox}>
          <h3>⚠️ Importante</h3>
          <p>Este é um ambiente de teste. Todas as operações são reais e afetarão seu perfil atual.
             Backups são criados automaticamente antes de qualquer alteração.</p>
        </div>
      </div>

      {showTest && <AchievementSystemTest />}
    </div>
  );
};

export default TestBulletproofPage;
