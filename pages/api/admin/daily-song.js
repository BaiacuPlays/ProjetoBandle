// API para gerenciar música do dia - Admin
import { getDeterministicSongSimple } from '../../../utils/helpers';

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

  if (req.method === 'GET') {
    try {
      // Buscar música do dia atual
      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      
      // Verificar se há override definido
      let customSong = null;
      if (kv) {
        customSong = await kv.get(`daily-song-override:${dayOfYear}`);
      }
      
      let currentSong;
      if (customSong) {
        currentSong = customSong;
      } else {
        // Usar sistema determinístico padrão
        currentSong = getDeterministicSongSimple(dayOfYear);
      }

      return res.status(200).json({
        success: true,
        song: currentSong,
        dayOfYear,
        isOverride: !!customSong
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
