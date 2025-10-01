/**
 * Advanced Search and Filtering System for 绛唇解语花 Visualization Platform
 * Intelligent search with fuzzy matching, autocomplete, and advanced filtering
 */

/**
 * Search Configuration and Types
 */
const SearchConfig = {
  FUZZY_THRESHOLD: 0.3, // Lower = more strict matching
  MAX_RESULTS: 50,
  DEBOUNCE_DELAY: 300,
  MIN_QUERY_LENGTH: 2,
  SEARCH_HISTORY_SIZE: 20,
  AUTOCOMPLETE_DELAY: 150
};

const SearchTypes = {
  EXACT: 'exact',
  FUZZY: 'fuzzy',
  SEMANTIC: 'semantic',
  REGEX: 'regex',
  PHONETIC: 'phonetic'
};

const FilterTypes = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  RANGE: 'range',
  MULTI_SELECT: 'multi-select'
};

/**
 * Fuzzy Search Engine with Advanced Matching
 */
class FuzzySearchEngine {
  constructor(options = {}) {
    this.threshold = options.threshold || SearchConfig.FUZZY_THRESHOLD;
    this.caseSensitive = options.caseSensitive || false;
    this.includeMatches = options.includeMatches !== false;
    this.minMatchCharLength = options.minMatchCharLength || 1;
    this.shouldSort = options.shouldSort !== false;
    this.keys = options.keys || [];
    this.weights = options.weights || {};
    this.stopWords = new Set(options.stopWords || ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  }

  /**
   * Search through data with fuzzy matching
   */
  search(query, data) {
    if (!query || query.length < SearchConfig.MIN_QUERY_LENGTH) {
      return [];
    }

    const normalizedQuery = this.normalizeQuery(query);
    const queryTerms = this.tokenize(normalizedQuery);

    const results = data.map(item => {
      const score = this.calculateScore(queryTerms, item);
      return {
        item,
        score,
        matches: this.includeMatches ? this.getMatches(queryTerms, item) : []
      };
    }).filter(result => result.score > this.threshold);

    return this.shouldSort
      ? results.sort((a, b) => b.score - a.score)
      : results;
  }

  /**
   * Normalize search query
   */
  normalizeQuery(query) {
    return this.caseSensitive
      ? query.trim()
      : query.toLowerCase().trim();
  }

  /**
   * Tokenize query into terms
   */
  tokenize(query) {
    return query
      .split(/\s+/)
      .filter(term => term.length >= this.minMatchCharLength)
      .filter(term => !this.stopWords.has(term));
  }

  /**
   * Calculate search score for an item
   */
  calculateScore(queryTerms, item) {
    if (this.keys.length === 0) {
      // Search entire item if no keys specified
      const itemText = typeof item === 'string' ? item : JSON.stringify(item);
      return this.scoreText(queryTerms, itemText);
    }

    let totalScore = 0;
    let totalWeight = 0;

    this.keys.forEach(key => {
      const value = this.getNestedValue(item, key);
      if (value != null) {
        const text = String(value);
        const weight = this.weights[key] || 1;
        const score = this.scoreText(queryTerms, text);

        totalScore += score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Score text against query terms
   */
  scoreText(queryTerms, text) {
    const normalizedText = this.caseSensitive ? text : text.toLowerCase();
    let totalScore = 0;

    queryTerms.forEach(term => {
      const termScore = this.scoreTermInText(term, normalizedText);
      totalScore += termScore;
    });

    return totalScore / queryTerms.length;
  }

  /**
   * Score a single term against text
   */
  scoreTermInText(term, text) {
    // Exact match gets highest score
    if (text.includes(term)) {
      const index = text.indexOf(term);
      // Earlier matches get higher scores
      const positionScore = 1 - (index / text.length) * 0.1;
      return Math.min(1, positionScore);
    }

    // Fuzzy matching using Levenshtein distance
    const words = text.split(/\s+/);
    let bestScore = 0;

    words.forEach(word => {
      const distance = this.levenshteinDistance(term, word);
      const maxLength = Math.max(term.length, word.length);
      const similarity = 1 - (distance / maxLength);

      if (similarity > bestScore) {
        bestScore = similarity;
      }
    });

    return bestScore;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get match information for highlighting
   */
  getMatches(queryTerms, item) {
    const matches = [];

    this.keys.forEach(key => {
      const value = this.getNestedValue(item, key);
      if (value != null) {
        const text = String(value);
        const normalizedText = this.caseSensitive ? text : text.toLowerCase();

        queryTerms.forEach(term => {
          const index = normalizedText.indexOf(term);
          if (index !== -1) {
            matches.push({
              key,
              value: text,
              indices: [[index, index + term.length - 1]]
            });
          }
        });
      }
    });

    return matches;
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, key) {
    return key.split('.').reduce((current, prop) =>
      current && current[prop] !== undefined ? current[prop] : null, obj
    );
  }
}

/**
 * Advanced Filter Engine
 */
class FilterEngine {
  constructor() {
    this.filters = new Map();
    this.operators = {
      eq: (value, filterValue) => value === filterValue,
      ne: (value, filterValue) => value !== filterValue,
      gt: (value, filterValue) => value > filterValue,
      gte: (value, filterValue) => value >= filterValue,
      lt: (value, filterValue) => value < filterValue,
      lte: (value, filterValue) => value <= filterValue,
      contains: (value, filterValue) => String(value).toLowerCase().includes(String(filterValue).toLowerCase()),
      startsWith: (value, filterValue) => String(value).toLowerCase().startsWith(String(filterValue).toLowerCase()),
      endsWith: (value, filterValue) => String(value).toLowerCase().endsWith(String(filterValue).toLowerCase()),
      between: (value, filterValue) => Array.isArray(filterValue) && value >= filterValue[0] && value <= filterValue[1],
      in: (value, filterValue) => Array.isArray(filterValue) && filterValue.includes(value),
      regex: (value, filterValue) => new RegExp(filterValue, 'i').test(String(value))
    };
  }

  /**
   * Add filter
   */
  addFilter(key, operator, value, type = FilterTypes.TEXT) {
    this.filters.set(key, {
      operator,
      value,
      type,
      enabled: true
    });
    return this;
  }

  /**
   * Remove filter
   */
  removeFilter(key) {
    this.filters.delete(key);
    return this;
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.filters.clear();
    return this;
  }

  /**
   * Enable/disable filter
   */
  toggleFilter(key, enabled) {
    const filter = this.filters.get(key);
    if (filter) {
      filter.enabled = enabled;
    }
    return this;
  }

  /**
   * Apply filters to data
   */
  applyFilters(data) {
    return data.filter(item => {
      return Array.from(this.filters.entries()).every(([key, filter]) => {
        if (!filter.enabled) return true;

        const value = this.getNestedValue(item, key);
        const processedValue = this.processValue(value, filter.type);
        const processedFilterValue = this.processValue(filter.value, filter.type);

        const operator = this.operators[filter.operator];
        return operator ? operator(processedValue, processedFilterValue) : true;
      });
    });
  }

  /**
   * Process value based on type
   */
  processValue(value, type) {
    switch (type) {
      case FilterTypes.NUMBER:
        return parseFloat(value) || 0;
      case FilterTypes.DATE:
        return new Date(value);
      case FilterTypes.BOOLEAN:
        return Boolean(value);
      default:
        return value;
    }
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, key) {
    return key.split('.').reduce((current, prop) =>
      current && current[prop] !== undefined ? current[prop] : null, obj
    );
  }

  /**
   * Get active filters
   */
  getActiveFilters() {
    return Array.from(this.filters.entries())
      .filter(([key, filter]) => filter.enabled)
      .map(([key, filter]) => ({ key, ...filter }));
  }
}

/**
 * Search History Manager
 */
class SearchHistoryManager {
  constructor() {
    this.storageKey = 'viz-search-history';
    this.maxSize = SearchConfig.SEARCH_HISTORY_SIZE;
    this.history = this.loadHistory();
  }

  /**
   * Add query to history
   */
  addQuery(query) {
    if (!query || query.length < SearchConfig.MIN_QUERY_LENGTH) return;

    // Remove existing instance
    this.history = this.history.filter(item => item.query !== query);

    // Add to beginning
    this.history.unshift({
      query,
      timestamp: Date.now(),
      count: 1
    });

    // Trim to max size
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(0, this.maxSize);
    }

    this.saveHistory();
  }

  /**
   * Get search suggestions
   */
  getSuggestions(query) {
    if (!query) return this.getPopularQueries();

    const normalizedQuery = query.toLowerCase();
    return this.history
      .filter(item => item.query.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get popular queries
   */
  getPopularQueries(limit = 5) {
    return this.history
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Load history from storage
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to load search history:', error);
      return [];
    }
  }

  /**
   * Save history to storage
   */
  saveHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }
}

/**
 * Advanced Search Component
 */
class AdvancedSearchComponent {
  constructor(options = {}) {
    this.container = options.container;
    this.searchEngine = new FuzzySearchEngine(options.searchOptions || {});
    this.filterEngine = new FilterEngine();
    this.historyManager = new SearchHistoryManager();

    this.data = options.data || [];
    this.onResults = options.onResults || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.state = {
      query: '',
      results: [],
      loading: false,
      suggestions: [],
      showSuggestions: false,
      activeFilter: null,
      lastSearchTime: null
    };

    this.debounceTimeout = null;
    this.init();
  }

  /**
   * Initialize search component
   */
  init() {
    this.render();
    this.setupEventListeners();
  }

  /**
   * Render search interface
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="advanced-search">
        <div class="search-header">
          <div class="search-input-container">
            <input
              type="text"
              class="search-input"
              placeholder="Search visualization components, data, and more..."
              autocomplete="off"
              spellcheck="false"
              role="searchbox"
              aria-label="Search"
              aria-expanded="false"
              aria-autocomplete="list"
            />
            <div class="search-input-actions">
              <button class="search-voice-btn" title="Voice search" aria-label="Voice search">
                🎤
              </button>
              <button class="search-clear-btn" title="Clear search" aria-label="Clear search">
                ✕
              </button>
              <button class="search-submit-btn" title="Search" aria-label="Submit search">
                🔍
              </button>
            </div>
          </div>

          <div class="search-suggestions" hidden>
            <div class="suggestions-list" role="listbox"></div>
          </div>
        </div>

        <div class="search-filters">
          <div class="filter-tabs">
            <button class="filter-tab active" data-filter="all">All</button>
            <button class="filter-tab" data-filter="components">Components</button>
            <button class="filter-tab" data-filter="data">Data</button>
            <button class="filter-tab" data-filter="charts">Charts</button>
            <button class="filter-tab" data-filter="images">Images</button>
          </div>

          <div class="filter-controls">
            <button class="filter-toggle-btn">
              <span>Filters</span>
              <span class="filter-count">0</span>
            </button>
            <button class="sort-btn">
              <span>Sort: Relevance</span>
            </button>
          </div>
        </div>

        <div class="filter-panel" hidden>
          <div class="filter-sections">
            <div class="filter-section">
              <h4>Type</h4>
              <div class="filter-group">
                <label><input type="checkbox" value="visualization"> Visualizations</label>
                <label><input type="checkbox" value="component"> Components</label>
                <label><input type="checkbox" value="data"> Data Sets</label>
                <label><input type="checkbox" value="template"> Templates</label>
              </div>
            </div>

            <div class="filter-section">
              <h4>Date Range</h4>
              <div class="filter-group">
                <input type="date" class="filter-date" id="date-from" />
                <span>to</span>
                <input type="date" class="filter-date" id="date-to" />
              </div>
            </div>

            <div class="filter-section">
              <h4>Category</h4>
              <div class="filter-group">
                <select class="filter-select" multiple>
                  <option value="medical">Medical</option>
                  <option value="aesthetic">Aesthetic</option>
                  <option value="analytics">Analytics</option>
                  <option value="3d">3D Models</option>
                  <option value="ar">AR/VR</option>
                </select>
              </div>
            </div>
          </div>

          <div class="filter-actions">
            <button class="btn btn-secondary clear-filters-btn">Clear All</button>
            <button class="btn btn-primary apply-filters-btn">Apply Filters</button>
          </div>
        </div>

        <div class="search-results">
          <div class="results-header">
            <div class="results-info">
              <span class="results-count">0 results</span>
              <span class="results-time"></span>
            </div>
            <div class="results-actions">
              <button class="export-results-btn">Export Results</button>
              <button class="save-search-btn">Save Search</button>
            </div>
          </div>

          <div class="results-list" role="main" aria-live="polite"></div>

          <div class="results-pagination" hidden>
            <button class="pagination-btn prev" disabled>Previous</button>
            <span class="pagination-info">Page 1 of 1</span>
            <button class="pagination-btn next" disabled>Next</button>
          </div>
        </div>
      </div>
    `;

    this.updateResultsDisplay();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const input = this.container.querySelector('.search-input');
    const clearBtn = this.container.querySelector('.search-clear-btn');
    const submitBtn = this.container.querySelector('.search-submit-btn');
    const voiceBtn = this.container.querySelector('.search-voice-btn');
    const filterToggle = this.container.querySelector('.filter-toggle-btn');
    const filterPanel = this.container.querySelector('.filter-panel');
    const suggestionsContainer = this.container.querySelector('.search-suggestions');

    // Search input events
    input.addEventListener('input', (e) => this.handleInput(e));
    input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    input.addEventListener('focus', () => this.showSuggestions());
    input.addEventListener('blur', () => {
      // Delay hiding to allow suggestion clicks
      setTimeout(() => this.hideSuggestions(), 150);
    });

    // Action buttons
    clearBtn.addEventListener('click', () => this.clearSearch());
    submitBtn.addEventListener('click', () => this.executeSearch());
    voiceBtn.addEventListener('click', () => this.startVoiceSearch());

    // Filter toggle
    filterToggle.addEventListener('click', () => {
      const isHidden = filterPanel.hasAttribute('hidden');
      if (isHidden) {
        filterPanel.removeAttribute('hidden');
        filterToggle.classList.add('active');
      } else {
        filterPanel.setAttribute('hidden', '');
        filterToggle.classList.remove('active');
      }
    });

    // Filter tabs
    this.container.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.handleFilterTab(e));
    });

    // Filter controls
    const applyFiltersBtn = this.container.querySelector('.apply-filters-btn');
    const clearFiltersBtn = this.container.querySelector('.clear-filters-btn');

    applyFiltersBtn.addEventListener('click', () => this.applyFilters());
    clearFiltersBtn.addEventListener('click', () => this.clearFilters());

    // Outside click to close suggestions
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideSuggestions();
      }
    });
  }

  /**
   * Handle search input
   */
  handleInput(event) {
    const query = event.target.value;
    this.setState({ query });

    // Clear previous timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Debounce search
    this.debounceTimeout = setTimeout(() => {
      this.updateSuggestions(query);
      if (query.length >= SearchConfig.MIN_QUERY_LENGTH) {
        this.executeSearch();
      } else {
        this.setState({ results: [] });
      }
    }, SearchConfig.DEBOUNCE_DELAY);
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyDown(event) {
    const { key } = event;

    switch (key) {
      case 'Enter':
        event.preventDefault();
        this.executeSearch();
        this.hideSuggestions();
        break;

      case 'Escape':
        this.hideSuggestions();
        break;

      case 'ArrowDown':
        event.preventDefault();
        this.navigateSuggestions('down');
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.navigateSuggestions('up');
        break;
    }
  }

  /**
   * Execute search
   */
  async executeSearch() {
    const { query } = this.state;

    if (!query || query.length < SearchConfig.MIN_QUERY_LENGTH) {
      return;
    }

    this.setState({ loading: true });
    const startTime = performance.now();

    try {
      // Apply filters first
      let filteredData = this.filterEngine.applyFilters(this.data);

      // Then search
      const searchResults = this.searchEngine.search(query, filteredData);

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      this.setState({
        results: searchResults.slice(0, SearchConfig.MAX_RESULTS),
        loading: false,
        lastSearchTime: searchTime
      });

      // Add to history
      this.historyManager.addQuery(query);

      // Notify callback
      this.onResults(this.state.results);

    } catch (error) {
      console.error('Search error:', error);
      this.setState({ loading: false });
    }
  }

  /**
   * Update suggestions
   */
  updateSuggestions(query) {
    const suggestions = this.historyManager.getSuggestions(query);
    this.setState({ suggestions });
    this.renderSuggestions();
  }

  /**
   * Render suggestions
   */
  renderSuggestions() {
    const suggestionsList = this.container.querySelector('.suggestions-list');
    const { suggestions } = this.state;

    if (suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    suggestionsList.innerHTML = suggestions.map((suggestion, index) => `
      <div class="suggestion-item" data-index="${index}" role="option">
        <span class="suggestion-icon">🔍</span>
        <span class="suggestion-text">${this.highlightQuery(suggestion.query)}</span>
        <span class="suggestion-count">${suggestion.count}</span>
      </div>
    `).join('');

    // Add click listeners
    suggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const query = suggestions[parseInt(item.dataset.index)].query;
        this.selectSuggestion(query);
      });
    });

    this.showSuggestions();
  }

  /**
   * Update state and trigger callbacks
   */
  setState(updates) {
    Object.assign(this.state, updates);
    this.onStateChange(this.state);
    this.updateResultsDisplay();
  }

  /**
   * Update results display
   */
  updateResultsDisplay() {
    const resultsCount = this.container.querySelector('.results-count');
    const resultsTime = this.container.querySelector('.results-time');
    const resultsList = this.container.querySelector('.results-list');

    if (resultsCount) {
      resultsCount.textContent = `${this.state.results.length} results`;
    }

    if (resultsTime && this.state.lastSearchTime) {
      resultsTime.textContent = `(${this.state.lastSearchTime.toFixed(0)}ms)`;
    }

    if (resultsList) {
      if (this.state.loading) {
        resultsList.innerHTML = '<div class="loading-spinner">Searching...</div>';
      } else if (this.state.results.length === 0) {
        resultsList.innerHTML = this.renderEmptyState();
      } else {
        resultsList.innerHTML = this.renderResults();
      }
    }
  }

  /**
   * Render search results
   */
  renderResults() {
    return this.state.results.map((result, index) => `
      <div class="result-item" data-index="${index}">
        <div class="result-header">
          <h3 class="result-title">${this.highlightMatches(result.item.title || result.item.name)}</h3>
          <div class="result-score">Score: ${(result.score * 100).toFixed(0)}%</div>
        </div>
        <div class="result-content">
          <p class="result-description">${this.highlightMatches(result.item.description || '')}</p>
          <div class="result-meta">
            <span class="result-type">${result.item.type || 'Unknown'}</span>
            <span class="result-date">${this.formatDate(result.item.date)}</span>
          </div>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" onclick="window.open('${result.item.url}', '_blank')">
            Open
          </button>
          <button class="btn btn-secondary result-preview-btn">Preview</button>
          <button class="btn btn-ghost result-share-btn">Share</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    return `
      <div class="empty-results">
        <div class="empty-icon">🔍</div>
        <h3>No results found</h3>
        <p>Try adjusting your search terms or filters</p>
        <div class="empty-suggestions">
          <h4>Suggestions:</h4>
          <ul>
            <li>Check your spelling</li>
            <li>Use more general terms</li>
            <li>Remove filters</li>
            <li>Try different keywords</li>
          </ul>
        </div>
      </div>
    `;
  }

  // Additional helper methods...
  highlightQuery(text) { /* Implementation */ }
  highlightMatches(text) { /* Implementation */ }
  formatDate(date) { /* Implementation */ }
  showSuggestions() { /* Implementation */ }
  hideSuggestions() { /* Implementation */ }
  navigateSuggestions(direction) { /* Implementation */ }
  selectSuggestion(query) { /* Implementation */ }
  clearSearch() { /* Implementation */ }
  startVoiceSearch() { /* Implementation */ }
  handleFilterTab(event) { /* Implementation */ }
  applyFilters() { /* Implementation */ }
  clearFilters() { /* Implementation */ }
}

// Export search system
window.SearchSystem = {
  FuzzySearchEngine,
  FilterEngine,
  SearchHistoryManager,
  AdvancedSearchComponent,
  SearchConfig,
  SearchTypes,
  FilterTypes
};

console.log('🔍 Advanced Search and Filtering System initialized');