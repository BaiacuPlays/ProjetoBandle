# Sistema de Integridade das Estatísticas

Este documento descreve o sistema implementado para detectar, diagnosticar e reparar problemas com as estatísticas do perfil do jogador.

## Problema Identificado

O usuário relatou que as estatísticas do perfil às vezes "bugam" e quando a página é atualizada ou alguma ação é realizada, as estatísticas zeram. Isso indica problemas de:

1. **Sincronização entre localStorage e Vercel KV**
2. **Múltiplos sistemas de estatísticas conflitantes**
3. **Problemas de integridade dos dados**
4. **Race conditions durante atualizações**
5. **Fallback inconsistente quando há problemas com o KV**

## Solução Implementada

### 1. Sistema de Verificação de Integridade

#### Frontend (UserProfileContext.js)
- **`verifyStatsIntegrity()`**: Verifica se as estatísticas estão íntegras
- **`repairStats()`**: Repara automaticamente estatísticas corrompidas
- **`performPeriodicIntegrityCheck()`**: Executa verificações a cada 5 minutos
- **Sistema de backup automático**: Cria backups antes de qualquer alteração

#### Backend (APIs)
- **`/api/debug/stats-integrity`**: Diagnóstico completo das estatísticas
- **`/api/repair-stats`**: Reparo automático de estatísticas corrompidas

### 2. Melhorias no Sistema de Persistência

#### Backups Múltiplos
```javascript
// Backup principal
localStorage.setItem(`ludomusic_profile_${userId}`, JSON.stringify(profile));

// Backup secundário
localStorage.setItem(`ludomusic_profile_backup_${userId}`, JSON.stringify(profile));

// Snapshot periódico (a cada hora)
localStorage.setItem(`ludomusic_profile_snapshot_${userId}`, JSON.stringify(profile));
```

#### Verificação de Integridade
```javascript
const statsIntegrityCheck = verifyStatsIntegrity(profile.stats);
if (!statsIntegrityCheck.isValid) {
  const repairedStats = repairStats(profile.stats, statsIntegrityCheck.issues);
  // Aplicar reparo automaticamente
}
```

### 3. Sistema de Recuperação

#### Restauração de Backup
- Busca automaticamente por backups válidos
- Ordena por timestamp (mais recente primeiro)
- Verifica integridade antes de restaurar
- Limpa backups antigos (mantém apenas os 5 mais recentes)

#### Retry Logic
- Tentativas automáticas de sincronização com servidor
- Fallback para localStorage em caso de falha
- Logs detalhados para debugging

### 4. Componente de Diagnóstico

#### StatsDiagnostic.js
Interface visual para:
- Executar diagnóstico completo
- Visualizar problemas encontrados
- Executar reparo manual
- Monitorar status da integridade

## Como Usar

### Para Desenvolvedores

#### 1. Executar Teste de Integridade
```bash
node scripts/test-stats-integrity.js
```

#### 2. Verificar Status via API
```javascript
// GET /api/debug/stats-integrity
// Retorna relatório completo de integridade
```

#### 3. Reparar Estatísticas via API
```javascript
// POST /api/repair-stats
// Executa reparo automático com backup
```

### Para Usuários

#### 1. Acessar Diagnóstico
- Adicionar o componente `StatsDiagnostic` ao perfil do usuário
- Botão "Diagnóstico de Estatísticas" nas configurações

#### 2. Executar Verificação
- Clique em "Executar Diagnóstico"
- Visualize problemas encontrados
- Execute reparo se necessário

## Verificações Implementadas

### 1. Integridade do Perfil
- ✅ Campos obrigatórios presentes
- ✅ Tipos de dados corretos
- ✅ Valores dentro de limites válidos
- ✅ Estrutura de dados consistente

### 2. Integridade das Estatísticas
- ✅ `totalGames = wins + losses`
- ✅ `winRate` calculada corretamente
- ✅ `currentStreak ≤ bestStreak`
- ✅ Valores não negativos
- ✅ Campos obrigatórios presentes

### 3. Consistência dos Dados
- ✅ XP e level sincronizados
- ✅ Estatísticas por modo consistentes
- ✅ Histórico de jogos válido
- ✅ Timestamps atualizados

## Reparos Automáticos

### 1. Campos Ausentes
```javascript
// Aplicar valores padrão
stats.totalGames = stats.totalGames || 0;
stats.wins = stats.wins || 0;
stats.losses = stats.losses || 0;
```

### 2. Inconsistências Matemáticas
```javascript
// Corrigir total de jogos
stats.totalGames = stats.wins + stats.losses;

// Recalcular taxa de vitória
stats.winRate = stats.totalGames > 0 
  ? (stats.wins / stats.totalGames) * 100 
  : 0;
```

### 3. Valores Inválidos
```javascript
// Corrigir valores negativos
Object.keys(stats).forEach(key => {
  if (typeof stats[key] === 'number' && stats[key] < 0) {
    stats[key] = 0;
  }
});
```

### 4. Sincronização XP/Level
```javascript
// Recalcular level baseado no XP
const calculatedLevel = Math.floor(Math.sqrt(profile.xp / 300)) + 1;
profile.level = calculatedLevel;
```

## Monitoramento

### 1. Logs Detalhados
```javascript
console.log('📊 [STATS] Estatísticas atualizadas:', {
  totalGames: profile.stats.totalGames,
  wins: profile.stats.wins,
  losses: profile.stats.losses,
  winRate: profile.stats.winRate
});
```

### 2. Verificação Periódica
- Executa a cada 5 minutos
- Verificação inicial após 30 segundos
- Reparo automático se problemas detectados

### 3. Backup Automático
- Backup antes de cada atualização
- Cleanup automático de backups antigos
- Restauração automática em caso de falha

## Prevenção de Problemas

### 1. Validação Antes de Salvar
```javascript
if (!verifyProfileIntegrity(updatedProfile)) {
  console.error('❌ Perfil corrompido detectado!');
  const repairedProfile = repairProfile(updatedProfile, userId);
  // Usar perfil reparado
}
```

### 2. Retry Logic
```javascript
try {
  await saveProfileToServerWithRetry(profile, userId);
} catch (error) {
  // Tentar novamente em 5 segundos
  setTimeout(() => retry(), 5000);
}
```

### 3. Fallback Robusto
```javascript
// Sempre manter dados localmente
setProfile(updatedProfile);
saveProfileToLocalStorage(userId, updatedProfile);

// Sincronizar com servidor quando possível
syncWithServer(updatedProfile).catch(handleSyncError);
```

## Conclusão

Este sistema garante que:
- ✅ Estatísticas nunca sejam perdidas
- ✅ Problemas sejam detectados automaticamente
- ✅ Reparos sejam aplicados sem intervenção manual
- ✅ Backups estejam sempre disponíveis
- ✅ Sincronização seja robusta e confiável

O usuário não deve mais enfrentar problemas de estatísticas zerando ou dados corrompidos.
