// Sistema de debouncing para reduzir chamadas de API
// Especialmente útil para operações de salvamento frequentes

class Debouncer {
  constructor() {
    this.timers = new Map();
    this.pendingOperations = new Map();
  }

  // Debounce uma função por chave
  debounce(key, fn, delay = 1000) {
    // Cancelar timer anterior se existir
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Criar novo timer
    const timer = setTimeout(async () => {
      try {
        await fn();
        this.timers.delete(key);
        this.pendingOperations.delete(key);
      } catch (error) {
        console.error(`Erro na operação debounced ${key}:`, error);
        this.timers.delete(key);
        this.pendingOperations.delete(key);
      }
    }, delay);

    this.timers.set(key, timer);
    this.pendingOperations.set(key, fn);
  }

  // Executar imediatamente uma operação pendente
  async flush(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    if (this.pendingOperations.has(key)) {
      const fn = this.pendingOperations.get(key);
      this.pendingOperations.delete(key);
      try {
        await fn();
      } catch (error) {
        console.error(`Erro ao executar operação ${key}:`, error);
      }
    }
  }

  // Executar todas as operações pendentes
  async flushAll() {
    const promises = [];
    for (const [key, fn] of this.pendingOperations.entries()) {
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      promises.push(fn().catch(error => 
        console.error(`Erro ao executar operação ${key}:`, error)
      ));
    }
    this.pendingOperations.clear();
    await Promise.allSettled(promises);
  }

  // Cancelar uma operação pendente
  cancel(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.pendingOperations.delete(key);
  }

  // Cancelar todas as operações pendentes
  cancelAll() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.pendingOperations.clear();
  }

  // Verificar se há operações pendentes
  hasPending(key) {
    return this.pendingOperations.has(key);
  }

  // Obter número de operações pendentes
  getPendingCount() {
    return this.pendingOperations.size;
  }
}

// Instância global do debouncer
const globalDebouncer = new Debouncer();

// Função utilitária para debounce simples
export function debounce(fn, delay = 1000) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Função utilitária para debounce com chave
export function debounceByKey(key, fn, delay = 1000) {
  globalDebouncer.debounce(key, fn, delay);
}

// Função para executar operação pendente imediatamente
export function flushDebounced(key) {
  return globalDebouncer.flush(key);
}

// Função para executar todas as operações pendentes
export function flushAllDebounced() {
  return globalDebouncer.flushAll();
}

// Função para cancelar operação pendente
export function cancelDebounced(key) {
  globalDebouncer.cancel(key);
}

// Hook para cleanup automático quando a página é fechada
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalDebouncer.flushAll();
  });

  // Flush periódico para garantir que dados não sejam perdidos
  setInterval(() => {
    if (globalDebouncer.getPendingCount() > 0) {
      console.log(`🔄 Executando ${globalDebouncer.getPendingCount()} operações pendentes...`);
      globalDebouncer.flushAll();
    }
  }, 30000); // A cada 30 segundos
}

export { Debouncer };
export default globalDebouncer;
