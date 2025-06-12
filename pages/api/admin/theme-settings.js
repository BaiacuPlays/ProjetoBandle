// Fallback para desenvolvimento local
let localThemeSettings = {
  primaryColor: '#1DB954',
  secondaryColor: '#191414',
  accentColor: '#1ed760',
  backgroundColor: '#121212',
  textColor: '#ffffff',
  logo: null,
  siteName: 'LudoMusic',
  tagline: 'Adivinhe a música dos jogos!',
  customCSS: '',
  favicon: null,
  socialImage: null
};

// Tentar importar KV, mas usar fallback se não estiver disponível
let kv = null;
try {
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
} catch (error) {
  console.log('⚠️ Vercel KV não disponível, usando armazenamento local');
}

// Funções de armazenamento com fallback
const getThemeSettings = async () => {
  if (kv) {
    try {
      return await kv.get('admin:theme_settings') || localThemeSettings;
    } catch (error) {
      console.warn('Erro ao acessar KV, usando fallback local:', error);
      return localThemeSettings;
    }
  }
  return localThemeSettings;
};

const setThemeSettings = async (settings) => {
  if (kv) {
    try {
      await kv.set('admin:theme_settings', settings);
      return;
    } catch (error) {
      console.warn('Erro ao salvar no KV, usando fallback local:', error);
    }
  }
  localThemeSettings = settings;
};

// Função para sanitizar entrada
function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

// Função para validar cor hexadecimal
function isValidHexColor(color) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

export default async function handler(req, res) {
  const { method } = req;
  const adminKey = req.headers['x-admin-key'];

  try {
    if (method === 'GET') {
      // Para buscar configurações públicas, não precisa de autenticação
      const { public_only } = req.query;
      
      if (public_only === 'true') {
        const settings = await getThemeSettings();
        
        // Retornar apenas configurações públicas
        return res.status(200).json({
          success: true,
          theme: {
            primaryColor: settings.primaryColor,
            secondaryColor: settings.secondaryColor,
            accentColor: settings.accentColor,
            backgroundColor: settings.backgroundColor,
            textColor: settings.textColor,
            siteName: settings.siteName,
            tagline: settings.tagline,
            logo: settings.logo,
            favicon: settings.favicon,
            socialImage: settings.socialImage
          }
        });
      }
      
      // Para buscar todas as configurações, precisa de autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      const settings = await getThemeSettings();
      
      return res.status(200).json({
        success: true,
        theme: settings
      });

    } else if (method === 'POST' || method === 'PUT') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      const {
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor,
        logo,
        siteName,
        tagline,
        customCSS,
        favicon,
        socialImage
      } = req.body;

      // Buscar configurações atuais
      const currentSettings = await getThemeSettings();

      // Validar cores se fornecidas
      const colors = { primaryColor, secondaryColor, accentColor, backgroundColor, textColor };
      for (const [key, color] of Object.entries(colors)) {
        if (color && !isValidHexColor(color)) {
          return res.status(400).json({
            error: `Cor inválida para ${key}. Use formato hexadecimal (#RRGGBB)`
          });
        }
      }

      // Atualizar configurações
      const updatedSettings = {
        ...currentSettings,
        ...(primaryColor && { primaryColor: sanitizeInput(primaryColor, 7) }),
        ...(secondaryColor && { secondaryColor: sanitizeInput(secondaryColor, 7) }),
        ...(accentColor && { accentColor: sanitizeInput(accentColor, 7) }),
        ...(backgroundColor && { backgroundColor: sanitizeInput(backgroundColor, 7) }),
        ...(textColor && { textColor: sanitizeInput(textColor, 7) }),
        ...(logo !== undefined && { logo: sanitizeInput(logo, 500) }),
        ...(siteName && { siteName: sanitizeInput(siteName, 100) }),
        ...(tagline && { tagline: sanitizeInput(tagline, 200) }),
        ...(customCSS !== undefined && { customCSS: sanitizeInput(customCSS, 10000) }),
        ...(favicon !== undefined && { favicon: sanitizeInput(favicon, 500) }),
        ...(socialImage !== undefined && { socialImage: sanitizeInput(socialImage, 500) }),
        updatedAt: new Date().toISOString()
      };

      // Salvar
      await setThemeSettings(updatedSettings);

      return res.status(200).json({
        success: true,
        theme: updatedSettings,
        message: 'Configurações de tema atualizadas com sucesso'
      });

    } else if (method === 'DELETE') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      // Resetar para configurações padrão
      const defaultSettings = {
        primaryColor: '#1DB954',
        secondaryColor: '#191414',
        accentColor: '#1ed760',
        backgroundColor: '#121212',
        textColor: '#ffffff',
        logo: null,
        siteName: 'LudoMusic',
        tagline: 'Adivinhe a música dos jogos!',
        customCSS: '',
        favicon: null,
        socialImage: null,
        updatedAt: new Date().toISOString()
      };

      // Salvar
      await setThemeSettings(defaultSettings);

      return res.status(200).json({
        success: true,
        theme: defaultSettings,
        message: 'Configurações de tema resetadas para o padrão'
      });

    } else {
      return res.status(405).json({
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('Erro na API de configurações de tema:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
