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
  // Tentar carregar o idioma do localStorage imediatamente
  const getSavedLanguage = () => {
    try {
      const savedSettings = localStorage.getItem('bandle_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.language) {
          console.log('Idioma inicial carregado:', parsedSettings.language);
          return parsedSettings.language;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar idioma inicial:', error);
    }
    return 'pt-BR'; // Idioma padrão
  };

  const [language, setLanguage] = useState(getSavedLanguage());

  // Aplicar o idioma ao montar o componente
  useEffect(() => {
    // Aplicar o idioma ao elemento HTML
    document.documentElement.lang = language;
    console.log('Idioma aplicado ao HTML:', language);

    // Escutar eventos de mudança de configurações
    const handleSettingsChanged = (event) => {
      if (event.detail && event.detail.language) {
        setLanguage(event.detail.language);
      }
    };

    // Adicionar listener para o evento personalizado
    document.addEventListener('bandleSettingsChanged', handleSettingsChanged);

    // Limpar listener ao desmontar
    return () => {
      document.removeEventListener('bandleSettingsChanged', handleSettingsChanged);
    };
  }, []);

  // Estado para controlar se estamos no cliente
  const [isClient, setIsClient] = useState(false);

  // Detectar quando estamos no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

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
    console.log('Mudando idioma para:', newLanguage);
    setLanguage(newLanguage);
    document.documentElement.lang = newLanguage;

    // Atualizar localStorage
    const savedSettings = localStorage.getItem('bandle_settings');
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
      localStorage.setItem('bandle_settings', JSON.stringify(newSettings));
      console.log('Configurações atualizadas no localStorage:', newSettings);

      // Disparar evento de mudança de configurações
      const event = new CustomEvent('bandleSettingsChanged', {
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
