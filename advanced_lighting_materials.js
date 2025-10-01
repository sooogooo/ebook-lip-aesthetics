/**
 * Advanced Lighting and Material Systems for Medical Visualization
 * Provides physically accurate lighting and advanced material systems
 * optimized for medical 3D rendering with realistic tissue appearance
 */

import * as THREE from 'three';

/**
 * Advanced Medical Lighting System
 */
class MedicalLightingSystem {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.lights = new Map();
        this.lightProbes = [];
        this.shadowCascades = [];
        this.environmentMap = null;

        // Lighting configuration for medical visualization
        this.config = {
            mainLight: {
                intensity: 1.2,
                color: 0xffffff,
                position: new THREE.Vector3(5, 10, 7.5),
                castShadow: true,
                shadowMapSize: 4096
            },
            fillLight: {
                intensity: 0.4,
                color: 0x87ceeb,
                position: new THREE.Vector3(-5, 5, -5)
            },
            rimLight: {
                intensity: 0.3,
                color: 0xff6b9d,
                position: new THREE.Vector3(0, -5, -10)
            },
            ambientLight: {
                intensity: 0.3,
                color: 0xffffff
            },
            medicalLight: {
                intensity: 0.8,
                color: 0xf8f8ff,
                position: new THREE.Vector3(0, 15, 0),
                type: 'surgical'
            }
        };

        this.initializeLighting();
        this.setupShadowSystem();
        this.createEnvironmentMapping();
    }

    /**
     * Initialize advanced lighting setup
     */
    initializeLighting() {
        // Remove existing lights
        this.clearLights();

        // Main directional light (primary illumination)
        this.createMainLight();

        // Fill light (soften shadows)
        this.createFillLight();

        // Rim light (edge definition)
        this.createRimLight();

        // Ambient lighting
        this.createAmbientLight();

        // Specialized medical lighting
        this.createMedicalLighting();

        // Dynamic point lights for highlights
        this.createDynamicHighlights();

        // Area lights for soft illumination
        this.createAreaLights();
    }

    /**
     * Create main directional light with advanced shadow mapping
     */
    createMainLight() {
        const config = this.config.mainLight;

        const mainLight = new THREE.DirectionalLight(config.color, config.intensity);
        mainLight.position.copy(config.position);
        mainLight.castShadow = config.castShadow;

        // Advanced shadow configuration
        if (config.castShadow) {
            mainLight.shadow.mapSize.setScalar(config.shadowMapSize);
            mainLight.shadow.camera.near = 0.1;
            mainLight.shadow.camera.far = 50;
            mainLight.shadow.camera.left = -15;
            mainLight.shadow.camera.right = 15;
            mainLight.shadow.camera.top = 15;
            mainLight.shadow.camera.bottom = -15;

            // Advanced shadow settings
            mainLight.shadow.bias = -0.0001;
            mainLight.shadow.normalBias = 0.02;
            mainLight.shadow.radius = 8;
            mainLight.shadow.blurSamples = 25;

            // Enable soft shadows
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        mainLight.userData = {
            type: 'main',
            originalIntensity: config.intensity,
            targetIntensity: config.intensity,
            animating: false
        };

        this.lights.set('main', mainLight);
        this.scene.add(mainLight);

        // Add light helper for debugging
        if (window.DEBUG_LIGHTS) {
            const helper = new THREE.DirectionalLightHelper(mainLight, 2);
            this.scene.add(helper);
        }
    }

    /**
     * Create fill light for shadow softening
     */
    createFillLight() {
        const config = this.config.fillLight;

        const fillLight = new THREE.DirectionalLight(config.color, config.intensity);
        fillLight.position.copy(config.position);
        fillLight.castShadow = false;

        fillLight.userData = {
            type: 'fill',
            originalIntensity: config.intensity,
            targetIntensity: config.intensity
        };

        this.lights.set('fill', fillLight);
        this.scene.add(fillLight);
    }

    /**
     * Create rim light for edge definition
     */
    createRimLight() {
        const config = this.config.rimLight;

        const rimLight = new THREE.DirectionalLight(config.color, config.intensity);
        rimLight.position.copy(config.position);
        rimLight.castShadow = false;

        rimLight.userData = {
            type: 'rim',
            originalIntensity: config.intensity,
            targetIntensity: config.intensity
        };

        this.lights.set('rim', rimLight);
        this.scene.add(rimLight);
    }

    /**
     * Create ambient lighting
     */
    createAmbientLight() {
        const config = this.config.ambientLight;

        const ambientLight = new THREE.AmbientLight(config.color, config.intensity);
        ambientLight.userData = {
            type: 'ambient',
            originalIntensity: config.intensity,
            targetIntensity: config.intensity
        };

        this.lights.set('ambient', ambientLight);
        this.scene.add(ambientLight);
    }

    /**
     * Create specialized medical lighting
     */
    createMedicalLighting() {
        const config = this.config.medicalLight;

        // Surgical light (focused, high-intensity)
        const surgicalLight = new THREE.SpotLight(config.color, config.intensity, 30, Math.PI * 0.15, 0.2, 2);
        surgicalLight.position.copy(config.position);
        surgicalLight.target.position.set(0, 0, 0);
        surgicalLight.castShadow = true;

        // High-quality shadows for surgical light
        surgicalLight.shadow.mapSize.setScalar(2048);
        surgicalLight.shadow.camera.near = 1;
        surgicalLight.shadow.camera.far = 25;
        surgicalLight.shadow.bias = -0.0001;

        surgicalLight.userData = {
            type: 'medical',
            subtype: 'surgical',
            originalIntensity: config.intensity,
            targetIntensity: config.intensity
        };

        this.lights.set('surgical', surgicalLight);
        this.scene.add(surgicalLight);
        this.scene.add(surgicalLight.target);

        // Examination light (broader coverage)
        const examLight = new THREE.SpotLight(0xf5f5dc, 0.6, 20, Math.PI * 0.3, 0.3, 1.5);
        examLight.position.set(3, 8, 5);
        examLight.target.position.set(0, 0, 0);

        examLight.userData = {
            type: 'medical',
            subtype: 'examination',
            originalIntensity: 0.6,
            targetIntensity: 0.6
        };

        this.lights.set('examination', examLight);
        this.scene.add(examLight);
        this.scene.add(examLight.target);
    }

    /**
     * Create dynamic highlight points
     */
    createDynamicHighlights() {
        const highlightPositions = [
            new THREE.Vector3(5, 5, 5),
            new THREE.Vector3(-5, -5, 5),
            new THREE.Vector3(5, -5, -5),
            new THREE.Vector3(-5, 5, -5)
        ];

        highlightPositions.forEach((position, index) => {
            const pointLight = new THREE.PointLight(0xffffff, 0.3, 20, 2);
            pointLight.position.copy(position);

            pointLight.userData = {
                type: 'highlight',
                index: index,
                originalIntensity: 0.3,
                targetIntensity: 0.3,
                basePosition: position.clone(),
                animationPhase: index * Math.PI * 0.5
            };

            this.lights.set(`highlight_${index}`, pointLight);
            this.scene.add(pointLight);
        });
    }

    /**
     * Create area lights for soft illumination
     */
    createAreaLights() {
        // Create rectangular area light
        const areaLight = new THREE.RectAreaLight(0xffffff, 0.5, 4, 4);
        areaLight.position.set(0, 8, 4);
        areaLight.lookAt(0, 0, 0);

        areaLight.userData = {
            type: 'area',
            originalIntensity: 0.5,
            targetIntensity: 0.5
        };

        this.lights.set('area', areaLight);
        this.scene.add(areaLight);
    }

    /**
     * Setup advanced shadow system
     */
    setupShadowSystem() {
        // Enable shadows on renderer
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;

        // Setup cascaded shadow maps for better quality
        this.setupCascadedShadows();

        // Setup contact shadows for enhanced realism
        this.setupContactShadows();
    }

    /**
     * Setup cascaded shadow maps
     */
    setupCascadedShadows() {
        const mainLight = this.lights.get('main');
        if (!mainLight) return;

        // Create multiple shadow cameras for different distances
        const cascadeDistances = [5, 15, 30];

        cascadeDistances.forEach((distance, index) => {
            const shadowCamera = mainLight.shadow.camera.clone();
            shadowCamera.near = index === 0 ? 0.1 : cascadeDistances[index - 1];
            shadowCamera.far = distance;

            // Adjust camera size based on distance
            const size = distance * 0.5;
            shadowCamera.left = -size;
            shadowCamera.right = size;
            shadowCamera.top = size;
            shadowCamera.bottom = -size;

            this.shadowCascades.push({
                camera: shadowCamera,
                distance: distance,
                renderTarget: new THREE.WebGLRenderTarget(2048, 2048, {
                    format: THREE.RGBAFormat,
                    type: THREE.FloatType
                })
            });
        });
    }

    /**
     * Setup contact shadows
     */
    setupContactShadows() {
        // Contact shadows would be implemented using screen-space techniques
        // This is a placeholder for the contact shadow system
        this.contactShadowsEnabled = true;
    }

    /**
     * Create environment mapping for realistic reflections
     */
    createEnvironmentMapping() {
        // Create PMREM generator for environment mapping
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);

        // Create medical environment
        this.environmentMap = this.createMedicalEnvironment(pmremGenerator);

        // Apply to scene
        this.scene.environment = this.environmentMap;

        pmremGenerator.dispose();
    }

    /**
     * Create medical environment for reflections
     */
    createMedicalEnvironment(pmremGenerator) {
        // Create a simple gradient environment suitable for medical visualization
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Create medical environment gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, '#f8f8ff');    // Medical white at top
        gradient.addColorStop(0.3, '#e6e6fa');  // Light lavender
        gradient.addColorStop(0.7, '#d3d3d3');  // Light gray
        gradient.addColorStop(1, '#a9a9a9');    // Gray at bottom

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;

        return pmremGenerator.fromEquirectangular(texture).texture;
    }

    /**
     * Update lighting system
     */
    update(deltaTime) {
        // Update dynamic highlights
        this.updateDynamicHighlights(deltaTime);

        // Update light animations
        this.updateLightAnimations(deltaTime);

        // Update shadow cascades
        this.updateShadowCascades();
    }

    /**
     * Update dynamic highlight positions
     */
    updateDynamicHighlights(deltaTime) {
        const time = performance.now() * 0.001;

        this.lights.forEach((light, key) => {
            if (light.userData.type === 'highlight') {
                const phase = light.userData.animationPhase;
                const basePos = light.userData.basePosition;

                // Subtle movement for dynamic feel
                light.position.x = basePos.x + Math.sin(time + phase) * 0.5;
                light.position.y = basePos.y + Math.cos(time * 0.7 + phase) * 0.3;
                light.position.z = basePos.z + Math.sin(time * 1.3 + phase) * 0.2;

                // Subtle intensity variation
                const intensityVar = Math.sin(time * 2 + phase) * 0.1 + 1;
                light.intensity = light.userData.originalIntensity * intensityVar;
            }
        });
    }

    /**
     * Update light animations
     */
    updateLightAnimations(deltaTime) {
        this.lights.forEach((light, key) => {
            if (light.userData.animating) {
                const target = light.userData.targetIntensity;
                const current = light.intensity;
                const speed = 2.0; // Animation speed

                if (Math.abs(target - current) > 0.001) {
                    light.intensity = THREE.MathUtils.lerp(current, target, deltaTime * speed);
                } else {
                    light.intensity = target;
                    light.userData.animating = false;
                }
            }
        });
    }

    /**
     * Update shadow cascades
     */
    updateShadowCascades() {
        // This would implement cascaded shadow map updates
        // Placeholder for advanced shadow cascade system
    }

    /**
     * Set lighting preset for different medical scenarios
     */
    setLightingPreset(preset) {
        const presets = {
            surgical: {
                main: { intensity: 1.5, color: 0xffffff },
                surgical: { intensity: 1.2, color: 0xf8f8ff },
                ambient: { intensity: 0.2, color: 0xffffff },
                fill: { intensity: 0.3, color: 0x87ceeb }
            },
            examination: {
                main: { intensity: 1.0, color: 0xffffff },
                examination: { intensity: 0.8, color: 0xf5f5dc },
                ambient: { intensity: 0.4, color: 0xffffff },
                fill: { intensity: 0.5, color: 0x87ceeb }
            },
            photography: {
                main: { intensity: 0.8, color: 0xffffff },
                fill: { intensity: 0.6, color: 0x87ceeb },
                rim: { intensity: 0.4, color: 0xff6b9d },
                ambient: { intensity: 0.3, color: 0xffffff }
            },
            dramatic: {
                main: { intensity: 1.5, color: 0xffffff },
                rim: { intensity: 0.8, color: 0xff6b9d },
                ambient: { intensity: 0.1, color: 0x4169e1 },
                fill: { intensity: 0.2, color: 0x191970 }
            }
        };

        const config = presets[preset];
        if (!config) return;

        Object.keys(config).forEach(lightKey => {
            const light = this.lights.get(lightKey);
            if (light) {
                const settings = config[lightKey];

                if (settings.intensity !== undefined) {
                    light.userData.targetIntensity = settings.intensity;
                    light.userData.animating = true;
                }

                if (settings.color !== undefined) {
                    light.color.setHex(settings.color);
                }
            }
        });
    }

    /**
     * Adjust lighting for specific medical procedures
     */
    adjustForProcedure(procedureType) {
        switch (procedureType) {
            case 'filler-injection':
                this.setLightingPreset('surgical');
                this.enhanceSurfaceDetail();
                break;
            case 'examination':
                this.setLightingPreset('examination');
                this.enhanceContrastVisibility();
                break;
            case 'documentation':
                this.setLightingPreset('photography');
                this.optimizeForCapture();
                break;
            case 'presentation':
                this.setLightingPreset('dramatic');
                this.enhanceAestheticAppeal();
                break;
        }
    }

    /**
     * Enhance surface detail visibility
     */
    enhanceSurfaceDetail() {
        const rimLight = this.lights.get('rim');
        if (rimLight) {
            rimLight.userData.targetIntensity = 0.6;
            rimLight.userData.animating = true;
        }

        // Increase directional lighting for better surface definition
        const mainLight = this.lights.get('main');
        if (mainLight) {
            mainLight.userData.targetIntensity = 1.3;
            mainLight.userData.animating = true;
        }
    }

    /**
     * Enhance contrast for better visibility
     */
    enhanceContrastVisibility() {
        const fillLight = this.lights.get('fill');
        if (fillLight) {
            fillLight.userData.targetIntensity = 0.6;
            fillLight.userData.animating = true;
        }

        const ambientLight = this.lights.get('ambient');
        if (ambientLight) {
            ambientLight.userData.targetIntensity = 0.5;
            ambientLight.userData.animating = true;
        }
    }

    /**
     * Optimize lighting for photo/video capture
     */
    optimizeForCapture() {
        // Balanced lighting for even exposure
        this.lights.forEach((light, key) => {
            if (light.userData.type === 'highlight') {
                light.userData.targetIntensity = 0.4;
                light.userData.animating = true;
            }
        });
    }

    /**
     * Enhance aesthetic appeal
     */
    enhanceAestheticAppeal() {
        const rimLight = this.lights.get('rim');
        if (rimLight) {
            rimLight.color.setHex(0xff4da6); // More vibrant rim color
            rimLight.userData.targetIntensity = 0.8;
            rimLight.userData.animating = true;
        }
    }

    /**
     * Enable/disable specific lighting types
     */
    toggleLightType(type, enabled) {
        this.lights.forEach((light, key) => {
            if (light.userData.type === type) {
                light.visible = enabled;
            }
        });
    }

    /**
     * Get lighting statistics
     */
    getLightingStats() {
        const stats = {
            totalLights: this.lights.size,
            shadowCastingLights: 0,
            activeLights: 0,
            lightTypes: {}
        };

        this.lights.forEach((light, key) => {
            if (light.visible) stats.activeLights++;
            if (light.castShadow) stats.shadowCastingLights++;

            const type = light.userData.type;
            stats.lightTypes[type] = (stats.lightTypes[type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Clear all lights
     */
    clearLights() {
        this.lights.forEach((light, key) => {
            this.scene.remove(light);
            if (light.target) {
                this.scene.remove(light.target);
            }
        });
        this.lights.clear();
    }

    /**
     * Dispose resources
     */
    dispose() {
        this.clearLights();

        if (this.environmentMap) {
            this.environmentMap.dispose();
        }

        this.shadowCascades.forEach(cascade => {
            cascade.renderTarget.dispose();
        });
        this.shadowCascades.length = 0;
    }
}

/**
 * Advanced Material System for Medical Visualization
 */
class MedicalMaterialSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.materials = new Map();
        this.materialTemplates = new Map();
        this.shaderCache = new Map();
        this.textureCache = new Map();

        this.initializeMaterialTemplates();
        this.createProceduralTextures();
    }

    /**
     * Initialize material templates for different tissue types
     */
    initializeMaterialTemplates() {
        // Skin material template
        this.materialTemplates.set('skin', {
            type: 'physical',
            baseColor: 0xffdbcc,
            roughness: 0.4,
            metalness: 0.0,
            clearcoat: 0.3,
            clearcoatRoughness: 0.2,
            transmission: 0.1,
            thickness: 0.5,
            ior: 1.4,
            sheen: 0.5,
            sheenColor: 0xffd7cc,
            subsurface: true,
            subsurfaceColor: 0xff9999,
            subsurfaceRadius: 0.3
        });

        // Muscle material template
        this.materialTemplates.set('muscle', {
            type: 'physical',
            baseColor: 0xcc4a7a,
            roughness: 0.6,
            metalness: 0.0,
            clearcoat: 0.1,
            transmission: 0.05,
            thickness: 0.8,
            ior: 1.37,
            fiber: true,
            fiberDirection: new THREE.Vector3(1, 0, 0),
            anisotropy: 0.7
        });

        // Vessel material template
        this.materialTemplates.set('vessel', {
            type: 'physical',
            baseColor: 0xdc143c,
            roughness: 0.3,
            metalness: 0.0,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1,
            transmission: 0.2,
            thickness: 0.3,
            ior: 1.35,
            flow: true,
            flowSpeed: 1.0,
            pulsation: true,
            pulsationRate: 1.2
        });

        // Nerve material template
        this.materialTemplates.set('nerve', {
            type: 'physical',
            baseColor: 0xdaa520,
            roughness: 0.5,
            metalness: 0.0,
            clearcoat: 0.2,
            transmission: 0.15,
            thickness: 0.4,
            ior: 1.38,
            electrical: true,
            signalSpeed: 2.0,
            myelinSheath: true
        });

        // Bone material template
        this.materialTemplates.set('bone', {
            type: 'physical',
            baseColor: 0xf5f5dc,
            roughness: 0.8,
            metalness: 0.0,
            clearcoat: 0.05,
            transmission: 0.05,
            thickness: 1.0,
            ior: 1.52,
            porosity: 0.3,
            density: 0.8,
            mineralization: 0.9
        });

        // Cartilage material template
        this.materialTemplates.set('cartilage', {
            type: 'physical',
            baseColor: 0xe6e6fa,
            roughness: 0.7,
            metalness: 0.0,
            clearcoat: 0.4,
            clearcoatRoughness: 0.3,
            transmission: 0.3,
            thickness: 0.6,
            ior: 1.42,
            elasticity: 0.8
        });

        // Fat tissue material template
        this.materialTemplates.set('fat', {
            type: 'physical',
            baseColor: 0xfff8dc,
            roughness: 0.9,
            metalness: 0.0,
            clearcoat: 0.1,
            transmission: 0.4,
            thickness: 0.9,
            ior: 1.33,
            softness: 0.9
        });
    }

    /**
     * Create material for specific tissue type
     */
    createMaterial(type, customProperties = {}) {
        const template = this.materialTemplates.get(type);
        if (!template) {
            console.warn(`Material template not found for type: ${type}`);
            return this.createDefaultMaterial();
        }

        // Merge template with custom properties
        const properties = { ...template, ...customProperties };

        let material;

        switch (properties.type) {
            case 'physical':
                material = this.createPhysicalMaterial(properties);
                break;
            case 'shader':
                material = this.createShaderMaterial(properties);
                break;
            default:
                material = this.createPhysicalMaterial(properties);
        }

        // Add tissue-specific enhancements
        this.enhanceMaterialForTissue(material, type, properties);

        // Cache material
        const cacheKey = `${type}_${JSON.stringify(customProperties)}`;
        this.materials.set(cacheKey, material);

        return material;
    }

    /**
     * Create physically-based material
     */
    createPhysicalMaterial(properties) {
        const material = new THREE.MeshPhysicalMaterial({
            color: properties.baseColor,
            roughness: properties.roughness,
            metalness: properties.metalness,
            clearcoat: properties.clearcoat || 0,
            clearcoatRoughness: properties.clearcoatRoughness || 0,
            transmission: properties.transmission || 0,
            thickness: properties.thickness || 1,
            ior: properties.ior || 1.5,
            sheen: properties.sheen || 0,
            sheenColor: properties.sheenColor ? new THREE.Color(properties.sheenColor) : undefined,
            transparent: properties.transmission > 0 || properties.opacity < 1,
            opacity: properties.opacity || 1
        });

        // Add custom properties
        material.userData = {
            tissueType: properties.tissueType,
            customProperties: properties
        };

        return material;
    }

    /**
     * Create shader material for advanced effects
     */
    createShaderMaterial(properties) {
        // Use pre-cached shaders or create new ones
        const shaderKey = `${properties.tissueType}_shader`;

        if (this.shaderCache.has(shaderKey)) {
            const cachedShader = this.shaderCache.get(shaderKey);
            return new THREE.ShaderMaterial({
                ...cachedShader,
                uniforms: THREE.UniformsUtils.clone(cachedShader.uniforms)
            });
        }

        // Create new shader material (simplified example)
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(properties.baseColor) },
                roughness: { value: properties.roughness }
            },
            vertexShader: this.getVertexShader(properties.tissueType),
            fragmentShader: this.getFragmentShader(properties.tissueType),
            transparent: true
        });

        this.shaderCache.set(shaderKey, material);
        return material;
    }

    /**
     * Enhance material for specific tissue types
     */
    enhanceMaterialForTissue(material, tissueType, properties) {
        switch (tissueType) {
            case 'skin':
                this.enhanceSkinMaterial(material, properties);
                break;
            case 'muscle':
                this.enhanceMuscleMaterial(material, properties);
                break;
            case 'vessel':
                this.enhanceVesselMaterial(material, properties);
                break;
            case 'nerve':
                this.enhanceNerveMaterial(material, properties);
                break;
            case 'bone':
                this.enhanceBoneMaterial(material, properties);
                break;
        }
    }

    /**
     * Enhance skin material with subsurface scattering
     */
    enhanceSkinMaterial(material, properties) {
        // Add skin-specific textures
        if (this.textureCache.has('skin_diffuse')) {
            material.map = this.textureCache.get('skin_diffuse');
        }

        if (this.textureCache.has('skin_normal')) {
            material.normalMap = this.textureCache.get('skin_normal');
            material.normalScale = new THREE.Vector2(0.3, 0.3);
        }

        if (this.textureCache.has('skin_roughness')) {
            material.roughnessMap = this.textureCache.get('skin_roughness');
        }

        // Subsurface scattering approximation
        if (properties.subsurface) {
            material.transmission = 0.1;
            material.thickness = properties.subsurfaceRadius || 0.3;
        }

        // Skin-specific properties
        material.userData.subsurfaceColor = properties.subsurfaceColor;
        material.userData.subsurfaceRadius = properties.subsurfaceRadius;
    }

    /**
     * Enhance muscle material with fiber structure
     */
    enhanceMuscleMaterial(material, properties) {
        // Add muscle fiber textures
        if (this.textureCache.has('muscle_fiber')) {
            material.map = this.textureCache.get('muscle_fiber');
        }

        // Anisotropic properties for muscle fibers
        if (properties.anisotropy) {
            material.userData.anisotropy = properties.anisotropy;
            material.userData.fiberDirection = properties.fiberDirection;
        }

        // Muscle contraction simulation
        material.userData.contractile = true;
        material.userData.contractionAmount = 0;
    }

    /**
     * Enhance vessel material with flow simulation
     */
    enhanceVesselMaterial(material, properties) {
        // Flow and pulsation effects
        if (properties.flow) {
            material.userData.flow = true;
            material.userData.flowSpeed = properties.flowSpeed || 1.0;
        }

        if (properties.pulsation) {
            material.userData.pulsation = true;
            material.userData.pulsationRate = properties.pulsationRate || 1.2;
        }

        // Blood oxygenation levels
        material.userData.oxygenation = 0.8; // Default arterial
    }

    /**
     * Enhance nerve material with electrical activity
     */
    enhanceNerveMaterial(material, properties) {
        // Electrical signal simulation
        if (properties.electrical) {
            material.userData.electrical = true;
            material.userData.signalSpeed = properties.signalSpeed || 2.0;
            material.userData.signalIntensity = 0.5;
        }

        // Myelin sheath properties
        if (properties.myelinSheath) {
            material.userData.myelinSheath = true;
            material.userData.myelinThickness = 0.8;
        }
    }

    /**
     * Enhance bone material with structure details
     */
    enhanceBoneMaterial(material, properties) {
        // Bone structure textures
        if (this.textureCache.has('bone_structure')) {
            material.map = this.textureCache.get('bone_structure');
        }

        // Porosity and density
        material.userData.porosity = properties.porosity || 0.3;
        material.userData.density = properties.density || 0.8;
        material.userData.mineralization = properties.mineralization || 0.9;
    }

    /**
     * Create procedural textures for materials
     */
    createProceduralTextures() {
        this.createSkinTextures();
        this.createMuscleTextures();
        this.createBoneTextures();
        this.createVesselTextures();
        this.createNerveTextures();
    }

    /**
     * Create skin textures
     */
    createSkinTextures() {
        const size = 512;

        // Skin diffuse texture
        const skinCanvas = document.createElement('canvas');
        skinCanvas.width = skinCanvas.height = size;
        const skinCtx = skinCanvas.getContext('2d');

        // Generate skin color variations
        const imageData = skinCtx.createImageData(size, size);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const x = (i / 4) % size;
            const y = Math.floor((i / 4) / size);

            // Add skin detail noise
            const noise = this.noise2D(x * 0.1, y * 0.1) * 0.1 + 0.9;
            const poreNoise = this.noise2D(x * 0.5, y * 0.5) * 0.05;

            imageData.data[i] = Math.floor(255 * noise * (1 - poreNoise));     // R
            imageData.data[i + 1] = Math.floor(219 * noise * (1 - poreNoise)); // G
            imageData.data[i + 2] = Math.floor(204 * noise * (1 - poreNoise)); // B
            imageData.data[i + 3] = 255;                                        // A
        }
        skinCtx.putImageData(imageData, 0, 0);

        const skinTexture = new THREE.CanvasTexture(skinCanvas);
        skinTexture.wrapS = skinTexture.wrapT = THREE.RepeatWrapping;
        this.textureCache.set('skin_diffuse', skinTexture);

        // Skin normal map
        this.createSkinNormalMap(size);

        // Skin roughness map
        this.createSkinRoughnessMap(size);
    }

    /**
     * Create skin normal map
     */
    createSkinNormalMap(size) {
        const normalCanvas = document.createElement('canvas');
        normalCanvas.width = normalCanvas.height = size;
        const normalCtx = normalCanvas.getContext('2d');

        const imageData = normalCtx.createImageData(size, size);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const x = (i / 4) % size;
            const y = Math.floor((i / 4) / size);

            // Generate surface normal variations
            const normalX = this.noise2D(x * 0.2, y * 0.2) * 20 - 10;
            const normalY = this.noise2D(x * 0.2 + 100, y * 0.2 + 100) * 20 - 10;

            imageData.data[i] = 128 + normalX;     // X
            imageData.data[i + 1] = 128 + normalY; // Y
            imageData.data[i + 2] = 255;          // Z
            imageData.data[i + 3] = 255;          // A
        }
        normalCtx.putImageData(imageData, 0, 0);

        const normalTexture = new THREE.CanvasTexture(normalCanvas);
        normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
        this.textureCache.set('skin_normal', normalTexture);
    }

    /**
     * Create skin roughness map
     */
    createSkinRoughnessMap(size) {
        const roughnessCanvas = document.createElement('canvas');
        roughnessCanvas.width = roughnessCanvas.height = size;
        const roughnessCtx = roughnessCanvas.getContext('2d');

        const imageData = roughnessCtx.createImageData(size, size);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const x = (i / 4) % size;
            const y = Math.floor((i / 4) / size);

            // Vary roughness based on skin features
            const baseRoughness = 0.4;
            const variation = this.noise2D(x * 0.15, y * 0.15) * 0.3;
            const roughness = Math.max(0.1, Math.min(1.0, baseRoughness + variation));

            const value = Math.floor(roughness * 255);
            imageData.data[i] = value;     // R
            imageData.data[i + 1] = value; // G
            imageData.data[i + 2] = value; // B
            imageData.data[i + 3] = 255;   // A
        }
        roughnessCtx.putImageData(imageData, 0, 0);

        const roughnessTexture = new THREE.CanvasTexture(roughnessCanvas);
        roughnessTexture.wrapS = roughnessTexture.wrapT = THREE.RepeatWrapping;
        this.textureCache.set('skin_roughness', roughnessTexture);
    }

    /**
     * Create muscle textures
     */
    createMuscleTextures() {
        const size = 256;
        const fiberCanvas = document.createElement('canvas');
        fiberCanvas.width = fiberCanvas.height = size;
        const fiberCtx = fiberCanvas.getContext('2d');

        // Create muscle fiber pattern
        const imageData = fiberCtx.createImageData(size, size);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const x = (i / 4) % size;
            const y = Math.floor((i / 4) / size);

            // Create fiber pattern
            const fiberPattern = Math.sin(y * 0.3) * 0.3 + 0.7;
            const crossPattern = Math.sin(x * 0.1) * 0.1 + 0.9;

            const r = Math.floor(204 * fiberPattern * crossPattern);
            const g = Math.floor(74 * fiberPattern * crossPattern);
            const b = Math.floor(122 * fiberPattern * crossPattern);

            imageData.data[i] = r;       // R
            imageData.data[i + 1] = g;   // G
            imageData.data[i + 2] = b;   // B
            imageData.data[i + 3] = 255; // A
        }
        fiberCtx.putImageData(imageData, 0, 0);

        const fiberTexture = new THREE.CanvasTexture(fiberCanvas);
        fiberTexture.wrapS = fiberTexture.wrapT = THREE.RepeatWrapping;
        this.textureCache.set('muscle_fiber', fiberTexture);
    }

    /**
     * Create bone textures
     */
    createBoneTextures() {
        const size = 256;
        const boneCanvas = document.createElement('canvas');
        boneCanvas.width = boneCanvas.height = size;
        const boneCtx = boneCanvas.getContext('2d');

        // Create bone structure pattern
        const imageData = boneCtx.createImageData(size, size);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const x = (i / 4) % size;
            const y = Math.floor((i / 4) / size);

            // Trabecular structure
            const trabecular = this.fractalNoise(x * 0.05, y * 0.05, 4) * 0.4 + 0.6;

            // Cortical density
            const distFromCenter = Math.sqrt(Math.pow(x - size/2, 2) + Math.pow(y - size/2, 2));
            const cortical = Math.max(0.7, 1 - (distFromCenter / (size * 0.4)));

            const density = trabecular * cortical;
            const value = Math.floor(density * 255);

            imageData.data[i] = value;   // R
            imageData.data[i + 1] = value; // G
            imageData.data[i + 2] = value; // B
            imageData.data[i + 3] = 255;   // A
        }
        boneCtx.putImageData(imageData, 0, 0);

        const boneTexture = new THREE.CanvasTexture(boneCanvas);
        boneTexture.wrapS = boneTexture.wrapT = THREE.RepeatWrapping;
        this.textureCache.set('bone_structure', boneTexture);
    }

    /**
     * Create vessel textures (placeholder)
     */
    createVesselTextures() {
        // Vessel textures would include flow patterns, wall thickness variations, etc.
        // Simplified for this implementation
    }

    /**
     * Create nerve textures (placeholder)
     */
    createNerveTextures() {
        // Nerve textures would include myelin patterns, conduction pathways, etc.
        // Simplified for this implementation
    }

    /**
     * Update material animations
     */
    updateMaterials(deltaTime) {
        this.materials.forEach((material, key) => {
            this.updateMaterialAnimations(material, deltaTime);
        });
    }

    /**
     * Update individual material animations
     */
    updateMaterialAnimations(material, deltaTime) {
        const userData = material.userData;
        const time = performance.now() * 0.001;

        // Update flow animations for vessels
        if (userData.flow) {
            if (material.uniforms && material.uniforms.time) {
                material.uniforms.time.value = time * userData.flowSpeed;
            }
        }

        // Update electrical activity for nerves
        if (userData.electrical) {
            if (material.uniforms && material.uniforms.signalIntensity) {
                const signal = Math.sin(time * userData.signalSpeed * 5) * 0.5 + 0.5;
                material.uniforms.signalIntensity.value = signal * 0.8;
            }
        }

        // Update muscle contraction
        if (userData.contractile && userData.contractionAmount > 0) {
            if (material.uniforms && material.uniforms.contractionAmount) {
                material.uniforms.contractionAmount.value = userData.contractionAmount;
            }
        }

        // Update pulsation for vessels
        if (userData.pulsation) {
            const pulse = Math.sin(time * userData.pulsationRate * 2) * 0.2 + 0.8;
            if (material.emissiveIntensity !== undefined) {
                material.emissiveIntensity = pulse * 0.3;
            }
        }
    }

    /**
     * Simple 2D noise function
     */
    noise2D(x, y) {
        return Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1;
    }

    /**
     * Fractal noise function
     */
    fractalNoise(x, y, octaves) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;

        for (let i = 0; i < octaves; i++) {
            value += this.noise2D(x * frequency, y * frequency) * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        return value;
    }

    /**
     * Get vertex shader for tissue type
     */
    getVertexShader(tissueType) {
        // Return appropriate vertex shader based on tissue type
        return `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * Get fragment shader for tissue type
     */
    getFragmentShader(tissueType) {
        // Return appropriate fragment shader based on tissue type
        return `
            uniform float time;
            uniform vec3 baseColor;
            uniform float roughness;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vec3 normal = normalize(vNormal);
                vec3 color = baseColor;

                // Add tissue-specific effects here

                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }

    /**
     * Create default material
     */
    createDefaultMaterial() {
        return new THREE.MeshPhysicalMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.0
        });
    }

    /**
     * Get material statistics
     */
    getMaterialStats() {
        return {
            totalMaterials: this.materials.size,
            cachedShaders: this.shaderCache.size,
            cachedTextures: this.textureCache.size,
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    /**
     * Estimate memory usage
     */
    estimateMemoryUsage() {
        let totalMemory = 0;

        // Estimate texture memory
        this.textureCache.forEach((texture, key) => {
            if (texture.image) {
                const { width, height } = texture.image;
                totalMemory += width * height * 4; // 4 bytes per pixel (RGBA)
            }
        });

        return Math.round(totalMemory / (1024 * 1024)); // Convert to MB
    }

    /**
     * Dispose resources
     */
    dispose() {
        this.materials.forEach((material, key) => {
            material.dispose();
        });

        this.textureCache.forEach((texture, key) => {
            texture.dispose();
        });

        this.materials.clear();
        this.shaderCache.clear();
        this.textureCache.clear();
    }
}

export { MedicalLightingSystem, MedicalMaterialSystem };