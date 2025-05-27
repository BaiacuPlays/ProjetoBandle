import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Sobre() {
  const { t } = useLanguage();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <Head>
        <title>Sobre o LudoMusic - Jogo Musical de Videogames</title>
        <meta
          name="description"
          content="Conheça o LudoMusic, o jogo musical definitivo para fãs de videogames. Teste seus conhecimentos com mais de 1000 trilhas sonoras de jogos clássicos e modernos. Jogue sozinho ou com amigos!"
        />
        <meta name="keywords" content="sobre ludomusic, jogo musical, videogame música, quiz musical, trilha sonora jogos" />
        <link rel="canonical" href="https://ludomusic.xyz/sobre" />

        {/* Open Graph */}
        <meta property="og:title" content="Sobre o LudoMusic - Jogo Musical de Videogames" />
        <meta property="og:description" content="Conheça o LudoMusic, o jogo musical definitivo para fãs de videogames. Teste seus conhecimentos com mais de 1000 trilhas sonoras." />
        <meta property="og:url" content="https://ludomusic.xyz/sobre" />

        {/* JSON-LD para página sobre */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AboutPage",
              "name": "Sobre o LudoMusic",
              "description": "Página sobre o LudoMusic, jogo musical de videogames",
              "url": "https://ludomusic.xyz/sobre",
              "mainEntity": {
                "@type": "WebApplication",
                "name": "LudoMusic",
                "description": "Jogo musical onde você adivinha músicas de videogames",
                "applicationCategory": "Game",
                "operatingSystem": "Web Browser"
              }
            })
          }}
        />
      </Head>

      <div style={{ minHeight: '100vh', padding: '20px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', color: 'white' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Link href="/" style={{ color: '#4CAF50', textDecoration: 'none', fontSize: '18px' }}>
              ← Voltar ao Jogo
            </Link>
            <h1 style={{ fontSize: '2.5em', margin: '20px 0', color: '#4CAF50' }}>
              Sobre o LudoMusic
            </h1>
          </div>

          {/* Conteúdo Principal */}
          <div style={{ lineHeight: '1.6', fontSize: '16px' }}>
            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#4CAF50', fontSize: '1.8em', marginBottom: '15px' }}>
                O que é o LudoMusic?
              </h2>
              <p>
                O <strong>LudoMusic</strong> é um jogo musical inovador que desafia seus conhecimentos sobre trilhas sonoras de videogames.
                Com mais de <strong>1000 músicas</strong> de jogos clássicos e modernos, oferecemos uma experiência única para
                fãs de games e música.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#4CAF50', fontSize: '1.8em', marginBottom: '15px' }}>
                Como Funciona?
              </h2>
              <ul style={{ paddingLeft: '20px' }}>
                <li>🎵 Ouça trechos de músicas de videogames famosos</li>
                <li>🎮 Adivinhe o nome da música e o jogo de origem</li>
                <li>⏱️ Use dicas progressivas se precisar de ajuda</li>
                <li>👥 Jogue sozinho ou desafie amigos no modo multiplayer</li>
                <li>📊 Acompanhe suas estatísticas e melhore seu desempenho</li>
              </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#4CAF50', fontSize: '1.8em', marginBottom: '15px' }}>
                Jogos Incluídos
              </h2>
              <p>Nossa coleção abrange uma vasta gama de jogos, incluindo:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', margin: '15px 0' }}>
                <div>• The Legend of Zelda</div>
                <div>• Super Mario</div>
                <div>• Undertale</div>
                <div>• Hollow Knight</div>
                <div>• Celeste</div>
                <div>• Minecraft</div>
                <div>• Final Fantasy</div>
                <div>• Sonic</div>
                <div>• Pokémon</div>
                <div>• Dark Souls</div>
                <div>• Stardew Valley</div>
                <div>• Cuphead</div>
              </div>
              <p style={{ fontStyle: 'italic', marginTop: '15px' }}>
                E muitos outros! Nossa biblioteca está em constante expansão.
              </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#4CAF50', fontSize: '1.8em', marginBottom: '15px' }}>
                Modos de Jogo
              </h2>
              <div style={{ display: 'grid', gap: '15px' }}>
                <div style={{ background: 'rgba(76, 175, 80, 0.1)', padding: '15px', borderRadius: '8px' }}>
                  <h3 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>🎯 Modo Solo</h3>
                  <p style={{ margin: 0 }}>
                    Jogue no seu próprio ritmo com uma nova música a cada dia. Perfeito para treinar e melhorar suas habilidades.
                  </p>
                </div>
                <div style={{ background: 'rgba(76, 175, 80, 0.1)', padding: '15px', borderRadius: '8px' }}>
                  <h3 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>👥 Modo Multiplayer</h3>
                  <p style={{ margin: 0 }}>
                    Desafie seus amigos em partidas de 10 rodadas. Quem conseguir adivinhar mais músicas vence!
                  </p>
                </div>
                <div style={{ background: 'rgba(76, 175, 80, 0.1)', padding: '15px', borderRadius: '8px' }}>
                  <h3 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>♾️ Modo Infinito</h3>
                  <p style={{ margin: 0 }}>
                    Teste seus limites! Jogue música após música até errar. Qual será seu recorde?
                  </p>
                </div>
              </div>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#4CAF50', fontSize: '1.8em', marginBottom: '15px' }}>
                Por que Jogar LudoMusic?
              </h2>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Gratuito:</strong> 100% gratuito, sem anúncios ou microtransações</li>
                <li><strong>Educativo:</strong> Aprenda sobre a rica história da música em videogames</li>
                <li><strong>Social:</strong> Compartilhe sua paixão por games com amigos</li>
                <li><strong>Nostálgico:</strong> Reviva memórias de jogos clássicos</li>
                <li><strong>Desafiador:</strong> Teste e expanda seus conhecimentos musicais</li>
              </ul>
            </section>

            <section style={{ textAlign: 'center', marginTop: '40px' }}>
              <Link
                href="/"
                style={{
                  background: '#4CAF50',
                  color: 'white',
                  padding: '15px 30px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                🎮 Começar a Jogar Agora!
              </Link>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
