import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Footer from '../components/Footer';
import styles from '../styles/Legal.module.css';

const ContentRemoval = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Content Removal | Ludomusic</title>
        <meta name="description" content="Content removal policy for Ludomusic - video game music guessing game" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/">
            <img src="/Logo.png" alt="Ludomusic Logo" className={styles.logo} />
          </Link>
          <h1 className={styles.title}>Content Removal</h1>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Content Removal Policy</h2>
            <p>
              Ludomusic respects the intellectual property rights of others and expects its users to do the same.
              We are committed to responding to notices of alleged copyright infringement that comply with
              applicable law.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Use of Content in Ludomusic</h2>
            <p>
              Ludomusic uses snippets of video game music for entertainment and educational purposes, under the
              principle of fair use. We believe that the limited use of these music snippets for a guessing game
              does not harm the potential market for or value of the original works, and may actually promote
              interest in video game soundtracks.
            </p>
            <p>
              All rights to the music belong to their respective owners, and we fully acknowledge the
              intellectual property of the original creators.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Content Removal Request</h2>
            <p>
              If you are a copyright owner or their authorized representative and believe that any content
              on Ludomusic infringes your copyright, you may submit a removal request by providing the following
              information:
            </p>
            <ol>
              <li>Identification of the copyrighted work you claim has been infringed</li>
              <li>Identification of the material on Ludomusic that you claim is infringing your copyright</li>
              <li>Your contact information, including address, phone number, and email</li>
              <li>A statement that you have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law</li>
              <li>A statement, under penalty of perjury, that the information in your notification is accurate and that you are the copyright owner or are authorized to act on behalf of the owner</li>
              <li>Your physical or electronic signature</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>4. How to Submit a Request</h2>
            <p>
              You can submit your content removal request to the following email address:
            </p>
            <p className={styles.emailHighlight}>
              <a href="mailto:andreibonatto8@gmail.com" className={styles.link}>andreibonatto8@gmail.com</a>
            </p>
            <p>
              Please include "Content Removal Request" in the subject line of the email.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Our Process</h2>
            <p>
              After receiving a valid content removal request, we will take the following steps:
            </p>
            <ul>
              <li>Confirm receipt of your request</li>
              <li>Review the request to verify it contains all necessary information</li>
              <li>Evaluate the copyright infringement claim</li>
              <li>If the request is valid, promptly remove or disable access to the content in question</li>
              <li>Notify you of the action taken</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Counter-Notification</h2>
            <p>
              If you believe your content was removed by mistake or misidentification, you may submit a
              counter-notification with the following information:
            </p>
            <ol>
              <li>Your physical or electronic signature</li>
              <li>Identification of the material that has been removed and the location where the material appeared before it was removed</li>
              <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification</li>
              <li>Your name, address, and telephone number, and a statement that you consent to the jurisdiction of the Federal District Court for the judicial district in which your address is located</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>7. Contact</h2>
            <p>
              If you have any questions about our content removal policy, please contact us at:
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

export default ContentRemoval;
