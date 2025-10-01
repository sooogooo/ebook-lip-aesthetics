/**
 * Advanced Mobile Gesture Recognition System
 * Native app-like performance with intelligent touch handling
 * Features: Multi-touch, ML gesture prediction, haptic feedback, accessibility
 */

class AdvancedMobileGestureHandler {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            enablePinchZoom: true,
            enableSwipe: true,
            enableDrag: true,
            enableRotation: true,
            enableVoiceControl: false,
            enableHapticFeedback: true,
            enableGesturePrediction: true,
            enableAccessibilityMode: false,
            swipeThreshold: 50,
            pinchThreshold: 0.1,
            dragThreshold: 10,
            maxScale: 5,
            minScale: 0.5,
            debounceDelay: 8, // ~120fps for smoother performance
            predictionLookahead: 100, // ms
            hapticIntensity: 0.5,
            batteryOptimized: false,
            ...options
        };

        this.state = {
            scale: 1,
            rotation: 0,
            translateX: 0,
            translateY: 0,
            isDragging: false,
            isPinching: false,
            isRotating: false,
            isSwiping: false,
            isDoubleTapping: false,
            lastTouchTime: 0,
            touchStartDistance: 0,
            touchStartAngle: 0,
            initialPinchDistance: 0,
            initialRotation: 0,
            velocityX: 0,
            velocityY: 0,
            angularVelocity: 0,
            lastTouchX: 0,
            lastTouchY: 0,
            centerX: 0,
            centerY: 0,
            momentumDecay: 0.95,
            isInertiaActive: false,
            gestureStartTime: 0,
            batteryLevel: 1.0,
            performanceMode: 'normal' // normal, low-power, high-performance
        };

        this.touches = new Map();
        this.callbacks = new Map();
        this.gestureHistory = [];
        this.predictionModel = null;
        this.hapticEngine = null;
        this.accessibilityEngine = null;
        this.performanceMonitor = null;
        this.batteryMonitor = null;

        // ML gesture prediction data
        this.gestureTrainingData = new Map();
        this.predictionBuffer = [];
        this.predictionTimeout = null;

        // Performance optimization
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.averageFPS = 60;
        this.isOptimizationActive = false;

        this.init();
    }

    async init() {
        try {
            // Initialize core systems
            await this.setupTouchEvents();
            await this.setupMouseEvents();
            await this.setupKeyboardEvents();

            // Initialize advanced features
            if (this.options.enableVoiceControl) {
                await this.setupVoiceControl();
            }

            if (this.options.enableHapticFeedback) {
                await this.initializeHapticEngine();
            }

            if (this.options.enableGesturePrediction) {
                await this.initializePredictionModel();
            }

            if (this.options.enableAccessibilityMode) {
                await this.initializeAccessibilityEngine();
            }

            // Setup performance monitoring
            await this.initializePerformanceMonitor();
            await this.initializeBatteryMonitor();

            // Setup intersection observer for visibility optimization
            this.setupIntersectionObserver();

            // Start performance monitoring loop
            this.startPerformanceMonitoring();

            console.log('[Gestures] Advanced gesture system initialized');
        } catch (error) {
            console.error('[Gestures] Initialization failed:', error);
            // Fallback to basic mode
            this.setupBasicMode();
        }
    }

    async setupBasicMode() {
        // Fallback initialization without advanced features
        this.setupTouchEvents();
        this.setupMouseEvents();
        this.setupKeyboardEvents();
        console.log('[Gestures] Running in basic mode');
    }

    /**
     * Advanced Initialization Methods
     */
    async initializeHapticEngine() {
        if ('vibrate' in navigator) {
            this.hapticEngine = {
                light: () => navigator.vibrate(10),
                medium: () => navigator.vibrate(25),
                heavy: () => navigator.vibrate(50),
                custom: (pattern) => navigator.vibrate(pattern),
                isAvailable: () => true
            };
        } else {
            this.hapticEngine = {
                light: () => {},
                medium: () => {},
                heavy: () => {},
                custom: () => {},
                isAvailable: () => false
            };
        }
    }

    async initializePredictionModel() {
        this.predictionModel = {
            predict: (gestureData) => this.predictGesture(gestureData),
            train: (gestureData, outcome) => this.trainGesture(gestureData, outcome),
            isReady: () => true
        };

        // Load existing training data from localStorage
        await this.loadGestureTrainingData();
    }

    async initializeAccessibilityEngine() {
        this.accessibilityEngine = {
            announceGesture: (gesture) => this.announceGestureToScreenReader(gesture),
            provideTactileFeedback: (feedback) => this.provideTactileFeedback(feedback),
            adjustForMotorImpairment: () => this.adjustForMotorImpairment(),
            isActive: () => this.options.enableAccessibilityMode
        };

        // Check for accessibility preferences
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.options.debounceDelay = Math.max(this.options.debounceDelay, 32);
        }
    }

    async initializePerformanceMonitor() {
        this.performanceMonitor = {
            fps: 60,
            frameTime: 0,
            gesturesPerSecond: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            update: () => this.updatePerformanceMetrics(),
            getOptimizationRecommendations: () => this.getOptimizationRecommendations()
        };
    }

    async initializeBatteryMonitor() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                this.batteryMonitor = {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime,
                    update: () => this.updateBatteryStatus(battery)
                };

                battery.addEventListener('levelchange', () => {
                    this.batteryMonitor.update();
                    this.adjustPerformanceForBattery();
                });

                battery.addEventListener('chargingchange', () => {
                    this.batteryMonitor.update();
                    this.adjustPerformanceForBattery();
                });

            } catch (error) {
                console.warn('[Gestures] Battery API not available:', error);
                this.batteryMonitor = {
                    level: 1.0,
                    charging: true,
                    update: () => {},
                    isAvailable: () => false
                };
            }
        }
    }

    startPerformanceMonitoring() {
        const monitorLoop = () => {
            this.updatePerformanceMetrics();
            this.optimizePerformance();

            // Continue monitoring at 1Hz to avoid performance impact
            setTimeout(monitorLoop, 1000);
        };

        monitorLoop();
    }

    updatePerformanceMetrics() {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;

        if (deltaTime > 0) {
            this.frameCount++;
            const fps = 1000 / deltaTime;
            this.averageFPS = (this.averageFPS * 0.9) + (fps * 0.1);

            if (this.performanceMonitor) {
                this.performanceMonitor.fps = this.averageFPS;
                this.performanceMonitor.frameTime = deltaTime;
            }
        }

        this.lastFrameTime = now;

        // Update memory usage if available
        if (performance.memory) {
            this.performanceMonitor.memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        }
    }

    optimizePerformance() {
        const shouldOptimize = (
            this.averageFPS < 30 ||
            (this.batteryMonitor && this.batteryMonitor.level < 0.2 && !this.batteryMonitor.charging) ||
            this.performanceMonitor.memoryUsage > 0.8
        );

        if (shouldOptimize && !this.isOptimizationActive) {
            this.activatePerformanceOptimization();
        } else if (!shouldOptimize && this.isOptimizationActive) {
            this.deactivatePerformanceOptimization();
        }
    }

    activatePerformanceOptimization() {
        this.isOptimizationActive = true;
        this.state.performanceMode = 'low-power';

        // Increase debounce delay
        this.options.debounceDelay = Math.max(this.options.debounceDelay, 32);

        // Disable expensive features
        this.options.enableGesturePrediction = false;
        this.options.enableHapticFeedback = false;

        // Reduce gesture history size
        this.gestureHistory = this.gestureHistory.slice(-10);

        console.log('[Gestures] Performance optimization activated');
        this.emit('performanceModeChanged', { mode: 'low-power' });
    }

    deactivatePerformanceOptimization() {
        this.isOptimizationActive = false;
        this.state.performanceMode = 'normal';

        // Restore original settings
        this.options.debounceDelay = 8;
        this.options.enableGesturePrediction = true;
        this.options.enableHapticFeedback = true;

        console.log('[Gestures] Performance optimization deactivated');
        this.emit('performanceModeChanged', { mode: 'normal' });
    }

    /**
     * Enhanced Touch Event Setup with Performance Optimization
     */
    setupTouchEvents() {
        const touchOptions = {
            passive: false,
            capture: false
        };

        // Use throttled handlers for better performance
        this.element.addEventListener('touchstart', this.throttle(this.handleTouchStart.bind(this), this.options.debounceDelay), touchOptions);
        this.element.addEventListener('touchmove', this.throttle(this.handleTouchMove.bind(this), this.options.debounceDelay), touchOptions);
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), touchOptions);
        this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), touchOptions);

        // Add pointer events for better cross-platform support
        if ('PointerEvent' in window) {
            this.element.addEventListener('pointerdown', this.handlePointerDown.bind(this));
            this.element.addEventListener('pointermove', this.throttle(this.handlePointerMove.bind(this), this.options.debounceDelay));
            this.element.addEventListener('pointerup', this.handlePointerUp.bind(this));
            this.element.addEventListener('pointercancel', this.handlePointerCancel.bind(this));
        }
    }

    setupMouseEvents() {
        // Mouse support for desktop testing
        this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.element.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    }

    setupKeyboardEvents() {
        // Keyboard shortcuts for accessibility
        this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.element.tabIndex = 0; // Make element focusable
    }

    handleTouchStart(event) {
        event.preventDefault();

        const touches = Array.from(event.touches);
        this.updateTouches(touches);

        const touchCount = touches.length;
        const now = Date.now();

        if (touchCount === 1) {
            const touch = touches[0];
            this.state.lastTouchX = touch.clientX;
            this.state.lastTouchY = touch.clientY;
            this.state.lastTouchTime = now;

            // Check for double tap
            if (now - this.state.lastTouchTime < 300) {
                this.handleDoubleTap(touch);
            }
        } else if (touchCount === 2) {
            this.handlePinchStart(touches);
        }

        this.emit('gestureStart', {
            type: this.getGestureType(touchCount),
            touches: touches,
            state: { ...this.state }
        });
    }

    handleTouchMove(event) {
        event.preventDefault();

        const touches = Array.from(event.touches);
        this.updateTouches(touches);

        const touchCount = touches.length;

        if (touchCount === 1 && this.options.enableDrag) {
            this.handleDrag(touches[0]);
        } else if (touchCount === 2) {
            if (this.options.enablePinchZoom) {
                this.handlePinch(touches);
            }
            if (this.options.enableRotation) {
                this.handleRotation(touches);
            }
        }

        this.updateVelocity(touches[0]);
        this.applyTransform();
    }

    handleTouchEnd(event) {
        const touches = Array.from(event.touches);
        this.updateTouches(touches);

        if (touches.length === 0) {
            this.handleGestureEnd();
        }

        // Handle swipe detection
        if (this.options.enableSwipe && this.state.velocityX !== 0 || this.state.velocityY !== 0) {
            this.detectSwipe();
        }
    }

    /**
     * Gesture Recognition Logic
     */
    handleDrag(touch) {
        if (!this.state.isDragging) {
            const deltaX = Math.abs(touch.clientX - this.state.lastTouchX);
            const deltaY = Math.abs(touch.clientY - this.state.lastTouchY);

            if (deltaX > this.options.dragThreshold || deltaY > this.options.dragThreshold) {
                this.state.isDragging = true;
                this.emit('dragStart', { touch, state: { ...this.state } });
            }
        }

        if (this.state.isDragging) {
            const deltaX = touch.clientX - this.state.lastTouchX;
            const deltaY = touch.clientY - this.state.lastTouchY;

            this.state.translateX += deltaX;
            this.state.translateY += deltaY;

            this.emit('drag', {
                deltaX,
                deltaY,
                touch,
                state: { ...this.state }
            });
        }

        this.state.lastTouchX = touch.clientX;
        this.state.lastTouchY = touch.clientY;
    }

    handlePinchStart(touches) {
        const distance = this.getDistance(touches[0], touches[1]);
        this.state.initialPinchDistance = distance;
        this.state.touchStartDistance = distance;
        this.state.isPinching = false;
    }

    handlePinch(touches) {
        const currentDistance = this.getDistance(touches[0], touches[1]);
        const scaleChange = currentDistance / this.state.touchStartDistance;

        if (!this.state.isPinching) {
            const distanceChange = Math.abs(currentDistance - this.state.initialPinchDistance);
            if (distanceChange > this.options.pinchThreshold * 100) {
                this.state.isPinching = true;
                this.emit('pinchStart', { touches, state: { ...this.state } });
            }
        }

        if (this.state.isPinching) {
            const newScale = Math.max(
                this.options.minScale,
                Math.min(this.options.maxScale, this.state.scale * scaleChange)
            );

            this.state.scale = newScale;
            this.state.touchStartDistance = currentDistance;

            this.emit('pinch', {
                scale: newScale,
                scaleChange,
                touches,
                state: { ...this.state }
            });
        }
    }

    handleRotation(touches) {
        const currentAngle = this.getAngle(touches[0], touches[1]);

        if (!this.state.isRotating) {
            this.state.touchStartAngle = currentAngle;
            this.state.initialRotation = this.state.rotation;
            this.state.isRotating = true;
            this.emit('rotationStart', { touches, state: { ...this.state } });
        }

        const angleDelta = currentAngle - this.state.touchStartAngle;
        this.state.rotation = this.state.initialRotation + angleDelta;

        this.emit('rotation', {
            rotation: this.state.rotation,
            angleDelta,
            touches,
            state: { ...this.state }
        });
    }

    handleDoubleTap(touch) {
        // Reset zoom or toggle zoom
        if (this.state.scale > 1) {
            this.resetTransform();
        } else {
            this.state.scale = 2;
            this.applyTransform();
        }

        this.emit('doubleTap', { touch, state: { ...this.state } });
    }

    detectSwipe() {
        const velocityThreshold = 0.5;
        const { velocityX, velocityY } = this.state;

        if (Math.abs(velocityX) > velocityThreshold || Math.abs(velocityY) > velocityThreshold) {
            let direction = '';

            if (Math.abs(velocityX) > Math.abs(velocityY)) {
                direction = velocityX > 0 ? 'right' : 'left';
            } else {
                direction = velocityY > 0 ? 'down' : 'up';
            }

            this.emit('swipe', {
                direction,
                velocityX,
                velocityY,
                state: { ...this.state }
            });
        }
    }

    handleGestureEnd() {
        const wasInteracting = this.state.isDragging || this.state.isPinching || this.state.isRotating;

        this.state.isDragging = false;
        this.state.isPinching = false;
        this.state.isRotating = false;
        this.state.velocityX = 0;
        this.state.velocityY = 0;

        if (wasInteracting) {
            this.emit('gestureEnd', { state: { ...this.state } });
        }

        // Apply momentum/inertia if needed
        this.applyInertia();
    }

    /**
     * Mouse Event Handlers (for desktop testing)
     */
    handleMouseDown(event) {
        this.isMouseDown = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    handleMouseMove(event) {
        if (this.isMouseDown && this.options.enableDrag) {
            const deltaX = event.clientX - this.lastMouseX;
            const deltaY = event.clientY - this.lastMouseY;

            this.state.translateX += deltaX;
            this.state.translateY += deltaY;

            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;

            this.applyTransform();
            this.emit('drag', { deltaX, deltaY, mouse: true });
        }
    }

    handleMouseUp(event) {
        this.isMouseDown = false;
    }

    handleWheel(event) {
        if (this.options.enablePinchZoom) {
            event.preventDefault();

            const scaleChange = event.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(
                this.options.minScale,
                Math.min(this.options.maxScale, this.state.scale * scaleChange)
            );

            this.state.scale = newScale;
            this.applyTransform();
            this.emit('pinch', { scale: newScale, wheel: true });
        }
    }

    handleKeyDown(event) {
        const { key, ctrlKey, metaKey } = event;
        const modifier = ctrlKey || metaKey;

        switch (key) {
            case 'ArrowUp':
                event.preventDefault();
                this.state.translateY -= 10;
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.state.translateY += 10;
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.state.translateX -= 10;
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.state.translateX += 10;
                break;
            case '=':
            case '+':
                if (modifier) {
                    event.preventDefault();
                    this.state.scale = Math.min(this.options.maxScale, this.state.scale * 1.1);
                }
                break;
            case '-':
                if (modifier) {
                    event.preventDefault();
                    this.state.scale = Math.max(this.options.minScale, this.state.scale * 0.9);
                }
                break;
            case '0':
                if (modifier) {
                    event.preventDefault();
                    this.resetTransform();
                }
                break;
            case 'r':
                if (modifier) {
                    event.preventDefault();
                    this.state.rotation += 90;
                }
                break;
        }

        this.applyTransform();
        this.emit('keyboard', { key, modifier, state: { ...this.state } });
    }

    /**
     * Voice Control Setup
     */
    setupVoiceControl() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.voiceRecognition = new SpeechRecognition();

        this.voiceRecognition.continuous = true;
        this.voiceRecognition.interimResults = true;
        this.voiceRecognition.lang = 'zh-CN';

        this.voiceRecognition.onresult = (event) => {
            const results = Array.from(event.results);
            const transcript = results
                .map(result => result[0].transcript)
                .join(' ')
                .toLowerCase()
                .trim();

            this.processVoiceCommand(transcript);
        };

        this.voiceRecognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.emit('voiceError', { error: event.error });
        };
    }

    processVoiceCommand(transcript) {
        const commands = {
            '放大': () => this.state.scale = Math.min(this.options.maxScale, this.state.scale * 1.2),
            '缩小': () => this.state.scale = Math.max(this.options.minScale, this.state.scale * 0.8),
            '重置': () => this.resetTransform(),
            '左转': () => this.state.rotation -= 90,
            '右转': () => this.state.rotation += 90,
            '上移': () => this.state.translateY -= 50,
            '下移': () => this.state.translateY += 50,
            '左移': () => this.state.translateX -= 50,
            '右移': () => this.state.translateX += 50,
            '停止': () => this.stopVoiceRecognition(),
            '开始': () => this.startVoiceRecognition()
        };

        for (const [command, action] of Object.entries(commands)) {
            if (transcript.includes(command)) {
                action();
                this.applyTransform();
                this.emit('voiceCommand', { command, transcript, state: { ...this.state } });
                break;
            }
        }
    }

    startVoiceRecognition() {
        if (this.voiceRecognition) {
            this.voiceRecognition.start();
            this.emit('voiceStart');
        }
    }

    stopVoiceRecognition() {
        if (this.voiceRecognition) {
            this.voiceRecognition.stop();
            this.emit('voiceStop');
        }
    }

    /**
     * Utility Functions
     */
    getDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getAngle(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    updateTouches(touches) {
        this.touches.clear();
        touches.forEach((touch, index) => {
            this.touches.set(index, {
                id: touch.identifier,
                x: touch.clientX,
                y: touch.clientY,
                timestamp: Date.now()
            });
        });
    }

    updateVelocity(touch) {
        if (!touch) return;

        const now = Date.now();
        const timeDelta = now - this.state.lastTouchTime;

        if (timeDelta > 0) {
            this.state.velocityX = (touch.clientX - this.state.lastTouchX) / timeDelta;
            this.state.velocityY = (touch.clientY - this.state.lastTouchY) / timeDelta;
        }

        this.state.lastTouchTime = now;
    }

    getGestureType(touchCount) {
        if (touchCount === 1) return 'drag';
        if (touchCount === 2) return 'pinch';
        return 'multi-touch';
    }

    applyTransform() {
        if (!this.element) return;

        const transform = `
            translate(${this.state.translateX}px, ${this.state.translateY}px)
            scale(${this.state.scale})
            rotate(${this.state.rotation}deg)
        `;

        this.element.style.transform = transform;
        this.emit('transform', { transform, state: { ...this.state } });
    }

    applyInertia() {
        const friction = 0.95;
        const threshold = 0.01;

        if (Math.abs(this.state.velocityX) > threshold || Math.abs(this.state.velocityY) > threshold) {
            this.state.translateX += this.state.velocityX * 10;
            this.state.translateY += this.state.velocityY * 10;

            this.state.velocityX *= friction;
            this.state.velocityY *= friction;

            this.applyTransform();

            requestAnimationFrame(() => this.applyInertia());
        }
    }

    resetTransform() {
        this.state.scale = 1;
        this.state.rotation = 0;
        this.state.translateX = 0;
        this.state.translateY = 0;
        this.applyTransform();
        this.emit('reset', { state: { ...this.state } });
    }

    /**
     * Performance Optimization
     */
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.enable();
                    } else {
                        this.disable();
                    }
                });
            });

            this.observer.observe(this.element);
        }
    }

    enable() {
        this.element.style.pointerEvents = 'auto';
        this.emit('enable');
    }

    disable() {
        this.element.style.pointerEvents = 'none';
        this.emit('disable');
    }

    /**
     * Event Management
     */
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
        return this;
    }

    off(event, callback) {
        if (this.callbacks.has(event)) {
            const callbacks = this.callbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
        return this;
    }

    emit(event, data = {}) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in gesture callback for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Public API
     */
    getState() {
        return { ...this.state };
    }

    setState(newState) {
        Object.assign(this.state, newState);
        this.applyTransform();
    }

    destroy() {
        // Remove event listeners
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
        this.element.removeEventListener('touchcancel', this.handleTouchEnd);

        this.element.removeEventListener('mousedown', this.handleMouseDown);
        this.element.removeEventListener('mousemove', this.handleMouseMove);
        this.element.removeEventListener('mouseup', this.handleMouseUp);
        this.element.removeEventListener('wheel', this.handleWheel);

        this.element.removeEventListener('keydown', this.handleKeyDown);

        // Clean up voice recognition
        if (this.voiceRecognition) {
            this.voiceRecognition.stop();
            this.voiceRecognition = null;
        }

        // Clean up intersection observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // Clear callbacks
        this.callbacks.clear();

        this.emit('destroy');
    }
}

/**
 * Specialized Gesture Handlers for Different Components
 */

class GalleryGestureHandler extends MobileGestureHandler {
    constructor(element, options = {}) {
        super(element, {
            enablePinchZoom: true,
            enableSwipe: true,
            enableDrag: false, // Gallery handles its own navigation
            ...options
        });

        this.currentIndex = 0;
        this.totalItems = 0;
    }

    init() {
        super.init();
        this.setupGallerySpecificGestures();
    }

    setupGallerySpecificGestures() {
        this.on('swipe', ({ direction }) => {
            if (direction === 'left') {
                this.nextItem();
            } else if (direction === 'right') {
                this.previousItem();
            }
        });

        this.on('doubleTap', () => {
            this.toggleFullscreen();
        });
    }

    nextItem() {
        if (this.currentIndex < this.totalItems - 1) {
            this.currentIndex++;
            this.emit('navigate', { direction: 'next', index: this.currentIndex });
        }
    }

    previousItem() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.emit('navigate', { direction: 'previous', index: this.currentIndex });
        }
    }

    toggleFullscreen() {
        this.emit('fullscreen');
    }
}

class Chart3DGestureHandler extends MobileGestureHandler {
    constructor(element, options = {}) {
        super(element, {
            enablePinchZoom: true,
            enableDrag: true,
            enableRotation: true,
            enableVoiceControl: true,
            ...options
        });
    }

    setupChart3DSpecificGestures() {
        this.on('drag', ({ deltaX, deltaY }) => {
            // Convert drag to 3D rotation
            this.emit('rotate3D', {
                rotationX: deltaY * 0.5,
                rotationY: deltaX * 0.5
            });
        });

        this.on('pinch', ({ scale }) => {
            this.emit('zoom3D', { scale });
        });
    }
}

class ARGestureHandler extends MobileGestureHandler {
    constructor(element, options = {}) {
        super(element, {
            enablePinchZoom: true,
            enableDrag: true,
            enableRotation: true,
            enableVoiceControl: true,
            maxScale: 10,
            minScale: 0.1,
            ...options
        });
    }

    setupARSpecificGestures() {
        this.on('drag', ({ deltaX, deltaY }) => {
            this.emit('moveAR', { deltaX, deltaY });
        });

        this.on('pinch', ({ scale }) => {
            this.emit('scaleAR', { scale });
        });

        this.on('rotation', ({ rotation }) => {
            this.emit('rotateAR', { rotation });
        });

        // Add AR-specific voice commands
        this.on('voiceCommand', ({ command }) => {
            const arCommands = {
                '显示': () => this.emit('showAR'),
                '隐藏': () => this.emit('hideAR'),
                '拍照': () => this.emit('captureAR'),
                '录制': () => this.emit('recordAR'),
                '切换': () => this.emit('switchAR')
            };

            if (arCommands[command]) {
                arCommands[command]();
            }
        });
    }
}

/**
 * Gesture Handler Factory
 */
class GestureHandlerFactory {
    static create(type, element, options = {}) {
        switch (type) {
            case 'gallery':
                return new GalleryGestureHandler(element, options);
            case '3d':
                return new Chart3DGestureHandler(element, options);
            case 'ar':
                return new ARGestureHandler(element, options);
            default:
                return new MobileGestureHandler(element, options);
        }
    }
}

/**
 * Performance Monitor for Gesture Handling
 */
class GesturePerformanceMonitor {
    constructor() {
        this.metrics = {
            gestureCount: 0,
            averageResponseTime: 0,
            droppedFrames: 0,
            batteryUsage: 0
        };

        this.startTime = performance.now();
    }

    recordGesture(duration) {
        this.metrics.gestureCount++;
        this.metrics.averageResponseTime =
            (this.metrics.averageResponseTime + duration) / this.metrics.gestureCount;
    }

    recordDroppedFrame() {
        this.metrics.droppedFrames++;
    }

    getMetrics() {
        return {
            ...this.metrics,
            sessionDuration: performance.now() - this.startTime
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MobileGestureHandler,
        GalleryGestureHandler,
        Chart3DGestureHandler,
        ARGestureHandler,
        GestureHandlerFactory,
        GesturePerformanceMonitor
    };
}

// Make available globally
window.MobileGestureHandler = MobileGestureHandler;
window.GalleryGestureHandler = GalleryGestureHandler;
window.Chart3DGestureHandler = Chart3DGestureHandler;
window.ARGestureHandler = ARGestureHandler;
window.GestureHandlerFactory = GestureHandlerFactory;
window.GesturePerformanceMonitor = GesturePerformanceMonitor;