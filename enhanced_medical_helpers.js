/**
 * Optimized Medical 3D Visualization - Helper Methods
 * Supporting functions for the enhanced medical visualization system
 */

// Add helper methods to the LipAnatomyModel class

/**
 * Create enhanced lip shape with medical accuracy
 */
LipAnatomyModel.prototype.createEnhancedLipShape = function() {
    const shape = new THREE.Shape();

    // More anatomically accurate lip contour based on medical reference data
    const upperLipPoints = [
        [-3.2, 0], [-2.8, 0.8], [-2.2, 1.3], [-1.5, 1.6],
        [-0.8, 1.75], [-0.3, 1.8], [0, 1.85], [0.3, 1.8],
        [0.8, 1.75], [1.5, 1.6], [2.2, 1.3], [2.8, 0.8], [3.2, 0]
    ];

    const lowerLipPoints = [
        [3.2, 0], [2.9, -0.6], [2.3, -1.1], [1.5, -1.4],
        [0.8, -1.55], [0.3, -1.6], [0, -1.65], [-0.3, -1.6],
        [-0.8, -1.55], [-1.5, -1.4], [-2.3, -1.1], [-2.9, -0.6], [-3.2, 0]
    ];

    // Create smooth curves using spline interpolation
    shape.moveTo(upperLipPoints[0][0], upperLipPoints[0][1]);

    // Upper lip curve
    for (let i = 1; i < upperLipPoints.length; i++) {
        if (i === upperLipPoints.length - 1) {
            shape.lineTo(upperLipPoints[i][0], upperLipPoints[i][1]);
        } else {
            const current = upperLipPoints[i];
            const next = upperLipPoints[i + 1];
            const cp1x = current[0] + (next[0] - current[0]) * 0.3;
            const cp1y = current[1] + (next[1] - current[1]) * 0.3;
            const cp2x = next[0] - (next[0] - current[0]) * 0.3;
            const cp2y = next[1] - (next[1] - current[1]) * 0.3;

            shape.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next[0], next[1]);
        }
    }

    // Lower lip curve
    for (let i = 1; i < lowerLipPoints.length; i++) {
        if (i === lowerLipPoints.length - 1) {
            shape.lineTo(lowerLipPoints[i][0], lowerLipPoints[i][1]);
        } else {
            const current = lowerLipPoints[i];
            const next = lowerLipPoints[i + 1];
            const cp1x = current[0] + (next[0] - current[0]) * 0.3;
            const cp1y = current[1] + (next[1] - current[1]) * 0.3;
            const cp2x = next[0] - (next[0] - current[0]) * 0.3;
            const cp2y = next[1] - (next[1] - current[1]) * 0.3;

            shape.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next[0], next[1]);
        }
    }

    return shape;
};

/**
 * Add medical vertex attributes for advanced rendering
 */
LipAnatomyModel.prototype.addMedicalVertexAttributes = function(geometry, tissueType) {
    const positions = geometry.getAttribute('position');
    const vertexCount = positions.count;

    // Thickness for subsurface scattering
    const thickness = new Float32Array(vertexCount);
    // Curvature for enhanced shading
    const curvature = new Float32Array(vertexCount);
    // Tissue density
    const density = new Float32Array(vertexCount);
    // Blood perfusion (for vessels)
    const perfusion = new Float32Array(vertexCount);

    for (let i = 0; i < vertexCount; i++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
        const distanceFromCenter = vertex.distanceTo(new THREE.Vector3(0, 0, 0));

        // Calculate thickness based on tissue type and position
        switch (tissueType) {
            case 'skin':
                thickness[i] = Math.max(0.1, 0.8 - distanceFromCenter * 0.1);
                curvature[i] = Math.abs(vertex.y) * 0.3 + 0.7;
                density[i] = 0.9 + Math.random() * 0.1;
                perfusion[i] = 0.7 + Math.random() * 0.2;
                break;
            case 'muscle':
                thickness[i] = 0.5 + Math.random() * 0.3;
                curvature[i] = 0.4;
                density[i] = 1.0 + Math.random() * 0.1;
                perfusion[i] = 0.8 + Math.random() * 0.15;
                break;
            default:
                thickness[i] = 0.5;
                curvature[i] = 0.5;
                density[i] = 0.8;
                perfusion[i] = 0.6;
        }
    }

    geometry.setAttribute('thickness', new THREE.BufferAttribute(thickness, 1));
    geometry.setAttribute('curvature', new THREE.BufferAttribute(curvature, 1));
    geometry.setAttribute('density', new THREE.BufferAttribute(density, 1));
    geometry.setAttribute('perfusion', new THREE.BufferAttribute(perfusion, 1));
};

/**
 * Add fiber direction attributes for muscle rendering
 */
LipAnatomyModel.prototype.addFiberAttributes = function(geometry, angle) {
    const positions = geometry.getAttribute('position');
    const vertexCount = positions.count;

    const fiberDirection = new Float32Array(vertexCount * 3);
    const fiberStrength = new Float32Array(vertexCount);

    const direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);

    for (let i = 0; i < vertexCount; i++) {
        const i3 = i * 3;
        fiberDirection[i3] = direction.x;
        fiberDirection[i3 + 1] = direction.y;
        fiberDirection[i3 + 2] = direction.z;

        // Vary fiber strength based on position
        fiberStrength[i] = 0.7 + Math.random() * 0.3;
    }

    geometry.setAttribute('fiberDirection', new THREE.BufferAttribute(fiberDirection, 3));
    geometry.setAttribute('fiberStrength', new THREE.BufferAttribute(fiberStrength, 1));
};

/**
 * Add accessory muscle groups
 */
LipAnatomyModel.prototype.addAccessoryMuscles = function(muscleGroup) {
    // Levator labii superioris
    const levatorGeometry = new THREE.CylinderGeometry(0.05, 0.08, 1.5, 8);
    const levatorMaterial = this.advancedMaterials.createMaterial('muscle', {
        fiberDirection: new THREE.Vector3(0, 1, 0.2),
        contractionCapability: 0.9
    });

    const levatorLeft = new THREE.Mesh(levatorGeometry, levatorMaterial);
    levatorLeft.position.set(-1.2, 1.5, 0.2);
    levatorLeft.rotation.z = Math.PI * 0.15;
    muscleGroup.add(levatorLeft);

    const levatorRight = new THREE.Mesh(levatorGeometry, levatorMaterial.clone());
    levatorRight.position.set(1.2, 1.5, 0.2);
    levatorRight.rotation.z = -Math.PI * 0.15;
    muscleGroup.add(levatorRight);

    // Depressor labii inferioris
    const depressorGeometry = new THREE.CylinderGeometry(0.08, 0.05, 1.2, 8);
    const depressorMaterial = this.advancedMaterials.createMaterial('muscle', {
        fiberDirection: new THREE.Vector3(0, -1, 0.1),
        contractionCapability: 0.85
    });

    const depressorLeft = new THREE.Mesh(depressorGeometry, depressorMaterial);
    depressorLeft.position.set(-1.1, -1.2, 0.1);
    depressorLeft.rotation.z = -Math.PI * 0.1;
    muscleGroup.add(depressorLeft);

    const depressorRight = new THREE.Mesh(depressorGeometry, depressorMaterial.clone());
    depressorRight.position.set(1.1, -1.2, 0.1);
    depressorRight.rotation.z = Math.PI * 0.1;
    muscleGroup.add(depressorRight);
};

/**
 * Generate advanced vessel paths with realistic branching
 */
LipAnatomyModel.prototype.generateAdvancedVesselPaths = function(vesselType) {
    const paths = [];

    switch (vesselType) {
        case 'artery':
            // Superior labial artery
            paths.push([
                new THREE.Vector3(-3.5, 1.4, 0.3),
                new THREE.Vector3(-2.8, 1.5, 0.4),
                new THREE.Vector3(-2.0, 1.6, 0.45),
                new THREE.Vector3(-1.0, 1.65, 0.5),
                new THREE.Vector3(0, 1.7, 0.5),
                new THREE.Vector3(1.0, 1.65, 0.5),
                new THREE.Vector3(2.0, 1.6, 0.45),
                new THREE.Vector3(2.8, 1.5, 0.4),
                new THREE.Vector3(3.5, 1.4, 0.3)
            ]);

            // Inferior labial artery
            paths.push([
                new THREE.Vector3(-3.3, -1.2, 0.35),
                new THREE.Vector3(-2.5, -1.3, 0.4),
                new THREE.Vector3(-1.5, -1.4, 0.45),
                new THREE.Vector3(-0.5, -1.45, 0.5),
                new THREE.Vector3(0.5, -1.45, 0.5),
                new THREE.Vector3(1.5, -1.4, 0.45),
                new THREE.Vector3(2.5, -1.3, 0.4),
                new THREE.Vector3(3.3, -1.2, 0.35)
            ]);

            // Add arterial branches
            for (let i = 0; i < 8; i++) {
                const branch = this.generateArterialBranch(i);
                paths.push(branch);
            }
            break;

        case 'vein':
            // Venous drainage patterns
            paths.push([
                new THREE.Vector3(-3.0, 1.2, 0.2),
                new THREE.Vector3(-2.2, 1.1, 0.25),
                new THREE.Vector3(-1.3, 1.0, 0.3),
                new THREE.Vector3(-0.3, 0.9, 0.35),
                new THREE.Vector3(0.3, 0.9, 0.35),
                new THREE.Vector3(1.3, 1.0, 0.3),
                new THREE.Vector3(2.2, 1.1, 0.25),
                new THREE.Vector3(3.0, 1.2, 0.2)
            ]);

            // Add venous branches
            for (let i = 0; i < 6; i++) {
                const branch = this.generateVenousBranch(i);
                paths.push(branch);
            }
            break;

        case 'capillary':
            // Dense capillary network
            for (let i = 0; i < 20; i++) {
                const network = this.generateCapillaryNetwork(i);
                paths.push(...network);
            }
            break;
    }

    return paths;
};

/**
 * Generate arterial branch
 */
LipAnatomyModel.prototype.generateArterialBranch = function(index) {
    const angle = (Math.PI * 2 * index) / 8;
    const baseRadius = 2.8;

    return [
        new THREE.Vector3(
            Math.cos(angle) * baseRadius,
            Math.sin(angle) * baseRadius * 0.6,
            0.3 + Math.random() * 0.2
        ),
        new THREE.Vector3(
            Math.cos(angle) * (baseRadius - 0.5),
            Math.sin(angle) * (baseRadius - 0.5) * 0.6,
            0.35 + Math.random() * 0.15
        ),
        new THREE.Vector3(
            Math.cos(angle) * (baseRadius - 1.0),
            Math.sin(angle) * (baseRadius - 1.0) * 0.6,
            0.4 + Math.random() * 0.1
        )
    ];
};

/**
 * Generate venous branch
 */
LipAnatomyModel.prototype.generateVenousBranch = function(index) {
    const angle = (Math.PI * 2 * index) / 6 + Math.PI / 6;
    const baseRadius = 2.5;

    return [
        new THREE.Vector3(
            Math.cos(angle) * (baseRadius - 0.8),
            Math.sin(angle) * (baseRadius - 0.8) * 0.7,
            0.25 + Math.random() * 0.15
        ),
        new THREE.Vector3(
            Math.cos(angle) * baseRadius,
            Math.sin(angle) * baseRadius * 0.7,
            0.2 + Math.random() * 0.1
        )
    ];
};

/**
 * Generate capillary network
 */
LipAnatomyModel.prototype.generateCapillaryNetwork = function(index) {
    const networks = [];
    const centerX = (Math.random() - 0.5) * 5;
    const centerY = (Math.random() - 0.5) * 3;

    // Generate 3-5 connected capillaries per network
    const capillaryCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < capillaryCount; i++) {
        const network = [];
        const startX = centerX + (Math.random() - 0.5) * 0.5;
        const startY = centerY + (Math.random() - 0.5) * 0.5;

        for (let j = 0; j < 3; j++) {
            network.push(new THREE.Vector3(
                startX + (Math.random() - 0.5) * 0.3,
                startY + (Math.random() - 0.5) * 0.3,
                0.2 + Math.random() * 0.2
            ));
        }

        networks.push(network);
    }

    return networks;
};

/**
 * Create advanced vessel with flow simulation
 */
LipAnatomyModel.prototype.createAdvancedVessel = function(path, options) {
    const curve = new THREE.CatmullRomCurve3(path);
    const tubeGeometry = new THREE.TubeGeometry(
        curve,
        Math.max(8, path.length * 4),
        options.radius,
        8,
        false
    );

    const vesselMaterial = this.advancedMaterials.createMaterial('vessel', {
        oxygenation: options.oxygenation,
        flowSpeed: options.flowSpeed,
        pulsation: options.pulsation,
        vesselType: options.type
    });

    return new THREE.Mesh(tubeGeometry, vesselMaterial);
};

/**
 * Generate nerve branches for different nerve types
 */
LipAnatomyModel.prototype.generateNerveBranches = function(nerveType) {
    const branches = [];

    switch (nerveType) {
        case 'trigeminal':
            // Maxillary division branches
            branches.push([
                new THREE.Vector3(-4.5, 2.8, 2.2),
                new THREE.Vector3(-3.8, 2.4, 1.8),
                new THREE.Vector3(-3.2, 2.0, 1.4),
                new THREE.Vector3(-2.6, 1.6, 1.0),
                new THREE.Vector3(-2.0, 1.2, 0.6),
                new THREE.Vector3(-1.5, 0.8, 0.3)
            ]);

            // Infraorbital nerve
            branches.push([
                new THREE.Vector3(-2.8, 3.2, 1.5),
                new THREE.Vector3(-2.4, 2.8, 1.2),
                new THREE.Vector3(-2.0, 2.4, 0.9),
                new THREE.Vector3(-1.6, 2.0, 0.6),
                new THREE.Vector3(-1.2, 1.6, 0.3)
            ]);

            // Mirror for right side
            branches.push([
                new THREE.Vector3(4.5, 2.8, 2.2),
                new THREE.Vector3(3.8, 2.4, 1.8),
                new THREE.Vector3(3.2, 2.0, 1.4),
                new THREE.Vector3(2.6, 1.6, 1.0),
                new THREE.Vector3(2.0, 1.2, 0.6),
                new THREE.Vector3(1.5, 0.8, 0.3)
            ]);

            branches.push([
                new THREE.Vector3(2.8, 3.2, 1.5),
                new THREE.Vector3(2.4, 2.8, 1.2),
                new THREE.Vector3(2.0, 2.4, 0.9),
                new THREE.Vector3(1.6, 2.0, 0.6),
                new THREE.Vector3(1.2, 1.6, 0.3)
            ]);
            break;

        case 'facial':
            // Buccal branches
            branches.push([
                new THREE.Vector3(-4.2, 1.8, 2.5),
                new THREE.Vector3(-3.5, 1.5, 2.0),
                new THREE.Vector3(-2.8, 1.2, 1.5),
                new THREE.Vector3(-2.1, 0.9, 1.0),
                new THREE.Vector3(-1.4, 0.6, 0.5)
            ]);

            // Marginal mandibular branch
            branches.push([
                new THREE.Vector3(-3.8, -0.5, 2.0),
                new THREE.Vector3(-3.2, -0.8, 1.6),
                new THREE.Vector3(-2.6, -1.1, 1.2),
                new THREE.Vector3(-2.0, -1.4, 0.8),
                new THREE.Vector3(-1.4, -1.7, 0.4)
            ]);

            // Mirror for right side
            branches.push([
                new THREE.Vector3(4.2, 1.8, 2.5),
                new THREE.Vector3(3.5, 1.5, 2.0),
                new THREE.Vector3(2.8, 1.2, 1.5),
                new THREE.Vector3(2.1, 0.9, 1.0),
                new THREE.Vector3(1.4, 0.6, 0.5)
            ]);

            branches.push([
                new THREE.Vector3(3.8, -0.5, 2.0),
                new THREE.Vector3(3.2, -0.8, 1.6),
                new THREE.Vector3(2.6, -1.1, 1.2),
                new THREE.Vector3(2.0, -1.4, 0.8),
                new THREE.Vector3(1.4, -1.7, 0.4)
            ]);
            break;
    }

    return branches;
};

/**
 * Create advanced nerve with electrical activity
 */
LipAnatomyModel.prototype.createAdvancedNerve = function(path, options) {
    const curve = new THREE.CatmullRomCurve3(path);
    const tubeGeometry = new THREE.TubeGeometry(
        curve,
        Math.max(10, path.length * 3),
        0.03,
        6,
        false
    );

    const nerveMaterial = this.advancedMaterials.createMaterial('nerve', {
        myelination: options.myelination,
        conductionVelocity: options.conductionVelocity,
        electricalActivity: options.electricalActivity,
        nerveType: options.type
    });

    return new THREE.Mesh(tubeGeometry, nerveMaterial);
};

/**
 * Add nerve endings for tactile sensation
 */
LipAnatomyModel.prototype.addNerveEndings = function(nerveGroup) {
    // Sensory nerve endings distribution
    const endingPositions = [];

    // Generate realistic distribution of nerve endings
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.5 + Math.random() * 1.5;
        const height = (Math.random() - 0.5) * 2;

        endingPositions.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius * 0.3 + 0.2
        ));
    }

    const endingMaterial = this.advancedMaterials.createMaterial('nerve', {
        myelination: 0.3, // Unmyelinated endings
        electricalActivity: true,
        sensitivity: 0.9
    });

    endingPositions.forEach(position => {
        const endingGeometry = new THREE.SphereGeometry(0.02, 6, 4);
        const ending = new THREE.Mesh(endingGeometry, endingMaterial.clone());
        ending.position.copy(position);
        nerveGroup.add(ending);
    });
};

/**
 * Create maxilla geometry
 */
LipAnatomyModel.prototype.createMaxillaGeometry = function() {
    // Simplified maxilla shape
    const points = [];
    for (let i = 0; i <= 10; i++) {
        const angle = (i / 10) * Math.PI;
        const radius = 2.5 + Math.sin(angle * 2) * 0.3;
        points.push(new THREE.Vector2(
            Math.cos(angle) * radius,
            Math.sin(angle) * 0.5
        ));
    }

    const shape = new THREE.Shape(points);
    return new THREE.ExtrudeGeometry(shape, {
        depth: 1.0,
        bevelEnabled: true,
        bevelSize: 0.1,
        bevelThickness: 0.05
    });
};

/**
 * Create mandible geometry
 */
LipAnatomyModel.prototype.createMandibleGeometry = function() {
    // Simplified mandible shape
    const points = [];
    for (let i = 0; i <= 10; i++) {
        const angle = (i / 10) * Math.PI;
        const radius = 2.8 + Math.cos(angle * 3) * 0.2;
        points.push(new THREE.Vector2(
            Math.cos(angle) * radius,
            -Math.sin(angle) * 0.8
        ));
    }

    const shape = new THREE.Shape(points);
    return new THREE.ExtrudeGeometry(shape, {
        depth: 1.2,
        bevelEnabled: true,
        bevelSize: 0.12,
        bevelThickness: 0.06
    });
};

/**
 * Create advanced injection points with medical accuracy
 */
LipAnatomyModel.prototype.createAdvancedInjectionPoints = function() {
    // Clear existing injection points
    this.injectionPoints.forEach(point => {
        this.scene.remove(point);
    });
    this.injectionPoints = [];

    // Medical injection points based on anatomical landmarks
    const injectionData = [
        // Upper lip points
        { pos: [-1.5, 1.4, 0.6], name: '上唇峰点左', type: 'cupid_bow', importance: 'high' },
        { pos: [1.5, 1.4, 0.6], name: '上唇峰点右', type: 'cupid_bow', importance: 'high' },
        { pos: [0, 1.6, 0.6], name: '唇珠点', type: 'philtrum', importance: 'critical' },
        { pos: [-0.8, 1.5, 0.6], name: '上唇中左', type: 'upper_mid', importance: 'medium' },
        { pos: [0.8, 1.5, 0.6], name: '上唇中右', type: 'upper_mid', importance: 'medium' },

        // Lower lip points
        { pos: [-1.2, -1.3, 0.6], name: '下唇左', type: 'lower_lateral', importance: 'high' },
        { pos: [1.2, -1.3, 0.6], name: '下唇右', type: 'lower_lateral', importance: 'high' },
        { pos: [0, -1.5, 0.6], name: '下唇中点', type: 'lower_center', importance: 'high' },

        // Corner points
        { pos: [-2.2, 0.1, 0.6], name: '口角左', type: 'commissure', importance: 'critical' },
        { pos: [2.2, 0.1, 0.6], name: '口角右', type: 'commissure', importance: 'critical' },

        // Volume points
        { pos: [-1.8, 0.8, 0.4], name: '上唇外侧左', type: 'upper_volume', importance: 'medium' },
        { pos: [1.8, 0.8, 0.4], name: '上唇外侧右', type: 'upper_volume', importance: 'medium' },
        { pos: [-1.6, -0.8, 0.4], name: '下唇外侧左', type: 'lower_volume', importance: 'medium' },
        { pos: [1.6, -0.8, 0.4], name: '下唇外侧右', type: 'lower_volume', importance: 'medium' }
    ];

    injectionData.forEach(point => {
        const sphere = this.createInjectionPoint(point);
        this.injectionPoints.push(sphere);
        this.scene.add(sphere);
    });
};

/**
 * Create individual injection point with advanced visualization
 */
LipAnatomyModel.prototype.createInjectionPoint = function(pointData) {
    const { pos, name, type, importance } = pointData;

    // Different sizes and colors based on importance
    const importanceConfig = {
        critical: { radius: 0.12, color: 0xff0000, intensity: 0.8 },
        high: { radius: 0.10, color: 0xff6600, intensity: 0.6 },
        medium: { radius: 0.08, color: 0x00ff00, intensity: 0.4 }
    };

    const config = importanceConfig[importance] || importanceConfig.medium;

    const geometry = new THREE.SphereGeometry(config.radius, 16, 16);
    const material = new THREE.MeshPhongMaterial({
        color: config.color,
        emissive: config.color,
        emissiveIntensity: config.intensity,
        transparent: true,
        opacity: 0.8
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(...pos);

    sphere.userData = {
        name: name,
        type: type,
        importance: importance,
        injectionType: 'filler',
        recommendedVolume: this.getRecommendedVolume(type),
        safetyNotes: this.getSafetyNotes(type)
    };

    return sphere;
};

/**
 * Get recommended injection volume for point type
 */
LipAnatomyModel.prototype.getRecommendedVolume = function(type) {
    const volumes = {
        cupid_bow: '0.1-0.2ml',
        philtrum: '0.05-0.1ml',
        upper_mid: '0.15-0.25ml',
        lower_lateral: '0.2-0.3ml',
        lower_center: '0.15-0.25ml',
        commissure: '0.05-0.1ml',
        upper_volume: '0.2-0.4ml',
        lower_volume: '0.3-0.5ml'
    };

    return volumes[type] || '0.1-0.2ml';
};

/**
 * Get safety notes for injection point type
 */
LipAnatomyModel.prototype.getSafetyNotes = function(type) {
    const notes = {
        cupid_bow: '小心维持自然唇峰形状',
        philtrum: '避免过度填充影响表情',
        commissure: '注意避开血管丰富区域',
        lower_center: '注意对称性',
        upper_volume: '分层注射，避免结节',
        lower_volume: '注意下唇自然垂度'
    };

    return notes[type] || '遵循标准注射安全规范';
};

/**
 * Create advanced anatomical annotations with 3D positioning
 */
LipAnatomyModel.prototype.createAdvancedAnatomicalAnnotations = function() {
    const annotationData = [
        {
            pos: [0, 1.8, 1.2],
            text: '唇珠 (Philtrum)',
            description: '上唇中央突起，重要的美学标志点',
            anatomicalInfo: '由鼻中隔软骨支撑，影响上唇形态'
        },
        {
            pos: [-2.2, 0.2, 1.0],
            text: '口角 (Commissure)',
            description: '上下唇交汇处，需避免过度填充',
            anatomicalInfo: '血管神经丰富，注射需特别谨慎'
        },
        {
            pos: [0, -1.8, 1.0],
            text: '下唇中央 (Lower Lip Center)',
            description: '下唇对称性的关键参考点',
            anatomicalInfo: '影响整体唇部平衡和表情自然度'
        },
        {
            pos: [1.5, 1.5, 1.2],
            text: '唇峰点 (Cupid\'s Bow)',
            description: '上唇最高点，决定唇形美感',
            anatomicalInfo: '由口轮匝肌和皮肤结构共同形成'
        },
        {
            pos: [0, 0, 1.5],
            text: '口轮匝肌 (Orbicularis Oris)',
            description: '环绕口裂的主要肌肉',
            anatomicalInfo: '控制唇部运动和表情，注射时需避免损伤'
        }
    ];

    this.annotations = annotationData;
};

export { LipAnatomyModel };