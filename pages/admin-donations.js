import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Admin.module.css';

export default function AdminDonations() {
  const [pendingDonations, setPendingDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadPendingDonations();
  }, []);

  const loadPendingDonations = async () => {
    try {
      const response = await fetch('/api/admin/pending-donations');
      if (response.ok) {
        const data = await response.json();
        setPendingDonations(data.donations || []);
      } else {
        alert('Erro ao carregar doações pendentes');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao carregar doações pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!confirm('Confirmar que o pagamento PIX foi recebido e aprovar esta doação?')) {
      return;
    }

    setProcessing(requestId);
    try {
      const response = await fetch('/api/admin/approve-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });

      if (response.ok) {
        alert('Doação aprovada com sucesso! Código enviado por email.');
        loadPendingDonations(); // Recarregar lista
      } else {
        const error = await response.json();
        alert(`Erro ao aprovar doação: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao aprovar doação');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    if (reason === null) return; // Cancelou

    setProcessing(requestId);
    try {
      const response = await fetch('/api/admin/reject-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, reason })
      });

      if (response.ok) {
        alert('Doação rejeitada. Email de notificação enviado.');
        loadPendingDonations(); // Recarregar lista
      } else {
        const error = await response.json();
        alert(`Erro ao rejeitar doação: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao rejeitar doação');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1>Carregando doações pendentes...</h1>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎁 Gerenciar Doações PIX</h1>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>
          ← Voltar ao Admin
        </button>
      </div>

      {pendingDonations.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>✅ Nenhuma doação pendente</h2>
          <p>Todas as doações PIX foram processadas!</p>
        </div>
      ) : (
        <div className={styles.donationsList}>
          <h2>📋 Doações Pendentes ({pendingDonations.length})</h2>
          
          {pendingDonations.map((donation) => (
            <div key={donation.id} className={styles.donationCard}>
              <div className={styles.donationHeader}>
                <h3>💰 R$ {donation.amount}</h3>
                <span className={styles.status}>⏳ Pendente</span>
              </div>
              
              <div className={styles.donationDetails}>
                <p><strong>Email:</strong> {donation.email}</p>
                <p><strong>Data:</strong> {new Date(donation.timestamp).toLocaleString('pt-BR')}</p>
                <p><strong>ID:</strong> {donation.id}</p>
                <p><strong>Tempo:</strong> {getTimeAgo(donation.createdAt)}</p>
              </div>

              <div className={styles.donationActions}>
                <button
                  onClick={() => handleApprove(donation.id)}
                  disabled={processing === donation.id}
                  className={`${styles.actionButton} ${styles.approveButton}`}
                >
                  {processing === donation.id ? '⏳ Processando...' : '✅ Aprovar'}
                </button>
                
                <button
                  onClick={() => handleReject(donation.id)}
                  disabled={processing === donation.id}
                  className={`${styles.actionButton} ${styles.rejectButton}`}
                >
                  {processing === donation.id ? '⏳ Processando...' : '❌ Rejeitar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.instructions}>
        <h3>📝 Instruções</h3>
        <ul>
          <li><strong>Aprovar:</strong> Confirme que o pagamento PIX foi recebido na sua conta</li>
          <li><strong>Rejeitar:</strong> Use quando não receber o pagamento ou houver problemas</li>
          <li><strong>Verificação:</strong> Sempre confira o valor e horário do PIX recebido</li>
          <li><strong>Email:</strong> O doador receberá notificação automática da decisão</li>
        </ul>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins} minutos atrás`;
  } else if (diffHours < 24) {
    return `${diffHours} horas atrás`;
  } else {
    return `${diffDays} dias atrás`;
  }
}
