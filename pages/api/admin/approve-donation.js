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
    const { requestId } = req.body;

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

    // Gerar código de ativação
    const activationCode = generateActivationCode();

    // Atualizar status da doação
    const updatedDonation = {
      ...donation,
      status: 'approved',
      verifiedAt: new Date().toISOString(),
      activationCode
    };

    await kv.set(`donation_request:${requestId}`, updatedDonation);

    // Remover da lista de pendentes
    const pendingList = await kv.get('pending_pix_donations') || [];
    const updatedPendingList = pendingList.filter(id => id !== requestId);
    await kv.set('pending_pix_donations', updatedPendingList);

    // Adicionar à lista de doações aprovadas
    const approvedKey = 'approved_donations';
    const approvedList = await kv.get(approvedKey) || [];
    approvedList.push(requestId);
    await kv.set(approvedKey, approvedList);

    // Enviar email com código de ativação
    try {
      const benefits = getDonationBenefits(donation.amount);
      const benefitsList = benefits.map(b => `• ${b}`).join('\n');

      await resend.emails.send({
        from: 'LudoMusic <noreply@ludomusic.xyz>',
        to: donation.email,
        subject: 'Doação Aprovada - Código de Ativação dos Benefícios',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">✅ Doação Aprovada!</h2>

            <p>Olá!</p>

            <p>Sua doação via PIX no valor de <strong>R$ ${donation.amount}</strong> foi verificada e aprovada!</p>

            <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin-top: 0; color: #065f46;">🎁 Código de Ativação</h3>
              <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; margin: 10px 0;">
                <code style="font-size: 18px; font-weight: bold; color: #1f2937; letter-spacing: 2px;">${activationCode}</code>
              </div>
              <p style="margin-bottom: 0; font-size: 14px; color: #065f46;">
                <strong>Como usar:</strong> Faça login no LudoMusic, vá em Perfil → Configurações → Ativar Benefícios e digite este código.
              </p>
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #1f2937;">🎁 Seus Benefícios</h3>
              <div style="white-space: pre-line; line-height: 1.6;">${benefitsList}</div>
            </div>

            <p>Muito obrigado pelo seu apoio ao LudoMusic! Sua contribuição ajuda a manter o projeto funcionando e crescendo. 🎵</p>

            <p>Se tiver alguma dúvida sobre como ativar os benefícios, responda este email.</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              Este código é válido por 30 dias. Para suporte, responda este email ou entre em contato em andreibonatto8@gmail.com
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de aprovação:', emailError);
      // Não falhar a aprovação por causa do email
    }

    res.status(200).json({
      success: true,
      activationCode,
      message: 'Doação aprovada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao aprovar doação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

function generateActivationCode() {
  // Gerar código de 8 caracteres alfanuméricos
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getDonationBenefits(amount) {
  const benefits = [];
  const numAmount = parseFloat(amount);

  if (numAmount >= 5) {
    benefits.push('💝 Badge "Apoiador" por 30 dias');
    benefits.push('⚡ +25% XP por 7 dias');
  }

  if (numAmount >= 15) {
    benefits.push('💝 Badge "Apoiador" permanente');
    benefits.push('⚡ +50% XP por 30 dias');
    benefits.push('🎨 Avatar especial desbloqueado');
  }

  if (numAmount >= 30) {
    benefits.push('🏷️ Título personalizado');
    benefits.push('✨ Cores especiais no nome');
    benefits.push('📊 Estatísticas detalhadas');
    benefits.push('💾 Backup na nuvem');
  }

  if (numAmount >= 50) {
    benefits.push('👑 Badge "VIP" permanente');
    benefits.push('🎆 Efeitos visuais especiais');
    benefits.push('🏆 Ranking especial de apoiadores');
    benefits.push('🎵 Playlist personalizada');
    benefits.push('❤️ Vidas extras no modo infinito');
  }

  return benefits;
}
