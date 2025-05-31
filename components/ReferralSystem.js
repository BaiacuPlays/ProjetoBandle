import React, { useState } from 'react';
import { useFriends } from '../contexts/FriendsContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { FaTimes, FaShare, FaCopy, FaEnvelope, FaWhatsapp, FaTelegram, FaTwitter, FaFacebook, FaCheck } from 'react-icons/fa';
import styles from '../styles/ReferralSystem.module.css';

const ReferralSystem = ({ isOpen, onClose }) => {
  // Bloquear/desbloquear scroll da página
  useModalScrollLock(isOpen);
  const { getReferralLink, referFriend } = useFriends();
  const { profile } = useUserProfile();
  
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const referralLink = getReferralLink();
  const referralCode = profile?.id?.slice(-8).toUpperCase() || 'PLAYER123';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEmailInvite = async () => {
    if (!emailInput.trim()) {
      alert('Digite um email válido');
      return;
    }

    setIsLoading(true);
    try {
      await referFriend(emailInput.trim());
      setEmailSent(true);
      setEmailInput('');
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      alert('Erro ao enviar convite. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialShare = (platform) => {
    const text = `Venha jogar LudoMusic comigo! 🎵🎮 Teste seus conhecimentos musicais de videogames neste jogo incrível!`;
    const url = referralLink;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`);
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>
            <FaShare /> Convide Amigos
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.intro}>
            <h3>Ganhe recompensas convidando amigos!</h3>
            <p>
              Convide seus amigos para jogar LudoMusic e ganhe XP e badges especiais.
              Quanto mais amigos você trouxer, mais recompensas você ganha!
            </p>
          </div>

          <div className={styles.rewards}>
            <h4>Recompensas por Referência:</h4>
            <div className={styles.rewardsList}>
              <div className={styles.rewardItem}>
                <span className={styles.rewardIcon}>🎯</span>
                <span>+100 XP por amigo que se cadastrar</span>
              </div>
              <div className={styles.rewardItem}>
                <span className={styles.rewardIcon}>🏆</span>
                <span>Badge "Influenciador" (10 referências)</span>
              </div>
              <div className={styles.rewardItem}>
                <span className={styles.rewardIcon}>👑</span>
                <span>Título especial "Embaixador"</span>
              </div>
            </div>
          </div>

          <div className={styles.referralInfo}>
            <h4>Seu Código de Referência:</h4>
            <div className={styles.referralCode}>
              <span>{referralCode}</span>
              <button
                className={styles.copyCodeButton}
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <FaCheck /> : <FaCopy />}
              </button>
            </div>
          </div>

          <div className={styles.linkSection}>
            <h4>Seu Link de Convite:</h4>
            <div className={styles.linkBox}>
              <input
                type="text"
                value={referralLink}
                readOnly
                className={styles.linkInput}
              />
              <button
                className={styles.copyButton}
                onClick={handleCopyLink}
              >
                {copied ? <FaCheck /> : <FaCopy />}
              </button>
            </div>
            {copied && (
              <p className={styles.copiedMessage}>✅ Link copiado!</p>
            )}
          </div>

          <div className={styles.emailSection}>
            <h4>Convidar por Email:</h4>
            <div className={styles.emailBox}>
              <input
                type="email"
                placeholder="email@exemplo.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className={styles.emailInput}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailInvite()}
              />
              <button
                className={styles.sendButton}
                onClick={handleEmailInvite}
                disabled={isLoading}
              >
                {isLoading ? '...' : <FaEnvelope />}
              </button>
            </div>
            {emailSent && (
              <p className={styles.sentMessage}>✅ Convite enviado!</p>
            )}
          </div>

          <div className={styles.socialSection}>
            <h4>Compartilhar nas Redes Sociais:</h4>
            <div className={styles.socialButtons}>
              <button
                className={`${styles.socialButton} ${styles.whatsapp}`}
                onClick={() => handleSocialShare('whatsapp')}
              >
                <FaWhatsapp /> WhatsApp
              </button>
              <button
                className={`${styles.socialButton} ${styles.telegram}`}
                onClick={() => handleSocialShare('telegram')}
              >
                <FaTelegram /> Telegram
              </button>
              <button
                className={`${styles.socialButton} ${styles.twitter}`}
                onClick={() => handleSocialShare('twitter')}
              >
                <FaTwitter /> Twitter
              </button>
              <button
                className={`${styles.socialButton} ${styles.facebook}`}
                onClick={() => handleSocialShare('facebook')}
              >
                <FaFacebook /> Facebook
              </button>
            </div>
          </div>

          <div className={styles.stats}>
            <h4>Suas Estatísticas:</h4>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>
                  {profile?.socialStats?.friendsReferred || 0}
                </span>
                <span className={styles.statLabel}>Amigos Referidos</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>
                  {(profile?.socialStats?.friendsReferred || 0) * 100}
                </span>
                <span className={styles.statLabel}>XP Ganho</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralSystem;
