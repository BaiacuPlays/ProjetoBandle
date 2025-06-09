// Modal para migração de perfis antigos para o sistema Steam-like
import React, { useState } from 'react';
import { FaRocket, FaShieldAlt, FaCloud, FaTimes, FaCheck } from 'react-icons/fa';
import styles from '../styles/ProfileMigrationModal.module.css';

const ProfileMigrationModal = ({ isOpen, onClose, onMigrate, oldProfile }) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStep, setMigrationStep] = useState(0);

  const migrationSteps = [
    'Validando dados existentes...',
    'Criando estrutura Steam-like...',
    'Migrando estatísticas...',
    'Migrando conquistas e badges...',
    'Salvando na nuvem...',
    'Finalizando migração...'
  ];

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMigrationStep(0);

    try {
      // Simular progresso da migração
      for (let i = 0; i < migrationSteps.length; i++) {
        setMigrationStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Executar migração real
      await onMigrate();
      
      // Aguardar um pouco para mostrar conclusão
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onClose();
    } catch (error) {
      console.error('Erro na migração:', error);
      alert('Erro na migração. Tente novamente.');
    } finally {
      setIsMigrating(false);
      setMigrationStep(0);
    }
  };

  if (!isOpen) return null;

  const getDataSummary = () => {
    if (!oldProfile) return null;

    return {
      games: oldProfile.stats?.totalGames || 0,
      wins: oldProfile.stats?.wins || 0,
      achievements: Array.isArray(oldProfile.achievements) 
        ? oldProfile.achievements.length 
        : oldProfile.achievements?.unlocked?.length || 0,
      level: oldProfile.level || 1,
      xp: oldProfile.xp || 0
    };
  };

  const dataSummary = getDataSummary();

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>

        <div className={styles.header}>
          <FaRocket className={styles.headerIcon} />
          <h2>Atualização do Sistema de Perfil</h2>
          <p>Migre seu perfil para o novo sistema tipo Steam!</p>
        </div>

        {!isMigrating ? (
          <>
            <div className={styles.benefits}>
              <h3>🎮 Novos Recursos</h3>
              <div className={styles.benefitsList}>
                <div className={styles.benefit}>
                  <FaShieldAlt />
                  <div>
                    <strong>Dados Sempre Seguros</strong>
                    <p>Seus dados nunca mais se perderão</p>
                  </div>
                </div>
                <div className={styles.benefit}>
                  <FaCloud />
                  <div>
                    <strong>Sincronização em Nuvem</strong>
                    <p>Acesse seu perfil de qualquer dispositivo</p>
                  </div>
                </div>
                <div className={styles.benefit}>
                  <FaCheck />
                  <div>
                    <strong>Sistema Robusto</strong>
                    <p>Backup automático e recuperação de dados</p>
                  </div>
                </div>
              </div>
            </div>

            {dataSummary && (
              <div className={styles.dataSummary}>
                <h3>📊 Seus Dados Atuais</h3>
                <div className={styles.statsGrid}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{dataSummary.games}</span>
                    <span className={styles.statLabel}>Jogos</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{dataSummary.wins}</span>
                    <span className={styles.statLabel}>Vitórias</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{dataSummary.achievements}</span>
                    <span className={styles.statLabel}>Conquistas</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{dataSummary.level}</span>
                    <span className={styles.statLabel}>Nível</span>
                  </div>
                </div>
                <p className={styles.preserveNote}>
                  ✅ Todos esses dados serão preservados na migração
                </p>
              </div>
            )}

            <div className={styles.actions}>
              <button 
                className={styles.migrateButton}
                onClick={handleMigrate}
              >
                <FaRocket />
                Migrar Agora
              </button>
              <button 
                className={styles.cancelButton}
                onClick={onClose}
              >
                Mais Tarde
              </button>
            </div>
          </>
        ) : (
          <div className={styles.migrationProgress}>
            <div className={styles.progressHeader}>
              <h3>🔄 Migrando seu perfil...</h3>
              <p>Por favor, não feche esta janela</p>
            </div>

            <div className={styles.progressSteps}>
              {migrationSteps.map((step, index) => (
                <div 
                  key={index}
                  className={`${styles.progressStep} ${
                    index <= migrationStep ? styles.active : ''
                  } ${
                    index < migrationStep ? styles.completed : ''
                  }`}
                >
                  <div className={styles.stepIcon}>
                    {index < migrationStep ? (
                      <FaCheck />
                    ) : index === migrationStep ? (
                      <div className={styles.spinner} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className={styles.stepText}>{step}</span>
                </div>
              ))}
            </div>

            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ 
                  width: `${((migrationStep + 1) / migrationSteps.length) * 100}%` 
                }}
              />
            </div>

            <p className={styles.progressText}>
              {Math.round(((migrationStep + 1) / migrationSteps.length) * 100)}% concluído
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileMigrationModal;
