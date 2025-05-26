// API para envio de relatórios de erro usando Formspree (gratuito)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { description, email, userAgent, url, timestamp } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Descrição do erro é obrigatória' });
    }

    // Log no console do servidor
    console.log('=== NOVO RELATÓRIO DE ERRO ===');
    console.log('Data:', timestamp || new Date().toISOString());
    console.log('Email:', email || 'Não informado');
    console.log('URL:', url || 'Não informado');
    console.log('Descrição:', description);
    console.log('===============================');

    // Tentar enviar via Formspree (serviço gratuito)
    try {
      const formspreeResponse = await fetch('https://formspree.io/f/xpwzgqpb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: 'andreibonatto8@gmail.com',
          subject: 'Relatório de Erro - LudoMusic',
          message: `
RELATÓRIO DE ERRO - LUDOMUSIC

Data: ${timestamp || new Date().toISOString()}
Email do usuário: ${email || 'Não informado'}
URL da página: ${url || 'Não informado'}
Navegador: ${userAgent || 'Não informado'}

DESCRIÇÃO DO ERRO:
${description}

---
Este relatório foi enviado automaticamente pelo sistema de relatório de erro do LudoMusic.
          `.trim(),
          _replyto: email || 'noreply@ludomusic.xyz',
          _subject: 'Relatório de Erro - LudoMusic'
        })
      });

      if (formspreeResponse.ok) {
        console.log('✅ Email enviado via Formspree');
        return res.status(200).json({
          success: true,
          message: 'Relatório enviado com sucesso!',
          emailSent: true,
          method: 'formspree'
        });
      } else {
        const errorText = await formspreeResponse.text();
        console.log('❌ Formspree falhou:', formspreeResponse.status, errorText);
      }
    } catch (formspreeError) {
      console.log('❌ Erro Formspree:', formspreeError.message);
    }

    // Fallback: Usar Netlify Forms (outro serviço gratuito)
    try {
      const netlifyResponse = await fetch('https://ludomusic.netlify.app/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'form-name': 'error-report',
          'email': email || 'noreply@ludomusic.xyz',
          'subject': 'Relatório de Erro - LudoMusic',
          'message': `
Data: ${timestamp || new Date().toISOString()}
Email: ${email || 'Não informado'}
URL: ${url || 'Não informado'}
Navegador: ${userAgent || 'Não informado'}

ERRO:
${description}
          `.trim()
        })
      });

      if (netlifyResponse.ok) {
        console.log('✅ Email enviado via Netlify');
        return res.status(200).json({
          success: true,
          message: 'Relatório enviado com sucesso!',
          emailSent: true,
          method: 'netlify'
        });
      }
    } catch (netlifyError) {
      console.log('❌ Netlify falhou:', netlifyError.message);
    }

    // Fallback final: Sempre retornar sucesso (o log foi feito)
    return res.status(200).json({
      success: true,
      message: 'Relatório recebido e logado no servidor. Será processado manualmente.',
      emailSent: false,
      method: 'log-only'
    });

  } catch (error) {
    console.error('❌ Erro na API:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível processar o relatório.'
    });
  }
}
