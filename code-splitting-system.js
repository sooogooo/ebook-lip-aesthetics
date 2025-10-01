/**
 * Advanced Code Splitting and Bundle Optimization
 * Dynamic imports with intelligent caching and preloading
 */

// Bundle analyzer and size tracking
class BundleAnalyzer {
  constructor() {
    this.modules = new Map();
    this.dependencies = new Map();
    this.loadTimes = new Map();
    this.sizeThreshold = 50 * 1024; // 50KB warning threshold
  }

  trackModule(name, size, loadTime, dependencies = []) {
    this.modules.set(name, {
      name,
      size,
      loadTime,
      dependencies,
      loadCount: (this.modules.get(name)?.loadCount || 0) + 1,
      timestamp: Date.now()
    });

    // Track dependencies
    dependencies.forEach(dep => {
      if (!this.dependencies.has(dep)) {
        this.dependencies.set(dep, new Set());
      }
      this.dependencies.get(dep).add(name);
    });

    // Warn about large bundles
    if (size > this.sizeThreshold) {
      console.warn(`Large module detected: ${name} (${this.formatSize(size)})`);
    }
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getAnalysis() {
    const totalSize = Array.from(this.modules.values()).reduce((sum, mod) => sum + mod.size, 0);
    const avgLoadTime = Array.from(this.loadTimes.values()).reduce((sum, time, _, arr) => sum + time / arr.length, 0);

    return {
      totalModules: this.modules.size,
      totalSize: this.formatSize(totalSize),
      averageLoadTime: Math.round(avgLoadTime),
      largestModules: Array.from(this.modules.values())
        .sort((a, b) => b.size - a.size)
        .slice(0, 5),
      mostUsedModules: Array.from(this.modules.values())
        .sort((a, b) => b.loadCount - a.loadCount)
        .slice(0, 5)
    };
  }
}

// Intelligent module bundler with tree shaking
class SmartBundler {
  constructor() {
    this.chunks = new Map();
    this.vendors = new Set(['react', 'three', 'd3', 'chart']);
    this.analyzer = new BundleAnalyzer();
  }

  // Create optimized bundles based on usage patterns
  createChunks(modules) {
    const chunks = {
      vendor: [],
      common: [],
      feature: new Map(),
      lazy: []
    };

    modules.forEach(module => {
      if (this.isVendorModule(module)) {
        chunks.vendor.push(module);
      } else if (this.isCommonModule(module)) {
        chunks.common.push(module);
      } else if (this.isLazyModule(module)) {
        chunks.lazy.push(module);
      } else {
        const feature = this.getFeatureGroup(module);
        if (!chunks.feature.has(feature)) {
          chunks.feature.set(feature, []);
        }
        chunks.feature.get(feature).push(module);
      }
    });

    return chunks;
  }

  isVendorModule(module) {
    return this.vendors.some(vendor => module.includes(vendor));
  }

  isCommonModule(module) {
    const deps = this.analyzer.dependencies.get(module);
    return deps && deps.size > 2; // Used by more than 2 modules
  }

  isLazyModule(module) {
    return module.includes('lazy') || module.includes('async') || module.includes('modal');
  }

  getFeatureGroup(module) {
    if (module.includes('chart')) return 'visualization';
    if (module.includes('3d') || module.includes('webgl')) return 'graphics';
    if (module.includes('medical') || module.includes('anatomy')) return 'medical';
    if (module.includes('ui') || module.includes('component')) return 'ui';
    return 'misc';
  }
}

// Advanced dynamic loader with preloading strategies
class AdvancedLoader {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = new Set();
    this.loadingPromises = new Map();
    this.bundler = new SmartBundler();
    this.observer = null;
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const module = entry.target.dataset.lazyModule;
              if (module) {
                this.preload(module);
                this.observer.unobserve(entry.target);
              }
            }
          });
        },
        { rootMargin: '100px' }
      );
    }
  }

  // Main loading function with multiple strategies
  async load(modulePath, strategy = 'default') {
    const startTime = performance.now();

    try {
      let module;

      switch (strategy) {
        case 'critical':
          module = await this.loadCritical(modulePath);
          break;
        case 'lazy':
          module = await this.loadLazy(modulePath);
          break;
        case 'preload':
          module = await this.preload(modulePath);
          break;
        default:
          module = await this.loadDefault(modulePath);
      }

      const loadTime = performance.now() - startTime;
      this.bundler.analyzer.trackModule(modulePath, this.estimateSize(module), loadTime);

      return module;
    } catch (error) {
      console.error(`Failed to load module: ${modulePath}`, error);
      throw error;
    }
  }

  // Critical path loading (blocking)
  async loadCritical(modulePath) {
    if (this.cache.has(modulePath)) {
      return this.cache.get(modulePath);
    }

    const module = await import(modulePath);
    this.cache.set(modulePath, module);
    return module;
  }

  // Lazy loading with intersection observer
  async loadLazy(modulePath) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (this.cache.has(modulePath)) {
        resolve(this.cache.get(modulePath));
        return;
      }

      // Add to preload queue for when visible
      this.preloadQueue.add({
        path: modulePath,
        resolve,
        reject,
        type: 'lazy'
      });

      // Load when idle
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => this.processPreloadQueue());
      } else {
        setTimeout(() => this.processPreloadQueue(), 100);
      }
    });
  }

  // Preloading with priority
  async preload(modulePath, priority = 'low') {
    if (this.cache.has(modulePath)) {
      return this.cache.get(modulePath);
    }

    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }

    const loadPromise = this.createPreloadLink(modulePath)
      .then(() => import(modulePath))
      .then(module => {
        this.cache.set(modulePath, module);
        this.loadingPromises.delete(modulePath);
        return module;
      });

    this.loadingPromises.set(modulePath, loadPromise);
    return loadPromise;
  }

  // Default loading with caching
  async loadDefault(modulePath) {
    if (this.cache.has(modulePath)) {
      return this.cache.get(modulePath);
    }

    const module = await import(modulePath);
    this.cache.set(modulePath, module);
    return module;
  }

  // Create preload link tag for faster loading
  createPreloadLink(modulePath) {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = modulePath;
      link.onload = resolve;
      link.onerror = resolve; // Don't fail on preload errors
      document.head.appendChild(link);

      // Resolve immediately if browser doesn't support modulepreload
      setTimeout(resolve, 50);
    });
  }

  // Process queued preloads
  async processPreloadQueue() {
    const batch = Array.from(this.preloadQueue).slice(0, 3); // Process 3 at a time
    this.preloadQueue.clear();

    await Promise.allSettled(
      batch.map(async item => {
        try {
          const module = await this.loadDefault(item.path);
          item.resolve(module);
        } catch (error) {
          item.reject(error);
        }
      })
    );
  }

  // Register element for lazy loading
  observeLazyLoad(element, modulePath) {
    if (this.observer) {
      element.dataset.lazyModule = modulePath;
      this.observer.observe(element);
    }
  }

  // Estimate module size (rough approximation)
  estimateSize(module) {
    try {
      return JSON.stringify(module).length * 2; // Rough estimate
    } catch {
      return 1024; // Default 1KB if can't estimate
    }
  }

  // Get loading statistics
  getStats() {
    return this.bundler.analyzer.getAnalysis();
  }
}

// Component-level code splitting
class ComponentSplitter {
  constructor(loader) {
    this.loader = loader;
    this.componentCache = new Map();
    this.suspenseHandlers = new Map();
  }

  // Create lazy component with suspense
  lazy(importFn, options = {}) {
    const {
      fallback = null,
      errorBoundary = null,
      retryAttempts = 3,
      retryDelay = 1000
    } = options;

    return class LazyComponent extends CompactComponent {
      getInitialState() {
        return {
          Component: null,
          loading: true,
          error: null,
          retryCount: 0
        };
      }

      async componentDidMount() {
        await this.loadComponent();
      }

      async loadComponent() {
        const { retryCount } = this.state.getState();

        try {
          this.setState({ loading: true, error: null });

          const startTime = performance.now();
          const module = await importFn();
          const loadTime = performance.now() - startTime;

          console.log(`Lazy component loaded in ${loadTime.toFixed(2)}ms`);

          const Component = module.default || module;
          this.setState({
            Component,
            loading: false,
            error: null
          });

        } catch (error) {
          console.error('Failed to load lazy component:', error);

          if (retryCount < retryAttempts) {
            setTimeout(() => {
              this.setState({ retryCount: retryCount + 1 });
              this.loadComponent();
            }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
          } else {
            this.setState({
              loading: false,
              error: error.message
            });
          }
        }
      }

      render() {
        const { Component, loading, error } = this.state.getState();

        if (error && errorBoundary) {
          return errorBoundary(error, () => this.loadComponent());
        }

        if (loading) {
          return fallback || h('div', { className: 'loading' }, 'Loading...');
        }

        if (Component) {
          return h(Component, this.props);
        }

        return h('div', { className: 'error' }, `Failed to load component: ${error}`);
      }

      retry() {
        this.setState({ retryCount: 0 });
        this.loadComponent();
      }
    };
  }

  // Create suspense boundary
  suspense(children, fallback) {
    return h('div', { className: 'suspense-boundary' }, [
      children,
      fallback && h('div', { className: 'suspense-fallback' }, fallback)
    ]);
  }
}

// Route-based code splitting
class RouteSplitter {
  constructor(loader) {
    this.loader = loader;
    this.routes = new Map();
    this.currentRoute = null;
  }

  // Register route with lazy loading
  route(path, importFn, options = {}) {
    this.routes.set(path, {
      importFn,
      options,
      component: null,
      loaded: false
    });
  }

  // Navigate to route with lazy loading
  async navigate(path, params = {}) {
    const route = this.routes.get(path);
    if (!route) {
      throw new Error(`Route not found: ${path}`);
    }

    // Preload route if not already loaded
    if (!route.loaded) {
      try {
        const module = await this.loader.load(route.importFn, 'lazy');
        route.component = module.default || module;
        route.loaded = true;
      } catch (error) {
        console.error(`Failed to load route: ${path}`, error);
        throw error;
      }
    }

    this.currentRoute = { path, params, route };
    return route.component;
  }

  // Preload all routes
  async preloadRoutes() {
    const promises = Array.from(this.routes.entries()).map(async ([path, route]) => {
      if (!route.loaded) {
        try {
          await this.navigate(path);
        } catch (error) {
          console.warn(`Failed to preload route: ${path}`, error);
        }
      }
    });

    await Promise.allSettled(promises);
  }
}

// Progressive enhancement patterns
class ProgressiveEnhancer {
  constructor(loader) {
    this.loader = loader;
    this.features = new Map();
    this.supported = new Map();
  }

  // Register progressive feature
  feature(name, checkFn, enhanceFn, fallbackFn) {
    this.features.set(name, {
      check: checkFn,
      enhance: enhanceFn,
      fallback: fallbackFn
    });
  }

  // Apply progressive enhancements
  async enhance(element) {
    for (const [name, feature] of this.features) {
      if (!this.supported.has(name)) {
        this.supported.set(name, feature.check());
      }

      const isSupported = this.supported.get(name);

      try {
        if (isSupported) {
          await feature.enhance(element);
        } else {
          feature.fallback(element);
        }
      } catch (error) {
        console.warn(`Progressive enhancement failed for ${name}:`, error);
        feature.fallback(element);
      }
    }
  }

  // Batch enhance multiple elements
  async enhanceAll(elements) {
    const promises = Array.from(elements).map(el => this.enhance(el));
    await Promise.allSettled(promises);
  }
}

// Global instances
const advancedLoader = new AdvancedLoader();
const componentSplitter = new ComponentSplitter(advancedLoader);
const routeSplitter = new RouteSplitter(advancedLoader);
const progressiveEnhancer = new ProgressiveEnhancer(advancedLoader);

// Setup common progressive features
progressiveEnhancer.feature(
  'webgl',
  () => {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  },
  async (element) => {
    const webglModule = await advancedLoader.load('./webgl-enhanced.js', 'lazy');
    webglModule.enhance(element);
  },
  (element) => {
    element.classList.add('fallback-2d');
  }
);

progressiveEnhancer.feature(
  'intersection-observer',
  () => 'IntersectionObserver' in window,
  async (element) => {
    const lazyModule = await advancedLoader.load('./lazy-loading.js', 'lazy');
    lazyModule.setupLazyLoading(element);
  },
  (element) => {
    // Load everything immediately as fallback
    element.classList.add('immediate-load');
  }
);

// Export enhanced system
window.CodeSplitting = {
  AdvancedLoader: advancedLoader,
  ComponentSplitter: componentSplitter,
  RouteSplitter: routeSplitter,
  ProgressiveEnhancer: progressiveEnhancer,
  BundleAnalyzer,
  SmartBundler,

  // Convenience methods
  lazy: componentSplitter.lazy.bind(componentSplitter),
  suspense: componentSplitter.suspense.bind(componentSplitter),
  route: routeSplitter.route.bind(routeSplitter),
  navigate: routeSplitter.navigate.bind(routeSplitter),
  enhance: progressiveEnhancer.enhance.bind(progressiveEnhancer),

  // Performance utilities
  preloadCritical: (modules) => {
    return Promise.all(modules.map(m => advancedLoader.load(m, 'critical')));
  },

  preloadLazy: (modules) => {
    modules.forEach(m => advancedLoader.preload(m, 'low'));
  },

  getPerformanceReport: () => {
    return {
      loader: advancedLoader.getStats(),
      cache: {
        size: advancedLoader.cache.size,
        modules: Array.from(advancedLoader.cache.keys())
      },
      features: Array.from(progressiveEnhancer.supported.entries())
    };
  }
};

console.log('🎯 Advanced Code Splitting System loaded');