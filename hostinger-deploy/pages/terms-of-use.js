import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Footer from '../components/Footer';
import styles from '../styles/Legal.module.css';

const TermsOfUse = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Terms of Use | Bandle</title>
        <meta name="description" content="Terms of use for Bandle - video game music guessing game" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/">
            <img src="/Logo.png" alt="Bandle Logo" className={styles.logo} />
          </Link>
          <h1 className={styles.title}>Terms of Use</h1>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Bandle website, you agree to comply with and be bound by these Terms of Use.
              If you do not agree with any part of these terms, you may not access or use our service.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Service Description</h2>
            <p>
              Bandle is a video game music guessing game that allows users to listen to music snippets
              and try to identify them. The service is provided "as is" and "as available," without warranties of any kind.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Use of Service</h2>
            <p>
              You agree to use Bandle only for lawful purposes and in accordance with these Terms. You must not:
            </p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Attempt to access restricted areas of the site</li>
              <li>Interfere with or disrupt the integrity or performance of the service</li>
              <li>Attempt to circumvent security or authentication measures</li>
              <li>Collect or store personal data of other users</li>
              <li>Distribute viruses, worms, or other malicious code</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Intellectual Property</h2>
            <p>
              The content of Bandle, including but not limited to text, graphics, logos, icons, images, audio clips,
              digital downloads, and data compilations, is the property of Bandle or its licensors and is protected by
              copyright and intellectual property laws.
            </p>
            <p>
              The audio snippets used in the game are the property of their respective copyright holders and are
              used for entertainment and educational purposes under the principle of fair use.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Limitation of Liability</h2>
            <p>
              Under no circumstances shall Bandle, its directors, employees, partners, or agents be liable for
              any direct, indirect, incidental, special, consequential, or punitive damages, including without limitation,
              loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul>
              <li>Your access to or use of or inability to access or use the service</li>
              <li>Any conduct or content of any third party on the service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Modifications to Terms</h2>
            <p>
              We reserve the right to modify or replace these terms at any time. If a revision is material,
              we will try to provide at least 30 days' notice before any new terms take effect.
            </p>
            <p>
              What constitutes a material change will be determined at our sole discretion. By continuing to access or use our
              service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Governing Law</h2>
            <p>
              These terms shall be governed and construed in accordance with the laws of Brazil,
              without regard to its conflict of law provisions.
            </p>
            <p>
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
              <a href="mailto:andreibonatto8@gmail.com" className={styles.link}> andreibonatto8@gmail.com</a>
            </p>
          </section>

          <div className={styles.backLink}>
            <Link href="/" className={styles.button}>
              {isClient ? "Return to home page" : "Return to home page"}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfUse;
