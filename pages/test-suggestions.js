import { useState } from 'react';
import { MusicSearchInput } from '../components/EnhancedInput';

const testSongs = [
  { id: 1, title: 'Mario Theme', game: 'Super Mario Bros', artist: 'Nintendo' },
  { id: 2, title: 'Zelda Theme', game: 'The Legend of Zelda', artist: 'Nintendo' },
  { id: 3, title: 'Sonic Theme', game: 'Sonic the Hedgehog', artist: 'Sega' },
  { id: 4, title: 'Tetris Theme', game: 'Tetris', artist: 'Nintendo' },
  { id: 5, title: 'Pac-Man Theme', game: 'Pac-Man', artist: 'Namco' },
  { id: 6, title: 'Pokemon Theme', game: 'Pokemon Red', artist: 'Game Freak' },
  { id: 7, title: 'Portal Theme', game: 'Portal', artist: 'Valve' },
  { id: 8, title: 'Portam Ad Inferno', game: 'Control', artist: 'Remedy' },
  { id: 9, title: 'Power Up', game: 'Super Mario World', artist: 'Nintendo' },
  { id: 10, title: 'Peaceful Mode', game: 'Minecraft', artist: 'Mojang' },
];

export default function TestSuggestions() {
  const [value, setValue] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: 'white',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem'
    }}>
      <h1>Teste de Sugestões</h1>

      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: '#23272f',
        padding: '2rem',
        borderRadius: '1rem',
        position: 'relative'
      }}>
        <h2>Digite para testar as sugestões:</h2>

        <MusicSearchInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Digite o nome de uma música..."
          songs={testSongs}
          onSongSelect={(song) => {
            console.log('Song selected:', song);
            setSelectedSong(song);
            setValue(`${song.game} - ${song.title}`);
          }}
        />

        {selectedSong && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#1a1e24',
            borderRadius: '0.5rem',
            border: '2px solid #1DB954'
          }}>
            <h3>Música Selecionada:</h3>
            <p><strong>Jogo:</strong> {selectedSong.game}</p>
            <p><strong>Título:</strong> {selectedSong.title}</p>
            <p><strong>Artista:</strong> {selectedSong.artist}</p>
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <h3>Debug Info:</h3>
          <p>Valor atual: "{value}"</p>
          <p>Total de músicas: {testSongs.length}</p>
        </div>
      </div>
    </div>
  );
}
