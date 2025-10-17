import { vi } from 'vitest';

// Mock WebNN API
const mockWebNNContext = {
  // Mock context properties
};

const mockWebNN = {
  createContext: vi.fn(async (options?: any) => {
    if (options?.deviceType === 'unsupported') {
      throw new Error('Device type not supported');
    }
    return mockWebNNContext;
  }),
};

// Mock WebGPU API
const mockWebGPUAdapter = {
  requestDevice: vi.fn(async () => ({
    createBuffer: vi.fn(),
    createTexture: vi.fn(),
  })),
};

const mockWebGPU = {
  requestAdapter: vi.fn(async (options?: any) => {
    if (options?.powerPreference === 'unsupported') {
      return null;
    }
    return mockWebGPUAdapter;
  }),
};

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    ml: mockWebNN,
    gpu: mockWebGPU,
    userAgent: 'Mozilla/5.0 (Test Browser)',
  },
  writable: true,
});

export { mockWebNN, mockWebGPU, mockWebNNContext, mockWebGPUAdapter };
