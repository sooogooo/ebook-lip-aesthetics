/**
 * Compact Lightweight Component System for 绛唇解语花 Visualization
 * Micro-frontend architecture with advanced optimization
 */

// Performance utilities and micro-optimizations
const Performance = {
  // Memoization with weak references for memory efficiency
  memoize: (fn, keyFn = (...args) => JSON.stringify(args)) => {
    const cache = new Map();
    return (...args) => {
      const key = keyFn(...args);
      if (cache.has(key)) return cache.get(key);
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  },

  // Debounced function with immediate execution option
  debounce: (fn, delay, immediate = false) => {
    let timeoutId;
    return function (...args) {
      const callNow = immediate && !timeoutId;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (!immediate) fn.apply(this, args);
      }, delay);
      if (callNow) fn.apply(this, args);
    };
  },

  // Throttled function for high-frequency events
  throttle: (fn, limit) => {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // RAF-based animation loop for smooth rendering
  createAnimationLoop: (callback) => {
    let animationId;
    const loop = (timestamp) => {
      callback(timestamp);
      animationId = requestAnimationFrame(loop);
    };
    return {
      start: () => { animationId = requestAnimationFrame(loop); },
      stop: () => { cancelAnimationFrame(animationId); }
    };
  }
};

// Micro-frontend module loader with caching
class ModuleLoader {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
  }

  async load(modulePath, options = {}) {
    const { bust = false, timeout = 10000 } = options;
    const cacheKey = bust ? `${modulePath}?t=${Date.now()}` : modulePath;

    // Return cached module if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Return existing promise if already loading
    if (this.loading.has(cacheKey)) {
      return this.loading.get(cacheKey);
    }

    // Create loading promise with timeout
    const loadPromise = Promise.race([
      import(cacheKey),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Module load timeout: ${modulePath}`)), timeout)
      )
    ]).then(module => {
      this.cache.set(cacheKey, module);
      this.loading.delete(cacheKey);
      return module;
    }).catch(error => {
      this.loading.delete(cacheKey);
      throw error;
    });

    this.loading.set(cacheKey, loadPromise);
    return loadPromise;
  }

  preload(modules) {
    return Promise.allSettled(modules.map(module => this.load(module)));
  }

  clear(pattern) {
    if (pattern) {
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Lightweight state management with subscription
class MicroState {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.subscribers = new Set();
    this.history = [];
    this.maxHistory = 50;
  }

  getState() {
    return { ...this.state };
  }

  setState(updates, meta = {}) {
    const prevState = { ...this.state };

    if (typeof updates === 'function') {
      this.state = { ...this.state, ...updates(prevState) };
    } else {
      this.state = { ...this.state, ...updates };
    }

    // Add to history for debugging/undo
    this.history.push({
      timestamp: Date.now(),
      prevState,
      newState: { ...this.state },
      meta
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Notify subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(this.state, prevState, meta);
      } catch (error) {
        console.error('State subscriber error:', error);
      }
    });
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  undo() {
    if (this.history.length > 0) {
      const lastEntry = this.history.pop();
      this.state = { ...lastEntry.prevState };
      this.subscribers.forEach(callback => callback(this.state, lastEntry.newState, { undo: true }));
    }
  }
}

// React-style hooks implementation
const HookSystem = {
  currentComponent: null,
  hooks: new WeakMap(),
  hookIndex: 0,

  useState: (initialValue) => {
    const component = HookSystem.currentComponent;
    if (!component) throw new Error('useState must be called within a component');

    const hooks = HookSystem.hooks.get(component) || [];
    const index = HookSystem.hookIndex++;

    if (hooks[index] === undefined) {
      hooks[index] = {
        type: 'state',
        value: typeof initialValue === 'function' ? initialValue() : initialValue
      };
    }

    const setValue = (newValue) => {
      const hook = hooks[index];
      const nextValue = typeof newValue === 'function' ? newValue(hook.value) : newValue;
      if (hook.value !== nextValue) {
        hook.value = nextValue;
        component.forceUpdate?.();
      }
    };

    HookSystem.hooks.set(component, hooks);
    return [hooks[index].value, setValue];
  },

  useEffect: (effect, deps) => {
    const component = HookSystem.currentComponent;
    if (!component) throw new Error('useEffect must be called within a component');

    const hooks = HookSystem.hooks.get(component) || [];
    const index = HookSystem.hookIndex++;

    const hasChangedDeps = (prevDeps, nextDeps) => {
      if (prevDeps === null) return true;
      if (prevDeps.length !== nextDeps.length) return true;
      return prevDeps.some((dep, i) => dep !== nextDeps[i]);
    };

    const hook = hooks[index];
    if (!hook || hasChangedDeps(hook.deps, deps)) {
      if (hook?.cleanup) hook.cleanup();

      const cleanup = effect();
      hooks[index] = {
        type: 'effect',
        cleanup: typeof cleanup === 'function' ? cleanup : null,
        deps
      };
    }

    HookSystem.hooks.set(component, hooks);
  },

  useMemo: (factory, deps) => {
    const component = HookSystem.currentComponent;
    if (!component) throw new Error('useMemo must be called within a component');

    const hooks = HookSystem.hooks.get(component) || [];
    const index = HookSystem.hookIndex++;

    const hasChangedDeps = (prevDeps, nextDeps) => {
      if (prevDeps === null) return true;
      return prevDeps.some((dep, i) => dep !== nextDeps[i]);
    };

    const hook = hooks[index];
    if (!hook || hasChangedDeps(hook.deps, deps)) {
      hooks[index] = {
        type: 'memo',
        value: factory(),
        deps
      };
    }

    HookSystem.hooks.set(component, hooks);
    return hooks[index].value;
  },

  useCallback: (callback, deps) => {
    return HookSystem.useMemo(() => callback, deps);
  }
};

// Optimized Virtual DOM implementation
class VNode {
  constructor(type, props = {}, children = []) {
    this.type = type;
    this.props = props;
    this.children = Array.isArray(children) ? children : [children];
    this.key = props.key;
    this.ref = props.ref;
  }
}

// Create virtual node helper
const h = (type, props, ...children) => {
  return new VNode(type, props, children.flat().filter(Boolean));
};

// Optimized diffing and patching
class VirtualDOM {
  static patch(container, newVNode, oldVNode = null) {
    if (!oldVNode) {
      container.appendChild(VirtualDOM.createElement(newVNode));
      return;
    }

    if (!newVNode) {
      container.removeChild(container.firstChild);
      return;
    }

    if (VirtualDOM.changed(newVNode, oldVNode)) {
      container.replaceChild(
        VirtualDOM.createElement(newVNode),
        container.childNodes[0]
      );
      return;
    }

    if (newVNode.type) {
      VirtualDOM.updateElement(
        container.childNodes[0],
        newVNode,
        oldVNode
      );
    }
  }

  static changed(node1, node2) {
    return typeof node1 !== typeof node2 ||
           typeof node1 === 'string' && node1 !== node2 ||
           node1.type !== node2.type;
  }

  static createElement(vnode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return document.createTextNode(vnode);
    }

    const element = document.createElement(vnode.type);

    // Set properties
    Object.entries(vnode.props || {}).forEach(([key, value]) => {
      VirtualDOM.setAttribute(element, key, value);
    });

    // Append children
    vnode.children
      .map(VirtualDOM.createElement)
      .forEach(child => element.appendChild(child));

    return element;
  }

  static setAttribute(element, key, value) {
    if (key === 'className') {
      element.className = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventType = key.slice(2).toLowerCase();
      element.addEventListener(eventType, value);
    } else if (typeof value === 'boolean') {
      if (value) element.setAttribute(key, '');
      else element.removeAttribute(key);
    } else {
      element.setAttribute(key, value);
    }
  }

  static updateElement(element, newVNode, oldVNode) {
    // Update properties
    const newProps = newVNode.props || {};
    const oldProps = oldVNode.props || {};

    // Remove old properties
    Object.keys(oldProps).forEach(key => {
      if (!(key in newProps)) {
        if (key.startsWith('on')) {
          const eventType = key.slice(2).toLowerCase();
          element.removeEventListener(eventType, oldProps[key]);
        } else {
          element.removeAttribute(key);
        }
      }
    });

    // Set new properties
    Object.entries(newProps).forEach(([key, value]) => {
      if (oldProps[key] !== value) {
        VirtualDOM.setAttribute(element, key, value);
      }
    });

    // Update children
    const newLength = newVNode.children.length;
    const oldLength = oldVNode.children.length;

    for (let i = 0; i < Math.max(newLength, oldLength); i++) {
      VirtualDOM.patch(
        element,
        newVNode.children[i],
        oldVNode.children[i]
      );
    }
  }
}

// CSS-in-JS with optimization
class StyleManager {
  constructor() {
    this.sheet = this.createStyleSheet();
    this.cache = new Map();
    this.classCounter = 0;
  }

  createStyleSheet() {
    const style = document.createElement('style');
    style.type = 'text/css';
    document.head.appendChild(style);
    return style.sheet;
  }

  css(styles, props = {}) {
    const key = JSON.stringify({ styles, props });

    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const className = `css-${this.classCounter++}`;
    const cssText = this.processStyles(styles, props, className);

    this.sheet.insertRule(cssText, this.sheet.cssRules.length);
    this.cache.set(key, className);

    return className;
  }

  processStyles(styles, props, className) {
    let cssText = `.${className} {`;

    Object.entries(styles).forEach(([property, value]) => {
      if (typeof value === 'function') {
        value = value(props);
      }

      const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      cssText += `${cssProperty}: ${value};`;
    });

    cssText += '}';
    return cssText;
  }

  keyframes(frames) {
    const animationName = `animation-${this.classCounter++}`;
    let cssText = `@keyframes ${animationName} {`;

    Object.entries(frames).forEach(([percentage, styles]) => {
      cssText += `${percentage} {`;
      Object.entries(styles).forEach(([property, value]) => {
        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        cssText += `${cssProperty}: ${value};`;
      });
      cssText += '}';
    });

    cssText += '}';
    this.sheet.insertRule(cssText, this.sheet.cssRules.length);

    return animationName;
  }
}

// Compact Base Component with hooks
class CompactComponent {
  constructor(props = {}) {
    this.props = props;
    this.state = new MicroState(this.getInitialState());
    this.refs = new Map();
    this.mounted = false;
    this.updateScheduled = false;

    // Bind context for hooks
    this.forceUpdate = this.forceUpdate.bind(this);
  }

  getInitialState() {
    return {};
  }

  setState(updates, meta) {
    this.state.setState(updates, meta);
  }

  forceUpdate() {
    if (!this.updateScheduled && this.mounted) {
      this.updateScheduled = true;
      requestAnimationFrame(() => {
        this.updateScheduled = false;
        this.update();
      });
    }
  }

  mount(container) {
    this.container = container;
    this.mounted = true;

    // Subscribe to state changes
    this.unsubscribe = this.state.subscribe(() => this.forceUpdate());

    this.update();
    this.componentDidMount?.();
  }

  unmount() {
    this.componentWillUnmount?.();
    this.mounted = false;
    this.unsubscribe?.();

    // Cleanup hooks
    const hooks = HookSystem.hooks.get(this);
    if (hooks) {
      hooks.forEach(hook => {
        if (hook.type === 'effect' && hook.cleanup) {
          hook.cleanup();
        }
      });
      HookSystem.hooks.delete(this);
    }
  }

  update() {
    if (!this.mounted || !this.container) return;

    // Set current component for hooks
    HookSystem.currentComponent = this;
    HookSystem.hookIndex = 0;

    const newVNode = this.render();
    VirtualDOM.patch(this.container, newVNode, this.vnode);
    this.vnode = newVNode;

    // Clear hook context
    HookSystem.currentComponent = null;
    HookSystem.hookIndex = 0;
  }

  render() {
    throw new Error('render() must be implemented');
  }

  ref(name) {
    return (element) => {
      if (element) {
        this.refs.set(name, element);
      } else {
        this.refs.delete(name);
      }
    };
  }

  getRef(name) {
    return this.refs.get(name);
  }
}

// Optimized Chart Component
class CompactChart extends CompactComponent {
  getInitialState() {
    return {
      data: [],
      loading: false,
      error: null,
      selectedPoints: new Set(),
      zoomLevel: 1,
      panOffset: { x: 0, y: 0 }
    };
  }

  render() {
    const { data, loading, error } = this.state.getState();
    const { width = 400, height = 300, type = 'line' } = this.props;

    if (loading) {
      return h('div', { className: 'chart-loading' }, 'Loading...');
    }

    if (error) {
      return h('div', { className: 'chart-error' }, `Error: ${error}`);
    }

    return h('div', { className: 'compact-chart' }, [
      h('svg', {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
        ref: this.ref('svg'),
        onMouseMove: this.handleMouseMove.bind(this),
        onClick: this.handleClick.bind(this)
      }, this.renderChartContent())
    ]);
  }

  renderChartContent() {
    const { data } = this.state.getState();
    if (!data || data.length === 0) return [];

    return [
      this.renderGrid(),
      this.renderAxes(),
      this.renderData(),
      this.renderInteractions()
    ];
  }

  renderGrid() {
    const { width = 400, height = 300 } = this.props;
    const gridLines = [];

    // Vertical grid lines
    for (let x = 50; x < width - 50; x += 50) {
      gridLines.push(
        h('line', {
          x1: x, y1: 30, x2: x, y2: height - 30,
          stroke: '#e0e0e0',
          strokeWidth: 1
        })
      );
    }

    // Horizontal grid lines
    for (let y = 30; y < height - 30; y += 40) {
      gridLines.push(
        h('line', {
          x1: 50, y1: y, x2: width - 50, y2: y,
          stroke: '#e0e0e0',
          strokeWidth: 1
        })
      );
    }

    return h('g', { className: 'grid' }, gridLines);
  }

  renderAxes() {
    const { width = 400, height = 300 } = this.props;

    return h('g', { className: 'axes' }, [
      // X axis
      h('line', {
        x1: 50, y1: height - 30,
        x2: width - 50, y2: height - 30,
        stroke: '#333',
        strokeWidth: 2
      }),
      // Y axis
      h('line', {
        x1: 50, y1: 30,
        x2: 50, y2: height - 30,
        stroke: '#333',
        strokeWidth: 2
      })
    ]);
  }

  renderData() {
    const { data } = this.state.getState();
    const { type = 'line' } = this.props;

    switch (type) {
      case 'line':
        return this.renderLineChart(data);
      case 'bar':
        return this.renderBarChart(data);
      case 'scatter':
        return this.renderScatterPlot(data);
      default:
        return this.renderLineChart(data);
    }
  }

  renderLineChart(data) {
    if (data.length < 2) return [];

    const { width = 400, height = 300 } = this.props;
    const xScale = (width - 100) / (data.length - 1);
    const yMax = Math.max(...data.map(d => d.value));
    const yScale = (height - 60) / yMax;

    const pathData = data.map((point, i) => {
      const x = 50 + i * xScale;
      const y = height - 30 - point.value * yScale;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return [
      h('path', {
        d: pathData,
        fill: 'none',
        stroke: '#e91e63',
        strokeWidth: 2,
        strokeLinejoin: 'round',
        strokeLinecap: 'round'
      }),
      ...data.map((point, i) => {
        const x = 50 + i * xScale;
        const y = height - 30 - point.value * yScale;
        return h('circle', {
          cx: x, cy: y, r: 3,
          fill: '#e91e63',
          className: 'data-point',
          'data-index': i
        });
      })
    ];
  }

  renderBarChart(data) {
    const { width = 400, height = 300 } = this.props;
    const barWidth = (width - 100) / data.length * 0.8;
    const spacing = (width - 100) / data.length * 0.2;
    const yMax = Math.max(...data.map(d => d.value));

    return data.map((point, i) => {
      const x = 50 + i * (barWidth + spacing);
      const barHeight = (point.value / yMax) * (height - 60);
      const y = height - 30 - barHeight;

      return h('rect', {
        x, y,
        width: barWidth,
        height: barHeight,
        fill: '#2196f3',
        className: 'data-bar',
        'data-index': i
      });
    });
  }

  renderScatterPlot(data) {
    const { width = 400, height = 300 } = this.props;
    const xScale = (width - 100) / data.length;
    const yMax = Math.max(...data.map(d => d.value));
    const yScale = (height - 60) / yMax;

    return data.map((point, i) => {
      const x = 50 + i * xScale;
      const y = height - 30 - point.value * yScale;

      return h('circle', {
        cx: x, cy: y, r: 4,
        fill: '#4caf50',
        className: 'data-point',
        'data-index': i
      });
    });
  }

  renderInteractions() {
    return [];
  }

  handleMouseMove(event) {
    Performance.throttle(() => {
      // Tooltip logic
    }, 16)();
  }

  handleClick(event) {
    const target = event.target;
    const index = target.getAttribute('data-index');

    if (index !== null) {
      const selectedPoints = new Set(this.state.getState().selectedPoints);

      if (selectedPoints.has(parseInt(index))) {
        selectedPoints.delete(parseInt(index));
      } else {
        selectedPoints.add(parseInt(index));
      }

      this.setState({ selectedPoints });
    }
  }

  setData(data) {
    this.setState({
      data: Array.isArray(data) ? data : [],
      error: null
    });
  }
}

// Global instances
const moduleLoader = new ModuleLoader();
const styleManager = new StyleManager();
const globalState = new MicroState({
  theme: 'light',
  language: 'en',
  viewport: { width: window.innerWidth, height: window.innerHeight }
});

// Auto-update viewport on resize
window.addEventListener('resize', Performance.debounce(() => {
  globalState.setState({
    viewport: { width: window.innerWidth, height: window.innerHeight }
  });
}, 250));

// Export compact system
window.CompactSystem = {
  // Core classes
  CompactComponent,
  CompactChart,
  MicroState,

  // Utilities
  Performance,
  ModuleLoader: moduleLoader,
  StyleManager: styleManager,
  VirtualDOM,
  HookSystem,

  // Helpers
  h,
  css: styleManager.css.bind(styleManager),
  keyframes: styleManager.keyframes.bind(styleManager),

  // Global state
  globalState,

  // Factory function
  createComponent: (renderFn, initialState = {}) => {
    return class extends CompactComponent {
      getInitialState() {
        return initialState;
      }

      render() {
        return renderFn.call(this, this.props, this.state.getState());
      }
    };
  }
};

console.log('🚀 Compact Component System loaded');