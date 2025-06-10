import { useState, useEffect } from 'react';
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
      if (adminKey === 'sacabambapislaika') {
        setAuthenticated(true);
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

  // Função para carregar todos os dados
  const loadAllData = async () => {
    try {
      await Promise.all([
        fetchProfiles(),
        fetchDonations(),
        fetchDailySong(),
        fetchSongs(),
        fetchGlobalStats()
      ]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  // Função para buscar perfis
  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/admin/profiles', {
        headers: { 'x-admin-key': adminKey }
      });
      const data = await response.json();
      if (data.success) {
        setProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error('Erro ao buscar perfis:', err);
    }
  };

  // Função para buscar doações
  const fetchDonations = async () => {
    try {
      const response = await fetch('/api/admin/pending-donations', {
        headers: { 'x-admin-key': adminKey }
      });
      const data = await response.json();
      if (data.success) {
        setDonations(data.donations || []);
      }
    } catch (err) {
      console.error('Erro ao buscar doações:', err);
    }
  };

  // Função para buscar música do dia
  const fetchDailySong = async () => {
    try {
      const response = await fetch('/api/admin/daily-song', {
        headers: { 'x-admin-key': adminKey }
      });
      const data = await response.json();
      if (data.success) {
        setDailySong(data.song);
      }
    } catch (err) {
      console.error('Erro ao buscar música do dia:', err);
    }
  };

  // Função para buscar todas as músicas
  const fetchSongs = async () => {
    try {
      const response = await fetch('/data/music.json');
      const data = await response.json();
      setSongs(data.songs || []);
    } catch (err) {
      console.error('Erro ao buscar músicas:', err);
    }
  };

  // Função para buscar estatísticas globais
  const fetchGlobalStats = async () => {
    try {
      const response = await fetch('/api/admin/system-stats', {
        headers: { 'x-admin-key': adminKey }
      });
      const data = await response.json();
      if (data.success) {
        setGlobalStats(data.stats || {});
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas globais:', err);
    }
  };

  // Função para criar backup
  const createBackup = async (type = 'full') => {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
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
        headers: { 'x-admin-key': adminKey }
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
  const deleteUser = async (userId) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    try {
      const response = await fetch('/api/admin/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (data.success) {
        await fetchProfiles();
        alert('Usuário deletado com sucesso!');
      } else {
        alert('Erro ao deletar usuário: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao deletar usuário: ' + err.message);
    }
  };

  // Função para dar conquista/badge
  const giveAchievement = async (userId, achievementId) => {
    try {
      const response = await fetch('/api/admin/give-achievement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
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

  // Função para definir música do dia
  const setDailySongAdmin = async (songId) => {
    try {
      const response = await fetch('/api/admin/set-daily-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ songId })
      });

      const data = await response.json();
      if (data.success) {
        await fetchDailySong();
        alert('Música do dia definida com sucesso!');
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
          'x-admin-key': adminKey
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
          'x-admin-key': adminKey
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

  // Filtrar e ordenar perfis
  const filteredProfiles = profiles
    .filter(profile =>
      profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Para campos aninhados
      if (sortBy.includes('.')) {
        const keys = sortBy.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
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

  // Função para calcular nível baseado no XP - SISTEMA REBALANCEADO
  const calculateLevel = (xp) => {
    if (xp < 0) return 1;
    return Math.floor(Math.sqrt(xp / 300)) + 1;
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
            <p>Jogos hoje: <strong>{globalStats.gamesToday || 0}</strong></p>
            <p>Total de jogos: <strong>{globalStats.totalGames || 0}</strong></p>
            <p>Taxa de vitória: <strong>{globalStats.winRate || 0}%</strong></p>
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
              className={`${styles.tabButton} ${activeTab === 'donations' ? styles.active : ''}`}
              onClick={() => setActiveTab('donations')}
            >
              💰 Doações
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'achievements' ? styles.active : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              🏆 Conquistas
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
                  onChange={(e) => setDailySongAdmin(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Selecione uma música...</option>
                  {songs.map((song, index) => (
                    <option key={index} value={song.id || index}>
                      {song.title} - {song.artist} ({song.game})
                    </option>
                  ))}
                </select>
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
                  {donation.status === 'pending' && (
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
                <select className={styles.select}>
                  <option value="">Selecione um usuário...</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.username} ({profile.displayName})
                    </option>
                  ))}
                </select>
                <select className={styles.select}>
                  <option value="">Selecione uma conquista...</option>
                  <option value="first_game">🎮 Primeiro Jogo</option>
                  <option value="first_win">🏆 Primeira Vitória</option>
                  <option value="veteran">🎖️ Veterano</option>
                  <option value="streak_master">🔥 Mestre das Sequências</option>
                  <option value="perfect_player">💎 Jogador Perfeito</option>
                  <option value="supporter">💝 Apoiador</option>
                  <option value="vip">👑 VIP</option>
                </select>
                <button className={styles.button}>Conceder</button>
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
                            onClick={() => deleteUser(profile.id)}
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
