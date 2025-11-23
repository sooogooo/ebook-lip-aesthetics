/**
 * UI组件模块索引
 * UI Component Modules Index
 */

// 从根目录导入现有模块
export { default as Gallery } from '../../gallery.js';
export { default as Charts } from '../../charts.js';
export { default as ZoomViewer } from '../../zoom_viewer.js';
export { default as VisualizationWidgets } from '../../visualization-widgets.js';
export { default as ThemeSystem } from '../../theme-system.js';
export { default as CSSInJS } from '../../css-in-js-system.js';
export { default as CustomizationSystem } from '../../customization-system.js';

/**
 * 初始化UI模块
 */
export async function initUI() {
    console.log('[UI] Initializing UI modules...');

    const modules = await Promise.all([
        import('../../gallery.js'),
        import('../../charts.js'),
        import('../../theme-system.js'),
        import('../../visualization-widgets.js')
    ]);

    return {
        Gallery: modules[0].default,
        Charts: modules[1].default,
        ThemeSystem: modules[2].default,
        VisualizationWidgets: modules[3].default
    };
}

export default { initUI };
