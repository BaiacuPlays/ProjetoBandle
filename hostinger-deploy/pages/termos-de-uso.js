import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Footer from '../components/Footer';
import styles from '../styles/Legal.module.css';

const TermosDeUso = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Termos de Uso | Bandle</title>
        <meta name="description" content="Termos de uso do Bandle - jogo de adivinhação de músicas de videogames" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/">
            <img src="/Logo.png" alt="Logo Bandle" className={styles.logo} />
          </Link>
          <h1 className={styles.title}>Termos de Uso</h1>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar o site Bandle, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não poderá acessar ou utilizar nosso serviço.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Descrição do Serviço</h2>
            <p>
              O Bandle é um jogo de adivinhação de músicas de videogames que permite aos usuários ouvir trechos de músicas 
              e tentar identificá-las. O serviço é fornecido "como está" e "conforme disponível", sem garantias de qualquer tipo.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Uso do Serviço</h2>
            <p>
              Você concorda em usar o Bandle apenas para fins legais e de acordo com estes Termos. Você não deve:
            </p>
            <ul>
              <li>Violar quaisquer leis aplicáveis ou regulamentos</li>
              <li>Tentar acessar áreas restritas do site</li>
              <li>Interferir ou interromper a integridade ou o desempenho do serviço</li>
              <li>Tentar contornar medidas de segurança ou autenticação</li>
              <li>Coletar ou armazenar dados pessoais de outros usuários</li>
              <li>Distribuir vírus, worms, ou outro código malicioso</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Propriedade Intelectual</h2>
            <p>
              O conteúdo do Bandle, incluindo mas não limitado a textos, gráficos, logotipos, ícones, imagens, clipes de áudio, 
              downloads digitais e compilações de dados, é propriedade do Bandle ou de seus licenciadores e está protegido por 
              leis de direitos autorais e propriedade intelectual.
            </p>
            <p>
              Os trechos de áudio utilizados no jogo são propriedade de seus respectivos detentores de direitos autorais e são 
              utilizados para fins de entretenimento e educacionais sob o princípio de uso justo (fair use).
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Limitação de Responsabilidade</h2>
            <p>
              Em nenhuma circunstância o Bandle, seus diretores, funcionários, parceiros ou agentes serão responsáveis por 
              quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, 
              perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis, resultantes de:
            </p>
            <ul>
              <li>Seu acesso ou uso ou incapacidade de acessar ou usar o serviço</li>
              <li>Qualquer conduta ou conteúdo de terceiros no serviço</li>
              <li>Acesso não autorizado, uso ou alteração de suas transmissões ou conteúdo</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Modificações dos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar ou substituir estes termos a qualquer momento. Se uma revisão for material, 
              tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes que quaisquer novos termos entrem em vigor.
            </p>
            <p>
              O que constitui uma alteração material será determinado a nosso critério. Ao continuar a acessar ou usar nosso 
              serviço após essas revisões se tornarem efetivas, você concorda em estar vinculado aos termos revisados.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Lei Aplicável</h2>
            <p>
              Estes termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar suas disposições 
              sobre conflitos de leis.
            </p>
            <p>
              Nossa falha em fazer valer qualquer direito ou disposição destes Termos não será considerada uma renúncia a 
              esses direitos. Se qualquer disposição destes Termos for considerada inválida ou inexequível por um tribunal, 
              as disposições restantes destes Termos permanecerão em vigor.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Contato</h2>
            <p>
              Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco pelo e-mail: 
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

export default TermosDeUso;
