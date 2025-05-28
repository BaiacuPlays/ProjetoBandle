const fs = require('fs');
const path = require('path');

// Função para extrair informações do nome do arquivo
function extractMusicInfo(filePath, id) {
  const relativePath = filePath.replace(/\\/g, '/');
  const pathParts = relativePath.split('/');
  const fileName = pathParts[pathParts.length - 1];

  // Encontrar a pasta principal do jogo (primeiro nível após audio)
  let gameFolder = pathParts[0];
  let subFolder = pathParts.length > 1 ? pathParts[1] : null;

  // Remove extensão e números de track
  let title = fileName.replace(/\.(mp3|wav)$/i, '');

  // Remove números iniciais mais agressivamente
  title = title.replace(/^\d+[\s\-\.]*/, ''); // Remove números iniciais como "38. "
  title = title.replace(/^[\d\-]+[\s\.]*/, ''); // Remove padrões como "1-38. "
  title = title.replace(/^\d+\s+/, ''); // Remove números seguidos de espaço como "024 "
  title = title.replace(/^OST\s*-\s*\d+\s*/, ''); // Remove "OST - 024 "
  title = title.replace(/^Undertale\s*OST\s*-\s*\d+\s*/, ''); // Remove "Undertale OST - 024 "
  title = title.replace(/^youtube_[a-zA-Z0-9_-]+_audio/, ''); // Remove "youtube_xxxxx_audio"
  title = title.replace(/^youtube_[a-zA-Z0-9_-]+/, ''); // Remove "youtube_xxxxx"
  title = title.replace(/^_audio$/, ''); // Remove "_audio" sozinho
  title = title.replace(/^\._/, ''); // Remove prefixos de arquivos Mac como "._"

  // Remove prefixos comuns
  title = title.replace(/^[\[\(]?Official[\]\)]?\s*/, ''); // Remove [Official]
  title = title.replace(/Original Soundtrack\s*-\s*\d+\s*-\s*/, ''); // Remove "Original Soundtrack - XX -"

  // Remove prefixos de nomes de jogos específicos que aparecem incorretamente nos títulos
  title = title.replace(/^Celeste\s+/, ''); // Remove "Celeste " do início
  title = title.replace(/^Sonic\s+/, ''); // Remove "Sonic " do início
  title = title.replace(/^Mario\s+/, ''); // Remove "Mario " do início
  title = title.replace(/^Zelda\s+/, ''); // Remove "Zelda " do início
  title = title.replace(/^Pokemon\s+/, ''); // Remove "Pokemon " do início
  title = title.replace(/^Crash\s+/, ''); // Remove "Crash " do início
  title = title.replace(/^Cuphead\s+/, ''); // Remove "Cuphead " do início
  title = title.replace(/^Undertale\s+/, ''); // Remove "Undertale " do início
  title = title.replace(/^Deltarune\s+/, ''); // Remove "Deltarune " do início
  title = title.replace(/^Hollow Knight\s+/, ''); // Remove "Hollow Knight " do início
  title = title.replace(/^Hades\s+/, ''); // Remove "Hades " do início
  title = title.replace(/^Doom\s+/, ''); // Remove "Doom " do início
  title = title.replace(/^Minecraft\s+/, ''); // Remove "Minecraft " do início

  // Extrair título real do nome do arquivo
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    // Se há múltiplas partes, pegar a última (que geralmente é o título)
    title = parts[parts.length - 1];
  }

  // Limpezas específicas para casos problemáticos
  title = title.replace(/^main-theme-of-.*/, ''); // Remove "main-theme-of-xxx"
  title = title.replace(/^theme-of-.*/, ''); // Remove "theme-of-xxx"
  title = title.replace(/-+/g, ' '); // Substitui múltiplos hífens por espaços
  title = title.replace(/\s+/g, ' '); // Substitui múltiplos espaços por um só

  // Se o título contém informações de artista/compositor, extrair apenas o nome da música
  if (title.includes(' & ') && title.includes('Sound Team')) {
    // Para casos como "IceCap Zone Act 1 - Sonic the Hedgehog 3 - Michael Jackson & Sega Sound Team"
    const musicParts = title.split(' - ');
    if (musicParts.length > 0) {
      title = musicParts[0]; // Pegar apenas a primeira parte (nome da música)
    }
  }

  // Casos específicos para arquivos do Sonic com formato "XX - Nome da Música - Sonic the Hedgehog X - Compositor"
  if (title.includes(' - ') && (title.includes('Sonic the Hedgehog') || title.includes('Masato Nakamura'))) {
    const parts = title.split(' - ');
    if (parts.length >= 3) {
      // Formato: "01 - Title Theme - Sonic the Hedgehog - Masato Nakamura"
      title = parts[1]; // Pegar a segunda parte (nome da música)
    }
  }

  // Se o título é apenas o nome do compositor, tentar extrair do nome do arquivo
  if (title === 'Masato Nakamura' || title === 'Michael Jackson & Sega Sound Team' || title === 'Tomoya Ohtani') {
    const originalName = fileName.replace(/\.(mp3|wav)$/i, '');
    if (originalName.includes(' - ')) {
      const parts = originalName.split(' - ');
      if (parts.length >= 2) {
        title = parts[1]; // Pegar a segunda parte
      }
    }
  }

  // Se o título está vazio ou muito curto após limpeza, tentar extrair do nome do arquivo original
  if (!title || title.length < 2) {
    const originalName = fileName.replace(/\.(mp3|wav)$/i, '');
    if (originalName.includes(' - ')) {
      const parts = originalName.split(' - ');
      title = parts[parts.length - 1];
    } else {
      title = originalName;
    }
  }

  // Se o título ainda está vazio ou muito curto, tentar extrair de outra forma
  if (!title || title.length < 2) {
    let originalTitle = fileName.replace(/\.(mp3|wav)$/i, '');
    // Tentar extrair título após o último hífen
    if (originalTitle.includes(' - ')) {
      const parts = originalTitle.split(' - ');
      title = parts[parts.length - 1];
    } else {
      title = originalTitle;
    }
    // Remove números novamente
    title = title.replace(/^\d+[\s\-\.]*/, '');
  }

  // Mapear jogos e informações
  const gameInfo = getGameInfo(gameFolder, subFolder, pathParts);

  // Limpeza final do título
  title = title.trim();
  title = title.replace(/^[\-\s_]+/, ''); // Remove hífens, espaços e underscores do início
  title = title.replace(/[\-\s_]+$/, ''); // Remove hífens, espaços e underscores do final

  // Limpezas finais específicas
  title = title.replace(/^main theme of .*/i, ''); // Remove "main theme of xxx"
  title = title.replace(/^theme of .*/i, ''); // Remove "theme of xxx"
  title = title.replace(/^open your heart main theme of .*/i, 'Open Your Heart'); // Caso específico
  title = title.replace(/^it doesn t matter theme of .*/i, "It Doesn't Matter"); // Caso específico
  title = title.replace(/^my sweet passion theme of .*/i, 'My Sweet Passion'); // Caso específico
  title = title.replace(/^lazy days livin in paradaise theme of .*/i, 'Lazy Days Livin in Paradise'); // Caso específico
  title = title.replace(/^believe in myself theme of .*/i, 'Believe in Myself'); // Caso específico
  title = title.replace(/^unknown from me theme of .*/i, 'Unknown from M.E.'); // Caso específico

  // Se o título ainda está vazio após todas as limpezas, usar o nome do arquivo como fallback
  if (!title || title.trim().length === 0) {
    title = fileName.replace(/\.(mp3|wav)$/i, '').replace(/^\d+[\s\-\.]*/, '');
  }

  // Capitalizar corretamente o título (primeira letra de cada palavra em maiúscula)
  title = title.replace(/\b\w+/g, function(word) {
    // Palavras que devem permanecer em minúsculas (exceto se forem a primeira palavra)
    const lowercaseWords = ['and', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'a', 'an'];
    const isFirstWord = title.indexOf(word) === 0;

    if (!isFirstWord && lowercaseWords.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }

    // Casos especiais
    if (word.toLowerCase() === 'me') return 'M.E.';
    if (word.toLowerCase() === 'eggman') return 'Eggman';
    if (word.toLowerCase() === 'dr') return 'Dr.';

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return {
    id: id,
    title: title.trim(),
    artist: gameInfo.artist,
    composer: gameInfo.composer,
    game: gameInfo.game,
    context: `Audio - ${gameInfo.game}`,
    audioUrl: `/audio/${relativePath}`,
    year: gameInfo.year,
    genre: gameInfo.genre,
    console: gameInfo.console
  };
}

function getGameInfo(gameFolder, subFolder, pathParts) {
  // Detectar jogos específicos baseado na estrutura de pastas
  const fullPath = pathParts.join('/');

  // Zelda games específicos
  if (gameFolder === 'zelda') {
    if (subFolder === 'wind-waker') {
      return {
        artist: 'Koji Kondo',
        composer: 'Koji Kondo',
        game: 'The Legend of Zelda: The Wind Waker',
        year: 2002,
        genre: 'Adventure Game Soundtrack',
        console: 'GameCube'
      };
    }
    if (subFolder === 'ocarina-of-time') {
      return {
        artist: 'Koji Kondo',
        composer: 'Koji Kondo',
        game: 'The Legend of Zelda: Ocarina of Time',
        year: 1998,
        genre: 'Adventure Game Soundtrack',
        console: 'Nintendo 64'
      };
    }
    if (subFolder === 'breath-of-the-wild') {
      return {
        artist: 'Yasuaki Iwata',
        composer: 'Yasuaki Iwata',
        game: 'The Legend of Zelda: Breath of the Wild',
        year: 2017,
        genre: 'Adventure Game Soundtrack',
        console: 'Nintendo Switch'
      };
    }
    if (subFolder === 'twilight-princess') {
      return {
        artist: 'Toru Minegishi',
        composer: 'Toru Minegishi',
        game: 'The Legend of Zelda: Twilight Princess',
        year: 2006,
        genre: 'Adventure Game Soundtrack',
        console: 'GameCube/Wii'
      };
    }
    if (subFolder === 'skyward-sword') {
      return {
        artist: 'Hajime Wakai',
        composer: 'Hajime Wakai',
        game: 'The Legend of Zelda: Skyward Sword',
        year: 2011,
        genre: 'Adventure Game Soundtrack',
        console: 'Wii'
      };
    }
    if (subFolder === 'majora-mask') {
      return {
        artist: 'Koji Kondo',
        composer: 'Koji Kondo',
        game: "The Legend of Zelda: Majora's Mask",
        year: 2000,
        genre: 'Adventure Game Soundtrack',
        console: 'Nintendo 64'
      };
    }
  }

  // Mario games específicos
  if (gameFolder === 'mario') {
    if (subFolder === 'mario-kart-64') {
      return {
        artist: 'Koji Kondo',
        composer: 'Koji Kondo',
        game: 'Mario Kart 64',
        year: 1996,
        genre: 'Racing Game Soundtrack',
        console: 'Nintendo 64'
      };
    }
    if (subFolder === 'mario-kart-wii') {
      return {
        artist: 'Asuka Ohta',
        composer: 'Asuka Ohta',
        game: 'Mario Kart Wii',
        year: 2008,
        genre: 'Racing Game Soundtrack',
        console: 'Wii'
      };
    }
    if (subFolder === 'super-mario-64') {
      return {
        artist: 'Koji Kondo',
        composer: 'Koji Kondo',
        game: 'Super Mario 64',
        year: 1996,
        genre: 'Platform Game Soundtrack',
        console: 'Nintendo 64'
      };
    }
    if (subFolder === 'mario odyssey') {
      return {
        artist: 'Naoto Kubo',
        composer: 'Naoto Kubo',
        game: 'Super Mario Odyssey',
        year: 2017,
        genre: 'Platform Game Soundtrack',
        console: 'Nintendo Switch'
      };
    }
    if (subFolder === 'mario galaxy' || subFolder === 'mario galaxy 2') {
      return {
        artist: 'Mahito Yokota',
        composer: 'Mahito Yokota',
        game: subFolder === 'mario galaxy' ? 'Super Mario Galaxy' : 'Super Mario Galaxy 2',
        year: subFolder === 'mario galaxy' ? 2007 : 2010,
        genre: 'Platform Game Soundtrack',
        console: 'Wii'
      };
    }
    if (subFolder === 'mario-3d-world') {
      return {
        artist: 'Mahito Yokota',
        composer: 'Mahito Yokota',
        game: 'Super Mario 3D World',
        year: 2013,
        genre: 'Platform Game Soundtrack',
        console: 'Wii U'
      };
    }
    if (subFolder === 'mario sunshine' || subFolder === 'super-mario-sunshine') {
      return {
        artist: 'Koji Kondo',
        composer: 'Koji Kondo',
        game: 'Super Mario Sunshine',
        year: 2002,
        genre: 'Platform Game Soundtrack',
        console: 'GameCube'
      };
    }
    if (subFolder === 'mario world') {
      return {
        artist: 'Koji Kondo',
        composer: 'Koji Kondo',
        game: 'Super Mario World',
        year: 1990,
        genre: 'Platform Game Soundtrack',
        console: 'SNES'
      };
    }
    if (subFolder === 'mario-kart-ds') {
      return {
        artist: 'Asuka Ohta',
        composer: 'Asuka Ohta',
        game: 'Mario Kart DS',
        year: 2005,
        genre: 'Racing Game Soundtrack',
        console: 'Nintendo DS'
      };
    }
    if (subFolder === 'mario-paint') {
      return {
        artist: 'Hirokazu Tanaka',
        composer: 'Hirokazu Tanaka',
        game: 'Mario Paint',
        year: 1992,
        genre: 'Creative Game Soundtrack',
        console: 'SNES'
      };
    }
    if (subFolder === 'new-super-mario-bros-ds') {
      return {
        artist: 'Asuka Ohta',
        composer: 'Asuka Ohta',
        game: 'New Super Mario Bros.',
        year: 2006,
        genre: 'Platform Game Soundtrack',
        console: 'Nintendo DS'
      };
    }
    if (subFolder === 'new-super-mario-bros-wii') {
      return {
        artist: 'Ryo Nagamatsu',
        composer: 'Ryo Nagamatsu',
        game: 'New Super Mario Bros. Wii',
        year: 2009,
        genre: 'Platform Game Soundtrack',
        console: 'Wii'
      };
    }
    if (subFolder === 'paper-mario') {
      return {
        artist: 'Yuka Tsujiyoko',
        composer: 'Yuka Tsujiyoko',
        game: 'Paper Mario',
        year: 2000,
        genre: 'RPG Soundtrack',
        console: 'Nintendo 64'
      };
    }
  }

  // Sonic games específicos
  if (gameFolder === 'sonic') {
    if (subFolder === 'sonic-1') {
      return {
        artist: 'Masato Nakamura',
        composer: 'Masato Nakamura',
        game: 'Sonic the Hedgehog',
        year: 1991,
        genre: 'Platform Game Soundtrack',
        console: 'Sega Genesis'
      };
    }
    if (subFolder === 'sonic-2') {
      return {
        artist: 'Masato Nakamura',
        composer: 'Masato Nakamura',
        game: 'Sonic the Hedgehog 2',
        year: 1992,
        genre: 'Platform Game Soundtrack',
        console: 'Sega Genesis'
      };
    }
    if (subFolder === 'sonic-3') {
      return {
        artist: 'Michael Jackson & Sega Sound Team',
        composer: 'Michael Jackson & Sega Sound Team',
        game: 'Sonic the Hedgehog 3',
        year: 1994,
        genre: 'Platform Game Soundtrack',
        console: 'Sega Genesis'
      };
    }
    if (subFolder === 'sonic-frontiers') {
      return {
        artist: 'Tomoya Ohtani',
        composer: 'Tomoya Ohtani',
        game: 'Sonic Frontiers',
        year: 2022,
        genre: 'Platform Game Soundtrack',
        console: 'Multi-platform'
      };
    }

    // Para a pasta "Sonic outras", detectar o jogo específico baseado no nome do arquivo/pasta
    if (subFolder === 'Sonic outras') {
      const fileName = pathParts[pathParts.length - 1].toLowerCase();
      const fullPath = pathParts.join('/').toLowerCase();



      // Sonic Adventure (1998)
      if (fullPath.includes('sonic_adventure01') || fullPath.includes('sonic adventure') ||
          fileName.includes('open-your-heart') || fileName.includes('it-doesnt-matter') ||
          fileName.includes('my-sweet-passion') || fileName.includes('believe-in-myself') ||
          fileName.includes('unknown-from-me') || fileName.includes('lazy-days')) {
        return {
          artist: 'Jun Senoue',
          composer: 'Jun Senoue',
          game: 'Sonic Adventure',
          year: 1998,
          genre: 'Platform Game Soundtrack',
          console: 'Dreamcast'
        };
      }

      // Sonic Adventure 2 (2001)
      if (fullPath.includes('sonic_adventure02') || fullPath.includes('sonic adventure 2') ||
          fileName.includes('escape-from-the-city') || fileName.includes('live-and-learn') ||
          fileName.includes('throw-it-all-away') || fileName.includes('fly-in-the-freedom')) {
        return {
          artist: 'Jun Senoue',
          composer: 'Jun Senoue',
          game: 'Sonic Adventure 2',
          year: 2001,
          genre: 'Platform Game Soundtrack',
          console: 'Dreamcast'
        };
      }

      // Sonic Colors (2010)
      if (fullPath.includes('sonic-colors') || fileName.includes('reach-for-the-stars') ||
          fileName.includes('tropical-resort') || fileName.includes('starlight-carnival') ||
          fileName.includes('planet-wisp')) {
        return {
          artist: 'Tomoya Ohtani',
          composer: 'Tomoya Ohtani',
          game: 'Sonic Colors',
          year: 2010,
          genre: 'Platform Game Soundtrack',
          console: 'Nintendo Wii'
        };
      }

      // Sonic Generations (2011)
      if (fullPath.includes('sonic-generations') || fileName.includes('rightthererideon')) {
        return {
          artist: 'Tomoya Ohtani',
          composer: 'Tomoya Ohtani',
          game: 'Sonic Generations',
          year: 2011,
          genre: 'Platform Game Soundtrack',
          console: 'Multi-platform'
        };
      }

      // Sonic Unleashed (2008)
      if (fullPath.includes('sonic-unleashed') || fileName.includes('endless-possibilities') ||
          fileName.includes('apotos') || fileName.includes('windmill-isle') ||
          fileName.includes('spagonia') || fileName.includes('rooftop-run') ||
          fileName.includes('mazuri') || fileName.includes('chun-nan') ||
          fileName.includes('eggman-land')) {
        return {
          artist: 'Tomoya Ohtani',
          composer: 'Tomoya Ohtani',
          game: 'Sonic Unleashed',
          year: 2008,
          genre: 'Platform Game Soundtrack',
          console: 'Multi-platform'
        };
      }

      // Sonic Forces (2017)
      if (fileName.includes('fist-bump') || fileName.includes('sonic-forces')) {
        return {
          artist: 'Tomoya Ohtani',
          composer: 'Tomoya Ohtani',
          game: 'Sonic Forces',
          year: 2017,
          genre: 'Platform Game Soundtrack',
          console: 'Multi-platform'
        };
      }

      // Sonic Mania (2017)
      if (fileName.includes('studiopolis') || fileName.includes('press-garden') ||
          fileName.includes('lights-camera-action') || fileName.includes('tabloid-jargon')) {
        return {
          artist: 'Tee Lopes',
          composer: 'Tee Lopes',
          game: 'Sonic Mania',
          year: 2017,
          genre: 'Platform Game Soundtrack',
          console: 'Multi-platform'
        };
      }

      // Sonic and the Secret Rings (2007)
      if (fileName.includes('seven-rings-in-hand')) {
        return {
          artist: 'Steve Conte',
          composer: 'Steve Conte',
          game: 'Sonic and the Secret Rings',
          year: 2007,
          genre: 'Platform Game Soundtrack',
          console: 'Nintendo Wii'
        };
      }

      // Sonic and the Black Knight (2009)
      if (fileName.includes('knight-of-the-wind')) {
        return {
          artist: 'Crush 40',
          composer: 'Crush 40',
          game: 'Sonic and the Black Knight',
          year: 2009,
          genre: 'Platform Game Soundtrack',
          console: 'Nintendo Wii'
        };
      }

      // Sonic the Hedgehog (2006)
      if (fileName.includes('his-world') || fileName.includes('dreams-of-an-absolution') ||
          fileName.includes('crisis-city') || fileName.includes('sonic-the-hedgehog-2006')) {
        return {
          artist: 'Hideaki Kobayashi',
          composer: 'Hideaki Kobayashi',
          game: 'Sonic the Hedgehog (2006)',
          year: 2006,
          genre: 'Platform Game Soundtrack',
          console: 'Multi-platform'
        };
      }

      // Shadow the Hedgehog (2005)
      if (fileName.includes('all-hail-shadow') || fileName.includes('i-am') ||
          fileName.includes('shadow-the-hedgehog')) {
        return {
          artist: 'Jun Senoue',
          composer: 'Jun Senoue',
          game: 'Shadow the Hedgehog',
          year: 2005,
          genre: 'Platform Game Soundtrack',
          console: 'Multi-platform'
        };
      }

      // Sonic Riders: Zero Gravity (2008)
      if (fullPath.includes('sonic-riders-zero-gravity') || fileName.includes('un-gravitify')) {
        return {
          artist: 'Hideki Naganuma',
          composer: 'Hideki Naganuma',
          game: 'Sonic Riders: Zero Gravity',
          year: 2008,
          genre: 'Racing Game Soundtrack',
          console: 'Multi-platform'
        };
      }

      // Se chegou até aqui e não encontrou um jogo específico, usar fallback genérico do Sonic
      return {
        artist: 'Jun Senoue',
        composer: 'Jun Senoue',
        game: 'Sonic the Hedgehog',
        year: 1991,
        genre: 'Platform Game Soundtrack',
        console: 'Sega Genesis'
      };
    }
  }

  // Pokémon games específicos
  if (gameFolder === 'pokemon') {
    if (subFolder === 'ruby-sapphire') {
      return {
        artist: 'Go Ichinose',
        composer: 'Go Ichinose',
        game: 'Pokémon Ruby/Sapphire',
        year: 2002,
        genre: 'JRPG Soundtrack',
        console: 'Game Boy Advance'
      };
    }
    if (subFolder === 'pokemon-diamond-pearl') {
      return {
        artist: 'Go Ichinose',
        composer: 'Go Ichinose',
        game: 'Pokémon Diamond/Pearl',
        year: 2006,
        genre: 'JRPG Soundtrack',
        console: 'Nintendo DS'
      };
    }
  }

  // Crash games específicos
  if (gameFolder === 'crash') {
    if (subFolder === 'crash1') {
      return {
        artist: 'Josh Mancell',
        composer: 'Josh Mancell',
        game: 'Crash Bandicoot',
        year: 1996,
        genre: 'Platform Game Soundtrack',
        console: 'PlayStation'
      };
    }
    if (subFolder === 'crash-team-racing') {
      return {
        artist: 'Josh Mancell',
        composer: 'Josh Mancell',
        game: 'Crash Team Racing',
        year: 1999,
        genre: 'Racing Game Soundtrack',
        console: 'PlayStation'
      };
    }
  }

  // Detectar jogos específicos na pasta "outros" baseado no nome do arquivo
  if (gameFolder === 'outros') {
    const fileName = pathParts[pathParts.length - 1].toLowerCase();

    if (fileName.includes('elden ring')) {
      return {
        artist: 'Tsukasa Saitoh',
        composer: 'Tsukasa Saitoh',
        game: 'Elden Ring',
        year: 2022,
        genre: 'Action RPG Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('dark souls')) {
      return {
        artist: 'Motoi Sakuraba',
        composer: 'Motoi Sakuraba',
        game: 'Dark Souls III',
        year: 2016,
        genre: 'Action RPG Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('pokemon x') || fileName.includes('kalos') || fileName.includes('vaniville') || fileName.includes('aquacorde')) {
      return {
        artist: 'Shota Kageyama',
        composer: 'Shota Kageyama',
        game: 'Pokémon X/Y',
        year: 2013,
        genre: 'JRPG Soundtrack',
        console: 'Nintendo 3DS'
      };
    }

    if (fileName.includes('omori') || fileName.includes('title omori')) {
      return {
        artist: 'Pedro Silva',
        composer: 'Pedro Silva',
        game: 'OMORI',
        year: 2020,
        genre: 'Indie Game Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('night in the woods') || fileName.includes('possum springs') || fileName.includes('die anywhere else') || fileName.includes('weird autumn')) {
      return {
        artist: 'Alec Holowka',
        composer: 'Alec Holowka',
        game: 'Night in the Woods',
        year: 2017,
        genre: 'Indie Game Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('short hike') || fileName.includes('beach buds') || fileName.includes('somewhere in the woods') || fileName.includes('see you at the top')) {
      return {
        artist: 'Mark Sparling',
        composer: 'Mark Sparling',
        game: 'A Short Hike',
        year: 2019,
        genre: 'Indie Game Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('ace attorney') || fileName.includes('phoenix wright') || fileName.includes('objection') || fileName.includes('pursuit') || fileName.includes('truth revealed') || fileName.includes('maya fey') || fileName.includes('godot') || fileName.includes('fragrance of dark coffee')) {
      return {
        artist: 'Masakazu Sugimori',
        composer: 'Masakazu Sugimori',
        game: 'Phoenix Wright: Ace Attorney',
        year: 2001,
        genre: 'Visual Novel Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('okami') || fileName.includes('issun')) {
      return {
        artist: 'Hiroshi Yamaguchi',
        composer: 'Hiroshi Yamaguchi',
        game: 'Ōkami',
        year: 2006,
        genre: 'Adventure Game Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('doom') || fileName.includes("at doom's gate") || fileName.includes('only thing they fear')) {
      return {
        artist: 'Mick Gordon',
        composer: 'Mick Gordon',
        game: 'DOOM',
        year: 2016,
        genre: 'Metal',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('plants vs zombies') || fileName.includes('crazy dave') || fileName.includes('zombies on your lawn')) {
      return {
        artist: 'Laura Shigihara',
        composer: 'Laura Shigihara',
        game: 'Plants vs. Zombies',
        year: 2009,
        genre: 'Tower Defense Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('persona') || fileName.includes('mass destruction') || fileName.includes('last surprise')) {
      return {
        artist: 'Shoji Meguro',
        composer: 'Shoji Meguro',
        game: 'Persona',
        year: 2006,
        genre: 'JRPG Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('splatoon') || fileName.includes('splattack') || fileName.includes('ink or sink')) {
      return {
        artist: 'Toru Minegishi',
        composer: 'Toru Minegishi',
        game: 'Splatoon',
        year: 2015,
        genre: 'Shooter Game Soundtrack',
        console: 'Wii U'
      };
    }

    if (fileName.includes('fall guys') || fileName.includes('everybody falls')) {
      return {
        artist: 'Jukio Kallio',
        composer: 'Jukio Kallio',
        game: 'Fall Guys',
        year: 2020,
        genre: 'Party Game Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('majora') || fileName.includes('clock town') || fileName.includes('song of healing') || fileName.includes('astral observatory') || fileName.includes('deku palace') || fileName.includes('woodfall temple')) {
      return {
        artist: 'Koji Kondo',
        composer: 'Koji Kondo',
        game: "The Legend of Zelda: Majora's Mask",
        year: 2000,
        genre: 'Adventure Game Soundtrack',
        console: 'Nintendo 64'
      };
    }

    if (fileName.includes('gwyn') || fileName.includes('lord of cinder')) {
      return {
        artist: 'Motoi Sakuraba',
        composer: 'Motoi Sakuraba',
        game: 'Dark Souls',
        year: 2011,
        genre: 'Action RPG Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('ultrakill') || fileName.includes('cyber grind') || fileName.includes('ultrachurch') || fileName.includes('order') || fileName.includes('versus')) {
      return {
        artist: 'Heaven Pierce Her',
        composer: 'Heaven Pierce Her',
        game: 'ULTRAKILL',
        year: 2020,
        genre: 'FPS Soundtrack',
        console: 'PC'
      };
    }

    if (fileName.includes('umineko') || fileName.includes('goldenslaughterer') || fileName.includes('worldenddominator') || fileName.includes('miragecoordinator')) {
      return {
        artist: 'ZTS',
        composer: 'ZTS',
        game: 'Umineko When They Cry',
        year: 2007,
        genre: 'Visual Novel Soundtrack',
        console: 'PC'
      };
    }

    if (fileName.includes('clair obscur') || fileName.includes('clair-obscur')) {
      return {
        artist: 'Yasunori Mitsuda',
        composer: 'Yasunori Mitsuda',
        game: 'Clair Obscur: Expedition 33',
        year: 2025,
        genre: 'JRPG Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('metal gear') || fileName.includes('rules of nature') || fileName.includes('only thing i know')) {
      return {
        artist: 'Jamie Christopherson',
        composer: 'Jamie Christopherson',
        game: 'Metal Gear Rising: Revengeance',
        year: 2013,
        genre: 'Action Game Soundtrack',
        console: 'Multi-platform'
      };
    }

    // Casos específicos para arquivos com nomes genéricos
    if (fileName.includes('3-01. main theme')) {
      return {
        artist: 'Masakazu Sugimori',
        composer: 'Masakazu Sugimori',
        game: 'Phoenix Wright: Ace Attorney - Trials and Tribulations',
        year: 2004,
        genre: 'Visual Novel Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('down by the river')) {
      return {
        artist: 'Alec Holowka',
        composer: 'Alec Holowka',
        game: 'Night in the Woods',
        year: 2017,
        genre: 'Indie Game Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('hard fought')) {
      return {
        artist: 'Mick Gordon',
        composer: 'Mick Gordon',
        game: 'DOOM Eternal',
        year: 2020,
        genre: 'Metal',
        console: 'Multi-platform'
      };
    }

    // Hotline Miami específico
    if (fileName.includes('hotline miami') || fileName.includes('hydrogen') || fileName.includes('crystals')) {
      return {
        artist: 'M|O|O|N',
        composer: 'M|O|O|N',
        game: 'Hotline Miami',
        year: 2012,
        genre: 'Electronic',
        console: 'Multi-platform'
      };
    }

    // Grand Theft Auto específico
    if (fileName.includes('gta') || fileName.includes('grand theft auto')) {
      return {
        artist: 'Craig Conner',
        composer: 'Craig Conner',
        game: 'Grand Theft Auto',
        year: 1997,
        genre: 'Game Soundtrack',
        console: 'Multi-platform'
      };
    }

    if (fileName.includes('dread of the grave') || fileName.includes('more fear')) {
      return {
        artist: 'ZTS',
        composer: 'ZTS',
        game: 'Umineko When They Cry',
        year: 2007,
        genre: 'Visual Novel Soundtrack',
        console: 'PC'
      };
    }

    if (fileName.includes('the world hasn\'t ended yet')) {
      return {
        artist: 'ZTS',
        composer: 'ZTS',
        game: 'Umineko When They Cry',
        year: 2007,
        genre: 'Visual Novel Soundtrack',
        console: 'PC'
      };
    }

    if (fileName.includes('the fire is gone')) {
      return {
        artist: 'Heaven Pierce Her',
        composer: 'Heaven Pierce Her',
        game: 'ULTRAKILL',
        year: 2020,
        genre: 'FPS Soundtrack',
        console: 'PC'
      };
    }
  }

  const gameMap = {
    'a-short-hike': {
      artist: 'Mark Sparling',
      composer: 'Mark Sparling',
      game: 'A Short Hike',
      year: 2019,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'ace-attorney': {
      artist: 'Masakazu Sugimori',
      composer: 'Masakazu Sugimori',
      game: 'Phoenix Wright: Ace Attorney',
      year: 2001,
      genre: 'Visual Novel Soundtrack',
      console: 'Multi-platform'
    },
    'animal-crossing-new-horizons': {
      artist: 'Kazumi Totaka',
      composer: 'Kazumi Totaka',
      game: 'Animal Crossing: New Horizons',
      year: 2020,
      genre: 'Life Simulation Soundtrack',
      console: 'Nintendo Switch'
    },
    'baldurs-gate-3': {
      artist: 'Borislav Slavov',
      composer: 'Borislav Slavov',
      game: "Baldur's Gate 3",
      year: 2023,
      genre: 'RPG Soundtrack',
      console: 'Multi-platform'
    },
    'clair-obscur': {
      artist: 'Yasunori Mitsuda',
      composer: 'Yasunori Mitsuda',
      game: 'Clair Obscur: Expedition 33',
      year: 2025,
      genre: 'JRPG Soundtrack',
      console: 'Multi-platform'
    },
    'dark-souls': {
      artist: 'Motoi Sakuraba',
      composer: 'Motoi Sakuraba',
      game: 'Dark Souls',
      year: 2011,
      genre: 'Action RPG Soundtrack',
      console: 'Multi-platform'
    },
    'dark-souls-3': {
      artist: 'Motoi Sakuraba',
      composer: 'Motoi Sakuraba',
      game: 'Dark Souls III',
      year: 2016,
      genre: 'Action RPG Soundtrack',
      console: 'Multi-platform'
    },
    'doom': {
      artist: 'Mick Gordon',
      composer: 'Mick Gordon',
      game: 'DOOM',
      year: 2016,
      genre: 'Metal',
      console: 'Multi-platform'
    },
    'doom-eternal': {
      artist: 'Mick Gordon',
      composer: 'Mick Gordon',
      game: 'DOOM Eternal',
      year: 2020,
      genre: 'Metal',
      console: 'Multi-platform'
    },
    'elden-ring': {
      artist: 'Tsukasa Saitoh',
      composer: 'Tsukasa Saitoh',
      game: 'Elden Ring',
      year: 2022,
      genre: 'Action RPG Soundtrack',
      console: 'Multi-platform'
    },
    'enigma-do-medo': {
      artist: 'Guilherme Gama',
      composer: 'Guilherme Gama',
      game: 'Paranormal Order: Enigma do Medo',
      year: 2023,
      genre: 'Horror Game Soundtrack',
      console: 'PC'
    },
    'fall-guys': {
      artist: 'Jukio Kallio',
      composer: 'Jukio Kallio',
      game: 'Fall Guys',
      year: 2020,
      genre: 'Party Game Soundtrack',
      console: 'Multi-platform'
    },
    'metal-gear-rising': {
      artist: 'Jamie Christopherson',
      composer: 'Jamie Christopherson',
      game: 'Metal Gear Rising: Revengeance',
      year: 2013,
      genre: 'Action Game Soundtrack',
      console: 'Multi-platform'
    },
    'night-in-the-woods': {
      artist: 'Alec Holowka',
      composer: 'Alec Holowka',
      game: 'Night in the Woods',
      year: 2017,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'okami': {
      artist: 'Hiroshi Yamaguchi',
      composer: 'Hiroshi Yamaguchi',
      game: 'Ōkami',
      year: 2006,
      genre: 'Adventure Game Soundtrack',
      console: 'Multi-platform'
    },
    'persona': {
      artist: 'Shoji Meguro',
      composer: 'Shoji Meguro',
      game: 'Persona',
      year: 2006,
      genre: 'JRPG Soundtrack',
      console: 'Multi-platform'
    },
    'plants-vs-zombies': {
      artist: 'Laura Shigihara',
      composer: 'Laura Shigihara',
      game: 'Plants vs. Zombies',
      year: 2009,
      genre: 'Tower Defense Soundtrack',
      console: 'Multi-platform'
    },
    'pokemon-x-y': {
      artist: 'Shota Kageyama',
      composer: 'Shota Kageyama',
      game: 'Pokémon X/Y',
      year: 2013,
      genre: 'JRPG Soundtrack',
      console: 'Nintendo 3DS'
    },
    'splatoon': {
      artist: 'Toru Minegishi',
      composer: 'Toru Minegishi',
      game: 'Splatoon',
      year: 2015,
      genre: 'Shooter Game Soundtrack',
      console: 'Wii U'
    },
    'ultrakill': {
      artist: 'Heaven Pierce Her',
      composer: 'Heaven Pierce Her',
      game: 'ULTRAKILL',
      year: 2020,
      genre: 'FPS Soundtrack',
      console: 'PC'
    },
    'umineko': {
      artist: 'ZTS',
      composer: 'ZTS',
      game: 'Umineko When They Cry',
      year: 2007,
      genre: 'Visual Novel Soundtrack',
      console: 'PC'
    },
    'until-then': {
      artist: 'Nico Nico',
      composer: 'Nico Nico',
      game: 'Until Then',
      year: 2024,
      genre: 'Visual Novel Soundtrack',
      console: 'Multi-platform'
    },
    'control': {
      artist: 'Petri Alanko',
      composer: 'Petri Alanko',
      game: 'Control',
      year: 2019,
      genre: 'Action Game Soundtrack',
      console: 'Multi-platform'
    },
    'dark-souls-symphony': {
      artist: 'Motoi Sakuraba',
      composer: 'Motoi Sakuraba',
      game: 'Dark Souls Symphony',
      year: 2016,
      genre: 'Orchestral Game Music',
      console: 'Multi-platform'
    },
    'grand-theft-auto': {
      artist: 'Craig Conner',
      composer: 'Craig Conner',
      game: 'Grand Theft Auto',
      year: 1997,
      genre: 'Action Game Soundtrack',
      console: 'Multi-platform'
    },
    'half-life': {
      artist: 'Kelly Bailey',
      composer: 'Kelly Bailey',
      game: 'Half-Life',
      year: 1998,
      genre: 'FPS Soundtrack',
      console: 'PC'
    },
    'hotline-miami': {
      artist: 'Various Artists',
      composer: 'Various Artists',
      game: 'Hotline Miami',
      year: 2012,
      genre: 'Electronic',
      console: 'Multi-platform'
    },
    'jet-set-radio': {
      artist: 'Hideki Naganuma',
      composer: 'Hideki Naganuma',
      game: 'Jet Set Radio',
      year: 2000,
      genre: 'Electronic',
      console: 'Dreamcast'
    },
    'klonoa1': {
      artist: 'Kanako Kakino',
      composer: 'Kanako Kakino',
      game: 'Klonoa: Door to Phantomile',
      year: 1997,
      genre: 'Platform Game Soundtrack',
      console: 'PlayStation'
    },
    'zelda-majoras-mask': {
      artist: 'Koji Kondo',
      composer: 'Koji Kondo',
      game: "The Legend of Zelda: Majora's Mask",
      year: 2000,
      genre: 'Adventure Game Soundtrack',
      console: 'Nintendo 64'
    },
    'Celeste': {
      artist: 'Lena Raine',
      composer: 'Lena Raine',
      game: 'Celeste',
      year: 2018,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'alan-wake-2': {
      artist: 'Petri Alanko',
      composer: 'Petri Alanko',
      game: 'Alan Wake 2',
      year: 2023,
      genre: 'Horror Game Soundtrack',
      console: 'Multi-platform'
    },
    'assasins-creed2': {
      artist: 'Jesper Kyd',
      composer: 'Jesper Kyd',
      game: "Assassin's Creed II",
      year: 2009,
      genre: 'Game Soundtrack',
      console: 'Multi-platform'
    },
    'banjo-kazooie': {
      artist: 'Grant Kirkhope',
      composer: 'Grant Kirkhope',
      game: 'Banjo-Kazooie',
      year: 1998,
      genre: 'Game Soundtrack',
      console: 'Nintendo 64'
    },
    'bioshock': {
      artist: 'Garry Schyman',
      composer: 'Garry Schyman',
      game: 'BioShock',
      year: 2007,
      genre: 'Game Soundtrack',
      console: 'Multi-platform'
    },
    'cave-story': {
      artist: 'Daisuke Amaya',
      composer: 'Daisuke Amaya',
      game: 'Cave Story',
      year: 2004,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'crash': {
      artist: 'Josh Mancell',
      composer: 'Josh Mancell',
      game: 'Crash Bandicoot',
      year: 1996,
      genre: 'Game Soundtrack',
      console: 'PlayStation'
    },
    'cult-of-the-lamb': {
      artist: 'River Boy',
      composer: 'River Boy',
      game: 'Cult of the Lamb',
      year: 2022,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'cuphead': {
      artist: 'Kristofer Maddigan',
      composer: 'Kristofer Maddigan',
      game: 'Cuphead',
      year: 2017,
      genre: 'Jazz',
      console: 'Multi-platform'
    },
    'cyberpunk': {
      artist: 'Marcin Przybyłowicz',
      composer: 'Marcin Przybyłowicz',
      game: 'Cyberpunk 2077',
      year: 2020,
      genre: 'Game Soundtrack',
      console: 'Multi-platform'
    },
    'dead-cells': {
      artist: 'Yoann Laulan',
      composer: 'Yoann Laulan',
      game: 'Dead Cells',
      year: 2018,
      genre: 'Game Soundtrack',
      console: 'Multi-platform'
    },
    'deltarune': {
      artist: 'Toby Fox',
      composer: 'Toby Fox',
      game: 'Deltarune',
      year: 2018,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'diablo': {
      artist: 'Matt Uelmen',
      composer: 'Matt Uelmen',
      game: 'Diablo',
      year: 1996,
      genre: 'Game Soundtrack',
      console: 'Multi-platform'
    },
    'donkey-kong': {
      artist: 'David Wise',
      composer: 'David Wise',
      game: 'Donkey Kong Country',
      year: 1994,
      genre: 'Game Soundtrack',
      console: 'SNES'
    },
    'dont-starve': {
      artist: 'Jason Garner',
      composer: 'Jason Garner',
      game: "Don't Starve",
      year: 2013,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'f-zero': {
      artist: 'Yumiko Kanki & Naoto Ishida',
      composer: 'Yumiko Kanki & Naoto Ishida',
      game: 'F-Zero',
      year: 1990,
      genre: 'Game Soundtrack',
      console: 'SNES'
    },
    'fez': {
      artist: 'Disasterpeace',
      composer: 'Disasterpeace',
      game: 'FEZ',
      year: 2012,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'finding-paradise': {
      artist: 'Kan Gao',
      composer: 'Kan Gao',
      game: 'Finding Paradise',
      year: 2017,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'final-fantasy-vii': {
      artist: 'Nobuo Uematsu',
      composer: 'Nobuo Uematsu',
      game: 'Final Fantasy VII',
      year: 1997,
      genre: 'JRPG Soundtrack',
      console: 'PlayStation'
    },
    'fuga': {
      artist: 'Tomoki Miyoshi',
      composer: 'Tomoki Miyoshi',
      game: 'Fuga: Melodies of Steel',
      year: 2021,
      genre: 'JRPG Soundtrack',
      console: 'Multi-platform'
    },
    'geometry-dash': {
      artist: 'ForeverBound',
      composer: 'ForeverBound',
      game: 'Geometry Dash',
      year: 2013,
      genre: 'Electronic',
      console: 'Multi-platform'
    },
    'goldeneye': {
      artist: 'Grant Kirkhope',
      composer: 'Grant Kirkhope',
      game: 'GoldenEye 007',
      year: 1997,
      genre: 'Game Soundtrack',
      console: 'Nintendo 64'
    },
    'grand-theft-auto': {
      artist: 'Craig Conner',
      composer: 'Craig Conner',
      game: 'Grand Theft Auto',
      year: 1997,
      genre: 'Game Soundtrack',
      console: 'Multi-platform'
    },
    'hades': {
      artist: 'Darren Korb',
      composer: 'Darren Korb',
      game: 'Hades',
      year: 2020,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'hollow knight': {
      artist: 'Christopher Larkin',
      composer: 'Christopher Larkin',
      game: 'Hollow Knight',
      year: 2017,
      genre: 'Orchestral',
      console: 'Multi-platform'
    },
    'hotline-miami': {
      artist: 'M|O|O|N',
      composer: 'M|O|O|N',
      game: 'Hotline Miami',
      year: 2012,
      genre: 'Electronic',
      console: 'Multi-platform'
    },
    'katana-zero': {
      artist: 'LudoWic',
      composer: 'LudoWic',
      game: 'Katana ZERO',
      year: 2019,
      genre: 'Electronic',
      console: 'Multi-platform'
    },
    'kirby': {
      artist: 'Jun Ishikawa',
      composer: 'Jun Ishikawa',
      game: 'Kirby',
      year: 1992,
      genre: 'Platform Game Soundtrack',
      console: 'Multi-platform'
    },
    'laika-aged-through-blood': {
      artist: 'Beicoli',
      composer: 'Beicoli',
      game: 'Laika: Aged Through Blood',
      year: 2023,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'mario': {
      artist: 'Koji Kondo',
      composer: 'Koji Kondo',
      game: 'Super Mario',
      year: 1985,
      genre: 'Game Soundtrack',
      console: 'Nintendo'
    },
    'mega-man': {
      artist: 'Setsuo Yamamoto',
      composer: 'Setsuo Yamamoto',
      game: 'Mega Man X',
      year: 1993,
      genre: 'Game Soundtrack',
      console: 'SNES'
    },
    'metal-gear': {
      artist: 'Harry Gregson-Williams',
      composer: 'Harry Gregson-Williams',
      game: 'Metal Gear Solid',
      year: 1998,
      genre: 'Game Soundtrack',
      console: 'PlayStation'
    },
    'metroid': {
      artist: 'Hirokazu Tanaka',
      composer: 'Hirokazu Tanaka',
      game: 'Metroid',
      year: 1986,
      genre: 'Game Soundtrack',
      console: 'Nintendo'
    },
    'minecraft': {
      artist: 'C418',
      composer: 'C418',
      game: 'Minecraft',
      year: 2011,
      genre: 'Ambient',
      console: 'Multi-platform'
    },
    'nine-sols': {
      artist: 'Vivi Weng',
      composer: 'Vivi Weng',
      game: 'Nine Sols',
      year: 2024,
      genre: 'Game Soundtrack',
      console: 'Multi-platform'
    },
    'omori': {
      artist: 'Pedro Silva',
      composer: 'Pedro Silva',
      game: 'OMORI',
      year: 2020,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'one-shot': {
      artist: 'Nightmargin',
      composer: 'Nightmargin',
      game: 'OneShot',
      year: 2016,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'ori': {
      artist: 'Gareth Coker',
      composer: 'Gareth Coker',
      game: 'Ori and the Blind Forest',
      year: 2015,
      genre: 'Orchestral',
      console: 'Multi-platform'
    },
    'outer wilds': {
      artist: 'Andrew Prahlow',
      composer: 'Andrew Prahlow',
      game: 'Outer Wilds',
      year: 2019,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'outros': {
      artist: 'Unknown Artist',
      composer: 'Unknown Composer',
      game: 'Various Games',
      year: 2000,
      genre: 'Game Soundtrack',
      console: 'Multi-platform'
    },
    'pokemon': {
      artist: 'Junichi Masuda',
      composer: 'Junichi Masuda',
      game: 'Pokémon',
      year: 1996,
      genre: 'Game Soundtrack',
      console: 'Nintendo'
    },
    'rayman': {
      artist: 'Rémi Gazel',
      composer: 'Rémi Gazel',
      game: 'Rayman',
      year: 1995,
      genre: 'Game Soundtrack',
      console: 'Multi-platform'
    },
    'rayman-legends': {
      artist: 'Christophe Héral',
      composer: 'Christophe Héral',
      game: 'Rayman Legends',
      year: 2013,
      genre: 'Game Soundtrack',
      console: 'Multi-platform'
    },
    'rayman-origins': {
      artist: 'Christophe Héral',
      composer: 'Christophe Héral',
      game: 'Rayman Origins',
      year: 2011,
      genre: 'Game Soundtrack',
      console: 'Multi-platform'
    },
    'red-dead-redemption': {
      artist: 'Bill Elm & Woody Jackson',
      composer: 'Bill Elm & Woody Jackson',
      game: 'Red Dead Redemption',
      year: 2010,
      genre: 'Western Soundtrack',
      console: 'Multi-platform'
    },
    'resident-evil': {
      artist: 'Masami Ueda',
      composer: 'Masami Ueda',
      game: 'Resident Evil',
      year: 1996,
      genre: 'Horror Soundtrack',
      console: 'PlayStation'
    },
    'risk-of-rain': {
      artist: 'Chris Christodoulou',
      composer: 'Chris Christodoulou',
      game: 'Risk of Rain',
      year: 2013,
      genre: 'Electronic',
      console: 'Multi-platform'
    },
    'scooby-doo-and-the-cyber-chase': {
      artist: 'David Whittaker',
      composer: 'David Whittaker',
      game: 'Scooby-Doo and the Cyber Chase',
      year: 2001,
      genre: 'Game Soundtrack',
      console: 'PlayStation'
    },
    'sea-of-stars': {
      artist: 'Yasunori Mitsuda',
      composer: 'Yasunori Mitsuda',
      game: 'Sea of Stars',
      year: 2023,
      genre: 'JRPG Soundtrack',
      console: 'Multi-platform'
    },
    'silent-hill2': {
      artist: 'Akira Yamaoka',
      composer: 'Akira Yamaoka',
      game: 'Silent Hill 2',
      year: 2001,
      genre: 'Horror Soundtrack',
      console: 'PlayStation 2'
    },
    'skyrim': {
      artist: 'Jeremy Soule',
      composer: 'Jeremy Soule',
      game: 'The Elder Scrolls V: Skyrim',
      year: 2011,
      genre: 'Orchestral',
      console: 'Multi-platform'
    },
    'smash-bros': {
      artist: 'Hirokazu Ando',
      composer: 'Hirokazu Ando',
      game: 'Super Smash Bros.',
      year: 1999,
      genre: 'Game Soundtrack',
      console: 'Nintendo'
    },
    'sonic': {
      artist: 'Masato Nakamura',
      composer: 'Masato Nakamura',
      game: 'Sonic the Hedgehog',
      year: 1991,
      genre: 'Game Soundtrack',
      console: 'Sega Genesis'
    },
    'spirit-of-the-north': {
      artist: 'Nym',
      composer: 'Nym',
      game: 'Spirit of the North',
      year: 2019,
      genre: 'Ambient',
      console: 'Multi-platform'
    },
    'star-fox': {
      artist: 'Hajime Hirasawa',
      composer: 'Hajime Hirasawa',
      game: 'Star Fox',
      year: 1993,
      genre: 'Game Soundtrack',
      console: 'SNES'
    },
    'stardew valley': {
      artist: 'ConcernedApe',
      composer: 'ConcernedApe',
      game: 'Stardew Valley',
      year: 2016,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'street-fighter': {
      artist: 'Yoko Shimomura',
      composer: 'Yoko Shimomura',
      game: 'Street Fighter',
      year: 1987,
      genre: 'Fighting Game Soundtrack',
      console: 'Arcade'
    },
    'streets-of-rage': {
      artist: 'Yuzo Koshiro',
      composer: 'Yuzo Koshiro',
      game: 'Streets of Rage',
      year: 1991,
      genre: 'Electronic',
      console: 'Sega Genesis'
    },
    'subnautica': {
      artist: 'Simon Chylinski',
      composer: 'Simon Chylinski',
      game: 'Subnautica',
      year: 2018,
      genre: 'Ambient',
      console: 'Multi-platform'
    },
    'terraria': {
      artist: 'Scott Lloyd Shelly',
      composer: 'Scott Lloyd Shelly',
      game: 'Terraria',
      year: 2011,
      genre: 'Game Soundtrack',
      console: 'Multi-platform'
    },
    'tetris': {
      artist: 'Hirokazu Tanaka',
      composer: 'Hirokazu Tanaka',
      game: 'Tetris',
      year: 1984,
      genre: 'Puzzle Game Soundtrack',
      console: 'Multi-platform'
    },
    'the-last-of-us': {
      artist: 'Gustavo Santaolalla',
      composer: 'Gustavo Santaolalla',
      game: 'The Last of Us',
      year: 2013,
      genre: 'Post-Apocalyptic Soundtrack',
      console: 'PlayStation'
    },
    'the-sims': {
      artist: 'Jerry Martin',
      composer: 'Jerry Martin',
      game: 'The Sims',
      year: 2000,
      genre: 'Simulation Game Soundtrack',
      console: 'Multi-platform'
    },
    'to-the-moon': {
      artist: 'Kan Gao',
      composer: 'Kan Gao',
      game: 'To the Moon',
      year: 2011,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'top-gear': {
      artist: 'Barry Leitch',
      composer: 'Barry Leitch',
      game: 'Top Gear',
      year: 1992,
      genre: 'Racing Game Soundtrack',
      console: 'SNES'
    },
    'undertale': {
      artist: 'Toby Fox',
      composer: 'Toby Fox',
      game: 'Undertale',
      year: 2015,
      genre: 'Indie Game Soundtrack',
      console: 'Multi-platform'
    },
    'wii': {
      artist: 'Kazumi Totaka',
      composer: 'Kazumi Totaka',
      game: 'Wii System Music',
      year: 2006,
      genre: 'System Music',
      console: 'Wii'
    },
    'zelda': {
      artist: 'Koji Kondo',
      composer: 'Koji Kondo',
      game: 'The Legend of Zelda',
      year: 1986,
      genre: 'Adventure Game Soundtrack',
      console: 'NES'
    }
  };

  return gameMap[gameFolder] || {
    artist: 'Unknown Artist',
    composer: 'Unknown Composer',
    game: gameFolder,
    year: 2000,
    genre: 'Game Soundtrack',
    console: 'Multi-platform'
  };
}

// Função para escanear recursivamente a pasta de áudio
function scanAudioFolder(folderPath, basePath = '') {
  const files = [];
  const items = fs.readdirSync(folderPath);

  for (const item of items) {
    const fullPath = path.join(folderPath, item);
    const relativePath = path.join(basePath, item);

    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...scanAudioFolder(fullPath, relativePath));
    } else if (item.match(/\.(mp3|wav)$/i)) {
      files.push(relativePath);
    }
  }

  return files;
}

// Gerar o arquivo music.json
function generateMusicJson() {
  const audioPath = path.join(__dirname, '..', 'public', 'audio');
  const audioFiles = scanAudioFolder(audioPath);

  const musicData = audioFiles.map((filePath, index) => {
    return extractMusicInfo(filePath, index);
  });

  const jsonContent = JSON.stringify(musicData, null, 2);
  const outputPath = path.join(__dirname, '..', 'data', 'music.json');

  fs.writeFileSync(outputPath, jsonContent, 'utf8');
  // Generated music.json with tracks
}

// Função para verificar arquivos com nomes incorretos
function checkMissingFiles() {
  const fs = require('fs');
  const path = require('path');

  // Ler o arquivo music.json atual
  const musicJsonPath = path.join(__dirname, '..', 'data', 'music.json');
  const musicData = JSON.parse(fs.readFileSync(musicJsonPath, 'utf8'));

  // Verificando arquivos com nomes incorretos

  let missingCount = 0;
  let foundCount = 0;

  musicData.forEach((song, index) => {
    const audioPath = path.join(__dirname, '..', 'public', song.audioUrl);

    if (!fs.existsSync(audioPath)) {
      missingCount++;
    } else {
      foundCount++;
    }
  });

  // Resumo da verificação de arquivos
}

// Executar verificação se o argumento --check for passado
if (process.argv.includes('--check')) {
  checkMissingFiles();
} else {
  // Executar o script normal
  generateMusicJson();
}
