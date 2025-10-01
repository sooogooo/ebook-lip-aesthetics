/**
 * Advanced React-style Hooks and Context System
 * Complete hooks implementation with context providers and custom hooks
 */

// Context system for state sharing
class Context {
  constructor(defaultValue) {
    this.defaultValue = defaultValue;
    this.providers = new Set();
    this.consumers = new Set();
  }

  // Create provider component
  Provider(value) {
    return class ContextProvider extends CompactComponent {
      constructor(props) {
        super(props);
        this.context = new Context(value);
        this.value = value;
      }

      componentDidMount() {
        this.context.providers.add(this);
      }

      componentWillUnmount() {
        this.context.providers.delete(this);
      }

      updateValue(newValue) {
        this.value = newValue;
        this.notifyConsumers();
      }

      notifyConsumers() {
        this.context.consumers.forEach(consumer => {
          if (consumer.mounted) {
            consumer.forceUpdate();
          }
        });
      }

      render() {
        return h('div', { 'data-context-provider': true }, this.props.children);
      }

      getValue() {
        return this.value;
      }
    };
  }

  // Create consumer hook
  useContext() {
    const component = HookSystem.currentComponent;
    if (!component) {
      throw new Error('useContext must be called within a component');
    }

    // Find nearest provider
    let provider = null;
    let element = component.container?.parentElement;

    while (element && !provider) {
      if (element.hasAttribute('data-context-provider')) {
        // Find provider instance (simplified lookup)
        provider = this.findProviderForElement(element);
      }
      element = element.parentElement;
    }

    // Register consumer
    this.consumers.add(component);

    // Cleanup on unmount
    const originalUnmount = component.componentWillUnmount;
    component.componentWillUnmount = () => {
      this.consumers.delete(component);
      if (originalUnmount) originalUnmount.call(component);
    };

    return provider ? provider.getValue() : this.defaultValue;
  }

  findProviderForElement(element) {
    // Simplified provider lookup - in real implementation,
    // you'd maintain a mapping of elements to providers
    return Array.from(this.providers).find(p =>
      p.container === element || p.container?.contains(element)
    );
  }
}

// Enhanced hook system with more React-like features
const AdvancedHookSystem = {
  currentComponent: null,
  hooks: new WeakMap(),
  hookIndex: 0,
  effectQueue: [],
  layoutEffectQueue: [],
  isUpdating: false,

  // useState with lazy initialization and functional updates
  useState: (initialValue) => {
    const component = AdvancedHookSystem.currentComponent;
    if (!component) throw new Error('useState must be called within a component');

    const hooks = AdvancedHookSystem.hooks.get(component) || [];
    const index = AdvancedHookSystem.hookIndex++;

    if (hooks[index] === undefined) {
      const value = typeof initialValue === 'function' ? initialValue() : initialValue;
      hooks[index] = {
        type: 'state',
        value,
        setValue: null // Will be set below
      };
    }

    const hook = hooks[index];

    if (!hook.setValue) {
      hook.setValue = (newValue) => {
        const nextValue = typeof newValue === 'function' ? newValue(hook.value) : newValue;

        if (!Object.is(hook.value, nextValue)) {
          hook.value = nextValue;
          AdvancedHookSystem.scheduleUpdate(component);
        }
      };
    }

    AdvancedHookSystem.hooks.set(component, hooks);
    return [hook.value, hook.setValue];
  },

  // useEffect with cleanup and dependency array
  useEffect: (effect, deps) => {
    const component = AdvancedHookSystem.currentComponent;
    if (!component) throw new Error('useEffect must be called within a component');

    const hooks = AdvancedHookSystem.hooks.get(component) || [];
    const index = AdvancedHookSystem.hookIndex++;

    const hasChangedDeps = (prevDeps, nextDeps) => {
      if (prevDeps === null) return true;
      if (prevDeps.length !== nextDeps.length) return true;
      return prevDeps.some((dep, i) => !Object.is(dep, nextDeps[i]));
    };

    const hook = hooks[index];
    const hasChanged = !hook || hasChangedDeps(hook.deps, deps);

    if (hasChanged) {
      // Cleanup previous effect
      if (hook?.cleanup && typeof hook.cleanup === 'function') {
        hook.cleanup();
      }

      // Queue new effect
      const effectFn = () => {
        const cleanup = effect();
        hooks[index] = {
          type: 'effect',
          cleanup: typeof cleanup === 'function' ? cleanup : null,
          deps: deps ? [...deps] : null
        };
      };

      AdvancedHookSystem.effectQueue.push(effectFn);
    }

    AdvancedHookSystem.hooks.set(component, hooks);
  },

  // useLayoutEffect (synchronous effect)
  useLayoutEffect: (effect, deps) => {
    const component = AdvancedHookSystem.currentComponent;
    if (!component) throw new Error('useLayoutEffect must be called within a component');

    const hooks = AdvancedHookSystem.hooks.get(component) || [];
    const index = AdvancedHookSystem.hookIndex++;

    const hasChangedDeps = (prevDeps, nextDeps) => {
      if (prevDeps === null) return true;
      if (prevDeps.length !== nextDeps.length) return true;
      return prevDeps.some((dep, i) => !Object.is(dep, nextDeps[i]));
    };

    const hook = hooks[index];
    const hasChanged = !hook || hasChangedDeps(hook.deps, deps);

    if (hasChanged) {
      if (hook?.cleanup && typeof hook.cleanup === 'function') {
        hook.cleanup();
      }

      const effectFn = () => {
        const cleanup = effect();
        hooks[index] = {
          type: 'layoutEffect',
          cleanup: typeof cleanup === 'function' ? cleanup : null,
          deps: deps ? [...deps] : null
        };
      };

      AdvancedHookSystem.layoutEffectQueue.push(effectFn);
    }

    AdvancedHookSystem.hooks.set(component, hooks);
  },

  // useMemo with dependency tracking
  useMemo: (factory, deps) => {
    const component = AdvancedHookSystem.currentComponent;
    if (!component) throw new Error('useMemo must be called within a component');

    const hooks = AdvancedHookSystem.hooks.get(component) || [];
    const index = AdvancedHookSystem.hookIndex++;

    const hasChangedDeps = (prevDeps, nextDeps) => {
      if (prevDeps === null) return true;
      return prevDeps.some((dep, i) => !Object.is(dep, nextDeps[i]));
    };

    const hook = hooks[index];
    const hasChanged = !hook || hasChangedDeps(hook.deps, deps);

    if (hasChanged) {
      hooks[index] = {
        type: 'memo',
        value: factory(),
        deps: [...deps]
      };
    }

    AdvancedHookSystem.hooks.set(component, hooks);
    return hooks[index].value;
  },

  // useCallback - memoized callback
  useCallback: (callback, deps) => {
    return AdvancedHookSystem.useMemo(() => callback, deps);
  },

  // useRef - mutable ref object
  useRef: (initialValue) => {
    const component = AdvancedHookSystem.currentComponent;
    if (!component) throw new Error('useRef must be called within a component');

    const hooks = AdvancedHookSystem.hooks.get(component) || [];
    const index = AdvancedHookSystem.hookIndex++;

    if (hooks[index] === undefined) {
      hooks[index] = {
        type: 'ref',
        current: initialValue
      };
    }

    AdvancedHookSystem.hooks.set(component, hooks);
    return hooks[index];
  },

  // useReducer - state management with reducer
  useReducer: (reducer, initialState, init) => {
    const component = AdvancedHookSystem.currentComponent;
    if (!component) throw new Error('useReducer must be called within a component');

    const hooks = AdvancedHookSystem.hooks.get(component) || [];
    const index = AdvancedHookSystem.hookIndex++;

    if (hooks[index] === undefined) {
      const state = init ? init(initialState) : initialState;
      hooks[index] = {
        type: 'reducer',
        state,
        dispatch: null // Will be set below
      };
    }

    const hook = hooks[index];

    if (!hook.dispatch) {
      hook.dispatch = (action) => {
        const nextState = reducer(hook.state, action);
        if (!Object.is(hook.state, nextState)) {
          hook.state = nextState;
          AdvancedHookSystem.scheduleUpdate(component);
        }
      };
    }

    AdvancedHookSystem.hooks.set(component, hooks);
    return [hook.state, hook.dispatch];
  },

  // useContext - access context value
  useContext: (context) => {
    return context.useContext();
  },

  // Custom hooks
  useLocalStorage: (key, initialValue) => {
    const [value, setValue] = AdvancedHookSystem.useState(() => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return initialValue;
      }
    });

    const setStoredValue = AdvancedHookSystem.useCallback((value) => {
      try {
        setValue(value);
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }, [key]);

    return [value, setStoredValue];
  },

  usePrevious: (value) => {
    const ref = AdvancedHookSystem.useRef();
    AdvancedHookSystem.useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  },

  useDebounce: (value, delay) => {
    const [debouncedValue, setDebouncedValue] = AdvancedHookSystem.useState(value);

    AdvancedHookSystem.useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  },

  useThrottle: (value, limit) => {
    const [throttledValue, setThrottledValue] = AdvancedHookSystem.useState(value);
    const lastRan = AdvancedHookSystem.useRef(Date.now());

    AdvancedHookSystem.useEffect(() => {
      const handler = setTimeout(() => {
        if (Date.now() - lastRan.current >= limit) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      }, limit - (Date.now() - lastRan.current));

      return () => {
        clearTimeout(handler);
      };
    }, [value, limit]);

    return throttledValue;
  },

  useAsync: (asyncFunction, dependencies = []) => {
    const [state, setState] = AdvancedHookSystem.useState({
      data: null,
      loading: true,
      error: null
    });

    AdvancedHookSystem.useEffect(() => {
      let cancelled = false;

      setState({ data: null, loading: true, error: null });

      asyncFunction()
        .then(data => {
          if (!cancelled) {
            setState({ data, loading: false, error: null });
          }
        })
        .catch(error => {
          if (!cancelled) {
            setState({ data: null, loading: false, error });
          }
        });

      return () => {
        cancelled = true;
      };
    }, dependencies);

    return state;
  },

  useResizeObserver: (ref, callback) => {
    AdvancedHookSystem.useEffect(() => {
      if (!ref.current || !window.ResizeObserver) return;

      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);

      return () => observer.disconnect();
    }, [ref, callback]);
  },

  useIntersectionObserver: (ref, options = {}) => {
    const [isIntersecting, setIsIntersecting] = AdvancedHookSystem.useState(false);

    AdvancedHookSystem.useEffect(() => {
      if (!ref.current || !window.IntersectionObserver) return;

      const observer = new IntersectionObserver(([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      }, options);

      observer.observe(ref.current);

      return () => observer.disconnect();
    }, [ref, options]);

    return isIntersecting;
  },

  // Animation hook
  useAnimation: (fromValue, toValue, duration = 300, easing = 'ease') => {
    const [value, setValue] = AdvancedHookSystem.useState(fromValue);
    const animationRef = AdvancedHookSystem.useRef();

    const animate = AdvancedHookSystem.useCallback(() => {
      const startTime = performance.now();
      const startValue = value;
      const change = toValue - startValue;

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Simple easing functions
        let easedProgress = progress;
        switch (easing) {
          case 'ease-out':
            easedProgress = 1 - Math.pow(1 - progress, 2);
            break;
          case 'ease-in':
            easedProgress = Math.pow(progress, 2);
            break;
          case 'ease-in-out':
            easedProgress = progress < 0.5 ? 2 * Math.pow(progress, 2) : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            break;
        }

        const currentValue = startValue + change * easedProgress;
        setValue(currentValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(step);
        }
      };

      animationRef.current = requestAnimationFrame(step);
    }, [value, toValue, duration, easing]);

    AdvancedHookSystem.useEffect(() => {
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, []);

    return [value, animate];
  },

  // Schedule component update
  scheduleUpdate: (component) => {
    if (!AdvancedHookSystem.isUpdating && component.mounted) {
      AdvancedHookSystem.isUpdating = true;
      requestAnimationFrame(() => {
        AdvancedHookSystem.isUpdating = false;
        AdvancedHookSystem.flushEffects();
        component.forceUpdate();
      });
    }
  },

  // Flush effect queues
  flushEffects: () => {
    // Run layout effects synchronously
    while (AdvancedHookSystem.layoutEffectQueue.length > 0) {
      const effect = AdvancedHookSystem.layoutEffectQueue.shift();
      effect();
    }

    // Run regular effects asynchronously
    if (AdvancedHookSystem.effectQueue.length > 0) {
      setTimeout(() => {
        while (AdvancedHookSystem.effectQueue.length > 0) {
          const effect = AdvancedHookSystem.effectQueue.shift();
          effect();
        }
      }, 0);
    }
  },

  // Cleanup hooks for component
  cleanup: (component) => {
    const hooks = AdvancedHookSystem.hooks.get(component);
    if (hooks) {
      hooks.forEach(hook => {
        if (hook.type === 'effect' && hook.cleanup) {
          hook.cleanup();
        }
      });
      AdvancedHookSystem.hooks.delete(component);
    }
  }
};

// Enhanced component base class with hooks support
class HookComponent extends CompactComponent {
  constructor(props) {
    super(props);
    this.hookSystem = AdvancedHookSystem;
  }

  update() {
    if (!this.mounted || !this.container) return;

    // Set current component for hooks
    AdvancedHookSystem.currentComponent = this;
    AdvancedHookSystem.hookIndex = 0;

    try {
      const newVNode = this.render();
      VirtualDOM.patch(this.container, newVNode, this.vnode);
      this.vnode = newVNode;

      // Flush effects after render
      AdvancedHookSystem.flushEffects();
    } finally {
      // Clear hook context
      AdvancedHookSystem.currentComponent = null;
      AdvancedHookSystem.hookIndex = 0;
    }
  }

  unmount() {
    AdvancedHookSystem.cleanup(this);
    super.unmount();
  }

  // Hook methods for convenience
  useState = AdvancedHookSystem.useState;
  useEffect = AdvancedHookSystem.useEffect;
  useLayoutEffect = AdvancedHookSystem.useLayoutEffect;
  useMemo = AdvancedHookSystem.useMemo;
  useCallback = AdvancedHookSystem.useCallback;
  useRef = AdvancedHookSystem.useRef;
  useReducer = AdvancedHookSystem.useReducer;
  useContext = AdvancedHookSystem.useContext;
  useLocalStorage = AdvancedHookSystem.useLocalStorage;
  usePrevious = AdvancedHookSystem.usePrevious;
  useDebounce = AdvancedHookSystem.useDebounce;
  useThrottle = AdvancedHookSystem.useThrottle;
  useAsync = AdvancedHookSystem.useAsync;
  useResizeObserver = AdvancedHookSystem.useResizeObserver;
  useIntersectionObserver = AdvancedHookSystem.useIntersectionObserver;
  useAnimation = AdvancedHookSystem.useAnimation;
}

// Create context helper
function createContext(defaultValue) {
  return new Context(defaultValue);
}

// Higher-order component for context consumption
function withContext(ContextComponent, contextProp = 'context') {
  return function WithContextComponent(WrappedComponent) {
    return class extends HookComponent {
      render() {
        const contextValue = this.useContext(ContextComponent);
        const props = {
          ...this.props,
          [contextProp]: contextValue
        };
        return h(WrappedComponent, props);
      }
    };
  };
}

// Example contexts
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});

const UserContext = createContext({
  user: null,
  login: () => {},
  logout: () => {}
});

// Theme provider component
class ThemeProvider extends HookComponent {
  render() {
    const [theme, setTheme] = this.useState(this.props.initialTheme || 'light');

    const contextValue = this.useMemo(() => ({
      theme,
      toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light'),
      setTheme
    }), [theme]);

    const Provider = ThemeContext.Provider(contextValue);
    return h(Provider, {}, this.props.children);
  }
}

// Export enhanced hook system
window.HookSystem = {
  // Core hooks
  ...AdvancedHookSystem,

  // Components
  HookComponent,
  ThemeProvider,

  // Context utilities
  createContext,
  withContext,
  ThemeContext,
  UserContext,

  // Factory for hook-based components
  createHookComponent: (renderFn) => {
    return class extends HookComponent {
      render() {
        return renderFn.call(this, this.props);
      }
    };
  }
};

// Update global compact system to use enhanced hooks
if (window.CompactSystem) {
  window.CompactSystem.HookComponent = HookComponent;
  window.CompactSystem.createHookComponent = window.HookSystem.createHookComponent;
  window.CompactSystem.createContext = createContext;
}

console.log('🎣 Advanced Hook System loaded');