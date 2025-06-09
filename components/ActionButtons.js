import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';
import { FaShare, FaBug, FaHeart, FaCopy, FaYoutube, FaTwitter, FaFacebook, FaCheck } from 'react-icons/fa';

import styles from '../styles/ActionButtons.module.css';

const ActionButtons = ({ gameResult, currentSong, isInfiniteMode = false, infiniteStats = null }) => {
  const { t, isClient } = useLanguage();
  const { updateProfile } = useProfile() || {};
  const [showShareMenu, setShowShareMenu] = useState(false);

  const [copied, setCopied] = useState(false);

  // Gerar texto para compartilhamento (sem nome do jogo)
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

  const handleShareClick = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleShare = (platform) => {
    const text = generateShareText();
    const shareUrl = 'https://ludomusic.xyz';

    // Atualizar estatísticas sociais do perfil (simplificado)
    if (updateProfile) {
      try {
        // Podemos implementar tracking de compartilhamentos depois se necessário
      } catch (error) {
        // Silent error handling
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

  const handleErrorReportClick = () => {
    // Abrir modal de bug report se disponível
    if (typeof window !== 'undefined' && window.openBugReport) {
      window.openBugReport();
    } else {
      // Fallback para email
      const subject = encodeURIComponent('Relatório de Erro - LudoMusic');
      const body = encodeURIComponent(
        `Olá! Encontrei um erro no LudoMusic.\n\n` +
        `Descrição do erro: [Descreva o problema aqui]\n\n` +
        `Música atual: ${currentSong?.title || 'N/A'}\n` +
        `Jogo: ${currentSong?.game || 'N/A'}\n` +
        `URL: ${window.location.href}\n` +
        `Navegador: ${navigator.userAgent}\n` +
        `Data: ${new Date().toLocaleString('pt-BR')}`
      );
      window.open(`mailto:andreibonatto8@gmail.com?subject=${subject}&body=${body}`, '_blank');
    }
  };

  const handleSupportClick = () => {
    // Abrir modal de doação em vez de link quebrado
    if (typeof window !== 'undefined' && window.openDonationModal) {
      window.openDonationModal();
    } else {
      // Fallback para email
      window.open('mailto:andreibonatto8@gmail.com?subject=Apoio%20ao%20LudoMusic', '_blank');
    }
  };

  const handleCopyLinkClick = () => {
    const url = 'https://ludomusic.xyz';
    navigator.clipboard.writeText(url).then(() => {
      // Feedback visual de que foi copiado
      const button = document.querySelector(`.${styles.actionButton}[data-action="copy"]`);
      if (button) {
        const originalText = button.querySelector('span').textContent;
        button.querySelector('span').textContent = 'Copiado!';
        setTimeout(() => {
          button.querySelector('span').textContent = originalText;
        }, 2000);
      }
    }).catch(() => {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  // Extrair ID do YouTube do audioUrl se disponível
  const getYouTubeId = (audioUrl) => {
    if (!audioUrl) return null;
    const match = audioUrl.match(/youtube_([a-zA-Z0-9_-]+)_audio/);
    return match ? match[1] : null;
  };

  const handleYouTubeClick = () => {
    const youtubeId = getYouTubeId(currentSong?.audioUrl);
    if (youtubeId) {
      window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank');
    } else {
      // Fallback: buscar no YouTube
      const searchQuery = encodeURIComponent(`${currentSong?.title} ${currentSong?.game} soundtrack`);
      window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
    }
  };

  return (
    <div className={styles.actionButtonsContainer}>
      <div className={styles.actionButtonsGrid}>
        {/* Botão de Compartilhar */}
        <div className={styles.actionButtonWrapper}>
          <button
            className={styles.actionButton}
            onClick={handleShareClick}
            title={isClient ? t('share_result') : 'Compartilhar Resultado'}
            data-action="share"
          >
            <FaShare />
            <span>{isClient ? t('share') : 'Compartilhar'}</span>
          </button>

          {/* Menu de compartilhamento direto */}
          {showShareMenu && (
            <div className={styles.shareMenuWrapper}>
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
            </div>
          )}
        </div>

        {/* Botão do YouTube */}
        <button
          className={styles.actionButton}
          onClick={handleYouTubeClick}
          title="Ver no YouTube"
          data-action="youtube"
        >
          <FaYoutube />
          <span>YouTube</span>
        </button>

        {/* Botão de Relatório de Erro */}
        <button
          className={styles.actionButton}
          onClick={handleErrorReportClick}
          title={isClient ? t('error_report_title') : 'Relatório de Erro'}
          data-action="error"
        >
          <FaBug />
          <span>{isClient ? t('report_error') : 'Reportar Erro'}</span>
        </button>

        {/* Botão de Copiar Link */}
        <button
          className={styles.actionButton}
          onClick={handleCopyLinkClick}
          title="Copiar Link do Jogo"
          data-action="copy"
        >
          <FaCopy />
          <span>Copiar Link</span>
        </button>

        {/* Botão de Apoiar */}
        <button
          className={styles.actionButton}
          onClick={handleSupportClick}
          title="Apoiar o Projeto"
          data-action="support"
        >
          <FaHeart />
          <span>Apoiar</span>
        </button>
      </div>


    </div>
  );
};

export default ActionButtons;
