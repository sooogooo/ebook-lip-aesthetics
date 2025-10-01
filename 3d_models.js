import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

// Import our advanced rendering systems
import { MedicalMaterialSystem } from './advanced_medical_shaders.js';
import { MedicalLODManager } from './medical_lod_system.js';
import { MedicalMeshLoader } from './mesh_compression_system.js';
import { MedicalLightingSystem, MedicalMaterialSystem as AdvancedMaterials } from './advanced_lighting_materials.js';
import { RenderingThreadManager, ParallelRenderManager, WebGPUComputeManager } from './multi_threaded_rendering.js';

// 3D模型管理器 - Enhanced with Advanced Rendering Systems
class LipAnatomyModel {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.composer = null;
        this.outlinePass = null;
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

        // Performance and quality settings
        this.qualitySettings = {
            renderQuality: 'high',
            shadows: true,
            postProcessing: true,
            multiThreading: true,
            adaptiveQuality: true,
            targetFPS: 60
        };

        // Medical simulation settings
        this.medicalSettings = {
            subsurfaceScattering: true,
            volumetricRendering: false,
            realTimeDeformation: true,
            tissuePhysics: true,
            bloodFlow: true,
            nerveActivity: true
        };

        this.init();
    }

    async init() {
        // 创建基础场景
        this.setupScene();

        // 创建相机
        this.setupCamera();

        // 创建渲染器
        this.setupRenderer();

        // 初始化高级渲染系统
        await this.initializeAdvancedSystems();

        // 创建控制器
        this.setupControls();

        // 创建高级灯光系统
        this.setupAdvancedLights();

        // 后处理效果
        this.setupPostProcessing();

        // 创建高级唇部模型
        await this.createAdvancedLipModel();

        // 绑定事件
        this.bindEvents();

        // 开始高级动画循环
        this.animate();

        // 隐藏加载界面
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => loadingScreen.style.display = 'none', 500);
            }
        }, 2000);
    }

    /**
     * Initialize advanced rendering systems
     */
    async initializeAdvancedSystems() {
        console.log('Initializing advanced medical rendering systems...');

        // Initialize material system
        this.materialSystem = new MedicalMaterialSystem();
        this.advancedMaterials = new AdvancedMaterials(this.renderer);

        // Initialize mesh loader with compression
        this.meshLoader = new MedicalMeshLoader(this.renderer);

        // Initialize LOD manager
        this.lodManager = new MedicalLODManager(this.renderer, this.camera);

        // Initialize lighting system
        this.lightingSystem = new MedicalLightingSystem(this.scene, this.renderer);

        // Initialize multi-threading if supported
        if (this.qualitySettings.multiThreading && typeof Worker !== 'undefined') {
            this.renderingThreadManager = new RenderingThreadManager(this.renderer, this.scene, this.camera);
            this.parallelRenderManager = new ParallelRenderManager(
                this.renderingThreadManager, this.renderer, this.scene, this.camera
            );
        }

        // Initialize WebGPU compute if supported
        this.webGPUCompute = new WebGPUComputeManager();

        console.log('Advanced systems initialized successfully');
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e1e2e);

        // 添加环境贴图
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    }

    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        const container = document.getElementById('canvas-container');
        container.appendChild(this.renderer.domElement);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 30;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.target.set(0, 0, 0);
    }

    setupAdvancedLights() {
        // The advanced lighting system is already initialized and handles lighting
        // Set lighting preset for medical examination
        if (this.lightingSystem) {
            this.lightingSystem.setLightingPreset('examination');
        }
    }

    /**
     * Create advanced lip model with all new systems
     */
    async createAdvancedLipModel() {
        console.log('Creating advanced lip anatomy model...');

        // Create enhanced tissue layers
        await this.createAdvancedSkinLayer();
        await this.createAdvancedMuscleLayer();
        await this.createAdvancedVesselSystem();
        await this.createAdvancedNerveSystem();
        await this.createAdvancedBoneStructure();
        await this.createAdvancedCartilageLayer();
        await this.createAdvancedFatLayer();

        // Create injection points with advanced materials
        this.createAdvancedInjectionPoints();

        // Create enhanced anatomical annotations
        this.createAdvancedAnatomicalAnnotations();

        console.log('Advanced lip anatomy model created successfully');
    }

    /**
     * Create advanced skin layer with subsurface scattering
     */
    async createAdvancedSkinLayer() {
        // Create enhanced lip shape
        const shape = this.createEnhancedLipShape();

        const extrudeSettings = {
            depth: 2.5,
            bevelEnabled: true,
            bevelSegments: 12,
            steps: 24,
            bevelSize: 0.18,
            bevelThickness: 0.12,
            curveSegments: 64
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center();

        // Add advanced vertex attributes for medical rendering
        this.addMedicalVertexAttributes(geometry, 'skin');

        // Create advanced skin material
        const skinMaterial = this.advancedMaterials.createMaterial('skin', {
            subsurfaceScattering: this.medicalSettings.subsurfaceScattering,
            realTimeDeformation: this.medicalSettings.realTimeDeformation
        });

        this.layers.skin = new THREE.Mesh(geometry, skinMaterial);
        this.layers.skin.castShadow = true;
        this.layers.skin.receiveShadow = true;

        // Register with LOD manager
        if (this.lodManager) {
            this.lodManager.registerLODObject(this.layers.skin, 'skin', {
                priority: 10 // Highest priority for skin
            });
        }

        this.scene.add(this.layers.skin);
    }

    /**
     * Create advanced muscle layer with fiber simulation
     */
    async createAdvancedMuscleLayer() {
        const muscleGroup = new THREE.Group();

        // Create orbicularis oris muscle with detailed fiber structure
        const fiberCount = 32;
        const fiberLayers = 3;

        for (let layer = 0; layer < fiberLayers; layer++) {
            for (let i = 0; i < fiberCount; i++) {
                const radius = 2.5 + layer * 0.2;
                const angle = (Math.PI * 2 * i) / fiberCount;

                // Create individual muscle fiber
                const fiberGeometry = new THREE.TorusGeometry(
                    radius,
                    0.08 + layer * 0.02,
                    8,
                    16,
                    Math.PI * 0.3
                );

                // Add fiber direction attributes
                this.addFiberAttributes(fiberGeometry, angle);

                const muscleMaterial = this.advancedMaterials.createMaterial('muscle', {
                    fiberDirection: new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0),
                    contractionCapability: 0.8,
                    elasticity: 0.6
                });

                const fiber = new THREE.Mesh(fiberGeometry, muscleMaterial);
                fiber.position.set(
                    Math.cos(angle) * (0.1 + layer * 0.05),
                    Math.sin(angle) * (0.05 + layer * 0.02),
                    layer * 0.1 - 0.1
                );
                fiber.rotation.z = angle;

                muscleGroup.add(fiber);
            }
        }

        // Add additional muscle groups
        this.addAccessoryMuscles(muscleGroup);

        this.layers.muscle = muscleGroup;
        this.layers.muscle.visible = false;

        // Register with LOD manager
        if (this.lodManager) {
            this.lodManager.registerLODObject(this.layers.muscle, 'muscle', {
                priority: 7
            });
        }

        this.scene.add(this.layers.muscle);
    }

    /**
     * Create advanced vessel system with blood flow simulation
     */
    async createAdvancedVesselSystem() {
        const vesselGroup = new THREE.Group();

        // Create major arteries with realistic branching
        const arteryPaths = this.generateAdvancedVesselPaths('artery');
        const venousPaths = this.generateAdvancedVesselPaths('vein');
        const capillaryPaths = this.generateAdvancedVesselPaths('capillary');

        // Process arterial system
        arteryPaths.forEach((path, index) => {
            const vessel = this.createAdvancedVessel(path, {
                type: 'artery',
                radius: 0.08,
                oxygenation: 0.95,
                flowSpeed: 1.2,
                pulsation: true
            });
            vesselGroup.add(vessel);
        });

        // Process venous system
        venousPaths.forEach((path, index) => {
            const vessel = this.createAdvancedVessel(path, {
                type: 'vein',
                radius: 0.06,
                oxygenation: 0.65,
                flowSpeed: 0.8,
                pulsation: false
            });
            vesselGroup.add(vessel);
        });

        // Process capillary network
        capillaryPaths.forEach((path, index) => {
            const vessel = this.createAdvancedVessel(path, {
                type: 'capillary',
                radius: 0.02,
                oxygenation: 0.75,
                flowSpeed: 0.3,
                pulsation: false
            });
            vesselGroup.add(vessel);
        });

        this.layers.vessel = vesselGroup;
        this.layers.vessel.visible = false;

        // Register with LOD manager
        if (this.lodManager) {
            this.lodManager.registerLODObject(this.layers.vessel, 'vessel', {
                priority: 6
            });
        }

        this.scene.add(this.layers.vessel);
    }

    /**
     * Create advanced nerve system with electrical activity
     */
    async createAdvancedNerveSystem() {
        const nerveGroup = new THREE.Group();

        // Trigeminal nerve branches
        const trigeminalBranches = this.generateNerveBranches('trigeminal');
        trigeminalBranches.forEach(branch => {
            const nerve = this.createAdvancedNerve(branch, {
                type: 'sensory',
                myelination: 0.8,
                conductionVelocity: 45, // m/s
                electricalActivity: true
            });
            nerveGroup.add(nerve);
        });

        // Facial nerve branches
        const facialBranches = this.generateNerveBranches('facial');
        facialBranches.forEach(branch => {
            const nerve = this.createAdvancedNerve(branch, {
                type: 'motor',
                myelination: 0.9,
                conductionVelocity: 60, // m/s
                electricalActivity: true
            });
            nerveGroup.add(nerve);
        });

        // Nerve plexus and endings
        this.addNerveEndings(nerveGroup);

        this.layers.nerve = nerveGroup;
        this.layers.nerve.visible = false;

        // Register with LOD manager
        if (this.lodManager) {
            this.lodManager.registerLODObject(this.layers.nerve, 'nerve', {
                priority: 5
            });
        }

        this.scene.add(this.layers.nerve);
    }

    /**
     * Create advanced bone structure
     */
    async createAdvancedBoneStructure() {
        // Maxilla and mandible bones affecting lip structure
        const boneGroup = new THREE.Group();

        // Create maxilla representation
        const maxillaGeometry = this.createMaxillaGeometry();
        const boneMaterial = this.advancedMaterials.createMaterial('bone', {
            density: 0.85,
            porosity: 0.25,
            mineralization: 0.92
        });

        const maxilla = new THREE.Mesh(maxillaGeometry, boneMaterial);
        maxilla.position.set(0, 0.5, -1);
        boneGroup.add(maxilla);

        // Create mandible representation
        const mandibleGeometry = this.createMandibleGeometry();
        const mandible = new THREE.Mesh(mandibleGeometry, boneMaterial.clone());
        mandible.position.set(0, -1.5, -1);
        boneGroup.add(mandible);

        this.layers.bone = boneGroup;
        this.layers.bone.visible = false;

        // Register with LOD manager
        if (this.lodManager) {
            this.lodManager.registerLODObject(this.layers.bone, 'bone', {
                priority: 3
            });
        }

        this.scene.add(this.layers.bone);
    }

    /**
     * Create advanced cartilage layer
     */
    async createAdvancedCartilageLayer() {
        const cartilageGroup = new THREE.Group();

        // Nasal cartilage affecting upper lip
        const nasalCartilageGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 12);
        const cartilageMaterial = this.advancedMaterials.createMaterial('cartilage', {
            elasticity: 0.75,
            compression: 0.6
        });

        const nasalCartilage = new THREE.Mesh(nasalCartilageGeometry, cartilageMaterial);
        nasalCartilage.position.set(0, 1.8, 0);
        cartilageGroup.add(nasalCartilage);

        this.layers.cartilage = cartilageGroup;
        this.layers.cartilage.visible = false;

        // Register with LOD manager
        if (this.lodManager) {
            this.lodManager.registerLODObject(this.layers.cartilage, 'cartilage', {
                priority: 4
            });
        }

        this.scene.add(this.layers.cartilage);
    }

    /**
     * Create advanced fat layer
     */
    async createAdvancedFatLayer() {
        const fatGroup = new THREE.Group();

        // Subcutaneous fat pads
        const fatPadPositions = [
            { pos: new THREE.Vector3(-1.5, 0.5, 0.3), size: 0.4 },
            { pos: new THREE.Vector3(1.5, 0.5, 0.3), size: 0.4 },
            { pos: new THREE.Vector3(-1, -0.8, 0.3), size: 0.3 },
            { pos: new THREE.Vector3(1, -0.8, 0.3), size: 0.3 },
            { pos: new THREE.Vector3(0, 1.2, 0.2), size: 0.25 }
        ];

        const fatMaterial = this.advancedMaterials.createMaterial('fat', {
            softness: 0.9,
            deformability: 0.8
        });

        fatPadPositions.forEach((pad, index) => {
            const fatGeometry = new THREE.SphereGeometry(pad.size, 12, 8);
            const fatPad = new THREE.Mesh(fatGeometry, fatMaterial.clone());
            fatPad.position.copy(pad.pos);
            fatPad.scale.set(1, 0.8, 1.2); // Natural fat pad shape
            fatGroup.add(fatPad);
        });

        this.layers.fat = fatGroup;
        this.layers.fat.visible = false;

        // Register with LOD manager
        if (this.lodManager) {
            this.lodManager.registerLODObject(this.layers.fat, 'fat', {
                priority: 2
            });
        }

        this.scene.add(this.layers.fat);
    }
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 主光源
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 7.5);
        mainLight.castShadow = true;
        mainLight.shadow.camera.near = 0.1;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        mainLight.shadow.mapSize.set(2048, 2048);
        this.scene.add(mainLight);

        // 补光
        const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // 边缘光
        const rimLight = new THREE.DirectionalLight(0xff6b9d, 0.2);
        rimLight.position.set(0, -5, -10);
        this.scene.add(rimLight);
    }

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);

        // 渲染通道
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // 轮廓效果
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

        // 泛光效果
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5, // strength
            0.4, // radius
            0.85 // threshold
        );
        this.composer.addPass(bloomPass);
    }

    createLipModel() {
        // 创建唇部几何体
        this.createSkinLayer();
        this.createMuscleLayer();
        this.createVesselSystem();
        this.createNerveSystem();

        // 创建注射点标记
        this.createInjectionPoints();

        // 创建解剖标注
        this.createAnatomicalAnnotations();
    }

    createSkinLayer() {
        // 创建皮肤层 - 使用贝塞尔曲线创建唇形
        const shape = new THREE.Shape();

        // 上唇轮廓
        shape.moveTo(-3, 0);
        shape.bezierCurveTo(-3, 1, -2, 1.5, -1, 1.5);
        shape.bezierCurveTo(0, 1.8, 0, 1.8, 0, 1.8);
        shape.bezierCurveTo(1, 1.5, 2, 1.5, 3, 0);

        // 下唇轮廓
        shape.bezierCurveTo(2.5, -0.5, 1.5, -1.5, 0, -1.8);
        shape.bezierCurveTo(-1.5, -1.5, -2.5, -0.5, -3, 0);

        const extrudeSettings = {
            depth: 2,
            bevelEnabled: true,
            bevelSegments: 8,
            steps: 16,
            bevelSize: 0.15,
            bevelThickness: 0.1
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center();

        // 皮肤材质
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
            opacity: 1
        });

        this.layers.skin = new THREE.Mesh(geometry, skinMaterial);
        this.layers.skin.castShadow = true;
        this.layers.skin.receiveShadow = true;
        this.scene.add(this.layers.skin);
    }

    createMuscleLayer() {
        // 口轮匝肌群
        const muscleGroup = new THREE.Group();

        // 主要肌肉束
        const muscleGeometry = new THREE.TorusGeometry(2.5, 0.3, 8, 32, Math.PI * 2);
        const muscleMaterial = new THREE.MeshPhongMaterial({
            color: 0xff6b9d,
            shininess: 80,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });

        // 创建多个肌肉纤维
        for (let i = 0; i < 8; i++) {
            const muscle = new THREE.Mesh(muscleGeometry, muscleMaterial.clone());
            const angle = (Math.PI * 2 * i) / 8;
            muscle.position.x = Math.cos(angle) * 0.3;
            muscle.position.z = Math.sin(angle) * 0.3;
            muscle.rotation.x = Math.random() * 0.2;
            muscle.scale.set(0.9 + Math.random() * 0.2, 1, 1);
            muscleGroup.add(muscle);
        }

        // 垂直肌肉纤维
        const verticalMuscleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);

        for (let i = 0; i < 12; i++) {
            const muscle = new THREE.Mesh(verticalMuscleGeometry, muscleMaterial.clone());
            muscle.position.x = (i - 6) * 0.4;
            muscle.position.y = Math.sin(i * 0.5) * 0.3;
            muscle.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
            muscleGroup.add(muscle);
        }

        this.layers.muscle = muscleGroup;
        this.layers.muscle.visible = false;
        this.scene.add(this.layers.muscle);
    }

    createVesselSystem() {
        // 血管系统
        const vesselGroup = new THREE.Group();

        // 创建血管路径
        const vesselMaterial = new THREE.MeshPhongMaterial({
            color: 0xe74c3c,
            emissive: 0x441111,
            emissiveIntensity: 0.2,
            shininess: 100,
            transparent: true,
            opacity: 0
        });

        // 主要动脉
        const createVessel = (points) => {
            const curve = new THREE.CatmullRomCurve3(points);
            const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
            return new THREE.Mesh(tubeGeometry, vesselMaterial.clone());
        };

        // 上唇动脉
        const upperArteryPoints = [
            new THREE.Vector3(-3, 0.5, 0),
            new THREE.Vector3(-1.5, 1, 0.2),
            new THREE.Vector3(0, 1.2, 0),
            new THREE.Vector3(1.5, 1, -0.2),
            new THREE.Vector3(3, 0.5, 0)
        ];
        vesselGroup.add(createVessel(upperArteryPoints));

        // 下唇动脉
        const lowerArteryPoints = [
            new THREE.Vector3(-3, -0.5, 0),
            new THREE.Vector3(-1.5, -1, 0.2),
            new THREE.Vector3(0, -1.2, 0),
            new THREE.Vector3(1.5, -1, -0.2),
            new THREE.Vector3(3, -0.5, 0)
        ];
        vesselGroup.add(createVessel(lowerArteryPoints));

        // 添加分支血管
        for (let i = 0; i < 20; i++) {
            const branchPoints = [];
            const startX = (Math.random() - 0.5) * 6;
            const startY = (Math.random() - 0.5) * 2;

            for (let j = 0; j < 4; j++) {
                branchPoints.push(new THREE.Vector3(
                    startX + (Math.random() - 0.5) * 0.5,
                    startY + (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.3
                ));
            }

            const branch = createVessel(branchPoints);
            branch.material.opacity = 0;
            vesselGroup.add(branch);
        }

        this.layers.vessel = vesselGroup;
        this.layers.vessel.visible = false;
        this.scene.add(this.layers.vessel);
    }

    createNerveSystem() {
        // 神经系统
        const nerveGroup = new THREE.Group();

        const nerveMaterial = new THREE.MeshPhongMaterial({
            color: 0xf39c12,
            emissive: 0x886611,
            emissiveIntensity: 0.3,
            shininess: 60,
            transparent: true,
            opacity: 0
        });

        // 创建神经纤维
        const createNerve = (points) => {
            const curve = new THREE.CatmullRomCurve3(points);
            const tubeGeometry = new THREE.TubeGeometry(curve, 15, 0.03, 6, false);
            return new THREE.Mesh(tubeGeometry, nerveMaterial.clone());
        };

        // 三叉神经分支
        const trigeminalPoints = [
            new THREE.Vector3(-4, 2, 1),
            new THREE.Vector3(-2, 1.5, 0.5),
            new THREE.Vector3(-1, 1, 0.2),
            new THREE.Vector3(0, 0.5, 0)
        ];
        nerveGroup.add(createNerve(trigeminalPoints));

        // 面神经分支
        const facialPoints = [
            new THREE.Vector3(4, 2, 1),
            new THREE.Vector3(2, 1.5, 0.5),
            new THREE.Vector3(1, 1, 0.2),
            new THREE.Vector3(0, 0.5, 0)
        ];
        nerveGroup.add(createNerve(facialPoints));

        // 添加神经末梢
        for (let i = 0; i < 15; i++) {
            const endingGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const ending = new THREE.Mesh(endingGeometry, nerveMaterial.clone());
            ending.position.set(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 1
            );
            nerveGroup.add(ending);
        }

        this.layers.nerve = nerveGroup;
        this.layers.nerve.visible = false;
        this.scene.add(this.layers.nerve);
    }

    createInjectionPoints() {
        // 创建推荐注射点
        const injectionPointGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const injectionPointMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });

        // 定义关键注射点
        const keyPoints = [
            { pos: [-1.5, 1, 0.5], name: '上唇峰点左' },
            { pos: [1.5, 1, 0.5], name: '上唇峰点右' },
            { pos: [0, 1.2, 0.5], name: '唇珠点' },
            { pos: [-2, 0, 0.5], name: '口角左' },
            { pos: [2, 0, 0.5], name: '口角右' },
            { pos: [-1, -1, 0.5], name: '下唇左' },
            { pos: [1, -1, 0.5], name: '下唇右' },
            { pos: [0, -1.2, 0.5], name: '下唇中点' }
        ];

        keyPoints.forEach(point => {
            const sphere = new THREE.Mesh(injectionPointGeometry, injectionPointMaterial.clone());
            sphere.position.set(...point.pos);
            sphere.userData = { name: point.name, type: 'injection_point' };
            this.injectionPoints.push(sphere);
            this.scene.add(sphere);
        });
    }

    createAnatomicalAnnotations() {
        // 这里创建3D空间中的标注点
        // 实际的HTML标注会在交互时动态创建
        const annotationData = [
            { pos: [0, 1.5, 1], text: '唇珠 - 上唇中央突起' },
            { pos: [-2, 0.2, 1], text: '口角 - 需避免过度填充' },
            { pos: [0, -1.5, 1], text: '下唇 - 注意对称性' },
            { pos: [1.5, 1, 1], text: '唇峰 - 关键美学点' }
        ];

        this.annotations = annotationData;
    }

    bindEvents() {
        // 窗口调整
        window.addEventListener('resize', () => this.onWindowResize());

        // 鼠标事件
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));

        // 层次控制
        document.querySelectorAll('.layer-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const layerName = e.target.id.replace('layer-', '');
                this.toggleLayer(layerName, e.target.checked);
            });
        });

        // 模式切换
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.switchViewMode(e.target.dataset.mode);
            });
        });

        // 工具切换
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentTool = e.currentTarget.dataset.tool;
                this.onToolChange(this.currentTool);
            });
        });

        // 透明度滑块
        document.getElementById('opacity-slider').addEventListener('input', (e) => {
            const opacity = e.target.value / 100;
            this.updateOpacity(opacity);
        });
    }

    toggleLayer(layerName, visible) {
        if (this.layers[layerName]) {
            if (visible) {
                this.layers[layerName].visible = true;
                // 淡入动画
                this.animateLayerOpacity(this.layers[layerName], 0, layerName === 'skin' ? 1 : 0.8, 500);
            } else {
                // 淡出动画
                this.animateLayerOpacity(this.layers[layerName],
                    layerName === 'skin' ? 1 : 0.8, 0, 500, () => {
                    this.layers[layerName].visible = false;
                });
            }
        }
    }

    animateLayerOpacity(layer, fromOpacity, toOpacity, duration, callback) {
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const opacity = fromOpacity + (toOpacity - fromOpacity) * this.easeInOut(progress);

            if (layer.material) {
                layer.material.opacity = opacity;
            } else if (layer.children) {
                layer.traverse(child => {
                    if (child.material) {
                        child.material.opacity = opacity;
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

    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

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

    setNormalView() {
        // 恢复正常视图
        if (this.layers.skin) {
            this.layers.skin.material.opacity = 1;
            this.layers.skin.material.transparent = false;
        }

        // 重置剖面
        this.renderer.clippingPlanes = [];
    }

    setXRayView() {
        // X光透视效果
        if (this.layers.skin) {
            this.layers.skin.material.opacity = 0.3;
            this.layers.skin.material.transparent = true;
        }

        // 显示内部结构
        ['muscle', 'vessel', 'nerve'].forEach(layer => {
            if (this.layers[layer]) {
                this.layers[layer].visible = true;
                this.animateLayerOpacity(this.layers[layer], 0, 0.8, 500);
            }
        });
    }

    setSectionView() {
        // 创建剖切平面
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.renderer.clippingPlanes = [plane];
        this.renderer.localClippingEnabled = true;

        // 动画剖切
        let position = 2;
        const animateSection = () => {
            position -= 0.02;
            plane.constant = position;

            if (position > -2) {
                requestAnimationFrame(animateSection);
            }
        };
        animateSection();
    }

    startAnatomicalAnimation() {
        // 解剖动画演示
        const timeline = [
            { layer: 'skin', delay: 0, action: 'fadeOut' },
            { layer: 'muscle', delay: 1000, action: 'fadeIn' },
            { layer: 'vessel', delay: 2000, action: 'fadeIn' },
            { layer: 'nerve', delay: 3000, action: 'fadeIn' },
            { layer: 'muscle', delay: 4000, action: 'pulse' }
        ];

        timeline.forEach(step => {
            setTimeout(() => {
                if (step.action === 'fadeIn') {
                    this.layers[step.layer].visible = true;
                    this.animateLayerOpacity(this.layers[step.layer], 0, 0.8, 1000);
                } else if (step.action === 'fadeOut') {
                    this.animateLayerOpacity(this.layers[step.layer], 1, 0.3, 1000);
                } else if (step.action === 'pulse') {
                    this.pulseLayer(this.layers[step.layer]);
                }
            }, step.delay);
        });
    }

    pulseLayer(layer) {
        const scale = { value: 1 };
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed % duration) / duration;
            const pulseScale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;

            if (layer) {
                layer.scale.set(pulseScale, pulseScale, pulseScale);
            }

            if (elapsed < 3000) {
                requestAnimationFrame(animate);
            } else {
                layer.scale.set(1, 1, 1);
            }
        };

        animate();
    }

    onToolChange(tool) {
        const cursor = document.querySelector('.injection-cursor');

        switch(tool) {
            case 'inject':
                cursor.style.display = 'block';
                this.controls.enabled = false;
                break;
            case 'rotate':
                cursor.style.display = 'none';
                this.controls.enabled = true;
                break;
            case 'measure':
                // 实现测量工具
                this.startMeasurement();
                break;
            case 'annotate':
                // 实现标注工具
                this.enableAnnotationMode();
                break;
            case 'compare':
                // 实现对比工具
                this.showBeforeAfter();
                break;
        }
    }

    startMeasurement() {
        // 测量工具实现
        console.log('测量工具已激活');
    }

    enableAnnotationMode() {
        // 标注模式实现
        console.log('标注模式已激活');
    }

    showBeforeAfter() {
        // 前后对比实现
        console.log('对比模式已激活');
    }

    updateOpacity(opacity) {
        if (this.layers.skin && this.layers.skin.material) {
            this.layers.skin.material.opacity = opacity;
            this.layers.skin.material.transparent = opacity < 1;
        }
    }

    onMouseMove(event) {
        // 更新鼠标位置
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // 更新注射光标位置
        if (this.currentTool === 'inject') {
            const cursor = document.querySelector('.injection-cursor');
            cursor.style.left = event.clientX + 'px';
            cursor.style.top = event.clientY + 'px';
        }

        // 高亮效果
        this.checkIntersections();
    }

    checkIntersections() {
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 检查注射点
        const intersects = this.raycaster.intersectObjects(this.injectionPoints);

        // 重置所有点
        this.injectionPoints.forEach(point => {
            point.material.emissiveIntensity = 0.5;
            point.scale.set(1, 1, 1);
        });

        // 高亮悬停的点
        if (intersects.length > 0) {
            const point = intersects[0].object;
            point.material.emissiveIntensity = 1;
            point.scale.set(1.2, 1.2, 1.2);

            // 显示信息
            if (point.userData.name) {
                this.showPointInfo(point.userData.name);
            }
        }
    }

    showPointInfo(name) {
        const infoPanel = document.querySelector('.info-panel');
        const infoTitle = infoPanel.querySelector('.info-title');
        infoTitle.textContent = `推荐注射点：${name}`;
    }

    onClick(event) {
        if (this.currentTool === 'inject') {
            this.performInjection(event);
        }
    }

    performInjection(event) {
        // 创建注射轨迹
        const trail = document.createElement('div');
        trail.className = 'injection-trail';
        trail.style.left = event.clientX + 'px';
        trail.style.top = event.clientY + 'px';
        document.body.appendChild(trail);

        // 移除轨迹
        setTimeout(() => trail.remove(), 2000);

        // 射线检测注射位置
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([this.layers.skin]);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.createInjectionVisualization(point);
        }
    }

    createInjectionVisualization(point) {
        // 创建注射可视化效果
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

        // 扩散动画
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

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        // 更新控制器
        if (this.controls.enabled) {
            this.controls.update();
        }

        // 更新动画混合器
        this.animationMixers.forEach(mixer => mixer.update(deltaTime));

        // 血管脉动效果
        if (this.layers.vessel && this.layers.vessel.visible) {
            this.layers.vessel.children.forEach((vessel, index) => {
                if (vessel.material) {
                    const pulse = Math.sin(Date.now() * 0.002 + index) * 0.2 + 0.8;
                    vessel.material.emissiveIntensity = pulse * 0.3;
                }
            });
        }

        // 神经传导效果
        if (this.layers.nerve && this.layers.nerve.visible) {
            this.layers.nerve.children.forEach((nerve, index) => {
                if (nerve.material) {
                    const signal = Math.sin(Date.now() * 0.003 + index * 0.5) * 0.3 + 0.7;
                    nerve.material.emissiveIntensity = signal * 0.4;
                }
            });
        }

        // 渲染
        this.composer.render();
    }
}

// 初始化应用
window.addEventListener('DOMContentLoaded', () => {
    const app = new LipAnatomyModel();
    window.lipModel = app; // 暴露到全局以便调试
});