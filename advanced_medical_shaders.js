/**
 * Advanced Medical Visualization Shaders
 * High-performance GPU shaders optimized for medical 3D rendering
 * Includes subsurface scattering, volumetric rendering, and tissue simulation
 */

import * as THREE from 'three';

/**
 * Medical Material System with advanced rendering features
 */
class MedicalMaterialSystem {
    constructor() {
        this.shaderCache = new Map();
        this.uniformCache = new Map();
        this.materialTypes = {
            SKIN: 'skin',
            MUSCLE: 'muscle',
            VESSEL: 'vessel',
            NERVE: 'nerve',
            BONE: 'bone',
            VOLUMETRIC: 'volumetric'
        };

        this.initializeShaders();
    }

    initializeShaders() {
        // Initialize all shader types
        this.createSkinShader();
        this.createMuscleShader();
        this.createVesselShader();
        this.createNerveShader();
        this.createBoneShader();
        this.createVolumetricShader();
    }

    /**
     * Advanced Skin Shader with Subsurface Scattering
     */
    createSkinShader() {
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            varying vec3 vViewPosition;
            varying vec3 vLightDirection;
            varying float vThickness;
            varying float vCurvature;

            attribute float thickness;
            attribute float curvature;

            uniform vec3 lightPosition;
            uniform float time;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;

                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;

                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;

                vLightDirection = normalize(lightPosition - vWorldPosition);

                // Pass vertex attributes
                vThickness = thickness;
                vCurvature = curvature;

                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            varying vec3 vViewPosition;
            varying vec3 vLightDirection;
            varying float vThickness;
            varying float vCurvature;

            uniform vec3 skinColor;
            uniform float roughness;
            uniform float subsurfaceStrength;
            uniform float subsurfaceRadius;
            uniform vec3 subsurfaceColor;
            uniform float translucency;
            uniform float time;
            uniform vec3 lightColor;
            uniform float lightIntensity;
            uniform sampler2D skinTexture;
            uniform sampler2D normalMap;
            uniform sampler2D roughnessMap;
            uniform sampler2D thicknessMap;

            // Enhanced noise function for skin detail
            float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }

            // Subsurface scattering approximation
            vec3 subsurfaceScattering(vec3 viewDir, vec3 lightDir, vec3 normal, float thickness) {
                vec3 scatterDir = lightDir + normal * subsurfaceRadius;
                float scatterDot = pow(clamp(dot(viewDir, -scatterDir), 0.0, 1.0), subsurfaceStrength);
                float backLight = max(0.0, dot(-lightDir, normal)) * thickness;
                return subsurfaceColor * (scatterDot + backLight) * translucency;
            }

            // Advanced lighting model for skin
            vec3 skinLighting(vec3 normal, vec3 lightDir, vec3 viewDir, vec3 albedo, float roughness) {
                float NdotL = max(0.0, dot(normal, lightDir));
                float NdotV = max(0.0, dot(normal, viewDir));

                // Fresnel effect
                float fresnel = pow(1.0 - NdotV, 5.0);

                // Rim lighting for definition
                float rim = 1.0 - NdotV;
                rim = smoothstep(0.6, 1.0, rim);

                vec3 diffuse = albedo * NdotL;
                vec3 rimLight = vec3(0.3, 0.1, 0.1) * rim * 0.5;

                return diffuse + rimLight;
            }

            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                vec3 lightDir = normalize(vLightDirection);

                // Sample textures
                vec4 skinTex = texture2D(skinTexture, vUv);
                vec3 normalTex = normalize(texture2D(normalMap, vUv).rgb * 2.0 - 1.0);
                float roughnessTex = texture2D(roughnessMap, vUv).r;
                float thicknessTex = texture2D(thicknessMap, vUv).r;

                // Combine normals
                normal = normalize(normal + normalTex * 0.3);

                // Calculate skin color with variation
                vec3 baseColor = mix(skinColor, skinTex.rgb, 0.7);

                // Add subtle skin detail variations
                float detail = noise(vUv * 100.0) * 0.02;
                baseColor += detail;

                // Advanced lighting
                vec3 lighting = skinLighting(normal, lightDir, viewDir, baseColor, roughness * roughnessTex);

                // Subsurface scattering
                float thickness = vThickness * thicknessTex;
                vec3 sss = subsurfaceScattering(viewDir, lightDir, normal, thickness);

                // Curvature-based shading
                float curvatureShading = smoothstep(0.0, 1.0, vCurvature) * 0.1;

                vec3 finalColor = lighting + sss + curvatureShading;

                // Apply light color and intensity
                finalColor *= lightColor * lightIntensity;

                // Tone mapping
                finalColor = finalColor / (finalColor + vec3(1.0));

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        const skinMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                skinColor: { value: new THREE.Color(0xffdbcc) },
                roughness: { value: 0.4 },
                subsurfaceStrength: { value: 2.0 },
                subsurfaceRadius: { value: 0.3 },
                subsurfaceColor: { value: new THREE.Color(0xff6666) },
                translucency: { value: 0.5 },
                time: { value: 0.0 },
                lightPosition: { value: new THREE.Vector3(5, 10, 7.5) },
                lightColor: { value: new THREE.Color(0xffffff) },
                lightIntensity: { value: 1.0 },
                skinTexture: { value: null },
                normalMap: { value: null },
                roughnessMap: { value: null },
                thicknessMap: { value: null }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        this.shaderCache.set(this.materialTypes.SKIN, skinMaterial);
    }

    /**
     * Muscle Shader with Fiber Simulation
     */
    createMuscleShader() {
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            varying vec3 vFiberDirection;

            attribute vec3 fiberDirection;

            uniform float time;
            uniform float contractionAmount;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                vFiberDirection = fiberDirection;

                // Simulate muscle contraction
                vec3 contractedPosition = position;
                if (contractionAmount > 0.0) {
                    contractedPosition += fiberDirection * sin(time * 5.0) * contractionAmount * 0.1;
                }

                gl_Position = projectionMatrix * modelViewMatrix * vec4(contractedPosition, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            varying vec3 vFiberDirection;

            uniform vec3 muscleColor;
            uniform float fiberIntensity;
            uniform float time;
            uniform float activity;

            float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }

            void main() {
                vec3 normal = normalize(vNormal);

                // Fiber pattern
                float fiberPattern = abs(sin(vUv.x * 50.0 + time)) * fiberIntensity;

                // Muscle activity (electrical signals)
                float electricActivity = sin(time * 8.0 + vPosition.x * 10.0) * activity;
                electricActivity = max(0.0, electricActivity) * 0.3;

                // Base muscle color
                vec3 baseColor = muscleColor;

                // Add fiber detail
                baseColor = mix(baseColor, baseColor * 0.8, fiberPattern);

                // Add electrical activity glow
                vec3 glowColor = vec3(1.0, 0.3, 0.3) * electricActivity;

                vec3 finalColor = baseColor + glowColor;

                gl_FragColor = vec4(finalColor, 0.8);
            }
        `;

        const muscleMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                muscleColor: { value: new THREE.Color(0xff6b9d) },
                fiberIntensity: { value: 0.3 },
                time: { value: 0.0 },
                activity: { value: 0.0 },
                contractionAmount: { value: 0.0 }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        this.shaderCache.set(this.materialTypes.MUSCLE, muscleMaterial);
    }

    /**
     * Blood Vessel Shader with Flow Animation
     */
    createVesselShader() {
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            varying vec3 vWorldPosition;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            varying vec3 vWorldPosition;

            uniform vec3 bloodColor;
            uniform float flowSpeed;
            uniform float pulseRate;
            uniform float oxygenation;
            uniform float time;
            uniform vec3 flowDirection;

            float noise(vec3 p) {
                return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
            }

            void main() {
                vec3 normal = normalize(vNormal);

                // Flow animation
                float flow = sin(vWorldPosition.x * 0.5 + time * flowSpeed) * 0.5 + 0.5;

                // Pulse effect
                float pulse = sin(time * pulseRate) * 0.3 + 0.7;

                // Oxygenation effect (brighter red for arterial, darker for venous)
                vec3 baseColor = mix(vec3(0.5, 0.1, 0.1), bloodColor, oxygenation);

                // Flow turbulence
                float turbulence = noise(vWorldPosition + time * 0.1) * 0.2;

                // Combine effects
                vec3 finalColor = baseColor * flow * pulse + turbulence;

                // Inner glow for blood flow
                float centerGlow = 1.0 - smoothstep(0.0, 0.5, length(vUv - vec2(0.5)));
                finalColor += vec3(0.3, 0.0, 0.0) * centerGlow * flow;

                gl_FragColor = vec4(finalColor, 0.9);
            }
        `;

        const vesselMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                bloodColor: { value: new THREE.Color(0xe74c3c) },
                flowSpeed: { value: 3.0 },
                pulseRate: { value: 2.0 },
                oxygenation: { value: 0.8 },
                time: { value: 0.0 },
                flowDirection: { value: new THREE.Vector3(1, 0, 0) }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        this.shaderCache.set(this.materialTypes.VESSEL, vesselMaterial);
    }

    /**
     * Nerve Shader with Electrical Activity
     */
    createNerveShader() {
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            varying vec3 vWorldPosition;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            varying vec3 vWorldPosition;

            uniform vec3 nerveColor;
            uniform float signalSpeed;
            uniform float signalIntensity;
            uniform float myelinThickness;
            uniform float time;

            float noise(vec3 p) {
                return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
            }

            // Electrical signal simulation
            float electricalSignal(vec3 pos, float time) {
                float signal = 0.0;

                // Multiple signal frequencies
                signal += sin(pos.x * 2.0 + time * signalSpeed * 5.0) * 0.5;
                signal += sin(pos.x * 4.0 + time * signalSpeed * 3.0) * 0.3;
                signal += sin(pos.x * 8.0 + time * signalSpeed * 7.0) * 0.2;

                // Random spikes for action potentials
                float spike = step(0.95, noise(vec3(pos.x + time * 0.1, 0, 0)));
                signal += spike * 2.0;

                return max(0.0, signal) * signalIntensity;
            }

            void main() {
                vec3 normal = normalize(vNormal);

                // Base nerve color
                vec3 baseColor = nerveColor;

                // Myelin sheath effect
                float myelinPattern = smoothstep(0.3, 0.7, sin(vUv.x * 20.0) * 0.5 + 0.5);
                baseColor = mix(baseColor * 0.7, baseColor, myelinPattern * myelinThickness);

                // Electrical activity
                float electrical = electricalSignal(vWorldPosition, time);
                vec3 electricalGlow = vec3(1.0, 0.8, 0.2) * electrical;

                // Axon core glow
                float coreGlow = 1.0 - smoothstep(0.0, 0.3, length(vUv - vec2(0.5)));
                electricalGlow *= coreGlow;

                vec3 finalColor = baseColor + electricalGlow;

                gl_FragColor = vec4(finalColor, 0.85);
            }
        `;

        const nerveMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                nerveColor: { value: new THREE.Color(0xf39c12) },
                signalSpeed: { value: 2.0 },
                signalIntensity: { value: 0.5 },
                myelinThickness: { value: 0.8 },
                time: { value: 0.0 }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        this.shaderCache.set(this.materialTypes.NERVE, nerveMaterial);
    }

    /**
     * Bone Shader with Realistic Bone Structure
     */
    createBoneShader() {
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;

            uniform vec3 boneColor;
            uniform float porosity;
            uniform float density;

            float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }

            float fbm(vec2 st) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;

                for (int i = 0; i < 5; i++) {
                    value += amplitude * noise(st * frequency);
                    st *= 2.0;
                    amplitude *= 0.5;
                    frequency *= 2.0;
                }
                return value;
            }

            void main() {
                vec3 normal = normalize(vNormal);

                // Bone texture with trabecular structure
                float bonePattern = fbm(vUv * 8.0);

                // Cortical vs trabecular bone
                float cortical = smoothstep(0.7, 1.0, density);
                float trabecular = 1.0 - cortical;

                // Porosity effects
                float pores = step(porosity, noise(vUv * 50.0));

                vec3 baseColor = boneColor;

                // Trabecular structure
                baseColor = mix(baseColor * 0.8, baseColor, bonePattern * trabecular);

                // Cortical density
                baseColor = mix(baseColor, baseColor * 1.2, cortical);

                // Pore structure
                baseColor *= pores;

                // Subsurface effect for realism
                float subsurface = pow(1.0 - abs(dot(normal, vec3(0, 0, 1))), 2.0) * 0.3;
                baseColor += vec3(1.0, 0.9, 0.8) * subsurface;

                gl_FragColor = vec4(baseColor, 1.0);
            }
        `;

        const boneMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                boneColor: { value: new THREE.Color(0xecf0f1) },
                porosity: { value: 0.3 },
                density: { value: 0.8 }
            },
            side: THREE.DoubleSide
        });

        this.shaderCache.set(this.materialTypes.BONE, boneMaterial);
    }

    /**
     * Volumetric Shader for Medical Imaging Data
     */
    createVolumetricShader() {
        const vertexShader = `
            varying vec3 vPosition;
            varying vec3 vWorldPosition;

            void main() {
                vPosition = position;
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec3 vPosition;
            varying vec3 vWorldPosition;

            uniform sampler3D volumeTexture;
            uniform vec3 cameraPosition;
            uniform float stepSize;
            uniform int maxSteps;
            uniform float opacity;
            uniform vec3 lightPosition;
            uniform mat4 modelMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;

            // Transfer function for medical data visualization
            vec4 transferFunction(float density) {
                vec4 color = vec4(0.0);

                // Tissue classification based on density
                if (density < 0.1) {
                    // Air/empty space
                    color = vec4(0.0, 0.0, 0.0, 0.0);
                } else if (density < 0.3) {
                    // Soft tissue
                    color = vec4(1.0, 0.8, 0.7, density * 0.5);
                } else if (density < 0.6) {
                    // Muscle/organ
                    color = vec4(0.8, 0.3, 0.3, density * 0.8);
                } else if (density < 0.8) {
                    // Dense tissue
                    color = vec4(0.9, 0.9, 0.9, density);
                } else {
                    // Bone
                    color = vec4(1.0, 1.0, 1.0, 1.0);
                }

                return color;
            }

            // Gradient calculation for lighting
            vec3 calculateGradient(vec3 pos, float stepSize) {
                vec3 gradient;
                gradient.x = texture(volumeTexture, pos + vec3(stepSize, 0, 0)).r -
                           texture(volumeTexture, pos - vec3(stepSize, 0, 0)).r;
                gradient.y = texture(volumeTexture, pos + vec3(0, stepSize, 0)).r -
                           texture(volumeTexture, pos - vec3(0, stepSize, 0)).r;
                gradient.z = texture(volumeTexture, pos + vec3(0, 0, stepSize)).r -
                           texture(volumeTexture, pos - vec3(0, 0, stepSize)).r;

                return normalize(gradient);
            }

            void main() {
                vec3 rayStart = vPosition + vec3(0.5); // Normalize to [0,1]
                vec3 rayDirection = normalize(vWorldPosition - cameraPosition);

                vec4 accumColor = vec4(0.0);
                float accumAlpha = 0.0;

                vec3 currentPos = rayStart;

                for (int i = 0; i < maxSteps; i++) {
                    if (accumAlpha >= 0.95) break;

                    // Check bounds
                    if (any(lessThan(currentPos, vec3(0.0))) ||
                        any(greaterThan(currentPos, vec3(1.0)))) break;

                    // Sample volume
                    float density = texture(volumeTexture, currentPos).r;
                    vec4 sampleColor = transferFunction(density);

                    if (sampleColor.a > 0.01) {
                        // Calculate lighting
                        vec3 gradient = calculateGradient(currentPos, stepSize);
                        vec3 lightDir = normalize(lightPosition - vWorldPosition);
                        float lighting = max(0.2, dot(gradient, lightDir));

                        sampleColor.rgb *= lighting;
                        sampleColor.a *= opacity;

                        // Front-to-back blending
                        accumColor.rgb += (1.0 - accumAlpha) * sampleColor.a * sampleColor.rgb;
                        accumAlpha += (1.0 - accumAlpha) * sampleColor.a;
                    }

                    currentPos += rayDirection * stepSize;
                }

                gl_FragColor = vec4(accumColor.rgb, accumAlpha);
            }
        `;

        const volumetricMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                volumeTexture: { value: null },
                cameraPosition: { value: new THREE.Vector3() },
                stepSize: { value: 0.01 },
                maxSteps: { value: 100 },
                opacity: { value: 1.0 },
                lightPosition: { value: new THREE.Vector3(5, 10, 7.5) },
                modelMatrix: { value: new THREE.Matrix4() },
                viewMatrix: { value: new THREE.Matrix4() },
                projectionMatrix: { value: new THREE.Matrix4() }
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        this.shaderCache.set(this.materialTypes.VOLUMETRIC, volumetricMaterial);
    }

    /**
     * Get material by type
     */
    getMaterial(type, options = {}) {
        const material = this.shaderCache.get(type);
        if (!material) {
            console.warn(`Material type ${type} not found`);
            return null;
        }

        // Clone material to avoid shared uniforms
        const clonedMaterial = material.clone();

        // Apply custom options
        Object.keys(options).forEach(key => {
            if (clonedMaterial.uniforms[key]) {
                clonedMaterial.uniforms[key].value = options[key];
            }
        });

        return clonedMaterial;
    }

    /**
     * Update time-based uniforms for all materials
     */
    updateUniforms(deltaTime) {
        this.shaderCache.forEach(material => {
            if (material.uniforms.time) {
                material.uniforms.time.value += deltaTime;
            }
        });
    }

    /**
     * Set global lighting parameters
     */
    setLighting(lightPosition, lightColor, lightIntensity) {
        this.shaderCache.forEach(material => {
            if (material.uniforms.lightPosition) {
                material.uniforms.lightPosition.value.copy(lightPosition);
            }
            if (material.uniforms.lightColor) {
                material.uniforms.lightColor.value.copy(lightColor);
            }
            if (material.uniforms.lightIntensity) {
                material.uniforms.lightIntensity.value = lightIntensity;
            }
        });
    }

    /**
     * Create procedural textures for materials
     */
    createProceduralTextures() {
        const textureSize = 512;

        // Skin texture
        const skinCanvas = document.createElement('canvas');
        skinCanvas.width = skinCanvas.height = textureSize;
        const skinCtx = skinCanvas.getContext('2d');

        // Generate skin detail texture
        const skinImageData = skinCtx.createImageData(textureSize, textureSize);
        for (let i = 0; i < skinImageData.data.length; i += 4) {
            const noise = Math.random() * 0.1 + 0.9;
            skinImageData.data[i] = 255 * noise;     // R
            skinImageData.data[i + 1] = 219 * noise; // G
            skinImageData.data[i + 2] = 204 * noise; // B
            skinImageData.data[i + 3] = 255;         // A
        }
        skinCtx.putImageData(skinImageData, 0, 0);

        const skinTexture = new THREE.CanvasTexture(skinCanvas);
        skinTexture.wrapS = skinTexture.wrapT = THREE.RepeatWrapping;

        // Normal map for skin
        const normalCanvas = document.createElement('canvas');
        normalCanvas.width = normalCanvas.height = textureSize;
        const normalCtx = normalCanvas.getContext('2d');

        const normalImageData = normalCtx.createImageData(textureSize, textureSize);
        for (let i = 0; i < normalImageData.data.length; i += 4) {
            normalImageData.data[i] = 128 + Math.random() * 10 - 5;     // X
            normalImageData.data[i + 1] = 128 + Math.random() * 10 - 5; // Y
            normalImageData.data[i + 2] = 255;                          // Z
            normalImageData.data[i + 3] = 255;                          // A
        }
        normalCtx.putImageData(normalImageData, 0, 0);

        const normalMap = new THREE.CanvasTexture(normalCanvas);
        normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;

        // Update skin material with textures
        const skinMaterial = this.shaderCache.get(this.materialTypes.SKIN);
        if (skinMaterial) {
            skinMaterial.uniforms.skinTexture.value = skinTexture;
            skinMaterial.uniforms.normalMap.value = normalMap;
        }

        return {
            skinTexture,
            normalMap
        };
    }

    /**
     * Dispose of all materials and textures
     */
    dispose() {
        this.shaderCache.forEach(material => {
            material.dispose();
        });
        this.shaderCache.clear();
        this.uniformCache.clear();
    }
}

export { MedicalMaterialSystem };