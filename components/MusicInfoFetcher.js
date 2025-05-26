import { useEffect, useState } from 'react';
import { fetchMusicInfo } from '../config/api';

export default function MusicInfoFetcher({ song, onInfoLoaded }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchInfo() {
      try {
        // Busca informações da música usando a API externa
        const musicInfo = await fetchMusicInfo(song.title, song.game);

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
        setError(err.message);
        // Em caso de erro, usa a música original
        onInfoLoaded(song);
      } finally {
        setIsLoading(false);
      }
    }

    if (song && song.title && song.game) {
      fetchInfo();
    }
  }, [song?.title, song?.game, onInfoLoaded]);

  if (error) {
    return null; // Não mostra nada se houver erro, usa as informações do music.json
  }

  if (isLoading) {
    return null; // Não mostra nada enquanto carrega, usa as informações do music.json
  }

  return null; // Este componente não renderiza nada, apenas busca informações
}