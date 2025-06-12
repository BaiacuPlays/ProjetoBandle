// Fallback para desenvolvimento local com anúncio de teste
let localAnnouncements = [
  {
    id: 'welcome_announcement',
    title: '🎮 Bem-vindo ao LudoMusic!',
    message: 'Sistema de anúncios customizados funcionando! Agora você pode criar anúncios personalizados através do painel de administração.',
    type: 'info',
    color: '#3498db',
    icon: '🎵',
    startDate: new Date(Date.now() - 60000).toISOString(), // 1 minuto atrás
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias no futuro
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Tentar importar KV, mas usar fallback se não estiver disponível
let kv = null;
try {
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
} catch (error) {
  console.log('⚠️ Vercel KV não disponível, usando armazenamento local');
}

// Funções de armazenamento com fallback
const getAnnouncements = async () => {
  if (kv) {
    try {
      return await kv.get('admin:announcements') || [];
    } catch (error) {
      console.warn('Erro ao acessar KV, usando fallback local:', error);
      return localAnnouncements;
    }
  }
  return localAnnouncements;
};

const setAnnouncements = async (announcements) => {
  if (kv) {
    try {
      await kv.set('admin:announcements', announcements);
      return;
    } catch (error) {
      console.warn('Erro ao salvar no KV, usando fallback local:', error);
    }
  }
  localAnnouncements = announcements;
};

// Função para sanitizar entrada
function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

// Função para validar data
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

export default async function handler(req, res) {
  const { method } = req;
  const adminKey = req.headers['x-admin-key'];

  try {
    if (method === 'GET') {
      // Para buscar anúncios ativos, não precisa de autenticação admin
      const { active_only } = req.query;

      if (active_only === 'true') {
        // Acesso público para anúncios ativos
        const announcements = await getAnnouncements();
        const now = new Date();
        const activeAnnouncements = announcements.filter(announcement => {
          if (!announcement.active) return false;

          const startDate = new Date(announcement.startDate);
          const endDate = new Date(announcement.endDate);

          return now >= startDate && now <= endDate;
        });

        return res.status(200).json({
          success: true,
          announcements: activeAnnouncements
        });
      }

      // Para buscar todos os anúncios, precisa de autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }
      // Buscar todos os anúncios (apenas admin)
      const allAnnouncements = await getAnnouncements();

      return res.status(200).json({
        success: true,
        announcements: allAnnouncements
      });

    } else if (method === 'POST') {
      // Verificar autenticação admin para criar anúncios
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }
      // Criar novo anúncio
      const {
        title,
        message,
        type = 'info',
        color = '#3498db',
        icon = '📢',
        startDate,
        endDate,
        active = true
      } = req.body;

      // Validações
      if (!title || !message) {
        return res.status(400).json({
          error: 'Título e mensagem são obrigatórios'
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Data de início e fim são obrigatórias'
        });
      }

      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return res.status(400).json({
          error: 'Datas inválidas'
        });
      }

      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({
          error: 'Data de início deve ser anterior à data de fim'
        });
      }

      // Criar novo anúncio
      const newAnnouncement = {
        id: `announcement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: sanitizeInput(title, 100),
        message: sanitizeInput(message, 500),
        type: sanitizeInput(type, 20),
        color: sanitizeInput(color, 20),
        icon: sanitizeInput(icon, 10),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        active: Boolean(active),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Buscar anúncios existentes
      const announcements = await getAnnouncements();

      // Adicionar novo anúncio
      announcements.push(newAnnouncement);

      // Salvar
      await setAnnouncements(announcements);

      return res.status(201).json({
        success: true,
        announcement: newAnnouncement,
        message: 'Anúncio criado com sucesso'
      });

    } else if (method === 'PUT') {
      // Verificar autenticação admin para atualizar anúncios
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      // Atualizar anúncio existente
      const { id } = req.query;
      const {
        title,
        message,
        type,
        color,
        icon,
        startDate,
        endDate,
        active
      } = req.body;

      if (!id) {
        return res.status(400).json({
          error: 'ID do anúncio é obrigatório'
        });
      }

      // Buscar anúncios existentes
      const announcements = await getAnnouncements();

      // Encontrar anúncio
      const announcementIndex = announcements.findIndex(a => a.id === id);
      if (announcementIndex === -1) {
        return res.status(404).json({
          error: 'Anúncio não encontrado'
        });
      }

      // Validar datas se fornecidas
      if (startDate && !isValidDate(startDate)) {
        return res.status(400).json({
          error: 'Data de início inválida'
        });
      }

      if (endDate && !isValidDate(endDate)) {
        return res.status(400).json({
          error: 'Data de fim inválida'
        });
      }

      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({
          error: 'Data de início deve ser anterior à data de fim'
        });
      }

      // Atualizar anúncio
      const updatedAnnouncement = {
        ...announcements[announcementIndex],
        ...(title && { title: sanitizeInput(title, 100) }),
        ...(message && { message: sanitizeInput(message, 500) }),
        ...(type && { type: sanitizeInput(type, 20) }),
        ...(color && { color: sanitizeInput(color, 20) }),
        ...(icon && { icon: sanitizeInput(icon, 10) }),
        ...(startDate && { startDate: new Date(startDate).toISOString() }),
        ...(endDate && { endDate: new Date(endDate).toISOString() }),
        ...(active !== undefined && { active: Boolean(active) }),
        updatedAt: new Date().toISOString()
      };

      announcements[announcementIndex] = updatedAnnouncement;

      // Salvar
      await setAnnouncements(announcements);

      return res.status(200).json({
        success: true,
        announcement: updatedAnnouncement,
        message: 'Anúncio atualizado com sucesso'
      });

    } else if (method === 'DELETE') {
      // Verificar autenticação admin para deletar anúncios
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      // Deletar anúncio
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          error: 'ID do anúncio é obrigatório'
        });
      }

      // Buscar anúncios existentes
      const announcements = await getAnnouncements();

      // Filtrar anúncio a ser deletado
      const filteredAnnouncements = announcements.filter(a => a.id !== id);

      if (filteredAnnouncements.length === announcements.length) {
        return res.status(404).json({
          error: 'Anúncio não encontrado'
        });
      }

      // Salvar
      await setAnnouncements(filteredAnnouncements);

      return res.status(200).json({
        success: true,
        message: 'Anúncio deletado com sucesso'
      });

    } else {
      return res.status(405).json({
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('Erro na API de anúncios:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
