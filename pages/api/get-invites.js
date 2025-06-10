// Importação segura do KV
let kv = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
  }
} catch (error) {
  // KV não disponível
}

// Fallback para desenvolvimento local
const localInvites = new Map();

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = (process.env.KV_REST_API_URL || process.env.KV_URL) && process.env.KV_REST_API_TOKEN;

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
        try {
          invites = await kv.get(inviteKey) || [];
        } catch (kvError) {
          invites = [];
        }
      }

      // Filtrar apenas convites pendentes e não expirados (últimas 24 horas)
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      const validInvites = invites.filter(invite => {
        const isPending = invite.status === 'pending';
        const isNotExpired = invite.timestamp > oneDayAgo;

        return isPending && isNotExpired;
      });

      return res.status(200).json({
        success: true,
        invites: validInvites
      });

    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao buscar convites',
        details: isDevelopment ? error.message : undefined
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
