# 🎵 LudoMusic

**O jogo de adivinhação musical mais divertido do Brasil!**

LudoMusic é um jogo web onde você precisa adivinhar músicas de videogames, animes e filmes. Teste seus conhecimentos musicais e compete com amigos!

## 🎮 Funcionalidades

### 🎯 **Modos de Jogo**
- **Modo Diário**: Uma música por dia para todos os jogadores
- **Modo Infinito**: Jogue quantas vezes quiser
- **Modo Multiplayer**: Compete com amigos em tempo real

### 👤 **Sistema de Usuários**
- Criação de conta e login
- Perfis personalizáveis com avatares
- Sistema de níveis e XP
- Histórico de jogos e estatísticas

### 🏆 **Progressão**
- Sistema de conquistas (achievements)
- Badges especiais
- Rankings e leaderboards
- Títulos personalizados

### 👥 **Social**
- Sistema de amigos
- Convites para partidas multiplayer
- Notificações em tempo real
- Perfis públicos

### 💝 **Sistema de Doações**
- Suporte via PIX (Brasil) e PayPal (Internacional)
- Benefícios exclusivos para apoiadores
- Badges VIP e cores especiais
- Ativação por código via email

## 🛠 Tecnologias

### **Frontend**
- **Next.js 14** - Framework React
- **React 18** - Biblioteca de interface
- **CSS Modules** - Estilização modular
- **Vercel Analytics** - Métricas de performance

### **Backend**
- **Vercel Functions** - API serverless
- **Vercel KV (Redis)** - Banco de dados em memória
- **Resend** - Envio de emails

### **Infraestrutura**
- **Vercel** - Hospedagem e deploy
- **Cloudflare R2** - Armazenamento de áudio
- **Service Workers** - Cache offline

### **Otimizações**
- Sistema de cache inteligente para áudio
- Lazy loading de componentes
- Compressão e otimização de assets
- Performance monitoring

## 🚀 Como Executar

### **Pré-requisitos**
- Node.js 18+ 
- npm ou yarn

### **Instalação**
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/ludomusic.git

# Entre no diretório
cd ludomusic

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# Execute em modo desenvolvimento
npm run dev
```

### **Variáveis de Ambiente**
```env
# Vercel KV (Redis)
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
KV_REST_API_READ_ONLY_TOKEN=your_readonly_token

# Resend (Email)
RESEND_API_KEY=your_resend_key

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_key
```

## 📁 Estrutura do Projeto

```
ludomusic/
├── components/          # Componentes React
├── contexts/           # Context providers
├── data/              # Dados estáticos (músicas, conquistas)
├── hooks/             # Custom hooks
├── pages/             # Páginas Next.js
│   └── api/          # API routes
├── public/            # Assets estáticos
├── scripts/           # Scripts de build e deploy
├── styles/            # CSS Modules
├── utils/             # Utilitários e helpers
└── docs/              # Documentação
```

## 🎵 Adicionando Músicas

As músicas são definidas em `data/music.json`:

```json
{
  "id": "unique_id",
  "title": "Nome da Música",
  "game": "Nome do Jogo",
  "artist": "Artista/Compositor",
  "year": 2023,
  "console": "PlayStation",
  "audioUrl": "https://cdn.ludomusic.xyz/audio/file.mp3"
}
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 💝 Apoie o Projeto

Se você gosta do LudoMusic, considere fazer uma doação:

- **PIX**: andreibonatto8@gmail.com
- **PayPal**: [Doar via PayPal](https://paypal.me/andreibonatto)

## 📞 Contato

- **Email**: andreibonatto8@gmail.com
- **Website**: [ludomusic.xyz](https://ludomusic.xyz)

---

**Feito com ❤️ por Andrei Bonatto**
