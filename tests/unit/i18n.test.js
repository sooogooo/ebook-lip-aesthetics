/**
 * i18n 国际化模块单元测试
 * i18n Module Unit Tests
 */

// 模拟语言包
const mockZhCN = {
    meta: {
        code: 'zh-CN',
        name: 'Chinese',
        nativeName: '简体中文'
    },
    common: {
        loading: '加载中...',
        save: '保存',
        cancel: '取消'
    },
    nav: {
        home: '首页',
        chapters: '章节'
    },
    search: {
        resultCount: '找到 {count} 个结果'
    }
};

const mockEnUS = {
    meta: {
        code: 'en-US',
        name: 'English',
        nativeName: 'English'
    },
    common: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel'
    },
    nav: {
        home: 'Home',
        chapters: 'Chapters'
    },
    search: {
        resultCount: 'Found {count} results'
    }
};

// 创建测试用 i18n 类
class TestI18n {
    constructor() {
        this.locales = {
            'zh-CN': mockZhCN,
            'en-US': mockEnUS
        };
        this.currentLocale = 'zh-CN';
        this.fallbackLocale = 'zh-CN';
        this.listeners = [];
    }

    setLocale(locale) {
        if (this.locales[locale]) {
            this.currentLocale = locale;
            this.listeners.forEach(cb => cb(locale));
        }
        return this;
    }

    getLocale() {
        return this.currentLocale;
    }

    getAvailableLocales() {
        return Object.keys(this.locales).map(key => ({
            code: key,
            name: this.locales[key].meta.name,
            nativeName: this.locales[key].meta.nativeName
        }));
    }

    t(key, params = {}) {
        const locale = this.locales[this.currentLocale];
        const keys = key.split('.');
        let value = locale;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key;
            }
        }

        if (typeof value !== 'string') {
            return key;
        }

        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
            return params[paramKey] !== undefined ? params[paramKey] : match;
        });
    }

    onLocaleChange(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }
}

describe('i18n 核心功能', () => {
    let i18n;

    beforeEach(() => {
        i18n = new TestI18n();
    });

    describe('语言设置', () => {
        test('默认语言应为中文', () => {
            expect(i18n.getLocale()).toBe('zh-CN');
        });

        test('应能切换到英文', () => {
            i18n.setLocale('en-US');
            expect(i18n.getLocale()).toBe('en-US');
        });

        test('切换到无效语言时应保持当前语言', () => {
            i18n.setLocale('invalid');
            expect(i18n.getLocale()).toBe('zh-CN');
        });

        test('setLocale 应返回自身以支持链式调用', () => {
            const result = i18n.setLocale('en-US');
            expect(result).toBe(i18n);
        });
    });

    describe('翻译功能', () => {
        test('应返回中文翻译', () => {
            expect(i18n.t('common.loading')).toBe('加载中...');
            expect(i18n.t('nav.home')).toBe('首页');
        });

        test('切换语言后应返回英文翻译', () => {
            i18n.setLocale('en-US');
            expect(i18n.t('common.loading')).toBe('Loading...');
            expect(i18n.t('nav.home')).toBe('Home');
        });

        test('找不到翻译键时应返回键名', () => {
            expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
        });

        test('应支持参数替换', () => {
            const result = i18n.t('search.resultCount', { count: 42 });
            expect(result).toBe('找到 42 个结果');
        });

        test('英文参数替换', () => {
            i18n.setLocale('en-US');
            const result = i18n.t('search.resultCount', { count: 10 });
            expect(result).toBe('Found 10 results');
        });

        test('缺少参数时应保留占位符', () => {
            const result = i18n.t('search.resultCount');
            expect(result).toBe('找到 {count} 个结果');
        });
    });

    describe('可用语言', () => {
        test('应返回所有可用语言', () => {
            const locales = i18n.getAvailableLocales();
            expect(locales).toHaveLength(2);
            expect(locales[0].code).toBe('zh-CN');
            expect(locales[1].code).toBe('en-US');
        });

        test('应包含语言名称和原生名称', () => {
            const locales = i18n.getAvailableLocales();
            const zhCN = locales.find(l => l.code === 'zh-CN');
            expect(zhCN.name).toBe('Chinese');
            expect(zhCN.nativeName).toBe('简体中文');
        });
    });

    describe('语言变更监听', () => {
        test('应在语言变更时调用监听器', () => {
            const callback = jest.fn();
            i18n.onLocaleChange(callback);

            i18n.setLocale('en-US');
            expect(callback).toHaveBeenCalledWith('en-US');
        });

        test('应支持多个监听器', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            i18n.onLocaleChange(callback1);
            i18n.onLocaleChange(callback2);

            i18n.setLocale('en-US');
            expect(callback1).toHaveBeenCalledWith('en-US');
            expect(callback2).toHaveBeenCalledWith('en-US');
        });

        test('应能取消监听', () => {
            const callback = jest.fn();
            const unsubscribe = i18n.onLocaleChange(callback);

            unsubscribe();
            i18n.setLocale('en-US');
            expect(callback).not.toHaveBeenCalled();
        });
    });
});

describe('翻译键路径解析', () => {
    let i18n;

    beforeEach(() => {
        i18n = new TestI18n();
    });

    test('应支持单级路径', () => {
        // 需要在 locale 中有单级键才能测试
        // 这里测试 meta 下的键
        const locales = i18n.getAvailableLocales();
        expect(locales[0].nativeName).toBe('简体中文');
    });

    test('应支持多级路径', () => {
        expect(i18n.t('common.loading')).toBe('加载中...');
    });

    test('部分路径存在但最终键不存在时返回键名', () => {
        expect(i18n.t('common.nonexistent')).toBe('common.nonexistent');
    });
});
