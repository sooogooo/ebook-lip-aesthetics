/**
 * 绛唇解语花 - 专业唇部美学案例画廊系统
 * 高性能响应式图片画廊解决方案
 *
 * @author Claude Code
 * @version 1.0.0
 * @features
 * - 多种布局模式 (瀑布流/网格/列表/大图)
 * - 高级筛选和搜索
 * - 图片懒加载和优化
 * - 灯箱查看体验
 * - 响应式设计
 * - PWA支持
 */

class LipAestheticsGallery {
    constructor() {
        this.currentView = 'masonry';
        this.currentColumns = 3;
        this.currentSort = 'newest';
        this.currentFilters = this.getDefaultFilters();
        this.searchQuery = '';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.isLoading = false;
        this.hasMoreItems = true;
        this.selectedItems = new Set();
        this.favoriteItems = this.loadFavorites();
        this.searchHistory = this.loadSearchHistory();

        // Gallery data
        this.allItems = [];
        this.filteredItems = [];
        this.currentItems = [];

        // Lightbox state
        this.currentLightboxIndex = 0;
        this.lightboxItems = [];
        this.isLightboxOpen = false;
        this.lightboxZoom = 1;
        this.lightboxPanX = 0;
        this.lightboxPanY = 0;

        // Performance optimization
        this.intersectionObserver = null;
        this.resizeObserver = null;
        this.lazyLoadImages = new Map();

        this.init();
    }

    /**
     * 初始化画廊系统
     */
    async init() {
        try {
            this.setupEventListeners();
            this.setupIntersectionObserver();
            this.setupResizeObserver();
            this.initializeVirtualScrolling();

            await this.loadGalleryData();
            this.applyFiltersAndSearch();
            this.renderGallery();

            this.updateUI();
            this.setupKeyboardShortcuts();
            this.initializeServiceWorker();

            console.log('Gallery initialized successfully');
        } catch (error) {
            console.error('Failed to initialize gallery:', error);
            this.showError('系统初始化失败，请刷新页面重试');
        }
    }

    /**
     * 获取默认筛选条件
     */
    getDefaultFilters() {
        return {
            treatmentTypes: ['lip-enhancement', 'lip-reduction', 'lip-shape', 'lip-color', 'lip-tattoo', 'education', 'safety', 'technique', 'design'],
            medicalCategories: ['anatomy', 'injection', 'case-study', 'complication', 'procedure', 'aesthetic'],
            ageRanges: ['18-25', '26-35', '36-45', '46+', '教学用', '风险教育', '操作指南', '通用'],
            doctors: ['dr-wang', 'dr-li', 'dr-chen'],
            startDate: null,
            endDate: null,
            minRating: 1.0
        };
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // View mode toggles
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeViewMode(e.target.dataset.view));
        });

        // Column control
        const columnSlider = document.getElementById('columnSlider');
        columnSlider.addEventListener('input', (e) => this.changeColumns(parseInt(e.target.value)));

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        searchInput.addEventListener('input', this.debounce((e) => this.handleSearch(e.target.value), 300));
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSearch(e.target.value);
            }
        });
        searchBtn.addEventListener('click', () => this.handleSearch(searchInput.value));

        // Filter controls
        document.getElementById('filterToggle').addEventListener('click', () => this.toggleFilterSidebar());
        document.getElementById('filterClose').addEventListener('click', () => this.closeFilterSidebar());
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('resetFilters').addEventListener('click', () => this.resetFilters());

        // Toolbar controls
        document.getElementById('sortSelect').addEventListener('change', (e) => this.changeSorting(e.target.value));
        document.getElementById('selectAllBtn').addEventListener('click', () => this.toggleSelectAll());
        document.getElementById('batchDownloadBtn').addEventListener('click', () => this.batchDownload());
        document.getElementById('favoriteToggle').addEventListener('click', () => this.toggleFavoriteFilter());
        document.getElementById('loadMoreBtn').addEventListener('click', () => this.loadMore());

        // Rating slider
        const ratingSlider = document.getElementById('ratingSlider');
        ratingSlider.addEventListener('input', (e) => {
            document.getElementById('ratingValue').textContent = parseFloat(e.target.value).toFixed(1);
        });

        // Filter checkboxes
        document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateFilterPreview());
        });

        // Date inputs
        document.getElementById('startDate').addEventListener('change', () => this.updateFilterPreview());
        document.getElementById('endDate').addEventListener('change', () => this.updateFilterPreview());

        // Lightbox controls
        this.setupLightboxEventListeners();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Scroll to top
        document.getElementById('scrollToTop').addEventListener('click', () => this.scrollToTop());

        // Window resize
        window.addEventListener('resize', this.debounce(() => this.handleResize(), 150));

        // Scroll events
        window.addEventListener('scroll', this.throttle(() => this.handleScroll(), 16));

        // Share modal
        this.setupShareModal();

        // Touch events for mobile
        this.setupTouchEvents();
    }

    /**
     * 设置灯箱事件监听器
     */
    setupLightboxEventListeners() {
        const lightboxModal = document.getElementById('lightboxModal');
        const lightboxOverlay = document.getElementById('lightboxOverlay');
        const lightboxClose = document.getElementById('lightboxClose');
        const lightboxPrev = document.getElementById('lightboxPrev');
        const lightboxNext = document.getElementById('lightboxNext');
        const favoriteBtn = document.getElementById('favoriteBtn');
        const shareBtn = document.getElementById('shareBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const toggleCompareBtn = document.getElementById('toggleCompareBtn');

        // Close lightbox
        [lightboxOverlay, lightboxClose].forEach(element => {
            element.addEventListener('click', () => this.closeLightbox());
        });

        // Navigation
        lightboxPrev.addEventListener('click', () => this.navigateLightbox(-1));
        lightboxNext.addEventListener('click', () => this.navigateLightbox(1));

        // Actions
        favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        shareBtn.addEventListener('click', () => this.openShareModal());
        downloadBtn.addEventListener('click', () => this.downloadCurrentImage());
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        toggleCompareBtn.addEventListener('click', () => this.toggleCompareMode());

        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomImage(1.2));
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomImage(0.8));
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.resetZoom());

        // Mouse wheel zoom
        const imageWrapper = document.querySelector('.lightbox-image-wrapper');
        imageWrapper.addEventListener('wheel', (e) => this.handleWheelZoom(e));

        // Pan functionality
        let isPanning = false;
        let startX, startY;

        imageWrapper.addEventListener('mousedown', (e) => {
            if (this.lightboxZoom > 1) {
                isPanning = true;
                startX = e.clientX - this.lightboxPanX;
                startY = e.clientY - this.lightboxPanY;
                imageWrapper.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isPanning) {
                this.lightboxPanX = e.clientX - startX;
                this.lightboxPanY = e.clientY - startY;
                this.updateImageTransform();
            }
        });

        document.addEventListener('mouseup', () => {
            isPanning = false;
            imageWrapper.style.cursor = this.lightboxZoom > 1 ? 'grab' : 'default';
        });
    }

    /**
     * 设置分享模态框
     */
    setupShareModal() {
        const shareModal = document.getElementById('shareModal');
        const shareClose = shareModal.querySelector('.share-close');
        const shareOptions = shareModal.querySelectorAll('.share-option');
        const urlInput = shareModal.querySelector('.url-input');
        const copyBtn = shareModal.querySelector('.copy-btn');

        shareClose.addEventListener('click', () => this.closeShareModal());
        shareModal.querySelector('.share-overlay').addEventListener('click', () => this.closeShareModal());

        shareOptions.forEach(option => {
            option.addEventListener('click', (e) => this.handleShare(e.target.closest('.share-option').dataset.platform));
        });

        copyBtn.addEventListener('click', () => this.copyShareUrl());
    }

    /**
     * 设置触摸事件（移动端）
     */
    setupTouchEvents() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        });

        document.addEventListener('touchend', (e) => {
            if (!this.isLightboxOpen) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndTime = Date.now();

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = touchEndTime - touchStartTime;

            // Swipe detection
            if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100 && deltaTime < 300) {
                if (deltaX > 0) {
                    this.navigateLightbox(-1); // Swipe right - previous
                } else {
                    this.navigateLightbox(1); // Swipe left - next
                }
            }

            // Double tap to zoom
            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
                if (this.lastTapTime && (touchEndTime - this.lastTapTime) < 300) {
                    this.lightboxZoom = this.lightboxZoom === 1 ? 2 : 1;
                    this.lightboxPanX = 0;
                    this.lightboxPanY = 0;
                    this.updateImageTransform();
                }
                this.lastTapTime = touchEndTime;
            }
        });
    }

    /**
     * 设置Intersection Observer用于懒加载
     */
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadLazyImage(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, options);
    }

    /**
     * 设置Resize Observer用于响应式布局
     */
    setupResizeObserver() {
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(entries => {
                this.debounce(() => this.handleResize(), 100)();
            });

            this.resizeObserver.observe(document.getElementById('galleryGrid'));
        }
    }

    /**
     * 初始化虚拟滚动
     */
    initializeVirtualScrolling() {
        this.virtualScrollContainer = document.getElementById('galleryGrid');
        this.virtualScrollHeight = 0;
        this.visibleItems = [];
        this.itemHeights = new Map();
    }

    /**
     * 加载画廊数据
     */
    async loadGalleryData() {
        try {
            this.showLoading(true);

            // 模拟API调用 - 在实际项目中替换为真实API
            const data = await this.simulateAPICall();
            this.allItems = data.items;

            // 预处理图片信息
            this.preprocessImages();

            this.showLoading(false);
        } catch (error) {
            this.showLoading(false);
            throw error;
        }
    }

    /**
     * 模拟API调用 - 生成专业医学演示数据
     */
    async simulateAPICall() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const items = this.generateMedicalCaseData();
                resolve({ items, total: items.length });
            }, 500);
        });
    }

    /**
     * 生成专业医学案例数据
     */
    generateMedicalCaseData() {
        const medicalCases = [
            // 唇部解剖结构图系列
            {
                id: 1,
                title: "唇部解剖结构图 - 基础解剖",
                description: "详细展示唇部的基本解剖结构，包括上唇、下唇、唇红缘、唇峰等重要解剖标志点，为临床治疗提供解剖学基础。",
                beforeImage: "data:image/svg+xml;base64," + btoa(this.generateAnatomyDiagram()),
                afterImage: "data:image/svg+xml;base64," + btoa(this.generateAnatomyDiagram()),
                thumbnailBefore: "data:image/svg+xml;base64," + btoa(this.generateAnatomyDiagram()),
                thumbnailAfter: "data:image/svg+xml;base64," + btoa(this.generateAnatomyDiagram()),
                treatmentType: "anatomy",
                ageRange: "教学用",
                doctor: "dr-wang",
                doctorName: "王主任",
                date: "2024-01-15",
                rating: 5.0,
                views: 1250,
                surgeryDuration: "教学材料",
                recoveryTime: "无",
                tags: ["解剖学", "教学图谱", "基础医学", "唇部结构"],
                isFavorite: false,
                isSelected: false,
                category: "anatomy"
            },

            // 注射点位示意图系列
            {
                id: 2,
                title: "透明质酸注射点位图 - 标准方案",
                description: "展示透明质酸注射的标准点位分布，包括上唇峰、下唇中央、唇角等关键注射点，标注安全注射深度和剂量。",
                beforeImage: "data:image/svg+xml;base64," + btoa(this.generateInjectionDiagram()),
                afterImage: "data:image/svg+xml;base64," + btoa(this.generateInjectionDiagram()),
                thumbnailBefore: "data:image/svg+xml;base64," + btoa(this.generateInjectionDiagram()),
                thumbnailAfter: "data:image/svg+xml;base64," + btoa(this.generateInjectionDiagram()),
                treatmentType: "lip-enhancement",
                ageRange: "25-45",
                doctor: "dr-li",
                doctorName: "李医生",
                date: "2024-01-20",
                rating: 4.8,
                views: 980,
                surgeryDuration: "30-45分钟",
                recoveryTime: "3-5天",
                tags: ["注射技术", "透明质酸", "点位图", "技术指导"],
                isFavorite: false,
                isSelected: false,
                category: "injection"
            },

            // 治疗前后对比案例
            {
                id: 3,
                title: "唇部增强案例001 - 自然增厚",
                description: "25岁女性，唇部过薄，通过精准的透明质酸注射实现自然增厚效果。注射总量1.0ml，分布均匀，术后效果自然协调。",
                beforeImage: "data:image/svg+xml;base64," + btoa(this.generateBeforeAfterDiagram("before")),
                afterImage: "data:image/svg+xml;base64," + btoa(this.generateBeforeAfterDiagram("after")),
                thumbnailBefore: "data:image/svg+xml;base64=" + btoa(this.generateBeforeAfterDiagram("before")),
                thumbnailAfter: "data:image/svg+xml;base64=" + btoa(this.generateBeforeAfterDiagram("after")),
                treatmentType: "lip-enhancement",
                ageRange: "18-25",
                doctor: "dr-wang",
                doctorName: "王主任",
                date: "2024-01-10",
                rating: 4.9,
                views: 1500,
                surgeryDuration: "45分钟",
                recoveryTime: "5天",
                tags: ["自然增厚", "透明质酸", "年轻化", "精准注射"],
                isFavorite: false,
                isSelected: false,
                category: "case-study"
            },

            // 美学标准参考
            {
                id: 4,
                title: "黄金比例美学标准 - 唇部测量",
                description: "基于黄金比例理论的唇部美学标准，展示理想的唇部比例关系：上下唇比例1:1.6，唇宽与鼻宽的协调关系等。",
                beforeImage: "data:image/svg+xml;base64," + btoa(this.generateAestheticStandard()),
                afterImage: "data:image/svg+xml;base64," + btoa(this.generateAestheticStandard()),
                thumbnailBefore: "data:image/svg+xml;base64," + btoa(this.generateAestheticStandard()),
                thumbnailAfter: "data:image/svg+xml;base64," + btoa(this.generateAestheticStandard()),
                treatmentType: "aesthetic-standard",
                ageRange: "通用",
                doctor: "dr-chen",
                doctorName: "陈教授",
                date: "2024-01-05",
                rating: 5.0,
                views: 2100,
                surgeryDuration: "理论指导",
                recoveryTime: "无",
                tags: ["美学标准", "黄金比例", "测量方法", "设计原理"],
                isFavorite: false,
                isSelected: false,
                category: "aesthetic"
            },

            // 并发症案例
            {
                id: 5,
                title: "血管栓塞并发症 - 预防与处理",
                description: "展示血管栓塞这一严重并发症的临床表现、预防措施和紧急处理方案。包含血管分布图和安全注射技巧。",
                beforeImage: "data:image/svg+xml;base64," + btoa(this.generateComplicationDiagram()),
                afterImage: "data:image/svg+xml;base64," + btoa(this.generateComplicationDiagram()),
                thumbnailBefore: "data:image/svg+xml;base64," + btoa(this.generateComplicationDiagram()),
                thumbnailAfter: "data:image/svg+xml;base64," + btoa(this.generateComplicationDiagram()),
                treatmentType: "complication",
                ageRange: "风险教育",
                doctor: "dr-chen",
                doctorName: "陈教授",
                date: "2024-01-08",
                rating: 4.7,
                views: 890,
                surgeryDuration: "紧急处理",
                recoveryTime: "视情况而定",
                tags: ["并发症", "血管栓塞", "安全注射", "风险预防"],
                isFavorite: false,
                isSelected: false,
                category: "complication"
            },

            // 手术步骤图解
            {
                id: 6,
                title: "丰唇手术步骤图解 - 完整流程",
                description: "详细展示丰唇手术的完整操作流程：术前标记、麻醉、注射技巧、层次选择、剂量控制等关键步骤。",
                beforeImage: "data:image/svg+xml;base64," + btoa(this.generateProcedureDiagram()),
                afterImage: "data:image/svg+xml;base64," + btoa(this.generateProcedureDiagram()),
                thumbnailBefore: "data:image/svg+xml;base64," + btoa(this.generateProcedureDiagram()),
                thumbnailAfter: "data:image/svg+xml;base64," + btoa(this.generateProcedureDiagram()),
                treatmentType: "procedure",
                ageRange: "操作指南",
                doctor: "dr-li",
                doctorName: "李医生",
                date: "2024-01-12",
                rating: 4.8,
                views: 1100,
                surgeryDuration: "标准流程",
                recoveryTime: "标准恢复期",
                tags: ["手术步骤", "操作指南", "技术规范", "流程管理"],
                isFavorite: false,
                isSelected: false,
                category: "procedure"
            }
        ];

        // 扩展更多案例
        const additionalCases = this.generateAdditionalMedicalCases();
        return [...medicalCases, ...additionalCases];
    }

    /**
     * 生成附加医学案例
     */
    generateAdditionalMedicalCases() {
        const additionalCases = [];
        const baseId = 7;

        // 更多解剖和教学案例
        for (let i = 0; i < 20; i++) {
            const caseTypes = ['anatomy', 'injection', 'case-study', 'complication', 'procedure', 'aesthetic'];
            const caseType = caseTypes[i % caseTypes.length];

            additionalCases.push({
                id: baseId + i,
                title: this.generateCaseTitleByType(caseType, i + 1),
                description: this.generateCaseDescriptionByType(caseType, i + 1),
                beforeImage: "data:image/svg+xml;base64," + btoa(this.generateDiagramByType(caseType, i + 1, "before")),
                afterImage: "data:image/svg+xml;base64," + btoa(this.generateDiagramByType(caseType, i + 1, "after")),
                thumbnailBefore: "data:image/svg+xml;base64," + btoa(this.generateDiagramByType(caseType, i + 1, "before")),
                thumbnailAfter: "data:image/svg+xml;base64," + btoa(this.generateDiagramByType(caseType, i + 1, "after")),
                treatmentType: this.mapCategoryToTreatmentType(caseType),
                ageRange: this.getAgeRangeByType(caseType),
                doctor: ['dr-wang', 'dr-li', 'dr-chen'][i % 3],
                doctorName: ['王主任', '李医生', '陈教授'][i % 3],
                date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                rating: 4.0 + Math.random() * 1.0,
                views: Math.floor(Math.random() * 1500) + 200,
                surgeryDuration: this.getSurgeryDurationByType(caseType),
                recoveryTime: this.getRecoveryTimeByType(caseType),
                tags: this.getTagsByType(caseType),
                isFavorite: false,
                isSelected: false,
                category: caseType
            });
        }

        return additionalCases;
    }

    /**
     * 生成唇部解剖结构图SVG
     */
    generateAnatomyDiagram() {
        return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .lip-outline { fill: none; stroke: #E91E63; stroke-width: 2; }
                    .label-text { font-family: Arial, sans-serif; font-size: 12px; fill: #333; }
                    .annotation-line { stroke: #666; stroke-width: 1; stroke-dasharray: 2,2; }
                    .anatomical-point { fill: #E91E63; }
                </style>
            </defs>

            <!-- 背景 -->
            <rect width="400" height="300" fill="#f8f9fa"/>

            <!-- 上唇轮廓 -->
            <path d="M 100 120 Q 140 100 200 100 Q 260 100 300 120 L 280 140 Q 200 120 120 140 Z"
                  class="lip-outline" fill="#ffb3ba"/>

            <!-- 下唇轮廓 -->
            <path d="M 120 140 Q 200 180 280 140 L 300 160 Q 200 200 100 160 Z"
                  class="lip-outline" fill="#ffb3ba"/>

            <!-- 唇峰标注 -->
            <circle cx="160" cy="108" r="3" class="anatomical-point"/>
            <circle cx="240" cy="108" r="3" class="anatomical-point"/>
            <line x1="160" y1="108" x2="160" y2="80" class="annotation-line"/>
            <text x="130" y="75" class="label-text">唇峰 (Cupid's bow)</text>

            <!-- 人中 -->
            <line x1="200" y1="60" x2="200" y2="100" stroke="#666" stroke-width: 1"/>
            <text x="210" y="80" class="label-text">人中 (Philtrum)</text>

            <!-- 唇红缘 -->
            <line x1="120" y1="140" x2="280" y2="140" stroke="#E91E63" stroke-width="3"/>
            <text x="300" y="145" class="label-text">唇红缘</text>

            <!-- 唇角 -->
            <circle cx="120" cy="140" r="3" class="anatomical-point"/>
            <circle cx="280" cy="140" r="3" class="anatomical-point"/>
            <text x="80" y="130" class="label-text">唇角</text>
            <text x="290" y="130" class="label-text">唇角</text>

            <!-- 标题 -->
            <text x="200" y="30" text-anchor="middle" class="label-text" font-size="16" font-weight="bold">
                唇部基础解剖结构图
            </text>
        </svg>`;
    }

    /**
     * 生成注射点位图SVG
     */
    generateInjectionDiagram() {
        return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .lip-outline { fill: #ffb3ba; stroke: #E91E63; stroke-width: 2; }
                    .injection-point { fill: #F44336; stroke: white; stroke-width: 2; }
                    .label-text { font-family: Arial, sans-serif; font-size: 11px; fill: #333; }
                    .safety-zone { fill: rgba(76, 175, 80, 0.2); stroke: #4CAF50; stroke-width: 1; }
                    .danger-zone { fill: rgba(244, 67, 54, 0.2); stroke: #F44336; stroke-width: 1; }
                </style>
            </defs>

            <!-- 背景 -->
            <rect width="400" height="300" fill="#f8f9fa"/>

            <!-- 上唇 -->
            <path d="M 100 120 Q 140 100 200 100 Q 260 100 300 120 L 280 140 Q 200 120 120 140 Z"
                  class="lip-outline"/>

            <!-- 下唇 -->
            <path d="M 120 140 Q 200 180 280 140 L 300 160 Q 200 200 100 160 Z"
                  class="lip-outline"/>

            <!-- 安全注射区域 -->
            <ellipse cx="160" cy="130" rx="25" ry="15" class="safety-zone"/>
            <ellipse cx="240" cy="130" rx="25" ry="15" class="safety-zone"/>
            <ellipse cx="200" cy="170" rx="30" ry="15" class="safety-zone"/>

            <!-- 危险区域 (血管密集区) -->
            <ellipse cx="130" cy="140" rx="8" ry="12" class="danger-zone"/>
            <ellipse cx="270" cy="140" rx="8" ry="12" class="danger-zone"/>

            <!-- 注射点位 -->
            <circle cx="160" cy="125" r="4" class="injection-point"/>
            <text x="170" y="120" class="label-text">上唇峰 0.1ml</text>

            <circle cx="240" cy="125" r="4" class="injection-point"/>
            <text x="250" y="120" class="label-text">上唇峰 0.1ml</text>

            <circle cx="200" cy="170" r="4" class="injection-point"/>
            <text x="210" y="165" class="label-text">下唇中央 0.2ml</text>

            <circle cx="140" cy="130" r="4" class="injection-point"/>
            <text x="90" y="125" class="label-text">上唇外侧 0.1ml</text>

            <circle cx="260" cy="130" r="4" class="injection-point"/>
            <text x="270" y="125" class="label-text">上唇外侧 0.1ml</text>

            <circle cx="180" cy="185" r="4" class="injection-point"/>
            <text x="130" y="200" class="label-text">下唇侧 0.15ml</text>

            <circle cx="220" cy="185" r="4" class="injection-point"/>
            <text x="230" y="200" class="label-text">下唇侧 0.15ml</text>

            <!-- 图例 -->
            <rect x="20" y="220" width="15" height="10" class="safety-zone"/>
            <text x="40" y="230" class="label-text">安全注射区域</text>

            <rect x="20" y="240" width="15" height="10" class="danger-zone"/>
            <text x="40" y="250" class="label-text">血管密集区域</text>

            <circle cx="27" cy="265" r="3" class="injection-point"/>
            <text x="40" y="270" class="label-text">推荐注射点位</text>

            <!-- 标题 -->
            <text x="200" y="30" text-anchor="middle" class="label-text" font-size="16" font-weight="bold">
                透明质酸注射点位标准图
            </text>

            <!-- 总剂量标注 -->
            <text x="200" y="50" text-anchor="middle" class="label-text" font-size="12">
                建议总剂量: 0.8-1.2ml | 注射深度: 粘膜下层
            </text>
        </svg>`;
    }

    /**
     * 生成前后对比图SVG
     */
    generateBeforeAfterDiagram(type) {
        const isAfter = type === "after";
        const lipThickness = isAfter ? 1.3 : 1.0;
        const lipColor = isAfter ? "#ff9db4" : "#ffb3ba";

        return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .lip-outline { stroke: #E91E63; stroke-width: 2; }
                    .label-text { font-family: Arial, sans-serif; font-size: 12px; fill: #333; }
                    .comparison-label { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #E91E63; }
                </style>
            </defs>

            <!-- 背景 -->
            <rect width="400" height="300" fill="#f8f9fa"/>

            <!-- 面部轮廓简化 -->
            <ellipse cx="200" cy="150" rx="80" ry="100" fill="none" stroke="#ddd" stroke-width="1"/>

            <!-- 鼻子简化 -->
            <path d="M 190 100 Q 200 110 210 100" fill="none" stroke="#ddd" stroke-width="1"/>

            <!-- 上唇 (厚度根据before/after调整) -->
            <path d="M ${120/lipThickness} ${140-10*lipThickness} Q ${140/lipThickness} ${110-5*lipThickness} 200 ${110-5*lipThickness} Q ${260*lipThickness} ${110-5*lipThickness} ${280*lipThickness} ${140-10*lipThickness} L ${270*lipThickness} ${140+5*lipThickness} Q 200 ${125-2*lipThickness} ${130/lipThickness} ${140+5*lipThickness} Z"
                  class="lip-outline" fill="${lipColor}"/>

            <!-- 下唇 (厚度根据before/after调整) -->
            <path d="M ${130/lipThickness} ${140+5*lipThickness} Q 200 ${170+15*lipThickness} ${270*lipThickness} ${140+5*lipThickness} L ${280*lipThickness} ${155+10*lipThickness} Q 200 ${190+20*lipThickness} ${120/lipThickness} ${155+10*lipThickness} Z"
                  class="lip-outline" fill="${lipColor}"/>

            <!-- 状态标签 -->
            <text x="200" y="40" text-anchor="middle" class="comparison-label">
                ${isAfter ? '治疗后效果' : '治疗前状态'}
            </text>

            <!-- 测量线条 (仅在after图中显示) -->
            ${isAfter ? `
                <line x1="120" y1="260" x2="280" y2="260" stroke="#4CAF50" stroke-width="2"/>
                <text x="200" y="280" text-anchor="middle" class="label-text" fill="#4CAF50">
                    改善后唇部比例更加协调
                </text>
            ` : `
                <line x1="130" y1="260" x2="270" y2="260" stroke="#FF9800" stroke-width="2"/>
                <text x="200" y="280" text-anchor="middle" class="label-text" fill="#FF9800">
                    唇部较薄，比例不够饱满
                </text>
            `}

            <!-- 箭头指示改善区域 (仅在after图中) -->
            ${isAfter ? `
                <path d="M 160 180 L 160 160 M 156 164 L 160 160 L 164 164" stroke="#4CAF50" stroke-width="2" fill="none"/>
                <path d="M 240 180 L 240 160 M 236 164 L 240 160 L 244 164" stroke="#4CAF50" stroke-width="2" fill="none"/>
            ` : ''}

        </svg>`;
    }

    /**
     * 生成美学标准图SVG
     */
    generateAestheticStandard() {
        return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .golden-ratio { stroke: #FFD700; stroke-width: 2; fill: none; }
                    .measurement-line { stroke: #2196F3; stroke-width: 1; stroke-dasharray: 3,3; }
                    .lip-outline { fill: #ffb3ba; stroke: #E91E63; stroke-width: 2; }
                    .label-text { font-family: Arial, sans-serif; font-size: 11px; fill: #333; }
                    .ratio-text { font-family: Arial, sans-serif; font-size: 12px; fill: #FFD700; font-weight: bold; }
                </style>
            </defs>

            <!-- 背景 -->
            <rect width="400" height="300" fill="#f8f9fa"/>

            <!-- 面部框架 -->
            <ellipse cx="200" cy="150" rx="90" ry="110" fill="none" stroke="#ddd" stroke-width="1"/>

            <!-- 鼻宽参考线 -->
            <line x1="170" y1="90" x2="230" y2="90" class="measurement-line"/>
            <text x="200" y="85" text-anchor="middle" class="label-text">鼻宽</text>

            <!-- 理想唇部 -->
            <path d="M 130 130 Q 165 115 200 115 Q 235 115 270 130 L 260 145 Q 200 130 140 145 Z"
                  class="lip-outline"/>
            <path d="M 140 145 Q 200 175 260 145 L 270 160 Q 200 190 130 160 Z"
                  class="lip-outline"/>

            <!-- 黄金比例分割线 -->
            <line x1="130" y1="145" x2="270" y2="145" class="golden-ratio"/>
            <line x1="130" y1="160" x2="270" y2="160" class="golden-ratio"/>

            <!-- 上下唇比例测量 -->
            <line x1="280" y1="130" x2="280" y2="145" class="measurement-line"/>
            <line x1="280" y1="145" x2="280" y2="190" class="measurement-line"/>
            <text x="290" y="137" class="label-text">上唇</text>
            <text x="290" y="170" class="label-text">下唇</text>

            <!-- 比例标注 -->
            <text x="300" y="152" class="ratio-text">1</text>
            <text x="300" y="180" class="ratio-text">1.6</text>

            <!-- 唇宽测量 -->
            <line x1="130" y1="200" x2="270" y2="200" class="measurement-line"/>
            <text x="200" y="215" text-anchor="middle" class="label-text">理想唇宽 = 鼻宽 × 1.3</text>

            <!-- 对称性参考线 -->
            <line x1="200" y1="80" x2="200" y2="220" class="measurement-line"/>
            <text x="205" y="100" class="label-text">中线对称</text>

            <!-- 唇峰角度 -->
            <path d="M 165 115 L 175 105 L 185 115" fill="none" stroke="#FF9800" stroke-width="1"/>
            <text x="155" y="100" class="label-text" fill="#FF9800">唇峰角度 15°</text>

            <!-- 标题 -->
            <text x="200" y="30" text-anchor="middle" class="label-text" font-size="16" font-weight="bold">
                唇部黄金比例美学标准
            </text>

            <!-- 美学要点 -->
            <text x="50" y="250" class="label-text">• 上下唇比例 1:1.6</text>
            <text x="50" y="265" class="label-text">• 唇宽与鼻宽比例 1.3:1</text>
            <text x="50" y="280" class="label-text">• 唇峰高度差 2-3mm</text>

            <text x="250" y="250" class="label-text">• 中线对称性</text>
            <text x="250" y="265" class="label-text">• 自然弧度曲线</text>
            <text x="250" y="280" class="label-text">• 适度饱满度</text>
        </svg>`;
    }

    /**
     * 生成并发症图SVG
     */
    generateComplicationDiagram() {
        return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .normal-vessel { stroke: #4CAF50; stroke-width: 2; fill: none; }
                    .blocked-vessel { stroke: #F44336; stroke-width: 3; fill: none; }
                    .danger-zone { fill: rgba(244, 67, 54, 0.3); stroke: #F44336; stroke-width: 2; }
                    .ischemic-area { fill: rgba(156, 39, 176, 0.4); stroke: #9C27B0; stroke-width: 1; }
                    .label-text { font-family: Arial, sans-serif; font-size: 11px; fill: #333; }
                    .warning-text { font-family: Arial, sans-serif; font-size: 12px; fill: #F44336; font-weight: bold; }
                </style>
            </defs>

            <!-- 背景 -->
            <rect width="400" height="300" fill="#f8f9fa"/>

            <!-- 唇部轮廓 -->
            <path d="M 100 120 Q 140 100 200 100 Q 260 100 300 120 L 280 140 Q 200 120 120 140 Z"
                  fill="#ffb3ba" stroke="#E91E63" stroke-width="2"/>
            <path d="M 120 140 Q 200 180 280 140 L 300 160 Q 200 200 100 160 Z"
                  fill="#ffb3ba" stroke="#E91E63" stroke-width="2"/>

            <!-- 正常血管分布 -->
            <path d="M 110 135 Q 150 130 190 135" class="normal-vessel"/>
            <path d="M 210 135 Q 250 130 290 135" class="normal-vessel"/>
            <path d="M 130 150 Q 170 165 200 165 Q 230 165 270 150" class="normal-vessel"/>

            <!-- 阻塞血管 -->
            <path d="M 160 135 Q 180 140 200 135" class="blocked-vessel"/>
            <circle cx="180" cy="137" r="8" class="danger-zone"/>
            <text x="185" y="130" class="warning-text">栓塞点</text>

            <!-- 缺血区域 -->
            <ellipse cx="180" cy="145" rx="20" ry="15" class="ischemic-area"/>
            <text x="155" y="170" class="label-text">缺血区域</text>

            <!-- 危险注射区域标注 -->
            <circle cx="130" cy="140" r="12" class="danger-zone"/>
            <text x="105" y="125" class="warning-text">高风险区</text>

            <circle cx="270" cy="140" r="12" class="danger-zone"/>
            <text x="275" y="125" class="warning-text">高风险区</text>

            <!-- 安全注射路径 -->
            <path d="M 200 110 L 200 125" stroke="#4CAF50" stroke-width="3" stroke-dasharray="5,5"/>
            <text x="205" y="120" class="label-text" fill="#4CAF50">安全路径</text>

            <!-- 预防措施文本框 -->
            <rect x="320" y="80" width="75" height="120" fill="white" stroke="#ccc" stroke-width="1"/>
            <text x="325" y="95" class="label-text" font-weight="bold">预防措施:</text>
            <text x="325" y="110" class="label-text">• 回抽测试</text>
            <text x="325" y="125" class="label-text">• 缓慢注射</text>
            <text x="325" y="140" class="label-text">• 小剂量分次</text>
            <text x="325" y="155" class="label-text">• 避开血管</text>
            <text x="325" y="170" class="label-text">• 密切观察</text>
            <text x="325" y="185" class="label-text">• 紧急准备</text>

            <!-- 紧急处理 -->
            <rect x="20" y="220" width="360" height="40" fill="#fff3e0" stroke="#FF9800" stroke-width="1"/>
            <text x="25" y="235" class="warning-text">紧急处理: 立即停止注射 → 热敷按摩 → 透明质酸酶溶解 → 必要时转院</text>
            <text x="25" y="250" class="label-text">黄金救治时间: 发现后2小时内</text>

            <!-- 标题 -->
            <text x="200" y="30" text-anchor="middle" class="warning-text" font-size="16">
                血管栓塞并发症预防与处理
            </text>

            <!-- 发生率标注 -->
            <text x="200" y="50" text-anchor="middle" class="label-text">
                发生率: 约0.05-0.1% | 严重程度: 极高 | 预防胜于治疗
            </text>
        </svg>`;
    }

    /**
     * 生成手术步骤图SVG
     */
    generateProcedureDiagram() {
        return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .step-box { fill: white; stroke: #2196F3; stroke-width: 2; }
                    .step-number { font-family: Arial, sans-serif; font-size: 14px; fill: white; font-weight: bold; }
                    .step-text { font-family: Arial, sans-serif; font-size: 10px; fill: #333; }
                    .arrow { stroke: #2196F3; stroke-width: 2; fill: #2196F3; }
                    .tool-icon { stroke: #666; stroke-width: 1; fill: none; }
                </style>
            </defs>

            <!-- 背景 -->
            <rect width="400" height="300" fill="#f8f9fa"/>

            <!-- 标题 -->
            <text x="200" y="25" text-anchor="middle" style="font-family: Arial; font-size: 16px; font-weight: bold; fill: #333;">
                丰唇手术标准操作流程
            </text>

            <!-- 步骤1: 术前准备 -->
            <circle cx="60" cy="70" r="15" fill="#2196F3"/>
            <text x="60" y="75" text-anchor="middle" class="step-number">1</text>
            <rect x="20" y="90" width="80" height="40" class="step-box"/>
            <text x="30" y="105" class="step-text">术前准备</text>
            <text x="25" y="115" class="step-text">• 评估与设计</text>
            <text x="25" y="125" class="step-text">• 知情同意</text>

            <!-- 步骤2: 消毒麻醉 -->
            <circle cx="160" cy="70" r="15" fill="#2196F3"/>
            <text x="160" y="75" text-anchor="middle" class="step-number">2</text>
            <rect x="120" y="90" width="80" height="40" class="step-box"/>
            <text x="130" y="105" class="step-text">消毒麻醉</text>
            <text x="125" y="115" class="step-text">• 局部消毒</text>
            <text x="125" y="125" class="step-text">• 表面麻醉</text>

            <!-- 步骤3: 标记设计 -->
            <circle cx="260" cy="70" r="15" fill="#2196F3"/>
            <text x="260" y="75" text-anchor="middle" class="step-number">3</text>
            <rect x="220" y="90" width="80" height="40" class="step-box"/>
            <text x="230" y="105" class="step-text">标记设计</text>
            <text x="225" y="115" class="step-text">• 注射点位</text>
            <text x="225" y="125" class="step-text">• 剂量分配</text>

            <!-- 步骤4: 注射操作 -->
            <circle cx="60" cy="170" r="15" fill="#2196F3"/>
            <text x="60" y="175" text-anchor="middle" class="step-number">4</text>
            <rect x="20" y="190" width="80" height="40" class="step-box"/>
            <text x="30" y="205" class="step-text">注射操作</text>
            <text x="25" y="215" class="step-text">• 缓慢推注</text>
            <text x="25" y="225" class="step-text">• 实时塑形</text>

            <!-- 步骤5: 按摩塑形 -->
            <circle cx="160" cy="170" r="15" fill="#2196F3"/>
            <text x="160" y="175" text-anchor="middle" class="step-number">5</text>
            <rect x="120" y="190" width="80" height="40" class="step-box"/>
            <text x="130" y="205" class="step-text">按摩塑形</text>
            <text x="125" y="215" class="step-text">• 轻柔按摩</text>
            <text x="125" y="225" class="step-text">• 形态调整</text>

            <!-- 步骤6: 术后处理 -->
            <circle cx="260" cy="170" r="15" fill="#2196F3"/>
            <text x="260" y="175" text-anchor="middle" class="step-number">6</text>
            <rect x="220" y="190" width="80" height="40" class="step-box"/>
            <text x="230" y="205" class="step-text">术后处理</text>
            <text x="225" y="215" class="step-text">• 冰敷消肿</text>
            <text x="225" y="225" class="step-text">• 注意事项</text>

            <!-- 连接箭头 -->
            <path d="M 85 70 L 135 70 M 130 65 L 135 70 L 130 75" class="arrow"/>
            <path d="M 185 70 L 235 70 M 230 65 L 235 70 L 230 75" class="arrow"/>
            <path d="M 260 85 L 260 95 Q 260 105 250 105 L 70 105 Q 60 105 60 115 L 60 155 M 55 150 L 60 155 L 65 150" class="arrow"/>
            <path d="M 85 170 L 135 170 M 130 165 L 135 170 L 130 175" class="arrow"/>
            <path d="M 185 170 L 235 170 M 230 165 L 235 170 L 230 175" class="arrow"/>

            <!-- 时间标注 -->
            <text x="350" y="70" class="step-text" fill="#666">总时间</text>
            <text x="350" y="85" class="step-text" fill="#666">30-60分钟</text>

            <!-- 工具图标 -->
            <rect x="320" y="100" width="70" height="80" fill="white" stroke="#ccc" stroke-width="1"/>
            <text x="325" y="115" class="step-text" font-weight="bold">必需器材:</text>
            <text x="325" y="130" class="step-text">• 透明质酸</text>
            <text x="325" y="140" class="step-text">• 注射器针头</text>
            <text x="325" y="150" class="step-text">• 消毒用品</text>
            <text x="325" y="160" class="step-text">• 麻醉药膏</text>
            <text x="325" y="170" class="step-text">• 冰袋</text>

            <!-- 关键提示 -->
            <rect x="20" y="250" width="360" height="30" fill="#e3f2fd" stroke="#2196F3" stroke-width="1"/>
            <text x="25" y="265" class="step-text" font-weight="bold" fill="#1976D2">
                关键提示: 严格无菌操作 | 回抽确认 | 分层注射 | 避开血管 | 对称操作
            </text>
        </svg>`;
    }

    /**
     * 根据类型生成对应的图表
     */
    generateDiagramByType(caseType, index, phase) {
        switch(caseType) {
            case 'anatomy':
                return this.generateAnatomyDiagram();
            case 'injection':
                return this.generateInjectionDiagram();
            case 'case-study':
                return this.generateBeforeAfterDiagram(phase);
            case 'complication':
                return this.generateComplicationDiagram();
            case 'procedure':
                return this.generateProcedureDiagram();
            case 'aesthetic':
                return this.generateAestheticStandard();
            default:
                return this.generateAnatomyDiagram();
        }
    }

    /**
     * 根据类型生成案例标题
     */
    generateCaseTitleByType(caseType, index) {
        const titles = {
            'anatomy': [`唇部血管分布图 ${index}`, `神经支配解剖图 ${index}`, `肌肉层次结构图 ${index}`],
            'injection': [`注射技术要点 ${index}`, `安全注射区域图 ${index}`, `剂量分配方案 ${index}`],
            'case-study': [`临床案例分析 ${String(index).padStart(3, '0')}`, `治疗效果评估 ${String(index).padStart(3, '0')}`, `个性化方案 ${String(index).padStart(3, '0')}`],
            'complication': [`并发症预防 ${index}`, `风险评估案例 ${index}`, `紧急处理流程 ${index}`],
            'procedure': [`操作流程标准 ${index}`, `技术规范要求 ${index}`, `质量控制要点 ${index}`],
            'aesthetic': [`美学设计原理 ${index}`, `比例测量标准 ${index}`, `审美评估指标 ${index}`]
        };

        const typeTitle = titles[caseType] || titles['anatomy'];
        return typeTitle[index % typeTitle.length];
    }

    /**
     * 根据类型生成案例描述
     */
    generateCaseDescriptionByType(caseType, index) {
        const descriptions = {
            'anatomy': [
                '详细展示唇部血管分布和走向，为安全注射提供解剖学指导，避免血管损伤和栓塞风险。',
                '展示唇部神经支配情况，包括感觉神经和运动神经的分布，指导麻醉和注射操作。',
                '分层展示唇部肌肉结构，包括口轮匝肌等重要肌肉组织，为注射层次选择提供参考。'
            ],
            'injection': [
                '标准化注射技术要点总结，包括进针角度、注射深度、推注速度等关键技术参数。',
                '明确标注安全注射区域和危险区域，提供精确的解剖定位和注射路径指导。',
                '个性化剂量分配方案，根据不同唇形特点制定最优的注射剂量和分布策略。'
            ],
            'case-study': [
                '真实临床案例分析，展示从术前评估到术后随访的完整治疗过程和效果评价。',
                '系统性治疗效果评估，包括客观测量指标和主观满意度评价，为临床决策提供依据。',
                '个性化治疗方案设计，针对不同患者特点制定最适合的治疗策略和技术选择。'
            ],
            'complication': [
                '常见并发症的预防策略和早期识别要点，提高治疗安全性和成功率。',
                '系统性风险评估方法，建立完善的风险评估体系和安全保障措施。',
                '标准化紧急处理流程，确保在出现并发症时能够及时有效地进行处理。'
            ],
            'procedure': [
                '标准化操作流程制定，确保每个治疗步骤都符合医疗规范和安全要求。',
                '技术规范要求细化，明确各项操作的技术标准和质量控制指标。',
                '质量控制要点总结，建立完善的质量管理体系和持续改进机制。'
            ],
            'aesthetic': [
                '美学设计原理阐述，基于面部解剖学和美学理论制定理想的唇部形态标准。',
                '精确的比例测量方法，建立科学的测量体系和评价标准。',
                '综合审美评估指标，结合客观测量和主观评价建立全面的美学评估体系。'
            ]
        };

        const typeDescriptions = descriptions[caseType] || descriptions['anatomy'];
        return typeDescriptions[index % typeDescriptions.length];
    }

    /**
     * 映射类别到治疗类型
     */
    mapCategoryToTreatmentType(category) {
        const mapping = {
            'anatomy': 'education',
            'injection': 'lip-enhancement',
            'case-study': 'lip-enhancement',
            'complication': 'safety',
            'procedure': 'technique',
            'aesthetic': 'design'
        };
        return mapping[category] || 'lip-enhancement';
    }

    /**
     * 根据类型获取年龄段
     */
    getAgeRangeByType(caseType) {
        const ageRanges = {
            'anatomy': '教学用',
            'injection': '18-45',
            'case-study': ['18-25', '26-35', '36-45', '46+'],
            'complication': '风险教育',
            'procedure': '操作指南',
            'aesthetic': '通用'
        };

        const typeAge = ageRanges[caseType] || '18-35';
        return Array.isArray(typeAge) ? typeAge[Math.floor(Math.random() * typeAge.length)] : typeAge;
    }

    /**
     * 根据类型获取手术时间
     */
    getSurgeryDurationByType(caseType) {
        const durations = {
            'anatomy': '教学材料',
            'injection': '30-45分钟',
            'case-study': ['30分钟', '45分钟', '60分钟'],
            'complication': '紧急处理',
            'procedure': '标准流程',
            'aesthetic': '理论指导'
        };

        const typeDuration = durations[caseType] || '30-45分钟';
        return Array.isArray(typeDuration) ? typeDuration[Math.floor(Math.random() * typeDuration.length)] : typeDuration;
    }

    /**
     * 根据类型获取恢复时间
     */
    getRecoveryTimeByType(caseType) {
        const recoveryTimes = {
            'anatomy': '无',
            'injection': '3-5天',
            'case-study': ['3天', '5天', '7天', '10天'],
            'complication': '视情况而定',
            'procedure': '标准恢复期',
            'aesthetic': '无'
        };

        const typeRecovery = recoveryTimes[caseType] || '3-7天';
        return Array.isArray(typeRecovery) ? typeRecovery[Math.floor(Math.random() * typeRecovery.length)] : typeRecovery;
    }

    /**
     * 根据类型获取标签
     */
    getTagsByType(caseType) {
        const tags = {
            'anatomy': ['解剖学', '教学图谱', '基础医学', '结构分析'],
            'injection': ['注射技术', '安全操作', '技术指导', '专业培训'],
            'case-study': ['临床案例', '效果评估', '个性化', '真实案例'],
            'complication': ['并发症', '风险预防', '安全教育', '紧急处理'],
            'procedure': ['操作流程', '技术规范', '标准化', '质量控制'],
            'aesthetic': ['美学设计', '比例标准', '审美评估', '设计原理']
        };

        return tags[caseType] || tags['anatomy'];
    }

    /**
     * 生成案例描述
     */
    generateCaseDescription(treatmentType) {
        const descriptions = {
            'lip-enhancement': '通过专业的唇部增强技术，为患者打造自然饱满的唇形，提升整体面部美感。手术采用微创技术，恢复快，效果自然。',
            'lip-reduction': '针对唇部过厚的情况，采用精准的减唇术，在保持唇形自然的同时，达到理想的比例效果。',
            'lip-shape': '通过唇形矫正技术，改善不对称或形状不理想的唇部，塑造完美的唇部线条。',
            'lip-color': '采用专业的唇色调整技术，改善唇色暗沉或不均匀的问题，打造健康自然的唇色。',
            'lip-tattoo': '运用精湛的纹绣技艺，为唇部打造持久自然的色彩，解决唇色不理想的困扰。',
            'education': '专业医学教育内容，为临床实践提供理论基础和技术指导。',
            'safety': '安全操作指导和风险预防措施，确保治疗过程的安全性。',
            'technique': '标准化技术操作流程，保证治疗质量和效果的一致性。',
            'design': '基于美学理论的设计原则，为个性化治疗方案提供科学依据。'
        };

        return descriptions[treatmentType] || '专业的唇部美学治疗，为患者带来理想的美学效果。';
    }

    /**
     * 生成标签
     */
    generateTags(treatmentType) {
        const allTags = {
            'lip-enhancement': ['自然增强', '微创技术', '立体塑形'],
            'lip-reduction': ['精准减唇', '比例协调', '自然恢复'],
            'lip-shape': ['形状矫正', '对称美学', '线条优化'],
            'lip-color': ['色彩调整', '均匀着色', '健康自然'],
            'lip-tattoo': ['持久纹绣', '色彩定制', '艺术美学']
        };

        const baseTags = ['专业技术', '个性定制', '美学设计'];
        const specificTags = allTags[treatmentType] || [];

        return [...baseTags, ...specificTags].slice(0, Math.floor(Math.random() * 3) + 3);
    }

    /**
     * 预处理图片信息
     */
    preprocessImages() {
        this.allItems.forEach(item => {
            // 添加图片尺寸信息（实际项目中应从服务器获取）
            item.imageWidth = 400 + Math.floor(Math.random() * 200);
            item.imageHeight = 500 + Math.floor(Math.random() * 300);
            item.aspectRatio = item.imageWidth / item.imageHeight;

            // 生成响应式图片URLs
            item.srcSet = this.generateSrcSet(item.afterImage);
            item.sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
        });
    }

    /**
     * 生成响应式图片srcSet
     */
    generateSrcSet(baseUrl) {
        const sizes = [200, 400, 600, 800];
        return sizes.map(size => `${baseUrl}&w=${size} ${size}w`).join(', ');
    }

    /**
     * 应用筛选和搜索
     */
    applyFiltersAndSearch() {
        let filtered = [...this.allItems];

        // 应用搜索
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                item.doctorName.toLowerCase().includes(query) ||
                item.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // 应用筛选条件
        filtered = this.applyFiltersToItems(filtered);

        // 只显示收藏的项目
        if (document.getElementById('favoriteToggle').classList.contains('active')) {
            filtered = filtered.filter(item => this.favoriteItems.has(item.id));
        }

        // 排序
        filtered = this.sortItems(filtered);

        this.filteredItems = filtered;
        this.currentPage = 1;
        this.hasMoreItems = true;

        this.updateCurrentItems();
        this.updateResultCount();
    }

    /**
     * 应用筛选条件到项目
     */
    applyFiltersToItems(items) {
        return items.filter(item => {
            // 治疗类型筛选
            if (!this.currentFilters.treatmentTypes.includes(item.treatmentType)) {
                return false;
            }

            // 医学分类筛选
            if (item.category && !this.currentFilters.medicalCategories.includes(item.category)) {
                return false;
            }

            // 年龄段筛选
            if (!this.currentFilters.ageRanges.includes(item.ageRange)) {
                return false;
            }

            // 医生筛选
            if (!this.currentFilters.doctors.includes(item.doctor)) {
                return false;
            }

            // 日期范围筛选
            if (this.currentFilters.startDate && new Date(item.date) < new Date(this.currentFilters.startDate)) {
                return false;
            }
            if (this.currentFilters.endDate && new Date(item.date) > new Date(this.currentFilters.endDate)) {
                return false;
            }

            // 评分筛选
            if (item.rating < this.currentFilters.minRating) {
                return false;
            }

            return true;
        });
    }

    /**
     * 排序项目
     */
    sortItems(items) {
        switch (this.currentSort) {
            case 'newest':
                return items.sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'oldest':
                return items.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'rating':
                return items.sort((a, b) => b.rating - a.rating);
            case 'views':
                return items.sort((a, b) => b.views - a.views);
            case 'name':
                return items.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
            default:
                return items;
        }
    }

    /**
     * 更新当前显示的项目
     */
    updateCurrentItems() {
        const startIndex = 0;
        const endIndex = this.currentPage * this.itemsPerPage;
        this.currentItems = this.filteredItems.slice(startIndex, endIndex);

        this.hasMoreItems = endIndex < this.filteredItems.length;
        this.updateLoadMoreButton();
    }

    /**
     * 渲染画廊
     */
    renderGallery() {
        const container = document.getElementById('galleryGrid');
        const viewMode = this.currentView;

        // 清空容器
        container.innerHTML = '';
        container.className = `gallery-grid view-${viewMode} columns-${this.currentColumns}`;

        // 如果没有项目，显示无结果
        if (this.currentItems.length === 0) {
            this.showNoResults(true);
            return;
        }

        this.showNoResults(false);

        // 根据视图模式渲染
        switch (viewMode) {
            case 'masonry':
                this.renderMasonryLayout(container);
                break;
            case 'grid':
                this.renderGridLayout(container);
                break;
            case 'list':
                this.renderListLayout(container);
                break;
            case 'hero':
                this.renderHeroLayout(container);
                break;
        }

        // 设置懒加载
        this.setupLazyLoading();

        // 更新选择状态
        this.updateSelectionUI();
    }

    /**
     * 渲染瀑布流布局
     */
    renderMasonryLayout(container) {
        this.currentItems.forEach((item, index) => {
            const element = this.createGalleryItem(item, 'masonry');
            container.appendChild(element);

            // 计算瀑布流位置
            setTimeout(() => this.positionMasonryItem(element, index), 0);
        });
    }

    /**
     * 渲染网格布局
     */
    renderGridLayout(container) {
        this.currentItems.forEach(item => {
            const element = this.createGalleryItem(item, 'grid');
            container.appendChild(element);
        });
    }

    /**
     * 渲染列表布局
     */
    renderListLayout(container) {
        this.currentItems.forEach(item => {
            const element = this.createGalleryItem(item, 'list');
            container.appendChild(element);
        });
    }

    /**
     * 渲染大图布局
     */
    renderHeroLayout(container) {
        this.currentItems.forEach(item => {
            const element = this.createGalleryItem(item, 'hero');
            container.appendChild(element);
        });
    }

    /**
     * 创建画廊项目元素
     */
    createGalleryItem(item, layout) {
        const article = document.createElement('article');
        article.className = `gallery-item ${layout}-item`;
        article.dataset.id = item.id;
        article.dataset.treatmentType = item.treatmentType;
        article.dataset.doctor = item.doctor;
        article.dataset.ageRange = item.ageRange;

        if (item.isSelected) {
            article.classList.add('selected');
        }

        const isFavorite = this.favoriteItems.has(item.id);

        article.innerHTML = `
            <div class="item-container">
                <div class="item-image-container">
                    <img
                        class="item-image lazy-image"
                        data-src="${item.thumbnailAfter}"
                        data-srcset="${item.srcSet}"
                        sizes="${item.sizes}"
                        alt="${item.title}"
                        loading="lazy"
                    />
                    <div class="image-overlay">
                        <div class="overlay-actions">
                            <button class="action-btn favorite-btn ${isFavorite ? 'active' : ''}"
                                    data-id="${item.id}" title="收藏">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                            </button>
                            <button class="action-btn compare-btn" data-id="${item.id}" title="前后对比">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM8 16H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V6h2v2zm7 8h-2V6h2v10zm7 0h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2z"/>
                                </svg>
                            </button>
                            <button class="action-btn download-btn" data-id="${item.id}" title="下载">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                                </svg>
                            </button>
                        </div>
                        <div class="overlay-info">
                            <div class="rating">
                                ${this.renderStars(item.rating)}
                                <span class="rating-value">${item.rating}</span>
                            </div>
                            <div class="views">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                </svg>
                                ${item.views}
                            </div>
                        </div>
                    </div>
                    <div class="loading-placeholder">
                        <div class="skeleton-loader"></div>
                    </div>
                </div>

                <div class="item-content">
                    <div class="item-header">
                        <h3 class="item-title">${item.title}</h3>
                        <input type="checkbox" class="item-checkbox" data-id="${item.id}">
                    </div>

                    <div class="item-meta">
                        <span class="treatment-type">${this.getTreatmentTypeName(item.treatmentType)}</span>
                        <span class="separator">•</span>
                        <span class="doctor">${item.doctorName}</span>
                        <span class="separator">•</span>
                        <span class="date">${this.formatDate(item.date)}</span>
                    </div>

                    <p class="item-description">${item.description}</p>

                    <div class="item-tags">
                        ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>

                    <div class="item-stats">
                        <div class="stat">
                            <span class="stat-label">手术时间:</span>
                            <span class="stat-value">${item.surgeryDuration}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">恢复周期:</span>
                            <span class="stat-value">${item.recoveryTime}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加点击事件
        const imageContainer = article.querySelector('.item-image-container');
        imageContainer.addEventListener('click', () => this.openLightbox(item.id));

        // 添加操作按钮事件
        article.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleItemFavorite(item.id);
        });

        article.querySelector('.compare-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.openCompareMode(item.id);
        });

        article.querySelector('.download-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadImage(item.id);
        });

        article.querySelector('.item-checkbox').addEventListener('change', (e) => {
            this.toggleItemSelection(item.id, e.target.checked);
        });

        return article;
    }

    /**
     * 获取治疗类型中文名称
     */
    getTreatmentTypeName(type) {
        const names = {
            'lip-enhancement': '唇部增强',
            'lip-reduction': '唇部缩小',
            'lip-shape': '唇形矫正',
            'lip-color': '唇色调整',
            'lip-tattoo': '唇部纹绣',
            'education': '医学教育',
            'safety': '安全指导',
            'technique': '技术操作',
            'design': '美学设计'
        };
        return names[type] || type;
    }

    /**
     * 渲染星级评分
     */
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHTML = '';

        // 满星
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<svg class="star star-full" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        }

        // 半星
        if (hasHalfStar) {
            starsHTML += '<svg class="star star-half" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><defs><linearGradient id="half"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#half)"/></svg>';
        }

        // 空星
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<svg class="star star-empty" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        }

        return starsHTML;
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * 设置懒加载
     */
    setupLazyLoading() {
        const lazyImages = document.querySelectorAll('.lazy-image');
        lazyImages.forEach(img => {
            if (this.intersectionObserver) {
                this.intersectionObserver.observe(img);
            } else {
                // Fallback for browsers without Intersection Observer
                this.loadLazyImage(img);
            }
        });
    }

    /**
     * 加载懒加载图片
     */
    loadLazyImage(img) {
        const placeholder = img.parentNode.querySelector('.loading-placeholder');

        // 检查是否支持WebP
        const supportsWebP = this.supportsWebP();
        let imageSrc = img.dataset.src;

        if (supportsWebP && !imageSrc.includes('.webp')) {
            imageSrc = imageSrc.replace(/\.(jpg|jpeg|png)/, '.webp');
        }

        // 创建新的Image对象来预加载
        const imageLoader = new Image();

        imageLoader.onload = () => {
            img.src = imageSrc;
            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
            }
            img.classList.add('loaded');

            // 隐藏占位符
            if (placeholder) {
                placeholder.style.opacity = '0';
                setTimeout(() => {
                    placeholder.style.display = 'none';
                }, 300);
            }
        };

        imageLoader.onerror = () => {
            // 如果WebP加载失败，尝试原始格式
            if (supportsWebP && imageSrc.includes('.webp')) {
                imageLoader.src = img.dataset.src;
            } else {
                img.classList.add('error');
                if (placeholder) {
                    placeholder.innerHTML = '<div class="error-placeholder">图片加载失败</div>';
                }
            }
        };

        imageLoader.src = imageSrc;
    }

    /**
     * 检查浏览器是否支持WebP
     */
    supportsWebP() {
        if (this._webpSupport !== undefined) {
            return this._webpSupport;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;

        this._webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        return this._webpSupport;
    }

    /**
     * 瀑布流定位
     */
    positionMasonryItem(element, index) {
        if (this.currentView !== 'masonry') return;

        const container = element.parentNode;
        const containerWidth = container.offsetWidth;
        const gap = 20;
        const columns = this.currentColumns;
        const itemWidth = (containerWidth - (columns - 1) * gap) / columns;

        // 初始化列高度数组
        if (!this.columnHeights || this.columnHeights.length !== columns) {
            this.columnHeights = new Array(columns).fill(0);
        }

        // 设置项目宽度
        element.style.width = `${itemWidth}px`;

        // 找到最短的列
        let shortestColumn = 0;
        let shortestHeight = this.columnHeights[0];

        for (let i = 1; i < columns; i++) {
            if (this.columnHeights[i] < shortestHeight) {
                shortestHeight = this.columnHeights[i];
                shortestColumn = i;
            }
        }

        // 定位元素
        const left = shortestColumn * (itemWidth + gap);
        const top = shortestHeight;

        element.style.position = 'absolute';
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        element.style.transition = 'all 0.3s ease';

        // 更新列高度
        const itemHeight = element.offsetHeight;
        this.columnHeights[shortestColumn] += itemHeight + gap;

        // 更新容器高度
        const maxHeight = Math.max(...this.columnHeights);
        container.style.height = `${maxHeight}px`;
        container.style.position = 'relative';
    }

    /**
     * 打开灯箱
     */
    openLightbox(itemId) {
        const item = this.allItems.find(i => i.id === itemId);
        if (!item) return;

        this.currentLightboxIndex = this.currentItems.findIndex(i => i.id === itemId);
        this.lightboxItems = this.currentItems;
        this.isLightboxOpen = true;

        const modal = document.getElementById('lightboxModal');
        modal.classList.add('active');
        document.body.classList.add('lightbox-open');

        this.displayLightboxItem(item);
        this.updateLightboxNavigation();

        // 预加载相邻图片
        this.preloadAdjacentImages();
    }

    /**
     * 显示灯箱项目
     */
    displayLightboxItem(item) {
        document.getElementById('lightboxTitle').textContent = item.title;
        document.getElementById('lightboxDate').textContent = this.formatDate(item.date);
        document.getElementById('lightboxDoctor').textContent = item.doctorName;

        const lightboxImage = document.getElementById('lightboxImage');
        lightboxImage.src = item.afterImage;
        lightboxImage.alt = item.title;

        // 重置变换
        this.lightboxZoom = 1;
        this.lightboxPanX = 0;
        this.lightboxPanY = 0;
        this.updateImageTransform();

        // 更新详细信息
        document.getElementById('treatmentType').textContent = this.getTreatmentTypeName(item.treatmentType);
        document.getElementById('patientAge').textContent = item.ageRange;
        document.getElementById('surgeryDuration').textContent = item.surgeryDuration;
        document.getElementById('recoveryTime').textContent = item.recoveryTime;
        document.getElementById('caseDescription').textContent = item.description;

        // 更新评分
        const ratingContainer = document.getElementById('satisfactionRating').querySelector('.stars');
        ratingContainer.innerHTML = this.renderStars(item.rating);

        // 更新标签
        const tagsContainer = document.getElementById('caseTags');
        tagsContainer.innerHTML = item.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        // 更新收藏状态
        const favoriteBtn = document.getElementById('favoriteBtn');
        favoriteBtn.classList.toggle('active', this.favoriteItems.has(item.id));
    }

    /**
     * 更新灯箱导航
     */
    updateLightboxNavigation() {
        const prevBtn = document.getElementById('lightboxPrev');
        const nextBtn = document.getElementById('lightboxNext');

        prevBtn.style.display = this.currentLightboxIndex > 0 ? 'flex' : 'none';
        nextBtn.style.display = this.currentLightboxIndex < this.lightboxItems.length - 1 ? 'flex' : 'none';
    }

    /**
     * 灯箱导航
     */
    navigateLightbox(direction) {
        const newIndex = this.currentLightboxIndex + direction;

        if (newIndex >= 0 && newIndex < this.lightboxItems.length) {
            this.currentLightboxIndex = newIndex;
            const item = this.lightboxItems[newIndex];
            this.displayLightboxItem(item);
            this.updateLightboxNavigation();
            this.preloadAdjacentImages();
        }
    }

    /**
     * 预加载相邻图片
     */
    preloadAdjacentImages() {
        const preloadRange = [-1, 1];

        preloadRange.forEach(offset => {
            const index = this.currentLightboxIndex + offset;
            if (index >= 0 && index < this.lightboxItems.length) {
                const item = this.lightboxItems[index];
                if (!this.lazyLoadImages.has(item.id)) {
                    const img = new Image();
                    img.src = item.afterImage;
                    this.lazyLoadImages.set(item.id, img);
                }
            }
        });
    }

    /**
     * 关闭灯箱
     */
    closeLightbox() {
        const modal = document.getElementById('lightboxModal');
        modal.classList.remove('active');
        document.body.classList.remove('lightbox-open');
        this.isLightboxOpen = false;

        // 重置状态
        this.lightboxZoom = 1;
        this.lightboxPanX = 0;
        this.lightboxPanY = 0;
    }

    /**
     * 图片缩放
     */
    zoomImage(factor) {
        this.lightboxZoom *= factor;
        this.lightboxZoom = Math.max(0.5, Math.min(5, this.lightboxZoom));

        // 限制平移范围
        this.constrainPan();
        this.updateImageTransform();
    }

    /**
     * 重置缩放
     */
    resetZoom() {
        this.lightboxZoom = 1;
        this.lightboxPanX = 0;
        this.lightboxPanY = 0;
        this.updateImageTransform();
    }

    /**
     * 处理滚轮缩放
     */
    handleWheelZoom(e) {
        e.preventDefault();

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 计算缩放中心点
        const oldZoom = this.lightboxZoom;
        this.zoomImage(delta);

        if (this.lightboxZoom !== oldZoom) {
            const zoomRatio = this.lightboxZoom / oldZoom;
            this.lightboxPanX = x - (x - this.lightboxPanX) * zoomRatio;
            this.lightboxPanY = y - (y - this.lightboxPanY) * zoomRatio;
            this.constrainPan();
            this.updateImageTransform();
        }
    }

    /**
     * 限制平移范围
     */
    constrainPan() {
        if (this.lightboxZoom <= 1) {
            this.lightboxPanX = 0;
            this.lightboxPanY = 0;
            return;
        }

        const image = document.getElementById('lightboxImage');
        const container = image.parentNode;

        const imageRect = image.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const maxPanX = (imageRect.width * this.lightboxZoom - containerRect.width) / 2;
        const maxPanY = (imageRect.height * this.lightboxZoom - containerRect.height) / 2;

        this.lightboxPanX = Math.max(-maxPanX, Math.min(maxPanX, this.lightboxPanX));
        this.lightboxPanY = Math.max(-maxPanY, Math.min(maxPanY, this.lightboxPanY));
    }

    /**
     * 更新图片变换
     */
    updateImageTransform() {
        const image = document.getElementById('lightboxImage');
        const transform = `scale(${this.lightboxZoom}) translate(${this.lightboxPanX / this.lightboxZoom}px, ${this.lightboxPanY / this.lightboxZoom}px)`;
        image.style.transform = transform;

        // 更新鼠标样式
        const wrapper = image.parentNode;
        wrapper.style.cursor = this.lightboxZoom > 1 ? 'grab' : 'default';
    }

    /**
     * 切换收藏状态
     */
    toggleFavorite() {
        if (this.currentLightboxIndex >= 0 && this.currentLightboxIndex < this.lightboxItems.length) {
            const item = this.lightboxItems[this.currentLightboxIndex];
            this.toggleItemFavorite(item.id);

            // 更新灯箱中的收藏按钮状态
            const favoriteBtn = document.getElementById('favoriteBtn');
            favoriteBtn.classList.toggle('active', this.favoriteItems.has(item.id));
        }
    }

    /**
     * 切换项目收藏状态
     */
    toggleItemFavorite(itemId) {
        if (this.favoriteItems.has(itemId)) {
            this.favoriteItems.delete(itemId);
        } else {
            this.favoriteItems.add(itemId);
        }

        this.saveFavorites();
        this.updateItemFavoriteUI(itemId);
    }

    /**
     * 更新项目收藏UI
     */
    updateItemFavoriteUI(itemId) {
        const item = document.querySelector(`[data-id="${itemId}"]`);
        if (item) {
            const favoriteBtn = item.querySelector('.favorite-btn');
            favoriteBtn.classList.toggle('active', this.favoriteItems.has(itemId));
        }
    }

    /**
     * 保存收藏列表
     */
    saveFavorites() {
        try {
            localStorage.setItem('lipGalleryFavorites', JSON.stringify([...this.favoriteItems]));
        } catch (error) {
            console.warn('Failed to save favorites:', error);
        }
    }

    /**
     * 加载收藏列表
     */
    loadFavorites() {
        try {
            const saved = localStorage.getItem('lipGalleryFavorites');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch (error) {
            console.warn('Failed to load favorites:', error);
            return new Set();
        }
    }

    /**
     * 处理搜索
     */
    handleSearch(query) {
        this.searchQuery = query.trim();
        this.addToSearchHistory(query);
        this.applyFiltersAndSearch();
        this.renderGallery();
    }

    /**
     * 添加到搜索历史
     */
    addToSearchHistory(query) {
        if (query.trim()) {
            this.searchHistory = this.searchHistory.filter(item => item !== query);
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 10); // 保留最近10次搜索
            this.saveSearchHistory();
        }
    }

    /**
     * 保存搜索历史
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('lipGallerySearchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('Failed to save search history:', error);
        }
    }

    /**
     * 加载搜索历史
     */
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('lipGallerySearchHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Failed to load search history:', error);
            return [];
        }
    }

    /**
     * 切换筛选侧边栏
     */
    toggleFilterSidebar() {
        const sidebar = document.getElementById('filterSidebar');
        const mainContent = document.getElementById('mainContent');

        sidebar.classList.toggle('active');
        mainContent.classList.toggle('filter-open');
    }

    /**
     * 关闭筛选侧边栏
     */
    closeFilterSidebar() {
        const sidebar = document.getElementById('filterSidebar');
        const mainContent = document.getElementById('mainContent');

        sidebar.classList.remove('active');
        mainContent.classList.remove('filter-open');
    }

    /**
     * 应用筛选
     */
    applyFilters() {
        this.currentFilters = this.collectFilterValues();
        this.applyFiltersAndSearch();
        this.renderGallery();
        this.closeFilterSidebar();
    }

    /**
     * 重置筛选
     */
    resetFilters() {
        this.currentFilters = this.getDefaultFilters();
        this.updateFilterUI();
        this.applyFiltersAndSearch();
        this.renderGallery();
    }

    /**
     * 收集筛选值
     */
    collectFilterValues() {
        const filters = {
            treatmentTypes: [],
            medicalCategories: [],
            ageRanges: [],
            doctors: [],
            startDate: document.getElementById('startDate').value || null,
            endDate: document.getElementById('endDate').value || null,
            minRating: parseFloat(document.getElementById('ratingSlider').value)
        };

        // 收集选中的治疗类型
        document.querySelectorAll('input[value^="lip-"]:checked, input[value="education"]:checked, input[value="safety"]:checked, input[value="technique"]:checked, input[value="design"]:checked').forEach(input => {
            filters.treatmentTypes.push(input.value);
        });

        // 收集选中的医学分类
        document.querySelectorAll('input[value="anatomy"]:checked, input[value="injection"]:checked, input[value="case-study"]:checked, input[value="complication"]:checked, input[value="procedure"]:checked, input[value="aesthetic"]:checked').forEach(input => {
            filters.medicalCategories.push(input.value);
        });

        // 收集选中的年龄段
        document.querySelectorAll('input[value$="-25"]:checked, input[value="26-35"]:checked, input[value="36-45"]:checked, input[value="46+"]:checked, input[value="教学用"]:checked, input[value="风险教育"]:checked, input[value="操作指南"]:checked, input[value="通用"]:checked').forEach(input => {
            filters.ageRanges.push(input.value);
        });

        // 收集选中的医生
        document.querySelectorAll('input[value^="dr-"]:checked').forEach(input => {
            filters.doctors.push(input.value);
        });

        return filters;
    }

    /**
     * 更新筛选UI
     */
    updateFilterUI() {
        // 更新复选框状态
        document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
            const value = checkbox.value;

            if (value.startsWith('lip-') || ['education', 'safety', 'technique', 'design'].includes(value)) {
                checkbox.checked = this.currentFilters.treatmentTypes.includes(value);
            } else if (['anatomy', 'injection', 'case-study', 'complication', 'procedure', 'aesthetic'].includes(value)) {
                checkbox.checked = this.currentFilters.medicalCategories.includes(value);
            } else if (value.includes('-') || ['46+', '教学用', '风险教育', '操作指南', '通用'].includes(value)) {
                checkbox.checked = this.currentFilters.ageRanges.includes(value);
            } else if (value.startsWith('dr-')) {
                checkbox.checked = this.currentFilters.doctors.includes(value);
            }
        });

        // 更新日期输入
        document.getElementById('startDate').value = this.currentFilters.startDate || '';
        document.getElementById('endDate').value = this.currentFilters.endDate || '';

        // 更新评分滑块
        document.getElementById('ratingSlider').value = this.currentFilters.minRating;
        document.getElementById('ratingValue').textContent = this.currentFilters.minRating.toFixed(1);
    }

    /**
     * 更新筛选预览
     */
    updateFilterPreview() {
        // 实时显示筛选结果数量（可选功能）
        const previewFilters = this.collectFilterValues();
        const previewItems = this.applyFiltersToItems([...this.allItems]);

        // 可以在这里更新UI显示预览结果数量
        // console.log(`预览结果: ${previewItems.length} 个案例`);
    }

    /**
     * 改变视图模式
     */
    changeViewMode(view) {
        this.currentView = view;

        // 更新按钮状态
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // 重新渲染
        this.renderGallery();
    }

    /**
     * 改变列数
     */
    changeColumns(columns) {
        this.currentColumns = columns;
        document.querySelector('.column-value').textContent = columns;

        // 重置瀑布流高度
        this.columnHeights = null;

        // 重新渲染
        this.renderGallery();
    }

    /**
     * 改变排序方式
     */
    changeSorting(sort) {
        this.currentSort = sort;
        this.applyFiltersAndSearch();
        this.renderGallery();
    }

    /**
     * 切换全选
     */
    toggleSelectAll() {
        const allSelected = this.currentItems.every(item => this.selectedItems.has(item.id));

        if (allSelected) {
            // 取消全选
            this.currentItems.forEach(item => this.selectedItems.delete(item.id));
        } else {
            // 全选
            this.currentItems.forEach(item => this.selectedItems.add(item.id));
        }

        this.updateSelectionUI();
        this.updateBatchActions();
    }

    /**
     * 切换项目选择
     */
    toggleItemSelection(itemId, selected) {
        if (selected) {
            this.selectedItems.add(itemId);
        } else {
            this.selectedItems.delete(itemId);
        }

        this.updateSelectionUI();
        this.updateBatchActions();
    }

    /**
     * 更新选择UI
     */
    updateSelectionUI() {
        // 更新复选框状态
        document.querySelectorAll('.item-checkbox').forEach(checkbox => {
            const itemId = parseInt(checkbox.dataset.id);
            checkbox.checked = this.selectedItems.has(itemId);
        });

        // 更新全选按钮
        const selectAllBtn = document.getElementById('selectAllBtn');
        const allSelected = this.currentItems.length > 0 && this.currentItems.every(item => this.selectedItems.has(item.id));
        const someSelected = this.currentItems.some(item => this.selectedItems.has(item.id));

        selectAllBtn.textContent = allSelected ? '取消全选' : '全选';
        selectAllBtn.classList.toggle('partial', someSelected && !allSelected);

        // 更新项目视觉状态
        document.querySelectorAll('.gallery-item').forEach(item => {
            const itemId = parseInt(item.dataset.id);
            item.classList.toggle('selected', this.selectedItems.has(itemId));
        });
    }

    /**
     * 更新批量操作
     */
    updateBatchActions() {
        const batchDownloadBtn = document.getElementById('batchDownloadBtn');
        const hasSelection = this.selectedItems.size > 0;

        batchDownloadBtn.disabled = !hasSelection;
        batchDownloadBtn.textContent = hasSelection ? `批量下载 (${this.selectedItems.size})` : '批量下载';
    }

    /**
     * 批量下载
     */
    async batchDownload() {
        if (this.selectedItems.size === 0) return;

        const selectedItemsArray = Array.from(this.selectedItems);
        const maxConcurrent = 3; // 限制并发下载数

        try {
            this.showNotification('开始批量下载...', 'info');

            for (let i = 0; i < selectedItemsArray.length; i += maxConcurrent) {
                const batch = selectedItemsArray.slice(i, i + maxConcurrent);
                const downloadPromises = batch.map(itemId => this.downloadImage(itemId, false));

                await Promise.all(downloadPromises);

                // 短暂延迟避免过快请求
                if (i + maxConcurrent < selectedItemsArray.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            this.showNotification(`成功下载 ${this.selectedItems.size} 张图片`, 'success');
        } catch (error) {
            console.error('Batch download failed:', error);
            this.showNotification('批量下载失败', 'error');
        }
    }

    /**
     * 下载图片
     */
    async downloadImage(itemId, showNotification = true) {
        const item = this.allItems.find(i => i.id === itemId);
        if (!item) return;

        try {
            const response = await fetch(item.afterImage);
            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${item.title}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            if (showNotification) {
                this.showNotification('图片下载成功', 'success');
            }
        } catch (error) {
            console.error('Download failed:', error);
            if (showNotification) {
                this.showNotification('图片下载失败', 'error');
            }
        }
    }

    /**
     * 切换收藏筛选
     */
    toggleFavoriteFilter() {
        const btn = document.getElementById('favoriteToggle');
        btn.classList.toggle('active');

        this.applyFiltersAndSearch();
        this.renderGallery();
    }

    /**
     * 加载更多
     */
    loadMore() {
        if (!this.hasMoreItems || this.isLoading) return;

        this.currentPage++;
        this.updateCurrentItems();

        // 追加新项目到现有网格
        this.appendNewItems();
    }

    /**
     * 追加新项目
     */
    appendNewItems() {
        const container = document.getElementById('galleryGrid');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const newItems = this.filteredItems.slice(startIndex, startIndex + this.itemsPerPage);

        newItems.forEach((item, index) => {
            const element = this.createGalleryItem(item, this.currentView);
            container.appendChild(element);

            if (this.currentView === 'masonry') {
                setTimeout(() => this.positionMasonryItem(element, startIndex + index), 0);
            }
        });

        this.setupLazyLoading();
        this.updateSelectionUI();
    }

    /**
     * 更新加载更多按钮
     */
    updateLoadMoreButton() {
        const container = document.getElementById('loadMoreContainer');
        const btn = document.getElementById('loadMoreBtn');

        if (this.hasMoreItems && this.filteredItems.length > this.itemsPerPage) {
            container.style.display = 'block';
            btn.textContent = this.isLoading ? '加载中...' : '加载更多';
            btn.disabled = this.isLoading;
        } else {
            container.style.display = 'none';
        }
    }

    /**
     * 更新结果数量
     */
    updateResultCount() {
        const resultCount = document.getElementById('resultCount');
        resultCount.innerHTML = `共 <strong>${this.filteredItems.length}</strong> 个案例`;
    }

    /**
     * 显示/隐藏加载指示器
     */
    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        indicator.style.display = show ? 'flex' : 'none';
        this.isLoading = show;
    }

    /**
     * 显示/隐藏无结果
     */
    showNoResults(show) {
        const noResults = document.getElementById('noResults');
        noResults.style.display = show ? 'flex' : 'none';
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboardShortcuts(e) {
        // ESC键关闭模态框
        if (e.key === 'Escape') {
            if (this.isLightboxOpen) {
                this.closeLightbox();
            } else if (document.getElementById('filterSidebar').classList.contains('active')) {
                this.closeFilterSidebar();
            } else if (document.getElementById('shareModal').classList.contains('active')) {
                this.closeShareModal();
            }
        }

        // 灯箱导航
        if (this.isLightboxOpen && !e.ctrlKey && !e.metaKey) {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.navigateLightbox(-1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.navigateLightbox(1);
                    break;
                case ' ':
                    e.preventDefault();
                    this.navigateLightbox(1);
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFavorite();
                    break;
                case 'd':
                    e.preventDefault();
                    this.downloadCurrentImage();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
            }
        }

        // 全局快捷键
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'f':
                    e.preventDefault();
                    document.getElementById('searchInput').focus();
                    break;
                case 'a':
                    e.preventDefault();
                    this.toggleSelectAll();
                    break;
            }
        }
    }

    /**
     * 下载当前灯箱图片
     */
    downloadCurrentImage() {
        if (this.currentLightboxIndex >= 0 && this.currentLightboxIndex < this.lightboxItems.length) {
            const item = this.lightboxItems[this.currentLightboxIndex];
            this.downloadImage(item.id);
        }
    }

    /**
     * 切换全屏
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Cannot enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * 打开分享模态框
     */
    openShareModal() {
        if (this.currentLightboxIndex >= 0 && this.currentLightboxIndex < this.lightboxItems.length) {
            const item = this.lightboxItems[this.currentLightboxIndex];
            const url = `${window.location.origin}${window.location.pathname}?case=${item.id}`;

            const modal = document.getElementById('shareModal');
            const urlInput = modal.querySelector('.url-input');

            urlInput.value = url;
            modal.classList.add('active');
        }
    }

    /**
     * 关闭分享模态框
     */
    closeShareModal() {
        document.getElementById('shareModal').classList.remove('active');
    }

    /**
     * 处理分享
     */
    handleShare(platform) {
        const item = this.lightboxItems[this.currentLightboxIndex];
        const url = `${window.location.origin}${window.location.pathname}?case=${item.id}`;
        const title = `${item.title} - 绛唇解语花`;
        const description = item.description;

        switch (platform) {
            case 'wechat':
                // 微信分享需要特殊处理
                this.showNotification('请复制链接后在微信中分享', 'info');
                this.copyToClipboard(url);
                break;
            case 'weibo':
                const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&pic=${encodeURIComponent(item.afterImage)}`;
                window.open(weiboUrl, '_blank');
                break;
            case 'link':
                this.copyShareUrl();
                break;
            case 'qr':
                this.generateQRCode(url);
                break;
        }
    }

    /**
     * 复制分享URL
     */
    copyShareUrl() {
        const urlInput = document.querySelector('#shareModal .url-input');
        this.copyToClipboard(urlInput.value);
    }

    /**
     * 复制到剪贴板
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('链接已复制到剪贴板', 'success');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('链接已复制', 'success');
        }
    }

    /**
     * 生成二维码
     */
    generateQRCode(url) {
        // 简单的二维码生成（实际项目中可使用QR库）
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

        const img = document.createElement('img');
        img.src = qrUrl;
        img.style.maxWidth = '200px';
        img.style.maxHeight = '200px';

        this.showNotification('二维码已生成', 'success');

        // 可以在这里显示二维码
        console.log('QR Code URL:', qrUrl);
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // 自动关闭
        const autoClose = setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        // 手动关闭
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoClose);
            this.removeNotification(notification);
        });

        // 显示动画
        setTimeout(() => notification.classList.add('show'), 10);
    }

    /**
     * 移除通知
     */
    removeNotification(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * 显示错误
     */
    showError(message) {
        this.showNotification(message, 'error', 5000);
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        // 重新计算瀑布流布局
        if (this.currentView === 'masonry') {
            this.columnHeights = null;
            this.renderGallery();
        }

        // 更新列数（响应式）
        this.updateResponsiveColumns();
    }

    /**
     * 更新响应式列数
     */
    updateResponsiveColumns() {
        const width = window.innerWidth;
        let newColumns = this.currentColumns;

        if (width < 768) {
            newColumns = Math.min(2, this.currentColumns);
        } else if (width < 1024) {
            newColumns = Math.min(3, this.currentColumns);
        } else if (width < 1440) {
            newColumns = Math.min(4, this.currentColumns);
        }

        if (newColumns !== this.currentColumns) {
            this.changeColumns(newColumns);
            document.getElementById('columnSlider').value = newColumns;
        }
    }

    /**
     * 处理滚动
     */
    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // 显示/隐藏回到顶部按钮
        const scrollToTopBtn = document.getElementById('scrollToTop');
        scrollToTopBtn.classList.toggle('visible', scrollTop > 500);

        // 无限滚动
        if (this.hasMoreItems && !this.isLoading) {
            const scrollHeight = document.documentElement.scrollHeight;
            const windowHeight = window.innerHeight;

            if (scrollTop + windowHeight >= scrollHeight - 1000) {
                this.loadMore();
            }
        }
    }

    /**
     * 滚动到顶部
     */
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * 更新UI状态
     */
    updateUI() {
        this.updateResultCount();
        this.updateLoadMoreButton();
        this.updateBatchActions();
        this.updateFilterUI();
    }

    /**
     * 切换对比模式
     */
    toggleCompareMode() {
        // 实现前后对比功能
        console.log('Toggle compare mode');
    }

    /**
     * 打开对比模式
     */
    openCompareMode(itemId) {
        // 实现对比查看功能
        console.log('Open compare mode for item:', itemId);
    }

    /**
     * 初始化Service Worker
     */
    initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    /**
     * 工具函数 - 防抖
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

    /**
     * 工具函数 - 节流
     */
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
}

// 初始化画廊
document.addEventListener('DOMContentLoaded', () => {
    window.lipGallery = new LipAestheticsGallery();
});

// PWA相关
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;

    // 显示安装提示
    console.log('PWA installation prompt available');
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('Global error:', e);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e);
});

// CSS样式中添加的动画和过渡效果
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 16px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification.hide {
        transform: translateX(100%);
    }

    .notification-info {
        background: #2196F3;
    }

    .notification-success {
        background: #4CAF50;
    }

    .notification-error {
        background: #F44336;
    }

    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }

    .notification-close {
        background: none;
        border: none;
        color: currentColor;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
        transition: opacity 0.2s ease;
    }

    .notification-close:hover {
        opacity: 1;
    }
`;

document.head.appendChild(styleSheet);