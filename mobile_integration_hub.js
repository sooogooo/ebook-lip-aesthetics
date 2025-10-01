/**
 * Mobile Integration Hub
 * Central system that integrates all mobile components for the lips aesthetics app
 * Handles component lifecycle, communication, and mobile-specific optimizations
 */

class MobileIntegrationHub {
    constructor() {
        this.components = new Map();
        this.gestureHandlers = new Map();
        this.performanceMonitor = new MobilePerformanceMonitor();
        this.batteryMonitor = new BatteryMonitor();
        this.networkMonitor = new NetworkMonitor();

        // State management
        this.currentView = 'gallery';
        this.isInLowPowerMode = false;
        this.isOffline = false;

        // Mobile-specific settings
        this.deviceInfo = this.detectDevice();
        this.capabilities = this.detectCapabilities();

        // Event system
        this.events = new Map();

        this.init();
    }

    detectDevice() {
        const userAgent = navigator.userAgent;

        return {
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
            isTablet: /iPad|Android(?!.*Mobile)|Kindle|PlayBook|Silk/i.test(userAgent),
            isIOS: /iPad|iPhone|iPod/.test(userAgent),
            isAndroid: /Android/.test(userAgent),
            pixelRatio: window.devicePixelRatio || 1,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            orientation: window.orientation || 0
        };
    }

    detectCapabilities() {
        return {
            webGL: !!document.createElement('canvas').getContext('webgl'),
            webXR: !!(navigator.xr),
            camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            geolocation: !!navigator.geolocation,
            deviceMotion: !!window.DeviceMotionEvent,
            deviceOrientation: !!window.DeviceOrientationEvent,
            vibration: !!navigator.vibrate,
            fullscreen: !!(document.documentElement.requestFullscreen),
            serviceWorker: !!('serviceWorker' in navigator),
            webShare: !!(navigator.share),
            battery: !!(navigator.getBattery),
            memory: !!(navigator.deviceMemory),
            connection: !!(navigator.connection)
        };
    }

    async init() {
        try {
            // Initialize core mobile systems
            await this.initializeMonitoring();
            await this.initializeGestureSystem();
            await this.initializeViews();
            await this.setupEventListeners();
            await this.optimizeForDevice();

            // Register service worker
            if (this.capabilities.serviceWorker) {
                await this.registerServiceWorker();
            }

            // Initialize PWA features
            await this.initializePWA();

            console.log('[Mobile] Integration Hub initialized');

        } catch (error) {
            console.error('[Mobile] Initialization failed:', error);
        }
    }

    async initializeMonitoring() {
        // Start performance monitoring
        this.performanceMonitor.start();

        // Start battery monitoring
        if (this.capabilities.battery) {
            await this.batteryMonitor.start();
        }

        // Start network monitoring
        if (this.capabilities.connection) {
            this.networkMonitor.start();
        }

        // Monitor system events
        this.batteryMonitor.on('lowBattery', () => {
            this.enterLowPowerMode();
        });

        this.batteryMonitor.on('batteryRecovered', () => {
            this.exitLowPowerMode();
        });

        this.networkMonitor.on('offline', () => {
            this.handleOfflineMode();
        });

        this.networkMonitor.on('online', () => {
            this.handleOnlineMode();
        });
    }

    async initializeGestureSystem() {
        // Create gesture handlers for different views
        const gestureConfigs = {
            gallery: {
                enableSwipe: true,
                enablePinchZoom: true,
                enableDoubleTap: true
            },
            '3d': {
                enableDrag: true,
                enablePinchZoom: true,
                enableRotation: true,
                enableVoiceControl: true
            },
            ar: {
                enablePinchZoom: true,
                enableDoubleTap: true,
                enableVoiceControl: true
            }
        };

        for (const [view, config] of Object.entries(gestureConfigs)) {
            if (window.GestureHandlerFactory) {
                const handler = window.GestureHandlerFactory.create(view, document.body, config);
                this.gestureHandlers.set(view, handler);
            }
        }
    }

    async initializeViews() {
        // Initialize gallery with mobile optimizations
        if (window.LipAestheticsGallery) {
            const gallery = new window.LipAestheticsGallery();
            gallery.isMobile = this.deviceInfo.isMobile;
            this.components.set('gallery', gallery);
        }

        // Initialize 3D viewer if WebGL is supported
        if (this.capabilities.webGL && window.Mobile3DViewer) {
            const viewer3D = new window.Mobile3DViewer('3d-container', {
                enableShadows: !this.deviceInfo.isMobile,
                enablePostProcessing: !this.deviceInfo.isMobile,
                maxPixelRatio: this.deviceInfo.isMobile ? 2 : 3
            });
            this.components.set('3d', viewer3D);
        }

        // Initialize AR handler if camera is supported
        if (this.capabilities.camera && window.MobileARHandler) {
            const arHandler = new window.MobileARHandler({
                enableFaceTracking: true,
                preferredCamera: 'user'
            });
            this.components.set('ar', arHandler);
        }
    }

    setupEventListeners() {
        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 500);
        });

        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAll();
            } else {
                this.resumeAll();
            }
        });

        // Memory pressure
        if (window.performance && window.performance.addEventListener) {
            window.performance.addEventListener('memory', () => {
                this.handleMemoryPressure();
            });
        }

        // Page lifecycle
        document.addEventListener('freeze', () => {
            this.pauseAll();
        });

        document.addEventListener('resume', () => {
            this.resumeAll();
        });
    }

    async optimizeForDevice() {
        // Apply device-specific optimizations
        if (this.deviceInfo.isMobile) {
            // Mobile optimizations
            this.applyMobileOptimizations();
        }

        if (this.deviceInfo.isTablet) {
            // Tablet optimizations
            this.applyTabletOptimizations();
        }

        // Memory-based optimizations
        if (navigator.deviceMemory) {
            if (navigator.deviceMemory < 4) {
                this.applyLowMemoryOptimizations();
            }
        }

        // Network-based optimizations
        if (navigator.connection) {
            if (navigator.connection.effectiveType === 'slow-2g' ||
                navigator.connection.effectiveType === '2g') {
                this.applySlowNetworkOptimizations();
            }
        }
    }

    applyMobileOptimizations() {
        // Reduce animation frame rate
        this.performanceMonitor.setTargetFPS(30);

        // Enable image compression
        this.enableImageCompression();

        // Reduce texture quality
        this.reduceTextureQuality();

        // Enable lazy loading
        this.enableLazyLoading();

        console.log('[Mobile] Applied mobile optimizations');
    }

    applyTabletOptimizations() {
        // Tablet-specific optimizations
        this.performanceMonitor.setTargetFPS(60);

        // Enable higher quality textures
        this.enableHighQualityTextures();

        console.log('[Mobile] Applied tablet optimizations');
    }

    applyLowMemoryOptimizations() {
        // Reduce cache sizes
        this.reduceCacheSizes();

        // Disable non-essential features
        this.disableNonEssentialFeatures();

        // Enable garbage collection hints
        this.enableGCHints();

        console.log('[Mobile] Applied low memory optimizations');
    }

    applySlowNetworkOptimizations() {
        // Reduce image quality
        this.reduceImageQuality();

        // Enable aggressive caching
        this.enableAggressiveCaching();

        // Preload critical resources only
        this.preloadCriticalResourcesOnly();

        console.log('[Mobile] Applied slow network optimizations');
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/service_worker.js');

            registration.addEventListener('updatefound', () => {
                this.showUpdateAvailable();
            });

            console.log('[Mobile] Service Worker registered');

        } catch (error) {
            console.error('[Mobile] Service Worker registration failed:', error);
        }
    }

    async initializePWA() {
        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Handle app installed
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            this.hideInstallButton();
            this.trackPWAInstall();
        });

        // Check if running as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isPWA = true;
            this.enablePWAFeatures();
        }
    }

    // View management
    switchToView(viewName) {
        if (this.currentView === viewName) return;

        // Pause current view
        const currentComponent = this.components.get(this.currentView);
        if (currentComponent && currentComponent.pause) {
            currentComponent.pause();
        }

        // Switch to new view
        this.currentView = viewName;
        const newComponent = this.components.get(viewName);
        if (newComponent && newComponent.resume) {
            newComponent.resume();
        }

        // Update gesture handler
        this.switchGestureHandler(viewName);

        // Update UI
        this.updateViewUI(viewName);

        this.emit('viewChanged', { from: this.currentView, to: viewName });
    }

    switchGestureHandler(viewName) {
        // Disable all gesture handlers
        this.gestureHandlers.forEach(handler => handler.disable());

        // Enable handler for current view
        const handler = this.gestureHandlers.get(viewName);
        if (handler) {
            handler.enable();
        }
    }

    updateViewUI(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Update content containers
        document.querySelectorAll('.view-container').forEach(container => {
            container.classList.toggle('active', container.dataset.view === viewName);
        });
    }

    // Power management
    enterLowPowerMode() {
        if (this.isInLowPowerMode) return;

        this.isInLowPowerMode = true;

        // Reduce frame rates
        this.components.forEach(component => {
            if (component.setLowPowerMode) {
                component.setLowPowerMode(true);
            }
        });

        // Disable non-essential animations
        this.disableNonEssentialAnimations();

        // Reduce update frequencies
        this.performanceMonitor.setTargetFPS(15);

        this.showNotification('Low battery mode activated', 'info');
        console.log('[Mobile] Entered low power mode');
    }

    exitLowPowerMode() {
        if (!this.isInLowPowerMode) return;

        this.isInLowPowerMode = false;

        // Restore frame rates
        this.components.forEach(component => {
            if (component.setLowPowerMode) {
                component.setLowPowerMode(false);
            }
        });

        // Re-enable animations
        this.enableAnimations();

        // Restore update frequencies
        this.performanceMonitor.setTargetFPS(60);

        console.log('[Mobile] Exited low power mode');
    }

    // Network management
    handleOfflineMode() {
        this.isOffline = true;

        // Switch to offline-capable views
        this.enableOfflineMode();

        // Show offline indicator
        this.showOfflineIndicator();

        this.emit('offline');
    }

    handleOnlineMode() {
        this.isOffline = false;

        // Re-enable online features
        this.disableOfflineMode();

        // Hide offline indicator
        this.hideOfflineIndicator();

        // Sync data
        this.syncOfflineData();

        this.emit('online');
    }

    // System events
    handleOrientationChange() {
        const newOrientation = window.orientation || 0;

        // Update device info
        this.deviceInfo.orientation = newOrientation;
        this.deviceInfo.viewportWidth = window.innerWidth;
        this.deviceInfo.viewportHeight = window.innerHeight;

        // Notify components
        this.components.forEach(component => {
            if (component.handleOrientationChange) {
                component.handleOrientationChange(newOrientation);
            }
        });

        // Update layouts
        this.updateLayoutsForOrientation(newOrientation);

        this.emit('orientationChange', newOrientation);
    }

    handleMemoryPressure() {
        // Clean up unused resources
        this.cleanupUnusedResources();

        // Reduce cache sizes
        this.reduceCacheSizes();

        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }

        console.log('[Mobile] Handled memory pressure');
    }

    pauseAll() {
        this.components.forEach(component => {
            if (component.pause) {
                component.pause();
            }
        });
    }

    resumeAll() {
        this.components.forEach(component => {
            if (component.resume) {
                component.resume();
            }
        });
    }

    // Utility methods
    enableImageCompression() {
        // Enable service worker image compression
        this.sendMessageToSW({ type: 'ENABLE_IMAGE_COMPRESSION' });
    }

    reduceTextureQuality() {
        // Reduce 3D texture quality
        const viewer3D = this.components.get('3d');
        if (viewer3D && viewer3D.setQuality) {
            viewer3D.setQuality('medium');
        }
    }

    enableLazyLoading() {
        // Enable lazy loading for gallery
        const gallery = this.components.get('gallery');
        if (gallery && gallery.enableLazyLoading) {
            gallery.enableLazyLoading();
        }
    }

    reduceCacheSizes() {
        this.sendMessageToSW({ type: 'REDUCE_CACHE_SIZES' });
    }

    disableNonEssentialFeatures() {
        // Disable animations
        document.documentElement.classList.add('reduce-motion');

        // Disable complex visual effects
        this.components.forEach(component => {
            if (component.disableEffects) {
                component.disableEffects();
            }
        });
    }

    enableGCHints() {
        // Periodic cleanup
        setInterval(() => {
            this.cleanupUnusedResources();
        }, 30000);
    }

    cleanupUnusedResources() {
        // Clean up component resources
        this.components.forEach(component => {
            if (component.cleanup) {
                component.cleanup();
            }
        });

        // Clear unused caches
        this.clearUnusedCaches();
    }

    clearUnusedCaches() {
        // Implementation would clear various caches
        console.log('[Mobile] Cleared unused caches');
    }

    sendMessageToSW(message) {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage(message);
        }
    }

    showNotification(message, type = 'info') {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = `mobile-notification mobile-notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showInstallButton() {
        const installButton = document.getElementById('install-button');
        if (installButton) {
            installButton.style.display = 'block';
            installButton.onclick = () => this.installPWA();
        }
    }

    hideInstallButton() {
        const installButton = document.getElementById('install-button');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }

    async installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('[Mobile] PWA installed');
            }

            this.deferredPrompt = null;
        }
    }

    trackPWAInstall() {
        // Track PWA installation
        this.sendMessageToSW({
            type: 'TRACK_EVENT',
            event: 'pwa_install',
            timestamp: Date.now()
        });
    }

    // Event system
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }

    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => callback(data));
        }
    }

    // Public API
    getComponent(name) {
        return this.components.get(name);
    }

    getGestureHandler(view) {
        return this.gestureHandlers.get(view);
    }

    getDeviceInfo() {
        return { ...this.deviceInfo };
    }

    getCapabilities() {
        return { ...this.capabilities };
    }

    getPerformanceMetrics() {
        return this.performanceMonitor.getMetrics();
    }

    destroy() {
        // Clean up all components
        this.components.forEach(component => {
            if (component.destroy) {
                component.destroy();
            }
        });

        // Clean up gesture handlers
        this.gestureHandlers.forEach(handler => {
            if (handler.destroy) {
                handler.destroy();
            }
        });

        // Stop monitoring
        this.performanceMonitor.stop();
        this.batteryMonitor.stop();
        this.networkMonitor.stop();

        console.log('[Mobile] Integration Hub destroyed');
    }
}

// Supporting classes for monitoring

class MobilePerformanceMonitor {
    constructor() {
        this.targetFPS = 60;
        this.frameCount = 0;
        this.startTime = Date.now();
        this.isActive = false;
    }

    start() {
        this.isActive = true;
        this.startTime = Date.now();
        console.log('[Mobile] Performance monitoring started');
    }

    stop() {
        this.isActive = false;
    }

    setTargetFPS(fps) {
        this.targetFPS = fps;
    }

    recordFrame() {
        if (this.isActive) {
            this.frameCount++;
        }
    }

    getMetrics() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        return {
            fps: Math.round(this.frameCount / elapsed),
            frameCount: this.frameCount,
            uptime: elapsed
        };
    }
}

class BatteryMonitor {
    constructor() {
        this.battery = null;
        this.events = new Map();
        this.isLowBattery = false;
    }

    async start() {
        try {
            this.battery = await navigator.getBattery();
            this.setupBatteryEvents();
            this.checkBatteryLevel();
        } catch (error) {
            console.warn('[Mobile] Battery monitoring not available');
        }
    }

    setupBatteryEvents() {
        if (!this.battery) return;

        this.battery.addEventListener('levelchange', () => {
            this.checkBatteryLevel();
        });

        this.battery.addEventListener('chargingchange', () => {
            this.emit('chargingChange', this.battery.charging);
        });
    }

    checkBatteryLevel() {
        if (!this.battery) return;

        const level = this.battery.level;

        if (level < 0.2 && !this.isLowBattery) {
            this.isLowBattery = true;
            this.emit('lowBattery', level);
        } else if (level > 0.5 && this.isLowBattery) {
            this.isLowBattery = false;
            this.emit('batteryRecovered', level);
        }
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }

    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => callback(data));
        }
    }

    stop() {
        // Clean up event listeners
    }
}

class NetworkMonitor {
    constructor() {
        this.events = new Map();
        this.isOnline = navigator.onLine;
    }

    start() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.emit('online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.emit('offline');
        });

        // Monitor connection changes
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this.emit('connectionChange', {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink
                });
            });
        }
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }

    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => callback(data));
        }
    }

    stop() {
        // Clean up event listeners
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileHub = new MobileIntegrationHub();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobileIntegrationHub };
}

window.MobileIntegrationHub = MobileIntegrationHub;

console.log('[Mobile] Integration Hub module loaded');