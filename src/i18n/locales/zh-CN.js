/**
 * 中文语言包
 * Chinese (Simplified) Locale
 */

export default {
    meta: {
        code: 'zh-CN',
        name: 'Chinese (Simplified)',
        nativeName: '简体中文',
        direction: 'ltr'
    },

    // 通用
    common: {
        loading: '加载中...',
        error: '错误',
        success: '成功',
        confirm: '确认',
        cancel: '取消',
        save: '保存',
        delete: '删除',
        edit: '编辑',
        close: '关闭',
        search: '搜索',
        filter: '筛选',
        sort: '排序',
        refresh: '刷新',
        back: '返回',
        next: '下一步',
        previous: '上一步',
        submit: '提交',
        reset: '重置',
        yes: '是',
        no: '否',
        all: '全部',
        none: '无',
        more: '更多',
        less: '收起'
    },

    // 导航
    nav: {
        home: '首页',
        chapters: '章节',
        cases: '案例',
        glossary: '术语表',
        resources: '资源',
        settings: '设置',
        about: '关于',
        help: '帮助',
        contact: '联系我们'
    },

    // 章节标题
    chapters: {
        chapter1: '第一章：唇部解剖学基础',
        chapter2: '第二章：唇部美学标准',
        chapter3: '第三章：注射材料概述',
        chapter4: '第四章：注射技术详解',
        chapter5: '第五章：并发症处理',
        chapter6: '第六章：案例分析',
        chapter7: '第七章：医生选择指南',
        chapter8: '第八章：纹饰与化妆技巧',
        chapter9: '第九章：术后护理',
        chapter10: '第十章：风险防范与美学哲学',
        chapter11: '附录：参考资源'
    },

    // 3D查看器
    viewer3d: {
        title: '3D解剖模型',
        rotate: '旋转',
        zoom: '缩放',
        pan: '平移',
        reset: '重置视图',
        fullscreen: '全屏',
        exitFullscreen: '退出全屏',
        layers: '图层',
        annotations: '标注',
        showAll: '显示全部',
        hideAll: '隐藏全部',
        loadingModel: '正在加载3D模型...',
        loadError: '模型加载失败',
        controls: {
            mouse: '鼠标控制',
            touch: '触摸控制',
            leftClick: '左键拖动旋转',
            rightClick: '右键拖动平移',
            scroll: '滚轮缩放',
            pinch: '双指缩放',
            drag: '单指旋转'
        }
    },

    // 案例分析
    cases: {
        title: '临床案例分析',
        before: '术前',
        after: '术后',
        duration: '治疗周期',
        materials: '使用材料',
        technique: '技术要点',
        results: '治疗效果',
        patientInfo: '患者信息',
        age: '年龄',
        gender: '性别',
        male: '男',
        female: '女',
        chiefComplaint: '主诉',
        diagnosis: '诊断',
        treatment: '治疗方案',
        followUp: '随访记录',
        complications: '并发症',
        satisfaction: '满意度',
        viewDetails: '查看详情',
        compare: '对比',
        filter: {
            all: '全部案例',
            augmentation: '唇部填充',
            correction: '形态矫正',
            rejuvenation: '年轻化',
            complication: '并发症处理'
        }
    },

    // 术语表
    glossary: {
        title: '医学术语表',
        search: '搜索术语...',
        categories: {
            anatomy: '解剖学',
            materials: '材料学',
            techniques: '技术',
            complications: '并发症',
            aesthetics: '美学'
        },
        definition: '定义',
        relatedTerms: '相关术语',
        references: '参考文献'
    },

    // 设置
    settings: {
        title: '设置',
        language: '语言',
        theme: '主题',
        themes: {
            light: '浅色',
            dark: '深色',
            auto: '跟随系统'
        },
        fontSize: '字体大小',
        fontSizes: {
            small: '小',
            medium: '中',
            large: '大'
        },
        notifications: '通知',
        offlineMode: '离线模式',
        clearCache: '清除缓存',
        resetSettings: '重置设置',
        accessibility: {
            title: '无障碍',
            highContrast: '高对比度',
            reduceMotion: '减少动画',
            screenReader: '屏幕阅读器优化'
        }
    },

    // 搜索
    search: {
        placeholder: '搜索内容...',
        noResults: '未找到相关结果',
        results: '搜索结果',
        resultCount: '找到 {count} 个结果',
        searching: '搜索中...',
        filters: {
            chapters: '章节',
            cases: '案例',
            glossary: '术语'
        },
        recent: '最近搜索',
        clearHistory: '清除历史'
    },

    // 导出与分享
    export: {
        title: '导出',
        formats: {
            pdf: 'PDF文档',
            epub: 'EPUB电子书',
            print: '打印'
        },
        options: {
            includeImages: '包含图片',
            includeAnnotations: '包含标注',
            highQuality: '高质量'
        },
        generating: '正在生成...',
        success: '导出成功',
        error: '导出失败'
    },

    // 通知
    notifications: {
        newContent: '有新内容可用',
        updateAvailable: '有更新可用',
        offlineReady: '已准备好离线使用',
        syncComplete: '同步完成',
        error: '发生错误'
    },

    // 错误消息
    errors: {
        networkError: '网络连接失败',
        loadError: '内容加载失败',
        notFound: '页面未找到',
        serverError: '服务器错误',
        timeout: '请求超时',
        retry: '重试',
        goHome: '返回首页'
    },

    // 页脚
    footer: {
        copyright: '© 2024 唇部美学医学电子书',
        disclaimer: '免责声明',
        privacy: '隐私政策',
        terms: '使用条款',
        version: '版本'
    },

    // 医学警告
    medical: {
        disclaimer: '医学免责声明',
        disclaimerText: '本电子书仅供医学专业人士参考学习，不构成医疗建议。所有治疗决策应基于患者具体情况，由具有资质的医疗专业人员做出。',
        warning: '警告',
        caution: '注意',
        important: '重要',
        consultation: '请咨询专业医生'
    },

    // 进度
    progress: {
        reading: '阅读进度',
        completed: '已完成',
        resume: '继续阅读',
        bookmark: '添加书签',
        bookmarks: '我的书签'
    },

    // 无障碍
    a11y: {
        skipToContent: '跳转到主要内容',
        menuToggle: '切换菜单',
        languageSelect: '选择语言',
        themeToggle: '切换主题',
        closeDialog: '关闭对话框',
        expandSection: '展开章节',
        collapseSection: '收起章节'
    }
};
