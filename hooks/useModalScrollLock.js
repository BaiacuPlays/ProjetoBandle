import { useEffect } from 'react';

// Função para forçar remoção de scroll de forma ultra agressiva
const forceRemoveScroll = () => {
  // Método 1: CSS inline direto
  document.documentElement.style.setProperty('overflow', 'hidden', 'important');
  document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
  document.documentElement.style.setProperty('overflow-y', 'hidden', 'important');
  document.body.style.setProperty('overflow', 'hidden', 'important');
  document.body.style.setProperty('overflow-x', 'hidden', 'important');
  document.body.style.setProperty('overflow-y', 'hidden', 'important');

  // Método 2: Remover scrollbars via CSS
  const existingStyle = document.getElementById('ultra-scroll-lock');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'ultra-scroll-lock';
    style.innerHTML = `
      html, body {
        overflow: hidden !important;
        overflow-x: hidden !important;
        overflow-y: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      html::-webkit-scrollbar,
      body::-webkit-scrollbar,
      *::-webkit-scrollbar {
        display: none !important;
        width: 0px !important;
        height: 0px !important;
        background: transparent !important;
      }
      html, body, * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      #__next {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Método 3: Forçar via atributos
  document.documentElement.setAttribute('style',
    document.documentElement.getAttribute('style') + '; overflow: hidden !important; overflow-x: hidden !important; overflow-y: hidden !important;'
  );
  document.body.setAttribute('style',
    document.body.getAttribute('style') + '; overflow: hidden !important; overflow-x: hidden !important; overflow-y: hidden !important;'
  );
};

/**
 * Hook personalizado para bloquear o scroll da página quando um modal está aberto
 * @param {boolean} isOpen - Se o modal está aberto ou não
 */
export const useModalScrollLock = (isOpen) => {
  useEffect(() => {
    let intervalId;
    let mutationObserver;

    if (isOpen) {
      // Salvar posição atual do scroll
      const scrollY = window.scrollY;

      // Salvar valores originais
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyTop = document.body.style.top;

      // Salvar valores originais
      document.body.setAttribute('data-scroll-y', scrollY);
      document.body.setAttribute('data-original-overflow', originalBodyOverflow);
      document.body.setAttribute('data-original-position', originalBodyPosition);
      document.body.setAttribute('data-original-top', originalBodyTop);
      document.documentElement.setAttribute('data-original-overflow', originalHtmlOverflow);

      // MÉTODO ULTRA AGRESSIVO - FORÇAR CONTINUAMENTE
      const applyScrollLock = () => {
        // Aplicar posição fixa
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.height = '100vh';

        // Forçar remoção de scroll
        forceRemoveScroll();

        // Adicionar classes
        document.body.classList.add('modal-open');
        document.documentElement.classList.add('modal-open');
      };

      // Aplicar imediatamente
      applyScrollLock();

      // Forçar aplicação a cada 50ms para garantir que funcione
      intervalId = setInterval(applyScrollLock, 50);

      // Observar mudanças no DOM e reaplicar
      mutationObserver = new MutationObserver(() => {
        applyScrollLock();
      });

      mutationObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: true,
        subtree: false
      });

      mutationObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: false,
        subtree: false
      });

    } else {
      // Parar interval e observer
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }

      // Restaurar tudo
      const scrollY = document.body.getAttribute('data-scroll-y') || '0';
      const originalBodyOverflow = document.body.getAttribute('data-original-overflow') || '';
      const originalHtmlOverflow = document.documentElement.getAttribute('data-original-overflow') || '';
      const originalBodyPosition = document.body.getAttribute('data-original-position') || '';
      const originalBodyTop = document.body.getAttribute('data-original-top') || '';

      // Remover estilos inline
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.height = '';

      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.position = '';
      document.documentElement.style.height = '';
      document.documentElement.style.width = '';

      // Remover classes
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');

      // Remover atributos
      document.body.removeAttribute('data-scroll-y');
      document.body.removeAttribute('data-original-overflow');
      document.body.removeAttribute('data-original-position');
      document.body.removeAttribute('data-original-top');
      document.documentElement.removeAttribute('data-original-overflow');

      // Remover style tags
      const styleTag = document.getElementById('modal-scroll-lock');
      if (styleTag) {
        styleTag.remove();
      }
      const ultraStyleTag = document.getElementById('ultra-scroll-lock');
      if (ultraStyleTag) {
        ultraStyleTag.remove();
      }

      // Restaurar posição do scroll
      window.scrollTo(0, parseInt(scrollY));
    }

    // Cleanup quando o componente é desmontado
    return () => {
      // Parar interval e observer
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }

      const scrollY = document.body.getAttribute('data-scroll-y') || '0';
      const originalBodyOverflow = document.body.getAttribute('data-original-overflow') || '';
      const originalHtmlOverflow = document.documentElement.getAttribute('data-original-overflow') || '';
      const originalBodyPosition = document.body.getAttribute('data-original-position') || '';
      const originalBodyTop = document.body.getAttribute('data-original-top') || '';

      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.height = '';

      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.position = '';
      document.documentElement.style.height = '';
      document.documentElement.style.width = '';

      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');

      document.body.removeAttribute('data-scroll-y');
      document.body.removeAttribute('data-original-overflow');
      document.body.removeAttribute('data-original-position');
      document.body.removeAttribute('data-original-top');
      document.documentElement.removeAttribute('data-original-overflow');

      const styleTag = document.getElementById('modal-scroll-lock');
      if (styleTag) {
        styleTag.remove();
      }
      const ultraStyleTag = document.getElementById('ultra-scroll-lock');
      if (ultraStyleTag) {
        ultraStyleTag.remove();
      }

      if (scrollY !== '0') {
        window.scrollTo(0, parseInt(scrollY));
      }
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

    // MÉTODO EXTREMAMENTE AGRESSIVO - FORÇAR TUDO
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalBodyHeight = document.body.style.height;

    // Aplicar estilos inline com máxima prioridade
    document.body.style.cssText += `
      overflow: hidden !important;
      position: fixed !important;
      top: -${scrollY}px !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
    `;

    document.documentElement.style.cssText += `
      overflow: hidden !important;
      position: fixed !important;
      height: 100vh !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    `;

    // Adicionar classes também
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');

    // Salvar valores originais e posição do scroll
    document.body.setAttribute('data-scroll-y', scrollY);
    document.body.setAttribute('data-original-overflow', originalBodyOverflow);
    document.body.setAttribute('data-original-position', originalBodyPosition);
    document.body.setAttribute('data-original-top', originalBodyTop);
    document.body.setAttribute('data-original-width', originalBodyWidth);
    document.body.setAttribute('data-original-height', originalBodyHeight);
    document.documentElement.setAttribute('data-original-overflow', originalHtmlOverflow);

    // Forçar remoção de scrollbars via JavaScript também
    const style = document.createElement('style');
    style.id = 'modal-scroll-lock-always';
    style.innerHTML = `
      html, body {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100vh !important;
      }
      html::-webkit-scrollbar, body::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
      }
      html *, body * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup quando o componente é desmontado
    return () => {
      const scrollY = document.body.getAttribute('data-scroll-y') || '0';
      const originalBodyOverflow = document.body.getAttribute('data-original-overflow') || '';
      const originalHtmlOverflow = document.documentElement.getAttribute('data-original-overflow') || '';
      const originalBodyPosition = document.body.getAttribute('data-original-position') || '';
      const originalBodyTop = document.body.getAttribute('data-original-top') || '';
      const originalBodyWidth = document.body.getAttribute('data-original-width') || '';
      const originalBodyHeight = document.body.getAttribute('data-original-height') || '';

      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = originalBodyWidth;
      document.body.style.height = originalBodyHeight;
      document.body.style.margin = '';
      document.body.style.padding = '';

      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.position = '';
      document.documentElement.style.height = '';
      document.documentElement.style.width = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';

      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');

      document.body.removeAttribute('data-scroll-y');
      document.body.removeAttribute('data-original-overflow');
      document.body.removeAttribute('data-original-position');
      document.body.removeAttribute('data-original-top');
      document.body.removeAttribute('data-original-width');
      document.body.removeAttribute('data-original-height');
      document.documentElement.removeAttribute('data-original-overflow');

      const styleTag = document.getElementById('modal-scroll-lock-always');
      if (styleTag) {
        styleTag.remove();
      }

      if (scrollY !== '0') {
        window.scrollTo(0, parseInt(scrollY));
      }
    };
  }, []);
};
