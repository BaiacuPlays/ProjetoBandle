# Sistema Multiplayer - Bandle

## Visão Geral

O sistema multiplayer do Bandle permite que múltiplos jogadores joguem juntos em tempo real, adivinhando músicas de videogames em um formato competitivo.

## Funcionalidades Implementadas

### 🎮 Criação e Gerenciamento de Salas
- **Criação de Sala**: Host cria uma sala com nickname obrigatório
- **Código de Sala**: Geração automática de código de 6 caracteres (letras e números)
- **Entrada na Sala**: Outros jogadores entram usando código + nickname obrigatório
- **Mínimo de Jogadores**: 2 jogadores mínimo para iniciar
- **Sem Limite Máximo**: Suporte para qualquer número de jogadores

### 🎵 Sistema de Jogo
- **10 Rodadas**: Cada jogo tem exatamente 10 rodadas
- **Músicas Determinísticas**: Mesma música para todos os jogadores em cada rodada
- **6 Tentativas por Rodada**: Cada jogador tem até 6 tentativas por música
- **Bloqueio por Acerto**: Quando alguém acerta, a rodada é bloqueada para todos
- **Sistema de Pontuação**: 1 ponto por música acertada
- **Sistema de Desempate**: Rodadas extras em caso de empate

### 🔄 Sincronização em Tempo Real
- **Polling Automático**: Atualização do estado a cada 2 segundos
- **Estados Sincronizados**: Tentativas, pontuações e progresso do jogo
- **Notificações**: Avisos quando alguém acerta ou quando é sua vez

### 🎯 Controles do Host
- **Iniciar Jogo**: Apenas o host pode iniciar quando há jogadores suficientes
- **Próxima Rodada**: Host controla quando avançar após alguém acertar
- **Resetar Jogo**: Host pode reiniciar o jogo a qualquer momento
- **Gerenciar Sala**: Controle total sobre o fluxo do jogo

## Arquitetura Técnica

### 📁 Estrutura de Arquivos

```
├── pages/
│   ├── multiplayer.js          # Página principal do multiplayer
│   └── api/
│       └── lobby.js            # API para gerenciamento de salas
├── components/
│   ├── MultiplayerLobby.js     # Componente de lobby/sala de espera
│   └── MultiplayerGame.js      # Componente do jogo multiplayer
├── hooks/
│   └── useMultiplayer.js       # Hook para gerenciar estado multiplayer
├── styles/
│   └── Multiplayer.module.css  # Estilos específicos do multiplayer
└── data/
    └── translations.js         # Traduções para PT, EN e ES
```

### 🔧 Tecnologias Utilizadas

- **Next.js**: Framework React para frontend e API routes
- **Vercel KV**: Banco de dados Redis para armazenamento de salas
- **React Hooks**: Gerenciamento de estado local e efeitos
- **CSS Modules**: Estilização isolada dos componentes
- **FontAwesome**: Ícones para interface

### 🌐 API Endpoints

#### `POST /api/lobby`
Cria uma nova sala de jogo
```json
{
  "nickname": "string"
}
```

#### `PUT /api/lobby`
Entra em uma sala existente
```json
{
  "nickname": "string",
  "roomCode": "string"
}
```

#### `PATCH /api/lobby`
Executa ações na sala (start, guess, next_round, etc.)
```json
{
  "roomCode": "string",
  "action": "string",
  "nickname": "string",
  "guess": "string" // opcional, apenas para action: "guess"
}
```

#### `GET /api/lobby?roomCode=ABC123`
Obtém o estado atual da sala

### 📊 Estrutura de Dados

#### Lobby/Sala
```javascript
{
  players: ["jogador1", "jogador2"],
  host: "jogador1",
  gameStarted: false,
  gameState: {
    currentRound: 1,
    totalRounds: 10,
    songs: [...],
    scores: { "jogador1": 0, "jogador2": 0 },
    currentSong: {...},
    roundWinner: null,
    gameFinished: false,
    attempts: { "jogador1": 0, "jogador2": 0 },
    guesses: { "jogador1": [], "jogador2": [] },
    isTiebreaker: false
  }
}
```

## Como Usar

### 🚀 Para Jogadores

1. **Acessar Multiplayer**: Clique no botão "Multiplayer" no menu principal
2. **Criar Sala**: 
   - Clique em "Criar Sala"
   - Digite seu nickname
   - Compartilhe o código gerado com outros jogadores
3. **Entrar na Sala**:
   - Clique em "Entrar na Sala"
   - Digite seu nickname e o código da sala
4. **Jogar**:
   - Aguarde o host iniciar o jogo
   - Ouça o trecho musical e tente adivinhar
   - Compete com outros jogadores por 10 rodadas

### 🎮 Para Hosts

1. **Gerenciar Jogadores**: Aguarde jogadores entrarem na sala
2. **Iniciar Jogo**: Clique em "Iniciar Jogo" quando houver pelo menos 2 jogadores
3. **Controlar Rodadas**: Clique em "Próxima Rodada" após alguém acertar
4. **Finalizar**: Veja os resultados finais e opte por jogar novamente

## Recursos Especiais

### 🎯 Sistema de Desempate
- Quando há empate na pontuação final, uma rodada extra é adicionada
- Apenas os jogadores empatados participam do desempate
- O processo continua até haver um vencedor único

### 🌍 Suporte Multilíngue
- Interface disponível em Português, Inglês e Espanhol
- Traduções automáticas baseadas na configuração do usuário

### 📱 Design Responsivo
- Interface adaptada para desktop, tablet e mobile
- Experiência otimizada em todos os dispositivos

### 🔄 Recuperação de Erros
- Sistema robusto de tratamento de erros
- Reconexão automática em caso de problemas de rede
- Validações tanto no frontend quanto no backend

## Limitações e Considerações

- **Dependência de Rede**: Requer conexão estável para sincronização
- **Armazenamento Temporário**: Salas são mantidas apenas enquanto há jogadores ativos
- **Sem Persistência**: Histórico de jogos não é salvo permanentemente
- **Polling**: Atualização a cada 2 segundos (pode ser otimizado com WebSockets no futuro)

## Próximas Melhorias Sugeridas

1. **WebSockets**: Implementar comunicação em tempo real
2. **Histórico de Partidas**: Salvar resultados de jogos anteriores
3. **Sistema de Ranking**: Classificação global de jogadores
4. **Salas Privadas**: Opção de salas com senha
5. **Espectadores**: Permitir assistir jogos sem participar
6. **Chat**: Sistema de mensagens entre jogadores
7. **Customização**: Permitir escolher número de rodadas e categorias de música
