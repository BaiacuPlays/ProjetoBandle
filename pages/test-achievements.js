import React, { useState, useEffect } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { achievements, checkAchievementUnlocked, getUnlockedAchievements, calculateAchievementProgress } from '../data/achievements';
import { badges, checkBadgeUnlocked, getUnlockedBadges } from '../data/badges';
import AchievementNotification from '../components/AchievementNotification';

const TestAchievements = () => {
  const { profile, updateGameStats, checkAndUnlockAchievements, checkAndUnlockBadges, updateProfile } = useProfile() || {};
  const { isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test, success, message) => {
    setTestResults(prev => [...prev, { test, success, message, timestamp: Date.now() }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    if (!profile) {
      addResult('Profile Check', false, 'Perfil não carregado');
      setIsRunning(false);
      return;
    }

    addResult('Profile Check', true, `Perfil carregado: ${profile.username}`);

    // Testar conquistas básicas
    const firstGameUnlocked = checkAchievementUnlocked('first_game', profile.stats, profile);
    addResult('First Game Achievement', firstGameUnlocked, `Primeiro Jogo: ${firstGameUnlocked ? 'Desbloqueada' : 'Bloqueada'}`);

    const firstWinUnlocked = checkAchievementUnlocked('first_win', profile.stats, profile);
    addResult('First Win Achievement', firstWinUnlocked, `Primeira Vitória: ${firstWinUnlocked ? 'Desbloqueada' : 'Bloqueada'}`);

    // Testar badges
    const level1BadgeUnlocked = checkBadgeUnlocked('level_1', profile);
    addResult('Level 1 Badge', level1BadgeUnlocked, `Badge Nível 1: ${level1BadgeUnlocked ? 'Desbloqueado' : 'Bloqueado'}`);

    // Verificar estrutura do perfil
    addResult('Profile Structure', true, `
      Stats: ${profile.stats ? 'OK' : 'Missing'}
      SocialStats: ${profile.socialStats ? 'OK' : 'Missing'}
      FranchiseStats: ${profile.franchiseStats ? 'OK' : 'Missing'}
      SessionData: ${profile.sessionData ? 'OK' : 'Missing'}
    `);

    // Testar todas as conquistas desbloqueadas
    const unlockedAchievements = getUnlockedAchievements(profile.stats, profile);
    addResult('Unlocked Achievements', true, `Total desbloqueadas: ${unlockedAchievements.length}`);

    unlockedAchievements.forEach(achievementId => {
      const achievement = achievements[achievementId];
      if (achievement) {
        addResult(`Achievement: ${achievement.title}`, true, achievement.description);
      }
    });

    // Testar badges desbloqueados
    const unlockedBadges = getUnlockedBadges(profile);
    addResult('Unlocked Badges', true, `Total desbloqueados: ${unlockedBadges.length}`);

    unlockedBadges.forEach(badgeId => {
      const badge = badges[badgeId];
      if (badge) {
        addResult(`Badge: ${badge.title}`, true, badge.description);
      }
    });

    setIsRunning(false);
  };

  const simulateGame = async () => {
    if (!updateGameStats) {
      addResult('Simulate Game', false, 'updateGameStats não disponível');
      return;
    }

    setIsRunning(true);
    addResult('Simulate Game', true, 'Simulando jogo...');

    try {
      await updateGameStats({
        won: true,
        attempts: 1,
        mode: 'daily',
        song: { title: 'Test Song', game: 'Test Game', id: 'test' },
        playTime: 30,
        isComeback: false,
        consecutiveLosses: 0,
        dailyGameCompleted: true,
        gameDate: new Date().toISOString().split('T')[0]
      });

      addResult('Simulate Game', true, 'Jogo simulado com sucesso!');

      // Aguardar um pouco e verificar conquistas novamente
      setTimeout(() => {
        runTests();
      }, 1000);

    } catch (error) {
      addResult('Simulate Game', false, `Erro: ${error.message}`);
      setIsRunning(false);
    }
  };

  const forceUnlockAchievements = async () => {
    if (!checkAndUnlockAchievements) {
      addResult('Force Unlock', false, 'checkAndUnlockAchievements não disponível');
      return;
    }

    setIsRunning(true);
    addResult('Force Unlock', true, 'Forçando verificação de conquistas...');

    try {
      const newAchievements = await checkAndUnlockAchievements();
      addResult('Force Unlock Achievements', true, `${newAchievements.length} novas conquistas desbloqueadas`);

      const newBadges = await checkAndUnlockBadges();
      addResult('Force Unlock Badges', true, `${newBadges.length} novos badges desbloqueados`);

    } catch (error) {
      addResult('Force Unlock', false, `Erro: ${error.message}`);
    }

    setIsRunning(false);
  };

  const debugAchievements = () => {
    if (!profile) {
      addResult('Debug', false, 'Perfil não carregado');
      return;
    }

    addResult('Debug', true, '=== DEBUG DE CONQUISTAS ===');

    // Verificar estatísticas do perfil primeiro
    addResult('Profile Stats', true,
      `totalGames: ${profile.stats?.totalGames || 0} | wins: ${profile.stats?.wins || 0} | level: ${profile.level || 1}`
    );

    // Verificar conquistas básicas
    const basicAchievements = ['first_game', 'first_win', 'veteran'];
    basicAchievements.forEach(achievementId => {
      const progress = calculateAchievementProgress(achievementId, profile.stats, profile);
      const isUnlocked = checkAchievementUnlocked(achievementId, profile.stats, profile);
      const isInProfile = profile.achievements?.includes(achievementId);

      addResult(`Debug ${achievementId}`, true,
        `Progresso: ${progress}% | Desbloqueada: ${isUnlocked} | No perfil: ${isInProfile}`
      );
    });

    // Verificar array de conquistas do perfil
    addResult('Profile Achievements Array', true,
      `Array atual: [${(profile.achievements || []).join(', ')}]`
    );

    // Verificar todas as conquistas que deveriam estar desbloqueadas
    const shouldBeUnlocked = getUnlockedAchievements(profile.stats, profile);
    addResult('Should Be Unlocked', true,
      `Conquistas que deveriam estar desbloqueadas: [${shouldBeUnlocked.join(', ')}]`
    );

    // Comparar com o que está no perfil
    const missingAchievements = shouldBeUnlocked.filter(id => !profile.achievements?.includes(id));
    if (missingAchievements.length > 0) {
      addResult('Missing Achievements', false,
        `Conquistas faltando no perfil: [${missingAchievements.join(', ')}]`
      );
    } else {
      addResult('Missing Achievements', true, 'Todas as conquistas estão sincronizadas');
    }

    // Teste específico para first_game
    if (profile.stats?.totalGames >= 1) {
      addResult('First Game Test', true, 'Deveria ter first_game desbloqueada');
    } else {
      addResult('First Game Test', false, 'Não tem jogos suficientes para first_game');
    }

    // Teste específico para first_win
    if (profile.stats?.wins >= 1) {
      addResult('First Win Test', true, 'Deveria ter first_win desbloqueada');
    } else {
      addResult('First Win Test', false, 'Não tem vitórias suficientes para first_win');
    }
  };

  const forceSyncAchievements = async () => {
    if (!profile || !updateProfile) {
      addResult('Force Sync', false, 'Perfil ou updateProfile não disponível');
      return;
    }

    setIsRunning(true);
    addResult('Force Sync', true, 'Forçando sincronização de conquistas...');

    try {
      // Obter todas as conquistas que deveriam estar desbloqueadas
      const shouldBeUnlocked = getUnlockedAchievements(profile.stats, profile);

      addResult('Should Be Unlocked', true, `Conquistas que deveriam estar desbloqueadas: [${shouldBeUnlocked.join(', ')}]`);
      addResult('Current Profile', true, `Conquistas no perfil atual: [${(profile.achievements || []).join(', ')}]`);

      // Verificar conquistas específicas
      const firstGameProgress = calculateAchievementProgress('first_game', profile.stats, profile);
      const firstWinProgress = calculateAchievementProgress('first_win', profile.stats, profile);
      const veteranProgress = calculateAchievementProgress('veteran', profile.stats, profile);

      addResult('Progress Check', true,
        `first_game: ${firstGameProgress}% | first_win: ${firstWinProgress}% | veteran: ${veteranProgress}%`
      );

      // Atualizar o perfil com as conquistas corretas
      await updateProfile({
        achievements: shouldBeUnlocked
      });

      addResult('Force Sync', true, `Sincronização concluída! ${shouldBeUnlocked.length} conquistas no perfil`);

      // Aguardar um pouco e executar testes novamente
      setTimeout(() => {
        debugAchievements();
      }, 1000);

    } catch (error) {
      addResult('Force Sync', false, `Erro: ${error.message}`);
    }

    setIsRunning(false);
  };

  const testAchievementNotifications = () => {
    // Verificar se a função global existe
    addResult('Function Check', window.showAchievementToast ? true : false,
      `Função showAchievementToast: ${window.showAchievementToast ? 'ENCONTRADA' : 'NÃO ENCONTRADA'}`
    );

    if (!window.showAchievementToast) {
      addResult('Notification Test', false, 'Função showAchievementToast não encontrada - verifique se AchievementNotification está carregado');
      return;
    }

    // Testar notificação de conquista
    const testAchievement = {
      id: 'test_achievement',
      title: 'Conquista de Teste',
      description: 'Esta é uma conquista de teste para verificar as notificações',
      icon: '🧪',
      rarity: 'epic',
      xpReward: 500
    };

    try {
      console.log('🧪 Testando notificação de conquista:', testAchievement);
      window.showAchievementToast(testAchievement);
      addResult('Notification Test', true, 'Notificação de teste enviada com sucesso! Verifique o canto superior direito da tela.');
    } catch (error) {
      addResult('Notification Test', false, `Erro ao mostrar notificação: ${error.message}`);
    }
  };

  const testMultipleNotifications = () => {
    if (!window.showAchievementToast) {
      addResult('Multiple Notifications', false, 'Função showAchievementToast não encontrada');
      return;
    }

    const testAchievements = [
      {
        id: 'first_game',
        title: 'Primeiro Passo',
        description: 'Jogue sua primeira partida',
        icon: '🎮',
        rarity: 'common',
        xpReward: 50
      },
      {
        id: 'first_win',
        title: 'Primeira Vitória',
        description: 'Acerte sua primeira música',
        icon: '🏆',
        rarity: 'common',
        xpReward: 100
      },
      {
        id: 'veteran',
        title: 'Veterano',
        description: 'Jogue 10 partidas',
        icon: '🎖️',
        rarity: 'common',
        xpReward: 200
      }
    ];

    try {
      testAchievements.forEach((achievement, index) => {
        setTimeout(() => {
          window.showAchievementToast(achievement);
        }, index * 1000); // 1 segundo de intervalo entre cada notificação
      });
      addResult('Multiple Notifications', true, `${testAchievements.length} notificações enviadas com intervalo de 1s`);
    } catch (error) {
      addResult('Multiple Notifications', false, `Erro ao mostrar notificações: ${error.message}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', color: 'white', background: '#1a1a1a', minHeight: '100vh' }}>
        <h1>Teste de Conquistas</h1>
        <p>Você precisa estar logado para testar o sistema de conquistas.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', color: 'white', background: '#1a1a1a', minHeight: '100vh' }}>
      <h1>🧪 Teste do Sistema de Conquistas</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runTests}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: '#1DB954',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? 'Testando...' : 'Executar Testes'}
        </button>

        <button
          onClick={simulateGame}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: '#FF6B35',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          Simular Jogo
        </button>

        <button
          onClick={forceUnlockAchievements}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          Forçar Verificação
        </button>

        <button
          onClick={debugAchievements}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: '#F59E0B',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          Debug Conquistas
        </button>

        <button
          onClick={forceSyncAchievements}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          Forçar Sincronização
        </button>

        <button
          onClick={testAchievementNotifications}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: '#06B6D4',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          Testar Notificação
        </button>

        <button
          onClick={testMultipleNotifications}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            background: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          Múltiplas Notificações
        </button>
      </div>

      <div style={{ background: '#2a2a2a', padding: '20px', borderRadius: '10px', maxHeight: '600px', overflow: 'auto' }}>
        <h2>Resultados dos Testes:</h2>
        {testResults.length === 0 ? (
          <p>Nenhum teste executado ainda.</p>
        ) : (
          testResults.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '10px',
                margin: '5px 0',
                background: result.success ? '#1a4a2e' : '#4a1a1a',
                borderRadius: '5px',
                borderLeft: `4px solid ${result.success ? '#1DB954' : '#FF6B35'}`
              }}
            >
              <strong>{result.success ? '✅' : '❌'} {result.test}</strong>
              <br />
              <span style={{ fontSize: '14px', opacity: 0.8 }}>{result.message}</span>
            </div>
          ))
        )}
      </div>

      {profile && (
        <div style={{ marginTop: '20px', background: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
          <h2>Informações do Perfil:</h2>
          <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '300px' }}>
            {JSON.stringify({
              username: profile.username,
              level: profile.level,
              stats: profile.stats,
              achievements: profile.achievements,
              badges: profile.badges,
              socialStats: profile.socialStats,
              franchiseStats: profile.franchiseStats,
              sessionData: profile.sessionData
            }, null, 2)}
          </pre>
        </div>
      )}

      {/* Sistema de notificações de conquistas */}
      <AchievementNotification />
    </div>
  );
};

export default TestAchievements;
