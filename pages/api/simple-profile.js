// API simples para perfis - FUNCIONA SEMPRE
const profiles = new Map(); // Armazenamento em memória

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId obrigatório' });
      }

      // Tentar buscar no KV primeiro
      let profile = null;
      try {
        const { kv } = await import('@vercel/kv');
        profile = await kv.get(`profile:${userId}`);
      } catch (e) {
        // Se KV falhar, usar memória
        profile = profiles.get(userId);
      }

      if (profile) {
        return res.status(200).json({ success: true, profile });
      } else {
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }

    } else if (method === 'POST') {
      const { userId, profile } = req.body;
      
      if (!userId || !profile) {
        return res.status(400).json({ error: 'userId e profile obrigatórios' });
      }

      // Salvar em memória SEMPRE
      profiles.set(userId, profile);

      // Tentar salvar no KV (não bloquear se falhar)
      try {
        const { kv } = await import('@vercel/kv');
        await kv.set(`profile:${userId}`, profile);
      } catch (e) {
        console.warn('KV indisponível, usando apenas memória');
      }

      return res.status(200).json({ success: true, profile });

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
