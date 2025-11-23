/**
 * Jest 测试设置文件
 * Jest Test Setup
 */

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
    value: {
        language: 'zh-CN',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        serviceWorker: {
            register: jest.fn().mockResolvedValue({
                scope: '/',
                addEventListener: jest.fn()
            })
        }
    },
    writable: true
});

// Mock Performance API
Object.defineProperty(window, 'performance', {
    value: {
        now: jest.fn(() => Date.now()),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByName: jest.fn(() => []),
        getEntriesByType: jest.fn(() => [])
    }
});

// Mock PerformanceObserver
class MockPerformanceObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    disconnect() {}
}

window.PerformanceObserver = MockPerformanceObserver;

// Mock IntersectionObserver
class MockIntersectionObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
}

window.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
}

window.ResizeObserver = MockResizeObserver;

// Mock requestAnimationFrame
window.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
window.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
    })
);

// Mock console methods to reduce noise in tests
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();
console.info = jest.fn();

// 清理函数
afterEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
});
