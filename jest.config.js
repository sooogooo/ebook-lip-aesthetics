/**
 * Jest 配置文件
 * Jest Configuration
 */

module.exports = {
    // 测试环境
    testEnvironment: 'jsdom',

    // 测试文件匹配模式
    testMatch: [
        '**/tests/**/*.test.js',
        '**/__tests__/**/*.js'
    ],

    // 模块路径映射
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@root/(.*)$': '<rootDir>/$1'
    },

    // 忽略的路径
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ],

    // 覆盖率收集
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],

    // 覆盖率阈值
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
        }
    },

    // 设置文件
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // 转换器配置
    transform: {
        '^.+\\.js$': 'babel-jest'
    },

    // 模块文件扩展名
    moduleFileExtensions: ['js', 'json'],

    // 全局变量
    globals: {
        'window': {},
        'document': {}
    },

    // 详细输出
    verbose: true,

    // 清除模拟
    clearMocks: true,

    // 恢复模拟
    restoreMocks: true
};
