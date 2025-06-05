import Document, { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="pt-BR">
        <Head>
          {/* SEO Meta Tags - Removido title e viewport conforme Next.js guidelines */}
          <meta name="description" content="Teste seus conhecimentos musicais dos videogames! Ouça trechos de músicas de jogos famosos e adivinhe o nome. Jogue sozinho ou com amigos no modo multiplayer. Mais de 1000 músicas de games clássicos e modernos." />
          <meta name="keywords" content="jogo musical, videogame, música de jogos, quiz musical, adivinhar música, games, soundtrack, trilha sonora, multiplayer, puzzle musical" />
          <meta name="author" content="LudoMusic" />
          <meta name="robots" content="index, follow" />
          <meta name="language" content="pt-BR" />
          <meta name="google-site-verification" content="WZX2COa_HuHe-uemirKECoGrUxOlH09P62F" />
          <link rel="canonical" href="https://ludomusic.xyz" />

          {/* Open Graph Meta Tags */}
          <meta property="og:title" content="LudoMusic - Adivinhe a Música dos Seus Jogos Favoritos!" />
          <meta property="og:description" content="Teste seus conhecimentos musicais dos videogames! Ouça trechos de músicas de jogos famosos e adivinhe o nome. Jogue sozinho ou com amigos no modo multiplayer." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://ludomusic.xyz" />
          <meta property="og:image" content="https://ludomusic.xyz/Logo.png" />
          <meta property="og:image:alt" content="LudoMusic - Jogo Musical de Videogames" />
          <meta property="og:site_name" content="LudoMusic" />
          <meta property="og:locale" content="pt_BR" />

          {/* Twitter Card Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="LudoMusic - Adivinhe a Música dos Seus Jogos Favoritos!" />
          <meta name="twitter:description" content="Teste seus conhecimentos musicais dos videogames! Ouça trechos de músicas de jogos famosos e adivinhe o nome." />
          <meta name="twitter:image" content="https://ludomusic.xyz/Logo.png" />

          {/* Favicon */}
          <link rel="icon" href="/Logo.png" />
          <link rel="apple-touch-icon" href="/Logo.png" />

          {/* JSON-LD Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "LudoMusic",
                "description": "Jogo musical onde você adivinha músicas de videogames. Teste seus conhecimentos com mais de 1000 trilhas sonoras de jogos clássicos e modernos.",
                "url": "https://ludomusic.xyz",
                "applicationCategory": "Game",
                "operatingSystem": "Web Browser",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "BRL"
                },
                "author": {
                  "@type": "Organization",
                  "name": "LudoMusic"
                },
                "genre": ["Music Game", "Quiz Game", "Video Game Music"],
                "keywords": "jogo musical, videogame, música de jogos, quiz musical, adivinhar música, games, soundtrack",
                "inLanguage": "pt-BR",
                "isAccessibleForFree": true,
                "browserRequirements": "Requires JavaScript. Requires HTML5.",
                "softwareVersion": "1.0",
                "datePublished": "2024-01-01",
                "dateModified": new Date().toISOString().split('T')[0]
              })
            }}
          />

          {/* Meta tags para responsividade mobile - Removido viewport conforme Next.js guidelines */}
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

          {/* Polyfills para compatibilidade com navegadores antigos */}


        </Head>
        <body>
          <Main />
          <NextScript />

          {/* Polyfills removidos temporariamente para correção */}

          {/* Script para carregar o idioma do localStorage antes de renderizar a página */}
          <Script id="language-loader" strategy="beforeInteractive">
            {`
              try {
                // Verificar primeiro o localStorage
                const savedSettings = localStorage.getItem('ludomusic_settings');
                let language = null;

                if (savedSettings) {
                  try {
                    const parsedSettings = JSON.parse(savedSettings);
                    if (parsedSettings && parsedSettings.language) {
                      language = parsedSettings.language;
                    }
                  } catch (e) {
                    // JSON inválido, ignorar
                  }
                }

                // Verificar cookie como fallback
                if (!language) {
                  const cookies = document.cookie.split(';');
                  for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.startsWith('ludomusic_language=')) {
                      language = cookie.substring('ludomusic_language='.length);
                      break;
                    }
                  }
                }

                // Aplicar o idioma
                if (language) {
                  document.documentElement.lang = language;

                  // Se o idioma veio do cookie, mas não está no localStorage, salvá-lo
                  let needsUpdate = false;
                  let currentSettings = null;

                  if (savedSettings) {
                    try {
                      currentSettings = JSON.parse(savedSettings);
                      if (!currentSettings || !currentSettings.language) {
                        needsUpdate = true;
                      }
                    } catch (e) {
                      needsUpdate = true;
                    }
                  } else {
                    needsUpdate = true;
                  }

                  if (needsUpdate) {
                    const defaultSettings = {
                      daltonicMode: false,
                      sound: true,
                      animations: true,
                      language: language
                    };
                    localStorage.setItem('ludomusic_settings', JSON.stringify(defaultSettings));
                  } else if (currentSettings && currentSettings.language !== language) {
                    // Atualizar idioma se diferente
                    currentSettings.language = language;
                    localStorage.setItem('ludomusic_settings', JSON.stringify(currentSettings));
                  }
                }
              } catch (e) {
                // Silenciar erro
              }
            `}
          </Script>
        </body>
      </Html>
    );
  }
}

export default MyDocument;
