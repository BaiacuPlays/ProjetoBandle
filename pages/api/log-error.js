export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const errorData = req.body;

    // Validar dados básicos
    if (!errorData.type || !errorData.timestamp) {
      return res.status(400).json({ error: 'Invalid error data' });
    }

    // Preparar log entry
    const logEntry = {
      ...errorData,
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      serverTimestamp: new Date().toISOString()
    };

    // Apenas log no console para Vercel (logs são capturados automaticamente)
    console.error('Client Error Report:', JSON.stringify(logEntry, null, 2));

    res.status(200).json({ success: true, id: logEntry.id });
  } catch (error) {
    console.error('Error logging error:', error);
    res.status(500).json({ error: 'Failed to log error' });
  }
}
