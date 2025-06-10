// API para definir música do dia - Admin
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

export default async function handler(req, res) {
  // Verificar autenticação admin
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'admin123') {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { songId, songTitle, customDate } = req.body;
    
    if (!songId && !songTitle) {
      return res.status(400).json({ error: 'songId ou songTitle é obrigatório' });
    }

    // Carregar lista de músicas
    const musicPath = path.join(process.cwd(), 'data', 'music.json');
    let musicData;
    
    try {
      const musicFile = fs.readFileSync(musicPath, 'utf8');
      musicData = JSON.parse(musicFile);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao carregar lista de músicas' });
    }

    // Encontrar a música
    let selectedSong;
    if (songId) {
      selectedSong = musicData.songs.find(song => song.id === songId);
    } else {
      selectedSong = musicData.songs.find(song => 
        song.title.toLowerCase().includes(songTitle.toLowerCase())
      );
    }

    if (!selectedSong) {
      return res.status(404).json({ error: 'Música não encontrada' });
    }

    // Calcular dia do ano
    const targetDate = customDate ? new Date(customDate) : new Date();
    const dayOfYear = Math.floor((targetDate - new Date(targetDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Salvar override da música do dia
    const overrideKey = `daily-song-override:${dayOfYear}`;
    
    if (kv) {
      await kv.set(overrideKey, {
        ...selectedSong,
        setByAdmin: true,
        setAt: new Date().toISOString(),
        dayOfYear
      }, { ex: 86400 * 7 }); // Expira em 7 dias
    }

    console.log(`🎵 [ADMIN] Música do dia definida: "${selectedSong.title}" por ${selectedSong.artist} (${selectedSong.game}) para o dia ${dayOfYear}`);

    return res.status(200).json({
      success: true,
      message: 'Música do dia definida com sucesso!',
      song: {
        title: selectedSong.title,
        artist: selectedSong.artist,
        game: selectedSong.game,
        dayOfYear
      },
      date: targetDate.toLocaleDateString('pt-BR')
    });

  } catch (error) {
    console.error('Erro ao definir música do dia:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
