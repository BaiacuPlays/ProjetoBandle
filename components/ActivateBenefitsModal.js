import React, { useState } from 'react';
import styles from '../styles/ActivateBenefitsModal.module.css';
import DonationBenefitsModal from './DonationBenefitsModal';

const ActivateBenefitsModal = ({ isOpen, onClose }) => {
  const [activationCode, setActivationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [activatedBenefits, setActivatedBenefits] = useState([]);
  const [activatedAmount, setActivatedAmount] = useState(0);

  if (!isOpen) return null;

  const handleActivate = async () => {
    console.log('🎁 [DEBUG] Iniciando ativação de código:', activationCode);

    if (!activationCode.trim()) {
      setError('Por favor, digite um código de ativação');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      console.log('🎁 [DEBUG] Session token:', sessionToken ? 'Presente' : 'Ausente');

      if (!sessionToken) {
        setError('Você precisa estar logado para ativar benefícios');
        setIsLoading(false);
        return;
      }

      console.log('🎁 [DEBUG] Fazendo requisição para /api/activate-benefits');

      const response = await fetch('/api/activate-benefits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          activationCode: activationCode.trim()
        })
      });

      console.log('🎁 [DEBUG] Response status:', response.status);
      console.log('🎁 [DEBUG] Response ok:', response.ok);

      const data = await response.json();
      console.log('🎁 [DEBUG] Response data:', data);

      if (!response.ok) {
        setError(data.error || 'Erro ao ativar código');
        return;
      }

      // Sucesso! Mostrar benefícios ativados
      const benefits = formatBenefitsForDisplay(data.benefits);
      setActivatedBenefits(benefits);
      setActivatedAmount(data.amount);
      setShowBenefitsModal(true);
      
      // Limpar formulário
      setActivationCode('');
      onClose();

    } catch (error) {
      console.error('Erro ao ativar código:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBenefitsForDisplay = (benefits) => {
    const formatted = [];

    if (benefits.badges) {
      benefits.badges.forEach(badge => {
        if (badge === 'supporter_temp') {
          formatted.push('💝 Badge "Apoiador" por 30 dias');
        } else if (badge === 'supporter_permanent') {
          formatted.push('💝 Badge "Apoiador" permanente');
        } else if (badge === 'premium_supporter') {
          formatted.push('⭐ Badge "Apoiador Premium"');
        } else if (badge === 'vip_supporter') {
          formatted.push('👑 Badge "VIP" permanente');
        }
      });
    }

    if (benefits.xpBonus) {
      const days = Math.round(benefits.xpBonus.duration / (24 * 60 * 60 * 1000));
      const multiplier = Math.round((benefits.xpBonus.multiplier - 1) * 100);
      formatted.push(`⚡ +${multiplier}% XP por ${days} dias`);
    }

    if (benefits.avatars && benefits.avatars.length > 0) {
      formatted.push('🎨 Avatar especial desbloqueado');
    }

    if (benefits.nameColors && benefits.nameColors.length > 0) {
      formatted.push('✨ Cores especiais no nome');
    }

    if (benefits.features) {
      if (benefits.features.includes('customTitle')) {
        formatted.push('🏷️ Título personalizado');
      }
      if (benefits.features.includes('detailedStats')) {
        formatted.push('📊 Estatísticas detalhadas');
      }
      if (benefits.features.includes('cloudBackup')) {
        formatted.push('💾 Backup na nuvem');
      }
      if (benefits.features.includes('visualEffects')) {
        formatted.push('🎆 Efeitos visuais especiais');
      }
      if (benefits.features.includes('supporterRanking')) {
        formatted.push('🏆 Ranking especial de apoiadores');
      }
      if (benefits.features.includes('customPlaylist')) {
        formatted.push('🎵 Playlist personalizada');
      }
    }

    if (benefits.extraLives) {
      formatted.push('❤️ Vidas extras no modo infinito');
    }

    return formatted;
  };

  const handleCodeChange = (e) => {
    let value = e.target.value.toUpperCase();
    // Formatar automaticamente como LUDO-XXXX-XXXX-XXXX
    value = value.replace(/[^A-Z0-9]/g, '');
    if (value.length > 4) {
      value = value.substring(0, 4) + '-' + value.substring(4);
    }
    if (value.length > 9) {
      value = value.substring(0, 9) + '-' + value.substring(9);
    }
    if (value.length > 14) {
      value = value.substring(0, 14) + '-' + value.substring(14);
    }
    if (value.length > 19) {
      value = value.substring(0, 19);
    }
    if (value.length >= 4 && !value.startsWith('LUDO-')) {
      value = 'LUDO-' + value;
    }
    setActivationCode(value);
  };

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>🎁 Ativar Benefícios</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          </div>

          <div className={styles.modalContent}>
            <div className={styles.description}>
              <p>Digite o código de ativação que você recebeu por email após fazer uma doação:</p>
            </div>

            <div className={styles.codeInput}>
              <label htmlFor="activationCode">Código de Ativação:</label>
              <input
                type="text"
                id="activationCode"
                value={activationCode}
                onChange={handleCodeChange}
                placeholder="LUDO-XXXX-XXXX-XXXX"
                className={styles.input}
                maxLength={19}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className={styles.error}>
                ❌ {error}
              </div>
            )}

            <div className={styles.actions}>
              <button
                onClick={handleActivate}
                disabled={isLoading || !activationCode.trim()}
                className={styles.activateButton}
              >
                {isLoading ? '⏳ Ativando...' : '🎁 Ativar Benefícios'}
              </button>
            </div>

            <div className={styles.help}>
              <h4>💡 Precisa de ajuda?</h4>
              <ul>
                <li>Verifique seu email (incluindo spam) após fazer uma doação</li>
                <li>O código tem formato: LUDO-XXXX-XXXX-XXXX</li>
                <li>Códigos expiram em 30 dias</li>
                <li>Cada código só pode ser usado uma vez</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de benefícios ativados */}
      <DonationBenefitsModal
        isOpen={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
        amount={activatedAmount}
        benefits={activatedBenefits}
      />
    </>
  );
};

export default ActivateBenefitsModal;
