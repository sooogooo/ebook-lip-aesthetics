/**
 * Component Customization System for 绛唇解语花 Visualization Platform
 * Interactive configuration panels and real-time customization
 */

/**
 * Configuration Types and Interfaces
 */
const ConfigTypes = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  COLOR: 'color',
  SELECT: 'select',
  RANGE: 'range',
  MULTI_SELECT: 'multi-select',
  OBJECT: 'object',
  ARRAY: 'array',
  FILE: 'file',
  DATE: 'date',
  TIME: 'time'
};

const PanelTypes = {
  DRAWER: 'drawer',
  MODAL: 'modal',
  SIDEBAR: 'sidebar',
  INLINE: 'inline',
  FLOATING: 'floating'
};

/**
 * Configuration Schema Definition
 */
class ConfigSchema {
  constructor(schema = {}) {
    this.schema = schema;
    this.groups = new Map();
    this.validators = new Map();
    this.dependencies = new Map();

    this.setupDefaultValidators();
  }

  /**
   * Define configuration group
   */
  group(name, config) {
    this.groups.set(name, {
      label: config.label || name,
      description: config.description,
      icon: config.icon,
      order: config.order || 0,
      collapsible: config.collapsible !== false,
      fields: config.fields || []
    });
    return this;
  }

  /**
   * Add field to schema
   */
  field(key, config) {
    const field = {
      key,
      label: config.label || key,
      type: config.type || ConfigTypes.STRING,
      defaultValue: config.defaultValue,
      required: config.required || false,
      description: config.description,
      placeholder: config.placeholder,
      options: config.options, // for select/multi-select
      min: config.min,
      max: config.max,
      step: config.step,
      pattern: config.pattern,
      group: config.group || 'general',
      validator: config.validator,
      dependencies: config.dependencies || [],
      conditional: config.conditional, // function to determine if field should be shown
      onChange: config.onChange,
      order: config.order || 0,
      width: config.width || 'full', // full, half, third, quarter
      advanced: config.advanced || false
    };

    // Add to group
    if (!this.groups.has(field.group)) {
      this.group(field.group, { label: field.group });
    }

    const group = this.groups.get(field.group);
    group.fields.push(field);
    group.fields.sort((a, b) => a.order - b.order);

    // Setup validator
    if (field.validator) {
      this.validators.set(key, field.validator);
    }

    // Setup dependencies
    if (field.dependencies.length > 0) {
      this.dependencies.set(key, field.dependencies);
    }

    return this;
  }

  /**
   * Setup default validators
   */
  setupDefaultValidators() {
    this.validators.set('email', (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) || 'Invalid email format';
    });

    this.validators.set('url', (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return 'Invalid URL format';
      }
    });

    this.validators.set('required', (value) => {
      return value != null && value !== '' || 'This field is required';
    });

    this.validators.set('number', (value) => {
      return !isNaN(Number(value)) || 'Must be a valid number';
    });

    this.validators.set('positive', (value) => {
      return Number(value) > 0 || 'Must be a positive number';
    });
  }

  /**
   * Validate field value
   */
  validateField(key, value, allValues = {}) {
    const field = this.getField(key);
    if (!field) return true;

    // Required validation
    if (field.required && (value == null || value === '')) {
      return 'This field is required';
    }

    // Type validation
    const typeValidation = this.validateType(value, field.type, field);
    if (typeValidation !== true) return typeValidation;

    // Custom validator
    if (field.validator) {
      const result = field.validator(value, allValues, field);
      if (result !== true) return result;
    }

    // Schema-level validator
    const validator = this.validators.get(key);
    if (validator) {
      const result = validator(value, allValues, field);
      if (result !== true) return result;
    }

    return true;
  }

  /**
   * Validate type
   */
  validateType(value, type, field) {
    switch (type) {
      case ConfigTypes.NUMBER:
        if (isNaN(Number(value))) return 'Must be a valid number';
        if (field.min != null && Number(value) < field.min) return `Must be at least ${field.min}`;
        if (field.max != null && Number(value) > field.max) return `Must be at most ${field.max}`;
        break;

      case ConfigTypes.COLOR:
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!colorRegex.test(value)) return 'Must be a valid hex color';
        break;

      case ConfigTypes.SELECT:
        if (field.options && !field.options.some(opt => opt.value === value)) {
          return 'Must select a valid option';
        }
        break;

      case ConfigTypes.MULTI_SELECT:
        if (!Array.isArray(value)) return 'Must be an array';
        if (field.options) {
          const validValues = field.options.map(opt => opt.value);
          const invalid = value.find(v => !validValues.includes(v));
          if (invalid) return `Invalid option: ${invalid}`;
        }
        break;
    }

    return true;
  }

  /**
   * Get field definition
   */
  getField(key) {
    for (const group of this.groups.values()) {
      const field = group.fields.find(f => f.key === key);
      if (field) return field;
    }
    return null;
  }

  /**
   * Get all groups
   */
  getGroups() {
    return Array.from(this.groups.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Check if field should be visible
   */
  isFieldVisible(key, values) {
    const field = this.getField(key);
    if (!field) return false;

    if (field.conditional) {
      return field.conditional(values, field);
    }

    return true;
  }
}

/**
 * Configuration Panel Component
 */
class ConfigurationPanel {
  constructor(options = {}) {
    this.container = options.container;
    this.schema = options.schema || new ConfigSchema();
    this.initialValues = options.values || {};
    this.panelType = options.type || PanelTypes.DRAWER;
    this.title = options.title || 'Configuration';
    this.description = options.description;
    this.width = options.width || '400px';
    this.height = options.height || 'auto';
    this.position = options.position || 'right';
    this.closable = options.closable !== false;
    this.collapsible = options.collapsible !== false;
    this.resizable = options.resizable || false;
    this.autoSave = options.autoSave || false;
    this.livePreview = options.livePreview !== false;

    this.values = { ...this.initialValues };
    this.errors = new Map();
    this.isOpen = false;
    this.isDirty = false;

    this.onValueChange = options.onValueChange || (() => {});
    this.onSave = options.onSave || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this.onReset = options.onReset || (() => {});

    this.init();
  }

  /**
   * Initialize panel
   */
  init() {
    this.createElement();
    this.render();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  /**
   * Create panel element
   */
  createElement() {
    this.panel = document.createElement('div');
    this.panel.className = `config-panel config-panel-${this.panelType}`;
    this.panel.setAttribute('data-position', this.position);
    this.panel.setAttribute('aria-hidden', 'true');
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-labelledby', 'config-panel-title');

    if (this.width) {
      this.panel.style.width = this.width;
    }

    if (this.height && this.height !== 'auto') {
      this.panel.style.height = this.height;
    }

    // Add to container or body
    (this.container || document.body).appendChild(this.panel);

    // Create backdrop for modal type
    if (this.panelType === PanelTypes.MODAL) {
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'config-panel-backdrop';
      this.panel.parentNode.insertBefore(this.backdrop, this.panel);
    }
  }

  /**
   * Render panel content
   */
  render() {
    this.panel.innerHTML = `
      <div class="config-panel-header">
        <div class="config-panel-title-section">
          <h2 id="config-panel-title" class="config-panel-title">${this.title}</h2>
          ${this.description ? `<p class="config-panel-description">${this.description}</p>` : ''}
        </div>
        <div class="config-panel-header-actions">
          ${this.collapsible ? '<button class="config-panel-collapse-btn" aria-label="Collapse panel">−</button>' : ''}
          ${this.closable ? '<button class="config-panel-close-btn" aria-label="Close panel">×</button>' : ''}
        </div>
      </div>

      <div class="config-panel-content">
        <div class="config-panel-toolbar">
          <div class="config-panel-search">
            <input type="text" placeholder="Search settings..." class="config-search-input" />
          </div>
          <div class="config-panel-view-toggle">
            <button class="view-toggle-btn active" data-view="grouped">Grouped</button>
            <button class="view-toggle-btn" data-view="list">List</button>
          </div>
        </div>

        <div class="config-panel-tabs">
          <button class="config-tab active" data-tab="basic">Basic</button>
          <button class="config-tab" data-tab="advanced">Advanced</button>
          <button class="config-tab" data-tab="presets">Presets</button>
        </div>

        <div class="config-panel-body" id="config-panel-body">
          ${this.renderGroups()}
        </div>

        <div class="config-panel-footer">
          <div class="config-panel-status">
            <span class="config-dirty-indicator" ${this.isDirty ? '' : 'hidden'}>●</span>
            <span class="config-validation-status"></span>
          </div>
          <div class="config-panel-actions">
            <button class="btn btn-secondary config-reset-btn">Reset</button>
            <button class="btn btn-secondary config-cancel-btn">Cancel</button>
            <button class="btn btn-primary config-save-btn">Save</button>
          </div>
        </div>
      </div>
    `;

    this.setupFormElements();
  }

  /**
   * Render configuration groups
   */
  renderGroups() {
    const groups = this.schema.getGroups();

    return groups.map(group => `
      <div class="config-group" data-group="${group.label}">
        <div class="config-group-header">
          <h3 class="config-group-title">
            ${group.icon ? `<span class="config-group-icon">${group.icon}</span>` : ''}
            ${group.label}
          </h3>
          ${group.description ? `<p class="config-group-description">${group.description}</p>` : ''}
          ${group.collapsible ? '<button class="config-group-toggle" aria-expanded="true">−</button>' : ''}
        </div>
        <div class="config-group-content">
          ${this.renderFields(group.fields)}
        </div>
      </div>
    `).join('');
  }

  /**
   * Render configuration fields
   */
  renderFields(fields) {
    return fields.map(field => {
      if (!this.schema.isFieldVisible(field.key, this.values)) {
        return '';
      }

      return `
        <div class="config-field config-field-${field.type} config-width-${field.width}" data-field="${field.key}">
          <div class="config-field-header">
            <label class="config-field-label" for="config-${field.key}">
              ${field.label}
              ${field.required ? '<span class="config-field-required">*</span>' : ''}
            </label>
            ${field.description ? `<p class="config-field-description">${field.description}</p>` : ''}
          </div>
          <div class="config-field-input">
            ${this.renderFieldInput(field)}
            <div class="config-field-error" hidden></div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render field input based on type
   */
  renderFieldInput(field) {
    const value = this.values[field.key] ?? field.defaultValue ?? '';
    const inputId = `config-${field.key}`;

    switch (field.type) {
      case ConfigTypes.STRING:
        return `
          <input
            type="text"
            id="${inputId}"
            class="config-input"
            value="${value}"
            placeholder="${field.placeholder || ''}"
            ${field.pattern ? `pattern="${field.pattern}"` : ''}
            ${field.required ? 'required' : ''}
          />
        `;

      case ConfigTypes.NUMBER:
        return `
          <input
            type="number"
            id="${inputId}"
            class="config-input"
            value="${value}"
            ${field.min != null ? `min="${field.min}"` : ''}
            ${field.max != null ? `max="${field.max}"` : ''}
            ${field.step != null ? `step="${field.step}"` : ''}
            ${field.required ? 'required' : ''}
          />
        `;

      case ConfigTypes.BOOLEAN:
        return `
          <label class="config-switch">
            <input
              type="checkbox"
              id="${inputId}"
              class="config-input"
              ${value ? 'checked' : ''}
            />
            <span class="config-switch-slider"></span>
          </label>
        `;

      case ConfigTypes.COLOR:
        return `
          <div class="config-color-input">
            <input
              type="color"
              id="${inputId}"
              class="config-input config-color-picker"
              value="${value}"
            />
            <input
              type="text"
              class="config-input config-color-text"
              value="${value}"
              placeholder="#000000"
            />
          </div>
        `;

      case ConfigTypes.SELECT:
        return `
          <select id="${inputId}" class="config-input config-select">
            ${field.options ? field.options.map(option => `
              <option value="${option.value}" ${option.value === value ? 'selected' : ''}>
                ${option.label || option.value}
              </option>
            `).join('') : ''}
          </select>
        `;

      case ConfigTypes.RANGE:
        return `
          <div class="config-range-input">
            <input
              type="range"
              id="${inputId}"
              class="config-input config-range"
              value="${value}"
              min="${field.min || 0}"
              max="${field.max || 100}"
              step="${field.step || 1}"
            />
            <span class="config-range-value">${value}</span>
          </div>
        `;

      case ConfigTypes.MULTI_SELECT:
        return `
          <div class="config-multi-select">
            ${field.options ? field.options.map(option => `
              <label class="config-checkbox">
                <input
                  type="checkbox"
                  value="${option.value}"
                  ${Array.isArray(value) && value.includes(option.value) ? 'checked' : ''}
                />
                <span class="config-checkbox-label">${option.label || option.value}</span>
              </label>
            `).join('') : ''}
          </div>
        `;

      case ConfigTypes.FILE:
        return `
          <div class="config-file-input">
            <input
              type="file"
              id="${inputId}"
              class="config-input config-file"
              accept="${field.accept || '*'}"
              ${field.multiple ? 'multiple' : ''}
            />
            <div class="config-file-preview" hidden></div>
          </div>
        `;

      default:
        return `<input type="text" id="${inputId}" class="config-input" value="${value}" />`;
    }
  }

  /**
   * Setup form element event listeners
   */
  setupFormElements() {
    const inputs = this.panel.querySelectorAll('.config-input');

    inputs.forEach(input => {
      const field = input.closest('.config-field');
      const fieldKey = field?.dataset.field;

      if (!fieldKey) return;

      // Setup change handler
      const changeHandler = (event) => {
        this.handleFieldChange(fieldKey, event.target, event);
      };

      input.addEventListener('input', changeHandler);
      input.addEventListener('change', changeHandler);

      // Setup specific handlers
      if (input.type === 'color') {
        const textInput = field.querySelector('.config-color-text');
        if (textInput) {
          textInput.addEventListener('input', (e) => {
            input.value = e.target.value;
            this.handleFieldChange(fieldKey, input, e);
          });

          input.addEventListener('input', (e) => {
            textInput.value = e.target.value;
          });
        }
      }

      if (input.type === 'range') {
        const valueDisplay = field.querySelector('.config-range-value');
        if (valueDisplay) {
          input.addEventListener('input', (e) => {
            valueDisplay.textContent = e.target.value;
          });
        }
      }

      if (input.type === 'file') {
        input.addEventListener('change', (e) => {
          this.handleFileChange(fieldKey, e.target.files);
        });
      }
    });

    // Multi-select checkboxes
    this.panel.querySelectorAll('.config-multi-select input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const field = e.target.closest('.config-field');
        const fieldKey = field?.dataset.field;
        if (fieldKey) {
          this.handleMultiSelectChange(fieldKey);
        }
      });
    });
  }

  /**
   * Handle field value change
   */
  handleFieldChange(fieldKey, input, event) {
    let value = input.value;

    // Type conversion
    if (input.type === 'number') {
      value = parseFloat(value) || 0;
    } else if (input.type === 'checkbox') {
      value = input.checked;
    }

    this.setValue(fieldKey, value);
  }

  /**
   * Handle multi-select change
   */
  handleMultiSelectChange(fieldKey) {
    const field = this.panel.querySelector(`[data-field="${fieldKey}"]`);
    const checkboxes = field.querySelectorAll('input[type="checkbox"]:checked');
    const values = Array.from(checkboxes).map(cb => cb.value);
    this.setValue(fieldKey, values);
  }

  /**
   * Handle file input change
   */
  async handleFileChange(fieldKey, files) {
    if (files.length === 0) {
      this.setValue(fieldKey, null);
      return;
    }

    const field = this.schema.getField(fieldKey);
    const fileArray = Array.from(files);

    if (field.multiple) {
      this.setValue(fieldKey, fileArray);
    } else {
      this.setValue(fieldKey, fileArray[0]);
    }

    // Show preview for images
    this.showFilePreview(fieldKey, fileArray);
  }

  /**
   * Show file preview
   */
  async showFilePreview(fieldKey, files) {
    const field = this.panel.querySelector(`[data-field="${fieldKey}"]`);
    const preview = field.querySelector('.config-file-preview');

    if (!preview) return;

    preview.innerHTML = '';
    preview.removeAttribute('hidden');

    for (const file of files.slice(0, 5)) { // Max 5 previews
      const previewItem = document.createElement('div');
      previewItem.className = 'config-file-preview-item';

      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => URL.revokeObjectURL(img.src);
        previewItem.appendChild(img);
      } else {
        previewItem.innerHTML = `
          <div class="file-icon">📄</div>
          <div class="file-name">${file.name}</div>
          <div class="file-size">${this.formatFileSize(file.size)}</div>
        `;
      }

      preview.appendChild(previewItem);
    }
  }

  /**
   * Set field value
   */
  setValue(key, value, silent = false) {
    const oldValue = this.values[key];
    this.values[key] = value;

    // Validate
    const validation = this.schema.validateField(key, value, this.values);
    if (validation === true) {
      this.clearFieldError(key);
    } else {
      this.setFieldError(key, validation);
    }

    // Update dirty state
    this.updateDirtyState();

    // Update dependent fields
    this.updateDependentFields(key);

    // Trigger change callback
    if (!silent) {
      this.onValueChange(key, value, oldValue, this.values);

      // Auto-save if enabled
      if (this.autoSave) {
        this.debounceAutoSave();
      }

      // Live preview
      if (this.livePreview) {
        this.triggerPreview();
      }
    }
  }

  /**
   * Update dependent fields visibility/validation
   */
  updateDependentFields(changedKey) {
    // Find fields that depend on the changed field
    for (const [key, dependencies] of this.schema.dependencies) {
      if (dependencies.includes(changedKey)) {
        const field = this.panel.querySelector(`[data-field="${key}"]`);
        if (field) {
          const isVisible = this.schema.isFieldVisible(key, this.values);
          field.style.display = isVisible ? '' : 'none';

          // Re-validate dependent field
          if (isVisible) {
            const input = field.querySelector('.config-input');
            if (input) {
              this.handleFieldChange(key, input, { target: input });
            }
          }
        }
      }
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Panel controls
    const closeBtn = this.panel.querySelector('.config-panel-close-btn');
    const collapseBtn = this.panel.querySelector('.config-panel-collapse-btn');
    const saveBtn = this.panel.querySelector('.config-save-btn');
    const cancelBtn = this.panel.querySelector('.config-cancel-btn');
    const resetBtn = this.panel.querySelector('.config-reset-btn');

    closeBtn?.addEventListener('click', () => this.close());
    collapseBtn?.addEventListener('click', () => this.toggleCollapse());
    saveBtn?.addEventListener('click', () => this.save());
    cancelBtn?.addEventListener('click', () => this.cancel());
    resetBtn?.addEventListener('click', () => this.reset());

    // Backdrop click for modal
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }

    // Search
    const searchInput = this.panel.querySelector('.config-search-input');
    searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));

    // View toggle
    this.panel.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.panel.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.panel.setAttribute('data-view', e.target.dataset.view);
      });
    });

    // Tab switching
    this.panel.querySelectorAll('.config-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Group collapsing
    this.panel.querySelectorAll('.config-group-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => this.toggleGroup(e.target.closest('.config-group')));
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    this.panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        this.save();
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.save();
      }
    });
  }

  // Additional methods for panel functionality...
  open() { /* Implementation */ }
  close() { /* Implementation */ }
  save() { /* Implementation */ }
  cancel() { /* Implementation */ }
  reset() { /* Implementation */ }
  toggleCollapse() { /* Implementation */ }
  handleSearch(query) { /* Implementation */ }
  switchTab(tab) { /* Implementation */ }
  toggleGroup(group) { /* Implementation */ }
  updateDirtyState() { /* Implementation */ }
  setFieldError(key, message) { /* Implementation */ }
  clearFieldError(key) { /* Implementation */ }
  formatFileSize(bytes) { /* Implementation */ }
  debounceAutoSave() { /* Implementation */ }
  triggerPreview() { /* Implementation */ }
}

// Export customization system
window.CustomizationSystem = {
  ConfigSchema,
  ConfigurationPanel,
  ConfigTypes,
  PanelTypes
};

console.log('⚙️ Component Customization System initialized');