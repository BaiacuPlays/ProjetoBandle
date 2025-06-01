import { useEffect } from 'react';

/**
 * Hook personalizado para bloquear o scroll da página quando um modal está aberto
 * @param {boolean} isOpen - Se o modal está aberto ou não
 */
export const useModalScrollLock = (isOpen) => {
  useEffect(() => {
    if (!isOpen) return;

    // Salvar posição atual do scroll
    const scrollY = window.scrollY;

    // Salvar valores originais
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;

    // Aplicar bloqueio simples e efetivo
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    // Salvar para restaurar depois
    document.body.setAttribute('data-scroll-y', scrollY.toString());
    document.body.setAttribute('data-original-overflow', originalBodyOverflow);
    document.body.setAttribute('data-original-position', originalBodyPosition);
    document.body.setAttribute('data-original-top', originalBodyTop);
    document.body.setAttribute('data-original-width', originalBodyWidth);

    // Cleanup quando fechar modal
    return () => {
      const savedScrollY = document.body.getAttribute('data-scroll-y') || '0';
      const savedOverflow = document.body.getAttribute('data-original-overflow') || '';
      const savedPosition = document.body.getAttribute('data-original-position') || '';
      const savedTop = document.body.getAttribute('data-original-top') || '';
      const savedWidth = document.body.getAttribute('data-original-width') || '';

      // Restaurar estilos
      document.body.style.overflow = savedOverflow;
      document.body.style.position = savedPosition;
      document.body.style.top = savedTop;
      document.body.style.width = savedWidth;

      // Remover atributos
      document.body.removeAttribute('data-scroll-y');
      document.body.removeAttribute('data-original-overflow');
      document.body.removeAttribute('data-original-position');
      document.body.removeAttribute('data-original-top');
      document.body.removeAttribute('data-original-width');

      // Restaurar posição do scroll
      window.scrollTo(0, parseInt(savedScrollY));
    };
  }, [isOpen]);
};

/**
 * Hook para modais que sempre estão abertos (não dependem de isOpen)
 */
export const useModalScrollLockAlways = () => {
  useEffect(() => {
    // Salvar posição atual do scroll
    const scrollY = window.scrollY;

    // Salvar valores originais
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;

    // Aplicar bloqueio de scroll simples
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    // Salvar valores para restaurar
    document.body.setAttribute('data-scroll-y', scrollY.toString());
    document.body.setAttribute('data-original-overflow', originalBodyOverflow);
    document.body.setAttribute('data-original-position', originalBodyPosition);
    document.body.setAttribute('data-original-top', originalBodyTop);
    document.body.setAttribute('data-original-width', originalBodyWidth);

    // Cleanup quando o componente é desmontado
    return () => {
      const savedScrollY = document.body.getAttribute('data-scroll-y') || '0';
      const savedOverflow = document.body.getAttribute('data-original-overflow') || '';
      const savedPosition = document.body.getAttribute('data-original-position') || '';
      const savedTop = document.body.getAttribute('data-original-top') || '';
      const savedWidth = document.body.getAttribute('data-original-width') || '';

      document.body.style.overflow = savedOverflow;
      document.body.style.position = savedPosition;
      document.body.style.top = savedTop;
      document.body.style.width = savedWidth;

      document.body.removeAttribute('data-scroll-y');
      document.body.removeAttribute('data-original-overflow');
      document.body.removeAttribute('data-original-position');
      document.body.removeAttribute('data-original-top');
      document.body.removeAttribute('data-original-width');

      if (savedScrollY !== '0') {
        window.scrollTo(0, parseInt(savedScrollY));
      }
    };
  }, []);
};


