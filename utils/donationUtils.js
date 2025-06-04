// Utilitários compartilhados para sistema de doação

export const PIX_CONFIG = {
  primaryKey: 'andreibonatto8@gmail.com',
  backupKey: '04883936040',
  recipientName: 'Andrei Bonatto',
  recipientCity: 'São Paulo',
  description: 'Doação LudoMusic'
};

export const donationOptions = [
  {
    amount: 5,
    label: '☕ Café',
    description: 'Um cafezinho para o dev'
  },
  {
    amount: 15,
    label: '🍕 Pizza',
    description: 'Uma pizza para a equipe'
  },
  {
    amount: 30,
    label: '🎮 Jogo',
    description: 'Um jogo novo para inspiração'
  },
  {
    amount: 50,
    label: '💝 Generoso',
    description: 'Muito obrigado!'
  }
];

export const getDonationBenefits = (amount) => {
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

export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Erro ao copiar para clipboard:', error);
    return false;
  }
};

export const registerDonation = async (amount, method, email = null) => {
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

export const showEmailCodeMessage = (amount, code) => {
  const benefits = getDonationBenefits(amount);
  const benefitsList = benefits.map(b => `• ${b}`).join('\n');

  if (typeof window !== 'undefined' && window.showToast) {
    window.showToast(
      `💖 Obrigado pela doação de R$ ${amount}! Verifique seu email para o código de ativação dos benefícios.`,
      'success',
      5000
    );
  } else {
    alert(`💖 Obrigado pela doação de R$ ${amount}!\n\n📧 Um código de ativação foi enviado para seu email.\n\n🎁 Benefícios que você receberá:\n${benefitsList}\n\n💡 Use o código no menu "Ativar Benefícios" para liberar seus benefícios!`);
  }
};

export const handleDonation = async (amount, paymentMethod, setSelectedAmount, setShowPixDetails, setShowModal) => {
  // Doação grátis para teste
  if (amount === 0) {
    try {
      const result = await registerDonation(5, 'test'); // Simular doação de R$ 5
      showEmailCodeMessage(5, result.activationCode);
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao processar doação teste:', error);
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('💖 Doação teste processada! Verifique seu email para o código de ativação.', 'success');
      } else {
        alert('💖 Doação teste processada! Verifique seu email para o código de ativação.');
      }
      setShowModal(false);
    }
    return;
  }

  if (paymentMethod === 'paypal') {
    // Abrir PayPal em nova aba
    const paypalUrl = `https://www.paypal.com/donate/?business=andreibonatto8@gmail.com&amount=${amount}&currency_code=USD&item_name=Doação LudoMusic`;
    window.open(paypalUrl, '_blank');

    // Para PayPal, registrar doação e gerar código
    try {
      const result = await registerDonation(amount, 'paypal');
      showEmailCodeMessage(amount, result.activationCode);
    } catch (error) {
      console.error('Erro ao registrar doação PayPal:', error);
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(`💖 Obrigado pela doação de $${amount}! Verifique seu email para o código de ativação dos benefícios.`, 'success');
      } else {
        alert(`💖 Obrigado pela doação de $${amount}! Verifique seu email para o código de ativação dos benefícios.`);
      }
    }

    // Fechar modal
    setShowModal(false);
  } else if (paymentMethod === 'pix') {
    // Mostrar detalhes do PIX
    setSelectedAmount(amount);
    setShowPixDetails(true);
  }
};

export const confirmPixPayment = async (selectedAmount, setShowPixDetails, setSelectedAmount, setShowModal) => {
  const amount = selectedAmount;

  try {
    // Registrar solicitação de doação PIX (pendente de verificação)
    const result = await registerPixDonationRequest(amount);

    setShowPixDetails(false);
    setSelectedAmount(null);
    setShowModal(false);

    // Mostrar mensagem sobre verificação manual
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(
        `💖 Obrigado! Sua doação de R$ ${amount} foi registrada e será verificada em até 24h. Você receberá o código de ativação por email após a confirmação.`,
        'success',
        8000
      );
    } else {
      alert(`💖 Obrigado! Sua doação de R$ ${amount} foi registrada e será verificada em até 24h. Você receberá o código de ativação por email após a confirmação.`);
    }
  } catch (error) {
    console.error('Erro ao registrar solicitação de doação:', error);
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast('❌ Erro ao registrar doação. Tente novamente ou entre em contato conosco.', 'error');
    } else {
      alert('❌ Erro ao registrar doação. Tente novamente ou entre em contato conosco.');
    }
    setShowPixDetails(false);
    setSelectedAmount(null);
    setShowModal(false);
  }
};

// Nova função para registrar solicitação de doação PIX
const registerPixDonationRequest = async (amount) => {
  const sessionToken = localStorage.getItem('ludomusic_session_token');

  // Sempre pedir email para notificação
  const donorEmail = prompt('📧 Digite seu email para receber a confirmação da doação:');
  if (!donorEmail) {
    throw new Error('Email é obrigatório para processar a doação');
  }

  // Validar email básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(donorEmail)) {
    throw new Error('Por favor, digite um email válido');
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
    method: 'pix_pending', // Marcar como PIX pendente
    email: donorEmail,
    timestamp: new Date().toISOString(),
    status: 'pending_verification' // Status pendente
  };

  const response = await fetch('/api/pix-donation-request', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error('Erro ao registrar solicitação de doação');
  }

  return response.json();
};

export const handlePixCopy = async (text, type) => {
  const success = await copyToClipboard(text);
  if (success) {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(`✅ ${type} copiado para a área de transferência!`, 'success');
    } else {
      alert(`✅ ${type} copiado para a área de transferência!`);
    }
  } else {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(`❌ Erro ao copiar ${type}. Tente novamente.`, 'error');
    } else {
      alert(`❌ Erro ao copiar ${type}. Tente novamente.`);
    }
  }
};
