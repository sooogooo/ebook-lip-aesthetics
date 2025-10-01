/**
 * Service Worker for 绛唇解语花 Visualization System
 * 为可视化系统提供离线支持和缓存管理
 */

const CACHE_NAME = 'visualization-hub-v1.0.0';
const STATIC_CACHE_NAME = 'static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'dynamic-v1.0.0';

// 需要缓存的核心文件
const CORE_FILES = [
  './visualization_hub.html',
  './unified_styles.css',
  './integration.js',
  './manifest.json'
];

// 需要缓存的工具页面
const TOOL_FILES = [
  './3d_viewer.html',
  './ar_viewer.html',
  './vr_viewer.html',
  './gallery.html',
  './zoom_viewer.html',
  './charts_library.html',
  './anatomy_illustrations.html',
  './icons.html',
  './admin.html',
  './medical_dashboard.html',
  './case_study_visualizer.html'
];

// 需要缓存的资源文件
const RESOURCE_FILES = [
  './gallery.css',
  './gallery.js',
  './charts.css',
  './charts.js',
  './zoom_viewer.css',
  './zoom_viewer.js',
  './icons.css'
];

// 所有需要预缓存的文件
const PRECACHE_FILES = [
  ...CORE_FILES,
  ...TOOL_FILES,
  ...RESOURCE_FILES
];

// 安装事件 - 预缓存核心文件
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('[SW] Precaching core files');
        return cache.addAll(CORE_FILES);
      }),
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        console.log('[SW] Precaching tool files');
        return cache.addAll(TOOL_FILES.concat(RESOURCE_FILES));
      })
    ]).then(() => {
      console.log('[SW] Service worker installed successfully');
      return self.skipWaiting();
    }).catch(error => {
      console.error('[SW] Failed to install service worker:', error);
    })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated successfully');
      return self.clients.claim();
    })
  );
});

// 获取事件 - 处理网络请求
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 不缓存 POST 请求
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    handleFetch(request)
  );
});

/**
 * 处理网络请求的策略
 */
async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // 对于核心文件，使用缓存优先策略
    if (CORE_FILES.some(file => pathname.includes(file.replace('./', '')))) {
      return await cacheFirst(request, STATIC_CACHE_NAME);
    }

    // 对于工具文件，使用缓存优先策略
    if (TOOL_FILES.some(file => pathname.includes(file.replace('./', ''))) ||
        RESOURCE_FILES.some(file => pathname.includes(file.replace('./', '')))) {
      return await cacheFirst(request, DYNAMIC_CACHE_NAME);
    }

    // 对于图片和其他静态资源，使用缓存优先策略
    if (isStaticResource(pathname)) {
      return await cacheFirst(request, DYNAMIC_CACHE_NAME);
    }

    // 对于其他请求，使用网络优先策略
    return await networkFirst(request, DYNAMIC_CACHE_NAME);

  } catch (error) {
    console.error('[SW] Error handling fetch:', error);

    // 返回离线页面或默认响应
    if (pathname.endsWith('.html')) {
      const offlineResponse = await getOfflineResponse();
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    throw error;
  }
}

/**
 * 缓存优先策略
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }

  console.log('[SW] Fetching from network:', request.url);
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

/**
 * 网络优先策略
 */
async function networkFirst(request, cacheName) {
  try {
    console.log('[SW] Trying network first:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

/**
 * 判断是否为静态资源
 */
function isStaticResource(pathname) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.ico', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * 获取离线响应页面
 */
async function getOfflineResponse() {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    return await cache.match('./visualization_hub.html');
  } catch (error) {
    console.error('[SW] Failed to get offline response:', error);
    return null;
  }
}

// 消息处理 - 与主线程通信
self.addEventListener('message', event => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({
        version: CACHE_NAME
      });
      break;

    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch(error => {
        event.ports[0].postMessage({
          success: false,
          error: error.message
        });
      });
      break;

    case 'CACHE_URLS':
      if (payload && payload.urls) {
        cacheUrls(payload.urls).then(() => {
          event.ports[0].postMessage({ success: true });
        }).catch(error => {
          event.ports[0].postMessage({
            success: false,
            error: error.message
          });
        });
      }
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * 清理所有缓存
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('[SW] All caches cleared');
}

/**
 * 缓存指定的URL列表
 */
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  await cache.addAll(urls);
  console.log('[SW] URLs cached:', urls);
}

// 同步事件 - 后台同步
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);

  switch (event.tag) {
    case 'background-sync':
      event.waitUntil(doBackgroundSync());
      break;

    case 'cache-update':
      event.waitUntil(updateCaches());
      break;
  }
});

/**
 * 执行后台同步
 */
async function doBackgroundSync() {
  try {
    // 这里可以执行需要在后台同步的任务
    // 比如上传离线时产生的数据
    console.log('[SW] Performing background sync...');

    // 发送消息给主线程，通知同步完成
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        payload: { success: true }
      });
    });

  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

/**
 * 更新缓存
 */
async function updateCaches() {
  try {
    console.log('[SW] Updating caches...');

    const cache = await caches.open(STATIC_CACHE_NAME);
    await cache.addAll(CORE_FILES);

    console.log('[SW] Caches updated successfully');
  } catch (error) {
    console.error('[SW] Failed to update caches:', error);
  }
}

// 推送事件处理（如果需要推送通知功能）
self.addEventListener('push', event => {
  if (!event.data) {
    return;
  }

  const options = {
    title: '绛唇解语花',
    body: event.data.text(),
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" fill="%23E91E63"%3E%3Cpath d="M96 16C43.2 16 0 59.2 0 112s43.2 96 96 96 96-43.2 96-96S148.8 16 96 16zm-16 120l-40-40 11.3-11.3L72 105.4l60.7-60.7L144 56l-64 64z"/%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="%23E91E63"%3E%3Cpath d="M48 8C21.6 8 0 29.6 0 56s21.6 48 48 48 48-21.6 48-48S74.4 8 48 8zm-8 60l-20-20 5.65-5.65L36 52.7l30.35-30.35L72 28l-32 32z"/%3E%3C/svg%3E',
    dir: 'ltr',
    lang: 'zh-CN',
    vibrate: [200, 100, 200],
    tag: 'visualization-hub',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('./visualization_hub.html')
  );
});

console.log('[SW] Service worker script loaded');