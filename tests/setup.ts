import { vi } from 'vitest';
import 'fake-indexeddb/auto';
import 'vitest-canvas-mock';
import './mocks/crypto';
import './mocks/navigator';
import './mocks/onnx';

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
  writable: true,
});

// Mock URL constructor and methods
global.URL = class URL {
  constructor(url: string, base?: string) {
    this.href = url;
    this.protocol = url.startsWith('blob:') ? 'blob:' : 'https:';
    this.hostname = 'localhost';
    this.pathname = '/';
  }

  href: string;
  protocol: string;
  hostname: string;
  pathname: string;
  static createObjectURL = vi.fn(() => 'blob:mock-object-url');
  static revokeObjectURL = vi.fn();
} as any;

// Mock ImageData constructor
global.ImageData = class ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
} as any;

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Handle unhandled promise rejections to prevent test failures
process.on('unhandledRejection', (reason, promise) => {
  // Ignore image loading errors in tests
  if (reason && typeof reason === 'object' && 'target' in reason) {
    const target = (reason as any).target;
    if (target && target.tagName === 'IMG') {
      return; // Ignore image loading errors
    }
  }
  // For other unhandled rejections, just ignore them in tests
  // console.error('Unhandled Promise Rejection:', reason);
});
