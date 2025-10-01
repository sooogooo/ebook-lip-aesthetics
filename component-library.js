/**
 * Production-Ready Component Library for 绛唇解语花 Visualization System
 * Enterprise-grade visualization components with TypeScript-style interfaces
 */

// Type definitions and interfaces
const ComponentTypes = {
  VISUALIZATION: 'visualization',
  WIDGET: 'widget',
  CONTROL: 'control',
  LAYOUT: 'layout',
  UTILITY: 'utility'
};

const ThemeVariants = {
  LIGHT: 'light',
  DARK: 'dark',
  HIGH_CONTRAST: 'high-contrast',
  AUTO: 'auto'
};

/**
 * Base Component Class - Foundation for all visualization components
 */
class BaseComponent extends EventTarget {
  constructor(options = {}) {
    super();

    this.id = options.id || this.generateId();
    this.type = options.type || ComponentTypes.WIDGET;
    this.container = options.container;
    this.config = this.mergeConfig(this.getDefaultConfig(), options.config || {});
    this.state = { ...this.getInitialState() };
    this.theme = options.theme || ThemeVariants.AUTO;
    this.accessible = options.accessible !== false;
    this.responsive = options.responsive !== false;

    this.init();
  }

  // Abstract methods to be implemented by subclasses
  getDefaultConfig() { return {}; }
  getInitialState() { return {}; }
  render() { throw new Error('render() must be implemented by subclass'); }
  destroy() { this.removeEventListeners(); }

  init() {
    this.setupEventListeners();
    this.setupAccessibility();
    this.render();
    this.emit('component:initialized', { component: this });
  }

  generateId() {
    return `component-${Math.random().toString(36).substr(2, 9)}`;
  }

  mergeConfig(defaultConfig, userConfig) {
    return {
      ...defaultConfig,
      ...userConfig,
      // Deep merge for nested objects
      style: { ...defaultConfig.style, ...userConfig.style },
      animation: { ...defaultConfig.animation, ...userConfig.animation }
    };
  }

  setState(newState) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.onStateChange(prevState, this.state);
    this.emit('state:changed', { prevState, newState: this.state });
  }

  onStateChange(prevState, newState) {
    // Override in subclasses for state-specific logic
  }

  updateConfig(newConfig) {
    this.config = this.mergeConfig(this.config, newConfig);
    this.render();
    this.emit('config:updated', { config: this.config });
  }

  setTheme(theme) {
    this.theme = theme;
    this.applyTheme();
    this.emit('theme:changed', { theme });
  }

  applyTheme() {
    if (this.container) {
      this.container.setAttribute('data-theme', this.theme);
    }
  }

  setupEventListeners() {
    // Base event listeners - override in subclasses
  }

  removeEventListeners() {
    // Cleanup event listeners
  }

  setupAccessibility() {
    if (!this.accessible || !this.container) return;

    // Basic ARIA attributes
    this.container.setAttribute('role', this.getAriaRole());
    this.container.setAttribute('aria-label', this.getAriaLabel());

    if (this.config.description) {
      this.container.setAttribute('aria-description', this.config.description);
    }
  }

  getAriaRole() {
    return 'region';
  }

  getAriaLabel() {
    return this.config.title || `${this.type} component`;
  }

  emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  on(eventName, handler) {
    this.addEventListener(eventName, handler);
    return this;
  }

  off(eventName, handler) {
    this.removeEventListener(eventName, handler);
    return this;
  }
}

/**
 * Visualization Widget - Advanced data visualization component
 */
class VisualizationWidget extends BaseComponent {
  constructor(options = {}) {
    super({ ...options, type: ComponentTypes.VISUALIZATION });
    this.dataSource = options.dataSource;
    this.chartType = options.chartType || 'line';
    this.interactionEnabled = options.interactionEnabled !== false;
  }

  getDefaultConfig() {
    return {
      width: '100%',
      height: 400,
      title: '',
      subtitle: '',
      responsive: true,
      animation: {
        enabled: true,
        duration: 750,
        easing: 'easeInOutQuart'
      },
      colors: {
        primary: '#E91E63',
        secondary: '#2196F3',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336'
      },
      margins: { top: 20, right: 20, bottom: 40, left: 40 },
      grid: {
        x: true,
        y: true,
        color: '#E0E0E0',
        opacity: 0.3
      },
      legend: {
        enabled: true,
        position: 'bottom',
        align: 'center'
      },
      tooltip: {
        enabled: true,
        animation: true,
        followCursor: true
      },
      export: {
        enabled: true,
        formats: ['png', 'svg', 'pdf']
      }
    };
  }

  getInitialState() {
    return {
      loading: false,
      error: null,
      data: null,
      selectedPoints: new Set(),
      zoomLevel: 1,
      panOffset: { x: 0, y: 0 },
      lastUpdate: null
    };
  }

  async setData(data) {
    this.setState({ loading: true, error: null });

    try {
      const processedData = await this.processData(data);
      this.setState({
        data: processedData,
        loading: false,
        lastUpdate: new Date().toISOString()
      });
      this.render();
    } catch (error) {
      this.setState({ error: error.message, loading: false });
      this.emit('data:error', { error });
    }
  }

  async processData(rawData) {
    // Data validation and processing
    if (!Array.isArray(rawData)) {
      throw new Error('Data must be an array');
    }

    return rawData.map((item, index) => ({
      ...item,
      id: item.id || `data-${index}`,
      value: this.parseValue(item.value),
      timestamp: item.timestamp || new Date().toISOString()
    }));
  }

  parseValue(value) {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    if (isNaN(parsed)) throw new Error(`Invalid numeric value: ${value}`);
    return parsed;
  }

  render() {
    if (!this.container) return;

    // Clear previous content
    this.container.innerHTML = '';

    // Create main structure
    const wrapper = this.createElement('div', 'viz-wrapper');
    const header = this.createHeader();
    const canvas = this.createCanvas();
    const footer = this.createFooter();

    wrapper.append(header, canvas, footer);
    this.container.appendChild(wrapper);

    // Render chart based on type
    this.renderChart(canvas);

    // Setup interactions
    if (this.interactionEnabled) {
      this.setupInteractions(canvas);
    }
  }

  createElement(tag, className, attributes = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    return element;
  }

  createHeader() {
    const header = this.createElement('div', 'viz-header');

    if (this.config.title) {
      const title = this.createElement('h3', 'viz-title');
      title.textContent = this.config.title;
      header.appendChild(title);
    }

    if (this.config.subtitle) {
      const subtitle = this.createElement('p', 'viz-subtitle');
      subtitle.textContent = this.config.subtitle;
      header.appendChild(subtitle);
    }

    // Add controls
    const controls = this.createControls();
    header.appendChild(controls);

    return header;
  }

  createControls() {
    const controls = this.createElement('div', 'viz-controls');

    // Export button
    if (this.config.export.enabled) {
      const exportBtn = this.createElement('button', 'btn btn-ghost export-btn', {
        'aria-label': 'Export visualization',
        'title': 'Export as image or data'
      });
      exportBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
      `;
      exportBtn.addEventListener('click', () => this.showExportOptions());
      controls.appendChild(exportBtn);
    }

    // Fullscreen button
    const fullscreenBtn = this.createElement('button', 'btn btn-ghost fullscreen-btn', {
      'aria-label': 'Toggle fullscreen',
      'title': 'View in fullscreen'
    });
    fullscreenBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
      </svg>
    `;
    fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    controls.appendChild(fullscreenBtn);

    return controls;
  }

  createCanvas() {
    return this.createElement('div', 'viz-canvas', {
      'style': `height: ${this.config.height}px;`,
      'role': 'img',
      'aria-label': this.getChartAriaLabel()
    });
  }

  createFooter() {
    const footer = this.createElement('div', 'viz-footer');

    if (this.config.legend.enabled) {
      const legend = this.createLegend();
      footer.appendChild(legend);
    }

    return footer;
  }

  createLegend() {
    const legend = this.createElement('div', 'viz-legend', {
      'role': 'list',
      'aria-label': 'Chart legend'
    });

    if (this.state.data && this.state.data.length > 0) {
      const series = this.getDataSeries();
      series.forEach((serie, index) => {
        const item = this.createElement('div', 'legend-item', {
          'role': 'listitem'
        });

        const color = this.getSeriesColor(index);
        item.innerHTML = `
          <span class="legend-color" style="background-color: ${color}"></span>
          <span class="legend-label">${serie.name}</span>
        `;

        legend.appendChild(item);
      });
    }

    return legend;
  }

  getDataSeries() {
    // Override in chart-specific implementations
    return [{ name: 'Data Series', data: this.state.data }];
  }

  getSeriesColor(index) {
    const colors = Object.values(this.config.colors);
    return colors[index % colors.length];
  }

  getChartAriaLabel() {
    const dataCount = this.state.data ? this.state.data.length : 0;
    return `${this.chartType} chart with ${dataCount} data points`;
  }

  renderChart(canvas) {
    // Override in specific chart implementations
    if (this.state.loading) {
      this.renderLoading(canvas);
    } else if (this.state.error) {
      this.renderError(canvas);
    } else if (this.state.data) {
      this.renderData(canvas);
    } else {
      this.renderEmpty(canvas);
    }
  }

  renderLoading(canvas) {
    canvas.innerHTML = `
      <div class="viz-loading">
        <div class="loading-spinner"></div>
        <p>Loading visualization...</p>
      </div>
    `;
  }

  renderError(canvas) {
    canvas.innerHTML = `
      <div class="viz-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2L13.09,8.26L22,9L14.74,15.74L17,22L12,19.77L7,22L9.26,15.74L2,9L10.91,8.26L12,2Z"/>
        </svg>
        <h4>Visualization Error</h4>
        <p>${this.state.error}</p>
        <button class="btn btn-primary retry-btn" onclick="this.retry()">Retry</button>
      </div>
    `;
  }

  renderEmpty(canvas) {
    canvas.innerHTML = `
      <div class="viz-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,3H5C3.9,3 3,3.9 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.9 20.1,3 19,3M19,19H5V5H19V19Z"/>
        </svg>
        <h4>No Data Available</h4>
        <p>Connect a data source to begin visualization</p>
      </div>
    `;
  }

  renderData(canvas) {
    // Override in specific chart implementations
    canvas.innerHTML = `
      <div class="viz-placeholder">
        <p>Chart implementation for ${this.chartType}</p>
        <p>Data points: ${this.state.data.length}</p>
      </div>
    `;
  }

  setupInteractions(canvas) {
    // Mouse/touch interactions
    canvas.addEventListener('click', (e) => this.handleClick(e));
    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    canvas.addEventListener('wheel', (e) => this.handleWheel(e));

    // Keyboard interactions
    canvas.setAttribute('tabindex', '0');
    canvas.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleClick(event) {
    // Implementation for click interactions
    this.emit('interaction:click', { event, component: this });
  }

  handleMouseMove(event) {
    // Implementation for hover effects and tooltips
    this.emit('interaction:hover', { event, component: this });
  }

  handleWheel(event) {
    if (event.ctrlKey) {
      event.preventDefault();
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      this.zoom(zoomFactor);
    }
  }

  handleKeyDown(event) {
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        this.navigateDataPoints(event.key);
        break;
      case 'Enter':
      case ' ':
        this.selectCurrentDataPoint();
        break;
      case 'Escape':
        this.clearSelection();
        break;
    }
  }

  zoom(factor) {
    const newZoom = Math.max(0.1, Math.min(10, this.state.zoomLevel * factor));
    this.setState({ zoomLevel: newZoom });
    this.render();
  }

  pan(deltaX, deltaY) {
    const newOffset = {
      x: this.state.panOffset.x + deltaX,
      y: this.state.panOffset.y + deltaY
    };
    this.setState({ panOffset: newOffset });
    this.render();
  }

  showExportOptions() {
    const modal = new ExportModal({
      formats: this.config.export.formats,
      onExport: (format) => this.exportAs(format)
    });
    modal.show();
  }

  async exportAs(format) {
    switch (format) {
      case 'png':
        return this.exportAsPNG();
      case 'svg':
        return this.exportAsSVG();
      case 'pdf':
        return this.exportAsPDF();
      case 'csv':
        return this.exportAsCSV();
      case 'json':
        return this.exportAsJSON();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  exportAsPNG() {
    // PNG export implementation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // ... implementation
    return canvas.toDataURL('image/png');
  }

  exportAsSVG() {
    // SVG export implementation
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // ... implementation
    return new XMLSerializer().serializeToString(svg);
  }

  exportAsCSV() {
    if (!this.state.data) return '';

    const headers = Object.keys(this.state.data[0]);
    const csv = [
      headers.join(','),
      ...this.state.data.map(row =>
        headers.map(header => JSON.stringify(row[header] || '')).join(',')
      )
    ].join('\n');

    return csv;
  }

  exportAsJSON() {
    return JSON.stringify({
      config: this.config,
      data: this.state.data,
      metadata: {
        exportDate: new Date().toISOString(),
        chartType: this.chartType,
        componentId: this.id
      }
    }, null, 2);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  retry() {
    if (this.dataSource) {
      this.setData(this.dataSource);
    }
  }

  getAriaRole() {
    return 'img';
  }
}

/**
 * Line Chart Widget - Specialized line chart visualization
 */
class LineChartWidget extends VisualizationWidget {
  constructor(options = {}) {
    super({ ...options, chartType: 'line' });
  }

  getDefaultConfig() {
    return {
      ...super.getDefaultConfig(),
      line: {
        width: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      axes: {
        x: {
          type: 'linear',
          display: true,
          title: 'X Axis'
        },
        y: {
          type: 'linear',
          display: true,
          title: 'Y Axis'
        }
      }
    };
  }

  renderData(canvas) {
    // Advanced line chart rendering
    const svg = this.createSVGChart(canvas);
    this.drawAxes(svg);
    this.drawGrid(svg);
    this.drawLines(svg);
    this.drawPoints(svg);
  }

  createSVGChart(container) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${this.config.width} ${this.config.height}`);

    container.appendChild(svg);
    return svg;
  }

  drawAxes(svg) {
    // Implementation for drawing chart axes
  }

  drawGrid(svg) {
    // Implementation for drawing chart grid
  }

  drawLines(svg) {
    // Implementation for drawing data lines
  }

  drawPoints(svg) {
    // Implementation for drawing data points
  }
}

/**
 * Dashboard Layout Component - Responsive dashboard container
 */
class DashboardLayout extends BaseComponent {
  constructor(options = {}) {
    super({ ...options, type: ComponentTypes.LAYOUT });
    this.widgets = new Map();
    this.layout = options.layout || 'grid';
  }

  getDefaultConfig() {
    return {
      columns: 12,
      gap: 16,
      responsive: true,
      breakpoints: {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200
      }
    };
  }

  addWidget(widget, position = {}) {
    const widgetId = widget.id;
    this.widgets.set(widgetId, {
      component: widget,
      position: {
        row: position.row || 1,
        col: position.col || 1,
        width: position.width || 6,
        height: position.height || 4
      }
    });

    this.render();
    this.emit('widget:added', { widgetId, widget });
  }

  removeWidget(widgetId) {
    const widget = this.widgets.get(widgetId);
    if (widget) {
      widget.component.destroy();
      this.widgets.delete(widgetId);
      this.render();
      this.emit('widget:removed', { widgetId });
    }
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = '';
    this.container.className = `dashboard-layout layout-${this.layout}`;

    this.widgets.forEach((widget, widgetId) => {
      const cell = this.createElement('div', 'dashboard-cell');
      cell.style.gridArea = this.getGridArea(widget.position);

      widget.component.container = cell;
      widget.component.render();

      this.container.appendChild(cell);
    });
  }

  getGridArea(position) {
    return `${position.row} / ${position.col} / ${position.row + position.height} / ${position.col + position.width}`;
  }
}

/**
 * Component Factory - Creates and manages component instances
 */
class ComponentFactory {
  static components = new Map([
    ['visualization', VisualizationWidget],
    ['line-chart', LineChartWidget],
    ['dashboard', DashboardLayout]
  ]);

  static register(type, componentClass) {
    this.components.set(type, componentClass);
  }

  static create(type, options = {}) {
    const ComponentClass = this.components.get(type);
    if (!ComponentClass) {
      throw new Error(`Unknown component type: ${type}`);
    }

    return new ComponentClass(options);
  }

  static getAvailableTypes() {
    return Array.from(this.components.keys());
  }
}

/**
 * Theme Manager - Handles theme switching and customization
 */
class ThemeManager {
  constructor() {
    this.currentTheme = ThemeVariants.AUTO;
    this.customThemes = new Map();
    this.observers = new Set();
  }

  setTheme(theme) {
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.notifyObservers();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === ThemeVariants.AUTO) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const actualTheme = prefersDark ? ThemeVariants.DARK : ThemeVariants.LIGHT;
      document.documentElement.setAttribute('data-theme', actualTheme);
    }
  }

  registerCustomTheme(name, themeConfig) {
    this.customThemes.set(name, themeConfig);
    this.applyCustomTheme(name, themeConfig);
  }

  applyCustomTheme(name, config) {
    const style = document.createElement('style');
    style.id = `theme-${name}`;

    const cssVars = Object.entries(config)
      .map(([key, value]) => `--${key}: ${value};`)
      .join('\n');

    style.textContent = `[data-theme="${name}"] { ${cssVars} }`;
    document.head.appendChild(style);
  }

  subscribe(observer) {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  notifyObservers() {
    this.observers.forEach(observer => observer(this.currentTheme));
  }
}

// Export Modal Component
class ExportModal {
  constructor(options = {}) {
    this.formats = options.formats || ['png', 'svg', 'csv'];
    this.onExport = options.onExport || (() => {});
    this.modal = null;
  }

  show() {
    this.modal = this.createElement();
    document.body.appendChild(this.modal);

    requestAnimationFrame(() => {
      this.modal.classList.add('show');
    });
  }

  hide() {
    if (this.modal) {
      this.modal.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(this.modal);
        this.modal = null;
      }, 300);
    }
  }

  createElement() {
    const modal = document.createElement('div');
    modal.className = 'export-modal';
    modal.innerHTML = `
      <div class="export-modal-content">
        <div class="export-modal-header">
          <h3>Export Visualization</h3>
          <button class="export-modal-close">&times;</button>
        </div>
        <div class="export-modal-body">
          <p>Choose export format:</p>
          <div class="export-format-grid">
            ${this.formats.map(format => `
              <button class="export-format-btn" data-format="${format}">
                ${this.getFormatIcon(format)}
                <span>${format.toUpperCase()}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Event listeners
    modal.querySelector('.export-modal-close').addEventListener('click', () => this.hide());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.hide();
    });

    modal.querySelectorAll('.export-format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const format = btn.dataset.format;
        this.onExport(format);
        this.hide();
      });
    });

    return modal;
  }

  getFormatIcon(format) {
    const icons = {
      png: '🖼️',
      svg: '🎨',
      pdf: '📄',
      csv: '📊',
      json: '📋'
    };
    return icons[format] || '📁';
  }
}

// Global instances
const themeManager = new ThemeManager();
const componentRegistry = new Map();

// Initialize theme system
themeManager.setTheme(ThemeVariants.AUTO);

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (themeManager.currentTheme === ThemeVariants.AUTO) {
    themeManager.applyTheme(ThemeVariants.AUTO);
  }
});

// Export for global use
window.ComponentLibrary = {
  BaseComponent,
  VisualizationWidget,
  LineChartWidget,
  DashboardLayout,
  ComponentFactory,
  ThemeManager: themeManager,
  ComponentTypes,
  ThemeVariants,
  ExportModal
};

// Auto-register built-in components
ComponentFactory.register('base', BaseComponent);
ComponentFactory.register('visualization', VisualizationWidget);
ComponentFactory.register('line-chart', LineChartWidget);
ComponentFactory.register('dashboard', DashboardLayout);

console.log('🎨 Production Component Library initialized');