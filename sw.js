// ── {короче} · Service Worker ───────────────────────────────────
// Стратегия: Cache First для статики, Network First для HTML страниц

const CACHE_NAME = 'koroche-v1';
const STATIC_CACHE = 'koroche-static-v1';

// Страницы и ресурсы для предварительного кэширования при установке
const PRECACHE_URLS = [
  '/',
  '/tickets/',
  '/shows/',
  '/bychkova/',
  '/contacts/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/assets/style.css',
  '/assets/main.js',
];

// ── Установка: кэшируем ключевые страницы ───────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Активация: удаляем старые кэши ──────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Обработка запросов ───────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML-страницы — Network First (свежий контент, офлайн-страница как фолбэк)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // Статика (css/js/иконки) — Cache First
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const copy = response.clone();
        caches.open(STATIC_CACHE).then(cache => cache.put(request, copy));
        return response;
      });
    })
  );
});
