const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fs = require('fs').promises;
const path = require('path');

// Performance testing configuration
const performanceConfig = {
  urls: [
    'http://localhost:8080/visualization_hub.html',
    'http://localhost:8080/medical_dashboard.html',
    'http://localhost:8080/enhanced_3d_anatomy.html',
    'http://localhost:8080/performance-dashboard.html'
  ],
  devices: [
    { name: 'Desktop', viewport: { width: 1920, height: 1080 }, userAgent: 'desktop' },
    { name: 'Mobile', viewport: { width: 375, height: 812 }, userAgent: 'mobile' },
    { name: 'Tablet', viewport: { width: 768, height: 1024 }, userAgent: 'tablet' }
  ],
  networkConditions: [
    { name: 'Fast 3G', downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 },
    { name: '4G', downloadThroughput: 4 * 1024 * 1024 / 8, uploadThroughput: 3 * 1024 * 1024 / 8, latency: 70 },
    { name: 'WiFi', downloadThroughput: 30 * 1024 * 1024 / 8, uploadThroughput: 15 * 1024 * 1024 / 8, latency: 2 }
  ],
  lighthouseConfig: {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
      throttlingMethod: 'simulate',
      screenEmulation: {
        mobile: false,
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        disabled: false
      },
      formFactor: 'desktop'
    }
  },
  budgets: {
    performance: 90,
    accessibility: 95,
    'best-practices': 95,
    seo: 90,
    pwa: 90,
    fcp: 1800,
    lcp: 2500,
    tti: 3800,
    si: 3400,
    tbt: 200,
    cls: 0.1,
    fid: 100,
    bundleSize: 500000, // 500KB
    imageSize: 200000, // 200KB per image
    scriptSize: 100000, // 100KB per script
    styleSize: 50000, // 50KB per stylesheet
    totalSize: 1500000 // 1.5MB total
  }
};

class PerformanceTester {
  constructor() {
    this.browser = null;
    this.results = [];
    this.failures = [];
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async runTests() {
    console.log('=== Starting Performance Tests ===\n');

    for (const url of performanceConfig.urls) {
      console.log(`Testing: ${url}`);

      for (const device of performanceConfig.devices) {
        for (const network of performanceConfig.networkConditions) {
          await this.testConfiguration(url, device, network);
        }
      }
    }

    await this.generateReport();
    await this.checkBudgets();
  }

  async testConfiguration(url, device, network) {
    const page = await this.browser.newPage();

    try {
      // Set viewport and user agent
      await page.setViewport(device.viewport);
      if (device.userAgent === 'mobile') {
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
      }

      // Set network conditions
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: network.downloadThroughput,
        uploadThroughput: network.uploadThroughput,
        latency: network.latency
      });

      // Measure performance metrics
      const startTime = Date.now();

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const loadTime = Date.now() - startTime;

      // Get performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');

        return {
          navigation: {
            fetchStart: navigation.fetchStart,
            domContentLoaded: navigation.domContentLoadedEventEnd,
            loadComplete: navigation.loadEventEnd,
            firstPaint: navigation.responseEnd,
            domInteractive: navigation.domInteractive
          },
          resources: {
            count: resources.length,
            totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
            cachedCount: resources.filter(r => r.transferSize === 0 && r.decodedBodySize > 0).length,
            scripts: resources.filter(r => r.name.endsWith('.js')).length,
            stylesheets: resources.filter(r => r.name.endsWith('.css')).length,
            images: resources.filter(r => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(r.name)).length
          },
          memory: performance.memory ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize
          } : null
        };
      });

      // Run Lighthouse audit
      const lighthouseResults = await this.runLighthouse(url, device);

      // Store results
      this.results.push({
        url,
        device: device.name,
        network: network.name,
        loadTime,
        metrics,
        lighthouse: lighthouseResults,
        timestamp: new Date().toISOString()
      });

      console.log(`  ✓ ${device.name} - ${network.name}: ${loadTime}ms`);

    } catch (error) {
      console.error(`  ✗ Error testing ${url} on ${device.name} with ${network.name}:`, error.message);
      this.failures.push({
        url,
        device: device.name,
        network: network.name,
        error: error.message
      });
    } finally {
      await page.close();
    }
  }

  async runLighthouse(url, device) {
    const flags = {
      port: (new URL(this.browser.wsEndpoint())).port,
      output: 'json',
      logLevel: 'error'
    };

    const config = {
      ...performanceConfig.lighthouseConfig,
      settings: {
        ...performanceConfig.lighthouseConfig.settings,
        formFactor: device.name === 'Mobile' ? 'mobile' : 'desktop',
        screenEmulation: {
          ...performanceConfig.lighthouseConfig.settings.screenEmulation,
          mobile: device.name === 'Mobile',
          width: device.viewport.width,
          height: device.viewport.height
        }
      }
    };

    try {
      const runnerResult = await lighthouse(url, flags, config);
      return {
        scores: {
          performance: Math.round(runnerResult.lhr.categories.performance.score * 100),
          accessibility: Math.round(runnerResult.lhr.categories.accessibility.score * 100),
          'best-practices': Math.round(runnerResult.lhr.categories['best-practices'].score * 100),
          seo: Math.round(runnerResult.lhr.categories.seo.score * 100),
          pwa: runnerResult.lhr.categories.pwa ? Math.round(runnerResult.lhr.categories.pwa.score * 100) : null
        },
        metrics: {
          fcp: runnerResult.lhr.audits['first-contentful-paint'].numericValue,
          lcp: runnerResult.lhr.audits['largest-contentful-paint'].numericValue,
          tti: runnerResult.lhr.audits['interactive'].numericValue,
          si: runnerResult.lhr.audits['speed-index'].numericValue,
          tbt: runnerResult.lhr.audits['total-blocking-time'].numericValue,
          cls: runnerResult.lhr.audits['cumulative-layout-shift'].numericValue
        }
      };
    } catch (error) {
      console.error('Lighthouse error:', error.message);
      return null;
    }
  }

  async checkBudgets() {
    console.log('\n=== Performance Budget Check ===\n');

    let allPassed = true;

    for (const result of this.results) {
      if (!result.lighthouse) continue;

      const budgetViolations = [];

      // Check Lighthouse scores
      Object.entries(performanceConfig.budgets).forEach(([metric, budget]) => {
        if (result.lighthouse.scores[metric] !== undefined) {
          if (result.lighthouse.scores[metric] < budget) {
            budgetViolations.push({
              metric,
              actual: result.lighthouse.scores[metric],
              budget,
              difference: budget - result.lighthouse.scores[metric]
            });
          }
        }

        // Check Core Web Vitals
        if (result.lighthouse.metrics[metric] !== undefined) {
          if (result.lighthouse.metrics[metric] > budget) {
            budgetViolations.push({
              metric,
              actual: result.lighthouse.metrics[metric],
              budget,
              difference: result.lighthouse.metrics[metric] - budget
            });
          }
        }
      });

      if (budgetViolations.length > 0) {
        allPassed = false;
        console.log(`Budget violations for ${result.url} (${result.device} - ${result.network}):`);
        budgetViolations.forEach(violation => {
          console.log(`  ✗ ${violation.metric}: ${violation.actual} (budget: ${violation.budget}, over by: ${violation.difference})`);
        });
      }
    }

    if (allPassed) {
      console.log('✓ All performance budgets passed!');
    }

    return allPassed;
  }

  async generateReport() {
    const report = {
      summary: {
        totalTests: this.results.length,
        failures: this.failures.length,
        averageLoadTime: this.results.reduce((sum, r) => sum + r.loadTime, 0) / this.results.length,
        timestamp: new Date().toISOString()
      },
      results: this.results,
      failures: this.failures,
      budgets: performanceConfig.budgets
    };

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    await fs.writeFile(
      path.join(__dirname, '..', 'performance-report.html'),
      htmlReport
    );

    // Generate JSON report
    await fs.writeFile(
      path.join(__dirname, '..', 'performance-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n=== Performance Test Summary ===');
    console.log(`Total tests: ${report.summary.totalTests}`);
    console.log(`Failures: ${report.summary.failures}`);
    console.log(`Average load time: ${report.summary.averageLoadTime.toFixed(2)}ms`);
    console.log('\nReports generated:');
    console.log('  - performance-report.html');
    console.log('  - performance-report.json');
  }

  generateHTMLReport(report) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report - ${new Date().toLocaleDateString()}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 20px; }
        h2 { color: #666; margin: 20px 0 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; }
        .summary-value { font-size: 2rem; font-weight: bold; }
        .summary-label { opacity: 0.9; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f9f9f9; font-weight: 600; }
        .score { padding: 4px 8px; border-radius: 4px; font-weight: 600; }
        .score.good { background: #d1fae5; color: #065f46; }
        .score.warning { background: #fef3c7; color: #92400e; }
        .score.poor { background: #fee2e2; color: #991b1b; }
        .metric { display: inline-block; margin: 2px; padding: 4px 8px; background: #f0f0f0; border-radius: 4px; font-size: 0.875rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Performance Test Report</h1>
        <p>Generated: ${report.summary.timestamp}</p>

        <div class="summary">
            <div class="summary-card">
                <div class="summary-value">${report.summary.totalTests}</div>
                <div class="summary-label">Total Tests</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${report.summary.failures}</div>
                <div class="summary-label">Failures</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${report.summary.averageLoadTime.toFixed(0)}ms</div>
                <div class="summary-label">Avg Load Time</div>
            </div>
        </div>

        <h2>Test Results</h2>
        <table>
            <thead>
                <tr>
                    <th>URL</th>
                    <th>Device</th>
                    <th>Network</th>
                    <th>Load Time</th>
                    <th>Lighthouse Scores</th>
                    <th>Core Web Vitals</th>
                </tr>
            </thead>
            <tbody>
                ${report.results.map(result => `
                    <tr>
                        <td>${result.url.split('/').pop()}</td>
                        <td>${result.device}</td>
                        <td>${result.network}</td>
                        <td>${result.loadTime}ms</td>
                        <td>
                            ${result.lighthouse ? Object.entries(result.lighthouse.scores).map(([key, value]) =>
                                value !== null ? `<span class="score ${value >= 90 ? 'good' : value >= 50 ? 'warning' : 'poor'}">${key}: ${value}</span>` : ''
                            ).join(' ') : 'N/A'}
                        </td>
                        <td>
                            ${result.lighthouse ? Object.entries(result.lighthouse.metrics).map(([key, value]) =>
                                `<span class="metric">${key}: ${typeof value === 'number' ? value.toFixed(0) : value}</span>`
                            ).join(' ') : 'N/A'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        ${report.failures.length > 0 ? `
            <h2>Failures</h2>
            <table>
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Device</th>
                        <th>Network</th>
                        <th>Error</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.failures.map(failure => `
                        <tr>
                            <td>${failure.url.split('/').pop()}</td>
                            <td>${failure.device}</td>
                            <td>${failure.network}</td>
                            <td>${failure.error}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : ''}
    </div>
</body>
</html>`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run performance tests
async function runPerformanceTests() {
  const tester = new PerformanceTester();

  try {
    await tester.init();
    await tester.runTests();
  } catch (error) {
    console.error('Performance test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

module.exports = { PerformanceTester, runPerformanceTests };