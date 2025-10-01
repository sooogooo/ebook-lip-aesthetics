/**
 * Advanced Data Processing Module
 * Optimized for high-performance data manipulation and preprocessing
 */
class DataProcessor {
    /**
     * Constructor for DataProcessor
     * @param {Object} config - Configuration for data processing
     */
    constructor(config = {}) {
        // Performance-optimized configuration
        this.config = {
            chunkSize: config.chunkSize || 10000,
            cacheEnabled: config.cacheEnabled || true,
            compressionLevel: config.compressionLevel || 'high'
        };

        // In-memory cache for processed data
        this._cache = new Map();
    }

    /**
     * Efficiently process large datasets using chunking
     * @param {Array} data - Raw input data
     * @param {Function} processingFn - Processing function to apply
     * @returns {Array} Processed data
     */
    processInChunks(data, processingFn) {
        const result = [];
        const cacheKey = this._generateCacheKey(data, processingFn);

        // Check cache first
        if (this.config.cacheEnabled && this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey);
        }

        // Chunk-based processing for memory efficiency
        for (let i = 0; i < data.length; i += this.config.chunkSize) {
            const chunk = data.slice(i, i + this.config.chunkSize);
            const processedChunk = chunk.map(processingFn);
            result.push(...processedChunk);
        }

        // Cache result if enabled
        if (this.config.cacheEnabled) {
            this._cache.set(cacheKey, result);
        }

        return result;
    }

    /**
     * Generate a unique cache key based on data and processing function
     * @private
     */
    _generateCacheKey(data, processingFn) {
        return JSON.stringify({
            dataHash: this._hashCode(JSON.stringify(data)),
            functionHash: this._hashCode(processingFn.toString())
        });
    }

    /**
     * Simple hash function for cache key generation
     * @private
     */
    _hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Perform statistical aggregations
     * @param {Array} data - Input data
     * @param {string} aggregationType - Type of aggregation (mean, median, etc.)
     */
    aggregate(data, aggregationType = 'mean') {
        const aggregationMethods = {
            mean: arr => arr.reduce((a, b) => a + b, 0) / arr.length,
            median: arr => {
                const sorted = [...arr].sort((a, b) => a - b);
                const middle = Math.floor(sorted.length / 2);
                return sorted.length % 2
                    ? sorted[middle]
                    : (sorted[middle - 1] + sorted[middle]) / 2;
            },
            // Add more aggregation methods as needed
        };

        return aggregationMethods[aggregationType](data);
    }
}

export default DataProcessor;