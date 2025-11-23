/**
 * 移动端模块索引
 * Mobile Modules Index
 */

// 从根目录导入现有模块
export { default as Mobile3DViewer } from '../../mobile_3d_viewer.js';
export { default as MobileAR } from '../../mobile_ar_handler.js';
export { default as MobileGestures } from '../../mobile_gestures.js';
export { default as MobileHub } from '../../mobile_integration_hub.js';

/**
 * 检测是否为移动设备
 */
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 初始化移动端模块
 */
export async function initMobile() {
    if (!isMobileDevice()) {
        console.log('[Mobile] Not a mobile device, skipping initialization');
        return null;
    }

    console.log('[Mobile] Initializing mobile modules...');

    const modules = await Promise.all([
        import('../../mobile_3d_viewer.js'),
        import('../../mobile_gestures.js'),
        import('../../mobile_integration_hub.js')
    ]);

    return {
        Mobile3DViewer: modules[0].default,
        MobileGestures: modules[1].default,
        MobileHub: modules[2].default
    };
}

export default { initMobile, isMobileDevice };
