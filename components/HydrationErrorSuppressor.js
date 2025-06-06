import { useEffect } from 'react';

/**
 * Componente para suprimir erros de hidratação causados por extensões de navegador
 * que adicionam atributos como bis_skin_checked aos elementos DOM
 */
const HydrationErrorSuppressor = () => {
  useEffect(() => {
    // Executar apenas no cliente
    if (typeof window !== 'undefined') {
      // Função para remover atributos bis_skin_checked
      const removeAttributes = () => {
        const elements = document.querySelectorAll('[bis_skin_checked]');
        elements.forEach(el => {
          el.removeAttribute('bis_skin_checked');
        });
        console.log('🧹 Atributos bis_skin_checked removidos:', elements.length);
      };

      // Executar imediatamente
      removeAttributes();

      // Executar novamente após um curto período para pegar elementos adicionados dinamicamente
      setTimeout(removeAttributes, 500);

      // Suprimir mensagens de erro no console relacionadas a hidratação
      if (process.env.NODE_ENV !== 'production') {
        const originalError = console.error;
        console.error = function(msg) {
          if (msg && typeof msg === 'string' && 
              (msg.includes('Warning: Extra attributes from the server') || 
               msg.includes('bis_skin_checked'))) {
            return;
          }
          originalError.apply(console, arguments);
        };
      }
    }
  }, []);

  return null; // Este componente não renderiza nada
};

export default HydrationErrorSuppressor;