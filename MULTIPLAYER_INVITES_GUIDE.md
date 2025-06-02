# 🎮 GUIA COMPLETO DO SISTEMA DE CONVITES MULTIPLAYER

## 🎯 COMO FUNCIONA

O sistema de convites permite que jogadores convidem seus amigos para jogar multiplayer juntos.

### **FLUXO COMPLETO:**

1. **Jogador A** cria uma sala de multiplayer
2. **Jogador A** convida **Jogador B** (que deve estar na lista de amigos)
3. **Jogador B** recebe uma notificação de convite
4. **Jogador B** pode aceitar ou recusar o convite
5. Se aceitar, **Jogador B** é redirecionado para a sala

## 🔧 COMPONENTES DO SISTEMA

### **1. Envio de Convites**
- **Arquivo**: `contexts/FriendsContext.js` - função `inviteToMultiplayer()`
- **API**: `/api/send-invite.js`
- **Interface**: `components/MultiplayerInviteModal.js`

### **2. Recebimento de Convites**
- **API**: `/api/get-invites.js`
- **Contexto**: `contexts/NotificationContext.js`
- **Interface**: `components/NotificationCenter.js`

### **3. Criação de Salas**
- **API**: `/api/lobby.js`
- **Contexto**: `contexts/MultiplayerContext.js`
- **Interface**: `components/MultiplayerLobby.js`

## 📋 PRÉ-REQUISITOS PARA FUNCIONAR

### **✅ REQUISITOS OBRIGATÓRIOS:**

1. **Usuário logado** com sessão válida
2. **Pelo menos 1 amigo** na lista de amigos
3. **Amigo online** (para aparecer na lista de convites)
4. **Sistema de notificações** funcionando
5. **APIs de multiplayer** funcionando

### **🔍 VERIFICAÇÕES NECESSÁRIAS:**

```javascript
// 1. Verificar se está logado
const sessionToken = localStorage.getItem('ludomusic_session_token');
const userData = localStorage.getItem('ludomusic_user_data');

// 2. Verificar se tem amigos
// Ir para perfil > amigos e verificar lista

// 3. Verificar se APIs estão funcionando
fetch('/api/friends').then(r => r.json()).then(console.log);
fetch('/api/lobby', { method: 'POST', body: JSON.stringify({nickname: 'Test'}) });
```

## 🧪 COMO TESTAR O SISTEMA

### **MÉTODO 1: Teste Automático**

1. **Abra o DevTools** (F12)
2. **Execute no console**:
   ```javascript
   // Carregar script de teste
   const script = document.createElement('script');
   script.src = '/test-multiplayer-invites.js';
   document.head.appendChild(script);
   
   // Executar teste completo
   testMultiplayerInvites.runComplete();
   ```

### **MÉTODO 2: Teste Manual**

#### **PASSO 1: Preparação**
1. **Crie 2 contas** diferentes
2. **Faça login** em ambas (em abas/navegadores diferentes)
3. **Adicione uma conta como amiga** da outra
4. **Aceite a solicitação** de amizade

#### **PASSO 2: Teste de Convite**
1. **Na Conta A**:
   - Vá para **Multiplayer**
   - Clique em **"Criar Sala"**
   - Digite um nickname e crie a sala
   - Clique no botão **"Convidar Amigos"** (ícone de usuário)
   - Selecione o amigo da lista
   - Clique em **"Enviar Convites"**

2. **Na Conta B**:
   - Verifique se aparece uma **notificação** (sino no canto)
   - Clique na **notificação**
   - Vá para a aba **"Convites"**
   - Deve aparecer o convite recebido
   - Clique em **"Aceitar"**

#### **PASSO 3: Verificação**
- **Conta B** deve ser redirecionada para a sala
- **Conta A** deve ver **Conta B** na lista de jogadores
- Ambos devem poder iniciar o jogo

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### **❌ "Nenhum amigo online"**
**Problema**: Lista de amigos aparece vazia no modal de convites
**Soluções**:
```javascript
// Verificar se tem amigos
fetch('/api/friends', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('ludomusic_session_token')}` }
}).then(r => r.json()).then(console.log);

// Forçar atualização de presença
// Recarregar a página ou aguardar alguns segundos
```

### **❌ "Convite não chega"**
**Problema**: Convite é enviado mas não aparece para o destinatário
**Soluções**:
```javascript
// Verificar se convite foi salvo
fetch('/api/get-invites?userId=USERID_DO_AMIGO', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('ludomusic_session_token')}` }
}).then(r => r.json()).then(console.log);

// Verificar logs no console do remetente
// Deve aparecer "✅ Convite enviado com sucesso"
```

### **❌ "Erro ao criar sala"**
**Problema**: Não consegue criar sala para convidar
**Soluções**:
```javascript
// Testar criação manual
fetch('/api/lobby', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nickname: 'TestUser' })
}).then(r => r.json()).then(console.log);
```

### **❌ "Erro de autenticação"**
**Problema**: APIs retornam erro 401
**Soluções**:
```javascript
// Verificar token
const token = localStorage.getItem('ludomusic_session_token');
console.log('Token:', token ? 'Presente' : 'Ausente');

// Se ausente, fazer login novamente
```

## 📊 TESTE DE VALIDAÇÃO COMPLETA

### **RESULTADO ESPERADO:**
```
🎮 RELATÓRIO DO TESTE DE CONVITES MULTIPLAYER
=============================================
✅ SISTEMA DE CONVITES FUNCIONANDO PERFEITAMENTE!
✅ 5/5 testes passaram (100%)

📋 DETALHES DOS TESTES:
   ✅ authentication
   ✅ friendsAvailable
   ✅ roomCreation
   ✅ inviteSending
   ✅ inviteReceiving

🎉 O sistema de convites está funcionando corretamente!
💡 Você pode convidar amigos para jogar multiplayer.
```

### **SE HOUVER PROBLEMAS:**
```
❌ PROBLEMAS ENCONTRADOS NO SISTEMA DE CONVITES!
❌ 3/5 testes passaram (60%)

🚨 ERROS ENCONTRADOS:
   1. Nenhum amigo encontrado para testar convites
   2. Erro ao enviar convite: Token de sessão não encontrado

⚠️ Há problemas que precisam ser corrigidos.
💡 Verifique se você tem amigos adicionados e está logado.
```

## 🔧 COMANDOS DE DEBUG

### **Verificar Estado Atual:**
```javascript
// Verificar autenticação
const token = localStorage.getItem('ludomusic_session_token');
const user = JSON.parse(localStorage.getItem('ludomusic_user_data') || '{}');
console.log('Logado:', !!token, 'Usuário:', user.username);

// Verificar amigos
fetch('/api/friends', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(data => {
  console.log('Amigos:', data.friends?.length || 0);
});

// Verificar convites pendentes
fetch('/api/get-invites?userId=' + (user.id || `auth_${user.username}`), {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(data => {
  console.log('Convites:', data.invites?.length || 0);
});
```

### **Testar Componentes Individuais:**
```javascript
// Testar apenas autenticação
testMultiplayerInvites.checkAuth();

// Testar apenas amigos
testMultiplayerInvites.checkFriends();

// Testar apenas criação de sala
testMultiplayerInvites.createRoom();
```

## ✅ CHECKLIST DE FUNCIONAMENTO

- [ ] Usuário está logado
- [ ] Tem pelo menos 1 amigo adicionado
- [ ] Amigo aparece como "online"
- [ ] Consegue criar sala de multiplayer
- [ ] Modal de convites abre corretamente
- [ ] Lista de amigos aparece no modal
- [ ] Consegue selecionar amigos
- [ ] Convite é enviado sem erro
- [ ] Destinatário recebe notificação
- [ ] Convite aparece na aba "Convites"
- [ ] Aceitar convite redireciona para a sala
- [ ] Ambos jogadores aparecem na sala

**🎯 RESULTADO: Sistema de convites funcionando perfeitamente!**
