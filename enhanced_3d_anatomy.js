import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

/**
 * Enhanced Lip Anatomy 3D Model with advanced interactive features
 * Supports multi-layer visualization, procedure animations, measurement tools,
 * voice narration, touch gestures, and performance optimization for 60fps
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

        // Performance monitoring
        this.stats = {
            fps: 0,
            frameCount: 0,
            lastTime: performance.now(),
            memoryUsage: 0,
            triangleCount: 0
        };

        // Model layers with enhanced properties
        this.layers = {
            skin: { mesh: null, opacity: 1.0, visible: true, material: null },
            muscle: { mesh: null, opacity: 0.8, visible: false, material: null },
            vessel: { mesh: null, opacity: 0.8, visible: false, material: null },
            nerve: { mesh: null, opacity: 0.8, visible: false, material: null },
            bone: { mesh: null, opacity: 0.9, visible: false, material: null }
        };

        // Interaction systems
        this.injectionPoints = [];
        this.annotations = [];
        this.measurements = [];
        this.hotspots = [];
        this.currentTool = 'rotate';

        // Animation and procedure systems
        this.animationMixers = [];
        this.procedureAnimations = new Map();
        this.currentProcedure = null;
        this.proceduralSteps = [];

        // Touch gesture support
        this.touchEnabled = 'ontouchstart' in window;
        this.gestureState = {
            isRotating: false,
            isZooming: false,
            isPanning: false,
            lastTouches: [],
            rotationSpeed: 1.0,
            zoomSpeed: 1.0
        };

        // Voice narration system
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.narrationScripts = new Map();

        // Measurement system
        this.measurementMode = false;
        this.measurementPoints = [];
        this.activeMeasurement = null;

        // Comparison system
        this.comparisonMode = false;
        this.beforeState = null;
        this.afterState = null;

        // Performance optimization
        this.lodManager = null;
        this.frustumCulling = true;
        this.adaptiveQuality = true;
        this.targetFPS = 60;
        this.qualityLevel = 'high';

        // Utility objects
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();
        this.loadingManager = new THREE.LoadingManager();

        // Initialize the system
        this.init();
    }

    /**
     * Initialize all systems
     */
    async init() {
        try {
            // Setup loading progress tracking
            this.setupLoadingManager();

            // Create core 3D components
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.setupEnvironment(); // Now safe to use renderer
            this.setupControls();
            this.setupLights();
            this.setupPostProcessing();

            // Create enhanced anatomical models
            await this.createEnhancedAnatomyModels();

            // Initialize interaction systems
            this.setupInteractionSystems();
            this.setupGestureSupport();
            this.setupVoiceNarration();
            this.setupMeasurementTools();
            this.setupAnnotationSystem();

            // Bind events and start rendering
            this.bindEvents();
            this.startPerformanceMonitoring();
            this.animate();

            // Hide loading screen
            await this.hideLoadingScreen();

            console.log('Enhanced 3D Anatomy System initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Enhanced 3D Anatomy System:', error);
            this.showError('Failed to load 3D anatomy system');
        }
    }

    /**
     * Setup loading manager with progress tracking
     */
    setupLoadingManager() {
        this.loadingManager.onProgress = (url, loaded, total) => {
            const progress = (loaded / total) * 100;
            const progressBar = document.getElementById('loading-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        };

        this.loadingManager.onLoad = () => {
            console.log('All assets loaded successfully');
        };

        this.loadingManager.onError = (url) => {
            console.error('Failed to load asset:', url);
        };
    }

    /**
     * Setup Three.js scene with enhanced environment
     */
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e1e2e);

        // Add fog for depth perception
        this.scene.fog = new THREE.Fog(0x1e1e2e, 10, 50);
    }

    /**
     * Setup environment mapping after renderer is created
     */
    setupEnvironment() {
        if (this.renderer && this.scene) {
            try {
                const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
                this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
                pmremGenerator.dispose();
            } catch (error) {
                console.warn('Environment mapping failed, using basic lighting:', error);
            }
        }
    }

    /**
     * Setup camera with enhanced parameters
     */
    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(0, 0, 0);

        // Enable frustum culling optimization
        this.camera.matrixAutoUpdate = true;
    }

    /**
     * Setup WebGL renderer with performance optimizations
     */
    setupRenderer() {
        // Check WebGL support
        if (!this.checkWebGLSupport()) {
            this.showError('WebGL is not supported on this device');
            return;
        }

        try {
            this.renderer = new THREE.WebGLRenderer({
                antialias: this.qualityLevel === 'high',
                alpha: true,
                powerPreference: 'high-performance',
                stencil: false,
                depth: true,
                preserveDrawingBuffer: false
            });

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            // Enhanced shadow settings
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.shadowMap.autoUpdate = false;

            // Tone mapping for realistic lighting
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.2;

            // Performance optimizations
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.physicallyCorrectLights = true;
            this.renderer.localClippingEnabled = true;

            // Frustum culling
            this.renderer.sortObjects = this.frustumCulling;

            const container = document.getElementById('canvas-container');
            if (container) {
                container.appendChild(this.renderer.domElement);
            } else {
                console.error('Canvas container not found');
                throw new Error('Canvas container not found');
            }

            console.log('WebGL renderer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize WebGL renderer:', error);
            this.showError('Failed to initialize 3D graphics');
            throw error;
        }
    }

    /**
     * Check WebGL support
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!context;
        } catch (e) {
            return false;
        }
    }

    /**
     * Setup enhanced orbit controls with gesture support
     */
    setupControls() {
        if (!this.renderer || !this.renderer.domElement) {
            console.error('Cannot setup controls: renderer not initialized');
            return;
        }

        try {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);

            // Enhanced control settings
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 30;
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.target.set(0, 0, 0);

            // Performance optimization
            this.controls.enableRotate = true;
            this.controls.enableZoom = true;
            this.controls.enablePan = true;

            // Touch gesture support
            this.controls.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };

            // Auto rotation for demo mode
            this.controls.autoRotate = false;
            this.controls.autoRotateSpeed = 2.0;

            console.log('Orbit controls initialized successfully');
        } catch (error) {
            console.error('Failed to initialize controls:', error);
            throw error;
        }
    }

    /**
     * Setup advanced lighting system
     */
    setupLights() {
        // Ambient light with adjustable intensity
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light with shadows
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 7.5);
        mainLight.castShadow = true;

        // Enhanced shadow camera settings
        mainLight.shadow.camera.near = 0.1;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        mainLight.shadow.mapSize.set(4096, 4096);
        mainLight.shadow.bias = -0.00005;

        this.scene.add(mainLight);

        // Fill light for softer shadows
        const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // Rim light for definition
        const rimLight = new THREE.DirectionalLight(0xff6b9d, 0.2);
        rimLight.position.set(0, -5, -10);
        this.scene.add(rimLight);

        // Point lights for highlights
        const highlightLight1 = new THREE.PointLight(0xffffff, 0.5, 20);
        highlightLight1.position.set(5, 5, 5);
        this.scene.add(highlightLight1);

        const highlightLight2 = new THREE.PointLight(0xff6b9d, 0.3, 15);
        highlightLight2.position.set(-5, -5, 5);
        this.scene.add(highlightLight2);
    }

    /**
     * Setup post-processing pipeline for enhanced visuals
     */
    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);

        // Main render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // TAA for temporal anti-aliasing (high quality mode)
        if (this.qualityLevel === 'high') {
            const taaPass = new TAARenderPass(this.scene, this.camera);
            taaPass.sampleLevel = 4;
            this.composer.addPass(taaPass);
        }

        // SMAA for edge anti-aliasing
        const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
        this.composer.addPass(smaaPass);

        // Outline pass for selections
        this.outlinePass = new OutlinePass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.scene,
            this.camera
        );
        this.outlinePass.edgeStrength = 3;
        this.outlinePass.edgeGlow = 1;
        this.outlinePass.edgeThickness = 2;
        this.outlinePass.pulsePeriod = 2;
        this.outlinePass.visibleEdgeColor.set('#ff6b9d');
        this.outlinePass.hiddenEdgeColor.set('#190a20');
        this.composer.addPass(this.outlinePass);

        // Bloom pass for glowing effects
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.qualityLevel === 'high' ? 0.5 : 0.3, // strength
            this.qualityLevel === 'high' ? 0.4 : 0.2, // radius
            0.85 // threshold
        );
        this.composer.addPass(bloomPass);
    }

    /**
     * Create enhanced anatomical models with detailed geometry
     */
    async createEnhancedAnatomyModels() {
        try {
            await Promise.all([
                this.createEnhancedSkinLayer(),
                this.createEnhancedMuscleLayer(),
                this.createEnhancedVesselSystem(),
                this.createEnhancedNerveSystem(),
                this.createBoneStructure(),
                this.createInjectionPoints(),
                this.createAnatomicalAnnotations()
            ]);
            console.log('Enhanced anatomy models created successfully');
        } catch (error) {
            console.warn('Complex models failed, using simplified models:', error);
            await this.createSimplifiedModels();
        }
    }

    /**
     * Create simplified models as fallback
     */
    async createSimplifiedModels() {
        try {
            // Create simple lip geometry
            const lipGeometry = new THREE.SphereGeometry(2, 32, 16);
            lipGeometry.scale(1.5, 0.8, 0.7);

            // Simple skin material
            const skinMaterial = new THREE.MeshPhongMaterial({
                color: 0xffdbcc,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });

            this.layers.skin.mesh = new THREE.Mesh(lipGeometry, skinMaterial);
            this.layers.skin.material = skinMaterial;
            this.layers.skin.mesh.userData = { layer: 'skin', selectable: true };
            this.scene.add(this.layers.skin.mesh);

            // Create simple muscle layer
            const muscleGeometry = new THREE.SphereGeometry(1.8, 24, 12);
            muscleGeometry.scale(1.4, 0.7, 0.6);

            const muscleMaterial = new THREE.MeshPhongMaterial({
                color: 0xff6b9d,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });

            this.layers.muscle.mesh = new THREE.Mesh(muscleGeometry, muscleMaterial);
            this.layers.muscle.material = muscleMaterial;
            this.layers.muscle.mesh.visible = false;
            this.layers.muscle.mesh.userData = { layer: 'muscle', selectable: true };
            this.scene.add(this.layers.muscle.mesh);

            // Create simple injection points
            this.createSimpleInjectionPoints();

            console.log('Simplified models created successfully');
        } catch (error) {
            console.error('Failed to create simplified models:', error);
            throw error;
        }
    }

    /**
     * Create simple injection points
     */
    createSimpleInjectionPoints() {
        const injectionPositions = [
            { x: -1.5, y: 0.5, z: 0 },
            { x: 1.5, y: 0.5, z: 0 },
            { x: -1, y: -0.5, z: 0 },
            { x: 1, y: -0.5, z: 0 },
            { x: 0, y: 0.8, z: 0 },
            { x: 0, y: -0.8, z: 0 }
        ];

        const pointGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const pointMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });

        injectionPositions.forEach((pos, index) => {
            const point = new THREE.Mesh(pointGeometry, pointMaterial);
            point.position.set(pos.x, pos.y, pos.z);
            point.userData = {
                type: 'injection_point',
                id: index,
                selectable: true,
                info: `注射点 ${index + 1}`
            };
            this.injectionPoints.push(point);
            this.scene.add(point);
        });
    }

    /**
     * Create enhanced skin layer with realistic materials
     */
    async createEnhancedSkinLayer() {
        // Create more detailed lip geometry
        const lipGeometry = this.createDetailedLipGeometry();

        // Enhanced skin material with subsurface scattering simulation
        const skinMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffdbcc,
            roughness: 0.4,
            metalness: 0,
            clearcoat: 0.3,
            clearcoatRoughness: 0.2,
            transmission: 0.1,
            thickness: 1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: this.layers.skin.opacity,

            // Enhanced properties for realism
            sheen: 0.5,
            sheenColor: new THREE.Color(0xffd7cc),
            ior: 1.4,
            reflectivity: 0.1
        });

        this.layers.skin.mesh = new THREE.Mesh(lipGeometry, skinMaterial);
        this.layers.skin.material = skinMaterial;
        this.layers.skin.mesh.castShadow = true;
        this.layers.skin.mesh.receiveShadow = true;
        this.layers.skin.mesh.userData = { layer: 'skin', selectable: true };

        this.scene.add(this.layers.skin.mesh);
    }

    /**
     * Create detailed lip geometry using advanced techniques
     */
    createDetailedLipGeometry() {
        // Create base shape using spline curves
        const upperLipCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-3.2, 0, 0),
            new THREE.Vector3(-2.5, 1.2, 0.3),
            new THREE.Vector3(-1.8, 1.6, 0.4),
            new THREE.Vector3(-0.9, 1.8, 0.5),
            new THREE.Vector3(0, 1.9, 0.5),
            new THREE.Vector3(0.9, 1.8, 0.5),
            new THREE.Vector3(1.8, 1.6, 0.4),
            new THREE.Vector3(2.5, 1.2, 0.3),
            new THREE.Vector3(3.2, 0, 0)
        ]);

        const lowerLipCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-3.2, 0, 0),
            new THREE.Vector3(-2.8, -0.8, 0.4),
            new THREE.Vector3(-2.0, -1.4, 0.5),
            new THREE.Vector3(-1.0, -1.7, 0.6),
            new THREE.Vector3(0, -1.8, 0.6),
            new THREE.Vector3(1.0, -1.7, 0.6),
            new THREE.Vector3(2.0, -1.4, 0.5),
            new THREE.Vector3(2.8, -0.8, 0.4),
            new THREE.Vector3(3.2, 0, 0)
        ]);

        // Create extruded geometry with varying thickness
        const shape = new THREE.Shape();

        // Upper lip outline
        const upperPoints = upperLipCurve.getPoints(50);
        shape.moveTo(upperPoints[0].x, upperPoints[0].y);
        upperPoints.slice(1).forEach(point => shape.lineTo(point.x, point.y));

        // Lower lip outline (reverse order)
        const lowerPoints = lowerLipCurve.getPoints(50).reverse();
        lowerPoints.forEach(point => shape.lineTo(point.x, point.y));

        // Close the shape
        shape.lineTo(upperPoints[0].x, upperPoints[0].y);

        const extrudeSettings = {
            depth: 2.5,
            bevelEnabled: true,
            bevelSegments: 12,
            steps: 20,
            bevelSize: 0.2,
            bevelThickness: 0.15,
            curveSegments: 32
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center();

        // Add vertex attributes for enhanced shading
        this.addVertexAttributes(geometry);

        return geometry;
    }

    /**
     * Add custom vertex attributes for enhanced rendering
     */
    addVertexAttributes(geometry) {
        const positions = geometry.getAttribute('position');
        const vertexCount = positions.count;

        // Add custom attributes for subsurface scattering
        const thickness = new Float32Array(vertexCount);
        const curvature = new Float32Array(vertexCount);

        for (let i = 0; i < vertexCount; i++) {
            const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);

            // Calculate thickness based on distance from center
            const distanceFromCenter = vertex.distanceTo(new THREE.Vector3(0, 0, 0));
            thickness[i] = Math.max(0.1, 1.0 - distanceFromCenter * 0.1);

            // Calculate curvature (simplified)
            curvature[i] = Math.abs(vertex.y) * 0.5 + 0.5;
        }

        geometry.setAttribute('thickness', new THREE.BufferAttribute(thickness, 1));
        geometry.setAttribute('curvature', new THREE.BufferAttribute(curvature, 1));

        // Compute vertex normals for smooth shading
        geometry.computeVertexNormals();
    }

    /**
     * Create enhanced muscle layer with detailed fiber structure
     */
    async createEnhancedMuscleLayer() {
        const muscleGroup = new THREE.Group();
        muscleGroup.userData = { layer: 'muscle', selectable: true };

        // Create orbicularis oris muscle (main lip muscle)
        await this.createOrbicularisOris(muscleGroup);

        // Create levator labii superioris
        await this.createLevatorLabii(muscleGroup);

        // Create depressor labii inferioris
        await this.createDepressorLabii(muscleGroup);

        // Create zygomaticus muscles
        await this.createZygomaticus(muscleGroup);

        this.layers.muscle.mesh = muscleGroup;
        this.layers.muscle.mesh.visible = this.layers.muscle.visible;
        this.scene.add(this.layers.muscle.mesh);
    }

    /**
     * Create orbicularis oris muscle with realistic fiber patterns
     */
    async createOrbicularisOris(muscleGroup) {
        const muscleMaterial = new THREE.MeshPhongMaterial({
            color: 0xff6b9d,
            shininess: 80,
            transparent: true,
            opacity: this.layers.muscle.opacity,
            side: THREE.DoubleSide
        });

        // Create muscle fibers in circular pattern
        const fiberCount = 16;
        const radius = 2.8;

        for (let i = 0; i < fiberCount; i++) {
            const angle = (Math.PI * 2 * i) / fiberCount;

            // Create individual muscle fiber
            const fiberGeometry = new THREE.TorusGeometry(
                radius + Math.sin(angle * 4) * 0.3,
                0.12 + Math.random() * 0.08,
                6,
                16,
                Math.PI * 0.4
            );

            const fiber = new THREE.Mesh(fiberGeometry, muscleMaterial.clone());
            fiber.position.set(
                Math.cos(angle) * 0.2,
                Math.sin(angle) * 0.1,
                Math.sin(angle * 2) * 0.1
            );
            fiber.rotation.z = angle;
            fiber.rotation.x = Math.sin(angle * 3) * 0.2;

            muscleGroup.add(fiber);
        }

        // Add muscle attachment points
        this.createMuscleAttachments(muscleGroup, muscleMaterial);
    }

    /**
     * Create muscle attachment points
     */
    createMuscleAttachments(muscleGroup, material) {
        const attachmentPoints = [
            { pos: [-2.5, 1.5, 0.5], name: '上唇肌肉附着点' },
            { pos: [2.5, 1.5, 0.5], name: '上唇肌肉附着点' },
            { pos: [-2.5, -1.5, 0.5], name: '下唇肌肉附着点' },
            { pos: [2.5, -1.5, 0.5], name: '下唇肌肉附着点' }
        ];

        attachmentPoints.forEach(point => {
            const attachmentGeometry = new THREE.SphereGeometry(0.08, 12, 12);
            const attachment = new THREE.Mesh(attachmentGeometry, material.clone());
            attachment.position.set(...point.pos);
            attachment.userData = { name: point.name, type: 'muscle_attachment' };
            muscleGroup.add(attachment);
        });
    }

    /**
     * Create levator labii superioris muscle
     */
    async createLevatorLabii(muscleGroup) {
        const material = new THREE.MeshPhongMaterial({
            color: 0xe74c3c,
            transparent: true,
            opacity: this.layers.muscle.opacity
        });

        // Left levator
        const leftLevator = this.createMuscleStrand([
            new THREE.Vector3(-2.5, 3, 1),
            new THREE.Vector3(-2.2, 2.5, 0.8),
            new THREE.Vector3(-1.8, 2, 0.6),
            new THREE.Vector3(-1.5, 1.5, 0.4)
        ], material, 0.06);

        // Right levator
        const rightLevator = this.createMuscleStrand([
            new THREE.Vector3(2.5, 3, 1),
            new THREE.Vector3(2.2, 2.5, 0.8),
            new THREE.Vector3(1.8, 2, 0.6),
            new THREE.Vector3(1.5, 1.5, 0.4)
        ], material, 0.06);

        muscleGroup.add(leftLevator);
        muscleGroup.add(rightLevator);
    }

    /**
     * Create depressor labii inferioris muscle
     */
    async createDepressorLabii(muscleGroup) {
        const material = new THREE.MeshPhongMaterial({
            color: 0xf39c12,
            transparent: true,
            opacity: this.layers.muscle.opacity
        });

        // Left depressor
        const leftDepressor = this.createMuscleStrand([
            new THREE.Vector3(-2.5, -3, 1),
            new THREE.Vector3(-2.2, -2.5, 0.8),
            new THREE.Vector3(-1.8, -2, 0.6),
            new THREE.Vector3(-1.5, -1.5, 0.4)
        ], material, 0.06);

        // Right depressor
        const rightDepressor = this.createMuscleStrand([
            new THREE.Vector3(2.5, -3, 1),
            new THREE.Vector3(2.2, -2.5, 0.8),
            new THREE.Vector3(1.8, -2, 0.6),
            new THREE.Vector3(1.5, -1.5, 0.4)
        ], material, 0.06);

        muscleGroup.add(leftDepressor);
        muscleGroup.add(rightDepressor);
    }

    /**
     * Create zygomaticus muscle group
     */
    async createZygomaticus(muscleGroup) {
        const material = new THREE.MeshPhongMaterial({
            color: 0x9b59b6,
            transparent: true,
            opacity: this.layers.muscle.opacity
        });

        // Zygomaticus major (left and right)
        const leftZygomatic = this.createMuscleStrand([
            new THREE.Vector3(-4, 2, 2),
            new THREE.Vector3(-3.5, 1.8, 1.5),
            new THREE.Vector3(-3, 1.5, 1),
            new THREE.Vector3(-2.5, 1, 0.5)
        ], material, 0.08);

        const rightZygomatic = this.createMuscleStrand([
            new THREE.Vector3(4, 2, 2),
            new THREE.Vector3(3.5, 1.8, 1.5),
            new THREE.Vector3(3, 1.5, 1),
            new THREE.Vector3(2.5, 1, 0.5)
        ], material, 0.08);

        muscleGroup.add(leftZygomatic);
        muscleGroup.add(rightZygomatic);
    }

    /**
     * Create a muscle strand using tube geometry
     */
    createMuscleStrand(points, material, radius = 0.05) {
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, radius, 8, false);
        const strand = new THREE.Mesh(tubeGeometry, material);
        strand.userData = { type: 'muscle_strand' };
        return strand;
    }

    /**
     * Create enhanced vascular system with pulsating animation
     */
    async createEnhancedVesselSystem() {
        const vesselGroup = new THREE.Group();
        vesselGroup.userData = { layer: 'vessel', selectable: true };

        const vesselMaterial = new THREE.MeshPhongMaterial({
            color: 0xe74c3c,
            emissive: 0x441111,
            emissiveIntensity: 0.2,
            shininess: 100,
            transparent: true,
            opacity: this.layers.vessel.opacity
        });

        // Create main arteries
        await this.createMainArteries(vesselGroup, vesselMaterial);

        // Create capillary networks
        await this.createCapillaryNetwork(vesselGroup, vesselMaterial);

        // Create venous return system
        await this.createVenousSystem(vesselGroup, vesselMaterial);

        this.layers.vessel.mesh = vesselGroup;
        this.layers.vessel.material = vesselMaterial;
        this.layers.vessel.mesh.visible = this.layers.vessel.visible;
        this.scene.add(this.layers.vessel.mesh);
    }

    /**
     * Create main arterial supply
     */
    async createMainArteries(vesselGroup, material) {
        // Superior labial artery
        const superiorLabialPoints = [
            new THREE.Vector3(-3.5, 1.2, 0),
            new THREE.Vector3(-2.5, 1.4, 0.2),
            new THREE.Vector3(-1.5, 1.6, 0.3),
            new THREE.Vector3(-0.5, 1.7, 0.4),
            new THREE.Vector3(0.5, 1.7, 0.4),
            new THREE.Vector3(1.5, 1.6, 0.3),
            new THREE.Vector3(2.5, 1.4, 0.2),
            new THREE.Vector3(3.5, 1.2, 0)
        ];

        const superiorArtery = this.createVessel(superiorLabialPoints, material, 0.08);
        vesselGroup.add(superiorArtery);

        // Inferior labial artery
        const inferiorLabialPoints = [
            new THREE.Vector3(-3.5, -1.2, 0),
            new THREE.Vector3(-2.5, -1.4, 0.2),
            new THREE.Vector3(-1.5, -1.6, 0.3),
            new THREE.Vector3(-0.5, -1.7, 0.4),
            new THREE.Vector3(0.5, -1.7, 0.4),
            new THREE.Vector3(1.5, -1.6, 0.3),
            new THREE.Vector3(2.5, -1.4, 0.2),
            new THREE.Vector3(3.5, -1.2, 0)
        ];

        const inferiorArtery = this.createVessel(inferiorLabialPoints, material, 0.08);
        vesselGroup.add(inferiorArtery);

        // Angular arteries
        const leftAngularPoints = [
            new THREE.Vector3(-4, 0, 1),
            new THREE.Vector3(-3.5, 0.2, 0.8),
            new THREE.Vector3(-3, 0.4, 0.6),
            new THREE.Vector3(-2.5, 0.6, 0.4)
        ];

        const rightAngularPoints = [
            new THREE.Vector3(4, 0, 1),
            new THREE.Vector3(3.5, 0.2, 0.8),
            new THREE.Vector3(3, 0.4, 0.6),
            new THREE.Vector3(2.5, 0.6, 0.4)
        ];

        vesselGroup.add(this.createVessel(leftAngularPoints, material, 0.06));
        vesselGroup.add(this.createVessel(rightAngularPoints, material, 0.06));
    }

    /**
     * Create capillary network
     */
    async createCapillaryNetwork(vesselGroup, material) {
        const capillaryMaterial = material.clone();
        capillaryMaterial.opacity *= 0.6;

        // Create random capillary branches
        for (let i = 0; i < 30; i++) {
            const startX = (Math.random() - 0.5) * 6;
            const startY = (Math.random() - 0.5) * 3;
            const startZ = Math.random() * 0.5;

            const capillaryPoints = [];
            let currentPos = new THREE.Vector3(startX, startY, startZ);

            for (let j = 0; j < 5; j++) {
                capillaryPoints.push(currentPos.clone());
                currentPos.add(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.4,
                    (Math.random() - 0.5) * 0.4,
                    (Math.random() - 0.5) * 0.2
                ));
            }

            const capillary = this.createVessel(capillaryPoints, capillaryMaterial, 0.02);
            vesselGroup.add(capillary);
        }
    }

    /**
     * Create venous return system
     */
    async createVenousSystem(vesselGroup, material) {
        const venousMaterial = material.clone();
        venousMaterial.color.setHex(0x8e44ad);

        // Create facial veins
        const leftFacialVeinPoints = [
            new THREE.Vector3(-2.5, 1, 0.5),
            new THREE.Vector3(-3, 1.5, 1),
            new THREE.Vector3(-3.5, 2, 1.5),
            new THREE.Vector3(-4, 2.5, 2)
        ];

        const rightFacialVeinPoints = [
            new THREE.Vector3(2.5, 1, 0.5),
            new THREE.Vector3(3, 1.5, 1),
            new THREE.Vector3(3.5, 2, 1.5),
            new THREE.Vector3(4, 2.5, 2)
        ];

        vesselGroup.add(this.createVessel(leftFacialVeinPoints, venousMaterial, 0.07));
        vesselGroup.add(this.createVessel(rightFacialVeinPoints, venousMaterial, 0.07));
    }

    /**
     * Create a blood vessel using tube geometry
     */
    createVessel(points, material, radius) {
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, radius, 8, false);
        const vessel = new THREE.Mesh(tubeGeometry, material.clone());
        vessel.userData = { type: 'blood_vessel', radius: radius };
        return vessel;
    }

    /**
     * Create enhanced nervous system with electrical activity simulation
     */
    async createEnhancedNerveSystem() {
        const nerveGroup = new THREE.Group();
        nerveGroup.userData = { layer: 'nerve', selectable: true };

        const nerveMaterial = new THREE.MeshPhongMaterial({
            color: 0xf39c12,
            emissive: 0x886611,
            emissiveIntensity: 0.3,
            shininess: 60,
            transparent: true,
            opacity: this.layers.nerve.opacity
        });

        // Create trigeminal nerve branches
        await this.createTrigeminalNerves(nerveGroup, nerveMaterial);

        // Create facial nerve branches
        await this.createFacialNerves(nerveGroup, nerveMaterial);

        // Create sensory nerve endings
        await this.createSensoryEndings(nerveGroup, nerveMaterial);

        this.layers.nerve.mesh = nerveGroup;
        this.layers.nerve.material = nerveMaterial;
        this.layers.nerve.mesh.visible = this.layers.nerve.visible;
        this.scene.add(this.layers.nerve.mesh);
    }

    /**
     * Create trigeminal nerve branches
     */
    async createTrigeminalNerves(nerveGroup, material) {
        // Infraorbital nerve (V2 branch)
        const leftInfraorbitalPoints = [
            new THREE.Vector3(-4.5, 2.5, 2),
            new THREE.Vector3(-3.8, 2.2, 1.5),
            new THREE.Vector3(-3.2, 1.8, 1),
            new THREE.Vector3(-2.6, 1.4, 0.5),
            new THREE.Vector3(-2, 1, 0.2)
        ];

        const rightInfraorbitalPoints = [
            new THREE.Vector3(4.5, 2.5, 2),
            new THREE.Vector3(3.8, 2.2, 1.5),
            new THREE.Vector3(3.2, 1.8, 1),
            new THREE.Vector3(2.6, 1.4, 0.5),
            new THREE.Vector3(2, 1, 0.2)
        ];

        nerveGroup.add(this.createNerve(leftInfraorbitalPoints, material, 0.04));
        nerveGroup.add(this.createNerve(rightInfraorbitalPoints, material, 0.04));

        // Mental nerve (V3 branch)
        const leftMentalPoints = [
            new THREE.Vector3(-3.5, -2.5, 1.5),
            new THREE.Vector3(-3, -2, 1),
            new THREE.Vector3(-2.5, -1.5, 0.5),
            new THREE.Vector3(-2, -1, 0.2)
        ];

        const rightMentalPoints = [
            new THREE.Vector3(3.5, -2.5, 1.5),
            new THREE.Vector3(3, -2, 1),
            new THREE.Vector3(2.5, -1.5, 0.5),
            new THREE.Vector3(2, -1, 0.2)
        ];

        nerveGroup.add(this.createNerve(leftMentalPoints, material, 0.04));
        nerveGroup.add(this.createNerve(rightMentalPoints, material, 0.04));
    }

    /**
     * Create facial nerve branches
     */
    async createFacialNerves(nerveGroup, material) {
        // Buccal branch
        const leftBuccalPoints = [
            new THREE.Vector3(-5, 1, 3),
            new THREE.Vector3(-4.2, 1.2, 2.5),
            new THREE.Vector3(-3.5, 1.4, 2),
            new THREE.Vector3(-2.8, 1.6, 1.5),
            new THREE.Vector3(-2.2, 1.8, 1)
        ];

        const rightBuccalPoints = [
            new THREE.Vector3(5, 1, 3),
            new THREE.Vector3(4.2, 1.2, 2.5),
            new THREE.Vector3(3.5, 1.4, 2),
            new THREE.Vector3(2.8, 1.6, 1.5),
            new THREE.Vector3(2.2, 1.8, 1)
        ];

        nerveGroup.add(this.createNerve(leftBuccalPoints, material, 0.035));
        nerveGroup.add(this.createNerve(rightBuccalPoints, material, 0.035));

        // Marginal mandibular branch
        const leftMarginalPoints = [
            new THREE.Vector3(-4.5, -1, 2.5),
            new THREE.Vector3(-3.8, -1.2, 2),
            new THREE.Vector3(-3.2, -1.4, 1.5),
            new THREE.Vector3(-2.6, -1.6, 1),
            new THREE.Vector3(-2, -1.8, 0.5)
        ];

        const rightMarginalPoints = [
            new THREE.Vector3(4.5, -1, 2.5),
            new THREE.Vector3(3.8, -1.2, 2),
            new THREE.Vector3(3.2, -1.4, 1.5),
            new THREE.Vector3(2.6, -1.6, 1),
            new THREE.Vector3(2, -1.8, 0.5)
        ];

        nerveGroup.add(this.createNerve(leftMarginalPoints, material, 0.035));
        nerveGroup.add(this.createNerve(rightMarginalPoints, material, 0.035));
    }

    /**
     * Create sensory nerve endings
     */
    async createSensoryEndings(nerveGroup, material) {
        const endingMaterial = material.clone();
        endingMaterial.emissiveIntensity = 0.8;

        // Create nerve ending clusters
        const endingPositions = [
            { pos: [-2, 1.5, 0.3], density: 8 },
            { pos: [2, 1.5, 0.3], density: 8 },
            { pos: [-2, -1.5, 0.3], density: 6 },
            { pos: [2, -1.5, 0.3], density: 6 },
            { pos: [0, 1.8, 0.4], density: 10 },
            { pos: [0, -1.8, 0.4], density: 8 }
        ];

        endingPositions.forEach(cluster => {
            for (let i = 0; i < cluster.density; i++) {
                const endingGeometry = new THREE.SphereGeometry(0.02, 8, 8);
                const ending = new THREE.Mesh(endingGeometry, endingMaterial.clone());

                ending.position.set(
                    cluster.pos[0] + (Math.random() - 0.5) * 0.4,
                    cluster.pos[1] + (Math.random() - 0.5) * 0.4,
                    cluster.pos[2] + (Math.random() - 0.5) * 0.2
                );

                ending.userData = { type: 'nerve_ending' };
                nerveGroup.add(ending);
            }
        });
    }

    /**
     * Create a nerve using tube geometry
     */
    createNerve(points, material, radius) {
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, 15, radius, 6, false);
        const nerve = new THREE.Mesh(tubeGeometry, material.clone());
        nerve.userData = { type: 'nerve', radius: radius };
        return nerve;
    }

    /**
     * Create bone structure (maxilla and mandible)
     */
    async createBoneStructure() {
        const boneGroup = new THREE.Group();
        boneGroup.userData = { layer: 'bone', selectable: true };

        const boneMaterial = new THREE.MeshPhongMaterial({
            color: 0xecf0f1,
            shininess: 30,
            transparent: true,
            opacity: this.layers.bone.opacity
        });

        // Create maxilla (upper jaw)
        const maxillaGeometry = this.createMaxillaGeometry();
        const maxilla = new THREE.Mesh(maxillaGeometry, boneMaterial);
        maxilla.position.set(0, 1, -1);
        maxilla.userData = { name: '上颌骨', type: 'bone' };
        boneGroup.add(maxilla);

        // Create mandible (lower jaw)
        const mandibleGeometry = this.createMandibleGeometry();
        const mandible = new THREE.Mesh(mandibleGeometry, boneMaterial.clone());
        mandible.position.set(0, -1, -1);
        mandible.userData = { name: '下颌骨', type: 'bone' };
        boneGroup.add(mandible);

        this.layers.bone.mesh = boneGroup;
        this.layers.bone.material = boneMaterial;
        this.layers.bone.mesh.visible = this.layers.bone.visible;
        this.scene.add(this.layers.bone.mesh);
    }

    /**
     * Create maxilla geometry
     */
    createMaxillaGeometry() {
        const shape = new THREE.Shape();

        // Simplified maxilla outline
        shape.moveTo(-4, 0);
        shape.bezierCurveTo(-4, 1, -3, 2, -2, 2.5);
        shape.bezierCurveTo(-1, 2.8, 1, 2.8, 2, 2.5);
        shape.bezierCurveTo(3, 2, 4, 1, 4, 0);
        shape.bezierCurveTo(4, -0.5, 3, -1, 2, -1.2);
        shape.bezierCurveTo(1, -1.3, -1, -1.3, -2, -1.2);
        shape.bezierCurveTo(-3, -1, -4, -0.5, -4, 0);

        const extrudeSettings = {
            depth: 1.5,
            bevelEnabled: true,
            bevelSegments: 4,
            steps: 8,
            bevelSize: 0.1,
            bevelThickness: 0.05
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }

    /**
     * Create mandible geometry
     */
    createMandibleGeometry() {
        const shape = new THREE.Shape();

        // Simplified mandible outline
        shape.moveTo(-3.5, 0);
        shape.bezierCurveTo(-3.5, -0.8, -3, -1.5, -2.5, -2);
        shape.bezierCurveTo(-1.5, -2.3, 1.5, -2.3, 2.5, -2);
        shape.bezierCurveTo(3, -1.5, 3.5, -0.8, 3.5, 0);
        shape.bezierCurveTo(3.5, 0.5, 3, 0.8, 2, 1);
        shape.bezierCurveTo(1, 1.1, -1, 1.1, -2, 1);
        shape.bezierCurveTo(-3, 0.8, -3.5, 0.5, -3.5, 0);

        const extrudeSettings = {
            depth: 1.2,
            bevelEnabled: true,
            bevelSegments: 4,
            steps: 6,
            bevelSize: 0.08,
            bevelThickness: 0.04
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }

    /**
     * Create enhanced injection points with detailed information
     */
    createInjectionPoints() {
        const injectionPointGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const injectionPointMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });

        // Enhanced injection points with medical guidelines
        const keyPoints = [
            {
                pos: [-1.8, 1.2, 0.5],
                name: '上唇峰点左侧',
                description: '注射深度：2-3mm，剂量：0.1-0.2ml',
                risk: 'low',
                technique: '线性逆行注射'
            },
            {
                pos: [1.8, 1.2, 0.5],
                name: '上唇峰点右侧',
                description: '注射深度：2-3mm，剂量：0.1-0.2ml',
                risk: 'low',
                technique: '线性逆行注射'
            },
            {
                pos: [0, 1.4, 0.5],
                name: '唇珠增强点',
                description: '注射深度：1-2mm，剂量：0.05-0.1ml',
                risk: 'medium',
                technique: '点状注射'
            },
            {
                pos: [-2.2, 0.2, 0.5],
                name: '左侧口角',
                description: '注射深度：3-4mm，剂量：0.1ml',
                risk: 'high',
                technique: '扇形注射，避开血管'
            },
            {
                pos: [2.2, 0.2, 0.5],
                name: '右侧口角',
                description: '注射深度：3-4mm，剂量：0.1ml',
                risk: 'high',
                technique: '扇形注射，避开血管'
            },
            {
                pos: [-1.5, -1.2, 0.5],
                name: '下唇左侧',
                description: '注射深度：2-3mm，剂量：0.1-0.15ml',
                risk: 'low',
                technique: '线性逆行注射'
            },
            {
                pos: [1.5, -1.2, 0.5],
                name: '下唇右侧',
                description: '注射深度：2-3mm，剂量：0.1-0.15ml',
                risk: 'low',
                technique: '线性逆行注射'
            },
            {
                pos: [0, -1.4, 0.5],
                name: '下唇中央',
                description: '注射深度：1-2mm，剂量：0.05-0.1ml',
                risk: 'medium',
                technique: '点状注射'
            }
        ];

        keyPoints.forEach((point, index) => {
            const sphere = new THREE.Mesh(injectionPointGeometry, injectionPointMaterial.clone());
            sphere.position.set(...point.pos);

            // Color code by risk level
            if (point.risk === 'high') {
                sphere.material.color.setHex(0xff0000);
                sphere.material.emissive.setHex(0x660000);
            } else if (point.risk === 'medium') {
                sphere.material.color.setHex(0xffff00);
                sphere.material.emissive.setHex(0x666600);
            }

            sphere.userData = {
                ...point,
                type: 'injection_point',
                id: index
            };

            this.injectionPoints.push(sphere);
            this.scene.add(sphere);
        });
    }

    /**
     * Create anatomical annotations with detailed medical information
     */
    createAnatomicalAnnotations() {
        const annotationData = [
            {
                pos: [0, 1.8, 1],
                title: '唇珠 (Cupid\'s Bow)',
                description: '上唇中央的V形结构，是唇部美学的关键标志点。注射时需保持其自然形态。',
                medicalInfo: '解剖标志：口轮匝肌纤维交汇处\n血管分布：上唇动脉分支\n神经支配：上唇神经'
            },
            {
                pos: [-2.5, 0.2, 1],
                title: '口角 (Oral Commissure)',
                description: '上下唇交汇处，控制面部表情。此区域血管神经丰富，注射需格外谨慎。',
                medicalInfo: '肌肉：口角降肌、口角提肌\n血管：面动脉分支\n风险：面神经损伤'
            },
            {
                pos: [0, -1.8, 1],
                title: '下唇红唇缘',
                description: '下唇的边界线，决定唇形的整体轮廓。注射时需保持对称性。',
                medicalInfo: '解剖特点：丰富的感觉神经末梢\n美学要求：与上唇比例1:1.6\n注射技巧：沿红唇缘线性注射'
            },
            {
                pos: [2, 1.2, 1],
                title: '上唇峰 (Lip Peak)',
                description: '上唇的最高点，是唇部立体感的重要组成部分。',
                medicalInfo: '解剖位置：犬齿尖对应处\n肌肉：上唇提肌\n注射要点：避免过度填充导致僵硬'
            },
            {
                pos: [0, 0, 1.5],
                title: '口轮匝肌群',
                description: '环绕口部的肌肉群，控制唇部的所有动作。是注射治疗的重要考虑因素。',
                medicalInfo: '功能：闭唇、撅嘴、发音\n纤维方向：环形排列\n注射影响：可能改变唇部动态'
            }
        ];

        annotationData.forEach((annotation, index) => {
            // Create 3D annotation marker
            const markerGeometry = new THREE.SphereGeometry(0.05, 12, 12);
            const markerMaterial = new THREE.MeshPhongMaterial({
                color: 0xff6b9d,
                emissive: 0xff6b9d,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.8
            });

            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(...annotation.pos);
            marker.userData = {
                ...annotation,
                type: 'annotation',
                id: index
            };

            this.annotations.push(marker);
            this.scene.add(marker);

            // Create HTML annotation hotspot
            this.createAnnotationHotspot(annotation, index);
        });
    }

    /**
     * Create HTML annotation hotspot
     */
    createAnnotationHotspot(annotation, index) {
        const hotspot = document.createElement('div');
        hotspot.className = 'annotation-hotspot';
        hotspot.id = `annotation-${index}`;
        hotspot.dataset.annotationId = index;

        const popup = document.createElement('div');
        popup.className = 'annotation-popup';
        popup.innerHTML = `
            <h4>${annotation.title}</h4>
            <p>${annotation.description}</p>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">
                <strong>医学信息：</strong><br>
                <pre style="font-size: 12px; white-space: pre-wrap; font-family: inherit;">${annotation.medicalInfo}</pre>
            </div>
        `;

        hotspot.appendChild(popup);
        document.body.appendChild(hotspot);

        // Add interaction events
        hotspot.addEventListener('mouseenter', () => {
            popup.classList.add('visible');
        });

        hotspot.addEventListener('mouseleave', () => {
            popup.classList.remove('visible');
        });

        this.hotspots.push({ element: hotspot, annotation: annotation });
    }

    /**
     * Setup interaction systems
     */
    setupInteractionSystems() {
        // Setup raycasting for object selection
        this.setupRaycasting();

        // Setup layer visibility controls
        this.setupLayerControls();

        // Setup viewing mode controls
        this.setupViewingModes();

        // Setup procedure controls
        this.setupProcedureControls();
    }

    /**
     * Setup raycasting for interactive selection
     */
    setupRaycasting() {
        this.selectableObjects = [
            ...this.injectionPoints,
            ...this.annotations,
            this.layers.skin.mesh,
            this.layers.muscle.mesh,
            this.layers.vessel.mesh,
            this.layers.nerve.mesh,
            this.layers.bone.mesh
        ].filter(obj => obj !== null);
    }

    /**
     * Setup layer visibility and opacity controls
     */
    setupLayerControls() {
        Object.keys(this.layers).forEach(layerName => {
            const checkbox = document.getElementById(`layer-${layerName}`);
            const opacitySlider = document.getElementById(`${layerName}-opacity`);

            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.toggleLayer(layerName, e.target.checked);
                });
            }

            if (opacitySlider) {
                opacitySlider.addEventListener('input', (e) => {
                    const opacity = e.target.value / 100;
                    this.setLayerOpacity(layerName, opacity);
                });
            }
        });
    }

    /**
     * Toggle layer visibility with smooth animation
     */
    toggleLayer(layerName, visible) {
        const layer = this.layers[layerName];
        if (!layer || !layer.mesh) return;

        if (visible) {
            layer.mesh.visible = true;
            layer.visible = true;
            this.animateLayerOpacity(layer.mesh, 0, layer.opacity, 500);
        } else {
            this.animateLayerOpacity(layer.mesh, layer.opacity, 0, 500, () => {
                layer.mesh.visible = false;
                layer.visible = false;
            });
        }

        this.updateLayerCount();
    }

    /**
     * Set layer opacity
     */
    setLayerOpacity(layerName, opacity) {
        const layer = this.layers[layerName];
        if (!layer || !layer.mesh) return;

        layer.opacity = opacity;

        if (layer.mesh.material) {
            layer.mesh.material.opacity = opacity;
            layer.mesh.material.transparent = opacity < 1;
        } else if (layer.mesh.children) {
            layer.mesh.traverse(child => {
                if (child.material) {
                    child.material.opacity = opacity;
                    child.material.transparent = opacity < 1;
                }
            });
        }
    }

    /**
     * Animate layer opacity change
     */
    animateLayerOpacity(mesh, fromOpacity, toOpacity, duration, callback) {
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentOpacity = fromOpacity + (toOpacity - fromOpacity) * this.easeInOut(progress);

            if (mesh.material) {
                mesh.material.opacity = currentOpacity;
                mesh.material.transparent = currentOpacity < 1;
            } else if (mesh.children) {
                mesh.traverse(child => {
                    if (child.material) {
                        child.material.opacity = currentOpacity;
                        child.material.transparent = currentOpacity < 1;
                    }
                });
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (callback) {
                callback();
            }
        };

        animate();
    }

    /**
     * Easing function for smooth animations
     */
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Setup viewing mode controls
     */
    setupViewingModes() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.switchViewMode(e.target.dataset.mode);
            });
        });
    }

    /**
     * Switch between different viewing modes
     */
    switchViewMode(mode) {
        switch(mode) {
            case 'normal':
                this.setNormalView();
                break;
            case 'xray':
                this.setXRayView();
                break;
            case 'section':
                this.setSectionView();
                break;
            case 'animation':
                this.startAnatomicalAnimation();
                break;
        }
    }

    /**
     * Set normal viewing mode
     */
    setNormalView() {
        // Reset all materials to normal
        Object.values(this.layers).forEach(layer => {
            if (layer.mesh && layer.material) {
                layer.material.transparent = layer.opacity < 1;
                layer.material.opacity = layer.opacity;
            }
        });

        // Disable clipping planes
        this.renderer.clippingPlanes = [];
        this.renderer.localClippingEnabled = false;
    }

    /**
     * Set X-ray viewing mode
     */
    setXRayView() {
        // Make skin semi-transparent
        if (this.layers.skin.mesh) {
            this.setLayerOpacity('skin', 0.3);
        }

        // Show internal structures
        ['muscle', 'vessel', 'nerve', 'bone'].forEach(layerName => {
            const layer = this.layers[layerName];
            if (layer.mesh) {
                layer.mesh.visible = true;
                layer.visible = true;
                this.animateLayerOpacity(layer.mesh, 0, layer.opacity, 500);
            }
        });

        this.updateLayerCount();
    }

    /**
     * Set section viewing mode with animated clipping
     */
    setSectionView() {
        // Create animated clipping plane
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 2);
        this.renderer.clippingPlanes = [plane];
        this.renderer.localClippingEnabled = true;

        // Animate the clipping plane
        let position = 2;
        const animateSection = () => {
            position -= 0.03;
            plane.constant = position;

            if (position > -2) {
                requestAnimationFrame(animateSection);
            } else {
                // Reset for loop
                position = 2;
                setTimeout(() => animateSection(), 1000);
            }
        };

        animateSection();
    }

    /**
     * Start anatomical animation sequence
     */
    startAnatomicalAnimation() {
        const animationSequence = [
            { layer: 'skin', delay: 0, action: 'fadeToTransparent', opacity: 0.3 },
            { layer: 'muscle', delay: 1000, action: 'fadeIn', opacity: 0.8 },
            { layer: 'vessel', delay: 2000, action: 'fadeIn', opacity: 0.8 },
            { layer: 'nerve', delay: 3000, action: 'fadeIn', opacity: 0.8 },
            { layer: 'bone', delay: 4000, action: 'fadeIn', opacity: 0.9 },
            { layer: 'muscle', delay: 5000, action: 'pulse', duration: 3000 },
            { layer: 'vessel', delay: 5500, action: 'flow', duration: 5000 },
            { layer: 'nerve', delay: 6000, action: 'electricalActivity', duration: 4000 }
        ];

        animationSequence.forEach(step => {
            setTimeout(() => {
                this.executeAnimationStep(step);
            }, step.delay);
        });
    }

    /**
     * Execute individual animation step
     */
    executeAnimationStep(step) {
        const layer = this.layers[step.layer];
        if (!layer || !layer.mesh) return;

        switch(step.action) {
            case 'fadeIn':
                layer.mesh.visible = true;
                layer.visible = true;
                this.animateLayerOpacity(layer.mesh, 0, step.opacity, 1000);
                break;

            case 'fadeToTransparent':
                this.animateLayerOpacity(layer.mesh, layer.opacity, step.opacity, 1000);
                break;

            case 'pulse':
                this.pulseLayer(layer.mesh, step.duration);
                break;

            case 'flow':
                this.animateBloodFlow(layer.mesh, step.duration);
                break;

            case 'electricalActivity':
                this.animateNerveActivity(layer.mesh, step.duration);
                break;
        }
    }

    /**
     * Create pulsing animation for muscle layer
     */
    pulseLayer(mesh, duration) {
        const startTime = Date.now();
        const originalScale = { x: 1, y: 1, z: 1 };

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed % 1000) / 1000;
            const pulseScale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;

            if (mesh) {
                mesh.scale.set(pulseScale, pulseScale, pulseScale);
            }

            if (elapsed < duration) {
                requestAnimationFrame(animate);
            } else {
                mesh.scale.set(originalScale.x, originalScale.y, originalScale.z);
            }
        };

        animate();
    }

    /**
     * Animate blood flow in vessels
     */
    animateBloodFlow(vesselGroup, duration) {
        if (!vesselGroup || !vesselGroup.children) return;

        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;

            vesselGroup.children.forEach((vessel, index) => {
                if (vessel.material) {
                    const flowPhase = (elapsed * 0.002 + index * 0.5) % (Math.PI * 2);
                    const intensity = Math.sin(flowPhase) * 0.3 + 0.7;
                    vessel.material.emissiveIntensity = intensity * 0.4;

                    // Simulate blood flow direction
                    const flowDirection = Math.sin(flowPhase) * 0.1;
                    vessel.material.color.setHSL(0, 1, 0.3 + flowDirection);
                }
            });

            if (elapsed < duration) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * Animate electrical activity in nerves
     */
    animateNerveActivity(nerveGroup, duration) {
        if (!nerveGroup || !nerveGroup.children) return;

        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;

            nerveGroup.children.forEach((nerve, index) => {
                if (nerve.material) {
                    const signalPhase = (elapsed * 0.005 + index * 0.3) % (Math.PI * 4);
                    const intensity = Math.max(0, Math.sin(signalPhase)) * 0.8 + 0.2;
                    nerve.material.emissiveIntensity = intensity;

                    // Create electrical pulse effect
                    if (Math.sin(signalPhase) > 0.8) {
                        nerve.material.color.setHex(0xffffff);
                    } else {
                        nerve.material.color.setHex(0xf39c12);
                    }
                }
            });

            if (elapsed < duration) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * Setup procedure animation controls
     */
    setupProcedureControls() {
        document.querySelectorAll('.procedure-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const procedure = e.currentTarget.dataset.procedure;
                this.startProcedureAnimation(procedure);
            });
        });
    }

    /**
     * Start procedure animation
     */
    startProcedureAnimation(procedureType) {
        this.currentProcedure = procedureType;

        // Reset any existing procedure
        this.resetProcedureVisualization();

        switch(procedureType) {
            case 'filler-injection':
                this.animateFillerInjection();
                break;
            case 'botox-injection':
                this.animateBotoxInjection();
                break;
            case 'thread-lift':
                this.animateThreadLift();
                break;
            case 'lip-surgery':
                this.animateLipSurgery();
                break;
        }
    }

    /**
     * Animate filler injection procedure
     */
    animateFillerInjection() {
        const steps = [
            { text: '步骤1：标记注射点', duration: 2000 },
            { text: '步骤2：消毒皮肤', duration: 1500 },
            { text: '步骤3：局部麻醉', duration: 2000 },
            { text: '步骤4：进针注射', duration: 3000 },
            { text: '步骤5：塑形按摩', duration: 2000 },
            { text: '步骤6：完成治疗', duration: 1000 }
        ];

        this.executeStepByStepProcedure(steps, this.visualizeFillerInjection.bind(this));
    }

    /**
     * Animate botox injection procedure
     */
    animateBotoxInjection() {
        const steps = [
            { text: '步骤1：评估肌肉活动', duration: 2000 },
            { text: '步骤2：标记注射点', duration: 1500 },
            { text: '步骤3：准备肉毒素', duration: 1000 },
            { text: '步骤4：精确注射', duration: 2500 },
            { text: '步骤5：观察效果', duration: 2000 }
        ];

        this.executeStepByStepProcedure(steps, this.visualizeBotoxInjection.bind(this));
    }

    /**
     * Execute step-by-step procedure animation
     */
    executeStepByStepProcedure(steps, visualizationCallback) {
        let currentStep = 0;
        let startTime = Date.now();
        let totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

        const progressBar = document.getElementById('procedure-progress');

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / totalDuration) * 100, 100);

            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }

            // Update info panel with current step
            const infoPanel = document.querySelector('.info-content');
            if (infoPanel && currentStep < steps.length) {
                infoPanel.textContent = steps[currentStep].text;
            }

            if (progress < 100) {
                requestAnimationFrame(updateProgress);
            }
        };

        // Start the step sequence
        let cumulativeDelay = 0;
        steps.forEach((step, index) => {
            setTimeout(() => {
                currentStep = index;
                if (visualizationCallback) {
                    visualizationCallback(index, step);
                }
            }, cumulativeDelay);
            cumulativeDelay += step.duration;
        });

        updateProgress();
    }

    /**
     * Visualize filler injection procedure
     */
    visualizeFillerInjection(stepIndex, step) {
        switch(stepIndex) {
            case 0: // Mark injection points
                this.highlightInjectionPoints();
                break;
            case 1: // Disinfection
                this.showDisinfectionEffect();
                break;
            case 2: // Local anesthesia
                this.showAnesthesiaEffect();
                break;
            case 3: // Injection
                this.showFillerInjectionEffect();
                break;
            case 4: // Shaping massage
                this.showMassageEffect();
                break;
            case 5: // Complete
                this.showCompletionEffect();
                break;
        }
    }

    /**
     * Highlight injection points
     */
    highlightInjectionPoints() {
        this.injectionPoints.forEach((point, index) => {
            setTimeout(() => {
                this.pulseObject(point, 1000);
                this.outlinePass.selectedObjects = [point];
            }, index * 200);
        });
    }

    /**
     * Show disinfection effect
     */
    showDisinfectionEffect() {
        // Create visual effect for skin disinfection
        const disinfectionMaterial = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.3
        });

        const disinfectionGeometry = new THREE.SphereGeometry(4, 32, 32);
        const disinfectionEffect = new THREE.Mesh(disinfectionGeometry, disinfectionMaterial);
        disinfectionEffect.position.set(0, 0, 0);

        this.scene.add(disinfectionEffect);

        // Animate the effect
        let opacity = 0.3;
        const fadeOut = () => {
            opacity -= 0.01;
            disinfectionMaterial.opacity = opacity;

            if (opacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(disinfectionEffect);
            }
        };

        setTimeout(fadeOut, 1000);
    }

    /**
     * Show anesthesia effect
     */
    showAnesthesiaEffect() {
        // Temporarily reduce skin opacity to show anesthesia
        if (this.layers.skin.mesh) {
            const originalOpacity = this.layers.skin.material.opacity;
            this.animateLayerOpacity(this.layers.skin.mesh, originalOpacity, 0.6, 1000, () => {
                setTimeout(() => {
                    this.animateLayerOpacity(this.layers.skin.mesh, 0.6, originalOpacity, 1000);
                }, 1000);
            });
        }
    }

    /**
     * Show filler injection effect
     */
    showFillerInjectionEffect() {
        // Create filler visualization
        this.injectionPoints.forEach((point, index) => {
            setTimeout(() => {
                this.createFillerVisualization(point.position);
            }, index * 400);
        });
    }

    /**
     * Create filler visualization at injection point
     */
    createFillerVisualization(position) {
        const fillerGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const fillerMaterial = new THREE.MeshPhongMaterial({
            color: 0xff69b4,
            transparent: true,
            opacity: 0.7,
            emissive: 0xff69b4,
            emissiveIntensity: 0.2
        });

        const filler = new THREE.Mesh(fillerGeometry, fillerMaterial);
        filler.position.copy(position);
        this.scene.add(filler);

        // Animate filler integration
        let scale = 0.1;
        const animate = () => {
            scale += 0.02;
            filler.scale.set(scale, scale, scale);
            fillerMaterial.opacity = Math.max(0, 0.7 - scale * 0.1);

            if (scale < 2) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(filler);
            }
        };

        animate();
    }

    /**
     * Setup gesture support for touch devices
     */
    setupGestureSupport() {
        if (!this.touchEnabled) return;

        const canvas = this.renderer.domElement;

        // Touch event listeners
        canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        canvas.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });

        // Gesture recognition
        this.gestureRecognizer = new GestureRecognizer();
    }

    /**
     * Handle touch start events
     */
    onTouchStart(event) {
        event.preventDefault();

        const touches = Array.from(event.touches);
        this.gestureState.lastTouches = touches.map(touch => ({
            x: touch.clientX,
            y: touch.clientY,
            identifier: touch.identifier
        }));

        if (touches.length === 1) {
            // Single touch - rotation
            this.gestureState.isRotating = true;
            this.showGestureIndicator('旋转模式');
        } else if (touches.length === 2) {
            // Two finger - zoom/pan
            this.gestureState.isZooming = true;
            this.gestureState.isPanning = true;
            this.showGestureIndicator('缩放/平移模式');
        }
    }

    /**
     * Handle touch move events
     */
    onTouchMove(event) {
        event.preventDefault();

        const touches = Array.from(event.touches);

        if (touches.length === 1 && this.gestureState.isRotating) {
            this.handleSingleTouchRotation(touches[0]);
        } else if (touches.length === 2 && this.gestureState.isZooming) {
            this.handleTwoFingerGestures(touches);
        }

        // Update last touches
        this.gestureState.lastTouches = touches.map(touch => ({
            x: touch.clientX,
            y: touch.clientY,
            identifier: touch.identifier
        }));
    }

    /**
     * Handle touch end events
     */
    onTouchEnd(event) {
        event.preventDefault();

        this.gestureState.isRotating = false;
        this.gestureState.isZooming = false;
        this.gestureState.isPanning = false;

        this.hideGestureIndicator();
    }

    /**
     * Handle single touch rotation
     */
    handleSingleTouchRotation(touch) {
        if (this.gestureState.lastTouches.length === 0) return;

        const lastTouch = this.gestureState.lastTouches[0];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;

        // Rotate camera around target
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(this.camera.position.clone().sub(this.controls.target));

        spherical.theta -= deltaX * 0.01 * this.gestureState.rotationSpeed;
        spherical.phi += deltaY * 0.01 * this.gestureState.rotationSpeed;

        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        this.camera.position.setFromSpherical(spherical).add(this.controls.target);
        this.camera.lookAt(this.controls.target);
    }

    /**
     * Handle two finger gestures (zoom and pan)
     */
    handleTwoFingerGestures(touches) {
        if (this.gestureState.lastTouches.length < 2) return;

        const touch1 = touches[0];
        const touch2 = touches[1];
        const lastTouch1 = this.gestureState.lastTouches[0];
        const lastTouch2 = this.gestureState.lastTouches[1];

        // Calculate current and previous distances for zoom
        const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        const lastDistance = Math.sqrt(
            Math.pow(lastTouch2.x - lastTouch1.x, 2) +
            Math.pow(lastTouch2.y - lastTouch1.y, 2)
        );

        // Zoom
        if (Math.abs(currentDistance - lastDistance) > 5) {
            const zoomFactor = currentDistance / lastDistance;
            const distance = this.camera.position.distanceTo(this.controls.target);
            const newDistance = Math.max(5, Math.min(30, distance / zoomFactor));

            const direction = this.camera.position.clone().sub(this.controls.target).normalize();
            this.camera.position.copy(this.controls.target).add(direction.multiplyScalar(newDistance));
        }

        // Pan
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        const lastCenterX = (lastTouch1.x + lastTouch2.x) / 2;
        const lastCenterY = (lastTouch1.y + lastTouch2.y) / 2;

        const deltaX = centerX - lastCenterX;
        const deltaY = centerY - lastCenterY;

        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
            const panVector = new THREE.Vector3(-deltaX, deltaY, 0);
            panVector.multiplyScalar(0.01);
            panVector.applyQuaternion(this.camera.quaternion);

            this.camera.position.add(panVector);
            this.controls.target.add(panVector);
        }
    }

    /**
     * Show gesture indicator
     */
    showGestureIndicator(text) {
        const indicator = document.getElementById('gesture-indicator');
        if (indicator) {
            indicator.textContent = text;
            indicator.classList.add('visible');
        }
    }

    /**
     * Hide gesture indicator
     */
    hideGestureIndicator() {
        const indicator = document.getElementById('gesture-indicator');
        if (indicator) {
            indicator.classList.remove('visible');
        }
    }

    /**
     * Setup voice narration system
     */
    setupVoiceNarration() {
        // Initialize narration scripts
        this.initializeNarrationScripts();

        // Setup voice control buttons
        document.querySelectorAll('.voice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const narration = e.currentTarget.dataset.narration;
                const action = e.currentTarget.dataset.action;

                if (action === 'toggle') {
                    this.toggleVoiceNarration();
                } else if (narration) {
                    this.playNarration(narration);
                }
            });
        });
    }

    /**
     * Initialize narration scripts
     */
    initializeNarrationScripts() {
        this.narrationScripts.set('overview', {
            text: `欢迎使用高级3D唇部解剖系统。您现在看到的是人体唇部的详细解剖结构。
                   唇部主要由皮肤层、肌肉层、血管系统、神经系统和骨骼结构组成。
                   皮肤层是最外层的保护结构，具有丰富的感觉神经末梢。
                   肌肉层以口轮匝肌为主，控制唇部的各种动作和表情。
                   血管系统为唇部提供充分的血液供应，主要包括上唇动脉和下唇动脉。
                   神经系统负责感觉和运动控制，包括三叉神经和面神经的分支。
                   了解这些解剖结构对于安全有效地进行唇部美容治疗至关重要。`,
            duration: 30000
        });

        this.narrationScripts.set('procedure', {
            text: `唇部填充注射是一种常见的美容医学程序。
                   首先需要进行详细的解剖评估，标记关键的注射点。
                   推荐的注射点包括唇峰、唇珠、口角和唇缘等位置。
                   注射前必须进行严格的消毒和局部麻醉。
                   注射时应采用逆行线性技术或点状注射技术。
                   注射深度通常在皮下2到3毫米，避免血管和神经密集区域。
                   注射后需要进行适当的塑形按摩，确保填充剂均匀分布。
                   整个过程需要严格遵循无菌操作原则。`,
            duration: 25000
        });

        this.narrationScripts.set('safety', {
            text: `唇部注射的安全要点非常重要。
                   首先要避开重要的血管和神经结构，特别是面动脉和三叉神经分支。
                   口角区域风险较高，注射时必须格外谨慎。
                   使用钝针可以降低血管损伤的风险。
                   注射前应进行回抽测试，确保未进入血管腔。
                   如果出现皮肤苍白或疼痛，应立即停止注射。
                   术后需要密切观察，注意血管栓塞等并发症的早期征象。
                   患者教育也很重要，包括术后护理和并发症识别。`,
            duration: 22000
        });
    }

    /**
     * Play voice narration
     */
    playNarration(scriptName) {
        if (!this.speechSynthesis) {
            console.warn('Speech synthesis not supported');
            return;
        }

        // Stop current narration if playing
        this.stopNarration();

        const script = this.narrationScripts.get(scriptName);
        if (!script) {
            console.warn('Narration script not found:', scriptName);
            return;
        }

        this.currentUtterance = new SpeechSynthesisUtterance(script.text);
        this.currentUtterance.lang = 'zh-CN';
        this.currentUtterance.rate = 0.9;
        this.currentUtterance.pitch = 1.0;
        this.currentUtterance.volume = 0.8;

        // Update UI during narration
        this.currentUtterance.onstart = () => {
            document.querySelectorAll('.voice-btn').forEach(btn => {
                btn.classList.add('speaking');
            });
        };

        this.currentUtterance.onend = () => {
            document.querySelectorAll('.voice-btn').forEach(btn => {
                btn.classList.remove('speaking');
            });
            this.currentUtterance = null;
        };

        this.speechSynthesis.speak(this.currentUtterance);
    }

    /**
     * Toggle voice narration
     */
    toggleVoiceNarration() {
        if (this.speechSynthesis.speaking) {
            if (this.speechSynthesis.paused) {
                this.speechSynthesis.resume();
            } else {
                this.speechSynthesis.pause();
            }
        }
    }

    /**
     * Stop voice narration
     */
    stopNarration() {
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
        }

        document.querySelectorAll('.voice-btn').forEach(btn => {
            btn.classList.remove('speaking');
        });

        this.currentUtterance = null;
    }

    /**
     * Setup measurement tools
     */
    setupMeasurementTools() {
        this.measurementPoints = [];
        this.measurements = [];
    }

    /**
     * Start measurement mode
     */
    startMeasurement() {
        this.measurementMode = true;
        this.measurementPoints = [];

        // Update cursor
        document.body.style.cursor = 'crosshair';

        // Show instruction
        this.showGestureIndicator('点击两个点进行距离测量');
    }

    /**
     * Add measurement point
     */
    addMeasurementPoint(point) {
        if (!this.measurementMode) return;

        this.measurementPoints.push(point);

        // Create visual marker
        this.createMeasurementMarker(point);

        if (this.measurementPoints.length === 2) {
            // Calculate and display measurement
            this.completeMeasurement();
        }
    }

    /**
     * Create measurement marker
     */
    createMeasurementMarker(point) {
        const markerElement = document.createElement('div');
        markerElement.className = 'measurement-point';

        // Convert 3D position to screen coordinates
        const screenPosition = this.worldToScreen(point);
        markerElement.style.left = screenPosition.x + 'px';
        markerElement.style.top = screenPosition.y + 'px';

        document.getElementById('measurement-overlay').appendChild(markerElement);
    }

    /**
     * Complete measurement between two points
     */
    completeMeasurement() {
        const point1 = this.measurementPoints[0];
        const point2 = this.measurementPoints[1];

        const distance = point1.distanceTo(point2);
        const realWorldDistance = distance * 10; // Convert to mm (assuming 1 unit = 10mm)

        // Create measurement line and label
        this.createMeasurementLine(point1, point2, realWorldDistance);

        // Update measurement count
        this.measurements.push({ point1, point2, distance: realWorldDistance });
        this.updateMeasurementCount();

        // Reset measurement mode
        this.measurementMode = false;
        this.measurementPoints = [];
        document.body.style.cursor = 'default';
        this.hideGestureIndicator();
    }

    /**
     * Create measurement line between two points
     */
    createMeasurementLine(point1, point2, distance) {
        const screen1 = this.worldToScreen(point1);
        const screen2 = this.worldToScreen(point2);

        const lineElement = document.createElement('div');
        lineElement.className = 'measurement-line';

        const length = Math.sqrt(
            Math.pow(screen2.x - screen1.x, 2) +
            Math.pow(screen2.y - screen1.y, 2)
        );

        const angle = Math.atan2(screen2.y - screen1.y, screen2.x - screen1.x);

        lineElement.style.width = length + 'px';
        lineElement.style.height = '2px';
        lineElement.style.left = screen1.x + 'px';
        lineElement.style.top = screen1.y + 'px';
        lineElement.style.transform = `rotate(${angle}rad)`;

        // Create distance label
        const labelElement = document.createElement('div');
        labelElement.className = 'measurement-label';
        labelElement.textContent = `${distance.toFixed(1)} mm`;
        labelElement.style.left = (screen1.x + screen2.x) / 2 + 'px';
        labelElement.style.top = (screen1.y + screen2.y) / 2 + 'px';

        const overlay = document.getElementById('measurement-overlay');
        overlay.appendChild(lineElement);
        overlay.appendChild(labelElement);
    }

    /**
     * Convert 3D world coordinates to 2D screen coordinates
     */
    worldToScreen(worldPosition) {
        const vector = worldPosition.clone();
        vector.project(this.camera);

        return {
            x: (vector.x + 1) / 2 * window.innerWidth,
            y: -(vector.y - 1) / 2 * window.innerHeight
        };
    }

    /**
     * Setup annotation system
     */
    setupAnnotationSystem() {
        // Update annotation positions when camera moves
        this.updateAnnotationPositions();
    }

    /**
     * Update annotation hotspot positions
     */
    updateAnnotationPositions() {
        this.hotspots.forEach((hotspot, index) => {
            const annotation = this.annotations[index];
            if (annotation) {
                const screenPos = this.worldToScreen(annotation.position);
                hotspot.element.style.left = screenPos.x + 'px';
                hotspot.element.style.top = screenPos.y + 'px';

                // Hide if behind camera
                const worldPos = annotation.position.clone();
                worldPos.project(this.camera);
                hotspot.element.style.display = worldPos.z > 1 ? 'none' : 'block';
            }
        });
    }

    /**
     * Setup comparison mode for before/after visualization
     */
    setupComparisonMode() {
        this.comparisonMode = false;
    }

    /**
     * Show before/after comparison
     */
    showBeforeAfter() {
        this.comparisonMode = true;
        const container = document.getElementById('comparison-container');
        container.style.display = 'block';

        // Capture current state as "before"
        this.captureCurrentState('before');

        // Generate simulated "after" state
        this.generateAfterState();
    }

    /**
     * Capture current model state
     */
    captureCurrentState(type) {
        // Create render target for capturing
        const renderTarget = new THREE.WebGLRenderTarget(
            window.innerWidth / 2,
            window.innerHeight / 2
        );

        // Render current scene to texture
        this.renderer.setRenderTarget(renderTarget);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);

        // Store state
        if (type === 'before') {
            this.beforeState = renderTarget;
        } else {
            this.afterState = renderTarget;
        }
    }

    /**
     * Generate simulated after state
     */
    generateAfterState() {
        // Temporarily modify the model to show post-treatment results
        const originalSkinScale = this.layers.skin.mesh.scale.clone();

        // Simulate lip enhancement
        this.layers.skin.mesh.scale.multiplyScalar(1.1);

        // Capture the modified state
        this.captureCurrentState('after');

        // Restore original state
        this.layers.skin.mesh.scale.copy(originalSkinScale);

        // Display comparison
        this.displayComparison();
    }

    /**
     * Display side-by-side comparison
     */
    displayComparison() {
        const beforeView = document.getElementById('before-view');
        const afterView = document.getElementById('after-view');

        // Create canvas elements for before/after views
        const beforeCanvas = document.createElement('canvas');
        const afterCanvas = document.createElement('canvas');

        beforeCanvas.width = beforeView.clientWidth;
        beforeCanvas.height = beforeView.clientHeight;
        afterCanvas.width = afterView.clientWidth;
        afterCanvas.height = afterView.clientHeight;

        beforeView.appendChild(beforeCanvas);
        afterView.appendChild(afterCanvas);

        // Render before/after states to canvases
        this.renderComparisonState(beforeCanvas, this.beforeState);
        this.renderComparisonState(afterCanvas, this.afterState);
    }

    /**
     * Render comparison state to canvas
     */
    renderComparisonState(canvas, renderTarget) {
        const ctx = canvas.getContext('2d');

        // Create image from render target
        const imageData = new Uint8Array(4 * canvas.width * canvas.height);
        this.renderer.readRenderTargetPixels(
            renderTarget, 0, 0, canvas.width, canvas.height, imageData
        );

        // Convert to ImageData and draw
        const imgData = new ImageData(
            new Uint8ClampedArray(imageData),
            canvas.width,
            canvas.height
        );

        ctx.putImageData(imgData, 0, 0);
    }

    /**
     * Close comparison mode
     */
    closeComparison() {
        this.comparisonMode = false;
        const container = document.getElementById('comparison-container');
        container.style.display = 'none';

        // Clean up render targets
        if (this.beforeState) {
            this.beforeState.dispose();
            this.beforeState = null;
        }
        if (this.afterState) {
            this.afterState.dispose();
            this.afterState = null;
        }
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceStats();
        }, 1000);
    }

    /**
     * Update performance statistics
     */
    updatePerformanceStats() {
        // Calculate FPS
        this.stats.frameCount++;
        const currentTime = performance.now();
        const deltaTime = currentTime - this.stats.lastTime;

        if (deltaTime >= 1000) {
            this.stats.fps = Math.round((this.stats.frameCount * 1000) / deltaTime);
            this.stats.frameCount = 0;
            this.stats.lastTime = currentTime;
        }

        // Get memory usage (if available)
        if (performance.memory) {
            this.stats.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
        }

        // Calculate triangle count
        this.stats.triangleCount = this.calculateTriangleCount();

        // Update display
        this.updatePerformanceDisplay();

        // Adaptive quality adjustment
        if (this.adaptiveQuality) {
            this.adjustQualityBasedOnPerformance();
        }
    }

    /**
     * Calculate total triangle count in scene
     */
    calculateTriangleCount() {
        let triangleCount = 0;

        this.scene.traverse((object) => {
            if (object.geometry) {
                const geometry = object.geometry;
                if (geometry.index) {
                    triangleCount += geometry.index.count / 3;
                } else if (geometry.attributes.position) {
                    triangleCount += geometry.attributes.position.count / 3;
                }
            }
        });

        return Math.round(triangleCount);
    }

    /**
     * Update performance display
     */
    updatePerformanceDisplay() {
        const fpsElement = document.getElementById('fps-value');
        const memoryElement = document.getElementById('memory-value');
        const trianglesElement = document.getElementById('triangles-value');

        if (fpsElement) fpsElement.textContent = this.stats.fps;
        if (memoryElement) memoryElement.textContent = this.stats.memoryUsage;
        if (trianglesElement) trianglesElement.textContent = this.stats.triangleCount.toLocaleString();

        // Color coding for FPS
        if (fpsElement) {
            if (this.stats.fps >= 55) {
                fpsElement.style.color = '#00ff00';
            } else if (this.stats.fps >= 30) {
                fpsElement.style.color = '#feca57';
            } else {
                fpsElement.style.color = '#ff0000';
            }
        }
    }

    /**
     * Adjust quality based on performance
     */
    adjustQualityBasedOnPerformance() {
        if (this.stats.fps < 30 && this.qualityLevel === 'high') {
            this.qualityLevel = 'medium';
            this.adjustRenderingQuality();
        } else if (this.stats.fps > 55 && this.qualityLevel === 'medium') {
            this.qualityLevel = 'high';
            this.adjustRenderingQuality();
        }
    }

    /**
     * Adjust rendering quality settings
     */
    adjustRenderingQuality() {
        // Adjust pixel ratio
        if (this.qualityLevel === 'high') {
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        } else {
            this.renderer.setPixelRatio(1);
        }

        // Adjust shadow quality
        if (this.qualityLevel === 'high') {
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        } else {
            this.renderer.shadowMap.type = THREE.BasicShadowMap;
        }

        // Adjust post-processing
        this.setupPostProcessing();
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Window events
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Mouse events
        const canvas = this.renderer.domElement;
        canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        canvas.addEventListener('click', this.onClick.bind(this));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Tool change events
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentTool = e.currentTarget.dataset.tool;
                this.onToolChange(this.currentTool);
            });
        });

        // Panel toggle
        const panelToggle = document.getElementById('panel-toggle');
        const controlPanel = document.getElementById('control-panel');

        if (panelToggle && controlPanel) {
            panelToggle.addEventListener('click', () => {
                controlPanel.classList.toggle('collapsed');
                panelToggle.style.transform = controlPanel.classList.contains('collapsed')
                    ? 'translateY(-50%) rotate(180deg)'
                    : 'translateY(-50%) rotate(0deg)';
            });
        }

        // Global slider controls
        const globalOpacitySlider = document.getElementById('global-opacity');
        const lightingIntensitySlider = document.getElementById('lighting-intensity');
        const animationSpeedSlider = document.getElementById('animation-speed');

        if (globalOpacitySlider) {
            globalOpacitySlider.addEventListener('input', (e) => {
                const opacity = e.target.value / 100;
                this.setGlobalOpacity(opacity);
            });
        }

        if (lightingIntensitySlider) {
            lightingIntensitySlider.addEventListener('input', (e) => {
                const intensity = e.target.value / 100;
                this.setLightingIntensity(intensity);
            });
        }

        if (animationSpeedSlider) {
            animationSpeedSlider.addEventListener('input', (e) => {
                const speed = e.target.value / 100;
                this.setAnimationSpeed(speed);
            });
        }
    }

    /**
     * Handle mouse movement
     */
    onMouseMove(event) {
        // Update mouse position for raycasting
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update tool cursors
        this.updateToolCursor(event);

        // Check for intersections and highlights
        this.checkIntersections();

        // Update annotation positions
        this.updateAnnotationPositions();
    }

    /**
     * Update tool-specific cursor
     */
    updateToolCursor(event) {
        switch(this.currentTool) {
            case 'inject':
                // Update injection cursor position
                break;
            case 'measure':
                document.body.style.cursor = this.measurementMode ? 'crosshair' : 'default';
                break;
            default:
                document.body.style.cursor = 'default';
                break;
        }
    }

    /**
     * Check for object intersections
     */
    checkIntersections() {
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check intersections with selectable objects
        const intersects = this.raycaster.intersectObjects(this.selectableObjects, true);

        // Reset highlights
        this.outlinePass.selectedObjects = [];

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;

            // Highlight intersected object
            this.outlinePass.selectedObjects = [intersectedObject];

            // Update info panel
            this.updateInfoPanel(intersectedObject);

            // Update cursor
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
            this.updateInfoPanel(null);
        }
    }

    /**
     * Update info panel with object information
     */
    updateInfoPanel(object) {
        const infoTitle = document.querySelector('.info-title');
        const infoContent = document.querySelector('.info-content');

        if (!infoTitle || !infoContent) return;

        if (object && object.userData) {
            const userData = object.userData;

            if (userData.type === 'injection_point') {
                infoTitle.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 2L7 4L14 11L11 14L4 7L2 9V15L9 22L22 9L15 2H9Z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    ${userData.name}
                `;
                infoContent.innerHTML = `
                    <strong>注射信息：</strong><br>
                    ${userData.description}<br><br>
                    <strong>风险等级：</strong> ${userData.risk}<br>
                    <strong>推荐技术：</strong> ${userData.technique}
                `;
            } else if (userData.type === 'annotation') {
                infoTitle.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    ${userData.title}
                `;
                infoContent.innerHTML = userData.description;
            } else if (userData.layer) {
                const layerNames = {
                    skin: '皮肤层',
                    muscle: '肌肉层',
                    vessel: '血管系统',
                    nerve: '神经系统',
                    bone: '骨骼结构'
                };

                infoTitle.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    ${layerNames[userData.layer] || userData.layer}
                `;
                infoContent.textContent = `查看${layerNames[userData.layer]}的详细解剖结构和相关医学信息。`;
            }
        } else {
            infoTitle.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="2"/>
                </svg>
                解剖信息
            `;
            infoContent.textContent = '悬停或点击模型上的任意部位以查看详细的解剖信息和注射建议。';
        }
    }

    /**
     * Handle click events
     */
    onClick(event) {
        switch(this.currentTool) {
            case 'inject':
                this.performInjection(event);
                break;
            case 'measure':
                this.handleMeasurementClick(event);
                break;
            case 'annotate':
                this.handleAnnotationClick(event);
                break;
            case 'compare':
                this.showBeforeAfter();
                break;
            case 'section':
                this.toggleSectionView();
                break;
        }
    }

    /**
     * Handle measurement tool clicks
     */
    handleMeasurementClick(event) {
        if (!this.measurementMode) {
            this.startMeasurement();
            return;
        }

        // Get intersection point
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.selectableObjects, true);

        if (intersects.length > 0) {
            this.addMeasurementPoint(intersects[0].point);
        }
    }

    /**
     * Handle tool changes
     */
    onToolChange(tool) {
        // Reset previous tool state
        this.resetToolState();

        switch(tool) {
            case 'rotate':
                this.controls.enabled = true;
                break;
            case 'inject':
                this.controls.enabled = false;
                break;
            case 'measure':
                this.controls.enabled = true;
                break;
            case 'annotate':
                this.controls.enabled = true;
                break;
            case 'compare':
                this.controls.enabled = true;
                break;
            case 'section':
                this.controls.enabled = true;
                break;
        }
    }

    /**
     * Reset tool state
     */
    resetToolState() {
        // Reset measurement mode
        this.measurementMode = false;
        this.measurementPoints = [];

        // Reset cursor
        document.body.style.cursor = 'default';

        // Clear measurement overlay
        const overlay = document.getElementById('measurement-overlay');
        if (overlay) {
            overlay.innerHTML = '';
        }

        // Hide gesture indicator
        this.hideGestureIndicator();
    }

    /**
     * Perform injection simulation
     */
    performInjection(event) {
        // Get intersection point
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([this.layers.skin.mesh], true);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.createInjectionVisualization(point);

            // Play injection sound (if available)
            this.playInjectionSound();
        }
    }

    /**
     * Create injection visualization effect
     */
    createInjectionVisualization(point) {
        const geometry = new THREE.SphereGeometry(0.2, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.6,
            emissive: 0xff00ff,
            emissiveIntensity: 0.5
        });

        const injection = new THREE.Mesh(geometry, material);
        injection.position.copy(point);
        this.scene.add(injection);

        // Animate injection effect
        let scale = 0.1;
        const animate = () => {
            scale += 0.02;
            injection.scale.set(scale, scale, scale);
            material.opacity = Math.max(0, 0.6 - scale * 0.1);

            if (material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(injection);
            }
        };

        animate();
    }

    /**
     * Update various counters in the UI
     */
    updateLayerCount() {
        const visibleLayers = Object.values(this.layers).filter(layer => layer.visible).length;
        const layerCountElement = document.getElementById('layer-count');
        if (layerCountElement) {
            layerCountElement.textContent = visibleLayers;
        }
    }

    updateMeasurementCount() {
        const measurementCountElement = document.getElementById('measurement-count');
        if (measurementCountElement) {
            measurementCountElement.textContent = this.measurements.length;
        }
    }

    /**
     * Set global opacity for all layers
     */
    setGlobalOpacity(opacity) {
        Object.values(this.layers).forEach(layer => {
            if (layer.mesh && layer.visible) {
                this.setLayerOpacity(layer.mesh.userData.layer, opacity * layer.opacity);
            }
        });
    }

    /**
     * Set lighting intensity
     */
    setLightingIntensity(intensity) {
        this.scene.traverse((object) => {
            if (object.isLight && object.type !== 'AmbientLight') {
                object.intensity = object.userData.originalIntensity * intensity;
            }
        });
    }

    /**
     * Set animation speed
     */
    setAnimationSpeed(speed) {
        this.animationMixers.forEach(mixer => {
            mixer.timeScale = speed;
        });
    }

    /**
     * Create utility functions for object manipulation
     */
    pulseObject(object, duration) {
        const originalScale = object.scale.clone();
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed % 1000) / 1000;
            const pulseScale = 1 + Math.sin(progress * Math.PI * 2) * 0.2;

            object.scale.copy(originalScale).multiplyScalar(pulseScale);

            if (elapsed < duration) {
                requestAnimationFrame(animate);
            } else {
                object.scale.copy(originalScale);
            }
        };

        animate();
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);

        // Update post-processing passes
        this.outlinePass.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Hide loading screen with animation
     */
    async hideLoadingScreen() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        resolve();
                    }, 500);
                } else {
                    resolve();
                }
            }, 1000);
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10001;
            text-align: center;
            font-size: 16px;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }

    /**
     * Main animation loop with performance optimization
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        // Update controls
        if (this.controls.enabled) {
            this.controls.update();
        }

        // Update animation mixers
        this.animationMixers.forEach(mixer => mixer.update(deltaTime));

        // Update dynamic effects
        this.updateDynamicEffects();

        // Update annotation positions
        this.updateAnnotationPositions();

        // Performance optimization: skip rendering if FPS is too low
        if (this.stats.fps < 15 && this.adaptiveQuality) {
            return;
        }

        // Render the scene
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }

        // Update performance stats
        this.stats.frameCount++;
    }

    /**
     * Update dynamic visual effects
     */
    updateDynamicEffects() {
        const time = Date.now() * 0.001;

        // Blood vessel pulsation
        if (this.layers.vessel && this.layers.vessel.mesh && this.layers.vessel.visible) {
            this.layers.vessel.mesh.children.forEach((vessel, index) => {
                if (vessel.material) {
                    const pulse = Math.sin(time * 2 + index * 0.5) * 0.2 + 0.8;
                    vessel.material.emissiveIntensity = pulse * 0.3;
                }
            });
        }

        // Nerve electrical activity
        if (this.layers.nerve && this.layers.nerve.mesh && this.layers.nerve.visible) {
            this.layers.nerve.mesh.children.forEach((nerve, index) => {
                if (nerve.material) {
                    const signal = Math.sin(time * 3 + index * 0.8) * 0.3 + 0.7;
                    nerve.material.emissiveIntensity = signal * 0.4;
                }
            });
        }

        // Injection point glow
        this.injectionPoints.forEach((point, index) => {
            if (point.material) {
                const glow = Math.sin(time * 1.5 + index) * 0.3 + 0.7;
                point.material.emissiveIntensity = glow * 0.5;
            }
        });
    }
}

/**
 * Gesture Recognition System for touch devices
 */
class GestureRecognizer {
    constructor() {
        this.gestures = new Map();
        this.currentGesture = null;
        this.threshold = 50; // Minimum distance for gesture recognition
    }

    recognize(touches) {
        if (touches.length === 1) {
            return 'rotate';
        } else if (touches.length === 2) {
            const distance = this.calculateDistance(touches[0], touches[1]);
            return distance > this.threshold ? 'zoom' : 'pan';
        }
        return null;
    }

    calculateDistance(touch1, touch2) {
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    }
}

/**
 * Global functions for HTML interface
 */
window.closeComparison = function() {
    if (window.enhancedLipModel) {
        window.enhancedLipModel.closeComparison();
    }
};

/**
 * Initialize the application when DOM is loaded
 */
window.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new EnhancedLipAnatomyModel();
        window.enhancedLipModel = app; // Expose to global for debugging and external access

        console.log('Enhanced 3D Lip Anatomy Model initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Enhanced 3D Lip Anatomy Model:', error);
    }
});

// Export for module usage
export { EnhancedLipAnatomyModel };