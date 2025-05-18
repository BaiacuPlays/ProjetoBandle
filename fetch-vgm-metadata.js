const fetch = require('node-fetch');

async function searchAlbum(gameName) {
  const url = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(gameName)}&fmt=json&limit=5`;
  const res = await fetch(url, { headers: { 'User-Agent': 'VGMScraper/1.0 (your@email.com)' } });
  const data = await res.json();
  return data.releases;
}

async function getTracks(releaseId) {
  const url = `https://musicbrainz.org/ws/2/release/${releaseId}?inc=recordings+artists&fmt=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'VGMScraper/1.0 (your@email.com)' } });
  const data = await res.json();
  const tracks = [];
  if (data.media && data.media.length > 0) {
    data.media.forEach(disc => {
      if (disc.tracks) {
        disc.tracks.forEach(track => {
          tracks.push({
            title: track.title,
            artist: track['artist-credit']?.[0]?.name || '',
            album: data.title,
            year: data.date ? data.date.slice(0, 4) : '',
            genre: 'Videogame',
            audioUrl: '', // Adicione o caminho do áudio manualmente depois
          });
        });
      }
    });
  }
  return tracks;
}

(async () => {
  const gameName = 'Super Mario 64';
  const albums = await searchAlbum(gameName);
  if (!albums.length) {
    console.log('Nenhum álbum encontrado.');
    return;
  }
  const album = albums[0];
  console.log('Álbum encontrado:', album.title, album.id);
  const tracks = await getTracks(album.id);
  console.log('Exemplo de array para songs.js:');
  console.log(JSON.stringify(tracks, null, 2));
})(); 