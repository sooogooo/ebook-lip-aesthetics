/**
 * Service Worker 配置
 * Service Worker Configuration
 */

export const swConfig = {
    // 版本号
    version: '2.0.0',

    // 缓存名称
    cacheNames: {
        precache: 'lips-precache-v2',
        runtime: 'lips-runtime-v2',
        images: 'lips-images-v2',
        models: 'lips-models-v2',
        documents: 'lips-docs-v2'
    },

    // 预缓存资源 - 安装时立即缓存
    precacheResources: [
        // HTML页面
        '/',
        '/index.html',
        '/offline.html',

        // 核心CSS
        '/styles/main.css',
        '/styles/critical.css',

        // 核心JS
        '/src/index.js',
        '/src/i18n/index.js',

        // 字体
        '/fonts/inter-var.woff2',

        // 图标
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/favicon.ico'
    ],

    // 路由规则
    routes: [
        // HTML页面 - 网络优先
        {
            pattern: /\.html$/,
            strategy: 'networkFirst',
            options: {
                cacheName: 'lips-runtime-v2',
                networkTimeoutSeconds: 3
            }
        },

        // API调用 - 网络优先
        {
            pattern: /\/api\//,
            strategy: 'networkFirst',
            options: {
                cacheName: 'lips-runtime-v2',
                networkTimeoutSeconds: 5
            }
        },

        // Markdown内容 - 过期重验证
        {
            pattern: /\/content\/.*\.md$/,
            strategy: 'staleWhileRevalidate',
            options: {
                cacheName: 'lips-docs-v2'
            }
        },

        // 图片 - 缓存优先
        {
            pattern: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
            strategy: 'cacheFirst',
            options: {
                cacheName: 'lips-images-v2',
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
                maxEntries: 100
            }
        },

        // 3D模型 - 缓存优先
        {
            pattern: /\.(glb|gltf|obj|fbx)$/,
            strategy: 'cacheFirst',
            options: {
                cacheName: 'lips-models-v2',
                maxAgeSeconds: 30 * 24 * 60 * 60,
                maxEntries: 20
            }
        },

        // JSON数据 - 过期重验证
        {
            pattern: /\.json$/,
            strategy: 'staleWhileRevalidate',
            options: {
                cacheName: 'lips-runtime-v2'
            }
        },

        // CSS - 过期重验证
        {
            pattern: /\.css$/,
            strategy: 'staleWhileRevalidate',
            options: {
                cacheName: 'lips-runtime-v2'
            }
        },

        // JS - 缓存优先（带版本hash）
        {
            pattern: /\.js$/,
            strategy: 'cacheFirst',
            options: {
                cacheName: 'lips-runtime-v2',
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7天
            }
        },

        // 字体 - 缓存优先（长期）
        {
            pattern: /\.(woff|woff2|ttf|otf|eot)$/,
            strategy: 'cacheFirst',
            options: {
                cacheName: 'lips-runtime-v2',
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1年
            }
        }
    ],

    // 离线回退
    offlineFallbacks: {
        document: '/offline.html',
        image: '/images/offline-placeholder.png'
    },

    // 后台同步
    backgroundSync: {
        enabled: true,
        queueName: 'lips-sync-queue',
        maxRetentionTime: 24 * 60 // 24小时
    },

    // 推送通知
    pushNotifications: {
        enabled: true,
        vapidPublicKey: 'YOUR_VAPID_PUBLIC_KEY'
    },

    // 跳过等待
    skipWaiting: true,

    // 立即控制
    clientsClaim: true,

    // 调试模式
    debug: false
};

/**
 * 生成Service Worker代码
 */
export function generateServiceWorker(config = swConfig) {
    return `
// Auto-generated Service Worker
// Version: ${config.version}

const CACHE_NAMES = ${JSON.stringify(config.cacheNames)};
const PRECACHE_RESOURCES = ${JSON.stringify(config.precacheResources)};
const ROUTES = ${JSON.stringify(config.routes)};
const OFFLINE_FALLBACKS = ${JSON.stringify(config.offlineFallbacks)};

// Install event
self.addEventListener('install', event => {
    ${config.skipWaiting ? 'self.skipWaiting();' : ''}

    event.waitUntil(
        caches.open(CACHE_NAMES.precache)
            .then(cache => cache.addAll(PRECACHE_RESOURCES))
            .then(() => console.log('[SW] Precache complete'))
    );
});

// Activate event
self.addEventListener('activate', event => {
    ${config.clientsClaim ? 'self.clients.claim();' : ''}

    event.waitUntil(
        caches.keys().then(keys => {
            const validCaches = Object.values(CACHE_NAMES);
            return Promise.all(
                keys.filter(key => !validCaches.includes(key))
                    .map(key => caches.delete(key))
            );
        })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin
    if (url.origin !== location.origin) return;

    // Find matching route
    const route = findRoute(url.pathname);

    if (route) {
        event.respondWith(handleRoute(request, route));
    }
});

function findRoute(pathname) {
    return ROUTES.find(route => {
        const pattern = new RegExp(route.pattern);
        return pattern.test(pathname);
    });
}

async function handleRoute(request, route) {
    const cache = await caches.open(route.options.cacheName);

    try {
        switch (route.strategy) {
            case 'cacheFirst':
                return cacheFirst(request, cache, route.options);
            case 'networkFirst':
                return networkFirst(request, cache, route.options);
            case 'staleWhileRevalidate':
                return staleWhileRevalidate(request, cache);
            default:
                return fetch(request);
        }
    } catch (error) {
        return handleOffline(request);
    }
}

async function cacheFirst(request, cache, options) {
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
        cache.put(request, response.clone());
    }
    return response;
}

async function networkFirst(request, cache, options) {
    const timeout = (options.networkTimeoutSeconds || 3) * 1000;

    try {
        const response = await Promise.race([
            fetch(request),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), timeout)
            )
        ]);

        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw error;
    }
}

async function staleWhileRevalidate(request, cache) {
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    });

    return cached || fetchPromise;
}

async function handleOffline(request) {
    if (request.destination === 'document') {
        const cached = await caches.match(OFFLINE_FALLBACKS.document);
        if (cached) return cached;
    }

    if (request.destination === 'image') {
        const cached = await caches.match(OFFLINE_FALLBACKS.image);
        if (cached) return cached;
    }

    return new Response('Offline', { status: 503 });
}

// Background sync
self.addEventListener('sync', event => {
    if (event.tag === '${config.backgroundSync.queueName}') {
        event.waitUntil(syncPendingRequests());
    }
});

async function syncPendingRequests() {
    // Implement background sync logic
    console.log('[SW] Syncing pending requests');
}

// Push notifications
self.addEventListener('push', event => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        vibrate: [100, 50, 100],
        data: data.data
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.notification.data?.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// Message handling
self.addEventListener('message', event => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] Service Worker loaded - v${config.version}');
`;
}

export default {
    swConfig,
    generateServiceWorker
};
