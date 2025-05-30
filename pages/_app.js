import '../styles/styles.css';
import '../styles/settings.css';
import { LanguageProvider } from '../contexts/LanguageContext';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

export default function MyApp({ Component, pageProps }) {
  // Carregar configurações do localStorage ao iniciar a aplicação
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('ludomusic_settings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);

          // Aplicar configurações iniciais
          if (parsedSettings && parsedSettings.language) {
            document.documentElement.lang = parsedSettings.language;
          }
        } catch (e) {
          // JSON inválido, remover e usar padrão
          localStorage.removeItem('ludomusic_settings');
        }
      }
    } catch (error) {
      // Silenciar erro
    }
  }, []);

  return (
    <LanguageProvider>
      <Component {...pageProps} />
      <Analytics />
    </LanguageProvider>
  );
}