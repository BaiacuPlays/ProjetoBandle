// Sistema de logging otimizado para produção
// Desabilita automaticamente logs em produção para melhor performance

class Logger {
  constructor() {
    // Detectar se está em produção (mais rigoroso)
    this.isProduction = process.env.NODE_ENV === 'production' ||
                       typeof window !== 'undefined' &&
                       (window.location.hostname !== 'localhost' &&
                        window.location.hostname !== '127.0.0.1' &&
                        !window.location.hostname.includes('localhost'));

    // Detectar se está no Vercel ou domínio de produção
    this.isVercel = typeof window !== 'undefined' &&
                    (window.location.hostname.includes('vercel.app') ||
                     window.location.hostname === 'ludomusic.xyz' ||
                     window.location.hostname.includes('ludomusic'));

    // Em produção, desabilitar TODOS os logs exceto errors críticos
    this.enableLogs = !this.isProduction && !this.isVercel;
    
    // Contador de logs para detectar spam
    this.logCount = 0;
    this.maxLogsPerMinute = 50;
    this.logResetInterval = null;
    
    this.initLogCounter();
  }
  
  initLogCounter() {
    // Reset contador a cada minuto
    this.logResetInterval = setInterval(() => {
      this.logCount = 0;
    }, 60000);
  }
  
  // Verificar se deve logar (anti-spam)
  shouldLog() {
    if (!this.enableLogs) return false;
    
    this.logCount++;
    if (this.logCount > this.maxLogsPerMinute) {
      if (this.logCount === this.maxLogsPerMinute + 1) {
        console.warn('🚨 LOGGER: Muitos logs detectados, limitando output...');
      }
      return false;
    }
    
    return true;
  }
  
  // Log normal - DESABILITADO em produção
  log(...args) {
    if (this.shouldLog()) {
      console.log(...args);
    }
  }
  
  // Warning - DESABILITADO em produção
  warn(...args) {
    if (this.shouldLog()) {
      console.warn(...args);
    }
  }
  
  // Error - SEMPRE habilitado mas limitado
  error(...args) {
    // Errors sempre são mostrados, mas com limite
    if (this.logCount < this.maxLogsPerMinute * 2) {
      // Usar console original se disponível para evitar recursão
      if (typeof window !== 'undefined' && window.originalConsole) {
        window.originalConsole.error(...args);
      } else {
        // Fallback para console padrão apenas se não estivermos em produção
        if (!this.isProduction && !this.isVercel) {
          console.error(...args);
        }
      }
      this.logCount++;
    }
  }
  
  // Log crítico - SEMPRE habilitado
  critical(...args) {
    // Usar console original se disponível para evitar recursão
    if (typeof window !== 'undefined' && window.originalConsole) {
      window.originalConsole.error('🚨 CRÍTICO:', ...args);
    } else {
      // Fallback seguro
      if (!this.isProduction && !this.isVercel) {
        console.error('🚨 CRÍTICO:', ...args);
      }
    }
  }
  
  // Debug - APENAS em desenvolvimento
  debug(...args) {
    if (!this.isProduction && !this.isVercel) {
      console.log('🐛 DEBUG:', ...args);
    }
  }
  
  // Performance log - APENAS em desenvolvimento
  perf(label, fn) {
    if (!this.isProduction && !this.isVercel) {
      console.time(label);
      const result = fn();
      console.timeEnd(label);
      return result;
    }
    return fn();
  }
  
  // Cleanup
  destroy() {
    if (this.logResetInterval) {
      clearInterval(this.logResetInterval);
    }
  }
}

// Instância global
const logger = new Logger();

// Substituir console global em produção (MAIS RIGOROSO)
if (logger.isProduction || logger.isVercel) {
  // Salvar referências originais
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
    trace: console.trace
  };

  // Salvar globalmente para acesso em outros métodos
  if (typeof window !== 'undefined') {
    window.originalConsole = originalConsole;
  }

  // Função vazia para substituir todos os logs
  const silentFunction = () => {};

  // Substituir TODOS os métodos de console
  console.log = silentFunction;
  console.warn = silentFunction;
  console.info = silentFunction;
  console.debug = silentFunction;
  console.trace = silentFunction;

  // Manter apenas errors críticos com filtro rigoroso
  console.error = (...args) => {
    // Filtrar apenas erros realmente críticos
    const errorMessage = args.join(' ').toLowerCase();
    const isCriticalError = [
      'uncaught',
      'unhandled',
      'fatal',
      'critical',
      'security'
    ].some(keyword => errorMessage.includes(keyword));

    // Mostrar apenas erros críticos e com limite
    if (isCriticalError && logger.logCount < 3) {
      originalConsole.error('🚨 ERRO CRÍTICO:', ...args);
      logger.logCount++;
    }
  };

  // Adicionar método para restaurar (se necessário para debug)
  if (typeof window !== 'undefined') {
    window.restoreConsole = () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      originalConsole.log('✅ Console restaurado para debug');
    };

    // Adicionar método para verificar status
    window.loggerStatus = () => {
      originalConsole.log('📊 Logger Status:', {
        isProduction: logger.isProduction,
        isVercel: logger.isVercel,
        enableLogs: logger.enableLogs,
        logCount: logger.logCount
      });
    };
  }
}

export default logger;

// Exports nomeados para compatibilidade
export const log = (...args) => logger.log(...args);
export const warn = (...args) => logger.warn(...args);
export const error = (...args) => logger.error(...args);
export const critical = (...args) => logger.critical(...args);
export const debug = (...args) => logger.debug(...args);
export const perf = (label, fn) => logger.perf(label, fn);
