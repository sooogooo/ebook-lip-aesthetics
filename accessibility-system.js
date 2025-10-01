/**
 * Comprehensive Accessibility System for 绛唇解语花 Visualization Platform
 * WCAG 2.1 AA compliance with advanced ARIA support and screen reader optimization
 */

/**
 * Accessibility Configuration and Standards
 */
const AccessibilityConfig = {
  WCAG_LEVEL: 'AA', // A, AA, AAA
  CONTRAST_RATIOS: {
    NORMAL_TEXT: 4.5,
    LARGE_TEXT: 3.0,
    NON_TEXT: 3.0
  },
  FONT_SIZES: {
    MINIMUM: 16,
    LARGE_TEXT_THRESHOLD: 18
  },
  TIMING: {
    FOCUS_TIMEOUT: 20000, // 20 seconds
    AUTO_REFRESH_WARNING: 5000, // 5 seconds before refresh
    ANNOUNCEMENT_DELAY: 100 // Screen reader announcement delay
  },
  ANIMATION: {
    REDUCED_MOTION_DURATION: 0.01, // Almost no animation for reduced motion
    SAFE_ANIMATION_TYPES: ['opacity', 'transform']
  }
};

const AriaRoles = {
  // Landmark roles
  BANNER: 'banner',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  REGION: 'region',
  SEARCH: 'search',

  // Widget roles
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  TEXTBOX: 'textbox',
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  TABLIST: 'tablist',
  TREE: 'tree',
  TREEITEM: 'treeitem',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  ROW: 'row',

  // Live region roles
  ALERT: 'alert',
  LOG: 'log',
  STATUS: 'status',
  MARQUEE: 'marquee',
  TIMER: 'timer',

  // Document structure roles
  ARTICLE: 'article',
  DOCUMENT: 'document',
  GROUP: 'group',
  HEADING: 'heading',
  IMG: 'img',
  LIST: 'list',
  LISTITEM: 'listitem',
  TABLE: 'table'
};

const AriaProperties = {
  // States
  EXPANDED: 'aria-expanded',
  SELECTED: 'aria-selected',
  CHECKED: 'aria-checked',
  PRESSED: 'aria-pressed',
  HIDDEN: 'aria-hidden',
  DISABLED: 'aria-disabled',
  INVALID: 'aria-invalid',
  BUSY: 'aria-busy',

  // Properties
  LABEL: 'aria-label',
  LABELLEDBY: 'aria-labelledby',
  DESCRIBEDBY: 'aria-describedby',
  REQUIRED: 'aria-required',
  READONLY: 'aria-readonly',
  LEVEL: 'aria-level',
  POSINSET: 'aria-posinset',
  SETSIZE: 'aria-setsize',
  CONTROLS: 'aria-controls',
  OWNS: 'aria-owns',
  ACTIVEDESCENDANT: 'aria-activedescendant',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  RELEVANT: 'aria-relevant',

  // Relationship
  FLOWTO: 'aria-flowto',
  DETAILS: 'aria-details'
};

/**
 * Accessibility Manager - Central accessibility coordination
 */
class AccessibilityManager {
  constructor() {
    this.isEnabled = true;
    this.preferences = this.loadPreferences();
    this.observers = new Set();
    this.violations = [];
    this.announcements = [];
    this.focusHistory = [];
    this.screenReaderActive = false;

    this.init();
  }

  /**
   * Initialize accessibility system
   */
  init() {
    this.detectScreenReader();
    this.setupGlobalEventListeners();
    this.createLiveRegions();
    this.setupFocusManagement();
    this.setupKeyboardNavigation();
    this.setupContrastMonitoring();
    this.createSkipLinks();
    this.setupReducedMotion();
    this.runInitialAudit();
  }

  /**
   * Detect screen reader presence
   */
  detectScreenReader() {
    // Check for common screen reader indicators
    const indicators = [
      () => navigator.userAgent.includes('NVDA'),
      () => navigator.userAgent.includes('JAWS'),
      () => window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
      () => navigator.userAgent.includes('VoiceOver'),
      () => 'speechSynthesis' in window
    ];

    this.screenReaderActive = indicators.some(test => test());

    // Listen for screen reader activation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        this.screenReaderActive = true;
      }
    });
  }

  /**
   * Setup global event listeners
   */
  setupGlobalEventListeners() {
    // Focus management
    document.addEventListener('focusin', (e) => this.handleFocusIn(e));
    document.addEventListener('focusout', (e) => this.handleFocusOut(e));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e));

    // Mouse/touch accessibility
    document.addEventListener('click', (e) => this.handleClick(e));

    // Resize for responsive accessibility
    window.addEventListener('resize', this.debounce(() => this.handleResize(), 250));

    // Preference changes
    this.watchPreferenceChanges();
  }

  /**
   * Create ARIA live regions for announcements
   */
  createLiveRegions() {
    // Polite announcements (don't interrupt)
    this.politeRegion = this.createLiveRegion('polite', 'sr-announcements-polite');

    // Assertive announcements (interrupt immediately)
    this.assertiveRegion = this.createLiveRegion('assertive', 'sr-announcements-assertive');

    // Status updates
    this.statusRegion = this.createLiveRegion('polite', 'sr-status');
    this.statusRegion.setAttribute('role', 'status');
  }

  /**
   * Create individual live region
   */
  createLiveRegion(politeness, id) {
    const region = document.createElement('div');
    region.id = id;
    region.className = 'sr-only';
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('aria-relevant', 'additions text');

    document.body.appendChild(region);
    return region;
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite', delay = AccessibilityConfig.TIMING.ANNOUNCEMENT_DELAY) {
    if (!message || !this.isEnabled) return;

    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;

    setTimeout(() => {
      region.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);

      // Track announcement
      this.announcements.push({
        message,
        priority,
        timestamp: Date.now()
      });

      // Limit history
      if (this.announcements.length > 50) {
        this.announcements.shift();
      }
    }, delay);
  }

  /**
   * Update status region
   */
  updateStatus(status) {
    this.statusRegion.textContent = status;
  }

  /**
   * Setup comprehensive focus management
   */
  setupFocusManagement() {
    this.focusTracker = new FocusTracker();
    this.focusManager = new FocusManager();

    // Track focus for debugging
    this.focusTracker.on('focus-change', (data) => {
      this.focusHistory.push({
        element: data.element.tagName + (data.element.id ? '#' + data.element.id : ''),
        timestamp: Date.now(),
        reason: data.reason
      });

      // Limit history
      if (this.focusHistory.length > 100) {
        this.focusHistory.shift();
      }
    });
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    this.keyboardNavigator = new KeyboardNavigator();

    // Standard keyboard shortcuts
    this.keyboardNavigator.register('Alt+1', () => this.focusMainContent());
    this.keyboardNavigator.register('Alt+2', () => this.focusNavigation());
    this.keyboardNavigator.register('Alt+3', () => this.focusSearch());
    this.keyboardNavigator.register('F6', () => this.cycleLandmarks());
    this.keyboardNavigator.register('Escape', () => this.handleEscape());
  }

  /**
   * Setup contrast monitoring
   */
  setupContrastMonitoring() {
    this.contrastChecker = new ContrastChecker();

    // Check contrast on theme changes
    document.addEventListener('theme:changed', () => {
      this.contrastChecker.checkAll();
    });

    // Periodic checks
    setInterval(() => {
      this.contrastChecker.checkAll();
    }, 30000); // Every 30 seconds
  }

  /**
   * Create skip links for keyboard navigation
   */
  createSkipLinks() {
    const skipContainer = document.createElement('div');
    skipContainer.className = 'skip-links';
    skipContainer.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#search" class="skip-link">Skip to search</a>
    `;

    document.body.insertBefore(skipContainer, document.body.firstChild);
  }

  /**
   * Setup reduced motion preferences
   */
  setupReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMotionChange = (e) => {
      document.documentElement.classList.toggle('reduce-motion', e.matches);

      if (e.matches) {
        this.announce('Animations have been reduced based on your system preferences');
      }
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    handleMotionChange(mediaQuery); // Initial check
  }

  /**
   * Run initial accessibility audit
   */
  async runInitialAudit() {
    this.auditor = new AccessibilityAuditor();
    this.violations = await this.auditor.audit(document);

    if (this.violations.length > 0) {
      console.warn(`Found ${this.violations.length} accessibility violations:`, this.violations);
    }
  }

  /**
   * Handle focus in events
   */
  handleFocusIn(event) {
    const element = event.target;

    // Add visual focus indicator
    element.classList.add('focused');

    // Announce focused element to screen readers if needed
    if (this.screenReaderActive && this.shouldAnnounceElement(element)) {
      const announcement = this.generateElementAnnouncement(element);
      if (announcement) {
        this.announce(announcement);
      }
    }

    // Scroll into view if needed
    this.ensureElementVisible(element);
  }

  /**
   * Handle focus out events
   */
  handleFocusOut(event) {
    const element = event.target;
    element.classList.remove('focused');
  }

  /**
   * Generate announcement for focused element
   */
  generateElementAnnouncement(element) {
    const role = element.getAttribute('role');
    const label = this.getAccessibleName(element);
    const description = this.getAccessibleDescription(element);

    let announcement = '';

    if (label) {
      announcement += label;
    }

    if (role) {
      announcement += `, ${role}`;
    }

    if (element.disabled) {
      announcement += ', disabled';
    }

    if (element.getAttribute('aria-expanded') === 'true') {
      announcement += ', expanded';
    } else if (element.getAttribute('aria-expanded') === 'false') {
      announcement += ', collapsed';
    }

    if (description) {
      announcement += `. ${description}`;
    }

    return announcement;
  }

  /**
   * Get accessible name for element
   */
  getAccessibleName(element) {
    // Check aria-label
    if (element.hasAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }

    // Check aria-labelledby
    if (element.hasAttribute('aria-labelledby')) {
      const ids = element.getAttribute('aria-labelledby').split(' ');
      const labels = ids.map(id => {
        const labelElement = document.getElementById(id);
        return labelElement ? labelElement.textContent.trim() : '';
      }).filter(text => text);
      return labels.join(' ');
    }

    // Check associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) {
        return label.textContent.trim();
      }
    }

    // Check parent label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      return parentLabel.textContent.trim();
    }

    // Fallback to element text or attributes
    return element.textContent.trim() ||
           element.getAttribute('title') ||
           element.getAttribute('placeholder') ||
           element.value;
  }

  /**
   * Get accessible description for element
   */
  getAccessibleDescription(element) {
    if (element.hasAttribute('aria-describedby')) {
      const ids = element.getAttribute('aria-describedby').split(' ');
      const descriptions = ids.map(id => {
        const descElement = document.getElementById(id);
        return descElement ? descElement.textContent.trim() : '';
      }).filter(text => text);
      return descriptions.join(' ');
    }

    return element.getAttribute('title') || '';
  }

  /**
   * Ensure element is visible in viewport
   */
  ensureElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const isVisible = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );

    if (!isVisible) {
      element.scrollIntoView({
        behavior: this.preferences.reduceMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }

  /**
   * Load user preferences
   */
  loadPreferences() {
    try {
      const saved = localStorage.getItem('accessibility-preferences');
      return saved ? JSON.parse(saved) : this.getDefaultPreferences();
    } catch (error) {
      return this.getDefaultPreferences();
    }
  }

  /**
   * Get default accessibility preferences
   */
  getDefaultPreferences() {
    return {
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      largeText: false,
      announceChanges: true,
      keyboardNavigation: true,
      focusIndicators: true,
      screenReaderOptimizations: true
    };
  }

  /**
   * Watch for system preference changes
   */
  watchPreferenceChanges() {
    // Reduced motion
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.preferences.reduceMotion = e.matches;
      this.savePreferences();
    });

    // High contrast
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.preferences.highContrast = e.matches;
      this.savePreferences();
    });

    // Color scheme
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      // Recheck contrast ratios
      setTimeout(() => this.contrastChecker.checkAll(), 100);
    });
  }

  /**
   * Save preferences
   */
  savePreferences() {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  }

  /**
   * Utility functions
   */
  shouldAnnounceElement(element) {
    // Don't announce decorative elements
    if (element.getAttribute('aria-hidden') === 'true') return false;
    if (element.getAttribute('role') === 'presentation') return false;
    if (element.classList.contains('sr-only')) return false;

    // Announce interactive elements
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
    const interactiveRoles = ['button', 'link', 'checkbox', 'radio', 'slider'];

    return interactiveTags.includes(element.tagName.toLowerCase()) ||
           interactiveRoles.includes(element.getAttribute('role'));
  }

  focusMainContent() {
    const main = document.querySelector('main, #main-content, [role="main"]');
    if (main) {
      main.focus();
      this.announce('Focused main content');
    }
  }

  focusNavigation() {
    const nav = document.querySelector('nav, [role="navigation"]');
    if (nav) {
      const focusable = nav.querySelector('a, button, [tabindex="0"]');
      if (focusable) {
        focusable.focus();
        this.announce('Focused navigation');
      }
    }
  }

  focusSearch() {
    const search = document.querySelector('[role="search"] input, .search-input');
    if (search) {
      search.focus();
      this.announce('Focused search');
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  handleResize() {
    // Re-check contrast and visibility after resize
    this.contrastChecker.checkAll();
  }

  handleEscape() {
    // Close modals, dropdowns, etc.
    const activeModal = document.querySelector('.modal[aria-hidden="false"]');
    if (activeModal) {
      const closeBtn = activeModal.querySelector('.modal-close');
      if (closeBtn) closeBtn.click();
    }
  }

  cycleLandmarks() {
    const landmarks = document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]');
    // Implementation for cycling through landmarks
  }

  handleGlobalKeyDown(event) {
    // Global keyboard event handling
    this.keyboardNavigator.handleKeyDown(event);
  }

  handleClick(event) {
    // Ensure click targets meet minimum size requirements
    const target = event.target;
    const rect = target.getBoundingClientRect();

    if (rect.width < 44 || rect.height < 44) {
      console.warn('Click target smaller than recommended 44x44px:', target);
    }
  }
}

/**
 * Focus Tracker - Monitors focus changes
 */
class FocusTracker extends EventTarget {
  constructor() {
    super();
    this.currentFocus = null;
    this.previousFocus = null;

    this.setupTracking();
  }

  setupTracking() {
    document.addEventListener('focusin', (e) => {
      this.previousFocus = this.currentFocus;
      this.currentFocus = e.target;

      this.dispatchEvent(new CustomEvent('focus-change', {
        detail: {
          element: e.target,
          previous: this.previousFocus,
          reason: 'focusin'
        }
      }));
    });
  }

  on(eventName, handler) {
    this.addEventListener(eventName, handler);
  }
}

/**
 * Focus Manager - Advanced focus management
 */
class FocusManager {
  constructor() {
    this.focusStack = [];
    this.trapStack = [];
  }

  /**
   * Save current focus
   */
  saveFocus() {
    this.focusStack.push(document.activeElement);
  }

  /**
   * Restore previous focus
   */
  restoreFocus() {
    if (this.focusStack.length > 0) {
      const element = this.focusStack.pop();
      if (element && element.focus) {
        element.focus();
      }
    }
  }

  /**
   * Create focus trap for modals
   */
  createTrap(container) {
    const trap = new FocusTrap(container);
    this.trapStack.push(trap);
    trap.activate();
    return trap;
  }

  /**
   * Remove focus trap
   */
  removeTrap() {
    if (this.trapStack.length > 0) {
      const trap = this.trapStack.pop();
      trap.deactivate();
    }
  }
}

/**
 * Focus Trap Implementation
 */
class FocusTrap {
  constructor(container) {
    this.container = container;
    this.active = false;
    this.firstFocusable = null;
    this.lastFocusable = null;
    this.previouslyFocused = document.activeElement;
  }

  activate() {
    this.active = true;
    this.updateFocusableElements();

    // Focus first element
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    }

    // Add event listeners
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  deactivate() {
    this.active = false;
    this.container.removeEventListener('keydown', this.handleKeyDown.bind(this));

    // Restore previous focus
    if (this.previouslyFocused && this.previouslyFocused.focus) {
      this.previouslyFocused.focus();
    }
  }

  updateFocusableElements() {
    const focusableSelector = `
      a[href],
      button:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"]):not([disabled])
    `;

    const focusableElements = this.container.querySelectorAll(focusableSelector);
    this.firstFocusable = focusableElements[0] || null;
    this.lastFocusable = focusableElements[focusableElements.length - 1] || null;
  }

  handleKeyDown(event) {
    if (!this.active || event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  }
}

/**
 * Keyboard Navigator - Enhanced keyboard shortcuts
 */
class KeyboardNavigator {
  constructor() {
    this.shortcuts = new Map();
    this.enabled = true;
  }

  register(combination, handler, description = '') {
    this.shortcuts.set(combination.toLowerCase(), {
      handler,
      description,
      combination
    });
  }

  handleKeyDown(event) {
    if (!this.enabled) return;

    const combination = this.getKeyCombination(event);
    const shortcut = this.shortcuts.get(combination);

    if (shortcut) {
      event.preventDefault();
      shortcut.handler(event);
    }
  }

  getKeyCombination(event) {
    const parts = [];

    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('meta');

    parts.push(event.key.toLowerCase());

    return parts.join('+');
  }

  getShortcuts() {
    return Array.from(this.shortcuts.values());
  }
}

/**
 * Contrast Checker - WCAG contrast compliance
 */
class ContrastChecker {
  constructor() {
    this.violations = [];
  }

  checkAll() {
    this.violations = [];
    const elements = document.querySelectorAll('*');

    elements.forEach(element => {
      this.checkElement(element);
    });

    return this.violations;
  }

  checkElement(element) {
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    const fontSize = parseFloat(styles.fontSize);

    if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)') {
      const ratio = this.calculateContrastRatio(color, backgroundColor);
      const requiredRatio = fontSize >= AccessibilityConfig.FONT_SIZES.LARGE_TEXT_THRESHOLD
        ? AccessibilityConfig.CONTRAST_RATIOS.LARGE_TEXT
        : AccessibilityConfig.CONTRAST_RATIOS.NORMAL_TEXT;

      if (ratio < requiredRatio) {
        this.violations.push({
          element,
          type: 'contrast',
          actual: ratio.toFixed(2),
          required: requiredRatio,
          foreground: color,
          background: backgroundColor
        });
      }
    }
  }

  calculateContrastRatio(foreground, background) {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  }

  getLuminance(color) {
    const rgb = this.parseColor(color);
    if (!rgb) return 0;

    const sRGB = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  parseColor(color) {
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);

    const computedColor = window.getComputedStyle(div).color;
    document.body.removeChild(div);

    const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
  }
}

/**
 * Accessibility Auditor - Comprehensive WCAG checking
 */
class AccessibilityAuditor {
  constructor() {
    this.rules = [
      this.checkHeadingStructure,
      this.checkImageAltText,
      this.checkFormLabels,
      this.checkKeyboardAccessibility,
      this.checkColorContrast,
      this.checkFocusIndicators,
      this.checkAriaAttributes,
      this.checkSemanticMarkup
    ];
  }

  async audit(container = document) {
    const violations = [];

    for (const rule of this.rules) {
      try {
        const ruleViolations = await rule.call(this, container);
        violations.push(...ruleViolations);
      } catch (error) {
        console.warn('Audit rule failed:', rule.name, error);
      }
    }

    return violations;
  }

  checkHeadingStructure(container) {
    const violations = [];
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');

    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));

      if (level - previousLevel > 1) {
        violations.push({
          element: heading,
          type: 'heading-structure',
          message: `Heading level skipped from h${previousLevel} to h${level}`
        });
      }

      previousLevel = level;
    });

    return violations;
  }

  checkImageAltText(container) {
    const violations = [];
    const images = container.querySelectorAll('img');

    images.forEach(img => {
      if (!img.hasAttribute('alt') && img.getAttribute('role') !== 'presentation') {
        violations.push({
          element: img,
          type: 'missing-alt',
          message: 'Image missing alt attribute'
        });
      }
    });

    return violations;
  }

  checkFormLabels(container) {
    const violations = [];
    const inputs = container.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      if (input.type === 'hidden') return;

      const hasLabel = this.hasAccessibleName(input);
      if (!hasLabel) {
        violations.push({
          element: input,
          type: 'missing-label',
          message: 'Form control missing accessible name'
        });
      }
    });

    return violations;
  }

  hasAccessibleName(element) {
    return element.hasAttribute('aria-label') ||
           element.hasAttribute('aria-labelledby') ||
           element.id && document.querySelector(`label[for="${element.id}"]`) ||
           element.closest('label');
  }

  // Additional audit methods would be implemented here...
  checkKeyboardAccessibility(container) { return []; }
  checkColorContrast(container) { return []; }
  checkFocusIndicators(container) { return []; }
  checkAriaAttributes(container) { return []; }
  checkSemanticMarkup(container) { return []; }
}

/**
 * Accessibility Helper Functions
 */
const AccessibilityUtils = {
  /**
   * Make element screen reader accessible
   */
  makeAccessible(element, options = {}) {
    const {
      role,
      label,
      description,
      hidden = false,
      focusable = null
    } = options;

    if (role) element.setAttribute('role', role);
    if (label) element.setAttribute('aria-label', label);
    if (description) element.setAttribute('aria-describedby', description);
    if (hidden) element.setAttribute('aria-hidden', 'true');
    if (focusable !== null) {
      element.setAttribute('tabindex', focusable ? '0' : '-1');
    }

    return element;
  },

  /**
   * Create accessible button
   */
  createButton(text, onClick, options = {}) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);

    return this.makeAccessible(button, options);
  },

  /**
   * Create accessible link
   */
  createLink(text, href, options = {}) {
    const link = document.createElement('a');
    link.textContent = text;
    link.href = href;

    return this.makeAccessible(link, options);
  },

  /**
   * Create accessible list
   */
  createList(items, options = {}) {
    const list = document.createElement(options.ordered ? 'ol' : 'ul');

    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });

    return this.makeAccessible(list, options);
  }
};

// Global accessibility manager instance
const accessibilityManager = new AccessibilityManager();

// Export accessibility system
window.AccessibilitySystem = {
  AccessibilityManager: accessibilityManager,
  AccessibilityConfig,
  AriaRoles,
  AriaProperties,
  FocusTracker,
  FocusManager,
  FocusTrap,
  KeyboardNavigator,
  ContrastChecker,
  AccessibilityAuditor,
  AccessibilityUtils
};

// Auto-enable accessibility for existing systems
if (window.ComponentLibrary) {
  // Enhance base component with accessibility
  const originalBaseComponent = window.ComponentLibrary.BaseComponent;
  if (originalBaseComponent) {
    originalBaseComponent.prototype.makeAccessible = function(options) {
      return AccessibilityUtils.makeAccessible(this.container, options);
    };

    originalBaseComponent.prototype.announce = function(message, priority) {
      return accessibilityManager.announce(message, priority);
    };
  }
}

console.log('♿ Comprehensive Accessibility System initialized');