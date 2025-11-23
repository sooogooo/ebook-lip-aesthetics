/**
 * 3D渲染模块索引
 * 3D Rendering Modules Index
 */

// 从根目录导入现有模块
export { default as ThreeModels } from '../../3d_models.js';
export { default as Enhanced3DAnatomy } from '../../enhanced_3d_anatomy.js';
export { default as LightingMaterials } from '../../advanced_lighting_materials.js';
export { default as MedicalShaders } from '../../advanced_medical_shaders.js';
export { default as LODSystem } from '../../medical_lod_system.js';
export { default as MeshCompression } from '../../mesh_compression_system.js';
export { default as PhysicsSimulator } from '../../tissue_physics_simulator.js';
export { default as MultiThreadRenderer } from '../../multi_threaded_rendering.js';
export { default as Optimizer3D } from '../../3d_optimizer_compact.js';

/**
 * 初始化3D模块
 * @param {Object} options - 配置选项
 * @param {boolean} options.enablePhysics - 是否启用物理模拟
 * @param {boolean} options.enableMultiThread - 是否启用多线程渲染
 */
export async function init3D(options = {}) {
    console.log('[3D] Initializing 3D rendering modules...');

    const baseModules = await Promise.all([
        import('../../3d_models.js'),
        import('../../enhanced_3d_anatomy.js'),
        import('../../advanced_lighting_materials.js')
    ]);

    const result = {
        ThreeModels: baseModules[0].default,
        AnatomyViewer: baseModules[1].default,
        LightingSystem: baseModules[2].default
    };

    // 按需加载高级功能
    if (options.enablePhysics) {
        const physics = await import('../../tissue_physics_simulator.js');
        result.PhysicsSimulator = physics.default;
    }

    if (options.enableMultiThread) {
        const multiThread = await import('../../multi_threaded_rendering.js');
        result.MultiThreadRenderer = multiThread.default;
    }

    return result;
}

export default { init3D };
