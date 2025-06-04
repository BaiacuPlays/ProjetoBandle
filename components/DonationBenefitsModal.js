import React from 'react';
import styles from '../styles/DonationBenefitsModal.module.css';

const DonationBenefitsModal = ({ isOpen, onClose, amount, benefits }) => {
  if (!isOpen) return null;

  const formatBenefits = (benefits) => {
    const formatted = [];
    
    if (benefits.includes('💝 Badge "Apoiador" por 30 dias')) {
      formatted.push({
        icon: '💝',
        title: 'Badge Apoiador',
        description: 'Exibido no seu perfil por 30 dias',
        type: 'badge'
      });
    }
    
    if (benefits.includes('💝 Badge "Apoiador" permanente')) {
      formatted.push({
        icon: '💝',
        title: 'Badge Apoiador Permanente',
        description: 'Exibido no seu perfil para sempre',
        type: 'badge'
      });
    }
    
    if (benefits.includes('👑 Badge "VIP" permanente')) {
      formatted.push({
        icon: '👑',
        title: 'Badge VIP',
        description: 'Status VIP permanente',
        type: 'badge'
      });
    }
    
    if (benefits.includes('⚡ +25% XP por 7 dias')) {
      formatted.push({
        icon: '⚡',
        title: '+25% XP Bônus',
        description: 'Ganhe mais XP por 7 dias',
        type: 'xp'
      });
    }
    
    if (benefits.includes('⚡ +50% XP por 30 dias')) {
      formatted.push({
        icon: '⚡',
        title: '+50% XP Bônus',
        description: 'Ganhe mais XP por 30 dias',
        type: 'xp'
      });
    }
    
    if (benefits.includes('🎨 Avatar especial desbloqueado')) {
      formatted.push({
        icon: '🎨',
        title: 'Avatars Especiais',
        description: 'Novos avatars exclusivos',
        type: 'cosmetic'
      });
    }
    
    if (benefits.includes('🏷️ Título personalizado')) {
      formatted.push({
        icon: '🏷️',
        title: 'Título Personalizado',
        description: 'Defina seu próprio título',
        type: 'cosmetic'
      });
    }
    
    if (benefits.includes('✨ Cores especiais no nome')) {
      formatted.push({
        icon: '✨',
        title: 'Cores Especiais',
        description: 'Nome dourado, prateado ou rainbow',
        type: 'cosmetic'
      });
    }
    
    if (benefits.includes('📊 Estatísticas detalhadas')) {
      formatted.push({
        icon: '📊',
        title: 'Estatísticas Avançadas',
        description: 'Gráficos e análises detalhadas',
        type: 'feature'
      });
    }
    
    if (benefits.includes('💾 Backup na nuvem')) {
      formatted.push({
        icon: '💾',
        title: 'Backup na Nuvem',
        description: 'Seu progresso sempre seguro',
        type: 'feature'
      });
    }
    
    if (benefits.includes('🎆 Efeitos visuais especiais')) {
      formatted.push({
        icon: '🎆',
        title: 'Efeitos Visuais',
        description: 'Animações especiais nas vitórias',
        type: 'cosmetic'
      });
    }
    
    if (benefits.includes('🏆 Ranking especial de apoiadores')) {
      formatted.push({
        icon: '🏆',
        title: 'Ranking VIP',
        description: 'Apareça no ranking de apoiadores',
        type: 'feature'
      });
    }
    
    if (benefits.includes('🎵 Playlist personalizada')) {
      formatted.push({
        icon: '🎵',
        title: 'Playlist Personalizada',
        description: 'Crie suas próprias playlists',
        type: 'feature'
      });
    }
    
    if (benefits.includes('❤️ Vidas extras no modo infinito')) {
      formatted.push({
        icon: '❤️',
        title: 'Vidas Extras',
        description: '3 vidas extras no modo infinito',
        type: 'gameplay'
      });
    }
    
    return formatted;
  };

  const formattedBenefits = formatBenefits(benefits);

  const getBenefitTypeColor = (type) => {
    switch (type) {
      case 'badge': return '#ff6b6b';
      case 'xp': return '#10b981';
      case 'cosmetic': return '#8b5cf6';
      case 'feature': return '#3b82f6';
      case 'gameplay': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>🎁 Benefícios Recebidos!</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.thankYou}>
            <h3>💖 Obrigado pela doação de R$ {amount}!</h3>
            <p>Você recebeu os seguintes benefícios:</p>
          </div>

          <div className={styles.benefitsList}>
            {formattedBenefits.map((benefit, index) => (
              <div 
                key={index} 
                className={styles.benefitItem}
                style={{ borderLeftColor: getBenefitTypeColor(benefit.type) }}
              >
                <div className={styles.benefitIcon}>{benefit.icon}</div>
                <div className={styles.benefitInfo}>
                  <h4>{benefit.title}</h4>
                  <p>{benefit.description}</p>
                </div>
                <div 
                  className={styles.benefitType}
                  style={{ backgroundColor: getBenefitTypeColor(benefit.type) }}
                >
                  {benefit.type}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <p>✨ Seus benefícios já estão ativos!</p>
            <p>Verifique seu perfil para ver as mudanças.</p>
            
            <button className={styles.profileButton} onClick={onClose}>
              👤 Ver Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationBenefitsModal;
