import React, { useState } from 'react';
import { FaTimes, FaArrowLeft, FaArrowRight, FaTrophy, FaChartLine, FaCog, FaStar } from 'react-icons/fa';
import { useModalScrollLockAlways } from '../hooks/useModalScrollLock';
import styles from '../styles/ProfileTutorial.module.css';

const ProfileTutorial = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Bloquear/desbloquear scroll da página
  useModalScrollLockAlways();

  const tutorialSteps = [
    {
      title: "Bem-vindo ao Sistema de Perfis! 🎉",
      content: (
        <div className={styles.stepContent}>
          <div className={styles.welcomeIcon}>👤</div>
          <p>
            Agora você tem um perfil personalizado que acompanha todo o seu progresso no LudoMusic!
          </p>
          <p>
            Ganhe XP, desbloqueie conquistas, acompanhe suas estatísticas e muito mais.
          </p>
        </div>
      )
    },
    {
      title: "Sistema de XP e Níveis ⭐",
      content: (
        <div className={styles.stepContent}>
          <div className={styles.xpExample}>
            <div className={styles.levelBadge}>Nível 5</div>
            <div className={styles.xpBar}>
              <div className={styles.xpProgress} style={{ width: '60%' }}></div>
            </div>
            <div className={styles.xpText}>1200 / 2000 XP</div>
          </div>
          <p>
            <strong>Ganhe XP jogando:</strong>
          </p>
          <ul>
            <li>🎯 Acertar na 1ª tentativa: +100 XP</li>
            <li>🎵 Vitória normal: +50 XP</li>
            <li>🔥 Bônus por sequência: +10 XP por cada 5 vitórias seguidas</li>
            <li>📚 Tentar mesmo perdendo: +10 XP</li>
          </ul>
        </div>
      )
    },
    {
      title: "Sistema de Conquistas 🏆",
      content: (
        <div className={styles.stepContent}>
          <div className={styles.achievementExample}>
            <div className={styles.achievement}>
              <span className={styles.achievementIcon}>🎯</span>
              <div>
                <div className={styles.achievementTitle}>Perfeccionista</div>
                <div className={styles.achievementDesc}>Acerte 25 músicas na primeira tentativa</div>
                <div className={styles.achievementProgress}>Progresso: 3/25</div>
              </div>
            </div>
          </div>
          <p>
            Desbloqueie conquistas jogando e explorando diferentes aspectos do jogo:
          </p>
          <ul>
            <li>🎮 Conquistas por número de jogos</li>
            <li>🔥 Conquistas por sequências</li>
            <li>⚡ Conquistas por velocidade</li>
            <li>📚 Conquistas por franquias</li>
            <li>👥 Conquistas sociais</li>
          </ul>
        </div>
      )
    },
    {
      title: "Abas do Perfil 📊",
      content: (
        <div className={styles.stepContent}>
          <div className={styles.tabsExample}>
            <div className={styles.tabExample}>
              <FaChartLine /> <span>Visão Geral</span>
              <p>Estatísticas principais, nível, XP e resumo do progresso</p>
            </div>
            <div className={styles.tabExample}>
              <FaTrophy /> <span>Conquistas</span>
              <p>Todas as conquistas desbloqueadas e próximas metas</p>
            </div>
            <div className={styles.tabExample}>
              <FaStar /> <span>Histórico</span>
              <p>Últimos jogos realizados com detalhes de performance</p>
            </div>
            <div className={styles.tabExample}>
              <FaCog /> <span>Configurações</span>
              <p>Preferências, backup de dados e gerenciamento do perfil</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Notificações e Progresso 🔔",
      content: (
        <div className={styles.stepContent}>
          <div className={styles.notificationExample}>
            <div className={styles.mockNotification}>
              <div className={styles.notifIcon}>🏆</div>
              <div>
                <div className={styles.notifTitle}>Conquista Desbloqueada!</div>
                <div className={styles.notifDesc}>Veterano Experiente</div>
                <div className={styles.notifXp}>+300 XP</div>
              </div>
            </div>
          </div>
          <p>
            Receba notificações em tempo real quando:
          </p>
          <ul>
            <li>🏆 Desbloquear uma nova conquista</li>
            <li>⬆️ Subir de nível</li>
            <li>🎯 Atingir marcos importantes</li>
          </ul>
          <p>
            <small>💡 Você pode desativar as notificações nas configurações do perfil.</small>
          </p>
        </div>
      )
    },
    {
      title: "Backup e Segurança 💾",
      content: (
        <div className={styles.stepContent}>
          <div className={styles.backupExample}>
            <div className={styles.backupIcon}>📁</div>
            <p><strong>Seus dados estão seguros!</strong></p>
          </div>
          <p>
            Na aba <strong>Configurações</strong>, você pode:
          </p>
          <ul>
            <li>📤 Exportar seu perfil completo</li>
            <li>📥 Importar dados de backup</li>
            <li>🔄 Resetar perfil (se necessário)</li>
            <li>⚙️ Ajustar preferências</li>
          </ul>
          <p>
            <small>⚠️ Recomendamos fazer backup regularmente!</small>
          </p>
        </div>
      )
    },
    {
      title: "Pronto para Começar! 🚀",
      content: (
        <div className={styles.stepContent}>
          <div className={styles.finalIcon}>🎮</div>
          <p>
            <strong>Agora você está pronto para aproveitar ao máximo o LudoMusic!</strong>
          </p>
          <p>
            Seu progresso será automaticamente salvo a cada jogo. Divirta-se desbloqueando conquistas e subindo de nível!
          </p>
          <div className={styles.tipBox}>
            <strong>💡 Dica:</strong> Clique no ícone do perfil (👤) no canto superior direito para acessar seu perfil a qualquer momento.
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className={styles.tutorialOverlay}>
      <div className={styles.tutorialModal}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>

        <div className={styles.tutorialHeader}>
          <h2>{tutorialSteps[currentStep].title}</h2>
          <div className={styles.stepIndicator}>
            {currentStep + 1} de {tutorialSteps.length}
          </div>
        </div>

        <div className={styles.tutorialBody}>
          {tutorialSteps[currentStep].content}
        </div>

        <div className={styles.tutorialFooter}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
            />
          </div>

          <div className={styles.navigationButtons}>
            <button 
              className={styles.navButton}
              onClick={prevStep}
              disabled={isFirstStep}
            >
              <FaArrowLeft /> Anterior
            </button>

            {isLastStep ? (
              <button 
                className={styles.finishButton}
                onClick={onClose}
              >
                Começar a Jogar! 🎮
              </button>
            ) : (
              <button 
                className={styles.navButton}
                onClick={nextStep}
              >
                Próximo <FaArrowRight />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTutorial;
