/**
 * sw.js — Service Worker Rusty Pub
 * v6 — ELITE: ícones/favicon/OG cacheados, sem dependência de terceiros (Unsplash removido)
 */
const CACHE_VERSION = 'v6';
const CACHE_STATIC  = `rusty-pub-static-${CACHE_VERSION}`;
const CACHE_FONTS   = `rusty-pub-fonts-${CACHE_VERSION}`;
const CACHE_IMAGES  = `rusty-pub-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/cardapio.html',
  '/css/lp.css',
  '/css/cardapio.css',
  '/js/main.js',
  '/js/cardapio.js',
  '/js/utils/helpers.js',
  '/js/utils/reveal.js',
  '/js/modules/agenda.js',
  '/js/modules/galeria.js',
  '/js/modules/eventosPassados.js',
  '/js/modules/lightbox.js',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Cache install partial:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_FONTS && k !== CACHE_IMAGES)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora métodos não-GET e chamadas de API
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname === '/health') return;

  // Fontes e CDN externas — cache first (assets imutáveis)
  if (url.hostname.includes('fonts.g') || url.hostname.includes('cdnjs')) {
    event.respondWith(cacheFirst(request, CACHE_FONTS));
    return;
  }

  // Assets estáticos JS/CSS — cache first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // HTML — network first (sempre fresco)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Imagens locais — stale-while-revalidate
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(staleWhileRevalidate(request, CACHE_IMAGES));
    return;
  }
});

async function cacheFirst(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request))
        || (await caches.match('/index.html'))
        || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fresh  = fetch(request)
    .then(r => { if (r.ok) cache.put(request, r.clone()); return r; })
    .catch(() => null);
  return cached || await fresh;
}
