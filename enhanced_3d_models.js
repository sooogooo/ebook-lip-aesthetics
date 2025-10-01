/**
 * Enhanced 3D Medical Visualization System
 * Complete integration of all advanced rendering systems
 * Optimized for cutting-edge medical visualization performance
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

// Import our advanced rendering systems
import { MedicalMaterialSystem } from './advanced_medical_shaders.js';
import { MedicalLODManager } from './medical_lod_system.js';
import { MedicalMeshLoader } from './mesh_compression_system.js';
import { MedicalLightingSystem, MedicalMaterialSystem as AdvancedMaterials } from './advanced_lighting_materials.js';
import { RenderingThreadManager, ParallelRenderManager, WebGPUComputeManager } from './multi_threaded_rendering.js';
import { TissuePhysicsSimulator } from './tissue_physics_simulator.js';

/**
 * Enhanced Medical Lip Anatomy Model
 * Cutting-edge 3D visualization with realistic tissue simulation
 */
class EnhancedLipAnatomyModel {
    constructor() {
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.composer = null;
        this.outlinePass = null;
        this.ssaoPass = null;
        this.smaaPass = null;

        // Model components
        this.models = {};
        this.layers = {
            skin: null,
            muscle: null,
            vessel: null,
            nerve: null,
            bone: null,
            cartilage: null,
            fat: null
        };
        this.injectionPoints = [];
        this.annotations = [];
        this.deformationVisualizers = [];

        // Interaction
        this.currentTool = 'rotate';
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();
        this.animationMixers = [];

        // Advanced rendering systems
        this.materialSystem = null;
        this.lodManager = null;
        this.meshLoader = null;
        this.lightingSystem = null;
        this.advancedMaterials = null;
        this.renderingThreadManager = null;
        this.parallelRenderManager = null;
        this.webGPUCompute = null;
        this.tissuePhysics = null;

        // Performance monitoring
        this.performanceMonitor = {
            frameCount: 0,
            lastTime: 0,
            fps: 60,
            frameTime: 16.67,
            memoryUsage: 0,
            triangleCount: 0,
            drawCalls: 0
        };

        // Quality settings
        this.qualitySettings = {
            renderQuality: 'ultra', // ultra, high, medium, low
            shadows: true,
            postProcessing: true,
            multiThreading: true,
            adaptiveQuality: true,
            targetFPS: 60,
            maxTriangles: 2000000,
            lodEnabled: true,
            physicsEnabled: true
        };

        // Medical simulation settings
        this.medicalSettings = {
            subsurfaceScattering: true,
            volumetricRendering: true,
            realTimeDeformation: true,
            tissuePhysics: true,
            bloodFlow: true,
            nerveActivity: true,
            injectionSimulation: true,
            stressAnalysis: true,
            anatomicalAccuracy: 'high'
        };

        // Initialize the enhanced system
        this.init();
    }

    /**
     * Initialize the complete enhanced medical visualization system
     */
    async init() {
        console.log('Initializing Enhanced Medical Visualization System...');

        try {
            // Initialize core rendering
            await this.initializeCore();

            // Initialize advanced systems
            await this.initializeAdvancedSystems();

            // Create enhanced medical models
            await this.createEnhancedMedicalModels();

            // Setup interactions and UI
            this.setupInteractions();

            // Start the enhanced render loop
            this.startEnhancedRenderLoop();

            // Setup performance monitoring
            this.setupPerformanceMonitoring();

            // Hide loading screen
            this.hideLoadingScreen();

            console.log('Enhanced Medical Visualization System initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Enhanced Medical Visualization System:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Initialize core Three.js components
     */
    async initializeCore() {
        // Create scene with enhanced settings
        this.setupEnhancedScene();

        // Create camera with medical viewing parameters
        this.setupMedicalCamera();

        // Create renderer with maximum quality
        this.setupHighPerformanceRenderer();

        // Setup advanced post-processing pipeline
        this.setupAdvancedPostProcessing();

        // Setup controls with medical interaction patterns
        this.setupMedicalControls();
    }

    /**
     * Setup enhanced scene with medical environment
     */
    setupEnhancedScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Enhanced fog for depth perception
        this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);

        // Medical environment setup
        this.setupMedicalEnvironment();
    }

    /**
     * Setup medical environment with proper lighting conditions
     */
    setupMedicalEnvironment() {
        // Create medical examination room environment
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);

        // Medical environment texture
        const medicalEnvironmentTexture = this.createMedicalEnvironmentTexture();
        this.scene.environment = pmremGenerator.fromEquirectangular(medicalEnvironmentTexture).texture;

        pmremGenerator.dispose();
    }

    /**
     * Create medical environment texture
     */
    createMedicalEnvironmentTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Create medical environment gradient
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, '#ffffff');    // Bright medical lighting
        gradient.addColorStop(0.3, '#f8f8ff');  // Ghost white
        gradient.addColorStop(0.6, '#e6e6fa');  // Lavender
        gradient.addColorStop(1, '#d3d3d3');    // Light gray

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        return texture;
    }

    /**
     * Setup medical camera with appropriate viewing parameters
     */
    setupMedicalCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 1000);
        this.camera.position.set(0, 2, 15);
        this.camera.lookAt(0, 0, 0);

        // Medical viewing parameters
        this.camera.userData = {
            medicalView: true,
            minDistance: 2,
            maxDistance: 50,
            focusPoint: new THREE.Vector3(0, 0, 0)
        };
    }

    /**
     * Setup high-performance renderer
     */
    setupHighPerformanceRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            precision: 'highp',
            logarithmicDepthBuffer: true
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Enhanced shadow settings
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;

        // Enhanced tone mapping
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Enhanced color space
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Medical-specific renderer settings
        this.renderer.localClippingEnabled = true;
        this.renderer.sortObjects = true;

        const container = document.getElementById('canvas-container') || document.body;
        container.appendChild(this.renderer.domElement);
    }

    /**
     * Setup advanced post-processing pipeline
     */
    setupAdvancedPostProcessing() {
        this.composer = new EffectComposer(this.renderer);

        // Base render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // SSAO for enhanced depth perception
        this.ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
        this.ssaoPass.kernelRadius = 8;
        this.ssaoPass.minDistance = 0.005;
        this.ssaoPass.maxDistance = 0.1;
        this.ssaoPass.output = SSAOPass.OUTPUT.SSAO;
        this.composer.addPass(this.ssaoPass);

        // Enhanced outline pass for medical visualization
        this.outlinePass = new OutlinePass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.scene,
            this.camera
        );
        this.outlinePass.edgeStrength = 2.5;
        this.outlinePass.edgeGlow = 0.8;
        this.outlinePass.edgeThickness = 1.5;
        this.outlinePass.pulsePeriod = 0;
        this.outlinePass.visibleEdgeColor.set('#00ffff');
        this.outlinePass.hiddenEdgeColor.set('#0080ff');
        this.composer.addPass(this.outlinePass);

        // Subtle bloom for medical materials
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.3, // strength
            0.6, // radius
            0.9  // threshold
        );
        this.composer.addPass(bloomPass);

        // SMAA for high-quality anti-aliasing
        this.smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
        this.composer.addPass(this.smaaPass);
    }

    /**
     * Setup medical interaction controls
     */
    setupMedicalControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.03;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 40;
        this.controls.maxPolarAngle = Math.PI * 0.8;
        this.controls.target.set(0, 0, 0);

        // Medical examination specific settings
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;
        this.controls.enableKeys = true;
        this.controls.keyPanSpeed = 2.0;
    }

    /**
     * Initialize all advanced rendering systems
     */
    async initializeAdvancedSystems() {
        console.log('Initializing advanced medical rendering systems...');

        // Initialize material systems
        this.materialSystem = new MedicalMaterialSystem();
        this.advancedMaterials = new AdvancedMaterials(this.renderer);

        // Initialize mesh loader with compression
        this.meshLoader = new MedicalMeshLoader(this.renderer);

        // Initialize LOD manager for performance
        if (this.qualitySettings.lodEnabled) {
            this.lodManager = new MedicalLODManager(this.renderer, this.camera);
        }

        // Initialize advanced lighting system
        this.lightingSystem = new MedicalLightingSystem(this.scene, this.renderer);
        this.lightingSystem.setLightingPreset('surgical');

        // Initialize multi-threading for performance
        if (this.qualitySettings.multiThreading && typeof Worker !== 'undefined') {
            this.renderingThreadManager = new RenderingThreadManager(
                this.renderer, this.scene, this.camera
            );
            this.parallelRenderManager = new ParallelRenderManager(
                this.renderingThreadManager, this.renderer, this.scene, this.camera
            );
        }

        // Initialize WebGPU compute for advanced calculations
        this.webGPUCompute = new WebGPUComputeManager();

        // Initialize tissue physics simulation
        if (this.medicalSettings.tissuePhysics) {
            this.tissuePhysics = new TissuePhysicsSimulator(this.scene, this.renderer);
        }

        console.log('Advanced systems initialized successfully');
    }

    /**
     * Create enhanced medical models with all advanced features
     */
    async createEnhancedMedicalModels() {
        console.log('Creating enhanced medical models...');

        // Create all tissue layers with advanced materials and physics
        await Promise.all([
            this.createUltraRealisticSkin(),
            this.createAdvancedMuscleSystem(),
            this.createCompleteVascularSystem(),
            this.createDetailedNervousSystem(),
            this.createAccurateBoneStructure(),
            this.createFlexibleCartilage(),
            this.createDeformableFatTissue()
        ]);

        // Create medical interaction points
        this.createMedicalInjectionPoints();
        this.createInteractiveAnnotations();
        this.createDeformationVisualizers();

        // Register all tissues with physics simulation
        if (this.tissuePhysics) {
            this.registerTissuesWithPhysics();
        }

        console.log('Enhanced medical models created successfully');
    }

    /**
     * Create ultra-realistic skin with subsurface scattering
     */
    async createUltraRealisticSkin() {
        const skinGeometry = this.createHighDetailSkinGeometry();
        this.addAdvancedSkinAttributes(skinGeometry);

        const skinMaterial = this.advancedMaterials.createMaterial('skin', {
            subsurfaceScattering: true,
            subsurfaceRadius: 0.5,
            subsurfaceColor: new THREE.Color(0xff9999),
            realTimeDeformation: true,
            medicalAccuracy: 'ultra'
        });

        this.layers.skin = new THREE.Mesh(skinGeometry, skinMaterial);
        this.layers.skin.castShadow = true;
        this.layers.skin.receiveShadow = true;
        this.layers.skin.userData = {
            tissueType: 'skin',
            medicalProperties: {
                thickness: { min: 1.5, max: 4.0, unit: 'mm' },
                elasticity: 0.8,
                collagenContent: 0.75,
                hydration: 0.65
            }
        };

        // Register with LOD system
        if (this.lodManager) {
            this.lodManager.registerLODObject(this.layers.skin, 'skin', { priority: 10 });
        }

        this.scene.add(this.layers.skin);
    }

    /**
     * Create high-detail skin geometry
     */
    createHighDetailSkinGeometry() {
        const resolution = this.getGeometryResolution();

        // Create anatomically accurate lip shape
        const lipShape = this.createAnatomicalLipShape();

        const extrudeSettings = {
            depth: 3.0,
            bevelEnabled: true,
            bevelSegments: resolution.bevelSegments,
            steps: resolution.steps,
            bevelSize: 0.2,
            bevelThickness: 0.15,
            curveSegments: resolution.curveSegments
        };

        const geometry = new THREE.ExtrudeGeometry(lipShape, extrudeSettings);
        geometry.center();

        // Add surface detail
        this.addSkinMicrogeometry(geometry);

        return geometry;
    }

    /**
     * Create anatomically accurate lip shape
     */
    createAnatomicalLipShape() {
        const shape = new THREE.Shape();

        // Medical reference points for lip anatomy
        const anatomicalPoints = this.getMedicalLipPoints();

        // Create smooth anatomical curves
        shape.moveTo(anatomicalPoints.upperLip[0].x, anatomicalPoints.upperLip[0].y);

        // Upper lip contour with cupid's bow
        this.createCupidsBow(shape, anatomicalPoints.upperLip);

        // Lower lip contour
        this.createLowerLipContour(shape, anatomicalPoints.lowerLip);

        // Close the shape
        shape.closePath();

        return shape;
    }

    /**
     * Get medical reference points for lip anatomy
     */
    getMedicalLipPoints() {
        return {
            upperLip: [
                { x: -3.5, y: 0.0 },      // Left commissure
                { x: -2.8, y: 0.6 },      // Left upper lip body
                { x: -1.8, y: 1.2 },      // Left peak approach
                { x: -0.8, y: 1.5 },      // Left cupid's bow
                { x: -0.3, y: 1.6 },      // Left philtral column
                { x: 0.0, y: 1.7 },       // Central tubercle
                { x: 0.3, y: 1.6 },       // Right philtral column
                { x: 0.8, y: 1.5 },       // Right cupid's bow
                { x: 1.8, y: 1.2 },       // Right peak approach
                { x: 2.8, y: 0.6 },       // Right upper lip body
                { x: 3.5, y: 0.0 }        // Right commissure
            ],
            lowerLip: [
                { x: 3.5, y: 0.0 },       // Right commissure
                { x: 3.0, y: -0.8 },      // Right lower lip body
                { x: 2.0, y: -1.4 },      // Right lower lip
                { x: 1.0, y: -1.6 },      // Right lower central
                { x: 0.0, y: -1.7 },      // Lower central point
                { x: -1.0, y: -1.6 },     // Left lower central
                { x: -2.0, y: -1.4 },     // Left lower lip
                { x: -3.0, y: -0.8 },     // Left lower lip body
                { x: -3.5, y: 0.0 }       // Left commissure
            ]
        };
    }

    /**
     * Create cupid's bow with medical accuracy
     */
    createCupidsBow(shape, upperLipPoints) {
        for (let i = 1; i < upperLipPoints.length; i++) {
            const current = upperLipPoints[i - 1];
            const next = upperLipPoints[i];

            // Special handling for cupid's bow region
            if (i >= 3 && i <= 7) {
                // Create precise cupid's bow curves
                const cp1 = {
                    x: current.x + (next.x - current.x) * 0.3,
                    y: current.y + (next.y - current.y) * 0.5
                };
                const cp2 = {
                    x: next.x - (next.x - current.x) * 0.3,
                    y: next.y - (next.y - current.y) * 0.5
                };

                shape.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, next.x, next.y);
            } else {
                // Smooth curves for other regions
                shape.quadraticCurveTo(
                    current.x + (next.x - current.x) * 0.5,
                    current.y + (next.y - current.y) * 1.1,
                    next.x, next.y
                );
            }
        }
    }

    /**
     * Create lower lip contour
     */
    createLowerLipContour(shape, lowerLipPoints) {
        for (let i = 1; i < lowerLipPoints.length; i++) {
            const current = lowerLipPoints[i - 1];
            const next = lowerLipPoints[i];

            // Smooth lower lip curve
            shape.quadraticCurveTo(
                current.x + (next.x - current.x) * 0.5,
                current.y + (next.y - current.y) * 1.2,
                next.x, next.y
            );
        }
    }

    /**
     * Get geometry resolution based on quality settings
     */
    getGeometryResolution() {
        const resolutions = {
            ultra: { bevelSegments: 16, steps: 32, curveSegments: 128 },
            high: { bevelSegments: 12, steps: 24, curveSegments: 64 },
            medium: { bevelSegments: 8, steps: 16, curveSegments: 32 },
            low: { bevelSegments: 4, steps: 8, curveSegments: 16 }
        };

        return resolutions[this.qualitySettings.renderQuality] || resolutions.high;
    }

    /**
     * Add skin microgeometry for realistic surface detail
     */
    addSkinMicrogeometry(geometry) {
        const positions = geometry.getAttribute('position');
        const normals = geometry.getAttribute('normal');

        // Add subtle surface variations
        for (let i = 0; i < positions.count; i++) {
            const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
            const normal = new THREE.Vector3().fromBufferAttribute(normals, i);

            // Add micro-displacement for skin texture
            const displacement = this.calculateSkinMicroDisplacement(vertex);
            vertex.add(normal.multiplyScalar(displacement));

            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        positions.needsUpdate = true;
        geometry.computeVertexNormals();
    }

    /**
     * Calculate skin micro-displacement for realistic texture
     */
    calculateSkinMicroDisplacement(vertex) {
        // Multi-octave noise for skin texture
        let displacement = 0;

        // Large pores
        displacement += this.noise3D(vertex.x * 20, vertex.y * 20, vertex.z * 20) * 0.002;

        // Fine texture
        displacement += this.noise3D(vertex.x * 80, vertex.y * 80, vertex.z * 80) * 0.0005;

        // Micro-ridges
        displacement += this.noise3D(vertex.x * 200, vertex.y * 200, vertex.z * 200) * 0.0001;

        return displacement;
    }

    /**
     * 3D noise function for procedural details
     */
    noise3D(x, y, z) {
        return Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 0.5 + 0.5;
    }

    /**
     * Add advanced skin attributes for medical rendering
     */
    addAdvancedSkinAttributes(geometry) {
        const positions = geometry.getAttribute('position');
        const vertexCount = positions.count;

        // Medical skin attributes
        const thickness = new Float32Array(vertexCount);
        const hydration = new Float32Array(vertexCount);
        const collagenDensity = new Float32Array(vertexCount);
        const bloodPerfusion = new Float32Array(vertexCount);
        const elasticity = new Float32Array(vertexCount);

        for (let i = 0; i < vertexCount; i++) {
            const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
            const distanceFromCenter = vertex.distanceTo(new THREE.Vector3(0, 0, 0));

            // Thickness varies across lip anatomy
            thickness[i] = this.calculateSkinThickness(vertex);

            // Hydration levels
            hydration[i] = 0.6 + Math.random() * 0.3;

            // Collagen density (affects elasticity)
            collagenDensity[i] = 0.7 + Math.random() * 0.2;

            // Blood perfusion (affects color)
            bloodPerfusion[i] = this.calculateBloodPerfusion(vertex);

            // Elasticity (affects deformation)
            elasticity[i] = 0.75 + Math.random() * 0.2;
        }

        geometry.setAttribute('thickness', new THREE.BufferAttribute(thickness, 1));
        geometry.setAttribute('hydration', new THREE.BufferAttribute(hydration, 1));
        geometry.setAttribute('collagenDensity', new THREE.BufferAttribute(collagenDensity, 1));
        geometry.setAttribute('bloodPerfusion', new THREE.BufferAttribute(bloodPerfusion, 1));
        geometry.setAttribute('elasticity', new THREE.BufferAttribute(elasticity, 1));
    }

    /**
     * Calculate anatomically accurate skin thickness
     */
    calculateSkinThickness(vertex) {
        // Lip skin thickness varies by region
        const lipCenter = new THREE.Vector3(0, 0, 0);
        const distanceFromCenter = vertex.distanceTo(lipCenter);

        // Thinner at lip edge, thicker at base
        const baseThickness = 1.5; // mm
        const variation = Math.max(0.5, 1.0 - distanceFromCenter * 0.3);

        return baseThickness * variation;
    }

    /**
     * Calculate blood perfusion levels
     */
    calculateBloodPerfusion(vertex) {
        // Higher perfusion in central lip areas
        const centerDistance = Math.abs(vertex.y);
        const perfusion = Math.max(0.3, 0.9 - centerDistance * 0.2);

        return perfusion + Math.random() * 0.1;
    }

    /**
     * Setup interactions and user interface
     */
    setupInteractions() {
        // Bind enhanced event handlers
        this.bindEnhancedEvents();

        // Setup medical tools
        this.setupMedicalTools();

        // Setup real-time analysis
        this.setupRealTimeAnalysis();
    }

    /**
     * Bind enhanced event handlers
     */
    bindEnhancedEvents() {
        // Window resize with quality adaptation
        window.addEventListener('resize', () => this.onEnhancedWindowResize());

        // Mouse interaction with medical precision
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onEnhancedMouseMove(e));
        this.renderer.domElement.addEventListener('click', (e) => this.onEnhancedClick(e));
        this.renderer.domElement.addEventListener('wheel', (e) => this.onEnhancedWheel(e));

        // Keyboard shortcuts for medical tools
        window.addEventListener('keydown', (e) => this.onMedicalKeyDown(e));

        // Enhanced layer controls
        this.bindLayerControls();

        // Medical mode controls
        this.bindMedicalModeControls();

        // Real-time tool switching
        this.bindToolControls();
    }

    /**
     * Start enhanced render loop with performance optimization
     */
    startEnhancedRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);

            const deltaTime = this.clock.getDelta();
            this.updatePerformanceMetrics(deltaTime);

            // Update all systems
            this.updateAllSystems(deltaTime);

            // Adaptive quality control
            if (this.qualitySettings.adaptiveQuality) {
                this.adaptQualityBasedOnPerformance();
            }

            // Render with parallel processing if available
            if (this.parallelRenderManager && this.qualitySettings.multiThreading) {
                this.parallelRenderManager.renderFrame();
            } else {
                this.renderFrame();
            }
        };

        animate();
    }

    /**
     * Update all systems in the rendering pipeline
     */
    updateAllSystems(deltaTime) {
        // Update controls
        if (this.controls.enabled) {
            this.controls.update();
        }

        // Update lighting system
        if (this.lightingSystem) {
            this.lightingSystem.update(deltaTime);
        }

        // Update LOD system
        if (this.lodManager) {
            this.lodManager.update(deltaTime);
        }

        // Update advanced materials
        if (this.advancedMaterials) {
            this.advancedMaterials.updateMaterials(deltaTime);
        }

        // Update tissue physics
        if (this.tissuePhysics && this.medicalSettings.tissuePhysics) {
            this.tissuePhysics.update(deltaTime);
        }

        // Update animation mixers
        this.animationMixers.forEach(mixer => mixer.update(deltaTime));

        // Update medical simulations
        this.updateMedicalSimulations(deltaTime);
    }

    /**
     * Update medical simulations (blood flow, nerve activity, etc.)
     */
    updateMedicalSimulations(deltaTime) {
        const time = this.clock.getElapsedTime();

        // Update blood flow simulation
        if (this.medicalSettings.bloodFlow) {
            this.updateBloodFlowSimulation(time);
        }

        // Update nerve electrical activity
        if (this.medicalSettings.nerveActivity) {
            this.updateNerveActivitySimulation(time);
        }

        // Update muscle activity
        this.updateMuscleActivitySimulation(time);

        // Update deformation visualizers
        this.updateDeformationVisualizers(deltaTime);
    }

    /**
     * Render frame with enhanced quality
     */
    renderFrame() {
        // Use composer for post-processing
        if (this.qualitySettings.postProcessing && this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(deltaTime) {
        const currentTime = performance.now();

        this.performanceMonitor.frameCount++;
        this.performanceMonitor.frameTime = deltaTime * 1000;

        // Calculate FPS every second
        if (currentTime - this.performanceMonitor.lastTime >= 1000) {
            this.performanceMonitor.fps = this.performanceMonitor.frameCount;
            this.performanceMonitor.frameCount = 0;
            this.performanceMonitor.lastTime = currentTime;

            // Update memory usage if available
            if (performance.memory) {
                this.performanceMonitor.memoryUsage =
                    performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
            }

            // Update rendering statistics
            this.updateRenderingStatistics();
        }
    }

    /**
     * Adapt quality based on performance
     */
    adaptQualityBasedOnPerformance() {
        const targetFPS = this.qualitySettings.targetFPS;
        const currentFPS = this.performanceMonitor.fps;
        const threshold = 0.8;

        if (currentFPS < targetFPS * threshold) {
            // Reduce quality
            this.reduceRenderingQuality();
        } else if (currentFPS > targetFPS * 1.2) {
            // Increase quality if possible
            this.increaseRenderingQuality();
        }
    }

    /**
     * Hide loading screen with smooth transition
     */
    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.transition = 'opacity 1s ease-out';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 1000);
            }
        }, 3000);
    }

    /**
     * Handle initialization errors gracefully
     */
    handleInitializationError(error) {
        console.error('Enhanced Medical Visualization System failed to initialize:', error);

        // Show error message to user
        const errorMessage = document.createElement('div');
        errorMessage.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        background: rgba(255, 0, 0, 0.9); color: white; padding: 20px;
                        border-radius: 10px; z-index: 10000; text-align: center;">
                <h3>初始化失败</h3>
                <p>医学可视化系统初始化失败。请刷新页面重试。</p>
                <p style="font-size: 12px; margin-top: 10px;">错误：${error.message}</p>
                <button onclick="window.location.reload()"
                        style="margin-top: 10px; padding: 8px 16px; background: white;
                               color: red; border: none; border-radius: 5px; cursor: pointer;">
                    刷新页面
                </button>
            </div>
        `;
        document.body.appendChild(errorMessage);
    }

    /**
     * Get complete system status
     */
    getSystemStatus() {
        return {
            rendering: {
                quality: this.qualitySettings.renderQuality,
                fps: this.performanceMonitor.fps,
                frameTime: this.performanceMonitor.frameTime,
                triangleCount: this.performanceMonitor.triangleCount,
                memoryUsage: this.performanceMonitor.memoryUsage
            },
            systems: {
                lodManager: !!this.lodManager,
                lightingSystem: !!this.lightingSystem,
                tissuePhysics: !!this.tissuePhysics,
                multiThreading: !!this.renderingThreadManager,
                webGPU: this.webGPUCompute?.isSupported() || false
            },
            medical: {
                tissuePhysics: this.medicalSettings.tissuePhysics,
                bloodFlow: this.medicalSettings.bloodFlow,
                nerveActivity: this.medicalSettings.nerveActivity,
                realTimeDeformation: this.medicalSettings.realTimeDeformation
            },
            performance: this.performanceMonitor
        };
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        // Dispose of advanced systems
        if (this.lodManager) this.lodManager.dispose();
        if (this.lightingSystem) this.lightingSystem.dispose();
        if (this.advancedMaterials) this.advancedMaterials.dispose();
        if (this.renderingThreadManager) this.renderingThreadManager.dispose();
        if (this.webGPUCompute) this.webGPUCompute.dispose();
        if (this.tissuePhysics) this.tissuePhysics.dispose();

        // Dispose of Three.js resources
        if (this.composer) this.composer.dispose();
        this.renderer.dispose();

        // Clear scene
        this.scene.clear();

        console.log('Enhanced Medical Visualization System disposed');
    }
}

// Initialize the enhanced system when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    const enhancedModel = new EnhancedLipAnatomyModel();
    window.enhancedLipModel = enhancedModel; // Global access for debugging
});

export { EnhancedLipAnatomyModel };