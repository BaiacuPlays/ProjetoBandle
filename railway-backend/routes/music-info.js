const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Function to wait for a specific time
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to clean HTML text
function cleanHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .replace(/&[^;]+;/g, '')  // Remove HTML entities
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

router.get('/', async (req, res) => {
  const { title, game } = req.query;

  if (!title || !game) {
    return res.status(400).json({ error: 'Title and game are required' });
  }

  try {
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
    
    // Look for the first album link in results
    const albumUrlMatch = searchHtml.match(/href="(\/album\/\d+)"/);
    if (!albumUrlMatch) {
      return res.status(404).json({ 
        error: 'No results found',
        searchQuery: `${game} ${title}`
      });
    }

    // Wait 2 seconds before making the next request
    await delay(2000);

    // Fetch detailed album information
    const albumUrl = `https://vgmdb.net${albumUrlMatch[1]}`;
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

    // Validate the year
    if (musicInfo.year !== 'Unknown Year') {
      const year = parseInt(musicInfo.year);
      if (year < 1970 || year > new Date().getFullYear()) {
        musicInfo.year = 'Unknown Year';
      }
    }

    res.status(200).json(musicInfo);
  } catch (error) {
    console.error('Error fetching from VGMdb:', error);
    res.status(500).json({ 
      error: 'Failed to fetch music info',
      message: error.message
    });
  }
});

module.exports = router;
