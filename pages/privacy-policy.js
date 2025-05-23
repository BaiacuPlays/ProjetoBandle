import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Footer from '../components/Footer';
import styles from '../styles/Legal.module.css';

const PrivacyPolicy = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Privacy Policy | Bandle</title>
        <meta name="description" content="Privacy policy for Bandle - video game music guessing game" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/">
            <img src="/Logo.png" alt="Bandle Logo" className={styles.logo} />
          </Link>
          <h1 className={styles.title}>Privacy Policy</h1>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Introduction</h2>
            <p>
              This Privacy Policy describes how Bandle collects, uses, and shares information when you use
              our website. We respect your privacy and are committed to protecting your personal data.
            </p>
            <p>
              By using Bandle, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Information We Collect</h2>
            <p>
              <strong>Usage Information:</strong> We collect information about how you interact with our website,
              including the pages you visit, time spent on the site, and your interactions with the game.
            </p>
            <p>
              <strong>Device Information:</strong> We may collect information about the device you use
              to access Bandle, including device type, operating system, browser, and language settings.
            </p>
            <p>
              <strong>Cookies and Similar Technologies:</strong> We use cookies and similar technologies to enhance
              your experience, understand how you use our site, and personalize content.
            </p>
            <p>
              <strong>Local Storage:</strong> We use browser local storage to save your game progress
              and preferences, allowing you to continue where you left off in future visits.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. How We Use Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Provide, maintain, and improve Bandle</li>
              <li>Understand how users interact with the game</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Develop new features and functionality</li>
              <li>Personalize your gaming experience</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties except in the
              following circumstances:
            </p>
            <ul>
              <li>With service providers who help us operate the website (such as hosting and analytics services)</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights, property, or safety</li>
              <li>With your consent or at your direction</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. Data Security</h2>
            <p>
              The security of your data is important to us, but remember that no method of transmission over
              the Internet or method of electronic storage is 100% secure. While we strive to use commercially
              acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Your Rights</h2>
            <p>
              Depending on your location, you may have certain rights related to your personal data, including:
            </p>
            <ul>
              <li>Right to access your personal information</li>
              <li>Right to rectify inaccurate data</li>
              <li>Right to erasure of your personal data</li>
              <li>Right to restrict or object to the processing of your data</li>
              <li>Right to data portability</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us using the email provided below.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Changes to This Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting
              the new Privacy Policy on this page and, if the changes are significant, we will provide a more
              prominent notice.
            </p>
            <p>
              We recommend that you review this Privacy Policy periodically for any changes. Changes to this
              Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy;
