import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Footer from '../components/Footer';
import styles from '../styles/Legal.module.css';

const TerminosDeUso = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Términos de Uso | Bandle</title>
        <meta name="description" content="Términos de uso de Bandle - juego de adivinanza de música de videojuegos" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/">
            <img src="/Logo.png" alt="Logo Bandle" className={styles.logo} />
          </Link>
          <h1 className={styles.title}>Términos de Uso</h1>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Aceptación de Términos</h2>
            <p>
              Al acceder y utilizar el sitio web de Bandle, usted acepta cumplir y estar sujeto a estos Términos de Uso.
              Si no está de acuerdo con alguna parte de estos términos, no podrá acceder o utilizar nuestro servicio.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Descripción del Servicio</h2>
            <p>
              Bandle es un juego de adivinanza de música de videojuegos que permite a los usuarios escuchar fragmentos de música
              e intentar identificarlos. El servicio se proporciona "tal cual" y "según disponibilidad", sin garantías de ningún tipo.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Uso del Servicio</h2>
            <p>
              Usted acepta utilizar Bandle solo para fines legales y de acuerdo con estos Términos. No debe:
            </p>
            <ul>
              <li>Violar cualquier ley o regulación aplicable</li>
              <li>Intentar acceder a áreas restringidas del sitio</li>
              <li>Interferir o interrumpir la integridad o el rendimiento del servicio</li>
              <li>Intentar eludir medidas de seguridad o autenticación</li>
              <li>Recopilar o almacenar datos personales de otros usuarios</li>
              <li>Distribuir virus, gusanos u otro código malicioso</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Propiedad Intelectual</h2>
            <p>
              El contenido de Bandle, incluidos, entre otros, texto, gráficos, logotipos, iconos, imágenes, clips de audio,
              descargas digitales y compilaciones de datos, es propiedad de Bandle o sus licenciantes y está protegido por
              derechos de autor y leyes de propiedad intelectual.
            </p>
            <p>
              Los fragmentos de audio utilizados en el juego son propiedad de sus respectivos titulares de derechos de autor y se
              utilizan con fines de entretenimiento y educativos bajo el principio de uso justo.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Limitación de Responsabilidad</h2>
            <p>
              Bajo ninguna circunstancia Bandle, sus directores, empleados, socios o agentes serán responsables por
              daños directos, indirectos, incidentales, especiales, consecuentes o punitivos, incluidos, entre otros,
              pérdida de ganancias, datos, uso, buena voluntad u otras pérdidas intangibles, resultantes de:
            </p>
            <ul>
              <li>Su acceso o uso o incapacidad para acceder o usar el servicio</li>
              <li>Cualquier conducta o contenido de terceros en el servicio</li>
              <li>Acceso, uso o alteración no autorizados de sus transmisiones o contenido</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Modificaciones a los Términos</h2>
            <p>
              Nos reservamos el derecho de modificar o reemplazar estos términos en cualquier momento. Si una revisión es material,
              intentaremos proporcionar al menos 30 días de aviso antes de que los nuevos términos entren en vigor.
            </p>
            <p>
              Lo que constituye un cambio material será determinado a nuestra sola discreción. Al continuar accediendo o utilizando nuestro
              servicio después de que esas revisiones entren en vigor, usted acepta estar sujeto a los términos revisados.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Ley Aplicable</h2>
            <p>
              Estos términos se regirán e interpretarán de acuerdo con las leyes de Brasil,
              sin tener en cuenta sus disposiciones sobre conflictos de leyes.
            </p>
            <p>
              Nuestra falta de aplicación de cualquier derecho o disposición de estos Términos no se considerará una renuncia a esos derechos.
              Si alguna disposición de estos Términos es considerada inválida o inaplicable por un tribunal, las disposiciones restantes de estos Términos permanecerán en vigor.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Contacto</h2>
            <p>
              Si tiene alguna pregunta sobre estos Términos, contáctenos en:
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

export default TerminosDeUso;
