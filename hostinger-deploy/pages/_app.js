import '../styles/styles.css';
import '../styles/settings.css';
import { LanguageProvider } from '../contexts/LanguageContext';
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }) {
  // Carregar configurações do localStorage ao iniciar a aplicação
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('bandle_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        console.log('Configurações carregadas no _app.js:', parsedSettings);

        // Aplicar configurações iniciais
        if (parsedSettings.language) {
          document.documentElement.lang = parsedSettings.language;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações em _app.js:', error);
    }
  }, []);

  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  );
}