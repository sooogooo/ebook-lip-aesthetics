/**
 * Mobile-Optimized 3D Anatomy Viewer
 * Enhanced version of the 3D viewer specifically optimized for mobile devices
 * Includes touch gestures, performance optimization, and responsive design
 */

class Mobile3DViewer {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);

        this.options = {
            // Performance settings
            enableShadows: true,
            enablePostProcessing: true,
            maxPixelRatio: 2,
            targetFPS: 60,
            enableLOD: true,
            enableFrustumCulling: true,

            // Mobile-specific settings
            enableBatteryOptimization: true,
            enableThermalThrottling: true,
            enableAdaptiveQuality: true,

            // Visual settings
            backgroundColor: 0x1e1e2e,
            enableBloom: true,
            enableSSAO: false, // Disabled for mobile performance

            // Interaction settings
            enableRotation: true,
            enableZoom: true,
            enablePan: true,
            enableMultiTouch: true,

            ...options
        };

        // Mobile device detection
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.devicePixelRatio = Math.min(window.devicePixelRatio || 1, this.options.maxPixelRatio);

        // Performance monitoring
        this.performanceMonitor = new Mobile3DPerformanceMonitor();
        this.qualityController = new AdaptiveQualityController();

        // Gesture handling
        this.gestureHandler = null;
        this.touchPoints = new Map();

        // 3D objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.composer = null;

        // Models and materials
        this.models = new Map();
        this.materials = new Map();
        this.animations = new Map();

        // State management
        this.isActive = false;
        this.isPaused = false;
        this.currentLOD = 'high';
        this.batteryLevel = 1.0;

        this.init();
    }

    detectMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    detectTablet() {
        return /iPad|Android(?!.*Mobile)|Kindle|PlayBook|Silk/i.test(navigator.userAgent);
    }

    async init() {
        try {
            // Setup container
            this.setupContainer();

            // Initialize 3D engine
            await this.init3DEngine();

            // Setup gesture handling
            this.setupGestureHandling();

            // Setup performance monitoring
            this.setupPerformanceMonitoring();

            // Load initial models
            await this.loadInitialModels();

            // Start render loop
            this.startRenderLoop();

            // Setup responsive behavior
            this.setupResponsiveBehavior();

            this.isActive = true;

            console.log('[3D] Mobile 3D Viewer initialized');

        } catch (error) {
            console.error('[3D] Initialization failed:', error);
            throw error;
        }
    }

    setupContainer() {
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.overflow = 'hidden';
        this.container.style.touchAction = 'none';
        this.container.style.userSelect = 'none';

        // Add loading indicator
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'mobile-3d-loading';
        this.loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading 3D Model...</div>
        `;
        this.container.appendChild(this.loadingIndicator);
    }

    async init3DEngine() {
        // Check if THREE.js is available
        if (typeof THREE === 'undefined') {
            console.error('[3D] THREE.js library not found');
            throw new Error('THREE.js library is required but not loaded');
        }

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);

        // Create camera with mobile-optimized settings
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 10);

        // Create renderer with mobile optimizations
        this.renderer = new THREE.WebGLRenderer({
            antialias: !this.isMobile, // Disable antialiasing on mobile for performance
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true
        });

        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(this.devicePixelRatio);

        // Mobile-specific renderer settings
        if (this.isMobile) {
            this.renderer.shadowMap.enabled = false; // Disable shadows on mobile
            this.renderer.outputColorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
        } else {
            this.renderer.shadowMap.enabled = this.options.enableShadows;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
        }

        this.container.appendChild(this.renderer.domElement);

        // Setup lighting
        this.setupLighting();

        // Setup post-processing
        if (this.options.enablePostProcessing && !this.isMobile) {
            this.setupPostProcessing();
        }
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 7.5);

        if (!this.isMobile && this.options.enableShadows) {
            mainLight.castShadow = true;
            mainLight.shadow.mapSize.setScalar(1024); // Reduced shadow map size for mobile
            mainLight.shadow.camera.near = 0.1;
            mainLight.shadow.camera.far = 50;
            mainLight.shadow.camera.left = -10;
            mainLight.shadow.camera.right = 10;
            mainLight.shadow.camera.top = 10;
            mainLight.shadow.camera.bottom = -10;
        }

        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }

    setupPostProcessing() {
        if (!window.EffectComposer) return;

        this.composer = new THREE.EffectComposer(this.renderer);

        // Render pass
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Bloom pass (only on desktop or high-end mobile)
        if (this.options.enableBloom && this.performanceMonitor.canHandleBloom()) {
            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
                0.3, 0.4, 0.85
            );
            this.composer.addPass(bloomPass);
        }
    }

    setupGestureHandling() {
        // Use the existing mobile gesture handler
        if (window.GestureHandlerFactory) {
            this.gestureHandler = window.GestureHandlerFactory.create('3d', this.renderer.domElement, {
                enablePinchZoom: this.options.enableZoom,
                enableDrag: this.options.enableRotation,
                enablePan: this.options.enablePan,
                enableMultiTouch: this.options.enableMultiTouch,
                minScale: 0.5,
                maxScale: 3.0
            });

            // Bind gesture events
            this.gestureHandler.on('drag', ({ deltaX, deltaY }) => {
                this.handleRotation(deltaX, deltaY);
            });

            this.gestureHandler.on('pinch', ({ scale }) => {
                this.handleZoom(scale);
            });

            this.gestureHandler.on('pan', ({ deltaX, deltaY }) => {
                this.handlePan(deltaX, deltaY);
            });

            this.gestureHandler.on('doubleTap', () => {
                this.resetView();
            });
        }

        // Fallback touch handling
        this.setupFallbackTouchHandling();
    }

    setupFallbackTouchHandling() {
        let lastTouchDistance = 0;
        let lastTouchCenter = { x: 0, y: 0 };
        let isRotating = false;

        this.renderer.domElement.addEventListener('touchstart', (event) => {
            event.preventDefault();

            if (event.touches.length === 2) {
                // Two-finger touch
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];

                lastTouchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );

                lastTouchCenter = {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2
                };
            } else if (event.touches.length === 1) {
                // Single touch
                isRotating = true;
                lastTouchCenter = {
                    x: event.touches[0].clientX,
                    y: event.touches[0].clientY
                };
            }
        });

        this.renderer.domElement.addEventListener('touchmove', (event) => {
            event.preventDefault();

            if (event.touches.length === 2) {
                // Pinch zoom
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];

                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );

                const scale = currentDistance / lastTouchDistance;
                this.handleZoom(scale);

                lastTouchDistance = currentDistance;

            } else if (event.touches.length === 1 && isRotating) {
                // Rotation
                const touch = event.touches[0];
                const deltaX = touch.clientX - lastTouchCenter.x;
                const deltaY = touch.clientY - lastTouchCenter.y;

                this.handleRotation(deltaX, deltaY);

                lastTouchCenter = {
                    x: touch.clientX,
                    y: touch.clientY
                };
            }
        });

        this.renderer.domElement.addEventListener('touchend', () => {
            isRotating = false;
        });
    }

    handleRotation(deltaX, deltaY) {
        if (!this.options.enableRotation) return;

        const rotationSpeed = this.isMobile ? 0.005 : 0.01;

        // Rotate around Y axis
        this.scene.rotation.y += deltaX * rotationSpeed;

        // Rotate around X axis
        this.scene.rotation.x += deltaY * rotationSpeed;

        // Constrain X rotation
        this.scene.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.scene.rotation.x));
    }

    handleZoom(scale) {
        if (!this.options.enableZoom) return;

        const currentDistance = this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
        const newDistance = currentDistance / scale;

        // Constrain zoom
        const minDistance = 3;
        const maxDistance = 20;
        const clampedDistance = Math.max(minDistance, Math.min(maxDistance, newDistance));

        // Update camera position
        const direction = this.camera.position.clone().normalize();
        this.camera.position.copy(direction.multiplyScalar(clampedDistance));
        this.camera.lookAt(0, 0, 0);
    }

    handlePan(deltaX, deltaY) {
        if (!this.options.enablePan) return;

        const panSpeed = this.isMobile ? 0.002 : 0.005;

        // Get camera vectors
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();

        this.camera.getWorldDirection(new THREE.Vector3());
        right.setFromMatrixColumn(this.camera.matrix, 0);
        up.setFromMatrixColumn(this.camera.matrix, 1);

        // Calculate pan offset
        const panOffset = new THREE.Vector3();
        panOffset.add(right.multiplyScalar(-deltaX * panSpeed));
        panOffset.add(up.multiplyScalar(deltaY * panSpeed));

        // Apply pan
        this.camera.position.add(panOffset);
    }

    resetView() {
        // Smooth animation back to default view
        const targetPosition = new THREE.Vector3(0, 0, 10);
        const targetRotation = new THREE.Euler(0, 0, 0);

        this.animateToView(targetPosition, targetRotation, 1000);
    }

    animateToView(targetPosition, targetRotation, duration) {
        const startPosition = this.camera.position.clone();
        const startRotation = this.scene.rotation.clone();
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutQuad(progress);

            // Interpolate position
            this.camera.position.lerpVectors(startPosition, targetPosition, eased);

            // Interpolate rotation
            this.scene.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * eased;
            this.scene.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * eased;
            this.scene.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    setupPerformanceMonitoring() {
        // Monitor battery level
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                this.batteryLevel = battery.level;
                this.adjustQualityForBattery();

                battery.addEventListener('levelchange', () => {
                    this.batteryLevel = battery.level;
                    this.adjustQualityForBattery();
                });
            });
        }

        // Monitor frame rate
        setInterval(() => {
            const metrics = this.performanceMonitor.getMetrics();
            this.qualityController.adjustQuality(metrics);
        }, 1000);

        // Monitor memory usage
        if (performance.memory) {
            setInterval(() => {
                const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
                if (memoryUsage > 0.8) {
                    this.reduceQuality();
                }
            }, 5000);
        }
    }

    adjustQualityForBattery() {
        if (this.batteryLevel < 0.2) {
            // Low battery - reduce quality significantly
            this.setQuality('low');
        } else if (this.batteryLevel < 0.5) {
            // Medium battery - moderate quality
            this.setQuality('medium');
        } else {
            // High battery - full quality
            this.setQuality('high');
        }
    }

    setQuality(level) {
        this.currentLOD = level;

        switch (level) {
            case 'low':
                this.renderer.setPixelRatio(Math.min(1, this.devicePixelRatio));
                this.disablePostProcessing();
                this.reduceMaterialQuality();
                break;

            case 'medium':
                this.renderer.setPixelRatio(Math.min(1.5, this.devicePixelRatio));
                this.enableBasicPostProcessing();
                this.setMediumMaterialQuality();
                break;

            case 'high':
                this.renderer.setPixelRatio(this.devicePixelRatio);
                this.enableFullPostProcessing();
                this.setHighMaterialQuality();
                break;
        }

        console.log(`[3D] Quality set to: ${level}`);
    }

    disablePostProcessing() {
        this.composer = null;
    }

    enableBasicPostProcessing() {
        if (this.isMobile) return; // Skip on mobile
        this.setupPostProcessing();
    }

    enableFullPostProcessing() {
        if (!this.isMobile) {
            this.setupPostProcessing();
        }
    }

    reduceMaterialQuality() {
        this.materials.forEach(material => {
            if (material.map) material.map.generateMipmaps = false;
            if (material.normalMap) material.normalMap = null;
            if (material.roughnessMap) material.roughnessMap = null;
        });
    }

    setMediumMaterialQuality() {
        this.materials.forEach(material => {
            if (material.map) material.map.generateMipmaps = true;
            // Keep some maps but reduce quality
        });
    }

    setHighMaterialQuality() {
        // Restore full material quality
        this.materials.forEach(material => {
            if (material.map) material.map.generateMipmaps = true;
            // Restore all maps
        });
    }

    async loadInitialModels() {
        try {
            // Try to load lip anatomy model
            let lipModel;
            try {
                lipModel = await this.loadModel('/models/lip_anatomy.gltf');
                this.models.set('lipAnatomy', lipModel);
            } catch (error) {
                console.warn('[3D] GLTF model loading failed, creating fallback:', error);
                lipModel = this.createFallbackModel();
                this.models.set('lipAnatomy', lipModel);
            }

            // Create LOD versions for performance
            await this.createLODVersions(lipModel);

            // Hide loading indicator
            this.loadingIndicator.style.display = 'none';

        } catch (error) {
            console.error('[3D] Model loading completely failed:', error);
            this.showErrorMessage('Failed to load 3D model');
        }
    }

    createFallbackModel() {
        // Create a simple lip-shaped geometry as fallback
        const lipGroup = new THREE.Group();

        // Create upper lip
        const upperLipGeometry = new THREE.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const upperLipMaterial = new THREE.MeshPhongMaterial({
            color: 0xd4af37,
            shininess: 30
        });
        const upperLip = new THREE.Mesh(upperLipGeometry, upperLipMaterial);
        upperLip.position.y = 0.5;
        upperLip.scale.set(1.2, 0.6, 0.8);

        // Create lower lip
        const lowerLipGeometry = new THREE.SphereGeometry(1.2, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const lowerLipMaterial = new THREE.MeshPhongMaterial({
            color: 0xb8941f,
            shininess: 30
        });
        const lowerLip = new THREE.Mesh(lowerLipGeometry, lowerLipMaterial);
        lowerLip.position.y = -0.3;
        lowerLip.scale.set(1.1, 0.5, 0.7);

        lipGroup.add(upperLip);
        lipGroup.add(lowerLip);

        // Add to scene
        this.scene.add(lipGroup);

        console.log('[3D] Fallback 3D model created');
        return lipGroup;
    }

    async loadModel(url) {
        return new Promise((resolve, reject) => {
            // Check if GLTFLoader is available
            if (typeof THREE.GLTFLoader === 'undefined') {
                reject(new Error('GLTFLoader not available'));
                return;
            }

            const loader = new THREE.GLTFLoader();

            loader.load(url, (gltf) => {
                const model = gltf.scene;

                // Optimize for mobile
                this.optimizeModel(model);

                this.scene.add(model);
                resolve(model);

            }, (progress) => {
                // Loading progress
                const percentComplete = (progress.loaded / progress.total) * 100;
                console.log('[3D] Loading progress:', percentComplete + '%');
            }, reject);
        });
    }

    optimizeModel(model) {
        model.traverse(child => {
            if (child.isMesh) {
                // Enable frustum culling
                child.frustumCulled = true;

                // Optimize geometry
                if (child.geometry) {
                    child.geometry.computeBoundingSphere();
                    child.geometry.computeBoundingBox();
                }

                // Optimize materials
                if (child.material) {
                    this.optimizeMaterial(child.material);
                    this.materials.set(child.uuid, child.material);
                }

                // Enable shadows only on desktop
                if (!this.isMobile) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            }
        });
    }

    optimizeMaterial(material) {
        // Reduce material complexity for mobile
        if (this.isMobile) {
            material.shininess = Math.min(material.shininess || 30, 30);

            if (material.envMap) {
                material.envMapIntensity = 0.5;
            }
        }
    }

    async createLODVersions(model) {
        // Create different LOD levels
        const lodLevels = [
            { distance: 0, simplification: 1.0 },    // High detail
            { distance: 10, simplification: 0.5 },   // Medium detail
            { distance: 20, simplification: 0.25 }   // Low detail
        ];

        const lod = new THREE.LOD();

        lodLevels.forEach(level => {
            const lodModel = model.clone();
            if (level.simplification < 1.0) {
                this.simplifyModel(lodModel, level.simplification);
            }
            lod.addLevel(lodModel, level.distance);
        });

        this.scene.remove(model);
        this.scene.add(lod);
    }

    simplifyModel(model, factor) {
        // Simplified mesh decimation
        model.traverse(child => {
            if (child.isMesh && child.geometry) {
                const geometry = child.geometry;
                const positions = geometry.attributes.position.array;
                const simplified = this.decimateGeometry(positions, factor);

                geometry.setAttribute('position', new THREE.Float32BufferAttribute(simplified, 3));
                geometry.computeVertexNormals();
            }
        });
    }

    decimateGeometry(positions, factor) {
        // Simple vertex decimation - remove every nth vertex
        const step = Math.round(1 / factor);
        const simplified = [];

        for (let i = 0; i < positions.length; i += 3 * step) {
            if (i + 2 < positions.length) {
                simplified.push(positions[i], positions[i + 1], positions[i + 2]);
            }
        }

        return new Float32Array(simplified);
    }

    setupResponsiveBehavior() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 500);
        });

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    handleResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Update camera
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Update renderer
        this.renderer.setSize(width, height);

        // Update post-processing
        if (this.composer) {
            this.composer.setSize(width, height);
        }
    }

    startRenderLoop() {
        const render = () => {
            if (!this.isActive || this.isPaused) {
                requestAnimationFrame(render);
                return;
            }

            // Record frame start
            this.performanceMonitor.frameStart();

            // Render scene
            if (this.composer) {
                this.composer.render();
            } else {
                this.renderer.render(this.scene, this.camera);
            }

            // Record frame end
            this.performanceMonitor.frameEnd();

            requestAnimationFrame(render);
        };

        render();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    showErrorMessage(message) {
        this.loadingIndicator.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-text">${message}</div>
            <button onclick="location.reload()" class="retry-button">Retry</button>
        `;
    }

    destroy() {
        this.isActive = false;

        // Clean up gesture handler
        if (this.gestureHandler) {
            this.gestureHandler.destroy();
        }

        // Clean up 3D objects
        if (this.scene) {
            this.scene.clear();
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
        }

        // Clean up materials and geometries
        this.materials.forEach(material => material.dispose());
        this.models.forEach(model => {
            model.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });

        console.log('[3D] Mobile 3D Viewer destroyed');
    }
}

// Performance monitoring for 3D
class Mobile3DPerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.startTime = Date.now();
        this.lastFrameTime = Date.now();
        this.frameTimes = [];
        this.maxFrameTimes = 60; // Keep last 60 frame times
    }

    frameStart() {
        this.frameStartTime = performance.now();
    }

    frameEnd() {
        const frameTime = performance.now() - this.frameStartTime;
        this.frameTimes.push(frameTime);

        if (this.frameTimes.length > this.maxFrameTimes) {
            this.frameTimes.shift();
        }

        this.frameCount++;
        this.lastFrameTime = Date.now();
    }

    getMetrics() {
        const currentTime = Date.now();
        const elapsed = (currentTime - this.startTime) / 1000;
        const fps = this.frameCount / elapsed;

        const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        const maxFrameTime = Math.max(...this.frameTimes);

        return {
            fps: Math.round(fps),
            avgFrameTime: Math.round(avgFrameTime),
            maxFrameTime: Math.round(maxFrameTime),
            frameCount: this.frameCount
        };
    }

    canHandleBloom() {
        const metrics = this.getMetrics();
        return metrics.fps > 50 && metrics.avgFrameTime < 16;
    }
}

// Adaptive quality controller
class AdaptiveQualityController {
    constructor() {
        this.targetFPS = 60;
        this.qualityLevels = ['low', 'medium', 'high'];
        this.currentQualityIndex = 2; // Start with high quality
        this.adjustmentCooldown = 3000; // 3 seconds
        this.lastAdjustment = 0;
    }

    adjustQuality(metrics) {
        const now = Date.now();
        if (now - this.lastAdjustment < this.adjustmentCooldown) return;

        if (metrics.fps < this.targetFPS * 0.8 && this.currentQualityIndex > 0) {
            // Reduce quality
            this.currentQualityIndex--;
            this.lastAdjustment = now;
            return this.qualityLevels[this.currentQualityIndex];
        } else if (metrics.fps > this.targetFPS * 0.95 && this.currentQualityIndex < this.qualityLevels.length - 1) {
            // Increase quality
            this.currentQualityIndex++;
            this.lastAdjustment = now;
            return this.qualityLevels[this.currentQualityIndex];
        }

        return null; // No change needed
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Mobile3DViewer, Mobile3DPerformanceMonitor, AdaptiveQualityController };
}

// Make available globally
window.Mobile3DViewer = Mobile3DViewer;
window.Mobile3DPerformanceMonitor = Mobile3DPerformanceMonitor;
window.AdaptiveQualityController = AdaptiveQualityController;

console.log('[3D] Mobile 3D Viewer module loaded');