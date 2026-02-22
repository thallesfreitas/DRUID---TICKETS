import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup após cada teste
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock fetch global
global.fetch = vi.fn() as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
});

// Suprimir console errors em testes (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented: navigation') ||
        args[0].includes('jsdom') ||
        args[0].includes('window.matchMedia'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Extend matchers customizados
expect.extend({
  toBeValidCode(received: string) {
    const valid = /^[A-Z0-9]{6,}$/.test(received);
    return {
      pass: valid,
      message: () => `Code "${received}" is ${valid ? 'valid' : 'invalid'} (must be 6+ alphanumeric uppercase)`
    };
  },

  toBeValidEmail(received: string) {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    return {
      pass: valid,
      message: () => `"${received}" is ${valid ? 'valid' : 'invalid'} email format`
    };
  },

  toBeValidIP(received: string) {
    const valid = /^(\d{1,3}\.){3}\d{1,3}$/.test(received);
    return {
      pass: valid,
      message: () => `"${received}" is ${valid ? 'valid' : 'invalid'} IP address`
    };
  }
});

// Augment Vitest matchers with custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidCode(): T;
    toBeValidEmail(): T;
    toBeValidIP(): T;
  }
  interface AsymmetricMatchersContaining {
    toBeValidCode(): any;
    toBeValidEmail(): any;
    toBeValidIP(): any;
  }
}

// Mock process.env para testes
process.env.VITE_API_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
