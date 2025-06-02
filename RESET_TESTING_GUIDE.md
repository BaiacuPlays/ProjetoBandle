# 🧪 GUIA COMPLETO DE TESTE DE RESET DE CONTA

## 🎯 OBJETIVO

Verificar se após resetar os dados da conta, tudo continua funcionando do zero, como se a conta fosse nova.

## 🔧 FERRAMENTAS DE TESTE

### 1. **Script de Teste Automático**
- **Arquivo**: `/public/test-reset.js`
- **Função**: Validação automática completa do reset

### 2. **Validador de Reset**
- **Arquivo**: `/utils/resetValidator.js`
- **Função**: Validação detalhada de todos os aspectos

## 📋 PROCEDIMENTO DE TESTE

### **PASSO 1: Preparação**

1. **Faça login** na conta que será testada
2. **Abra o DevTools** (F12)
3. **Carregue o script de teste**:
   ```javascript
   const script = document.createElement('script');
   script.src = '/test-reset.js';
   document.head.appendChild(script);
   ```

### **PASSO 2: Capturar Estado Inicial**

```javascript
// Capturar dados antes do reset
testReset.captureData();
```

**O que é capturado:**
- ✅ Todos os dados do localStorage
- ✅ Cookies de autenticação e amigos
- ✅ Estado do perfil no servidor

### **PASSO 3: Executar Reset**

1. **Vá para o perfil** do usuário
2. **Clique em "Resetar Dados"**
3. **Confirme o reset**
4. **Aguarde a confirmação** de sucesso

### **PASSO 4: Validação Automática**

```javascript
// Executar teste completo
testReset.runComplete();
```

**O que é verificado:**
- ✅ Limpeza completa do localStorage
- ✅ Limpeza dos cookies desnecessários
- ✅ Reset do perfil no servidor
- ✅ Funcionalidades básicas funcionando
- ✅ Tutorial aparece novamente

## 🔍 VERIFICAÇÕES DETALHADAS

### **1. LIMPEZA DO LOCALSTORAGE**

**Dados que DEVEM ser removidos:**
- ❌ `ludomusic_game_state_day_*` (progresso diário)
- ❌ `ludomusic_infinite_stats` (estatísticas modo infinito)
- ❌ `ludomusic_notifications_*` (notificações)
- ❌ `ludomusic_friends_*` (dados de amigos)
- ❌ `ludomusic_friend_requests_*` (solicitações)
- ❌ `ludomusic_tutorial_seen` (tutorial visto)

**Dados que PODEM permanecer:**
- ✅ `ludomusic_session_token` (para manter login)
- ✅ `ludomusic_user_data` (dados básicos)
- ✅ `ludomusic_profile_*` (novo perfil resetado)

### **2. LIMPEZA DOS COOKIES**

**Cookies que DEVEM ser removidos:**
- ❌ `ludomusic_friends`
- ❌ `ludomusic_friend_requests`
- ❌ `ludomusic_friends_backup`

**Cookies que PODEM permanecer:**
- ✅ `ludomusic_session_token` (para manter login)
- ✅ `ludomusic_user_data` (dados básicos)

### **3. RESET NO SERVIDOR**

**Dados que DEVEM ser zerados:**
- ❌ XP: `0`
- ❌ Level: `1`
- ❌ Games Played: `0`
- ❌ Games Won: `0`
- ❌ Achievements: `[]` (vazio)
- ❌ Badges: `[]` (vazio)
- ❌ Best Streak: `0`

### **4. FUNCIONALIDADES COMO CONTA NOVA**

**O que DEVE funcionar:**
- ✅ Login mantido (não precisa fazer login novamente)
- ✅ Acesso ao perfil
- ✅ Jogar música diária
- ✅ Jogar modo infinito
- ✅ Tutorial aparece novamente
- ✅ Estatísticas zeradas
- ✅ Sem amigos na lista
- ✅ Sem conquistas

## 🧪 TESTES MANUAIS ADICIONAIS

### **1. Teste de Jogo**
1. **Jogue uma música** (diária ou infinita)
2. **Verifique se as estatísticas** são atualizadas corretamente
3. **Confirme que começa do zero**

### **2. Teste de Amigos**
1. **Vá para a seção de amigos**
2. **Confirme que a lista está vazia**
3. **Tente adicionar um amigo**
4. **Verifique se funciona normalmente**

### **3. Teste de Tutorial**
1. **Feche e reabra o site**
2. **Confirme que o tutorial aparece**
3. **Complete o tutorial**
4. **Verifique se é marcado como visto**

### **4. Teste de Conquistas**
1. **Jogue algumas músicas**
2. **Verifique se conquistas são desbloqueadas**
3. **Confirme que começou do zero**

## 📊 RESULTADOS ESPERADOS

### **✅ SUCESSO - Conta Funcionando Como Nova**
```
📊 RELATÓRIO DO TESTE DE RESET
===============================
✅ RESET FUNCIONOU PERFEITAMENTE!
✅ A conta está funcionando como se fosse nova

📋 DETALHES:
Limpeza de dados: { localStorageClean: true, cookiesClean: true, tutorialReset: true }
Reset no servidor: ✅
Funcionalidades básicas: { canAccessProfile: true, canPlayGame: true, tutorialWillShow: true }

🎉 A conta foi resetada com sucesso e está funcionando como nova!
```

### **❌ FALHA - Problemas Encontrados**
```
📊 RELATÓRIO DO TESTE DE RESET
===============================
❌ PROBLEMAS ENCONTRADOS NO RESET!
❌ 3 erro(s) encontrado(s)

🚨 ERROS:
   1. localStorage não limpo: ludomusic_friends_123
   2. Tutorial não foi resetado
   3. Perfil não foi resetado no servidor
```

## 🔧 COMANDOS DE DEBUG

### **Verificações Individuais:**
```javascript
// Verificar apenas limpeza de dados
testReset.verifyCleanup();

// Verificar apenas servidor
testReset.verifyServer();

// Verificar apenas funcionalidades
testReset.testFunctionality();
```

### **Verificar Estado Atual:**
```javascript
// Ver dados no localStorage
Object.keys(localStorage).filter(k => k.startsWith('ludomusic_'));

// Ver cookies
document.cookie.split(';').filter(c => c.includes('ludomusic'));

// Ver perfil atual
fetch('/api/profile', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('ludomusic_session_token')}` }
}).then(r => r.json()).then(console.log);
```

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### **1. Tutorial Não Aparece**
**Problema**: `ludomusic_tutorial_seen` não foi removido
**Solução**: 
```javascript
localStorage.removeItem('ludomusic_tutorial_seen');
```

### **2. Dados de Amigos Persistem**
**Problema**: Cookies de amigos não foram limpos
**Solução**:
```javascript
// Limpar manualmente
document.cookie = 'ludomusic_friends=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
document.cookie = 'ludomusic_friend_requests=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
```

### **3. Perfil Não Resetado no Servidor**
**Problema**: API de reset falhou
**Solução**: Verificar logs do servidor e tentar novamente

## ✅ CHECKLIST FINAL

- [ ] Script de teste carregado
- [ ] Dados capturados antes do reset
- [ ] Reset executado com sucesso
- [ ] Teste automático executado
- [ ] Todos os testes passaram
- [ ] Testes manuais realizados
- [ ] Tutorial aparece novamente
- [ ] Estatísticas zeradas
- [ ] Funcionalidades básicas funcionando

**🎯 RESULTADO: A conta está funcionando como se fosse completamente nova!**
