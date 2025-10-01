/**
 * Progressive Enhancement and Lazy Loading System
 * Intelligent loading strategies for optimal performance
 */

// Feature detection and capability assessment
class FeatureDetector {
  constructor() {
    this.capabilities = new Map();
    this.testResults = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    await this.runFeatureTests();
    this.initialized = true;
  }

  async runFeatureTests() {
    const tests = [
      ['webgl', this.testWebGL],
      ['webgl2', this.testWebGL2],
      ['intersectionObserver', this.testIntersectionObserver],
      ['requestIdleCallback', this.testRequestIdleCallback],
      ['webWorkers', this.testWebWorkers],
      ['offscreenCanvas', this.testOffscreenCanvas],
      ['cssCustomProperties', this.testCSSCustomProperties],
      ['cssGrid', this.testCSSGrid],
      ['cssFlexbox', this.testCSSFlexbox],
      ['cssContainerQueries', this.testCSSContainerQueries],
      ['resizeObserver', this.testResizeObserver],
      ['mutationObserver', this.testMutationObserver],
      ['pointerEvents', this.testPointerEvents],
      ['touchEvents', this.testTouchEvents],
      ['deviceOrientation', this.testDeviceOrientation],
      ['localStorage', this.testLocalStorage],
      ['indexedDB', this.testIndexedDB],
      ['serviceWorker', this.testServiceWorker],
      ['webAssembly', this.testWebAssembly],
      ['es6Modules', this.testES6Modules],
      ['dynamicImports', this.testDynamicImports]
    ];

    for (const [name, testFn] of tests) {
      try {
        const result = await testFn.call(this);
        this.capabilities.set(name, result);
        this.testResults.set(name, { supported: result, tested: true });
      } catch (error) {
        this.capabilities.set(name, false);
        this.testResults.set(name, { supported: false, tested: true, error: error.message });
      }
    }
  }

  // Feature test implementations
  testWebGL() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!(gl && gl instanceof WebGLRenderingContext);
  }

  testWebGL2() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return !!(gl && gl instanceof WebGL2RenderingContext);
  }

  testIntersectionObserver() {
    return 'IntersectionObserver' in window;
  }

  testRequestIdleCallback() {
    return 'requestIdleCallback' in window;
  }

  testWebWorkers() {
    return 'Worker' in window;
  }

  testOffscreenCanvas() {
    return 'OffscreenCanvas' in window;
  }

  testCSSCustomProperties() {
    return window.CSS && CSS.supports && CSS.supports('color', 'var(--test)');
  }

  testCSSGrid() {
    return CSS.supports('display', 'grid');
  }

  testCSSFlexbox() {
    return CSS.supports('display', 'flex');
  }

  testCSSContainerQueries() {
    return CSS.supports('container-type', 'inline-size');
  }

  testResizeObserver() {
    return 'ResizeObserver' in window;
  }

  testMutationObserver() {
    return 'MutationObserver' in window;
  }

  testPointerEvents() {
    return 'PointerEvent' in window;
  }

  testTouchEvents() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  testDeviceOrientation() {
    return 'DeviceOrientationEvent' in window;
  }

  testLocalStorage() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  async testIndexedDB() {
    return 'indexedDB' in window;
  }

  testServiceWorker() {
    return 'serviceWorker' in navigator;
  }

  async testWebAssembly() {
    return 'WebAssembly' in window;
  }

  testES6Modules() {
    return 'noModule' in document.createElement('script');
  }

  async testDynamicImports() {
    try {
      await new Function('return import("data:text/javascript,")')();
      return true;
    } catch {
      return false;
    }
  }

  // Public API
  supports(feature) {
    return this.capabilities.get(feature) || false;
  }

  getCapabilities() {
    return Object.fromEntries(this.capabilities);
  }

  getTestResults() {
    return Object.fromEntries(this.testResults);
  }
}

// Adaptive loading strategy based on device capabilities
class AdaptiveLoader {
  constructor(featureDetector) {
    this.featureDetector = featureDetector;
    this.loadingStrategies = new Map();
    this.deviceProfile = null;
    this.networkInfo = null;
  }

  async initialize() {
    await this.featureDetector.initialize();
    this.deviceProfile = this.createDeviceProfile();
    this.networkInfo = this.getNetworkInfo();
    this.setupStrategies();
  }

  createDeviceProfile() {
    const capabilities = this.featureDetector.getCapabilities();
    const deviceMemory = navigator.deviceMemory || 4; // Default 4GB
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    // Determine device tier
    let tier = 'high';
    if (deviceMemory < 2 || hardwareConcurrency < 2) {
      tier = 'low';
    } else if (deviceMemory < 4 || hardwareConcurrency < 4) {
      tier = 'medium';
    }

    return {
      tier,
      memory: deviceMemory,
      cores: hardwareConcurrency,
      webgl: capabilities.webgl,
      webgl2: capabilities.webgl2,
      workers: capabilities.webWorkers,
      touch: capabilities.touchEvents
    };
  }

  getNetworkInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }

    return {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false
    };
  }

  setupStrategies() {
    // Define loading strategies based on device capabilities
    this.loadingStrategies.set('critical', {
      priority: 'high',
      timeout: 5000,
      retries: 3,
      fallback: true
    });

    this.loadingStrategies.set('important', {
      priority: 'medium',
      timeout: 10000,
      retries: 2,
      fallback: true
    });

    this.loadingStrategies.set('optional', {
      priority: 'low',
      timeout: 15000,
      retries: 1,
      fallback: false
    });

    // Adjust strategies based on device tier
    if (this.deviceProfile.tier === 'low') {
      // Reduce timeouts and retries for low-end devices
      for (const strategy of this.loadingStrategies.values()) {
        strategy.timeout *= 0.7;
        strategy.retries = Math.max(1, strategy.retries - 1);
      }
    }

    // Adjust for poor network conditions
    if (this.networkInfo.saveData || this.networkInfo.effectiveType === 'slow-2g') {
      for (const strategy of this.loadingStrategies.values()) {
        strategy.timeout *= 2;
        strategy.retries = 1;
      }
    }
  }

  getStrategy(type) {
    return this.loadingStrategies.get(type) || this.loadingStrategies.get('optional');
  }
}

// Intersection-based lazy loading
class LazyLoader {
  constructor(adaptiveLoader) {
    this.adaptiveLoader = adaptiveLoader;
    this.observers = new Map();
    this.loadingQueue = new Set();
    this.loadedElements = new WeakSet();
    this.errorElements = new WeakSet();
  }

  // Create intersection observer for lazy loading
  createObserver(options = {}) {
    const {
      rootMargin = '50px',
      threshold = 0.1,
      strategy = 'optional'
    } = options;

    const observerId = JSON.stringify({ rootMargin, threshold, strategy });

    if (this.observers.has(observerId)) {
      return this.observers.get(observerId);
    }

    const observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries, strategy),
      { rootMargin, threshold }
    );

    this.observers.set(observerId, observer);
    return observer;
  }

  async handleIntersection(entries, strategy) {
    const strategyConfig = this.adaptiveLoader.getStrategy(strategy);

    for (const entry of entries) {
      if (entry.isIntersecting && !this.loadingQueue.has(entry.target)) {
        this.loadingQueue.add(entry.target);
        await this.loadElement(entry.target, strategyConfig);
      }
    }
  }

  async loadElement(element, strategy) {
    if (this.loadedElements.has(element) || this.errorElements.has(element)) {
      return;
    }

    const loadType = element.dataset.lazyType || 'content';
    const source = element.dataset.lazySrc || element.dataset.src;

    if (!source) {
      console.warn('No lazy source found for element:', element);
      return;
    }

    try {
      switch (loadType) {
        case 'image':
          await this.loadImage(element, source, strategy);
          break;
        case 'component':
          await this.loadComponent(element, source, strategy);
          break;
        case 'iframe':
          await this.loadIframe(element, source, strategy);
          break;
        case 'content':
          await this.loadContent(element, source, strategy);
          break;
        default:
          await this.loadDefault(element, source, strategy);
      }

      this.loadedElements.add(element);
      element.classList.add('lazy-loaded');
      element.dispatchEvent(new CustomEvent('lazyLoaded', { detail: { source } }));

    } catch (error) {
      console.error('Failed to lazy load element:', error);
      this.errorElements.add(element);
      element.classList.add('lazy-error');

      if (strategy.fallback) {
        this.loadFallback(element);
      }
    } finally {
      this.loadingQueue.delete(element);
    }
  }

  async loadImage(element, source, strategy) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => reject(new Error('Image load timeout')), strategy.timeout);

      img.onload = () => {
        clearTimeout(timeout);
        element.src = source;
        element.classList.remove('lazy-placeholder');
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Image load failed'));
      };

      img.src = source;
    });
  }

  async loadComponent(element, source, strategy) {
    const module = await import(source);
    const Component = module.default || module;

    if (typeof Component === 'function') {
      const instance = new Component({
        container: element,
        ...this.parseDataAttributes(element)
      });

      if (instance.mount) {
        instance.mount(element);
      }
    }
  }

  async loadIframe(element, source, strategy) {
    const iframe = document.createElement('iframe');
    iframe.src = source;
    iframe.loading = 'lazy';

    // Copy attributes
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-iframe-')) {
        iframe.setAttribute(attr.name.replace('data-iframe-', ''), attr.value);
      }
    });

    element.appendChild(iframe);
  }

  async loadContent(element, source, strategy) {
    const response = await fetch(source, {
      signal: AbortSignal.timeout(strategy.timeout)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const content = await response.text();
    element.innerHTML = content;

    // Execute any scripts in the loaded content
    const scripts = element.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      newScript.textContent = script.textContent;
      Array.from(script.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      script.parentNode.replaceChild(newScript, script);
    });
  }

  async loadDefault(element, source, strategy) {
    // Default loading behavior
    element.src = source;
  }

  loadFallback(element) {
    const fallback = element.dataset.fallback;
    if (fallback) {
      element.src = fallback;
    } else {
      element.classList.add('lazy-fallback');
    }
  }

  parseDataAttributes(element) {
    const data = {};
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-prop-')) {
        const propName = attr.name.replace('data-prop-', '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        data[propName] = attr.value;
      }
    });
    return data;
  }

  // Public API
  observe(element, options = {}) {
    const observer = this.createObserver(options);
    observer.observe(element);
  }

  unobserve(element) {
    for (const observer of this.observers.values()) {
      observer.unobserve(element);
    }
  }

  disconnect() {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}

// Progressive enhancement controller
class ProgressiveEnhancer {
  constructor(featureDetector, adaptiveLoader) {
    this.featureDetector = featureDetector;
    this.adaptiveLoader = adaptiveLoader;
    this.enhancements = new Map();
    this.enhancedElements = new WeakSet();
  }

  // Register enhancement
  register(name, config) {
    const {
      check,
      enhance,
      fallback,
      priority = 'optional',
      dependencies = []
    } = config;

    this.enhancements.set(name, {
      check: typeof check === 'string' ? () => this.featureDetector.supports(check) : check,
      enhance,
      fallback,
      priority,
      dependencies
    });
  }

  // Apply enhancements to element
  async enhance(element) {
    if (this.enhancedElements.has(element)) {
      return;
    }

    const enhancements = Array.from(this.enhancements.entries())
      .filter(([name, config]) => this.shouldApplyEnhancement(element, name, config))
      .sort(([, a], [, b]) => this.getPriorityOrder(a.priority) - this.getPriorityOrder(b.priority));

    for (const [name, config] of enhancements) {
      try {
        if (config.check()) {
          await config.enhance(element);
          element.classList.add(`enhanced-${name}`);
        } else {
          config.fallback(element);
          element.classList.add(`fallback-${name}`);
        }
      } catch (error) {
        console.warn(`Enhancement ${name} failed:`, error);
        config.fallback(element);
        element.classList.add(`fallback-${name}`);
      }
    }

    this.enhancedElements.add(element);
    element.classList.add('progressively-enhanced');
  }

  shouldApplyEnhancement(element, name, config) {
    // Check if element has data attribute for this enhancement
    return element.hasAttribute(`data-enhance-${name}`) ||
           element.hasAttribute('data-enhance-all');
  }

  getPriorityOrder(priority) {
    const order = { critical: 0, important: 1, optional: 2 };
    return order[priority] || 2;
  }

  // Batch enhance multiple elements
  async enhanceAll(elements) {
    const promises = Array.from(elements).map(el => this.enhance(el));
    await Promise.allSettled(promises);
  }

  // Auto-enhance elements as they appear
  autoEnhance(selector = '[data-enhance]') {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const elements = node.matches(selector) ? [node] : node.querySelectorAll(selector);
            this.enhanceAll(elements);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Enhance existing elements
    this.enhanceAll(document.querySelectorAll(selector));

    return observer;
  }
}

// Initialize system
const featureDetector = new FeatureDetector();
const adaptiveLoader = new AdaptiveLoader(featureDetector);
const lazyLoader = new LazyLoader(adaptiveLoader);
const progressiveEnhancer = new ProgressiveEnhancer(featureDetector, adaptiveLoader);

// Setup common enhancements
progressiveEnhancer.register('webgl-charts', {
  check: 'webgl',
  enhance: async (element) => {
    const { WebGLChart } = await import('./webgl-chart.js');
    new WebGLChart(element);
  },
  fallback: (element) => {
    element.innerHTML = '<canvas>WebGL not supported - using 2D fallback</canvas>';
  },
  priority: 'important'
});

progressiveEnhancer.register('touch-gestures', {
  check: 'touchEvents',
  enhance: async (element) => {
    const { TouchGestures } = await import('./touch-gestures.js');
    new TouchGestures(element);
  },
  fallback: (element) => {
    element.classList.add('mouse-only');
  },
  priority: 'optional'
});

progressiveEnhancer.register('advanced-animations', {
  check: () => CSS.supports('transform', 'translateZ(0)'),
  enhance: async (element) => {
    const { AdvancedAnimations } = await import('./advanced-animations.js');
    new AdvancedAnimations(element);
  },
  fallback: (element) => {
    element.classList.add('basic-animations');
  },
  priority: 'optional'
});

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initialize());
} else {
  initialize();
}

async function initialize() {
  await adaptiveLoader.initialize();
  progressiveEnhancer.autoEnhance();

  // Setup lazy loading for common elements
  document.querySelectorAll('[data-lazy]').forEach(el => {
    lazyLoader.observe(el, {
      strategy: el.dataset.lazyStrategy || 'optional'
    });
  });
}

// Export progressive enhancement system
window.ProgressiveSystem = {
  FeatureDetector: featureDetector,
  AdaptiveLoader: adaptiveLoader,
  LazyLoader: lazyLoader,
  ProgressiveEnhancer: progressiveEnhancer,

  // Convenience methods
  supports: (feature) => featureDetector.supports(feature),
  enhance: (element) => progressiveEnhancer.enhance(element),
  lazy: (element, options) => lazyLoader.observe(element, options),

  // Device info
  getDeviceProfile: () => adaptiveLoader.deviceProfile,
  getNetworkInfo: () => adaptiveLoader.networkInfo,
  getCapabilities: () => featureDetector.getCapabilities(),

  // Performance
  getStats: () => ({
    features: featureDetector.getTestResults(),
    device: adaptiveLoader.deviceProfile,
    network: adaptiveLoader.networkInfo,
    lazy: {
      observers: lazyLoader.observers.size,
      loading: lazyLoader.loadingQueue.size
    }
  })
};

console.log('🔄 Progressive Enhancement System loaded');