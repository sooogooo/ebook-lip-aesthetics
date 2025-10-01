// Advanced Service Worker with Multiple Caching Strategies
// Version: 2.0.0

const CACHE_VERSION = 'v2.0.0';
const CACHE_NAMES = {
  STATIC: `static-${CACHE_VERSION}`,
  DYNAMIC: `dynamic-${CACHE_VERSION}`,
  IMAGES: `images-${CACHE_VERSION}`,
  MODELS: `3d-models-${CACHE_VERSION}`,
  API: `api-${CACHE_VERSION}`,
  FONTS: `fonts-${CACHE_VERSION}`
};

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/visualization_hub.html',
  '/medical_dashboard.html',
  '/enhanced_3d_anatomy.html',
  '/unified_styles.min.css',
  '/integration.min.js',
  '/manifest.json'
];

// Cache size limits
const CACHE_LIMITS = {
  IMAGES: 50, // Max 50 images
  DYNAMIC: 30, // Max 30 dynamic responses
  API: 20, // Max 20 API responses
  MODELS: 10 // Max 10 3D models
};

// Cache expiration times (in seconds)
const CACHE_EXPIRATION = {
  STATIC: 7 * 24 * 60 * 60, // 7 days
  DYNAMIC: 24 * 60 * 60, // 1 day
  IMAGES: 30 * 24 * 60 * 60, // 30 days
  MODELS: 60 * 24 * 60 * 60, // 60 days
  API: 5 * 60, // 5 minutes
  FONTS: 365 * 24 * 60 * 60 // 1 year
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return !Object.values(CACHE_NAMES).includes(cacheName);
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Choose strategy based on request type
  if (request.method === 'GET') {
    let responsePromise;

    if (isStaticAsset(url)) {
      responsePromise = cacheFirst(request, CACHE_NAMES.STATIC);
    } else if (isImage(url)) {
      responsePromise = cacheFirst(request, CACHE_NAMES.IMAGES);
    } else if (is3DModel(url)) {
      responsePromise = cacheFirst(request, CACHE_NAMES.MODELS);
    } else if (isFont(url)) {
      responsePromise = cacheFirst(request, CACHE_NAMES.FONTS);
    } else if (isAPI(url)) {
      responsePromise = networkFirst(request, CACHE_NAMES.API);
    } else {
      responsePromise = staleWhileRevalidate(request, CACHE_NAMES.DYNAMIC);
    }

    event.respondWith(responsePromise);
  }
});

// Caching Strategies

// Cache First - for static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached && !isExpired(cached, cacheName)) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      cache.put(request, addTimestamp(responseClone));
      await trimCache(cacheName);
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return cached || createOfflineResponse();
  }
}

// Network First - for API calls
async function networkFirst(request, cacheName) {
  try {
    const response = await fetchWithTimeout(request, 5000);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, addTimestamp(response.clone()));
      await trimCache(cacheName);
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);
    return cached || createOfflineResponse();
  }
}

// Stale While Revalidate - for dynamic content
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, addTimestamp(response.clone()));
        trimCache(cacheName);
      }
      return response;
    })
    .catch(() => cached || createOfflineResponse());

  return cached || fetchPromise;
}

// Helper Functions

function isStaticAsset(url) {
  return /\.(css|js)$/.test(url.pathname) && url.pathname.includes('.min.');
}

function isImage(url) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname);
}

function is3DModel(url) {
  return /\.(gltf|glb|obj|mtl|fbx|dae|3ds|ply|stl)$/i.test(url.pathname);
}

function isFont(url) {
  return /\.(woff|woff2|ttf|otf|eot)$/i.test(url.pathname) ||
         url.hostname.includes('fonts.googleapis.com') ||
         url.hostname.includes('fonts.gstatic.com');
}

function isAPI(url) {
  return url.pathname.startsWith('/api/') ||
         url.hostname.includes('api.') ||
         url.pathname.includes('/data/');
}

function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.append('sw-cache-timestamp', Date.now().toString());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

function isExpired(response, cacheName) {
  const timestamp = response.headers.get('sw-cache-timestamp');
  if (!timestamp) return false;

  const age = (Date.now() - parseInt(timestamp)) / 1000;
  const maxAge = CACHE_EXPIRATION[cacheName.split('-')[0].toUpperCase()] || CACHE_EXPIRATION.DYNAMIC;

  return age > maxAge;
}

async function trimCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const cacheType = cacheName.split('-')[0].toUpperCase();
  const limit = CACHE_LIMITS[cacheType];

  if (limit && keys.length > limit) {
    // Remove oldest entries
    const toDelete = keys.slice(0, keys.length - limit);
    await Promise.all(toDelete.map(key => cache.delete(key)));
    console.log(`[SW] Trimmed ${toDelete.length} items from ${cacheName}`);
  }
}

function fetchWithTimeout(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout')), timeout)
    )
  ]);
}

function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'The application is currently offline. Please check your connection.'
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }
  );
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // Implement offline data sync
  console.log('[SW] Syncing offline data');
  // Add your sync logic here
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: 'Open App' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Lips Aesthetics', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames =>
        Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
      )
    );
  } else if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAMES.DYNAMIC)
        .then(cache => cache.addAll(event.data.urls))
    );
  }
});

// Performance monitoring
let performanceData = {
  cacheHits: 0,
  cacheMisses: 0,
  fetchErrors: 0
};

// Send performance data periodically
setInterval(() => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PERFORMANCE_DATA',
        data: performanceData
      });
    });
  });
  // Reset counters
  performanceData = {
    cacheHits: 0,
    cacheMisses: 0,
    fetchErrors: 0
  };
}, 60000); // Every minute

console.log('[SW] Service Worker v2.0.0 loaded');