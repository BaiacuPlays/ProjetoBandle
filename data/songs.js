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
const availableSongs = songs.filter(song => {
  // Verifica se o arquivo existe fazendo uma requisição HEAD
  return fetch(song.audioUrl, { method: 'HEAD' })
    .then(response => response.ok)
    .catch(() => false);
});

export const getRandomSong = async () => {
  // Se não houver músicas disponíveis, retorna a primeira da lista
  if (availableSongs.length === 0) {
    return songs[0];
  }
  
  const randomIndex = Math.floor(Math.random() * availableSongs.length);
  return availableSongs[randomIndex];
}; 