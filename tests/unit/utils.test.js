/**
 * 工具函数单元测试
 * Utility Functions Unit Tests
 */

describe('深度合并函数', () => {
    function deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    test('应合并简单对象', () => {
        const target = { a: 1, b: 2 };
        const source = { b: 3, c: 4 };
        const result = deepMerge(target, source);

        expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    test('应深度合并嵌套对象', () => {
        const target = { a: { b: 1, c: 2 } };
        const source = { a: { c: 3, d: 4 } };
        const result = deepMerge(target, source);

        expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } });
    });

    test('应正确处理数组（替换而非合并）', () => {
        const target = { arr: [1, 2, 3] };
        const source = { arr: [4, 5] };
        const result = deepMerge(target, source);

        expect(result.arr).toEqual([4, 5]);
    });

    test('不应修改原对象', () => {
        const target = { a: 1 };
        const source = { b: 2 };
        deepMerge(target, source);

        expect(target).toEqual({ a: 1 });
        expect(source).toEqual({ b: 2 });
    });

    test('应处理空对象', () => {
        expect(deepMerge({}, { a: 1 })).toEqual({ a: 1 });
        expect(deepMerge({ a: 1 }, {})).toEqual({ a: 1 });
    });
});

describe('设备检测函数', () => {
    function isMobileDevice(userAgent) {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    }

    test('应检测 Android 设备', () => {
        expect(isMobileDevice('Mozilla/5.0 (Linux; Android 10)')).toBe(true);
    });

    test('应检测 iPhone', () => {
        expect(isMobileDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)')).toBe(true);
    });

    test('应检测 iPad', () => {
        expect(isMobileDevice('Mozilla/5.0 (iPad; CPU OS 14_0)')).toBe(true);
    });

    test('应检测 BlackBerry', () => {
        expect(isMobileDevice('Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)')).toBe(true);
    });

    test('桌面浏览器应返回 false', () => {
        expect(isMobileDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
        expect(isMobileDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)')).toBe(false);
    });
});

describe('节流函数', () => {
    function throttle(func, limit) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= limit) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    }

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('应立即执行第一次调用', () => {
        const fn = jest.fn();
        const throttled = throttle(fn, 100);

        throttled();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('应在限制时间内忽略后续调用', () => {
        const fn = jest.fn();
        const throttled = throttle(fn, 100);

        throttled();
        throttled();
        throttled();

        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('应在限制时间后允许再次调用', () => {
        const fn = jest.fn();
        const throttled = throttle(fn, 100);

        throttled();
        jest.advanceTimersByTime(100);
        throttled();

        expect(fn).toHaveBeenCalledTimes(2);
    });
});

describe('防抖函数', () => {
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('应延迟执行', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 100);

        debounced();
        expect(fn).not.toHaveBeenCalled();

        jest.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('快速连续调用应只执行一次', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 100);

        debounced();
        debounced();
        debounced();

        jest.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('应传递正确的参数', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 100);

        debounced('arg1', 'arg2');
        jest.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
});

describe('格式化函数', () => {
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    test('应格式化字节', () => {
        expect(formatFileSize(500)).toBe('500 Bytes');
    });

    test('应格式化 KB', () => {
        expect(formatFileSize(1024)).toBe('1 KB');
        expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    test('应格式化 MB', () => {
        expect(formatFileSize(1048576)).toBe('1 MB');
        expect(formatFileSize(1572864)).toBe('1.5 MB');
    });

    test('应格式化 GB', () => {
        expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    test('应处理 0', () => {
        expect(formatFileSize(0)).toBe('0 Bytes');
    });
});
