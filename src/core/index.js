/**
 * 核心模块索引
 * Core Modules Index
 */

// 从根目录导入现有模块（迁移前的兼容方案）
// Import from root directory (compatibility before migration)

// 状态管理
export { default as StateManager } from '../../state-management.js';

// Hook系统
export { default as HookSystem } from '../../hook-system.js';

// 组件库
export { default as ComponentLibrary } from '../../component-library.js';

// 主集成模块
export { default as Integration } from '../../integration.js';

// 紧凑组件系统
export { default as CompactComponents } from '../../compact-component-system.js';

// 默认导出
export default {
    StateManager: null, // 将在初始化时填充
    HookSystem: null,
    ComponentLibrary: null,
    Integration: null
};

/**
 * 初始化核心模块
 */
export async function initCore() {
    console.log('[Core] Initializing core modules...');

    const modules = await Promise.all([
        import('../../state-management.js'),
        import('../../hook-system.js'),
        import('../../component-library.js'),
        import('../../integration.js')
    ]);

    return {
        StateManager: modules[0].default,
        HookSystem: modules[1].default,
        ComponentLibrary: modules[2].default,
        Integration: modules[3].default
    };
}
