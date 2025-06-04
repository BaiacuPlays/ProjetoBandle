import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, email, timestamp, status } = req.body;

    // Validações básicas
    if (!amount || !email || !timestamp) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    if (amount <= 0 || amount > 1000) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Gerar ID único para a solicitação
    const requestId = `pix_request_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Dados da solicitação
    const donationRequest = {
      id: requestId,
      amount: parseFloat(amount),
      method: 'pix_pending',
      email,
      timestamp,
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      activationCode: null
    };

    // Salvar no KV
    await kv.set(`donation_request:${requestId}`, donationRequest);

    // Adicionar à lista de solicitações pendentes
    const pendingKey = 'pending_pix_donations';
    const pendingList = await kv.get(pendingKey) || [];
    pendingList.push(requestId);
    await kv.set(pendingKey, pendingList);

    // Enviar email de confirmação para o doador
    try {
      await resend.emails.send({
        from: 'LudoMusic <noreply@ludomusic.xyz>',
        to: email,
        subject: 'Doação PIX Recebida - Aguardando Verificação',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">💖 Obrigado pela sua doação!</h2>
            
            <p>Olá!</p>
            
            <p>Recebemos sua solicitação de doação via PIX no valor de <strong>R$ ${amount}</strong>.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">📋 Detalhes da Doação</h3>
              <p><strong>Valor:</strong> R$ ${amount}</p>
              <p><strong>Método:</strong> PIX</p>
              <p><strong>Data:</strong> ${new Date(timestamp).toLocaleString('pt-BR')}</p>
              <p><strong>ID da Solicitação:</strong> ${requestId}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <h4 style="margin-top: 0; color: #92400e;">⏳ Verificação em Andamento</h4>
              <p style="margin-bottom: 0;">Sua doação será verificada manualmente em até <strong>24 horas</strong>. Após a confirmação, você receberá um email com o código de ativação dos benefícios.</p>
            </div>
            
            <p>Se você tiver alguma dúvida, responda este email ou entre em contato conosco.</p>
            
            <p>Muito obrigado pelo seu apoio ao LudoMusic! 🎵</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              Este é um email automático. Para suporte, responda este email ou entre em contato em andreibonatto8@gmail.com
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de confirmação:', emailError);
      // Não falhar a requisição por causa do email
    }

    // Enviar notificação para o admin
    try {
      await resend.emails.send({
        from: 'LudoMusic <noreply@ludomusic.xyz>',
        to: 'andreibonatto8@gmail.com',
        subject: `Nova Doação PIX Pendente - R$ ${amount}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">🔔 Nova Doação PIX para Verificar</h2>
            
            <div style="background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
              <h3 style="margin-top: 0;">Detalhes da Doação</h3>
              <p><strong>Valor:</strong> R$ ${amount}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Data:</strong> ${new Date(timestamp).toLocaleString('pt-BR')}</p>
              <p><strong>ID:</strong> ${requestId}</p>
            </div>
            
            <p><strong>Ação Necessária:</strong> Verificar se o pagamento PIX foi realmente recebido e aprovar/rejeitar a doação no painel admin.</p>
            
            <p><a href="https://ludomusic.xyz/admin" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir para Painel Admin</a></p>
          </div>
        `
      });
    } catch (adminEmailError) {
      console.error('Erro ao enviar email para admin:', adminEmailError);
    }

    res.status(200).json({ 
      success: true, 
      requestId,
      message: 'Solicitação de doação registrada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao processar solicitação de doação PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
