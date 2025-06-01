import React, { useState, useEffect } from 'react';
import { browserCompatibility } from '../utils/browserCompatibility';
import styles from '../styles/BrowserCompatibilityWarning.module.css';

const BrowserCompatibilityWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [browserInfo, setBrowserInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const info = browserCompatibility.getBrowserInfo();
    setBrowserInfo(info);

    // Verificar se o usuário já dispensou o aviso
    const dismissedKey = `ludomusic_browser_warning_dismissed_${info.name}`;
    const wasDismissed = localStorage.getItem(dismissedKey) === 'true';
    
    if (info.isProblematic && !wasDismissed) {
      setShowWarning(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowWarning(false);
    setDismissed(true);
    
    // Salvar que o usuário dispensou o aviso
    if (browserInfo) {
      const dismissedKey = `ludomusic_browser_warning_dismissed_${browserInfo.name}`;
      localStorage.setItem(dismissedKey, 'true');
    }
  };

  const getBrowserDisplayName = (name, variant) => {
    switch (name) {
      case 'safari': return 'Safari';
      case 'edge': return 'Microsoft Edge';
      case 'opera': return variant === 'gx' ? 'Opera GX' : 'Opera';
      case 'firefox': return 'Firefox';
      case 'chrome': return 'Chrome';
      default: return 'seu navegador';
    }
  };

  const getRecommendedBrowsers = () => {
    return ['Chrome', 'Firefox'];
  };

  if (!showWarning || dismissed || !browserInfo?.isProblematic) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            ⚠️ Compatibilidade do Navegador
          </h3>
          <button 
            className={styles.closeButton}
            onClick={handleDismiss}
            aria-label="Fechar aviso"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.warning}>
            <p>
              Detectamos que você está usando <strong>{getBrowserDisplayName(browserInfo.name, browserInfo.variant)}</strong>.
              Este navegador pode ter problemas de compatibilidade com o player de áudio do jogo.
            </p>
          </div>

          <div className={styles.issues}>
            <h4>Possíveis problemas:</h4>
            <ul>
              <li>🔄 Carregamento lento ou travado do áudio</li>
              <li>▶️ Botão play pode não responder</li>
              <li>🔇 Problemas de reprodução de som</li>
              <li>🌐 Site pode ficar lento ou não responder</li>
            </ul>
          </div>

          <div className={styles.recommendations}>
            <h4>Recomendações:</h4>
            <div className={styles.browserList}>
              {getRecommendedBrowsers().map((browser) => (
                <div key={browser} className={styles.browserItem}>
                  <span className={styles.browserIcon}>
                    {browser === 'Chrome' ? '🟢' : '🟠'}
                  </span>
                  <span className={styles.browserName}>{browser}</span>
                  <span className={styles.browserStatus}>
                    {browser === 'Chrome' ? 'Recomendado' : 'Compatível'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.tips}>
            <h4>Se você continuar com {getBrowserDisplayName(browserInfo.name, browserInfo.variant)}:</h4>
            <ul>
              <li>🔄 Use o botão "Resetar Áudio" se o carregamento travar</li>
              <li>🔃 Recarregue a página se o site ficar lento</li>
              <li>🔊 Certifique-se de que o áudio está habilitado</li>
              <li>📱 Em dispositivos móveis, toque na tela antes de tentar reproduzir</li>
            </ul>
          </div>

          <div className={styles.actions}>
            <button 
              className={styles.primaryButton}
              onClick={handleDismiss}
            >
              Entendi, continuar mesmo assim
            </button>
          </div>

          <div className={styles.note}>
            <small>
              💡 Este aviso aparece apenas uma vez por navegador. 
              Você pode sempre trocar de navegador para uma melhor experiência.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserCompatibilityWarning;
