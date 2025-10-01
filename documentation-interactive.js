/**
 * Interactive Documentation JavaScript
 * Handles tab switching, live previews, search, and navigation
 */

class InteractiveDocumentation {
  constructor() {
    this.currentSection = null;
    this.searchIndex = null;
    this.livePreviewManager = null;
    this.mobileMenuOpen = false;

    this.init();
  }

  init() {
    this.setupTabSwitching();
    this.setupLivePreviewSystem();
    this.setupSearchFunctionality();
    this.setupNavigationHighlighting();
    this.setupMobileMenu();
    this.setupKeyboardShortcuts();
    this.setupScrollSpy();
    this.buildSearchIndex();
    this.setupCodeCopyButtons();
    this.setupThemeToggle();
  }

  /**
   * Setup tab switching for code examples
   */
  setupTabSwitching() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-btn')) {
        const tabContainer = e.target.closest('.code-example');
        const targetTab = e.target.dataset.tab;

        // Update tab buttons
        tabContainer.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        e.target.classList.add('active');

        // Update tab panes
        tabContainer.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.remove('active');
        });
        tabContainer.querySelector(`[data-tab="${targetTab}"]`).classList.add('active');

        // Initialize live preview if switching to preview tab
        if (targetTab === 'preview') {
          this.initializeLivePreview(tabContainer);
        }
      }
    });
  }

  /**
   * Setup live preview system
   */
  setupLivePreviewSystem() {
    this.livePreviewManager = new LivePreviewManager();

    // Register preview handlers
    this.livePreviewManager.register('BaseComponent', this.createBaseComponentPreview);
    this.livePreviewManager.register('ChartWidget', this.createChartWidgetPreview);
    this.livePreviewManager.register('ConfigurationPanel', this.createConfigPanelPreview);
    this.livePreviewManager.register('ThemeSystem', this.createThemeSystemPreview);
    this.livePreviewManager.register('SearchSystem', this.createSearchSystemPreview);
  }

  /**
   * Initialize live preview for a specific example
   */
  initializeLivePreview(tabContainer) {
    const previewContainer = tabContainer.querySelector('.live-preview');
    const exampleName = previewContainer?.dataset.example;

    if (previewContainer && exampleName && !previewContainer.dataset.initialized) {
      this.livePreviewManager.render(exampleName, previewContainer);
      previewContainer.dataset.initialized = 'true';
    }
  }

  /**
   * Setup search functionality
   */
  setupSearchFunctionality() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;

    // Debounced search
    const debouncedSearch = this.debounce((query) => {
      this.performSearch(query);
    }, 300);

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });

    // Search keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  /**
   * Build search index
   */
  buildSearchIndex() {
    this.searchIndex = [];

    // Index sections and subsections
    document.querySelectorAll('.docs-section').forEach(section => {
      const sectionTitle = section.querySelector('h2')?.textContent;
      const sectionId = section.id;
      const sectionDescription = section.querySelector('.section-description')?.textContent;

      if (sectionTitle && sectionId) {
        this.searchIndex.push({
          title: sectionTitle,
          description: sectionDescription || '',
          id: sectionId,
          type: 'section',
          element: section
        });

        // Index subsections
        section.querySelectorAll('.docs-subsection').forEach(subsection => {
          const subsectionTitle = subsection.querySelector('h3')?.textContent;
          const subsectionId = subsection.id;
          const subsectionDescription = subsection.querySelector('p')?.textContent;

          if (subsectionTitle && subsectionId) {
            this.searchIndex.push({
              title: subsectionTitle,
              description: subsectionDescription || '',
              id: subsectionId,
              type: 'subsection',
              parent: sectionTitle,
              element: subsection
            });
          }
        });
      }
    });
  }

  /**
   * Perform search
   */
  performSearch(query) {
    if (!query.trim()) {
      this.clearSearchResults();
      return;
    }

    const results = this.fuzzySearch(query);
    this.displaySearchResults(results, query);
  }

  /**
   * Fuzzy search implementation
   */
  fuzzySearch(query) {
    const normalizedQuery = query.toLowerCase();
    const results = [];

    this.searchIndex.forEach(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const descriptionLower = item.description.toLowerCase();

      // Exact match bonus
      if (titleLower.includes(normalizedQuery)) {
        score += 100;
      }

      if (descriptionLower.includes(normalizedQuery)) {
        score += 50;
      }

      // Fuzzy matching
      score += this.calculateFuzzyScore(titleLower, normalizedQuery) * 10;
      score += this.calculateFuzzyScore(descriptionLower, normalizedQuery) * 5;

      if (score > 0) {
        results.push({ ...item, score });
      }
    });

    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  /**
   * Calculate fuzzy score
   */
  calculateFuzzyScore(text, query) {
    if (text.includes(query)) return 10;

    let score = 0;
    let queryIndex = 0;

    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        score++;
        queryIndex++;
      }
    }

    return queryIndex === query.length ? score : 0;
  }

  /**
   * Display search results
   */
  displaySearchResults(results, query) {
    let resultsContainer = document.querySelector('.search-results');

    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.className = 'search-results';
      document.querySelector('.docs-search').appendChild(resultsContainer);
    }

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-no-results">
          <p>No results found for "${query}"</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = `
      <div class="search-results-header">
        <span>${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"</span>
      </div>
      ${results.map(result => `
        <div class="search-result-item" data-id="${result.id}">
          <div class="search-result-title">${this.highlightText(result.title, query)}</div>
          ${result.parent ? `<div class="search-result-parent">${result.parent}</div>` : ''}
          <div class="search-result-description">${this.highlightText(result.description.substring(0, 150), query)}${result.description.length > 150 ? '...' : ''}</div>
        </div>
      `).join('')}
    `;

    // Add click handlers
    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const targetId = item.dataset.id;
        this.navigateToSection(targetId);
        this.clearSearchResults();
      });
    });
  }

  /**
   * Highlight search text
   */
  highlightText(text, query) {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Clear search results
   */
  clearSearchResults() {
    const resultsContainer = document.querySelector('.search-results');
    if (resultsContainer) {
      resultsContainer.remove();
    }
  }

  /**
   * Setup navigation highlighting
   */
  setupNavigationHighlighting() {
    // Highlight active navigation item based on scroll position
    this.updateActiveNavigation();
  }

  /**
   * Setup mobile menu
   */
  setupMobileMenu() {
    // Create mobile menu toggle if it doesn't exist
    if (!document.querySelector('.mobile-menu-toggle')) {
      const toggle = document.createElement('button');
      toggle.className = 'mobile-menu-toggle';
      toggle.innerHTML = '☰';
      toggle.setAttribute('aria-label', 'Toggle navigation menu');
      document.body.appendChild(toggle);

      toggle.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.mobileMenuOpen && !e.target.closest('.docs-sidebar') && !e.target.closest('.mobile-menu-toggle')) {
        this.closeMobileMenu();
      }
    });
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    const sidebar = document.querySelector('.docs-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
      this.mobileMenuOpen = sidebar.classList.contains('open');
    }
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    const sidebar = document.querySelector('.docs-sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
      this.mobileMenuOpen = false;
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Navigation shortcuts
      if (e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            this.navigateToSection('component-library');
            break;
          case '2':
            e.preventDefault();
            this.navigateToSection('state-management');
            break;
          case '3':
            e.preventDefault();
            this.navigateToSection('visualization-widgets');
            break;
        }
      }

      // Close mobile menu with Escape
      if (e.key === 'Escape' && this.mobileMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }

  /**
   * Setup scroll spy
   */
  setupScrollSpy() {
    const sections = document.querySelectorAll('.docs-section');
    const navLinks = document.querySelectorAll('.nav-link');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;

          // Update navigation
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            }
          });

          this.currentSection = id;
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-20% 0px -70% 0px'
    });

    sections.forEach(section => {
      observer.observe(section);
    });
  }

  /**
   * Setup code copy buttons
   */
  setupCodeCopyButtons() {
    document.querySelectorAll('pre code').forEach(codeBlock => {
      const pre = codeBlock.parentElement;

      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'code-copy-btn';
      copyButton.innerHTML = '📋';
      copyButton.setAttribute('aria-label', 'Copy code to clipboard');
      copyButton.title = 'Copy code';

      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(codeBlock.textContent);
          copyButton.innerHTML = '✅';
          copyButton.title = 'Copied!';

          setTimeout(() => {
            copyButton.innerHTML = '📋';
            copyButton.title = 'Copy code';
          }, 2000);
        } catch (error) {
          console.error('Failed to copy code:', error);
        }
      });

      // Add copy button to pre element
      pre.style.position = 'relative';
      pre.appendChild(copyButton);
    });
  }

  /**
   * Setup theme toggle
   */
  setupThemeToggle() {
    // Create theme toggle if it doesn't exist
    if (!document.querySelector('.theme-toggle')) {
      const toggle = document.createElement('button');
      toggle.className = 'theme-toggle';
      toggle.innerHTML = '🌙';
      toggle.setAttribute('aria-label', 'Toggle dark theme');
      toggle.title = 'Toggle theme';

      document.querySelector('.docs-header').appendChild(toggle);

      toggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        toggle.innerHTML = isDark ? '🌙' : '☀️';

        // Save preference
        localStorage.setItem('docs-theme', isDark ? 'light' : 'dark');
      });

      // Load saved theme
      const savedTheme = localStorage.getItem('docs-theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);
      toggle.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  /**
   * Navigate to section
   */
  navigateToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Close mobile menu
      this.closeMobileMenu();

      // Update URL
      history.pushState(null, null, `#${sectionId}`);
    }
  }

  /**
   * Update active navigation
   */
  updateActiveNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${this.currentSection}`) {
        link.classList.add('active');
      }
    });
  }

  /**
   * Utility: Debounce function
   */
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

  // Live Preview Examples
  createBaseComponentPreview(container) {
    container.innerHTML = `
      <div id="base-component-demo">
        <h4>BaseComponent Demo</h4>
        <div id="demo-component" style="padding: 1rem; border: 2px solid #007bff; border-radius: 8px; background: #f8f9fa;">
          <p>Loading component...</p>
        </div>
        <button onclick="updateDemo()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Update Component
        </button>
      </div>
    `;

    // Simulate component creation
    setTimeout(() => {
      const demo = document.getElementById('demo-component');
      demo.innerHTML = `
        <h5 style="color: #007bff;">Custom Visualization Component</h5>
        <p>This is a live example of a BaseComponent instance.</p>
        <div style="display: flex; gap: 10px;">
          <div style="width: 30px; height: 20px; background: #007bff;"></div>
          <div style="width: 30px; height: 25px; background: #28a745;"></div>
          <div style="width: 30px; height: 15px; background: #ffc107;"></div>
        </div>
      `;
    }, 500);

    // Add global update function
    window.updateDemo = () => {
      const demo = document.getElementById('demo-component');
      demo.style.transform = 'scale(1.05)';
      demo.style.transition = 'transform 0.3s ease';
      setTimeout(() => {
        demo.style.transform = 'scale(1)';
      }, 300);
    };
  }

  createChartWidgetPreview(container) {
    container.innerHTML = `
      <div id="chart-widget-demo">
        <h4>ChartWidget Demo</h4>
        <canvas id="demo-chart" width="400" height="200" style="border: 1px solid #ddd; border-radius: 4px;"></canvas>
        <div style="margin-top: 1rem;">
          <button onclick="changeChartType('bar')" style="margin-right: 0.5rem; padding: 0.25rem 0.5rem; font-size: 0.875rem;">Bar</button>
          <button onclick="changeChartType('line')" style="margin-right: 0.5rem; padding: 0.25rem 0.5rem; font-size: 0.875rem;">Line</button>
          <button onclick="changeChartType('pie')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">Pie</button>
        </div>
      </div>
    `;

    // Simple chart drawing
    const canvas = container.querySelector('#demo-chart');
    const ctx = canvas.getContext('2d');

    let currentType = 'bar';

    function drawChart(type = 'bar') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const data = [30, 50, 25, 70, 40];
      const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'];

      if (type === 'bar') {
        const barWidth = 60;
        const spacing = 20;

        data.forEach((value, index) => {
          const x = index * (barWidth + spacing) + spacing;
          const height = (value / 100) * 150;
          const y = canvas.height - height - 20;

          ctx.fillStyle = colors[index];
          ctx.fillRect(x, y, barWidth, height);

          // Label
          ctx.fillStyle = '#333';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${value}`, x + barWidth/2, canvas.height - 5);
        });
      } else if (type === 'line') {
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 3;
        ctx.beginPath();

        data.forEach((value, index) => {
          const x = (index / (data.length - 1)) * (canvas.width - 40) + 20;
          const y = canvas.height - ((value / 100) * 150) - 20;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          // Points
          ctx.fillStyle = '#007bff';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.stroke();
      }
    }

    window.changeChartType = (type) => {
      currentType = type;
      drawChart(type);
    };

    // Initial draw
    drawChart();
  }

  createConfigPanelPreview(container) {
    container.innerHTML = `
      <div id="config-panel-demo">
        <h4>Configuration Panel Demo</h4>
        <button onclick="toggleConfigPanel()" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Open Configuration
        </button>
        <div id="mini-config-panel" style="display: none; margin-top: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 4px; background: white; max-width: 300px;">
          <h5>Chart Settings</h5>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.25rem; font-size: 0.875rem;">Title:</label>
            <input type="text" value="My Chart" style="width: 100%; padding: 0.25rem; border: 1px solid #ddd; border-radius: 2px;">
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.25rem; font-size: 0.875rem;">Color:</label>
            <input type="color" value="#007bff" style="width: 50px; height: 30px; border: 1px solid #ddd; border-radius: 2px;">
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: flex; align-items: center; font-size: 0.875rem;">
              <input type="checkbox" checked style="margin-right: 0.5rem;">
              Show Legend
            </label>
          </div>
          <button onclick="toggleConfigPanel()" style="padding: 0.25rem 0.5rem; background: #6c757d; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 0.875rem;">
            Close
          </button>
        </div>
      </div>
    `;

    window.toggleConfigPanel = () => {
      const panel = container.querySelector('#mini-config-panel');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };
  }

  createThemeSystemPreview(container) {
    container.innerHTML = `
      <div id="theme-system-demo">
        <h4>Theme System Demo</h4>
        <div id="themed-content" style="padding: 1rem; border-radius: 4px; transition: all 0.3s ease;">
          <h5>Sample Content</h5>
          <p>This content changes with the theme.</p>
          <button style="padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">Sample Button</button>
        </div>
        <div style="margin-top: 1rem;">
          <button onclick="applyTheme('light')" style="margin-right: 0.5rem; padding: 0.25rem 0.5rem; font-size: 0.875rem;">Light</button>
          <button onclick="applyTheme('dark')" style="margin-right: 0.5rem; padding: 0.25rem 0.5rem; font-size: 0.875rem;">Dark</button>
          <button onclick="applyTheme('medical')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">Medical</button>
        </div>
      </div>
    `;

    window.applyTheme = (theme) => {
      const content = container.querySelector('#themed-content');
      const button = content.querySelector('button');

      switch (theme) {
        case 'light':
          content.style.background = '#ffffff';
          content.style.color = '#212529';
          content.style.border = '1px solid #e9ecef';
          button.style.background = '#007bff';
          button.style.color = 'white';
          break;
        case 'dark':
          content.style.background = '#343a40';
          content.style.color = '#ffffff';
          content.style.border = '1px solid #495057';
          button.style.background = '#4dabf7';
          button.style.color = 'white';
          break;
        case 'medical':
          content.style.background = '#f8fbff';
          content.style.color = '#0d47a1';
          content.style.border = '1px solid #bbdefb';
          button.style.background = '#1976d2';
          button.style.color = 'white';
          break;
      }
    };

    // Apply default theme
    window.applyTheme('light');
  }

  createSearchSystemPreview(container) {
    container.innerHTML = `
      <div id="search-system-demo">
        <h4>Search System Demo</h4>
        <div style="margin-bottom: 1rem;">
          <input type="text" id="demo-search" placeholder="Search items..." style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div id="demo-results" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 0.5rem;">
          <!-- Results will appear here -->
        </div>
      </div>
    `;

    const sampleData = [
      { title: 'Line Chart', description: 'Display data trends over time' },
      { title: 'Bar Chart', description: 'Compare categorical data' },
      { title: 'Pie Chart', description: 'Show proportional data' },
      { title: 'Scatter Plot', description: 'Visualize correlations' },
      { title: 'Area Chart', description: 'Show cumulative totals' }
    ];

    const searchInput = container.querySelector('#demo-search');
    const resultsDiv = container.querySelector('#demo-results');

    // Initial display
    resultsDiv.innerHTML = sampleData.map(item => `
      <div style="padding: 0.5rem; border-bottom: 1px solid #eee;">
        <strong>${item.title}</strong><br>
        <small style="color: #666;">${item.description}</small>
      </div>
    `).join('');

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();

      if (!query) {
        // Show all items
        resultsDiv.innerHTML = sampleData.map(item => `
          <div style="padding: 0.5rem; border-bottom: 1px solid #eee;">
            <strong>${item.title}</strong><br>
            <small style="color: #666;">${item.description}</small>
          </div>
        `).join('');
        return;
      }

      // Filter items
      const filtered = sampleData.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );

      if (filtered.length === 0) {
        resultsDiv.innerHTML = '<div style="padding: 1rem; text-align: center; color: #666;">No results found</div>';
      } else {
        resultsDiv.innerHTML = filtered.map(item => `
          <div style="padding: 0.5rem; border-bottom: 1px solid #eee;">
            <strong>${item.title}</strong><br>
            <small style="color: #666;">${item.description}</small>
          </div>
        `).join('');
      }
    });
  }
}

/**
 * Live Preview Manager
 */
class LivePreviewManager {
  constructor() {
    this.previews = new Map();
  }

  register(name, renderFunction) {
    this.previews.set(name, renderFunction);
  }

  render(name, container) {
    const renderFunction = this.previews.get(name);
    if (renderFunction) {
      try {
        renderFunction(container);
      } catch (error) {
        container.innerHTML = `
          <div style="color: #dc3545; padding: 1rem; background: #f8d7da; border-radius: 4px;">
            <strong>Preview Error:</strong> ${error.message}
          </div>
        `;
      }
    } else {
      container.innerHTML = `
        <div style="color: #6c757d; padding: 2rem; text-align: center; font-style: italic;">
          Preview not available for "${name}"
        </div>
      `;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new InteractiveDocumentation();
});

// Add CSS for copy buttons and other interactive elements
const additionalStyles = `
  .code-copy-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font-size: 0.75rem;
    transition: background 0.2s ease;
  }

  .code-copy-btn:hover {
    background: rgba(255, 255, 255, 0.95);
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 4px 4px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .search-results-header {
    padding: 0.5rem 1rem;
    background: #f8f9fa;
    border-bottom: 1px solid #ddd;
    font-size: 0.875rem;
    color: #6c757d;
  }

  .search-result-item {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .search-result-item:hover {
    background: #f8f9fa;
  }

  .search-result-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .search-result-parent {
    font-size: 0.75rem;
    color: #007bff;
    margin-bottom: 0.25rem;
  }

  .search-result-description {
    font-size: 0.875rem;
    color: #6c757d;
    line-height: 1.4;
  }

  .search-no-results {
    padding: 1rem;
    text-align: center;
    color: #6c757d;
    font-style: italic;
  }

  mark {
    background-color: #fff3cd;
    padding: 0.1em 0.2em;
    border-radius: 2px;
  }

  .theme-toggle {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background 0.2s ease;
  }

  .theme-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    .search-results {
      position: fixed;
      top: 60px;
      left: 1rem;
      right: 1rem;
      max-height: 50vh;
    }
  }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);