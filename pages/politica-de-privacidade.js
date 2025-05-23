import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Footer from '../components/Footer';
import styles from '../styles/Legal.module.css';

const PoliticaDePrivacidade = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Política de Privacidade | Bandle</title>
        <meta name="description" content="Política de privacidade do Bandle - jogo de adivinhação de músicas de videogames" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/">
            <img src="/Logo.png" alt="Logo Bandle" className={styles.logo} />
          </Link>
          <h1 className={styles.title}>Política de Privacidade</h1>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Introdução</h2>
            <p>
              Esta Política de Privacidade descreve como o Bandle coleta, usa e compartilha informações quando você utiliza 
              nosso site. Respeitamos sua privacidade e estamos comprometidos em proteger seus dados pessoais.
            </p>
            <p>
              Ao utilizar o Bandle, você concorda com a coleta e uso de informações de acordo com esta política.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Informações que Coletamos</h2>
            <p>
              <strong>Informações de Uso:</strong> Coletamos informações sobre como você interage com nosso site, 
              incluindo as páginas que você visita, o tempo gasto no site, e suas interações com o jogo.
            </p>
            <p>
              <strong>Informações do Dispositivo:</strong> Podemos coletar informações sobre o dispositivo que você usa 
              para acessar o Bandle, incluindo o tipo de dispositivo, sistema operacional, navegador e configurações de idioma.
            </p>
            <p>
              <strong>Cookies e Tecnologias Similares:</strong> Utilizamos cookies e tecnologias similares para melhorar 
              sua experiência, entender como você usa nosso site e personalizar o conteúdo.
            </p>
            <p>
              <strong>Armazenamento Local:</strong> Utilizamos o armazenamento local do navegador para salvar seu progresso 
              no jogo e suas preferências, permitindo que você continue de onde parou em visitas futuras.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Como Usamos as Informações</h2>
            <p>
              Utilizamos as informações coletadas para:
            </p>
            <ul>
              <li>Fornecer, manter e melhorar o Bandle</li>
              <li>Entender como os usuários interagem com o jogo</li>
              <li>Detectar, prevenir e resolver problemas técnicos</li>
              <li>Desenvolver novos recursos e funcionalidades</li>
              <li>Personalizar sua experiência de jogo</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Compartilhamento de Informações</h2>
            <p>
              Não vendemos, comercializamos ou transferimos suas informações pessoais para terceiros, exceto nas 
              seguintes circunstâncias:
            </p>
            <ul>
              <li>Com provedores de serviços que nos ajudam a operar o site (como serviços de hospedagem e análise)</li>
              <li>Para cumprir com obrigações legais</li>
              <li>Para proteger nossos direitos, propriedade ou segurança</li>
              <li>Com seu consentimento ou sob sua direção</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. Segurança de Dados</h2>
            <p>
              A segurança de seus dados é importante para nós, mas lembre-se que nenhum método de transmissão pela 
              internet ou método de armazenamento eletrônico é 100% seguro. Embora nos esforcemos para usar meios 
              comercialmente aceitáveis para proteger suas informações pessoais, não podemos garantir sua segurança absoluta.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Seus Direitos</h2>
            <p>
              Dependendo da sua localização, você pode ter certos direitos relacionados aos seus dados pessoais, incluindo:
            </p>
            <ul>
              <li>Direito de acesso às suas informações pessoais</li>
              <li>Direito de retificação de dados imprecisos</li>
              <li>Direito de exclusão de seus dados pessoais</li>
              <li>Direito de restringir ou opor-se ao processamento de seus dados</li>
              <li>Direito à portabilidade de dados</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, entre em contato conosco através do e-mail fornecido abaixo.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Alterações a Esta Política</h2>
            <p>
              Podemos atualizar nossa Política de Privacidade de tempos em tempos. Notificaremos você sobre quaisquer 
              alterações publicando a nova Política de Privacidade nesta página e, se as alterações forem significativas, 
              forneceremos um aviso mais proeminente.
            </p>
            <p>
              Recomendamos que você revise esta Política de Privacidade periodicamente para quaisquer alterações. 
              Alterações a esta Política de Privacidade são efetivas quando publicadas nesta página.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Contato</h2>
            <p>
              Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco pelo e-mail: 
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

export default PoliticaDePrivacidade;
