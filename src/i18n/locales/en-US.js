/**
 * 英文语言包
 * English (US) Locale
 */

export default {
    meta: {
        code: 'en-US',
        name: 'English (US)',
        nativeName: 'English',
        direction: 'ltr'
    },

    // Common
    common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        confirm: 'Confirm',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        refresh: 'Refresh',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        submit: 'Submit',
        reset: 'Reset',
        yes: 'Yes',
        no: 'No',
        all: 'All',
        none: 'None',
        more: 'More',
        less: 'Less'
    },

    // Navigation
    nav: {
        home: 'Home',
        chapters: 'Chapters',
        cases: 'Cases',
        glossary: 'Glossary',
        resources: 'Resources',
        settings: 'Settings',
        about: 'About',
        help: 'Help',
        contact: 'Contact Us'
    },

    // Chapter titles
    chapters: {
        chapter1: 'Chapter 1: Lip Anatomy Fundamentals',
        chapter2: 'Chapter 2: Lip Aesthetic Standards',
        chapter3: 'Chapter 3: Injectable Materials Overview',
        chapter4: 'Chapter 4: Injection Techniques',
        chapter5: 'Chapter 5: Complication Management',
        chapter6: 'Chapter 6: Case Studies',
        chapter7: 'Chapter 7: Choosing Your Doctor',
        chapter8: 'Chapter 8: Lip Tattooing & Makeup',
        chapter9: 'Chapter 9: Post-Treatment Care',
        chapter10: 'Chapter 10: Risk Prevention & Aesthetic Philosophy',
        chapter11: 'Appendix: Reference Resources'
    },

    // 3D Viewer
    viewer3d: {
        title: '3D Anatomy Model',
        rotate: 'Rotate',
        zoom: 'Zoom',
        pan: 'Pan',
        reset: 'Reset View',
        fullscreen: 'Fullscreen',
        exitFullscreen: 'Exit Fullscreen',
        layers: 'Layers',
        annotations: 'Annotations',
        showAll: 'Show All',
        hideAll: 'Hide All',
        loadingModel: 'Loading 3D model...',
        loadError: 'Failed to load model',
        controls: {
            mouse: 'Mouse Controls',
            touch: 'Touch Controls',
            leftClick: 'Left-click drag to rotate',
            rightClick: 'Right-click drag to pan',
            scroll: 'Scroll to zoom',
            pinch: 'Pinch to zoom',
            drag: 'Drag to rotate'
        }
    },

    // Case Studies
    cases: {
        title: 'Clinical Case Studies',
        before: 'Before',
        after: 'After',
        duration: 'Treatment Duration',
        materials: 'Materials Used',
        technique: 'Technical Points',
        results: 'Treatment Results',
        patientInfo: 'Patient Information',
        age: 'Age',
        gender: 'Gender',
        male: 'Male',
        female: 'Female',
        chiefComplaint: 'Chief Complaint',
        diagnosis: 'Diagnosis',
        treatment: 'Treatment Plan',
        followUp: 'Follow-up Records',
        complications: 'Complications',
        satisfaction: 'Satisfaction',
        viewDetails: 'View Details',
        compare: 'Compare',
        filter: {
            all: 'All Cases',
            augmentation: 'Lip Augmentation',
            correction: 'Shape Correction',
            rejuvenation: 'Rejuvenation',
            complication: 'Complication Management'
        }
    },

    // Glossary
    glossary: {
        title: 'Medical Glossary',
        search: 'Search terms...',
        categories: {
            anatomy: 'Anatomy',
            materials: 'Materials',
            techniques: 'Techniques',
            complications: 'Complications',
            aesthetics: 'Aesthetics'
        },
        definition: 'Definition',
        relatedTerms: 'Related Terms',
        references: 'References'
    },

    // Settings
    settings: {
        title: 'Settings',
        language: 'Language',
        theme: 'Theme',
        themes: {
            light: 'Light',
            dark: 'Dark',
            auto: 'System'
        },
        fontSize: 'Font Size',
        fontSizes: {
            small: 'Small',
            medium: 'Medium',
            large: 'Large'
        },
        notifications: 'Notifications',
        offlineMode: 'Offline Mode',
        clearCache: 'Clear Cache',
        resetSettings: 'Reset Settings',
        accessibility: {
            title: 'Accessibility',
            highContrast: 'High Contrast',
            reduceMotion: 'Reduce Motion',
            screenReader: 'Screen Reader Optimization'
        }
    },

    // Search
    search: {
        placeholder: 'Search content...',
        noResults: 'No results found',
        results: 'Search Results',
        resultCount: 'Found {count} results',
        searching: 'Searching...',
        filters: {
            chapters: 'Chapters',
            cases: 'Cases',
            glossary: 'Glossary'
        },
        recent: 'Recent Searches',
        clearHistory: 'Clear History'
    },

    // Export & Share
    export: {
        title: 'Export',
        formats: {
            pdf: 'PDF Document',
            epub: 'EPUB eBook',
            print: 'Print'
        },
        options: {
            includeImages: 'Include Images',
            includeAnnotations: 'Include Annotations',
            highQuality: 'High Quality'
        },
        generating: 'Generating...',
        success: 'Export successful',
        error: 'Export failed'
    },

    // Notifications
    notifications: {
        newContent: 'New content available',
        updateAvailable: 'Update available',
        offlineReady: 'Ready for offline use',
        syncComplete: 'Sync complete',
        error: 'An error occurred'
    },

    // Error messages
    errors: {
        networkError: 'Network connection failed',
        loadError: 'Failed to load content',
        notFound: 'Page not found',
        serverError: 'Server error',
        timeout: 'Request timeout',
        retry: 'Retry',
        goHome: 'Go to Home'
    },

    // Footer
    footer: {
        copyright: '© 2024 Lip Aesthetics Medical E-Book',
        disclaimer: 'Disclaimer',
        privacy: 'Privacy Policy',
        terms: 'Terms of Use',
        version: 'Version'
    },

    // Medical warnings
    medical: {
        disclaimer: 'Medical Disclaimer',
        disclaimerText: 'This e-book is intended for medical professionals only and does not constitute medical advice. All treatment decisions should be based on individual patient circumstances and made by qualified healthcare professionals.',
        warning: 'Warning',
        caution: 'Caution',
        important: 'Important',
        consultation: 'Please consult a medical professional'
    },

    // Progress
    progress: {
        reading: 'Reading Progress',
        completed: 'Completed',
        resume: 'Resume Reading',
        bookmark: 'Add Bookmark',
        bookmarks: 'My Bookmarks'
    },

    // Accessibility
    a11y: {
        skipToContent: 'Skip to main content',
        menuToggle: 'Toggle menu',
        languageSelect: 'Select language',
        themeToggle: 'Toggle theme',
        closeDialog: 'Close dialog',
        expandSection: 'Expand section',
        collapseSection: 'Collapse section'
    }
};
