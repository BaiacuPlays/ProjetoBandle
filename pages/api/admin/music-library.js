import fs from 'fs';
import path from 'path';

// Fallback para desenvolvimento local
let localMusicLibrary = [];

// Função para ler music.json
const readMusicJson = () => {
  try {
    const musicJsonPath = path.join(process.cwd(), 'public/data/music.json');
    const musicData = JSON.parse(fs.readFileSync(musicJsonPath, 'utf8'));
    return musicData.songs || [];
  } catch (error) {
    console.warn('Erro ao ler music.json:', error);
    return [];
  }
};

// Função para escrever music.json
const writeMusicJson = (songs) => {
  try {
    const musicJsonPath = path.join(process.cwd(), 'public/data/music.json');
    const musicData = { songs };
    fs.writeFileSync(musicJsonPath, JSON.stringify(musicData, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erro ao escrever music.json:', error);
    return false;
  }
};

// Função para obter próximo ID
const getNextId = (songs) => {
  if (songs.length === 0) return 0;
  return Math.max(...songs.map(song => song.id || 0)) + 1;
};

// Tentar importar KV, mas usar fallback se não estiver disponível
let kv = null;
try {
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
} catch (error) {
  console.log('⚠️ Vercel KV não disponível, usando armazenamento local');
}

// Funções de armazenamento com fallback e sincronização
const getMusicLibrary = async () => {
  // Primeiro, tentar ler do music.json (fonte principal)
  const musicJsonSongs = readMusicJson();

  if (kv) {
    try {
      // Buscar músicas customizadas do KV
      const customMusic = await kv.get('admin:custom_music') || [];

      // Combinar músicas do JSON com customizadas
      const allMusic = [
        ...musicJsonSongs.map(song => ({
          ...song,
          source: 'json',
          active: true // Músicas do JSON são sempre ativas
        })),
        ...customMusic.map(song => ({
          ...song,
          source: 'custom'
        }))
      ];

      return allMusic;
    } catch (error) {
      console.warn('Erro ao acessar KV, usando apenas music.json:', error);
      return musicJsonSongs.map(song => ({
        ...song,
        source: 'json',
        active: true
      }));
    }
  }

  // Fallback: apenas music.json
  return musicJsonSongs.map(song => ({
    ...song,
    source: 'json',
    active: true
  }));
};

const setMusicLibrary = async (music) => {
  // Separar músicas por fonte
  const jsonMusic = music.filter(song => song.source === 'json');
  const customMusic = music.filter(song => song.source === 'custom');

  // Atualizar music.json apenas com músicas do JSON
  if (jsonMusic.length > 0) {
    const jsonSongs = jsonMusic.map(song => {
      const { source, stats, ...jsonSong } = song;
      return jsonSong;
    });
    writeMusicJson(jsonSongs);
  }

  // Salvar músicas customizadas no KV
  if (kv) {
    try {
      await kv.set('admin:custom_music', customMusic);
    } catch (error) {
      console.warn('Erro ao salvar músicas customizadas no KV:', error);
      localMusicLibrary = customMusic;
    }
  } else {
    localMusicLibrary = customMusic;
  }
};

// Função para sanitizar entrada
function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

export default async function handler(req, res) {
  const { method } = req;
  const adminKey = req.headers['x-admin-key'];

  try {
    if (method === 'GET') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      const musicLibrary = await getMusicLibrary();

      return res.status(200).json({
        success: true,
        music: musicLibrary
      });

    } else if (method === 'POST') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      const {
        title,
        artist,
        game,
        year,
        genre,
        console: gameConsole,
        audioUrl,
        active = true,
        difficulty = 'medium',
        seasonal = false,
        seasonalType = ''
      } = req.body;

      // Validações
      if (!title || !artist || !game) {
        return res.status(400).json({
          error: 'Título, artista e jogo são obrigatórios'
        });
      }

      if (!audioUrl) {
        return res.status(400).json({
          error: 'URL do áudio é obrigatória'
        });
      }

      // Buscar biblioteca atual para obter próximo ID
      const currentLibrary = await getMusicLibrary();
      const allSongs = readMusicJson();
      const nextId = getNextId(allSongs);

      // Criar nova música no formato do music.json
      const newMusic = {
        id: nextId,
        title: sanitizeInput(title, 200),
        artist: sanitizeInput(artist, 100),
        composer: sanitizeInput(artist, 100), // Usar artista como compositor por padrão
        game: sanitizeInput(game, 100),
        context: `Audio - ${sanitizeInput(game, 100)}`,
        audioUrl: sanitizeInput(audioUrl, 500),
        year: parseInt(year) || new Date().getFullYear(),
        genre: sanitizeInput(genre, 50),
        console: sanitizeInput(gameConsole, 50),
        // Campos adicionais para o painel admin
        source: 'json', // Indica que vai para o music.json
        active: Boolean(active),
        difficulty: sanitizeInput(difficulty, 20),
        seasonal: Boolean(seasonal),
        seasonalType: sanitizeInput(seasonalType, 50),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          timesPlayed: 0,
          timesCorrect: 0,
          averageAttempts: 0,
          difficulty: 0.5 // 0 = fácil, 1 = difícil
        }
      };

      // Buscar biblioteca existente
      const musicLibrary = await getMusicLibrary();

      // Adicionar nova música
      musicLibrary.push(newMusic);

      // Salvar
      await setMusicLibrary(musicLibrary);

      return res.status(201).json({
        success: true,
        music: newMusic,
        message: 'Música adicionada com sucesso'
      });

    } else if (method === 'PUT') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      const { id } = req.query;
      const {
        title,
        artist,
        game,
        year,
        genre,
        console: gameConsole,
        audioUrl,
        active,
        difficulty,
        seasonal,
        seasonalType
      } = req.body;

      if (!id) {
        return res.status(400).json({
          error: 'ID da música é obrigatório'
        });
      }

      // Buscar biblioteca existente
      const musicLibrary = await getMusicLibrary();

      // Encontrar música
      const musicIndex = musicLibrary.findIndex(m => m.id === id);
      if (musicIndex === -1) {
        return res.status(404).json({
          error: 'Música não encontrada'
        });
      }

      // Atualizar música
      const updatedMusic = {
        ...musicLibrary[musicIndex],
        ...(title && { title: sanitizeInput(title, 200) }),
        ...(artist && { artist: sanitizeInput(artist, 100) }),
        ...(game && { game: sanitizeInput(game, 100) }),
        ...(year && { year: parseInt(year) }),
        ...(genre && { genre: sanitizeInput(genre, 50) }),
        ...(gameConsole && { console: sanitizeInput(gameConsole, 50) }),
        ...(audioUrl && { audioUrl: sanitizeInput(audioUrl, 500) }),
        ...(active !== undefined && { active: Boolean(active) }),
        ...(difficulty && { difficulty: sanitizeInput(difficulty, 20) }),
        ...(seasonal !== undefined && { seasonal: Boolean(seasonal) }),
        ...(seasonalType && { seasonalType: sanitizeInput(seasonalType, 50) }),
        updatedAt: new Date().toISOString()
      };

      musicLibrary[musicIndex] = updatedMusic;

      // Salvar
      await setMusicLibrary(musicLibrary);

      return res.status(200).json({
        success: true,
        music: updatedMusic,
        message: 'Música atualizada com sucesso'
      });

    } else if (method === 'DELETE') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          error: 'ID da música é obrigatório'
        });
      }

      // Buscar biblioteca existente
      const musicLibrary = await getMusicLibrary();

      // Filtrar música a ser deletada
      const filteredMusic = musicLibrary.filter(m => m.id !== id);

      if (filteredMusic.length === musicLibrary.length) {
        return res.status(404).json({
          error: 'Música não encontrada'
        });
      }

      // Salvar
      await setMusicLibrary(filteredMusic);

      return res.status(200).json({
        success: true,
        message: 'Música deletada com sucesso'
      });

    } else {
      return res.status(405).json({
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('Erro na API de biblioteca de músicas:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
