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

const gameMetadata = {
  'banjo-kazooie': {
    defaultArtist: 'Grant Kirkhope',
    defaultComposer: 'Grant Kirkhope',
    name: 'Banjo-Kazooie',
    year: 1998,
    console: 'Nintendo 64',
    genre: 'Game Soundtrack'
  },
  'cuphead': {
    defaultArtist: 'Kristofer Maddigan',
    defaultComposer: 'Kristofer Maddigan',
    name: 'Cuphead',
    year: 2017,
    console: 'Multi-platform',
    genre: 'Jazz'
  },
  'donkey-kong': {
    defaultArtist: 'David Wise',
    defaultComposer: 'David Wise',
    games: {
      'donkey-kong-country': {
        name: 'Donkey Kong Country',
        year: 1994,
        console: 'SNES'
      },
      'donkey-kong-country-2': {
        name: 'Donkey Kong Country 2: Diddy\'s Kong Quest',
        year: 1995,
        console: 'SNES'
      },
      'donkey-kong-country-3': {
        name: 'Donkey Kong Country 3: Dixie Kong\'s Double Trouble!',
        year: 1996,
        console: 'SNES'
      }
    }
  },
  'f-zero': {
    defaultArtist: 'Yumiko Kanki & Naoto Ishida',
    defaultComposer: 'Yumiko Kanki & Naoto Ishida',
    name: 'F-Zero',
    year: 1990,
    console: 'SNES',
    genre: 'Game Soundtrack'
  },
  'goldeneye': {
    defaultArtist: 'Grant Kirkhope',
    defaultComposer: 'Grant Kirkhope',
    name: 'GoldenEye 007',
    year: 1997,
    console: 'Nintendo 64',
    genre: 'Game Soundtrack'
  },
  'hollow-knight': {
    defaultArtist: 'Christopher Larkin',
    defaultComposer: 'Christopher Larkin',
    name: 'Hollow Knight',
    year: 2017,
    console: 'Multi-platform',
    genre: 'Orchestral'
  },
  'kirby': {
    defaultArtist: 'Jun Ishikawa',
    defaultComposer: 'Jun Ishikawa',
    name: 'Kirby Super Star',
    year: 1996,
    console: 'SNES',
    genre: 'Game Soundtrack'
  },
  'mario': {
    defaultArtist: 'Koji Kondo',
    defaultComposer: 'Koji Kondo',
    games: {
      'mario-kart-64': {
        name: 'Mario Kart 64',
        year: 1996,
        console: 'Nintendo 64'
      },
      'mario-kart-wii': {
        name: 'Mario Kart Wii',
        year: 2008,
        console: 'Wii'
      },
      'mario-paint': {
        name: 'Mario Paint',
        year: 1992,
        console: 'SNES'
      },
      'new-super-mario-bros-wii': {
        name: 'New Super Mario Bros. Wii',
        year: 2009,
        console: 'Wii'
      },
      'paper-mario': {
        name: 'Paper Mario',
        year: 2000,
        console: 'Nintendo 64'
      },
      'super-mario-64': {
        name: 'Super Mario 64',
        year: 1996,
        console: 'Nintendo 64'
      },
      'super-mario-galaxy': {
        name: 'Super Mario Galaxy',
        year: 2007,
        console: 'Wii',
        defaultArtist: 'Mahito Yokota & Koji Kondo',
        defaultComposer: 'Mahito Yokota & Koji Kondo'
      },
      'super-mario-galaxy-2': {
        name: 'Super Mario Galaxy 2',
        year: 2010,
        console: 'Wii',
        defaultArtist: 'Mahito Yokota & Koji Kondo',
        defaultComposer: 'Mahito Yokota & Koji Kondo'
      },
      'super-mario-odyssey': {
        name: 'Super Mario Odyssey',
        year: 2017,
        console: 'Nintendo Switch',
        defaultArtist: 'Naoto Kubo, Shiho Fujii & Koji Kondo',
        defaultComposer: 'Naoto Kubo, Shiho Fujii & Koji Kondo'
      },
      'super-mario-sunshine': {
        name: 'Super Mario Sunshine',
        year: 2002,
        console: 'GameCube'
      },
      'super-mario-world': {
        name: 'Super Mario World',
        year: 1990,
        console: 'SNES'
      }
    }
  },
  'mega-man': {
    defaultArtist: 'Setsuo Yamamoto',
    defaultComposer: 'Setsuo Yamamoto',
    games: {
      'mega-man-x': {
        name: 'Mega Man X',
        year: 1993,
        console: 'SNES',
        genre: 'Game Soundtrack'
      }
    }
  },
  'metroid': {
    defaultArtist: 'Hirokazu Tanaka',
    defaultComposer: 'Hirokazu Tanaka',
    name: 'Metroid',
    year: 1986,
    console: 'NES',
    genre: 'Game Soundtrack'
  },
  'minecraft': {
    defaultArtist: 'C418',
    defaultComposer: 'C418',
    name: 'Minecraft',
    year: 2011,
    console: 'Multi-platform',
    genre: 'Ambient'
  },
  'outer-wilds': {
    defaultArtist: 'Andrew Prahlow',
    defaultComposer: 'Andrew Prahlow',
    name: 'Outer Wilds',
    year: 2019,
    console: 'Multi-platform',
    genre: 'Orchestral'
  },
  'pokemon': {
    defaultArtist: 'Junichi Masuda',
    defaultComposer: 'Junichi Masuda',
    games: {
      'pokemon-red-blue': {
        name: 'Pokémon Red & Blue',
        year: 1996,
        console: 'Game Boy',
        defaultArtist: 'Junichi Masuda',
        defaultComposer: 'Junichi Masuda'
      },
      'pokemon-ruby-sapphire': {
        name: 'Pokémon Ruby & Sapphire',
        year: 2002,
        console: 'Game Boy Advance',
        defaultArtist: 'Go Ichinose & Junichi Masuda',
        defaultComposer: 'Go Ichinose & Junichi Masuda'
      },
      'pokemon-diamond-pearl': {
        name: 'Pokémon Diamond & Pearl',
        year: 2006,
        console: 'Nintendo DS',
        defaultArtist: 'Go Ichinose & Junichi Masuda',
        defaultComposer: 'Go Ichinose & Junichi Masuda'
      },
      'pokemon-x-y': {
        name: 'Pokémon X & Y',
        year: 2013,
        console: 'Nintendo 3DS',
        defaultArtist: 'Shota Kageyama, Minako Adachi & Hitomi Sato',
        defaultComposer: 'Shota Kageyama, Minako Adachi & Hitomi Sato'
      }
    }
  },
  'smash-bros': {
    defaultArtist: 'Various Artists',
    defaultComposer: 'Various Artists',
    games: {
      'super-smash-bros-brawl': {
        name: 'Super Smash Bros. Brawl',
        year: 2008,
        console: 'Wii',
        defaultArtist: 'Nobuo Uematsu',
        defaultComposer: 'Nobuo Uematsu'
      }
    }
  },
  'sonic': {
    defaultArtist: 'Masato Nakamura',
    defaultComposer: 'Masato Nakamura',
    games: {
      'sonic-1': {
        name: 'Sonic the Hedgehog',
        year: 1991,
        console: 'Sega Genesis',
        defaultArtist: 'Masato Nakamura',
        defaultComposer: 'Masato Nakamura'
      },
      'sonic-2': {
        name: 'Sonic the Hedgehog 2',
        year: 1992,
        console: 'Sega Genesis',
        defaultArtist: 'Masato Nakamura',
        defaultComposer: 'Masato Nakamura'
      },
      'sonic-3': {
        name: 'Sonic the Hedgehog 3',
        year: 1994,
        console: 'Sega Genesis',
        defaultArtist: 'Michael Jackson & Sega Sound Team',
        defaultComposer: 'Michael Jackson & Sega Sound Team'
      }
    }
  },
  'star-fox': {
    defaultArtist: 'Koji Kondo',
    defaultComposer: 'Koji Kondo',
    name: 'Star Fox 64',
    year: 1997,
    console: 'Nintendo 64',
    genre: 'Game Soundtrack'
  },
  'stardew-valley': {
    defaultArtist: 'ConcernedApe',
    defaultComposer: 'ConcernedApe',
    name: 'Stardew Valley',
    year: 2016,
    console: 'Multi-platform',
    genre: 'Game Soundtrack'
  },
  'street-fighter': {
    defaultArtist: 'Yoko Shimomura',
    defaultComposer: 'Yoko Shimomura',
    name: 'Street Fighter II',
    year: 1991,
    console: 'SNES',
    genre: 'Game Soundtrack'
  },
  'streets-of-rage': {
    defaultArtist: 'Yuzo Koshiro',
    defaultComposer: 'Yuzo Koshiro',
    name: 'Streets of Rage 2',
    year: 1992,
    console: 'Sega Genesis',
    genre: 'Game Soundtrack'
  },
  'tetris': {
    defaultArtist: 'Hirokazu Tanaka',
    defaultComposer: 'Hirokazu Tanaka',
    name: 'Tetris',
    year: 1989,
    console: 'Game Boy',
    genre: 'Game Soundtrack'
  },
  'wii': {
    defaultArtist: 'Kazumi Totaka',
    defaultComposer: 'Kazumi Totaka',
    games: {
      'wii-sports': {
        name: 'Wii Sports',
        year: 2006,
        console: 'Wii'
      },
      'wii-shop': {
        name: 'Wii Shop Channel',
        year: 2006,
        console: 'Wii'
      }
    }
  },
  'zelda': {
    defaultArtist: 'Koji Kondo',
    defaultComposer: 'Koji Kondo',
    games: {
      'ocarina-of-time': {
        name: 'The Legend of Zelda: Ocarina of Time',
        year: 1998,
        console: 'Nintendo 64'
      }
    }
  },
  'laika': {
    defaultArtist: 'Laika',
    defaultComposer: 'Laika',
    name: 'Laika: Aged Through Blood',
    year: 2024,
    console: 'Multi-platform',
    genre: 'Game Soundtrack'
  },
  'others': {
    games: {
      'metal-gear-rising': {
        name: 'Metal Gear Rising: Revengeance',
        year: 2013,
        console: 'Multi-platform',
        defaultArtist: 'Jamie Christopherson',
        defaultComposer: 'Jamie Christopherson',
        genre: 'Metal/Electronic'
      },
      'omori': {
        name: 'OMORI',
        year: 2020,
        console: 'Multi-platform',
        defaultArtist: 'OMOCAT & Pedro Silva',
        defaultComposer: 'OMOCAT & Pedro Silva',
        genre: 'Game Soundtrack'
      },
      'doom': {
        name: 'DOOM',
        year: 2016,
        console: 'Multi-platform',
        defaultArtist: 'Mick Gordon',
        defaultComposer: 'Mick Gordon',
        genre: 'Metal/Electronic'
      },
      'plants-vs-zombies': {
        name: 'Plants vs. Zombies',
        year: 2009,
        console: 'Multi-platform',
        defaultArtist: 'Laura Shigihara',
        defaultComposer: 'Laura Shigihara',
        genre: 'Game Soundtrack'
      },
      'castlevania': {
        name: 'Castlevania: Symphony of the Night',
        year: 1997,
        console: 'PlayStation',
        defaultArtist: 'Michiru Yamane',
        defaultComposer: 'Michiru Yamane',
        genre: 'Game Soundtrack'
      },
      'dark-souls': {
        name: 'Dark Souls',
        year: 2011,
        console: 'Multi-platform',
        defaultArtist: 'Motoi Sakuraba',
        defaultComposer: 'Motoi Sakuraba',
        genre: 'Orchestral'
      },
      'dark-souls-3': {
        name: 'Dark Souls III',
        year: 2016,
        console: 'Multi-platform',
        defaultArtist: 'Yuka Kitamura & Motoi Sakuraba',
        defaultComposer: 'Yuka Kitamura & Motoi Sakuraba',
        genre: 'Orchestral'
      },
      'fall-guys': {
        name: 'Fall Guys: Ultimate Knockout',
        year: 2020,
        console: 'Multi-platform',
        defaultArtist: 'Jukio Kallio & Daniel Hagström',
        defaultComposer: 'Jukio Kallio & Daniel Hagström',
        genre: 'Electronic'
      },
      'persona-5': {
        name: 'Persona 5',
        year: 2016,
        console: 'PlayStation',
        defaultArtist: 'Shoji Meguro',
        defaultComposer: 'Shoji Meguro',
        genre: 'J-Pop/Rock'
      },
      'splatoon': {
        name: 'Splatoon',
        year: 2015,
        console: 'Wii U',
        defaultArtist: 'Toru Minegishi & Shiho Fujii',
        defaultComposer: 'Toru Minegishi & Shiho Fujii',
        genre: 'Electronic/Rock'
      }
    }
  },
  'metal-gear': {
    defaultArtist: 'Jamie Christopherson',
    defaultComposer: 'Jamie Christopherson',
    name: 'Metal Gear Rising: Revengeance',
    year: 2013,
    console: 'Multi-platform',
    genre: 'Electronic Rock'
  },
  'omori': {
    defaultArtist: 'OMOCAT Team',
    defaultComposer: 'Pedro Silva',
    name: 'OMORI',
    year: 2020,
    console: 'Multi-platform',
    genre: 'RPG Soundtrack'
  },
  'doom': {
    defaultArtist: 'Bobby Prince',
    defaultComposer: 'Bobby Prince',
    name: 'DOOM',
    year: 1993,
    console: 'Multi-platform',
    genre: 'Heavy Metal'
  },
  'plants-vs-zombies': {
    defaultArtist: 'Laura Shigihara',
    defaultComposer: 'Laura Shigihara',
    name: 'Plants vs. Zombies',
    year: 2009,
    console: 'Multi-platform',
    genre: 'Game Soundtrack'
  },
  'persona': {
    defaultArtist: 'Shoji Meguro',
    defaultComposer: 'Shoji Meguro',
    games: {
      'persona-5': {
        name: 'Persona 5',
        year: 2016,
        console: 'PlayStation',
        genre: 'J-Pop/Rock'
      }
    }
  },
  'castlevania': {
    defaultArtist: 'Michiru Yamane',
    defaultComposer: 'Michiru Yamane',
    name: 'Castlevania: Symphony of the Night',
    year: 1997,
    console: 'PlayStation',
    genre: 'Orchestral'
  },
  'dark-souls': {
    defaultArtist: 'Yuka Kitamura & Motoi Sakuraba',
    defaultComposer: 'Yuka Kitamura & Motoi Sakuraba',
    games: {
      'dark-souls-3': {
        name: 'Dark Souls III',
        year: 2016,
        console: 'Multi-platform',
        genre: 'Orchestral'
      }
    }
  },
  'fall-guys': {
    defaultArtist: 'Jukio Kallio & Daniel Hagström',
    defaultComposer: 'Jukio Kallio & Daniel Hagström',
    name: 'Fall Guys',
    year: 2020,
    console: 'Multi-platform',
    genre: 'Electronic'
  },
  'splatoon': {
    defaultArtist: 'Toru Minegishi & Shiho Fujii',
    defaultComposer: 'Toru Minegishi & Shiho Fujii',
    name: 'Splatoon',
    year: 2015,
    console: 'Wii U',
    genre: 'J-Pop'
  }
};

function normalize(str) {
  // Special cases for roman numerals and common abbreviations
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const specialAbbr = ['DK', 'RPG', '3D', '2D', 'HD'];
  
  return str
    .split(/[\s-]+/)
    .map(word => {
      // Check for roman numerals and special abbreviations
      if (romanNumerals.includes(word.toUpperCase()) || specialAbbr.includes(word.toUpperCase())) {
        return word.toUpperCase();
      }
      // Capitalize first letter, preserve rest of the case
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function getProperGameName(game) {
  const gameNameMap = {
    'mario': 'Super Mario',
    'mario-kart': 'Mario Kart',
    'mario-party': 'Mario Party',
    'mario-paint': 'Mario Paint',
    'mario-odyssey': 'Super Mario Odyssey',
    'mario-sunshine': 'Super Mario Sunshine',
    'mario-galaxy': 'Super Mario Galaxy',
    'mario-galaxy-2': 'Super Mario Galaxy 2',
    'zelda': 'The Legend of Zelda',
    'pokemon': 'Pokémon',
    'pokemon-red-blue': 'Pokémon Red & Blue',
    'pokemon-gold-silver': 'Pokémon Gold & Silver',
    'pokemon-ruby-sapphire': 'Pokémon Ruby & Sapphire',
    'pokemon-diamond-pearl': 'Pokémon Diamond & Pearl',
    'pokemon-black-white': 'Pokémon Black & White',
    'pokemon-x-y': 'Pokémon X & Y',
    'sonic': 'Sonic the Hedgehog',
    'sonic-2': 'Sonic the Hedgehog 2',
    'sonic-3': 'Sonic the Hedgehog 3',
    'sonic-cd': 'Sonic CD',
    'sonic-mania': 'Sonic Mania',
    'donkey-kong': 'Donkey Kong',
    'donkey-kong-country': 'Donkey Kong Country',
    'donkey-kong-country-2': 'Donkey Kong Country 2',
    'donkey-kong-country-3': 'Donkey Kong Country 3',
    'mega-man': 'Mega Man',
    'mega-man-x': 'Mega Man X',
    'hollow-knight': 'Hollow Knight',
    'cuphead': 'Cuphead',
    'minecraft': 'Minecraft',
    'stardew-valley': 'Stardew Valley',
    'outer-wilds': 'Outer Wilds',
    'banjo-kazooie': 'Banjo-Kazooie',
    'street-fighter': 'Street Fighter',
    'street-fighter-2': 'Street Fighter II',
    'kirby': 'Kirby',
    'kirby-super-star': 'Kirby Super Star',
    'smash-bros': 'Super Smash Bros.',
    'smash-bros-melee': 'Super Smash Bros. Melee',
    'smash-bros-brawl': 'Super Smash Bros. Brawl',
    'metroid': 'Metroid',
    'super-metroid': 'Super Metroid',
    'metroid-prime': 'Metroid Prime',
    'dark-souls': 'Dark Souls',
    'dark-souls-3': 'Dark Souls III',
    'persona': 'Persona',
    'persona-5': 'Persona 5',
    'tetris': 'Tetris',
    'star-fox': 'Star Fox',
    'star-fox-64': 'Star Fox 64',
    'f-zero': 'F-Zero',
    'metal-gear': 'Metal Gear Rising',
    'plants-vs-zombies': 'Plants vs. Zombies',
    'omori': 'OMORI',
    'doom': 'DOOM'
  };

  // Normalize the input game name
  const normalizedGame = game.toLowerCase().replace(/\s+/g, '-');
  
  // Return the mapped name if it exists, otherwise normalize the original
  return gameNameMap[normalizedGame] || normalize(game);
}

function normalizeGameKey(dirName) {
  // Map directory names to metadata keys
  const dirToMetadataMap = {
    'banjo-kazooie': 'banjo-kazooie',
    'donkey-kong': 'donkey-kong',
    'mario': 'mario',
    'hollow-knight': 'hollow-knight',
    'outer-wilds': 'outer-wilds',
    'stardew-valley': 'stardew-valley',
    'laika-aged-through-blood': 'laika',
    'pokemon': 'pokemon',
    'sonic': 'sonic',
    'zelda': 'zelda',
    'metal-gear-rising': 'metal-gear',
    'metal-gear': 'metal-gear',
    'omori': 'omori',
    'doom': 'doom',
    'plants-vs-zombies': 'plants-vs-zombies',
    'pvz': 'plants-vs-zombies',
    'persona': 'persona',
    'persona-5': 'persona',
    'castlevania': 'castlevania',
    'symphony-of-the-night': 'castlevania',
    'dark-souls': 'dark-souls',
    'dark-souls-3': 'dark-souls',
    'fall-guys': 'fall-guys',
    'splatoon': 'splatoon',
    'outros': 'others'
  };

  // Split the path into parts
  const parts = dirName.split('/');
  const mainDir = parts[0];

  // Special handling for Mario games
  if (mainDir.startsWith('mario-')) {
    return 'mario';
  }

  // Check if we have a mapping for the main directory
  if (dirToMetadataMap[mainDir]) {
    return dirToMetadataMap[mainDir];
  }

  return mainDir;
}

function getSubGameKey(dirName) {
  // Map directory names to sub-game keys
    const dirToSubGameMap = {    'mario-galaxy': 'super-mario-galaxy',    'mario-odyssey': 'super-mario-odyssey',    'mario-sunshine': 'super-mario-sunshine',    'mario-world': 'super-mario-world',    'mario/mario-kart-64': 'mario-kart-64',    'mario/mario-kart-wii': 'mario-kart-wii',    'mario/mario-paint': 'mario-paint',    'mario/new-super-mario-bros-wii': 'new-super-mario-bros-wii',    'mario/paper-mario': 'paper-mario',    'mario/super-mario-64': 'super-mario-64',    'mario/super-mario-bros': 'super-mario-bros',    'donkey-kong/donkey-kong-country': 'donkey-kong-country',    'donkey-kong/donkey-kong-country-2': 'donkey-kong-country-2',    'donkey-kong/donkey-kong-country-3': 'donkey-kong-country-3',    'pokemon/pokemon-diamond-pearl': 'pokemon-diamond-pearl',    'pokemon/red-blue': 'pokemon-red-blue',    'pokemon/ruby-sapphire': 'pokemon-ruby-sapphire',    'pokemon/x-y': 'pokemon-x-y',    'sonic/sonic-1': 'sonic-1',    'sonic/sonic-2': 'sonic-2',    'sonic/sonic-3': 'sonic-3',    'zelda/ocarina-of-time': 'ocarina-of-time',    'dark-souls/dark-souls-3': 'dark-souls-3',    'persona/persona-5': 'persona-5'
  };

  // Check for direct mapping
  if (dirToSubGameMap[dirName]) {
    return dirToSubGameMap[dirName];
  }

  // If no direct mapping, try to extract from path
  const parts = dirName.split('/');
  if (parts.length > 1) {
    return parts[1];
  }

  return '';
}

function extractInfoFromFile(filePath) {
  const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath);
  const audioUrl = '/' + relativePath.replace(/\\/g, '/');
  const filename = path.basename(filePath);
  const parentDirs = path.dirname(relativePath).split(path.sep).filter(Boolean);
  
  // Skip the 'audio' directory and get actual game name
  const rawGameKey = parentDirs.length > 1 ? parentDirs.slice(1).join('/') : parentDirs[0];
  
  // Normalize the game key to match metadata
  const gameKey = normalizeGameKey(rawGameKey);
  const subKey = getSubGameKey(rawGameKey);
  
  // Get game metadata
  const gameData = gameMetadata[gameKey];
  if (!gameData) {
    console.warn(`No metadata found for game: ${rawGameKey}`);
    return {
      title: normalize(filename.replace(/\.mp3$/, '')),
      artist: 'Unknown',
      composer: 'Unknown',
      game: normalize(gameKey),
      context: `Audio - ${normalize(rawGameKey)}`,
      audioUrl: audioUrl,
      year: 1985,
      genre: 'Game Soundtrack',
      console: 'Unknown'
    };
  }

  let metadata = gameData;
  if (gameData.games && subKey) {
    const subGameData = gameData.games[subKey];
    if (subGameData) {
      metadata = {
        ...gameData,
        ...subGameData
      };
    }
  }

  // Remove extension and any numbers at start
  let title = filename.replace(/\.mp3$/, '').replace(/^\d+[\\s-]*/, '');
  
  // Remove any text between parentheses at the end
  title = title.replace(/\\s*\\([^)]*\\)\\s*$/, '');

  // Get proper game name
  const game = metadata.name || normalize(gameKey);
  
  // Build context from directory structure
  const context = `Audio - ${normalize(rawGameKey)}`;

  return {
    title: normalize(title),
    artist: metadata.defaultArtist || 'Unknown',
    composer: metadata.defaultComposer || 'Unknown',
    game: game,
    context: context,
    audioUrl: audioUrl,
    year: metadata.year || 1985,
    genre: metadata.genre || 'Game Soundtrack',
    console: metadata.console || 'Unknown'
  };
}

function extractInfoFromFilename(filename, parentDirs = '') {
  // Remove extensão
  const nameWithoutExt = filename.replace(/\.mp3$/i, '');
  
  // Extrai número da faixa se existir no início do nome
  const trackMatch = nameWithoutExt.match(/^(\d+)[. -]*/);
  const trackNumber = trackMatch ? parseInt(trackMatch[1]) : 0;
  
  // Remove o número da faixa do início para obter o título
  let title = nameWithoutExt.replace(/^\d+[. -]*/, '');
  
  // Identifica o jogo e console baseado nos diretórios pai
  const dirs = parentDirs.split(path.sep);
  const game = dirs[0] || 'Unknown'; // primeira pasta é a franquia
  const specificGame = dirs[1] || dirs[0] || 'Unknown'; // segunda pasta é o jogo específico
  
  // Mapeia franquias para compositores/artistas conhecidos
  let artist = 'Unknown';
  if (game.toLowerCase().includes('mario')) {
    artist = 'Koji Kondo';
  } else if (game.toLowerCase().includes('sonic')) {
    artist = 'Jun Senoue';
  } else if (game.toLowerCase().includes('zelda')) {
    artist = 'Koji Kondo';
  } else if (game.toLowerCase().includes('pokemon')) {
    artist = 'Junichi Masuda';
  } else if (game.toLowerCase().includes('banjo')) {
    artist = 'Grant Kirkhope';
  } else if (game.toLowerCase().includes('donkey kong')) {
    artist = 'David Wise';
  } else if (game.toLowerCase().includes('street fighter')) {
    artist = 'Yoko Shimomura';
  } else if (game.toLowerCase().includes('kirby')) {
    artist = 'Jun Ishikawa';
  }

  // Mapeia jogos para anos de lançamento
  let year = 1985; // ano padrão para jogos não identificados
  if (specificGame.toLowerCase().includes('super mario 64')) {
    year = 1996;
  } else if (specificGame.toLowerCase().includes('mario kart 64')) {
    year = 1996;
  } else if (specificGame.toLowerCase().includes('mario kart wii')) {
    year = 2008;
  } else if (specificGame.toLowerCase().includes('new super mario bros wii')) {
    year = 2009;
  } else if (specificGame.toLowerCase().includes('mario kart ds')) {
    year = 2005;
  } else if (specificGame.toLowerCase().includes('paper mario')) {
    year = 2000;
  } else if (specificGame.toLowerCase().includes('mario paint')) {
    year = 1992;
  } else if (specificGame.toLowerCase().includes('mario & luigi')) {
    year = 2003;
  } else if (specificGame.toLowerCase().includes('sonic 3')) {
    year = 1994;
  } else if (specificGame.toLowerCase().includes('sonic 2')) {
    year = 1992;
  } else if (specificGame.toLowerCase().includes('sonic 1') || specificGame.toLowerCase().includes('sonic the hedgehog')) {
    year = 1991;
  } else if (specificGame.toLowerCase().includes('banjo-kazooie')) {
    year = 1998;
  } else if (specificGame.toLowerCase().includes('donkey kong 64')) {
    year = 1999;
  } else if (specificGame.toLowerCase().includes('street fighter ii')) {
    year = 1991;
  } else if (specificGame.toLowerCase().includes('kirby super star')) {
    year = 1996;
  }

  // Identifica o console baseado no jogo
  let console = 'Unknown';
  if (specificGame.toLowerCase().includes('64')) {
    console = 'Nintendo 64';
  } else if (specificGame.toLowerCase().includes('wii')) {
    console = 'Wii';
  } else if (specificGame.toLowerCase().includes('ds')) {
    console = 'Nintendo DS';
  } else if (specificGame.toLowerCase().includes('gba')) {
    console = 'Game Boy Advance';
  } else if (specificGame.toLowerCase().includes('super')) {
    console = 'SNES';
  }

  return {
    trackNumber,
    title,
    artist,
    year,
    album: `${specificGame} Soundtrack`,
    game: specificGame,
    genre: 'Game Soundtrack',
    console
  };
}

function scanAudioFiles() {
  try {
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    console.log('Diretório de áudio:', audioDir);
    
    // Array para armazenar todas as músicas
    const musicData = [];
    let totalFiles = 0;
    let id = 0;

    // Função para escanear recursivamente os diretórios
    function scanDirectory(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Se for um diretório, escaneia recursivamente
          scanDirectory(fullPath);
        } else if (item.toLowerCase().endsWith('.mp3')) {
          totalFiles++;
          
          // Extrai as informações do arquivo
          const info = extractInfoFromFile(fullPath);
          
          // Adiciona o ID
          musicData.push({
            id: id++,
            ...info
          });
          
          console.log(`Música processada: ${info.title}`);
        }
      }
    }

    // Inicia o escaneamento
    scanDirectory(audioDir);
    
    // Ordena por ID antes de salvar
    musicData.sort((a, b) => a.id - b.id);
    
    // Salva o arquivo atualizado
    const musicJsonPath = path.join(process.cwd(), 'data', 'music.json');
    fs.writeFileSync(musicJsonPath, JSON.stringify(musicData, null, 2));
    
    console.log(`\nProcessamento concluído!`);
    console.log(`Total de músicas processadas: ${totalFiles}`);
    
  } catch (error) {
    console.error('Erro ao escanear arquivos:', error);
  }
}

// Executa o script
console.log('Iniciando scanAudioFiles.js');
scanAudioFiles(); 