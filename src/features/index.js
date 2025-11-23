/**
 * 功能模块索引
 * Feature Modules Index
 */

// 从根目录导入现有模块
export { default as SearchSystem } from '../../search-system.js';
export { default as ExportSharing } from '../../export-sharing-system.js';
export { default as Accessibility } from '../../accessibility-system.js';
export { default as ProgressiveEnhancement } from '../../progressive-enhancement.js';
export { default as LazyLoadManager } from '../../lazy-load-manager.js';
export { default as ResponsiveImages } from '../../responsive_image_delivery.js';
export { default as MarkdownRenderer } from '../../markdown-renderer.js';
export { default as Documentation } from '../../documentation-interactive.js';

/**
 * 初始化功能模块
 */
export async function initFeatures(options = {}) {
    console.log('[Features] Initializing feature modules...');

    const modules = {};

    // 搜索系统
    if (options.search !== false) {
        const search = await import('../../search-system.js');
        modules.SearchSystem = search.default;
    }

    // 无障碍系统
    if (options.accessibility !== false) {
        const a11y = await import('../../accessibility-system.js');
        modules.Accessibility = a11y.default;
    }

    // 懒加载管理器
    if (options.lazyLoad !== false) {
        const lazyLoad = await import('../../lazy-load-manager.js');
        modules.LazyLoadManager = lazyLoad.default;
    }

    // 渐进增强
    if (options.progressive !== false) {
        const progressive = await import('../../progressive-enhancement.js');
        modules.ProgressiveEnhancement = progressive.default;
    }

    return modules;
}

export default { initFeatures };
