/**
 * Component Documentation and Usage Examples
 * Comprehensive guide for the 绛唇解语花 Visualization Platform
 */

/**
 * Documentation System - Interactive documentation with live examples
 */
class DocumentationSystem {
  constructor() {
    this.sections = new Map();
    this.examples = new Map();
    this.codeHighlighter = new CodeHighlighter();
    this.livePreview = new LivePreview();

    this.setupDocumentation();
  }

  /**
   * Setup comprehensive documentation
   */
  setupDocumentation() {
    this.createComponentLibraryDocs();
    this.createStateManagementDocs();
    this.createVisualizationWidgetDocs();
    this.createThemeSystemDocs();
    this.createSearchSystemDocs();
    this.createCustomizationSystemDocs();
    this.createExportSharingDocs();
    this.createAccessibilityDocs();
  }

  /**
   * Component Library Documentation
   */
  createComponentLibraryDocs() {
    this.addSection('component-library', {
      title: 'Component Library',
      description: 'Production-ready component architecture with TypeScript-style interfaces',
      sections: [
        {
          title: 'BaseComponent',
          description: 'Foundation class for all components with lifecycle management',
          example: `
// Create a custom component
class MyVisualization extends BaseComponent {
  constructor(container, options = {}) {
    super(container, options);
    this.defineInterface({
      data: { type: 'array', required: true },
      title: { type: 'string', default: 'My Visualization' },
      color: { type: 'string', default: '#007bff' }
    });
  }

  render() {
    const { data, title, color } = this.props;
    this.container.innerHTML = \`
      <div class="visualization">
        <h3 style="color: \${color}">\${title}</h3>
        <div class="chart-area">\${this.renderChart(data)}</div>
      </div>
    \`;
  }

  renderChart(data) {
    // Chart rendering logic
    return data.map(item => \`<div class="bar" style="height: \${item.value}px">\${item.label}</div>\`).join('');
  }
}

// Usage
const container = document.getElementById('chart-container');
const chart = new MyVisualization(container, {
  data: [
    { label: 'Q1', value: 100 },
    { label: 'Q2', value: 150 },
    { label: 'Q3', value: 120 }
  ],
  title: 'Quarterly Results',
  color: '#28a745'
});
`,
          features: [
            'Automatic prop validation and type checking',
            'Lifecycle methods (beforeRender, afterRender, beforeDestroy)',
            'Event system with custom events',
            'Responsive design utilities',
            'Error handling and debugging'
          ]
        },
        {
          title: 'VisualizationWidget',
          description: 'Specialized component for data visualizations',
          example: `
// Create data visualization widget
const dataWidget = new VisualizationWidget(container, {
  title: 'Sales Performance',
  data: salesData,
  type: 'line',
  responsive: true,
  interactive: true,
  legend: {
    position: 'bottom',
    align: 'center'
  },
  axes: {
    x: { label: 'Month', format: 'MMM YYYY' },
    y: { label: 'Revenue ($)', format: 'currency' }
  }
});

// Listen for interactions
dataWidget.on('dataPointHover', (point) => {
  console.log('Hovered point:', point);
});

dataWidget.on('dataPointClick', (point) => {
  showDetailModal(point);
});
`,
          features: [
            'Multiple chart types (line, bar, pie, scatter, heatmap)',
            'Interactive features (hover, click, zoom, pan)',
            'Responsive design with automatic scaling',
            'Accessibility features built-in',
            'Animation and transition support'
          ]
        },
        {
          title: 'ComponentFactory',
          description: 'Factory for creating typed components',
          example: `
// Register component types
ComponentFactory.register('lineChart', LineChartWidget);
ComponentFactory.register('barChart', BarChartWidget);
ComponentFactory.register('dataGrid', DataGridWidget);

// Create components by type
const chart = ComponentFactory.create('lineChart', container, {
  data: chartData,
  responsive: true
});

// Batch create components
const widgets = ComponentFactory.createBatch([
  { type: 'lineChart', container: '#chart1', props: { data: data1 } },
  { type: 'barChart', container: '#chart2', props: { data: data2 } },
  { type: 'dataGrid', container: '#grid1', props: { data: gridData } }
]);
`
        }
      ]
    });
  }

  /**
   * State Management Documentation
   */
  createStateManagementDocs() {
    this.addSection('state-management', {
      title: 'State Management System',
      description: 'React-style state management with hooks and context',
      sections: [
        {
          title: 'StateContainer',
          description: 'Core state management with reactive updates',
          example: `
// Create state container
const appState = new StateContainer({
  user: null,
  theme: 'light',
  data: [],
  filters: {
    category: 'all',
    dateRange: 'week'
  }
});

// Subscribe to changes
appState.subscribe('user', (newUser, oldUser) => {
  console.log('User changed:', newUser);
  updateUserInterface(newUser);
});

// Update state
appState.setState({
  user: { name: 'John Doe', role: 'admin' },
  theme: 'dark'
});

// Get state
const currentUser = appState.getState('user');
const allState = appState.getState();
`,
          features: [
            'Reactive state updates with automatic re-rendering',
            'Selective subscriptions to specific state keys',
            'State validation and type checking',
            'Immutable state updates',
            'Developer tools integration'
          ]
        },
        {
          title: 'StateContext',
          description: 'React-style context for component state sharing',
          example: `
// Create context
const ThemeContext = new StateContext({
  theme: 'light',
  primaryColor: '#007bff',
  fontSize: 'medium'
});

// Provider component
class ThemeProvider extends BaseComponent {
  constructor(container, options) {
    super(container, options);
    this.context = ThemeContext;
  }

  render() {
    return \`
      <div class="theme-provider" data-theme="\${this.context.getState('theme')}">
        \${this.renderChildren()}
      </div>
    \`;
  }
}

// Consumer component
class ThemedButton extends BaseComponent {
  constructor(container, options) {
    super(container, options);
    this.useContext(ThemeContext);
  }

  render() {
    const { theme, primaryColor } = this.context.getState();
    return \`
      <button class="btn btn-\${theme}" style="background-color: \${primaryColor}">
        \${this.props.text}
      </button>
    \`;
  }
}
`
        },
        {
          title: 'Custom Hooks',
          description: 'React-style hooks for state management',
          example: `
// State hook
const userHook = new StateHook({ name: '', email: '' });

// Update state
userHook.setState({ name: 'John Doe' });

// Get state
const [user, setUser] = userHook.getState();

// Effect hook
const effectHook = new EffectHook(() => {
  console.log('User changed:', userHook.getState());
  updateUI();
}, [userHook]);

// Computed hook
const computedHook = new ComputedHook(() => {
  const user = userHook.getState();
  return \`Welcome, \${user.name}!\`;
}, [userHook]);

// Reducer hook
const [todos, dispatch] = new ReducerHook(
  (state, action) => {
    switch (action.type) {
      case 'ADD_TODO':
        return [...state, action.payload];
      case 'REMOVE_TODO':
        return state.filter(todo => todo.id !== action.id);
      default:
        return state;
    }
  },
  []
);

// Add todo
dispatch({ type: 'ADD_TODO', payload: { id: 1, text: 'Learn hooks' } });
`
        }
      ]
    });
  }

  /**
   * Visualization Widgets Documentation
   */
  createVisualizationWidgetDocs() {
    this.addSection('visualization-widgets', {
      title: 'Visualization Widgets',
      description: 'Reusable data visualization components',
      sections: [
        {
          title: 'ChartWidget',
          description: 'Multi-type chart component with extensive customization',
          example: `
// Line chart
const lineChart = new ChartWidget(container, {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Sales',
      data: [12, 19, 3, 5, 2],
      borderColor: '#007bff',
      backgroundColor: 'rgba(0, 123, 255, 0.1)'
    }]
  },
  options: {
    responsive: true,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { display: true }
      }
    },
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false
      }
    }
  }
});

// Bar chart with custom styling
const barChart = new ChartWidget(container, {
  type: 'bar',
  data: barData,
  theme: 'medical',
  colorScheme: 'professional',
  interactive: true,
  exportable: true
});

// Real-time updates
lineChart.updateData(newData);
lineChart.addDataPoint({ x: 'Jun', y: 15 });
`,
          features: [
            'Multiple chart types: line, bar, pie, doughnut, scatter, bubble, area',
            'Real-time data updates',
            'Interactive features (zoom, pan, hover, click)',
            'Custom themes and color schemes',
            'Animation and transition effects',
            'Export capabilities',
            'Responsive design',
            'Accessibility support'
          ]
        },
        {
          title: 'DataGridWidget',
          description: 'Advanced data table with sorting, filtering, and pagination',
          example: `
const dataGrid = new DataGridWidget(container, {
  data: tableData,
  columns: [
    { key: 'id', title: 'ID', width: 80, sortable: true },
    { key: 'name', title: 'Name', width: 200, sortable: true, filterable: true },
    { key: 'email', title: 'Email', width: 250, filterable: true },
    { key: 'role', title: 'Role', width: 120,
      formatter: (value) => \`<span class="badge badge-\${value}">\${value}</span>\` },
    { key: 'lastLogin', title: 'Last Login', width: 150,
      formatter: (value) => new Date(value).toLocaleDateString() },
    { key: 'actions', title: 'Actions', width: 120,
      renderer: (row) => \`
        <button onclick="editUser(\${row.id})">Edit</button>
        <button onclick="deleteUser(\${row.id})">Delete</button>
      \` }
  ],
  pagination: {
    pageSize: 20,
    showSizeChanger: true,
    showQuickJumper: true
  },
  selection: {
    type: 'checkbox',
    onChange: (selectedRows) => console.log('Selected:', selectedRows)
  },
  search: {
    enabled: true,
    placeholder: 'Search users...',
    debounce: 300
  },
  export: {
    enabled: true,
    formats: ['csv', 'xlsx', 'pdf']
  }
});

// API integration
dataGrid.setDataSource({
  url: '/api/users',
  method: 'GET',
  pagination: true,
  search: true,
  sort: true
});
`
        },
        {
          title: 'MetricsWidget',
          description: 'KPI and metrics dashboard component',
          example: `
const metricsWidget = new MetricsWidget(container, {
  metrics: [
    {
      title: 'Total Revenue',
      value: 125430,
      format: 'currency',
      trend: { direction: 'up', value: 12.5 },
      target: 130000,
      icon: 'dollar-sign'
    },
    {
      title: 'Active Users',
      value: 1248,
      format: 'number',
      trend: { direction: 'up', value: 8.2 },
      sparkline: [120, 132, 101, 134, 90, 230, 210],
      icon: 'users'
    },
    {
      title: 'Conversion Rate',
      value: 3.24,
      format: 'percentage',
      trend: { direction: 'down', value: -0.5 },
      target: 3.5,
      icon: 'trending-up'
    }
  ],
  layout: 'grid',
  responsive: true,
  animations: true
});
`
        }
      ]
    });
  }

  /**
   * Theme System Documentation
   */
  createThemeSystemDocs() {
    this.addSection('theme-system', {
      title: 'Advanced Theme System',
      description: 'Dynamic theming with CSS custom properties',
      sections: [
        {
          title: 'Basic Theme Usage',
          description: 'Simple theme switching and customization',
          example: `
// Initialize theme manager
const themeManager = new AdvancedThemeManager();

// Apply theme
themeManager.setTheme('dark');

// Create custom theme
const customTheme = {
  name: 'medical-blue',
  displayName: 'Medical Blue',
  type: 'light',
  colors: {
    primary: '#0066cc',
    secondary: '#4da6ff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#212529'
  },
  fonts: {
    primary: 'Inter, sans-serif',
    secondary: 'Roboto, sans-serif',
    monospace: 'Monaco, monospace'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  }
};

// Register and apply custom theme
themeManager.registerTheme(customTheme);
themeManager.setTheme('medical-blue');

// Theme switching with animation
themeManager.setTheme('dark', { animated: true, duration: 300 });
`,
          features: [
            'Pre-built themes (light, dark, high-contrast, auto)',
            'Custom theme creation and registration',
            'Automatic system preference detection',
            'Smooth theme transitions',
            'CSS custom property management',
            'Component-specific theme overrides'
          ]
        },
        {
          title: 'Advanced Theme Features',
          description: 'Theme inheritance, variants, and dynamic generation',
          example: `
// Theme with inheritance
const professionalTheme = themeManager.createTheme({
  extends: 'light',
  name: 'professional',
  overrides: {
    colors: {
      primary: '#2c3e50',
      accent: '#3498db'
    },
    typography: {
      headingFont: 'Playfair Display, serif'
    }
  }
});

// Dynamic theme generation
const brandTheme = themeManager.generateTheme({
  primaryColor: '#7b68ee',
  style: 'modern',
  contrast: 'medium'
});

// Theme variants
themeManager.createVariant('dark', 'dark-blue', {
  colors: { primary: '#1e3a8a' }
});

// Runtime theme modification
themeManager.updateTheme('current', {
  colors: { primary: '#ff6b9d' }
});

// Theme-aware components
class ThemedComponent extends BaseComponent {
  constructor(container, options) {
    super(container, options);
    this.useTheme();
  }

  render() {
    const theme = this.getCurrentTheme();
    return \`
      <div class="component" style="
        background: var(--color-surface);
        color: var(--color-text);
        border-radius: var(--border-radius-md);
      ">
        <h3 style="color: var(--color-primary)">\${this.props.title}</h3>
        <p>\${this.props.content}</p>
      </div>
    \`;
  }
}
`
        }
      ]
    });
  }

  /**
   * Search System Documentation
   */
  createSearchSystemDocs() {
    this.addSection('search-system', {
      title: 'Advanced Search & Filtering',
      description: 'Fuzzy search with intelligent filtering',
      sections: [
        {
          title: 'FuzzySearchEngine',
          description: 'Intelligent search with typo tolerance',
          example: `
// Initialize search engine
const searchEngine = new FuzzySearchEngine({
  data: [
    { id: 1, title: 'Lip Anatomy Model', category: '3d', tags: ['anatomy', 'medical'] },
    { id: 2, title: 'AR Visualization', category: 'ar', tags: ['augmented', 'reality'] },
    { id: 3, title: 'Data Dashboard', category: 'charts', tags: ['analytics', 'kpi'] }
  ],
  searchFields: ['title', 'category', 'tags'],
  options: {
    threshold: 0.6,
    includeScore: true,
    includeMatches: true
  }
});

// Perform search
const results = searchEngine.search('lip anatmy'); // Handles typos
console.log(results);
// Output: [{ item: {...}, score: 0.8, matches: [...] }]

// Advanced search with filters
const advancedResults = searchEngine.search('visualization', {
  filters: {
    category: ['3d', 'ar'],
    tags: { includes: 'medical' }
  },
  sort: 'relevance',
  limit: 10
});

// Real-time search suggestions
const suggestions = searchEngine.suggest('ana');
// Output: ['anatomy', 'analytics', 'analysis']
`,
          features: [
            'Fuzzy matching with Levenshtein distance',
            'Multi-field search capabilities',
            'Real-time search suggestions',
            'Typo tolerance and correction',
            'Relevance scoring',
            'Search highlighting',
            'Search history and caching'
          ]
        },
        {
          title: 'FilterEngine',
          description: 'Advanced filtering with multiple criteria',
          example: `
const filterEngine = new FilterEngine();

// Define filters
filterEngine.addFilter('category', {
  type: 'select',
  values: ['3d', 'ar', 'vr', 'charts'],
  operator: 'equals'
});

filterEngine.addFilter('dateRange', {
  type: 'date-range',
  operator: 'between'
});

filterEngine.addFilter('rating', {
  type: 'range',
  min: 1,
  max: 5,
  operator: 'gte'
});

// Apply filters
const filteredData = filterEngine.apply(data, {
  category: ['3d', 'ar'],
  dateRange: { start: '2023-01-01', end: '2023-12-31' },
  rating: 4
});

// Complex filter chains
const complexFilter = filterEngine.chain()
  .where('category', 'in', ['3d', 'ar'])
  .where('rating', '>=', 4)
  .where('tags', 'contains', 'medical')
  .sort('createdAt', 'desc')
  .limit(20)
  .apply(data);
`
        },
        {
          title: 'SearchComponent',
          description: 'Ready-to-use search interface',
          example: `
const searchComponent = new AdvancedSearchComponent(container, {
  placeholder: 'Search visualizations...',
  showSuggestions: true,
  showFilters: true,
  showHistory: true,
  debounce: 300,
  minLength: 2,
  onSearch: (query, filters) => {
    console.log('Searching for:', query, filters);
    // Perform search and update results
  },
  onClear: () => {
    console.log('Search cleared');
    // Reset to show all results
  },
  filters: [
    {
      key: 'category',
      label: 'Category',
      type: 'multiselect',
      options: categoryOptions
    },
    {
      key: 'dateCreated',
      label: 'Date Created',
      type: 'daterange'
    }
  ]
});

// Programmatic search
searchComponent.search('lip anatomy');
searchComponent.clearSearch();
searchComponent.setFilters({ category: ['3d'] });
`
        }
      ]
    });
  }

  /**
   * Customization System Documentation
   */
  createCustomizationSystemDocs() {
    this.addSection('customization-system', {
      title: 'Component Customization',
      description: 'Interactive configuration panels and real-time customization',
      sections: [
        {
          title: 'ConfigSchema',
          description: 'Define component configuration interfaces',
          example: `
// Create configuration schema
const schema = new ConfigSchema()
  .group('appearance', {
    label: 'Appearance',
    description: 'Visual customization options',
    icon: '🎨',
    order: 1
  })
  .field('title', {
    label: 'Chart Title',
    type: ConfigTypes.STRING,
    defaultValue: 'My Chart',
    group: 'appearance',
    required: true
  })
  .field('theme', {
    label: 'Color Theme',
    type: ConfigTypes.SELECT,
    options: [
      { value: 'default', label: 'Default' },
      { value: 'medical', label: 'Medical' },
      { value: 'professional', label: 'Professional' }
    ],
    group: 'appearance'
  })
  .field('primaryColor', {
    label: 'Primary Color',
    type: ConfigTypes.COLOR,
    defaultValue: '#007bff',
    group: 'appearance',
    conditional: (values) => values.theme === 'custom'
  })
  .group('data', {
    label: 'Data Settings',
    order: 2
  })
  .field('dataSource', {
    label: 'Data Source',
    type: ConfigTypes.SELECT,
    options: [
      { value: 'manual', label: 'Manual Entry' },
      { value: 'api', label: 'API Endpoint' },
      { value: 'file', label: 'File Upload' }
    ],
    group: 'data'
  })
  .field('apiUrl', {
    label: 'API URL',
    type: ConfigTypes.STRING,
    group: 'data',
    conditional: (values) => values.dataSource === 'api',
    validator: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return 'Please enter a valid URL';
      }
    }
  });

// Validate configuration
const isValid = schema.validateField('title', 'My Chart Title');
console.log(isValid); // true

const validation = schema.validateField('apiUrl', 'invalid-url');
console.log(validation); // 'Please enter a valid URL'
`,
          features: [
            'Type-safe field definitions',
            'Group organization with collapsible sections',
            'Conditional field visibility',
            'Custom validation functions',
            'Field dependencies and relationships',
            'Multiple input types (text, color, select, file, etc.)'
          ]
        },
        {
          title: 'ConfigurationPanel',
          description: 'Interactive configuration interface',
          example: `
// Create configuration panel
const configPanel = new ConfigurationPanel({
  container: document.body,
  schema: chartSchema,
  title: 'Chart Configuration',
  description: 'Customize your chart appearance and data',
  type: PanelTypes.DRAWER,
  position: 'right',
  width: '400px',
  livePreview: true,
  autoSave: false,

  // Initial values
  values: {
    title: 'Sales Report',
    theme: 'medical',
    primaryColor: '#0066cc'
  },

  // Event handlers
  onValueChange: (key, value, oldValue, allValues) => {
    console.log(\`\${key} changed from \${oldValue} to \${value}\`);

    // Apply changes in real-time
    if (key === 'theme') {
      chart.setTheme(value);
    } else if (key === 'primaryColor') {
      chart.updateColors({ primary: value });
    }
  },

  onSave: (values) => {
    console.log('Configuration saved:', values);
    chart.applyConfiguration(values);
    configPanel.close();
  },

  onCancel: () => {
    console.log('Configuration cancelled');
    chart.resetConfiguration();
  }
});

// Open panel
configPanel.open();

// Programmatic updates
configPanel.setValue('title', 'New Chart Title');
configPanel.setValues({
  theme: 'professional',
  primaryColor: '#2c3e50'
});

// Listen for panel events
configPanel.on('open', () => console.log('Panel opened'));
configPanel.on('close', () => console.log('Panel closed'));
`
        },
        {
          title: 'Preset Management',
          description: 'Save and load configuration presets',
          example: `
// Preset manager
const presetManager = new PresetManager({
  storage: 'localStorage',
  namespace: 'chart-presets'
});

// Save current configuration as preset
presetManager.savePreset('medical-theme', {
  name: 'Medical Theme',
  description: 'Professional medical visualization theme',
  configuration: configPanel.getValues(),
  thumbnail: 'data:image/png;base64,...',
  tags: ['medical', 'professional', 'blue']
});

// Load preset
const medicalPreset = presetManager.loadPreset('medical-theme');
configPanel.setValues(medicalPreset.configuration);

// List all presets
const presets = presetManager.getPresets();
presets.forEach(preset => {
  console.log(\`\${preset.name}: \${preset.description}\`);
});

// Preset categories
presetManager.createCategory('Medical', {
  icon: '🏥',
  description: 'Medical visualization presets'
});

presetManager.addToCategory('Medical', 'medical-theme');
`
        }
      ]
    });
  }

  /**
   * Export and Sharing Documentation
   */
  createExportSharingDocs() {
    this.addSection('export-sharing', {
      title: 'Export & Sharing System',
      description: 'Comprehensive file generation, sharing, and collaboration features',
      sections: [
        {
          title: 'Export Engine',
          description: 'Multi-format export capabilities',
          example: `
// Export chart as PNG
const pngResult = await exportEngine.export({
  format: ExportFormats.PNG,
  component: chartWidget.container,
  filename: 'sales-chart.png',
  width: 1200,
  height: 800,
  quality: 1.0,
  background: '#ffffff',
  watermark: {
    text: 'Medical Center',
    position: 'bottom-right',
    opacity: 0.3
  }
});

// Export data as CSV
const csvResult = await exportEngine.export({
  format: ExportFormats.CSV,
  data: chartData,
  filename: 'sales-data.csv'
});

// Export as PDF with custom template
const pdfResult = await exportEngine.export({
  format: ExportFormats.PDF,
  component: dashboardContainer,
  filename: 'dashboard-report.pdf',
  template: 'medical-report',
  metadata: {
    title: 'Monthly Medical Report',
    author: 'Dr. Smith',
    subject: 'Patient Analytics'
  }
});

// Batch export multiple formats
const batchResult = await exportEngine.batchExport(
  [ExportFormats.PNG, ExportFormats.PDF, ExportFormats.JSON],
  {
    component: chartWidget.container,
    data: chartData,
    filename: 'chart-export'
  }
);

console.log('Export results:', batchResult.results);
console.log('Export errors:', batchResult.errors);
`,
          features: [
            'Multiple export formats (PNG, JPEG, SVG, PDF, CSV, JSON, Excel)',
            'High-quality image generation with custom resolution',
            'Watermark and branding options',
            'Batch export capabilities',
            'Custom PDF templates',
            'Metadata embedding',
            'Background processing queue'
          ]
        },
        {
          title: 'Sharing System',
          description: 'Social sharing and collaboration features',
          example: `
// Generate shareable link
const shareUrl = await sharingSystem.generateShareableLink(chartData, {
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  downloadable: true,
  viewOnly: false,
  password: 'medical123'
});

console.log('Share URL:', shareUrl);
// Output: https://example.com/share/abc123def456

// Share on social media
await sharingSystem.share({
  method: ShareMethods.SOCIAL,
  platform: SocialPlatforms.TWITTER,
  title: 'Medical Data Visualization',
  description: 'Check out this amazing patient data analysis',
  url: shareUrl,
  image: pngResult.dataURL
});

// Email sharing
await sharingSystem.share({
  method: ShareMethods.EMAIL,
  title: 'Patient Data Report',
  description: 'Please review the attached medical data visualization.',
  url: shareUrl,
  recipients: ['doctor@hospital.com', 'nurse@hospital.com']
});

// Generate QR code
const qrCode = await sharingSystem.generateQRCode(shareUrl, {
  size: 200,
  format: 'png'
});

document.getElementById('qr-container').appendChild(qrCode.canvas);

// Generate embed code
const embedCode = sharingSystem.generateEmbedCode(shareUrl, {
  width: '800px',
  height: '600px',
  responsive: true,
  theme: 'light'
});

console.log('Embed code:', embedCode);
`
        },
        {
          title: 'Collaboration Features',
          description: 'Real-time collaboration and comments',
          example: `
// Collaboration manager
const collaborationManager = new CollaborationManager({
  shareId: 'abc123def456',
  userId: 'user123',
  websocketUrl: 'wss://api.example.com/collaborate'
});

// Real-time cursor tracking
collaborationManager.enableCursorTracking();

// Add comment to visualization
collaborationManager.addComment({
  x: 150,
  y: 200,
  text: 'This data point needs verification',
  author: 'Dr. Smith',
  timestamp: Date.now(),
  thread: true
});

// Listen for collaboration events
collaborationManager.on('userJoined', (user) => {
  console.log(\`\${user.name} joined the session\`);
});

collaborationManager.on('commentAdded', (comment) => {
  showCommentIndicator(comment);
});

// Version control
const versionManager = new VersionManager({
  shareId: 'abc123def456'
});

// Save version
await versionManager.saveVersion({
  name: 'v1.2 - Updated patient data',
  description: 'Added Q3 patient statistics',
  configuration: currentConfig,
  data: currentData
});

// Load previous version
const versions = await versionManager.getVersions();
await versionManager.loadVersion(versions[0].id);
`
        }
      ]
    });
  }

  /**
   * Accessibility System Documentation
   */
  createAccessibilityDocs() {
    this.addSection('accessibility-system', {
      title: 'Accessibility System',
      description: 'WCAG 2.1 AA compliance with comprehensive accessibility features',
      sections: [
        {
          title: 'Basic Accessibility',
          description: 'Essential accessibility features for all components',
          example: `
// Initialize accessibility manager
const accessibilityManager = window.AccessibilitySystem.AccessibilityManager;

// Make any element accessible
const button = AccessibilityUtils.createButton('Export Chart', () => {
  exportChart();
}, {
  role: 'button',
  label: 'Export chart as PNG image',
  description: 'Downloads the current chart as a high-resolution PNG file'
});

// Add to container
container.appendChild(button);

// Create accessible data table
const dataTable = AccessibilityUtils.createAccessibleTable({
  data: patientData,
  columns: [
    { key: 'id', header: 'Patient ID' },
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age' },
    { key: 'diagnosis', header: 'Diagnosis' }
  ],
  caption: 'Patient Data Summary',
  sortable: true,
  filterable: true
});

// Announce important changes
accessibilityManager.announce('Chart data has been updated', 'polite');
accessibilityManager.announce('Error: Failed to load data', 'assertive');

// Screen reader optimizations
if (accessibilityManager.screenReaderActive) {
  // Provide additional context for screen readers
  chart.setAttribute('aria-label', 'Line chart showing patient recovery rates over 6 months');
  chart.setAttribute('aria-describedby', 'chart-summary');
}
`,
          features: [
            'WCAG 2.1 AA compliance checking',
            'Screen reader optimization',
            'Keyboard navigation support',
            'Focus management system',
            'ARIA live regions',
            'Color contrast validation',
            'Alternative text generation'
          ]
        },
        {
          title: 'Advanced Focus Management',
          description: 'Sophisticated focus control for complex interfaces',
          example: `
// Focus manager for complex components
const focusManager = new window.AccessibilitySystem.FocusManager();

// Create focus trap for modal
const modal = document.getElementById('config-modal');
const focusTrap = focusManager.createTrap(modal);

// Modal opened
modal.addEventListener('modal:opened', () => {
  focusManager.saveFocus(); // Save current focus
  focusTrap.activate(); // Trap focus in modal
});

// Modal closed
modal.addEventListener('modal:closed', () => {
  focusTrap.deactivate(); // Release focus trap
  focusManager.restoreFocus(); // Restore previous focus
});

// Advanced keyboard navigation
const gridNavigator = new window.AccessibilitySystem.GridNavigator(
  document.getElementById('chart-grid'),
  {
    selector: '.chart-item',
    columns: 'auto',
    wrap: true,
    announcePosition: true
  }
);

// Custom keyboard shortcuts
const keyboardNavigator = new window.AccessibilitySystem.KeyboardNavigator();

keyboardNavigator.register('Alt+C', () => {
  accessibilityManager.announce('Opening chart configuration');
  openChartConfig();
}, 'Open chart configuration');

keyboardNavigator.register('Alt+E', () => {
  accessibilityManager.announce('Exporting chart');
  exportChart();
}, 'Export current chart');
`
        },
        {
          title: 'Accessibility Auditing',
          description: 'Automated accessibility compliance checking',
          example: `
// Run accessibility audit
const auditor = new window.AccessibilitySystem.AccessibilityAuditor();
const violations = await auditor.audit(document);

console.log(\`Found \${violations.length} accessibility violations\`);

violations.forEach(violation => {
  console.log(\`\${violation.type}: \${violation.message}\`, violation.element);
});

// Contrast checker
const contrastChecker = new window.AccessibilitySystem.ContrastChecker();
const contrastViolations = contrastChecker.checkAll();

contrastViolations.forEach(violation => {
  console.log(\`Contrast ratio \${violation.actual} is below required \${violation.required}\`);
  console.log('Element:', violation.element);
  console.log('Colors:', violation.foreground, 'on', violation.background);
});

// Continuous monitoring
setInterval(() => {
  const newViolations = contrastChecker.checkAll();
  if (newViolations.length > 0) {
    console.warn('New accessibility violations detected:', newViolations);
  }
}, 30000); // Check every 30 seconds

// Accessibility preferences
const preferences = accessibilityManager.preferences;
if (preferences.reduceMotion) {
  // Disable animations
  chart.setOption('animation.duration', 0);
}

if (preferences.highContrast) {
  // Apply high contrast theme
  themeManager.setTheme('high-contrast');
}
`
        }
      ]
    });
  }

  /**
   * Performance Optimization Documentation
   */
  createPerformanceOptimizationDocs() {
    this.addSection('performance-optimization', {
      title: 'Performance Optimization',
      description: 'Tools and techniques for optimal performance',
      sections: [
        {
          title: 'Performance Monitoring',
          description: 'Real-time performance tracking and optimization',
          example: `
// Performance monitor
const performanceMonitor = new PerformanceMonitor({
  metricsCollection: true,
  userTiming: true,
  resourceTiming: true,
  longTaskDetection: true,
  memoryMonitoring: true
});

// Mark performance milestones
performanceMonitor.mark('chart-render-start');
await chart.render();
performanceMonitor.mark('chart-render-end');

// Measure performance
const renderTime = performanceMonitor.measure('chart-render', 'chart-render-start', 'chart-render-end');
console.log(\`Chart render took \${renderTime}ms\`);

// Memory usage monitoring
performanceMonitor.on('memoryWarning', (usage) => {
  console.warn('High memory usage detected:', usage);
  // Trigger cleanup or optimization
  chart.optimizeMemory();
});

// FPS monitoring
performanceMonitor.startFPSMonitoring();
performanceMonitor.on('lowFPS', (fps) => {
  console.warn(\`Low FPS detected: \${fps}\`);
  // Reduce visual complexity
  chart.setQuality('medium');
});

// Bundle size analysis
const bundleAnalyzer = new BundleAnalyzer();
const analysis = bundleAnalyzer.analyze();
console.log('Bundle analysis:', analysis);
`,
          features: [
            'Real-time performance metrics',
            'Memory usage monitoring',
            'FPS tracking and optimization',
            'Bundle size analysis',
            'Render time measurement',
            'Resource loading optimization',
            'Automatic performance tuning'
          ]
        },
        {
          title: 'Lazy Loading',
          description: 'Optimize loading with lazy loading techniques',
          example: `
// Lazy load components
const lazyLoader = new LazyLoader({
  threshold: 0.1, // Load when 10% visible
  rootMargin: '50px',
  unobserveAfter: true
});

// Register lazy-loadable components
lazyLoader.register('.chart-container', async (container) => {
  const chartData = await loadChartData(container.dataset.chartId);
  const chart = new ChartWidget(container, {
    data: chartData,
    type: container.dataset.chartType
  });
  return chart;
});

// Lazy load images
lazyLoader.register('img[data-src]', (img) => {
  img.src = img.dataset.src;
  img.removeAttribute('data-src');
});

// Progressive loading
const progressiveLoader = new ProgressiveLoader();

// Load essential content first
await progressiveLoader.loadEssential([
  'component-library.js',
  'theme-system.js',
  'critical-styles.css'
]);

// Load additional features
progressiveLoader.loadDeferred([
  'search-system.js',
  'export-sharing-system.js',
  'customization-system.js'
]);

// Load nice-to-have features
progressiveLoader.loadOptional([
  'advanced-analytics.js',
  'collaboration.js'
]);
`
        },
        {
          title: 'Optimization Utilities',
          description: 'Performance optimization helpers and techniques',
          example: `
// Debounced and throttled functions
const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);

const throttledScroll = throttle((event) => {
  updateScrollIndicator(event);
}, 16); // ~60fps

// Memoization for expensive calculations
const memoizedCalculation = memoize((data) => {
  return performExpensiveCalculation(data);
});

// Virtual scrolling for large datasets
const virtualScroller = new VirtualScroller(container, {
  itemHeight: 50,
  bufferSize: 10,
  renderItem: (item, index) => {
    return \`<div class="item">\${item.name}</div>\`;
  }
});

virtualScroller.setData(largeDataset);

// Efficient DOM updates
const domBatcher = new DOMBatcher();

// Batch DOM updates for better performance
domBatcher.batch(() => {
  element1.style.color = 'red';
  element2.style.display = 'none';
  element3.textContent = 'Updated';
});

// Web Workers for heavy computations
const dataProcessor = new DataWorker();

const processedData = await dataProcessor.process({
  data: rawData,
  algorithm: 'statistical-analysis',
  options: { precision: 'high' }
});

chart.updateData(processedData);
`
        }
      ]
    });
  }

  /**
   * Add section helper
   */
  addSection(id, config) {
    this.sections.set(id, config);
  }

  /**
   * Generate interactive documentation
   */
  generateDocumentation() {
    const documentation = {
      title: '绛唇解语花 Visualization Platform - Component Documentation',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      sections: Array.from(this.sections.values())
    };

    return documentation;
  }

  /**
   * Create documentation HTML
   */
  createDocumentationHTML() {
    const docs = this.generateDocumentation();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${docs.title}</title>
    <link rel="stylesheet" href="documentation-styles.css">
</head>
<body>
    <div class="documentation-app">
        <nav class="docs-sidebar">
            <div class="docs-header">
                <h1>Component Docs</h1>
                <span class="version">v${docs.version}</span>
            </div>
            <div class="docs-nav">
                ${this.renderNavigation(docs.sections)}
            </div>
        </nav>

        <main class="docs-content">
            <header class="docs-intro">
                <h1>${docs.title}</h1>
                <p>Comprehensive documentation for building beautiful, accessible medical visualizations.</p>
                <div class="docs-meta">
                    <span>Last updated: ${new Date(docs.lastUpdated).toLocaleDateString()}</span>
                </div>
            </header>

            ${this.renderSections(docs.sections)}
        </main>
    </div>

    <script src="documentation-interactive.js"></script>
</body>
</html>
    `;
  }

  /**
   * Render navigation
   */
  renderNavigation(sections) {
    return sections.map(section => `
      <div class="nav-section">
        <a href="#${section.title.toLowerCase().replace(/\s+/g, '-')}" class="nav-link">
          ${section.title}
        </a>
        ${section.sections ? `
          <div class="nav-subsections">
            ${section.sections.map(sub => `
              <a href="#${sub.title.toLowerCase().replace(/\s+/g, '-')}" class="nav-sublink">
                ${sub.title}
              </a>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  /**
   * Render sections
   */
  renderSections(sections) {
    return sections.map(section => `
      <section class="docs-section" id="${section.title.toLowerCase().replace(/\s+/g, '-')}">
        <h2>${section.title}</h2>
        <p class="section-description">${section.description}</p>

        ${section.sections ? section.sections.map(subsection => `
          <div class="docs-subsection" id="${subsection.title.toLowerCase().replace(/\s+/g, '-')}">
            <h3>${subsection.title}</h3>
            <p>${subsection.description}</p>

            ${subsection.example ? `
              <div class="code-example">
                <div class="example-tabs">
                  <button class="tab-btn active" data-tab="code">Code</button>
                  <button class="tab-btn" data-tab="preview">Preview</button>
                </div>
                <div class="tab-content">
                  <div class="tab-pane active" data-tab="code">
                    <pre><code class="language-javascript">${this.escapeHtml(subsection.example)}</code></pre>
                  </div>
                  <div class="tab-pane" data-tab="preview">
                    <div class="live-preview" data-example="${subsection.title}">
                      <!-- Live preview will be rendered here -->
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}

            ${subsection.features ? `
              <div class="feature-list">
                <h4>Features:</h4>
                <ul>
                  ${subsection.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('') : ''}
      </section>
    `).join('');
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Code Highlighter for documentation
 */
class CodeHighlighter {
  constructor() {
    this.languages = {
      javascript: this.highlightJavaScript,
      css: this.highlightCSS,
      html: this.highlightHTML
    };
  }

  highlight(code, language = 'javascript') {
    const highlighter = this.languages[language];
    return highlighter ? highlighter(code) : code;
  }

  highlightJavaScript(code) {
    return code
      .replace(/\b(class|function|const|let|var|if|else|for|while|return|new|this|super|extends|import|export|from|async|await|try|catch|finally|throw)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="literal">$1</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
      .replace(/'([^'\\]|\\.)*'/g, '<span class="string">$&</span>')
      .replace(/"([^"\\]|\\.)*"/g, '<span class="string">$&</span>')
      .replace(/`([^`\\]|\\.)*`/g, '<span class="template">$&</span>');
  }

  highlightCSS(code) {
    return code
      .replace(/([.#][a-zA-Z-_][a-zA-Z0-9-_]*)/g, '<span class="selector">$1</span>')
      .replace(/([a-zA-Z-]+)(?=\s*:)/g, '<span class="property">$1</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
  }

  highlightHTML(code) {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;\/?[a-zA-Z][^&]*&gt;)/g, '<span class="tag">$1</span>');
  }
}

/**
 * Live Preview System
 */
class LivePreview {
  constructor() {
    this.previews = new Map();
    this.setupPreviewEnvironment();
  }

  setupPreviewEnvironment() {
    // Create isolated environment for running examples
    this.sandbox = {
      BaseComponent: window.ComponentLibrary?.BaseComponent,
      VisualizationWidget: window.ComponentLibrary?.VisualizationWidget,
      StateContainer: window.StateManagement?.StateContainer,
      ChartWidget: window.VisualizationWidgets?.ChartWidget,
      AdvancedThemeManager: window.ThemeSystem?.AdvancedThemeManager
    };
  }

  renderPreview(exampleName, container) {
    const previewFn = this.previews.get(exampleName);
    if (previewFn) {
      try {
        previewFn(container, this.sandbox);
      } catch (error) {
        container.innerHTML = `<div class="preview-error">Preview Error: ${error.message}</div>`;
      }
    } else {
      container.innerHTML = '<div class="preview-placeholder">Preview not available</div>';
    }
  }

  registerPreview(name, renderFunction) {
    this.previews.set(name, renderFunction);
  }
}

// Quick Start Guide
const QuickStartGuide = {
  title: 'Quick Start Guide',
  steps: [
    {
      title: '1. Include the Library',
      description: 'Add the component library scripts to your HTML',
      code: `
<!-- Core library files -->
<script src="component-library.js"></script>
<script src="state-management.js"></script>
<script src="visualization-widgets.js"></script>
<script src="theme-system.js"></script>

<!-- Optional features -->
<script src="search-system.js"></script>
<script src="customization-system.js"></script>
<script src="export-sharing-system.js"></script>
<script src="accessibility-system.js"></script>

<!-- Styles -->
<link rel="stylesheet" href="visualization-styles.css">
      `
    },
    {
      title: '2. Create Your First Chart',
      description: 'Create a simple line chart with sample data',
      code: `
// Get container element
const container = document.getElementById('my-chart');

// Create chart widget
const chart = new ChartWidget(container, {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Sample Data',
      data: [10, 25, 15, 30, 20],
      borderColor: '#007bff',
      backgroundColor: 'rgba(0, 123, 255, 0.1)'
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'My First Chart'
      }
    }
  }
});
      `
    },
    {
      title: '3. Add State Management',
      description: 'Manage your application state reactively',
      code: `
// Create state container
const appState = new StateContainer({
  chartData: [],
  selectedTheme: 'light',
  userPreferences: {}
});

// Subscribe to changes
appState.subscribe('chartData', (newData) => {
  chart.updateData(newData);
});

// Update data
appState.setState({
  chartData: newChartData
});
      `
    },
    {
      title: '4. Apply Theming',
      description: 'Use the theme system for consistent styling',
      code: `
// Initialize theme manager
const themeManager = new AdvancedThemeManager();

// Apply theme
themeManager.setTheme('dark');

// Listen for system preference changes
themeManager.enableAutoTheme();

// Create custom theme
const customTheme = {
  name: 'brand',
  colors: {
    primary: '#your-brand-color',
    secondary: '#your-secondary-color'
  }
};

themeManager.registerTheme(customTheme);
      `
    }
  ]
};

// Initialize documentation system
const documentationSystem = new DocumentationSystem();

// Export for global access
window.DocumentationSystem = {
  DocumentationSystem,
  CodeHighlighter,
  LivePreview,
  QuickStartGuide
};

console.log('📚 Component Documentation System initialized');