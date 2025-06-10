import React, { createContext, useState, useContext, useEffect } from 'react';
import { getTranslation } from '../data/translations';

// Criar o contexto
const LanguageContext = createContext();

// Hook personalizado para usar o contexto
export function useLanguage() {
  return useContext(LanguageContext);
}

// Provedor do contexto
export function LanguageProvider({ children }) {
  // Detectar idioma do navegador
  const detectBrowserLanguage = () => {
    if (typeof window === 'undefined') {
      return 'pt-BR'; // Idioma padrão para SSR
    }

    // Tentar múltiplas fontes de idioma
    const browserLang = navigator.language ||
                       navigator.languages?.[0] ||
                       navigator.userLanguage ||
                       navigator.browserLanguage ||
                       'pt-BR';



    // Mapear códigos de idioma do navegador para os suportados
    const langCode = browserLang.toLowerCase();

    if (langCode.startsWith('en')) {
      return 'en-US';
    } else if (langCode.startsWith('es')) {
      return 'es';
    } else if (langCode.startsWith('pt')) {
      return 'pt-BR';
    }

    // Para outros idiomas, usar inglês como fallback internacional
    // (mais provável que um usuário internacional entenda inglês que português)
    return 'en-US';
  };

  // Tentar carregar o idioma do localStorage apenas no cliente
  const getSavedLanguage = () => {
    // Verificar se estamos no cliente (browser)
    if (typeof window === 'undefined') {
      return 'pt-BR'; // Idioma padrão para SSR
    }

    try {
      const savedSettings = localStorage.getItem('ludomusic_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.language) {
          return parsedSettings.language;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar idioma inicial:', error);
    }

    // Se não há idioma salvo, detectar do navegador
    return detectBrowserLanguage();
  };

  const [language, setLanguage] = useState('pt-BR'); // Inicializar com padrão
  const [isClient, setIsClient] = useState(false);

  // Detectar quando estamos no cliente e carregar idioma salvo
  useEffect(() => {
    setIsClient(true);

    // Carregar idioma salvo ou detectar do navegador
    const savedLanguage = getSavedLanguage();
    setLanguage(savedLanguage);

    // Aplicar o idioma ao elemento HTML
    document.documentElement.lang = savedLanguage;

    console.log('🌍 Idioma detectado:', savedLanguage);
  }, []);

  // Aplicar o idioma quando mudar
  useEffect(() => {
    if (isClient) {
      document.documentElement.lang = language;
    }

    // Escutar eventos de mudança de configurações
    const handleSettingsChanged = (event) => {
      if (event.detail && event.detail.language) {
        setLanguage(event.detail.language);
      }
    };

    // Adicionar listener para o evento personalizado
    document.addEventListener('ludomusicSettingsChanged', handleSettingsChanged);

    // Limpar listener ao desmontar
    return () => {
      document.removeEventListener('ludomusicSettingsChanged', handleSettingsChanged);
    };
  }, [language, isClient]);

  // Função para traduzir textos
  const t = (key) => {
    // Se não estamos no cliente, retornar a chave para evitar problemas de hidratação
    if (!isClient) {
      return key;
    }
    return getTranslation(key, language);
  };

  // Função para mudar o idioma
  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    document.documentElement.lang = newLanguage;

    // Atualizar localStorage
    const savedSettings = localStorage.getItem('ludomusic_settings');
    try {
      let newSettings;
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        newSettings = {
          ...parsedSettings,
          language: newLanguage
        };
      } else {
        // Se não houver configurações salvas, criar novas
        newSettings = {
          daltonicMode: false,
          sound: true,
          animations: true,
          language: newLanguage
        };
      }

      // Salvar no localStorage
      localStorage.setItem('ludomusic_settings', JSON.stringify(newSettings));

      // Disparar evento de mudança de configurações
      const event = new CustomEvent('ludomusicSettingsChanged', {
        detail: newSettings
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Erro ao atualizar configurações de idioma:', error);
    }
  };

  const value = {
    language,
    t,
    changeLanguage,
    isClient
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
