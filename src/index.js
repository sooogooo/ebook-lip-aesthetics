/**
 * 唇部美学电子书 - 主模块入口
 * Lip Aesthetics E-Book - Main Module Entry
 *
 * 此文件作为所有模块的统一入口点，提供模块化的代码组织结构。
 * This file serves as the unified entry point for all modules.
 */

// ==========================================
// 核心模块 (Core Modules)
// ==========================================
export { default as StateManager } from './core/state-management.js';
export { default as HookSystem } from './core/hook-system.js';
export { default as ComponentLibrary } from './core/component-library.js';
export { default as Integration } from './core/integration.js';

// ==========================================
// 3D渲染模块 (3D Rendering Modules)
// ==========================================
export { default as ThreeModels } from './3d/models.js';
export { default as AnatomyViewer } from './3d/anatomy-viewer.js';
export { default as LightingSystem } from './3d/lighting-materials.js';
export { default as ShaderSystem } from './3d/medical-shaders.js';
export { default as LODSystem } from './3d/lod-system.js';
export { default as MeshCompression } from './3d/mesh-compression.js';
export { default as PhysicsSimulator } from './3d/physics-simulator.js';
export { default as MultiThreadRenderer } from './3d/multi-thread-renderer.js';
export { default as Optimizer3D } from './3d/optimizer.js';

// ==========================================
// UI组件模块 (UI Component Modules)
// ==========================================
export { default as Gallery } from './ui/gallery.js';
export { default as Charts } from './ui/charts.js';
export { default as ZoomViewer } from './ui/zoom-viewer.js';
export { default as VisualizationWidgets } from './ui/visualization-widgets.js';
export { default as ThemeSystem } from './ui/theme-system.js';
export { default as CSSInJS } from './ui/css-in-js.js';
export { default as CustomizationSystem } from './ui/customization.js';

// ==========================================
// 移动端模块 (Mobile Modules)
// ==========================================
export { default as Mobile3DViewer } from './mobile/viewer-3d.js';
export { default as MobileAR } from './mobile/ar-handler.js';
export { default as MobileGestures } from './mobile/gestures.js';
export { default as MobileHub } from './mobile/integration-hub.js';

// ==========================================
// 数据分析模块 (Analytics Modules)
// ==========================================
export { default as CaseAnalytics } from './analytics/case-analytics.js';
export { default as MedicalAnalytics } from './analytics/medical-analytics.js';
export { default as DataVizOptimizer } from './analytics/data-viz-optimizer.js';
export { default as MedicalVisualization } from './analytics/medical-visualization.js';
export { default as DataProcessor } from './analytics/DataProcessor.js';
export { default as MLModelManager } from './analytics/MLModelManager.js';
export { default as AdvancedVisualizer } from './analytics/AdvancedVisualizer.js';
export { default as StreamingDataManager } from './analytics/StreamingDataManager.js';

// ==========================================
// 功能模块 (Feature Modules)
// ==========================================
export { default as SearchSystem } from './features/search.js';
export { default as ExportSharing } from './features/export-sharing.js';
export { default as Accessibility } from './features/accessibility.js';
export { default as ProgressiveEnhancement } from './features/progressive-enhancement.js';
export { default as LazyLoadManager } from './features/lazy-load.js';
export { default as ResponsiveImages } from './features/responsive-images.js';
export { default as MarkdownRenderer } from './features/markdown-renderer.js';
export { default as Documentation } from './features/documentation.js';

// ==========================================
// PWA模块 (PWA Modules)
// ==========================================
export { default as ServiceWorkerManager } from './pwa/service-worker-manager.js';
export { default as PushNotifications } from './pwa/push-notifications.js';

// ==========================================
// 性能模块 (Performance Modules)
// ==========================================
export { default as PerformanceMonitor } from './performance/monitor.js';

// ==========================================
// 国际化模块 (i18n Modules)
// ==========================================
export { default as i18n, t, setLocale, getLocale, onLocaleChange } from './i18n/index.js';
export { default as LanguageSwitcher } from './i18n/LanguageSwitcher.js';

// ==========================================
// 版本信息 (Version Info)
// ==========================================
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

/**
 * 初始化所有模块
 * Initialize all modules
 */
export async function initializeApp(config = {}) {
    console.log(`[LipAesthetics] Initializing v${VERSION}`);

    const modules = {
        core: null,
        ui: null,
        analytics: null,
        mobile: null,
        pwa: null,
        i18n: null
    };

    try {
        // 初始化国际化模块
        if (config.i18n !== false) {
            const i18nModule = await import('./i18n/index.js');
            modules.i18n = i18nModule.default;

            // 设置初始语言
            if (config.locale) {
                i18nModule.setLocale(config.locale);
            }
        }

        // 初始化核心模块
        if (config.core !== false) {
            const { StateManager, HookSystem } = await import('./core/state-management.js');
            modules.core = { StateManager, HookSystem };
        }

        // 初始化UI模块
        if (config.ui !== false) {
            modules.ui = await import('./ui/index.js');
        }

        // 初始化分析模块
        if (config.analytics !== false) {
            modules.analytics = await import('./analytics/index.js');
        }

        // 初始化移动端模块（如果是移动设备）
        if (config.mobile !== false && /Mobi|Android/i.test(navigator.userAgent)) {
            modules.mobile = await import('./mobile/index.js');
        }

        // 注册Service Worker
        if (config.pwa !== false && 'serviceWorker' in navigator) {
            modules.pwa = await import('./pwa/index.js');
        }

        console.log('[LipAesthetics] All modules initialized successfully');
        return modules;

    } catch (error) {
        console.error('[LipAesthetics] Module initialization failed:', error);
        throw error;
    }
}

// 默认导出
export default {
    VERSION,
    BUILD_DATE,
    initializeApp
};
