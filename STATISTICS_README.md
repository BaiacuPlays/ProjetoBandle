# Sistema de Estatísticas - LudoMusic

## Visão Geral

O sistema de estatísticas foi implementado para mostrar dados detalhados sobre o desempenho dos jogadores após cada partida, tanto no modo single player quanto no multiplayer.

## Funcionalidades

### 📊 Estatísticas Exibidas

1. **Partidas Jogadas**: Total de jogos completados
2. **Taxa de Vitória**: Percentual de jogos ganhos
3. **Média de Tentativas**: Número médio de tentativas para acertar
4. **Distribuição de Acertos**: Gráfico mostrando em qual tentativa (1-6) o jogador costuma acertar
5. **Percentual de Derrotas**: Quantos jogos não foram completados com sucesso

### 🎮 Modos de Jogo

#### Single Player
- Estatísticas são salvas após cada jogo (vitória ou derrota)
- Dados persistem no localStorage do navegador
- Modal aparece automaticamente 0.8 segundos após o fim do jogo

#### Multiplayer
- Sistema de estatísticas não implementado no multiplayer
- Foco nas estatísticas individuais do modo single player

### 💾 Armazenamento de Dados

Os dados são armazenados localmente no navegador usando `localStorage` com a chave `bandle_statistics`:

```json
{
  "totalGames": 10,
  "wins": 7,
  "losses": 3,
  "attemptDistribution": [2, 3, 1, 1, 0, 0],
  "winPercentage": 70,
  "averageAttempts": 2.3
}
```

### 🎨 Interface Visual

- **Modal responsivo** que se adapta a diferentes tamanhos de tela
- **Barras de progresso** para visualizar a distribuição de acertos
- **Cores diferenciadas** para vitórias (verde) e derrotas (vermelho)
- **Animações suaves** para uma melhor experiência do usuário

## Arquivos Implementados

### Componentes
- `components/Statistics.js` - Componente principal do modal de estatísticas
- `styles/Statistics.module.css` - Estilos específicos para o componente

### Integrações
- `pages/index.js` - Integração no modo single player
- `data/translations.js` - Traduções em português, inglês e espanhol

## Como Funciona

### 1. Coleta de Dados
Quando um jogo termina (vitória ou derrota), o sistema:
- Identifica o resultado (ganhou/perdeu)
- Conta o número de tentativas usadas
- Salva os dados no localStorage

### 2. Cálculo de Estatísticas
- **Taxa de Vitória**: `(vitórias / total de jogos) * 100`
- **Média de Tentativas**: `soma das tentativas das vitórias / número de vitórias`
- **Distribuição**: Array com contadores para cada tentativa (1-6)

### 3. Exibição
- Modal aparece automaticamente após o fim do jogo
- Mostra estatísticas atualizadas incluindo o jogo atual
- Permite ao jogador continuar clicando em "Continuar"

## Recursos Especiais

### 🌍 Multilíngue
Suporte completo para:
- Português (pt-BR)
- Inglês (en-US)
- Espanhol (es)

### 📱 Responsivo
- Layout adaptativo para desktop, tablet e mobile
- Otimizado para diferentes resoluções de tela

### 🔧 Modo de Desenvolvimento
- Botão de teste visível apenas em desenvolvimento
- Permite testar o modal sem completar um jogo

## Uso

### Para Jogadores
1. Jogue normalmente (single player ou multiplayer)
2. Complete o jogo (acerte ou esgote as tentativas)
3. O modal de estatísticas aparecerá automaticamente
4. Visualize suas estatísticas e clique em "Continuar"

### Para Desenvolvedores
1. Em modo de desenvolvimento, use o botão "Testar Estatísticas" no canto inferior direito
2. As estatísticas são salvas automaticamente no localStorage
3. Para limpar os dados: `localStorage.removeItem('bandle_statistics')`

## Personalização

### Modificar Cores
Edite o arquivo `styles/Statistics.module.css` para alterar:
- Cores das barras de progresso
- Cores de fundo do modal
- Cores dos textos e botões

### Adicionar Novas Métricas
1. Modifique a estrutura de dados em `components/Statistics.js`
2. Atualize a função `saveGameResult`
3. Adicione a exibição na interface

### Traduzir para Novos Idiomas
1. Adicione as traduções em `data/translations.js`
2. Inclua as chaves necessárias para estatísticas
3. Teste com o novo idioma

## Considerações Técnicas

- **Performance**: Dados são salvos apenas quando necessário
- **Compatibilidade**: Funciona em todos os navegadores modernos
- **Privacidade**: Dados ficam apenas no dispositivo do usuário
- **Backup**: Usuários podem exportar dados manualmente se necessário

## Futuras Melhorias

- [ ] Gráficos mais avançados (charts.js)
- [ ] Comparação com outros jogadores
- [ ] Histórico detalhado de partidas
- [ ] Exportação de dados em CSV/JSON
- [ ] Estatísticas por período (diário, semanal, mensal)
