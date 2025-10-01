/**
 * Mobile AR and Camera Integration Handler
 * Specialized system for mobile AR visualization of lip aesthetics
 * Supports WebXR, WebRTC camera access, and real-time lip tracking
 */

class MobileARHandler {
    constructor(options = {}) {
        this.options = {
            enableFaceTracking: true,
            enableLipSegmentation: true,
            enableRealTimeFilters: true,
            preferredCamera: 'user', // 'user' for front camera, 'environment' for back
            targetFrameRate: 30,
            videoWidth: 1280,
            videoHeight: 720,
            enableHDR: false,
            enableTorch: false,
            ...options
        };

        this.isSupported = false;
        this.isActive = false;
        this.stream = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.context = null;
        this.faceDetector = null;
        this.lipTracker = null;
        this.filterEngine = null;
        this.gestureHandler = null;
        this.performanceMonitor = null;

        // AR state
        this.currentFilter = null;
        this.lipMask = null;
        this.facePoints = [];
        this.lipPoints = [];
        this.stabilizedPoints = [];

        // Mobile optimization
        this.lowPowerMode = false;
        this.batteryLevel = 1.0;
        this.devicePixelRatio = window.devicePixelRatio || 1;

        this.init();
    }

    async init() {
        try {
            await this.checkSupport();
            await this.setupCamera();
            await this.initializeFaceTracking();
            await this.setupGestures();
            this.setupPerformanceMonitoring();
            this.bindEvents();

            console.log('[AR] Mobile AR Handler initialized');
        } catch (error) {
            console.error('[AR] Initialization failed:', error);
            throw error;
        }
    }

    async checkSupport() {
        // Check essential APIs
        const support = {
            getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            webGL: !!document.createElement('canvas').getContext('webgl'),
            webXR: !!(navigator.xr),
            faceDetection: !!(window.FaceDetector),
            deviceMotion: !!window.DeviceMotionEvent,
            deviceOrientation: !!window.DeviceOrientationEvent,
            vibration: !!navigator.vibrate,
            fullscreen: !!(document.documentElement.requestFullscreen)
        };

        this.isSupported = support.getUserMedia && support.webGL;

        if (!this.isSupported) {
            throw new Error('Required AR features not supported on this device');
        }

        return support;
    }

    async setupCamera() {
        const constraints = {
            video: {
                facingMode: this.options.preferredCamera,
                width: { ideal: this.options.videoWidth, min: 640, max: 1920 },
                height: { ideal: this.options.videoHeight, min: 480, max: 1080 },
                frameRate: { ideal: this.options.targetFrameRate, min: 15, max: 60 }
            },
            audio: false
        };

        // Add advanced constraints for supported devices
        if (this.options.enableHDR) {
            constraints.video.advanced = [{ whiteBalanceMode: 'continuous' }];
        }

        try {
            // Request camera permission
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Create video element
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = this.stream;
            this.videoElement.autoplay = true;
            this.videoElement.playsInline = true;
            this.videoElement.muted = true;
            this.videoElement.style.display = 'none'; // Hidden processing video

            // Create canvas for processing
            this.canvasElement = document.createElement('canvas');
            this.context = this.canvasElement.getContext('2d');

            // Wait for video to be ready
            await new Promise((resolve, reject) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play().then(resolve).catch(reject);
                };
                this.videoElement.onerror = reject;

                // Timeout after 10 seconds
                setTimeout(() => reject(new Error('Camera initialization timeout')), 10000);
            });

            // Set canvas dimensions
            this.canvasElement.width = this.videoElement.videoWidth;
            this.canvasElement.height = this.videoElement.videoHeight;

            console.log('[AR] Camera initialized:', this.videoElement.videoWidth, 'x', this.videoElement.videoHeight);

        } catch (error) {
            console.error('[AR] Camera setup failed:', error);

            if (error.name === 'NotAllowedError') {
                throw new Error('Camera permission denied. Please allow camera access to use AR features.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No camera found on this device.');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('Camera access is not supported in this browser.');
            } else if (error.name === 'OverconstrainedError') {
                // Try with fallback constraints
                return this.setupCameraWithFallback();
            } else {
                throw new Error(`Camera initialization failed: ${error.message}`);
            }
        }
    }

    async setupCameraWithFallback() {
        console.log('[AR] Trying fallback camera configuration...');

        const fallbackConstraints = {
            video: {
                facingMode: this.options.preferredCamera,
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 30 }
            },
            audio: false
        };

        try {
            this.stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);

            // Create video element
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = this.stream;
            this.videoElement.autoplay = true;
            this.videoElement.playsInline = true;
            this.videoElement.muted = true;
            this.videoElement.style.display = 'none';

            // Create canvas for processing
            this.canvasElement = document.createElement('canvas');
            this.context = this.canvasElement.getContext('2d');

            await new Promise((resolve, reject) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play().then(resolve).catch(reject);
                };
                this.videoElement.onerror = reject;
                setTimeout(() => reject(new Error('Fallback camera timeout')), 10000);
            });

            this.canvasElement.width = this.videoElement.videoWidth;
            this.canvasElement.height = this.videoElement.videoHeight;

            console.log('[AR] Fallback camera initialized:', this.videoElement.videoWidth, 'x', this.videoElement.videoHeight);

        } catch (fallbackError) {
            console.error('[AR] Fallback camera setup failed:', fallbackError);
            throw new Error('Failed to initialize camera with fallback settings');
        }
    }

    async initializeFaceTracking() {
        try {
            // Initialize face detection if available
            if (window.FaceDetector) {
                this.faceDetector = new FaceDetector({
                    maxDetectedFaces: 1,
                    fastMode: true
                });
            } else {
                // Fallback to MediaPipe or TensorFlow.js
                await this.initializeJSFaceTracking();
            }

            // Initialize lip tracking system
            this.lipTracker = new LipTracker({
                smoothing: 0.7,
                minConfidence: 0.5,
                enableStabilization: true
            });

            console.log('[AR] Face tracking initialized');

        } catch (error) {
            console.warn('[AR] Face tracking initialization failed:', error);
            // Continue without face tracking
        }
    }

    async initializeJSFaceTracking() {
        // Lightweight face tracking fallback
        try {
            // Import TensorFlow.js face-landmarks-detection
            // This would be loaded dynamically in a real implementation
            this.faceDetector = await this.createJSFaceDetector();
        } catch (error) {
            console.warn('[AR] JS face tracking failed to load:', error);
        }
    }

    async createJSFaceDetector() {
        // Placeholder for TensorFlow.js integration
        const detector = {
            async detect(video) {
                // Mock face detection for demo
                return [{
                    landmarks: detector.generateMockLandmarks(video)
                }];
            },
            generateMockLandmarks(video) {
                // Generate mock facial landmarks
                const landmarks = [];
                const centerX = video ? video.videoWidth / 2 : 320;
                const centerY = video ? video.videoHeight / 2 : 240;

                // Lip landmarks (simplified)
                for (let i = 0; i < 20; i++) {
                    const angle = (i / 20) * Math.PI * 2;
                    landmarks.push({
                        x: centerX + Math.cos(angle) * 50,
                        y: centerY + Math.sin(angle) * 30
                    });
                }

                return landmarks;
            }
        };
        return detector;
    }

    async setupGestures() {
        // Integrate with mobile gesture handler
        if (window.GestureHandlerFactory) {
            this.gestureHandler = window.GestureHandlerFactory.create('ar', this.canvasElement, {
                enablePinchZoom: true,
                enableSwipe: true,
                enableDoubleTap: true,
                enableVoiceControl: true
            });

            this.gestureHandler.on('pinch', ({ scale }) => {
                this.adjustZoom(scale);
            });

            this.gestureHandler.on('doubleTap', () => {
                this.toggleFilter();
            });

            this.gestureHandler.on('swipe', ({ direction }) => {
                this.handleSwipeFilter(direction);
            });

            this.gestureHandler.on('voiceCommand', ({ command }) => {
                this.handleVoiceCommand(command);
            });
        }
    }

    setupPerformanceMonitoring() {
        this.performanceMonitor = new ARPerformanceMonitor();

        // Monitor battery level
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                this.batteryLevel = battery.level;
                this.lowPowerMode = battery.level < 0.2;

                battery.addEventListener('levelchange', () => {
                    this.batteryLevel = battery.level;
                    this.adjustPerformanceSettings();
                });
            });
        }

        // Monitor device temperature (if available)
        if (navigator.deviceMemory) {
            this.adjustPerformanceBasedOnMemory(navigator.deviceMemory);
        }
    }

    adjustPerformanceSettings() {
        if (this.batteryLevel < 0.2) {
            // Enter low power mode
            this.lowPowerMode = true;
            this.options.targetFrameRate = 15;
            this.options.enableRealTimeFilters = false;
        } else if (this.batteryLevel > 0.5 && this.lowPowerMode) {
            // Exit low power mode
            this.lowPowerMode = false;
            this.options.targetFrameRate = 30;
            this.options.enableRealTimeFilters = true;
        }
    }

    adjustPerformanceBasedOnMemory(memoryGB) {
        if (memoryGB < 4) {
            // Low memory device
            this.options.videoWidth = Math.min(this.options.videoWidth, 720);
            this.options.videoHeight = Math.min(this.options.videoHeight, 480);
            this.options.targetFrameRate = Math.min(this.options.targetFrameRate, 24);
        }
    }

    bindEvents() {
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 500);
        });

        // Handle device motion for AR interactions
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (event) => {
                this.handleDeviceMotion(event);
            });
        }

        // Handle device orientation for AR tracking
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (event) => {
                this.handleDeviceOrientation(event);
            });
        }
    }

    async startAR() {
        if (this.isActive) return;

        try {
            this.isActive = true;

            // Create and display AR view
            await this.createARView();

            // Start processing loop
            this.startProcessingLoop();

            // Enter fullscreen for better AR experience
            if (document.documentElement.requestFullscreen) {
                try {
                    await document.documentElement.requestFullscreen();
                } catch (e) {
                    console.warn('[AR] Fullscreen request failed:', e);
                }
            }

            // Lock orientation if supported
            if (screen.orientation && screen.orientation.lock) {
                try {
                    await screen.orientation.lock('portrait');
                } catch (error) {
                    console.warn('[AR] Orientation lock failed:', error);
                }
            }

            // Provide haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }

            this.emit('arStarted');
            console.log('[AR] AR session started');

        } catch (error) {
            console.error('[AR] Failed to start AR:', error);
            this.isActive = false;
            throw error;
        }
    }

    async createARView() {
        // Find AR container or create one
        const arContainer = document.getElementById('ar-container') ||
                           document.querySelector('.ar-demo-container');

        if (!arContainer) {
            throw new Error('AR container not found');
        }

        // Clear existing content
        arContainer.innerHTML = '';

        // Add video display
        const videoDisplay = document.createElement('video');
        videoDisplay.id = 'ar-video-display';
        videoDisplay.autoplay = true;
        videoDisplay.playsInline = true;
        videoDisplay.muted = true;
        videoDisplay.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            background: #000;
        `;

        // Use the same stream as processing video
        if (this.stream) {
            videoDisplay.srcObject = this.stream;
        }

        arContainer.appendChild(videoDisplay);

        // Add canvas overlay for AR effects
        const overlay = document.createElement('canvas');
        overlay.id = 'ar-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;

        arContainer.appendChild(overlay);

        // Set canvas size
        overlay.width = arContainer.clientWidth;
        overlay.height = arContainer.clientHeight;

        // Store overlay context for drawing AR effects
        this.overlayCanvas = overlay;
        this.overlayContext = overlay.getContext('2d');

        console.log('[AR] AR view created');
    }

    async stopAR() {
        if (!this.isActive) return;

        try {
            this.isActive = false;

            // Exit fullscreen
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            }

            // Unlock orientation
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }

            this.emit('arStopped');
            console.log('[AR] AR session stopped');

        } catch (error) {
            console.error('[AR] Failed to stop AR:', error);
        }
    }

    startProcessingLoop() {
        const processFrame = async () => {
            if (!this.isActive) return;

            try {
                // Draw video frame to canvas
                this.context.drawImage(
                    this.videoElement,
                    0, 0,
                    this.canvasElement.width,
                    this.canvasElement.height
                );

                // Detect faces and lips
                await this.detectFacesAndLips();

                // Apply AR effects
                await this.renderAREffects();

                // Monitor performance
                this.performanceMonitor.recordFrame();

                // Schedule next frame
                if (!this.lowPowerMode) {
                    requestAnimationFrame(processFrame);
                } else {
                    setTimeout(processFrame, 1000 / 15); // 15 FPS in low power mode
                }

            } catch (error) {
                console.error('[AR] Frame processing error:', error);
                // Continue processing despite errors
                setTimeout(processFrame, 100);
            }
        };

        processFrame();
    }

    async detectFacesAndLips() {
        if (!this.faceDetector) return;

        try {
            const faces = await this.faceDetector.detect(this.videoElement);

            if (faces && faces.length > 0) {
                const face = faces[0];
                this.facePoints = face.landmarks || [];

                // Extract lip points
                this.lipPoints = this.extractLipPoints(this.facePoints);

                // Stabilize points for smooth AR
                this.stabilizedPoints = this.lipTracker.stabilize(this.lipPoints);
            }

        } catch (error) {
            console.warn('[AR] Face detection error:', error);
        }
    }

    extractLipPoints(landmarks) {
        // Extract lip-specific landmarks
        // This would be adapted based on the face detection library used
        if (!landmarks || landmarks.length === 0) return [];

        // Simplified lip extraction (would be more sophisticated in real implementation)
        const lipIndices = [
            61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318,
            78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308
        ];

        return lipIndices.map(index => landmarks[index]).filter(Boolean);
    }

    async renderAREffects() {
        if (!this.stabilizedPoints || this.stabilizedPoints.length === 0) return;

        // Clear previous AR effects on overlay
        if (this.overlayContext && this.overlayCanvas) {
            this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

            // Scale points from video resolution to overlay resolution
            const scaleX = this.overlayCanvas.width / this.canvasElement.width;
            const scaleY = this.overlayCanvas.height / this.canvasElement.height;

            const scaledPoints = this.stabilizedPoints.map(point => ({
                x: point.x * scaleX,
                y: point.y * scaleY
            }));

            // Apply current filter
            if (this.currentFilter && this.options.enableRealTimeFilters) {
                await this.applyFilter(this.currentFilter, scaledPoints, this.overlayContext);
            }

            // Draw lip augmentation preview
            this.drawLipAugmentation(scaledPoints, this.overlayContext);

            // Draw injection point suggestions
            this.drawInjectionPoints(scaledPoints, this.overlayContext);

            // Draw measurement overlays
            this.drawMeasurements(scaledPoints, this.overlayContext);
        }
    }

    async applyFilter(filter, lipPoints, context = this.context) {
        switch (filter.type) {
            case 'color_enhancement':
                this.enhanceLipColor(lipPoints, filter.color, context);
                break;
            case 'volume_preview':
                this.previewVolumeIncrease(lipPoints, filter.amount, context);
                break;
            case 'shape_adjustment':
                this.previewShapeAdjustment(lipPoints, filter.adjustments, context);
                break;
            case 'symmetry_guide':
                this.drawSymmetryGuides(lipPoints, context);
                break;
        }
    }

    enhanceLipColor(lipPoints, color, context = this.context) {
        if (lipPoints.length === 0) return;

        // Create lip mask
        context.save();
        context.globalCompositeOperation = 'multiply';
        context.fillStyle = color;

        // Draw lip shape
        context.beginPath();
        lipPoints.forEach((point, index) => {
            if (index === 0) {
                context.moveTo(point.x, point.y);
            } else {
                context.lineTo(point.x, point.y);
            }
        });
        context.closePath();
        context.fill();
        context.restore();
    }

    previewVolumeIncrease(lipPoints, amount, context = this.context) {
        if (lipPoints.length === 0) return;

        context.save();
        context.strokeStyle = 'rgba(212, 175, 55, 0.8)';
        context.lineWidth = 2;
        context.setLineDash([5, 5]);

        // Draw expanded lip outline
        context.beginPath();
        lipPoints.forEach((point, index) => {
            const expandedPoint = this.expandPoint(point, amount, lipPoints);
            if (index === 0) {
                context.moveTo(expandedPoint.x, expandedPoint.y);
            } else {
                context.lineTo(expandedPoint.x, expandedPoint.y);
            }
        });
        context.closePath();
        context.stroke();
        context.restore();
    }

    expandPoint(point, amount, allPoints) {
        // Calculate expansion based on lip center
        const center = this.calculateLipCenter(allPoints);
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return point;

        const expansion = amount * 0.1; // Scale factor
        return {
            x: point.x + (dx / distance) * expansion,
            y: point.y + (dy / distance) * expansion
        };
    }

    calculateLipCenter(points = this.stabilizedPoints) {
        if (points.length === 0) {
            return { x: this.canvasElement.width / 2, y: this.canvasElement.height / 2 };
        }

        const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

        return { x: centerX, y: centerY };
    }

    drawLipAugmentation(points, context = this.context) {
        // Draw suggested augmentation areas
        const center = this.calculateLipCenter(points);

        context.save();
        context.fillStyle = 'rgba(255, 107, 157, 0.3)';
        context.strokeStyle = 'rgba(255, 107, 157, 0.8)';
        context.lineWidth = 1;

        // Draw augmentation zones
        const zones = [
            { x: center.x - 30, y: center.y - 10, radius: 8 }, // Left upper lip
            { x: center.x + 30, y: center.y - 10, radius: 8 }, // Right upper lip
            { x: center.x, y: center.y + 15, radius: 10 }      // Lower lip
        ];

        zones.forEach(zone => {
            context.beginPath();
            context.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            context.fill();
            context.stroke();
        });

        context.restore();
    }

    drawInjectionPoints(points, context = this.context) {
        // Draw recommended injection points
        const injectionPoints = this.calculateInjectionPoints(points);

        context.save();
        context.fillStyle = 'rgba(0, 255, 0, 0.8)';
        context.strokeStyle = 'rgba(0, 255, 0, 1)';
        context.lineWidth = 2;

        injectionPoints.forEach((point, index) => {
            context.beginPath();
            context.arc(point.x, point.y, 4, 0, Math.PI * 2);
            context.fill();
            context.stroke();

            // Draw point number
            context.fillStyle = 'white';
            context.font = '12px Arial';
            context.textAlign = 'center';
            context.fillText((index + 1).toString(), point.x, point.y + 4);
            context.fillStyle = 'rgba(0, 255, 0, 0.8)';
        });

        context.restore();
    }

    calculateInjectionPoints(points) {
        // Calculate optimal injection points based on lip anatomy
        const center = this.calculateLipCenter(points);

        return [
            { x: center.x - 20, y: center.y - 8, name: 'Left Cupid\'s Bow' },
            { x: center.x + 20, y: center.y - 8, name: 'Right Cupid\'s Bow' },
            { x: center.x, y: center.y - 12, name: 'Philtrum' },
            { x: center.x - 25, y: center.y + 5, name: 'Left Corner' },
            { x: center.x + 25, y: center.y + 5, name: 'Right Corner' },
            { x: center.x, y: center.y + 18, name: 'Lower Lip Center' }
        ];
    }

    drawMeasurements(points, context = this.context) {
        // Draw lip measurements and proportions
        if (points.length === 0) return;

        context.save();
        context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.lineWidth = 1;
        context.font = '12px Arial';

        const measurements = this.calculateLipMeasurements(points);

        // Draw measurement lines and labels
        let yOffset = 30;
        measurements.forEach(measurement => {
            context.fillRect(10, yOffset - 15, 200, 20);
            context.fillStyle = 'white';
            context.fillText(`${measurement.label}: ${measurement.value}`, 15, yOffset);
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            yOffset += 25;
        });

        context.restore();
    }

    calculateLipMeasurements(points) {
        if (points.length === 0) return [];

        // Calculate basic lip measurements
        const leftmost = Math.min(...points.map(p => p.x));
        const rightmost = Math.max(...points.map(p => p.x));
        const topmost = Math.min(...points.map(p => p.y));
        const bottommost = Math.max(...points.map(p => p.y));

        const width = rightmost - leftmost;
        const height = bottommost - topmost;
        const ratio = (width / height).toFixed(2);

        return [
            { label: 'Width', value: `${Math.round(width)}px` },
            { label: 'Height', value: `${Math.round(height)}px` },
            { label: 'Ratio', value: `${ratio}:1` },
            { label: 'Symmetry', value: this.calculateSymmetry(points) }
        ];
    }

    calculateSymmetry(points) {
        // Calculate lip symmetry score
        const center = this.calculateLipCenter(points);
        let symmetryScore = 100;

        // Compare left and right sides
        points.forEach(point => {
            const distanceFromCenter = Math.abs(point.x - center.x);
            // Simplified symmetry calculation
            symmetryScore -= distanceFromCenter * 0.1;
        });

        return `${Math.max(0, Math.round(symmetryScore))}%`;
    }

    // Filter management
    setFilter(filter) {
        this.currentFilter = filter;
        this.emit('filterChanged', filter);
    }

    toggleFilter() {
        const filters = [
            { type: 'color_enhancement', color: 'rgba(255, 100, 100, 0.3)' },
            { type: 'volume_preview', amount: 1.2 },
            { type: 'shape_adjustment', adjustments: {} },
            { type: 'symmetry_guide' }
        ];

        const currentIndex = filters.findIndex(f => f.type === this.currentFilter?.type);
        const nextIndex = (currentIndex + 1) % filters.length;
        this.setFilter(filters[nextIndex]);
    }

    handleSwipeFilter(direction) {
        // Change filter based on swipe direction
        if (direction === 'left') {
            this.toggleFilter();
        } else if (direction === 'right') {
            this.setFilter(null); // Clear filter
        }
    }

    handleVoiceCommand(command) {
        switch (command) {
            case '拍照':
            case 'capture':
                this.capturePhoto();
                break;
            case '切换':
            case 'switch':
                this.switchCamera();
                break;
            case '滤镜':
            case 'filter':
                this.toggleFilter();
                break;
            case '停止':
            case 'stop':
                this.stopAR();
                break;
        }
    }

    async capturePhoto() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = this.canvasElement.width;
            canvas.height = this.canvasElement.height;

            // Draw current AR view
            ctx.drawImage(this.canvasElement, 0, 0);

            // Convert to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));

            // Save or share
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lip-ar-capture-${Date.now()}.jpg`;
            a.click();

            URL.revokeObjectURL(url);

            // Provide haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }

            this.emit('photoCaptured', { blob, url });

        } catch (error) {
            console.error('[AR] Photo capture failed:', error);
        }
    }

    async switchCamera() {
        try {
            // Toggle between front and back camera
            this.options.preferredCamera = this.options.preferredCamera === 'user' ? 'environment' : 'user';

            // Stop current stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            // Restart with new camera
            await this.setupCamera();

            this.emit('cameraSwitched', this.options.preferredCamera);

        } catch (error) {
            console.error('[AR] Camera switch failed:', error);
        }
    }

    adjustZoom(scale) {
        // Implement digital zoom
        const currentScale = this.videoElement.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || 1;
        const newScale = Math.max(1, Math.min(3, currentScale * scale));

        this.videoElement.style.transform = `scale(${newScale})`;
        this.emit('zoomChanged', newScale);
    }

    handleOrientationChange() {
        // Adjust canvas and processing for new orientation
        setTimeout(() => {
            if (this.videoElement && this.canvasElement) {
                this.canvasElement.width = this.videoElement.videoWidth;
                this.canvasElement.height = this.videoElement.videoHeight;
            }
        }, 100);
    }

    handleDeviceMotion(event) {
        // Use device motion for AR interactions
        const { acceleration, rotationRate } = event;

        if (acceleration) {
            // Detect shake gesture
            const totalAcceleration = Math.abs(acceleration.x) + Math.abs(acceleration.y) + Math.abs(acceleration.z);
            if (totalAcceleration > 20) {
                this.handleShakeGesture();
            }
        }
    }

    handleDeviceOrientation(event) {
        // Use device orientation for AR stabilization
        const { alpha, beta, gamma } = event;

        // Apply orientation-based adjustments
        if (this.lipTracker) {
            this.lipTracker.updateOrientation({ alpha, beta, gamma });
        }
    }

    handleShakeGesture() {
        // Reset AR view or change filter on shake
        this.resetARView();

        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
    }

    resetARView() {
        this.currentFilter = null;
        this.lipPoints = [];
        this.stabilizedPoints = [];
        this.emit('arReset');
    }

    pause() {
        this.isActive = false;
    }

    resume() {
        if (!this.isActive && this.stream) {
            this.isActive = true;
            this.startProcessingLoop();
        }
    }

    async destroy() {
        try {
            this.isActive = false;

            // Stop camera stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            // Clean up elements
            if (this.videoElement) {
                this.videoElement.remove();
            }

            if (this.canvasElement) {
                this.canvasElement.remove();
            }

            // Clean up gesture handler
            if (this.gestureHandler) {
                this.gestureHandler.destroy();
            }

            console.log('[AR] Mobile AR Handler destroyed');

        } catch (error) {
            console.error('[AR] Destruction failed:', error);
        }
    }

    // Event system
    on(event, callback) {
        if (!this.events) this.events = {};
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (!this.events || !this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

// Lip tracking utility
class LipTracker {
    constructor(options = {}) {
        this.options = {
            smoothing: 0.7,
            minConfidence: 0.5,
            enableStabilization: true,
            ...options
        };

        this.previousPoints = [];
        this.orientation = { alpha: 0, beta: 0, gamma: 0 };
    }

    stabilize(points) {
        if (!this.options.enableStabilization || points.length === 0) {
            return points;
        }

        if (this.previousPoints.length === 0) {
            this.previousPoints = points;
            return points;
        }

        // Apply smoothing
        const stabilized = points.map((point, index) => {
            const prevPoint = this.previousPoints[index];
            if (!prevPoint) return point;

            return {
                x: prevPoint.x * this.options.smoothing + point.x * (1 - this.options.smoothing),
                y: prevPoint.y * this.options.smoothing + point.y * (1 - this.options.smoothing)
            };
        });

        this.previousPoints = stabilized;
        return stabilized;
    }

    updateOrientation(orientation) {
        this.orientation = orientation;
    }
}

// Performance monitoring for AR
class ARPerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.startTime = Date.now();
        this.lastFrameTime = Date.now();
        this.fps = 0;
        this.frameTime = 0;
    }

    recordFrame() {
        this.frameCount++;
        const now = Date.now();

        this.frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // Calculate FPS every second
        if (this.frameCount % 30 === 0) {
            const elapsed = (now - this.startTime) / 1000;
            this.fps = this.frameCount / elapsed;
        }
    }

    getMetrics() {
        return {
            fps: Math.round(this.fps),
            frameTime: this.frameTime,
            totalFrames: this.frameCount,
            averageFPS: Math.round(this.frameCount / ((Date.now() - this.startTime) / 1000))
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobileARHandler, LipTracker, ARPerformanceMonitor };
}

// Make available globally
window.MobileARHandler = MobileARHandler;
window.LipTracker = LipTracker;
window.ARPerformanceMonitor = ARPerformanceMonitor;

console.log('[AR] Mobile AR Handler module loaded');