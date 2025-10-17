import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    exclude: ['**/e2e/**', '**/node_modules/**'],
    deps: {
      inline: ['vitest-canvas-mock'],
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mocks/**',
        '**/e2e/**',
      ],
    },
  },
  resolve: {
    alias: {
      'rembg-web': resolve(__dirname, './src'),
    },
  },
});
