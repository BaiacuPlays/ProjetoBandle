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
import { useRouter } from 'next/router';

const GameMenu = ({ isOpen, onClose }) => {
  const { t, language, changeLanguage, isClient } = useLanguage();
  const router = useRouter();
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
    error: null,
    successMessage: null
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
      // Método 1: Tentar enviar via EmailJS (serviço gratuito)
      try {
        // Carregar EmailJS se não estiver carregado
        if (typeof window.emailjs === 'undefined') {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
          document.head.appendChild(script);

          // Aguardar o script carregar
          await new Promise((resolve) => {
            script.onload = resolve;
          });

          // Inicializar EmailJS com chave pública
          window.emailjs.init('YOUR_PUBLIC_KEY'); // Você precisará configurar isso
        }

        // Tentar enviar via EmailJS
        const templateParams = {
          to_email: 'andreibonatto8@gmail.com',
          from_name: errorReport.email || 'Usuário Anônimo',
          message: errorReport.description,
          user_email: errorReport.email || 'Não informado',
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toLocaleString('pt-BR')
        };

        // Esta parte só funcionará se você configurar o EmailJS
        // Por enquanto, vamos pular direto para o método 2
        throw new Error('EmailJS não configurado');

      } catch (emailjsError) {
        console.log('EmailJS não disponível, usando método alternativo');

        // Método 2: Usar a API interna (mesmo que tenha problemas, vai logar)
        try {
          const reportData = {
            description: errorReport.description.trim(),
            email: errorReport.email.trim() || '',
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
          };

          const response = await fetch('/api/send-error-simple', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
          });

          const result = await response.json();

          if (response.ok && result.success) {
            setErrorReport({
              description: '',
              email: '',
              submitting: false,
              submitted: true,
              error: null,
              successMessage: 'Relatório recebido! Verifique os logs do servidor para confirmação.'
            });
            return;
          }
        } catch (apiError) {
          console.log('API também falhou, usando mailto');
        }

        // Método 3: Fallback garantido - mailto
        const subject = encodeURIComponent('Relatório de Erro - LudoMusic');
        const body = encodeURIComponent(
          `Descrição do erro: ${errorReport.description}\n\n` +
          `Email para contato: ${errorReport.email || 'Não informado'}\n\n` +
          `URL: ${window.location.href}\n` +
          `Navegador: ${navigator.userAgent}\n` +
          `Data: ${new Date().toLocaleString('pt-BR')}\n\n` +
          `--- INSTRUÇÕES ---\n` +
          `Este email foi gerado automaticamente pelo sistema de relatório de erro do LudoMusic.\n` +
          `Por favor, envie este email para que possamos receber seu relatório.`
        );

        // Abrir o cliente de email do usuário
        window.open(`mailto:andreibonatto8@gmail.com?subject=${subject}&body=${body}`, '_blank');

        // Marcar como enviado
        setErrorReport({
          description: '',
          email: '',
          submitting: false,
          submitted: true,
          error: null,
          successMessage: 'Cliente de email aberto! Por favor, envie o email que foi preparado automaticamente.'
        });
      }
    } catch (error) {
      console.error('Erro geral:', error);
      setErrorReport(prev => ({
        ...prev,
        submitting: false,
        error: 'Erro ao processar relatório. Tente enviar diretamente para: andreibonatto8@gmail.com'
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.menuOverlay}>
      <div className={styles.menuContainer}>
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
                  <p>✅ Obrigado pelo seu relatório!</p>
                  <p>{errorReport.successMessage || 'Sua mensagem foi recebida com sucesso.'}</p>
                  <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.5rem' }}>
                    📧 Os relatórios são enviados para: andreibonatto8@gmail.com
                  </p>
                  <button
                    className={styles.actionButton}
                    onClick={() => setErrorReport(prev => ({
                      ...prev,
                      submitted: false,
                      successMessage: null,
                      description: '',
                      email: '',
                      error: null
                    }))}
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
