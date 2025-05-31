import { useState, useEffect, useRef, lazy, Suspense } from 'react';

// Hook para lazy loading de componentes
export const useLazyLoading = () => {
  const [loadedComponents, setLoadedComponents] = useState(new Set());
  
  const loadComponent = (componentName, importFunction) => {
    if (loadedComponents.has(componentName)) {
      return true;
    }
    
    // Carregar componente de forma assíncrona
    importFunction().then(() => {
      setLoadedComponents(prev => new Set([...prev, componentName]));
    }).catch(error => {
      console.error(`Erro ao carregar componente ${componentName}:`, error);
    });
    
    return false;
  };
  
  return { loadComponent, loadedComponents };
};

// Hook para intersection observer (lazy loading baseado em visibilidade)
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef(null);
  
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );
    
    observer.observe(target);
    
    return () => observer.disconnect();
  }, [hasIntersected, options]);
  
  return { targetRef, isIntersecting, hasIntersected };
};

// Componente wrapper para lazy loading
export const LazyWrapper = ({ 
  children, 
  fallback = <div>Carregando...</div>,
  shouldLoad = true 
}) => {
  const { targetRef, hasIntersected } = useIntersectionObserver();
  
  return (
    <div ref={targetRef}>
      {shouldLoad && hasIntersected ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
};

// Hook para preload de recursos
export const useResourcePreloader = () => {
  const preloadedResources = useRef(new Set());
  
  const preloadImage = (src) => {
    if (preloadedResources.current.has(src)) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        preloadedResources.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  };
  
  const preloadAudio = async (src) => {
    if (preloadedResources.current.has(src)) return Promise.resolve();
    
    try {
      const response = await fetch(src, { method: 'HEAD' });
      if (response.ok) {
        preloadedResources.current.add(src);
      }
      return response.ok;
    } catch (error) {
      return false;
    }
  };
  
  const preloadScript = (src) => {
    if (preloadedResources.current.has(src)) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = () => {
        preloadedResources.current.add(src);
        resolve();
      };
      script.onerror = reject;
      script.src = src;
      document.head.appendChild(script);
    });
  };
  
  return {
    preloadImage,
    preloadAudio,
    preloadScript,
    preloadedResources: preloadedResources.current
  };
};

// Hook para virtual scrolling (para listas grandes)
export const useVirtualScrolling = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);
  
  const visibleItems = Math.ceil(containerHeight / itemHeight) + 2;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItems, items.length);
  
  const visibleItemsData = items.slice(startIndex, endIndex).map((item, index) => ({
    ...item,
    index: startIndex + index,
    top: (startIndex + index) * itemHeight
  }));
  
  const totalHeight = items.length * itemHeight;
  
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };
  
  return {
    visibleItemsData,
    totalHeight,
    handleScroll,
    containerRef,
    setContainerRef
  };
};

// Componente de lista virtualizada
export const VirtualizedList = ({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem,
  className 
}) => {
  const {
    visibleItemsData,
    totalHeight,
    handleScroll,
    setContainerRef
  } = useVirtualScrolling(items, itemHeight, containerHeight);
  
  return (
    <div
      ref={setContainerRef}
      className={className}
      style={{
        height: containerHeight,
        overflow: 'auto'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItemsData.map((item) => (
          <div
            key={item.index}
            style={{
              position: 'absolute',
              top: item.top,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, item.index)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Lazy loading de componentes específicos do jogo
export const LazyGameMenu = lazy(() => import('../components/GameMenu'));
export const LazyStatistics = lazy(() => import('../components/Statistics'));
export const LazyTutorial = lazy(() => import('../components/Tutorial'));
export const LazyMultiplayerLobby = lazy(() => import('../components/MultiplayerLobby'));
export const LazyMultiplayerGame = lazy(() => import('../components/MultiplayerGame'));
