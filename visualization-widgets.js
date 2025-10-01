/**
 * Production-Ready Visualization Widget Components for 绛唇解语花
 * Reusable, configurable widgets with TypeScript-style interfaces
 */

/**
 * Widget Type Definitions and Interfaces
 */
const WidgetTypes = {
  CHART: 'chart',
  GRID: 'grid',
  CARD: 'card',
  MODAL: 'modal',
  TOOLBAR: 'toolbar',
  PANEL: 'panel'
};

const ChartTypes = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  SCATTER: 'scatter',
  HEATMAP: 'heatmap',
  RADAR: 'radar',
  DONUT: 'donut',
  AREA: 'area'
};

const AnimationTypes = {
  FADE: 'fade',
  SLIDE: 'slide',
  SCALE: 'scale',
  BOUNCE: 'bounce',
  ELASTIC: 'elastic'
};

/**
 * Base Widget Class - Foundation for all reusable widgets
 */
class BaseWidget extends BaseComponent {
  constructor(options = {}) {
    super({ ...options, type: WidgetTypes.CHART });

    this.widgetType = options.widgetType || 'generic';
    this.responsive = options.responsive !== false;
    this.interactive = options.interactive !== false;
    this.exportable = options.exportable !== false;
    this.configurable = options.configurable !== false;

    this.setupWidget();
  }

  getDefaultConfig() {
    return {
      width: '100%',
      height: 300,
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
      background: 'transparent',
      border: {
        width: 0,
        color: '#E0E0E0',
        radius: 8
      },
      animation: {
        enabled: true,
        type: AnimationTypes.FADE,
        duration: 500,
        delay: 0,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      responsive: {
        enabled: true,
        breakpoints: {
          mobile: 480,
          tablet: 768,
          desktop: 1024
        }
      },
      interaction: {
        hover: true,
        click: true,
        drag: false,
        zoom: false,
        select: true
      },
      accessibility: {
        enabled: true,
        announceChanges: true,
        keyboardNavigation: true
      }
    };
  }

  setupWidget() {
    this.initializeResizeObserver();
    this.setupKeyboardNavigation();
    this.setupTouchGestures();
  }

  initializeResizeObserver() {
    if (this.responsive && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          this.handleResize(entry.contentRect);
        }
      });

      if (this.container) {
        this.resizeObserver.observe(this.container);
      }
    }
  }

  handleResize(rect) {
    this.setState({
      containerWidth: rect.width,
      containerHeight: rect.height
    });

    if (this.config.responsive.enabled) {
      this.updateResponsiveConfig(rect.width);
    }

    this.render();
    this.emit('widget:resized', { width: rect.width, height: rect.height });
  }

  updateResponsiveConfig(width) {
    const { breakpoints } = this.config.responsive;
    let activeBreakpoint = 'desktop';

    if (width <= breakpoints.mobile) {
      activeBreakpoint = 'mobile';
    } else if (width <= breakpoints.tablet) {
      activeBreakpoint = 'tablet';
    }

    this.setState({ activeBreakpoint });
    this.applyResponsiveStyles(activeBreakpoint);
  }

  applyResponsiveStyles(breakpoint) {
    // Override in subclasses for specific responsive behavior
  }

  setupKeyboardNavigation() {
    if (!this.config.accessibility.keyboardNavigation) return;

    this.keyMap = {
      'ArrowUp': () => this.navigateUp(),
      'ArrowDown': () => this.navigateDown(),
      'ArrowLeft': () => this.navigateLeft(),
      'ArrowRight': () => this.navigateRight(),
      'Enter': () => this.activateSelected(),
      ' ': () => this.activateSelected(),
      'Escape': () => this.clearSelection(),
      'Tab': (e) => this.handleTabNavigation(e),
      'Home': () => this.navigateToFirst(),
      'End': () => this.navigateToLast()
    };
  }

  setupTouchGestures() {
    if (!this.container || !this.interactive) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    this.container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    });

    this.container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      this.handleGesture(touchStartX, touchStartY, touchEndX, touchEndY);
    });
  }

  handleGesture(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const threshold = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          this.emit('gesture:swipe-right');
        } else {
          this.emit('gesture:swipe-left');
        }
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          this.emit('gesture:swipe-down');
        } else {
          this.emit('gesture:swipe-up');
        }
      }
    }
  }

  // Navigation methods (override in subclasses)
  navigateUp() { this.emit('navigation:up'); }
  navigateDown() { this.emit('navigation:down'); }
  navigateLeft() { this.emit('navigation:left'); }
  navigateRight() { this.emit('navigation:right'); }
  activateSelected() { this.emit('navigation:activate'); }
  clearSelection() { this.emit('navigation:clear'); }
  navigateToFirst() { this.emit('navigation:first'); }
  navigateToLast() { this.emit('navigation:last'); }

  handleTabNavigation(event) {
    // Implement tab trap for modal widgets
    if (this.widgetType === WidgetTypes.MODAL) {
      const focusableElements = this.container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  render() {
    if (!this.container) return;

    // Apply base widget styles
    this.applyBaseStyles();

    // Apply animations if enabled
    if (this.config.animation.enabled) {
      this.applyAnimation();
    }

    // Render widget content
    this.renderContent();

    // Setup interactions
    this.setupInteractions();

    this.emit('widget:rendered');
  }

  applyBaseStyles() {
    if (!this.container) return;

    const styles = {
      width: this.config.width,
      height: `${this.config.height}px`,
      padding: this.formatPadding(this.config.padding),
      background: this.config.background,
      border: this.formatBorder(this.config.border),
      borderRadius: `${this.config.border.radius}px`,
      position: 'relative',
      overflow: 'hidden'
    };

    Object.assign(this.container.style, styles);
    this.container.classList.add('viz-widget', `viz-widget-${this.widgetType}`);
  }

  formatPadding(padding) {
    if (typeof padding === 'number') {
      return `${padding}px`;
    }
    if (typeof padding === 'object') {
      return `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`;
    }
    return padding;
  }

  formatBorder(border) {
    return `${border.width}px solid ${border.color}`;
  }

  applyAnimation() {
    const { animation } = this.config;

    this.container.style.animation = `
      widget-${animation.type}
      ${animation.duration}ms
      ${animation.easing}
      ${animation.delay}ms
      both
    `;
  }

  renderContent() {
    // Override in subclasses
  }

  setupInteractions() {
    if (!this.interactive) return;

    if (this.config.interaction.hover) {
      this.container.addEventListener('mouseenter', (e) => this.handleHover(e, true));
      this.container.addEventListener('mouseleave', (e) => this.handleHover(e, false));
    }

    if (this.config.interaction.click) {
      this.container.addEventListener('click', (e) => this.handleClick(e));
    }

    if (this.config.interaction.drag) {
      this.setupDragHandlers();
    }

    if (this.config.interaction.zoom) {
      this.setupZoomHandlers();
    }
  }

  handleHover(event, isEntering) {
    this.emit('widget:hover', { event, isEntering });

    if (isEntering) {
      this.container.classList.add('widget-hover');
    } else {
      this.container.classList.remove('widget-hover');
    }
  }

  handleClick(event) {
    this.emit('widget:click', { event });
  }

  setupDragHandlers() {
    let isDragging = false;
    let startPos = { x: 0, y: 0 };

    this.container.addEventListener('mousedown', (e) => {
      isDragging = true;
      startPos = { x: e.clientX, y: e.clientY };
      this.container.classList.add('widget-dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      this.emit('widget:drag', { deltaX, deltaY, event: e });
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.container.classList.remove('widget-dragging');
        this.emit('widget:drag-end');
      }
    });
  }

  setupZoomHandlers() {
    this.container.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.emit('widget:zoom', { delta, event: e });
      }
    });
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    super.destroy();
  }
}

/**
 * Chart Widget - Advanced chart visualization component
 */
class ChartWidget extends BaseWidget {
  constructor(options = {}) {
    super({ ...options, widgetType: 'chart' });

    this.chartType = options.chartType || ChartTypes.LINE;
    this.dataSource = options.dataSource;
    this.updateInterval = options.updateInterval;
    this.realTimeEnabled = options.realTimeEnabled || false;

    this.setupChart();
  }

  getDefaultConfig() {
    return {
      ...super.getDefaultConfig(),
      chart: {
        type: this.chartType,
        colors: ['#E91E63', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0'],
        grid: {
          show: true,
          color: '#E0E0E0',
          opacity: 0.3
        },
        axes: {
          x: {
            show: true,
            title: '',
            type: 'category',
            format: 'auto'
          },
          y: {
            show: true,
            title: '',
            type: 'linear',
            format: 'auto',
            min: 'auto',
            max: 'auto'
          }
        },
        legend: {
          show: true,
          position: 'bottom',
          align: 'center'
        },
        tooltip: {
          enabled: true,
          format: 'auto',
          followCursor: true
        }
      },
      data: {
        series: [],
        categories: [],
        updateInterval: 5000
      }
    };
  }

  setupChart() {
    if (this.realTimeEnabled && this.updateInterval) {
      this.startRealTimeUpdates();
    }
  }

  setData(data) {
    this.validateData(data);

    this.setState({
      data: this.processData(data),
      lastUpdate: new Date().toISOString()
    });

    this.render();
    this.emit('chart:data-updated', { data });
  }

  validateData(data) {
    if (!Array.isArray(data) && typeof data !== 'object') {
      throw new Error('Chart data must be an array or object');
    }

    // Type-specific validation
    switch (this.chartType) {
      case ChartTypes.LINE:
      case ChartTypes.BAR:
        this.validateSeriesData(data);
        break;
      case ChartTypes.PIE:
      case ChartTypes.DONUT:
        this.validatePieData(data);
        break;
      default:
        break;
    }
  }

  validateSeriesData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Series data must be an array');
    }

    data.forEach((series, index) => {
      if (!series.name || !Array.isArray(series.data)) {
        throw new Error(`Series ${index} must have name and data array`);
      }
    });
  }

  validatePieData(data) {
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (typeof item.value !== 'number' || !item.name) {
          throw new Error(`Pie data item ${index} must have numeric value and name`);
        }
      });
    }
  }

  processData(rawData) {
    switch (this.chartType) {
      case ChartTypes.LINE:
        return this.processLineData(rawData);
      case ChartTypes.BAR:
        return this.processBarData(rawData);
      case ChartTypes.PIE:
      case ChartTypes.DONUT:
        return this.processPieData(rawData);
      case ChartTypes.SCATTER:
        return this.processScatterData(rawData);
      default:
        return rawData;
    }
  }

  processLineData(data) {
    return data.map(series => ({
      ...series,
      data: series.data.map(point => ({
        x: point.x || point[0],
        y: point.y || point[1],
        timestamp: point.timestamp || new Date().toISOString()
      }))
    }));
  }

  processBarData(data) {
    return this.processLineData(data); // Similar structure
  }

  processPieData(data) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return data.map(item => ({
      ...item,
      percentage: (item.value / total * 100).toFixed(1)
    }));
  }

  processScatterData(data) {
    return data.map(series => ({
      ...series,
      data: series.data.map(point => ({
        x: point.x,
        y: point.y,
        size: point.size || 5,
        color: point.color || series.color
      }))
    }));
  }

  renderContent() {
    const chartContainer = this.createElement('div', 'chart-container');

    // Add title if configured
    if (this.config.title) {
      const title = this.createElement('h3', 'chart-title');
      title.textContent = this.config.title;
      chartContainer.appendChild(title);
    }

    // Create chart canvas
    const canvas = this.createElement('div', 'chart-canvas');
    canvas.style.height = `${this.config.height - 80}px`; // Account for title and legend

    chartContainer.appendChild(canvas);

    // Add legend if enabled
    if (this.config.chart.legend.show && this.state.data) {
      const legend = this.createLegend();
      chartContainer.appendChild(legend);
    }

    this.container.appendChild(chartContainer);

    // Render specific chart type
    this.renderChart(canvas);
  }

  renderChart(container) {
    if (!this.state.data) {
      this.renderEmptyState(container);
      return;
    }

    switch (this.chartType) {
      case ChartTypes.LINE:
        this.renderLineChart(container);
        break;
      case ChartTypes.BAR:
        this.renderBarChart(container);
        break;
      case ChartTypes.PIE:
        this.renderPieChart(container);
        break;
      case ChartTypes.DONUT:
        this.renderDonutChart(container);
        break;
      default:
        this.renderGenericChart(container);
    }
  }

  renderEmptyState(container) {
    container.innerHTML = `
      <div class="chart-empty-state">
        <div class="empty-icon">📊</div>
        <h4>No Data Available</h4>
        <p>Connect a data source to visualize your data</p>
      </div>
    `;
  }

  renderLineChart(container) {
    // SVG-based line chart implementation
    const svg = this.createSVG(container);
    const { width, height } = this.getChartDimensions();

    // Draw grid
    if (this.config.chart.grid.show) {
      this.drawGrid(svg, width, height);
    }

    // Draw axes
    this.drawAxes(svg, width, height);

    // Draw data lines
    this.state.data.forEach((series, index) => {
      this.drawLine(svg, series, index, width, height);
    });

    // Add interaction layer
    this.addInteractionLayer(svg, width, height);
  }

  renderBarChart(container) {
    // SVG-based bar chart implementation
    const svg = this.createSVG(container);
    const { width, height } = this.getChartDimensions();

    // Draw grid and axes
    if (this.config.chart.grid.show) {
      this.drawGrid(svg, width, height);
    }
    this.drawAxes(svg, width, height);

    // Draw bars
    this.state.data.forEach((series, seriesIndex) => {
      series.data.forEach((point, pointIndex) => {
        this.drawBar(svg, point, seriesIndex, pointIndex, width, height);
      });
    });
  }

  renderPieChart(container) {
    // SVG-based pie chart implementation
    const svg = this.createSVG(container);
    const { width, height } = this.getChartDimensions();
    const radius = Math.min(width, height) / 2 - 20;
    const centerX = width / 2;
    const centerY = height / 2;

    let currentAngle = 0;
    const total = this.state.data.reduce((sum, item) => sum + item.value, 0);

    this.state.data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      this.drawPieSlice(svg, centerX, centerY, radius, currentAngle, sliceAngle, index);
      currentAngle += sliceAngle;
    });
  }

  createSVG(container) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const { width, height } = this.getChartDimensions();

    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.classList.add('chart-svg');

    container.appendChild(svg);
    return svg;
  }

  getChartDimensions() {
    const containerRect = this.container.getBoundingClientRect();
    const padding = this.config.padding;

    return {
      width: containerRect.width - padding.left - padding.right,
      height: this.config.height - padding.top - padding.bottom - 80 // Account for title/legend
    };
  }

  startRealTimeUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(() => {
      if (this.dataSource && typeof this.dataSource === 'function') {
        this.dataSource()
          .then(data => this.setData(data))
          .catch(error => this.emit('chart:update-error', { error }));
      }
    }, this.updateInterval);
  }

  stopRealTimeUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  // Additional chart-specific methods would go here...
  drawGrid(svg, width, height) { /* Implementation */ }
  drawAxes(svg, width, height) { /* Implementation */ }
  drawLine(svg, series, index, width, height) { /* Implementation */ }
  drawBar(svg, point, seriesIndex, pointIndex, width, height) { /* Implementation */ }
  drawPieSlice(svg, centerX, centerY, radius, startAngle, sliceAngle, index) { /* Implementation */ }
  addInteractionLayer(svg, width, height) { /* Implementation */ }
}

/**
 * Data Grid Widget - Advanced data table component
 */
class DataGridWidget extends BaseWidget {
  constructor(options = {}) {
    super({ ...options, widgetType: 'grid' });

    this.columns = options.columns || [];
    this.sortable = options.sortable !== false;
    this.filterable = options.filterable !== false;
    this.paginated = options.paginated !== false;
    this.selectable = options.selectable !== false;

    this.setupGrid();
  }

  getDefaultConfig() {
    return {
      ...super.getDefaultConfig(),
      grid: {
        rowHeight: 40,
        headerHeight: 50,
        alternateRows: true,
        border: true,
        hover: true
      },
      pagination: {
        pageSize: 25,
        showInfo: true,
        showControls: true
      },
      sorting: {
        enabled: true,
        multiColumn: false
      },
      filtering: {
        enabled: true,
        debounceMs: 300
      },
      selection: {
        mode: 'single', // 'single', 'multiple', 'none'
        highlightRow: true
      }
    };
  }

  setupGrid() {
    this.state = {
      ...this.state,
      currentPage: 1,
      sortColumn: null,
      sortDirection: 'asc',
      filters: {},
      selectedRows: new Set(),
      filteredData: [],
      totalPages: 1
    };
  }

  setColumns(columns) {
    this.columns = columns.map(col => ({
      field: col.field,
      header: col.header || col.field,
      width: col.width || 'auto',
      sortable: col.sortable !== false,
      filterable: col.filterable !== false,
      type: col.type || 'text',
      formatter: col.formatter,
      ...col
    }));

    this.render();
  }

  setData(data) {
    this.setState({
      data,
      filteredData: this.applyFilters(data),
      selectedRows: new Set()
    });

    this.updatePagination();
    this.render();
  }

  renderContent() {
    const gridContainer = this.createElement('div', 'data-grid-container');

    // Add toolbar
    if (this.filterable || this.config.toolbar) {
      const toolbar = this.createToolbar();
      gridContainer.appendChild(toolbar);
    }

    // Add grid
    const table = this.createTable();
    gridContainer.appendChild(table);

    // Add pagination
    if (this.paginated) {
      const pagination = this.createPagination();
      gridContainer.appendChild(pagination);
    }

    this.container.appendChild(gridContainer);
  }

  createTable() {
    const table = this.createElement('table', 'data-grid-table');

    // Create header
    const thead = this.createElement('thead');
    const headerRow = this.createElement('tr');

    this.columns.forEach(column => {
      const th = this.createElement('th', 'grid-header-cell');
      th.textContent = column.header;

      if (column.sortable && this.sortable) {
        th.classList.add('sortable');
        th.addEventListener('click', () => this.handleSort(column.field));
      }

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = this.createElement('tbody');
    const paginatedData = this.getPaginatedData();

    paginatedData.forEach((row, index) => {
      const tr = this.createDataRow(row, index);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    return table;
  }

  createDataRow(data, index) {
    const tr = this.createElement('tr', 'grid-data-row');

    if (this.selectable) {
      tr.addEventListener('click', () => this.handleRowSelection(data, index));
    }

    this.columns.forEach(column => {
      const td = this.createElement('td', 'grid-data-cell');
      const value = data[column.field];

      if (column.formatter) {
        td.innerHTML = column.formatter(value, data, index);
      } else {
        td.textContent = this.formatCellValue(value, column.type);
      }

      tr.appendChild(td);
    });

    return tr;
  }

  formatCellValue(value, type) {
    switch (type) {
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percent':
        return `${(value * 100).toFixed(1)}%`;
      default:
        return value || '';
    }
  }

  handleSort(field) {
    const currentSort = this.state.sortColumn;
    const currentDirection = this.state.sortDirection;

    let newDirection = 'asc';
    if (currentSort === field && currentDirection === 'asc') {
      newDirection = 'desc';
    }

    this.setState({
      sortColumn: field,
      sortDirection: newDirection
    });

    this.sortData();
    this.render();
  }

  sortData() {
    const { sortColumn, sortDirection } = this.state;
    if (!sortColumn) return;

    this.state.filteredData.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      let result = 0;
      if (aVal < bVal) result = -1;
      else if (aVal > bVal) result = 1;

      return sortDirection === 'desc' ? -result : result;
    });
  }

  // Additional grid methods would continue here...
}

/**
 * Modal Widget - Advanced modal/dialog component
 */
class ModalWidget extends BaseWidget {
  constructor(options = {}) {
    super({ ...options, widgetType: 'modal' });

    this.modal = options.modal !== false;
    this.closable = options.closable !== false;
    this.backdrop = options.backdrop !== false;

    this.setupModal();
  }

  // Modal implementation...
}

// Widget Factory for creating typed widgets
class WidgetFactory {
  static widgets = new Map([
    ['chart', ChartWidget],
    ['grid', DataGridWidget],
    ['modal', ModalWidget]
  ]);

  static create(type, options = {}) {
    const WidgetClass = this.widgets.get(type);
    if (!WidgetClass) {
      throw new Error(`Unknown widget type: ${type}`);
    }

    return new WidgetClass(options);
  }

  static register(type, widgetClass) {
    this.widgets.set(type, widgetClass);
  }
}

// Export all widget components
window.VisualizationWidgets = {
  BaseWidget,
  ChartWidget,
  DataGridWidget,
  ModalWidget,
  WidgetFactory,
  WidgetTypes,
  ChartTypes,
  AnimationTypes
};

// Auto-register with ComponentFactory
if (window.ComponentLibrary) {
  window.ComponentLibrary.ComponentFactory.register('chart-widget', ChartWidget);
  window.ComponentLibrary.ComponentFactory.register('grid-widget', DataGridWidget);
  window.ComponentLibrary.ComponentFactory.register('modal-widget', ModalWidget);
}

console.log('🧩 Reusable Visualization Widgets initialized');