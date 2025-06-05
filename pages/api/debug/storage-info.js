import { localUsers, localProfiles, localSessions } from '../../../utils/storage';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const usersData = [];
    const profilesData = [];
    const sessionsData = [];

    // Listar todos os dados do localUsers
    for (const [key, value] of localUsers.entries()) {
      usersData.push({
        key,
        username: value?.username,
        displayName: value?.displayName,
        data: value
      });
    }

    // Listar todos os dados do localProfiles
    for (const [key, value] of localProfiles.entries()) {
      profilesData.push({
        key,
        username: value?.username,
        data: value
      });
    }

    // Listar todos os dados do localSessions
    for (const [key, value] of localSessions.entries()) {
      sessionsData.push({
        key,
        username: value?.username,
        data: value
      });
    }

    return res.status(200).json({
      success: true,
      storage: {
        users: {
          count: localUsers.size,
          data: usersData
        },
        profiles: {
          count: localProfiles.size,
          data: profilesData
        },
        sessions: {
          count: localSessions.size,
          data: sessionsData
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar informações de storage:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
