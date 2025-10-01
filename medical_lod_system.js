/**
 * Advanced Level-of-Detail (LOD) System for Medical 3D Models
 * Optimizes rendering performance by dynamically adjusting model complexity
 * based on distance, screen size, and performance metrics
 */

import * as THREE from 'three';

/**
 * LOD Manager for Medical Visualization
 */
class MedicalLODManager {
    constructor(renderer, camera) {
        this.renderer = renderer;
        this.camera = camera;
        this.lodObjects = new Map();
        this.performanceMonitor = new PerformanceMonitor();
        this.adaptiveSettings = {
            targetFPS: 60,
            autoAdjust: true,
            qualityLevel: 'high',
            maxTriangles: 500000
        };

        // LOD distance thresholds
        this.distanceThresholds = {
            high: 10,
            medium: 25,
            low: 50,
            billboard: 100
        };

        this.geometryCache = new Map();
        this.materialCache = new Map();
        this.updateQueue = [];
        this.lastUpdateTime = 0;
        this.updateInterval = 100; // ms

        this.initializeSystem();
    }

    initializeSystem() {
        // Create different quality levels for each medical component type
        this.createLODLevels();

        // Setup performance monitoring
        this.performanceMonitor.onPerformanceChange = (metrics) => {
            this.adaptQuality(metrics);
        };
    }

    /**
     * Create LOD levels for different medical component types
     */
    createLODLevels() {
        this.lodTemplates = {
            skin: {
                high: { segments: 64, detail: 1.0, subdivisions: 3 },
                medium: { segments: 32, detail: 0.7, subdivisions: 2 },
                low: { segments: 16, detail: 0.5, subdivisions: 1 },
                billboard: { segments: 4, detail: 0.2, subdivisions: 0 }
            },
            muscle: {
                high: { fibers: 32, detail: 1.0, segments: 24 },
                medium: { fibers: 16, detail: 0.7, segments: 16 },
                low: { fibers: 8, detail: 0.5, segments: 12 },
                billboard: { fibers: 2, detail: 0.2, segments: 8 }
            },
            vessel: {
                high: { branches: 50, segments: 20, radius: 1.0 },
                medium: { branches: 25, segments: 12, radius: 0.8 },
                low: { branches: 12, segments: 8, radius: 0.6 },
                billboard: { branches: 4, segments: 4, radius: 0.4 }
            },
            nerve: {
                high: { branches: 30, segments: 16, detail: 1.0 },
                medium: { branches: 15, segments: 10, detail: 0.7 },
                low: { branches: 8, segments: 6, detail: 0.5 },
                billboard: { branches: 3, segments: 4, detail: 0.3 }
            },
            bone: {
                high: { detail: 1.0, subdivisions: 4, porosity: 1.0 },
                medium: { detail: 0.8, subdivisions: 2, porosity: 0.7 },
                low: { detail: 0.6, subdivisions: 1, porosity: 0.5 },
                billboard: { detail: 0.3, subdivisions: 0, porosity: 0.2 }
            }
        };
    }

    /**
     * Register an object for LOD management
     */
    registerLODObject(object, type, config = {}) {
        const lodObject = {
            object,
            type,
            config: { ...this.lodTemplates[type], ...config },
            currentLOD: 'high',
            lodMeshes: {},
            distance: 0,
            screenSize: 0,
            isVisible: true,
            needsUpdate: true,
            lastUpdateTime: 0,
            priority: config.priority || 1
        };

        // Generate LOD meshes
        this.generateLODMeshes(lodObject);

        this.lodObjects.set(object.uuid, lodObject);
        return lodObject;
    }

    /**
     * Generate different LOD levels for an object
     */
    generateLODMeshes(lodObject) {
        const { type, config } = lodObject;

        Object.keys(this.lodTemplates[type]).forEach(level => {
            const levelConfig = { ...config, ...this.lodTemplates[type][level] };

            switch (type) {
                case 'skin':
                    lodObject.lodMeshes[level] = this.generateSkinLOD(levelConfig);
                    break;
                case 'muscle':
                    lodObject.lodMeshes[level] = this.generateMuscleLOD(levelConfig);
                    break;
                case 'vessel':
                    lodObject.lodMeshes[level] = this.generateVesselLOD(levelConfig);
                    break;
                case 'nerve':
                    lodObject.lodMeshes[level] = this.generateNerveLOD(levelConfig);
                    break;
                case 'bone':
                    lodObject.lodMeshes[level] = this.generateBoneLOD(levelConfig);
                    break;
            }
        });
    }

    /**
     * Generate skin LOD mesh
     */
    generateSkinLOD(config) {
        const cacheKey = `skin_${JSON.stringify(config)}`;
        if (this.geometryCache.has(cacheKey)) {
            return this.geometryCache.get(cacheKey).clone();
        }

        // Create base lip shape with adaptive detail
        const shape = this.createLipShape(config.detail);

        const extrudeSettings = {
            depth: 2 * config.detail,
            bevelEnabled: true,
            bevelSegments: Math.max(2, config.subdivisions * 4),
            steps: Math.max(4, config.segments / 4),
            bevelSize: 0.15 * config.detail,
            bevelThickness: 0.1 * config.detail,
            curveSegments: config.segments
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Adaptive simplification for lower LODs
        if (config.detail < 1.0) {
            this.simplifyGeometry(geometry, config.detail);
        }

        // Add vertex attributes for advanced shading
        this.addVertexAttributes(geometry, config);

        geometry.center();
        this.geometryCache.set(cacheKey, geometry);

        return geometry.clone();
    }

    /**
     * Generate muscle LOD mesh
     */
    generateMuscleLOD(config) {
        const cacheKey = `muscle_${JSON.stringify(config)}`;
        if (this.geometryCache.has(cacheKey)) {
            return this.geometryCache.get(cacheKey).clone();
        }

        const group = new THREE.Group();

        // Create muscle fibers with adaptive count
        for (let i = 0; i < config.fibers; i++) {
            const fiberGeometry = new THREE.TorusGeometry(
                2.5 + Math.sin(i) * 0.3,
                0.12 * config.detail,
                Math.max(4, config.segments / 2),
                config.segments,
                Math.PI * 0.4
            );

            const fiber = new THREE.Mesh(fiberGeometry);
            const angle = (Math.PI * 2 * i) / config.fibers;

            fiber.position.set(
                Math.cos(angle) * 0.2,
                Math.sin(angle) * 0.1,
                Math.sin(angle * 2) * 0.1
            );
            fiber.rotation.z = angle;

            group.add(fiber);
        }

        this.geometryCache.set(cacheKey, group);
        return group.clone();
    }

    /**
     * Generate vessel LOD mesh
     */
    generateVesselLOD(config) {
        const cacheKey = `vessel_${JSON.stringify(config)}`;
        if (this.geometryCache.has(cacheKey)) {
            return this.geometryCache.get(cacheKey).clone();
        }

        const group = new THREE.Group();

        // Main vessel paths with adaptive branch count
        const vesselPaths = this.generateVesselPaths(config.branches);

        vesselPaths.forEach((path, index) => {
            const curve = new THREE.CatmullRomCurve3(path);
            const tubeGeometry = new THREE.TubeGeometry(
                curve,
                Math.max(8, config.segments),
                0.05 * config.radius,
                Math.max(4, config.segments / 2),
                false
            );

            const vessel = new THREE.Mesh(tubeGeometry);
            group.add(vessel);
        });

        this.geometryCache.set(cacheKey, group);
        return group.clone();
    }

    /**
     * Generate nerve LOD mesh
     */
    generateNerveLOD(config) {
        const cacheKey = `nerve_${JSON.stringify(config)}`;
        if (this.geometryCache.has(cacheKey)) {
            return this.geometryCache.get(cacheKey).clone();
        }

        const group = new THREE.Group();

        // Generate nerve pathways with adaptive detail
        const nervePaths = this.generateNervePaths(config.branches);

        nervePaths.forEach(path => {
            const curve = new THREE.CatmullRomCurve3(path);
            const tubeGeometry = new THREE.TubeGeometry(
                curve,
                Math.max(6, config.segments),
                0.03 * config.detail,
                Math.max(3, config.segments / 3),
                false
            );

            const nerve = new THREE.Mesh(tubeGeometry);
            group.add(nerve);
        });

        // Add nerve endings for higher LODs
        if (config.detail > 0.5) {
            const endingCount = Math.floor(config.branches * config.detail);
            for (let i = 0; i < endingCount; i++) {
                const endingGeometry = new THREE.SphereGeometry(
                    0.02 * config.detail,
                    Math.max(4, config.segments / 4),
                    Math.max(4, config.segments / 4)
                );
                const ending = new THREE.Mesh(endingGeometry);
                ending.position.set(
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 1
                );
                group.add(ending);
            }
        }

        this.geometryCache.set(cacheKey, group);
        return group.clone();
    }

    /**
     * Generate bone LOD mesh
     */
    generateBoneLOD(config) {
        const cacheKey = `bone_${JSON.stringify(config)}`;
        if (this.geometryCache.has(cacheKey)) {
            return this.geometryCache.get(cacheKey).clone();
        }

        const shape = this.createBoneShape(config.detail);

        const extrudeSettings = {
            depth: 1.5 * config.detail,
            bevelEnabled: true,
            bevelSegments: Math.max(2, config.subdivisions * 2),
            steps: Math.max(4, config.subdivisions * 4),
            bevelSize: 0.1 * config.detail,
            bevelThickness: 0.05 * config.detail
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Add porosity effects for higher LODs
        if (config.porosity > 0.5) {
            this.addPorosityDetail(geometry, config.porosity);
        }

        this.geometryCache.set(cacheKey, geometry);
        return geometry.clone();
    }

    /**
     * Update LOD system
     */
    update(deltaTime) {
        const currentTime = performance.now();

        // Throttle updates for performance
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
        }

        this.lastUpdateTime = currentTime;

        // Update performance metrics
        this.performanceMonitor.update(deltaTime);

        // Process LOD objects
        this.lodObjects.forEach((lodObject, uuid) => {
            this.updateLODObject(lodObject);
        });

        // Batch apply LOD changes
        this.applyLODChanges();
    }

    /**
     * Update individual LOD object
     */
    updateLODObject(lodObject) {
        // Calculate distance from camera
        const distance = lodObject.object.position.distanceTo(this.camera.position);
        lodObject.distance = distance;

        // Calculate screen size
        const boundingSphere = new THREE.Sphere();
        lodObject.object.geometry?.computeBoundingSphere();
        if (lodObject.object.geometry?.boundingSphere) {
            boundingSphere.copy(lodObject.object.geometry.boundingSphere);
            boundingSphere.applyMatrix4(lodObject.object.matrixWorld);

            const screenSize = this.calculateScreenSize(boundingSphere);
            lodObject.screenSize = screenSize;
        }

        // Determine appropriate LOD level
        const newLOD = this.determineLODLevel(lodObject);

        if (newLOD !== lodObject.currentLOD) {
            lodObject.needsUpdate = true;
            lodObject.targetLOD = newLOD;
            this.updateQueue.push(lodObject);
        }
    }

    /**
     * Determine appropriate LOD level based on distance and performance
     */
    determineLODLevel(lodObject) {
        const { distance, screenSize, priority } = lodObject;
        const performanceMetrics = this.performanceMonitor.getMetrics();

        // Performance-based adjustment
        let adjustedThresholds = { ...this.distanceThresholds };

        if (this.adaptiveSettings.autoAdjust) {
            const performanceRatio = performanceMetrics.fps / this.adaptiveSettings.targetFPS;

            if (performanceRatio < 0.8) {
                // Performance is low, use more aggressive LOD
                Object.keys(adjustedThresholds).forEach(key => {
                    adjustedThresholds[key] *= 0.7;
                });
            } else if (performanceRatio > 1.2) {
                // Performance is good, can use higher quality
                Object.keys(adjustedThresholds).forEach(key => {
                    adjustedThresholds[key] *= 1.3;
                });
            }
        }

        // Priority adjustment (higher priority objects get better LOD)
        const priorityMultiplier = priority;
        Object.keys(adjustedThresholds).forEach(key => {
            adjustedThresholds[key] *= priorityMultiplier;
        });

        // Screen size consideration
        const minScreenSize = 0.01; // 1% of screen
        if (screenSize < minScreenSize) {
            return 'billboard';
        }

        // Distance-based LOD selection
        if (distance < adjustedThresholds.high) {
            return 'high';
        } else if (distance < adjustedThresholds.medium) {
            return 'medium';
        } else if (distance < adjustedThresholds.low) {
            return 'low';
        } else {
            return 'billboard';
        }
    }

    /**
     * Calculate screen size of object
     */
    calculateScreenSize(boundingSphere) {
        const distance = this.camera.position.distanceTo(boundingSphere.center);
        const radius = boundingSphere.radius;

        // Project sphere to screen space
        const fov = this.camera.fov * Math.PI / 180;
        const projectedRadius = Math.atan(radius / distance) / (fov / 2);

        return projectedRadius; // Normalized screen size
    }

    /**
     * Apply LOD changes to objects
     */
    applyLODChanges() {
        if (this.updateQueue.length === 0) return;

        // Sort by priority for batch processing
        this.updateQueue.sort((a, b) => b.priority - a.priority);

        const maxUpdatesPerFrame = 5; // Limit updates per frame
        const updatesToProcess = this.updateQueue.splice(0, maxUpdatesPerFrame);

        updatesToProcess.forEach(lodObject => {
            this.switchLOD(lodObject);
        });
    }

    /**
     * Switch LOD for an object
     */
    switchLOD(lodObject) {
        const { object, targetLOD, lodMeshes, type } = lodObject;

        if (!lodMeshes[targetLOD]) {
            console.warn(`LOD level ${targetLOD} not found for ${type}`);
            return;
        }

        // Smooth transition for visible changes
        if (this.isLODTransitionVisible(lodObject.currentLOD, targetLOD)) {
            this.animateLODTransition(lodObject, targetLOD);
        } else {
            // Immediate switch for non-visible changes
            this.applyLODGeometry(object, lodMeshes[targetLOD]);
            lodObject.currentLOD = targetLOD;
        }

        lodObject.needsUpdate = false;
        lodObject.lastUpdateTime = performance.now();
    }

    /**
     * Check if LOD transition will be visually noticeable
     */
    isLODTransitionVisible(currentLOD, targetLOD) {
        const lodLevels = ['billboard', 'low', 'medium', 'high'];
        const currentIndex = lodLevels.indexOf(currentLOD);
        const targetIndex = lodLevels.indexOf(targetLOD);

        // Consider transition visible if jumping more than one level
        return Math.abs(currentIndex - targetIndex) > 1;
    }

    /**
     * Animate LOD transition for smooth visual changes
     */
    animateLODTransition(lodObject, targetLOD) {
        const { object, lodMeshes, currentLOD } = lodObject;
        const duration = 200; // ms

        // Create temporary mesh for transition
        const currentMesh = object.clone();
        const targetMesh = lodMeshes[targetLOD].clone();

        // Fade transition
        currentMesh.material = currentMesh.material.clone();
        targetMesh.material = targetMesh.material.clone();

        targetMesh.material.transparent = true;
        targetMesh.material.opacity = 0;

        object.parent.add(targetMesh);
        targetMesh.position.copy(object.position);
        targetMesh.rotation.copy(object.rotation);
        targetMesh.scale.copy(object.scale);

        // Animate transition
        const startTime = performance.now();
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const opacity = this.easeInOut(progress);
            currentMesh.material.opacity = 1 - opacity;
            targetMesh.material.opacity = opacity;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Complete transition
                this.applyLODGeometry(object, lodMeshes[targetLOD]);
                object.parent.remove(targetMesh);
                lodObject.currentLOD = targetLOD;
            }
        };

        animate();
    }

    /**
     * Apply LOD geometry to object
     */
    applyLODGeometry(object, lodGeometry) {
        if (lodGeometry.isGroup) {
            // Handle group objects (like muscles, vessels)
            object.clear();
            lodGeometry.children.forEach(child => {
                object.add(child.clone());
            });
        } else {
            // Handle single geometry objects
            object.geometry.dispose();
            object.geometry = lodGeometry;
        }
    }

    /**
     * Adapt quality based on performance metrics
     */
    adaptQuality(metrics) {
        if (!this.adaptiveSettings.autoAdjust) return;

        const { fps, frameTime, memoryUsage } = metrics;
        const targetFPS = this.adaptiveSettings.targetFPS;

        if (fps < targetFPS * 0.8) {
            // Performance is poor, reduce quality
            this.reduceQuality();
        } else if (fps > targetFPS * 1.2 && frameTime < 8) {
            // Performance is good, can increase quality
            this.increaseQuality();
        }

        // Memory pressure adaptation
        if (memoryUsage > 0.8) {
            this.optimizeMemoryUsage();
        }
    }

    /**
     * Reduce overall quality for better performance
     */
    reduceQuality() {
        // Adjust distance thresholds to use lower LODs sooner
        Object.keys(this.distanceThresholds).forEach(key => {
            this.distanceThresholds[key] *= 0.8;
        });

        // Force update all objects
        this.lodObjects.forEach(lodObject => {
            lodObject.needsUpdate = true;
        });

        this.adaptiveSettings.qualityLevel = 'low';
    }

    /**
     * Increase quality when performance allows
     */
    increaseQuality() {
        if (this.adaptiveSettings.qualityLevel === 'high') return;

        // Adjust distance thresholds to use higher LODs
        Object.keys(this.distanceThresholds).forEach(key => {
            this.distanceThresholds[key] *= 1.1;
        });

        // Force update all objects
        this.lodObjects.forEach(lodObject => {
            lodObject.needsUpdate = true;
        });

        this.adaptiveSettings.qualityLevel = 'medium';
    }

    /**
     * Optimize memory usage
     */
    optimizeMemoryUsage() {
        // Clear geometry cache for unused LODs
        const usedGeometries = new Set();
        this.lodObjects.forEach(lodObject => {
            usedGeometries.add(lodObject.currentLOD);
        });

        this.geometryCache.forEach((geometry, key) => {
            const lodLevel = key.split('_').pop();
            if (!usedGeometries.has(lodLevel)) {
                geometry.dispose();
                this.geometryCache.delete(key);
            }
        });
    }

    // Utility methods
    createLipShape(detail) {
        const shape = new THREE.Shape();
        const resolution = Math.max(20, 50 * detail);

        // Upper lip curve with adaptive resolution
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

        const upperPoints = upperLipCurve.getPoints(Math.floor(resolution / 2));
        shape.moveTo(upperPoints[0].x, upperPoints[0].y);
        upperPoints.slice(1).forEach(point => shape.lineTo(point.x, point.y));

        // Lower lip curve
        const lowerLipCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(3.2, 0, 0),
            new THREE.Vector3(2.8, -0.8, 0.4),
            new THREE.Vector3(2.0, -1.4, 0.5),
            new THREE.Vector3(1.0, -1.7, 0.6),
            new THREE.Vector3(0, -1.8, 0.6),
            new THREE.Vector3(-1.0, -1.7, 0.6),
            new THREE.Vector3(-2.0, -1.4, 0.5),
            new THREE.Vector3(-2.8, -0.8, 0.4),
            new THREE.Vector3(-3.2, 0, 0)
        ]);

        const lowerPoints = lowerLipCurve.getPoints(Math.floor(resolution / 2));
        lowerPoints.forEach(point => shape.lineTo(point.x, point.y));

        return shape;
    }

    createBoneShape(detail) {
        const shape = new THREE.Shape();
        const complexity = Math.max(8, 20 * detail);

        // Simplified bone shape with adaptive detail
        shape.moveTo(-4, 0);
        for (let i = 0; i <= complexity; i++) {
            const angle = (Math.PI * 2 * i) / complexity;
            const radius = 3 + Math.sin(angle * 3) * 0.5 * detail;
            shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }

        return shape;
    }

    simplifyGeometry(geometry, targetRatio) {
        // Implement geometry simplification algorithm
        // This is a simplified version - in production, use libraries like three-mesh-simplifier
        const positions = geometry.getAttribute('position');
        const originalCount = positions.count;
        const targetCount = Math.floor(originalCount * targetRatio);

        if (targetCount >= originalCount) return;

        // Simple vertex reduction by step sampling
        const step = Math.floor(originalCount / targetCount);
        const newPositions = [];

        for (let i = 0; i < originalCount; i += step) {
            newPositions.push(
                positions.getX(i),
                positions.getY(i),
                positions.getZ(i)
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
        geometry.computeVertexNormals();
    }

    addVertexAttributes(geometry, config) {
        const positions = geometry.getAttribute('position');
        const vertexCount = positions.count;

        // Add thickness attribute for subsurface scattering
        const thickness = new Float32Array(vertexCount);
        const curvature = new Float32Array(vertexCount);

        for (let i = 0; i < vertexCount; i++) {
            const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
            const distanceFromCenter = vertex.distanceTo(new THREE.Vector3(0, 0, 0));

            thickness[i] = Math.max(0.1, 1.0 - distanceFromCenter * 0.1) * config.detail;
            curvature[i] = (Math.abs(vertex.y) * 0.5 + 0.5) * config.detail;
        }

        geometry.setAttribute('thickness', new THREE.BufferAttribute(thickness, 1));
        geometry.setAttribute('curvature', new THREE.BufferAttribute(curvature, 1));
    }

    generateVesselPaths(branchCount) {
        const paths = [];

        // Main arteries
        paths.push([
            new THREE.Vector3(-3.5, 1.2, 0),
            new THREE.Vector3(-2.5, 1.4, 0.2),
            new THREE.Vector3(-1.5, 1.6, 0.3),
            new THREE.Vector3(-0.5, 1.7, 0.4),
            new THREE.Vector3(0.5, 1.7, 0.4),
            new THREE.Vector3(1.5, 1.6, 0.3),
            new THREE.Vector3(2.5, 1.4, 0.2),
            new THREE.Vector3(3.5, 1.2, 0)
        ]);

        // Generate additional branches based on count
        for (let i = 1; i < branchCount; i++) {
            const path = [];
            const angle = (Math.PI * 2 * i) / branchCount;
            const radius = 2 + Math.random();

            for (let j = 0; j < 4; j++) {
                path.push(new THREE.Vector3(
                    Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
                    Math.sin(angle) * radius * 0.5 + (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.3
                ));
                radius *= 0.8;
            }

            paths.push(path);
        }

        return paths;
    }

    generateNervePaths(branchCount) {
        const paths = [];

        // Main nerve pathways
        const mainPaths = [
            [
                new THREE.Vector3(-4.5, 2.5, 2),
                new THREE.Vector3(-3.8, 2.2, 1.5),
                new THREE.Vector3(-3.2, 1.8, 1),
                new THREE.Vector3(-2.6, 1.4, 0.5),
                new THREE.Vector3(-2, 1, 0.2)
            ],
            [
                new THREE.Vector3(4.5, 2.5, 2),
                new THREE.Vector3(3.8, 2.2, 1.5),
                new THREE.Vector3(3.2, 1.8, 1),
                new THREE.Vector3(2.6, 1.4, 0.5),
                new THREE.Vector3(2, 1, 0.2)
            ]
        ];

        paths.push(...mainPaths);

        // Generate smaller nerve branches
        for (let i = 2; i < branchCount; i++) {
            const path = [];
            const startX = (Math.random() - 0.5) * 4;
            const startY = (Math.random() - 0.5) * 2 + 1;

            for (let j = 0; j < 3; j++) {
                path.push(new THREE.Vector3(
                    startX + (Math.random() - 0.5) * 0.5,
                    startY - j * 0.3 + (Math.random() - 0.5) * 0.2,
                    1 - j * 0.2 + (Math.random() - 0.5) * 0.1
                ));
            }

            paths.push(path);
        }

        return paths;
    }

    addPorosityDetail(geometry, porosity) {
        // Add geometric detail for bone porosity
        const positions = geometry.getAttribute('position');
        const modifiedPositions = [];

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);

            // Add small random displacements for porosity
            const displacement = (Math.random() - 0.5) * 0.05 * porosity;

            modifiedPositions.push(
                x + displacement,
                y + displacement,
                z + displacement
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(modifiedPositions, 3));
        geometry.computeVertexNormals();
    }

    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Get LOD statistics
     */
    getStatistics() {
        const stats = {
            totalObjects: this.lodObjects.size,
            lodDistribution: { high: 0, medium: 0, low: 0, billboard: 0 },
            cacheSize: this.geometryCache.size,
            updateQueueSize: this.updateQueue.length
        };

        this.lodObjects.forEach(lodObject => {
            stats.lodDistribution[lodObject.currentLOD]++;
        });

        return stats;
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this.geometryCache.forEach(geometry => {
            geometry.dispose();
        });
        this.geometryCache.clear();
        this.materialCache.clear();
        this.lodObjects.clear();
        this.updateQueue.length = 0;
    }
}

/**
 * Performance Monitor for adaptive LOD
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 60,
            frameTime: 16.67,
            memoryUsage: 0,
            triangleCount: 0,
            drawCalls: 0
        };

        this.frameCount = 0;
        this.lastTime = performance.now();
        this.frameTimes = [];
        this.maxFrameTimeHistory = 60;

        this.onPerformanceChange = null;
    }

    update(deltaTime) {
        this.frameCount++;
        const currentTime = performance.now();

        // Calculate FPS
        if (currentTime - this.lastTime >= 1000) {
            this.metrics.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;

            // Trigger performance change callback
            if (this.onPerformanceChange) {
                this.onPerformanceChange(this.metrics);
            }
        }

        // Track frame times
        this.frameTimes.push(deltaTime * 1000);
        if (this.frameTimes.length > this.maxFrameTimeHistory) {
            this.frameTimes.shift();
        }

        // Calculate average frame time
        this.metrics.frameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

        // Get memory usage if available
        if (performance.memory) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
        }
    }

    getMetrics() {
        return { ...this.metrics };
    }

    setTriangleCount(count) {
        this.metrics.triangleCount = count;
    }

    setDrawCalls(count) {
        this.metrics.drawCalls = count;
    }
}

export { MedicalLODManager, PerformanceMonitor };