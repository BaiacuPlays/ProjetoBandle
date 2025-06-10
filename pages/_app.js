import '../styles/styles.css';
import '../styles/settings.css';
import '../styles/global-scrollbar.css';
import '../styles/global.css';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ProfileProvider } from '../contexts/ProfileContext';

import { SimpleFriendsProvider } from '../contexts/SimpleFriendsContext';
import { FriendsProvider } from '../contexts/FriendsContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import ToastNotification from '../components/ToastNotification';

import { useEffect } from 'react';
import HydrationErrorSuppressor from '../components/HydrationErrorSuppressor';
import Script from 'next/script';
// // import performanceFix from '../utils/performance-fix'; // DESABILITADO - CAUSANDO TRAVAMENTO // Desabilitado temporariamente

export default function MyApp({ Component, pageProps }) {
  // Carregar configurações do localStorage ao iniciar a aplicação
  useEffect(() => {
    // Log removido para performance

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
        // Erro silencioso para performance
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
        // Log removido para performance
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
          <ProfileProvider>
            <NotificationProvider>
              <FriendsProvider>
                <SimpleFriendsProvider>
                  <HydrationErrorSuppressor />
                  <Component {...pageProps} />
                  <ToastNotification />
                </SimpleFriendsProvider>
              </FriendsProvider>
            </NotificationProvider>
          </ProfileProvider>
        </AuthProvider>
      </LanguageProvider>
    </>
  );
}