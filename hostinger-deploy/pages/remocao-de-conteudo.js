import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Footer from '../components/Footer';
import styles from '../styles/Legal.module.css';

const RemocaoDeConteudo = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Remoção de Conteúdo | Bandle</title>
        <meta name="description" content="Política de remoção de conteúdo do Bandle - jogo de adivinhação de músicas de videogames" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/">
            <img src="/Logo.png" alt="Logo Bandle" className={styles.logo} />
          </Link>
          <h1 className={styles.title}>Remoção de Conteúdo</h1>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Política de Remoção de Conteúdo</h2>
            <p>
              O Bandle respeita os direitos de propriedade intelectual de terceiros e espera que seus usuários façam o mesmo. 
              Estamos comprometidos em responder a notificações de alegadas violações de direitos autorais que cumpram com a 
              legislação aplicável.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Uso de Conteúdo no Bandle</h2>
            <p>
              O Bandle utiliza trechos de músicas de videogames para fins de entretenimento e educacionais, sob o princípio 
              de uso justo (fair use). Acreditamos que o uso limitado desses trechos musicais para um jogo de adivinhação 
              não prejudica o mercado potencial ou o valor das obras originais, e na verdade pode promover o interesse 
              nas trilhas sonoras de videogames.
            </p>
            <p>
              Todos os direitos sobre as músicas pertencem aos seus respectivos detentores, e reconhecemos plenamente 
              a propriedade intelectual dos criadores originais.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Solicitação de Remoção de Conteúdo</h2>
            <p>
              Se você é um detentor de direitos autorais ou seu representante autorizado e acredita que qualquer conteúdo 
              no Bandle infringe seus direitos autorais, você pode enviar uma solicitação de remoção fornecendo as seguintes 
              informações:
            </p>
            <ol>
              <li>Identificação da obra protegida por direitos autorais que você alega ter sido violada</li>
              <li>Identificação do material no Bandle que você alega estar infringindo seus direitos autorais</li>
              <li>Suas informações de contato, incluindo endereço, número de telefone e e-mail</li>
              <li>Uma declaração de que você acredita de boa-fé que o uso do material da maneira reclamada não é autorizado pelo proprietário dos direitos autorais, seu agente ou pela lei</li>
              <li>Uma declaração, sob pena de perjúrio, de que as informações na sua notificação são precisas e que você é o proprietário dos direitos autorais ou está autorizado a agir em nome do proprietário</li>
              <li>Sua assinatura física ou eletrônica</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>4. Como Enviar uma Solicitação</h2>
            <p>
              Você pode enviar sua solicitação de remoção de conteúdo para o seguinte endereço de e-mail:
            </p>
            <p className={styles.emailHighlight}>
              <a href="mailto:andreibonatto8@gmail.com" className={styles.link}>andreibonatto8@gmail.com</a>
            </p>
            <p>
              Por favor, inclua "Solicitação de Remoção de Conteúdo" na linha de assunto do e-mail.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Nosso Processo</h2>
            <p>
              Após receber uma solicitação válida de remoção de conteúdo, tomaremos as seguintes medidas:
            </p>
            <ul>
              <li>Confirmaremos o recebimento da sua solicitação</li>
              <li>Revisaremos a solicitação para verificar se contém todas as informações necessárias</li>
              <li>Avaliaremos a alegação de violação de direitos autorais</li>
              <li>Se a solicitação for válida, removeremos ou desativaremos o acesso ao conteúdo em questão prontamente</li>
              <li>Notificaremos você sobre a ação tomada</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Contra-Notificação</h2>
            <p>
              Se você acredita que seu conteúdo foi removido por engano ou identificado incorretamente, você pode enviar 
              uma contra-notificação com as seguintes informações:
            </p>
            <ol>
              <li>Sua assinatura física ou eletrônica</li>
              <li>Identificação do material que foi removido e a localização onde o material aparecia antes de ser removido</li>
              <li>Uma declaração sob pena de perjúrio de que você acredita de boa-fé que o material foi removido ou desativado como resultado de um erro ou identificação incorreta</li>
              <li>Seu nome, endereço e número de telefone, e uma declaração de que você consente com a jurisdição do Tribunal Federal do distrito judicial onde seu endereço está localizado</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>7. Contato</h2>
            <p>
              Se você tiver alguma dúvida sobre nossa política de remoção de conteúdo, entre em contato conosco pelo e-mail: 
              <a href="mailto:andreibonatto8@gmail.com" className={styles.link}> andreibonatto8@gmail.com</a>
            </p>
          </section>

          <div className={styles.backLink}>
            <Link href="/" className={styles.button}>
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RemocaoDeConteudo;
