/**
 * Service Worker for Lips Aesthetics Mobile App
 * Provides offline functionality, caching, background sync, and push notifications
 * Optimized for mobile performance and battery efficiency
 */

const CACHE_NAME = 'lips-aesthetics-v2.0.0';
const RUNTIME_CACHE = 'runtime-cache-v2.0.0';
const STATIC_CACHE = 'static-cache-v2.0.0';
const API_CACHE = 'api-cache-v2.0.0';
const IMAGE_CACHE = 'image-cache-v2.0.0';
const WEBGL_CACHE = 'webgl-cache-v2.0.0';
const CRITICAL_CACHE = 'critical-cache-v2.0.0';

// Critical resources for app shell - highest priority
const CRITICAL_RESOURCES = [
  '/',
  '/mobile_demo.html',
  '/mobile_optimizations.css',
  '/unified_styles.css',
  '/gallery.css',
  '/mobile_integration_hub.js',
  '/mobile_gestures.js',
  '/pwa_manifest.json'
];

// Secondary resources - load after critical resources
const SECONDARY_RESOURCES = [
  '/gallery.html',
  '/3d_viewer.html',
  '/ar_viewer.html',
  '/admin.html',
  '/gallery.js',
  '/3d_models.js',
  '/zoom_viewer.css',
  '/zoom_viewer.js',
  '/charts.css',
  '/charts.js',
  '/icons.css',
  '/sample_data.json'
];

// WebGL and 3D resources - load on demand
const WEBGL_RESOURCES = [
  '/enhanced_3d_anatomy.js',
  '/advanced_medical_shaders.js',
  '/advanced_medical_visualization.js',
  '/mobile_3d_viewer.js'
];

// AR resources - load on demand
const AR_RESOURCES = [
  '/mobile_ar_handler.js',
  '/ar_viewer.html'
];

// Network-first resources (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/admin/,
  /\/analytics/,
  /\.json$/
];

// Cache-first resources (serve from cache if available)
const CACHE_FIRST_PATTERNS = [
  /\.css$/,
  /\.js$/,
  /\.svg$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.otf$/
];

// Stale-while-revalidate resources
const STALE_WHILE_REVALIDATE_PATTERNS = [
  /\.html$/,
  /\/gallery/,
  /\/viewer/
];

// Image optimization settings
const IMAGE_CACHE_SETTINGS = {
  maxEntries: 100,
  maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
  purgeOnQuotaError: true
};

// API cache settings
const API_CACHE_SETTINGS = {
  maxEntries: 50,
  maxAgeSeconds: 24 * 60 * 60, // 1 day
  purgeOnQuotaError: true
};

// Background sync settings
const BACKGROUND_SYNC_TAG = 'lips-aesthetics-sync';
const SYNC_QUEUE = 'sync-queue';

/**
 * Service Worker Event Listeners
 */

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('[SW] Install event');

  event.waitUntil(
    (async () => {
      try {
        // Cache critical resources first (app shell)
        const criticalCache = await caches.open(CRITICAL_CACHE);
        await criticalCache.addAll(CRITICAL_RESOURCES);
        console.log('[SW] Critical resources cached');

        // Cache secondary resources with timeout
        const staticCache = await caches.open(STATIC_CACHE);
        await Promise.allSettled(
          SECONDARY_RESOURCES.map(url =>
            Promise.race([
              staticCache.add(url),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ])
          )
        );
        console.log('[SW] Secondary resources cached');

        // Initialize advanced features
        await initializeSyncQueue();
        await initializePerformanceMonitoring();
        await initializeBatteryOptimization();
        await setupIntelligentPrefetch();

        console.log('[SW] Advanced features initialized');

        // Skip waiting to activate immediately
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] Install failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');

  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        await cleanupOldCaches();

        // Claim all clients
        await self.clients.claim();

        console.log('[SW] Service worker activated');

        // Notify clients that SW is ready
        await notifyClientsReady();
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

// Enhanced fetch event with intelligent request handling
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for background sync
  if (request.method !== 'GET') {
    event.respondWith(handleNonGetRequest(request));
    return;
  }

  // Use intelligent request interceptor
  event.respondWith(requestInterceptor.handleRequest(request));
});

// Background sync event
self.addEventListener('sync', event => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(processBackgroundSync());
  }
});

// Push notification event
self.addEventListener('push', event => {
  console.log('[SW] Push event received');

  const options = {
    body: 'You have new aesthetic insights available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'lips-aesthetics-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View Now',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    data: {
      url: '/gallery.html',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      Object.assign(options, payload);
    } catch (error) {
      console.warn('[SW] Failed to parse push payload:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification('绛唇解语花', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click:', event.action);

  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/gallery.html';

    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ type: 'window' });

        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window if app not found
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })()
    );
  }
});

// Message event for communication with clients
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);

  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_STATUS':
      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        payload: getCacheStatus()
      });
      break;

    case 'CLEAR_CACHE':
      clearSpecificCache(payload.cacheName).then(() => {
        event.ports[0].postMessage({
          type: 'CACHE_CLEARED',
          payload: { success: true }
        });
      });
      break;

    case 'PRELOAD_CONTENT':
      preloadContent(payload.urls).then(() => {
        event.ports[0].postMessage({
          type: 'CONTENT_PRELOADED',
          payload: { success: true }
        });
      });
      break;

    case 'SYNC_DATA':
      addToSyncQueue(payload.data);
      registerBackgroundSync();
      break;
  }
});

/**
 * Caching Strategies
 */

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', error);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback
    return getOfflineFallback(request);
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network failed for cache-first:', error);
    return getOfflineFallback(request);
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(RUNTIME_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(error => {
    console.warn('[SW] Network failed for stale-while-revalidate:', error);
    return cachedResponse;
  });

  return cachedResponse || fetchPromise;
}

// Handle image requests with optimization
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);

      // Implement cache size management
      await manageCacheSize(cache, IMAGE_CACHE_SETTINGS);

      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('[SW] Image request failed:', error);
    return getImageFallback();
  }
}

// Handle non-GET requests (POST, PUT, DELETE)
async function handleNonGetRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.warn('[SW] Non-GET request failed, queueing for sync:', error);

    // Queue for background sync
    await addToSyncQueue({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    });

    await registerBackgroundSync();

    // Return appropriate offline response
    return new Response(JSON.stringify({
      error: 'Offline',
      queued: true,
      message: 'Request queued for when connection is restored'
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Utility Functions
 */

function shouldUseNetworkFirst(url) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function shouldUseCacheFirst(url) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function shouldUseStaleWhileRevalidate(url) {
  return STALE_WHILE_REVALIDATE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isImageRequest(request) {
  return request.destination === 'image' ||
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(new URL(request.url).pathname);
}

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCaches = [
    CACHE_NAME, RUNTIME_CACHE, STATIC_CACHE, API_CACHE,
    IMAGE_CACHE, WEBGL_CACHE, CRITICAL_CACHE, 'performance-metrics',
    'battery-optimization', 'user-behavior'
  ];

  await Promise.all(
    cacheNames
      .filter(cacheName => !validCaches.includes(cacheName))
      .map(cacheName => {
        console.log('[SW] Cleaning up old cache:', cacheName);
        return caches.delete(cacheName);
      })
  );

  // Clean up expired entries
  await cleanExpiredCacheEntries();
}

async function manageCacheSize(cache, settings) {
  const keys = await cache.keys();

  if (keys.length >= settings.maxEntries) {
    // Remove oldest entries
    const entriesToRemove = keys.slice(0, keys.length - settings.maxEntries + 1);
    await Promise.all(entriesToRemove.map(key => cache.delete(key)));
  }
}

function getOfflineFallback(request) {
  const url = new URL(request.url);

  if (url.pathname.endsWith('.html') || request.headers.get('accept')?.includes('text/html')) {
    return caches.match('/offline.html') || createOfflineHTML();
  }

  if (isImageRequest(request)) {
    return getImageFallback();
  }

  return new Response('Offline', { status: 503 });
}

function getImageFallback() {
  // Return a simple SVG placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="#2a2a40">
      <rect width="400" height="300" fill="#2a2a40"/>
      <text x="200" y="150" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="16">
        图片暂时无法加载
      </text>
    </svg>
  `;

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

function createOfflineHTML() {
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>离线模式 - 绛唇解语花</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
          color: #ffffff;
          margin: 0;
          padding: 40px 20px;
          text-align: center;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .offline-icon {
          width: 80px;
          height: 80px;
          margin-bottom: 20px;
          opacity: 0.7;
        }
        h1 {
          color: #d4af37;
          margin-bottom: 20px;
        }
        p {
          max-width: 400px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .retry-btn {
          background: #d4af37;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .retry-btn:hover {
          background: #b8941f;
        }
      </style>
    </head>
    <body>
      <div class="offline-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#d4af37">
          <path d="M23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7L12 21.5 23.64 7z" opacity="0.3"/>
          <path d="M3.53 10.95L12 21.5l8.47-10.55C20.04 10.62 16.81 8 12 8s-8.04 2.62-8.47 2.95z"/>
        </svg>
      </div>
      <h1>当前处于离线模式</h1>
      <p>
        您现在处于离线状态。部分内容可能无法显示，但您仍可以浏览已缓存的内容。
        网络连接恢复后，内容将自动更新。
      </p>
      <button class="retry-btn" onclick="window.location.reload()">
        重新连接
      </button>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Background Sync Functions
 */

async function initializeSyncQueue() {
  const cache = await caches.open(SYNC_QUEUE);
  // Initialize with empty queue if not exists
}

async function addToSyncQueue(data) {
  const cache = await caches.open(SYNC_QUEUE);
  const request = new Request(`/sync-queue/${Date.now()}-${Math.random()}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });

  await cache.put(request, new Response(JSON.stringify(data)));
}

async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      await self.registration.sync.register(BACKGROUND_SYNC_TAG);
      console.log('[SW] Background sync registered');
    } catch (error) {
      console.warn('[SW] Background sync registration failed:', error);
    }
  }
}

async function processBackgroundSync() {
  console.log('[SW] Processing background sync');

  const cache = await caches.open(SYNC_QUEUE);
  const requests = await cache.keys();

  for (const request of requests) {
    try {
      const response = await cache.match(request);
      const data = await response.json();

      // Attempt to send the queued request
      const result = await fetch(data.url, {
        method: data.method,
        headers: data.headers,
        body: data.body
      });

      if (result.ok) {
        // Remove from queue on success
        await cache.delete(request);
        console.log('[SW] Sync completed for:', data.url);
      }
    } catch (error) {
      console.warn('[SW] Sync failed for request:', error);
      // Keep in queue for next sync attempt
    }
  }
}

/**
 * Cache Management Functions
 */

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = {
      entries: keys.length,
      urls: keys.map(key => key.url)
    };
  }

  return status;
}

async function clearSpecificCache(cacheName) {
  return await caches.delete(cacheName);
}

async function preloadContent(urls) {
  const cache = await caches.open(RUNTIME_CACHE);

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn('[SW] Failed to preload:', url, error);
    }
  }
}

async function notifyClientsReady() {
  const clients = await self.clients.matchAll();

  clients.forEach(client => {
    client.postMessage({
      type: 'SW_READY',
      payload: { version: CACHE_NAME }
    });
  });
}

/**
 * Performance Optimization
 */

// Implement request deduplication
const pendingRequests = new Map();

async function deduplicateRequest(request) {
  const key = `${request.method}:${request.url}`;

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = fetch(request);
  pendingRequests.set(key, promise);

  // Clean up after request completes
  promise.finally(() => {
    pendingRequests.delete(key);
  });

  return promise;
}

// Implement intelligent preloading with user behavior analysis
async function intelligentPreload() {
  // Get user behavior patterns from IndexedDB
  const userPatterns = await getUserBehaviorPatterns();

  // Preload resources based on user behavior
  const criticalResources = [
    '/3d_viewer.html',
    '/ar_viewer.html',
    '/charts.js',
    '/mobile_gestures.js',
    '/enhanced_3d_anatomy.js'
  ];

  // Add frequently accessed resources based on user patterns
  if (userPatterns.frequently3D) {
    criticalResources.push('/3d_models.js', '/zoom_viewer.js');
  }

  if (userPatterns.frequentlyAR) {
    criticalResources.push('/ar_viewer.html', '/mobile_ar_handler.js');
  }

  for (const resource of criticalResources) {
    try {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(resource);

      if (!cached) {
        const response = await fetch(resource);
        if (response.ok) {
          await cache.put(resource, response);
        }
      }
    } catch (error) {
      console.warn('[SW] Preload failed for:', resource);
    }
  }
}

// Advanced user behavior analysis
async function getUserBehaviorPatterns() {
  return new Promise((resolve) => {
    const request = indexedDB.open('LipsAestheticsDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('userBehavior')) {
        db.createObjectStore('userBehavior');
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['userBehavior'], 'readonly');
      const store = transaction.objectStore('userBehavior');
      const getRequest = store.get('patterns');

      getRequest.onsuccess = () => {
        resolve(getRequest.result || {
          frequently3D: false,
          frequentlyAR: false,
          preferredView: 'gallery',
          averageSessionTime: 0
        });
      };

      getRequest.onerror = () => {
        resolve({
          frequently3D: false,
          frequentlyAR: false,
          preferredView: 'gallery',
          averageSessionTime: 0
        });
      };
    };

    request.onerror = () => {
      resolve({
        frequently3D: false,
        frequentlyAR: false,
        preferredView: 'gallery',
        averageSessionTime: 0
      });
    };
  });
}

// Predictive caching based on user patterns
async function predictiveCaching() {
  const patterns = await getUserBehaviorPatterns();
  const cache = await caches.open(RUNTIME_CACHE);

  // Preload next likely resources
  const timeOfDay = new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());

  let predictedResources = [];

  // Time-based predictions
  if (timeOfDay >= 9 && timeOfDay <= 17) {
    // Business hours - professional content
    predictedResources.push('/admin.html', '/case_analytics.js');
  } else {
    // After hours - browsing content
    predictedResources.push('/gallery.html', '/zoom_viewer.js');
  }

  // Pattern-based predictions
  if (patterns.frequently3D) {
    predictedResources.push('/3d_viewer.html', '/enhanced_3d_anatomy.js');
  }

  if (patterns.frequentlyAR) {
    predictedResources.push('/ar_viewer.html');
  }

  // Preload predicted resources
  for (const resource of predictedResources) {
    try {
      const cached = await cache.match(resource);
      if (!cached) {
        const response = await fetch(resource);
        if (response.ok) {
          await cache.put(resource, response);
        }
      }
    } catch (error) {
      console.warn('[SW] Predictive cache failed for:', resource);
    }
  }
}

// Schedule intelligent preload on idle
self.addEventListener('message', event => {
  if (event.data.type === 'IDLE_DETECTED') {
    intelligentPreload();
    predictiveCaching();
    optimizeImageCache();
  }
});

// Advanced image optimization
async function optimizeImageCache() {
  const imageCache = await caches.open(IMAGE_CACHE);
  const requests = await imageCache.keys();

  for (const request of requests) {
    try {
      const response = await imageCache.match(request);
      const blob = await response.blob();

      // Skip if already optimized
      if (request.url.includes('optimized=true')) continue;

      // Optimize image if it's large
      if (blob.size > 500000) { // 500KB threshold
        const optimizedBlob = await optimizeImage(blob);
        const optimizedResponse = new Response(optimizedBlob, {
          headers: {
            'Content-Type': blob.type,
            'Cache-Control': 'public, max-age=31536000'
          }
        });

        // Create optimized URL
        const optimizedUrl = `${request.url}${request.url.includes('?') ? '&' : '?'}optimized=true`;
        await imageCache.put(optimizedUrl, optimizedResponse);
      }
    } catch (error) {
      console.warn('[SW] Image optimization failed:', error);
    }
  }
}

// Image optimization using Canvas API
async function optimizeImage(blob) {
  return new Promise((resolve) => {
    const canvas = new OffscreenCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      // Calculate optimal dimensions
      let { width, height } = img;
      const maxWidth = 800;
      const maxHeight = 600;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw optimized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to optimized blob
      canvas.convertToBlob({
        type: 'image/webp',
        quality: 0.8
      }).then(resolve).catch(() => {
        // Fallback to JPEG if WebP fails
        canvas.convertToBlob({
          type: 'image/jpeg',
          quality: 0.8
        }).then(resolve);
      });
    };

    img.src = URL.createObjectURL(blob);
  });
}

// Performance monitoring
class ServiceWorkerPerformanceMonitor {
  constructor() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      networkRequests: 0,
      offlineRequests: 0,
      averageResponseTime: 0,
      errorCount: 0,
      lastUpdated: Date.now()
    };
    this.loadMetrics();
  }

  async loadMetrics() {
    try {
      const cache = await caches.open('performance-metrics');
      const response = await cache.match('/metrics');
      if (response) {
        const data = await response.json();
        this.metrics = { ...this.metrics, ...data };
      }
    } catch (error) {
      console.warn('[SW] Failed to load metrics:', error);
    }
  }

  async saveMetrics() {
    try {
      const cache = await caches.open('performance-metrics');
      const response = new Response(JSON.stringify(this.metrics), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put('/metrics', response);
    } catch (error) {
      console.warn('[SW] Failed to save metrics:', error);
    }
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
    this.saveMetrics();
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
    this.saveMetrics();
  }

  recordNetworkRequest(responseTime) {
    this.metrics.networkRequests++;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime + responseTime) / 2;
    this.saveMetrics();
  }

  recordOfflineRequest() {
    this.metrics.offlineRequests++;
    this.saveMetrics();
  }

  recordError() {
    this.metrics.errorCount++;
    this.saveMetrics();
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRatio: this.metrics.cacheHits /
        (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      totalRequests: this.metrics.cacheHits + this.metrics.cacheMisses
    };
  }
}

const performanceMonitor = new ServiceWorkerPerformanceMonitor();

// Battery optimization system
class BatteryOptimizer {
  constructor() {
    this.isLowPowerMode = false;
    this.batteryLevel = 1.0;
    this.isCharging = true;
    this.initBatteryAPI();
  }

  async initBatteryAPI() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.batteryLevel = battery.level;
        this.isCharging = battery.charging;

        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          this.checkBatteryOptimization();
        });

        battery.addEventListener('chargingchange', () => {
          this.isCharging = battery.charging;
          this.checkBatteryOptimization();
        });

        this.checkBatteryOptimization();
      } catch (error) {
        console.warn('[SW] Battery API not available:', error);
      }
    }
  }

  checkBatteryOptimization() {
    const shouldOptimize = this.batteryLevel < 0.2 && !this.isCharging;

    if (shouldOptimize && !this.isLowPowerMode) {
      this.enableLowPowerMode();
    } else if (!shouldOptimize && this.isLowPowerMode) {
      this.disableLowPowerMode();
    }
  }

  enableLowPowerMode() {
    this.isLowPowerMode = true;
    console.log('[SW] Low power mode enabled');
    this.notifyClients('LOW_POWER_MODE_ENABLED');
  }

  disableLowPowerMode() {
    this.isLowPowerMode = false;
    console.log('[SW] Low power mode disabled');
    this.notifyClients('LOW_POWER_MODE_DISABLED');
  }

  async notifyClients(type) {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type,
        payload: {
          batteryLevel: this.batteryLevel,
          isCharging: this.isCharging,
          isLowPowerMode: this.isLowPowerMode
        }
      });
    });
  }

  shouldReduceQuality() {
    return this.isLowPowerMode;
  }

  shouldSkipNonCriticalTasks() {
    return this.batteryLevel < 0.15;
  }
}

// Advanced request interceptor with battery awareness
class IntelligentRequestInterceptor {
  constructor(batteryOptimizer) {
    this.batteryOptimizer = batteryOptimizer;
    this.requestQueue = new Map();
    this.priorityQueue = [];
  }

  async handleRequest(request) {
    const priority = this.getRequestPriority(request);

    // Skip non-critical requests in low power mode
    if (this.batteryOptimizer.shouldSkipNonCriticalTasks() && priority < 3) {
      return this.getLowPowerFallback(request);
    }

    // Use different strategies based on request type and battery
    if (this.isImageRequest(request)) {
      return this.handleImageRequestIntelligently(request);
    }

    if (this.isWebGLRequest(request)) {
      return this.handleWebGLRequestIntelligently(request);
    }

    if (this.isAPIRequest(request)) {
      return this.handleAPIRequestIntelligently(request);
    }

    return this.handleGenericRequest(request);
  }

  getRequestPriority(request) {
    const url = new URL(request.url);

    // Critical app shell resources
    if (CRITICAL_RESOURCES.some(resource => url.pathname.includes(resource))) {
      return 5;
    }

    // Essential functionality
    if (url.pathname.includes('mobile_') || url.pathname.includes('gallery')) {
      return 4;
    }

    // 3D and AR features
    if (url.pathname.includes('3d') || url.pathname.includes('ar')) {
      return 3;
    }

    // Images and media
    if (this.isImageRequest(request)) {
      return 2;
    }

    // Non-essential
    return 1;
  }

  async handleImageRequestIntelligently(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // In low power mode, serve lower quality images
    if (this.batteryOptimizer.shouldReduceQuality()) {
      const lowQualityUrl = this.getLowQualityImageUrl(request.url);
      try {
        const response = await fetch(lowQualityUrl);
        if (response.ok) {
          const cache = await caches.open(IMAGE_CACHE);
          cache.put(request, response.clone());
          return response;
        }
      } catch (error) {
        console.warn('[SW] Low quality image failed, using fallback');
      }
    }

    return this.handleGenericRequest(request);
  }

  async handleWebGLRequestIntelligently(request) {
    // Skip WebGL resources in extreme low power mode
    if (this.batteryOptimizer.batteryLevel < 0.1) {
      return this.getWebGLFallback();
    }

    const cache = await caches.open(WEBGL_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return this.getWebGLFallback();
    }
  }

  async handleAPIRequestIntelligently(request) {
    // Always try network first for API requests
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(API_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      // Fall back to cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Queue for background sync
      await this.queueForBackgroundSync(request);

      return new Response(JSON.stringify({
        error: 'Offline',
        queued: true,
        message: 'Request queued for when connection is restored'
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async handleGenericRequest(request) {
    // Use appropriate caching strategy
    return networkFirst(request);
  }

  getLowQualityImageUrl(originalUrl) {
    // Convert to lower quality version
    const url = new URL(originalUrl);
    url.searchParams.set('quality', '60');
    url.searchParams.set('format', 'webp');
    return url.toString();
  }

  getLowPowerFallback(request) {
    return new Response('Low power mode - resource skipped', {
      status: 204,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  getWebGLFallback() {
    const fallbackScript = `
      console.warn('[SW] WebGL resources unavailable in low power mode');
      window.webglFallbackMode = true;
    `;

    return new Response(fallbackScript, {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  isImageRequest(request) {
    return request.destination === 'image' ||
           /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(new URL(request.url).pathname);
  }

  isWebGLRequest(request) {
    const url = new URL(request.url);
    return WEBGL_RESOURCES.some(resource => url.pathname.includes(resource)) ||
           url.pathname.includes('shader') || url.pathname.includes('3d');
  }

  isAPIRequest(request) {
    return request.url.includes('/api/') || request.url.includes('.json');
  }

  async queueForBackgroundSync(request) {
    await addToSyncQueue({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    });
    await registerBackgroundSync();
  }
}

// Initialize advanced systems
const batteryOptimizer = new BatteryOptimizer();
const requestInterceptor = new IntelligentRequestInterceptor(batteryOptimizer);

// Enhanced initialization functions
async function initializePerformanceMonitoring() {
  const cache = await caches.open('performance-metrics');
  // Initialize performance tracking
  console.log('[SW] Performance monitoring initialized');
}

async function initializeBatteryOptimization() {
  const cache = await caches.open('battery-optimization');
  // Initialize battery optimization settings
  console.log('[SW] Battery optimization initialized');
}

async function setupIntelligentPrefetch() {
  // Set up intelligent prefetching based on user patterns
  setTimeout(() => {
    if (!batteryOptimizer.shouldSkipNonCriticalTasks()) {
      intelligentPreload();
    }
  }, 10000); // Wait 10 seconds before starting prefetch
}

async function cleanExpiredCacheEntries() {
  const caches = await self.caches.keys();

  for (const cacheName of caches) {
    const cache = await self.caches.open(cacheName);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      const dateHeader = response.headers.get('date');

      if (dateHeader) {
        const age = Date.now() - new Date(dateHeader).getTime();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (age > maxAge) {
          await cache.delete(request);
        }
      }
    }
  }
}

console.log('[SW] Advanced Service Worker loaded with battery optimization and intelligent caching');