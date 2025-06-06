/**
 * Utilitário para detectar bloqueadores de anúncios e lidar com erros relacionados
 */

// Função para detectar se um bloqueador de anúncios está ativo
export const detectAdBlocker = () => {
  return new Promise((resolve) => {
    // Criar um elemento de script falso para testar
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox';
    document.body.appendChild(testAd);
    
    // Verificar após um curto período se o elemento foi ocultado
    setTimeout(() => {
      const isBlocked = testAd.offsetHeight === 0;
      testAd.remove();
      resolve(isBlocked);
    }, 100);
  });
};

// Função para suprimir erros de console relacionados a bloqueadores de anúncios
export const suppressAdBlockErrors = () => {
  if (typeof window !== 'undefined') {
    const originalError = console.error;
    
    console.error = function(msg) {
      // Lista de padrões de erro a serem suprimidos
      const adBlockErrorPatterns = [
        'pagead2.googlesyndication.com',
        'ERR_BLOCKED_BY_CLIENT',
        'adsbygoogle',
        'net::ERR_BLOCKED_BY_CLIENT',
        'Failed to load resource'
      ];
      
      // Verificar se a mensagem contém algum dos padrões
      if (msg && typeof msg === 'string' && 
          adBlockErrorPatterns.some(pattern => msg.includes(pattern))) {
        // Suprimir o erro
        return;
      }
      
      // Para outros erros, chamar a função original
      originalError.apply(console, arguments);
    };
    
    return () => {
      // Função de limpeza para restaurar o console.error original
      console.error = originalError;
    };
  }
  
  // Se não estiver no cliente, retornar uma função vazia
  return () => {};
};

// Aplicar supressão de erros imediatamente se estiver no cliente
if (typeof window !== 'undefined') {
  suppressAdBlockErrors();
}