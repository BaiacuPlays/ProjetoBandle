import { useState, useEffect } from 'react';
import { FaTimes, FaInfoCircle, FaUserPlus, FaShieldAlt } from 'react-icons/fa';
import styles from '../styles/ResetNotification.module.css';

const ResetNotification = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se a notificação já foi vista
    const hasSeenResetNotification = localStorage.getItem('hasSeenResetNotification_2025');
    
    if (!hasSeenResetNotification) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    // Marcar como vista e fechar
    localStorage.setItem('hasSeenResetNotification_2025', 'true');
    setIsVisible(false);
  };

  const handleBackdropClick = (e) => {
    // Fechar apenas se clicar no backdrop, não no modal
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.iconTitle}>
            <FaInfoCircle className={styles.icon} />
            <h2>Atualização Importante do LudoMusic</h2>
          </div>
          <button className={styles.closeButton} onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <FaUserPlus className={styles.sectionIcon} />
              <h3>🎉 Novo Sistema de Perfis!</h3>
            </div>
            <p>
              Agora o LudoMusic conta com um sistema completo de perfis de usuário! 
              Você pode criar sua conta, personalizar seu perfil, adicionar amigos 
              e acompanhar suas estatísticas de jogo.
            </p>
            <ul className={styles.featureList}>
              <li>✨ Perfis personalizáveis com foto e biografia</li>
              <li>🏆 Sistema de XP, níveis e conquistas</li>
              <li>👥 Sistema de amigos</li>
              <li>📊 Estatísticas detalhadas de jogos</li>
              <li>🎮 Progresso salvo permanentemente</li>
            </ul>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <FaShieldAlt className={styles.sectionIcon} />
              <h3>🔄 Reset de Dados</h3>
            </div>
            <div className={styles.warningBox}>
              <p>
                <strong>Importante:</strong> Por motivos de segurança e para implementar 
                melhorias no sistema, todos os dados de usuários foram resetados.
              </p>
              <p>
                Se você criou uma conta no dia <strong>31 de maio</strong>,
                será necessário criar uma nova conta, pois os dados anteriores
                foram removidos durante os testes de segurança, limpe os cookies ou o cache
                do seu navegador e crie a conta novamente, peço desculpas por qualquer inconveniente.
              </p>
            </div>
          </div>

          <div className={styles.section}>
            <h3>🚀 Como começar:</h3>
            <ol className={styles.stepsList}>
              <li>Clique no ícone de perfil no canto superior direito</li>
              <li>Crie sua conta ou faça login</li>
              <li>Personalize seu perfil</li>
              <li>Comece a jogar e ganhar XP!</li>
            </ol>
          </div>

          <div className={styles.footer}>
            <p className={styles.thanks}>
              Obrigado pela compreensão e aproveite as novas funcionalidades! 🎵
            </p>
            <button className={styles.gotItButton} onClick={handleClose}>
              Entendi! Vamos começar 🎮
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetNotification;
