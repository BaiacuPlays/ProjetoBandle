import { kv } from '@vercel/kv';

// Fallback para desenvolvimento local
const localInvites = new Map();

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Chave para buscar convites do usuário
    const inviteKey = `invites:${userId}`;

    try {
      let invites = [];

      if (isDevelopment && !hasKVConfig) {
        // Desenvolvimento local - usar Map
        invites = localInvites.get(inviteKey) || [];
      } else {
        // Produção - usar Vercel KV
        invites = await kv.get(inviteKey) || [];
      }

      // Filtrar apenas convites pendentes e não expirados (últimas 24 horas)
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      const validInvites = invites.filter(invite => 
        invite.status === 'pending' && 
        invite.timestamp > oneDayAgo
      );

      return res.status(200).json({
        success: true,
        invites: validInvites
      });

    } catch (error) {
      console.error('Erro ao buscar convites:', error);
      return res.status(500).json({
        error: 'Erro ao buscar convites',
        details: isDevelopment ? error.message : undefined
      });
    }

  } catch (error) {
    console.error('Erro na API de busca de convites:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
