#!/usr/bin/env node

/**
 * 生产构建脚本 - 精简版
 * 创建高度优化的生产版本
 */

const fs = require('fs').promises;
const path = require('path');

class CompactBuilder {
    constructor() {
        this.sourceDir = '.';
        this.outputDir = 'dist';
        this.stats = {
            files: 0,
            originalSize: 0,
            compressedSize: 0,
            startTime: Date.now()
        };
    }

    async build() {
        console.log('🚀 开始生产构建 (精简版)...\n');

        try {
            await this.createOutputDir();
            await this.processFiles();
            await this.generateManifest();
            await this.copyAssets();

            this.printSummary();
            console.log('\n✅ 构建完成!');

        } catch (error) {
            console.error('❌ 构建失败:', error.message);
            process.exit(1);
        }
    }

    async createOutputDir() {
        try {
            await fs.rm(this.outputDir, { recursive: true, force: true });
        } catch {}

        await fs.mkdir(this.outputDir, { recursive: true });
        await fs.mkdir(path.join(this.outputDir, 'assets'), { recursive: true });
        console.log('📁 创建输出目录');
    }

    async processFiles() {
        console.log('⚡ 处理和优化文件...');

        const files = [
            // HTML文件
            { src: 'visualization_compact.html', dest: 'index.html', type: 'html' },
            { src: 'medical_dashboard.html', dest: 'dashboard.html', type: 'html' },
            { src: 'enhanced_3d_anatomy.html', dest: '3d-anatomy.html', type: 'html' },
            { src: 'mobile_pwa_complete.html', dest: 'mobile.html', type: 'html' },

            // CSS文件
            { src: 'unified_styles.css', dest: 'assets/styles.css', type: 'css' },
            { src: 'mobile_optimizations.css', dest: 'assets/mobile.css', type: 'css' },

            // JavaScript文件
            { src: 'integration.js', dest: 'assets/app.js', type: 'js' },
            { src: '3d_optimizer_compact.js', dest: 'assets/3d-optimizer.js', type: 'js' },
            { src: 'data_viz_optimizer.js', dest: 'assets/data-viz.js', type: 'js' },
            { src: 'mobile_gestures.js', dest: 'assets/gestures.js', type: 'js' },

            // Service Worker
            { src: 'service_worker.js', dest: 'sw.js', type: 'js' },

            // PWA文件
            { src: 'pwa_manifest.json', dest: 'manifest.json', type: 'json' }
        ];

        for (const file of files) {
            await this.processFile(file);
        }
    }

    async processFile(file) {
        try {
            const srcPath = path.join(this.sourceDir, file.src);
            const destPath = path.join(this.outputDir, file.dest);

            let content = await fs.readFile(srcPath, 'utf8');
            const originalSize = Buffer.byteLength(content, 'utf8');

            // 优化内容
            content = await this.optimizeContent(content, file.type);

            // 确保目录存在
            await fs.mkdir(path.dirname(destPath), { recursive: true });

            // 写入优化后的文件
            await fs.writeFile(destPath, content);

            const compressedSize = Buffer.byteLength(content, 'utf8');
            const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

            console.log(`  ✓ ${file.src} → ${file.dest} (${reduction}% 减少)`);

            this.stats.files++;
            this.stats.originalSize += originalSize;
            this.stats.compressedSize += compressedSize;

        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`  ⚠️  跳过 ${file.src}: ${error.message}`);
            }
        }
    }

    async optimizeContent(content, type) {
        switch (type) {
            case 'html':
                return this.optimizeHTML(content);
            case 'css':
                return this.optimizeCSS(content);
            case 'js':
                return this.optimizeJS(content);
            case 'json':
                return this.optimizeJSON(content);
            default:
                return content;
        }
    }

    optimizeHTML(html) {
        return html
            // 移除注释
            .replace(/<!--[\s\S]*?-->/g, '')
            // 移除多余空白
            .replace(/\s+/g, ' ')
            .replace(/>\s+</g, '><')
            // 移除空行
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }

    optimizeCSS(css) {
        return css
            // 移除注释
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // 移除多余空白
            .replace(/\s+/g, ' ')
            .replace(/;\s*}/g, '}')
            .replace(/{\s*/g, '{')
            .replace(/;\s*/g, ';')
            .replace(/,\s*/g, ',')
            .replace(/:\s*/g, ':')
            // 移除最后的分号
            .replace(/;}/g, '}')
            .trim();
    }

    optimizeJS(js) {
        return js
            // 移除单行注释
            .replace(/\/\/.*$/gm, '')
            // 移除多行注释
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // 移除多余空白
            .replace(/\s+/g, ' ')
            .replace(/;\s*}/g, ';}')
            .replace(/{\s*/g, '{')
            .replace(/;\s*/g, ';')
            .replace(/,\s*/g, ',')
            // 移除console.log (生产环境)
            .replace(/console\.log\([^)]*\);?/g, '')
            .trim();
    }

    optimizeJSON(json) {
        try {
            // 解析并重新格式化JSON，移除空白
            const parsed = JSON.parse(json);
            return JSON.stringify(parsed);
        } catch {
            return json;
        }
    }

    async generateManifest() {
        console.log('📋 生成构建清单...');

        const manifest = {
            buildTime: new Date().toISOString(),
            version: '2.0.0',
            files: [],
            stats: {
                totalFiles: this.stats.files,
                originalSize: this.formatBytes(this.stats.originalSize),
                compressedSize: this.formatBytes(this.stats.compressedSize),
                compressionRatio: ((this.stats.originalSize - this.stats.compressedSize) / this.stats.originalSize * 100).toFixed(1) + '%'
            }
        };

        // 扫描输出目录
        const scanDir = async (dir, basePath = '') => {
            const items = await fs.readdir(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relativePath = path.join(basePath, item);
                const stat = await fs.stat(fullPath);

                if (stat.isDirectory()) {
                    await scanDir(fullPath, relativePath);
                } else {
                    manifest.files.push({
                        path: relativePath.replace(/\\/g, '/'),
                        size: this.formatBytes(stat.size),
                        modified: stat.mtime.toISOString()
                    });
                }
            }
        };

        await scanDir(this.outputDir);

        await fs.writeFile(
            path.join(this.outputDir, 'build-manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
    }

    async copyAssets() {
        console.log('📎 复制静态资源...');

        const assets = ['images', 'icons', 'models'];

        for (const asset of assets) {
            try {
                await fs.access(asset);
                await this.copyRecursive(asset, path.join(this.outputDir, asset));
                console.log(`  ✓ ${asset}/`);
            } catch {
                // 目录不存在，跳过
            }
        }
    }

    async copyRecursive(src, dest) {
        const stat = await fs.stat(src);

        if (stat.isDirectory()) {
            await fs.mkdir(dest, { recursive: true });
            const items = await fs.readdir(src);

            for (const item of items) {
                await this.copyRecursive(
                    path.join(src, item),
                    path.join(dest, item)
                );
            }
        } else {
            await fs.copyFile(src, dest);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    printSummary() {
        const buildTime = ((Date.now() - this.stats.startTime) / 1000).toFixed(2);

        console.log('\n📊 构建统计:');
        console.log(`  文件数量: ${this.stats.files}`);
        console.log(`  原始大小: ${this.formatBytes(this.stats.originalSize)}`);
        console.log(`  压缩大小: ${this.formatBytes(this.stats.compressedSize)}`);
        console.log(`  压缩比率: ${((this.stats.originalSize - this.stats.compressedSize) / this.stats.originalSize * 100).toFixed(1)}%`);
        console.log(`  构建时间: ${buildTime}s`);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const builder = new CompactBuilder();
    builder.build().catch(console.error);
}

module.exports = CompactBuilder;