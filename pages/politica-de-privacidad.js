import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Footer from '../components/Footer';
import styles from '../styles/Legal.module.css';

const PoliticaDePrivacidad = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Política de Privacidad | Bandle</title>
        <meta name="description" content="Política de privacidad de Bandle - juego de adivinanza de música de videojuegos" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/">
            <img src="/Logo.png" alt="Logo Bandle" className={styles.logo} />
          </Link>
          <h1 className={styles.title}>Política de Privacidad</h1>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Introducción</h2>
            <p>
              Esta Política de Privacidad describe cómo Bandle recopila, utiliza y comparte información cuando utiliza
              nuestro sitio web. Respetamos su privacidad y estamos comprometidos a proteger sus datos personales.
            </p>
            <p>
              Al utilizar Bandle, acepta la recopilación y el uso de información de acuerdo con esta política.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Información que Recopilamos</h2>
            <p>
              <strong>Información de Uso:</strong> Recopilamos información sobre cómo interactúa con nuestro sitio web,
              incluidas las páginas que visita, el tiempo que pasa en el sitio y sus interacciones con el juego.
            </p>
            <p>
              <strong>Información del Dispositivo:</strong> Podemos recopilar información sobre el dispositivo que utiliza
              para acceder a Bandle, incluido el tipo de dispositivo, sistema operativo, navegador y configuración de idioma.
            </p>
            <p>
              <strong>Cookies y Tecnologías Similares:</strong> Utilizamos cookies y tecnologías similares para mejorar
              su experiencia, comprender cómo utiliza nuestro sitio y personalizar el contenido.
            </p>
            <p>
              <strong>Almacenamiento Local:</strong> Utilizamos el almacenamiento local del navegador para guardar su progreso
              en el juego y sus preferencias, permitiéndole continuar donde lo dejó en futuras visitas.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Cómo Utilizamos la Información</h2>
            <p>
              Utilizamos la información que recopilamos para:
            </p>
            <ul>
              <li>Proporcionar, mantener y mejorar Bandle</li>
              <li>Entender cómo los usuarios interactúan con el juego</li>
              <li>Detectar, prevenir y abordar problemas técnicos</li>
              <li>Desarrollar nuevas características y funcionalidades</li>
              <li>Personalizar su experiencia de juego</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Compartir Información</h2>
            <p>
              No vendemos, comerciamos ni transferimos su información personal a terceros, excepto en las
              siguientes circunstancias:
            </p>
            <ul>
              <li>Con proveedores de servicios que nos ayudan a operar el sitio web (como servicios de alojamiento y análisis)</li>
              <li>Para cumplir con obligaciones legales</li>
              <li>Para proteger nuestros derechos, propiedad o seguridad</li>
              <li>Con su consentimiento o bajo su dirección</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. Seguridad de Datos</h2>
            <p>
              La seguridad de sus datos es importante para nosotros, pero recuerde que ningún método de transmisión por
              Internet o método de almacenamiento electrónico es 100% seguro. Si bien nos esforzamos por utilizar medios
              comercialmente aceptables para proteger su información personal, no podemos garantizar su seguridad absoluta.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Sus Derechos</h2>
            <p>
              Dependiendo de su ubicación, puede tener ciertos derechos relacionados con sus datos personales, incluidos:
            </p>
            <ul>
              <li>Derecho a acceder a su información personal</li>
              <li>Derecho a rectificar datos inexactos</li>
              <li>Derecho a la eliminación de sus datos personales</li>
              <li>Derecho a restringir u oponerse al procesamiento de sus datos</li>
              <li>Derecho a la portabilidad de datos</li>
            </ul>
            <p>
              Para ejercer cualquiera de estos derechos, contáctenos utilizando el correo electrónico proporcionado a continuación.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Cambios a Esta Política</h2>
            <p>
              Podemos actualizar nuestra Política de Privacidad de vez en cuando. Le notificaremos cualquier cambio publicando
              la nueva Política de Privacidad en esta página y, si los cambios son significativos, proporcionaremos un aviso
              más prominente.
            </p>
            <p>
              Le recomendamos que revise esta Política de Privacidad periódicamente para cualquier cambio. Los cambios a esta
              Política de Privacidad son efectivos cuando se publican en esta página.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Contacto</h2>
            <p>
              Si tiene alguna pregunta sobre esta Política de Privacidad, contáctenos en:
              <a href="mailto:andreibonatto8@gmail.com" className={styles.link}> andreibonatto8@gmail.com</a>
            </p>
          </section>

          <div className={styles.backLink}>
            <Link href="/" className={styles.button}>
              {isClient ? "Volver a la página principal" : "Volver a la página principal"}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PoliticaDePrivacidad;
