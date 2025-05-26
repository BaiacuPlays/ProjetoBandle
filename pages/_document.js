import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="pt-BR">
        <Head>
          {/* Meta tags para responsividade mobile */}
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

          {/* Polyfills para compatibilidade com navegadores antigos */}
          <script src="https://polyfill.io/v3/polyfill.min.js?features=fetch,Promise,Array.prototype.includes,Object.assign,Symbol"></script>

          {/* Script para carregar o idioma do localStorage antes de renderizar a página */}
          <script dangerouslySetInnerHTML={{
            __html: `
              try {
                // Verificar primeiro o localStorage
                const savedSettings = localStorage.getItem('bandle_settings');
                let language = null;

                if (savedSettings) {
                  const parsedSettings = JSON.parse(savedSettings);
                  if (parsedSettings.language) {
                    language = parsedSettings.language;
                  }
                }

                // Verificar cookie como fallback
                if (!language) {
                  const cookies = document.cookie.split(';');
                  for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.startsWith('bandle_language=')) {
                      language = cookie.substring('bandle_language='.length);
                      break;
                    }
                  }
                }

                // Aplicar o idioma
                if (language) {
                  document.documentElement.lang = language;
                  console.log('Idioma aplicado pelo _document.js:', language);

                  // Se o idioma veio do cookie, mas não está no localStorage, salvá-lo
                  if (!savedSettings || !JSON.parse(savedSettings).language) {
                    const defaultSettings = {
                      daltonicMode: false,
                      sound: true,
                      animations: true,
                      language: language
                    };
                    localStorage.setItem('bandle_settings', JSON.stringify(defaultSettings));
                    console.log('Configurações salvas do cookie para localStorage:', defaultSettings);
                  } else if (savedSettings) {
                    // Se já existe configurações no localStorage, atualizar o idioma
                    try {
                      const settings = JSON.parse(savedSettings);
                      if (settings.language !== language) {
                        settings.language = language;
                        localStorage.setItem('bandle_settings', JSON.stringify(settings));
                        console.log('Idioma atualizado no localStorage:', settings);
                      }
                    } catch (e) {
                      console.error('Erro ao atualizar idioma no localStorage:', e);
                    }
                  }
                }
              } catch (e) {
                console.error('Erro ao aplicar idioma em _document.js:', e);
              }
            `
          }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
