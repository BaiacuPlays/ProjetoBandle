// API para envio de relatórios de erro por email
export default async function handler(req, res) {
  // Permitir apenas método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { description, email, userAgent, url, timestamp } = req.body;

    // Validação básica
    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Descrição do erro é obrigatória' });
    }

    // Preparar dados do relatório
    const reportData = {
      description: description.trim(),
      userEmail: email || 'Não informado',
      userAgent: userAgent || 'Não informado',
      pageUrl: url || 'Não informado',
      timestamp: timestamp || new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Não informado'
    };

    // Log do relatório no console do servidor (você pode ver no Vercel)
    console.log('=== NOVO RELATÓRIO DE ERRO ===');
    console.log('Data:', reportData.timestamp);
    console.log('IP:', reportData.ip);
    console.log('URL:', reportData.pageUrl);
    console.log('User Agent:', reportData.userAgent);
    console.log('Email:', reportData.userEmail);
    console.log('Descrição:', reportData.description);
    console.log('===============================');

    let emailSent = false;
    let errorMessage = '';

    // Método 1: Tentar usar SendGrid (se configurado)
    if (process.env.SENDGRID_API_KEY) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: 'andreibonatto8@gmail.com' }],
              subject: 'Relatório de Erro - LudoMusic'
            }],
            from: {
              email: process.env.SENDGRID_FROM_EMAIL || 'noreply@ludomusic.xyz',
              name: 'LudoMusic'
            },
            content: [{
              type: 'text/html',
              value: generateEmailHTML(reportData)
            }]
          })
        });

        if (response.ok) {
          emailSent = true;
          console.log('✅ Email enviado via SendGrid');
        } else {
          const errorData = await response.text();
          console.log('❌ SendGrid falhou:', response.status, errorData);
          errorMessage += `SendGrid falhou: ${response.status}. `;
        }
      } catch (error) {
        console.log('❌ Erro SendGrid:', error.message);
        errorMessage += `SendGrid erro: ${error.message}. `;
      }
    }

    // Método 2: Tentar usar serviço de email gratuito (EmailJS ou similar)
    if (!emailSent) {
      try {
        // Usar um serviço de webhook simples como fallback
        const webhookUrl = 'https://hooks.zapier.com/hooks/catch/your-webhook-id/'; // Você pode configurar um webhook

        if (process.env.WEBHOOK_URL) {
          const response = await fetch(process.env.WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              to: 'andreibonatto8@gmail.com',
              subject: 'Relatório de Erro - LudoMusic',
              message: `
                Data: ${reportData.timestamp}
                IP: ${reportData.ip}
                URL: ${reportData.pageUrl}
                Email: ${reportData.userEmail}
                Descrição: ${reportData.description}
              `
            })
          });

          if (response.ok) {
            emailSent = true;
            console.log('✅ Email enviado via Webhook');
          }
        }
      } catch (error) {
        console.log('❌ Webhook falhou:', error.message);
      }
    }

    // Sempre salvar em log local (funciona no desenvolvimento)
    if (typeof window === 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');

        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }

        const logFile = path.join(logDir, 'error-reports.log');
        const logEntry = `\n=== RELATÓRIO DE ERRO ===\n` +
                        `Data: ${reportData.timestamp}\n` +
                        `IP: ${reportData.ip}\n` +
                        `URL: ${reportData.pageUrl}\n` +
                        `User Agent: ${reportData.userAgent}\n` +
                        `Email: ${reportData.userEmail}\n` +
                        `Descrição: ${reportData.description}\n` +
                        `========================\n`;

        fs.appendFileSync(logFile, logEntry);
        console.log('✅ Log salvo localmente');
      } catch (logError) {
        console.error('❌ Erro ao salvar log:', logError);
      }
    }

    // Retornar sucesso (o log sempre funciona)
    return res.status(200).json({
      success: true,
      message: emailSent ? 'Relatório enviado por email!' : 'Relatório recebido e logado. Verifique os logs do servidor.',
      emailSent: emailSent,
      fallbackUsed: !emailSent
    });

  } catch (error) {
    console.error('❌ Erro na API de relatório:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível processar o relatório no momento.'
    });
  }
}

// Função para gerar HTML do email
function generateEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório de Erro - LudoMusic</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1DB954; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #1DB954; }
        .value { background: white; padding: 10px; border-radius: 4px; border-left: 4px solid #1DB954; }
        .description { background: white; padding: 15px; border-radius: 4px; border: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎵 Relatório de Erro - LudoMusic</h1>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">📅 Data e Hora:</div>
            <div class="value">${new Date(data.timestamp).toLocaleString('pt-BR')}</div>
          </div>

          <div class="field">
            <div class="label">📧 Email do Usuário:</div>
            <div class="value">${data.userEmail}</div>
          </div>

          <div class="field">
            <div class="label">🌐 URL da Página:</div>
            <div class="value">${data.pageUrl}</div>
          </div>

          <div class="field">
            <div class="label">💻 Navegador:</div>
            <div class="value">${data.userAgent}</div>
          </div>

          <div class="field">
            <div class="label">🌍 IP:</div>
            <div class="value">${data.ip}</div>
          </div>

          <div class="field">
            <div class="label">🐛 Descrição do Erro:</div>
            <div class="description">${data.description.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
