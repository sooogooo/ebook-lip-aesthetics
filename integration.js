/**
 * Integration.js - 绛唇解语花可视化系统集成脚本
 * 统一的跨组件通信和集成功能
 */

class VisualizationIntegration {
    constructor() {
        this.components = new Map();
        this.eventBus = new EventTarget();
        this.favorites = this.loadFavorites();
        this.settings = this.loadSettings();
        this.searchIndex = new Map();
        this.notifications = [];
        this.shortcuts = new Map();

        this.init();
    }

    /**
     * 初始化集成系统
     */
    async init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupNotificationSystem();
        this.setupThemeSystem();
        this.setupSearchSystem();
        this.setupFavoriteSystem();
        this.setupSettingsSystem();
        this.setupCommunicationBridge();
        this.setupAccessibility();
        this.setupPerformanceMonitoring();

        // 注册组件
        this.registerComponents();

        // 初始化PWA功能
        this.setupPWA();

        // 启动加载序列
        await this.startLoadingSequence();

        console.log('🎨 Visualization Integration System initialized');
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 页面加载完成
        document.addEventListener('DOMContentLoaded', () => {
            this.onDOMContentLoaded();
        });

        // 窗口大小变化
        window.addEventListener('resize', this.debounce(() => {
            this.onWindowResize();
        }, 250));

        // 滚动事件
        window.addEventListener('scroll', this.throttle(() => {
            this.onWindowScroll();
        }, 16));

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.onVisibilityChange();
        });

        // 网络状态变化
        window.addEventListener('online', () => this.onNetworkChange(true));
        window.addEventListener('offline', () => this.onNetworkChange(false));

        // 错误处理
        window.addEventListener('error', (e) => this.onGlobalError(e));
        window.addEventListener('unhandledrejection', (e) => this.onUnhandledRejection(e));
    }

    /**
     * 设置键盘快捷键
     */
    setupKeyboardShortcuts() {
        const shortcuts = {
            'KeyK': { ctrl: true, action: 'openSearch', description: '打开搜索' },
            'KeyD': { ctrl: true, action: 'toggleTheme', description: '切换主题' },
            'KeyF': { ctrl: true, action: 'toggleFavorites', description: '打开收藏夹' },
            'Comma': { ctrl: true, action: 'openSettings', description: '打开设置' },
            'Escape': { action: 'closeModals', description: '关闭模态框' },
            'F11': { action: 'toggleFullscreen', description: '切换全屏' },
            'F6': { action: 'cycleLandmarks', description: '循环浏览页面区域' },
            'Digit1': { alt: true, action: 'quickAccess1', description: '快速访问1' },
            'Digit2': { alt: true, action: 'quickAccess2', description: '快速访问2' },
            'Digit3': { alt: true, action: 'quickAccess3', description: '快速访问3' },
            'KeyH': { alt: true, action: 'showKeyboardHelp', description: '显示键盘快捷键帮助' },
            'KeyM': { ctrl: true, action: 'focusMainContent', description: '聚焦主要内容' },
            'KeyN': { ctrl: true, action: 'focusNavigation', description: '聚焦导航' },
            'KeyS': { ctrl: true, action: 'focusSearch', description: '聚焦搜索', preventDefault: true },
        };

        Object.entries(shortcuts).forEach(([key, config]) => {
            this.shortcuts.set(key, config);
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcut(e);
        });

        // Setup advanced keyboard navigation
        this.setupAdvancedKeyboardNavigation();
    }

    /**
     * 设置通知系统
     */
    setupNotificationSystem() {
        this.notificationContainer = document.getElementById('notification-container');
        if (!this.notificationContainer) {
            this.notificationContainer = document.createElement('div');
            this.notificationContainer.id = 'notification-container';
            this.notificationContainer.className = 'notification-container';
            this.notificationContainer.setAttribute('aria-live', 'polite');
            document.body.appendChild(this.notificationContainer);
        }
    }

    /**
     * 设置主题系统
     */
    setupThemeSystem() {
        this.themeToggle = document.getElementById('theme-toggle');

        // 加载保存的主题
        const savedTheme = this.settings.theme || 'light';
        this.setTheme(savedTheme);

        // 系统主题检测
        if (this.settings.autoTheme !== false) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (this.settings.autoTheme) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }

        // 主题切换按钮
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    /**
     * 设置搜索系统
     */
    setupSearchSystem() {
        this.searchInput = document.getElementById('global-search');
        this.searchResults = document.getElementById('search-results');
        this.searchResultsContent = document.getElementById('search-results-content');

        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));

            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeSearch();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateSearchResults('down');
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateSearchResults('up');
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.selectSearchResult();
                }
            });
        }

        // 构建搜索索引
        this.buildSearchIndex();
    }

    /**
     * 设置收藏夹系统
     */
    setupFavoriteSystem() {
        this.favoritesToggle = document.getElementById('favorites-toggle');
        this.favoritesPanel = document.getElementById('favorites-panel');
        this.favoritesContent = document.getElementById('favorites-content');
        this.favoritesCount = document.getElementById('favorites-count');

        if (this.favoritesToggle) {
            this.favoritesToggle.addEventListener('click', () => {
                this.toggleFavorites();
            });
        }

        // 设置收藏按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-btn')) {
                const toolId = e.target.closest('.favorite-btn').dataset.tool;
                this.toggleFavorite(toolId);
            }
        });

        this.updateFavoritesUI();
    }

    /**
     * 设置设置系统
     */
    setupSettingsSystem() {
        this.settingsToggle = document.getElementById('settings-toggle');
        this.settingsPanel = document.getElementById('settings-panel');

        if (this.settingsToggle) {
            this.settingsToggle.addEventListener('click', () => {
                this.toggleSettings();
            });
        }

        // 设置项监听
        this.setupSettingsListeners();
    }

    /**
     * 设置跨组件通信桥梁
     */
    setupCommunicationBridge() {
        // 消息通道
        this.messageChannel = new BroadcastChannel('visualization-system');

        this.messageChannel.addEventListener('message', (event) => {
            this.handleCrossComponentMessage(event.data);
        });

        // 存储更新监听
        window.addEventListener('storage', (e) => {
            this.handleStorageChange(e);
        });
    }

    /**
     * 设置无障碍功能
     */
    setupAccessibility() {
        // 焦点管理
        this.setupFocusManagement();

        // 键盘导航
        this.setupKeyboardNavigation();

        // 屏幕阅读器支持
        this.setupScreenReaderSupport();

        // 颜色对比度检查
        this.checkColorContrast();
    }

    /**
     * 设置性能监控
     */
    setupPerformanceMonitoring() {
        // 性能观察器
        if ('PerformanceObserver' in window) {
            this.performanceObserver = new PerformanceObserver((list) => {
                this.handlePerformanceEntries(list.getEntries());
            });

            this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
        }

        // 内存使用监控
        this.monitorMemoryUsage();
    }

    /**
     * 注册可视化组件
     */
    registerComponents() {
        const components = [
            { id: '3d-viewer', name: '3D解剖模型', url: '3d_viewer.html', category: '3d' },
            { id: 'ar-viewer', name: 'AR增强现实', url: 'ar_viewer.html', category: 'ar' },
            { id: 'vr-viewer', name: 'VR虚拟现实', url: 'vr_viewer.html', category: 'vr' },
            { id: 'gallery', name: '案例画廊', url: 'gallery.html', category: 'gallery' },
            { id: 'zoom-viewer', name: '缩放查看器', url: 'zoom_viewer.html', category: 'viewer' },
            { id: 'charts-library', name: '图表库', url: 'charts_library.html', category: 'charts' },
            { id: 'anatomy-illustrations', name: '解剖插图', url: 'anatomy_illustrations.html', category: 'anatomy' },
            { id: 'icons-system', name: '图标系统', url: 'icons.html', category: 'icons' },
            { id: 'medical-dashboard', name: '医疗看板', url: 'medical_dashboard.html', category: 'dashboard' },
            { id: 'case-studies', name: '案例分析', url: 'case_study_visualizer.html', category: 'analysis' }
        ];

        components.forEach(component => {
            this.components.set(component.id, component);
        });
    }

    /**
     * 设置PWA功能
     */
    setupPWA() {
        // 安装提示
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        // 应用安装后
        window.addEventListener('appinstalled', () => {
            this.showNotification('应用已成功安装！', 'success');
        });

        // 服务工作器更新
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                this.showNotification('应用已更新，请刷新页面', 'info');
            });
        }
    }

    /**
     * 启动加载序列
     */
    async startLoadingSequence() {
        const loadingScreen = document.getElementById('loading-screen');
        const progressBar = document.querySelector('.loader-progress-bar');

        if (!loadingScreen) return;

        const steps = [
            { name: '加载配置', duration: 300 },
            { name: '初始化组件', duration: 500 },
            { name: '构建索引', duration: 400 },
            { name: '准备界面', duration: 300 }
        ];

        let progress = 0;
        const totalSteps = steps.length;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];

            // 更新进度
            progress = ((i + 1) / totalSteps) * 100;
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }

            // 模拟加载步骤
            await new Promise(resolve => setTimeout(resolve, step.duration));
        }

        // 隐藏加载屏幕
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 200);
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboardShortcut(e) {
        const key = e.code;
        const shortcut = this.shortcuts.get(key);

        if (!shortcut) return;

        // 检查修饰键
        if (shortcut.ctrl && !e.ctrlKey) return;
        if (shortcut.alt && !e.altKey) return;
        if (shortcut.shift && !e.shiftKey) return;

        // 阻止默认行为（某些快捷键需要）
        if (shortcut.preventDefault || shortcut.action === 'focusSearch') {
            e.preventDefault();
        }

        this.executeAction(shortcut.action, e);

        // 宣布快捷键动作（为屏幕阅读器）
        this.announceToScreenReader(`执行了快捷键操作: ${shortcut.description}`);
    }

    /**
     * 设置高级键盘导航
     */
    setupAdvancedKeyboardNavigation() {
        // 等待DOM加载完成后再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeKeyboardNavigation();
            });
        } else {
            this.initializeKeyboardNavigation();
        }
    }

    initializeKeyboardNavigation() {
        this.keyboardNavigator = new AdvancedKeyboardNavigator();

        // 设置特殊的键盘导航处理
        this.setupGridNavigation();
        this.setupCardNavigation();
        this.setupModalNavigation();
        this.setupTabNavigation();

        // 为屏幕阅读器用户设置跳转链接
        this.createSkipLinks();

        // 设置焦点陷阱管理
        this.setupFocusTrapManagement();
    }

    /**
     * 设置网格导航（用于工具卡片）
     */
    setupGridNavigation() {
        const toolsGrid = document.getElementById('tools-grid');
        if (!toolsGrid) return;

        let gridNavigator;
        try {
            gridNavigator = new GridNavigator(toolsGrid, {
                selector: '.tool-card',
                columns: 'auto', // 自动检测列数
                wrap: true,
                announcePosition: true
            });
        } catch (error) {
            console.warn('Failed to initialize GridNavigator:', error);
            return;
        }

        toolsGrid.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                e.preventDefault();
                gridNavigator.handleNavigation(e.key);
            }
        });
    }

    /**
     * 设置卡片导航
     */
    setupCardNavigation() {
        document.addEventListener('keydown', (e) => {
            const focusedCard = e.target.closest('.tool-card');
            if (!focusedCard) return;

            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    this.activateCard(focusedCard);
                    break;
                case 'F':
                    e.preventDefault();
                    this.toggleCardFavorite(focusedCard);
                    break;
                case 'S':
                    e.preventDefault();
                    this.shareCard(focusedCard);
                    break;
            }
        });
    }

    /**
     * 设置模态框导航
     */
    setupModalNavigation() {
        // 延迟初始化以确保类已定义
        setTimeout(() => {
            this.modalFocusManager = new ModalFocusManager();

            // 监听模态框打开/关闭
            document.addEventListener('modal:opened', (e) => {
                this.modalFocusManager.trapFocus(e.detail.modal);
            });

            document.addEventListener('modal:closed', (e) => {
                this.modalFocusManager.releaseFocus();
            });
        }, 100);
    }

    /**
     * 设置标签页导航
     */
    setupTabNavigation() {
        // 延迟初始化以确保DOM完全加载
        setTimeout(() => {
            const tabLists = document.querySelectorAll('[role="tablist"]');

            tabLists.forEach(tabList => {
                try {
                    new TabNavigator(tabList);
                } catch (error) {
                    console.warn('Failed to initialize TabNavigator:', error);
                }
            });
        }, 100);
    }

    /**
     * 创建跳转链接
     */
    createSkipLinks() {
        if (document.querySelector('.skip-links')) return; // 已存在

        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">跳转到主要内容</a>
            <a href="#tools-grid" class="skip-link">跳转到工具网格</a>
            <a href="#global-search" class="skip-link">跳转到搜索</a>
            <a href="#navigation" class="skip-link">跳转到导航</a>
        `;

        document.body.insertBefore(skipLinks, document.body.firstChild);
    }

    /**
     * 设置焦点陷阱管理
     */
    setupFocusTrapManagement() {
        this.focusTraps = [];

        // 监听面板打开
        ['favorites-panel', 'settings-panel'].forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (!panel) return;

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (panel.classList.contains('active')) {
                            this.createFocusTrap(panel);
                        } else {
                            this.removeFocusTrap(panel);
                        }
                    }
                });
            });

            observer.observe(panel, { attributes: true });
        });
    }

    /**
     * 创建焦点陷阱
     */
    createFocusTrap(container) {
        if (window.AccessibilitySystem && window.AccessibilitySystem.FocusManager) {
            try {
                const trap = window.AccessibilitySystem.FocusManager.createTrap(container);
                this.focusTraps.push({ container, trap });
            } catch (error) {
                console.warn('Failed to create focus trap:', error);
                // Fallback: simple focus management
                this.createSimpleFocusTrap(container);
            }
        } else {
            // Fallback: simple focus management
            this.createSimpleFocusTrap(container);
        }
    }

    /**
     * 简单焦点陷阱实现
     */
    createSimpleFocusTrap(container) {
        const focusableElements = container.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );

        if (focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            const trap = {
                container,
                firstElement,
                lastElement,
                deactivate: () => {
                    container.removeEventListener('keydown', this.handleTrapKeydown);
                }
            };

            container.addEventListener('keydown', this.handleTrapKeydown.bind(this, trap));
            this.focusTraps.push({ container, trap });

            // Focus first element
            firstElement.focus();
        }
    }

    /**
     * 处理焦点陷阱键盘事件
     */
    handleTrapKeydown(trap, event) {
        if (event.key === 'Tab') {
            if (event.shiftKey) {
                if (document.activeElement === trap.firstElement) {
                    event.preventDefault();
                    trap.lastElement.focus();
                }
            } else {
                if (document.activeElement === trap.lastElement) {
                    event.preventDefault();
                    trap.firstElement.focus();
                }
            }
        }
    }

    /**
     * 移除焦点陷阱
     */
    removeFocusTrap(container) {
        const index = this.focusTraps.findIndex(item => item.container === container);
        if (index > -1) {
            this.focusTraps[index].trap.deactivate();
            this.focusTraps.splice(index, 1);
        }
    }

    /**
     * 执行操作
     */
    executeAction(action, event) {
        const actions = {
            openSearch: () => this.openSearch(),
            toggleTheme: () => this.toggleTheme(),
            toggleFavorites: () => this.toggleFavorites(),
            openSettings: () => this.toggleSettings(),
            closeModals: () => this.closeAllModals(),
            toggleFullscreen: () => this.toggleFullscreen(),
            cycleLandmarks: () => this.cycleLandmarks(),
            quickAccess1: () => this.openComponent('3d-viewer'),
            quickAccess2: () => this.openComponent('gallery'),
            quickAccess3: () => this.openComponent('charts-library'),
            showKeyboardHelp: () => this.showKeyboardHelp(),
            focusMainContent: () => this.focusMainContent(),
            focusNavigation: () => this.focusNavigation(),
            focusSearch: () => this.focusSearch()
        };

        if (actions[action]) {
            actions[action]();
        }
    }

    /**
     * 显示键盘快捷键帮助
     */
    showKeyboardHelp() {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            this.openModal('help-modal');
            return;
        }

        // 创建键盘帮助模态框
        this.createKeyboardHelpModal();
    }

    /**
     * 创建键盘帮助模态框
     */
    createKeyboardHelpModal() {
        const modal = document.createElement('div');
        modal.id = 'keyboard-help-modal';
        modal.className = 'modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'keyboard-help-title');

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="keyboard-help-title">键盘快捷键</h2>
                    <button class="modal-close" aria-label="关闭帮助">×</button>
                </div>
                <div class="modal-body">
                    <div class="shortcut-categories">
                        <div class="shortcut-category">
                            <h3>导航快捷键</h3>
                            <dl class="shortcut-list">
                                <dt><kbd>Ctrl</kbd> + <kbd>M</kbd></dt>
                                <dd>跳转到主要内容</dd>
                                <dt><kbd>Ctrl</kbd> + <kbd>N</kbd></dt>
                                <dd>跳转到导航</dd>
                                <dt><kbd>Ctrl</kbd> + <kbd>S</kbd></dt>
                                <dd>跳转到搜索</dd>
                                <dt><kbd>F6</kbd></dt>
                                <dd>循环浏览页面区域</dd>
                            </dl>
                        </div>
                        <div class="shortcut-category">
                            <h3>功能快捷键</h3>
                            <dl class="shortcut-list">
                                <dt><kbd>Ctrl</kbd> + <kbd>K</kbd></dt>
                                <dd>打开搜索</dd>
                                <dt><kbd>Ctrl</kbd> + <kbd>D</kbd></dt>
                                <dd>切换主题</dd>
                                <dt><kbd>Ctrl</kbd> + <kbd>F</kbd></dt>
                                <dd>打开收藏夹</dd>
                                <dt><kbd>Ctrl</kbd> + <kbd>,</kbd></dt>
                                <dd>打开设置</dd>
                            </dl>
                        </div>
                        <div class="shortcut-category">
                            <h3>网格导航</h3>
                            <dl class="shortcut-list">
                                <dt><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></dt>
                                <dd>在工具卡片间导航</dd>
                                <dt><kbd>Enter</kbd> / <kbd>Space</kbd></dt>
                                <dd>激活选中的工具</dd>
                                <dt><kbd>F</kbd></dt>
                                <dd>收藏/取消收藏工具</dd>
                                <dt><kbd>S</kbd></dt>
                                <dd>分享工具</dd>
                            </dl>
                        </div>
                        <div class="shortcut-category">
                            <h3>通用快捷键</h3>
                            <dl class="shortcut-list">
                                <dt><kbd>Escape</kbd></dt>
                                <dd>关闭模态框或面板</dd>
                                <dt><kbd>F11</kbd></dt>
                                <dd>切换全屏模式</dd>
                                <dt><kbd>Alt</kbd> + <kbd>H</kbd></dt>
                                <dd>显示此帮助</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 设置事件监听
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal(modal);
        });

        // 显示模态框
        this.openModal('keyboard-help-modal');
    }

    /**
     * 循环浏览页面主要区域
     */
    cycleLandmarks() {
        const landmarks = [
            { selector: 'header, [role="banner"]', name: '页面头部' },
            { selector: 'nav, [role="navigation"]', name: '导航区域' },
            { selector: 'main, [role="main"]', name: '主要内容' },
            { selector: '.tools-section', name: '工具区域' },
            { selector: 'footer, [role="contentinfo"]', name: '页面底部' }
        ];

        if (!this.currentLandmarkIndex) {
            this.currentLandmarkIndex = 0;
        }

        const landmark = landmarks[this.currentLandmarkIndex];
        const element = document.querySelector(landmark.selector);

        if (element) {
            // 确保元素可聚焦
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '-1');
            }

            element.focus();

            // 宣布当前区域
            this.announceToScreenReader(`聚焦到 ${landmark.name}`, 'assertive');
        }

        // 循环到下一个区域
        this.currentLandmarkIndex = (this.currentLandmarkIndex + 1) % landmarks.length;
    }

    /**
     * 聚焦主要内容
     */
    focusMainContent() {
        const main = document.querySelector('main, #main-content, [role="main"]');
        if (main) {
            if (!main.hasAttribute('tabindex')) {
                main.setAttribute('tabindex', '-1');
            }
            main.focus();

            this.announceToScreenReader('聚焦到主要内容');
        }
    }

    /**
     * 聚焦导航
     */
    focusNavigation() {
        const nav = document.querySelector('nav, [role="navigation"]');
        if (nav) {
            const focusable = nav.querySelector('a, button, [tabindex="0"]');
            if (focusable) {
                focusable.focus();
            } else {
                if (!nav.hasAttribute('tabindex')) {
                    nav.setAttribute('tabindex', '-1');
                }
                nav.focus();
            }

            this.announceToScreenReader('聚焦到导航区域');
        }
    }

    /**
     * 聚焦搜索
     */
    focusSearch() {
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.focus();

            this.announceToScreenReader('聚焦到搜索框');
        }
    }

    /**
     * 激活卡片
     */
    activateCard(card) {
        const link = card.querySelector('a[href]');
        if (link) {
            link.click();

            const title = card.querySelector('.tool-title')?.textContent || '工具';
            this.announceToScreenReader(`打开了 ${title}`);
        }
    }

    /**
     * 切换卡片收藏状态
     */
    toggleCardFavorite(card) {
        const favoriteBtn = card.querySelector('.favorite-btn');
        if (favoriteBtn) {
            favoriteBtn.click();

            const toolId = favoriteBtn.dataset.tool;
            const isFavorited = this.favorites.has(toolId);
            const title = card.querySelector('.tool-title')?.textContent || '工具';

            const message = isFavorited ? `已将 ${title} 添加到收藏夹` : `已将 ${title} 从收藏夹移除`;
            this.announceToScreenReader(message);
        }
    }

    /**
     * 分享卡片
     */
    shareCard(card) {
        const shareBtn = card.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.click();

            const title = card.querySelector('.tool-title')?.textContent || '工具';
            this.announceToScreenReader(`正在分享 ${title}`);
        }
    }

    /**
     * 主题切换
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * 设置主题
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.settings.theme = theme;
        this.saveSettings();

        // 更新主题按钮状态
        if (this.themeToggle) {
            this.themeToggle.setAttribute('aria-pressed', theme === 'dark');
        }

        // 广播主题变化
        this.broadcast('theme-changed', { theme });
    }

    /**
     * 搜索处理
     */
    async handleSearch(query) {
        if (query.length < 2) {
            this.hideSearchResults();
            return;
        }

        const results = this.searchInIndex(query);
        this.displaySearchResults(results, query);
    }

    /**
     * 在索引中搜索
     */
    searchInIndex(query) {
        const results = [];
        const normalizedQuery = query.toLowerCase();

        this.searchIndex.forEach((item, id) => {
            const score = this.calculateSearchScore(item, normalizedQuery);
            if (score > 0) {
                results.push({ ...item, score, id });
            }
        });

        return results.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    /**
     * 计算搜索分数
     */
    calculateSearchScore(item, query) {
        let score = 0;

        // 标题匹配
        if (item.title.toLowerCase().includes(query)) {
            score += 10;
        }

        // 描述匹配
        if (item.description.toLowerCase().includes(query)) {
            score += 5;
        }

        // 标签匹配
        item.tags.forEach(tag => {
            if (tag.toLowerCase().includes(query)) {
                score += 3;
            }
        });

        return score;
    }

    /**
     * 显示搜索结果
     */
    displaySearchResults(results, query) {
        if (!this.searchResults || !this.searchResultsContent) return;

        this.searchResultsContent.innerHTML = '';

        if (results.length === 0) {
            this.searchResultsContent.innerHTML = `
                <div class="search-no-results">
                    <p>未找到包含 "${query}" 的内容</p>
                </div>
            `;
        } else {
            results.forEach((result, index) => {
                const resultElement = this.createSearchResultElement(result, index);
                this.searchResultsContent.appendChild(resultElement);
            });
        }

        this.showSearchResults();
    }

    /**
     * 创建搜索结果元素
     */
    createSearchResultElement(result, index) {
        const element = document.createElement('div');
        element.className = 'search-result-item';
        element.dataset.index = index;
        element.innerHTML = `
            <div class="search-result-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </div>
            <div class="search-result-content">
                <h4>${result.title}</h4>
                <p>${result.description}</p>
                <div class="search-result-tags">
                    ${result.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;

        element.addEventListener('click', () => {
            this.openComponent(result.id);
            this.hideSearchResults();
        });

        return element;
    }

    /**
     * 收藏夹切换
     */
    toggleFavorites() {
        if (this.favoritesPanel) {
            const isActive = this.favoritesPanel.classList.contains('active');
            this.favoritesPanel.classList.toggle('active');
            this.favoritesPanel.setAttribute('aria-hidden', isActive);

            if (this.favoritesToggle) {
                this.favoritesToggle.setAttribute('aria-expanded', !isActive);
            }
        }
    }

    /**
     * 切换收藏状态
     */
    toggleFavorite(toolId) {
        if (this.favorites.has(toolId)) {
            this.favorites.delete(toolId);
            this.showNotification('已从收藏夹移除', 'info');
        } else {
            this.favorites.add(toolId);
            this.showNotification('已添加到收藏夹', 'success');
        }

        this.saveFavorites();
        this.updateFavoritesUI();
        this.broadcast('favorites-changed', { toolId, favorited: this.favorites.has(toolId) });
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" aria-label="关闭">×</button>
            </div>
        `;

        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });

        this.notificationContainer.appendChild(notification);

        // 显示动画
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // 自动移除
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        this.notifications.push(notification);
    }

    /**
     * 移除通知
     */
    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);

        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }
    }

    /**
     * 打开组件
     */
    openComponent(componentId) {
        const component = this.components.get(componentId);
        if (component) {
            window.open(component.url, '_blank');
            this.trackUsage(componentId);
        }
    }

    /**
     * 构建搜索索引
     */
    buildSearchIndex() {
        this.components.forEach((component, id) => {
            this.searchIndex.set(id, {
                title: component.name,
                description: this.getComponentDescription(id),
                tags: this.getComponentTags(id),
                category: component.category,
                url: component.url
            });
        });
    }

    /**
     * 获取组件描述
     */
    getComponentDescription(id) {
        const descriptions = {
            '3d-viewer': '交互式三维唇部解剖模型，支持多层展示和详细标注',
            'ar-viewer': '增强现实预览功能，实时查看治疗效果',
            'vr-viewer': '虚拟现实培训环境，沉浸式学习体验',
            'gallery': '专业医美案例展示画廊，支持前后对比',
            'zoom-viewer': '高精度图像缩放查看器，支持测量工具',
            'charts-library': '专业医疗数据可视化图表库',
            'anatomy-illustrations': '专业解剖结构插图和教学资料',
            'icons-system': '医美专用图标系统和设计组件',
            'medical-dashboard': '实时医疗数据分析看板',
            'case-studies': '深度案例研究和可视化分析'
        };

        return descriptions[id] || '';
    }

    /**
     * 获取组件标签
     */
    getComponentTags(id) {
        const tags = {
            '3d-viewer': ['3D', '解剖', '模型', '交互'],
            'ar-viewer': ['AR', '增强现实', '预览', '实时'],
            'vr-viewer': ['VR', '虚拟现实', '培训', '沉浸式'],
            'gallery': ['案例', '画廊', '对比', '展示'],
            'zoom-viewer': ['缩放', '查看器', '测量', '细节'],
            'charts-library': ['图表', '数据', '可视化', '统计'],
            'anatomy-illustrations': ['解剖', '插图', '教学', '标注'],
            'icons-system': ['图标', '设计', '符号', '系统'],
            'medical-dashboard': ['看板', '数据', '分析', '实时'],
            'case-studies': ['案例', '研究', '分析', '可视化']
        };

        return tags[id] || [];
    }

    /**
     * 跨组件消息广播
     */
    broadcast(type, data) {
        const message = { type, data, timestamp: Date.now() };
        this.messageChannel.postMessage(message);
        this.eventBus.dispatchEvent(new CustomEvent(type, { detail: data }));
    }

    /**
     * 数据持久化
     */
    saveFavorites() {
        try {
            localStorage.setItem('visualization-favorites', JSON.stringify([...this.favorites]));
        } catch (error) {
            console.warn('Failed to save favorites:', error);
        }
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('visualization-favorites');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch (error) {
            console.warn('Failed to load favorites:', error);
            return new Set();
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('visualization-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('visualization-settings');
            return saved ? JSON.parse(saved) : this.getDefaultSettings();
        } catch (error) {
            console.warn('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            theme: 'light',
            autoTheme: true,
            animations: true,
            highContrast: false,
            fontSize: 'medium',
            screenReader: false,
            keyboardNav: false,
            reduceMotion: false,
            quality: 'medium',
            preload: true
        };
    }

    /**
     * 更新收藏夹UI
     */
    updateFavoritesUI() {
        // 更新计数
        if (this.favoritesCount) {
            this.favoritesCount.textContent = this.favorites.size;
        }

        // 更新收藏按钮状态
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const toolId = btn.dataset.tool;
            btn.classList.toggle('active', this.favorites.has(toolId));
        });
    }

    /**
     * 工具函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 事件处理器
     */
    onDOMContentLoaded() {
        // 初始化统计动画
        this.animateStats();

        // 设置工具卡片交互
        this.setupToolCards();

        // 初始化模态框
        this.setupModals();
    }

    onWindowResize() {
        // 响应式布局调整
        this.adjustLayout();
    }

    onWindowScroll() {
        // 滚动效果
        this.updateScrollIndicators();
    }

    onVisibilityChange() {
        if (document.hidden) {
            this.pauseAnimations();
        } else {
            this.resumeAnimations();
        }
    }

    onNetworkChange(isOnline) {
        const message = isOnline ? '网络连接已恢复' : '网络连接已断开';
        const type = isOnline ? 'success' : 'warning';
        this.showNotification(message, type);
    }

    onGlobalError(error) {
        console.error('Global error:', error);
        this.showNotification('系统发生错误，请刷新页面重试', 'error');
    }

    onUnhandledRejection(error) {
        console.error('Unhandled promise rejection:', error);
    }

    /**
     * 其他辅助方法
     */
    animateStats() {
        document.querySelectorAll('[data-animate-to]').forEach(element => {
            const targetValue = parseInt(element.dataset.animateTo);
            this.animateNumber(element, 0, targetValue, 2000);
        });
    }

    animateNumber(element, start, end, duration) {
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentValue = Math.floor(start + (end - start) * this.easeOutQuart(progress));
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    }

    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    setupToolCards() {
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.favorite-btn') || e.target.closest('.share-btn')) {
                    return;
                }

                const link = card.querySelector('a[href]');
                if (link) {
                    window.open(link.href, '_blank');
                }
            });
        });
    }

    setupModals() {
        // 模态框事件监听
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-modal]')) {
                this.openModal(e.target.dataset.modal);
            }

            if (e.target.matches('.modal-close') || e.target.closest('.modal-close')) {
                this.closeModal(e.target.closest('.modal'));
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            // 焦点管理
            const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal[aria-hidden="false"]').forEach(modal => {
            this.closeModal(modal);
        });

        // 关闭面板
        this.favoritesPanel?.classList.remove('active');
        this.settingsPanel?.classList.remove('active');

        // 关闭搜索结果
        this.hideSearchResults();
    }

    showSearchResults() {
        if (this.searchResults) {
            this.searchResults.setAttribute('aria-hidden', 'false');
        }
    }

    hideSearchResults() {
        if (this.searchResults) {
            this.searchResults.setAttribute('aria-hidden', 'true');
        }
    }

    openSearch() {
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }

    toggleSettings() {
        if (this.settingsPanel) {
            this.settingsPanel.classList.toggle('active');
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                this.showNotification('无法进入全屏模式', 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }

    setupSettingsListeners() {
        // 设置项变化监听
        document.addEventListener('change', (e) => {
            if (e.target.matches('#animation-toggle')) {
                this.settings.animations = e.target.checked;
                this.saveSettings();
                document.documentElement.style.setProperty('--animation-state', e.target.checked ? 'running' : 'paused');
            }

            if (e.target.matches('#high-contrast-toggle')) {
                this.settings.highContrast = e.target.checked;
                this.saveSettings();
                document.documentElement.setAttribute('data-contrast', e.target.checked ? 'high' : 'normal');
            }

            // 其他设置项...
        });
    }

    trackUsage(componentId) {
        // 使用统计
        const usage = JSON.parse(localStorage.getItem('component-usage') || '{}');
        usage[componentId] = (usage[componentId] || 0) + 1;
        localStorage.setItem('component-usage', JSON.stringify(usage));
    }

    // 性能监控相关方法
    setupFocusManagement() {
        // 实现焦点管理逻辑
    }

    setupKeyboardNavigation() {
        // 实现键盘导航逻辑
    }

    setupScreenReaderSupport() {
        // 实现屏幕阅读器支持
    }

    checkColorContrast() {
        // 检查颜色对比度
    }

    handlePerformanceEntries(entries) {
        // 处理性能条目
        entries.forEach(entry => {
            if (entry.entryType === 'navigation') {
                console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart);
            }
        });
    }

    monitorMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.warn('High memory usage detected');
                }
            }, 30000);
        }
    }

    adjustLayout() {
        // 响应式布局调整逻辑
    }

    updateScrollIndicators() {
        // 滚动指示器更新逻辑
    }

    pauseAnimations() {
        document.documentElement.style.setProperty('--animation-play-state', 'paused');
    }

    resumeAnimations() {
        document.documentElement.style.setProperty('--animation-play-state', 'running');
    }

    showInstallPrompt() {
        // PWA安装提示
        if (this.deferredPrompt) {
            this.showNotification('可以将此应用安装到设备上', 'info');
        }
    }

    handleCrossComponentMessage(message) {
        // 处理跨组件消息
        console.log('Received message:', message);
    }

    handleStorageChange(event) {
        // 处理存储变化
        if (event.key === 'visualization-favorites') {
            this.favorites = new Set(JSON.parse(event.newValue || '[]'));
            this.updateFavoritesUI();
        }
    }

    selectSearchResult() {
        const selected = document.querySelector('.search-result-item.selected');
        if (selected) {
            selected.click();
        }
    }

    /**
     * 向屏幕阅读器发送消息
     */
    announceToScreenReader(message, priority = 'polite') {
        if (window.AccessibilitySystem && window.AccessibilitySystem.AccessibilityManager) {
            try {
                window.AccessibilitySystem.AccessibilityManager.announce(message, priority);
                return;
            } catch (error) {
                console.warn('Failed to use AccessibilitySystem:', error);
            }
        }

        // Fallback: create live region for announcements
        this.createLiveRegionAnnouncement(message, priority);
    }

    /**
     * 创建实时区域进行屏幕阅读器通知
     */
    createLiveRegionAnnouncement(message, priority = 'polite') {
        let liveRegion = document.getElementById('sr-live-region');

        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'sr-live-region';
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }

        // Clear previous message
        liveRegion.textContent = '';

        // Set new message after a brief delay to ensure screen readers pick it up
        setTimeout(() => {
            liveRegion.textContent = message;
        }, 100);
    }

    navigateSearchResults(direction) {
        const results = document.querySelectorAll('.search-result-item');
        let currentIndex = -1;

        results.forEach((result, index) => {
            if (result.classList.contains('selected')) {
                currentIndex = index;
            }
            result.classList.remove('selected');
        });

        if (direction === 'down') {
            currentIndex = (currentIndex + 1) % results.length;
        } else if (direction === 'up') {
            currentIndex = currentIndex <= 0 ? results.length - 1 : currentIndex - 1;
        }

        if (results[currentIndex]) {
            results[currentIndex].classList.add('selected');
        }
    }
}

/**
 * Advanced Keyboard Navigator - Enhanced navigation system
 */
class AdvancedKeyboardNavigator {
    constructor() {
        this.shortcuts = new Map();
        this.contexts = new Map();
        this.currentContext = 'global';
        this.enabled = true;
    }

    registerShortcut(combination, handler, context = 'global', description = '') {
        if (!this.contexts.has(context)) {
            this.contexts.set(context, new Map());
        }

        this.contexts.get(context).set(combination.toLowerCase(), {
            handler,
            description,
            combination
        });
    }

    setContext(context) {
        this.currentContext = context;
    }

    handleKeyDown(event) {
        if (!this.enabled) return;

        const combination = this.getKeyCombination(event);
        const contextShortcuts = this.contexts.get(this.currentContext);

        if (contextShortcuts && contextShortcuts.has(combination)) {
            const shortcut = contextShortcuts.get(combination);
            event.preventDefault();
            shortcut.handler(event);
        }
    }

    getKeyCombination(event) {
        const parts = [];

        if (event.ctrlKey) parts.push('ctrl');
        if (event.altKey) parts.push('alt');
        if (event.shiftKey) parts.push('shift');
        if (event.metaKey) parts.push('meta');

        parts.push(event.key.toLowerCase());
        return parts.join('+');
    }
}

/**
 * Grid Navigator - 2D grid keyboard navigation
 */
class GridNavigator {
    constructor(container, options = {}) {
        this.container = container;
        this.selector = options.selector || '.grid-item';
        this.columns = options.columns || 'auto';
        this.wrap = options.wrap !== false;
        this.announcePosition = options.announcePosition !== false;

        this.currentIndex = 0;
        this.items = [];

        this.updateItems();
        this.setupInitialFocus();
    }

    updateItems() {
        this.items = Array.from(this.container.querySelectorAll(this.selector));

        // Auto-detect columns if needed
        if (this.columns === 'auto') {
            this.detectColumns();
        }

        // Set tab indices
        this.items.forEach((item, index) => {
            item.setAttribute('tabindex', index === this.currentIndex ? '0' : '-1');
        });
    }

    detectColumns() {
        if (this.items.length === 0) return;

        const containerWidth = this.container.getBoundingClientRect().width;
        const itemWidth = this.items[0].getBoundingClientRect().width;
        const gap = this.getGridGap();

        this.columns = Math.floor((containerWidth + gap) / (itemWidth + gap));
    }

    getGridGap() {
        const styles = window.getComputedStyle(this.container);
        const gap = styles.gap || styles.gridGap || '0px';
        return parseInt(gap) || 0;
    }

    setupInitialFocus() {
        if (this.items.length > 0) {
            this.items[0].setAttribute('tabindex', '0');
        }
    }

    handleNavigation(key) {
        const previousIndex = this.currentIndex;

        switch (key) {
            case 'ArrowRight':
                this.moveRight();
                break;
            case 'ArrowLeft':
                this.moveLeft();
                break;
            case 'ArrowDown':
                this.moveDown();
                break;
            case 'ArrowUp':
                this.moveUp();
                break;
            case 'Home':
                this.moveToFirst();
                break;
            case 'End':
                this.moveToLast();
                break;
        }

        if (previousIndex !== this.currentIndex) {
            this.updateFocus();
            this.announcePosition();
        }
    }

    moveRight() {
        const nextIndex = this.currentIndex + 1;
        if (nextIndex < this.items.length) {
            this.currentIndex = nextIndex;
        } else if (this.wrap) {
            this.currentIndex = 0;
        }
    }

    moveLeft() {
        const nextIndex = this.currentIndex - 1;
        if (nextIndex >= 0) {
            this.currentIndex = nextIndex;
        } else if (this.wrap) {
            this.currentIndex = this.items.length - 1;
        }
    }

    moveDown() {
        const nextIndex = this.currentIndex + this.columns;
        if (nextIndex < this.items.length) {
            this.currentIndex = nextIndex;
        } else if (this.wrap) {
            // Wrap to same column in first row
            const column = this.currentIndex % this.columns;
            this.currentIndex = column;
        }
    }

    moveUp() {
        const nextIndex = this.currentIndex - this.columns;
        if (nextIndex >= 0) {
            this.currentIndex = nextIndex;
        } else if (this.wrap) {
            // Wrap to same column in last row
            const column = this.currentIndex % this.columns;
            const lastRowStart = Math.floor((this.items.length - 1) / this.columns) * this.columns;
            this.currentIndex = Math.min(lastRowStart + column, this.items.length - 1);
        }
    }

    moveToFirst() {
        this.currentIndex = 0;
    }

    moveToLast() {
        this.currentIndex = this.items.length - 1;
    }

    updateFocus() {
        // Remove previous focus
        this.items.forEach(item => {
            item.setAttribute('tabindex', '-1');
        });

        // Set new focus
        if (this.items[this.currentIndex]) {
            this.items[this.currentIndex].setAttribute('tabindex', '0');
            this.items[this.currentIndex].focus();
        }
    }

    announcePosition() {
        if (!this.announcePosition) return;

        const item = this.items[this.currentIndex];
        if (item) {
            const row = Math.floor(this.currentIndex / this.columns) + 1;
            const column = (this.currentIndex % this.columns) + 1;
            const total = this.items.length;

            const title = item.querySelector('.tool-title')?.textContent || `项目 ${this.currentIndex + 1}`;
            const message = `${title}，第 ${row} 行，第 ${column} 列，共 ${total} 个项目`;

            // Use the main integration instance's announcement method
            if (window.visualizationIntegration) {
                window.visualizationIntegration.announceToScreenReader(message);
            }
        }
    }
}

/**
 * Modal Focus Manager - Advanced modal focus management
 */
class ModalFocusManager {
    constructor() {
        this.activeTraps = [];
        this.focusHistory = [];
    }

    trapFocus(modal) {
        // Save current focus
        this.focusHistory.push(document.activeElement);

        // Create focus trap
        const trap = new FocusTrap(modal);
        this.activeTraps.push(trap);
        trap.activate();

        return trap;
    }

    releaseFocus() {
        // Deactivate latest trap
        if (this.activeTraps.length > 0) {
            const trap = this.activeTraps.pop();
            trap.deactivate();
        }

        // Restore previous focus
        if (this.focusHistory.length > 0) {
            const previousFocus = this.focusHistory.pop();
            if (previousFocus && previousFocus.focus) {
                previousFocus.focus();
            }
        }
    }

    releaseAllTraps() {
        this.activeTraps.forEach(trap => trap.deactivate());
        this.activeTraps = [];
        this.focusHistory = [];
    }
}

/**
 * Tab Navigator - ARIA tabs navigation
 */
class TabNavigator {
    constructor(tabList) {
        this.tabList = tabList;
        this.tabs = tabList.querySelectorAll('[role="tab"]');
        this.panels = [];

        this.setupTabs();
        this.bindEvents();
    }

    setupTabs() {
        this.tabs.forEach((tab, index) => {
            // Set tab attributes
            tab.setAttribute('tabindex', index === 0 ? '0' : '-1');

            // Find associated panel
            const panelId = tab.getAttribute('aria-controls');
            if (panelId) {
                const panel = document.getElementById(panelId);
                if (panel) {
                    this.panels.push(panel);
                    panel.setAttribute('tabindex', '0');
                }
            }
        });
    }

    bindEvents() {
        this.tabList.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.activateTab(tab);
            });
        });
    }

    handleKeyDown(event) {
        let targetTab = null;

        switch (event.key) {
            case 'ArrowLeft':
                targetTab = this.getPreviousTab();
                break;
            case 'ArrowRight':
                targetTab = this.getNextTab();
                break;
            case 'Home':
                targetTab = this.tabs[0];
                break;
            case 'End':
                targetTab = this.tabs[this.tabs.length - 1];
                break;
            default:
                return;
        }

        if (targetTab) {
            event.preventDefault();
            this.focusTab(targetTab);
        }
    }

    activateTab(tab) {
        // Deactivate all tabs
        this.tabs.forEach(t => {
            t.setAttribute('aria-selected', 'false');
            t.setAttribute('tabindex', '-1');
        });

        // Hide all panels
        this.panels.forEach(panel => {
            panel.setAttribute('aria-hidden', 'true');
        });

        // Activate selected tab
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');

        // Show associated panel
        const panelId = tab.getAttribute('aria-controls');
        if (panelId) {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.setAttribute('aria-hidden', 'false');
            }
        }

        // Announce tab change
        if (window.visualizationIntegration) {
            const tabName = tab.textContent.trim();
            window.visualizationIntegration.announceToScreenReader(`选中了 ${tabName} 标签页`);
        }
    }

    focusTab(tab) {
        this.tabs.forEach(t => t.setAttribute('tabindex', '-1'));
        tab.setAttribute('tabindex', '0');
        tab.focus();
    }

    getCurrentTab() {
        return Array.from(this.tabs).find(tab => tab.getAttribute('aria-selected') === 'true') || this.tabs[0];
    }

    getNextTab() {
        const currentTab = this.getCurrentTab();
        const currentIndex = Array.from(this.tabs).indexOf(currentTab);
        return this.tabs[(currentIndex + 1) % this.tabs.length];
    }

    getPreviousTab() {
        const currentTab = this.getCurrentTab();
        const currentIndex = Array.from(this.tabs).indexOf(currentTab);
        return this.tabs[currentIndex - 1] || this.tabs[this.tabs.length - 1];
    }
}

/**
 * Simple Focus Trap Implementation
 */
class FocusTrap {
    constructor(element) {
        this.element = element;
        this.focusableElements = [];
        this.firstFocusableElement = null;
        this.lastFocusableElement = null;
        this.isActive = false;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.updateFocusableElements();
    }

    updateFocusableElements() {
        const focusableSelector = 'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])';
        this.focusableElements = Array.from(this.element.querySelectorAll(focusableSelector)).filter(el => {
            return !el.disabled && el.offsetParent !== null;
        });

        if (this.focusableElements.length > 0) {
            this.firstFocusableElement = this.focusableElements[0];
            this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
        }
    }

    activate() {
        if (this.isActive) return;

        this.isActive = true;
        this.element.addEventListener('keydown', this.handleKeyDown);

        if (this.firstFocusableElement) {
            this.firstFocusableElement.focus();
        }
    }

    deactivate() {
        if (!this.isActive) return;

        this.isActive = false;
        this.element.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown(event) {
        if (!this.isActive || event.key !== 'Tab') return;

        if (this.focusableElements.length === 0) {
            event.preventDefault();
            return;
        }

        if (event.shiftKey) {
            if (document.activeElement === this.firstFocusableElement) {
                event.preventDefault();
                this.lastFocusableElement.focus();
            }
        } else {
            if (document.activeElement === this.lastFocusableElement) {
                event.preventDefault();
                this.firstFocusableElement.focus();
            }
        }
    }
}

// 初始化集成系统
window.visualizationIntegration = new VisualizationIntegration();