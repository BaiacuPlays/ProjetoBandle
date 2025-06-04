import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FaUsers, FaTrash } from 'react-icons/fa';
import styles from '../styles/Admin.module.css';

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, active, inactive
  const [stats, setStats] = useState({});
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const authenticateAdmin = async () => {
    if (!adminPassword) {
      alert('Digite a senha de admin');
      return;
    }

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setError('');
      } else {
        setError('Senha de admin incorreta');
      }
    } catch (err) {
      setError('Erro ao autenticar - servidor pode estar offline');
    }
  };

  // Modo emergência para entrar sem servidor
  const emergencyLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAuthenticated(true);
      setError('');
      // Carregar dados demo
      setAccounts([
        {
          username: 'demouser',
          displayName: 'Usuário Demo',
          email: 'demo@example.com',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastLoginAt: new Date().toISOString()
        },
        {
          username: 'testuser',
          displayName: 'Usuário Teste',
          email: 'test@example.com',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
      setProfiles([
        {
          username: 'demouser',
          level: 5,
          xp: 2500,
          stats: { totalGames: 25, wins: 18 }
        },
        {
          username: 'testuser',
          level: 3,
          xp: 900,
          stats: { totalGames: 12, wins: 8 }
        }
      ]);
      calculateStats([
        {
          username: 'demouser',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastLoginAt: new Date().toISOString()
        },
        {
          username: 'testuser',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ], [
        { username: 'demouser', xp: 2500 },
        { username: 'testuser', xp: 900 }
      ]);
      setLoading(false);
    } else {
      setError('Senha incorreta');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar contas e perfis em paralelo
      const [accountsResponse, profilesResponse] = await Promise.all([
        fetch('/api/admin/accounts', {
          headers: { 'Authorization': `Bearer ${adminPassword}` }
        }),
        fetch('/api/admin/profiles', {
          headers: { 'Authorization': `Bearer ${adminPassword}` }
        })
      ]);

      if (!accountsResponse.ok || !profilesResponse.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const accountsData = await accountsResponse.json();
      const profilesData = await profilesResponse.json();

      setAccounts(accountsData.accounts || []);
      setProfiles(profilesData.profiles || []);

      // Calcular estatísticas
      calculateStats(accountsData.accounts || [], profilesData.profiles || []);

    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (accountsList, profilesList) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeUsers = accountsList.filter(acc =>
      acc.lastLoginAt && new Date(acc.lastLoginAt) > oneWeekAgo
    );

    const newUsersThisWeek = accountsList.filter(acc =>
      new Date(acc.createdAt) > oneWeekAgo
    );

    const newUsersThisMonth = accountsList.filter(acc =>
      new Date(acc.createdAt) > oneMonthAgo
    );

    const totalXP = profilesList.reduce((sum, profile) => sum + (profile.xp || 0), 0);
    const avgXP = profilesList.length > 0 ? Math.round(totalXP / profilesList.length) : 0;

    setStats({
      totalAccounts: accountsList.length,
      activeUsers: activeUsers.length,
      newUsersThisWeek: newUsersThisWeek.length,
      newUsersThisMonth: newUsersThisMonth.length,
      totalXP,
      avgXP
    });
  };

  const getAccountProfile = (username) => {
    return profiles.find(profile => profile.username === username);
  };

  const filteredAccounts = accounts
    .filter(account => {
      // Filtro de busca
      const matchesSearch = account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (account.displayName && account.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Filtro por tipo
      if (filterType === 'active') {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return account.lastLoginAt && new Date(account.lastLoginAt) > oneWeekAgo;
      } else if (filterType === 'inactive') {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return !account.lastLoginAt || new Date(account.lastLoginAt) <= oneWeekAgo;
      }

      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Para campos de perfil
      if (sortBy === 'xp' || sortBy === 'level') {
        const aProfile = getAccountProfile(a.username);
        const bProfile = getAccountProfile(b.username);
        aValue = aProfile?.[sortBy] || 0;
        bValue = bProfile?.[sortBy] || 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Nunca';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    return `${Math.floor(diffDays / 30)} meses atrás`;
  };

  // Tela de autenticação
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin - Autenticação | LudoMusic</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>

        <div className={styles.container}>
          <div className={styles.authContainer}>
            <h1>🔐 Acesso Administrativo</h1>
            <div className={styles.authForm}>
              <input
                type="password"
                placeholder="Senha de administrador (admin123)"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && authenticateAdmin()}
                className={styles.passwordInput}
              />
              <button onClick={authenticateAdmin} className={styles.authButton}>
                Entrar
              </button>
              {error && <div className={styles.authError}>{error}</div>}

              {/* Botão de emergência */}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  onClick={emergencyLogin}
                  className={styles.authButton}
                  style={{ background: '#dc2626', marginTop: '10px' }}
                >
                  🚨 Modo Emergência (Offline)
                </button>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                  Use apenas se o servidor não estiver respondendo
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}>⟳</div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Erro ao carregar dados</h2>
          <p>{error}</p>
          <button onClick={loadData} className={styles.retryButton}>
            ⟳ Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const exportData = () => {
    if (filteredAccounts.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    const csvData = filteredAccounts.map(account => {
      const profile = getAccountProfile(account.username);
      return {
        username: account.username,
        displayName: account.displayName || '',
        email: account.email || '',
        createdAt: account.createdAt,
        lastLoginAt: account.lastLoginAt || '',
        xp: profile?.xp || 0,
        level: profile?.level || 1,
        gamesPlayed: profile?.stats?.totalGames || 0,
        wins: profile?.stats?.wins || 0
      };
    });

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ludomusic-accounts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const viewProfile = (account) => {
    setSelectedAccount(account);
    setShowProfileModal(true);
  };

  const deleteAccount = async (username) => {
    if (!confirm(`⚠️ ATENÇÃO: Deletar conta permanentemente?\n\nUsuário: ${username}\n\nEsta ação irá remover:\n- Conta do usuário\n- Perfil e estatísticas\n- Amigos e solicitações\n- Todos os dados relacionados\n\nEsta ação NÃO PODE ser desfeita!\n\nTem certeza?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminPassword}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`✅ Conta deletada com sucesso!\n\nUsuário: ${username}\nChaves removidas: ${result.deletedKeys?.length || 0}`);
        // Recarregar dados
        await loadData();
      } else {
        alert(`❌ Erro ao deletar conta: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      alert(`❌ Erro ao deletar conta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin - Contas de Usuário | LudoMusic</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1><FaUsers /> Administração - Contas de Usuário</h1>
            <div className={styles.headerActions}>
              <button onClick={exportData} className={styles.exportButton}>
                💾 Exportar CSV
              </button>
              <button onClick={loadData} className={styles.refreshButton}>
                ⟳ Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total de Contas</h3>
            <p className={styles.statNumber}>{stats.totalAccounts}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Usuários Ativos (7 dias)</h3>
            <p className={styles.statNumber}>{stats.activeUsers}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Novos Esta Semana</h3>
            <p className={styles.statNumber}>{stats.newUsersThisWeek}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Novos Este Mês</h3>
            <p className={styles.statNumber}>{stats.newUsersThisMonth}</p>
          </div>
          <div className={styles.statCard}>
            <h3>XP Total</h3>
            <p className={styles.statNumber}>{stats.totalXP?.toLocaleString()}</p>
          </div>
          <div className={styles.statCard}>
            <h3>XP Médio</h3>
            <p className={styles.statNumber}>{stats.avgXP}</p>
          </div>
        </div>

        {/* Controles */}
        <div className={styles.controls}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="🔍 Buscar por username, email ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filtersContainer}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Todos os usuários</option>
              <option value="active">Ativos (7 dias)</option>
              <option value="inactive">Inativos</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="createdAt">Data de Criação</option>
              <option value="lastLoginAt">Último Login</option>
              <option value="username">Username</option>
              <option value="xp">XP</option>
              <option value="level">Nível</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </select>
          </div>
        </div>

        {/* Lista de contas */}
        <div className={styles.accountsList}>
          <div className={styles.resultsHeader}>
            <p>Mostrando {filteredAccounts.length} de {accounts.length} contas</p>
          </div>

          {filteredAccounts.map((account, index) => {
            const profile = getAccountProfile(account.username);
            const isActive = account.lastLoginAt &&
              new Date(account.lastLoginAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            return (
              <div key={account.username} className={`${styles.accountCard} ${isActive ? styles.activeAccount : ''}`}>
                <div className={styles.accountHeader}>
                  <div className={styles.accountInfo}>
                    <h3>{account.displayName || account.username}</h3>
                    <span className={styles.accountUsername}>@{account.username}</span>
                    {isActive && <span className={styles.activeBadge}>Ativo</span>}
                  </div>
                  <div className={styles.accountActions}>
                    <button
                      onClick={() => viewProfile(account)}
                      className={styles.viewButton}
                      title="Ver perfil completo"
                    >
                      👁️ Ver
                    </button>
                    <button
                      onClick={() => deleteAccount(account.username)}
                      className={styles.deleteButton}
                      title="Deletar conta permanentemente"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className={styles.accountDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Email:</span>
                    <span>{account.email || 'Não informado'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Criado:</span>
                    <span>{formatTimeAgo(account.createdAt)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Último login:</span>
                    <span>{formatTimeAgo(account.lastLoginAt)}</span>
                  </div>
                  {profile && (
                    <>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Nível:</span>
                        <span>{profile.level || 1}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>XP:</span>
                        <span>{(profile.xp || 0).toLocaleString()}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Jogos:</span>
                        <span>{profile.stats?.totalGames || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredAccounts.length === 0 && (
          <div className={styles.noResults}>
            <div style={{fontSize: '48px'}}>🔍</div>
            <h3>Nenhuma conta encontrada</h3>
            <p>Tente ajustar os filtros de busca.</p>
          </div>
        )}

        {/* Modal de perfil detalhado */}
        {showProfileModal && selectedAccount && (
          <div className={styles.modal} onClick={() => setShowProfileModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Perfil Detalhado</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className={styles.closeButton}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <ProfileDetails account={selectedAccount} profile={getAccountProfile(selectedAccount.username)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Componente para detalhes do perfil
function ProfileDetails({ account, profile }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Não disponível';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className={styles.profileDetails}>
      <h3>Informações da Conta</h3>
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <label>Username:</label>
          <span>{account.username}</span>
        </div>
        <div className={styles.infoItem}>
          <label>Nome de Exibição:</label>
          <span>{account.displayName || 'Não definido'}</span>
        </div>
        <div className={styles.infoItem}>
          <label>Email:</label>
          <span>{account.email || 'Não informado'}</span>
        </div>
        <div className={styles.infoItem}>
          <label>Data de Criação:</label>
          <span>{formatDate(account.createdAt)}</span>
        </div>
        <div className={styles.infoItem}>
          <label>Último Login:</label>
          <span>{formatDate(account.lastLoginAt)}</span>
        </div>
      </div>

      {profile && (
        <>
          <h3>Estatísticas do Jogo</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Nível:</label>
              <span>{profile.level || 1}</span>
            </div>
            <div className={styles.infoItem}>
              <label>XP Total:</label>
              <span>{(profile.xp || 0).toLocaleString()}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Jogos Totais:</label>
              <span>{profile.stats?.totalGames || 0}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Vitórias:</label>
              <span>{profile.stats?.wins || 0}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Taxa de Vitória:</label>
              <span>{profile.stats?.winRate ? `${profile.stats.winRate.toFixed(1)}%` : '0%'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Sequência Atual:</label>
              <span>{profile.stats?.currentStreak || 0}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Melhor Sequência:</label>
              <span>{profile.stats?.bestStreak || 0}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Conquistas:</label>
              <span>{profile.achievements?.length || 0}</span>
            </div>
          </div>

          {profile.socialStats && (
            <>
              <h3>Estatísticas Sociais</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Amigos:</label>
                  <span>{profile.socialStats.friendsCount || 0}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Amigos Referidos:</label>
                  <span>{profile.socialStats.friendsReferred || 0}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Jogos Multiplayer:</label>
                  <span>{profile.socialStats.multiplayerGamesPlayed || 0}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Vitórias Multiplayer:</label>
                  <span>{profile.socialStats.multiplayerWins || 0}</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
