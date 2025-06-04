// Sistema centralizado de tratamento de erros

class ErrorHandler {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.setupGlobalErrorHandlers();
  }

  setupGlobalErrorHandlers() {
    if (typeof window !== 'undefined') {
      // Capturar erros JavaScript não tratados
      window.addEventListener('error', (event) => {
        this.logError('JavaScript Error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
      });

      // Capturar promises rejeitadas não tratadas
      window.addEventListener('unhandledrejection', (event) => {
        this.logError('Unhandled Promise Rejection', {
          reason: event.reason,
          promise: event.promise
        });
      });
    }
  }

  logError(type, details) {
    const errorData = {
      type,
      details,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      userId: this.getCurrentUserId()
    };

    // Log no console em desenvolvimento
    if (!this.isProduction) {
      console.error(`[${type}]`, errorData);
    }

    // Enviar para serviço de logging em produção
    if (this.isProduction) {
      this.sendToLoggingService(errorData);
    }
  }

  getCurrentUserId() {
    try {
      if (typeof localStorage !== 'undefined') {
        const token = localStorage.getItem('ludomusic_session_token');
        if (token) {
          // Decodificar token básico para obter ID (implementação simplificada)
          return 'logged_user';
        }
      }
      return 'anonymous';
    } catch {
      return 'unknown';
    }
  }

  async sendToLoggingService(errorData) {
    try {
      // Enviar para API de logging
      await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });
    } catch (error) {
      // Falha silenciosa em produção
      console.warn('Failed to send error to logging service:', error);
    }
  }

  // Wrapper para operações que podem falhar
  async safeExecute(operation, fallback = null, context = 'Unknown') {
    try {
      return await operation();
    } catch (error) {
      this.logError(`Safe Execute Error - ${context}`, {
        error: error.message,
        stack: error.stack
      });

      if (typeof fallback === 'function') {
        try {
          return await fallback();
        } catch (fallbackError) {
          this.logError(`Fallback Error - ${context}`, {
            error: fallbackError.message,
            stack: fallbackError.stack
          });
        }
      }

      return fallback;
    }
  }

  // Mostrar erro amigável para o usuário
  showUserFriendlyError(error, context = '') {
    let message = 'Ops! Algo deu errado. Tente novamente.';

    // Personalizar mensagem baseada no tipo de erro
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      message = 'Problema de conexão. Verifique sua internet e tente novamente.';
    } else if (error.message.includes('audio') || error.message.includes('play')) {
      message = 'Erro ao reproduzir áudio. Tente recarregar a página.';
    } else if (error.message.includes('login') || error.message.includes('auth')) {
      message = 'Erro de autenticação. Faça login novamente.';
    }

    // Usar toast se disponível, senão alert
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(message, 'error', 5000);
    } else {
      alert(message);
    }

    // Log do erro
    this.logError(`User Error - ${context}`, {
      originalError: error.message,
      userMessage: message
    });
  }

  // Validar dados de entrada
  validateInput(data, schema, context = 'Input Validation') {
    try {
      const errors = [];

      for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];

        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} é obrigatório`);
          continue;
        }

        if (value !== undefined && value !== null) {
          if (rules.type && typeof value !== rules.type) {
            errors.push(`${field} deve ser do tipo ${rules.type}`);
          }

          if (rules.minLength && value.length < rules.minLength) {
            errors.push(`${field} deve ter pelo menos ${rules.minLength} caracteres`);
          }

          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`${field} deve ter no máximo ${rules.maxLength} caracteres`);
          }

          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(`${field} tem formato inválido`);
          }
        }
      }

      if (errors.length > 0) {
        throw new Error(`Validação falhou: ${errors.join(', ')}`);
      }

      return true;
    } catch (error) {
      this.logError(`Validation Error - ${context}`, {
        data,
        schema,
        error: error.message
      });
      throw error;
    }
  }

  // Retry com backoff exponencial
  async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000, context = 'Retry Operation') {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          this.logError(`Max Retries Exceeded - ${context}`, {
            attempts: maxRetries,
            finalError: error.message
          });
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logError(`Retry Attempt ${attempt} Failed - ${context}`, {
          error: error.message,
          nextRetryIn: delay
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

// Instância global
const errorHandler = new ErrorHandler();

export default errorHandler;

// Funções de conveniência
export const safeExecute = (operation, fallback, context) => 
  errorHandler.safeExecute(operation, fallback, context);

export const showError = (error, context) => 
  errorHandler.showUserFriendlyError(error, context);

export const validateInput = (data, schema, context) => 
  errorHandler.validateInput(data, schema, context);

export const retryOperation = (operation, maxRetries, baseDelay, context) => 
  errorHandler.retryWithBackoff(operation, maxRetries, baseDelay, context);
