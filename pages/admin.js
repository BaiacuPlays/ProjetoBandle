import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Admin.module.css';

export default function AdminPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [sortBy, setSortBy] = useState('level');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Função para buscar perfis
  const fetchProfiles = async () => {
    if (!adminKey) {
      setError('Digite a chave de administrador');
      return;
    }

    setLoading(true);
    setError('');

    // Timeout de 10 segundos
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Timeout: Servidor não respondeu em 10 segundos. Verifique se o servidor está rodando.');
    }, 10000);

    try {
      console.log('🔑 Tentando autenticar com chave:', adminKey);

      const controller = new AbortController();
      const timeoutSignal = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/admin/profiles', {
        headers: {
          'x-admin-key': adminKey
        },
        signal: controller.signal
      });

      clearTimeout(timeoutSignal);
      clearTimeout(timeoutId);

      console.log('📡 Resposta da API:', response.status, response.statusText);

      const data = await response.json();
      console.log('📊 Dados recebidos:', data);

      if (data.success) {
        setProfiles(data.profiles);
        setAuthenticated(true);
        console.log('✅ Autenticação bem-sucedida');
      } else {
        setError(data.error || 'Erro ao carregar perfis');
        setAuthenticated(false);
        console.log('❌ Erro na autenticação:', data.error);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('❌ Erro de conexão:', err);

      if (err.name === 'AbortError') {
        setError('Timeout: Servidor demorou muito para responder. Verifique se está rodando.');
      } else {
        setError('Erro de conexão: ' + err.message + '. Verifique se o servidor está rodando.');
      }
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Função para autenticar
  const handleAuth = (e) => {
    e.preventDefault();
    fetchProfiles();
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

  if (!authenticated) {
    return (
      <>
        <Head>
          <title>Admin - LudoMusic</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.loginBox}>
            <h1>🔐 Painel de Administração</h1>
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

            {/* Botão de emergência para entrar sem servidor */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  if (adminKey === 'admin123') {
                    setAuthenticated(true);
                    setProfiles([
                      {
                        id: 'demo_user_1',
                        username: 'DemoUser',
                        displayName: 'Usuário Demo',
                        level: 5,
                        xp: 2500,
                        createdAt: new Date().toISOString(),
                        lastLogin: new Date().toISOString(),
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
                        socialStats: {
                          multiplayerGamesPlayed: 5,
                          multiplayerWins: 3,
                          friendsAdded: 2,
                          gamesShared: 8,
                          socialInteractions: 15
                        },
                        achievements: 12,
                        badges: 8,
                        gameHistory: 25,
                        isActive: true,
                        daysSinceCreation: 30,
                        daysSinceLastLogin: 0
                      }
                    ]);
                  } else {
                    setError('Senha incorreta');
                  }
                }}
                className={styles.button}
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
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin - Perfis de Usuários - LudoMusic</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🔧 Painel de Administração</h1>
          <div className={styles.adminNav}>
            <a href="/admin-donations" className={styles.navButton}>
              🎁 Gerenciar Doações PIX
            </a>
            <a href="/admin-accounts" className={styles.navButton}>
              👥 Gerenciar Contas
            </a>
          </div>
        </div>

        <div className={styles.section}>
          <h2>👥 Perfis de Usuários</h2>
          <div className={styles.stats}>
            <div className={styles.statsGrid}>
              <span>📊 Total: {profiles.length} usuários</span>
              <span>🟢 Ativos: {profiles.filter(p => p.isActive).length}</span>
              <span>🎮 Com jogos: {profiles.filter(p => p.stats.totalGames > 0).length}</span>
              <span>🏆 Com conquistas: {profiles.filter(p => p.achievements > 0).length}</span>
            </div>
            <button onClick={fetchProfiles} className={styles.refreshButton}>
              🔄 Atualizar
            </button>
          </div>
        </div>

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
            <option value="socialStats.multiplayerGamesPlayed">Jogos Multiplayer</option>
            <option value="daysSinceLastLogin">Dias desde último login</option>
            <option value="daysSinceCreation">Dias desde criação</option>
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
                  <th>ID</th>
                  <th>Username</th>
                  <th>Nome</th>
                  <th>Nível</th>
                  <th>XP</th>
                  <th>Jogos</th>
                  <th>V/D</th>
                  <th>Taxa</th>
                  <th>Streak</th>
                  <th>Multiplayer</th>
                  <th>Conquistas</th>
                  <th>Histórico</th>
                  <th>Criado</th>
                  <th>Último Login</th>
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
                    <td className={styles.idCell}>{profile.id.slice(-8)}</td>
                    <td className={styles.usernameCell}>{profile.username}</td>
                    <td>{profile.displayName || '-'}</td>
                    <td className={styles.levelCell}>
                      <span className={styles.level}>Lv.{profile.level}</span>
                    </td>
                    <td className={styles.xpCell}>{profile.xp.toLocaleString()}</td>
                    <td>{profile.stats.totalGames}</td>
                    <td>
                      <span className={styles.winLoss}>
                        {profile.stats.wins}/{profile.stats.losses}
                      </span>
                    </td>
                    <td>{profile.stats.winRate.toFixed(1)}%</td>
                    <td>
                      <span className={styles.streak}>
                        {profile.stats.currentStreak}/{profile.stats.bestStreak}
                      </span>
                    </td>
                    <td>
                      {profile.socialStats.multiplayerGamesPlayed > 0 ? (
                        <span className={styles.multiplayer}>
                          {profile.socialStats.multiplayerWins}/{profile.socialStats.multiplayerGamesPlayed}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={styles.achievements}>
                        🏆 {profile.achievements} | 🎖️ {profile.badges}
                      </span>
                    </td>
                    <td className={styles.historyCell}>{profile.gameHistory}</td>
                    <td className={styles.dateCell}>
                      {formatDate(profile.createdAt)}
                      <br />
                      <small>({profile.daysSinceCreation}d)</small>
                    </td>
                    <td className={styles.dateCell}>
                      {formatDate(profile.lastLogin)}
                      <br />
                      <small>({profile.daysSinceLastLogin}d atrás)</small>
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
      </div>
    </>
  );
}
