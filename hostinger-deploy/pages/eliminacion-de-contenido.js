import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Footer from '../components/Footer';
import styles from '../styles/Legal.module.css';

const EliminacionDeContenido = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Eliminación de Contenido | Bandle</title>
        <meta name="description" content="Política de eliminación de contenido de Bandle - juego de adivinanza de música de videojuegos" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/">
            <img src="/Logo.png" alt="Logo Bandle" className={styles.logo} />
          </Link>
          <h1 className={styles.title}>Eliminación de Contenido</h1>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Política de Eliminación de Contenido</h2>
            <p>
              Bandle respeta los derechos de propiedad intelectual de terceros y espera que sus usuarios hagan lo mismo.
              Estamos comprometidos a responder a notificaciones de presuntas infracciones de derechos de autor que cumplan
              con la legislación aplicable.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Uso de Contenido en Bandle</h2>
            <p>
              Bandle utiliza fragmentos de música de videojuegos con fines de entretenimiento y educativos, bajo el
              principio de uso justo. Creemos que el uso limitado de estos fragmentos musicales para un juego de adivinanzas
              no perjudica el mercado potencial o el valor de las obras originales, y de hecho puede promover el
              interés en las bandas sonoras de videojuegos.
            </p>
            <p>
              Todos los derechos sobre la música pertenecen a sus respectivos propietarios, y reconocemos plenamente
              la propiedad intelectual de los creadores originales.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Solicitud de Eliminación de Contenido</h2>
            <p>
              Si usted es un propietario de derechos de autor o su representante autorizado y cree que cualquier contenido
              en Bandle infringe sus derechos de autor, puede enviar una solicitud de eliminación proporcionando la siguiente
              información:
            </p>
            <ol>
              <li>Identificación de la obra protegida por derechos de autor que afirma ha sido infringida</li>
              <li>Identificación del material en Bandle que afirma está infringiendo sus derechos de autor</li>
              <li>Su información de contacto, incluida dirección, número de teléfono y correo electrónico</li>
              <li>Una declaración de que cree de buena fe que el uso del material de la manera reclamada no está autorizado por el propietario de los derechos de autor, su agente o la ley</li>
              <li>Una declaración, bajo pena de perjurio, de que la información en su notificación es precisa y que usted es el propietario de los derechos de autor o está autorizado para actuar en nombre del propietario</li>
              <li>Su firma física o electrónica</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>4. Cómo Enviar una Solicitud</h2>
            <p>
              Puede enviar su solicitud de eliminación de contenido a la siguiente dirección de correo electrónico:
            </p>
            <p className={styles.emailHighlight}>
              <a href="mailto:andreibonatto8@gmail.com" className={styles.link}>andreibonatto8@gmail.com</a>
            </p>
            <p>
              Por favor, incluya "Solicitud de Eliminación de Contenido" en la línea de asunto del correo electrónico.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Nuestro Proceso</h2>
            <p>
              Después de recibir una solicitud válida de eliminación de contenido, tomaremos los siguientes pasos:
            </p>
            <ul>
              <li>Confirmar la recepción de su solicitud</li>
              <li>Revisar la solicitud para verificar que contiene toda la información necesaria</li>
              <li>Evaluar la reclamación de infracción de derechos de autor</li>
              <li>Si la solicitud es válida, eliminar o deshabilitar rápidamente el acceso al contenido en cuestión</li>
              <li>Notificarle sobre la acción tomada</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Contra-Notificación</h2>
            <p>
              Si cree que su contenido fue eliminado por error o identificación incorrecta, puede enviar una
              contra-notificación con la siguiente información:
            </p>
            <ol>
              <li>Su firma física o electrónica</li>
              <li>Identificación del material que ha sido eliminado y la ubicación donde el material aparecía antes de ser eliminado</li>
              <li>Una declaración bajo pena de perjurio de que cree de buena fe que el material fue eliminado o deshabilitado como resultado de un error o identificación incorrecta</li>
              <li>Su nombre, dirección y número de teléfono, y una declaración de que consiente a la jurisdicción del Tribunal Federal del distrito judicial donde se encuentra su dirección</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>7. Contacto</h2>
            <p>
              Si tiene alguna pregunta sobre nuestra política de eliminación de contenido, contáctenos en:
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

export default EliminacionDeContenido;
