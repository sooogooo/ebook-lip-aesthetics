#!/usr/bin/env node

/**
 * Performance Testing Suite
 * Runs comprehensive performance tests on the visualization system
 */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fs = require('fs').promises;
const path = require('path');

class PerformanceTester {
    constructor(baseUrl = 'http://localhost:8080') {
        this.baseUrl = baseUrl;
        this.results = {};
        this.browser = null;
        this.testPages = [
            { name: 'Visualization Hub', url: '/optimized_visualization_hub.html' },
            { name: '3D Viewer', url: '/optimized_3d_viewer.html' },
            { name: 'Gallery', url: '/optimized_gallery.html' },
            { name: 'Medical Dashboard', url: '/medical_dashboard.html' }
        ];
    }

    async init() {
        console.log('🚀 Starting Performance Testing Suite');
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        });
    }

    async runAllTests() {
        try {
            await this.init();

            // Run tests for each page
            for (const pageConfig of this.testPages) {
                console.log(`\n📊 Testing: ${pageConfig.name}`);
                console.log('━'.repeat(50));

                const pageResults = {
                    name: pageConfig.name,
                    url: this.baseUrl + pageConfig.url,
                    metrics: {}
                };

                // Run different test types
                pageResults.metrics.performance = await this.testPagePerformance(pageConfig.url);
                pageResults.metrics.lighthouse = await this.runLighthouse(pageConfig.url);
                pageResults.metrics.resources = await this.testResourceLoading(pageConfig.url);
                pageResults.metrics.memory = await this.testMemoryUsage(pageConfig.url);
                pageResults.metrics.animations = await this.testAnimationPerformance(pageConfig.url);

                this.results[pageConfig.name] = pageResults;
            }

            // Generate report
            await this.generateReport();

        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async testPagePerformance(url) {
        const page = await this.browser.newPage();
        const metrics = {};

        try {
            // Enable performance tracking
            await page.evaluateOnNewDocument(() => {
                window.__perf = {
                    marks: [],
                    measures: []
                };

                const originalMark = performance.mark;
                const originalMeasure = performance.measure;

                performance.mark = function(...args) {
                    window.__perf.marks.push({ name: args[0], time: performance.now() });
                    return originalMark.apply(performance, args);
                };

                performance.measure = function(...args) {
                    const result = originalMeasure.apply(performance, args);
                    const measure = performance.getEntriesByName(args[0], 'measure')[0];
                    if (measure) {
                        window.__perf.measures.push({
                            name: args[0],
                            duration: measure.duration
                        });
                    }
                    return result;
                };
            });

            // Navigate and wait for network idle
            const startTime = Date.now();
            await page.goto(this.baseUrl + url, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            const loadTime = Date.now() - startTime;

            // Collect performance metrics
            const perfData = await page.evaluate(() => {
                const timing = performance.timing;
                const paint = performance.getEntriesByType('paint');

                return {
                    // Navigation timing
                    dns: timing.domainLookupEnd - timing.domainLookupStart,
                    tcp: timing.connectEnd - timing.connectStart,
                    request: timing.responseEnd - timing.requestStart,
                    response: timing.responseEnd - timing.responseStart,
                    domParsing: timing.domInteractive - timing.domLoading,
                    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                    loadComplete: timing.loadEventEnd - timing.navigationStart,

                    // Paint timing
                    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,

                    // Custom metrics
                    customMarks: window.__perf?.marks || [],
                    customMeasures: window.__perf?.measures || []
                };
            });

            // Get Chrome DevTools metrics
            const cdpMetrics = await page.metrics();

            metrics.loadTime = loadTime;
            metrics.timing = perfData;
            metrics.heap = {
                used: Math.round(cdpMetrics.JSHeapUsedSize / 1048576),
                total: Math.round(cdpMetrics.JSHeapTotalSize / 1048576)
            };
            metrics.nodes = cdpMetrics.Nodes;
            metrics.listeners = cdpMetrics.JSEventListeners;

            console.log(`✅ Load Time: ${loadTime}ms`);
            console.log(`✅ FCP: ${Math.round(perfData.firstContentfulPaint)}ms`);
            console.log(`✅ DOM Nodes: ${cdpMetrics.Nodes}`);

        } catch (error) {
            console.error(`❌ Performance test failed: ${error.message}`);
            metrics.error = error.message;
        } finally {
            await page.close();
        }

        return metrics;
    }

    async runLighthouse(url) {
        console.log('🔍 Running Lighthouse audit...');

        try {
            const { lhr } = await lighthouse(this.baseUrl + url, {
                port: new URL(this.browser.wsEndpoint()).port,
                output: 'json',
                logLevel: 'error',
                onlyCategories: ['performance', 'accessibility', 'best-practices'],
                throttling: {
                    rttMs: 150,
                    throughputKbps: 1638.4,
                    cpuSlowdownMultiplier: 4
                }
            });

            const scores = {
                performance: Math.round(lhr.categories.performance.score * 100),
                accessibility: Math.round(lhr.categories.accessibility.score * 100),
                bestPractices: Math.round(lhr.categories['best-practices'].score * 100)
            };

            const metrics = {
                FCP: lhr.audits['first-contentful-paint'].numericValue,
                LCP: lhr.audits['largest-contentful-paint'].numericValue,
                TTI: lhr.audits['interactive'].numericValue,
                TBT: lhr.audits['total-blocking-time'].numericValue,
                CLS: lhr.audits['cumulative-layout-shift'].numericValue,
                SpeedIndex: lhr.audits['speed-index'].numericValue
            };

            console.log(`✅ Lighthouse Performance Score: ${scores.performance}/100`);
            console.log(`✅ LCP: ${Math.round(metrics.LCP)}ms`);
            console.log(`✅ CLS: ${metrics.CLS.toFixed(3)}`);

            return { scores, metrics, audits: lhr.audits };

        } catch (error) {
            console.error(`❌ Lighthouse test failed: ${error.message}`);
            return { error: error.message };
        }
    }

    async testResourceLoading(url) {
        const page = await this.browser.newPage();
        const resources = [];

        try {
            // Track all network requests
            page.on('response', response => {
                const request = response.request();
                const url = request.url();
                const resourceType = request.resourceType();

                resources.push({
                    url: url.substring(url.lastIndexOf('/') + 1),
                    type: resourceType,
                    status: response.status(),
                    size: response.headers()['content-length'] || 0,
                    timing: response.timing()
                });
            });

            await page.goto(this.baseUrl + url, { waitUntil: 'networkidle0' });

            // Analyze resources
            const analysis = {
                totalRequests: resources.length,
                totalSize: resources.reduce((sum, r) => sum + parseInt(r.size || 0), 0),
                byType: {},
                errors: resources.filter(r => r.status >= 400),
                slowRequests: []
            };

            // Group by type
            resources.forEach(resource => {
                if (!analysis.byType[resource.type]) {
                    analysis.byType[resource.type] = { count: 0, size: 0 };
                }
                analysis.byType[resource.type].count++;
                analysis.byType[resource.type].size += parseInt(resource.size || 0);

                // Check for slow requests
                if (resource.timing && resource.timing.receiveHeadersEnd > 1000) {
                    analysis.slowRequests.push({
                        url: resource.url,
                        time: Math.round(resource.timing.receiveHeadersEnd)
                    });
                }
            });

            console.log(`✅ Total Requests: ${analysis.totalRequests}`);
            console.log(`✅ Total Size: ${(analysis.totalSize / 1024).toFixed(2)} KB`);
            console.log(`✅ Errors: ${analysis.errors.length}`);

            return analysis;

        } catch (error) {
            console.error(`❌ Resource test failed: ${error.message}`);
            return { error: error.message };
        } finally {
            await page.close();
        }
    }

    async testMemoryUsage(url) {
        const page = await this.browser.newPage();
        const samples = [];

        try {
            await page.goto(this.baseUrl + url, { waitUntil: 'networkidle0' });

            // Take memory samples over time
            for (let i = 0; i < 5; i++) {
                const metrics = await page.metrics();
                samples.push({
                    timestamp: Date.now(),
                    heap: Math.round(metrics.JSHeapUsedSize / 1048576),
                    nodes: metrics.Nodes,
                    listeners: metrics.JSEventListeners
                });

                // Simulate user interaction
                await page.evaluate(() => {
                    window.scrollBy(0, 100);
                    document.body.click();
                });

                await page.waitForTimeout(1000);
            }

            // Check for memory leaks
            const heapGrowth = samples[samples.length - 1].heap - samples[0].heap;
            const nodeGrowth = samples[samples.length - 1].nodes - samples[0].nodes;

            const analysis = {
                initial: samples[0],
                final: samples[samples.length - 1],
                heapGrowth,
                nodeGrowth,
                possibleLeak: heapGrowth > 10 || nodeGrowth > 100
            };

            console.log(`✅ Heap Usage: ${samples[0].heap}MB → ${samples[samples.length - 1].heap}MB`);
            console.log(`✅ DOM Nodes: ${samples[0].nodes} → ${samples[samples.length - 1].nodes}`);
            if (analysis.possibleLeak) {
                console.log('⚠️  Possible memory leak detected');
            }

            return analysis;

        } catch (error) {
            console.error(`❌ Memory test failed: ${error.message}`);
            return { error: error.message };
        } finally {
            await page.close();
        }
    }

    async testAnimationPerformance(url) {
        const page = await this.browser.newPage();

        try {
            await page.goto(this.baseUrl + url, { waitUntil: 'networkidle0' });

            // Monitor animation frame rate
            const fps = await page.evaluate(() => {
                return new Promise(resolve => {
                    let frames = 0;
                    let startTime = performance.now();
                    const targetFrames = 60;

                    function measureFrame() {
                        frames++;
                        if (frames < targetFrames) {
                            requestAnimationFrame(measureFrame);
                        } else {
                            const duration = performance.now() - startTime;
                            const fps = Math.round((frames * 1000) / duration);
                            resolve(fps);
                        }
                    }

                    requestAnimationFrame(measureFrame);
                });
            });

            // Check for janky animations
            const jank = await page.evaluate(() => {
                return new Promise(resolve => {
                    const observer = new PerformanceObserver(list => {
                        const entries = list.getEntries();
                        const longTasks = entries.filter(e => e.duration > 50);
                        resolve({
                            count: longTasks.length,
                            totalDuration: longTasks.reduce((sum, t) => sum + t.duration, 0)
                        });
                    });

                    observer.observe({ entryTypes: ['longtask'] });

                    // Trigger some animations
                    setTimeout(() => {
                        observer.disconnect();
                    }, 3000);
                });
            });

            console.log(`✅ Animation FPS: ${fps}`);
            console.log(`✅ Long Tasks: ${jank.count || 0}`);

            return { fps, jank };

        } catch (error) {
            console.error(`❌ Animation test failed: ${error.message}`);
            return { error: error.message };
        } finally {
            await page.close();
        }
    }

    async generateReport() {
        console.log('\n' + '='.repeat(50));
        console.log('📈 PERFORMANCE TEST REPORT');
        console.log('='.repeat(50));

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalPages: this.testPages.length,
                averageLoadTime: 0,
                averageLighthouseScore: 0,
                issues: []
            },
            pages: this.results
        };

        // Calculate averages and find issues
        let totalLoadTime = 0;
        let totalLighthouseScore = 0;
        let validPages = 0;

        Object.values(this.results).forEach(page => {
            if (page.metrics.performance?.loadTime) {
                totalLoadTime += page.metrics.performance.loadTime;
                validPages++;
            }

            if (page.metrics.lighthouse?.scores?.performance) {
                totalLighthouseScore += page.metrics.lighthouse.scores.performance;
            }

            // Check for issues
            if (page.metrics.performance?.loadTime > 3000) {
                report.summary.issues.push(`${page.name}: Slow load time (${page.metrics.performance.loadTime}ms)`);
            }

            if (page.metrics.lighthouse?.scores?.performance < 90) {
                report.summary.issues.push(`${page.name}: Low Lighthouse score (${page.metrics.lighthouse.scores.performance}/100)`);
            }

            if (page.metrics.memory?.possibleLeak) {
                report.summary.issues.push(`${page.name}: Possible memory leak detected`);
            }
        });

        report.summary.averageLoadTime = validPages ? Math.round(totalLoadTime / validPages) : 0;
        report.summary.averageLighthouseScore = this.testPages.length ?
            Math.round(totalLighthouseScore / this.testPages.length) : 0;

        // Print summary
        console.log('\n📊 Summary:');
        console.log(`Average Load Time: ${report.summary.averageLoadTime}ms`);
        console.log(`Average Lighthouse Score: ${report.summary.averageLighthouseScore}/100`);

        if (report.summary.issues.length > 0) {
            console.log('\n⚠️  Issues Found:');
            report.summary.issues.forEach(issue => {
                console.log(`  - ${issue}`);
            });
        } else {
            console.log('\n✅ All tests passed successfully!');
        }

        // Save detailed report
        const reportPath = path.join(__dirname, `performance-report-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📁 Detailed report saved to: ${reportPath}`);

        return report;
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new PerformanceTester(process.env.BASE_URL || 'http://localhost:8080');

    tester.runAllTests()
        .then(() => {
            console.log('\n✨ Performance testing completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Performance testing failed:', error);
            process.exit(1);
        });
}

module.exports = PerformanceTester;