import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { FaShare, FaTwitter, FaFacebook, FaCopy, FaCheck } from 'react-icons/fa';
import styles from '../styles/ShareButton.module.css';

const ShareButton = ({ gameResult, currentSong, isInfiniteMode = false, infiniteStats = null }) => {
  const { t, isClient } = useLanguage();
  const { updateSocialStats } = useUserProfile();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gerar texto para compartilhamento
  const generateShareText = () => {
    if (isInfiniteMode && infiniteStats) {
      return `🎵 LudoMusic - Modo Infinito\n🔥 Sequência: ${infiniteStats.currentStreak} músicas\n🏆 Melhor recorde: ${infiniteStats.bestRecord}\n\nTeste seus conhecimentos musicais de videogames:`;
    }

    if (!gameResult || !currentSong) return '';

    const attempts = gameResult.attempts || 0;
    const won = gameResult.won;

    let text = '';
    if (won) {
      text = isClient
        ? t('share_text_won').replace('{attempts}', attempts)
        : `Acertei a música em ${attempts} tentativas no LudoMusic! 🎵`;
    } else {
      text = isClient
        ? t('share_text_lost')
        : 'Não consegui acertar esta música no LudoMusic! 🎵';
    }

    // Adicionar apenas o título da música (sem o jogo)
    text += `\n🎵 ${currentSong.title}`;

    // Adicionar grid de tentativas (similar ao Wordle)
    if (won) {
      text += '\n\n';
      for (let i = 1; i <= 6; i++) {
        if (i <= attempts) {
          text += i === attempts ? '🟢' : '🟡';
        } else {
          text += '⬜';
        }
      }
    }

    text += '\n\n' + (isClient ? t('share_url_text') : 'Teste seus conhecimentos musicais de videogames:');

    return text;
  };

  const shareUrl = 'https://ludomusic.xyz';

  const handleShare = (platform) => {
    const text = generateShareText();

    // Atualizar estatísticas sociais do perfil
    if (updateSocialStats) {
      try {
        updateSocialStats('share_game');
      } catch (error) {
        console.warn('Erro ao atualizar estatísticas sociais:', error);
      }
    }

    switch (platform) {
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
        break;

      case 'facebook':
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`;
        window.open(facebookUrl, '_blank', 'width=550,height=420');
        break;

      case 'copy':
        const fullText = `${text}\n${shareUrl}`;
        navigator.clipboard.writeText(fullText).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
          // Fallback para navegadores mais antigos
          const textArea = document.createElement('textarea');
          textArea.value = fullText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
        break;

      case 'native':
        if (navigator.share) {
          navigator.share({
            title: 'LudoMusic',
            text: text,
            url: shareUrl
          });
        }
        break;
    }

    setShowShareMenu(false);
  };

  return (
    <div className={styles.shareContainer}>
      <button
        className={styles.shareButton}
        onClick={() => setShowShareMenu(!showShareMenu)}
      >
        <FaShare />
        {isClient ? t('share_result') : 'Compartilhar Resultado'}
      </button>

      {showShareMenu && (
        <div className={styles.shareMenu}>
          <div className={styles.shareOptions}>
            <button
              className={styles.shareOption}
              onClick={() => handleShare('twitter')}
            >
              <FaTwitter />
              Twitter
            </button>

            <button
              className={styles.shareOption}
              onClick={() => handleShare('facebook')}
            >
              <FaFacebook />
              Facebook
            </button>

            <button
              className={styles.shareOption}
              onClick={() => handleShare('copy')}
            >
              {copied ? <FaCheck /> : <FaCopy />}
              {copied
                ? (isClient ? t('result_copied') : 'Copiado!')
                : (isClient ? t('copy_result') : 'Copiar')
              }
            </button>

            {/* Botão de compartilhamento nativo (mobile) */}
            {navigator.share && (
              <button
                className={styles.shareOption}
                onClick={() => handleShare('native')}
              >
                <FaShare />
                {isClient ? t('share_result') : 'Compartilhar'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
