import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from '../styles/styles.module.css';

export default function FAQ() {
  const { t } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [openQuestion, setOpenQuestion] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const faqs = [
    {
      question: "O que é o LudoMusic?",
      answer: "O LudoMusic é um jogo musical gratuito onde você adivinha músicas de videogames. Teste seus conhecimentos com mais de 1000 trilhas sonoras de jogos clássicos e modernos."
    },
    {
      question: "Como jogar o LudoMusic?",
      answer: "É simples! Ouça o trecho da música, digite o nome da música na caixa de busca e selecione a opção correta da lista. Você tem 6 tentativas e pode usar dicas progressivas."
    },
    {
      question: "O jogo é gratuito?",
      answer: "Sim! O LudoMusic é 100% gratuito, sem anúncios, sem microtransações e sem necessidade de cadastro."
    },
    {
      question: "Quantas músicas estão disponíveis?",
      answer: "Temos mais de 1000 músicas de centenas de jogos diferentes, desde clássicos como Super Mario e Zelda até jogos modernos como Hollow Knight e Celeste."
    },
    {
      question: "Posso jogar com amigos?",
      answer: "Sim! Temos um modo multiplayer onde você pode criar salas e jogar com até 8 amigos. Cada partida tem 10 rodadas e ganha quem acertar mais músicas."
    },
    {
      question: "Como funciona o modo diário?",
      answer: "Todos os dias uma nova música é selecionada aleatoriamente. Todos os jogadores jogam a mesma música no mesmo dia, e você pode compartilhar seus resultados."
    },
    {
      question: "Existe modo infinito?",
      answer: "Sim! No modo infinito você joga música após música até errar. É perfeito para treinar e ver até onde consegue chegar."
    },
    {
      question: "O jogo funciona no celular?",
      answer: "Sim! O LudoMusic é totalmente responsivo e funciona perfeitamente em celulares, tablets e computadores."
    },
    {
      question: "Como são escolhidas as músicas?",
      answer: "Selecionamos cuidadosamente trilhas sonoras icônicas e memoráveis de jogos de todas as épocas e gêneros, priorizando qualidade e reconhecimento."
    },
    {
      question: "Posso sugerir músicas?",
      answer: "Atualmente não temos um sistema de sugestões, mas estamos sempre expandindo nossa biblioteca com novas músicas e jogos."
    },
    {
      question: "O jogo salva meu progresso?",
      answer: "Sim! Seu progresso é salvo localmente no seu navegador, incluindo estatísticas, configurações e histórico de jogos."
    },
    {
      question: "Preciso criar uma conta?",
      answer: "Não! O LudoMusic não requer cadastro ou login. Você pode jogar imediatamente sem fornecer nenhuma informação pessoal."
    }
  ];

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  return (
    <>
      <Head>
        <title>FAQ - Perguntas Frequentes sobre o LudoMusic</title>
        <meta 
          name="description" 
          content="Tire suas dúvidas sobre o LudoMusic! Encontre respostas para as perguntas mais frequentes sobre nosso jogo musical de videogames. Como jogar, modos de jogo, músicas disponíveis e muito mais." 
        />
        <meta name="keywords" content="ludomusic faq, perguntas frequentes, como jogar, jogo musical videogame, dúvidas ludomusic" />
        <link rel="canonical" href="https://ludomusic.xyz/faq" />
        
        {/* Open Graph */}
        <meta property="og:title" content="FAQ - Perguntas Frequentes sobre o LudoMusic" />
        <meta property="og:description" content="Tire suas dúvidas sobre o LudoMusic! Encontre respostas para as perguntas mais frequentes sobre nosso jogo musical de videogames." />
        <meta property="og:url" content="https://ludomusic.xyz/faq" />
        
        {/* JSON-LD para FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "name": "FAQ - LudoMusic",
              "description": "Perguntas frequentes sobre o LudoMusic",
              "url": "https://ludomusic.xyz/faq",
              "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            })
          }}
        />
      </Head>

      <div className={styles.darkBg} style={{ minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', color: 'white' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Link href="/" style={{ color: '#4CAF50', textDecoration: 'none', fontSize: '18px' }}>
              ← Voltar ao Jogo
            </Link>
            <h1 style={{ fontSize: '2.5em', margin: '20px 0', color: '#4CAF50' }}>
              Perguntas Frequentes
            </h1>
            <p style={{ fontSize: '18px', opacity: 0.8 }}>
              Tire suas dúvidas sobre o LudoMusic
            </p>
          </div>

          {/* FAQ Items */}
          <div style={{ marginBottom: '40px' }}>
            {faqs.map((faq, index) => (
              <div 
                key={index}
                style={{ 
                  marginBottom: '15px',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => toggleQuestion(index)}
                  style={{
                    width: '100%',
                    padding: '20px',
                    background: openQuestion === index ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                    border: 'none',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.3s ease'
                  }}
                >
                  <span>{faq.question}</span>
                  <span style={{ fontSize: '20px' }}>
                    {openQuestion === index ? '−' : '+'}
                  </span>
                </button>
                
                {openQuestion === index && (
                  <div style={{ 
                    padding: '20px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    lineHeight: '1.6'
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ marginBottom: '20px', fontSize: '18px' }}>
              Ainda tem dúvidas? Comece a jogar e descubra!
            </p>
            <Link 
              href="/" 
              style={{ 
                background: '#4CAF50', 
                color: 'white', 
                padding: '15px 30px', 
                borderRadius: '8px', 
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              🎮 Jogar Agora
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
