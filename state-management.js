/**
 * Advanced State Management System for 绛唇解语花 Visualization Platform
 * React-style Context API and custom hooks implementation for vanilla JavaScript
 */

/**
 * State Container - Central state management with reactive updates
 */
class StateContainer {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.subscribers = new Map();
    this.computedValues = new Map();
    this.middleware = [];
    this.history = [];
    this.maxHistorySize = 50;
    this.debugMode = false;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  /**
   * Subscribe to any state change
   */
  subscribeAll(callback) {
    return this.subscribe('*', callback);
  }

  /**
   * Set state with reactive updates
   */
  setState(updates, meta = {}) {
    const prevState = { ...this.state };
    const changes = {};

    // Apply middleware
    let processedUpdates = updates;
    for (const middleware of this.middleware) {
      processedUpdates = middleware(processedUpdates, prevState, meta);
    }

    // Apply updates
    Object.entries(processedUpdates).forEach(([key, value]) => {
      if (this.state[key] !== value) {
        changes[key] = { from: this.state[key], to: value };
        this.state[key] = value;
      }
    });

    // Save to history
    if (Object.keys(changes).length > 0) {
      this.saveToHistory(prevState, this.state, changes, meta);

      // Notify subscribers
      this.notifySubscribers(changes, prevState, this.state, meta);

      // Update computed values
      this.updateComputedValues(changes);

      if (this.debugMode) {
        console.log('State updated:', { changes, prevState, newState: this.state });
      }
    }

    return this.state;
  }

  /**
   * Get current state or specific key
   */
  getState(key) {
    return key ? this.state[key] : { ...this.state };
  }

  /**
   * Add computed value that updates when dependencies change
   */
  addComputed(key, computeFn, dependencies = []) {
    this.computedValues.set(key, {
      compute: computeFn,
      dependencies,
      value: computeFn(this.state),
      stale: false
    });

    // Subscribe to dependency changes
    dependencies.forEach(dep => {
      this.subscribe(dep, () => {
        const computed = this.computedValues.get(key);
        if (computed) {
          computed.stale = true;
        }
      });
    });

    return this.getComputed(key);
  }

  /**
   * Get computed value
   */
  getComputed(key) {
    const computed = this.computedValues.get(key);
    if (!computed) return undefined;

    if (computed.stale) {
      computed.value = computed.compute(this.state);
      computed.stale = false;
    }

    return computed.value;
  }

  /**
   * Add middleware for state processing
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Time travel - go back to previous state
   */
  undo() {
    if (this.history.length < 2) return false;

    const current = this.history.pop();
    const previous = this.history[this.history.length - 1];

    this.state = { ...previous.state };
    this.notifySubscribers({}, current.state, this.state, { action: 'undo' });

    return true;
  }

  /**
   * Clear state and history
   */
  reset(newState = {}) {
    const prevState = { ...this.state };
    this.state = { ...newState };
    this.history = [];
    this.notifySubscribers({}, prevState, this.state, { action: 'reset' });
  }

  /**
   * Internal methods
   */
  saveToHistory(prevState, newState, changes, meta) {
    this.history.push({
      timestamp: Date.now(),
      state: { ...prevState },
      changes,
      meta
    });

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  notifySubscribers(changes, prevState, newState, meta) {
    // Notify specific key subscribers
    Object.keys(changes).forEach(key => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.forEach(callback => {
          callback(newState[key], prevState[key], { key, changes, meta });
        });
      }
    });

    // Notify global subscribers
    const globalSubs = this.subscribers.get('*');
    if (globalSubs) {
      globalSubs.forEach(callback => {
        callback(newState, prevState, { changes, meta });
      });
    }
  }

  updateComputedValues(changes) {
    this.computedValues.forEach((computed, key) => {
      const shouldUpdate = computed.dependencies.some(dep => changes.hasOwnProperty(dep));
      if (shouldUpdate) {
        computed.stale = true;
      }
    });
  }

  enableDebug(enabled = true) {
    this.debugMode = enabled;
  }
}

/**
 * React-style Context for state sharing
 */
class StateContext {
  constructor(initialState = {}, options = {}) {
    this.container = new StateContainer(initialState);
    this.providers = new Set();
    this.options = {
      persistKey: options.persistKey,
      autoSave: options.autoSave !== false,
      ...options
    };

    if (this.options.persistKey) {
      this.loadFromStorage();
      if (this.options.autoSave) {
        this.container.subscribeAll(() => this.saveToStorage());
      }
    }
  }

  /**
   * Create a provider component
   */
  createProvider(container) {
    const provider = new StateProvider(this.container, container);
    this.providers.add(provider);
    return provider;
  }

  /**
   * Use state hook
   */
  useState(key, defaultValue) {
    return new StateHook(this.container, key, defaultValue);
  }

  /**
   * Use reducer hook
   */
  useReducer(reducer, initialState) {
    return new ReducerHook(this.container, reducer, initialState);
  }

  /**
   * Use effect hook
   */
  useEffect(effect, dependencies = []) {
    return new EffectHook(this.container, effect, dependencies);
  }

  /**
   * Use computed hook
   */
  useComputed(computeFn, dependencies = []) {
    return new ComputedHook(this.container, computeFn, dependencies);
  }

  /**
   * Persistence methods
   */
  saveToStorage() {
    if (this.options.persistKey && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.options.persistKey, JSON.stringify(this.container.getState()));
      } catch (error) {
        console.warn('Failed to save state to localStorage:', error);
      }
    }
  }

  loadFromStorage() {
    if (this.options.persistKey && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.options.persistKey);
        if (saved) {
          const state = JSON.parse(saved);
          this.container.setState(state, { action: 'load_from_storage' });
        }
      } catch (error) {
        console.warn('Failed to load state from localStorage:', error);
      }
    }
  }
}

/**
 * State Provider - Provides context to components
 */
class StateProvider {
  constructor(container, domContainer) {
    this.container = container;
    this.domContainer = domContainer;
    this.childComponents = new Set();

    this.setupProvider();
  }

  setupProvider() {
    if (this.domContainer) {
      this.domContainer.setAttribute('data-state-provider', 'true');
      this.domContainer.stateContext = this;
    }
  }

  registerComponent(component) {
    this.childComponents.add(component);
    component.stateProvider = this;
  }

  unregisterComponent(component) {
    this.childComponents.delete(component);
    delete component.stateProvider;
  }

  getContainer() {
    return this.container;
  }
}

/**
 * State Hook - useState equivalent
 */
class StateHook {
  constructor(container, key, defaultValue) {
    this.container = container;
    this.key = key;
    this.defaultValue = defaultValue;
    this.unsubscribe = null;
    this.listeners = new Set();

    // Initialize if key doesn't exist
    if (this.container.getState(key) === undefined && defaultValue !== undefined) {
      this.container.setState({ [key]: defaultValue });
    }
  }

  /**
   * Get current value
   */
  getValue() {
    const value = this.container.getState(this.key);
    return value !== undefined ? value : this.defaultValue;
  }

  /**
   * Set new value
   */
  setValue(value) {
    const newValue = typeof value === 'function' ? value(this.getValue()) : value;
    this.container.setState({ [this.key]: newValue });
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback) {
    this.listeners.add(callback);

    if (!this.unsubscribe) {
      this.unsubscribe = this.container.subscribe(this.key, (newValue, oldValue, meta) => {
        this.listeners.forEach(listener => listener(newValue, oldValue, meta));
      });
    }

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0 && this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
    };
  }

  /**
   * Returns [value, setValue] tuple
   */
  use() {
    return [this.getValue(), this.setValue.bind(this)];
  }
}

/**
 * Reducer Hook - useReducer equivalent
 */
class ReducerHook {
  constructor(container, reducer, initialState) {
    this.container = container;
    this.reducer = reducer;
    this.stateKey = `reducer_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize state
    this.container.setState({ [this.stateKey]: initialState });
  }

  dispatch(action) {
    const currentState = this.container.getState(this.stateKey);
    const newState = this.reducer(currentState, action);
    this.container.setState({ [this.stateKey]: newState }, { action: 'reducer_dispatch', ...action });
  }

  getState() {
    return this.container.getState(this.stateKey);
  }

  subscribe(callback) {
    return this.container.subscribe(this.stateKey, callback);
  }

  use() {
    return [this.getState(), this.dispatch.bind(this)];
  }
}

/**
 * Effect Hook - useEffect equivalent
 */
class EffectHook {
  constructor(container, effect, dependencies = []) {
    this.container = container;
    this.effect = effect;
    this.dependencies = dependencies;
    this.cleanup = null;
    this.unsubscribes = [];
    this.lastValues = {};

    this.setupEffect();
  }

  setupEffect() {
    // Initial effect run
    this.runEffect();

    // Subscribe to dependency changes
    if (this.dependencies.length > 0) {
      this.dependencies.forEach(dep => {
        const unsubscribe = this.container.subscribe(dep, () => {
          this.checkAndRunEffect();
        });
        this.unsubscribes.push(unsubscribe);
      });
    } else {
      // No dependencies - subscribe to all changes
      const unsubscribe = this.container.subscribeAll(() => {
        this.runEffect();
      });
      this.unsubscribes.push(unsubscribe);
    }
  }

  checkAndRunEffect() {
    const currentValues = this.dependencies.reduce((acc, dep) => {
      acc[dep] = this.container.getState(dep);
      return acc;
    }, {});

    const hasChanged = this.dependencies.some(dep =>
      currentValues[dep] !== this.lastValues[dep]
    );

    if (hasChanged) {
      this.runEffect();
      this.lastValues = currentValues;
    }
  }

  runEffect() {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }

    const result = this.effect(this.container.getState());
    if (typeof result === 'function') {
      this.cleanup = result;
    }
  }

  destroy() {
    if (this.cleanup) {
      this.cleanup();
    }
    this.unsubscribes.forEach(unsubscribe => unsubscribe());
  }
}

/**
 * Computed Hook - useMemo equivalent
 */
class ComputedHook {
  constructor(container, computeFn, dependencies = []) {
    this.container = container;
    this.computeFn = computeFn;
    this.dependencies = dependencies;
    this.memoizedValue = null;
    this.isStale = true;

    this.setupComputed();
  }

  setupComputed() {
    // Initial computation
    this.recompute();

    // Subscribe to dependency changes
    this.dependencies.forEach(dep => {
      this.container.subscribe(dep, () => {
        this.isStale = true;
      });
    });
  }

  recompute() {
    this.memoizedValue = this.computeFn(this.container.getState());
    this.isStale = false;
  }

  getValue() {
    if (this.isStale) {
      this.recompute();
    }
    return this.memoizedValue;
  }
}

/**
 * Middleware functions
 */
const StateMiddleware = {
  // Logging middleware
  logger: (updates, prevState, meta) => {
    console.group(`State Update: ${meta.action || 'setState'}`);
    console.log('Previous State:', prevState);
    console.log('Updates:', updates);
    console.log('Meta:', meta);
    console.groupEnd();
    return updates;
  },

  // Validation middleware
  validator: (schema) => (updates, prevState, meta) => {
    Object.entries(updates).forEach(([key, value]) => {
      if (schema[key] && !schema[key](value)) {
        throw new Error(`Validation failed for key "${key}" with value:`, value);
      }
    });
    return updates;
  },

  // Immutability middleware
  immutable: (updates, prevState, meta) => {
    return JSON.parse(JSON.stringify(updates));
  },

  // Debounce middleware
  debounce: (delay = 100) => {
    const timeouts = new Map();
    return (updates, prevState, meta) => {
      Object.keys(updates).forEach(key => {
        if (timeouts.has(key)) {
          clearTimeout(timeouts.get(key));
        }
        timeouts.set(key, setTimeout(() => {
          timeouts.delete(key);
        }, delay));
      });
      return updates;
    };
  },

  // Persistence middleware
  persist: (storageKey) => (updates, prevState, meta) => {
    if (typeof localStorage !== 'undefined') {
      const newState = { ...prevState, ...updates };
      localStorage.setItem(storageKey, JSON.stringify(newState));
    }
    return updates;
  }
};

/**
 * Component State Mixin - Adds state management to components
 */
const StateMixin = {
  initializeState(context) {
    this.stateContext = context;
    this.stateHooks = new Map();
    this.effectHooks = new Set();
    this.cleanupFunctions = new Set();
  },

  useState(key, defaultValue) {
    if (!this.stateHooks.has(key)) {
      const hook = this.stateContext.useState(key, defaultValue);
      this.stateHooks.set(key, hook);

      // Auto-subscribe for reactivity
      const unsubscribe = hook.subscribe((newValue, oldValue) => {
        if (this.onStateChange) {
          this.onStateChange(key, newValue, oldValue);
        }
        if (this.render) {
          this.render();
        }
      });

      this.cleanupFunctions.add(unsubscribe);
    }

    return this.stateHooks.get(key).use();
  },

  useEffect(effect, dependencies) {
    const effectHook = new EffectHook(this.stateContext.container, effect, dependencies);
    this.effectHooks.add(effectHook);
    this.cleanupFunctions.add(() => effectHook.destroy());
  },

  useComputed(computeFn, dependencies) {
    const computedHook = new ComputedHook(this.stateContext.container, computeFn, dependencies);
    return computedHook.getValue.bind(computedHook);
  },

  cleanupState() {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions.clear();
    this.stateHooks.clear();
    this.effectHooks.clear();
  }
};

/**
 * Global State Manager - Singleton for application-wide state
 */
class GlobalStateManager {
  constructor() {
    this.contexts = new Map();
    this.defaultContext = new StateContext({
      theme: 'light',
      user: null,
      loading: false,
      notifications: [],
      selectedComponent: null,
      viewMode: 'grid',
      filters: {},
      searchQuery: '',
      favorites: new Set(),
      settings: {
        animations: true,
        autoSave: true,
        notifications: true
      }
    }, {
      persistKey: 'app_state',
      autoSave: true
    });

    this.setupGlobalMiddleware();
  }

  setupGlobalMiddleware() {
    // Add global middleware
    this.defaultContext.container.use(StateMiddleware.immutable);
    this.defaultContext.container.use(StateMiddleware.logger);
  }

  createContext(name, initialState, options) {
    const context = new StateContext(initialState, options);
    this.contexts.set(name, context);
    return context;
  }

  getContext(name) {
    return name ? this.contexts.get(name) : this.defaultContext;
  }

  // Global state shortcuts
  useState(key, defaultValue) {
    return this.defaultContext.useState(key, defaultValue);
  }

  useReducer(reducer, initialState) {
    return this.defaultContext.useReducer(reducer, initialState);
  }

  useEffect(effect, dependencies) {
    return this.defaultContext.useEffect(effect, dependencies);
  }

  useComputed(computeFn, dependencies) {
    return this.defaultContext.useComputed(computeFn, dependencies);
  }

  // Utility methods
  getState(key) {
    return this.defaultContext.container.getState(key);
  }

  setState(updates, meta) {
    return this.defaultContext.container.setState(updates, meta);
  }

  subscribe(key, callback) {
    return this.defaultContext.container.subscribe(key, callback);
  }

  subscribeAll(callback) {
    return this.defaultContext.container.subscribeAll(callback);
  }
}

// Create global instance
const globalStateManager = new GlobalStateManager();

// Export everything
window.StateManagement = {
  StateContainer,
  StateContext,
  StateProvider,
  StateHook,
  ReducerHook,
  EffectHook,
  ComputedHook,
  StateMiddleware,
  StateMixin,
  GlobalStateManager: globalStateManager
};

// Auto-setup for existing components
document.addEventListener('DOMContentLoaded', () => {
  // Find and enhance existing components with state management
  const components = document.querySelectorAll('[data-component]');
  components.forEach(component => {
    if (!component.stateContext) {
      const provider = globalStateManager.defaultContext.createProvider(component);
      component.stateContext = globalStateManager.defaultContext;
    }
  });
});

console.log('🔄 Advanced State Management System initialized');