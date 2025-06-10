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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let donations = [];

    if (kv) {
      try {
        // Buscar lista de doações pendentes
        const pendingList = await kv.get('pending_pix_donations') || [];

        // Buscar detalhes de cada doação
        for (const requestId of pendingList) {
          try {
            const donation = await kv.get(`donation_request:${requestId}`);
            if (donation && donation.status === 'pending_verification') {
              donations.push(donation);
            }
          } catch (error) {
            console.error(`Erro ao buscar doação ${requestId}:`, error);
          }
        }
      } catch (kvError) {
        console.warn('Erro ao acessar KV:', kvError);
      }
    }

    // Se não há doações reais ou KV não disponível, usar dados demo
    if (donations.length === 0) {
      donations = [
        {
          id: 'demo_donation_1',
          amount: '15.00',
          email: 'usuario@exemplo.com',
          status: 'pending_verification',
          createdAt: new Date().toISOString(),
          pixKey: 'andreibonatto8@gmail.com'
        },
        {
          id: 'demo_donation_2',
          amount: '50.00',
          email: 'vip@exemplo.com',
          status: 'pending_verification',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          pixKey: 'andreibonatto8@gmail.com'
        }
      ];
    }

    // Ordenar por data (mais recentes primeiro)
    donations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      donations
    });
  } catch (error) {
    console.error('Erro ao buscar doações pendentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
