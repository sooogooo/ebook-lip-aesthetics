/**
 * 性能模块单元测试
 * Performance Module Unit Tests
 */

describe('PerformanceCollector', () => {
    // 模拟 PerformanceCollector 类
    class TestPerformanceCollector {
        constructor() {
            this.metrics = {
                fcp: null,
                lcp: null,
                fid: null,
                cls: null,
                ttfb: null
            };
        }

        getMetrics() {
            return { ...this.metrics };
        }

        setMetric(name, value) {
            if (name in this.metrics) {
                this.metrics[name] = value;
            }
        }

        report() {
            return this.metrics;
        }
    }

    let collector;

    beforeEach(() => {
        collector = new TestPerformanceCollector();
    });

    describe('指标初始化', () => {
        test('所有指标应初始化为 null', () => {
            const metrics = collector.getMetrics();
            expect(metrics.fcp).toBeNull();
            expect(metrics.lcp).toBeNull();
            expect(metrics.fid).toBeNull();
            expect(metrics.cls).toBeNull();
            expect(metrics.ttfb).toBeNull();
        });
    });

    describe('指标设置', () => {
        test('应能设置 LCP 指标', () => {
            collector.setMetric('lcp', 2500);
            expect(collector.getMetrics().lcp).toBe(2500);
        });

        test('应能设置 FID 指标', () => {
            collector.setMetric('fid', 100);
            expect(collector.getMetrics().fid).toBe(100);
        });

        test('应能设置 CLS 指标', () => {
            collector.setMetric('cls', 0.1);
            expect(collector.getMetrics().cls).toBe(0.1);
        });

        test('设置无效指标名应忽略', () => {
            collector.setMetric('invalid', 100);
            expect(collector.getMetrics().invalid).toBeUndefined();
        });
    });

    describe('指标报告', () => {
        test('report 应返回当前指标', () => {
            collector.setMetric('lcp', 2000);
            collector.setMetric('cls', 0.05);

            const report = collector.report();
            expect(report.lcp).toBe(2000);
            expect(report.cls).toBe(0.05);
        });

        test('getMetrics 应返回指标副本', () => {
            const metrics1 = collector.getMetrics();
            metrics1.lcp = 999;

            const metrics2 = collector.getMetrics();
            expect(metrics2.lcp).toBeNull();
        });
    });
});

describe('性能指标评估', () => {
    // 根据 Web Vitals 标准评估性能
    function evaluateMetric(name, value) {
        const thresholds = {
            lcp: { good: 2500, poor: 4000 },
            fid: { good: 100, poor: 300 },
            cls: { good: 0.1, poor: 0.25 },
            ttfb: { good: 800, poor: 1800 }
        };

        const threshold = thresholds[name];
        if (!threshold) return 'unknown';

        if (value <= threshold.good) return 'good';
        if (value <= threshold.poor) return 'needs-improvement';
        return 'poor';
    }

    describe('LCP 评估', () => {
        test('2000ms 应评为 good', () => {
            expect(evaluateMetric('lcp', 2000)).toBe('good');
        });

        test('3000ms 应评为 needs-improvement', () => {
            expect(evaluateMetric('lcp', 3000)).toBe('needs-improvement');
        });

        test('5000ms 应评为 poor', () => {
            expect(evaluateMetric('lcp', 5000)).toBe('poor');
        });
    });

    describe('FID 评估', () => {
        test('50ms 应评为 good', () => {
            expect(evaluateMetric('fid', 50)).toBe('good');
        });

        test('200ms 应评为 needs-improvement', () => {
            expect(evaluateMetric('fid', 200)).toBe('needs-improvement');
        });

        test('400ms 应评为 poor', () => {
            expect(evaluateMetric('fid', 400)).toBe('poor');
        });
    });

    describe('CLS 评估', () => {
        test('0.05 应评为 good', () => {
            expect(evaluateMetric('cls', 0.05)).toBe('good');
        });

        test('0.15 应评为 needs-improvement', () => {
            expect(evaluateMetric('cls', 0.15)).toBe('needs-improvement');
        });

        test('0.3 应评为 poor', () => {
            expect(evaluateMetric('cls', 0.3)).toBe('poor');
        });
    });
});
