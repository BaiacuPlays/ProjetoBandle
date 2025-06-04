import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faQuestionCircle,
  faCog,
  faBug,
  faPaperPlane,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/GameMenu.module.css';
import { useLanguage } from '../contexts/LanguageContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { useRouter } from 'next/router';

const GameMenu = ({ isOpen, onClose }) => {
  const { t, language, changeLanguage, isClient } = useLanguage();
  const router = useRouter();

  // Bloquear/desbloquear scroll da página
  useModalScrollLock(isOpen);

  const [expandedSections, setExpandedSections] = useState({
    howToPlay: false,
    settings: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Configurações
  const [settings, setSettings] = useState({
    daltonicMode: false,
    sound: true,
    animations: true,
    language: 'pt-BR'
  });

  // Carregar configurações do localStorage ao iniciar
  useEffect(() => {
    const savedSettings = localStorage.getItem('ludomusic_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsedSettings
        }));

        // Sincronizar com o contexto de idioma
        if (parsedSettings.language && parsedSettings.language !== language) {
          changeLanguage(parsedSettings.language);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, [language, changeLanguage]);

  const handleSettingChange = (setting) => {
    const newSettings = {
      ...settings,
      [setting]: !settings[setting]
    };

    setSettings(newSettings);

    // Salvar no localStorage
    localStorage.setItem('ludomusic_settings', JSON.stringify(newSettings));

    // Aplicar as configurações imediatamente
    applySettings(newSettings);
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    const newSettings = {
      ...settings,
      language: newLanguage
    };

    // Salvar no localStorage antes de qualquer outra operação
    localStorage.setItem('ludomusic_settings', JSON.stringify(newSettings));

    // Definir um cookie para persistir o idioma entre recarregamentos
    document.cookie = `ludomusic_language=${newLanguage}; path=/; max-age=31536000`; // 1 ano

    setSettings(newSettings);

    // Usar o contexto para mudar o idioma
    changeLanguage(newLanguage);

    // Forçar a atualização da página para aplicar as traduções em todos os componentes
    // Isso é necessário porque alguns componentes podem não estar usando o contexto de idioma
    setTimeout(() => {
      window.location.reload();
    }, 500);


  };

  // Função para aplicar as configurações
  const applySettings = (settingsToApply) => {

    // Aplicar modo daltônico
    if (settingsToApply.daltonicMode) {
      document.body.classList.add('daltonism');
    } else {
      document.body.classList.remove('daltonism');
    }

    // Aplicar configuração de som
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.muted = !settingsToApply.sound;

      // Garantir que o volume seja restaurado quando o som for ativado
      if (settingsToApply.sound && audio.volume === 0) {
        audio.volume = 0.7; // Volume padrão
      }
    });

    // Aplicar configuração de animações
    if (settingsToApply.animations) {
      document.body.classList.remove('no-animations');
    } else {
      document.body.classList.add('no-animations');
    }

    // Disparar um evento personalizado para notificar a aplicação sobre a mudança
    const event = new CustomEvent('ludomusicSettingsChanged', {
      detail: settingsToApply
    });
    document.dispatchEvent(event);
  };

  // Aplicar configurações ao montar o componente
  useEffect(() => {
    // Aplicar configurações iniciais
    applySettings(settings);

    // Função para lidar com mudanças de configuração de outros componentes
    const handleExternalSettingsChange = () => {
      const savedSettings = localStorage.getItem('ludomusic_settings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
        } catch (error) {
          console.error('Erro ao carregar configurações externas:', error);
        }
      }
    };

    // Adicionar listener para o evento
    window.addEventListener('storage', handleExternalSettingsChange);

    // Limpar listener ao desmontar
    return () => {
      window.removeEventListener('storage', handleExternalSettingsChange);
    };
  }, []);

  // Garantir que as configurações sejam aplicadas quando o componente é montado
  useEffect(() => {
    // Aplicar configurações sempre que o estado de settings mudar
    applySettings(settings);
  }, [settings]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.menuOverlay} onClick={onClose}>
      <div className={styles.menuContainer} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        {/* Multiplayer */}
        <div className={styles.menuSection}>
          <button
            className={styles.menuSectionHeader}
            onClick={() => {
              onClose();
              router.push('/multiplayer');
            }}
            style={{ justifyContent: 'center' }}
          >
            <FontAwesomeIcon icon={faUsers} className={styles.menuIcon} />
            <span>{isClient ? t('multiplayer') : 'Multiplayer'}</span>
          </button>
        </div>

        {/* Como jogar */}
        <div className={styles.menuSection}>
          <button
            className={styles.menuSectionHeader}
            onClick={() => toggleSection('howToPlay')}
          >
            <FontAwesomeIcon icon={faQuestionCircle} className={styles.menuIcon} />
            <span>{isClient ? t('menu_how_to_play') : 'Como jogar'}</span>
            <span className={styles.expandIcon}>{expandedSections.howToPlay ? '▼' : '▶'}</span>
          </button>
          {expandedSections.howToPlay && (
            <div className={styles.menuSectionContent}>
              <p>{isClient ? t('how_to_play_1') : '1. Clique play para ouvir um trecho da música.'}</p>
              <p>{isClient ? t('how_to_play_2') : '2. Procure pela música que você acha que o trecho pertence.'}</p>
              <p>{isClient ? t('how_to_play_3') : '3. Clique skip para passar para o próximo trecho.'}</p>
              <p>{isClient ? t('how_to_play_4') : '4. Se você errar, revelaremos um trecho adicional da música para ajudar.'}</p>
              <p>{isClient ? t('how_to_play_5') : '5. Você tem 6 tentativas no total.'}</p>
            </div>
          )}
        </div>

        {/* Configurações */}
        <div className={styles.menuSection}>
          <button
            className={styles.menuSectionHeader}
            onClick={() => toggleSection('settings')}
          >
            <FontAwesomeIcon icon={faCog} className={styles.menuIcon} />
            <span>{isClient ? t('menu_settings') : 'Configurações'}</span>
            <span className={styles.expandIcon}>{expandedSections.settings ? '▼' : '▶'}</span>
          </button>
          {expandedSections.settings && (
            <div className={styles.menuSectionContent}>
              <div className={styles.settingItem}>
                <label htmlFor="daltonicMode" onClick={() => handleSettingChange('daltonicMode')} style={{ cursor: 'pointer' }}>{isClient ? t('settings_colorblind') : 'Modo daltônico'}</label>
                <div className={styles.toggleSwitch} onClick={() => handleSettingChange('daltonicMode')}>
                  <input
                    type="checkbox"
                    id="daltonicMode"
                    checked={settings.daltonicMode}
                    onChange={() => {}}
                  />
                  <span className={styles.slider}></span>
                </div>
              </div>
              <div className={styles.settingItem}>
                <label htmlFor="sound" onClick={() => handleSettingChange('sound')} style={{ cursor: 'pointer' }}>{isClient ? t('settings_sound') : 'Sons'}</label>
                <div className={styles.toggleSwitch} onClick={() => handleSettingChange('sound')}>
                  <input
                    type="checkbox"
                    id="sound"
                    checked={settings.sound}
                    onChange={() => {}}
                  />
                  <span className={styles.slider}></span>
                </div>
              </div>
              <div className={styles.settingItem}>
                <label htmlFor="animations" onClick={() => handleSettingChange('animations')} style={{ cursor: 'pointer' }}>{isClient ? t('settings_animations') : 'Animações'}</label>
                <div className={styles.toggleSwitch} onClick={() => handleSettingChange('animations')}>
                  <input
                    type="checkbox"
                    id="animations"
                    checked={settings.animations}
                    onChange={() => {}}
                  />
                  <span className={styles.slider}></span>
                </div>
              </div>
              <div className={styles.settingItem}>
                <label htmlFor="language">{isClient ? t('settings_language') : 'Idioma'}</label>
                <select
                  id="language"
                  className={styles.selectInput}
                  value={settings.language}
                  onChange={handleLanguageChange}
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Relatório de Bug */}
        <div className={styles.menuSection}>
          <button
            className={styles.menuSectionHeader}
            onClick={() => {
              // Abrir modal de bug report se disponível
              if (typeof window !== 'undefined' && window.openBugReport) {
                window.openBugReport();
                onClose(); // Fechar menu
              } else {
                // Fallback para email
                const subject = encodeURIComponent('Relatório de Erro - LudoMusic');
                const body = encodeURIComponent(
                  `Olá! Encontrei um erro no LudoMusic.\n\n` +
                  `Descrição do erro: [Descreva o problema aqui]\n\n` +
                  `URL: ${window.location.href}\n` +
                  `Navegador: ${navigator.userAgent}\n` +
                  `Data: ${new Date().toLocaleString('pt-BR')}`
                );
                window.open(`mailto:andreibonatto8@gmail.com?subject=${subject}&body=${body}`, '_blank');
              }
            }}
            style={{ justifyContent: 'center' }}
          >
            <FontAwesomeIcon icon={faBug} className={styles.menuIcon} />
            <span>{isClient ? t('report_error') : 'Reportar Erro'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default GameMenu;
