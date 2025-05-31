// Service Worker para LudoMusic - Cache Offline Inteligente
const CACHE_NAME = 'ludomusic-v1.2';
const AUDIO_CACHE_NAME = 'ludomusic-audio-v1.2';
const STATIC_CACHE_NAME = 'ludomusic-static-v1.2';

// Recursos estáticos para cache
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/sacabambapis.png'
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Configuração de cache por tipo de recurso
const CACHE_CONFIG = {
  '/audio/': {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: AUDIO_CACHE_NAME,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    maxEntries: 50
  },
  '/api/': {
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: CACHE_NAME,
    maxAge: 5 * 60 * 1000, // 5 minutos
    maxEntries: 20
  },
  '/_next/static/': {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: STATIC_CACHE_NAME,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    maxEntries: 100
  }
};

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Cache estático criado');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('Recursos estáticos cacheados');
        return self.skipWaiting();
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Remover caches antigos
            if (cacheName !== CACHE_NAME && 
                cacheName !== AUDIO_CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME) {
              console.log('Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker ativado');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') return;
  
  // Ignorar requisições de outros domínios (exceto áudio)
  if (url.origin !== self.location.origin && !url.pathname.includes('/audio/')) {
    return;
  }
  
  // Determinar estratégia de cache
  const cacheConfig = getCacheConfig(url.pathname);
  
  if (cacheConfig) {
    event.respondWith(handleRequest(request, cacheConfig));
  }
});

// Obter configuração de cache para um caminho
function getCacheConfig(pathname) {
  for (const [path, config] of Object.entries(CACHE_CONFIG)) {
    if (pathname.includes(path)) {
      return config;
    }
  }
  
  // Configuração padrão
  return {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: CACHE_NAME,
    maxAge: 60 * 60 * 1000, // 1 hora
    maxEntries: 30
  };
}

// Manipular requisição com base na estratégia
async function handleRequest(request, config) {
  const { strategy, cacheName } = config;
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName, config);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName, config);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName, config);
    
    default:
      return fetch(request);
  }
}

// Estratégia Cache First
async function cacheFirst(request, cacheName, config) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, config.maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clonar resposta antes de cachear
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      await cleanupCache(cache, config.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    // Retornar cache mesmo se expirado, em caso de erro de rede
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Estratégia Network First
async function networkFirst(request, cacheName, config) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      await cleanupCache(cache, config.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Estratégia Stale While Revalidate
async function staleWhileRevalidate(request, cacheName, config) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Buscar nova versão em background
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      await cleanupCache(cache, config.maxEntries);
    }
    return networkResponse;
  }).catch(() => {
    // Ignorar erros de rede em background
  });
  
  // Retornar cache imediatamente se disponível
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Se não há cache, aguardar rede
  return fetchPromise;
}

// Verificar se resposta está expirada
function isExpired(response, maxAge) {
  if (!maxAge) return false;
  
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseTime = new Date(dateHeader).getTime();
  const now = Date.now();
  
  return (now - responseTime) > maxAge;
}

// Limpar cache antigo
async function cleanupCache(cache, maxEntries) {
  if (!maxEntries) return;
  
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    // Remover entradas mais antigas
    const entriesToDelete = keys.slice(0, keys.length - maxEntries);
    
    await Promise.all(
      entriesToDelete.map(key => cache.delete(key))
    );
  }
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
    
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
  }
});

// Obter tamanho do cache
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  
  return totalSize;
}

// Limpar todos os caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}
