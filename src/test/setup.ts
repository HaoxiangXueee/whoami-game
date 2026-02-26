/**
 * Vitest 测试环境配置
 */

import '@testing-library/jest-dom';

// 全局 Mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 模拟 IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// 模拟 ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// 清理函数
beforeAll(() => {
  // 全局初始化
});

afterAll(() => {
  // 全局清理
});

beforeEach(() => {
  // 每个测试前的清理
});

afterEach(() => {
  // 每个测试后的清理
  jest.clearAllMocks();
});
