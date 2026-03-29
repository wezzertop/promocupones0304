const CACHE_NAME = 'cupoferta-cache-v1';

const PRECACHE_URLS = [
  '/'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Ignorar methods no soportados o extensiones
  if (event.request.method !== 'GET') return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 2. Reglas CACHE-FIRST (Imágenes pesadas y Next.js Statics)
  const isImageDomain = [
    'lh3.googleusercontent.com',
    'avatars.githubusercontent.com',
    'images.unsplash.com',
    'm.media-amazon.com',
    'images-na.ssl-images-amazon.com',
    'http2.mlstatic.com',
    'i.imgur.com',
    'supabase.co',
    'api.dicebear.com'
  ].some(domain => url.hostname.includes(domain));

  const isStaticResource = 
    event.request.destination === 'image' ||
    event.request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image');

  if (isImageDomain || isStaticResource) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Cache hit: Cargar súper rápido y con 0KB de datos
          return cachedResponse;
        }

        // Cache miss: Traer de la red y guardar copia
        return fetch(event.request).then(response => {
           if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
             return response;
           }

           const responseToCache = response.clone();
           caches.open(CACHE_NAME)
             .then(cache => cache.put(event.request, responseToCache));
             
           return response;
        }).catch(() => caches.match(event.request));
      })
    );
    return;
  }

  // 3. Reglas NETWORK-FIRST (Datos puros: API, HTMLs para ofertas frescas)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
           cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
