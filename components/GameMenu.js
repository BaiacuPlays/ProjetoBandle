import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faQuestionCircle,
  faCog,
  faBug,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/GameMenu.module.css';
import { useLanguage } from '../contexts/LanguageContext';

const GameMenu = ({ isOpen, onClose }) => {
  const { t, language, changeLanguage, isClient } = useLanguage();
  const [expandedSections, setExpandedSections] = useState({
    howToPlay: false,
    settings: false,
    errorReport: false
  });

  // Estado para o formulário de relatório de erro
  const [errorReport, setErrorReport] = useState({
    description: '',
    email: '',
    submitting: false,
    submitted: false,
    error: null
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
    const savedSettings = localStorage.getItem('bandle_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        console.log('Configurações carregadas no GameMenu:', parsedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsedSettings
        }));

        // Sincronizar com o contexto de idioma
        if (parsedSettings.language && parsedSettings.language !== language) {
          console.log('Sincronizando idioma com o contexto:', parsedSettings.language);
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
    localStorage.setItem('bandle_settings', JSON.stringify(newSettings));

    // Aplicar as configurações imediatamente
    applySettings(newSettings);

    // Log para debug
    console.log(`Setting changed: ${setting} = ${newSettings[setting]}`);
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    const newSettings = {
      ...settings,
      language: newLanguage
    };

    // Salvar no localStorage antes de qualquer outra operação
    localStorage.setItem('bandle_settings', JSON.stringify(newSettings));
    console.log('Configurações salvas no localStorage:', newSettings);

    // Definir um cookie para persistir o idioma entre recarregamentos
    document.cookie = `bandle_language=${newLanguage}; path=/; max-age=31536000`; // 1 ano
    console.log('Cookie de idioma definido:', newLanguage);

    setSettings(newSettings);

    // Usar o contexto para mudar o idioma
    changeLanguage(newLanguage);

    // Forçar a atualização da página para aplicar as traduções em todos os componentes
    // Isso é necessário porque alguns componentes podem não estar usando o contexto de idioma
    setTimeout(() => {
      console.log('Recarregando a página com o idioma:', newLanguage);
      window.location.reload();
    }, 500);

    console.log(`Idioma alterado para: ${newLanguage}`);
  };

  // Função para aplicar as configurações
  const applySettings = (settingsToApply) => {
    console.log('Aplicando configurações:', settingsToApply);

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
    const event = new CustomEvent('bandleSettingsChanged', {
      detail: settingsToApply
    });
    document.dispatchEvent(event);
  };

  // Aplicar configurações ao montar o componente
  useEffect(() => {
    // Aplicar configurações iniciais
    applySettings(settings);
    console.log('Configurações iniciais aplicadas:', settings);

    // Função para lidar com mudanças de configuração de outros componentes
    const handleExternalSettingsChange = () => {
      const savedSettings = localStorage.getItem('bandle_settings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
          console.log('Configurações externas carregadas:', parsedSettings);
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
    console.log('Configurações atualizadas:', settings);
  }, [settings]);

  // Função para atualizar o estado do formulário de relatório de erro
  const handleErrorReportChange = (e) => {
    const { name, value } = e.target;
    setErrorReport(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para enviar o relatório de erro
  const submitErrorReport = async (e) => {
    e.preventDefault();

    // Validação básica
    if (!errorReport.description.trim()) {
      setErrorReport(prev => ({
        ...prev,
        error: 'Por favor, descreva o erro encontrado.'
      }));
      return;
    }

    setErrorReport(prev => ({
      ...prev,
      submitting: true,
      error: null
    }));

    try {
      // Construir o link mailto com os parâmetros
      const subject = encodeURIComponent('Relatório de Erro - Bandle');
      const body = encodeURIComponent(`Descrição do erro: ${errorReport.description}\n\nEmail para contato: ${errorReport.email || 'Não informado'}`);

      // Abrir o cliente de email do usuário
      window.location.href = `mailto:andreibonatto8@gmail.com?subject=${subject}&body=${body}`;

      // Marcar como enviado após um pequeno delay para dar tempo de abrir o cliente de email
      setTimeout(() => {
        setErrorReport({
          description: '',
          email: '',
          submitting: false,
          submitted: true,
          error: null
        });
      }, 1000);
    } catch (error) {
      setErrorReport(prev => ({
        ...prev,
        submitting: false,
        error: 'Erro ao enviar o relatório. Por favor, tente novamente.'
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.menuOverlay}>
      <div className={styles.menuContainer}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

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

        {/* Relatório de erro */}
        <div className={styles.menuSection}>
          <button
            className={styles.menuSectionHeader}
            onClick={() => toggleSection('errorReport')}
          >
            <FontAwesomeIcon icon={faBug} className={styles.menuIcon} />
            <span>{isClient ? t('error_report_title') : 'Relatório de erro'}</span>
            <span className={styles.expandIcon}>{expandedSections.errorReport ? '▼' : '▶'}</span>
          </button>
          {expandedSections.errorReport && (
            <div className={styles.menuSectionContent}>
              <p>Encontrou um bug? Informe-nos para que possamos corrigi-lo.</p>

              {errorReport.submitted ? (
                <div className={styles.successMessage}>
                  <p>Obrigado pelo seu relatório!</p>
                  <p>Sua mensagem foi enviada com sucesso.</p>
                  <button
                    className={styles.actionButton}
                    onClick={() => setErrorReport(prev => ({ ...prev, submitted: false }))}
                  >
                    Enviar outro relatório
                  </button>
                </div>
              ) : (
                <form onSubmit={submitErrorReport} className={styles.errorReportForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="description">Descrição do erro:</label>
                    <textarea
                      id="description"
                      name="description"
                      value={errorReport.description}
                      onChange={handleErrorReportChange}
                      placeholder="Descreva o problema que você encontrou..."
                      rows={4}
                      className={styles.textArea}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Seu email (opcional):</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={errorReport.email}
                      onChange={handleErrorReportChange}
                      placeholder="Seu email para contato (opcional)"
                      className={styles.textInput}
                    />
                  </div>

                  {errorReport.error && (
                    <div className={styles.errorMessage}>
                      {errorReport.error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={errorReport.submitting}
                  >
                    {errorReport.submitting ? 'Enviando...' : 'Enviar Relatório'}
                    <FontAwesomeIcon icon={faPaperPlane} className={styles.submitIcon} />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default GameMenu;
