const fs = require('fs');
const path = require('path');

// Listas reais de títulos (normalizados, sem acento, minúsculo)
const minecraftTitles = [
  'key', 'door', 'subwoofer lullaby', 'death', 'living mice', 'moog city', 'haggstrom',
  'minecraft', 'oxygene', 'equinoxe', 'dry hands', 'wet hands', 'mice on venus', 'clark',
  'chris', 'thirteen', 'excuse', 'sweden', 'cat', 'dog', 'beginning', 'danny', 'droopy likes your face',
  'droopy likes ricochet'
];
const mario64Titles = [
  "peach's message", 'opening', 'main theme', 'inside the castle walls', 'looping steps',
  'slider', 'lethal lava land', 'dire dire docks', 'cave dungeon', 'haunted house',
  'snow mountain', 'merry-go-round', "piranha plant's lullaby", 'metallic mario',
  'powerful mario', 'race fanfare', 'star catch fanfare', 'course clear', 'game start',
  "koopa's message", "koopa's road", 'koopa clear', 'ultimate koopa', 'ultimate koopa clear',
  'ending demo', 'staff roll', "toad's message", 'correct solution', 'title theme', 'boss',
  'file select'
];

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[^\w\s]/g, '') // remove acentos e pontuação
    .replace(/\s+/g, ' ') // espaços únicos
    .trim();
}

function extractInfoFromFilename(filename) {
  // Remove extensão
  const nameWithoutExt = filename.replace(/\.mp3$/i, '');
  // Extrai título (remove número e separador se houver)
  let title = nameWithoutExt.replace(/^\d+[ .-]+/, '').trim();
  const normTitle = normalize(title);

  // DEBUG: mostrar como está sendo normalizado
  console.log(`Arquivo: ${filename} | Título extraído: ${title} | Normalizado: ${normTitle}`);

  // Identifica o jogo
  let game = 'Unknown', artist = 'Unknown', year = 2023, album = 'Unknown';
  if (minecraftTitles.some(t => normTitle.includes(normalize(t)))) {
    game = 'Minecraft';
    artist = 'C418';
    year = 2011;
    album = 'Minecraft - Volume Alpha';
  } else if (mario64Titles.some(t => normTitle.includes(normalize(t)))) {
    game = 'Super Mario 64';
    artist = 'Koji Kondo';
    year = 1996;
    album = 'Super Mario 64 Soundtrack';
  }

  // DEBUG: mostrar classificação
  console.log(`Classificação: ${game}, Artista: ${artist}, Álbum: ${album}, Ano: ${year}`);

  // Extrai número da faixa se houver
  const match = filename.match(/^(\d+)/);
  const trackNumber = match ? parseInt(match[1]) : 0;

  return {
    trackNumber,
    title,
    game,
    artist,
    year,
    album
  };
}

function scanAudioFiles() {
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  const files = fs.readdirSync(audioDir);

  const musicData = files
    .filter(file => file.toLowerCase().endsWith('.mp3'))
    .map(file => {
      const info = extractInfoFromFilename(file);
      return {
        id: info.trackNumber || 0,
        title: info.title,
        artist: info.artist,
        audioUrl: `/audio/${file}`,
        game: info.game,
        year: info.year,
        genre: info.game === 'Unknown' ? 'Videogame' : 'Game Soundtrack',
        album: info.album
      };
    })
    .sort((a, b) => a.id - b.id);

  // Save to JSON file
  const outputPath = path.join(process.cwd(), 'data', 'music.json');
  fs.writeFileSync(outputPath, JSON.stringify(musicData, null, 2));
  console.log(`Found ${musicData.length} music files`);
  console.log(`Data saved to ${outputPath}`);
}

scanAudioFiles(); 