import { useEffect, useState } from 'react';

export default function MusicInfoFetcher({ song, onInfoLoaded }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMusicInfo() {
      try {
        // Busca informações da música no MusicBrainz
        const response = await fetch(`/api/music-info?title=${encodeURIComponent(song.title)}&game=${encodeURIComponent(song.game)}`);
        if (!response.ok) {
          throw new Error('Erro ao buscar informações da música');
        }
        const musicInfo = await response.json();
        
        // Atualiza as informações da música
        const updatedSong = {
          ...song,
          artist: musicInfo.artist || song.artist,
          year: musicInfo.year || song.year,
          album: musicInfo.album || song.album,
          console: musicInfo.console || song.console
        };
        
        onInfoLoaded(updatedSong);
      } catch (err) {
        console.error('Erro ao buscar informações:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (song) {
      fetchMusicInfo();
    }
  }, [song]);

  if (error) {
    return null; // Não mostra nada se houver erro, usa as informações do music.json
  }

  if (isLoading) {
    return null; // Não mostra nada enquanto carrega, usa as informações do music.json
  }

  return null; // Este componente não renderiza nada, apenas busca informações
} 