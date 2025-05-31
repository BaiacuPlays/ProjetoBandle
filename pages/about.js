import React from 'react';
import Head from 'next/head';
import styles from '../styles/LegalPages.module.css';

const About = () => {
  return (
    <>
      <Head>
        <title>Sobre o LudoMusic - Jogo Musical de Videogames</title>
        <meta name="description" content="Conheça o LudoMusic - O melhor jogo musical de videogames online. Teste seus conhecimentos com mais de 1000 trilhas sonoras!" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className={styles.container}>
        <div className={styles.content}>
          <h1>🎵 Sobre o LudoMusic</h1>
          
          <section className={styles.section}>
            <h2>O que é o LudoMusic?</h2>
            <p>O LudoMusic é um jogo musical online gratuito onde você testa seus conhecimentos sobre trilhas sonoras de videogames. Com mais de 1000 músicas de jogos clássicos e modernos, oferecemos uma experiência única para gamers e amantes de música.</p>
          </section>

          <section className={styles.section}>
            <h2>🎮 Como Funciona</h2>
            <ul>
              <li><strong>Ouça:</strong> Escute um trecho de 15 segundos de uma música de videogame</li>
              <li><strong>Adivinhe:</strong> Digite o nome do jogo de onde a música vem</li>
              <li><strong>Pontue:</strong> Ganhe pontos baseados em quantas tentativas você usou</li>
              <li><strong>Compete:</strong> Jogue sozinho ou com amigos no modo multiplayer</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>🌟 Funcionalidades</h2>
            <div className={styles.features}>
              <div className={styles.feature}>
                <h3>🎯 Modo Single Player</h3>
                <p>Jogue no seu ritmo, com 6 tentativas para adivinhar cada música</p>
              </div>
              <div className={styles.feature}>
                <h3>👥 Modo Multiplayer</h3>
                <p>Crie salas e jogue com amigos em tempo real</p>
              </div>
              <div className={styles.feature}>
                <h3>📊 Estatísticas</h3>
                <p>Acompanhe seu progresso e veja estatísticas globais</p>
              </div>
              <div className={styles.feature}>
                <h3>🎵 Biblioteca Gigante</h3>
                <p>Mais de 1000 músicas de jogos de todas as épocas</p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>🎼 Jogos Incluídos</h2>
            <p>Nossa biblioteca inclui músicas de:</p>
            <div className={styles.gamesList}>
              <span>Super Mario</span>
              <span>The Legend of Zelda</span>
              <span>Final Fantasy</span>
              <span>Pokémon</span>
              <span>Sonic</span>
              <span>Minecraft</span>
              <span>Undertale</span>
              <span>Hollow Knight</span>
              <span>Celeste</span>
              <span>Hades</span>
              <span>Cyberpunk 2077</span>
              <span>Elden Ring</span>
              <span>E muito mais!</span>
            </div>
          </section>

          <section className={styles.section}>
            <h2>🏆 Inspiração</h2>
            <p>O LudoMusic foi inspirado no <a href="https://gamedle.wtf" target="_blank" rel="noopener noreferrer">Gamedle</a>, adaptado especificamente para o público brasileiro e com foco em trilhas sonoras de videogames.</p>
          </section>

          <section className={styles.section}>
            <h2>💝 Apoie o Projeto</h2>
            <p>O LudoMusic é um projeto independente mantido por desenvolvedores apaixonados por jogos e música. Se você gosta do que fazemos, considere:</p>
            <ul>
              <li>Fazer uma doação para manter o servidor funcionando</li>
              <li>Compartilhar o jogo com seus amigos</li>
              <li>Nos seguir nas redes sociais</li>
              <li>Enviar sugestões de melhorias</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>📱 Compatibilidade</h2>
            <p>O LudoMusic funciona em:</p>
            <ul>
              <li>Computadores (Windows, Mac, Linux)</li>
              <li>Smartphones (Android, iOS)</li>
              <li>Tablets</li>
              <li>Todos os navegadores modernos</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>📞 Contato</h2>
            <p>Tem alguma dúvida, sugestão ou problema?</p>
            <ul>
              <li><strong>Email:</strong> andreibonatto8@gmail.com</li>
              <li><strong>Site:</strong> ludomusic.xyz</li>
            </ul>
          </section>

          <div className={styles.backButton}>
            <button onClick={() => window.history.back()}>
              ← Voltar ao Jogo
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
