export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { description, email, category, systemInfo, type } = req.body;

    // Validações básicas
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }

    if (!category) {
      return res.status(400).json({ error: 'Categoria é obrigatória' });
    }

    // Preparar dados do relatório
    const reportData = {
      id: `bug_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      description: description.trim(),
      email: email?.trim() || 'Não informado',
      category,
      systemInfo: systemInfo || {},
      type: type || 'user_report'
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

    // Enviar para Discord se webhook estiver configurado
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (discordWebhookUrl) {
      try {
        const discordPayload = {
          username: 'LudoMusic Bug Reporter',
          avatar_url: 'https://ludomusic.xyz/favicon.ico',
          embeds: [embed]
        };

        const discordResponse = await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(discordPayload)
        });

        if (!discordResponse.ok) {
          console.error('Erro ao enviar para Discord:', await discordResponse.text());
        } else {
          console.log('✅ Relatório enviado para Discord com sucesso');
        }
      } catch (error) {
        console.error('Erro ao enviar para Discord:', error);
      }
    }

    // Log local para backup
    console.log('📝 Novo relatório de bug:', {
      id: reportData.id,
      category,
      email: email || 'Não informado',
      timestamp: reportData.timestamp
    });

    res.status(200).json({ 
      success: true, 
      id: reportData.id,
      message: 'Relatório enviado com sucesso!' 
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
