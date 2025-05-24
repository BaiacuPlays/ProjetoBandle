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
    console.log('🎮 MULTIPLAYER - handleGameStart chamado, mudando estado para game');
    actions.setCurrentScreen('game');
    console.log('🎮 MULTIPLAYER - Estado mudado para game');
  };

  const handleBackToLobby = () => {
    console.log('🎮 MULTIPLAYER - handleBackToLobby chamado');
    actions.setCurrentScreen('lobby');
  };

  return (
    <>
      <Head>
        <title>
          {isClient ? `${t('multiplayer')} - Bandle` : 'Multiplayer - Bandle'}
        </title>
        <meta
          name="description"
          content={isClient ?
            "Jogue Bandle com seus amigos! Adivinhe músicas de videogames em modo multiplayer." :
            "Play Bandle with your friends! Guess video game music in multiplayer mode."
          }
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
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
