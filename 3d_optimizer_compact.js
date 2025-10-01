// 3D模型优化器 - 精简版
class Model3DOptimizer {
    constructor() {
        this.cache = new Map();
        this.loadingQueue = [];
        this.maxLOD = 3;
    }

    // LOD系统优化
    optimizeLOD(model, distance, performance) {
        const level = this.calculateLOD(distance, performance);
        return this.applyLOD(model, level);
    }

    calculateLOD(distance, performance) {
        const perfFactor = performance > 0.8 ? 1 : performance > 0.5 ? 0.7 : 0.4;
        const distFactor = Math.min(distance / 100, 1);
        return Math.floor(this.maxLOD * perfFactor * (1 - distFactor));
    }

    applyLOD(model, level) {
        if (!model.geometry) return model;

        const reductionRatio = [1, 0.7, 0.4, 0.2][level] || 0.1;
        const targetVertices = Math.floor(model.geometry.vertices.length * reductionRatio);

        return this.decimateGeometry(model, targetVertices);
    }

    // 几何体简化
    decimateGeometry(model, targetVertices) {
        const geometry = model.geometry;
        if (geometry.vertices.length <= targetVertices) return model;

        // 简化算法：基于边折叠的网格简化
        const simplified = this.edgeCollapse(geometry, targetVertices);
        model.geometry = simplified;

        return model;
    }

    edgeCollapse(geometry, target) {
        // 快速边折叠实现
        const vertices = [...geometry.vertices];
        const faces = [...geometry.faces];

        while (vertices.length > target && faces.length > 0) {
            // 找到最短边
            const edge = this.findShortestEdge(faces, vertices);
            if (!edge) break;

            // 折叠边
            this.collapseEdge(edge, vertices, faces);
        }

        return { vertices, faces, normals: this.calculateNormals(vertices, faces) };
    }

    findShortestEdge(faces, vertices) {
        let shortest = null;
        let minLength = Infinity;

        for (const face of faces) {
            for (let i = 0; i < 3; i++) {
                const v1 = vertices[face.indices[i]];
                const v2 = vertices[face.indices[(i + 1) % 3]];
                const length = this.distance(v1, v2);

                if (length < minLength) {
                    minLength = length;
                    shortest = { v1: face.indices[i], v2: face.indices[(i + 1) % 3], length };
                }
            }
        }

        return shortest;
    }

    distance(v1, v2) {
        return Math.sqrt(
            Math.pow(v1.x - v2.x, 2) +
            Math.pow(v1.y - v2.y, 2) +
            Math.pow(v1.z - v2.z, 2)
        );
    }

    collapseEdge(edge, vertices, faces) {
        // 合并顶点
        const midpoint = {
            x: (vertices[edge.v1].x + vertices[edge.v2].x) / 2,
            y: (vertices[edge.v1].y + vertices[edge.v2].y) / 2,
            z: (vertices[edge.v1].z + vertices[edge.v2].z) / 2
        };

        vertices[edge.v1] = midpoint;

        // 更新面索引
        faces.forEach(face => {
            face.indices = face.indices.map(idx => idx === edge.v2 ? edge.v1 : idx);
        });

        // 移除退化面
        for (let i = faces.length - 1; i >= 0; i--) {
            const face = faces[i];
            if (face.indices[0] === face.indices[1] ||
                face.indices[1] === face.indices[2] ||
                face.indices[0] === face.indices[2]) {
                faces.splice(i, 1);
            }
        }
    }

    calculateNormals(vertices, faces) {
        const normals = new Array(vertices.length).fill(null).map(() => ({ x: 0, y: 0, z: 0 }));

        faces.forEach(face => {
            const v1 = vertices[face.indices[0]];
            const v2 = vertices[face.indices[1]];
            const v3 = vertices[face.indices[2]];

            const normal = this.computeFaceNormal(v1, v2, v3);

            face.indices.forEach(idx => {
                normals[idx].x += normal.x;
                normals[idx].y += normal.y;
                normals[idx].z += normal.z;
            });
        });

        return normals.map(n => this.normalize(n));
    }

    computeFaceNormal(v1, v2, v3) {
        const a = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z };
        const b = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z };

        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    }

    normalize(vector) {
        const length = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
        return length > 0 ? {
            x: vector.x / length,
            y: vector.y / length,
            z: vector.z / length
        } : { x: 0, y: 0, z: 0 };
    }

    // 纹理压缩
    compressTexture(texture, quality = 0.8) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = texture.width;
        canvas.height = texture.height;

        ctx.drawImage(texture, 0, 0);

        // 压缩为JPEG
        const compressed = canvas.toDataURL('image/jpeg', quality);

        const img = new Image();
        img.src = compressed;
        return img;
    }

    // 批量加载优化
    async batchLoad(urls, onProgress) {
        const results = [];
        const concurrent = 3; // 并发数

        for (let i = 0; i < urls.length; i += concurrent) {
            const batch = urls.slice(i, i + concurrent);
            const batchPromises = batch.map(url => this.loadModel(url));

            const batchResults = await Promise.allSettled(batchPromises);
            results.push(...batchResults);

            if (onProgress) {
                onProgress((i + concurrent) / urls.length);
            }
        }

        return results;
    }

    async loadModel(url) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        try {
            const response = await fetch(url);
            const data = await response.json();

            const optimized = this.optimizeModelData(data);
            this.cache.set(url, optimized);

            return optimized;
        } catch (error) {
            console.error(`Failed to load model: ${url}`, error);
            return null;
        }
    }

    optimizeModelData(data) {
        // 移除不必要的属性
        const optimized = {
            vertices: data.vertices,
            faces: data.faces,
            normals: data.normals || this.calculateNormals(data.vertices, data.faces)
        };

        // 数据压缩
        if (optimized.vertices.length > 10000) {
            const decimated = this.decimateGeometry({ geometry: optimized }, 8000);
            return decimated.geometry;
        }

        return optimized;
    }

    // 内存管理
    cleanup() {
        // 清理缓存
        this.cache.clear();
        this.loadingQueue.length = 0;

        // 强制垃圾回收（如果可用）
        if (window.gc) {
            window.gc();
        }
    }

    // 性能监控
    getPerformanceMetrics() {
        return {
            cacheSize: this.cache.size,
            memoryUsage: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null,
            timestamp: Date.now()
        };
    }
}

// 3D渲染器优化
class OptimizedRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        this.programs = new Map();
        this.buffers = new Map();
        this.frameCount = 0;
        this.lastFrameTime = performance.now();

        this.initGL();
    }

    initGL() {
        const gl = this.gl;

        // 启用深度测试和背面剔除
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        // 设置视口
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // 创建基础着色器程序
        this.createShaderProgram('basic',
            this.getBasicVertexShader(),
            this.getBasicFragmentShader()
        );
    }

    createShaderProgram(name, vertexSource, fragmentSource) {
        const gl = this.gl;

        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error('Shader program failed to link: ' + gl.getProgramInfoLog(program));
        }

        this.programs.set(name, program);
        return program;
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error('Shader compilation failed: ' + error);
        }

        return shader;
    }

    getBasicVertexShader() {
        return `
            attribute vec3 a_position;
            attribute vec3 a_normal;
            uniform mat4 u_mvpMatrix;
            uniform mat4 u_normalMatrix;
            varying vec3 v_normal;
            void main() {
                gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
                v_normal = normalize((u_normalMatrix * vec4(a_normal, 0.0)).xyz);
            }
        `;
    }

    getBasicFragmentShader() {
        return `
            precision mediump float;
            varying vec3 v_normal;
            uniform vec3 u_lightDirection;
            uniform vec3 u_color;
            void main() {
                float light = max(dot(v_normal, normalize(u_lightDirection)), 0.0);
                gl_FragColor = vec4(u_color * (0.3 + 0.7 * light), 1.0);
            }
        `;
    }

    render(model, mvpMatrix) {
        const gl = this.gl;
        const program = this.programs.get('basic');

        gl.useProgram(program);

        // 设置uniforms
        const mvpLocation = gl.getUniformLocation(program, 'u_mvpMatrix');
        gl.uniformMatrix4fv(mvpLocation, false, mvpMatrix);

        const colorLocation = gl.getUniformLocation(program, 'u_color');
        gl.uniform3f(colorLocation, 1.0, 0.7, 0.8); // 粉色

        const lightLocation = gl.getUniformLocation(program, 'u_lightDirection');
        gl.uniform3f(lightLocation, 0.5, 0.7, 1.0);

        // 绑定顶点数据
        this.bindModelData(model, program);

        // 绘制
        gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);

        // 性能统计
        this.updatePerformanceStats();
    }

    bindModelData(model, program) {
        const gl = this.gl;

        // 顶点位置
        if (!this.buffers.has('position')) {
            this.buffers.set('position', gl.createBuffer());
        }

        const positionBuffer = this.buffers.get('position');
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices.flat()), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        // 法线
        if (!this.buffers.has('normal')) {
            this.buffers.set('normal', gl.createBuffer());
        }

        const normalBuffer = this.buffers.get('normal');
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.normals.flat()), gl.STATIC_DRAW);

        const normalLocation = gl.getAttribLocation(program, 'a_normal');
        gl.enableVertexAttribArray(normalLocation);
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

        // 索引
        if (!this.buffers.has('index')) {
            this.buffers.set('index', gl.createBuffer());
        }

        const indexBuffer = this.buffers.get('index');
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);
    }

    updatePerformanceStats() {
        this.frameCount++;
        const now = performance.now();

        if (now - this.lastFrameTime >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
            console.log(`FPS: ${fps}`);

            this.frameCount = 0;
            this.lastFrameTime = now;
        }
    }

    cleanup() {
        const gl = this.gl;

        // 清理着色器程序
        this.programs.forEach(program => {
            gl.deleteProgram(program);
        });
        this.programs.clear();

        // 清理缓冲区
        this.buffers.forEach(buffer => {
            gl.deleteBuffer(buffer);
        });
        this.buffers.clear();
    }
}

// 导出优化器
window.Model3DOptimizer = Model3DOptimizer;
window.OptimizedRenderer = OptimizedRenderer;