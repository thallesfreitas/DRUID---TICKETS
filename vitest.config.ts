import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.test.*',
        '**/index.ts',
        '**/*.config.ts',
        'server.ts'
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      all: false
    }
  },
  resolve: {
    alias: [
      { find: /^@\/api\/(.*)$/, replacement: path.resolve(__dirname, './api/$1') },
      { find: /^@\/tests\/(.*)$/, replacement: path.resolve(__dirname, './tests/$1') },
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, './src/$1') },
      { find: '@api', replacement: path.resolve(__dirname, './api') },
      { find: '@src', replacement: path.resolve(__dirname, './src') },
      { find: '@tests', replacement: path.resolve(__dirname, './tests') }
    ]
  }
});
