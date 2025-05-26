import Head from 'next/head';
import { useLanguage } from '../contexts/LanguageContext';
import { MultiplayerProvider, useMultiplayerContext } from '../contexts/MultiplayerContext';
import MultiplayerLobby from '../components/MultiplayerLobby';
import MultiplayerGame from '../components/MultiplayerGame';
import Footer from '../components/Footer';

function MultiplayerContent() {
  const { t, isClient } = useLanguage();
  const { state, actions } = useMultiplayerContext();

  const handleGameStart = () => {
    actions.setCurrentScreen('game');
  };

  const handleBackToLobby = () => {
    actions.setCurrentScreen('lobby');
  };

  return (
    <>
      <Head>
        <title>
          {isClient ? `${t('multiplayer')} - Ludomusic` : 'Multiplayer - Ludomusic'}
        </title>
        <meta
          name="description"
          content={isClient ?
            "Jogue Bandle com seus amigos! Adivinhe músicas de videogames em modo multiplayer." :
            "Play Bandle with your friends! Guess video game music in multiplayer mode."
          }
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎵</text></svg>" />
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1 }}>
          {state.currentScreen === 'lobby' ? (
            <MultiplayerLobby onGameStart={handleGameStart} />
          ) : (
            <MultiplayerGame onBackToLobby={handleBackToLobby} />
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}

export default function Multiplayer() {
  return (
    <MultiplayerProvider>
      <MultiplayerContent />
    </MultiplayerProvider>
  );
}
