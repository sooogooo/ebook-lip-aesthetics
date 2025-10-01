/**
 * Performance Monitoring and Analytics Module
 * Tracks Core Web Vitals and custom performance metrics
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            FCP: null,  // First Contentful Paint
            LCP: null,  // Largest Contentful Paint
            FID: null,  // First Input Delay
            CLS: 0,     // Cumulative Layout Shift
            TTFB: null, // Time to First Byte
            TTI: null,  // Time to Interactive
            TBT: 0,     // Total Blocking Time
            INP: null,  // Interaction to Next Paint
            customMetrics: new Map()
        };

        this.resourceTimings = [];
        this.userTimings = [];
        this.errorCount = 0;
        this.sessionStart = Date.now();

        this.init();
    }

    init() {
        // Check browser support
        if (!this.isSupported()) {
            console.warn('Performance API not fully supported');
            return;
        }

        // Start monitoring
        this.observeWebVitals();
        this.trackResourceLoading();
        this.trackJavaScriptErrors();
        this.trackMemoryUsage();
        this.trackNetworkSpeed();

        // Report metrics periodically
        this.startReporting();
    }

    isSupported() {
        return 'performance' in window &&
               'PerformanceObserver' in window &&
               'PerformanceNavigationTiming' in window;
    }

    observeWebVitals() {
        // First Contentful Paint (FCP)
        this.observePaintTiming('first-contentful-paint', timing => {
            this.metrics.FCP = Math.round(timing.startTime);
            console.log('FCP:', this.metrics.FCP + 'ms');
        });

        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver(list => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.LCP = Math.round(lastEntry.renderTime || lastEntry.loadTime);
                    console.log('LCP:', this.metrics.LCP + 'ms');
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('LCP observation not supported');
            }
        }

        // First Input Delay (FID)
        if ('PerformanceObserver' in window) {
            try {
                const fidObserver = new PerformanceObserver(list => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!this.metrics.FID) {
                            this.metrics.FID = Math.round(entry.processingStart - entry.startTime);
                            console.log('FID:', this.metrics.FID + 'ms');
                        }
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.warn('FID observation not supported');
            }
        }

        // Cumulative Layout Shift (CLS)
        if ('PerformanceObserver' in window) {
            try {
                const clsObserver = new PerformanceObserver(list => {
                    list.getEntries().forEach(entry => {
                        if (!entry.hadRecentInput) {
                            this.metrics.CLS += entry.value;
                            console.log('CLS:', this.metrics.CLS.toFixed(3));
                        }
                    });
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.warn('CLS observation not supported');
            }
        }

        // Time to First Byte (TTFB)
        this.measureTTFB();

        // Interaction to Next Paint (INP)
        this.measureINP();
    }

    observePaintTiming(entryName, callback) {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver(list => {
                    list.getEntries().forEach(entry => {
                        if (entry.name === entryName) {
                            callback(entry);
                        }
                    });
                });
                observer.observe({ entryTypes: ['paint'] });
            } catch (e) {
                // Fallback for browsers without paint timing
                this.useFallbackPaintTiming(entryName, callback);
            }
        }
    }

    useFallbackPaintTiming(entryName, callback) {
        // Fallback using performance.timing
        window.addEventListener('load', () => {
            const navTiming = performance.timing;
            if (navTiming.loadEventEnd && navTiming.fetchStart) {
                const timing = {
                    startTime: navTiming.loadEventEnd - navTiming.fetchStart
                };
                callback(timing);
            }
        });
    }

    measureTTFB() {
        // Use Navigation Timing API
        window.addEventListener('load', () => {
            if (performance.getEntriesByType) {
                const navEntries = performance.getEntriesByType('navigation');
                if (navEntries.length > 0) {
                    const navTiming = navEntries[0];
                    this.metrics.TTFB = Math.round(navTiming.responseStart - navTiming.fetchStart);
                    console.log('TTFB:', this.metrics.TTFB + 'ms');
                }
            } else if (performance.timing) {
                // Fallback for older browsers
                const timing = performance.timing;
                this.metrics.TTFB = timing.responseStart - timing.fetchStart;
                console.log('TTFB (fallback):', this.metrics.TTFB + 'ms');
            }
        });
    }

    measureINP() {
        if ('PerformanceObserver' in window) {
            try {
                let maxINP = 0;
                const inpObserver = new PerformanceObserver(list => {
                    list.getEntries().forEach(entry => {
                        if (entry.entryType === 'event' && entry.duration > maxINP) {
                            maxINP = entry.duration;
                            this.metrics.INP = Math.round(maxINP);
                            console.log('INP:', this.metrics.INP + 'ms');
                        }
                    });
                });
                inpObserver.observe({ entryTypes: ['event'] });
            } catch (e) {
                console.warn('INP observation not supported');
            }
        }
    }

    trackResourceLoading() {
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver(list => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'resource') {
                        this.resourceTimings.push({
                            name: entry.name,
                            type: entry.initiatorType,
                            duration: Math.round(entry.duration),
                            size: entry.transferSize || 0,
                            cached: entry.transferSize === 0
                        });

                        // Log slow resources
                        if (entry.duration > 1000) {
                            console.warn(`Slow resource: ${entry.name} took ${Math.round(entry.duration)}ms`);
                        }
                    }
                });
            });

            try {
                resourceObserver.observe({ entryTypes: ['resource'] });
            } catch (e) {
                console.warn('Resource timing observation not supported');
            }
        }
    }

    trackJavaScriptErrors() {
        let errorCount = 0;

        window.addEventListener('error', event => {
            this.errorCount++;
            console.error('JS Error:', event.error);

            // Track error details
            this.logError({
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack
            });
        });

        window.addEventListener('unhandledrejection', event => {
            this.errorCount++;
            console.error('Unhandled Promise Rejection:', event.reason);

            this.logError({
                type: 'unhandledRejection',
                reason: event.reason
            });
        });
    }

    trackMemoryUsage() {
        if (performance.memory) {
            setInterval(() => {
                const memoryInfo = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
                };

                this.metrics.customMetrics.set('memory', memoryInfo);

                // Warn if memory usage is high
                const usagePercent = (memoryInfo.used / memoryInfo.limit) * 100;
                if (usagePercent > 90) {
                    console.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);
                }
            }, 10000); // Check every 10 seconds
        }
    }

    trackNetworkSpeed() {
        if ('connection' in navigator && navigator.connection) {
            const connection = navigator.connection;

            const networkInfo = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };

            this.metrics.customMetrics.set('network', networkInfo);

            // Listen for network changes
            connection.addEventListener('change', () => {
                console.log('Network changed:', connection.effectiveType);
                this.trackNetworkSpeed();
            });
        }
    }

    // Custom performance marks and measures
    mark(name) {
        if (performance.mark) {
            performance.mark(name);
        }
    }

    measure(name, startMark, endMark) {
        if (performance.measure) {
            try {
                performance.measure(name, startMark, endMark);
                const measure = performance.getEntriesByName(name, 'measure')[0];
                if (measure) {
                    this.userTimings.push({
                        name: name,
                        duration: Math.round(measure.duration)
                    });
                    console.log(`Performance measure "${name}": ${Math.round(measure.duration)}ms`);
                }
            } catch (e) {
                console.error('Failed to measure:', e);
            }
        }
    }

    // Log custom metrics
    logMetric(name, value) {
        this.metrics.customMetrics.set(name, value);
        console.log(`Custom metric "${name}":`, value);
    }

    logError(error) {
        // Store error for reporting
        const errors = this.metrics.customMetrics.get('errors') || [];
        errors.push({
            ...error,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
        this.metrics.customMetrics.set('errors', errors);
    }

    // Get comprehensive performance report
    getReport() {
        const report = {
            timestamp: Date.now(),
            sessionDuration: Date.now() - this.sessionStart,
            url: window.location.href,
            userAgent: navigator.userAgent,

            // Core Web Vitals
            webVitals: {
                FCP: this.metrics.FCP,
                LCP: this.metrics.LCP,
                FID: this.metrics.FID,
                CLS: parseFloat(this.metrics.CLS.toFixed(3)),
                TTFB: this.metrics.TTFB,
                INP: this.metrics.INP
            },

            // Resource performance
            resources: {
                count: this.resourceTimings.length,
                totalSize: this.resourceTimings.reduce((sum, r) => sum + r.size, 0),
                avgDuration: this.resourceTimings.length > 0
                    ? Math.round(this.resourceTimings.reduce((sum, r) => sum + r.duration, 0) / this.resourceTimings.length)
                    : 0,
                slowest: this.resourceTimings.sort((a, b) => b.duration - a.duration).slice(0, 5)
            },

            // Custom metrics
            custom: Object.fromEntries(this.metrics.customMetrics),

            // User timings
            timings: this.userTimings,

            // Errors
            errorCount: this.errorCount,

            // Performance score (0-100)
            score: this.calculatePerformanceScore()
        };

        return report;
    }

    calculatePerformanceScore() {
        let score = 100;

        // Deduct points based on Web Vitals thresholds
        if (this.metrics.LCP) {
            if (this.metrics.LCP > 4000) score -= 30;
            else if (this.metrics.LCP > 2500) score -= 15;
        }

        if (this.metrics.FID) {
            if (this.metrics.FID > 300) score -= 20;
            else if (this.metrics.FID > 100) score -= 10;
        }

        if (this.metrics.CLS > 0.25) score -= 20;
        else if (this.metrics.CLS > 0.1) score -= 10;

        if (this.metrics.TTFB) {
            if (this.metrics.TTFB > 1800) score -= 10;
            else if (this.metrics.TTFB > 600) score -= 5;
        }

        // Deduct for errors
        score -= Math.min(this.errorCount * 5, 20);

        return Math.max(0, Math.min(100, score));
    }

    // Report to analytics endpoint
    sendReport(endpoint = '/api/analytics/performance') {
        const report = this.getReport();

        // Use sendBeacon for reliability
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(report)], { type: 'application/json' });
            navigator.sendBeacon(endpoint, blob);
        } else {
            // Fallback to fetch
            fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(report),
                headers: {
                    'Content-Type': 'application/json'
                },
                keepalive: true
            }).catch(console.error);
        }
    }

    startReporting(interval = 30000) {
        // Report metrics every 30 seconds
        setInterval(() => {
            const report = this.getReport();
            console.log('Performance Report:', report);

            // Send to analytics if score is concerning
            if (report.score < 70) {
                console.warn('Poor performance detected, score:', report.score);
                this.sendReport();
            }
        }, interval);

        // Send final report when page unloads
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.sendReport();
            }
        });
    }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    window.performanceMonitor = new PerformanceMonitor();

    // Expose useful methods globally
    window.perfMark = (name) => window.performanceMonitor.mark(name);
    window.perfMeasure = (name, start, end) => window.performanceMonitor.measure(name, start, end);
    window.perfLog = (name, value) => window.performanceMonitor.logMetric(name, value);
    window.getPerfReport = () => window.performanceMonitor.getReport();
}

export default PerformanceMonitor;