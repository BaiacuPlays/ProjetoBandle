import '../styles/styles.css';
import '../styles/settings.css';
import '../styles/global-scrollbar.css';
import '../styles/global.css';
import { LanguageProvider } from '../contexts/LanguageContext';
import { UserProfileProvider } from '../contexts/UserProfileContext';
import { AuthProvider } from '../contexts/AuthContext';
import { SimpleFriendsProvider } from '../contexts/SimpleFriendsContext';
import { FriendsProvider } from '../contexts/FriendsContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import ToastNotification from '../components/ToastNotification';
import ProfileErrorHandler from '../components/ProfileErrorHandler';

import { useEffect } from 'react';
import HydrationErrorSuppressor from '../components/HydrationErrorSuppressor';
import Script from 'next/script';

export default function MyApp({ Component, pageProps }) {
  // Carregar configurações do localStorage ao iniciar a aplicação
  useEffect(() => {
    console.log('App inicializado');

    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('ludomusic_settings');
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings);
            if (parsedSettings && parsedSettings.language) {
              document.documentElement.lang = parsedSettings.language;
            }
          } catch (e) {
            localStorage.removeItem('ludomusic_settings');
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  // Função para remover atributos indesejados que causam erros de hidratação
  useEffect(() => {
    // Executar apenas no cliente
    if (typeof window !== 'undefined') {
      // Remover atributos bis_skin_checked que causam erros de hidratação
      setTimeout(() => {
        const elements = document.querySelectorAll('[bis_skin_checked]');
        elements.forEach(el => {
          el.removeAttribute('bis_skin_checked');
        });
        console.log('🧹 Atributos bis_skin_checked removidos:', elements.length);
      }, 0);
      
      // Suprimir erros de AdBlock
      const originalError = console.error;
      console.error = function(msg) {
        if (msg && typeof msg === 'string' && (
          msg.includes('pagead2.googlesyndication.com') || 
          msg.includes('ERR_BLOCKED_BY_CLIENT') ||
          msg.includes('adsbygoogle') ||
          msg.includes('Failed to load resource')
        )) {
          // Suprimir erros de AdBlock
          return;
        }
        originalError.apply(console, arguments);
      };
    }
  }, []);

  return (
    <>
      {/* Suprime erros de hidratação no desenvolvimento */}
      {process.env.NODE_ENV !== 'production' && (
        <Script id="suppress-hydration-warning" strategy="beforeInteractive">
          {`
            (function() {
              const originalError = console.error;
              console.error = function(msg) {
                if (msg && typeof msg === 'string' && 
                    (msg.includes('Warning: Extra attributes from the server') || 
                     msg.includes('bis_skin_checked'))) {
                  return;
                }
                originalError.apply(console, arguments);
              };
            })();
          `}
        </Script>
      )}
      
      <LanguageProvider>
        <AuthProvider>
          <UserProfileProvider>
            <NotificationProvider>
              <FriendsProvider>
                <SimpleFriendsProvider>
                  <HydrationErrorSuppressor />
                  <ProfileErrorHandler />
                  <Component {...pageProps} />
                  <ToastNotification />
                </SimpleFriendsProvider>
              </FriendsProvider>
            </NotificationProvider>
          </UserProfileProvider>
        </AuthProvider>
      </LanguageProvider>
    </>
  );
}