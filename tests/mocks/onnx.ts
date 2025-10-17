import { vi } from 'vitest';

// Mock ONNX Runtime Tensor
const mockTensor = {
  data: new Float32Array(320 * 320), // Mock tensor data
  dims: [1, 1, 320, 320],
  type: 'float32',
};

// Mock ONNX Runtime InferenceSession
const mockInferenceSession = {
  run: vi.fn(async (inputs: any) => {
    // Return mock outputs
    return {
      output: mockTensor,
    };
  }),
  release: vi.fn(),
  endProfiling: vi.fn(),
};

// Mock ONNX Runtime
const mockOrt = {
  InferenceSession: {
    create: vi.fn(async (modelData: any, options?: any) => {
      if (options?.executionProviders?.includes('unsupported')) {
        throw new Error('Unsupported execution provider');
      }
      return mockInferenceSession;
    }),
  },
  Tensor: vi.fn((type: string, data: any, dims: number[]) => ({
    type,
    data,
    dims,
  })),
  env: {
    wasm: {
      simd: true,
      proxy: false,
      numThreads: 4,
    },
  },
};

// Mock the onnxruntime-web module
vi.mock('onnxruntime-web', () => mockOrt);

export { mockOrt, mockInferenceSession, mockTensor };
