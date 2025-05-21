import musicData from './music.json';

// Adiciona informações específicas do jogo para cada música
export const songs = musicData.map((song, index) => ({
  ...song,
  id: song.id || index + 1,
  clips: [
    { name: "Intro", icon: "🎹", startTime: 0, duration: 5 },
    { name: "Meio", icon: "🎶", startTime: 30, duration: 5 },
    { name: "Final", icon: "🎤", startTime: 60, duration: 5 }
  ],
  views: "1M+",
  difficulty: "Médio",
  hint: `${song.title} - ${song.artist} (${song.game}, ${song.year})`
}));

// Lista de músicas disponíveis (que têm arquivo de áudio)
const checkSongAvailability = async (song) => {
  try {
    const response = await fetch(song.audioUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

export const getRandomSong = async () => {
  // Check availability of all songs in parallel
  const availabilityChecks = await Promise.all(
    songs.map(async (song) => ({
      song,
      isAvailable: await checkSongAvailability(song)
    }))
  );
  
  // Filter available songs
  const availableSongs = availabilityChecks
    .filter(({ isAvailable }) => isAvailable)
    .map(({ song }) => song);
  
  // If no songs are available, return the first song
  if (availableSongs.length === 0) {
    return songs[0];
  }
  
  const randomIndex = Math.floor(Math.random() * availableSongs.length);
  return availableSongs[randomIndex];
}; 