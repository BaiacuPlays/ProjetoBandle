import React, { useState, useEffect } from 'react';
import styles from '../styles/DonationButton.module.css';
import DonationBenefitsModal from './DonationBenefitsModal';
import {
  PIX_CONFIG,
  donationOptions,
  handleDonation,
  confirmPixPayment,
  handlePixCopy
} from '../utils/donationUtils';




// Função para gerar QR Code PIX
const generatePixQRCode = (amount) => {
  // Payload PIX simplificado (EMV)
  const merchantName = PIX_CONFIG.recipientName.padEnd(25).substring(0, 25);
  const merchantCity = PIX_CONFIG.recipientCity.padEnd(15).substring(0, 15);
  const pixKey = PIX_CONFIG.primaryKey;
  const description = PIX_CONFIG.description;

  // Construir payload PIX básico
  const payload = [
    '00020126', // Payload Format Indicator
    '580014BR.GOV.BCB.PIX', // Merchant Account Information
    `0114${pixKey}`, // PIX Key
    '5204000053039865802BR', // Country Code
    `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`,
    `60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}`,
    `54${amount.toString().length.toString().padStart(2, '0')}${amount}`,
    `62${(4 + description.length).toString().padStart(2, '0')}05${description.length.toString().padStart(2, '0')}${description}`,
    '6304' // CRC placeholder
  ].join('');

  return payload;
};

// Função para copiar texto
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback para navegadores mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

// Componente compacto para header mobile
export const CompactDonationButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [showPixDetails, setShowPixDetails] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [receivedBenefits, setReceivedBenefits] = useState([]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Verificar se está logado
  useEffect(() => {
    const sessionToken = localStorage.getItem('ludomusic_session_token');
    setIsLoggedIn(!!sessionToken);

    // Escutar evento para abrir modal de doação
    const handleOpenDonationModal = () => {
      setShowModal(true);
    };

    window.addEventListener('openDonationModal', handleOpenDonationModal);

    return () => {
      window.removeEventListener('openDonationModal', handleOpenDonationModal);
    };
  }, []);



  // Usar função do donationUtils.js
  const handleDonationClick = (amount) => {
    handleDonation(amount, paymentMethod, setSelectedAmount, setShowPixDetails, setShowModal);
  };

  const handlePixCopy = async (text, type) => {
    const success = await copyToClipboard(text);
    if (success) {
      alert(`✅ ${type} copiado para a área de transferência!`);
    } else {
      alert(`❌ Erro ao copiar ${type}. Tente novamente.`);
    }
  };

  const closePixDetails = () => {
    setShowPixDetails(false);
    setSelectedAmount(null);
    setShowModal(false);
    // Não mostrar mensagem de agradecimento ao apenas fechar o modal
  };

  // Usar função do donationUtils.js
  const handleConfirmPixPayment = () => {
    confirmPixPayment(selectedAmount, setShowPixDetails, setSelectedAmount, setShowModal);
  };

  const showEmailCodeMessage = (amount, code) => {
    const benefits = getDonationBenefits(amount);
    const benefitsList = benefits.map(b => `• ${b}`).join('\n');

    alert(`💖 Obrigado pela doação de R$ ${amount}!\n\n📧 Um código de ativação foi enviado para seu email.\n\n🎁 Benefícios que você receberá:\n${benefitsList}\n\n💡 Use o código no menu "Ativar Benefícios" para liberar seus benefícios!`);
  };



  // Função removida - agora usamos códigos por email

  const getDonationBenefits = (amount) => {
    const benefits = [];
    const numAmount = parseFloat(amount);

    if (numAmount >= 5) {
      benefits.push('💝 Badge "Apoiador" por 30 dias');
      benefits.push('⚡ +25% XP por 7 dias');
    }

    if (numAmount >= 15) {
      benefits.push('💝 Badge "Apoiador" permanente');
      benefits.push('⚡ +50% XP por 30 dias');
      benefits.push('🎨 Avatar especial desbloqueado');
    }

    if (numAmount >= 30) {
      benefits.push('🏷️ Título personalizado');
      benefits.push('✨ Cores especiais no nome');
      benefits.push('📊 Estatísticas detalhadas');
      benefits.push('💾 Backup na nuvem');
    }

    if (numAmount >= 50) {
      benefits.push('👑 Badge "VIP" permanente');
      benefits.push('🎆 Efeitos visuais especiais');
      benefits.push('🏆 Ranking especial de apoiadores');
      benefits.push('🎵 Playlist personalizada');
      benefits.push('❤️ Vidas extras no modo infinito');
    }

    return benefits;
  };

  return (
    <>
      <button
        className={styles.compactButton}
        onClick={() => setShowModal(true)}
        title="Apoie o LudoMusic"
      >
        💝
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

              {/* Aviso sobre login para benefícios */}
              {!isLoggedIn && (
                <div className={styles.loginWarning}>
                  <h3>⚠️ Login para Benefícios</h3>
                  <p>Você pode doar sem estar logado, mas precisa estar <strong>logado</strong> para receber os benefícios!</p>
                  <p>Faça login para garantir que receberá todos os benefícios da sua doação.</p>
                </div>
              )}

              {/* Informação sobre ativação */}
              <div className={styles.activateInfo}>
                <p style={{ color: '#b3b3b3', fontSize: '0.9rem', textAlign: 'center', margin: '20px 0' }}>
                  💡 <strong>Dica:</strong> Após a doação, você receberá um código por email.
                  Para ativar os benefícios, faça login e vá em <strong>Perfil → Configurações → Ativar Benefícios</strong>.
                </p>
              </div>

              {/* Seleção de método de pagamento */}
              <div className={styles.paymentMethodSelector}>
                <p>Escolha o método de pagamento:</p>
                <div className={styles.methodButtons}>
                  <button
                    className={`${styles.methodButton} ${paymentMethod === 'pix' ? styles.active : ''}`}
                    onClick={() => setPaymentMethod('pix')}
                  >
                    💰 PIX (Brasil)
                  </button>
                  <button
                    className={`${styles.methodButton} ${paymentMethod === 'paypal' ? styles.active : ''}`}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    🏦 PayPal (Internacional)
                  </button>
                </div>
              </div>

              <div className={styles.donationGrid}>
                {donationOptions.map((option) => (
                  <button
                    key={option.amount}
                    className={styles.donationOption}
                    onClick={() => handleDonationClick(option.amount)}
                  >
                    <div className={styles.optionLabel}>{option.label}</div>
                    <div className={styles.optionAmount}>
                      {paymentMethod === 'pix' ? `R$ ${option.amount}` : `$${option.amount}`}
                    </div>
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
                    id="customAmountCompact"
                  />
                  <button
                    className={styles.customButton}
                    onClick={() => {
                      const amount = document.getElementById('customAmountCompact').value;
                      if (amount && amount > 0) {
                        handleDonationClick(amount);
                      }
                    }}
                  >
                    Doar {paymentMethod === 'pix' ? 'R$' : '$'}
                  </button>
                </div>
              </div>

              <div className={styles.paymentMethods}>
                <p>💳 Métodos de pagamento disponíveis:</p>
                <div className={styles.methods}>
                  <span>🏦 PayPal (Internacional)</span>
                  <span>💰 PIX (Brasil)</span>
                </div>
              </div>

              <div className={styles.guarantee}>
                <p>🔒 Pagamentos seguros via PayPal e PIX</p>
                <p>💝 Toda doação é muito apreciada!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalhes PIX */}
      {showPixDetails && selectedAmount && (
        <div className={styles.modalOverlay} onClick={closePixDetails}>
          <div className={styles.pixModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>💰 Pagamento PIX</h2>
              <button
                className={styles.closeButton}
                onClick={closePixDetails}
              >
                ✕
              </button>
            </div>

            <div className={styles.pixContent}>
              <div className={styles.pixAmount}>
                <h3>Valor: R$ {selectedAmount}</h3>
              </div>

              <div className={styles.pixInstructions}>
                <p>📱 <strong>Opção 1:</strong> Copie a chave PIX abaixo</p>
                <div className={styles.pixKeyContainer}>
                  <input
                    type="text"
                    value={PIX_CONFIG.primaryKey}
                    readOnly
                    className={styles.pixKeyInput}
                  />
                  <button
                    className={styles.copyButton}
                    onClick={() => handlePixCopy(PIX_CONFIG.primaryKey, 'Chave PIX')}
                  >
                    📋 Copiar
                  </button>
                </div>

                <div className={styles.pixAlternative}>
                  <p>🔄 <strong>Chave alternativa (CPF):</strong></p>
                  <div className={styles.pixKeyContainer}>
                    <input
                      type="text"
                      value={PIX_CONFIG.backupKey}
                      readOnly
                      className={styles.pixKeyInput}
                    />
                    <button
                      className={styles.copyButton}
                      onClick={() => handlePixCopy(PIX_CONFIG.backupKey, 'CPF PIX')}
                    >
                      📋 Copiar
                    </button>
                  </div>
                </div>

                <div className={styles.pixSteps}>
                  <h4>Como fazer o PIX:</h4>
                  <ol>
                    <li>Abra o app do seu banco</li>
                    <li>Escolha a opção PIX</li>
                    <li>Cole a chave PIX copiada</li>
                    <li>Confirme o valor: <strong>R$ {selectedAmount}</strong></li>
                    <li>Finalize o pagamento</li>
                  </ol>
                </div>

                <div className={styles.pixNote}>
                  <p>💝 Após fazer o PIX, clique no botão abaixo para confirmar:</p>
                  <button
                    className={styles.confirmButton}
                    onClick={handleConfirmPixPayment}
                  >
                    ✅ Fiz o PIX!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de benefícios */}
      <DonationBenefitsModal
        isOpen={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
        amount={selectedAmount}
        benefits={receivedBenefits}
      />


    </>
  );
};

const DonationButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [showPixDetails, setShowPixDetails] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [receivedBenefits, setReceivedBenefits] = useState([]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Verificar se está logado
  useEffect(() => {
    const sessionToken = localStorage.getItem('ludomusic_session_token');
    setIsLoggedIn(!!sessionToken);

    // Escutar evento para abrir modal de doação
    const handleOpenDonationModal = () => {
      setShowModal(true);
    };

    window.addEventListener('openDonationModal', handleOpenDonationModal);

    return () => {
      window.removeEventListener('openDonationModal', handleOpenDonationModal);
    };
  }, []);



  // Usar função do donationUtils.js
  const handleDonationClick2 = (amount) => {
    handleDonation(amount, paymentMethod, setSelectedAmount, setShowPixDetails, setShowModal);
  };

  const handlePixCopy = async (text, type) => {
    const success = await copyToClipboard(text);
    if (success) {
      alert(`✅ ${type} copiado para a área de transferência!`);
    } else {
      alert(`❌ Erro ao copiar ${type}. Tente novamente.`);
    }
  };

  const closePixDetails = () => {
    setShowPixDetails(false);
    setSelectedAmount(null);
    setShowModal(false);
    // Não mostrar mensagem de agradecimento ao apenas fechar o modal
  };

  // Usar função do donationUtils.js
  const handleConfirmPixPayment2 = () => {
    confirmPixPayment(selectedAmount, setShowPixDetails, setSelectedAmount, setShowModal);
  };

  const showEmailCodeMessage = (amount, code) => {
    const benefits = getDonationBenefits(amount);
    const benefitsList = benefits.map(b => `• ${b}`).join('\n');

    alert(`💖 Obrigado pela doação de R$ ${amount}!\n\n📧 Um código de ativação foi enviado para seu email.\n\n🎁 Benefícios que você receberá:\n${benefitsList}\n\n💡 Use o código no menu "Ativar Benefícios" para liberar seus benefícios!`);
  };

  const registerDonation = async (amount, method, email = null) => {
    const sessionToken = localStorage.getItem('ludomusic_session_token');

    // Sempre pedir email se não fornecido (mesmo logado, caso a conta não tenha email)
    let donorEmail = email;
    if (!donorEmail) {
      const message = sessionToken
        ? '📧 Digite seu email para receber o código de ativação dos benefícios:'
        : '📧 Digite seu email para receber o código de ativação dos benefícios:';

      donorEmail = prompt(message);
      if (!donorEmail) {
        throw new Error('Email é obrigatório para receber os benefícios');
      }
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    // Adicionar token se estiver logado
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    const body = {
      amount: parseFloat(amount),
      method: method,
      timestamp: new Date().toISOString()
    };

    // Adicionar email se não estiver logado
    if (!sessionToken && donorEmail) {
      body.email = donorEmail;
    }

    const response = await fetch('/api/donations', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('Erro ao registrar doação');
    }

    return response.json();
  };

  // Função removida - agora usamos códigos por email

  const getDonationBenefits = (amount) => {
    const benefits = [];
    const numAmount = parseFloat(amount);

    if (numAmount >= 5) {
      benefits.push('💝 Badge "Apoiador" por 30 dias');
      benefits.push('⚡ +25% XP por 7 dias');
    }

    if (numAmount >= 15) {
      benefits.push('💝 Badge "Apoiador" permanente');
      benefits.push('⚡ +50% XP por 30 dias');
      benefits.push('🎨 Avatar especial desbloqueado');
    }

    if (numAmount >= 30) {
      benefits.push('🏷️ Título personalizado');
      benefits.push('✨ Cores especiais no nome');
      benefits.push('📊 Estatísticas detalhadas');
      benefits.push('💾 Backup na nuvem');
    }

    if (numAmount >= 50) {
      benefits.push('👑 Badge "VIP" permanente');
      benefits.push('🎆 Efeitos visuais especiais');
      benefits.push('🏆 Ranking especial de apoiadores');
      benefits.push('🎵 Playlist personalizada');
      benefits.push('❤️ Vidas extras no modo infinito');
    }

    return benefits;
  };

  return (
    <>
      {/* Botão compacto para header - evita sobreposição com logo */}
      <button
        className={styles.compactButton}
        onClick={() => setShowModal(true)}
        title="Apoie o LudoMusic"
      >
        💝
      </button>

      {/* Botão flutuante para mobile - apenas quando necessário */}
      <button
        className={`${styles.donateButton} ${styles.floatingButton}`}
        onClick={() => setShowModal(true)}
        title="Apoie o LudoMusic"
        style={{ display: 'none' }} // Controlado por CSS responsivo
      >
        💝
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

              {/* Aviso sobre login para benefícios */}
              {!isLoggedIn && (
                <div className={styles.loginWarning}>
                  <h3>⚠️ Login para Benefícios</h3>
                  <p>Você pode doar sem estar logado, mas precisa estar <strong>logado</strong> para receber os benefícios!</p>
                  <p>Faça login para garantir que receberá todos os benefícios da sua doação.</p>
                </div>
              )}

              {/* Informação sobre ativação */}
              <div className={styles.activateInfo}>
                <p style={{ color: '#b3b3b3', fontSize: '0.9rem', textAlign: 'center', margin: '20px 0' }}>
                  💡 <strong>Dica:</strong> Após a doação, você receberá um código por email.
                  Para ativar os benefícios, faça login e vá em <strong>Perfil → Configurações → Ativar Benefícios</strong>.
                </p>
              </div>

              {/* Seleção de método de pagamento */}
              <div className={styles.paymentMethodSelector}>
                <p>Escolha o método de pagamento:</p>
                <div className={styles.methodButtons}>
                  <button
                    className={`${styles.methodButton} ${paymentMethod === 'pix' ? styles.active : ''}`}
                    onClick={() => setPaymentMethod('pix')}
                  >
                    💰 PIX (Brasil)
                  </button>
                  <button
                    className={`${styles.methodButton} ${paymentMethod === 'paypal' ? styles.active : ''}`}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    🏦 PayPal (Internacional)
                  </button>
                </div>
              </div>

              <div className={styles.donationGrid}>
                {donationOptions.map((option) => (
                  <button
                    key={option.amount}
                    className={styles.donationOption}
                    onClick={() => handleDonationClick2(option.amount)}
                  >
                    <div className={styles.optionLabel}>{option.label}</div>
                    <div className={styles.optionAmount}>
                      {paymentMethod === 'pix' ? `R$ ${option.amount}` : `$${option.amount}`}
                    </div>
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
                        handleDonationClick2(amount);
                      }
                    }}
                  >
                    Doar {paymentMethod === 'pix' ? 'R$' : '$'}
                  </button>
                </div>
              </div>

              <div className={styles.paymentMethods}>
                <p>💳 Métodos de pagamento disponíveis:</p>
                <div className={styles.methods}>
                  <span>🏦 PayPal (Internacional)</span>
                  <span>💰 PIX (Brasil)</span>
                </div>
              </div>

              <div className={styles.guarantee}>
                <p>🔒 Pagamentos seguros via PayPal e PIX</p>
                <p>💝 Toda doação é muito apreciada!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalhes PIX */}
      {showPixDetails && selectedAmount && (
        <div className={styles.modalOverlay} onClick={closePixDetails}>
          <div className={styles.pixModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>💰 Pagamento PIX</h2>
              <button
                className={styles.closeButton}
                onClick={closePixDetails}
              >
                ✕
              </button>
            </div>

            <div className={styles.pixContent}>
              <div className={styles.pixAmount}>
                <h3>Valor: R$ {selectedAmount}</h3>
              </div>

              <div className={styles.pixInstructions}>
                <p>📱 <strong>Opção 1:</strong> Copie a chave PIX abaixo</p>
                <div className={styles.pixKeyContainer}>
                  <input
                    type="text"
                    value={PIX_CONFIG.primaryKey}
                    readOnly
                    className={styles.pixKeyInput}
                  />
                  <button
                    className={styles.copyButton}
                    onClick={() => handlePixCopy(PIX_CONFIG.primaryKey, 'Chave PIX')}
                  >
                    📋 Copiar
                  </button>
                </div>

                <div className={styles.pixAlternative}>
                  <p>🔄 <strong>Chave alternativa (CPF):</strong></p>
                  <div className={styles.pixKeyContainer}>
                    <input
                      type="text"
                      value={PIX_CONFIG.backupKey}
                      readOnly
                      className={styles.pixKeyInput}
                    />
                    <button
                      className={styles.copyButton}
                      onClick={() => handlePixCopy(PIX_CONFIG.backupKey, 'CPF PIX')}
                    >
                      📋 Copiar
                    </button>
                  </div>
                </div>

                <div className={styles.pixSteps}>
                  <h4>Como fazer o PIX:</h4>
                  <ol>
                    <li>Abra o app do seu banco</li>
                    <li>Escolha a opção PIX</li>
                    <li>Cole a chave PIX copiada</li>
                    <li>Confirme o valor: <strong>R$ {selectedAmount}</strong></li>
                    <li>Finalize o pagamento</li>
                  </ol>
                </div>

                <div className={styles.pixNote}>
                  <p>💝 Após fazer o PIX, clique no botão abaixo para confirmar:</p>
                  <button
                    className={styles.confirmButton}
                    onClick={handleConfirmPixPayment2}
                  >
                    ✅ Fiz o PIX!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de benefícios */}
      <DonationBenefitsModal
        isOpen={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
        amount={selectedAmount}
        benefits={receivedBenefits}
      />


    </>
  );
};

export default DonationButton;

