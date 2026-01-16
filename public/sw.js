// MindLoop CostOS - Service Worker
// Requerido para PWA instalable

const CACHE_NAME = 'mindloop-costos-v2';
const OFFLINE_URL = '/offline.html';

// Archivos esenciales a cachear para funcionamiento offline básico
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/manifest.json',
    '/images/logo-sin-circulo.png'
];

// Instalación: cachear recursos estáticos
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cacheando recursos esenciales');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activación: limpiar caches antiguos
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activado');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: estrategia Network First con fallback a cache
self.addEventListener('fetch', (event) => {
    // Solo interceptar requests GET
    if (event.request.method !== 'GET') return;

    // No cachear requests a API
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si la respuesta es válida, guardar en cache
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Si falla la red, intentar servir desde cache
                return caches.match(event.request).then((cachedResponse) => {
                    return cachedResponse || caches.match('/');
                });
            })
    );
});

console.log('🚀 MindLoop CostOS Service Worker cargado');
