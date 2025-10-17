import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseSession, SessionOptions } from '../../../src/sessions/base';
import { rembgConfig } from '../../../src/config';
import { mockOrt } from '../../mocks/onnx';
import { NormalizationParams } from '../../../src/utils/image';

// Mock the dependencies
vi.mock('../../../src/utils/webnn', () => ({
  getExecutionProviders: vi.fn(() => ['webgl', 'cpu']),
  validateWebNNConfig: vi.fn(() => true),
  isWebNNAvailable: vi.fn(() => false),
}));

vi.mock('../../../src/utils/webgpu', () => ({
  validateWebGPUConfig: vi.fn(() => true),
  isWebGPUAvailable: vi.fn(() => false),
}));

vi.mock('../../../src/utils/integrity', () => ({
  validateModel: vi.fn(() => Promise.resolve(true)),
}));

// Create a concrete implementation of BaseSession for testing
class TestSession extends BaseSession {
  constructor(options?: SessionOptions) {
    super('test-model', options);
  }

  protected getDefaultModelUrl(): string {
    return '/models/test-model.onnx';
  }

  protected getNormalizationParams(): NormalizationParams {
    return {
      mean: [0.485, 0.456, 0.406],
      std: [0.229, 0.224, 0.225],
      size: [320, 320],
    };
  }

  protected getInputName(): string {
    return 'input.1';
  }

  protected getOutputShape(): [number, number, number, number] {
    return [1, 1, 320, 320];
  }

  protected processOutputs(
    outputs: any,
    originalSize: { width: number; height: number }
  ) {
    return [document.createElement('canvas')];
  }

  static getName(): string {
    return 'test-model';
  }
}

describe('BaseSession', () => {
  let session: TestSession;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset config to defaults
    rembgConfig.resetToDefaults();
    rembgConfig.resetWebNNSettings();
    rembgConfig.resetWebGPUSettings();
    rembgConfig.resetLoggingSettings();
    rembgConfig.resetCacheBypassSettings();
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      session = new TestSession();

      expect(session.getName()).toBe('test-model');
      const options = session.getOptions();
      expect(options.simd).toBe(true);
      expect(options.proxy).toBe(false);
      expect(options.numThreads).toBe(4);
    });

    it('should merge provided options with defaults', () => {
      const customOptions: SessionOptions = {
        simd: false,
        numThreads: 8,
        preferWebNN: true,
      };

      session = new TestSession(customOptions);

      const options = session.getOptions();
      expect(options.simd).toBe(false);
      expect(options.proxy).toBe(false); // Default value
      expect(options.numThreads).toBe(8);
      expect(options.preferWebNN).toBe(true);
    });

    it('should configure ONNX Runtime with options', () => {
      const customOptions: SessionOptions = {
        simd: false,
        numThreads: 2,
      };

      session = new TestSession(customOptions);

      // Verify ONNX Runtime was configured
      expect(mockOrt.env.wasm.simd).toBe(false);
      expect(mockOrt.env.wasm.numThreads).toBe(2);
    });
  });

  describe('getModelUrl', () => {
    it('should return custom model path when configured', () => {
      rembgConfig.setCustomModelPath('test-model', '/custom/path/model.onnx');
      session = new TestSession();

      const url = (session as any).getModelUrl();
      expect(url).toBe('/custom/path/model.onnx');
    });

    it('should return default model URL when no custom path', () => {
      session = new TestSession();

      const url = (session as any).getModelUrl();
      expect(url).toBe('/models/test-model.onnx');
    });

    it('should return default URL for empty custom path', () => {
      rembgConfig.setCustomModelPath('test-model', '');
      session = new TestSession();

      const url = (session as any).getModelUrl();
      expect(url).toBe('/models/test-model.onnx');
    });
  });

  describe('getModelVersion', () => {
    it('should return default version', () => {
      session = new TestSession();

      const version = (session as any).getModelVersion();
      expect(version).toBe('1.0.0');
    });
  });

  describe('getOptions', () => {
    it('should return a copy of options', () => {
      const customOptions: SessionOptions = {
        simd: false,
        numThreads: 6,
      };

      session = new TestSession(customOptions);

      const options1 = session.getOptions();
      const options2 = session.getOptions();

      expect(options1).toEqual(options2);
      expect(options1).not.toBe(options2); // Different objects
    });

    it('should not allow modification of internal options', () => {
      session = new TestSession();

      const options = session.getOptions();
      options.simd = false;
      options.numThreads = 999;

      const optionsAfter = session.getOptions();
      expect(optionsAfter.simd).toBe(true); // Should still be default
      expect(optionsAfter.numThreads).toBe(4); // Should still be default
    });
  });

  describe('getName', () => {
    it('should return model name', () => {
      session = new TestSession();

      expect(session.getName()).toBe('test-model');
    });
  });

  describe('dispose', () => {
    it('should dispose session and clear model data', async () => {
      session = new TestSession();

      // Mock session initialization
      (session as any).session = {
        release: vi.fn(),
      };
      (session as any).modelData = new ArrayBuffer(100);

      await session.dispose();

      expect((session as any).session).toBeNull();
      expect((session as any).modelData).toBeNull();
    });

    it('should handle disposal when session is not initialized', async () => {
      session = new TestSession();

      // Should not throw when session is null
      await expect(session.dispose()).resolves.toBeUndefined();
    });
  });

  describe('Static Methods', () => {
    describe('clearCache', () => {
      it('should clear IndexedDB cache', async () => {
        // Mock IndexedDB
        const mockDeleteDatabase = vi.fn(name => {
          const request = {
            onsuccess: vi.fn(),
            onerror: vi.fn(),
          };
          // Simulate success
          setTimeout(() => {
            if (request.onsuccess) {
              request.onsuccess({} as any);
            }
          }, 0);
          return request;
        });

        Object.defineProperty(global, 'indexedDB', {
          value: {
            deleteDatabase: mockDeleteDatabase,
          },
          writable: true,
        });

        await BaseSession.clearCache();

        expect(mockDeleteDatabase).toHaveBeenCalledWith('rembg-models');
      });

      it('should handle IndexedDB errors', async () => {
        const mockDeleteDatabase = vi.fn(name => {
          const request = {
            onsuccess: vi.fn(),
            onerror: vi.fn(),
          };
          // Simulate error
          setTimeout(() => {
            if (request.onerror) {
              request.onerror(new Error('Delete failed'));
            }
          }, 0);
          return request;
        });

        Object.defineProperty(global, 'indexedDB', {
          value: {
            deleteDatabase: mockDeleteDatabase,
          },
          writable: true,
        });

        await expect(BaseSession.clearCache()).rejects.toThrow('Delete failed');
      });

      it('should handle IndexedDB not available', async () => {
        Object.defineProperty(global, 'indexedDB', {
          value: undefined,
          writable: true,
        });

        await expect(BaseSession.clearCache()).rejects.toThrow();
      });
    });

    describe('clearModelCache', () => {
      it('should clear cache for specific model', async () => {
        // Mock IndexedDB
        const mockDelete = vi.fn(() => {
          const deleteRequest = {
            onsuccess: vi.fn(),
            onerror: vi.fn(),
          };
          // Simulate delete success
          setTimeout(() => {
            if (deleteRequest.onsuccess) {
              deleteRequest.onsuccess({} as any);
            }
          }, 0);
          return deleteRequest;
        });

        const mockObjectStore = vi.fn(() => ({
          delete: mockDelete,
        }));

        const mockTransaction = vi.fn(() => ({
          objectStore: mockObjectStore,
        }));

        const mockOpen = vi.fn((name, version) => {
          const request = {
            onsuccess: vi.fn(),
            onerror: vi.fn(),
            result: {
              transaction: mockTransaction,
            },
          };
          // Simulate open success
          setTimeout(() => {
            if (request.onsuccess) {
              request.onsuccess({} as any);
            }
          }, 0);
          return request;
        });

        Object.defineProperty(global, 'indexedDB', {
          value: {
            open: mockOpen,
          },
          writable: true,
        });

        await BaseSession.clearModelCache('test-model');

        expect(mockOpen).toHaveBeenCalledWith('rembg-models', 2);
        expect(mockDelete).toHaveBeenCalledWith('test-model');
      });

      it('should handle IndexedDB errors', async () => {
        const mockOpen = vi.fn((name, version) => {
          const request = {
            onsuccess: vi.fn(),
            onerror: vi.fn(),
          };
          // Simulate error
          setTimeout(() => {
            if (request.onerror) {
              request.onerror(new Error('Open failed'));
            }
          }, 0);
          return request;
        });

        Object.defineProperty(global, 'indexedDB', {
          value: {
            open: mockOpen,
          },
          writable: true,
        });

        await expect(BaseSession.clearModelCache('test-model')).rejects.toThrow(
          'Open failed'
        );
      });

      it('should handle IndexedDB not available', async () => {
        Object.defineProperty(global, 'indexedDB', {
          value: undefined,
          writable: true,
        });

        await expect(
          BaseSession.clearModelCache('test-model')
        ).rejects.toThrow();
      });
    });
  });

  describe('Abstract Methods', () => {
    it('should implement getDefaultModelUrl', () => {
      session = new TestSession();

      const url = (session as any).getDefaultModelUrl();
      expect(url).toBe('/models/test-model.onnx');
    });

    it('should implement getNormalizationParams', () => {
      session = new TestSession();

      const params = (session as any).getNormalizationParams();
      expect(params).toEqual({
        mean: [0.485, 0.456, 0.406],
        std: [0.229, 0.224, 0.225],
        size: [320, 320],
      });
    });

    it('should implement getInputName', () => {
      session = new TestSession();

      const inputName = (session as any).getInputName();
      expect(inputName).toBe('input.1');
    });

    it('should implement getOutputShape', () => {
      session = new TestSession();

      const outputShape = (session as any).getOutputShape();
      expect(outputShape).toEqual([1, 1, 320, 320]);
    });

    it('should implement processOutputs', () => {
      session = new TestSession();

      const outputs = { output: { data: new Float32Array(100) } };
      const originalSize = { width: 640, height: 480 };

      const result = (session as any).processOutputs(outputs, originalSize);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined options', () => {
      session = new TestSession(undefined);

      const options = session.getOptions();
      expect(options.simd).toBe(true);
      expect(options.proxy).toBe(false);
      expect(options.numThreads).toBe(4);
    });

    it('should handle empty options object', () => {
      session = new TestSession({});

      const options = session.getOptions();
      expect(options.simd).toBe(true);
      expect(options.proxy).toBe(false);
      expect(options.numThreads).toBe(4);
    });

    it('should handle options with undefined values', () => {
      const options: SessionOptions = {
        simd: undefined,
        numThreads: undefined,
        preferWebNN: undefined,
      };

      session = new TestSession(options);

      const resultOptions = session.getOptions();
      expect(resultOptions.simd).toBe(true); // Should use default
      expect(resultOptions.numThreads).toBe(4); // Should use default
      expect(resultOptions.preferWebNN).toBeUndefined();
    });

    it('should handle multiple disposal calls', async () => {
      session = new TestSession();

      // Mock session initialization
      (session as any).session = {
        release: vi.fn(),
      };

      await session.dispose();
      await session.dispose(); // Second disposal should not throw

      expect((session as any).session).toBeNull();
    });
  });

  describe('Integration with Config', () => {
    it('should use global config for model paths', () => {
      rembgConfig.setCustomModelPath('test-model', '/global/custom/path.onnx');
      session = new TestSession();

      const url = (session as any).getModelUrl();
      expect(url).toBe('/global/custom/path.onnx');
    });

    it('should override global config with custom path', () => {
      rembgConfig.setCustomModelPath('test-model', '/global/path.onnx');
      rembgConfig.setCustomModelPath('test-model', '/override/path.onnx');
      session = new TestSession();

      const url = (session as any).getModelUrl();
      expect(url).toBe('/override/path.onnx');
    });
  });
});
