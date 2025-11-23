/**
 * 性能模块索引
 * Performance Modules Index
 */

// 从根目录导入现有模块
export { default as PerformanceMonitor } from '../../performance_monitor.js';

/**
 * 性能指标收集器
 */
export class PerformanceCollector {
    constructor() {
        this.metrics = {
            fcp: null,  // First Contentful Paint
            lcp: null,  // Largest Contentful Paint
            fid: null,  // First Input Delay
            cls: null,  // Cumulative Layout Shift
            ttfb: null  // Time to First Byte
        };
    }

    /**
     * 收集Web Vitals指标
     */
    collectWebVitals() {
        if ('performance' in window && 'PerformanceObserver' in window) {
            // LCP
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = lastEntry.startTime;
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // FID
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach((entry) => {
                    this.metrics.fid = entry.processingStart - entry.startTime;
                });
            }).observe({ entryTypes: ['first-input'] });

            // CLS
            let clsValue = 0;
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.metrics.cls = clsValue;
            }).observe({ entryTypes: ['layout-shift'] });
        }
    }

    /**
     * 获取当前指标
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * 报告性能数据
     */
    report() {
        console.table(this.metrics);
        return this.metrics;
    }
}

/**
 * 初始化性能监控
 */
export async function initPerformance() {
    console.log('[Performance] Initializing performance modules...');

    const collector = new PerformanceCollector();
    collector.collectWebVitals();

    const monitor = await import('../../performance_monitor.js');

    return {
        PerformanceMonitor: monitor.default,
        PerformanceCollector: collector
    };
}

export default { initPerformance, PerformanceCollector };
