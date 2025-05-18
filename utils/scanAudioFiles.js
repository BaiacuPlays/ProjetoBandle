const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');

console.log('Iniciando scanAudioFiles.js');

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

async function extractInfoFromFile(filePath) {
  try {
    console.log('Lendo metadados de:', filePath);
    const metadata = await mm.parseFile(filePath);
    const { common } = metadata;
    
    // Extract track number from filename if not in metadata
    const fileName = path.parse(filePath).name;
    const trackMatch = fileName.match(/^(\d+)/);
    const trackNumber = common.track?.no || (trackMatch ? parseInt(trackMatch[1]) : 0);
    
    // Clean up title from filename if not in metadata
    let title = common.title;
    if (!title) {
      title = fileName.replace(/^\d+[ .-]+/, '').trim();
    }
    
    return {
      trackNumber,
      title,
      artist: common.artist || 'Unknown',
      year: common.year || 2023,
      album: common.album || 'Unknown',
      game: common.albumartist || 'Unknown',
      genre: common.genre?.[0] || 'Videogame'
    };
  } catch (error) {
    console.error(`Erro ao ler metadados de ${filePath}:`, error);
    // Fallback to filename if metadata reading fails
    const fileName = path.parse(filePath).name;
    const trackMatch = fileName.match(/^(\d+)/);
    const trackNumber = trackMatch ? parseInt(trackMatch[1]) : 0;
    const title = fileName.replace(/^\d+[ .-]+/, '').trim();
    
    return {
      trackNumber,
      title,
      artist: 'Unknown',
      year: 2023,
      album: 'Unknown',
      game: 'Unknown',
      genre: 'Videogame'
    };
  }
}

function extractInfoFromFilename(filename) {
  // Remove extensão
  const nameWithoutExt = filename.replace(/\.mp3$/i, '');
  
  // Extrai informações do nome do arquivo
  // Formato: "XX - Título - Jogo - Artista"
  const parts = nameWithoutExt.split(' - ');
  
  if (parts.length !== 4) {
    console.log(`Formato inválido para ${filename}`);
    return {
      trackNumber: 0,
      title: nameWithoutExt,
      artist: 'Unknown',
      year: 2023,
      album: 'Unknown',
      game: 'Unknown',
      genre: 'Videogame'
    };
  }

  const [trackNumber, title, game, artist] = parts;
  
  // Extrai o ano baseado no jogo
  let year = 2023;
  if (game.includes('Sonic the Hedgehog')) {
    year = game.includes('2') ? 1992 : game.includes('3') ? 1994 : 1991;
  } else if (game.includes('Mario 64')) {
    year = 1996;
  } else if (game.includes('Minecraft')) {
    year = 2011;
  } else if (game.includes('Donkey Kong Country')) {
    year = game.includes('2') ? 1995 : 1994;
  } else if (game.includes('Mega Man X')) {
    year = 1993;
  } else if (game.includes('Super Smash Bros')) {
    year = 2008;
  }

  return {
    trackNumber: parseInt(trackNumber) || 0,
    title,
    artist,
    year,
    album: `${game} Soundtrack`,
    game,
    genre: 'Game Soundtrack'
  };
}

function scanAudioFiles() {
  try {
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    console.log('Diretório de áudio:', audioDir);
    const files = fs.readdirSync(audioDir);
    console.log('Arquivos encontrados:', files);

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
          genre: info.genre,
          album: info.album
        };
      })
      .sort((a, b) => a.id - b.id);

    // Save to JSON file
    const outputPath = path.join(process.cwd(), 'data', 'music.json');
    fs.writeFileSync(outputPath, JSON.stringify(musicData, null, 2));
    console.log(`Found ${musicData.length} music files`);
    console.log(`Data saved to ${outputPath}`);
  } catch (error) {
    console.error('Erro ao escanear arquivos de áudio:', error);
  }
}

// Run the script
scanAudioFiles(); 