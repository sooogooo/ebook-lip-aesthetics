/**
 * PWA模块索引
 * PWA Modules Index
 */

// 从根目录导入现有模块
export { default as PushNotifications } from '../../push_notification_system.js';

/**
 * 注册Service Worker
 */
export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('[PWA] Service Worker not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
        });

        console.log('[PWA] Service Worker registered:', registration.scope);

        // 检查更新
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[PWA] New Service Worker installing...');

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New content available, please refresh');
                }
            });
        });

        return registration;
    } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
        throw error;
    }
}

/**
 * 初始化PWA功能
 */
export async function initPWA() {
    console.log('[PWA] Initializing PWA modules...');

    const registration = await registerServiceWorker();

    // 检查是否支持推送通知
    let pushSupported = false;
    if ('PushManager' in window) {
        pushSupported = true;
        console.log('[PWA] Push notifications supported');
    }

    return {
        registration,
        pushSupported
    };
}

export default { initPWA, registerServiceWorker };
