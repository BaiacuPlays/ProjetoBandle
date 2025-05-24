const express = require('express');
const router = express.Router();

// Função para limpar HTML
function cleanHtml(str) {
  return str.replace(/<[^>]*>/g, '').trim();
}

// GET - Buscar informações da música
router.get('/', async (req, res) => {
  const { title, game } = req.query;

  if (!title || !game) {
    return res.status(400).json({ error: 'Título e jogo são obrigatórios' });
  }

  try {
    // Importar fetch dinamicamente (para compatibilidade com Node.js)
    const fetch = (await import('node-fetch')).default;
    
    // Search for albums on VGMdb
    const query = encodeURIComponent(`${game} ${title}`);
    const searchResponse = await fetch(
      `https://vgmdb.net/search?q=${query}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Failed to fetch from VGMdb: ${searchResponse.status}`);
    }

    const searchHtml = await searchResponse.text();
    
    // Extract album URLs from search results
    const albumMatches = searchHtml.match(/href="(\/album\/\d+)"/g);
    
    if (!albumMatches || albumMatches.length === 0) {
      return res.json({
        artist: 'Unknown Artist',
        year: 'Unknown Year',
        album: 'Unknown Album',
        console: 'Unknown Platform',
        debug: {
          query: `${game} ${title}`,
          message: 'No albums found'
        }
      });
    }

    // Get the first album URL
    const albumPath = albumMatches[0].match(/href="([^"]+)"/)[1];
    const albumUrl = `https://vgmdb.net${albumPath}`;
    
    // Fetch album details
    const albumResponse = await fetch(albumUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!albumResponse.ok) {
      throw new Error(`Failed to fetch album details: ${albumResponse.status}`);
    }

    const albumHtml = await albumResponse.text();
    
    // Extract information from HTML with more specific selectors
    const titleMatch = albumHtml.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const artistMatch = albumHtml.match(/Composer<\/b><\/td>\s*<td[^>]*>([^<]+)/);
    const yearMatch = albumHtml.match(/Release Date<\/b><\/td>\s*<td[^>]*>(\d{4})-/);
    const platformMatch = albumHtml.match(/Platform<\/b><\/td>\s*<td[^>]*>([^<]+)<\/td>/);
    
    const musicInfo = {
      artist: artistMatch ? cleanHtml(artistMatch[1]) : 'Unknown Artist',
      year: yearMatch ? yearMatch[1] : 'Unknown Year',
      album: titleMatch ? cleanHtml(titleMatch[1]) : 'Unknown Album',
      console: platformMatch ? cleanHtml(platformMatch[1]) : 'Unknown Platform',
      debug: {
        url: albumUrl,
        query: `${game} ${title}`
      }
    };

    return res.json(musicInfo);
  } catch (error) {
    console.error('Erro ao buscar informações da música:', error);
    
    // Retorna dados padrão em caso de erro
    return res.json({
      artist: 'Unknown Artist',
      year: 'Unknown Year',
      album: 'Unknown Album',
      console: 'Unknown Platform',
      debug: {
        error: error.message,
        query: `${game} ${title}`
      }
    });
  }
});

module.exports = router;
