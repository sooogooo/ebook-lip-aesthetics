/**
 * Advanced Material Simulation for Skin and Tissue
 * Real-time physics-based material simulation for medical visualization
 * Includes soft body physics, viscoelastic behavior, and tissue deformation
 */

import * as THREE from 'three';

/**
 * Advanced Tissue Physics Simulator
 */
class TissuePhysicsSimulator {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.tissues = new Map();
        this.constraints = [];
        this.particles = [];
        this.springs = [];

        // Physics parameters
        this.physics = {
            gravity: new THREE.Vector3(0, -9.81, 0),
            damping: 0.95,
            timeStep: 1/60,
            iterations: 3,
            enabled: true
        };

        // Material properties for different tissues
        this.materialProperties = {
            skin: {
                elasticity: 0.8,
                viscosity: 0.3,
                density: 1020, // kg/m³
                youngModulus: 0.2e6, // Pa
                poissonRatio: 0.45,
                tensileStrength: 27.2e6, // Pa
                compressiveStrength: 11.0e6 // Pa
            },
            muscle: {
                elasticity: 0.6,
                viscosity: 0.4,
                density: 1060,
                youngModulus: 0.5e6,
                poissonRatio: 0.48,
                tensileStrength: 45.0e6,
                compressiveStrength: 15.0e6,
                contractility: 0.8
            },
            fat: {
                elasticity: 0.9,
                viscosity: 0.6,
                density: 916,
                youngModulus: 0.02e6,
                poissonRatio: 0.49,
                tensileStrength: 2.0e6,
                compressiveStrength: 1.0e6,
                softness: 0.95
            },
            vessel: {
                elasticity: 0.7,
                viscosity: 0.2,
                density: 1025,
                youngModulus: 1.0e6,
                poissonRatio: 0.42,
                tensileStrength: 15.0e6,
                compressiveStrength: 8.0e6,
                pulsatility: 0.9
            },
            cartilage: {
                elasticity: 0.4,
                viscosity: 0.8,
                density: 1100,
                youngModulus: 15.0e6,
                poissonRatio: 0.40,
                tensileStrength: 27.0e6,
                compressiveStrength: 100.0e6
            }
        };

        this.deformationHistory = new Map();
        this.stressAnalysis = new Map();
        this.initializePhysics();
    }

    /**
     * Initialize physics simulation
     */
    initializePhysics() {
        // Setup physics world
        this.setupPhysicsWorld();

        // Initialize particle systems for different tissues
        this.initializeParticleSystems();

        // Setup constraints and springs
        this.setupConstraints();
    }

    /**
     * Setup physics world with medical parameters
     */
    setupPhysicsWorld() {
        this.world = {
            particles: [],
            constraints: [],
            forces: [],
            colliders: []
        };

        // Add environmental forces
        this.addEnvironmentalForces();
    }

    /**
     * Add environmental forces
     */
    addEnvironmentalForces() {
        // Gravity
        this.world.forces.push({
            type: 'gravity',
            force: this.physics.gravity.clone(),
            applyTo: 'all'
        });

        // Air resistance
        this.world.forces.push({
            type: 'drag',
            coefficient: 0.1,
            applyTo: 'surface'
        });
    }

    /**
     * Initialize particle systems for tissue simulation
     */
    initializeParticleSystems() {
        // This will be called for each tissue layer
        Object.keys(this.materialProperties).forEach(tissueType => {
            this.createTissueParticleSystem(tissueType);
        });
    }

    /**
     * Create particle system for specific tissue type
     */
    createTissueParticleSystem(tissueType) {
        const properties = this.materialProperties[tissueType];
        const particleSystem = {
            type: tissueType,
            particles: [],
            springs: [],
            properties: properties,
            mesh: null,
            deformationState: {
                currentStrain: 0,
                maxStrain: 0,
                stressField: [],
                velocityField: []
            }
        };

        this.tissues.set(tissueType, particleSystem);
    }

    /**
     * Setup constraints between particles
     */
    setupConstraints() {
        // Distance constraints
        this.setupDistanceConstraints();

        // Volume constraints
        this.setupVolumeConstraints();

        // Surface constraints
        this.setupSurfaceConstraints();

        // Inter-tissue constraints
        this.setupInterTissueConstraints();
    }

    /**
     * Setup distance constraints to maintain tissue structure
     */
    setupDistanceConstraints() {
        this.tissues.forEach((tissueSystem, tissueType) => {
            const particles = tissueSystem.particles;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const distance = particles[i].position.distanceTo(particles[j].position);

                    if (distance < this.getMaxConnectionDistance(tissueType)) {
                        const constraint = {
                            type: 'distance',
                            particleA: particles[i],
                            particleB: particles[j],
                            restLength: distance,
                            stiffness: this.getConstraintStiffness(tissueType),
                            tissueType: tissueType
                        };

                        this.constraints.push(constraint);
                        tissueSystem.springs.push(constraint);
                    }
                }
            }
        });
    }

    /**
     * Setup volume constraints to maintain tissue volume
     */
    setupVolumeConstraints() {
        this.tissues.forEach((tissueSystem, tissueType) => {
            const constraint = {
                type: 'volume',
                particles: tissueSystem.particles,
                restVolume: this.calculateTissueVolume(tissueSystem.particles),
                stiffness: 0.1,
                tissueType: tissueType
            };

            this.constraints.push(constraint);
        });
    }

    /**
     * Setup surface constraints to maintain tissue surface
     */
    setupSurfaceConstraints() {
        this.tissues.forEach((tissueSystem, tissueType) => {
            if (tissueType === 'skin') {
                // Skin needs special surface tension constraints
                this.setupSkinSurfaceConstraints(tissueSystem);
            }
        });
    }

    /**
     * Setup skin surface constraints for realistic skin behavior
     */
    setupSkinSurfaceConstraints(skinSystem) {
        const surfaceParticles = this.identifySurfaceParticles(skinSystem.particles);

        surfaceParticles.forEach(particle => {
            const constraint = {
                type: 'surface_tension',
                particle: particle,
                targetPosition: particle.position.clone(),
                stiffness: 0.5,
                damping: 0.3
            };

            this.constraints.push(constraint);
        });
    }

    /**
     * Setup constraints between different tissue layers
     */
    setupInterTissueConstraints() {
        // Connect skin to muscle
        this.connectTissueLayers('skin', 'muscle', 0.8);

        // Connect muscle to fat
        this.connectTissueLayers('muscle', 'fat', 0.6);

        // Connect vessels to surrounding tissues
        this.connectVesselsToTissues();
    }

    /**
     * Connect two tissue layers with constraints
     */
    connectTissueLayers(tissueA, tissueB, strength) {
        const systemA = this.tissues.get(tissueA);
        const systemB = this.tissues.get(tissueB);

        if (!systemA || !systemB) return;

        systemA.particles.forEach(particleA => {
            // Find closest particle in tissue B
            let closestParticle = null;
            let minDistance = Infinity;

            systemB.particles.forEach(particleB => {
                const distance = particleA.position.distanceTo(particleB.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestParticle = particleB;
                }
            });

            if (closestParticle && minDistance < 0.5) {
                const constraint = {
                    type: 'inter_tissue',
                    particleA: particleA,
                    particleB: closestParticle,
                    restLength: minDistance,
                    stiffness: strength,
                    tissueA: tissueA,
                    tissueB: tissueB
                };

                this.constraints.push(constraint);
            }
        });
    }

    /**
     * Connect blood vessels to surrounding tissues
     */
    connectVesselsToTissues() {
        const vesselSystem = this.tissues.get('vessel');
        if (!vesselSystem) return;

        vesselSystem.particles.forEach(vesselParticle => {
            // Connect to nearby skin, muscle, and fat particles
            ['skin', 'muscle', 'fat'].forEach(tissueType => {
                const tissueSystem = this.tissues.get(tissueType);
                if (!tissueSystem) return;

                const nearbyParticles = this.findNearbyParticles(
                    vesselParticle,
                    tissueSystem.particles,
                    0.3
                );

                nearbyParticles.forEach(particle => {
                    const constraint = {
                        type: 'vessel_attachment',
                        particleA: vesselParticle,
                        particleB: particle,
                        restLength: vesselParticle.position.distanceTo(particle.position),
                        stiffness: 0.4,
                        tissueType: tissueType
                    };

                    this.constraints.push(constraint);
                });
            });
        });
    }

    /**
     * Register tissue mesh for physics simulation
     */
    registerTissueMesh(mesh, tissueType) {
        const tissueSystem = this.tissues.get(tissueType);
        if (!tissueSystem) return;

        tissueSystem.mesh = mesh;

        // Create particles from mesh vertices
        this.createParticlesFromMesh(mesh, tissueSystem);

        // Update constraints
        this.updateConstraintsForTissue(tissueType);
    }

    /**
     * Create physics particles from mesh vertices
     */
    createParticlesFromMesh(mesh, tissueSystem) {
        const geometry = mesh.geometry;
        const positions = geometry.getAttribute('position');
        const properties = tissueSystem.properties;

        tissueSystem.particles = [];

        for (let i = 0; i < positions.count; i++) {
            const particle = {
                id: i,
                position: new THREE.Vector3().fromBufferAttribute(positions, i),
                velocity: new THREE.Vector3(),
                acceleration: new THREE.Vector3(),
                force: new THREE.Vector3(),
                mass: this.calculateParticleMass(properties.density),
                fixed: false,
                tissueType: tissueSystem.type,
                properties: {
                    elasticity: properties.elasticity,
                    viscosity: properties.viscosity,
                    stress: 0,
                    strain: 0
                }
            };

            // Transform to world coordinates
            particle.position.applyMatrix4(mesh.matrixWorld);

            tissueSystem.particles.push(particle);
            this.particles.push(particle);
        }
    }

    /**
     * Apply injection deformation to tissue
     */
    applyInjectionDeformation(injectionPoint, volume, tissueType = 'skin') {
        const tissueSystem = this.tissues.get(tissueType);
        if (!tissueSystem) return;

        const deformation = {
            center: injectionPoint.clone(),
            volume: volume,
            radius: Math.pow(volume * 3 / (4 * Math.PI), 1/3), // Spherical volume
            strength: volume * 0.5,
            timestamp: Date.now(),
            type: 'injection'
        };

        // Apply immediate deformation
        this.applyImmediateDeformation(deformation, tissueSystem);

        // Store for ongoing simulation
        this.storeDeformation(tissueType, deformation);

        // Update visual mesh
        this.updateMeshFromParticles(tissueSystem);
    }

    /**
     * Apply immediate deformation to particles
     */
    applyImmediateDeformation(deformation, tissueSystem) {
        const { center, radius, strength } = deformation;

        tissueSystem.particles.forEach(particle => {
            const distance = particle.position.distanceTo(center);

            if (distance < radius) {
                // Calculate displacement based on distance and tissue properties
                const influence = Math.pow(1 - (distance / radius), 2);
                const displacement = new THREE.Vector3()
                    .subVectors(particle.position, center)
                    .normalize()
                    .multiplyScalar(strength * influence * tissueSystem.properties.elasticity);

                particle.position.add(displacement);

                // Apply stress to particle
                particle.properties.stress += influence * 0.5;
                particle.properties.strain += influence * 0.3;
            }
        });
    }

    /**
     * Store deformation for ongoing simulation
     */
    storeDeformation(tissueType, deformation) {
        if (!this.deformationHistory.has(tissueType)) {
            this.deformationHistory.set(tissueType, []);
        }

        this.deformationHistory.get(tissueType).push(deformation);

        // Limit history size
        const history = this.deformationHistory.get(tissueType);
        if (history.length > 10) {
            history.shift();
        }
    }

    /**
     * Simulate muscle contraction
     */
    simulateMusclContraction(contractionStrength, direction, muscleRegion) {
        const muscleSystem = this.tissues.get('muscle');
        if (!muscleSystem) return;

        const contractionForce = direction.clone().multiplyScalar(contractionStrength);

        muscleSystem.particles.forEach(particle => {
            if (this.isParticleInRegion(particle, muscleRegion)) {
                // Apply contraction force
                const force = contractionForce.clone();

                // Modify force based on muscle fiber direction
                const fiberDirection = this.getMuscleFiberDirection(particle);
                const alignment = force.dot(fiberDirection);
                force.multiplyScalar(alignment * muscleSystem.properties.contractility);

                particle.force.add(force);

                // Update contraction state
                particle.properties.contraction = contractionStrength;
            }
        });

        // Update connected tissues
        this.propagateContractionEffects(contractionStrength, muscleRegion);
    }

    /**
     * Propagate muscle contraction effects to connected tissues
     */
    propagateContractionEffects(contractionStrength, muscleRegion) {
        // Find inter-tissue constraints connected to contracting muscle
        this.constraints.forEach(constraint => {
            if (constraint.type === 'inter_tissue' &&
                (constraint.tissueA === 'muscle' || constraint.tissueB === 'muscle')) {

                const muscleParticle = constraint.tissueA === 'muscle' ?
                    constraint.particleA : constraint.particleB;
                const otherParticle = constraint.tissueA === 'muscle' ?
                    constraint.particleB : constraint.particleA;

                if (this.isParticleInRegion(muscleParticle, muscleRegion)) {
                    // Apply secondary deformation to connected tissue
                    const pullForce = new THREE.Vector3()
                        .subVectors(muscleParticle.position, otherParticle.position)
                        .normalize()
                        .multiplyScalar(contractionStrength * 0.3);

                    otherParticle.force.add(pullForce);
                }
            }
        });
    }

    /**
     * Simulate blood flow effects on vessel walls
     */
    simulateBloodFlow(flowRate, pressure, vesselSegment) {
        const vesselSystem = this.tissues.get('vessel');
        if (!vesselSystem) return;

        vesselSystem.particles.forEach(particle => {
            if (this.isParticleInSegment(particle, vesselSegment)) {
                // Apply pressure deformation
                const pressureForce = this.calculatePressureForce(pressure, particle);
                particle.force.add(pressureForce);

                // Apply flow-induced stress
                const shearStress = this.calculateShearStress(flowRate, particle);
                particle.properties.stress += shearStress;

                // Pulsatile effects
                const pulsation = Math.sin(Date.now() * 0.01) * 0.1 + 0.9;
                particle.force.multiplyScalar(pulsation);
            }
        });
    }

    /**
     * Update physics simulation
     */
    update(deltaTime) {
        if (!this.physics.enabled) return;

        const timeStep = Math.min(deltaTime, this.physics.timeStep);

        // Multiple iterations for stability
        for (let iteration = 0; iteration < this.physics.iterations; iteration++) {
            // Clear forces
            this.clearForces();

            // Apply environmental forces
            this.applyEnvironmentalForces();

            // Solve constraints
            this.solveConstraints();

            // Integrate particles
            this.integrateParticles(timeStep);

            // Update tissue properties
            this.updateTissueProperties();
        }

        // Update visual meshes
        this.updateAllMeshes();

        // Analyze stress and strain
        this.analyzeStressStrain();
    }

    /**
     * Clear all forces on particles
     */
    clearForces() {
        this.particles.forEach(particle => {
            particle.force.set(0, 0, 0);
        });
    }

    /**
     * Apply environmental forces to particles
     */
    applyEnvironmentalForces() {
        this.particles.forEach(particle => {
            if (!particle.fixed) {
                // Gravity
                particle.force.add(
                    this.physics.gravity.clone().multiplyScalar(particle.mass)
                );

                // Damping
                const damping = particle.velocity.clone().multiplyScalar(-this.physics.damping);
                particle.force.add(damping);
            }
        });
    }

    /**
     * Solve all constraints
     */
    solveConstraints() {
        this.constraints.forEach(constraint => {
            switch (constraint.type) {
                case 'distance':
                    this.solveDistanceConstraint(constraint);
                    break;
                case 'volume':
                    this.solveVolumeConstraint(constraint);
                    break;
                case 'surface_tension':
                    this.solveSurfaceTensionConstraint(constraint);
                    break;
                case 'inter_tissue':
                    this.solveInterTissueConstraint(constraint);
                    break;
                case 'vessel_attachment':
                    this.solveVesselAttachmentConstraint(constraint);
                    break;
            }
        });
    }

    /**
     * Solve distance constraint between two particles
     */
    solveDistanceConstraint(constraint) {
        const { particleA, particleB, restLength, stiffness } = constraint;

        const delta = new THREE.Vector3().subVectors(particleB.position, particleA.position);
        const currentLength = delta.length();

        if (currentLength === 0) return;

        const difference = (currentLength - restLength) / currentLength;
        const force = delta.multiplyScalar(difference * stiffness * 0.5);

        if (!particleA.fixed) {
            particleA.position.add(force);
        }
        if (!particleB.fixed) {
            particleB.position.sub(force);
        }
    }

    /**
     * Solve volume constraint for tissue
     */
    solveVolumeConstraint(constraint) {
        const { particles, restVolume, stiffness } = constraint;

        const currentVolume = this.calculateTissueVolume(particles);
        const volumeRatio = currentVolume / restVolume;

        if (Math.abs(volumeRatio - 1) < 0.01) return;

        const scaleFactor = Math.pow(1 / volumeRatio, 1/3) - 1;
        const center = this.calculateCenterOfMass(particles);

        particles.forEach(particle => {
            if (!particle.fixed) {
                const offset = new THREE.Vector3()
                    .subVectors(particle.position, center)
                    .multiplyScalar(scaleFactor * stiffness);

                particle.position.add(offset);
            }
        });
    }

    /**
     * Integrate particle physics
     */
    integrateParticles(timeStep) {
        this.particles.forEach(particle => {
            if (!particle.fixed) {
                // Calculate acceleration
                particle.acceleration.copy(particle.force).divideScalar(particle.mass);

                // Integrate velocity (Verlet integration)
                particle.velocity.add(
                    particle.acceleration.clone().multiplyScalar(timeStep)
                );

                // Integrate position
                particle.position.add(
                    particle.velocity.clone().multiplyScalar(timeStep)
                );
            }
        });
    }

    /**
     * Update tissue material properties based on deformation
     */
    updateTissueProperties() {
        this.tissues.forEach((tissueSystem, tissueType) => {
            tissueSystem.particles.forEach(particle => {
                // Update strain based on deformation
                this.updateParticleStrain(particle);

                // Update stress based on strain and material properties
                this.updateParticleStress(particle, tissueSystem.properties);

                // Check for tissue damage
                this.checkTissueDamage(particle, tissueSystem.properties);
            });
        });
    }

    /**
     * Update all visual meshes from particle positions
     */
    updateAllMeshes() {
        this.tissues.forEach((tissueSystem, tissueType) => {
            if (tissueSystem.mesh) {
                this.updateMeshFromParticles(tissueSystem);
            }
        });
    }

    /**
     * Update mesh geometry from particle positions
     */
    updateMeshFromParticles(tissueSystem) {
        const mesh = tissueSystem.mesh;
        const geometry = mesh.geometry;
        const positions = geometry.getAttribute('position');

        tissueSystem.particles.forEach((particle, index) => {
            if (index < positions.count) {
                // Transform back to local coordinates
                const localPos = particle.position.clone();
                localPos.applyMatrix4(mesh.matrixWorld.clone().invert());

                positions.setXYZ(index, localPos.x, localPos.y, localPos.z);
            }
        });

        positions.needsUpdate = true;
        geometry.computeVertexNormals();
    }

    /**
     * Analyze stress and strain fields
     */
    analyzeStressStrain() {
        this.tissues.forEach((tissueSystem, tissueType) => {
            const analysis = {
                maxStress: 0,
                avgStress: 0,
                maxStrain: 0,
                avgStrain: 0,
                stressDistribution: [],
                strainDistribution: [],
                damagedRegions: []
            };

            let totalStress = 0;
            let totalStrain = 0;

            tissueSystem.particles.forEach(particle => {
                totalStress += particle.properties.stress;
                totalStrain += particle.properties.strain;

                analysis.maxStress = Math.max(analysis.maxStress, particle.properties.stress);
                analysis.maxStrain = Math.max(analysis.maxStrain, particle.properties.strain);

                // Check for damage
                if (this.isParticleDamaged(particle, tissueSystem.properties)) {
                    analysis.damagedRegions.push(particle.position.clone());
                }
            });

            analysis.avgStress = totalStress / tissueSystem.particles.length;
            analysis.avgStrain = totalStrain / tissueSystem.particles.length;

            this.stressAnalysis.set(tissueType, analysis);
        });
    }

    // Helper methods
    getMaxConnectionDistance(tissueType) {
        const distances = {
            skin: 0.2,
            muscle: 0.15,
            fat: 0.25,
            vessel: 0.1,
            cartilage: 0.12
        };
        return distances[tissueType] || 0.2;
    }

    getConstraintStiffness(tissueType) {
        const stiffnesses = {
            skin: 0.8,
            muscle: 0.6,
            fat: 0.4,
            vessel: 0.9,
            cartilage: 0.95
        };
        return stiffnesses[tissueType] || 0.7;
    }

    calculateTissueVolume(particles) {
        // Simplified volume calculation using convex hull approximation
        if (particles.length < 4) return 0;

        // Use center of mass and average distance approximation
        const center = this.calculateCenterOfMass(particles);
        let totalDistance = 0;

        particles.forEach(particle => {
            totalDistance += particle.position.distanceTo(center);
        });

        const avgRadius = totalDistance / particles.length;
        return (4/3) * Math.PI * Math.pow(avgRadius, 3);
    }

    calculateCenterOfMass(particles) {
        const center = new THREE.Vector3();
        particles.forEach(particle => {
            center.add(particle.position);
        });
        return center.divideScalar(particles.length);
    }

    calculateParticleMass(density) {
        // Assume each particle represents a small volume
        const particleVolume = 0.001; // 1mm³
        return density * particleVolume;
    }

    identifySurfaceParticles(particles) {
        // Simplified surface detection
        const center = this.calculateCenterOfMass(particles);
        const surfaceParticles = [];

        particles.forEach(particle => {
            const distanceFromCenter = particle.position.distanceTo(center);

            // Check if particle is on the surface by comparing with nearby particles
            let isOnSurface = true;
            const neighbors = this.findNearbyParticles(particle, particles, 0.15);

            if (neighbors.length >= 6) {
                isOnSurface = false; // Particle is surrounded, likely internal
            }

            if (isOnSurface) {
                surfaceParticles.push(particle);
            }
        });

        return surfaceParticles;
    }

    findNearbyParticles(targetParticle, particles, radius) {
        return particles.filter(particle => {
            if (particle === targetParticle) return false;
            return particle.position.distanceTo(targetParticle.position) <= radius;
        });
    }

    isParticleInRegion(particle, region) {
        // Check if particle is within a defined region
        if (!region || !region.center || !region.radius) return false;

        return particle.position.distanceTo(region.center) <= region.radius;
    }

    isParticleInSegment(particle, segment) {
        // Check if particle is within a vessel segment
        if (!segment || !segment.start || !segment.end) return false;

        const segmentLength = segment.start.distanceTo(segment.end);
        const particleDistanceFromStart = particle.position.distanceTo(segment.start);
        const particleDistanceFromEnd = particle.position.distanceTo(segment.end);

        return (particleDistanceFromStart + particleDistanceFromEnd) <= segmentLength * 1.1;
    }

    getMuscleFiberDirection(particle) {
        // Get muscle fiber direction for particle (simplified)
        return new THREE.Vector3(1, 0, 0); // Default horizontal fiber direction
    }

    calculatePressureForce(pressure, particle) {
        // Calculate force due to internal pressure
        const normal = this.calculateParticleNormal(particle);
        return normal.multiplyScalar(pressure);
    }

    calculateShearStress(flowRate, particle) {
        // Simplified shear stress calculation
        return flowRate * 0.1;
    }

    calculateParticleNormal(particle) {
        // Simplified normal calculation
        return new THREE.Vector3(0, 1, 0);
    }

    updateParticleStrain(particle) {
        // Update strain based on deformation from rest position
        if (!particle.restPosition) {
            particle.restPosition = particle.position.clone();
        }

        const displacement = particle.position.distanceTo(particle.restPosition);
        particle.properties.strain = displacement;
    }

    updateParticleStress(particle, materialProperties) {
        // Update stress based on strain and material properties
        const strain = particle.properties.strain;
        particle.properties.stress = strain * materialProperties.youngModulus;
    }

    checkTissueDamage(particle, materialProperties) {
        // Check if particle stress exceeds material limits
        if (particle.properties.stress > materialProperties.tensileStrength) {
            particle.properties.damaged = true;
        }
    }

    isParticleDamaged(particle, materialProperties) {
        return particle.properties.damaged ||
               particle.properties.stress > materialProperties.tensileStrength * 0.8;
    }

    /**
     * Get simulation statistics
     */
    getSimulationStats() {
        const stats = {
            totalParticles: this.particles.length,
            totalConstraints: this.constraints.length,
            activeDeformations: 0,
            stressAnalysis: Object.fromEntries(this.stressAnalysis),
            performance: {
                lastUpdateTime: 0,
                averageUpdateTime: 0
            }
        };

        this.deformationHistory.forEach(deformations => {
            stats.activeDeformations += deformations.length;
        });

        return stats;
    }

    /**
     * Enable/disable physics simulation
     */
    setPhysicsEnabled(enabled) {
        this.physics.enabled = enabled;
    }

    /**
     * Reset simulation to initial state
     */
    reset() {
        this.particles.forEach(particle => {
            particle.velocity.set(0, 0, 0);
            particle.force.set(0, 0, 0);
            particle.properties.stress = 0;
            particle.properties.strain = 0;
            particle.properties.damaged = false;

            if (particle.restPosition) {
                particle.position.copy(particle.restPosition);
            }
        });

        this.deformationHistory.clear();
        this.stressAnalysis.clear();
    }

    /**
     * Dispose of simulation resources
     */
    dispose() {
        this.particles.length = 0;
        this.constraints.length = 0;
        this.tissues.clear();
        this.deformationHistory.clear();
        this.stressAnalysis.clear();
    }
}

export { TissuePhysicsSimulator };