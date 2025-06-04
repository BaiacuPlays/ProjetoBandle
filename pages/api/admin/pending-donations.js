import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Buscar lista de doações pendentes
    const pendingList = await kv.get('pending_pix_donations') || [];
    
    // Buscar detalhes de cada doação
    const donations = [];
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

    // Ordenar por data (mais recentes primeiro)
    donations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ donations });
  } catch (error) {
    console.error('Erro ao buscar doações pendentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
