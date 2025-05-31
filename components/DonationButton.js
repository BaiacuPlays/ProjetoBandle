import React, { useState } from 'react';
import styles from '../styles/DonationButton.module.css';

const DonationButton = () => {
  const [showModal, setShowModal] = useState(false);

  const donationOptions = [
    {
      amount: 5,
      label: '☕ Café',
      description: 'Um cafezinho para o desenvolvedor'
    },
    {
      amount: 10,
      label: '🍕 Pizza',
      description: 'Uma fatia de pizza'
    },
    {
      amount: 25,
      label: '🎮 Jogo',
      description: 'Ajude a comprar um jogo novo'
    },
    {
      amount: 50,
      label: '💝 Generoso',
      description: 'Muito obrigado pelo apoio!'
    }
  ];

  const handleDonation = (amount) => {
    // Abrir PayPal em nova aba
    const paypalUrl = `https://www.paypal.com/donate/?business=andreibonatto8@gmail.com&amount=${amount}&currency_code=USD&item_name=Doação LudoMusic`;
    window.open(paypalUrl, '_blank');
    
    // Fechar modal
    setShowModal(false);
    
    // Mostrar agradecimento
    alert(`💖 Obrigado pela doação de $${amount}! Isso ajuda muito a manter o LudoMusic funcionando!`);
  };

  return (
    <>
      <button 
        className={styles.donateButton}
        onClick={() => setShowModal(true)}
        title="Apoie o LudoMusic"
      >
        💝 Doar
      </button>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>💖 Apoie o LudoMusic</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalContent}>
              <p className={styles.thankYou}>
                Obrigado por considerar apoiar o LudoMusic! 🎵
              </p>
              <p className={styles.description}>
                Suas doações ajudam a manter o servidor funcionando e a adicionar novas músicas!
              </p>

              <div className={styles.donationGrid}>
                {donationOptions.map((option) => (
                  <button
                    key={option.amount}
                    className={styles.donationOption}
                    onClick={() => handleDonation(option.amount)}
                  >
                    <div className={styles.optionLabel}>{option.label}</div>
                    <div className={styles.optionAmount}>${option.amount}</div>
                    <div className={styles.optionDescription}>{option.description}</div>
                  </button>
                ))}
              </div>

              <div className={styles.customAmount}>
                <p>Ou escolha um valor personalizado:</p>
                <div className={styles.customInput}>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    placeholder="10"
                    className={styles.amountInput}
                    id="customAmount"
                  />
                  <button
                    className={styles.customButton}
                    onClick={() => {
                      const amount = document.getElementById('customAmount').value;
                      if (amount && amount > 0) {
                        handleDonation(amount);
                      }
                    }}
                  >
                    Doar $
                  </button>
                </div>
              </div>

              <div className={styles.paymentMethods}>
                <p>💳 Métodos de pagamento aceitos:</p>
                <div className={styles.methods}>
                  <span>💳 Cartão</span>
                  <span>🏦 PayPal</span>
                  <span>💰 Pix (Brasil)</span>
                </div>
              </div>

              <div className={styles.guarantee}>
                <p>🔒 Pagamento 100% seguro via PayPal</p>
                <p>💝 Toda doação é muito apreciada!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DonationButton;

