/**
 * 高级交互式图片缩放查看器
 * 专为《绛唇解语花》医美案例展示设计
 *
 * 功能特性：
 * - 平滑缩放 (0.1x - 10x)
 * - 拖拽平移
 * - 多种查看模式
 * - 测量工具
 * - 标注功能
 * - 全屏支持
 * - 移动端优化
 */

class AdvancedZoomViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error('Container element not found');
        }

        // 默认配置
        this.config = {
            minZoom: 0.1,
            maxZoom: 10,
            zoomStep: 0.1,
            wheelZoomSpeed: 0.001,
            doubleClickZoom: 2,
            animationDuration: 300,
            boundaryCheck: true,
            inertiaDecay: 0.95,
            enableMeasurement: true,
            enableAnnotations: true,
            enableFullscreen: true,
            enableRotation: true,
            ...options
        };

        // 状态变量
        this.state = {
            zoom: 1,
            x: 0,
            y: 0,
            rotation: 0,
            isDragging: false,
            isInertia: false,
            velocity: { x: 0, y: 0 },
            lastTouch: { x: 0, y: 0 },
            mode: 'view', // view, measure, annotate, compare
            isFullscreen: false,
            annotations: [],
            measurements: []
        };

        // 初始化
        this.init();
    }

    init() {
        this.createElements();
        this.bindEvents();
        this.setupKeyboardShortcuts();
        this.enableGPUAcceleration();
    }

    createElements() {
        // 创建主要结构
        this.container.innerHTML = `
            <div class="zoom-viewer">
                <!-- 图片容器 -->
                <div class="image-container">
                    <img class="main-image" alt="医美案例图片" />
                    <div class="annotations-layer"></div>
                    <div class="measurements-layer"></div>
                    <canvas class="measurement-canvas"></canvas>
                </div>

                <!-- 控制面板 -->
                <div class="control-panel">
                    <div class="zoom-controls">
                        <button class="btn-zoom-out" title="缩小 (-)">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M19 13H5v-2h14v2z"/>
                            </svg>
                        </button>
                        <span class="zoom-level">100%</span>
                        <button class="btn-zoom-in" title="放大 (+)">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                        </button>
                    </div>

                    <div class="view-controls">
                        <button class="btn-reset" title="重置视图 (R)">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                            </svg>
                        </button>
                        <button class="btn-rotate" title="旋转 (T)">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45z"/>
                            </svg>
                        </button>
                        <button class="btn-fullscreen" title="全屏 (F)">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                            </svg>
                        </button>
                    </div>

                    <div class="mode-controls">
                        <button class="btn-mode view active" data-mode="view" title="查看模式">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                        </button>
                        <button class="btn-mode measure" data-mode="measure" title="测量模式">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9.5v-2H11v2zm0-4H9.5V9H11v2zm4 4h-1.5v-2H15v2zm0-4h-1.5V9H15v2z"/>
                            </svg>
                        </button>
                        <button class="btn-mode annotate" data-mode="annotate" title="标注模式">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="btn-mode compare" data-mode="compare" title="对比模式">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- 缩略图导航 -->
                <div class="thumbnail-nav">
                    <div class="thumbnail-list"></div>
                </div>

                <!-- 信息面板 -->
                <div class="info-panel">
                    <div class="coordinates">坐标: (0, 0)</div>
                    <div class="image-info">尺寸: 0 x 0</div>
                    <div class="measurement-info"></div>
                </div>

                <!-- 对比模式界面 -->
                <div class="compare-panel hidden">
                    <div class="compare-container">
                        <div class="before-image">
                            <img alt="术前图片" />
                            <div class="label">术前</div>
                        </div>
                        <div class="divider"></div>
                        <div class="after-image">
                            <img alt="术后图片" />
                            <div class="label">术后</div>
                        </div>
                    </div>
                </div>

                <!-- 工具提示 -->
                <div class="tooltip hidden"></div>

                <!-- 加载指示器 -->
                <div class="loading-indicator hidden">
                    <div class="spinner"></div>
                    <div class="loading-text">加载中...</div>
                </div>
            </div>
        `;

        // 获取关键元素引用
        this.viewer = this.container.querySelector('.zoom-viewer');
        this.imageContainer = this.container.querySelector('.image-container');
        this.mainImage = this.container.querySelector('.main-image');
        this.annotationsLayer = this.container.querySelector('.annotations-layer');
        this.measurementsLayer = this.container.querySelector('.measurements-layer');
        this.measurementCanvas = this.container.querySelector('.measurement-canvas');
        this.controlPanel = this.container.querySelector('.control-panel');
        this.infoPanel = this.container.querySelector('.info-panel');
        this.comparePanel = this.container.querySelector('.compare-panel');
        this.tooltip = this.container.querySelector('.tooltip');
        this.loadingIndicator = this.container.querySelector('.loading-indicator');

        // 设置canvas
        this.measurementCtx = this.measurementCanvas.getContext('2d');
    }

    bindEvents() {
        // 图片加载事件
        this.mainImage.addEventListener('load', () => {
            this.onImageLoad();
        });

        this.mainImage.addEventListener('error', () => {
            this.showError('图片加载失败');
        });

        // 鼠标事件
        this.imageContainer.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.imageContainer.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.imageContainer.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.imageContainer.addEventListener('wheel', this.onWheel.bind(this));
        this.imageContainer.addEventListener('dblclick', this.onDoubleClick.bind(this));

        // 触摸事件（移动端支持）
        this.imageContainer.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.imageContainer.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.imageContainer.addEventListener('touchend', this.onTouchEnd.bind(this));

        // 控制按钮事件
        this.bindControlEvents();

        // 模式切换事件
        this.bindModeEvents();

        // 窗口事件
        window.addEventListener('resize', this.onResize.bind(this));

        // 全屏事件
        document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
    }

    bindControlEvents() {
        // 缩放控制
        this.container.querySelector('.btn-zoom-in').addEventListener('click', () => {
            this.zoomIn();
        });

        this.container.querySelector('.btn-zoom-out').addEventListener('click', () => {
            this.zoomOut();
        });

        // 重置视图
        this.container.querySelector('.btn-reset').addEventListener('click', () => {
            this.resetView();
        });

        // 旋转
        this.container.querySelector('.btn-rotate').addEventListener('click', () => {
            this.rotate();
        });

        // 全屏
        this.container.querySelector('.btn-fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });
    }

    bindModeEvents() {
        const modeButtons = this.container.querySelectorAll('.btn-mode');
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                this.setMode(mode);

                // 更新按钮状态
                modeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.container.contains(document.activeElement) &&
                document.activeElement !== document.body) {
                return;
            }

            switch(e.key) {
                case '+':
                case '=':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomOut();
                    break;
                case 'r':
                case 'R':
                    e.preventDefault();
                    this.resetView();
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 't':
                case 'T':
                    e.preventDefault();
                    this.rotate();
                    break;
                case '1':
                    e.preventDefault();
                    this.setMode('view');
                    break;
                case '2':
                    e.preventDefault();
                    this.setMode('measure');
                    break;
                case '3':
                    e.preventDefault();
                    this.setMode('annotate');
                    break;
                case '4':
                    e.preventDefault();
                    this.setMode('compare');
                    break;
                case 'Escape':
                    if (this.state.isFullscreen) {
                        this.exitFullscreen();
                    }
                    break;
            }
        });
    }

    enableGPUAcceleration() {
        this.mainImage.style.transform = 'translate3d(0,0,0)';
        this.mainImage.style.willChange = 'transform';
    }

    // 图片加载完成处理
    onImageLoad() {
        this.hideLoading();
        this.updateImageInfo();
        this.resetView();
        this.resizeCanvas();
    }

    // 加载图片
    loadImage(src, beforeSrc = null) {
        this.showLoading();
        this.mainImage.src = src;

        // 如果提供了对比图片，设置对比模式
        if (beforeSrc) {
            const beforeImg = this.comparePanel.querySelector('.before-image img');
            const afterImg = this.comparePanel.querySelector('.after-image img');
            beforeImg.src = beforeSrc;
            afterImg.src = src;
        }
    }

    // 鼠标事件处理
    onMouseDown(e) {
        e.preventDefault();

        if (this.state.mode === 'measure') {
            this.startMeasurement(e);
        } else if (this.state.mode === 'annotate') {
            this.addAnnotation(e);
        } else {
            this.startDrag(e);
        }
    }

    onMouseMove(e) {
        this.updateCoordinates(e);

        if (this.state.isDragging) {
            this.drag(e);
        } else if (this.state.mode === 'measure' && this.currentMeasurement) {
            this.updateMeasurement(e);
        }
    }

    onMouseUp(e) {
        if (this.state.isDragging) {
            this.endDrag(e);
        } else if (this.state.mode === 'measure' && this.currentMeasurement) {
            this.finishMeasurement(e);
        }
    }

    onWheel(e) {
        e.preventDefault();

        const delta = e.deltaY * this.config.wheelZoomSpeed;
        const mouseX = e.clientX - this.imageContainer.getBoundingClientRect().left;
        const mouseY = e.clientY - this.imageContainer.getBoundingClientRect().top;

        this.zoomAtPoint(mouseX, mouseY, -delta);
    }

    onDoubleClick(e) {
        e.preventDefault();

        const mouseX = e.clientX - this.imageContainer.getBoundingClientRect().left;
        const mouseY = e.clientY - this.imageContainer.getBoundingClientRect().top;

        if (this.state.zoom < 1) {
            this.zoomToFit();
        } else {
            this.zoomAtPoint(mouseX, mouseY, this.config.doubleClickZoom - this.state.zoom);
        }
    }

    // 触摸事件处理（移动端支持）
    onTouchStart(e) {
        e.preventDefault();

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.startDrag({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        } else if (e.touches.length === 2) {
            this.startPinch(e);
        }
    }

    onTouchMove(e) {
        e.preventDefault();

        if (e.touches.length === 1 && this.state.isDragging) {
            const touch = e.touches[0];
            this.drag({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        } else if (e.touches.length === 2) {
            this.pinch(e);
        }
    }

    onTouchEnd(e) {
        e.preventDefault();

        if (this.state.isDragging) {
            this.endDrag();
        }

        this.endPinch();
    }

    // 拖拽功能实现
    startDrag(e) {
        this.state.isDragging = true;
        this.state.lastMouse = {
            x: e.clientX,
            y: e.clientY
        };

        this.imageContainer.style.cursor = 'grabbing';
        this.stopInertia();
    }

    drag(e) {
        if (!this.state.isDragging) return;

        const deltaX = e.clientX - this.state.lastMouse.x;
        const deltaY = e.clientY - this.state.lastMouse.y;

        // 更新速度（用于惯性滚动）
        this.state.velocity.x = deltaX;
        this.state.velocity.y = deltaY;

        this.state.x += deltaX;
        this.state.y += deltaY;

        this.state.lastMouse.x = e.clientX;
        this.state.lastMouse.y = e.clientY;

        this.updateTransform();

        // 边界检查
        if (this.config.boundaryCheck) {
            this.checkBoundaries();
        }
    }

    endDrag() {
        this.state.isDragging = false;
        this.imageContainer.style.cursor = 'grab';

        // 启动惯性滚动
        if (Math.abs(this.state.velocity.x) > 1 || Math.abs(this.state.velocity.y) > 1) {
            this.startInertia();
        }
    }

    // 惯性滚动
    startInertia() {
        this.state.isInertia = true;
        this.inertiaAnimation();
    }

    inertiaAnimation() {
        if (!this.state.isInertia) return;

        this.state.velocity.x *= this.config.inertiaDecay;
        this.state.velocity.y *= this.config.inertiaDecay;

        this.state.x += this.state.velocity.x;
        this.state.y += this.state.velocity.y;

        this.updateTransform();

        if (this.config.boundaryCheck) {
            this.checkBoundaries();
        }

        // 停止条件
        if (Math.abs(this.state.velocity.x) < 0.1 && Math.abs(this.state.velocity.y) < 0.1) {
            this.stopInertia();
        } else {
            requestAnimationFrame(() => this.inertiaAnimation());
        }
    }

    stopInertia() {
        this.state.isInertia = false;
        this.state.velocity.x = 0;
        this.state.velocity.y = 0;
    }

    // 缩放功能实现
    zoomIn() {
        const centerX = this.imageContainer.clientWidth / 2;
        const centerY = this.imageContainer.clientHeight / 2;
        this.zoomAtPoint(centerX, centerY, this.config.zoomStep);
    }

    zoomOut() {
        const centerX = this.imageContainer.clientWidth / 2;
        const centerY = this.imageContainer.clientHeight / 2;
        this.zoomAtPoint(centerX, centerY, -this.config.zoomStep);
    }

    zoomAtPoint(pointX, pointY, zoomDelta) {
        const oldZoom = this.state.zoom;
        const newZoom = Math.max(this.config.minZoom,
                               Math.min(this.config.maxZoom, oldZoom + zoomDelta));

        if (newZoom === oldZoom) return;

        // 计算缩放中心点
        const zoomRatio = newZoom / oldZoom;

        this.state.x = pointX - (pointX - this.state.x) * zoomRatio;
        this.state.y = pointY - (pointY - this.state.y) * zoomRatio;
        this.state.zoom = newZoom;

        this.updateTransform();
        this.updateZoomLevel();

        if (this.config.boundaryCheck) {
            this.checkBoundaries();
        }
    }

    zoomToFit() {
        const containerWidth = this.imageContainer.clientWidth;
        const containerHeight = this.imageContainer.clientHeight;
        const imageWidth = this.mainImage.naturalWidth;
        const imageHeight = this.mainImage.naturalHeight;

        const scaleX = containerWidth / imageWidth;
        const scaleY = containerHeight / imageHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        this.state.zoom = scale;
        this.state.x = (containerWidth - imageWidth * scale) / 2;
        this.state.y = (containerHeight - imageHeight * scale) / 2;

        this.updateTransform(true);
        this.updateZoomLevel();
    }

    // 重置视图
    resetView() {
        this.state.zoom = 1;
        this.state.x = 0;
        this.state.y = 0;
        this.state.rotation = 0;

        this.updateTransform(true);
        this.updateZoomLevel();
        this.clearMeasurements();
        this.clearAnnotations();
    }

    // 旋转功能
    rotate() {
        this.state.rotation = (this.state.rotation + 90) % 360;
        this.updateTransform(true);
    }

    // 变换更新
    updateTransform(animate = false) {
        const transform = `translate3d(${this.state.x}px, ${this.state.y}px, 0)
                          scale(${this.state.zoom})
                          rotate(${this.state.rotation}deg)`;

        if (animate) {
            this.mainImage.style.transition = `transform ${this.config.animationDuration}ms ease-out`;
            setTimeout(() => {
                this.mainImage.style.transition = '';
            }, this.config.animationDuration);
        }

        this.mainImage.style.transform = transform;
    }

    // 边界检查
    checkBoundaries() {
        const containerWidth = this.imageContainer.clientWidth;
        const containerHeight = this.imageContainer.clientHeight;
        const imageWidth = this.mainImage.naturalWidth * this.state.zoom;
        const imageHeight = this.mainImage.naturalHeight * this.state.zoom;

        const minX = Math.min(0, containerWidth - imageWidth);
        const maxX = Math.max(0, containerWidth - imageWidth);
        const minY = Math.min(0, containerHeight - imageHeight);
        const maxY = Math.max(0, containerHeight - imageHeight);

        // 边界回弹效果
        if (this.state.x < minX) {
            this.state.x = minX;
            this.state.velocity.x = 0;
        } else if (this.state.x > maxX) {
            this.state.x = maxX;
            this.state.velocity.x = 0;
        }

        if (this.state.y < minY) {
            this.state.y = minY;
            this.state.velocity.y = 0;
        } else if (this.state.y > maxY) {
            this.state.y = maxY;
            this.state.velocity.y = 0;
        }
    }

    // 测量功能
    startMeasurement(e) {
        const rect = this.imageContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.currentMeasurement = {
            startX: x,
            startY: y,
            endX: x,
            endY: y,
            id: Date.now()
        };

        this.drawMeasurement();
    }

    updateMeasurement(e) {
        if (!this.currentMeasurement) return;

        const rect = this.imageContainer.getBoundingClientRect();
        this.currentMeasurement.endX = e.clientX - rect.left;
        this.currentMeasurement.endY = e.clientY - rect.top;

        this.drawMeasurement();
        this.updateMeasurementInfo();
    }

    finishMeasurement() {
        if (!this.currentMeasurement) return;

        this.state.measurements.push({ ...this.currentMeasurement });
        this.currentMeasurement = null;
        this.updateMeasurementInfo();
    }

    drawMeasurement() {
        this.clearCanvas();

        // 绘制所有已完成的测量
        this.state.measurements.forEach(measurement => {
            this.drawMeasurementLine(measurement, '#00ff00');
        });

        // 绘制当前测量
        if (this.currentMeasurement) {
            this.drawMeasurementLine(this.currentMeasurement, '#ff0000');
        }
    }

    drawMeasurementLine(measurement, color) {
        const ctx = this.measurementCtx;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(measurement.startX, measurement.startY);
        ctx.lineTo(measurement.endX, measurement.endY);
        ctx.stroke();

        // 绘制端点
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(measurement.startX, measurement.startY, 3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(measurement.endX, measurement.endY, 3, 0, 2 * Math.PI);
        ctx.fill();

        // 显示距离
        const distance = this.calculateDistance(measurement);
        const midX = (measurement.startX + measurement.endX) / 2;
        const midY = (measurement.startY + measurement.endY) / 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - 25, midY - 10, 50, 20);
        ctx.fillStyle = color;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${distance}px`, midX, midY + 3);
    }

    calculateDistance(measurement) {
        const dx = measurement.endX - measurement.startX;
        const dy = measurement.endY - measurement.startY;
        return Math.round(Math.sqrt(dx * dx + dy * dy));
    }

    clearMeasurements() {
        this.state.measurements = [];
        this.currentMeasurement = null;
        this.clearCanvas();
        this.updateMeasurementInfo();
    }

    // 标注功能
    addAnnotation(e) {
        const rect = this.imageContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const text = prompt('请输入标注内容：');
        if (!text) return;

        const annotation = {
            id: Date.now(),
            x: x,
            y: y,
            text: text,
            imageX: (x - this.state.x) / this.state.zoom,
            imageY: (y - this.state.y) / this.state.zoom
        };

        this.state.annotations.push(annotation);
        this.renderAnnotations();
    }

    renderAnnotations() {
        this.annotationsLayer.innerHTML = '';

        this.state.annotations.forEach(annotation => {
            const element = document.createElement('div');
            element.className = 'annotation-marker';
            element.style.left = (annotation.imageX * this.state.zoom + this.state.x) + 'px';
            element.style.top = (annotation.imageY * this.state.zoom + this.state.y) + 'px';
            element.innerHTML = `
                <div class="marker-pin"></div>
                <div class="marker-text">${annotation.text}</div>
                <button class="marker-delete" onclick="viewer.removeAnnotation(${annotation.id})">×</button>
            `;

            this.annotationsLayer.appendChild(element);
        });
    }

    removeAnnotation(id) {
        this.state.annotations = this.state.annotations.filter(ann => ann.id !== id);
        this.renderAnnotations();
    }

    clearAnnotations() {
        this.state.annotations = [];
        this.renderAnnotations();
    }

    // 模式切换
    setMode(mode) {
        this.state.mode = mode;

        // 更新界面
        this.viewer.className = `zoom-viewer mode-${mode}`;

        // 显示/隐藏相关面板
        if (mode === 'compare') {
            this.comparePanel.classList.remove('hidden');
        } else {
            this.comparePanel.classList.add('hidden');
        }

        // 更新光标
        this.updateCursor();
    }

    updateCursor() {
        let cursor = 'default';

        switch(this.state.mode) {
            case 'view':
                cursor = this.state.isDragging ? 'grabbing' : 'grab';
                break;
            case 'measure':
                cursor = 'crosshair';
                break;
            case 'annotate':
                cursor = 'pointer';
                break;
        }

        this.imageContainer.style.cursor = cursor;
    }

    // 全屏功能
    toggleFullscreen() {
        if (this.state.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }

    enterFullscreen() {
        if (this.container.requestFullscreen) {
            this.container.requestFullscreen();
        } else if (this.container.webkitRequestFullscreen) {
            this.container.webkitRequestFullscreen();
        } else if (this.container.msRequestFullscreen) {
            this.container.msRequestFullscreen();
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    onFullscreenChange() {
        this.state.isFullscreen = !!document.fullscreenElement;
        this.viewer.classList.toggle('fullscreen', this.state.isFullscreen);

        // 更新按钮图标
        const fullscreenBtn = this.container.querySelector('.btn-fullscreen');
        fullscreenBtn.innerHTML = this.state.isFullscreen ?
            '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>' :
            '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
    }

    // UI更新方法
    updateZoomLevel() {
        const level = Math.round(this.state.zoom * 100);
        this.container.querySelector('.zoom-level').textContent = `${level}%`;
    }

    updateCoordinates(e) {
        const rect = this.imageContainer.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        this.container.querySelector('.coordinates').textContent = `坐标: (${x}, ${y})`;
    }

    updateImageInfo() {
        const width = this.mainImage.naturalWidth;
        const height = this.mainImage.naturalHeight;
        this.container.querySelector('.image-info').textContent = `尺寸: ${width} x ${height}`;
    }

    updateMeasurementInfo() {
        const infoElement = this.container.querySelector('.measurement-info');

        if (this.currentMeasurement) {
            const distance = this.calculateDistance(this.currentMeasurement);
            infoElement.textContent = `测量: ${distance}px`;
        } else if (this.state.measurements.length > 0) {
            infoElement.textContent = `测量点: ${this.state.measurements.length}个`;
        } else {
            infoElement.textContent = '';
        }
    }

    // Canvas相关方法
    resizeCanvas() {
        const rect = this.imageContainer.getBoundingClientRect();
        this.measurementCanvas.width = rect.width;
        this.measurementCanvas.height = rect.height;
    }

    clearCanvas() {
        this.measurementCtx.clearRect(0, 0, this.measurementCanvas.width, this.measurementCanvas.height);
    }

    onResize() {
        this.resizeCanvas();
        this.renderAnnotations();
        this.drawMeasurement();
    }

    // 工具方法
    showLoading() {
        this.loadingIndicator.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        alert(message); // 可以替换为更好看的错误提示
    }

    showTooltip(text, x, y) {
        this.tooltip.textContent = text;
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
        this.tooltip.classList.remove('hidden');
    }

    hideTooltip() {
        this.tooltip.classList.add('hidden');
    }

    // 公共API方法
    destroy() {
        // 清理事件监听器和资源
        this.container.innerHTML = '';
    }

    getState() {
        return { ...this.state };
    }

    setState(newState) {
        Object.assign(this.state, newState);
        this.updateTransform();
        this.updateZoomLevel();
    }

    // 导出功能
    exportAnnotations() {
        return JSON.stringify(this.state.annotations, null, 2);
    }

    importAnnotations(jsonData) {
        try {
            this.state.annotations = JSON.parse(jsonData);
            this.renderAnnotations();
        } catch (e) {
            this.showError('标注数据格式错误');
        }
    }

    // 截图功能
    captureScreenshot() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = this.mainImage.naturalWidth;
        canvas.height = this.mainImage.naturalHeight;

        ctx.drawImage(this.mainImage, 0, 0);

        // 可以添加标注到截图中...

        return canvas.toDataURL('image/png');
    }
}

// 全局变量供HTML使用
let viewer = null;

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedZoomViewer;
}