/**
 * 数据分析模块索引
 * Analytics Modules Index
 */

// 从根目录导入现有模块
export { default as CaseAnalytics } from '../../case_analytics.js';
export { default as MedicalAnalytics } from '../../medical_data_analytics.js';
export { default as DataVizOptimizer } from '../../data_viz_optimizer.js';
export { default as MedicalVisualization } from '../../advanced_medical_visualization.js';

// 从src/analytics导入
export { default as DataProcessor } from './DataProcessor.js';
export { default as MLModelManager } from './MLModelManager.js';
export { default as AdvancedVisualizer } from './AdvancedVisualizer.js';
export { default as StreamingDataManager } from './StreamingDataManager.js';

/**
 * 初始化分析模块
 */
export async function initAnalytics(options = {}) {
    console.log('[Analytics] Initializing analytics modules...');

    const modules = {};

    // 基础分析
    const baseModules = await Promise.all([
        import('../../case_analytics.js'),
        import('../../medical_data_analytics.js')
    ]);

    modules.CaseAnalytics = baseModules[0].default;
    modules.MedicalAnalytics = baseModules[1].default;

    // 高级可视化
    if (options.visualization !== false) {
        const viz = await import('../../advanced_medical_visualization.js');
        modules.MedicalVisualization = viz.default;
    }

    // ML模型管理
    if (options.ml !== false) {
        const ml = await import('./MLModelManager.js');
        modules.MLModelManager = ml.default;
    }

    // 数据处理
    if (options.dataProcessor !== false) {
        const processor = await import('./DataProcessor.js');
        modules.DataProcessor = processor.default;
    }

    return modules;
}

export default { initAnalytics };
