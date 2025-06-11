import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o state para mostrar a UI de erro
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log do erro para debug
    console.error('[ERROR BOUNDARY] Erro capturado:', error);
    console.error('[ERROR BOUNDARY] Info do erro:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Enviar erro para serviço de monitoramento se necessário
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // UI de fallback customizada
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #f44336',
          borderRadius: '8px',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#f44336', marginBottom: '10px' }}>
            ⚠️ Algo deu errado
          </h2>
          <p style={{ marginBottom: '15px' }}>
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            🔄 Recarregar Página
          </button>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔄 Tentar Novamente
          </button>
          
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Detalhes do erro (desenvolvimento)
              </summary>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '5px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
