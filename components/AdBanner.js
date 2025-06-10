import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/AdBanner.module.css';

const AdBanner = ({
  slot,
  format = 'auto',
  responsive = true,
  style = {},
  className = '',
  placement = 'default'
}) => {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    // Verificar se AdSense está disponível
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      try {
        // Inicializar anúncio
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);

        // Track ad impression
        trackAdImpression(placement, slot);
      } catch (error) {
        setAdError(true);
      }
    }
  }, [slot, placement]);

  const trackAdImpression = (placement, slot) => {
    // Analytics para impressões de anúncios
    if (typeof gtag !== 'undefined') {
      gtag('event', 'ad_impression', {
        ad_placement: placement,
        ad_slot: slot,
        ad_format: format
      });
    }

    // Registrar impressão no backend
    fetch('/api/analytics/ad-impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placement,
        slot,
        format,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      // Silent error handling
    });
  };

  const handleAdClick = () => {
    // Track ad click
    if (typeof gtag !== 'undefined') {
      gtag('event', 'ad_click', {
        ad_placement: placement,
        ad_slot: slot
      });
    }
  };

  if (adError) {
    return (
      <div className={`${styles.adFallback} ${className}`}>
        <div className={styles.fallbackContent}>
          <p>🎵 Apoie o LudoMusic</p>
          <button
            className={styles.donateButton}
            onClick={() => {
              try {
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                  window.dispatchEvent(new CustomEvent('openDonationModal'));
                }
              } catch (error) {
                // Erro suprimido para produção
              }
            }}
          >
            💝 Fazer uma Doação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.adContainer} ${className}`} style={style}>
      <div className={styles.adLabel}>Publicidade</div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-1007836460713451"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
        onClick={handleAdClick}
      />

      {!adLoaded && (
        <div className={styles.adPlaceholder}>
          <div className={styles.loadingSpinner}></div>
          <p>Carregando anúncio...</p>
        </div>
      )}
    </div>
  );
};

// Componentes específicos para diferentes posições
export const HeaderAd = () => (
  <AdBanner
    slot="1234567890"
    format="horizontal"
    placement="header"
    className={styles.headerAd}
  />
);

export const SidebarAd = () => (
  <AdBanner
    slot="2345678901"
    format="vertical"
    placement="sidebar"
    className={styles.sidebarAd}
  />
);

export const BetweenGamesAd = () => (
  <AdBanner
    slot="3456789012"
    format="rectangle"
    placement="between_games"
    className={styles.betweenGamesAd}
  />
);

export const FooterAd = () => (
  <AdBanner
    slot="4567890123"
    format="horizontal"
    placement="footer"
    className={styles.footerAd}
  />
);

// Anúncio simples entre jogos
export const SimpleInterstitialAd = ({ isOpen, onClose }) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.interstitialOverlay}>
      <div className={styles.interstitialContent}>
        <div className={styles.interstitialHeader}>
          <h3>🎵 Obrigado por jogar!</h3>
          <span className={styles.countdown}>
            Próximo jogo em {countdown}s
          </span>
        </div>

        <div className={styles.interstitialAd}>
          <AdBanner
            slot="5678901234"
            format="large_rectangle"
            placement="interstitial"
            style={{ width: '100%', height: '300px' }}
          />
        </div>

        <div className={styles.interstitialFooter}>
          <p>💝 Gosta do LudoMusic? Considere fazer uma doação!</p>
          <button
            className={styles.donateButton}
            onClick={() => {
              onClose();
              window.dispatchEvent(new CustomEvent('openDonationModal'));
            }}
          >
            💝 Apoiar o Projeto
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
