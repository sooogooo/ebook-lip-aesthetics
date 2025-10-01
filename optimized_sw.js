// Optimized Service Worker for Performance
const CACHE_NAME = 'lips-aesthetics-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';
const IMAGE_CACHE = 'image-cache-v1';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
    '/',
    '/optimized_visualization_hub.html',
    '/optimized_styles.css',
    '/optimized_3d_viewer.html',
    '/optimized_gallery.html',
    '/optimized_charts.html'
];

// Network-first resources (always try network first)
const NETWORK_FIRST_URLS = [
    '/api/',
    '/data/',
    '.json'
];

// Cache-first resources (prefer cache for performance)
const CACHE_FIRST_URLS = [
    '.css',
    '.js',
    '.woff2',
    '.woff',
    '.ttf'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
    console.log('Service Worker: Installing');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching critical resources');
                // Cache critical resources but don't wait for all
                return cache.addAll(CRITICAL_RESOURCES.filter(url => {
                    // Only cache existing resources
                    return fetch(url, { method: 'HEAD' })
                        .then(() => true)
                        .catch(() => false);
                }));
            })
            .then(() => self.skipWaiting()) // Activate immediately
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => {
                            return cacheName !== CACHE_NAME &&
                                   cacheName !== RUNTIME_CACHE &&
                                   cacheName !== IMAGE_CACHE;
                        })
                        .map(cacheName => {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => self.clients.claim()) // Take control immediately
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Handle different caching strategies
    if (isNetworkFirst(url.pathname)) {
        event.respondWith(networkFirst(request));
    } else if (isCacheFirst(url.pathname)) {
        event.respondWith(cacheFirst(request));
    } else if (isImage(url.pathname)) {
        event.respondWith(cacheImage(request));
    } else {
        // Default: Stale While Revalidate
        event.respondWith(staleWhileRevalidate(request));
    }
});

// Network First Strategy (for API calls and dynamic content)
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }

        throw error;
    }
}

// Cache First Strategy (for static assets)
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Update cache in background
        fetch(request).then(response => {
            if (response.ok) {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, response);
                });
            }
        });

        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;
    }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);

    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            caches.open(RUNTIME_CACHE).then(cache => {
                cache.put(request, networkResponse.clone());
            });
        }
        return networkResponse;
    });

    return cachedResponse || fetchPromise;
}

// Image Caching Strategy with size optimization
async function cacheImage(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Check if image size is reasonable for caching
            const contentLength = networkResponse.headers.get('content-length');
            const maxSize = 5 * 1024 * 1024; // 5MB limit

            if (!contentLength || parseInt(contentLength) < maxSize) {
                const cache = await caches.open(IMAGE_CACHE);
                cache.put(request, networkResponse.clone());
            }
        }

        return networkResponse;
    } catch (error) {
        // Return placeholder image if available
        return caches.match('/assets/placeholder.svg');
    }
}

// Helper functions
function isNetworkFirst(pathname) {
    return NETWORK_FIRST_URLS.some(url => pathname.includes(url));
}

function isCacheFirst(pathname) {
    return CACHE_FIRST_URLS.some(ext => pathname.endsWith(ext));
}

function isImage(pathname) {
    return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(pathname);
}

// Message handler for cache management
self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }

    if (event.data.action === 'clearCache') {
        caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
                caches.delete(cacheName);
            });
        });
    }

    if (event.data.action === 'getCacheSize') {
        calculateCacheSize().then(size => {
            event.ports[0].postMessage({ size });
        });
    }
});

// Calculate total cache size
async function calculateCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();

        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }

    return totalSize;
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncOfflineData());
    }
});

async function syncOfflineData() {
    // Sync any offline data when connection is restored
    console.log('Background sync: Syncing offline data');
    // Implementation depends on your specific needs
}

// Push notification support
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('绛唇解语花', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('Service Worker: Optimized service worker loaded');