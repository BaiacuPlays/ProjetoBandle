import '../styles/styles.css';
import '../styles/settings.css';
import '../styles/global-scrollbar.css';
import { LanguageProvider } from '../contexts/LanguageContext';
import { UserProfileProvider } from '../contexts/UserProfileContext';
import { FriendsProvider } from '../contexts/FriendsContext';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import ToastNotification from '../components/ToastNotification';

import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import errorHandler from '../utils/errorHandler';
import performanceOptimizer from '../utils/performanceOptimizer';

export default function MyApp({ Component, pageProps }) {
  // Carregar configurações do localStorage ao iniciar a aplicação
  useEffect(() => {
    // Inicializar error handler e performance optimizer
    errorHandler;
    performanceOptimizer;

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
      // Usar error handler em vez de silenciar
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('Erro ao carregar configurações', 'warning');
      }
    }
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <UserProfileProvider>
          <FriendsProvider>
            <NotificationProvider>
              <Component {...pageProps} />
              <ToastNotification />
              <Analytics />
              <SpeedInsights />
            </NotificationProvider>
          </FriendsProvider>
        </UserProfileProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}