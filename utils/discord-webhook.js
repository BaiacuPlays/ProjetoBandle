// Sistema seguro de webhook do Discord para relatórios de bug
import { getClientIP } from './security';

// Função para enviar relatório seguro para Discord
export async function sendSecureDiscordReport(reportData, req) {
  // Verificar se webhook está configurado
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL_SECURE;
  
  if (!webhookUrl) {
    console.log('🔒 Webhook do Discord não configurado - relatório salvo apenas localmente');
    return false;
  }
  
  try {
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
    
    // Preparar embed seguro
    const embed = {
      title: `${categoryEmojis[reportData.category]} ${categoryNames[reportData.category]}`,
      description: reportData.description.substring(0, 500) + (reportData.description.length > 500 ? '...' : ''),
      color: reportData.category === 'bug' ? 0xff4444 : reportData.category === 'suggestion' ? 0x1DB954 : 0x3b82f6,
      fields: [
        {
          name: '📧 Email',
          value: reportData.email || 'Não informado',
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
      timestamp: new Date().toISOString(),
      footer: {
        text: `IP: ${reportData.security?.clientIP || 'Unknown'} | Verificado ✅`
      }
    };

    // Adicionar informações da música se disponível
    if (reportData.systemInfo?.currentSong) {
      embed.fields.push({
        name: '🎵 Música Atual',
        value: `${reportData.systemInfo.currentSong.game} - ${reportData.systemInfo.currentSong.title}`,
        inline: false
      });
    }

    // Adicionar informações do sistema (limitadas por segurança)
    if (reportData.systemInfo?.userAgent) {
      const browserInfo = getBrowserInfo(reportData.systemInfo.userAgent);
      embed.fields.push({
        name: '🌐 Navegador',
        value: browserInfo,
        inline: true
      });
    }

    if (reportData.systemInfo?.viewport) {
      embed.fields.push({
        name: '📱 Resolução',
        value: `${reportData.systemInfo.viewport.width}x${reportData.systemInfo.viewport.height}`,
        inline: true
      });
    }

    if (reportData.systemInfo?.url) {
      // Sanitizar URL para evitar vazamento de informações sensíveis
      const cleanUrl = sanitizeUrl(reportData.systemInfo.url);
      embed.fields.push({
        name: '🔗 URL',
        value: cleanUrl,
        inline: false
      });
    }

    // Payload seguro para Discord
    const discordPayload = {
      username: 'LudoMusic Security Reporter',
      avatar_url: 'https://ludomusic.xyz/favicon.ico',
      embeds: [embed],
      content: null // Não incluir conteúdo adicional por segurança
    };

    // Enviar para Discord com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LudoMusic-BugReporter/1.0'
      },
      body: JSON.stringify(discordPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Erro ao enviar para Discord:', {
        status: discordResponse.status,
        statusText: discordResponse.statusText,
        error: errorText
      });
      return false;
    }

    console.log('✅ Relatório enviado para Discord com sucesso:', reportData.id);
    return true;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Timeout ao enviar para Discord:', error);
    } else {
      console.error('Erro ao enviar para Discord:', error);
    }
    return false;
  }
}

// Função auxiliar para extrair informações do navegador (versão segura)
function getBrowserInfo(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') return 'Desconhecido';

  // Limitar tamanho do user agent
  const cleanUserAgent = userAgent.substring(0, 500);

  // Detectar navegador
  let browser = 'Desconhecido';
  let version = '';

  if (cleanUserAgent.includes('Chrome') && !cleanUserAgent.includes('Edg')) {
    browser = 'Chrome';
    const match = cleanUserAgent.match(/Chrome\/([0-9.]+)/);
    version = match ? match[1].substring(0, 10) : '';
  } else if (cleanUserAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = cleanUserAgent.match(/Firefox\/([0-9.]+)/);
    version = match ? match[1].substring(0, 10) : '';
  } else if (cleanUserAgent.includes('Safari') && !cleanUserAgent.includes('Chrome')) {
    browser = 'Safari';
    const match = cleanUserAgent.match(/Version\/([0-9.]+)/);
    version = match ? match[1].substring(0, 10) : '';
  } else if (cleanUserAgent.includes('Edg')) {
    browser = 'Edge';
    const match = cleanUserAgent.match(/Edg\/([0-9.]+)/);
    version = match ? match[1].substring(0, 10) : '';
  }

  // Detectar sistema operacional
  let os = 'Desconhecido';
  if (cleanUserAgent.includes('Windows')) {
    os = 'Windows';
  } else if (cleanUserAgent.includes('Mac')) {
    os = 'macOS';
  } else if (cleanUserAgent.includes('Linux')) {
    os = 'Linux';
  } else if (cleanUserAgent.includes('Android')) {
    os = 'Android';
  } else if (cleanUserAgent.includes('iPhone') || cleanUserAgent.includes('iPad')) {
    os = 'iOS';
  }

  return `${browser} ${version} (${os})`;
}

// Função para sanitizar URL
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return 'N/A';
  
  try {
    const urlObj = new URL(url);
    
    // Remover parâmetros sensíveis
    const sensitiveParams = ['token', 'key', 'password', 'secret', 'auth', 'session'];
    sensitiveParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    // Limitar tamanho
    const cleanUrl = urlObj.toString();
    return cleanUrl.length > 100 ? cleanUrl.substring(0, 100) + '...' : cleanUrl;
  } catch (error) {
    // Se não for uma URL válida, retornar versão sanitizada
    return url.substring(0, 100).replace(/[<>]/g, '');
  }
}

// Função para testar webhook (apenas para desenvolvimento)
export async function testDiscordWebhook() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Teste de webhook apenas disponível em desenvolvimento');
    return false;
  }
  
  const testReport = {
    id: `test_${Date.now()}`,
    timestamp: new Date().toISOString(),
    description: 'Teste de webhook do Discord - Sistema de segurança ativo',
    email: 'teste@ludomusic.xyz',
    category: 'other',
    systemInfo: {
      userAgent: 'Test-Agent/1.0',
      url: 'https://ludomusic.xyz/test'
    },
    security: {
      clientIP: '127.0.0.1',
      userAgent: 'Test-Agent/1.0',
      referer: 'https://ludomusic.xyz',
      timestamp: Date.now()
    }
  };
  
  const result = await sendSecureDiscordReport(testReport, {});
  console.log('Resultado do teste de webhook:', result);
  return result;
}

// Função para validar configuração do webhook
export function validateWebhookConfig() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL_SECURE;
  
  if (!webhookUrl) {
    return {
      valid: false,
      error: 'DISCORD_WEBHOOK_URL_SECURE não configurado'
    };
  }
  
  if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return {
      valid: false,
      error: 'URL do webhook inválida'
    };
  }
  
  return {
    valid: true,
    message: 'Configuração do webhook válida'
  };
}
