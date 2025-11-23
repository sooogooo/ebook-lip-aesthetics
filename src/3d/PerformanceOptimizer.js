/**
 * 3D性能优化器 - 高级优化
 * 3D Performance Optimizer - Advanced Optimizations
 */

export class PerformanceOptimizer {
    constructor(options = {}) {
        this.options = {
            enableFrustumCulling: true,
            enableOcclusionCulling: true,
            enableInstancing: true,
            enableProgressiveLoading: true,
            targetFPS: 60,
            ...options
        };

        this.frameStats = {
            fps: 0,
            frameTime: 0,
            drawCalls: 0,
            triangles: 0
        };

        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.performanceLevel = 'high'; // high, medium, low
    }

    /**
     * 检测设备性能等级
     */
    detectPerformanceLevel() {
        // 检查GPU信息
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) {
            this.performanceLevel = 'low';
            return this.performanceLevel;
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            : 'Unknown';

        // 检查是否为集成显卡
        const isIntegrated = /Intel|HD Graphics|UHD Graphics|Iris/i.test(renderer);
        const isMobile = /Mali|Adreno|PowerVR|Apple/i.test(renderer);

        // 检查内存
        const memory = navigator.deviceMemory || 4;

        // 检查CPU核心数
        const cores = navigator.hardwareConcurrency || 4;

        // 综合评估
        if (isIntegrated || isMobile || memory < 4 || cores < 4) {
            this.performanceLevel = 'low';
        } else if (memory >= 8 && cores >= 8) {
            this.performanceLevel = 'high';
        } else {
            this.performanceLevel = 'medium';
        }

        console.log(`[PerformanceOptimizer] Detected level: ${this.performanceLevel}, GPU: ${renderer}`);
        return this.performanceLevel;
    }

    /**
     * 获取基于性能等级的优化配置
     */
    getOptimalSettings() {
        const settings = {
            high: {
                maxTriangles: 500000,
                textureSize: 2048,
                shadowMapSize: 2048,
                antialiasing: true,
                postProcessing: true,
                particleCount: 10000,
                lodBias: 0
            },
            medium: {
                maxTriangles: 200000,
                textureSize: 1024,
                shadowMapSize: 1024,
                antialiasing: true,
                postProcessing: false,
                particleCount: 5000,
                lodBias: 1
            },
            low: {
                maxTriangles: 50000,
                textureSize: 512,
                shadowMapSize: 512,
                antialiasing: false,
                postProcessing: false,
                particleCount: 1000,
                lodBias: 2
            }
        };

        return settings[this.performanceLevel];
    }

    /**
     * 视锥体剔除
     */
    frustumCull(objects, camera) {
        if (!this.options.enableFrustumCulling) {
            return objects;
        }

        const frustum = this.computeFrustum(camera);
        return objects.filter(obj => this.isInFrustum(obj, frustum));
    }

    computeFrustum(camera) {
        // 计算视锥体的6个平面
        const { fov, aspect, near, far } = camera;
        const halfVSide = far * Math.tan(fov / 2);
        const halfHSide = halfVSide * aspect;

        return {
            near: { normal: [0, 0, -1], distance: near },
            far: { normal: [0, 0, 1], distance: far },
            left: { normal: this.normalize([far, 0, halfHSide]), distance: 0 },
            right: { normal: this.normalize([-far, 0, halfHSide]), distance: 0 },
            top: { normal: this.normalize([0, -far, halfVSide]), distance: 0 },
            bottom: { normal: this.normalize([0, far, halfVSide]), distance: 0 }
        };
    }

    isInFrustum(object, frustum) {
        const { position, boundingSphere } = object;
        if (!boundingSphere) return true;

        const radius = boundingSphere.radius;
        const planes = Object.values(frustum);

        for (const plane of planes) {
            const distance = this.dotProduct(plane.normal, position) + plane.distance;
            if (distance < -radius) {
                return false;
            }
        }

        return true;
    }

    /**
     * 实例化渲染管理
     */
    createInstancedMesh(geometry, material, count) {
        if (!this.options.enableInstancing) {
            return null;
        }

        return {
            geometry,
            material,
            count,
            matrices: new Float32Array(count * 16),
            colors: new Float32Array(count * 3),
            visible: new Uint8Array(count).fill(1)
        };
    }

    updateInstanceMatrix(instancedMesh, index, matrix) {
        instancedMesh.matrices.set(matrix, index * 16);
    }

    updateInstanceColor(instancedMesh, index, r, g, b) {
        const offset = index * 3;
        instancedMesh.colors[offset] = r;
        instancedMesh.colors[offset + 1] = g;
        instancedMesh.colors[offset + 2] = b;
    }

    /**
     * 渐进式模型加载
     */
    async loadModelProgressive(url, callbacks = {}) {
        if (!this.options.enableProgressiveLoading) {
            const response = await fetch(url);
            return response.json();
        }

        const { onSkeleton, onLowRes, onHighRes, onComplete } = callbacks;

        try {
            // 阶段1: 加载骨架/边界框
            const skeletonUrl = url.replace('.json', '_skeleton.json');
            try {
                const skeleton = await this.fetchWithTimeout(skeletonUrl, 2000);
                if (onSkeleton) onSkeleton(skeleton);
            } catch (e) {
                // 骨架文件可选
            }

            // 阶段2: 加载低分辨率版本
            const lowResUrl = url.replace('.json', '_low.json');
            try {
                const lowRes = await this.fetchWithTimeout(lowResUrl, 5000);
                if (onLowRes) onLowRes(lowRes);
            } catch (e) {
                // 低分辨率版本可选
            }

            // 阶段3: 加载完整模型
            const fullModel = await fetch(url).then(r => r.json());
            if (onHighRes) onHighRes(fullModel);

            if (onComplete) onComplete(fullModel);
            return fullModel;

        } catch (error) {
            console.error('[PerformanceOptimizer] Progressive loading failed:', error);
            throw error;
        }
    }

    async fetchWithTimeout(url, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            return response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * 资源预加载
     */
    preloadResources(resources) {
        const hints = [];

        resources.forEach(resource => {
            // 使用 link rel=preload
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.url;
            link.as = resource.type || 'fetch';

            if (resource.type === 'image') {
                link.as = 'image';
            } else if (resource.type === 'model') {
                link.as = 'fetch';
                link.crossOrigin = 'anonymous';
            }

            document.head.appendChild(link);
            hints.push(link);
        });

        return hints;
    }

    /**
     * 自适应质量控制
     */
    adaptQuality() {
        const targetFrameTime = 1000 / this.options.targetFPS;
        const currentFrameTime = this.frameStats.frameTime;

        if (currentFrameTime > targetFrameTime * 1.5) {
            // 性能不足，降低质量
            return this.decreaseQuality();
        } else if (currentFrameTime < targetFrameTime * 0.5 && this.performanceLevel !== 'high') {
            // 性能充足，提高质量
            return this.increaseQuality();
        }

        return null;
    }

    decreaseQuality() {
        const actions = [];

        if (this.performanceLevel === 'high') {
            this.performanceLevel = 'medium';
            actions.push('降级到中等质量');
        } else if (this.performanceLevel === 'medium') {
            this.performanceLevel = 'low';
            actions.push('降级到低质量');
        }

        return actions;
    }

    increaseQuality() {
        const actions = [];

        if (this.performanceLevel === 'low') {
            this.performanceLevel = 'medium';
            actions.push('升级到中等质量');
        } else if (this.performanceLevel === 'medium') {
            this.performanceLevel = 'high';
            actions.push('升级到高质量');
        }

        return actions;
    }

    /**
     * 更新帧统计
     */
    updateFrameStats(drawCalls = 0, triangles = 0) {
        const now = performance.now();
        this.frameCount++;

        if (now - this.lastFrameTime >= 1000) {
            this.frameStats.fps = this.frameCount;
            this.frameStats.frameTime = (now - this.lastFrameTime) / this.frameCount;
            this.frameStats.drawCalls = drawCalls;
            this.frameStats.triangles = triangles;

            this.frameCount = 0;
            this.lastFrameTime = now;

            return true; // 统计已更新
        }

        return false;
    }

    getFrameStats() {
        return { ...this.frameStats };
    }

    /**
     * 工具函数
     */
    normalize(v) {
        const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return [v[0] / len, v[1] / len, v[2] / len];
    }

    dotProduct(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
}

/**
 * 纹理优化器
 */
export class TextureOptimizer {
    constructor() {
        this.textureCache = new Map();
        this.compressionSupported = this.checkCompressionSupport();
    }

    checkCompressionSupport() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');

        if (!gl) return {};

        return {
            s3tc: !!gl.getExtension('WEBGL_compressed_texture_s3tc'),
            etc1: !!gl.getExtension('WEBGL_compressed_texture_etc1'),
            pvrtc: !!gl.getExtension('WEBGL_compressed_texture_pvrtc'),
            astc: !!gl.getExtension('WEBGL_compressed_texture_astc')
        };
    }

    /**
     * 生成Mipmap
     */
    generateMipmaps(image, levels = 4) {
        const mipmaps = [];
        let width = image.width;
        let height = image.height;

        for (let i = 0; i < levels; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, width, height);

            mipmaps.push({
                level: i,
                width,
                height,
                data: ctx.getImageData(0, 0, width, height)
            });

            width = Math.max(1, Math.floor(width / 2));
            height = Math.max(1, Math.floor(height / 2));
        }

        return mipmaps;
    }

    /**
     * 纹理图集打包
     */
    createTextureAtlas(textures, atlasSize = 2048) {
        const canvas = document.createElement('canvas');
        canvas.width = atlasSize;
        canvas.height = atlasSize;

        const ctx = canvas.getContext('2d');
        const uvMappings = [];

        // 简单的行打包算法
        let x = 0;
        let y = 0;
        let rowHeight = 0;

        textures.forEach((texture, index) => {
            if (x + texture.width > atlasSize) {
                x = 0;
                y += rowHeight;
                rowHeight = 0;
            }

            if (y + texture.height > atlasSize) {
                console.warn('[TextureOptimizer] Atlas overflow, texture skipped');
                return;
            }

            ctx.drawImage(texture, x, y);

            uvMappings.push({
                index,
                u: x / atlasSize,
                v: y / atlasSize,
                width: texture.width / atlasSize,
                height: texture.height / atlasSize
            });

            rowHeight = Math.max(rowHeight, texture.height);
            x += texture.width;
        });

        return {
            atlas: canvas,
            mappings: uvMappings
        };
    }

    /**
     * 延迟加载纹理
     */
    loadTextureLazy(url, placeholder = null) {
        if (this.textureCache.has(url)) {
            return Promise.resolve(this.textureCache.get(url));
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                this.textureCache.set(url, img);
                resolve(img);
            };

            img.onerror = reject;

            // 使用 IntersectionObserver 延迟加载
            if ('IntersectionObserver' in window && placeholder) {
                const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
                        img.src = url;
                        observer.disconnect();
                    }
                });

                observer.observe(placeholder);
            } else {
                img.src = url;
            }
        });
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.textureCache.clear();
    }
}

/**
 * 几何体优化器
 */
export class GeometryOptimizer {
    /**
     * 合并多个几何体
     */
    mergeGeometries(geometries) {
        const merged = {
            vertices: [],
            normals: [],
            uvs: [],
            indices: []
        };

        let indexOffset = 0;

        geometries.forEach(geo => {
            // 添加顶点
            merged.vertices.push(...geo.vertices);

            // 添加法线
            if (geo.normals) {
                merged.normals.push(...geo.normals);
            }

            // 添加UV
            if (geo.uvs) {
                merged.uvs.push(...geo.uvs);
            }

            // 添加索引（需要偏移）
            if (geo.indices) {
                const offsetIndices = geo.indices.map(i => i + indexOffset);
                merged.indices.push(...offsetIndices);
            }

            indexOffset += geo.vertices.length / 3;
        });

        return merged;
    }

    /**
     * 计算边界球
     */
    computeBoundingSphere(vertices) {
        let cx = 0, cy = 0, cz = 0;
        const count = vertices.length / 3;

        // 计算中心点
        for (let i = 0; i < vertices.length; i += 3) {
            cx += vertices[i];
            cy += vertices[i + 1];
            cz += vertices[i + 2];
        }

        cx /= count;
        cy /= count;
        cz /= count;

        // 计算半径
        let maxRadius = 0;
        for (let i = 0; i < vertices.length; i += 3) {
            const dx = vertices[i] - cx;
            const dy = vertices[i + 1] - cy;
            const dz = vertices[i + 2] - cz;
            const radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
            maxRadius = Math.max(maxRadius, radius);
        }

        return {
            center: [cx, cy, cz],
            radius: maxRadius
        };
    }

    /**
     * 索引缓冲区优化
     */
    optimizeIndices(indices) {
        // 顶点缓存优化 - 简化版的Forsyth算法
        const cacheSize = 32;
        const optimized = [];
        const cache = [];
        const remaining = new Set(Array.from({ length: indices.length / 3 }, (_, i) => i));

        while (remaining.size > 0) {
            let bestScore = -1;
            let bestFace = null;

            // 找到缓存分数最高的面
            for (const faceIndex of remaining) {
                const score = this.calculateCacheScore(
                    indices.slice(faceIndex * 3, faceIndex * 3 + 3),
                    cache,
                    cacheSize
                );

                if (score > bestScore) {
                    bestScore = score;
                    bestFace = faceIndex;
                }
            }

            if (bestFace !== null) {
                const faceIndices = indices.slice(bestFace * 3, bestFace * 3 + 3);
                optimized.push(...faceIndices);

                // 更新缓存
                faceIndices.forEach(idx => {
                    const cacheIndex = cache.indexOf(idx);
                    if (cacheIndex !== -1) {
                        cache.splice(cacheIndex, 1);
                    }
                    cache.unshift(idx);
                    if (cache.length > cacheSize) {
                        cache.pop();
                    }
                });

                remaining.delete(bestFace);
            }
        }

        return optimized;
    }

    calculateCacheScore(faceIndices, cache, cacheSize) {
        let score = 0;
        faceIndices.forEach(idx => {
            const pos = cache.indexOf(idx);
            if (pos !== -1) {
                score += (cacheSize - pos) / cacheSize;
            }
        });
        return score;
    }
}

export default {
    PerformanceOptimizer,
    TextureOptimizer,
    GeometryOptimizer
};
