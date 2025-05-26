# 📧 Configuração do Sistema de Envio de Emails

Este documento explica como configurar o sistema de envio de emails para relatórios de erro no LudoMusic.

## 🎯 Visão Geral

O sistema de relatórios de erro agora envia emails automaticamente para `andreibonatto8@gmail.com` quando um usuário reporta um problema. O sistema tem múltiplos fallbacks para garantir que os relatórios sejam sempre recebidos.

## 🔧 Opções de Configuração

### Opção 1: SendGrid (Recomendado) ⭐

**Vantagens:**
- Mais confiável
- Melhor deliverability
- Fácil de configurar
- Gratuito até 100 emails/dia

**Configuração:**
1. Crie uma conta em [SendGrid](https://sendgrid.com/)
2. Gere uma API Key
3. Configure as variáveis de ambiente:
```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@ludomusic.xyz
```

### Opção 2: Gmail

**Vantagens:**
- Usa conta Gmail existente
- Simples de configurar

**Configuração:**
1. Ative a autenticação de 2 fatores na sua conta Gmail
2. Gere uma "Senha de App" específica
3. Configure as variáveis de ambiente:
```env
GMAIL_USER=andreibonatto8@gmail.com
GMAIL_PASS=your_app_password_here
```

### Opção 3: Vercel Email (Se disponível)

**Configuração:**
```env
VERCEL_EMAIL_API_KEY=your_vercel_email_key_here
```

## 🛡️ Sistema de Fallback

O sistema funciona em camadas para garantir que nenhum relatório seja perdido:

1. **Primeira tentativa:** Envio via API configurada (SendGrid/Gmail/Vercel)
2. **Segunda tentativa:** Fallback para `mailto:` (abre cliente de email do usuário)
3. **Terceira tentativa:** Salva em arquivo de log local (`logs/error-reports.log`)

## 📁 Estrutura dos Logs

Mesmo que o email não seja enviado, todos os relatórios são salvos em:
```
logs/error-reports.log
```

Formato do log:
```
=== RELATÓRIO DE ERRO ===
Data: 2025-01-XX XX:XX:XX
IP: XXX.XXX.XXX.XXX
URL: https://ludomusic.xyz/
User Agent: Mozilla/5.0...
Email: usuario@email.com
Descrição: Descrição do erro aqui
========================
```

## 🚀 Deploy no Vercel

Para configurar no Vercel:

1. Vá para o dashboard do seu projeto
2. Acesse "Settings" > "Environment Variables"
3. Adicione as variáveis necessárias:
   - `SENDGRID_API_KEY`
   - `SENDGRID_FROM_EMAIL`

## 🧪 Testando o Sistema

1. Acesse o jogo
2. Abra o menu (botão ☰)
3. Expanda "Relatório de erro"
4. Preencha o formulário e envie
5. Verifique se recebeu o email

## 📊 Monitoramento

Para monitorar os relatórios:

1. **Emails:** Verifique a caixa de entrada de `andreibonatto8@gmail.com`
2. **Logs:** Acesse o arquivo `logs/error-reports.log` no servidor
3. **Console:** Verifique os logs do Vercel para erros de envio

## 🔍 Troubleshooting

### Emails não estão chegando:

1. Verifique se as variáveis de ambiente estão configuradas
2. Verifique a pasta de spam
3. Teste com uma conta de email diferente
4. Verifique os logs do Vercel para erros

### Erro "API falhou":

1. Verifique se a API Key está correta
2. Verifique se o serviço (SendGrid/Gmail) está funcionando
3. O sistema automaticamente usará o fallback `mailto:`

### Logs não estão sendo criados:

1. Verifique as permissões de escrita no servidor
2. No Vercel, os logs são temporários (use email como principal)

## 📝 Formato do Email

Os emails enviados incluem:
- Data e hora do relatório
- Email do usuário (se fornecido)
- URL da página onde ocorreu o erro
- Informações do navegador
- IP do usuário
- Descrição detalhada do erro

## 🔒 Segurança

- As API Keys são armazenadas como variáveis de ambiente
- Informações sensíveis não são logadas
- O sistema não expõe dados internos nos emails
