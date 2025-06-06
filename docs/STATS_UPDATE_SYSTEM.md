# Sistema de Atualização Forçada de Estatísticas

## Visão Geral

Este sistema foi implementado para resolver problemas persistentes com as estatísticas do perfil do usuário que às vezes "bugam" e zeram quando a página é atualizada. O sistema oferece duas abordagens:

1. **Atualização Manual** - Botão para o usuário forçar a atualização
2. **Atualização Automática** - Sistema detecta problemas graves e corrige automaticamente

## Como Funciona

### Detecção Automática

O sistema monitora continuamente a integridade das estatísticas e detecta problemas como:

- ✅ Total de jogos zerado quando há histórico
- ✅ Vitórias e derrotas zeradas inconsistentemente  
- ✅ Taxa de vitória incorreta
- ✅ Inconsistências matemáticas (wins + losses ≠ totalGames)

### Correção Automática

Quando problemas graves são detectados, o sistema:

1. **Cria backup** do perfil atual
2. **Recalcula estatísticas** baseado no histórico de jogos
3. **Atualiza o perfil** com dados corretos
4. **Salva no servidor** e localStorage

### Botão Manual

Para casos onde o usuário suspeita de problemas, há um botão no perfil:

- 📍 **Localização**: Perfil → Configurações → Estatísticas do Perfil
- 🔄 **Função**: Força recálculo completo das estatísticas
- ⏱️ **Feedback**: Mostra progresso e resultado da operação

## Implementação Técnica

### Arquivos Modificados

1. **`components/UserProfile.js`**
   - Adicionado botão de atualização forçada
   - Estados para controle de loading e mensagens
   - Função `handleForceStatsUpdate()`

2. **`pages/api/force-stats-update.js`**
   - Nova API endpoint para recálculo de estatísticas
   - Função `recalculateStatsFromHistory()`
   - Sistema de backup automático

3. **`contexts/UserProfileContext.js`**
   - Função `autoForceStatsUpdate()` para correção automática
   - Detecção de problemas graves nas estatísticas
   - Integração com sistema de verificação de integridade

4. **`styles/UserProfile.module.css`**
   - Estilos para botão de atualização
   - Animações de loading (spinner)
   - Mensagens de sucesso/erro

### Fluxo de Recálculo

```javascript
// 1. Buscar perfil e histórico de jogos
const profile = await safeKV.get(`profile:${userId}`);
const gameHistory = profile.gameHistory || [];

// 2. Inicializar estatísticas zeradas
const stats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  // ... outros campos
};

// 3. Processar cada jogo no histórico
for (const game of gameHistory) {
  stats.totalGames++;
  
  if (game.won) {
    stats.wins++;
    // Atualizar streaks, XP, etc.
  } else {
    stats.losses++;
    // Reset streak
  }
  
  // Calcular estatísticas por modo
  // Atualizar tempos, tentativas, etc.
}

// 4. Calcular campos derivados
stats.winRate = (stats.wins / stats.totalGames) * 100;
stats.averageAttempts = totalAttempts / winCount;
```

## Estatísticas Recalculadas

### Estatísticas Gerais
- ✅ Total de jogos
- ✅ Vitórias e derrotas
- ✅ Taxa de vitória
- ✅ Sequência atual e melhor sequência
- ✅ Tempo total jogado
- ✅ Jogos perfeitos (1 tentativa)
- ✅ Média de tentativas
- ✅ Vitória mais rápida

### Estatísticas por Modo
- ✅ **Modo Diário**: jogos, vitórias, melhor sequência, jogos perfeitos
- ✅ **Modo Infinito**: jogos, vitórias, músicas completadas
- ✅ **Modo Multiplayer**: jogos, vitórias, pontos totais, melhor pontuação

### Verificações de Integridade
- ✅ `totalGames = wins + losses`
- ✅ `winRate = (wins / totalGames) * 100`
- ✅ `currentStreak ≤ bestStreak`
- ✅ Valores não negativos
- ✅ Campos obrigatórios presentes

## Como Usar

### Para Usuários

1. **Acesse seu perfil** (botão do avatar no canto superior direito)
2. **Vá para a aba "Configurações"**
3. **Role até "Estatísticas do Perfil"**
4. **Clique em "Forçar Atualização de Estatísticas"**
5. **Aguarde o processamento** (mostra spinner)
6. **Veja a mensagem de sucesso** e recarregue a página

### Para Desenvolvedores

```javascript
// Usar a API diretamente
const response = await fetch('/api/force-stats-update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'user_id_here' })
});

const result = await response.json();
if (result.success) {
  console.log('Estatísticas atualizadas:', result.updatedStats);
}
```

## Segurança e Backup

### Sistema de Backup
- ✅ **Backup automático** antes de cada atualização
- ✅ **Chave única** com timestamp: `backup:profile:${userId}:${timestamp}`
- ✅ **Recuperação** em caso de falha na atualização

### Logs e Monitoramento
- ✅ **Logs detalhados** de cada operação
- ✅ **Rastreamento de erros** com contexto
- ✅ **Métricas de sucesso** e falha

## Benefícios

1. **Resolve problemas persistentes** com estatísticas zeradas
2. **Funciona automaticamente** sem intervenção do usuário
3. **Mantém backup** para segurança dos dados
4. **Interface amigável** para correção manual
5. **Baseado no histórico real** de jogos do usuário
6. **Corrige inconsistências matemáticas** automaticamente

## Teste e Validação

Execute o script de teste para verificar o funcionamento:

```bash
node test-stats-update.js
```

O teste simula um perfil com estatísticas incorretas e verifica se o recálculo produz resultados corretos e consistentes.
