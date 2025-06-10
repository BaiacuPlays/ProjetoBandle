// API para gerenciar música do dia - Admin
import fs from 'fs';
import path from 'path';

// Importação segura do KV
let kv = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
  }
} catch (error) {
  console.warn('⚠️ KV não disponível:', error.message);
}

// Função para gerar um número determinístico baseado no dia
const getDeterministicRandom = (day, seed = 0) => {
  const x = Math.sin(day * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Função para selecionar música determinística baseada no dia
const getDeterministicSongSimple = (day, songs) => {
  if (!songs || songs.length === 0) {
    return null;
  }

  const deterministicRandom = getDeterministicRandom(day, 0);
  const index = Math.floor(deterministicRandom * songs.length);
  return songs[index];
};

export default async function handler(req, res) {
  // Verificar autenticação admin
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'admin123') {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  if (req.method === 'GET') {
    try {
      // Usar a mesma lógica do jogo principal para calcular o dia
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

      console.log(`🎵 [ADMIN] Calculando música para o dia ${dayOfYear}`);

      // Verificar se há override definido
      let customSong = null;
      if (kv) {
        try {
          customSong = await kv.get(`daily-song-override:${dayOfYear}`);
          if (customSong) {
            console.log(`🎵 [ADMIN] Override encontrado para o dia ${dayOfYear}:`, customSong.title);
          }
        } catch (err) {
          console.warn('Erro ao buscar override:', err);
        }
      }

      let currentSong;
      if (customSong) {
        currentSong = customSong;
      } else {
        // Verificar override especial para 28/05/2025
        if (
          now.getFullYear() === 2025 &&
          now.getMonth() === 4 && // Maio é mês 4 (zero-based)
          now.getDate() === 28
        ) {
          try {
            const musicPath = path.join(process.cwd(), 'data', 'music.json');
            const musicFile = fs.readFileSync(musicPath, 'utf8');
            const musicData = JSON.parse(musicFile);
            currentSong = musicData.songs.find(s => s.title === 'Crowdfunding Single');
            console.log(`🎵 [ADMIN] Override especial 28/05/2025: Crowdfunding Single`);
          } catch (err) {
            console.error('Erro ao carregar música especial:', err);
          }
        }

        if (!currentSong) {
          // Carregar lista de músicas e usar sistema determinístico
          try {
            const musicPath = path.join(process.cwd(), 'data', 'music.json');
            const musicFile = fs.readFileSync(musicPath, 'utf8');
            const musicData = JSON.parse(musicFile);
            currentSong = getDeterministicSongSimple(dayOfYear, musicData.songs);
            console.log(`🎵 [ADMIN] Música determinística para o dia ${dayOfYear}:`, currentSong?.title);
          } catch (err) {
            console.error('Erro ao carregar músicas:', err);
            // Fallback para música demo
            currentSong = {
              title: 'Sweden',
              artist: 'C418',
              game: 'Minecraft'
            };
          }
        }
      }

      return res.status(200).json({
        success: true,
        song: currentSong,
        dayOfYear,
        isOverride: !!customSong,
        debug: {
          date: now.toISOString(),
          dayOfYear,
          hasOverride: !!customSong
        }
      });
    } catch (error) {
      console.error('Erro ao buscar música do dia:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { songId, songData } = req.body;

      if (!songId && !songData) {
        return res.status(400).json({ error: 'songId ou songData é obrigatório' });
      }

      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

      let songToSet;
      if (songData) {
        songToSet = songData;
      } else {
        // Buscar música por ID (implementar busca na base de dados de músicas)
        const musicResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/data/music.json`);
        const musicData = await musicResponse.json();
        songToSet = musicData.songs.find(s => s.id === songId || s.title === songId);

        if (!songToSet) {
          return res.status(404).json({ error: 'Música não encontrada' });
        }
      }

      // Salvar override da música do dia
      if (kv) {
        await kv.set(`daily-song-override:${dayOfYear}`, songToSet, { ex: 86400 }); // Expira em 24h
      }

      console.log(`🎵 Admin definiu música do dia: ${songToSet.title} para o dia ${dayOfYear}`);

      return res.status(200).json({
        success: true,
        message: 'Música do dia definida com sucesso',
        song: songToSet,
        dayOfYear
      });
    } catch (error) {
      console.error('Erro ao definir música do dia:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Remover override da música do dia
      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

      if (kv) {
        await kv.del(`daily-song-override:${dayOfYear}`);
      }

      console.log(`🎵 Admin removeu override da música do dia ${dayOfYear}`);

      return res.status(200).json({
        success: true,
        message: 'Override removido, voltando ao sistema automático'
      });
    } catch (error) {
      console.error('Erro ao remover override:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
