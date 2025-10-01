// 数据可视化优化引擎 - 精简版
class DataVizOptimizer {
    constructor() {
        this.cache = new Map();
        this.workers = [];
        this.maxWorkers = navigator.hardwareConcurrency || 4;
        this.initWorkers();
    }

    initWorkers() {
        // 创建Web Workers用于后台数据处理
        for (let i = 0; i < Math.min(this.maxWorkers, 2); i++) {
            const worker = new Worker(URL.createObjectURL(new Blob([`
                self.onmessage = function(e) {
                    const { type, data, id } = e.data;

                    switch(type) {
                        case 'process_medical_data':
                            self.postMessage({
                                id,
                                result: processMedicalData(data)
                            });
                            break;
                        case 'calculate_statistics':
                            self.postMessage({
                                id,
                                result: calculateStatistics(data)
                            });
                            break;
                        case 'filter_dataset':
                            self.postMessage({
                                id,
                                result: filterDataset(data)
                            });
                            break;
                    }
                };

                function processMedicalData(rawData) {
                    // 快速数据处理算法
                    const processed = rawData.map(item => ({
                        id: item.id,
                        value: parseFloat(item.value) || 0,
                        category: item.category || 'unknown',
                        timestamp: new Date(item.timestamp).getTime(),
                        normalized: normalizeValue(item.value, rawData)
                    }));

                    return {
                        data: processed,
                        summary: generateSummary(processed),
                        timestamp: Date.now()
                    };
                }

                function normalizeValue(value, dataset) {
                    const values = dataset.map(d => parseFloat(d.value)).filter(v => !isNaN(v));
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    return max > min ? (value - min) / (max - min) : 0;
                }

                function generateSummary(data) {
                    const values = data.map(d => d.value);
                    return {
                        count: values.length,
                        mean: values.reduce((a, b) => a + b, 0) / values.length,
                        min: Math.min(...values),
                        max: Math.max(...values),
                        std: calculateStandardDeviation(values)
                    };
                }

                function calculateStatistics(data) {
                    const values = data.map(d => parseFloat(d.value)).filter(v => !isNaN(v));

                    const sorted = [...values].sort((a, b) => a - b);
                    const len = sorted.length;

                    return {
                        count: len,
                        mean: values.reduce((a, b) => a + b, 0) / len,
                        median: len % 2 ? sorted[Math.floor(len/2)] : (sorted[len/2-1] + sorted[len/2]) / 2,
                        q1: sorted[Math.floor(len * 0.25)],
                        q3: sorted[Math.floor(len * 0.75)],
                        min: sorted[0],
                        max: sorted[len-1],
                        std: calculateStandardDeviation(values),
                        variance: calculateVariance(values)
                    };
                }

                function calculateStandardDeviation(values) {
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                    return Math.sqrt(variance);
                }

                function calculateVariance(values) {
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                }

                function filterDataset(data) {
                    const { dataset, filters } = data;

                    return dataset.filter(item => {
                        return Object.entries(filters).every(([key, filter]) => {
                            if (!filter.enabled) return true;

                            const value = item[key];

                            if (filter.type === 'range') {
                                return value >= filter.min && value <= filter.max;
                            } else if (filter.type === 'category') {
                                return filter.values.includes(value);
                            } else if (filter.type === 'text') {
                                return value.toString().toLowerCase().includes(filter.query.toLowerCase());
                            }

                            return true;
                        });
                    });
                }
            `], { type: 'application/javascript' })));

            this.workers.push({
                worker,
                busy: false,
                id: i
            });
        }
    }

    async processData(data, type = 'process_medical_data') {
        const cacheKey = `${type}_${JSON.stringify(data).slice(0, 100)}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const worker = this.getAvailableWorker();
        if (!worker) {
            // 如果没有可用worker，同步处理
            return this.processSynchronously(data, type);
        }

        worker.busy = true;
        const id = Math.random().toString(36).substr(2, 9);

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                worker.busy = false;
                reject(new Error('Worker timeout'));
            }, 10000);

            const handler = (e) => {
                if (e.data.id === id) {
                    clearTimeout(timeout);
                    worker.worker.removeEventListener('message', handler);
                    worker.busy = false;

                    this.cache.set(cacheKey, e.data.result);
                    resolve(e.data.result);
                }
            };

            worker.worker.addEventListener('message', handler);
            worker.worker.postMessage({ type, data, id });
        });
    }

    getAvailableWorker() {
        return this.workers.find(w => !w.busy);
    }

    processSynchronously(data, type) {
        // 同步处理回退方案
        switch(type) {
            case 'process_medical_data':
                return this.quickProcessMedicalData(data);
            case 'calculate_statistics':
                return this.quickCalculateStats(data);
            default:
                return data;
        }
    }

    quickProcessMedicalData(rawData) {
        const processed = rawData.map((item, index) => ({
            id: item.id || index,
            value: parseFloat(item.value) || 0,
            category: item.category || 'default',
            timestamp: new Date(item.timestamp || Date.now()).getTime()
        }));

        return {
            data: processed,
            summary: {
                count: processed.length,
                timestamp: Date.now()
            }
        };
    }

    quickCalculateStats(data) {
        const values = data.map(d => parseFloat(d.value)).filter(v => !isNaN(v));
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;

        return {
            count: values.length,
            mean,
            min: Math.min(...values),
            max: Math.max(...values),
            sum
        };
    }

    // 智能图表渲染优化
    optimizeChart(chartData, containerWidth, containerHeight) {
        const pointCount = chartData.length;

        // 根据数据量和容器大小决定渲染策略
        if (pointCount > 1000 && containerWidth < 600) {
            // 移动设备或小屏幕，激进简化
            return this.downsampleData(chartData, 200);
        } else if (pointCount > 5000) {
            // 大数据集，中等简化
            return this.downsampleData(chartData, 1000);
        } else if (pointCount > 10000) {
            // 超大数据集，使用聚合
            return this.aggregateData(chartData, containerWidth);
        }

        return chartData;
    }

    downsampleData(data, targetPoints) {
        if (data.length <= targetPoints) return data;

        const step = data.length / targetPoints;
        const downsampled = [];

        for (let i = 0; i < data.length; i += step) {
            downsampled.push(data[Math.floor(i)]);
        }

        return downsampled;
    }

    aggregateData(data, containerWidth) {
        // 基于像素宽度聚合数据
        const pixelsPerPoint = 2; // 每2像素一个数据点
        const targetPoints = Math.floor(containerWidth / pixelsPerPoint);

        if (data.length <= targetPoints) return data;

        const bucketSize = Math.ceil(data.length / targetPoints);
        const aggregated = [];

        for (let i = 0; i < data.length; i += bucketSize) {
            const bucket = data.slice(i, i + bucketSize);
            const values = bucket.map(d => d.value).filter(v => typeof v === 'number');

            if (values.length > 0) {
                aggregated.push({
                    timestamp: bucket[0].timestamp,
                    value: values.reduce((a, b) => a + b, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    count: values.length,
                    category: bucket[0].category
                });
            }
        }

        return aggregated;
    }

    // 实时数据流优化
    createRealtimeOptimizer(maxPoints = 1000, updateInterval = 100) {
        return {
            buffer: [],
            lastUpdate: 0,

            addPoint(point) {
                this.buffer.push(point);

                // 限制缓冲区大小
                if (this.buffer.length > maxPoints) {
                    this.buffer = this.buffer.slice(-maxPoints);
                }

                // 批量更新控制
                const now = Date.now();
                if (now - this.lastUpdate >= updateInterval) {
                    this.lastUpdate = now;
                    return true; // 需要更新图表
                }

                return false; // 跳过此次更新
            },

            getData() {
                return [...this.buffer];
            },

            clear() {
                this.buffer.length = 0;
            }
        };
    }

    // 高效颜色生成
    generateOptimizedColors(count, scheme = 'medical') {
        const schemes = {
            medical: ['#FF6B9D', '#C44569', '#F8B500', '#3742FA', '#2F3542'],
            professional: ['#0077BE', '#00A8CC', '#4ABDFF', '#7209B7', '#2F3542'],
            accessible: ['#E63946', '#F77F00', '#FCBF49', '#06D6A0', '#118AB2']
        };

        const baseColors = schemes[scheme] || schemes.medical;
        const colors = [];

        for (let i = 0; i < count; i++) {
            if (i < baseColors.length) {
                colors.push(baseColors[i]);
            } else {
                // 生成变体
                const baseIndex = i % baseColors.length;
                const baseColor = baseColors[baseIndex];
                colors.push(this.adjustColorBrightness(baseColor, (i / count) * 0.3));
            }
        }

        return colors;
    }

    adjustColorBrightness(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;

        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    // 内存管理
    cleanup() {
        // 终止所有workers
        this.workers.forEach(w => {
            w.worker.terminate();
        });
        this.workers.length = 0;

        // 清理缓存
        this.cache.clear();

        // 强制垃圾回收
        if (window.gc) {
            window.gc();
        }
    }

    // 性能监控
    getPerformanceMetrics() {
        return {
            cacheSize: this.cache.size,
            activeWorkers: this.workers.filter(w => w.busy).length,
            totalWorkers: this.workers.length,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(performance.memory.totalJSHeapSize / 1048576)
            } : null
        };
    }
}

// 快速图表渲染器
class FastChartRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pixelRatio = window.devicePixelRatio || 1;
        this.setupCanvas();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.pixelRatio;
        this.canvas.height = rect.height * this.pixelRatio;
        this.ctx.scale(this.pixelRatio, this.pixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    renderLineChart(data, options = {}) {
        const {
            color = '#FF6B9D',
            lineWidth = 2,
            showPoints = false,
            smooth = false
        } = options;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (data.length < 2) return;

        const padding = 40;
        const width = this.canvas.width / this.pixelRatio - padding * 2;
        const height = this.canvas.height / this.pixelRatio - padding * 2;

        // 计算比例
        const xValues = data.map((_, i) => i);
        const yValues = data.map(d => d.value);
        const xRange = [Math.min(...xValues), Math.max(...xValues)];
        const yRange = [Math.min(...yValues), Math.max(...yValues)];

        const xScale = width / (xRange[1] - xRange[0]);
        const yScale = height / (yRange[1] - yRange[0]);

        // 绘制线条
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;

        for (let i = 0; i < data.length; i++) {
            const x = padding + (i - xRange[0]) * xScale;
            const y = padding + height - (data[i].value - yRange[0]) * yScale;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                if (smooth && i > 0) {
                    // 简单平滑曲线
                    const prevX = padding + ((i - 1) - xRange[0]) * xScale;
                    const prevY = padding + height - (data[i - 1].value - yRange[0]) * yScale;
                    const cpx = (prevX + x) / 2;
                    this.ctx.quadraticCurveTo(cpx, prevY, x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }

        this.ctx.stroke();

        // 绘制数据点
        if (showPoints) {
            this.ctx.fillStyle = color;
            for (let i = 0; i < data.length; i++) {
                const x = padding + (i - xRange[0]) * xScale;
                const y = padding + height - (data[i].value - yRange[0]) * yScale;

                this.ctx.beginPath();
                this.ctx.arc(x, y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    renderBarChart(data, options = {}) {
        const {
            color = '#FF6B9D',
            spacing = 2
        } = options;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const padding = 40;
        const width = this.canvas.width / this.pixelRatio - padding * 2;
        const height = this.canvas.height / this.pixelRatio - padding * 2;

        const barWidth = (width - spacing * (data.length - 1)) / data.length;
        const maxValue = Math.max(...data.map(d => d.value));

        this.ctx.fillStyle = color;

        data.forEach((item, i) => {
            const x = padding + i * (barWidth + spacing);
            const barHeight = (item.value / maxValue) * height;
            const y = padding + height - barHeight;

            this.ctx.fillRect(x, y, barWidth, barHeight);
        });
    }
}

// 导出优化器
window.DataVizOptimizer = DataVizOptimizer;
window.FastChartRenderer = FastChartRenderer;