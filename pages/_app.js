import '../styles/styles.css';
import '../styles/settings.css';
import '../styles/global-scrollbar.css';
import { LanguageProvider } from '../contexts/LanguageContext';
import { UserProfileProvider } from '../contexts/UserProfileContext';
import { FriendsProvider } from '../contexts/FriendsContext';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import PresenceManager from '../components/PresenceManager';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
      <AuthProvider>
        <UserProfileProvider>
          <FriendsProvider>
            <NotificationProvider>
              <PresenceManager />
              <Component {...pageProps} />
              <Analytics />
              <SpeedInsights />
            </NotificationProvider>
          </FriendsProvider>
        </UserProfileProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}