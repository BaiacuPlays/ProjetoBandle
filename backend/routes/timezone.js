const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// GET - Buscar timezone de São Paulo
router.get('/', async (req, res) => {
  try {
    // Tentar buscar da API de timezone
    const response = await fetch('http://worldtimeapi.org/api/timezone/America/Sao_Paulo');

    if (!response.ok) {
      throw new Error('API de timezone indisponível');
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.warn('Erro ao buscar timezone, usando fallback:', error.message);

    // Fallback: usar data local do servidor
    const now = new Date();
    return res.json({
      datetime: now.toISOString(),
      fallback: true,
      timezone: 'America/Sao_Paulo',
      utc_offset: '-03:00'
    });
  }
});

module.exports = router;
