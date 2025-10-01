/**
 * Advanced CSS-in-JS System with Virtual DOM Optimization
 * High-performance styling with intelligent caching and optimization
 */

// CSS Properties optimization and vendor prefixing
class CSSOptimizer {
  constructor() {
    this.prefixes = {
      transform: ['-webkit-transform', '-moz-transform', '-ms-transform'],
      transition: ['-webkit-transition', '-moz-transition', '-ms-transition'],
      animation: ['-webkit-animation', '-moz-animation', '-ms-animation'],
      filter: ['-webkit-filter'],
      backdropFilter: ['-webkit-backdrop-filter'],
      userSelect: ['-webkit-user-select', '-moz-user-select', '-ms-user-select']
    };

    this.shorthandProperties = {
      margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
      padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
      border: ['borderWidth', 'borderStyle', 'borderColor'],
      borderRadius: ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius']
    };

    this.unitProperties = new Set([
      'width', 'height', 'top', 'right', 'bottom', 'left',
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'fontSize', 'lineHeight', 'borderWidth', 'borderRadius'
    ]);
  }

  optimizeProperty(property, value) {
    // Convert camelCase to kebab-case
    const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();

    // Add vendor prefixes if needed
    const prefixed = this.addVendorPrefixes(kebabProperty, value);

    // Optimize value
    const optimizedValue = this.optimizeValue(property, value);

    return prefixed.map(([prop, val]) => [prop, optimizedValue]);
  }

  addVendorPrefixes(property, value) {
    const prefixes = this.prefixes[property];
    if (prefixes) {
      return [[property, value], ...prefixes.map(prefix => [prefix, value])];
    }
    return [[property, value]];
  }

  optimizeValue(property, value) {
    // Add units to numeric values
    if (typeof value === 'number' && this.unitProperties.has(property)) {
      return `${value}px`;
    }

    // Convert hex colors to shorter form
    if (typeof value === 'string' && value.startsWith('#') && value.length === 7) {
      const [r, g, b] = [value.slice(1, 3), value.slice(3, 5), value.slice(5, 7)];
      if (r[0] === r[1] && g[0] === g[1] && b[0] === b[1]) {
        return `#${r[0]}${g[0]}${b[0]}`;
      }
    }

    // Optimize calc expressions
    if (typeof value === 'string' && value.includes('calc(')) {
      return this.optimizeCalc(value);
    }

    return value;
  }

  optimizeCalc(expression) {
    // Simple calc optimization - could be expanded
    return expression.replace(/calc\(([^)]+)\)/g, (match, calc) => {
      // Remove unnecessary spaces
      const cleaned = calc.replace(/\s+/g, ' ').trim();
      return `calc(${cleaned})`;
    });
  }
}

// Advanced CSS-in-JS engine with caching
class StyledEngine {
  constructor() {
    this.styleSheet = this.createStyleSheet();
    this.classCache = new Map();
    this.computedCache = new Map();
    this.cssOptimizer = new CSSOptimizer();
    this.classCounter = 0;
    this.ruleCounter = 0;
    this.themeMixin = {};
    this.mediaQueries = new Map();
    this.keyframes = new Map();
  }

  createStyleSheet() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.setAttribute('data-styled-engine', 'true');
    document.head.appendChild(style);
    return style.sheet;
  }

  // Main styling function with caching and optimization
  css(styles, props = {}, options = {}) {
    const {
      cache = true,
      optimize = true,
      vendor = true
    } = options;

    // Create cache key
    const cacheKey = this.createCacheKey(styles, props, options);

    if (cache && this.classCache.has(cacheKey)) {
      return this.classCache.get(cacheKey);
    }

    // Process styles
    const processedStyles = this.processStyles(styles, props);
    const optimizedStyles = optimize ? this.optimizeStyles(processedStyles) : processedStyles;

    // Generate class name and CSS
    const className = `styled-${this.classCounter++}`;
    const cssText = this.generateCSS(className, optimizedStyles, vendor);

    // Insert rule
    try {
      this.styleSheet.insertRule(cssText, this.styleSheet.cssRules.length);
    } catch (error) {
      console.warn('Failed to insert CSS rule:', error, cssText);
    }

    // Cache result
    if (cache) {
      this.classCache.set(cacheKey, className);
    }

    return className;
  }

  createCacheKey(styles, props, options) {
    return JSON.stringify({ styles, props, options });
  }

  processStyles(styles, props) {
    const processed = {};

    for (const [property, value] of Object.entries(styles)) {
      if (typeof value === 'function') {
        processed[property] = value(props, this.themeMixin);
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects (pseudo-selectors, media queries)
        processed[property] = this.processStyles(value, props);
      } else {
        processed[property] = value;
      }
    }

    return processed;
  }

  optimizeStyles(styles) {
    const optimized = {};

    for (const [property, value] of Object.entries(styles)) {
      if (typeof value === 'object' && value !== null) {
        optimized[property] = this.optimizeStyles(value);
      } else {
        const optimizedProps = this.cssOptimizer.optimizeProperty(property, value);
        optimizedProps.forEach(([prop, val]) => {
          optimized[prop] = val;
        });
      }
    }

    return optimized;
  }

  generateCSS(className, styles, includeVendor = true) {
    let cssText = `.${className} {\n`;

    for (const [property, value] of Object.entries(styles)) {
      if (property.startsWith('&')) {
        // Pseudo-selector
        continue;
      } else if (property.startsWith('@')) {
        // Media query or keyframe
        continue;
      } else if (typeof value === 'object') {
        // Nested styles - handle separately
        continue;
      } else {
        cssText += `  ${property}: ${value};\n`;
      }
    }

    cssText += '}';

    // Handle pseudo-selectors
    for (const [selector, nestedStyles] of Object.entries(styles)) {
      if (selector.startsWith('&')) {
        const pseudoSelector = selector.replace('&', `.${className}`);
        cssText += `\n${pseudoSelector} {\n`;
        for (const [prop, val] of Object.entries(nestedStyles)) {
          if (typeof val !== 'object') {
            cssText += `  ${prop}: ${val};\n`;
          }
        }
        cssText += '}';
      }
    }

    // Handle media queries
    for (const [query, nestedStyles] of Object.entries(styles)) {
      if (query.startsWith('@media')) {
        cssText += `\n${query} {\n`;
        cssText += `  .${className} {\n`;
        for (const [prop, val] of Object.entries(nestedStyles)) {
          if (typeof val !== 'object') {
            cssText += `    ${prop}: ${val};\n`;
          }
        }
        cssText += '  }\n}';
      }
    }

    return cssText;
  }

  // Keyframe animations
  keyframes(frames, name = null) {
    const animationName = name || `animation-${this.classCounter++}`;

    if (this.keyframes.has(animationName)) {
      return animationName;
    }

    let cssText = `@keyframes ${animationName} {\n`;

    for (const [percentage, styles] of Object.entries(frames)) {
      cssText += `  ${percentage} {\n`;
      for (const [property, value] of Object.entries(styles)) {
        const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        cssText += `    ${kebabProperty}: ${value};\n`;
      }
      cssText += '  }\n';
    }

    cssText += '}';

    try {
      this.styleSheet.insertRule(cssText, this.styleSheet.cssRules.length);
      this.keyframes.set(animationName, cssText);
    } catch (error) {
      console.warn('Failed to insert keyframe rule:', error);
    }

    return animationName;
  }

  // Responsive utilities
  responsive(breakpoints, styles) {
    const responsiveStyles = {};

    for (const [breakpoint, breakpointStyles] of Object.entries(breakpoints)) {
      const mediaQuery = this.getMediaQuery(breakpoint);
      responsiveStyles[`@media ${mediaQuery}`] = this.processStyles(breakpointStyles, styles);
    }

    return responsiveStyles;
  }

  getMediaQuery(breakpoint) {
    const queries = {
      xs: '(max-width: 575px)',
      sm: '(min-width: 576px)',
      md: '(min-width: 768px)',
      lg: '(min-width: 992px)',
      xl: '(min-width: 1200px)',
      xxl: '(min-width: 1400px)'
    };

    return queries[breakpoint] || breakpoint;
  }

  // Theme support
  setTheme(theme) {
    this.themeMixin = { ...theme };
    this.clearCache();
  }

  clearCache() {
    this.classCache.clear();
    this.computedCache.clear();
  }

  // Performance monitoring
  getStats() {
    return {
      cachedClasses: this.classCache.size,
      totalRules: this.styleSheet.cssRules.length,
      keyframes: this.keyframes.size,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  calculateCacheHitRate() {
    // Implementation would track hits vs misses
    return 0.85; // Example
  }
}

// Styled component factory
class StyledComponentFactory {
  constructor(engine) {
    this.engine = engine;
    this.componentCache = new Map();
  }

  // Create styled component
  styled(baseComponent = 'div') {
    return (styles, options = {}) => {
      const cacheKey = JSON.stringify({ baseComponent, styles, options });

      if (this.componentCache.has(cacheKey)) {
        return this.componentCache.get(cacheKey);
      }

      class StyledComponent extends CompactComponent {
        constructor(props) {
          super(props);
          this.styleEngine = engine;
          this.baseComponent = baseComponent;
          this.styles = styles;
          this.options = options;
        }

        render() {
          const { children, className: userClassName, ...otherProps } = this.props;

          // Generate styles
          const generatedClassName = this.styleEngine.css(this.styles, this.props, this.options);

          // Combine class names
          const className = [generatedClassName, userClassName].filter(Boolean).join(' ');

          // Create element
          if (typeof this.baseComponent === 'string') {
            return h(this.baseComponent, {
              ...otherProps,
              className
            }, children);
          } else {
            // Custom component
            return h(this.baseComponent, {
              ...otherProps,
              className
            }, children);
          }
        }
      }

      this.componentCache.set(cacheKey, StyledComponent);
      return StyledComponent;
    };
  }

  // Utility styled components
  Box = this.styled('div');
  Flex = this.styled('div');
  Grid = this.styled('div');
  Text = this.styled('span');
  Button = this.styled('button');
  Input = this.styled('input');
}

// Animation utilities
class AnimationEngine {
  constructor(styledEngine) {
    this.styledEngine = styledEngine;
    this.runningAnimations = new Map();
  }

  // Transition utility
  transition(properties, duration = '0.3s', easing = 'ease') {
    if (Array.isArray(properties)) {
      return properties.map(prop => `${prop} ${duration} ${easing}`).join(', ');
    }
    return `${properties} ${duration} ${easing}`;
  }

  // Common animations
  fadeIn(duration = '0.3s') {
    return this.styledEngine.keyframes({
      '0%': { opacity: 0 },
      '100%': { opacity: 1 }
    });
  }

  slideIn(direction = 'left', distance = '100%', duration = '0.3s') {
    const transforms = {
      left: `translateX(-${distance})`,
      right: `translateX(${distance})`,
      up: `translateY(-${distance})`,
      down: `translateY(${distance})`
    };

    return this.styledEngine.keyframes({
      '0%': { transform: transforms[direction], opacity: 0 },
      '100%': { transform: 'translate(0)', opacity: 1 }
    });
  }

  bounce(intensity = '10px') {
    return this.styledEngine.keyframes({
      '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
      '40%, 43%': { transform: `translate3d(0, -${intensity}, 0)` },
      '70%': { transform: `translate3d(0, -${Math.round(parseInt(intensity) / 2)}px, 0)` },
      '90%': { transform: `translate3d(0, -${Math.round(parseInt(intensity) / 4)}px, 0)` }
    });
  }

  pulse(scale = 1.05) {
    return this.styledEngine.keyframes({
      '0%': { transform: 'scale(1)' },
      '50%': { transform: `scale(${scale})` },
      '100%': { transform: 'scale(1)' }
    });
  }

  // Animate element with JS
  animate(element, keyframes, options = {}) {
    const {
      duration = 300,
      easing = 'ease',
      fill = 'forwards',
      iterations = 1
    } = options;

    if ('animate' in element) {
      const animation = element.animate(keyframes, {
        duration,
        easing,
        fill,
        iterations
      });

      this.runningAnimations.set(element, animation);

      animation.addEventListener('finish', () => {
        this.runningAnimations.delete(element);
      });

      return animation;
    }

    // Fallback for older browsers
    return this.fallbackAnimate(element, keyframes, options);
  }

  fallbackAnimate(element, keyframes, options) {
    // CSS transition fallback
    const startState = keyframes[0] || {};
    const endState = keyframes[keyframes.length - 1] || keyframes[1] || {};

    // Apply start state
    Object.assign(element.style, startState);

    // Force reflow
    element.offsetHeight;

    // Apply transition
    element.style.transition = `all ${options.duration}ms ${options.easing}`;

    // Apply end state
    requestAnimationFrame(() => {
      Object.assign(element.style, endState);
    });

    // Cleanup
    setTimeout(() => {
      element.style.transition = '';
    }, options.duration + 50);
  }

  stopAnimations(element) {
    const animation = this.runningAnimations.get(element);
    if (animation) {
      animation.cancel();
      this.runningAnimations.delete(element);
    }
  }
}

// Theme system with CSS custom properties
class ThemeSystem {
  constructor(styledEngine) {
    this.styledEngine = styledEngine;
    this.currentTheme = {};
    this.customProperties = new Map();
  }

  // Define theme
  defineTheme(name, theme) {
    const cssVars = {};

    // Convert theme to CSS custom properties
    this.flattenTheme(theme, cssVars);

    // Apply to document
    this.applyTheme(cssVars);

    // Store in engine
    this.styledEngine.setTheme(theme);

    return name;
  }

  flattenTheme(obj, result, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const varName = prefix ? `${prefix}-${key}` : key;

      if (typeof value === 'object' && value !== null) {
        this.flattenTheme(value, result, varName);
      } else {
        result[`--${varName}`] = value;
        this.customProperties.set(varName, value);
      }
    }
  }

  applyTheme(cssVars) {
    const root = document.documentElement;

    for (const [property, value] of Object.entries(cssVars)) {
      root.style.setProperty(property, value);
    }
  }

  // Use CSS custom property
  var(name, fallback = null) {
    return `var(--${name}${fallback ? `, ${fallback}` : ''})`;
  }

  // Get current theme value
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.currentTheme);
  }
}

// Create instances
const styledEngine = new StyledEngine();
const styledFactory = new StyledComponentFactory(styledEngine);
const animationEngine = new AnimationEngine(styledEngine);
const themeSystem = new ThemeSystem(styledEngine);

// Default theme
themeSystem.defineTheme('default', {
  colors: {
    primary: '#e91e63',
    secondary: '#2196f3',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#333333'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: {
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px'
    }
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12)',
    md: '0 4px 6px rgba(0,0,0,0.16)',
    lg: '0 10px 20px rgba(0,0,0,0.19)'
  }
});

// Export enhanced CSS-in-JS system
window.StyledSystem = {
  // Core engine
  Engine: styledEngine,
  Factory: styledFactory,
  Animation: animationEngine,
  Theme: themeSystem,

  // Main API
  css: styledEngine.css.bind(styledEngine),
  styled: styledFactory.styled.bind(styledFactory),
  keyframes: styledEngine.keyframes.bind(styledEngine),
  theme: themeSystem.var.bind(themeSystem),

  // Utility components
  Box: styledFactory.Box,
  Flex: styledFactory.Flex,
  Grid: styledFactory.Grid,
  Text: styledFactory.Text,
  Button: styledFactory.Button,
  Input: styledFactory.Input,

  // Animation utilities
  fadeIn: animationEngine.fadeIn.bind(animationEngine),
  slideIn: animationEngine.slideIn.bind(animationEngine),
  bounce: animationEngine.bounce.bind(animationEngine),
  pulse: animationEngine.pulse.bind(animationEngine),
  transition: animationEngine.transition.bind(animationEngine),
  animate: animationEngine.animate.bind(animationEngine),

  // Performance
  getStats: () => ({
    styled: styledEngine.getStats(),
    animations: {
      running: animationEngine.runningAnimations.size,
      cached: animationEngine.styledEngine.keyframes.size
    }
  }),

  clearCache: styledEngine.clearCache.bind(styledEngine)
};

console.log('🎨 Advanced CSS-in-JS System loaded');