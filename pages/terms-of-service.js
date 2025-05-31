import React from 'react';
import Head from 'next/head';
import styles from '../styles/LegalPages.module.css';

const TermsOfService = () => {
  return (
    <>
      <Head>
        <title>Termos de Uso - LudoMusic</title>
        <meta name="description" content="Termos de Uso do LudoMusic - Regras e condições para uso do nosso jogo musical." />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className={styles.container}>
        <div className={styles.content}>
          <h1>📋 Termos de Uso</h1>
          <p className={styles.lastUpdated}>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <section className={styles.section}>
            <h2>1. Aceitação dos Termos</h2>
            <p>Ao acessar e usar o LudoMusic, você concorda com estes Termos de Uso. Se não concordar, não use nosso serviço.</p>
          </section>

          <section className={styles.section}>
            <h2>2. Descrição do Serviço</h2>
            <p>O LudoMusic é um jogo musical online gratuito onde os usuários adivinham músicas de videogames. Oferecemos:</p>
            <ul>
              <li>Modo single player</li>
              <li>Modo multiplayer</li>
              <li>Biblioteca de músicas de jogos</li>
              <li>Sistema de pontuação</li>
              <li>Estatísticas de jogo</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Uso Aceitável</h2>
            <p>Você concorda em:</p>
            <ul>
              <li>Usar o serviço apenas para fins legais</li>
              <li>Não tentar hackear ou comprometer a segurança</li>
              <li>Não usar bots ou scripts automatizados</li>
              <li>Respeitar outros usuários</li>
              <li>Não compartilhar conteúdo ofensivo</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Propriedade Intelectual</h2>
            <p>As músicas utilizadas no jogo são propriedade de seus respectivos criadores e editoras. O LudoMusic utiliza trechos curtos para fins educacionais e de entretenimento, conforme permitido pela lei de uso justo.</p>
            <p>O código e design do LudoMusic são propriedade dos desenvolvedores.</p>
          </section>

          <section className={styles.section}>
            <h2>5. Contas de Usuário</h2>
            <p>Quando aplicável:</p>
            <ul>
              <li>Você é responsável por manter a segurança de sua conta</li>
              <li>Não compartilhe suas credenciais</li>
              <li>Notifique-nos sobre uso não autorizado</li>
              <li>Podemos suspender contas que violem estes termos</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Limitação de Responsabilidade</h2>
            <p>O LudoMusic é fornecido "como está". Não garantimos:</p>
            <ul>
              <li>Disponibilidade ininterrupta do serviço</li>
              <li>Ausência de erros ou bugs</li>
              <li>Compatibilidade com todos os dispositivos</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>7. Modificações do Serviço</h2>
            <p>Reservamos o direito de:</p>
            <ul>
              <li>Modificar ou descontinuar o serviço</li>
              <li>Atualizar estes termos</li>
              <li>Adicionar ou remover funcionalidades</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>8. Rescisão</h2>
            <p>Podemos encerrar ou suspender seu acesso ao serviço por violação destes termos, sem aviso prévio.</p>
          </section>

          <section className={styles.section}>
            <h2>9. Lei Aplicável</h2>
            <p>Estes termos são regidos pelas leis brasileiras. Disputas serão resolvidas nos tribunais competentes do Brasil.</p>
          </section>

          <section className={styles.section}>
            <h2>10. Contato</h2>
            <p>Para questões sobre estes termos:</p>
            <ul>
              <li><strong>Email:</strong> andreibonatto8@gmail.com</li>
              <li><strong>Site:</strong> ludomusic.xyz</li>
            </ul>
          </section>

          <div className={styles.backButton}>
            <button onClick={() => window.history.back()}>
              ← Voltar ao Jogo
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
