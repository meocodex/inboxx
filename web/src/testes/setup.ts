import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// =============================================================================
// Cleanup apos cada teste
// =============================================================================

afterEach(() => {
  cleanup();
});

// =============================================================================
// Mock do ResizeObserver
// =============================================================================

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// =============================================================================
// Mock do IntersectionObserver
// =============================================================================

class IntersectionObserverMock {
  constructor(
    _callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit
  ) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
}

global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// =============================================================================
// Mock do matchMedia
// =============================================================================

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// =============================================================================
// Mock do scrollTo
// =============================================================================

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// =============================================================================
// Mock do localStorage
// =============================================================================

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// =============================================================================
// Mock do sessionStorage
// =============================================================================

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// =============================================================================
// Setup e Teardown Global
// =============================================================================

beforeAll(() => {
  // Setup global antes de todos os testes
});

afterAll(() => {
  // Cleanup global apos todos os testes
  vi.clearAllMocks();
});
