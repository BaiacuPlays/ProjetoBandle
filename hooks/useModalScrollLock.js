import { useEffect } from 'react';

/**
 * Hook personalizado para bloquear o scroll da página quando um modal está aberto
 * @param {boolean} isOpen - Se o modal está aberto ou não
 */
export const useModalScrollLock = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      // Salvar posição atual do scroll
      const scrollY = window.scrollY;

      // Salvar valores originais ANTES de modificar
      const originalBodyOverflow = document.body.style.overflow || '';
      const originalHtmlOverflow = document.documentElement.style.overflow || '';
      const originalBodyPosition = document.body.style.position || '';
      const originalBodyTop = document.body.style.top || '';
      const originalBodyWidth = document.body.style.width || '';
      const originalBodyHeight = document.body.style.height || '';
      const originalBodyLeft = document.body.style.left || '';
      const originalBodyRight = document.body.style.right || '';

      // APLICAR BLOQUEIO ULTRA AGRESSIVO
      // Forçar overflow hidden em múltiplas propriedades
      document.body.style.setProperty('overflow', 'hidden', 'important');
      document.body.style.setProperty('overflow-x', 'hidden', 'important');
      document.body.style.setProperty('overflow-y', 'hidden', 'important');
      document.body.style.setProperty('position', 'fixed', 'important');
      document.body.style.setProperty('top', `-${scrollY}px`, 'important');
      document.body.style.setProperty('width', '100%', 'important');
      document.body.style.setProperty('height', '100vh', 'important');
      document.body.style.setProperty('left', '0', 'important');
      document.body.style.setProperty('right', '0', 'important');

      document.documentElement.style.setProperty('overflow', 'hidden', 'important');
      document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
      document.documentElement.style.setProperty('overflow-y', 'hidden', 'important');

      // CSS simples para bloquear scroll da página
      const styleElement = document.createElement('style');
      styleElement.id = 'modal-scroll-lock';
      styleElement.innerHTML = `
        html, body {
          overflow: hidden !important;
          height: 100% !important;
        }

        /* Permitir scroll apenas nos modais */
        .tutorialModal,
        .profileModal,
        .menuContainer,
        .modal,
        .friendsModal,
        .inviteModal,
        .errorModal,
        .avatarModal,
        .referralModal {
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }

        /* Permitir scroll apenas nos modais - sem customização duplicada */
      `;
      document.head.appendChild(styleElement);

      // Salvar valores para restaurar
      document.body.setAttribute('data-scroll-y', scrollY.toString());
      document.body.setAttribute('data-original-overflow', originalBodyOverflow);
      document.body.setAttribute('data-original-position', originalBodyPosition);
      document.body.setAttribute('data-original-top', originalBodyTop);
      document.body.setAttribute('data-original-width', originalBodyWidth);
      document.body.setAttribute('data-original-height', originalBodyHeight);
      document.body.setAttribute('data-original-left', originalBodyLeft);
      document.body.setAttribute('data-original-right', originalBodyRight);
      document.documentElement.setAttribute('data-original-overflow', originalHtmlOverflow);

      // Adicionar classes
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');

    } else {
      // Restaurar tudo
      const scrollY = document.body.getAttribute('data-scroll-y') || '0';
      const originalBodyOverflow = document.body.getAttribute('data-original-overflow') || '';
      const originalHtmlOverflow = document.documentElement.getAttribute('data-original-overflow') || '';
      const originalBodyPosition = document.body.getAttribute('data-original-position') || '';
      const originalBodyTop = document.body.getAttribute('data-original-top') || '';
      const originalBodyWidth = document.body.getAttribute('data-original-width') || '';
      const originalBodyHeight = document.body.getAttribute('data-original-height') || '';
      const originalBodyLeft = document.body.getAttribute('data-original-left') || '';
      const originalBodyRight = document.body.getAttribute('data-original-right') || '';

      // Remover estilos inline forçados
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow-x');
      document.body.style.removeProperty('overflow-y');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('width');
      document.body.style.removeProperty('height');
      document.body.style.removeProperty('left');
      document.body.style.removeProperty('right');

      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow-x');
      document.documentElement.style.removeProperty('overflow-y');

      // Restaurar valores originais
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.body.style.height = originalBodyHeight;
      document.body.style.left = originalBodyLeft;
      document.body.style.right = originalBodyRight;
      document.documentElement.style.overflow = originalHtmlOverflow;

      // Remover classes
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');

      // Remover CSS dinâmico
      const styleElement = document.getElementById('modal-scroll-lock');
      if (styleElement) {
        styleElement.remove();
      }

      // Remover atributos
      document.body.removeAttribute('data-scroll-y');
      document.body.removeAttribute('data-original-overflow');
      document.body.removeAttribute('data-original-position');
      document.body.removeAttribute('data-original-top');
      document.body.removeAttribute('data-original-width');
      document.body.removeAttribute('data-original-height');
      document.body.removeAttribute('data-original-left');
      document.body.removeAttribute('data-original-right');
      document.documentElement.removeAttribute('data-original-overflow');

      // Restaurar posição do scroll
      window.scrollTo(0, parseInt(scrollY));
    }

    // Cleanup quando o componente é desmontado
    return () => {
      const scrollY = document.body.getAttribute('data-scroll-y') || '0';
      const originalBodyOverflow = document.body.getAttribute('data-original-overflow') || '';
      const originalHtmlOverflow = document.documentElement.getAttribute('data-original-overflow') || '';
      const originalBodyPosition = document.body.getAttribute('data-original-position') || '';
      const originalBodyTop = document.body.getAttribute('data-original-top') || '';
      const originalBodyWidth = document.body.getAttribute('data-original-width') || '';
      const originalBodyHeight = document.body.getAttribute('data-original-height') || '';
      const originalBodyLeft = document.body.getAttribute('data-original-left') || '';
      const originalBodyRight = document.body.getAttribute('data-original-right') || '';

      // Remover estilos inline forçados
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow-x');
      document.body.style.removeProperty('overflow-y');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('width');
      document.body.style.removeProperty('height');
      document.body.style.removeProperty('left');
      document.body.style.removeProperty('right');

      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow-x');
      document.documentElement.style.removeProperty('overflow-y');

      // Restaurar valores originais
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.body.style.height = originalBodyHeight;
      document.body.style.left = originalBodyLeft;
      document.body.style.right = originalBodyRight;
      document.documentElement.style.overflow = originalHtmlOverflow;

      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');

      // Remover CSS dinâmico
      const styleElement = document.getElementById('modal-scroll-lock');
      if (styleElement) {
        styleElement.remove();
      }

      document.body.removeAttribute('data-scroll-y');
      document.body.removeAttribute('data-original-overflow');
      document.body.removeAttribute('data-original-position');
      document.body.removeAttribute('data-original-top');
      document.body.removeAttribute('data-original-width');
      document.body.removeAttribute('data-original-height');
      document.body.removeAttribute('data-original-left');
      document.body.removeAttribute('data-original-right');
      document.documentElement.removeAttribute('data-original-overflow');

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
    // VERSÃO SIMPLES E SEGURA - SEM INTERVALS OU OBSERVERS
    const scrollY = window.scrollY;

    // Salvar valores originais
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;

    // Aplicar bloqueio de scroll simples
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    document.documentElement.style.overflow = 'hidden';

    // Salvar valores para restaurar
    document.body.setAttribute('data-scroll-y', scrollY);
    document.body.setAttribute('data-original-overflow', originalBodyOverflow);
    document.body.setAttribute('data-original-position', originalBodyPosition);
    document.body.setAttribute('data-original-top', originalBodyTop);
    document.documentElement.setAttribute('data-original-overflow', originalHtmlOverflow);

    // Adicionar classes
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');

    // Cleanup quando o componente é desmontado
    return () => {
      const scrollY = document.body.getAttribute('data-scroll-y') || '0';
      const originalBodyOverflow = document.body.getAttribute('data-original-overflow') || '';
      const originalHtmlOverflow = document.documentElement.getAttribute('data-original-overflow') || '';
      const originalBodyPosition = document.body.getAttribute('data-original-position') || '';
      const originalBodyTop = document.body.getAttribute('data-original-top') || '';

      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = '';

      document.documentElement.style.overflow = originalHtmlOverflow;

      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');

      document.body.removeAttribute('data-scroll-y');
      document.body.removeAttribute('data-original-overflow');
      document.body.removeAttribute('data-original-position');
      document.body.removeAttribute('data-original-top');
      document.documentElement.removeAttribute('data-original-overflow');

      if (scrollY !== '0') {
        window.scrollTo(0, parseInt(scrollY));
      }
    };
  }, []);
};
