# 📖 Manual do Administrador - LudoMusic

## 🚀 Acesso Rápido

**URL:** `/admin`  
**Senha:** `admin123`  
**Navegador recomendado:** Chrome, Firefox, Safari

## 📊 Dashboard Principal

### Visão Geral
O dashboard mostra um resumo completo do sistema:

- **👥 Usuários**: Total, ativos e com jogos
- **🎵 Música do Dia**: Música atual e opção para alterar
- **💰 Doações**: Pendentes e aprovadas
- **📈 Estatísticas**: Jogos de hoje e taxa de vitória global

### Ações Rápidas
- Clique nos botões "Alterar", "Gerenciar" para ir direto às seções
- Use "🔄 Atualizar" para recarregar dados em tempo real

## 👥 Gerenciamento de Usuários

### Visualizar Usuários
- **Lista completa** com informações essenciais
- **Busca** por username, nome ou ID
- **Filtros** por nível, XP, jogos, etc.
- **Ordenação** crescente/decrescente

### Ações por Usuário
- **🗑️ Deletar**: Remove conta permanentemente
- **🏆 Dar Conquista**: Concede achievement específico
- **Ver Detalhes**: Estatísticas completas

### Filtros Disponíveis
- Nível do usuário
- XP total
- Total de jogos
- Taxa de vitória
- Melhor streak
- Data de criação
- Último login

## 🎵 Gerenciamento de Músicas

### Música do Dia Atual
- Visualiza título, artista e jogo
- Mostra se foi definida manualmente ou automaticamente

### Definir Nova Música
1. Selecione uma música da lista dropdown
2. A música será aplicada imediatamente
3. Override do sistema automático por 24h

### Sistema Automático
- Música determinística baseada no dia do ano
- Garante que todos vejam a mesma música
- Volta automaticamente após override expirar

## 💰 Gerenciamento de Doações PIX

### Doações Pendentes
- Lista todas as doações aguardando verificação
- Mostra valor, email, data e ID

### Aprovar Doação
1. Clique em "✅ Aprovar"
2. Sistema gera código de ativação automaticamente
3. Email enviado ao doador com código e benefícios
4. Doação movida para lista de aprovadas

### Rejeitar Doação
1. Clique em "❌ Rejeitar"
2. Email enviado explicando a rejeição
3. Doação movida para lista de rejeitadas

### Benefícios por Valor
- **R$ 5+**: Badge Apoiador (30 dias) + 25% XP (7 dias)
- **R$ 15+**: Badge permanente + 50% XP (30 dias) + Avatar especial
- **R$ 30+**: Título personalizado + Cores especiais + Stats detalhadas
- **R$ 50+**: Badge VIP + Efeitos visuais + Ranking especial

## 🏆 Sistema de Conquistas

### Conquistas Disponíveis
- **🎮 Primeiro Jogo**: Para novos jogadores
- **🏆 Primeira Vitória**: Primeira música acertada
- **🎖️ Veterano**: 10+ partidas jogadas
- **🔥 Mestre das Sequências**: Streaks altas
- **💎 Jogador Perfeito**: Acertos em 1 tentativa
- **💝 Apoiador**: Para doadores
- **👑 VIP**: Para grandes apoiadores

### Como Conceder
1. Selecione o usuário na lista
2. Escolha a conquista/badge
3. Clique em "Conceder"
4. XP é adicionado automaticamente

## ⚙️ Configurações do Sistema

### Status do Sistema
- **Ambiente**: Produção/Desenvolvimento
- **KV Status**: Status do banco de dados
- **Memória**: Uso atual vs total
- **Uptime**: Tempo online do servidor

### Backup & Dados
- **Backup Completo**: Todos os dados (usuários, perfis, doações, jogos)
- **Backup Usuários**: Apenas contas de usuário
- **Backup Doações**: Apenas dados de doações
- **Reset Sistema**: ⚠️ CUIDADO - Remove todos os dados

### Estatísticas & Relatórios
- **Atualizar Stats**: Recarrega estatísticas do sistema
- **Exportar Dados**: Download JSON com todas as estatísticas
- **Gerar Relatório**: Download TXT com resumo executivo

### Manutenção
- **Verificar Integridade**: Checa problemas no sistema
- **Limpar Cache**: Remove dados temporários
- **Otimizar Performance**: Melhora velocidade
- **Modo Manutenção**: Desabilita acesso temporariamente

## 🔒 Segurança

### Autenticação
- Senha obrigatória para acesso
- Verificação em todas as APIs administrativas
- Logs de todas as ações importantes

### Boas Práticas
- ✅ Sempre fazer backup antes de mudanças grandes
- ✅ Verificar integridade regularmente
- ✅ Monitorar uso de memória
- ❌ Nunca compartilhar a senha admin
- ❌ Não fazer reset sem backup

## 🚨 Solução de Problemas

### "KV não disponível"
- Verificar variáveis de ambiente no Vercel
- Confirmar se KV_REST_API_URL e KV_REST_API_TOKEN estão configuradas

### "Erro ao carregar dados"
- Verificar conexão com internet
- Tentar atualizar a página
- Verificar se o servidor está online

### "Timeout do servidor"
- Aguardar alguns minutos
- Verificar status da Vercel
- Tentar novamente

### "Erro de autenticação"
- Confirmar senha: `admin123`
- Limpar cache do navegador
- Tentar em aba anônima

## 📞 Suporte

### Contato
- **Email**: andreibonatto8@gmail.com
- **Resposta**: Até 24h em dias úteis

### Informações Úteis para Suporte
- URL onde ocorreu o erro
- Mensagem de erro exata
- Ação que estava tentando fazer
- Navegador e versão
- Horário do problema

## 🎯 Dicas de Uso

### Eficiência
- Use o dashboard para visão geral rápida
- Mantenha múltiplas abas abertas para alternar rapidamente
- Faça backup antes de mudanças importantes
- Monitore doações diariamente

### Manutenção Regular
- **Diário**: Verificar doações pendentes
- **Semanal**: Revisar novos usuários e estatísticas
- **Mensal**: Fazer backup completo e verificar integridade
- **Conforme necessário**: Definir música do dia especial

### Monitoramento
- Acompanhe crescimento de usuários
- Monitore taxa de vitória global
- Verifique performance do sistema
- Analise padrões de doações

---

**🎵 LudoMusic Admin - Controle total na palma da sua mão! 🎮**
