import { kv } from '@vercel/kv';

// Cache em memória para reduzir chamadas KV
const memoryCache = new Map();
const cacheTimestamps = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Sistema de debouncing para salvamentos
const pendingSaves = new Map();
const saveTimers = new Map();

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Buscar perfil
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }

      try {
        const cacheKey = `profile:${userId}`;

        // Verificar cache primeiro
        const cached = memoryCache.get(cacheKey);
        const timestamp = cacheTimestamps.get(cacheKey);

        if (cached && timestamp && (Date.now() - timestamp < CACHE_TTL)) {
          console.log(`📦 Cache HIT para perfil ${userId}`);
          return res.status(200).json({
            success: true,
            profile: cached
          });
        }

        const profile = await kv.get(cacheKey);

        if (profile) {
          // Salvar no cache
          memoryCache.set(cacheKey, profile);
          cacheTimestamps.set(cacheKey, Date.now());

          return res.status(200).json({
            success: true,
            profile: profile
          });
        } else {
          return res.status(404).json({
            success: false,
            message: 'Perfil não encontrado'
          });
        }
      } catch (error) {
        console.error('Erro ao buscar perfil no KV:', error);
        return res.status(500).json({
          error: 'Erro interno do servidor',
          details: error.message
        });
      }

    } else if (req.method === 'POST') {
      // Salvar perfil
      const { userId, profile } = req.body;

      if (!userId || !profile) {
        return res.status(400).json({
          error: 'userId e profile são obrigatórios'
        });
      }

      try {
        const cacheKey = `profile:${userId}`;

        // Adicionar timestamp de salvamento
        const profileToSave = {
          ...profile,
          id: userId,
          savedAt: new Date().toISOString()
        };

        // Invalidar cache
        memoryCache.delete(cacheKey);
        cacheTimestamps.delete(cacheKey);

        // Debounce o salvamento para reduzir chamadas KV
        if (saveTimers.has(userId)) {
          clearTimeout(saveTimers.get(userId));
        }

        pendingSaves.set(userId, profileToSave);

        const timer = setTimeout(async () => {
          try {
            const dataToSave = pendingSaves.get(userId);
            if (dataToSave) {
              await kv.set(cacheKey, dataToSave);
              console.log(`✅ Perfil salvo (debounced) para usuário ${userId}`);
            }
          } catch (error) {
            console.error('Erro ao salvar perfil (debounced):', error);
          } finally {
            pendingSaves.delete(userId);
            saveTimers.delete(userId);
          }
        }, 2000); // 2 segundos de debounce

        saveTimers.set(userId, timer);

        return res.status(200).json({
          success: true,
          message: 'Perfil salvo com sucesso',
          profile: profileToSave
        });

      } catch (error) {
        console.error('Erro ao salvar perfil no KV:', error);
        return res.status(500).json({
          error: 'Erro interno do servidor',
          details: error.message
        });
      }

    } else if (req.method === 'DELETE') {
      // Deletar perfil
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }

      try {
        await kv.del(`profile:${userId}`);

        console.log(`🗑️ Perfil deletado para usuário ${userId}`);

        return res.status(200).json({
          success: true,
          message: 'Perfil deletado com sucesso'
        });

      } catch (error) {
        console.error('Erro ao deletar perfil no KV:', error);
        return res.status(500).json({
          error: 'Erro interno do servidor',
          details: error.message
        });
      }

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro geral na API de perfil:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
