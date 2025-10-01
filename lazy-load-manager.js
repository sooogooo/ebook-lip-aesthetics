// Advanced Lazy Loading and Code Splitting System
// Supports images, videos, iframes, scripts, and components

class LazyLoadManager {
  constructor(options = {}) {
    this.options = {
      rootMargin: options.rootMargin || '50px 0px',
      threshold: options.threshold || 0.01,
      loadDelay: options.loadDelay || 0,
      preloadNext: options.preloadNext !== false,
      enablePrefetch: options.enablePrefetch !== false,
      ...options
    };

    this.observers = new Map();
    this.loadedResources = new Set();
    this.pendingLoads = new Map();
    this.performanceMetrics = {
      totalLoaded: 0,
      totalTime: 0,
      resourceTimes: new Map()
    };

    this.init();
  }

  init() {
    // Initialize different types of lazy loading
    this.initImageLazyLoad();
    this.initVideoLazyLoad();
    this.initIframeLazyLoad();
    this.initScriptLazyLoad();
    this.initComponentLazyLoad();
    this.initPrefetchStrategy();

    // Setup performance monitoring
    this.setupPerformanceMonitoring();

    // Listen for print events to load all images
    window.addEventListener('beforeprint', () => this.loadAllImages());
  }

  // Image Lazy Loading
  initImageLazyLoad() {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
        }
      });
    }, {
      rootMargin: this.options.rootMargin,
      threshold: this.options.threshold
    });

    this.observers.set('image', imageObserver);

    // Observe all lazy images
    document.querySelectorAll('img[data-src], img[data-srcset], picture source[data-srcset]').forEach(img => {
      imageObserver.observe(img);

      // Add blur placeholder
      if (img.dataset.placeholder) {
        img.style.filter = 'blur(5px)';
        img.style.transition = 'filter 0.3s';
      }
    });
  }

  loadImage(img) {
    const startTime = performance.now();

    // Handle picture element sources
    if (img.tagName === 'SOURCE') {
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        delete img.dataset.srcset;
      }
      return;
    }

    // Create a new image to preload
    const tempImg = new Image();

    tempImg.onload = () => {
      // Set the source
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        delete img.dataset.srcset;
      }
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }

      // Remove blur effect
      if (img.dataset.placeholder) {
        img.style.filter = 'none';
      }

      // Add loaded class
      img.classList.add('lazy-loaded');

      // Stop observing
      this.observers.get('image').unobserve(img);

      // Track performance
      const loadTime = performance.now() - startTime;
      this.trackResourceLoad('image', img.src, loadTime);

      // Preload next image if enabled
      if (this.options.preloadNext) {
        this.preloadNextImage(img);
      }
    };

    tempImg.onerror = () => {
      img.classList.add('lazy-error');
      this.observers.get('image').unobserve(img);
    };

    // Start loading
    tempImg.src = img.dataset.src || img.src;
    if (img.dataset.srcset) {
      tempImg.srcset = img.dataset.srcset;
    }
  }

  preloadNextImage(currentImg) {
    const allImages = Array.from(document.querySelectorAll('img[data-src]'));
    const currentIndex = allImages.indexOf(currentImg);

    if (currentIndex < allImages.length - 1) {
      const nextImg = allImages[currentIndex + 1];
      const preloadImg = new Image();
      preloadImg.src = nextImg.dataset.src;
    }
  }

  // Video Lazy Loading
  initVideoLazyLoad() {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadVideo(entry.target);
        } else {
          // Pause video when out of viewport
          if (entry.target.readyState >= 2) {
            entry.target.pause();
          }
        }
      });
    }, {
      rootMargin: this.options.rootMargin,
      threshold: this.options.threshold
    });

    this.observers.set('video', videoObserver);

    document.querySelectorAll('video[data-src]').forEach(video => {
      videoObserver.observe(video);
    });
  }

  loadVideo(video) {
    const startTime = performance.now();

    if (video.dataset.src) {
      video.src = video.dataset.src;
      delete video.dataset.src;
    }

    // Load poster image if exists
    if (video.dataset.poster) {
      video.poster = video.dataset.poster;
      delete video.dataset.poster;
    }

    // Add sources if they exist
    video.querySelectorAll('source[data-src]').forEach(source => {
      source.src = source.dataset.src;
      delete source.dataset.src;
    });

    video.load();

    video.addEventListener('loadeddata', () => {
      video.classList.add('lazy-loaded');
      const loadTime = performance.now() - startTime;
      this.trackResourceLoad('video', video.src, loadTime);
    });
  }

  // Iframe Lazy Loading
  initIframeLazyLoad() {
    const iframeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadIframe(entry.target);
        }
      });
    }, {
      rootMargin: '100px 0px',
      threshold: 0
    });

    this.observers.set('iframe', iframeObserver);

    document.querySelectorAll('iframe[data-src]').forEach(iframe => {
      iframeObserver.observe(iframe);

      // Add loading placeholder
      if (!iframe.querySelector('.iframe-placeholder')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'iframe-placeholder';
        placeholder.innerHTML = '<div class="loader">Loading...</div>';
        iframe.parentNode.insertBefore(placeholder, iframe);
      }
    });
  }

  loadIframe(iframe) {
    const startTime = performance.now();
    const placeholder = iframe.previousElementSibling;

    iframe.src = iframe.dataset.src;
    delete iframe.dataset.src;

    iframe.addEventListener('load', () => {
      iframe.classList.add('lazy-loaded');
      if (placeholder && placeholder.classList.contains('iframe-placeholder')) {
        placeholder.remove();
      }

      const loadTime = performance.now() - startTime;
      this.trackResourceLoad('iframe', iframe.src, loadTime);

      this.observers.get('iframe').unobserve(iframe);
    });
  }

  // Script Lazy Loading
  initScriptLazyLoad() {
    // Load scripts based on interaction or visibility
    document.querySelectorAll('[data-lazy-script]').forEach(trigger => {
      const scriptSrc = trigger.dataset.lazyScript;
      const loadOn = trigger.dataset.loadOn || 'click';

      if (loadOn === 'visible') {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadScript(scriptSrc);
              observer.unobserve(entry.target);
            }
          });
        }, { rootMargin: '200px' });

        observer.observe(trigger);
      } else if (loadOn === 'interaction') {
        ['click', 'touchstart', 'mouseenter'].forEach(event => {
          trigger.addEventListener(event, () => {
            this.loadScript(scriptSrc);
          }, { once: true });
        });
      } else {
        trigger.addEventListener(loadOn, () => {
          this.loadScript(scriptSrc);
        }, { once: true });
      }
    });
  }

  loadScript(src) {
    if (this.loadedResources.has(src)) {
      return Promise.resolve();
    }

    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;

      script.onload = () => {
        this.loadedResources.add(src);
        const loadTime = performance.now() - startTime;
        this.trackResourceLoad('script', src, loadTime);
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  }

  // Component Lazy Loading (for dynamic imports)
  initComponentLazyLoad() {
    window.lazyLoadComponent = (componentName, trigger = 'visible') => {
      const componentMap = {
        'charts': () => import('./charts.min.js'),
        'medical': () => import('./medical_dashboard.min.js'),
        '3d-viewer': () => import('./enhanced_3d_anatomy.min.js'),
        'ar-viewer': () => import('./ar_viewer.min.js'),
        'analytics': () => import('./analytics.min.js')
      };

      if (!componentMap[componentName]) {
        console.error(`Unknown component: ${componentName}`);
        return Promise.reject(new Error(`Unknown component: ${componentName}`));
      }

      // Check if already loaded
      if (this.loadedResources.has(componentName)) {
        return Promise.resolve(window[componentName]);
      }

      const startTime = performance.now();

      return componentMap[componentName]()
        .then(module => {
          this.loadedResources.add(componentName);
          window[componentName] = module.default || module;

          const loadTime = performance.now() - startTime;
          this.trackResourceLoad('component', componentName, loadTime);

          return module;
        })
        .catch(error => {
          console.error(`Failed to load component ${componentName}:`, error);
          throw error;
        });
    };

    // Auto-load components based on data attributes
    document.querySelectorAll('[data-component]').forEach(element => {
      const componentName = element.dataset.component;
      const loadTrigger = element.dataset.loadTrigger || 'visible';

      if (loadTrigger === 'visible') {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              window.lazyLoadComponent(componentName).then(module => {
                if (module.init) {
                  module.init(element);
                }
              });
              observer.unobserve(entry.target);
            }
          });
        }, { rootMargin: '100px' });

        observer.observe(element);
      } else if (loadTrigger === 'hover') {
        element.addEventListener('mouseenter', () => {
          window.lazyLoadComponent(componentName);
        }, { once: true });
      } else if (loadTrigger === 'click') {
        element.addEventListener('click', () => {
          window.lazyLoadComponent(componentName);
        }, { once: true });
      }
    });
  }

  // Prefetch Strategy
  initPrefetchStrategy() {
    if (!this.options.enablePrefetch) return;

    // Prefetch links on hover
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a[href]');
      if (link && !link.dataset.noPrefetch) {
        this.prefetchLink(link.href);
      }
    });

    // Prefetch visible links when idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.prefetchVisibleLinks();
      });
    }
  }

  prefetchLink(url) {
    if (this.loadedResources.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);

    this.loadedResources.add(url);
  }

  prefetchVisibleLinks() {
    const links = document.querySelectorAll('a[href]:not([data-no-prefetch])');
    const visibleLinks = Array.from(links).filter(link => {
      const rect = link.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });

    visibleLinks.forEach(link => {
      this.prefetchLink(link.href);
    });
  }

  // Performance Monitoring
  setupPerformanceMonitoring() {
    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {}

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            const delay = entry.processingStart - entry.startTime;
            console.log('FID:', delay);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {}

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              console.log('CLS:', clsValue);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {}
    }
  }

  trackResourceLoad(type, resource, loadTime) {
    this.performanceMetrics.totalLoaded++;
    this.performanceMetrics.totalTime += loadTime;
    this.performanceMetrics.resourceTimes.set(resource, {
      type,
      loadTime,
      timestamp: Date.now()
    });

    // Send metrics to analytics
    if (window.gtag) {
      window.gtag('event', 'lazy_load', {
        event_category: 'Performance',
        event_label: type,
        value: Math.round(loadTime)
      });
    }
  }

  // Utility Methods
  loadAllImages() {
    // Load all images for printing
    document.querySelectorAll('img[data-src]').forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
    });
  }

  getPerformanceReport() {
    const avgLoadTime = this.performanceMetrics.totalTime / this.performanceMetrics.totalLoaded || 0;

    return {
      totalResourcesLoaded: this.performanceMetrics.totalLoaded,
      averageLoadTime: avgLoadTime.toFixed(2),
      totalLoadTime: this.performanceMetrics.totalTime.toFixed(2),
      resourceBreakdown: Array.from(this.performanceMetrics.resourceTimes.entries()).map(([resource, data]) => ({
        resource: resource.substring(0, 50),
        type: data.type,
        loadTime: data.loadTime.toFixed(2)
      }))
    };
  }

  destroy() {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.loadedResources.clear();
    this.pendingLoads.clear();
  }
}

// Initialize lazy loading on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.lazyLoadManager = new LazyLoadManager({
      rootMargin: '50px 0px',
      threshold: 0.01,
      preloadNext: true,
      enablePrefetch: true
    });
  });
} else {
  window.lazyLoadManager = new LazyLoadManager({
    rootMargin: '50px 0px',
    threshold: 0.01,
    preloadNext: true,
    enablePrefetch: true
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoadManager;
}