/**
 * 语言切换器组件
 * Language Switcher Component
 */

import i18n, { t, onLocaleChange } from './index.js';

export class LanguageSwitcher {
    constructor(options = {}) {
        this.container = options.container || null;
        this.showFlag = options.showFlag !== false;
        this.showNativeName = options.showNativeName !== false;
        this.dropdownMode = options.dropdownMode !== false;
        this.onChangeCallback = options.onChange || null;

        this.flags = {
            'zh-CN': '🇨🇳',
            'en-US': '🇺🇸'
        };

        if (this.container) {
            this.render();
        }

        // 监听语言变化
        onLocaleChange((locale) => {
            this.updateDisplay(locale);
            if (this.onChangeCallback) {
                this.onChangeCallback(locale);
            }
        });
    }

    /**
     * 渲染语言切换器
     */
    render() {
        const container = typeof this.container === 'string'
            ? document.querySelector(this.container)
            : this.container;

        if (!container) {
            console.warn('[LanguageSwitcher] Container not found');
            return;
        }

        const locales = i18n.getAvailableLocales();
        const currentLocale = i18n.getLocale();

        if (this.dropdownMode) {
            container.innerHTML = this.renderDropdown(locales, currentLocale);
            this.attachDropdownEvents(container);
        } else {
            container.innerHTML = this.renderButtons(locales, currentLocale);
            this.attachButtonEvents(container);
        }
    }

    /**
     * 渲染下拉菜单模式
     */
    renderDropdown(locales, currentLocale) {
        const current = locales.find(l => l.code === currentLocale);

        return `
            <div class="language-switcher dropdown" role="listbox" aria-label="${t('a11y.languageSelect')}">
                <button class="language-current" aria-haspopup="listbox" aria-expanded="false">
                    ${this.showFlag ? `<span class="flag">${this.flags[currentLocale] || ''}</span>` : ''}
                    <span class="lang-name">${this.showNativeName ? current.nativeName : current.name}</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <ul class="language-list" role="listbox" hidden>
                    ${locales.map(locale => `
                        <li role="option"
                            data-locale="${locale.code}"
                            class="${locale.code === currentLocale ? 'active' : ''}"
                            aria-selected="${locale.code === currentLocale}">
                            ${this.showFlag ? `<span class="flag">${this.flags[locale.code] || ''}</span>` : ''}
                            <span class="lang-name">${this.showNativeName ? locale.nativeName : locale.name}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    /**
     * 渲染按钮模式
     */
    renderButtons(locales, currentLocale) {
        return `
            <div class="language-switcher buttons" role="radiogroup" aria-label="${t('a11y.languageSelect')}">
                ${locales.map(locale => `
                    <button
                        class="lang-btn ${locale.code === currentLocale ? 'active' : ''}"
                        data-locale="${locale.code}"
                        role="radio"
                        aria-checked="${locale.code === currentLocale}">
                        ${this.showFlag ? `<span class="flag">${this.flags[locale.code] || ''}</span>` : ''}
                        <span class="lang-name">${this.showNativeName ? locale.nativeName : locale.name}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * 附加下拉菜单事件
     */
    attachDropdownEvents(container) {
        const btn = container.querySelector('.language-current');
        const list = container.querySelector('.language-list');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', !isExpanded);
            list.hidden = isExpanded;
        });

        list.addEventListener('click', (e) => {
            const item = e.target.closest('[data-locale]');
            if (item) {
                const locale = item.dataset.locale;
                i18n.setLocale(locale);
                btn.setAttribute('aria-expanded', 'false');
                list.hidden = true;
            }
        });

        // 点击外部关闭
        document.addEventListener('click', () => {
            btn.setAttribute('aria-expanded', 'false');
            list.hidden = true;
        });

        // 键盘导航
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                btn.setAttribute('aria-expanded', 'false');
                list.hidden = true;
                btn.focus();
            }
        });
    }

    /**
     * 附加按钮事件
     */
    attachButtonEvents(container) {
        container.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const locale = btn.dataset.locale;
                i18n.setLocale(locale);
            });
        });
    }

    /**
     * 更新显示状态
     */
    updateDisplay(locale) {
        if (!this.container) return;

        const container = typeof this.container === 'string'
            ? document.querySelector(this.container)
            : this.container;

        if (!container) return;

        // 更新活动状态
        container.querySelectorAll('[data-locale]').forEach(el => {
            const isActive = el.dataset.locale === locale;
            el.classList.toggle('active', isActive);
            if (el.hasAttribute('aria-selected')) {
                el.setAttribute('aria-selected', isActive);
            }
            if (el.hasAttribute('aria-checked')) {
                el.setAttribute('aria-checked', isActive);
            }
        });

        // 更新当前显示（下拉模式）
        const currentBtn = container.querySelector('.language-current');
        if (currentBtn) {
            const locales = i18n.getAvailableLocales();
            const current = locales.find(l => l.code === locale);
            currentBtn.querySelector('.lang-name').textContent =
                this.showNativeName ? current.nativeName : current.name;
            if (this.showFlag) {
                currentBtn.querySelector('.flag').textContent = this.flags[locale] || '';
            }
        }
    }

    /**
     * 获取CSS样式
     */
    static getStyles() {
        return `
            .language-switcher {
                position: relative;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .language-switcher.dropdown .language-current {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background: white;
                cursor: pointer;
                font-size: 14px;
                transition: border-color 0.2s;
            }

            .language-switcher.dropdown .language-current:hover {
                border-color: #007bff;
            }

            .language-switcher.dropdown .dropdown-arrow {
                font-size: 10px;
                margin-left: 4px;
                transition: transform 0.2s;
            }

            .language-switcher.dropdown .language-current[aria-expanded="true"] .dropdown-arrow {
                transform: rotate(180deg);
            }

            .language-switcher.dropdown .language-list {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                margin-top: 4px;
                padding: 4px 0;
                list-style: none;
                background: white;
                border: 1px solid #ddd;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
            }

            .language-switcher.dropdown .language-list li {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .language-switcher.dropdown .language-list li:hover {
                background-color: #f5f5f5;
            }

            .language-switcher.dropdown .language-list li.active {
                background-color: #e3f2fd;
                color: #1976d2;
            }

            .language-switcher.buttons {
                display: flex;
                gap: 8px;
            }

            .language-switcher.buttons .lang-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
            }

            .language-switcher.buttons .lang-btn:hover {
                border-color: #007bff;
            }

            .language-switcher.buttons .lang-btn.active {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }

            .language-switcher .flag {
                font-size: 16px;
            }

            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .language-switcher.dropdown .language-current,
                .language-switcher.dropdown .language-list,
                .language-switcher.buttons .lang-btn {
                    background: #2d2d2d;
                    border-color: #444;
                    color: #e0e0e0;
                }

                .language-switcher.dropdown .language-list li:hover {
                    background-color: #3d3d3d;
                }

                .language-switcher.dropdown .language-list li.active {
                    background-color: #1565c0;
                    color: white;
                }

                .language-switcher.buttons .lang-btn.active {
                    background: #1976d2;
                }
            }
        `;
    }
}

export default LanguageSwitcher;
