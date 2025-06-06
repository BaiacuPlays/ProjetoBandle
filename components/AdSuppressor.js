import { useEffect } from 'react';

/**
 * Componente para suprimir erros de console relacionados a bloqueadores de anúncios
 * Este componente não renderiza nada, apenas modifica o console.error para ignorar
 * erros específicos relacionados a bloqueadores de anúncios
 */
const AdSuppressor = () => {
  useEffect(() => {
    // Só executar no cliente
    if (typeof window !== 'undefined') {
      // Salvar a função original de console.error
      const originalError = console.error;
      
      // Substituir console.error com uma versão que filtra erros de AdBlock
      console.error = function(msg) {
        // Ignorar erros relacionados a bloqueadores de anúncios
        if (msg && typeof msg === 'string' && (
          msg.includes('pagead2.googlesyndication.com') || 
          msg.includes('ERR_BLOCKED_BY_CLIENT') ||
          msg.includes('adsbygoogle')
        )) {
          // Não fazer nada - suprimir o erro
          return;
        }
        
        // Para outros erros, chamar a função original
        originalError.apply(console, arguments);
      };
      
      // Limpar ao desmontar o componente
      return () => {
        console.error = originalError;
      };
    }
  }, []);

  // Este componente não renderiza nada
  return null;
};

export default AdSuppressor;