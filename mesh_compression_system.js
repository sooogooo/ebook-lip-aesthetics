/**
 * Advanced Mesh Compression and Loading System
 * High-performance loading and compression for medical 3D models
 * Includes progressive loading, mesh compression, and streaming capabilities
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

/**
 * Medical Mesh Loader with advanced compression and streaming
 */
class MedicalMeshLoader {
    constructor(renderer) {
        this.renderer = renderer;
        this.loadingManager = new THREE.LoadingManager();
        this.cache = new Map();
        this.compressionCache = new Map();
        this.streamingQueue = [];
        this.isLoading = false;

        // Compression settings
        this.compressionSettings = {
            draco: {
                enabled: true,
                quantizationBits: {
                    position: 14,
                    normal: 10,
                    color: 8,
                    uv: 12,
                    generic: 12
                },
                compressionLevel: 7
            },
            meshopt: {
                enabled: true,
                quantizationBits: 16,
                compressionLevel: 'max'
            },
            progressive: {
                enabled: true,
                levels: 4,
                baseLOD: 0.1
            }
        };

        this.initializeLoaders();
        this.setupLoadingManager();
    }

    /**
     * Initialize all loaders with compression support
     */
    initializeLoaders() {
        // GLTF Loader with Draco compression
        this.gltfLoader = new GLTFLoader(this.loadingManager);

        // Draco Loader for geometry compression
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        this.dracoLoader.setDecoderConfig({ type: 'js' });
        this.gltfLoader.setDRACOLoader(this.dracoLoader);

        // KTX2 Loader for texture compression
        this.ktx2Loader = new KTX2Loader();
        this.ktx2Loader.setTranscoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/');
        this.ktx2Loader.detectSupport(this.renderer);
        this.gltfLoader.setKTX2Loader(this.ktx2Loader);

        // File Loader for custom formats
        this.fileLoader = new THREE.FileLoader(this.loadingManager);
        this.fileLoader.setResponseType('arraybuffer');
    }

    /**
     * Setup loading manager with progress tracking
     */
    setupLoadingManager() {
        this.loadingManager.onLoad = () => {
            console.log('All medical models loaded successfully');
            this.isLoading = false;
        };

        this.loadingManager.onProgress = (url, loaded, total) => {
            const progress = (loaded / total) * 100;
            this.updateLoadingProgress(progress, url);
        };

        this.loadingManager.onError = (url) => {
            console.error('Failed to load:', url);
        };
    }

    /**
     * Load medical model with advanced compression and progressive loading
     */
    async loadMedicalModel(config) {
        const {
            url,
            type,
            compression = 'auto',
            progressive = true,
            priority = 1,
            onProgress,
            onLoaded
        } = config;

        // Check cache first
        const cacheKey = this.generateCacheKey(config);
        if (this.cache.has(cacheKey)) {
            const cachedModel = this.cache.get(cacheKey);
            if (onLoaded) onLoaded(cachedModel.clone());
            return cachedModel.clone();
        }

        // Determine optimal loading strategy
        const loadingStrategy = this.determineLoadingStrategy(config);

        try {
            let model;

            switch (loadingStrategy.method) {
                case 'progressive':
                    model = await this.loadProgressive(config, loadingStrategy);
                    break;
                case 'compressed':
                    model = await this.loadCompressed(config, loadingStrategy);
                    break;
                case 'streaming':
                    model = await this.loadStreaming(config, loadingStrategy);
                    break;
                default:
                    model = await this.loadStandard(config);
            }

            // Cache the loaded model
            this.cache.set(cacheKey, model);

            if (onLoaded) onLoaded(model.clone());
            return model.clone();

        } catch (error) {
            console.error('Failed to load medical model:', error);
            throw error;
        }
    }

    /**
     * Determine optimal loading strategy based on model characteristics
     */
    determineLoadingStrategy(config) {
        const { size, complexity, type, priority } = config;

        // Model size and complexity analysis
        const isComplex = complexity === 'high' || (size && size > 10 * 1024 * 1024); // > 10MB
        const isLargeSurface = type === 'skin' || type === 'bone';
        const needsDetailPreservation = type === 'vessel' || type === 'nerve';

        const strategy = {
            method: 'standard',
            compression: 'auto',
            progressive: false,
            streaming: false,
            priority: priority || 1
        };

        if (isComplex && this.compressionSettings.progressive.enabled) {
            strategy.method = 'progressive';
            strategy.progressive = true;
        }

        if (isLargeSurface || size > 5 * 1024 * 1024) {
            strategy.compression = 'draco';
        }

        if (needsDetailPreservation) {
            strategy.compression = 'meshopt';
        }

        if (priority > 5 || type === 'skin') {
            strategy.method = 'streaming';
            strategy.streaming = true;
        }

        return strategy;
    }

    /**
     * Load model with progressive detail loading
     */
    async loadProgressive(config, strategy) {
        const { url, type, onProgress } = config;
        const levels = this.compressionSettings.progressive.levels;

        const progressiveModel = new THREE.Group();
        progressiveModel.userData = { type, isProgressive: true, levels: [] };

        // Load base LOD first (lowest quality)
        const baseLOD = await this.loadBaseLOD(url, type);
        progressiveModel.add(baseLOD);
        progressiveModel.userData.levels.push(baseLOD);

        if (onProgress) onProgress(25, 'Base LOD loaded');

        // Load progressive detail levels
        for (let level = 1; level < levels; level++) {
            const detailLevel = await this.loadDetailLevel(url, type, level);
            progressiveModel.userData.levels.push(detailLevel);

            // Blend with existing geometry
            this.blendProgressiveLevel(progressiveModel, detailLevel, level);

            const progress = 25 + (level / levels) * 75;
            if (onProgress) onProgress(progress, `Detail level ${level} loaded`);
        }

        return progressiveModel;
    }

    /**
     * Load model with advanced compression
     */
    async loadCompressed(config, strategy) {
        const { url, type } = config;

        if (strategy.compression === 'draco') {
            return this.loadDracoCompressed(url, type);
        } else if (strategy.compression === 'meshopt') {
            return this.loadMeshOptCompressed(url, type);
        } else {
            return this.loadWithAutoCompression(url, type);
        }
    }

    /**
     * Load model with streaming for immediate interaction
     */
    async loadStreaming(config, strategy) {
        const { url, type, onProgress } = config;

        // Load minimal interaction model first
        const streamingModel = await this.loadMinimalModel(url, type);

        if (onProgress) onProgress(20, 'Minimal model loaded');

        // Queue detailed model for background loading
        this.queueDetailedModel(config, streamingModel);

        return streamingModel;
    }

    /**
     * Load standard model without advanced features
     */
    async loadStandard(config) {
        const { url, type } = config;

        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                url,
                (gltf) => {
                    const model = this.processLoadedModel(gltf.scene, type);
                    resolve(model);
                },
                undefined,
                reject
            );
        });
    }

    /**
     * Load base LOD for progressive loading
     */
    async loadBaseLOD(url, type) {
        const baseLODUrl = this.generateLODUrl(url, 0);

        // Generate simplified geometry if LOD URL doesn't exist
        if (!(await this.urlExists(baseLODUrl))) {
            return this.generateSimplifiedGeometry(url, type, 0.1);
        }

        return new Promise((resolve, reject) => {
            this.gltfLoader.load(baseLODUrl, (gltf) => {
                resolve(this.processLoadedModel(gltf.scene, type));
            }, undefined, reject);
        });
    }

    /**
     * Load detail level for progressive loading
     */
    async loadDetailLevel(url, type, level) {
        const detailUrl = this.generateLODUrl(url, level);

        // Generate detail if URL doesn't exist
        if (!(await this.urlExists(detailUrl))) {
            const detailRatio = Math.pow(2, level) * 0.1;
            return this.generateDetailLevel(url, type, detailRatio);
        }

        return new Promise((resolve, reject) => {
            this.gltfLoader.load(detailUrl, (gltf) => {
                resolve(this.processLoadedModel(gltf.scene, type));
            }, undefined, reject);
        });
    }

    /**
     * Load Draco compressed model
     */
    loadDracoCompressed(url, type) {
        return new Promise((resolve, reject) => {
            // Check for Draco compressed version
            const dracoUrl = url.replace(/\.(gltf|glb)$/, '_draco.$1');

            this.gltfLoader.load(
                dracoUrl,
                (gltf) => {
                    const model = this.processLoadedModel(gltf.scene, type);
                    resolve(model);
                },
                undefined,
                (error) => {
                    // Fallback to standard loading
                    console.warn('Draco version not found, loading standard:', dracoUrl);
                    this.loadStandard({ url, type }).then(resolve).catch(reject);
                }
            );
        });
    }

    /**
     * Load MeshOpt compressed model
     */
    loadMeshOptCompressed(url, type) {
        return new Promise((resolve, reject) => {
            const meshoptUrl = url.replace(/\.(gltf|glb)$/, '_meshopt.$1');

            this.gltfLoader.load(
                meshoptUrl,
                (gltf) => {
                    const model = this.processLoadedModel(gltf.scene, type);
                    resolve(model);
                },
                undefined,
                (error) => {
                    // Fallback to standard loading
                    console.warn('MeshOpt version not found, loading standard:', meshoptUrl);
                    this.loadStandard({ url, type }).then(resolve).catch(reject);
                }
            );
        });
    }

    /**
     * Load with automatic compression detection
     */
    loadWithAutoCompression(url, type) {
        // Try compressed versions in order of preference
        const compressionTypes = ['draco', 'meshopt'];

        return this.tryCompressionTypes(url, type, compressionTypes);
    }

    /**
     * Try different compression types
     */
    async tryCompressionTypes(url, type, compressionTypes) {
        for (const compression of compressionTypes) {
            try {
                if (compression === 'draco') {
                    return await this.loadDracoCompressed(url, type);
                } else if (compression === 'meshopt') {
                    return await this.loadMeshOptCompressed(url, type);
                }
            } catch (error) {
                console.warn(`${compression} compression failed, trying next...`);
            }
        }

        // Fallback to standard loading
        return this.loadStandard({ url, type });
    }

    /**
     * Load minimal model for immediate interaction
     */
    async loadMinimalModel(url, type) {
        // Generate or load ultra-low LOD for immediate display
        const minimalGeometry = await this.generateSimplifiedGeometry(url, type, 0.05);

        // Apply basic material for immediate visualization
        const material = this.getBasicMaterialForType(type);

        if (minimalGeometry.isGroup) {
            minimalGeometry.traverse(child => {
                if (child.isMesh) {
                    child.material = material.clone();
                }
            });
        } else if (minimalGeometry.isMesh) {
            minimalGeometry.material = material;
        }

        return minimalGeometry;
    }

    /**
     * Queue detailed model for background loading
     */
    queueDetailedModel(config, streamingModel) {
        const detailedConfig = {
            ...config,
            priority: config.priority - 1, // Lower priority
            onLoaded: (detailedModel) => {
                this.upgradeStreamingModel(streamingModel, detailedModel);
            }
        };

        this.streamingQueue.push(detailedConfig);
        this.processStreamingQueue();
    }

    /**
     * Process streaming queue in background
     */
    async processStreamingQueue() {
        if (this.isLoading || this.streamingQueue.length === 0) return;

        this.isLoading = true;

        // Sort by priority
        this.streamingQueue.sort((a, b) => b.priority - a.priority);

        while (this.streamingQueue.length > 0) {
            const config = this.streamingQueue.shift();

            try {
                await this.loadStandard(config);
            } catch (error) {
                console.error('Failed to load detailed model:', error);
            }

            // Yield to main thread
            await this.yieldToMainThread();
        }

        this.isLoading = false;
    }

    /**
     * Upgrade streaming model with detailed version
     */
    upgradeStreamingModel(streamingModel, detailedModel) {
        // Smooth transition from minimal to detailed model
        const duration = 500; // ms

        // Add detailed model with zero opacity
        detailedModel.traverse(child => {
            if (child.material) {
                child.material.transparent = true;
                child.material.opacity = 0;
            }
        });

        streamingModel.add(detailedModel);

        // Animate transition
        const startTime = performance.now();
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const opacity = this.easeInOut(progress);

            // Fade in detailed model
            detailedModel.traverse(child => {
                if (child.material) {
                    child.material.opacity = opacity;
                }
            });

            // Fade out minimal model
            streamingModel.children.forEach(child => {
                if (child !== detailedModel && child.material) {
                    child.material.opacity = 1 - opacity;
                }
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove minimal model
                streamingModel.children = streamingModel.children.filter(child => child === detailedModel);
                streamingModel.add(...detailedModel.children);
                streamingModel.remove(detailedModel);
            }
        };

        animate();
    }

    /**
     * Generate simplified geometry for LOD
     */
    async generateSimplifiedGeometry(url, type, simplificationRatio) {
        // This would typically load the full model and simplify it
        // For this example, we'll create procedural simplified geometry

        switch (type) {
            case 'skin':
                return this.generateSimplifiedSkin(simplificationRatio);
            case 'muscle':
                return this.generateSimplifiedMuscle(simplificationRatio);
            case 'vessel':
                return this.generateSimplifiedVessel(simplificationRatio);
            case 'nerve':
                return this.generateSimplifiedNerve(simplificationRatio);
            case 'bone':
                return this.generateSimplifiedBone(simplificationRatio);
            default:
                return this.generateGenericSimplified(simplificationRatio);
        }
    }

    /**
     * Generate simplified skin geometry
     */
    generateSimplifiedSkin(ratio) {
        const segments = Math.max(4, Math.floor(32 * ratio));

        const shape = new THREE.Shape();
        shape.moveTo(-3, 0);
        shape.bezierCurveTo(-3, 1, -2, 1.5, -1, 1.5);
        shape.bezierCurveTo(0, 1.8, 0, 1.8, 0, 1.8);
        shape.bezierCurveTo(1, 1.5, 2, 1.5, 3, 0);
        shape.bezierCurveTo(2.5, -0.5, 1.5, -1.5, 0, -1.8);
        shape.bezierCurveTo(-1.5, -1.5, -2.5, -0.5, -3, 0);

        const extrudeSettings = {
            depth: 2 * ratio,
            bevelEnabled: true,
            bevelSegments: Math.max(1, Math.floor(8 * ratio)),
            steps: Math.max(2, Math.floor(16 * ratio)),
            bevelSize: 0.15 * ratio,
            bevelThickness: 0.1 * ratio,
            curveSegments: segments
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center();

        const material = this.getBasicMaterialForType('skin');
        return new THREE.Mesh(geometry, material);
    }

    /**
     * Generate simplified muscle geometry
     */
    generateSimplifiedMuscle(ratio) {
        const group = new THREE.Group();
        const fiberCount = Math.max(2, Math.floor(8 * ratio));
        const segments = Math.max(6, Math.floor(32 * ratio));

        for (let i = 0; i < fiberCount; i++) {
            const fiberGeometry = new THREE.TorusGeometry(
                2.5,
                0.12 * ratio,
                Math.max(4, Math.floor(segments / 2)),
                segments,
                Math.PI * 0.4
            );

            const fiber = new THREE.Mesh(fiberGeometry, this.getBasicMaterialForType('muscle'));
            const angle = (Math.PI * 2 * i) / fiberCount;

            fiber.position.set(
                Math.cos(angle) * 0.2,
                Math.sin(angle) * 0.1,
                Math.sin(angle * 2) * 0.1
            );
            fiber.rotation.z = angle;

            group.add(fiber);
        }

        return group;
    }

    /**
     * Generate simplified vessel geometry
     */
    generateSimplifiedVessel(ratio) {
        const group = new THREE.Group();
        const branchCount = Math.max(2, Math.floor(20 * ratio));
        const segments = Math.max(6, Math.floor(20 * ratio));

        // Main arteries
        const upperArteryPoints = [
            new THREE.Vector3(-3, 0.5, 0),
            new THREE.Vector3(-1.5, 1, 0.2),
            new THREE.Vector3(0, 1.2, 0),
            new THREE.Vector3(1.5, 1, -0.2),
            new THREE.Vector3(3, 0.5, 0)
        ];

        const curve = new THREE.CatmullRomCurve3(upperArteryPoints);
        const tubeGeometry = new THREE.TubeGeometry(curve, segments, 0.05 * ratio, Math.max(4, segments / 2), false);
        const vessel = new THREE.Mesh(tubeGeometry, this.getBasicMaterialForType('vessel'));
        group.add(vessel);

        // Additional branches based on ratio
        for (let i = 1; i < branchCount; i++) {
            const branchPoints = [];
            const startX = (Math.random() - 0.5) * 6;
            const startY = (Math.random() - 0.5) * 2;

            for (let j = 0; j < 3; j++) {
                branchPoints.push(new THREE.Vector3(
                    startX + (Math.random() - 0.5) * 0.5,
                    startY + (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.3
                ));
            }

            const branchCurve = new THREE.CatmullRomCurve3(branchPoints);
            const branchGeometry = new THREE.TubeGeometry(
                branchCurve,
                Math.max(4, segments / 2),
                0.03 * ratio,
                Math.max(3, segments / 3),
                false
            );
            const branch = new THREE.Mesh(branchGeometry, this.getBasicMaterialForType('vessel'));
            group.add(branch);
        }

        return group;
    }

    /**
     * Generate simplified nerve geometry
     */
    generateSimplifiedNerve(ratio) {
        const group = new THREE.Group();
        const branchCount = Math.max(2, Math.floor(15 * ratio));
        const segments = Math.max(4, Math.floor(15 * ratio));

        // Main nerve pathways
        const nervePaths = [
            [
                new THREE.Vector3(-4, 2, 1),
                new THREE.Vector3(-2, 1.5, 0.5),
                new THREE.Vector3(-1, 1, 0.2),
                new THREE.Vector3(0, 0.5, 0)
            ],
            [
                new THREE.Vector3(4, 2, 1),
                new THREE.Vector3(2, 1.5, 0.5),
                new THREE.Vector3(1, 1, 0.2),
                new THREE.Vector3(0, 0.5, 0)
            ]
        ];

        nervePaths.forEach(path => {
            const curve = new THREE.CatmullRomCurve3(path);
            const tubeGeometry = new THREE.TubeGeometry(
                curve,
                segments,
                0.03 * ratio,
                Math.max(3, segments / 2),
                false
            );
            const nerve = new THREE.Mesh(tubeGeometry, this.getBasicMaterialForType('nerve'));
            group.add(nerve);
        });

        return group;
    }

    /**
     * Generate simplified bone geometry
     */
    generateSimplifiedBone(ratio) {
        const segments = Math.max(4, Math.floor(20 * ratio));

        const shape = new THREE.Shape();
        shape.moveTo(-4, 0);
        for (let i = 0; i <= segments; i++) {
            const angle = (Math.PI * 2 * i) / segments;
            const radius = 3 + Math.sin(angle * 3) * 0.5 * ratio;
            shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }

        const extrudeSettings = {
            depth: 1.5 * ratio,
            bevelEnabled: true,
            bevelSegments: Math.max(1, Math.floor(4 * ratio)),
            steps: Math.max(2, Math.floor(6 * ratio)),
            bevelSize: 0.1 * ratio,
            bevelThickness: 0.05 * ratio
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = this.getBasicMaterialForType('bone');
        return new THREE.Mesh(geometry, material);
    }

    /**
     * Generate generic simplified geometry
     */
    generateGenericSimplified(ratio) {
        const geometry = new THREE.BoxGeometry(4 * ratio, 2 * ratio, 1 * ratio);
        const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
        return new THREE.Mesh(geometry, material);
    }

    /**
     * Get basic material for medical component type
     */
    getBasicMaterialForType(type) {
        const materials = {
            skin: new THREE.MeshLambertMaterial({ color: 0xffdbcc, transparent: true, opacity: 0.9 }),
            muscle: new THREE.MeshLambertMaterial({ color: 0xff6b9d, transparent: true, opacity: 0.8 }),
            vessel: new THREE.MeshLambertMaterial({ color: 0xe74c3c, transparent: true, opacity: 0.8 }),
            nerve: new THREE.MeshLambertMaterial({ color: 0xf39c12, transparent: true, opacity: 0.8 }),
            bone: new THREE.MeshLambertMaterial({ color: 0xecf0f1, transparent: true, opacity: 0.9 })
        };

        return materials[type] || materials.skin;
    }

    /**
     * Process loaded model
     */
    processLoadedModel(scene, type) {
        scene.userData.type = type;
        scene.userData.loadTime = Date.now();

        // Optimize materials
        scene.traverse(child => {
            if (child.isMesh) {
                this.optimizeMesh(child);
            }
        });

        return scene;
    }

    /**
     * Optimize mesh for performance
     */
    optimizeMesh(mesh) {
        // Merge geometries where possible
        if (mesh.geometry && !mesh.geometry.attributes.position) {
            console.warn('Invalid geometry detected', mesh);
            return;
        }

        // Optimize geometry
        mesh.geometry.computeBoundingSphere();
        mesh.geometry.computeBoundingBox();

        // Enable frustum culling
        mesh.frustumCulled = true;

        // Optimize materials
        if (mesh.material) {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => this.optimizeMaterial(mat));
            } else {
                this.optimizeMaterial(mesh.material);
            }
        }
    }

    /**
     * Optimize material for performance
     */
    optimizeMaterial(material) {
        // Enable efficient rendering modes
        material.precision = 'mediump';

        // Optimize texture settings
        if (material.map) {
            this.optimizeTexture(material.map);
        }
        if (material.normalMap) {
            this.optimizeTexture(material.normalMap);
        }
        if (material.roughnessMap) {
            this.optimizeTexture(material.roughnessMap);
        }
    }

    /**
     * Optimize texture for memory and performance
     */
    optimizeTexture(texture) {
        // Use efficient texture formats
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());

        // Optimize memory usage
        if (texture.image) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Resize if too large
            const maxSize = 1024;
            if (texture.image.width > maxSize || texture.image.height > maxSize) {
                const scale = maxSize / Math.max(texture.image.width, texture.image.height);
                canvas.width = texture.image.width * scale;
                canvas.height = texture.image.height * scale;
                ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
                texture.image = canvas;
                texture.needsUpdate = true;
            }
        }
    }

    /**
     * Blend progressive detail level
     */
    blendProgressiveLevel(progressiveModel, detailLevel, level) {
        // This would implement sophisticated mesh blending
        // For simplicity, we'll just add the detail level
        progressiveModel.add(detailLevel);

        // Adjust visibility based on distance
        detailLevel.userData.lodLevel = level;
        detailLevel.visible = level === 0; // Start with base level visible
    }

    /**
     * Generate cache key for model
     */
    generateCacheKey(config) {
        const { url, type, compression, progressive } = config;
        return `${url}_${type}_${compression}_${progressive}`;
    }

    /**
     * Generate LOD URL
     */
    generateLODUrl(baseUrl, level) {
        const extension = baseUrl.split('.').pop();
        const baseName = baseUrl.replace(`.${extension}`, '');
        return `${baseName}_lod${level}.${extension}`;
    }

    /**
     * Check if URL exists
     */
    async urlExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Generate detail level
     */
    generateDetailLevel(url, type, detailRatio) {
        // Generate procedural detail based on ratio
        return this.generateSimplifiedGeometry(url, type, detailRatio);
    }

    /**
     * Update loading progress
     */
    updateLoadingProgress(progress, url) {
        const event = new CustomEvent('loadingProgress', {
            detail: { progress, url }
        });
        window.dispatchEvent(event);
    }

    /**
     * Yield to main thread for smooth loading
     */
    yieldToMainThread() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    /**
     * Easing function
     */
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Compress geometry using custom algorithm
     */
    compressGeometry(geometry) {
        const compressed = {
            positions: this.compressPositions(geometry.attributes.position.array),
            normals: this.compressNormals(geometry.attributes.normal?.array),
            uvs: this.compressUVs(geometry.attributes.uv?.array),
            indices: geometry.index ? Array.from(geometry.index.array) : null
        };

        return compressed;
    }

    /**
     * Compress position data
     */
    compressPositions(positions) {
        // Quantize positions to reduce precision
        const quantizationBits = this.compressionSettings.draco.quantizationBits.position;
        const scale = Math.pow(2, quantizationBits) - 1;

        // Find bounding box
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for (let i = 0; i < positions.length; i += 3) {
            minX = Math.min(minX, positions[i]);
            minY = Math.min(minY, positions[i + 1]);
            minZ = Math.min(minZ, positions[i + 2]);
            maxX = Math.max(maxX, positions[i]);
            maxY = Math.max(maxY, positions[i + 1]);
            maxZ = Math.max(maxZ, positions[i + 2]);
        }

        const rangeX = maxX - minX;
        const rangeY = maxY - minY;
        const rangeZ = maxZ - minZ;

        const compressed = new Uint16Array(positions.length);

        for (let i = 0; i < positions.length; i += 3) {
            compressed[i] = Math.round(((positions[i] - minX) / rangeX) * scale);
            compressed[i + 1] = Math.round(((positions[i + 1] - minY) / rangeY) * scale);
            compressed[i + 2] = Math.round(((positions[i + 2] - minZ) / rangeZ) * scale);
        }

        return {
            data: compressed,
            bounds: { minX, minY, minZ, rangeX, rangeY, rangeZ },
            quantizationBits
        };
    }

    /**
     * Compress normal data
     */
    compressNormals(normals) {
        if (!normals) return null;

        // Use octahedral encoding for normals
        const compressed = new Uint16Array(normals.length / 3 * 2);

        for (let i = 0, j = 0; i < normals.length; i += 3, j += 2) {
            const x = normals[i];
            const y = normals[i + 1];
            const z = normals[i + 2];

            // Octahedral encoding
            const l1norm = Math.abs(x) + Math.abs(y) + Math.abs(z);
            const nx = x / l1norm;
            const ny = y / l1norm;

            let octX, octY;
            if (z >= 0) {
                octX = nx;
                octY = ny;
            } else {
                octX = (1 - Math.abs(ny)) * (nx >= 0 ? 1 : -1);
                octY = (1 - Math.abs(nx)) * (ny >= 0 ? 1 : -1);
            }

            compressed[j] = Math.round((octX * 0.5 + 0.5) * 65535);
            compressed[j + 1] = Math.round((octY * 0.5 + 0.5) * 65535);
        }

        return compressed;
    }

    /**
     * Compress UV data
     */
    compressUVs(uvs) {
        if (!uvs) return null;

        const quantizationBits = this.compressionSettings.draco.quantizationBits.uv;
        const scale = Math.pow(2, quantizationBits) - 1;

        const compressed = new Uint16Array(uvs.length);

        for (let i = 0; i < uvs.length; i++) {
            compressed[i] = Math.round(uvs[i] * scale);
        }

        return { data: compressed, quantizationBits };
    }

    /**
     * Decompress geometry
     */
    decompressGeometry(compressed) {
        const geometry = new THREE.BufferGeometry();

        // Decompress positions
        if (compressed.positions) {
            const positions = this.decompressPositions(compressed.positions);
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        }

        // Decompress normals
        if (compressed.normals) {
            const normals = this.decompressNormals(compressed.normals);
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        }

        // Decompress UVs
        if (compressed.uvs) {
            const uvs = this.decompressUVs(compressed.uvs);
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        }

        // Set indices
        if (compressed.indices) {
            geometry.setIndex(compressed.indices);
        }

        return geometry;
    }

    /**
     * Get compression statistics
     */
    getCompressionStats() {
        return {
            cacheSize: this.cache.size,
            compressionCacheSize: this.compressionCache.size,
            streamingQueueLength: this.streamingQueue.length,
            isLoading: this.isLoading
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.compressionCache.clear();
    }

    /**
     * Dispose resources
     */
    dispose() {
        this.clearCache();
        this.dracoLoader.dispose();
        this.ktx2Loader.dispose();
    }
}

/**
 * Mesh Compression Utilities
 */
class MeshCompressionUtils {
    static compressBufferGeometry(geometry, options = {}) {
        const {
            positionQuantization = 14,
            normalQuantization = 10,
            uvQuantization = 12,
            preserveTopology = true
        } = options;

        // Implementation would include advanced compression algorithms
        // like edge collapse, vertex clustering, etc.

        console.log('Compressing geometry with options:', options);
        return geometry; // Placeholder
    }

    static decompressBufferGeometry(compressedData) {
        // Implementation would reconstruct geometry from compressed data
        console.log('Decompressing geometry');
        return new THREE.BufferGeometry(); // Placeholder
    }

    static calculateCompressionRatio(originalSize, compressedSize) {
        return originalSize / compressedSize;
    }
}

export { MedicalMeshLoader, MeshCompressionUtils };