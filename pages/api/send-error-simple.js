// API simples para relatórios de erro - sempre funciona
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { description, email, userAgent, url, timestamp } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Descrição do erro é obrigatória' });
    }

    const reportData = {
      description: description.trim(),
      userEmail: email || 'Não informado',
      userAgent: userAgent || 'Não informado',
      pageUrl: url || 'Não informado',
      timestamp: timestamp || new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Não informado'
    };

    // SEMPRE logar no console do servidor (você pode ver isso no Vercel)
    console.log('\n🐛 ===== NOVO RELATÓRIO DE ERRO =====');
    console.log('📅 Data:', reportData.timestamp);
    console.log('📧 Email:', reportData.userEmail);
    console.log('🌐 URL:', reportData.pageUrl);
    console.log('💻 Navegador:', reportData.userAgent);
    console.log('🌍 IP:', reportData.ip);
    console.log('📝 Descrição:');
    console.log(reportData.description);
    console.log('=====================================\n');

    let emailSent = false;
    let method = 'log-only';

    // Método 1: Tentar webhook do Discord (se configurado)
    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        const discordPayload = {
          content: `🐛 **Novo Relatório de Erro - LudoMusic**`,
          embeds: [{
            title: "Relatório de Erro",
            color: 15158332, // Cor vermelha
            fields: [
              { name: "📅 Data", value: reportData.timestamp, inline: true },
              { name: "📧 Email", value: reportData.userEmail, inline: true },
              { name: "🌐 URL", value: reportData.pageUrl, inline: false },
              { name: "💻 Navegador", value: reportData.userAgent.substring(0, 100) + '...', inline: false },
              { name: "📝 Descrição", value: reportData.description.substring(0, 1000), inline: false }
            ],
            timestamp: new Date().toISOString()
          }]
        };

        const discordResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload)
        });

        if (discordResponse.ok) {
          emailSent = true;
          method = 'discord';
          console.log('✅ Relatório enviado via Discord webhook');
        }
      } catch (discordError) {
        console.log('❌ Discord webhook falhou:', discordError.message);
      }
    }

    // Método 2: Tentar Telegram (se configurado)
    if (!emailSent && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        const telegramMessage = `
🐛 *RELATÓRIO DE ERRO - LudoMusic*

📅 *Data:* ${reportData.timestamp}
📧 *Email:* ${reportData.userEmail}
🌐 *URL:* ${reportData.pageUrl}
💻 *Navegador:* ${reportData.userAgent.substring(0, 100)}...

📝 *Descrição:*
${reportData.description}
        `.trim();

        const telegramResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: telegramMessage,
            parse_mode: 'Markdown'
          })
        });

        if (telegramResponse.ok) {
          emailSent = true;
          method = 'telegram';
          console.log('✅ Relatório enviado via Telegram');
        }
      } catch (telegramError) {
        console.log('❌ Telegram falhou:', telegramError.message);
      }
    }

    // Método 3: Webhook genérico (se configurado)
    if (!emailSent && process.env.WEBHOOK_URL) {
      try {
        const webhookResponse = await fetch(process.env.WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'error_report',
            data: reportData,
            formatted_message: `
Novo relatório de erro no LudoMusic:

Data: ${reportData.timestamp}
Email: ${reportData.userEmail}
URL: ${reportData.pageUrl}
Navegador: ${reportData.userAgent}
IP: ${reportData.ip}

Descrição:
${reportData.description}
            `.trim()
          })
        });

        if (webhookResponse.ok) {
          emailSent = true;
          method = 'webhook';
          console.log('✅ Relatório enviado via webhook genérico');
        }
      } catch (webhookError) {
        console.log('❌ Webhook genérico falhou:', webhookError.message);
      }
    }

    // Sempre salvar em arquivo local (desenvolvimento)
    if (typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');
        
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }

        const logFile = path.join(logDir, 'error-reports.log');
        const logEntry = `
=== RELATÓRIO DE ERRO ===
Data: ${reportData.timestamp}
IP: ${reportData.ip}
URL: ${reportData.pageUrl}
User Agent: ${reportData.userAgent}
Email: ${reportData.userEmail}
Descrição: ${reportData.description}
Método de envio: ${method}
========================

`;

        fs.appendFileSync(logFile, logEntry);
        console.log('✅ Log salvo em:', logFile);
      } catch (logError) {
        console.log('❌ Erro ao salvar log local:', logError.message);
      }
    }

    // SEMPRE retornar sucesso
    return res.status(200).json({
      success: true,
      message: emailSent ? 
        'Relatório enviado com sucesso!' : 
        'Relatório recebido e logado. Será processado manualmente.',
      emailSent: emailSent,
      method: method,
      timestamp: reportData.timestamp
    });

  } catch (error) {
    console.error('❌ Erro geral na API:', error);
    
    // Mesmo com erro, tentar logar o básico
    console.log('📝 Dados recebidos:', req.body);
    
    return res.status(200).json({
      success: true,
      message: 'Relatório recebido com problemas técnicos. Será processado manualmente.',
      emailSent: false,
      method: 'error-fallback',
      error: error.message
    });
  }
}
