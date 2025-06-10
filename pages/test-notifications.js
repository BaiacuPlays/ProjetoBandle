import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AchievementNotification from '../components/AchievementNotification';
import { achievements } from '../data/achievements';

const TestNotifications = () => {
  const { isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState([]);

  const addResult = (test, success, message) => {
    setTestResults(prev => [...prev, { test, success, message, timestamp: Date.now() }]);
  };

  const testSingleAchievement = () => {
    if (!window.showAchievementToast) {
      addResult('Single Achievement', false, 'Função showAchievementToast não encontrada');
      return;
    }

    const testAchievement = {
      id: 'test_single',
      title: 'Teste de Conquista',
      description: 'Esta é uma conquista de teste para verificar posicionamento e som',
      icon: '🧪',
      rarity: 'epic',
      xpReward: 500
    };

    window.showAchievementToast(testAchievement);
    addResult('Single Achievement', true, 'Conquista de teste exibida! Verifique se apareceu no centro-direita da tela com som.');
  };

  const testLevelUp = () => {
    if (!window.showLevelUpToast) {
      addResult('Level Up', false, 'Função showLevelUpToast não encontrada');
      return;
    }

    window.showLevelUpToast(5);
    addResult('Level Up', true, 'Notificação de level up exibida! Verifique se apareceu com som diferente.');
  };

  const testMultipleAchievements = () => {
    if (!window.showAchievementToast) {
      addResult('Multiple Achievements', false, 'Função showAchievementToast não encontrada');
      return;
    }

    const testAchievements = [
      {
        id: 'test_1',
        title: 'Primeira Conquista',
        description: 'Primeira conquista do teste múltiplo',
        icon: '🥇',
        rarity: 'common',
        xpReward: 100
      },
      {
        id: 'test_2',
        title: 'Segunda Conquista',
        description: 'Segunda conquista do teste múltiplo',
        icon: '🥈',
        rarity: 'uncommon',
        xpReward: 200
      },
      {
        id: 'test_3',
        title: 'Terceira Conquista',
        description: 'Terceira conquista do teste múltiplo',
        icon: '🥉',
        rarity: 'rare',
        xpReward: 300
      }
    ];

    testAchievements.forEach((achievement, index) => {
      setTimeout(() => {
        window.showAchievementToast(achievement);
      }, index * 1500); // 1.5 segundos entre cada notificação
    });

    addResult('Multiple Achievements', true, 'Múltiplas conquistas enviadas! Verifique se aparecem em sequência.');
  };

  const testScrollVisibility = () => {
    // Criar conteúdo longo para testar scroll
    const longContent = Array.from({ length: 50 }, (_, i) => (
      <div key={i} style={{ 
        padding: '20px', 
        margin: '10px 0', 
        background: '#2d2d2d', 
        borderRadius: '8px',
        color: 'white'
      }}>
        Conteúdo de teste #{i + 1} - Role a página para baixo e teste as notificações
      </div>
    ));

    document.body.appendChild(
      Object.assign(document.createElement('div'), {
        innerHTML: longContent.map((_, i) => 
          `<div style="padding: 20px; margin: 10px 0; background: #2d2d2d; border-radius: 8px; color: white;">
            Conteúdo de teste #${i + 1} - Role a página para baixo e teste as notificações
          </div>`
        ).join(''),
        style: 'position: absolute; top: 100vh; left: 0; right: 0; z-index: 1;'
      })
    );

    // Rolar para baixo
    window.scrollTo({ top: 1000, behavior: 'smooth' });

    // Mostrar conquista após rolar
    setTimeout(() => {
      if (window.showAchievementToast) {
        window.showAchievementToast({
          id: 'scroll_test',
          title: 'Teste de Scroll',
          description: 'Esta conquista deve aparecer mesmo com a página rolada',
          icon: '📜',
          rarity: 'legendary',
          xpReward: 1000
        });
      }
    }, 2000);

    addResult('Scroll Visibility', true, 'Página rolada e conquista enviada. Verifique se a notificação aparece no campo de visão.');
  };

  const testRealAchievements = () => {
    const realAchievements = [
      achievements.first_game,
      achievements.first_win,
      achievements.veteran,
      achievements.speed_demon,
      achievements.comeback_king
    ];

    realAchievements.forEach((achievement, index) => {
      setTimeout(() => {
        if (window.showAchievementToast) {
          window.showAchievementToast(achievement);
        }
      }, index * 2000); // 2 segundos entre cada
    });

    addResult('Real Achievements', true, 'Conquistas reais do jogo enviadas! Verifique diferentes raridades e sons.');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ 
      padding: '20px', 
      color: 'white', 
      background: '#1a1a1a', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <AchievementNotification />
      
      <h1 style={{ color: '#1db954', marginBottom: '30px' }}>🏆 Teste de Notificações de Conquistas</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          Esta página testa o sistema melhorado de notificações de conquistas com:
        </p>
        <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          <li>✅ <strong>Posicionamento centralizado</strong> - sempre visível no campo de visão</li>
          <li>✅ <strong>Sons de notificação</strong> - diferentes para conquistas e level up</li>
          <li>✅ <strong>Animações melhoradas</strong> - bounce, glow e shimmer effects</li>
          <li>✅ <strong>Visibilidade garantida</strong> - funciona mesmo com scroll da página</li>
          <li>✅ <strong>Responsividade</strong> - adapta-se a diferentes tamanhos de tela</li>
        </ul>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '15px',
        marginBottom: '30px'
      }}>
        <button
          onClick={testSingleAchievement}
          style={{
            padding: '15px 20px',
            background: 'linear-gradient(45deg, #1db954, #1ed760)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.target.style.transform = 'scale(1)'}
        >
          🧪 Teste Conquista Única
        </button>

        <button
          onClick={testLevelUp}
          style={{
            padding: '15px 20px',
            background: 'linear-gradient(45deg, #F59E0B, #FCD34D)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.target.style.transform = 'scale(1)'}
        >
          ⭐ Teste Level Up
        </button>

        <button
          onClick={testMultipleAchievements}
          style={{
            padding: '15px 20px',
            background: 'linear-gradient(45deg, #8B5CF6, #A78BFA)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.target.style.transform = 'scale(1)'}
        >
          🎯 Teste Múltiplas
        </button>

        <button
          onClick={testScrollVisibility}
          style={{
            padding: '15px 20px',
            background: 'linear-gradient(45deg, #3B82F6, #60A5FA)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.target.style.transform = 'scale(1)'}
        >
          📜 Teste Scroll
        </button>

        <button
          onClick={testRealAchievements}
          style={{
            padding: '15px 20px',
            background: 'linear-gradient(45deg, #EF4444, #F87171)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.target.style.transform = 'scale(1)'}
        >
          🏆 Conquistas Reais
        </button>

        <button
          onClick={scrollToTop}
          style={{
            padding: '15px 20px',
            background: 'linear-gradient(45deg, #6B7280, #9CA3AF)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.target.style.transform = 'scale(1)'}
        >
          ⬆️ Voltar ao Topo
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={clearResults}
          style={{
            padding: '10px 20px',
            background: '#374151',
            color: 'white',
            border: '1px solid #6B7280',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🗑️ Limpar Resultados
        </button>
      </div>

      {/* Resultados dos testes */}
      {testResults.length > 0 && (
        <div style={{
          background: '#2d2d2d',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#1db954', marginBottom: '15px' }}>📊 Resultados dos Testes</h3>
          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '10px',
                margin: '5px 0',
                borderRadius: '6px',
                background: result.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${result.success ? '#22C55E' : '#EF4444'}`
              }}
            >
              <strong style={{ color: result.success ? '#22C55E' : '#EF4444' }}>
                {result.success ? '✅' : '❌'} {result.test}
              </strong>
              <div style={{ marginTop: '5px', fontSize: '14px', opacity: 0.9 }}>
                {result.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestNotifications;
