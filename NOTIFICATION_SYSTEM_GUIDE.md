# 🔔 GUIA COMPLETO DO SISTEMA DE NOTIFICAÇÕES

## 🎯 VISÃO GERAL

O sistema de notificações do LudoMusic gerencia todos os tipos de notificações: convites multiplayer, conquistas, level ups, e notificações gerais.

## 🔧 COMPONENTES DO SISTEMA

### **1. CONTEXTO DE NOTIFICAÇÕES**
- **Arquivo**: `contexts/NotificationContext.js`
- **Função**: Gerenciar estado global de notificações
- **Recursos**: Polling automático, armazenamento local, integração com APIs

### **2. INTERFACE DE USUÁRIO**
- **Arquivo**: `components/NotificationCenter.js`
- **Função**: Exibir notificações e convites
- **Recursos**: Dropdown, abas, contadores, ações

### **3. NOTIFICAÇÕES DE CONQUISTAS**
- **Arquivo**: `components/AchievementNotification.js`
- **Função**: Toast notifications para conquistas e level ups
- **Recursos**: Animações, auto-dismiss, design personalizado

### **4. NOTIFICAÇÕES DO SISTEMA**
- **Arquivo**: `components/ResetNotification.js`
- **Função**: Notificações importantes do sistema
- **Recursos**: Modal persistente, informações importantes

## 📋 TIPOS DE NOTIFICAÇÕES

### **🎮 CONVITES MULTIPLAYER**
- **Origem**: Outros jogadores
- **Exibição**: Centro de notificações + notificação do navegador
- **Ações**: Aceitar, Recusar
- **Persistência**: 24 horas

### **🏆 CONQUISTAS**
- **Origem**: Sistema de achievements
- **Exibição**: Toast notification
- **Ações**: Auto-dismiss (5 segundos)
- **Persistência**: Não persistente

### **⭐ LEVEL UP**
- **Origem**: Sistema de XP
- **Exibição**: Toast notification
- **Ações**: Auto-dismiss (4 segundos)
- **Persistência**: Não persistente

### **ℹ️ INFORMAÇÕES GERAIS**
- **Origem**: Sistema/Admin
- **Exibição**: Centro de notificações
- **Ações**: Marcar como lida, Remover
- **Persistência**: 24 horas

## 🔄 FLUXO DE FUNCIONAMENTO

### **POLLING AUTOMÁTICO:**
1. **A cada 30-60 segundos** (otimizado por performance)
2. **Verifica novos convites** via API `/api/get-invites`
3. **Filtra convites recebidos** (não enviados)
4. **Cria notificações** para novos convites
5. **Atualiza contador** no sino

### **ARMAZENAMENTO:**
1. **localStorage**: Notificações e convites por usuário
2. **Vercel KV**: Convites multiplayer (servidor)
3. **Limpeza automática**: Remove itens expirados

### **EXIBIÇÃO:**
1. **Sino com contador**: Mostra total de não lidas
2. **Dropdown com abas**: Notificações e Convites
3. **Toast notifications**: Conquistas e level ups
4. **Notificações do navegador**: Se permitido

## 🧪 COMO TESTAR O SISTEMA

### **TESTE AUTOMÁTICO:**
```javascript
// No console do navegador
const script = document.createElement('script');
script.src = '/test-notifications.js';
document.head.appendChild(script);

// Executar teste completo
testNotifications.runComplete();
```

### **TESTE MANUAL:**

#### **1. NOTIFICAÇÕES DE CONVITES:**
1. **Crie 2 contas** e adicione como amigas
2. **Na Conta A**: Crie sala multiplayer e convide Conta B
3. **Na Conta B**: Verifique se aparece notificação no sino
4. **Clique no sino** e vá para aba "Convites"
5. **Aceite ou recuse** o convite

#### **2. NOTIFICAÇÕES DE CONQUISTAS:**
```javascript
// Simular conquista
window.showAchievementToast({
  title: 'Primeira Música',
  description: 'Acertou sua primeira música!',
  icon: '🎵',
  rarity: 'common',
  xpReward: 50
});
```

#### **3. NOTIFICAÇÕES DE LEVEL UP:**
```javascript
// Simular level up
window.showLevelUpToast(5);
```

#### **4. PERMISSÃO DO NAVEGADOR:**
1. **Clique em "Permitir"** quando solicitado
2. **Ou vá em Configurações** > Site > Notificações > Permitir

## 📊 VERIFICAÇÕES DE FUNCIONAMENTO

### **✅ CHECKLIST BÁSICO:**
- [ ] Usuário está logado
- [ ] Sino aparece no header
- [ ] Contador funciona corretamente
- [ ] Dropdown abre ao clicar
- [ ] Abas "Notificações" e "Convites" funcionam
- [ ] Permissão de notificações concedida

### **🔍 VERIFICAÇÕES TÉCNICAS:**
```javascript
// Verificar autenticação
const token = localStorage.getItem('ludomusic_session_token');
console.log('Logado:', !!token);

// Verificar notificações salvas
const user = JSON.parse(localStorage.getItem('ludomusic_user_data') || '{}');
const userId = user.id || `auth_${user.username}`;
const notifications = localStorage.getItem(`ludomusic_notifications_${userId}`);
console.log('Notificações salvas:', !!notifications);

// Verificar permissão do navegador
console.log('Permissão:', Notification.permission);

// Testar API de convites
fetch(`/api/get-invites?userId=${userId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### **❌ "Sino não aparece"**
**Problema**: Componente não renderizado
**Soluções**:
```javascript
// Verificar se está logado
const token = localStorage.getItem('ludomusic_session_token');
if (!token) {
  console.log('Faça login primeiro');
}

// Verificar se componente existe
const bell = document.querySelector('[aria-label="Notificações"]');
console.log('Sino encontrado:', !!bell);
```

### **❌ "Notificações não chegam"**
**Problema**: Polling não funcionando ou API com erro
**Soluções**:
```javascript
// Verificar logs do console
// Deve aparecer: "📥 Resposta da API de convites"

// Testar API manualmente
fetch('/api/get-invites?userId=SEU_USER_ID', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('ludomusic_session_token')}` }
}).then(r => r.json()).then(console.log);
```

### **❌ "Contador errado"**
**Problema**: Contagem incorreta de não lidas
**Soluções**:
```javascript
// Limpar notificações antigas
const userId = 'SEU_USER_ID';
localStorage.removeItem(`ludomusic_notifications_${userId}`);
localStorage.removeItem(`ludomusic_invitations_${userId}`);

// Recarregar página
window.location.reload();
```

### **❌ "Notificações do navegador não funcionam"**
**Problema**: Permissão negada ou não solicitada
**Soluções**:
```javascript
// Verificar permissão
console.log('Permissão:', Notification.permission);

// Solicitar permissão
Notification.requestPermission().then(permission => {
  console.log('Nova permissão:', permission);
});

// Testar notificação manual
if (Notification.permission === 'granted') {
  new Notification('Teste', { body: 'Funcionando!' });
}
```

## 📊 RESULTADO ESPERADO DO TESTE

### **✅ SUCESSO COMPLETO:**
```
🔔 RELATÓRIO DO TESTE DE NOTIFICAÇÕES
====================================
✅ SISTEMA DE NOTIFICAÇÕES FUNCIONANDO PERFEITAMENTE!
✅ 8/8 testes passaram (100%)

📋 DETALHES DOS TESTES:
   ✅ authentication
   ✅ component
   ✅ browserPermission
   ✅ createNotification
   ✅ browserNotification
   ✅ storage
   ✅ inviteAPI
   ✅ interaction

🎉 O sistema de notificações está funcionando corretamente!
💡 Você receberá notificações de convites, conquistas e outros eventos.
```

### **❌ PROBLEMAS ENCONTRADOS:**
```
❌ PROBLEMAS ENCONTRADOS NO SISTEMA DE NOTIFICAÇÕES!
❌ 5/8 testes passaram (62%)

🚨 ERROS ENCONTRADOS:
   1. Permissão de notificação não concedida
   2. Erro na API de convites: 401
   3. Dropdown não encontrado

⚠️ Há problemas que precisam ser corrigidos.
💡 Verifique se está logado e permita notificações do navegador.
```

## 🔧 COMANDOS DE DEBUG

### **Verificar Estado Atual:**
```javascript
// Status geral
testNotifications.checkAuth();
testNotifications.checkComponent();
testNotifications.checkPermission();

// Testar funcionalidades
testNotifications.createNotification();
testNotifications.testBrowser();
testNotifications.testAPI();
```

### **Limpar Dados:**
```javascript
// Limpar notificações
const userId = 'SEU_USER_ID';
localStorage.removeItem(`ludomusic_notifications_${userId}`);
localStorage.removeItem(`ludomusic_invitations_${userId}`);
```

### **Forçar Atualização:**
```javascript
// Recarregar página para reiniciar polling
window.location.reload();
```

## ✅ CHECKLIST FINAL

- [ ] Sistema de polling funcionando
- [ ] APIs de convites funcionando
- [ ] Componente de notificações renderizado
- [ ] Permissão do navegador concedida
- [ ] Armazenamento local funcionando
- [ ] Toast notifications funcionando
- [ ] Contador de não lidas correto
- [ ] Ações (aceitar/recusar) funcionando

**🎯 RESULTADO: Sistema de notificações completamente funcional!**
