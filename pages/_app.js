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

        // Aplicar configurações iniciais
        if (parsedSettings.language) {
          document.documentElement.lang = parsedSettings.language;
        }
      }
    } catch (error) {
      // Silenciar erro
    }
  }, []);

  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  );
}