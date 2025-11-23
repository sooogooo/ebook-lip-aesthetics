# 国际化 (i18n) 使用指南

## 快速开始

### 基础用法

```javascript
import { t, setLocale, getLocale } from './src/i18n/index.js';

// 获取翻译文本
const title = t('nav.home');  // 中文: "首页", 英文: "Home"

// 带参数的翻译
const results = t('search.resultCount', { count: 42 });
// 中文: "找到 42 个结果"
// 英文: "Found 42 results"

// 切换语言
setLocale('en-US');

// 获取当前语言
const currentLocale = getLocale();  // "en-US"
```

### 在组件中使用

```javascript
import { t, onLocaleChange } from './src/i18n/index.js';

class MyComponent {
    constructor() {
        // 监听语言变化
        onLocaleChange((locale) => {
            this.updateContent();
        });
    }

    updateContent() {
        this.element.innerHTML = `
            <h1>${t('chapters.chapter1')}</h1>
            <p>${t('common.loading')}</p>
        `;
    }
}
```

### 使用语言切换器

```javascript
import { LanguageSwitcher } from './src/i18n/LanguageSwitcher.js';

// 下拉菜单模式
const switcher = new LanguageSwitcher({
    container: '#language-selector',
    showFlag: true,
    showNativeName: true,
    dropdownMode: true,
    onChange: (locale) => {
        console.log('Language changed to:', locale);
    }
});

// 添加样式
const style = document.createElement('style');
style.textContent = LanguageSwitcher.getStyles();
document.head.appendChild(style);
```

## 翻译键结构

| 分类 | 键前缀 | 示例 |
|------|--------|------|
| 通用 | `common.*` | `common.loading`, `common.save` |
| 导航 | `nav.*` | `nav.home`, `nav.chapters` |
| 章节 | `chapters.*` | `chapters.chapter1` |
| 3D查看器 | `viewer3d.*` | `viewer3d.rotate` |
| 案例 | `cases.*` | `cases.before`, `cases.after` |
| 术语表 | `glossary.*` | `glossary.title` |
| 设置 | `settings.*` | `settings.language` |
| 搜索 | `search.*` | `search.placeholder` |
| 导出 | `export.*` | `export.title` |
| 错误 | `errors.*` | `errors.networkError` |

## 添加新语言

1. 在 `src/i18n/locales/` 创建新语言文件:

```javascript
// src/i18n/locales/ja-JP.js
export default {
    meta: {
        code: 'ja-JP',
        name: 'Japanese',
        nativeName: '日本語',
        direction: 'ltr'
    },
    common: {
        loading: '読み込み中...',
        // ... 其他翻译
    }
};
```

2. 在 `src/i18n/index.js` 中导入:

```javascript
import jaJP from './locales/ja-JP.js';

// 在构造函数中
this.locales = {
    'zh-CN': zhCN,
    'en-US': enUS,
    'ja-JP': jaJP
};
```

## API 参考

### i18n 实例方法

| 方法 | 描述 |
|------|------|
| `t(key, params)` | 翻译文本 |
| `setLocale(code)` | 设置当前语言 |
| `getLocale()` | 获取当前语言 |
| `getAvailableLocales()` | 获取所有可用语言 |
| `onLocaleChange(callback)` | 监听语言变化 |
| `addLocale(code, translations)` | 添加新语言 |
| `extendLocale(code, translations)` | 扩展现有语言 |

### LanguageSwitcher 选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `container` | string/Element | null | 容器选择器或元素 |
| `showFlag` | boolean | true | 显示国旗表情 |
| `showNativeName` | boolean | true | 显示原生语言名称 |
| `dropdownMode` | boolean | true | 使用下拉菜单模式 |
| `onChange` | function | null | 语言变化回调 |

## 最佳实践

1. **使用命名空间**: 按功能分组翻译键，如 `nav.home` 而不是 `home`
2. **参数化文本**: 对于包含变量的文本使用 `{param}` 占位符
3. **回退机制**: 系统会自动回退到中文（zh-CN）如果找不到翻译
4. **监听变化**: 使用 `onLocaleChange` 更新动态内容
5. **预加载**: 所有语言包默认预加载以确保即时切换
