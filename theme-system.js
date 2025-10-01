/**
 * Dynamic Theme Switching System for 绛唇解语花 Visualization Platform
 * Advanced theme management with CSS custom properties and smooth transitions
 */

/**
 * Theme Configuration and Definitions
 */
const ThemeConfig = {
  LIGHT: {
    name: 'light',
    displayName: 'Light Theme',
    icon: '☀️',
    properties: {
      // Primary Colors
      '--primary-50': '#fce4ec',
      '--primary-100': '#f8bbd9',
      '--primary-200': '#f48fb1',
      '--primary-300': '#f06292',
      '--primary-400': '#ec407a',
      '--primary-500': '#e91e63',
      '--primary-600': '#d81b60',
      '--primary-700': '#c2185b',
      '--primary-800': '#ad1457',
      '--primary-900': '#880e4f',

      // Secondary Colors
      '--secondary-50': '#e3f2fd',
      '--secondary-100': '#bbdefb',
      '--secondary-200': '#90caf9',
      '--secondary-300': '#64b5f6',
      '--secondary-400': '#42a5f5',
      '--secondary-500': '#2196f3',
      '--secondary-600': '#1e88e5',
      '--secondary-700': '#1976d2',
      '--secondary-800': '#1565c0',
      '--secondary-900': '#0d47a1',

      // Surface Colors
      '--surface-primary': '#ffffff',
      '--surface-secondary': '#f8f9fa',
      '--surface-tertiary': '#e9ecef',
      '--surface-elevated': '#ffffff',
      '--surface-overlay': 'rgba(255, 255, 255, 0.9)',

      // Text Colors
      '--text-primary': '#212529',
      '--text-secondary': '#6c757d',
      '--text-tertiary': '#adb5bd',
      '--text-disabled': '#dee2e6',
      '--text-inverse': '#ffffff',

      // Border Colors
      '--border-primary': '#dee2e6',
      '--border-secondary': '#e9ecef',
      '--border-focus': '#0d6efd',
      '--border-error': '#dc3545',
      '--border-success': '#198754',

      // Background Colors
      '--background-primary': '#ffffff',
      '--background-secondary': '#f8f9fa',
      '--background-tertiary': '#e9ecef',
      '--background-gradient': 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',

      // Status Colors
      '--success-color': '#198754',
      '--warning-color': '#ffc107',
      '--error-color': '#dc3545',
      '--info-color': '#0dcaf0',

      // Shadows
      '--shadow-sm': '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
      '--shadow-md': '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
      '--shadow-lg': '0 1rem 3rem rgba(0, 0, 0, 0.175)',
      '--shadow-xl': '0 0 0 1px rgba(255,255,255,.05), 0 1px 0 rgba(255,255,255,.05), 0 1px 3px rgba(0,0,0,.1), 0 2px 6px rgba(0,0,0,.1), 0 4px 12px rgba(0,0,0,.1)',

      // Component specific
      '--chart-grid-color': '#e9ecef',
      '--chart-axis-color': '#6c757d',
      '--tooltip-bg': 'rgba(0, 0, 0, 0.9)',
      '--tooltip-text': '#ffffff'
    }
  },

  DARK: {
    name: 'dark',
    displayName: 'Dark Theme',
    icon: '🌙',
    properties: {
      // Primary Colors (adjusted for dark theme)
      '--primary-50': '#1a0a0f',
      '--primary-100': '#4a1429',
      '--primary-200': '#6a1e3a',
      '--primary-300': '#8a284b',
      '--primary-400': '#aa325c',
      '--primary-500': '#e91e63',
      '--primary-600': '#f06292',
      '--primary-700': '#f48fb1',
      '--primary-800': '#f8bbd9',
      '--primary-900': '#fce4ec',

      // Secondary Colors
      '--secondary-50': '#0a1929',
      '--secondary-100': '#1e3a5f',
      '--secondary-200': '#325b8f',
      '--secondary-300': '#467cbf',
      '--secondary-400': '#5a9def',
      '--secondary-500': '#2196f3',
      '--secondary-600': '#42a5f5',
      '--secondary-700': '#64b5f6',
      '--secondary-800': '#90caf9',
      '--secondary-900': '#bbdefb',

      // Surface Colors
      '--surface-primary': '#121212',
      '--surface-secondary': '#1e1e1e',
      '--surface-tertiary': '#2c2c2c',
      '--surface-elevated': '#252525',
      '--surface-overlay': 'rgba(0, 0, 0, 0.9)',

      // Text Colors
      '--text-primary': '#ffffff',
      '--text-secondary': '#b3b3b3',
      '--text-tertiary': '#808080',
      '--text-disabled': '#4d4d4d',
      '--text-inverse': '#000000',

      // Border Colors
      '--border-primary': '#404040',
      '--border-secondary': '#333333',
      '--border-focus': '#64b5f6',
      '--border-error': '#f87171',
      '--border-success': '#34d399',

      // Background Colors
      '--background-primary': '#121212',
      '--background-secondary': '#1e1e1e',
      '--background-tertiary': '#2c2c2c',
      '--background-gradient': 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',

      // Status Colors (adjusted for dark theme)
      '--success-color': '#34d399',
      '--warning-color': '#fbbf24',
      '--error-color': '#f87171',
      '--info-color': '#60a5fa',

      // Shadows (adapted for dark surfaces)
      '--shadow-sm': '0 0.125rem 0.25rem rgba(0, 0, 0, 0.5)',
      '--shadow-md': '0 0.5rem 1rem rgba(0, 0, 0, 0.3)',
      '--shadow-lg': '0 1rem 3rem rgba(0, 0, 0, 0.4)',
      '--shadow-xl': '0 0 0 1px rgba(255,255,255,.05), 0 1px 0 rgba(255,255,255,.05), 0 1px 3px rgba(0,0,0,.4), 0 2px 6px rgba(0,0,0,.4), 0 4px 12px rgba(0,0,0,.4)',

      // Component specific
      '--chart-grid-color': '#404040',
      '--chart-axis-color': '#b3b3b3',
      '--tooltip-bg': 'rgba(255, 255, 255, 0.9)',
      '--tooltip-text': '#000000'
    }
  },

  HIGH_CONTRAST: {
    name: 'high-contrast',
    displayName: 'High Contrast',
    icon: '⚫',
    properties: {
      // High contrast colors for accessibility
      '--primary-500': '#000000',
      '--primary-600': '#000000',
      '--primary-700': '#000000',

      '--surface-primary': '#ffffff',
      '--surface-secondary': '#ffffff',
      '--surface-tertiary': '#ffffff',

      '--text-primary': '#000000',
      '--text-secondary': '#000000',
      '--text-tertiary': '#000000',

      '--border-primary': '#000000',
      '--border-secondary': '#000000',
      '--border-focus': '#0000ff',

      '--background-primary': '#ffffff',
      '--background-secondary': '#ffffff',
      '--background-tertiary': '#ffffff',

      '--success-color': '#008000',
      '--warning-color': '#ff8c00',
      '--error-color': '#ff0000',
      '--info-color': '#0000ff',

      '--shadow-sm': 'none',
      '--shadow-md': '0 0 0 2px #000000',
      '--shadow-lg': '0 0 0 3px #000000',
      '--shadow-xl': '0 0 0 4px #000000'
    }
  },

  AUTO: {
    name: 'auto',
    displayName: 'Auto (System)',
    icon: '🌓',
    properties: {} // Will be populated based on system preference
  }
};

/**
 * Advanced Theme Manager
 */
class AdvancedThemeManager {
  constructor() {
    this.currentTheme = 'auto';
    this.customThemes = new Map();
    this.observers = new Set();
    this.transitionDuration = 300;
    this.storageKey = 'viz-theme-preference';

    this.init();
  }

  init() {
    this.loadSavedTheme();
    this.setupSystemThemeListener();
    this.createThemeTransitionCSS();
    this.setupThemeController();
    this.applyTheme(this.currentTheme);
  }

  /**
   * Load saved theme preference
   */
  loadSavedTheme() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved && ThemeConfig[saved.toUpperCase()]) {
        this.currentTheme = saved;
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    }
  }

  /**
   * Save theme preference
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  /**
   * Setup system theme change listener
   */
  setupSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme === 'auto') {
        this.applySystemTheme(e.matches);
      }
    });

    // Setup high contrast listener
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    highContrastQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.setTheme('high-contrast');
      }
    });

    // Setup reduced motion listener
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      this.setAnimationsEnabled(!e.matches);
    });
  }

  /**
   * Create CSS for smooth theme transitions
   */
  createThemeTransitionCSS() {
    const style = document.createElement('style');
    style.id = 'theme-transitions';
    style.textContent = `
      :root {
        --theme-transition-duration: ${this.transitionDuration}ms;
        --theme-transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
      }

      * {
        transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
        transition-duration: var(--theme-transition-duration);
        transition-timing-function: var(--theme-transition-easing);
      }

      /* Disable transitions during theme switch */
      .theme-switching * {
        transition: none !important;
      }

      /* Theme-specific animations */
      .theme-fade-in {
        animation: themeFadeIn var(--theme-transition-duration) var(--theme-transition-easing);
      }

      @keyframes themeFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* Dark theme specific styles */
      [data-theme="dark"] .theme-invert {
        filter: invert(1) hue-rotate(180deg);
      }

      /* High contrast specific styles */
      [data-theme="high-contrast"] * {
        text-shadow: none !important;
        box-shadow: none !important;
      }

      [data-theme="high-contrast"] img,
      [data-theme="high-contrast"] video {
        filter: contrast(150%) brightness(150%);
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Setup theme controller UI
   */
  setupThemeController() {
    // Create floating theme controller
    const controller = document.createElement('div');
    controller.id = 'theme-controller';
    controller.className = 'theme-controller';
    controller.innerHTML = `
      <button class="theme-controller-toggle" aria-label="Theme Settings">
        <span class="theme-icon">🎨</span>
      </button>
      <div class="theme-controller-panel">
        <h3>Theme Settings</h3>
        <div class="theme-options">
          ${Object.entries(ThemeConfig).map(([key, config]) => `
            <button
              class="theme-option"
              data-theme="${config.name}"
              aria-label="Switch to ${config.displayName}"
            >
              <span class="theme-option-icon">${config.icon}</span>
              <span class="theme-option-name">${config.displayName}</span>
            </button>
          `).join('')}
        </div>
        <div class="theme-controls">
          <label class="theme-control">
            <input type="range" id="theme-contrast" min="80" max="150" value="100" />
            <span>Contrast</span>
          </label>
          <label class="theme-control">
            <input type="range" id="theme-saturation" min="50" max="150" value="100" />
            <span>Saturation</span>
          </label>
          <label class="theme-control">
            <input type="checkbox" id="theme-animations" checked />
            <span>Animations</span>
          </label>
        </div>
        <button class="theme-reset-btn">Reset to Defaults</button>
      </div>
    `;

    // Add styles for theme controller
    const controllerStyles = document.createElement('style');
    controllerStyles.textContent = `
      .theme-controller {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
      }

      .theme-controller-toggle {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--primary-500);
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        transition: all 300ms ease;
      }

      .theme-controller-toggle:hover {
        transform: scale(1.1);
        box-shadow: var(--shadow-xl);
      }

      .theme-controller-panel {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 280px;
        background: var(--surface-elevated);
        border-radius: 12px;
        padding: 20px;
        box-shadow: var(--shadow-xl);
        transform: scale(0) translateY(20px);
        opacity: 0;
        visibility: hidden;
        transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .theme-controller.active .theme-controller-panel {
        transform: scale(1) translateY(0);
        opacity: 1;
        visibility: visible;
      }

      .theme-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin: 16px 0;
      }

      .theme-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border: 2px solid var(--border-secondary);
        border-radius: 8px;
        background: var(--surface-secondary);
        cursor: pointer;
        transition: all 200ms ease;
      }

      .theme-option:hover {
        border-color: var(--primary-500);
        background: var(--primary-50);
      }

      .theme-option.active {
        border-color: var(--primary-500);
        background: var(--primary-100);
      }

      .theme-controls {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .theme-control {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .theme-reset-btn {
        width: 100%;
        padding: 8px;
        margin-top: 12px;
        border: 1px solid var(--border-primary);
        border-radius: 6px;
        background: var(--surface-secondary);
        cursor: pointer;
      }
    `;

    document.head.appendChild(controllerStyles);
    document.body.appendChild(controller);

    // Setup event listeners
    this.setupControllerEvents(controller);
  }

  /**
   * Setup theme controller event listeners
   */
  setupControllerEvents(controller) {
    const toggle = controller.querySelector('.theme-controller-toggle');
    const panel = controller.querySelector('.theme-controller-panel');
    const options = controller.querySelectorAll('.theme-option');
    const contrastSlider = controller.querySelector('#theme-contrast');
    const saturationSlider = controller.querySelector('#theme-saturation');
    const animationsToggle = controller.querySelector('#theme-animations');
    const resetBtn = controller.querySelector('.theme-reset-btn');

    // Toggle panel
    toggle.addEventListener('click', () => {
      controller.classList.toggle('active');
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!controller.contains(e.target)) {
        controller.classList.remove('active');
      }
    });

    // Theme option selection
    options.forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        this.setTheme(theme);
        this.updateActiveThemeOption(options, option);
      });
    });

    // Contrast control
    contrastSlider.addEventListener('input', (e) => {
      this.setContrast(e.target.value);
    });

    // Saturation control
    saturationSlider.addEventListener('input', (e) => {
      this.setSaturation(e.target.value);
    });

    // Animations toggle
    animationsToggle.addEventListener('change', (e) => {
      this.setAnimationsEnabled(e.target.checked);
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
      this.resetToDefaults();
    });

    // Update active theme option on load
    const activeOption = controller.querySelector(`[data-theme="${this.currentTheme}"]`);
    if (activeOption) {
      this.updateActiveThemeOption(options, activeOption);
    }
  }

  /**
   * Update active theme option visual state
   */
  updateActiveThemeOption(options, activeOption) {
    options.forEach(option => option.classList.remove('active'));
    activeOption.classList.add('active');
  }

  /**
   * Set theme
   */
  setTheme(theme) {
    if (theme === this.currentTheme) return;

    this.currentTheme = theme;
    this.saveTheme(theme);
    this.applyTheme(theme);
    this.notifyObservers();
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    // Add switching class to disable transitions temporarily
    document.documentElement.classList.add('theme-switching');

    // Determine actual theme to apply
    let themeToApply = theme;
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeToApply = prefersDark ? 'dark' : 'light';
    }

    // Apply theme data attribute
    document.documentElement.setAttribute('data-theme', themeToApply);

    // Get theme configuration
    const config = ThemeConfig[themeToApply.toUpperCase()];
    if (config && config.properties) {
      this.applyCSSProperties(config.properties);
    }

    // Apply custom theme if exists
    if (this.customThemes.has(themeToApply)) {
      const customConfig = this.customThemes.get(themeToApply);
      this.applyCSSProperties(customConfig.properties);
    }

    // Remove switching class after a brief delay
    setTimeout(() => {
      document.documentElement.classList.remove('theme-switching');
    }, 50);

    // Emit theme change event
    this.emit('theme:changed', { theme: themeToApply, originalTheme: theme });
  }

  /**
   * Apply system theme based on media query
   */
  applySystemTheme(isDark) {
    const systemTheme = isDark ? 'dark' : 'light';
    const config = ThemeConfig[systemTheme.toUpperCase()];

    if (config && config.properties) {
      this.applyCSSProperties(config.properties);
    }

    document.documentElement.setAttribute('data-theme', systemTheme);
  }

  /**
   * Apply CSS custom properties
   */
  applyCSSProperties(properties) {
    const root = document.documentElement;

    Object.entries(properties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  /**
   * Create custom theme
   */
  createCustomTheme(name, config) {
    this.customThemes.set(name, {
      name,
      displayName: config.displayName || name,
      icon: config.icon || '🎨',
      properties: config.properties || {}
    });

    this.emit('theme:custom-created', { name, config });
  }

  /**
   * Set contrast level
   */
  setContrast(level) {
    const contrastValue = level / 100;
    document.documentElement.style.setProperty('--theme-contrast', contrastValue);
    document.documentElement.style.filter = `contrast(${contrastValue})`;
  }

  /**
   * Set saturation level
   */
  setSaturation(level) {
    const saturationValue = level / 100;
    document.documentElement.style.setProperty('--theme-saturation', saturationValue);

    const currentFilter = document.documentElement.style.filter || '';
    const newFilter = currentFilter.replace(/saturate\([^)]*\)/g, '') + ` saturate(${saturationValue})`;
    document.documentElement.style.filter = newFilter.trim();
  }

  /**
   * Enable/disable animations
   */
  setAnimationsEnabled(enabled) {
    if (enabled) {
      document.documentElement.classList.remove('reduce-motion');
    } else {
      document.documentElement.classList.add('reduce-motion');
    }

    // Add CSS rule for reduced motion
    if (!document.getElementById('reduce-motion-styles')) {
      const style = document.createElement('style');
      style.id = 'reduce-motion-styles';
      style.textContent = `
        .reduce-motion * {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Reset to default settings
   */
  resetToDefaults() {
    this.setTheme('auto');
    this.setContrast(100);
    this.setSaturation(100);
    this.setAnimationsEnabled(true);

    // Reset sliders in UI
    document.getElementById('theme-contrast').value = 100;
    document.getElementById('theme-saturation').value = 100;
    document.getElementById('theme-animations').checked = true;
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Notify observers of theme changes
   */
  notifyObservers() {
    this.observers.forEach(callback => {
      callback(this.currentTheme);
    });
  }

  /**
   * Emit custom events
   */
  emit(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  /**
   * Get current theme info
   */
  getCurrentTheme() {
    return {
      name: this.currentTheme,
      config: ThemeConfig[this.currentTheme.toUpperCase()],
      isCustom: this.customThemes.has(this.currentTheme)
    };
  }

  /**
   * Get all available themes
   */
  getAvailableThemes() {
    const builtin = Object.values(ThemeConfig);
    const custom = Array.from(this.customThemes.values());
    return [...builtin, ...custom];
  }
}

// Create global theme manager instance
const advancedThemeManager = new AdvancedThemeManager();

// Export theme system
window.ThemeSystem = {
  ThemeManager: advancedThemeManager,
  ThemeConfig,
  AdvancedThemeManager
};

// Integration with existing systems
if (window.StateManagement) {
  window.StateManagement.GlobalStateManager.setState({
    currentTheme: advancedThemeManager.currentTheme
  });

  // Subscribe to theme changes and update state
  advancedThemeManager.subscribe((theme) => {
    window.StateManagement.GlobalStateManager.setState({
      currentTheme: theme
    });
  });
}

console.log('🎨 Dynamic Theme Switching System initialized');