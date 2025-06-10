// Importar sistema de segurança e webhook
import {
  getClientIP,
  isIPBlocked,
  blockIP,
  checkRateLimit,
  isSpamContent,
  isValidEmail,
  sanitizeInput
} from '../../utils/security';
import { sendSecureDiscordReport } from '../../utils/discord-webhook';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clientIP = getClientIP(req);

    // Verificar se IP está bloqueado
    if (await isIPBlocked(clientIP)) {
      console.warn(`🚫 IP bloqueado tentou enviar relatório: ${clientIP}`);
      return res.status(429).json({
        error: 'Acesso negado por atividade suspeita',
        code: 'IP_BLOCKED'
      });
    }

    // Verificar rate limiting (máximo 3 relatórios por minuto)
    if (!await checkRateLimit(clientIP, 'bug-report', 3, 60000)) {
      console.warn(`⚠️ Rate limit excedido para IP: ${clientIP}`);
      await blockIP(clientIP, 'Rate limit excedido em bug-report');
      return res.status(429).json({
        error: 'Muitas tentativas. Tente novamente mais tarde.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    const { description, email, category, systemInfo, type } = req.body;

    // Validações básicas
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }

    if (!category) {
      return res.status(400).json({ error: 'Categoria é obrigatória' });
    }

    // Sanitizar e verificar se é spam
    const cleanDescription = sanitizeInput(description, 1000);
    if (isSpamContent(cleanDescription)) {
      console.warn(`🚫 Conteúdo spam detectado de IP ${clientIP}: ${cleanDescription.substring(0, 100)}`);
      await blockIP(clientIP, 'Conteúdo spam detectado');
      return res.status(400).json({
        error: 'Conteúdo inválido detectado',
        code: 'SPAM_DETECTED'
      });
    }

    // Validar categoria
    const validCategories = ['bug', 'suggestion', 'audio', 'ui', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Categoria inválida' });
    }

    // Validar email se fornecido
    if (email && email.trim() && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Preparar dados do relatório com informações de segurança
    const reportData = {
      id: `bug_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      description: cleanDescription,
      email: email ? sanitizeInput(email, 100) : 'Não informado',
      category,
      systemInfo: systemInfo || {},
      type: type || 'user_report',
      security: {
        clientIP: clientIP,
        userAgent: req.headers['user-agent'] || 'Unknown',
        referer: req.headers['referer'] || 'Unknown',
        timestamp: Date.now()
      }
    };

    // Mapear categorias para emojis
    const categoryEmojis = {
      bug: '🐛',
      suggestion: '💡',
      audio: '🎵',
      ui: '🎨',
      other: '❓'
    };

    const categoryNames = {
      bug: 'Bug/Erro',
      suggestion: 'Sugestão',
      audio: 'Problema de Áudio',
      ui: 'Problema de Interface',
      other: 'Outro'
    };

    // Preparar embed para Discord
    const embed = {
      title: `${categoryEmojis[category]} ${categoryNames[category]}`,
      description: description.trim(),
      color: category === 'bug' ? 0xff4444 : category === 'suggestion' ? 0x1DB954 : 0x3b82f6,
      fields: [
        {
          name: '📧 Email',
          value: email?.trim() || 'Não informado',
          inline: true
        },
        {
          name: '🆔 ID do Relatório',
          value: reportData.id,
          inline: true
        },
        {
          name: '⏰ Data/Hora',
          value: new Date().toLocaleString('pt-BR'),
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    };

    // Adicionar informações da música se disponível
    if (systemInfo?.currentSong) {
      embed.fields.push({
        name: '🎵 Música Atual',
        value: `${systemInfo.currentSong.game} - ${systemInfo.currentSong.title}`,
        inline: false
      });
    }

    // Adicionar informações do sistema
    if (systemInfo?.userAgent) {
      const browserInfo = getBrowserInfo(systemInfo.userAgent);
      embed.fields.push({
        name: '🌐 Navegador',
        value: browserInfo,
        inline: true
      });
    }

    if (systemInfo?.viewport) {
      embed.fields.push({
        name: '📱 Resolução',
        value: `${systemInfo.viewport.width}x${systemInfo.viewport.height}`,
        inline: true
      });
    }

    if (systemInfo?.url) {
      embed.fields.push({
        name: '🔗 URL',
        value: systemInfo.url,
        inline: false
      });
    }

    // Tentar enviar para Discord usando sistema seguro
    let discordSent = false;
    try {
      discordSent = await sendSecureDiscordReport(reportData, req);
    } catch (error) {
      console.error('Erro ao enviar para Discord:', error);
    }

    // Log local para backup (sempre salvar)
    console.log('📝 Relatório de bug processado:', {
      id: reportData.id,
      category: reportData.category,
      ip: clientIP,
      timestamp: reportData.timestamp,
      description: reportData.description.substring(0, 100) + '...',
      discordSent: discordSent,
      email: reportData.email !== 'Não informado' ? 'Fornecido' : 'Não fornecido'
    });

    res.status(200).json({
      success: true,
      id: reportData.id,
      message: 'Relatório enviado com sucesso!',
      discordSent: discordSent,
      timestamp: reportData.timestamp
    });

  } catch (error) {
    console.error('Erro ao processar relatório de bug:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função auxiliar para extrair informações do navegador
function getBrowserInfo(userAgent) {
  if (!userAgent) return 'Desconhecido';

  // Detectar navegador
  let browser = 'Desconhecido';
  let version = '';

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    version = match ? match[1] : '';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    version = match ? match[1] : '';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/([0-9.]+)/);
    version = match ? match[1] : '';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
    const match = userAgent.match(/Edg\/([0-9.]+)/);
    version = match ? match[1] : '';
  }

  // Detectar sistema operacional
  let os = 'Desconhecido';
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  return `${browser} ${version} (${os})`;
}
