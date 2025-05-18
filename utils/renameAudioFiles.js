const fs = require('fs');
const path = require('path');

// Mapeamento de jogos e artistas
const gameInfo = {
  'sonic': {
    name: 'Sonic the Hedgehog',
    artist: 'Masato Nakamura',
    year: 1991
  },
  'sonic2': {
    name: 'Sonic the Hedgehog 2',
    artist: 'Masato Nakamura',
    year: 1992
  },
  'sonic3': {
    name: 'Sonic the Hedgehog 3',
    artist: 'Michael Jackson & Sega Sound Team',
    year: 1994
  },
  'mario64': {
    name: 'Super Mario 64',
    artist: 'Koji Kondo',
    year: 1996
  },
  'minecraft': {
    name: 'Minecraft',
    artist: 'C418',
    year: 2011
  },
  'dkc': {
    name: 'Donkey Kong Country',
    artist: 'David Wise',
    year: 1994
  },
  'dkc2': {
    name: 'Donkey Kong Country 2',
    artist: 'David Wise',
    year: 1995
  },
  'mmx': {
    name: 'Mega Man X',
    artist: 'Setsuo Yamamoto',
    year: 1993
  },
  'ssbb': {
    name: 'Super Smash Bros. Brawl',
    artist: 'Nobuo Uematsu',
    year: 2008
  }
};

// Mapeamento de títulos específicos
const titleMappings = {
  '01 - Opening Theme': { game: 'ssbb', title: 'Main Theme' },
  '01 - Title Theme': { game: 'sonic', title: 'Title Theme' },
  '01 K. Rool Returns': { game: 'dkc2', title: 'K. Rool Returns' },
  '01 Theme': { game: 'sonic2', title: 'Title Theme' },
  '01 Title Screen': { game: 'dkc', title: 'Title Screen' },
  '02 - Green Hill Zone': { game: 'sonic', title: 'Green Hill Zone' },
  '02 Intro Stage': { game: 'mmx', title: 'Intro Stage' },
  '02 Simian Segue': { game: 'dkc', title: 'Simian Segue' },
  '02 Title Theme': { game: 'mario64', title: 'Title Theme' },
  '02 Welcome to Crocodile Isle': { game: 'dkc2', title: 'Welcome to Crocodile Isle' },
  '03 - Angel Island Zone Act 1': { game: 'sonic3', title: 'Angel Island Zone Act 1' },
  '03 - Emerald Hill Zone': { game: 'sonic2', title: 'Emerald Hill Zone' },
  '03 - Marble Zone': { game: 'sonic', title: 'Marble Zone' },
  '03 DK Island Swing': { game: 'dkc', title: 'DK Island Swing' },
  "03 Klomp's Romp": { game: 'dkc2', title: "Klomp's Romp" },
  "03 Peach's Message": { game: 'mario64', title: "Peach's Message" },
  '03. Subwoofer Lullaby': { game: 'minecraft', title: 'Subwoofer Lullaby' },
  '04 - Spring Yard Zone': { game: 'sonic', title: 'Spring Yard Zone' },
  "04 Cranky's Theme": { game: 'dkc', title: "Cranky's Theme" },
  "04 Lockjaw's Saga": { game: 'dkc2', title: "Lockjaw's Saga" },
  '04 Opening': { game: 'mario64', title: 'Opening' },
  '05 - Chemical Plant Zone': { game: 'sonic2', title: 'Chemical Plant Zone' },
  '05 - Labyrinth Zone': { game: 'sonic', title: 'Labyrinth Zone' },
  '05 Cave Dweller Concert': { game: 'dkc', title: 'Cave Dweller Concert' },
  '05 Main Theme': { game: 'mario64', title: 'Main Theme' },
  '05. Living Mice': { game: 'minecraft', title: 'Living Mice' },
  '06 - Star Light Zone': { game: 'sonic', title: 'Star Light Zone' },
  '06 Bonus Room Blitz': { game: 'dkc', title: 'Bonus Room Blitz' },
  '06 Slider': { game: 'mario64', title: 'Slider' },
  '06. Moog City': { game: 'minecraft', title: 'Moog City' },
  '07 - Aquatic Ruin Zone': { game: 'sonic2', title: 'Aquatic Ruin Zone' },
  '07 - Scrap Brain Zone': { game: 'sonic', title: 'Scrap Brain Zone' },
  '07 Aquatic Ambiance': { game: 'dkc', title: 'Aquatic Ambiance' },
  '07 Inside the Castle Walls': { game: 'mario64', title: 'Inside the Castle Walls' },
  '07. Haggstrom': { game: 'minecraft', title: 'Haggstrom' },
  '08 - Casino Night Zone': { game: 'sonic2', title: 'Casino Night Zone' },
  '08. Minecraft': { game: 'minecraft', title: 'Minecraft' },
  '09 - Hill Top Zone': { game: 'sonic2', title: 'Hill Top Zone' },
  '09 Armored Armadillo': { game: 'mmx', title: 'Armored Armadillo' },
  '09a Dire, Dire Docks': { game: 'mario64', title: 'Dire, Dire Docks' },
  '10 - Mystic Cave Zone': { game: 'sonic2', title: 'Mystic Cave Zone' },
  '10 Boomer Kuwanger': { game: 'mmx', title: 'Boomer Kuwanger' },
  '10 Forest Interlude': { game: 'dkc2', title: 'Forest Interlude' },
  '10 Lethal Lava Land': { game: 'mario64', title: 'Lethal Lava Land' },
  '11 - IceCap Zone Act 1': { game: 'sonic3', title: 'IceCap Zone Act 1' },
  '11 - Oil Ocean Zone': { game: 'sonic2', title: 'Oil Ocean Zone' },
  '11 Chill Penguin': { game: 'mmx', title: 'Chill Penguin' },
  '11 Snow Mountain': { game: 'mario64', title: 'Snow Mountain' },
  '11. Mice On Venus': { game: 'minecraft', title: 'Mice On Venus' },
  '12 - Metropolis Zone': { game: 'sonic2', title: 'Metropolis Zone' },
  '12 Flame Mammoth': { game: 'mmx', title: 'Flame Mammoth' },
  '12 Haunted House': { game: 'mario64', title: 'Haunted House' },
  '12. Dry Hands': { game: 'minecraft', title: 'Dry Hands' },
  '13 - Launch Base Zone Act 1': { game: 'sonic3', title: 'Launch Base Zone Act 1' },
  '13 Launch Octopus': { game: 'mmx', title: 'Launch Octopus' },
  '13 Merry-Go-Round': { game: 'mario64', title: 'Merry-Go-Round' },
  '13. Wet Hands': { game: 'minecraft', title: 'Wet Hands' },
  '14 Spark Mandrill': { game: 'mmx', title: 'Spark Mandrill' },
  '15 - Death Egg Zone': { game: 'sonic2', title: 'Death Egg Zone' },
  "15 Piranha Plant's Lullaby": { game: 'mario64', title: "Piranha Plant's Lullaby" },
  '15 Sting Chameleon': { game: 'mmx', title: 'Sting Chameleon' },
  '16 - Robotnik': { game: 'sonic', title: 'Robotnik' },
  '16 Storm Eagle': { game: 'mmx', title: 'Storm Eagle' },
  '17 Stickerbrush Symphony': { game: 'dkc2', title: 'Stickerbrush Symphony' },
  '18. Sweden': { game: 'minecraft', title: 'Sweden' },
  'Super Smash Bros Brawl - Main Theme': { game: 'ssbb', title: 'Main Theme' }
};

function renameAudioFiles() {
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  const files = fs.readdirSync(audioDir);

  files.forEach(file => {
    if (!file.toLowerCase().endsWith('.mp3')) return;

    const mapping = titleMappings[file.replace('.mp3', '')];
    if (!mapping) {
      console.log(`No mapping found for: ${file}`);
      return;
    }

    const { game, title } = mapping;
    const gameData = gameInfo[game];
    if (!gameData) {
      console.log(`No game info found for: ${game}`);
      return;
    }

    // Extrair número da faixa do nome original
    const trackMatch = file.match(/^(\d+)/);
    const trackNumber = trackMatch ? trackMatch[1].padStart(2, '0') : '01';

    // Criar novo nome do arquivo
    const newFileName = `${trackNumber} - ${title} - ${gameData.name} - ${gameData.artist}.mp3`;
    const oldPath = path.join(audioDir, file);
    const newPath = path.join(audioDir, newFileName);

    try {
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: ${file} -> ${newFileName}`);
    } catch (error) {
      console.error(`Error renaming ${file}:`, error);
    }
  });
}

renameAudioFiles(); 