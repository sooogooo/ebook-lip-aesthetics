/**
 * PWA缓存管理器
 * PWA Cache Manager
 */

export class CacheManager {
    constructor(options = {}) {
        this.options = {
            cacheName: 'lips-aesthetics-v2',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
            maxEntries: 100,
            ...options
        };

        this.cacheNames = {
            static: `${this.options.cacheName}-static`,
            dynamic: `${this.options.cacheName}-dynamic`,
            images: `${this.options.cacheName}-images`,
            models: `${this.options.cacheName}-models`,
            api: `${this.options.cacheName}-api`
        };
    }

    /**
     * 预缓存资源
     */
    async precache(resources) {
        const cache = await caches.open(this.cacheNames.static);

        const results = await Promise.allSettled(
            resources.map(async (url) => {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response);
                        return { url, success: true };
                    }
                    return { url, success: false, error: 'Not found' };
                } catch (error) {
                    return { url, success: false, error: error.message };
                }
            })
        );

        const succeeded = results.filter(r => r.value?.success).length;
        console.log(`[CacheManager] Precached ${succeeded}/${resources.length} resources`);

        return results;
    }

    /**
     * 缓存优先策略
     */
    async cacheFirst(request, cacheName) {
        const cache = await caches.open(cacheName || this.cacheNames.static);
        const cached = await cache.match(request);

        if (cached) {
            // 检查是否过期
            const dateHeader = cached.headers.get('date');
            if (dateHeader) {
                const age = Date.now() - new Date(dateHeader).getTime();
                if (age > this.options.maxAge) {
                    // 后台更新
                    this.updateCache(request, cache);
                }
            }
            return cached;
        }

        return this.fetchAndCache(request, cache);
    }

    /**
     * 网络优先策略
     */
    async networkFirst(request, cacheName, timeout = 3000) {
        const cache = await caches.open(cacheName || this.cacheNames.dynamic);

        try {
            const response = await this.fetchWithTimeout(request, timeout);
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        } catch (error) {
            const cached = await cache.match(request);
            if (cached) {
                return cached;
            }
            throw error;
        }
    }

    /**
     * 过期重新验证策略
     */
    async staleWhileRevalidate(request, cacheName) {
        const cache = await caches.open(cacheName || this.cacheNames.dynamic);
        const cached = await cache.match(request);

        // 立即返回缓存，同时在后台更新
        const fetchPromise = fetch(request).then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        });

        return cached || fetchPromise;
    }

    /**
     * 仅缓存策略
     */
    async cacheOnly(request, cacheName) {
        const cache = await caches.open(cacheName || this.cacheNames.static);
        return cache.match(request);
    }

    /**
     * 仅网络策略
     */
    async networkOnly(request) {
        return fetch(request);
    }

    /**
     * 带超时的fetch
     */
    fetchWithTimeout(request, timeout) {
        return Promise.race([
            fetch(request),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), timeout)
            )
        ]);
    }

    /**
     * 获取并缓存
     */
    async fetchAndCache(request, cache) {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }

    /**
     * 后台更新缓存
     */
    async updateCache(request, cache) {
        try {
            const response = await fetch(request);
            if (response.ok) {
                await cache.put(request, response);
            }
        } catch (error) {
            console.warn('[CacheManager] Background update failed:', error);
        }
    }

    /**
     * 清理过期缓存
     */
    async cleanExpiredCache() {
        const cacheNamesList = Object.values(this.cacheNames);

        for (const cacheName of cacheNamesList) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();

            for (const request of requests) {
                const response = await cache.match(request);
                const dateHeader = response.headers.get('date');

                if (dateHeader) {
                    const age = Date.now() - new Date(dateHeader).getTime();
                    if (age > this.options.maxAge) {
                        await cache.delete(request);
                    }
                }
            }
        }
    }

    /**
     * 限制缓存条目数
     */
    async trimCache(cacheName, maxEntries = this.options.maxEntries) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        if (keys.length > maxEntries) {
            // 删除最旧的条目
            const toDelete = keys.slice(0, keys.length - maxEntries);
            await Promise.all(toDelete.map(key => cache.delete(key)));
        }
    }

    /**
     * 获取缓存大小
     */
    async getCacheSize() {
        const sizes = {};

        for (const [name, cacheName] of Object.entries(this.cacheNames)) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();

            let totalSize = 0;
            for (const key of keys) {
                const response = await cache.match(key);
                const blob = await response.blob();
                totalSize += blob.size;
            }

            sizes[name] = {
                entries: keys.length,
                size: totalSize,
                sizeFormatted: this.formatSize(totalSize)
            };
        }

        return sizes;
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 清除所有缓存
     */
    async clearAllCaches() {
        const cacheNamesList = Object.values(this.cacheNames);
        await Promise.all(cacheNamesList.map(name => caches.delete(name)));
        console.log('[CacheManager] All caches cleared');
    }

    /**
     * 清除特定缓存
     */
    async clearCache(type) {
        const cacheName = this.cacheNames[type];
        if (cacheName) {
            await caches.delete(cacheName);
            console.log(`[CacheManager] Cache "${type}" cleared`);
        }
    }
}

/**
 * 离线管理器
 */
export class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.listeners = [];
        this.pendingRequests = [];

        this.setupNetworkListeners();
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notifyListeners('online');
            this.syncPendingRequests();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notifyListeners('offline');
        });
    }

    /**
     * 添加网络状态监听器
     */
    onNetworkChange(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notifyListeners(status) {
        this.listeners.forEach(cb => cb(status));
    }

    /**
     * 添加待同步请求
     */
    addPendingRequest(request) {
        this.pendingRequests.push({
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: request.body,
            timestamp: Date.now()
        });

        // 保存到IndexedDB
        this.savePendingToStorage();
    }

    /**
     * 同步待处理请求
     */
    async syncPendingRequests() {
        if (!this.isOnline || this.pendingRequests.length === 0) return;

        const requests = [...this.pendingRequests];
        this.pendingRequests = [];

        for (const req of requests) {
            try {
                await fetch(req.url, {
                    method: req.method,
                    headers: req.headers,
                    body: req.body
                });
            } catch (error) {
                // 重新加入队列
                this.pendingRequests.push(req);
            }
        }

        this.savePendingToStorage();
    }

    /**
     * 保存待处理请求到存储
     */
    async savePendingToStorage() {
        try {
            localStorage.setItem('pendingRequests', JSON.stringify(this.pendingRequests));
        } catch (error) {
            console.warn('[OfflineManager] Failed to save pending requests:', error);
        }
    }

    /**
     * 从存储加载待处理请求
     */
    loadPendingFromStorage() {
        try {
            const saved = localStorage.getItem('pendingRequests');
            if (saved) {
                this.pendingRequests = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('[OfflineManager] Failed to load pending requests:', error);
        }
    }

    /**
     * 获取离线页面
     */
    getOfflineFallback() {
        return `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>离线模式 - 唇部美学电子书</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background: #f5f5f5;
                        text-align: center;
                        padding: 20px;
                    }
                    .offline-container {
                        max-width: 400px;
                    }
                    .offline-icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 16px;
                        color: #333;
                    }
                    p {
                        color: #666;
                        margin-bottom: 24px;
                    }
                    .retry-btn {
                        padding: 12px 24px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 16px;
                        cursor: pointer;
                    }
                    .retry-btn:hover {
                        background: #0056b3;
                    }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <div class="offline-icon">📱</div>
                    <h1>您当前处于离线状态</h1>
                    <p>请检查您的网络连接，然后重试。已缓存的内容仍然可以访问。</p>
                    <button class="retry-btn" onclick="location.reload()">重试</button>
                </div>
            </body>
            </html>
        `;
    }
}

/**
 * 更新管理器
 */
export class UpdateManager {
    constructor() {
        this.registration = null;
        this.updateCallbacks = [];
    }

    /**
     * 初始化更新管理器
     */
    async init() {
        if ('serviceWorker' in navigator) {
            this.registration = await navigator.serviceWorker.ready;

            // 监听更新
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.notifyUpdate();
                    }
                });
            });
        }
    }

    /**
     * 检查更新
     */
    async checkForUpdates() {
        if (this.registration) {
            await this.registration.update();
        }
    }

    /**
     * 添加更新回调
     */
    onUpdateAvailable(callback) {
        this.updateCallbacks.push(callback);
    }

    notifyUpdate() {
        this.updateCallbacks.forEach(cb => cb());
    }

    /**
     * 应用更新
     */
    applyUpdate() {
        if (this.registration && this.registration.waiting) {
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }
}

export default {
    CacheManager,
    OfflineManager,
    UpdateManager
};
