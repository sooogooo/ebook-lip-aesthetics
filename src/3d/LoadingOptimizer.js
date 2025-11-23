/**
 * 3D资源加载优化器
 * 3D Resource Loading Optimizer
 */

export class LoadingOptimizer {
    constructor(options = {}) {
        this.options = {
            maxConcurrentLoads: 3,
            priorityLevels: 3,
            enablePrefetch: true,
            cacheStrategy: 'memory-first',
            ...options
        };

        this.loadQueue = {
            high: [],
            medium: [],
            low: []
        };

        this.activeLoads = 0;
        this.cache = new Map();
        this.loadedAssets = new Set();
        this.listeners = new Map();
    }

    /**
     * 添加资源到加载队列
     */
    enqueue(resource) {
        const priority = resource.priority || 'medium';
        const queueItem = {
            id: resource.id || resource.url,
            url: resource.url,
            type: resource.type || 'model',
            priority,
            size: resource.size || 0,
            callback: resource.callback || null,
            retries: 0,
            maxRetries: resource.maxRetries || 3
        };

        this.loadQueue[priority].push(queueItem);
        this.processQueue();

        return queueItem.id;
    }

    /**
     * 批量添加资源
     */
    enqueueMany(resources) {
        return resources.map(r => this.enqueue(r));
    }

    /**
     * 处理加载队列
     */
    processQueue() {
        while (this.activeLoads < this.options.maxConcurrentLoads) {
            const item = this.getNextItem();
            if (!item) break;

            this.loadItem(item);
        }
    }

    getNextItem() {
        // 按优先级获取
        for (const priority of ['high', 'medium', 'low']) {
            if (this.loadQueue[priority].length > 0) {
                return this.loadQueue[priority].shift();
            }
        }
        return null;
    }

    async loadItem(item) {
        this.activeLoads++;
        this.emit('loadStart', item);

        try {
            // 检查缓存
            if (this.cache.has(item.url)) {
                const cached = this.cache.get(item.url);
                this.onLoadComplete(item, cached);
                return;
            }

            // 加载资源
            const data = await this.fetchResource(item);

            // 缓存
            this.cache.set(item.url, data);
            this.loadedAssets.add(item.id);

            this.onLoadComplete(item, data);

        } catch (error) {
            this.onLoadError(item, error);
        }
    }

    async fetchResource(item) {
        const startTime = performance.now();

        const response = await fetch(item.url, {
            priority: item.priority === 'high' ? 'high' : 'auto'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        let data;
        switch (item.type) {
            case 'model':
            case 'json':
                data = await response.json();
                break;
            case 'texture':
            case 'image':
                const blob = await response.blob();
                data = await this.loadImage(blob);
                break;
            case 'binary':
                data = await response.arrayBuffer();
                break;
            default:
                data = await response.text();
        }

        const loadTime = performance.now() - startTime;
        console.log(`[LoadingOptimizer] Loaded ${item.id} in ${loadTime.toFixed(0)}ms`);

        return data;
    }

    loadImage(blob) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                resolve(img);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }

    onLoadComplete(item, data) {
        this.activeLoads--;

        if (item.callback) {
            item.callback(null, data);
        }

        this.emit('loadComplete', { item, data });
        this.processQueue();
    }

    onLoadError(item, error) {
        this.activeLoads--;

        if (item.retries < item.maxRetries) {
            item.retries++;
            console.warn(`[LoadingOptimizer] Retry ${item.retries}/${item.maxRetries} for ${item.id}`);
            this.loadQueue[item.priority].unshift(item);
        } else {
            console.error(`[LoadingOptimizer] Failed to load ${item.id}:`, error);

            if (item.callback) {
                item.callback(error, null);
            }

            this.emit('loadError', { item, error });
        }

        this.processQueue();
    }

    /**
     * 预取资源
     */
    prefetch(urls) {
        if (!this.options.enablePrefetch) return;

        urls.forEach(url => {
            // 使用 fetch 预加载
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        });
    }

    /**
     * 预连接到域
     */
    preconnect(origins) {
        origins.forEach(origin => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = origin;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    /**
     * 获取加载进度
     */
    getProgress() {
        const total = this.loadQueue.high.length +
                     this.loadQueue.medium.length +
                     this.loadQueue.low.length +
                     this.activeLoads +
                     this.loadedAssets.size;

        const loaded = this.loadedAssets.size;

        return {
            loaded,
            total,
            percentage: total > 0 ? (loaded / total) * 100 : 100,
            active: this.activeLoads
        };
    }

    /**
     * 清除指定优先级的队列
     */
    clearQueue(priority = null) {
        if (priority) {
            this.loadQueue[priority] = [];
        } else {
            this.loadQueue.high = [];
            this.loadQueue.medium = [];
            this.loadQueue.low = [];
        }
    }

    /**
     * 事件系统
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    /**
     * 清理
     */
    dispose() {
        this.clearQueue();
        this.cache.clear();
        this.loadedAssets.clear();
        this.listeners.clear();
    }
}

/**
 * 首屏加载策略
 */
export class FirstLoadStrategy {
    constructor() {
        this.criticalResources = [];
        this.deferredResources = [];
    }

    /**
     * 定义关键资源
     */
    setCriticalResources(resources) {
        this.criticalResources = resources.map(r => ({
            ...r,
            priority: 'high'
        }));
    }

    /**
     * 定义延迟加载资源
     */
    setDeferredResources(resources) {
        this.deferredResources = resources.map(r => ({
            ...r,
            priority: 'low'
        }));
    }

    /**
     * 获取首屏加载清单
     */
    getInitialLoadManifest() {
        return {
            critical: this.criticalResources,
            deferred: this.deferredResources,

            // 加载策略建议
            strategy: {
                preconnectOrigins: this.extractOrigins(this.criticalResources),
                prefetchUrls: this.deferredResources.map(r => r.url),
                inlineThreshold: 4096, // 内联小于4KB的资源
                compressionRequired: true
            }
        };
    }

    extractOrigins(resources) {
        const origins = new Set();
        resources.forEach(r => {
            try {
                const url = new URL(r.url, window.location.origin);
                origins.add(url.origin);
            } catch (e) {
                // 相对URL
            }
        });
        return Array.from(origins);
    }

    /**
     * 生成预加载HTML
     */
    generatePreloadHTML() {
        let html = '';

        // Preconnect
        this.extractOrigins(this.criticalResources).forEach(origin => {
            html += `<link rel="preconnect" href="${origin}" crossorigin>\n`;
        });

        // Preload critical resources
        this.criticalResources.forEach(resource => {
            const as = resource.type === 'model' ? 'fetch' : resource.type;
            html += `<link rel="preload" href="${resource.url}" as="${as}">\n`;
        });

        // Prefetch deferred resources
        this.deferredResources.forEach(resource => {
            html += `<link rel="prefetch" href="${resource.url}">\n`;
        });

        return html;
    }
}

/**
 * 带宽自适应加载器
 */
export class AdaptiveLoader {
    constructor() {
        this.bandwidth = this.estimateBandwidth();
        this.connectionType = this.getConnectionType();
    }

    estimateBandwidth() {
        // 使用 Network Information API
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return conn.downlink || 10; // Mbps
        }
        return 10; // 默认假设10Mbps
    }

    getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || '4g';
        }
        return '4g';
    }

    /**
     * 根据网络状况选择资源版本
     */
    selectResourceVariant(variants) {
        // variants: { high: url, medium: url, low: url }

        if (this.connectionType === 'slow-2g' || this.connectionType === '2g') {
            return variants.low || variants.medium || variants.high;
        }

        if (this.connectionType === '3g' || this.bandwidth < 5) {
            return variants.medium || variants.low || variants.high;
        }

        return variants.high || variants.medium || variants.low;
    }

    /**
     * 计算最优并发数
     */
    getOptimalConcurrency() {
        if (this.bandwidth >= 50) return 6;
        if (this.bandwidth >= 10) return 4;
        if (this.bandwidth >= 5) return 3;
        return 2;
    }

    /**
     * 监听网络变化
     */
    onNetworkChange(callback) {
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.bandwidth = this.estimateBandwidth();
                this.connectionType = this.getConnectionType();
                callback({
                    bandwidth: this.bandwidth,
                    connectionType: this.connectionType
                });
            });
        }
    }
}

export default {
    LoadingOptimizer,
    FirstLoadStrategy,
    AdaptiveLoader
};
