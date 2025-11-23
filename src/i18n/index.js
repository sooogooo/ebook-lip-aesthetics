/**
 * 国际化核心模块
 * Internationalization Core Module
 */

import zhCN from './locales/zh-CN.js';
import enUS from './locales/en-US.js';

class I18n {
    constructor() {
        this.locales = {
            'zh-CN': zhCN,
            'en-US': enUS
        };
        this.currentLocale = this.detectLocale();
        this.fallbackLocale = 'zh-CN';
        this.listeners = [];
    }

    /**
     * 检测用户首选语言
     */
    detectLocale() {
        // 优先从localStorage读取
        const saved = localStorage.getItem('ebook-locale');
        if (saved && this.locales[saved]) {
            return saved;
        }

        // 检测浏览器语言
        const browserLang = navigator.language || navigator.userLanguage;

        if (browserLang.startsWith('zh')) {
            return 'zh-CN';
        } else if (browserLang.startsWith('en')) {
            return 'en-US';
        }

        return this.fallbackLocale;
    }

    /**
     * 设置当前语言
     */
    setLocale(locale) {
        if (!this.locales[locale]) {
            console.warn(`[i18n] Locale "${locale}" not found, using fallback`);
            locale = this.fallbackLocale;
        }

        this.currentLocale = locale;
        localStorage.setItem('ebook-locale', locale);
        document.documentElement.lang = locale;

        // 通知所有监听器
        this.listeners.forEach(callback => callback(locale));

        console.log(`[i18n] Locale changed to: ${locale}`);
        return this;
    }

    /**
     * 获取当前语言
     */
    getLocale() {
        return this.currentLocale;
    }

    /**
     * 获取可用语言列表
     */
    getAvailableLocales() {
        return Object.keys(this.locales).map(key => ({
            code: key,
            name: this.locales[key].meta.name,
            nativeName: this.locales[key].meta.nativeName
        }));
    }

    /**
     * 翻译文本
     * @param {string} key - 翻译键，支持点号分隔的路径
     * @param {object} params - 替换参数
     */
    t(key, params = {}) {
        const locale = this.locales[this.currentLocale] || this.locales[this.fallbackLocale];

        // 支持点号分隔的路径
        const keys = key.split('.');
        let value = locale;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // 回退到默认语言
                value = this.locales[this.fallbackLocale];
                for (const fk of keys) {
                    if (value && typeof value === 'object' && fk in value) {
                        value = value[fk];
                    } else {
                        console.warn(`[i18n] Translation key not found: ${key}`);
                        return key;
                    }
                }
                break;
            }
        }

        if (typeof value !== 'string') {
            return key;
        }

        // 替换参数 {param}
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
            return params[paramKey] !== undefined ? params[paramKey] : match;
        });
    }

    /**
     * 添加语言变更监听器
     */
    onLocaleChange(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * 添加新的语言包
     */
    addLocale(code, translations) {
        this.locales[code] = translations;
        console.log(`[i18n] Added locale: ${code}`);
    }

    /**
     * 扩展现有语言包
     */
    extendLocale(code, translations) {
        if (this.locales[code]) {
            this.locales[code] = this.deepMerge(this.locales[code], translations);
        } else {
            this.addLocale(code, translations);
        }
    }

    /**
     * 深度合并对象
     */
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }
}

// 单例实例
const i18n = new I18n();

// 便捷函数
export const t = (key, params) => i18n.t(key, params);
export const setLocale = (locale) => i18n.setLocale(locale);
export const getLocale = () => i18n.getLocale();
export const onLocaleChange = (callback) => i18n.onLocaleChange(callback);

export default i18n;
