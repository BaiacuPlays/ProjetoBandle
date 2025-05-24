import musicData from './music.json';

// Adiciona informações específicas do jogo para cada música
export const songs = musicData.map((song, index) => ({
  ...song,
  id: song.id || index + 1,
  // Normalizar título removendo espaços extras
  title: song.title.trim(),
  clips: [
    { name: "Intro", icon: "🎹", startTime: 0, duration: 5 },
    { name: "Meio", icon: "🎶", startTime: 30, duration: 5 },
    { name: "Final", icon: "🎤", startTime: 60, duration: 5 }
  ],
  views: "1M+",
  difficulty: "Médio",
  hint: `${song.title.trim()} - ${song.artist} (${song.game}, ${song.year})`
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

// Histórico de músicas recentes (últimas 20)
let recentSongs = [];

export const getRandomSong = async () => {
  // Check availability of all songs in parallel
  const availabilityChecks = await Promise.all(
    songs.map(async (song) => ({
      song,
      isAvailable: await checkSongAvailability(song)
    }))
  );

  // Filter available songs
  let availableSongs = availabilityChecks
    .filter(({ isAvailable }) => isAvailable)
    .map(({ song }) => song);

  // Remove as músicas que estão no histórico recente
  availableSongs = availableSongs.filter(song => !recentSongs.includes(song.id));

  // Se não houver músicas disponíveis fora do histórico, limpa o histórico
  if (availableSongs.length === 0) {
    recentSongs = [];
    availableSongs = availabilityChecks
      .filter(({ isAvailable }) => isAvailable)
      .map(({ song }) => song);
  }

  // Se ainda não houver músicas disponíveis, retorna a primeira música
  if (availableSongs.length === 0) {
    return songs[0];
  }

  const randomIndex = Math.floor(Math.random() * availableSongs.length);
  const selectedSong = availableSongs[randomIndex];

  // Adiciona a música selecionada ao histórico
  recentSongs.push(selectedSong.id);
  // Mantém apenas as últimas 20 músicas no histórico
  if (recentSongs.length > 20) {
    recentSongs.shift();
  }

  return selectedSong;
};