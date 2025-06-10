import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Verificar autenticação admin
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'admin123') {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { requestId, reason } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'ID da solicitação é obrigatório' });
    }

    // Buscar a doação
    const donation = await kv.get(`donation_request:${requestId}`);
    if (!donation) {
      return res.status(404).json({ error: 'Doação não encontrada' });
    }

    if (donation.status !== 'pending_verification') {
      return res.status(400).json({ error: 'Doação já foi processada' });
    }

    // Atualizar status da doação
    const updatedDonation = {
      ...donation,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason || 'Pagamento não confirmado'
    };

    await kv.set(`donation_request:${requestId}`, updatedDonation);

    // Remover da lista de pendentes
    const pendingList = await kv.get('pending_pix_donations') || [];
    const updatedPendingList = pendingList.filter(id => id !== requestId);
    await kv.set('pending_pix_donations', updatedPendingList);

    // Adicionar à lista de doações rejeitadas
    const rejectedKey = 'rejected_donations';
    const rejectedList = await kv.get(rejectedKey) || [];
    rejectedList.push(requestId);
    await kv.set(rejectedKey, rejectedList);

    // Enviar email de notificação
    try {
      await resend.emails.send({
        from: 'LudoMusic <noreply@ludomusic.xyz>',
        to: donation.email,
        subject: 'Doação PIX - Não Confirmada',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">❌ Doação Não Confirmada</h2>

            <p>Olá!</p>

            <p>Infelizmente, não conseguimos confirmar o recebimento da sua doação PIX no valor de <strong>R$ ${donation.amount}</strong>.</p>

            <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="margin-top: 0; color: #991b1b;">📋 Detalhes</h3>
              <p><strong>Valor:</strong> R$ ${donation.amount}</p>
              <p><strong>Data da Solicitação:</strong> ${new Date(donation.timestamp).toLocaleString('pt-BR')}</p>
              <p><strong>ID:</strong> ${donation.id}</p>
              ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #1f2937;">🤔 O que pode ter acontecido?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>O pagamento PIX pode não ter sido processado</li>
                <li>Pode ter havido um erro na chave PIX utilizada</li>
                <li>O valor pode não ter correspondido ao solicitado</li>
                <li>O pagamento pode ter sido feito após o prazo de verificação</li>
              </ul>
            </div>

            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">💡 Quer tentar novamente?</h3>
              <p>Se você realmente fez o pagamento PIX, entre em contato conosco respondendo este email com:</p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Comprovante do PIX</li>
                <li>Horário exato do pagamento</li>
                <li>Valor transferido</li>
              </ul>
              <p style="margin-bottom: 0;">Ou você pode fazer uma nova doação através do site.</p>
            </div>

            <p>Lamentamos qualquer inconveniente e agradecemos sua intenção de apoiar o LudoMusic! 🎵</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              Para suporte, responda este email ou entre em contato em andreibonatto8@gmail.com
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de rejeição:', emailError);
      // Não falhar a rejeição por causa do email
    }

    res.status(200).json({
      success: true,
      message: 'Doação rejeitada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao rejeitar doação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
