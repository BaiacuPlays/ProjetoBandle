# Correção do Problema de Carregamento Infinito no Multiplayer

## Problema Identificado

Alguns players relataram que, ocasionalmente, no multiplayer o botão de play fica carregando infinitamente e não consegue tocar a música nem pular para a próxima rodada.

## Causas Identificadas

1. **Estados de loading travados**: `isPlayLoading`, `pendingPlay` e `isPlayButtonDisabled` podem ficar permanentemente ativos
2. **Race conditions**: Múltiplas chamadas simultâneas de `audio.load()` 
3. **Falta de timeouts de segurança**: Sem mecanismo para resetar estados travados
4. **Eventos de áudio não tratados**: `onStalled`, `onAbort`, `onSuspend` não resetavam estados
5. **Limpeza inadequada entre rodadas**: Estados não eram resetados ao mudar de rodada

## Correções Implementadas

### 1. Reset de Estados Entre Rodadas
```javascript
// Reset dos estados de loading que podem ficar travados
setIsPlayLoading(false);
setPendingPlay(false);
setIsPlayButtonDisabled(false);
setIsSkipLoading(false);
```

### 2. Timeout de Segurança no Botão Play
```javascript
// Timeout de segurança para resetar estados de loading
const safetyTimeout = setTimeout(() => {
  console.log('⚠️ [MULTIPLAYER] Timeout de segurança ativado - resetando estados');
  setIsPlayLoading(false);
  setIsPlayButtonDisabled(false);
  setPendingPlay(false);
}, 5000); // 5 segundos de timeout
```

### 3. Monitor de Estados Travados
```javascript
// Monitor de segurança para resetar estados travados
useEffect(() => {
  let safetyTimer;
  
  if (isPlayLoading || pendingPlay) {
    safetyTimer = setTimeout(() => {
      console.log('⚠️ [MULTIPLAYER] Estados de loading travados detectados - forçando reset');
      setIsPlayLoading(false);
      setPendingPlay(false);
      setIsPlayButtonDisabled(false);
    }, 10000); // 10 segundos de timeout de segurança
  }
  
  return () => {
    if (safetyTimer) {
      clearTimeout(safetyTimer);
    }
  };
}, [isPlayLoading, pendingPlay]);
```

### 4. Melhor Tratamento de Eventos de Áudio
```javascript
onStalled={() => {
  // CORREÇÃO: Resetar estados se o carregamento travou
  setTimeout(() => {
    if (isPlayLoading || pendingPlay) {
      console.log('🔧 [MULTIPLAYER] Resetando estados após travamento');
      setIsPlayLoading(false);
      setPendingPlay(false);
    }
  }, 3000);
}}
onAbort={() => {
  console.log('🛑 [MULTIPLAYER] Carregamento abortado');
  setIsPlayLoading(false);
  setPendingPlay(false);
}}
```

### 5. Execução Automática de Play Pendente
```javascript
// CORREÇÃO: Se havia um play pendente, executar agora
if (pendingPlay) {
  console.log('🔄 [MULTIPLAYER] Executando play pendente');
  setPendingPlay(false);
  setIsPlayLoading(false);
  setTimeout(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(error => {
        console.error('❌ [MULTIPLAYER] Erro no play pendente:', error);
        setIsPlayLoading(false);
      });
    }
  }, 100);
}
```

### 6. Botão de Emergência
Adicionado um botão de emergência que aparece quando o áudio está carregando por muito tempo, permitindo ao usuário resetar manualmente o estado do player.

### 7. Logs Detalhados para Debug
Adicionados logs detalhados com emojis para facilitar o debug:
- 🎵 Botão play clicado
- 📊 Metadata carregada
- ✅ Áudio carregado com sucesso
- ❌ Erros diversos
- 🔄 Carregamento/retry
- ⚠️ Timeouts de segurança
- 🚨 Reset de emergência

## Como Testar

1. Entre no multiplayer
2. Tente reproduzir música normalmente
3. Se o botão ficar carregando infinitamente:
   - Aguarde 5-10 segundos (timeouts automáticos)
   - Use o botão "Resetar Áudio" se aparecer
   - Verifique os logs no console do navegador

## Logs para Monitoramento

Os logs agora incluem prefixo `[MULTIPLAYER]` para facilitar identificação:
- Estados de loading sendo monitorados
- Timeouts de segurança sendo ativados
- Erros de carregamento de áudio
- Execução de plays pendentes

## Próximos Passos

Se o problema persistir após essas correções:
1. Verificar logs específicos no console
2. Analisar padrões de quando o problema ocorre
3. Considerar implementar cache de áudio mais robusto
4. Avaliar usar Web Audio API para maior controle
