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
    if (!adminKey) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/profiles', {
        headers: {
          'x-admin-key': adminKey
        }
      });

      const data = await response.json();

      if (data.success) {
        setProfiles(data.profiles);
        setAuthenticated(true);
      } else {
        setError(data.error || 'Erro ao carregar perfis');
        setAuthenticated(false);
      }
    } catch (err) {
      setError('Erro de conexão: ' + err.message);
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

  // Função para calcular nível baseado no XP
  const calculateLevel = (xp) => {
    if (xp < 0) return 1;
    return Math.floor(Math.sqrt(xp / 100)) + 1;
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
                placeholder="Chave de administrador"
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
        <title>Admin - Perfis de Usuários - LudoMusic</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>👥 Perfis de Usuários</h1>
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
