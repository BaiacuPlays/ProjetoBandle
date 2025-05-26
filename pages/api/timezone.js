// API para obter informações de timezone
export default async function handler(req, res) {
  // Permitir apenas GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Tentar usar API externa primeiro
    const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', {
      timeout: 3000
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        datetime: data.datetime,
        timezone: data.timezone,
        utc_offset: data.utc_offset,
        source: 'worldtimeapi'
      });
    } else {
      throw new Error('API externa falhou');
    }
  } catch (error) {
    // Fallback: usar data local do servidor
    const now = new Date();
    return res.status(200).json({
      datetime: now.toISOString(),
      timezone: 'UTC',
      utc_offset: '+00:00',
      source: 'fallback',
      fallback: true
    });
  }
}
