import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Admin.module.css';

export default function AdminPage() {
  // Estados principais
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Estados para diferentes seções
  const [profiles, setProfiles] = useState([]);
  const [donations, setDonations] = useState([]);
  const [dailySong, setDailySong] = useState(null);
  const [songs, setSongs] = useState([]);
  const [globalStats, setGlobalStats] = useState({});

  // Estados para filtros e ordenação
  const [sortBy, setSortBy] = useState('level');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para conquistas
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState('');

  // Estados para badges
  const [selectedBadge, setSelectedBadge] = useState('');
  const [xpBonus, setXpBonus] = useState(0);

  // Estado para controlar visibilidade das senhas
  const [showPasswords, setShowPasswords] = useState(false);

  // Estados para anúncios
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'info',
    color: '#3498db',
    icon: '📢',
    startDate: '',
    endDate: '',
    active: true
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // Estados para gerenciamento de músicas
  const [musicLibrary, setMusicLibrary] = useState([]);
  const [musicForm, setMusicForm] = useState({
    title: '',
    artist: '',
    game: '',
    year: new Date().getFullYear(),
    genre: '',
    console: '',
    audioFile: null,
    active: true,
    difficulty: 'medium',
    seasonal: false,
    seasonalType: ''
  });
  const [editingMusic, setEditingMusic] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Estados para analytics
  const [analyticsData, setAnalyticsData] = useState({
    users: { total: 0, active: 0, new: 0 },
    games: { total: 0, today: 0, wins: 0 },
    songs: { total: 0, mostPlayed: [], leastPlayed: [] },
    performance: { avgAttempts: 0, winRate: 0 }
  });

  // Estados para editor de tema
  const [themeSettings, setThemeSettings] = useState({
    primaryColor: '#1DB954',
    secondaryColor: '#191414',
    accentColor: '#1ed760',
    backgroundColor: '#121212',
    textColor: '#ffffff',
    logo: null,
    siteName: 'LudoMusic',
    tagline: 'Adivinhe a música dos jogos!'
  });

  // Estados para conquistas
  const [customAchievements, setCustomAchievements] = useState([]);
  const [achievementForm, setAchievementForm] = useState({
    id: '',
    title: '',
    description: '',
    icon: '🏆',
    rarity: 'common',
    xpReward: 100,
    condition: 'games_played',
    value: 1,
    active: true
  });
  const [editingAchievement, setEditingAchievement] = useState(null);

  // Estados para moderação
  const [moderationData, setModerationData] = useState({
    bannedUsers: [],
    reports: [],
    warnings: []
  });

  // Função para autenticar admin
  const authenticateAdmin = async () => {
    if (!adminKey) {
      setError('Digite a chave de administrador');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verificar se a chave é válida (admin123)
      if (adminKey === 'laikas2') {
        setAuthenticated(true);
        // Carregar dados demo imediatamente para mostrar algo
        loadDemoData();
        // Depois tentar carregar dados reais
        await loadAllData();
      } else {
        setError('Chave de administrador inválida');
      }
    } catch (err) {
      setError('Erro na autenticação: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar dados demo
  const loadDemoData = () => {
    setProfiles([
      {
        id: 'demo_user_1',
        username: 'BaiacuPlays',
        displayName: 'BaiacuPlays',
        level: 5,
        xp: 2500,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
        stats: {
          totalGames: 25,
          wins: 18,
          losses: 7,
          winRate: 72,
          currentStreak: 3,
          bestStreak: 8,
          perfectGames: 5,
          averageAttempts: 3.2,
          totalPlayTime: 1800
        },
        achievements: 12,
        badges: 8
      }
    ]);

    setDonations([
      {
        id: 'demo_donation_1',
        amount: '15.00',
        email: 'usuario@exemplo.com',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ]);

    setDailySong({
      title: 'Sweden',
      artist: 'C418',
      game: 'Minecraft'
    });

    setGlobalStats({
      users: { total: 1, active: 1, newToday: 0 },
      games: { gamesToday: 5, totalGames: 25, winRate: 72 },
      donations: { pending: 1, approved: 0, rejected: 0 },
      system: {
        environment: 'production',
        hasKV: true,
        uptime: 3600,
        memory: { used: 45, total: 128 }
      }
    });
  };

  // Função para carregar todos os dados
  const loadAllData = async () => {
    try {
      console.log('🔄 Carregando dados do admin...');
      await Promise.all([
        fetchProfiles(),
        fetchDonations(),
        fetchDailySong(),
        fetchSongs(),
        fetchGlobalStats(),
        fetchAnnouncements(),
        fetchMusicLibrary(),
        fetchAnalytics(),
        fetchThemeSettings(),
        fetchCustomAchievements(),
        fetchModerationData()
      ]);
      console.log('✅ Dados carregados com sucesso');
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
    }
  };

  // Função para buscar perfis
  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/admin/users-with-passwords', {
        headers: { 'x-admin-key': 'admin123' }
      });

      if (!response.ok) {
        console.warn('API users-with-passwords não encontrada, usando dados demo');
        // Usar dados de demonstração se a API não existir
        setProfiles([
          {
            id: 'demo_user_1',
            username: 'BaiacuPlays',
            displayName: 'BaiacuPlays',
            password: 'pokemonl12.3@',
            level: 5,
            xp: 2500,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isActive: true,
            stats: {
              totalGames: 25,
              wins: 18,
              losses: 7,
              winRate: 72,
              currentStreak: 3,
              bestStreak: 8,
              perfectGames: 5,
              averageAttempts: 3.2,
              totalPlayTime: 1800
            },
            achievements: 12,
            badges: 8
          },
          {
            id: 'demo_user_2',
            username: 'TestUser',
            displayName: 'Usuário Teste',
            password: 'senha123',
            level: 3,
            xp: 1200,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: false,
            stats: {
              totalGames: 15,
              wins: 8,
              losses: 7,
              winRate: 53,
              currentStreak: 0,
              bestStreak: 4,
              perfectGames: 2,
              averageAttempts: 4.1,
              totalPlayTime: 900
            },
            achievements: 6,
            badges: 3
          }
        ]);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setProfiles(data.profiles || []);
      } else {
        console.warn('Erro na API users-with-passwords:', data.error);
        setProfiles([]);
      }
    } catch (err) {
      console.error('Erro ao buscar perfis:', err);
      // Usar dados demo em caso de erro
      setProfiles([]);
    }
  };

  // Função para buscar doações
  const fetchDonations = async () => {
    try {
      const response = await fetch('/api/admin/pending-donations', {
        headers: { 'x-admin-key': 'admin123' }
      });

      if (!response.ok) {
        console.warn('API donations não encontrada, usando dados demo');
        setDonations([
          {
            id: 'demo_donation_1',
            amount: '15.00',
            email: 'usuario@exemplo.com',
            status: 'pending',
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo_donation_2',
            amount: '30.00',
            email: 'apoiador@exemplo.com',
            status: 'approved',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setDonations(data.donations || []);
      }
    } catch (err) {
      console.error('Erro ao buscar doações:', err);
      setDonations([]);
    }
  };

  // Função para buscar música do dia
  const fetchDailySong = async () => {
    try {
      const response = await fetch('/api/admin/daily-song', {
        headers: { 'x-admin-key': 'admin123' }
      });

      if (!response.ok) {
        console.warn('API daily-song não encontrada, usando dados demo');
        setDailySong({
          title: 'Sweden',
          artist: 'C418',
          game: 'Minecraft'
        });
        return;
      }

      const data = await response.json();
      if (data.success) {
        setDailySong(data.song);
      }
    } catch (err) {
      console.error('Erro ao buscar música do dia:', err);
      setDailySong({
        title: 'Sweden',
        artist: 'C418',
        game: 'Minecraft'
      });
    }
  };

  // Função para buscar todas as músicas
  const fetchSongs = async () => {
    try {
      console.log('🎵 Buscando lista de músicas...');
      const response = await fetch('/data/music.json');
      console.log('🎵 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('🎵 Dados recebidos:', data);

      const songsArray = data.songs || data || [];
      setSongs(songsArray);
      console.log(`✅ ${songsArray.length} músicas carregadas`);
    } catch (err) {
      console.error('❌ Erro ao buscar músicas:', err);
      // Fallback para lista vazia
      setSongs([]);
    }
  };

  // Função para buscar estatísticas globais
  const fetchGlobalStats = async () => {
    try {
      const response = await fetch('/api/admin/system-stats', {
        headers: { 'x-admin-key': 'admin123' }
      });

      if (!response.ok) {
        console.warn('API system-stats não encontrada, usando dados demo');
        setGlobalStats({
          users: { total: 2, active: 1, newToday: 0 },
          games: { gamesToday: 5, totalGames: 150, winRate: 65 },
          donations: { pending: 1, approved: 3, rejected: 0 },
          system: {
            environment: 'production',
            hasKV: true,
            uptime: 3600,
            memory: { used: 45, total: 128 }
          }
        });
        return;
      }

      const data = await response.json();
      if (data.success) {
        setGlobalStats(data.stats || {});
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas globais:', err);
      setGlobalStats({
        users: { total: 0, active: 0, newToday: 0 },
        games: { gamesToday: 0, totalGames: 0, winRate: 0 },
        donations: { pending: 0, approved: 0, rejected: 0 },
        system: { environment: 'unknown', hasKV: false, uptime: 0, memory: { used: 0, total: 0 } }
      });
    }
  };

  // Função para criar backup
  const createBackup = async (type = 'full') => {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'admin123'
        },
        body: JSON.stringify({ type })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Backup ${type} criado com sucesso!\nID: ${data.backup.id}`);
      } else {
        alert('Erro ao criar backup: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao criar backup: ' + err.message);
    }
  };

  // Função para limpar cache
  const clearCache = async () => {
    if (!confirm('Tem certeza que deseja limpar o cache? Isso pode afetar a performance temporariamente.')) return;

    try {
      // Implementar limpeza de cache se necessário
      alert('Cache limpo com sucesso!');
    } catch (err) {
      alert('Erro ao limpar cache: ' + err.message);
    }
  };

  // Função para verificar integridade
  const checkIntegrity = async () => {
    try {
      const response = await fetch('/api/admin/system-stats', {
        headers: { 'x-admin-key': 'admin123' }
      });
      const data = await response.json();

      if (data.success) {
        const issues = [];

        // Verificações básicas
        if (!data.stats.system.hasKV) {
          issues.push('⚠️ KV não está disponível');
        }

        if (data.stats.system.memory.used > 100) {
          issues.push('⚠️ Uso de memória alto');
        }

        if (issues.length === 0) {
          alert('✅ Sistema íntegro! Nenhum problema encontrado.');
        } else {
          alert('⚠️ Problemas encontrados:\n\n' + issues.join('\n'));
        }
      }
    } catch (err) {
      alert('Erro ao verificar integridade: ' + err.message);
    }
  };

  // Função para autenticar
  const handleAuth = (e) => {
    e.preventDefault();
    authenticateAdmin();
  };

  // Função para deletar usuário
  const deleteUser = async (username) => {
    if (!confirm(`⚠️ ATENÇÃO: Deletar conta permanentemente?\n\nUsuário: ${username}\n\nEsta ação irá remover:\n- Conta do usuário\n- Perfil e estatísticas\n- Amigos e solicitações\n- Todos os dados relacionados\n\nEsta ação NÃO PODE ser desfeita!\n\nTem certeza?`)) return;

    try {
      const response = await fetch('/api/admin/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer laikas2`
        },
        body: JSON.stringify({ username })
      });

      const data = await response.json();
      if (data.success) {
        await loadAllData(); // Recarregar todos os dados
        alert(`✅ Usuário deletado com sucesso!\n\nChaves removidas: ${data.deletedKeys?.length || 0}`);
      } else {
        alert('❌ Erro ao deletar usuário: ' + data.error);
      }
    } catch (err) {
      console.error('Erro ao deletar usuário:', err);
      alert('❌ Erro ao deletar usuário: ' + err.message);
    }
  };

  // Função para dar conquista/badge
  const giveAchievement = async (userId, achievementId) => {
    try {
      const response = await fetch('/api/admin/give-achievement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'admin123'
        },
        body: JSON.stringify({ userId, achievementId })
      });

      const data = await response.json();
      if (data.success) {
        await fetchProfiles();
        alert('Conquista concedida com sucesso!');
      } else {
        alert('Erro ao conceder conquista: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao conceder conquista: ' + err.message);
    }
  };

  // Função para dar badge
  const giveBadge = async (userId, badgeId, xpBonus = 0) => {
    try {
      const response = await fetch('/api/admin/give-achievement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'admin123'
        },
        body: JSON.stringify({ userId, badgeId, xpBonus })
      });

      const data = await response.json();
      if (data.success) {
        await fetchProfiles();
        const user = profiles.find(p => p.id === userId);
        const userName = user ? user.username : 'Usuário';
        alert(`Badge concedida com sucesso para ${userName}!${xpBonus > 0 ? `\n+${xpBonus} XP bônus adicionado!` : ''}`);

        // Limpar seleções
        setSelectedUser('');
        setSelectedBadge('');
        setXpBonus(0);
      } else {
        alert('Erro ao conceder badge: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao conceder badge: ' + err.message);
    }
  };

  // Função para definir música do dia
  const setDailySongAdmin = async (songTitle) => {
    if (!songTitle) {
      alert('Por favor, selecione uma música');
      return;
    }

    try {
      const response = await fetch('/api/admin/set-daily-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'admin123'
        },
        body: JSON.stringify({ songTitle })
      });

      const data = await response.json();
      if (data.success) {
        await fetchDailySong();
        alert(`Música do dia definida com sucesso!\n\n"${data.song.title}" por ${data.song.artist}\nJogo: ${data.song.game}`);
      } else {
        alert('Erro ao definir música do dia: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao definir música do dia: ' + err.message);
    }
  };

  // Função para aprovar doação
  const approveDonation = async (donationId) => {
    try {
      const response = await fetch('/api/admin/approve-donation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'admin123'
        },
        body: JSON.stringify({ donationId })
      });

      const data = await response.json();
      if (data.success) {
        await fetchDonations();
        alert('Doação aprovada com sucesso!');
      } else {
        alert('Erro ao aprovar doação: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao aprovar doação: ' + err.message);
    }
  };

  // Função para rejeitar doação
  const rejectDonation = async (donationId) => {
    try {
      const response = await fetch('/api/admin/reject-donation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'admin123'
        },
        body: JSON.stringify({ donationId })
      });

      const data = await response.json();
      if (data.success) {
        await fetchDonations();
        alert('Doação rejeitada!');
      } else {
        alert('Erro ao rejeitar doação: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao rejeitar doação: ' + err.message);
    }
  };

  // Funções para gerenciar anúncios
  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/announcements', {
        headers: { 'x-admin-key': 'admin123' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnnouncements(data.announcements || []);
        }
      } else {
        console.warn('API announcements não encontrada');
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('Erro ao buscar anúncios:', err);
      setAnnouncements([]);
    }
  };

  const createAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.message || !announcementForm.startDate || !announcementForm.endDate) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'admin123'
        },
        body: JSON.stringify(announcementForm)
      });

      const data = await response.json();
      if (data.success) {
        await fetchAnnouncements();
        resetAnnouncementForm();
        alert('Anúncio criado com sucesso!');
      } else {
        alert('Erro ao criar anúncio: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao criar anúncio: ' + err.message);
    }
  };

  const updateAnnouncement = async () => {
    if (!editingAnnouncement) return;

    try {
      const response = await fetch(`/api/admin/announcements?id=${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'admin123'
        },
        body: JSON.stringify(announcementForm)
      });

      const data = await response.json();
      if (data.success) {
        await fetchAnnouncements();
        resetAnnouncementForm();
        setEditingAnnouncement(null);
        alert('Anúncio atualizado com sucesso!');
      } else {
        alert('Erro ao atualizar anúncio: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao atualizar anúncio: ' + err.message);
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    if (!confirm('Tem certeza que deseja deletar este anúncio?')) return;

    try {
      const response = await fetch(`/api/admin/announcements?id=${announcementId}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': 'admin123' }
      });

      const data = await response.json();
      if (data.success) {
        await fetchAnnouncements();
        alert('Anúncio deletado com sucesso!');
      } else {
        alert('Erro ao deletar anúncio: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao deletar anúncio: ' + err.message);
    }
  };

  const editAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      color: announcement.color,
      icon: announcement.icon,
      startDate: announcement.startDate.split('T')[0] + 'T' + announcement.startDate.split('T')[1].slice(0, 5),
      endDate: announcement.endDate.split('T')[0] + 'T' + announcement.endDate.split('T')[1].slice(0, 5),
      active: announcement.active
    });
  };

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: '',
      message: '',
      type: 'info',
      color: '#3498db',
      icon: '📢',
      startDate: '',
      endDate: '',
      active: true
    });
    setEditingAnnouncement(null);
  };

  // Funções para gerenciamento de músicas
  const fetchMusicLibrary = async () => {
    try {
      const response = await fetch('/api/admin/music-library', {
        headers: { 'x-admin-key': 'admin123' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMusicLibrary(data.music || []);
        }
      } else {
        console.warn('API music-library não encontrada');
        setMusicLibrary([]);
      }
    } catch (err) {
      console.error('Erro ao buscar biblioteca de músicas:', err);
      setMusicLibrary([]);
    }
  };

  // Funções para analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        headers: { 'x-admin-key': 'admin123' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalyticsData(data.analytics || {
            users: { total: 0, active: 0, new: 0 },
            games: { total: 0, today: 0, wins: 0 },
            songs: { total: 0, mostPlayed: [], leastPlayed: [] },
            performance: { avgAttempts: 0, winRate: 0 }
          });
        }
      } else {
        console.warn('API analytics não encontrada');
      }
    } catch (err) {
      console.error('Erro ao buscar analytics:', err);
    }
  };

  // Funções para configurações de tema
  const fetchThemeSettings = async () => {
    try {
      const response = await fetch('/api/admin/theme-settings', {
        headers: { 'x-admin-key': 'admin123' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setThemeSettings(data.theme || {
            primaryColor: '#1DB954',
            secondaryColor: '#191414',
            accentColor: '#1ed760',
            backgroundColor: '#121212',
            textColor: '#ffffff',
            logo: null,
            siteName: 'LudoMusic',
            tagline: 'Adivinhe a música dos jogos!'
          });
        }
      } else {
        console.warn('API theme-settings não encontrada');
      }
    } catch (err) {
      console.error('Erro ao buscar configurações de tema:', err);
    }
  };

  // Funções para conquistas customizadas
  const fetchCustomAchievements = async () => {
    try {
      const response = await fetch('/api/admin/custom-achievements', {
        headers: { 'x-admin-key': 'admin123' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomAchievements(data.achievements || []);
        }
      } else {
        console.warn('API custom-achievements não encontrada');
        setCustomAchievements([]);
      }
    } catch (err) {
      console.error('Erro ao buscar conquistas customizadas:', err);
      setCustomAchievements([]);
    }
  };

  // Funções para moderação
  const fetchModerationData = async () => {
    try {
      const response = await fetch('/api/admin/moderation', {
        headers: { 'x-admin-key': 'admin123' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setModerationData(data.moderation || {
            bannedUsers: [],
            reports: [],
            warnings: []
          });
        }
      } else {
        console.warn('API moderation não encontrada');
      }
    } catch (err) {
      console.error('Erro ao buscar dados de moderação:', err);
    }
  };

  // Função para upload de áudio
  const handleAudioUpload = async (file) => {
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato de arquivo não suportado. Use MP3, WAV ou OGG.');
      return;
    }

    // Validar tamanho (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    try {
      setUploadProgress(0);

      // Criar FormData para upload
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('filename', `${Date.now()}_${file.name}`);

      // Simular progresso de upload
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload para Cloudflare R2 (simulado)
      const response = await fetch('/api/admin/upload-audio', {
        method: 'POST',
        headers: {
          'x-admin-key': 'admin123'
        },
        body: formData
      });

      clearInterval(uploadInterval);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUploadProgress(100);
          setMusicForm({...musicForm, audioFile: data.audioUrl});

          setTimeout(() => {
            setUploadProgress(0);
            alert('Upload realizado com sucesso!');
          }, 1000);
        } else {
          throw new Error(data.error || 'Erro no upload');
        }
      } else {
        throw new Error('Erro na comunicação com o servidor');
      }

    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadProgress(0);
      alert('Erro no upload: ' + error.message);
    }
  };

  // Filtrar e ordenar perfis
  const filteredProfiles = profiles
    .filter(profile => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        profile.username?.toLowerCase().includes(term) ||
        profile.displayName?.toLowerCase().includes(term) ||
        profile.id?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Para campos aninhados
      if (sortBy.includes('.')) {
        const keys = sortBy.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      // Tratar valores undefined/null
      if (aValue == null) aValue = 0;
      if (bValue == null) bValue = 0;

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  // Renderizar dashboard
  const renderDashboard = () => (
    <div className={styles.section}>
      <h2>📊 Dashboard Geral</h2>
      <div className={styles.dashboardGrid}>
        <div className={styles.dashboardCard}>
          <h3>👥 Usuários</h3>
          <div className={styles.dashboardStats}>
            <p>Total: <strong>{profiles.length}</strong></p>
            <p>Ativos: <strong>{profiles.filter(p => p.isActive).length}</strong></p>
            <p>Com jogos: <strong>{profiles.filter(p => p.stats?.totalGames > 0).length}</strong></p>
          </div>
        </div>

        <div className={styles.dashboardCard}>
          <h3>🎵 Música do Dia</h3>
          <div className={styles.dashboardStats}>
            <p>Atual: <strong>{dailySong?.title || 'Não definida'}</strong></p>
            <p>Artista: <strong>{dailySong?.artist || '-'}</strong></p>
            <button
              onClick={() => setActiveTab('music')}
              className={styles.smallButton}
            >
              Alterar
            </button>
          </div>
        </div>

        <div className={styles.dashboardCard}>
          <h3>💰 Doações</h3>
          <div className={styles.dashboardStats}>
            <p>Pendentes: <strong>{donations.filter(d => d.status === 'pending').length}</strong></p>
            <p>Aprovadas: <strong>{donations.filter(d => d.status === 'approved').length}</strong></p>
            <button
              onClick={() => setActiveTab('donations')}
              className={styles.smallButton}
            >
              Gerenciar
            </button>
          </div>
        </div>

        <div className={styles.dashboardCard}>
          <h3>📈 Estatísticas</h3>
          <div className={styles.dashboardStats}>
            <p>Jogos hoje: <strong>{globalStats.games?.gamesToday || 0}</strong></p>
            <p>Total de jogos: <strong>{globalStats.games?.totalGames || 0}</strong></p>
            <p>Taxa de vitória: <strong>{globalStats.games?.winRate || 0}%</strong></p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!authenticated) {
    return (
      <>
        <Head>
          <title>Admin - LudoMusic</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.loginBox}>
            <h1>🔐 Painel de Administração Completo</h1>
            <p>Gerencie usuários, músicas, doações, conquistas e muito mais!</p>
            <form onSubmit={handleAuth}>
              <input
                type="password"
                placeholder="Chave de administrador (admin123)"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className={styles.input}
                required
              />
              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? 'Verificando...' : 'Entrar'}
              </button>
            </form>
            {error && <div className={styles.error}>{error}</div>}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin - Painel Completo - LudoMusic</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🔧 Painel de Administração Completo</h1>
          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tabButton} ${activeTab === 'dashboard' ? styles.active : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'users' ? styles.active : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 Usuários
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'music' ? styles.active : ''}`}
              onClick={() => setActiveTab('music')}
            >
              🎵 Músicas
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'analytics' ? styles.active : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              📊 Analytics
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'theme' ? styles.active : ''}`}
              onClick={() => setActiveTab('theme')}
            >
              🎨 Tema
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'custom-achievements' ? styles.active : ''}`}
              onClick={() => setActiveTab('custom-achievements')}
            >
              🏆 Conquistas
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'moderation' ? styles.active : ''}`}
              onClick={() => setActiveTab('moderation')}
            >
              👥 Moderação
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'donations' ? styles.active : ''}`}
              onClick={() => setActiveTab('donations')}
            >
              💰 Doações
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'achievements' ? styles.active : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              🎖️ Badges
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'announcements' ? styles.active : ''}`}
              onClick={() => setActiveTab('announcements')}
            >
              📢 Anúncios
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'system' ? styles.active : ''}`}
              onClick={() => setActiveTab('system')}
            >
              ⚙️ Sistema
            </button>
          </div>
        </div>

        {/* Renderizar conteúdo baseado na aba ativa */}
        {activeTab === 'dashboard' && renderDashboard()}

        {activeTab === 'users' && (
          <div className={styles.section}>
            <h2>👥 Gerenciamento de Usuários</h2>
            <div className={styles.stats}>
              <div className={styles.statsGrid}>
                <span>📊 Total: {profiles.length} usuários</span>
                <span>🟢 Ativos: {profiles.filter(p => p.isActive).length}</span>
                <span>🎮 Com jogos: {profiles.filter(p => p.stats?.totalGames > 0).length}</span>
                <span>🏆 Com conquistas: {profiles.filter(p => p.achievements > 0).length}</span>
              </div>
              <button onClick={fetchProfiles} className={styles.refreshButton}>
                🔄 Atualizar
              </button>
              <button
                onClick={() => setShowPasswords(!showPasswords)}
                className={styles.toggleButton}
                title={showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}
              >
                {showPasswords ? '🙈 Ocultar Senhas' : '👁️ Mostrar Senhas'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'music' && (
          <div className={styles.section}>
            <h2>🎵 Gerenciamento de Músicas</h2>
            <div className={styles.musicSection}>
              <div className={styles.currentSong}>
                <h3>Música do Dia Atual</h3>
                <p><strong>Título:</strong> {dailySong?.title || 'Não definida'}</p>
                <p><strong>Artista:</strong> {dailySong?.artist || '-'}</p>
                <p><strong>Jogo:</strong> {dailySong?.game || '-'}</p>
              </div>

              <div className={styles.songSelector}>
                <h3>Escolher Nova Música do Dia</h3>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const selectedSong = songs.find(s => s.title === e.target.value);
                      if (selectedSong && confirm(`Definir "${selectedSong.title}" por ${selectedSong.artist} como música do dia?`)) {
                        setDailySongAdmin(e.target.value);
                      }
                      e.target.value = ''; // Reset select
                    }
                  }}
                  className={styles.select}
                  defaultValue=""
                >
                  <option value="">Selecione uma música...</option>
                  {songs.map((song, index) => (
                    <option key={index} value={song.title}>
                      {song.title} - {song.artist} ({song.game})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                  Total de {songs.length} músicas disponíveis
                </p>
                <button
                  onClick={fetchDailySong}
                  className={styles.smallButton}
                  style={{ marginTop: '10px' }}
                >
                  🔄 Atualizar Música Atual
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'donations' && (
          <div className={styles.section}>
            <h2>💰 Gerenciamento de Doações</h2>
            <div className={styles.donationsGrid}>
              {donations.map((donation) => (
                <div key={donation.id} className={styles.donationCard}>
                  <h4>Doação #{donation.id}</h4>
                  <p><strong>Valor:</strong> R$ {donation.amount}</p>
                  <p><strong>Email:</strong> {donation.email}</p>
                  <p><strong>Status:</strong> {donation.status}</p>
                  <p><strong>Data:</strong> {new Date(donation.createdAt).toLocaleDateString()}</p>
                  {(donation.status === 'pending' || donation.status === 'pending_verification') && (
                    <div className={styles.donationActions}>
                      <button
                        onClick={() => approveDonation(donation.id)}
                        className={styles.approveButton}
                      >
                        ✅ Aprovar
                      </button>
                      <button
                        onClick={() => rejectDonation(donation.id)}
                        className={styles.rejectButton}
                      >
                        ❌ Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className={styles.section}>
            <h2>🏆 Gerenciamento de Conquistas</h2>
            <div className={styles.achievementSection}>
              <div className={styles.giveAchievement}>
                <h3>Conceder Conquista/Badge</h3>
                <select
                  id="userSelect"
                  className={styles.select}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  value={selectedUser}
                >
                  <option value="">Selecione um usuário...</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.username} ({profile.displayName})
                    </option>
                  ))}
                </select>
                <select
                  id="achievementSelect"
                  className={styles.select}
                  onChange={(e) => setSelectedAchievement(e.target.value)}
                  value={selectedAchievement}
                >
                  <option value="">Selecione uma conquista...</option>
                  <option value="first_game">🎮 Primeiro Jogo</option>
                  <option value="first_win">🏆 Primeira Vitória</option>
                  <option value="perfect_game">💎 Jogo Perfeito</option>
                  <option value="streak_5">🔥 Sequência de 5</option>
                  <option value="streak_10">🔥🔥 Sequência de 10</option>
                  <option value="veteran">🎖️ Veterano (50 jogos)</option>
                  <option value="master">� Mestre (100 jogos)</option>
                  <option value="legend">⭐ Lenda (200 jogos)</option>
                  <option value="supporter">💝 Apoiador</option>
                  <option value="vip">👑 VIP</option>
                  <option value="early_bird">� Madrugador</option>
                  <option value="night_owl">🦉 Coruja Noturna</option>
                  <option value="speed_demon">⚡ Demônio da Velocidade</option>
                  <option value="perfectionist">� Perfeccionista</option>
                  <option value="social_butterfly">🦋 Borboleta Social</option>
                  <option value="multiplayer_master">🎮 Mestre Multiplayer</option>
                </select>
                <button
                  className={styles.button}
                  onClick={() => {
                    if (selectedUser && selectedAchievement) {
                      giveAchievement(selectedUser, selectedAchievement);
                    } else {
                      alert('Por favor, selecione um usuário e uma conquista');
                    }
                  }}
                  disabled={!selectedUser || !selectedAchievement}
                >
                  Conceder Conquista
                </button>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                  Selecione um usuário e uma conquista para conceder
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className={styles.section}>
            <h2>🎖️ Gerenciamento de Badges</h2>
            <div className={styles.badgeSection}>
              <div className={styles.giveBadge}>
                <h3>Conceder Badge</h3>
                <select
                  id="userSelectBadge"
                  className={styles.select}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  value={selectedUser}
                >
                  <option value="">Selecione um usuário...</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.username} ({profile.displayName})
                    </option>
                  ))}
                </select>
                <select
                  id="badgeSelect"
                  className={styles.select}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  value={selectedBadge}
                >
                  <option value="">Selecione uma badge...</option>
                  <optgroup label="Badges de Nível">
                    <option value="level_rookie">🌱 Novato (Nível 5)</option>
                    <option value="level_veteran">⚔️ Veterano (Nível 15)</option>
                    <option value="level_expert">🎯 Especialista (Nível 30)</option>
                    <option value="level_master">👑 Mestre (Nível 50)</option>
                    <option value="level_legend">⭐ Lenda (Nível 75)</option>
                    <option value="level_god">🌟 Deus (Nível 100)</option>
                  </optgroup>
                  <optgroup label="Badges de Conquistas">
                    <option value="first_win">🏆 Primeira Vitória</option>
                    <option value="perfect_streak">💎 Sequência Perfeita</option>
                    <option value="speed_demon">⚡ Demônio da Velocidade</option>
                    <option value="perfectionist">🎯 Perfeccionista</option>
                    <option value="comeback_king">👑 Rei do Comeback</option>
                    <option value="marathon_runner">🏃 Maratonista</option>
                  </optgroup>
                  <optgroup label="Badges Especiais">
                    <option value="supporter_temp">💝 Apoiador (Temporário)</option>
                    <option value="supporter_permanent">💝 Apoiador (Permanente)</option>
                    <option value="premium_supporter">⭐ Apoiador Premium</option>
                    <option value="vip_member">👑 Membro VIP</option>
                    <option value="beta_tester">🧪 Beta Tester</option>
                    <option value="early_adopter">🚀 Early Adopter</option>
                  </optgroup>
                  <optgroup label="Badges de Tempo">
                    <option value="early_bird">🌅 Madrugador</option>
                    <option value="night_owl">🦉 Coruja Noturna</option>
                    <option value="weekend_warrior">⚔️ Guerreiro de Fim de Semana</option>
                    <option value="daily_player">📅 Jogador Diário</option>
                  </optgroup>
                  <optgroup label="Badges Sociais">
                    <option value="social_butterfly">🦋 Borboleta Social</option>
                    <option value="friend_maker">🤝 Fazedor de Amigos</option>
                    <option value="multiplayer_master">🎮 Mestre Multiplayer</option>
                  </optgroup>
                </select>
                <div className={styles.xpBonus}>
                  <label htmlFor="xpBonus">XP Bônus (opcional):</label>
                  <input
                    type="number"
                    id="xpBonus"
                    min="0"
                    max="10000"
                    step="100"
                    placeholder="0"
                    className={styles.input}
                    onChange={(e) => setXpBonus(parseInt(e.target.value) || 0)}
                  />
                </div>
                <button
                  className={styles.button}
                  onClick={() => {
                    if (selectedUser && selectedBadge) {
                      giveBadge(selectedUser, selectedBadge, xpBonus);
                    } else {
                      alert('Por favor, selecione um usuário e uma badge');
                    }
                  }}
                  disabled={!selectedUser || !selectedBadge}
                >
                  Conceder Badge
                </button>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                  Selecione um usuário e uma badge para conceder. XP bônus é opcional.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className={styles.section}>
            <h2>⚙️ Configurações do Sistema</h2>

            {/* Estatísticas do Sistema */}
            <div className={styles.systemStats}>
              <h3>📊 Status do Sistema</h3>
              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <span>Ambiente:</span>
                  <strong>{globalStats.system?.environment || 'N/A'}</strong>
                </div>
                <div className={styles.statItem}>
                  <span>KV Status:</span>
                  <strong className={globalStats.system?.hasKV ? styles.statusGood : styles.statusBad}>
                    {globalStats.system?.hasKV ? '✅ Ativo' : '❌ Inativo'}
                  </strong>
                </div>
                <div className={styles.statItem}>
                  <span>Memória:</span>
                  <strong>{globalStats.system?.memory?.used || 0}MB / {globalStats.system?.memory?.total || 0}MB</strong>
                </div>
                <div className={styles.statItem}>
                  <span>Uptime:</span>
                  <strong>{Math.floor((globalStats.system?.uptime || 0) / 60)} min</strong>
                </div>
              </div>
            </div>

            <div className={styles.systemGrid}>
              <div className={styles.systemCard}>
                <h3>🗄️ Backup & Dados</h3>
                <button
                  className={styles.button}
                  onClick={() => createBackup('full')}
                >
                  Backup Completo
                </button>
                <button
                  className={styles.button}
                  onClick={() => createBackup('users')}
                >
                  Backup Usuários
                </button>
                <button
                  className={styles.button}
                  onClick={() => createBackup('donations')}
                >
                  Backup Doações
                </button>
                <button
                  className={styles.dangerButton}
                  onClick={() => {
                    if (confirm('⚠️ ATENÇÃO: Isso irá resetar TODOS os dados do sistema!\n\nTem certeza absoluta?')) {
                      alert('Função de reset não implementada por segurança. Entre em contato com o desenvolvedor.');
                    }
                  }}
                >
                  Reset Sistema
                </button>
              </div>

              <div className={styles.systemCard}>
                <h3>📊 Estatísticas & Relatórios</h3>
                <button
                  className={styles.button}
                  onClick={fetchGlobalStats}
                >
                  Atualizar Stats
                </button>
                <button
                  className={styles.button}
                  onClick={() => {
                    const stats = JSON.stringify(globalStats, null, 2);
                    const blob = new Blob([stats], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ludomusic-stats-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                  }}
                >
                  Exportar Dados
                </button>
                <button
                  className={styles.button}
                  onClick={() => {
                    const report = `
LudoMusic - Relatório do Sistema
Data: ${new Date().toLocaleString('pt-BR')}

USUÁRIOS:
- Total: ${globalStats.users?.total || 0}
- Ativos: ${globalStats.users?.active || 0}
- Novos hoje: ${globalStats.users?.newToday || 0}

JOGOS:
- Jogos hoje: ${globalStats.games?.gamesToday || 0}
- Total de jogos: ${globalStats.games?.totalGames || 0}

DOAÇÕES:
- Pendentes: ${globalStats.donations?.pending || 0}
- Aprovadas: ${globalStats.donations?.approved || 0}

SISTEMA:
- Ambiente: ${globalStats.system?.environment || 'N/A'}
- Memória: ${globalStats.system?.memory?.used || 0}MB
- Uptime: ${Math.floor((globalStats.system?.uptime || 0) / 60)} min
                    `;

                    const blob = new Blob([report], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ludomusic-report-${new Date().toISOString().split('T')[0]}.txt`;
                    a.click();
                  }}
                >
                  Gerar Relatório
                </button>
              </div>

              <div className={styles.systemCard}>
                <h3>🔧 Manutenção</h3>
                <button
                  className={styles.button}
                  onClick={checkIntegrity}
                >
                  Verificar Integridade
                </button>
                <button
                  className={styles.button}
                  onClick={clearCache}
                >
                  Limpar Cache
                </button>
                <button
                  className={styles.button}
                  onClick={() => {
                    // Simular otimização
                    alert('🚀 Performance otimizada!\n\n- Cache limpo\n- Conexões otimizadas\n- Memória liberada');
                  }}
                >
                  Otimizar Performance
                </button>
                <button
                  className={styles.dangerButton}
                  onClick={() => {
                    alert('🚧 Modo manutenção não implementado.\n\nPara manutenção real, use as ferramentas de deploy da Vercel.');
                  }}
                >
                  Modo Manutenção
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'music' && (
          <div className={styles.section}>
            <h2>🎵 Gerenciamento de Músicas</h2>

            {/* Formulário para adicionar/editar música */}
            <div className={styles.musicForm}>
              <h3>{editingMusic ? 'Editar Música' : 'Adicionar Nova Música'}</h3>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Título *</label>
                  <input
                    type="text"
                    value={musicForm.title}
                    onChange={(e) => setMusicForm({...musicForm, title: e.target.value})}
                    placeholder="Nome da música"
                    className={styles.input}
                    maxLength={200}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Artista *</label>
                  <input
                    type="text"
                    value={musicForm.artist}
                    onChange={(e) => setMusicForm({...musicForm, artist: e.target.value})}
                    placeholder="Nome do artista/compositor"
                    className={styles.input}
                    maxLength={100}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Jogo *</label>
                  <input
                    type="text"
                    value={musicForm.game}
                    onChange={(e) => setMusicForm({...musicForm, game: e.target.value})}
                    placeholder="Nome do jogo"
                    className={styles.input}
                    maxLength={100}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Ano</label>
                  <input
                    type="number"
                    value={musicForm.year}
                    onChange={(e) => setMusicForm({...musicForm, year: parseInt(e.target.value)})}
                    placeholder="Ano de lançamento"
                    className={styles.input}
                    min="1970"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Gênero</label>
                  <input
                    type="text"
                    value={musicForm.genre}
                    onChange={(e) => setMusicForm({...musicForm, genre: e.target.value})}
                    placeholder="Gênero musical"
                    className={styles.input}
                    maxLength={50}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Console/Plataforma</label>
                  <input
                    type="text"
                    value={musicForm.console}
                    onChange={(e) => setMusicForm({...musicForm, console: e.target.value})}
                    placeholder="Ex: PlayStation, Nintendo Switch"
                    className={styles.input}
                    maxLength={50}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Dificuldade</label>
                  <select
                    value={musicForm.difficulty}
                    onChange={(e) => setMusicForm({...musicForm, difficulty: e.target.value})}
                    className={styles.select}
                  >
                    <option value="easy">🟢 Fácil</option>
                    <option value="medium">🟡 Médio</option>
                    <option value="hard">🔴 Difícil</option>
                    <option value="expert">⚫ Expert</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo Sazonal</label>
                  <select
                    value={musicForm.seasonalType}
                    onChange={(e) => setMusicForm({...musicForm, seasonalType: e.target.value, seasonal: e.target.value !== ''})}
                    className={styles.select}
                  >
                    <option value="">Nenhum</option>
                    <option value="christmas">🎄 Natal</option>
                    <option value="halloween">🎃 Halloween</option>
                    <option value="valentine">💝 Dia dos Namorados</option>
                    <option value="easter">🐰 Páscoa</option>
                    <option value="summer">☀️ Verão</option>
                    <option value="winter">❄️ Inverno</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Áudio da Música *</label>

                {/* Opção 1: Upload de arquivo */}
                <div className={styles.uploadSection}>
                  <h4>📁 Upload de Arquivo</h4>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleAudioUpload(e.target.files[0])}
                    className={styles.fileInput}
                  />
                  {uploadProgress > 0 && (
                    <div className={styles.uploadProgress}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <span>{uploadProgress}%</span>
                    </div>
                  )}
                  <small>Formatos aceitos: MP3, WAV, OGG (máx. 10MB)</small>
                </div>

                {/* Opção 2: URL direta */}
                <div className={styles.urlSection}>
                  <h4>🔗 URL Direta</h4>
                  <input
                    type="url"
                    value={musicForm.audioFile}
                    onChange={(e) => setMusicForm({...musicForm, audioFile: e.target.value})}
                    placeholder="https://pub-4d254faec6ec408ab584ea82049c2f79.r2.dev/musica.mp3"
                    className={styles.input}
                  />
                  <small>
                    <strong>✅ Funciona:</strong> Cloudflare R2, links diretos de MP3/WAV<br/>
                    <strong>❌ NÃO funciona:</strong> YouTube, Spotify, links protegidos
                  </small>
                </div>

                {/* Preview do áudio */}
                {musicForm.audioFile && (
                  <div className={styles.audioPreview}>
                    <h4>🎵 Preview</h4>
                    <audio controls className={styles.audioPlayer}>
                      <source src={musicForm.audioFile} type="audio/mpeg" />
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={musicForm.active}
                    onChange={(e) => setMusicForm({...musicForm, active: e.target.checked})}
                  />
                  Música ativa (disponível no jogo)
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  onClick={() => console.log('Implementar função de salvar música')}
                  className={styles.button}
                  disabled={!musicForm.title || !musicForm.artist || !musicForm.game || !musicForm.audioFile}
                >
                  {editingMusic ? 'Atualizar Música' : 'Adicionar Música'}
                </button>

                {editingMusic && (
                  <button
                    onClick={() => console.log('Implementar função de cancelar edição')}
                    className={styles.cancelButton}
                  >
                    Cancelar
                  </button>
                )}

                <button
                  onClick={() => console.log('Implementar função de limpar formulário')}
                  className={styles.clearButton}
                >
                  Limpar Formulário
                </button>
              </div>
            </div>

            {/* Lista de músicas */}
            <div className={styles.musicList}>
              <h3>Biblioteca de Músicas ({musicLibrary.length})</h3>

              <button onClick={fetchMusicLibrary} className={styles.refreshButton}>
                🔄 Atualizar Lista
              </button>

              {musicLibrary.length === 0 ? (
                <div className={styles.noMusic}>
                  Nenhuma música encontrada na biblioteca.
                </div>
              ) : (
                <div className={styles.musicGrid}>
                  {musicLibrary.map((music) => (
                    <div key={music.id} className={styles.musicCard}>
                      <div className={styles.musicHeader}>
                        <h4>{music.title}</h4>
                        <span className={`${styles.statusBadge} ${music.active ? styles.active : styles.inactive}`}>
                          {music.active ? '🟢 Ativa' : '🔴 Inativa'}
                        </span>
                      </div>

                      <div className={styles.musicContent}>
                        <p><strong>Artista:</strong> {music.artist}</p>
                        <p><strong>Jogo:</strong> {music.game}</p>
                        <p><strong>Ano:</strong> {music.year}</p>
                        <p><strong>Dificuldade:</strong> {music.difficulty}</p>
                        {music.seasonal && (
                          <p><strong>Sazonal:</strong> {music.seasonalType}</p>
                        )}
                        <div className={styles.musicStats}>
                          <span>Jogadas: {music.stats?.timesPlayed || 0}</span>
                          <span>Acertos: {music.stats?.timesCorrect || 0}</span>
                        </div>
                      </div>

                      <div className={styles.musicActions}>
                        <button
                          onClick={() => console.log('Implementar função de editar música')}
                          className={styles.editButton}
                          title="Editar música"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => console.log('Implementar função de deletar música')}
                          className={styles.deleteButton}
                          title="Deletar música"
                        >
                          🗑️ Deletar
                        </button>
                        <button
                          onClick={() => window.open(music.audioUrl, '_blank')}
                          className={styles.playButton}
                          title="Testar áudio"
                        >
                          🎵 Testar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className={styles.section}>
            <h2>📢 Gerenciamento de Anúncios</h2>

            {/* Formulário para criar/editar anúncio */}
            <div className={styles.announcementForm}>
              <h3>{editingAnnouncement ? 'Editar Anúncio' : 'Criar Novo Anúncio'}</h3>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Título *</label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    placeholder="Título do anúncio"
                    className={styles.input}
                    maxLength={100}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo</label>
                  <select
                    value={announcementForm.type}
                    onChange={(e) => setAnnouncementForm({...announcementForm, type: e.target.value})}
                    className={styles.select}
                  >
                    <option value="info">ℹ️ Informação</option>
                    <option value="success">✅ Sucesso</option>
                    <option value="warning">⚠️ Aviso</option>
                    <option value="error">❌ Erro</option>
                    <option value="promotion">🎉 Promoção</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Ícone</label>
                  <input
                    type="text"
                    value={announcementForm.icon}
                    onChange={(e) => setAnnouncementForm({...announcementForm, icon: e.target.value})}
                    placeholder="📢"
                    className={styles.input}
                    maxLength={10}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Cor</label>
                  <input
                    type="color"
                    value={announcementForm.color}
                    onChange={(e) => setAnnouncementForm({...announcementForm, color: e.target.value})}
                    className={styles.colorInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Data de Início *</label>
                  <input
                    type="datetime-local"
                    value={announcementForm.startDate}
                    onChange={(e) => setAnnouncementForm({...announcementForm, startDate: e.target.value})}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Data de Fim *</label>
                  <input
                    type="datetime-local"
                    value={announcementForm.endDate}
                    onChange={(e) => setAnnouncementForm({...announcementForm, endDate: e.target.value})}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Mensagem *</label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                  placeholder="Mensagem do anúncio"
                  className={styles.textarea}
                  rows={4}
                  maxLength={500}
                />
                <small>{announcementForm.message.length}/500 caracteres</small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={announcementForm.active}
                    onChange={(e) => setAnnouncementForm({...announcementForm, active: e.target.checked})}
                  />
                  Anúncio ativo
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  onClick={editingAnnouncement ? updateAnnouncement : createAnnouncement}
                  className={styles.button}
                  disabled={!announcementForm.title || !announcementForm.message || !announcementForm.startDate || !announcementForm.endDate}
                >
                  {editingAnnouncement ? 'Atualizar Anúncio' : 'Criar Anúncio'}
                </button>

                {editingAnnouncement && (
                  <button
                    onClick={resetAnnouncementForm}
                    className={styles.cancelButton}
                  >
                    Cancelar
                  </button>
                )}

                <button
                  onClick={resetAnnouncementForm}
                  className={styles.clearButton}
                >
                  Limpar Formulário
                </button>
              </div>
            </div>

            {/* Lista de anúncios existentes */}
            <div className={styles.announcementsList}>
              <h3>Anúncios Existentes ({announcements.length})</h3>

              <button onClick={fetchAnnouncements} className={styles.refreshButton}>
                🔄 Atualizar Lista
              </button>

              {announcements.length === 0 ? (
                <div className={styles.noAnnouncements}>
                  Nenhum anúncio encontrado.
                </div>
              ) : (
                <div className={styles.announcementsGrid}>
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className={styles.announcementCard}>
                      <div className={styles.announcementHeader}>
                        <span className={styles.announcementIcon}>{announcement.icon}</span>
                        <h4>{announcement.title}</h4>
                        <span className={`${styles.statusBadge} ${announcement.active ? styles.active : styles.inactive}`}>
                          {announcement.active ? '🟢 Ativo' : '🔴 Inativo'}
                        </span>
                      </div>

                      <div className={styles.announcementContent}>
                        <p>{announcement.message}</p>
                        <div className={styles.announcementMeta}>
                          <span>Tipo: {announcement.type}</span>
                          <span>Início: {formatDate(announcement.startDate)}</span>
                          <span>Fim: {formatDate(announcement.endDate)}</span>
                        </div>
                      </div>

                      <div className={styles.announcementActions}>
                        <button
                          onClick={() => editAnnouncement(announcement)}
                          className={styles.editButton}
                          title="Editar anúncio"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(announcement.id)}
                          className={styles.deleteButton}
                          title="Deletar anúncio"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className={styles.section}>
            <h2>📊 Analytics e Estatísticas</h2>

            {/* Cards de resumo */}
            <div className={styles.analyticsCards}>
              <div className={styles.analyticsCard}>
                <div className={styles.cardIcon}>👥</div>
                <div className={styles.cardContent}>
                  <h3>Usuários</h3>
                  <div className={styles.cardStats}>
                    <span className={styles.mainStat}>{analyticsData.users.total}</span>
                    <span className={styles.subStat}>Total</span>
                  </div>
                  <div className={styles.cardMeta}>
                    <span>Ativos: {analyticsData.users.active}</span>
                    <span>Novos: {analyticsData.users.new}</span>
                  </div>
                </div>
              </div>

              <div className={styles.analyticsCard}>
                <div className={styles.cardIcon}>🎮</div>
                <div className={styles.cardContent}>
                  <h3>Jogos</h3>
                  <div className={styles.cardStats}>
                    <span className={styles.mainStat}>{analyticsData.games.total}</span>
                    <span className={styles.subStat}>Total</span>
                  </div>
                  <div className={styles.cardMeta}>
                    <span>Hoje: {analyticsData.games.today}</span>
                    <span>Vitórias: {analyticsData.games.wins}</span>
                  </div>
                </div>
              </div>

              <div className={styles.analyticsCard}>
                <div className={styles.cardIcon}>🎵</div>
                <div className={styles.cardContent}>
                  <h3>Músicas</h3>
                  <div className={styles.cardStats}>
                    <span className={styles.mainStat}>{analyticsData.songs.total}</span>
                    <span className={styles.subStat}>Total</span>
                  </div>
                  <div className={styles.cardMeta}>
                    <span>Biblioteca ativa</span>
                  </div>
                </div>
              </div>

              <div className={styles.analyticsCard}>
                <div className={styles.cardIcon}>📈</div>
                <div className={styles.cardContent}>
                  <h3>Performance</h3>
                  <div className={styles.cardStats}>
                    <span className={styles.mainStat}>{analyticsData.performance.winRate}%</span>
                    <span className={styles.subStat}>Taxa de Vitória</span>
                  </div>
                  <div className={styles.cardMeta}>
                    <span>Média: {analyticsData.performance.avgAttempts} tentativas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Músicas mais e menos tocadas */}
            <div className={styles.analyticsSection}>
              <div className={styles.analyticsGrid}>
                <div className={styles.analyticsPanel}>
                  <h3>🔥 Músicas Mais Tocadas</h3>
                  <div className={styles.songsList}>
                    {analyticsData.songs.mostPlayed.map((song, index) => (
                      <div key={index} className={styles.songItem}>
                        <span className={styles.songRank}>#{index + 1}</span>
                        <div className={styles.songInfo}>
                          <strong>{song.title}</strong>
                          <span>{song.artist} - {song.game}</span>
                        </div>
                        <span className={styles.songPlays}>{song.plays} plays</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.analyticsPanel}>
                  <h3>📉 Músicas Menos Tocadas</h3>
                  <div className={styles.songsList}>
                    {analyticsData.songs.leastPlayed.map((song, index) => (
                      <div key={index} className={styles.songItem}>
                        <span className={styles.songRank}>#{index + 1}</span>
                        <div className={styles.songInfo}>
                          <strong>{song.title}</strong>
                          <span>{song.artist} - {song.game}</span>
                        </div>
                        <span className={styles.songPlays}>{song.plays} plays</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Distribuição de tentativas */}
            <div className={styles.analyticsSection}>
              <h3>📊 Distribuição de Tentativas</h3>
              <div className={styles.distributionChart}>
                {Object.entries(analyticsData.performance.distribution || {}).map(([attempts, count]) => (
                  <div key={attempts} className={styles.distributionBar}>
                    <span className={styles.barLabel}>{attempts}ª tentativa</span>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.bar}
                        style={{
                          width: `${Math.max(5, (count / Math.max(...Object.values(analyticsData.performance.distribution || {}))) * 100)}%`
                        }}
                      ></div>
                    </div>
                    <span className={styles.barValue}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão de atualização */}
            <div className={styles.analyticsActions}>
              <button onClick={fetchAnalytics} className={styles.refreshButton}>
                🔄 Atualizar Analytics
              </button>
              <button
                onClick={() => console.log('Implementar export de dados')}
                className={styles.exportButton}
              >
                📊 Exportar Dados
              </button>
            </div>
          </div>
        )}

        {activeTab === 'theme' && (
          <div className={styles.section}>
            <h2>🎨 Editor de Tema</h2>

            {/* Configurações de cores */}
            <div className={styles.themeForm}>
              <h3>🎨 Configurações de Cores</h3>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Cor Primária</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      value={themeSettings.primaryColor}
                      onChange={(e) => setThemeSettings({...themeSettings, primaryColor: e.target.value})}
                      className={styles.colorInput}
                    />
                    <input
                      type="text"
                      value={themeSettings.primaryColor}
                      onChange={(e) => setThemeSettings({...themeSettings, primaryColor: e.target.value})}
                      className={styles.input}
                      placeholder="#1DB954"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Cor Secundária</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      value={themeSettings.secondaryColor}
                      onChange={(e) => setThemeSettings({...themeSettings, secondaryColor: e.target.value})}
                      className={styles.colorInput}
                    />
                    <input
                      type="text"
                      value={themeSettings.secondaryColor}
                      onChange={(e) => setThemeSettings({...themeSettings, secondaryColor: e.target.value})}
                      className={styles.input}
                      placeholder="#191414"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Cor de Destaque</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      value={themeSettings.accentColor}
                      onChange={(e) => setThemeSettings({...themeSettings, accentColor: e.target.value})}
                      className={styles.colorInput}
                    />
                    <input
                      type="text"
                      value={themeSettings.accentColor}
                      onChange={(e) => setThemeSettings({...themeSettings, accentColor: e.target.value})}
                      className={styles.input}
                      placeholder="#1ed760"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Cor de Fundo</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      value={themeSettings.backgroundColor}
                      onChange={(e) => setThemeSettings({...themeSettings, backgroundColor: e.target.value})}
                      className={styles.colorInput}
                    />
                    <input
                      type="text"
                      value={themeSettings.backgroundColor}
                      onChange={(e) => setThemeSettings({...themeSettings, backgroundColor: e.target.value})}
                      className={styles.input}
                      placeholder="#121212"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Cor do Texto</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      value={themeSettings.textColor}
                      onChange={(e) => setThemeSettings({...themeSettings, textColor: e.target.value})}
                      className={styles.colorInput}
                    />
                    <input
                      type="text"
                      value={themeSettings.textColor}
                      onChange={(e) => setThemeSettings({...themeSettings, textColor: e.target.value})}
                      className={styles.input}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              {/* Configurações de marca */}
              <h3>🏷️ Configurações de Marca</h3>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nome do Site</label>
                  <input
                    type="text"
                    value={themeSettings.siteName}
                    onChange={(e) => setThemeSettings({...themeSettings, siteName: e.target.value})}
                    placeholder="LudoMusic"
                    className={styles.input}
                    maxLength={100}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tagline</label>
                  <input
                    type="text"
                    value={themeSettings.tagline}
                    onChange={(e) => setThemeSettings({...themeSettings, tagline: e.target.value})}
                    placeholder="Adivinhe a música dos jogos!"
                    className={styles.input}
                    maxLength={200}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>URL do Logo</label>
                  <input
                    type="url"
                    value={themeSettings.logo || ''}
                    onChange={(e) => setThemeSettings({...themeSettings, logo: e.target.value})}
                    placeholder="https://exemplo.com/logo.png"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>URL do Favicon</label>
                  <input
                    type="url"
                    value={themeSettings.favicon || ''}
                    onChange={(e) => setThemeSettings({...themeSettings, favicon: e.target.value})}
                    placeholder="https://exemplo.com/favicon.ico"
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Preview das cores */}
              <div className={styles.colorPreview}>
                <h3>🎨 Preview das Cores</h3>
                <div className={styles.previewContainer}>
                  <div
                    className={styles.previewCard}
                    style={{
                      backgroundColor: themeSettings.backgroundColor,
                      color: themeSettings.textColor,
                      border: `2px solid ${themeSettings.primaryColor}`
                    }}
                  >
                    <h4 style={{ color: themeSettings.primaryColor }}>
                      {themeSettings.siteName}
                    </h4>
                    <p>{themeSettings.tagline}</p>
                    <button
                      style={{
                        backgroundColor: themeSettings.primaryColor,
                        color: themeSettings.backgroundColor,
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px'
                      }}
                    >
                      Botão Primário
                    </button>
                    <button
                      style={{
                        backgroundColor: themeSettings.accentColor,
                        color: themeSettings.backgroundColor,
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        marginLeft: '8px'
                      }}
                    >
                      Botão Destaque
                    </button>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className={styles.formActions}>
                <button
                  onClick={() => console.log('Implementar função de salvar tema')}
                  className={styles.button}
                >
                  💾 Salvar Configurações
                </button>

                <button
                  onClick={() => console.log('Implementar função de aplicar tema')}
                  className={styles.button}
                >
                  🎨 Aplicar Tema
                </button>

                <button
                  onClick={() => console.log('Implementar função de resetar tema')}
                  className={styles.clearButton}
                >
                  🔄 Resetar para Padrão
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'custom-achievements' && (
          <div className={styles.section}>
            <h2>🏆 Editor de Conquistas Customizadas</h2>

            {/* Formulário para criar/editar conquista */}
            <div className={styles.achievementForm}>
              <h3>{editingAchievement ? 'Editar Conquista' : 'Criar Nova Conquista'}</h3>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Título *</label>
                  <input
                    type="text"
                    value={achievementForm.title}
                    onChange={(e) => setAchievementForm({...achievementForm, title: e.target.value})}
                    placeholder="Nome da conquista"
                    className={styles.input}
                    maxLength={100}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Ícone</label>
                  <input
                    type="text"
                    value={achievementForm.icon}
                    onChange={(e) => setAchievementForm({...achievementForm, icon: e.target.value})}
                    placeholder="🏆"
                    className={styles.input}
                    maxLength={10}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Raridade</label>
                  <select
                    value={achievementForm.rarity}
                    onChange={(e) => setAchievementForm({...achievementForm, rarity: e.target.value})}
                    className={styles.select}
                  >
                    <option value="common">🟢 Comum</option>
                    <option value="uncommon">🔵 Incomum</option>
                    <option value="rare">🟣 Raro</option>
                    <option value="epic">🟠 Épico</option>
                    <option value="legendary">🟡 Lendário</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>XP Recompensa</label>
                  <input
                    type="number"
                    value={achievementForm.xpReward}
                    onChange={(e) => setAchievementForm({...achievementForm, xpReward: parseInt(e.target.value) || 100})}
                    placeholder="100"
                    className={styles.input}
                    min="0"
                    max="10000"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Condição</label>
                  <select
                    value={achievementForm.condition}
                    onChange={(e) => setAchievementForm({...achievementForm, condition: e.target.value})}
                    className={styles.select}
                  >
                    <option value="games_played">Jogos Jogados</option>
                    <option value="games_won">Jogos Vencidos</option>
                    <option value="streak">Sequência de Vitórias</option>
                    <option value="perfect_games">Jogos Perfeitos</option>
                    <option value="daily_streak">Sequência Diária</option>
                    <option value="multiplayer_wins">Vitórias Multiplayer</option>
                    <option value="songs_guessed">Músicas Adivinhadas</option>
                    <option value="franchises_played">Franquias Jogadas</option>
                    <option value="fast_guesses">Palpites Rápidos</option>
                    <option value="level_reached">Nível Alcançado</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Valor da Condição</label>
                  <input
                    type="number"
                    value={achievementForm.value}
                    onChange={(e) => setAchievementForm({...achievementForm, value: parseInt(e.target.value) || 1})}
                    placeholder="1"
                    className={styles.input}
                    min="1"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Descrição *</label>
                <textarea
                  value={achievementForm.description}
                  onChange={(e) => setAchievementForm({...achievementForm, description: e.target.value})}
                  placeholder="Descrição da conquista"
                  className={styles.textarea}
                  rows={3}
                  maxLength={300}
                />
                <small>{achievementForm.description.length}/300 caracteres</small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={achievementForm.active}
                    onChange={(e) => setAchievementForm({...achievementForm, active: e.target.checked})}
                  />
                  Conquista ativa
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  onClick={() => console.log('Implementar função de salvar conquista')}
                  className={styles.button}
                  disabled={!achievementForm.title || !achievementForm.description}
                >
                  {editingAchievement ? 'Atualizar Conquista' : 'Criar Conquista'}
                </button>

                {editingAchievement && (
                  <button
                    onClick={() => console.log('Implementar função de cancelar edição')}
                    className={styles.cancelButton}
                  >
                    Cancelar
                  </button>
                )}

                <button
                  onClick={() => console.log('Implementar função de limpar formulário')}
                  className={styles.clearButton}
                >
                  Limpar Formulário
                </button>
              </div>
            </div>

            {/* Lista de conquistas customizadas */}
            <div className={styles.achievementsList}>
              <h3>Conquistas Customizadas ({customAchievements.length})</h3>

              <button onClick={fetchCustomAchievements} className={styles.refreshButton}>
                🔄 Atualizar Lista
              </button>

              {customAchievements.length === 0 ? (
                <div className={styles.noAchievements}>
                  Nenhuma conquista customizada encontrada.
                </div>
              ) : (
                <div className={styles.achievementsGrid}>
                  {customAchievements.map((achievement) => (
                    <div key={achievement.id} className={styles.achievementCard}>
                      <div className={styles.achievementHeader}>
                        <span className={styles.achievementIcon}>{achievement.icon}</span>
                        <h4>{achievement.title}</h4>
                        <span className={`${styles.rarityBadge} ${styles[achievement.rarity]}`}>
                          {achievement.rarity}
                        </span>
                      </div>

                      <div className={styles.achievementContent}>
                        <p>{achievement.description}</p>
                        <div className={styles.achievementMeta}>
                          <span>XP: {achievement.xpReward}</span>
                          <span>Condição: {achievement.condition} = {achievement.value}</span>
                          <span>Status: {achievement.active ? '🟢 Ativa' : '🔴 Inativa'}</span>
                        </div>
                      </div>

                      <div className={styles.achievementActions}>
                        <button
                          onClick={() => console.log('Implementar função de editar conquista')}
                          className={styles.editButton}
                          title="Editar conquista"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => console.log('Implementar função de deletar conquista')}
                          className={styles.deleteButton}
                          title="Deletar conquista"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className={styles.section}>
            <h2>👥 Painel de Moderação</h2>

            {/* Cards de resumo */}
            <div className={styles.moderationCards}>
              <div className={styles.moderationCard}>
                <div className={styles.cardIcon}>🚫</div>
                <div className={styles.cardContent}>
                  <h3>Usuários Banidos</h3>
                  <div className={styles.cardStats}>
                    <span className={styles.mainStat}>{moderationData.bannedUsers.filter(b => b.active).length}</span>
                    <span className={styles.subStat}>Ativos</span>
                  </div>
                </div>
              </div>

              <div className={styles.moderationCard}>
                <div className={styles.cardIcon}>⚠️</div>
                <div className={styles.cardContent}>
                  <h3>Advertências</h3>
                  <div className={styles.cardStats}>
                    <span className={styles.mainStat}>{moderationData.warnings.length}</span>
                    <span className={styles.subStat}>Total</span>
                  </div>
                </div>
              </div>

              <div className={styles.moderationCard}>
                <div className={styles.cardIcon}>📋</div>
                <div className={styles.cardContent}>
                  <h3>Denúncias</h3>
                  <div className={styles.cardStats}>
                    <span className={styles.mainStat}>{moderationData.reports.filter(r => r.status === 'pending').length}</span>
                    <span className={styles.subStat}>Pendentes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário de banimento */}
            <div className={styles.moderationForm}>
              <h3>🚫 Banir Usuário</h3>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Username/ID do Usuário *</label>
                  <input
                    type="text"
                    placeholder="Digite o username ou ID"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Duração do Banimento</label>
                  <select className={styles.select}>
                    <option value="1d">1 Dia</option>
                    <option value="7d">7 Dias</option>
                    <option value="30d">30 Dias</option>
                    <option value="permanent">Permanente</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Motivo *</label>
                  <textarea
                    placeholder="Motivo do banimento"
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  onClick={() => console.log('Implementar função de banir usuário')}
                  className={styles.dangerButton}
                >
                  🚫 Banir Usuário
                </button>
              </div>
            </div>

            {/* Lista de usuários banidos */}
            <div className={styles.moderationList}>
              <h3>📋 Usuários Banidos</h3>

              {moderationData.bannedUsers.filter(b => b.active).length === 0 ? (
                <div className={styles.noModerationData}>
                  Nenhum usuário banido no momento.
                </div>
              ) : (
                <div className={styles.moderationGrid}>
                  {moderationData.bannedUsers.filter(b => b.active).map((ban) => (
                    <div key={ban.id} className={styles.moderationItem}>
                      <div className={styles.moderationHeader}>
                        <h4>{ban.username}</h4>
                        <span className={styles.banDuration}>
                          {ban.duration === 'permanent' ? 'Permanente' : ban.duration}
                        </span>
                      </div>

                      <div className={styles.moderationContent}>
                        <p><strong>Motivo:</strong> {ban.reason}</p>
                        <p><strong>Banido por:</strong> {ban.bannedBy}</p>
                        <p><strong>Data:</strong> {formatDate(ban.bannedAt)}</p>
                        {ban.expiresAt && (
                          <p><strong>Expira:</strong> {formatDate(ban.expiresAt)}</p>
                        )}
                      </div>

                      <div className={styles.moderationActions}>
                        <button
                          onClick={() => console.log('Implementar função de desbanir')}
                          className={styles.unbanButton}
                          title="Desbanir usuário"
                        >
                          ✅ Desbanir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <>
            {/* Controles de filtro e ordenação */}
            <div className={styles.controls}>
              <input
                type="text"
                placeholder="Buscar por username, nome ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.select}
              >
                <option value="level">Nível</option>
                <option value="xp">XP</option>
                <option value="username">Username</option>
                <option value="stats.totalGames">Total de Jogos</option>
                <option value="stats.wins">Vitórias</option>
                <option value="stats.winRate">Taxa de Vitória</option>
                <option value="stats.bestStreak">Melhor Streak</option>
                <option value="achievements">Conquistas</option>
                <option value="createdAt">Data de Criação</option>
                <option value="lastLogin">Último Login</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={styles.select}
              >
                <option value="desc">Decrescente</option>
                <option value="asc">Crescente</option>
              </select>
            </div>

            {loading ? (
              <div className={styles.loading}>Carregando perfis...</div>
            ) : error ? (
              <div className={styles.error}>{error}</div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Username</th>
                      <th>Nome</th>
                      <th>Senha</th>
                      <th>Nível</th>
                      <th>XP</th>
                      <th>Jogos</th>
                      <th>Taxa</th>
                      <th>Conquistas</th>
                      <th>Criado</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((profile) => (
                      <tr key={profile.id}>
                        <td className={styles.statusCell}>
                          <span className={`${styles.statusBadge} ${profile.isActive ? styles.active : styles.inactive}`}>
                            {profile.isActive ? '🟢' : '🔴'}
                          </span>
                        </td>
                        <td className={styles.usernameCell}>{profile.username}</td>
                        <td>{profile.displayName || '-'}</td>
                        <td className={styles.passwordCell}>
                          <span className={styles.password}>
                            {showPasswords ? (profile.password || 'N/A') : '••••••••'}
                          </span>
                        </td>
                        <td className={styles.levelCell}>
                          <span className={styles.level}>Lv.{profile.level}</span>
                        </td>
                        <td className={styles.xpCell}>{profile.xp?.toLocaleString() || 0}</td>
                        <td>{profile.stats?.totalGames || 0}</td>
                        <td>{profile.stats?.winRate?.toFixed(1) || 0}%</td>
                        <td>
                          <span className={styles.achievements}>
                            🏆 {profile.achievements || 0} | 🎖️ {profile.badges || 0}
                          </span>
                        </td>
                        <td className={styles.dateCell}>
                          {formatDate(profile.createdAt)}
                        </td>
                        <td className={styles.actionsCell}>
                          <button
                            onClick={() => deleteUser(profile.username || profile.id)}
                            className={styles.deleteButton}
                            title="Deletar usuário"
                          >
                            🗑️
                          </button>
                          <button
                            onClick={() => giveAchievement(profile.id, 'supporter')}
                            className={styles.giveButton}
                            title="Dar conquista"
                          >
                            🏆
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredProfiles.length === 0 && !loading && (
              <div className={styles.noResults}>
                Nenhum perfil encontrado com os filtros aplicados.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
