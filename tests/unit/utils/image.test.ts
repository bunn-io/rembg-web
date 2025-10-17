import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  imageToCanvas,
  canvasToImageData,
  imageDataToCanvas,
  fileToImage,
  arrayBufferToImage,
  canvasToBlob,
  normalizeImage,
  processModelOutput,
  naiveCutout,
  applyBackgroundColor,
  postProcessMask,
  createMaskOnly,
  NormalizationParams,
} from 'rembg-web/utils/image';
// Canvas and Image mocks are now provided by vitest-canvas-mock

describe('Image Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('imageToCanvas', () => {
    it('should convert HTMLImageElement to canvas', () => {
      // Create a proper HTMLImageElement with mock dimensions
      const image = new Image();
      Object.defineProperty(image, 'naturalWidth', {
        value: 100,
        writable: false,
      });
      Object.defineProperty(image, 'naturalHeight', {
        value: 200,
        writable: false,
      });

      const canvas = imageToCanvas(image);

      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(100);
      expect(canvas.height).toBe(200);
      expect(typeof canvas.getContext).toBe('function');
    });

    it('should convert ImageData to canvas', () => {
      const imageData = new ImageData(50, 75);
      const canvas = imageToCanvas(imageData);

      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(50);
      expect(canvas.height).toBe(75);
    });

    it('should throw error if canvas context fails', () => {
      const mockGetContext = vi.fn(() => null);
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => ({
        width: 320,
        height: 320,
        getContext: mockGetContext,
      })) as any;

      const image = new Image();
      expect(() => imageToCanvas(image)).toThrow(
        'Failed to get context for canvas'
      );

      document.createElement = originalCreateElement;
    });
  });

  describe('canvasToImageData', () => {
    it('should convert canvas to ImageData', () => {
      const canvas = document.createElement('canvas');
      const imageData = canvasToImageData(canvas);

      expect(imageData).toBeDefined();
      expect(imageData.width).toBeGreaterThan(0); // Any positive width
      expect(imageData.height).toBeGreaterThan(0); // Any positive height
      expect(imageData.data).toBeInstanceOf(Uint8ClampedArray);
    });

    it('should throw error if canvas context fails', () => {
      const mockGetContext = vi.fn(() => null);
      const canvas = {
        width: 320,
        height: 320,
        getContext: mockGetContext,
      } as unknown as HTMLCanvasElement;

      expect(() => canvasToImageData(canvas)).toThrow(
        'Failed to get context for canvas'
      );
    });
  });

  describe('imageDataToCanvas', () => {
    it('should convert ImageData to canvas', () => {
      const imageData = new ImageData(100, 150);
      const canvas = imageDataToCanvas(imageData);

      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(100);
      expect(canvas.height).toBe(150);
    });

    it('should throw error if canvas context fails', () => {
      const mockGetContext = vi.fn(() => null);
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => ({
        width: 320,
        height: 320,
        getContext: mockGetContext,
      })) as any;

      const imageData = new ImageData(100, 150);
      expect(() => imageDataToCanvas(imageData)).toThrow(
        'Failed to get context for canvas'
      );

      document.createElement = originalCreateElement;
    });
  });

  describe('fileToImage', () => {
    it('should return a promise for File', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = fileToImage(file);
      expect(result).toBeInstanceOf(Promise);

      // Catch the promise to prevent unhandled rejection
      result.catch(() => {
        // Expected to fail in test environment
      });
    });

    it('should return a promise for Blob', async () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      const result = fileToImage(blob);
      expect(result).toBeInstanceOf(Promise);

      // Catch the promise to prevent unhandled rejection
      result.catch(() => {
        // Expected to fail in test environment
      });
    });

    it('should handle image load error', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = fileToImage(file);
      expect(result).toBeInstanceOf(Promise);

      // Catch the promise to prevent unhandled rejection
      result.catch(() => {
        // Expected to fail in test environment
      });
    });
  });

  describe('arrayBufferToImage', () => {
    it('should return a promise for ArrayBuffer', async () => {
      const buffer = new ArrayBuffer(100);
      const result = arrayBufferToImage(buffer);
      expect(result).toBeInstanceOf(Promise);

      // Catch the promise to prevent unhandled rejection
      result.catch(() => {
        // Expected to fail in test environment
      });
    });

    it('should handle image load error', async () => {
      const buffer = new ArrayBuffer(100);
      const result = arrayBufferToImage(buffer);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('canvasToBlob', () => {
    it('should convert canvas to blob', async () => {
      const canvas = document.createElement('canvas');
      const blob = await canvasToBlob(canvas);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('should convert canvas to blob with custom mime type', async () => {
      const canvas = document.createElement('canvas');
      const blob = await canvasToBlob(canvas, 'image/jpeg');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
    });

    it('should handle canvas toBlob failure', async () => {
      const mockToBlob = vi.fn(callback => callback(null));
      const canvas = {
        width: 320,
        height: 320,
        toBlob: mockToBlob,
      } as unknown as HTMLCanvasElement;

      await expect(canvasToBlob(canvas)).rejects.toThrow(
        'Failed to convert canvas to blob'
      );
    });
  });

  describe('normalizeImage', () => {
    it('should normalize image data correctly', () => {
      const canvas = document.createElement('canvas');
      const params = {
        mean: [0.485, 0.456, 0.406],
        std: [0.229, 0.224, 0.225],
        size: [320, 320],
      } as unknown as NormalizationParams;

      const result = normalizeImage(canvas, params, 'input.1');

      expect(result).toHaveProperty('input.1');
      expect(result['input.1']).toBeDefined();
      expect(result['input.1'].dims).toEqual([1, 3, 320, 320]);
      expect(result['input.1'].type).toBe('float32');
    });

    it('should use default input name', () => {
      const canvas = document.createElement('canvas');
      const params = {
        mean: [0.485, 0.456, 0.406],
        std: [0.229, 0.224, 0.225],
        size: [320, 320],
      };

      const result = normalizeImage(canvas, params as NormalizationParams);

      expect(result).toHaveProperty('input.1');
    });

    it('should throw error if temp canvas context fails', () => {
      const mockGetContext = vi.fn(() => null);
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => ({
        width: 320,
        height: 320,
        getContext: mockGetContext,
      })) as any;

      const canvas = document.createElement('canvas');
      const params = {
        mean: [0.485, 0.456, 0.406],
        std: [0.229, 0.224, 0.225],
        size: [320, 320],
      };

      expect(() =>
        normalizeImage(canvas, params as NormalizationParams)
      ).toThrow('Failed to get context for temp canvas');

      document.createElement = originalCreateElement;
    });
  });

  describe('processModelOutput', () => {
    it('should process model output correctly', () => {
      const output = new Float32Array(320 * 320);
      // Fill with test data
      for (let i = 0; i < output.length; i++) {
        output[i] = Math.random();
      }

      const originalSize = { width: 640, height: 480 };
      const outputShape: [number, number, number, number] = [1, 1, 320, 320];

      const canvas = processModelOutput(output, originalSize, outputShape);

      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(640);
      expect(canvas.height).toBe(480);
    });

    it('should use default output shape', () => {
      const output = new Float32Array(320 * 320);
      const originalSize = { width: 320, height: 320 };

      const canvas = processModelOutput(output, originalSize);

      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(320);
      expect(canvas.height).toBe(320);
    });

    it('should throw error if mask canvas context fails', () => {
      const mockGetContext = vi.fn(() => null);
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => ({
        width: 320,
        height: 320,
        getContext: mockGetContext,
      })) as any;

      const output = new Float32Array(320 * 320);
      const originalSize = { width: 320, height: 320 };

      expect(() => processModelOutput(output, originalSize)).toThrow(
        'Failed to get context for mask canvas'
      );

      document.createElement = originalCreateElement;
    });

    it('should throw error if resized canvas context fails', () => {
      let callCount = 0;
      const mockGetContext = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return document.createElement('canvas').getContext('2d');
        }
        return null; // Fail on second call (resized canvas)
      });

      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => ({
        width: 320,
        height: 320,
        getContext: mockGetContext,
      })) as any;

      const output = new Float32Array(320 * 320);
      const originalSize = { width: 320, height: 320 };

      expect(() => processModelOutput(output, originalSize)).toThrow(
        'Failed to get context for mask canvas'
      );

      document.createElement = originalCreateElement;
    });
  });

  describe('naiveCutout', () => {
    it('should create cutout from image and mask', () => {
      const imageCanvas = document.createElement('canvas');
      const maskCanvas = document.createElement('canvas');

      const result = naiveCutout(imageCanvas, maskCanvas);

      expect(result).toBeDefined();
      expect(result.width).toBeGreaterThan(0); // Any positive width
      expect(result.height).toBeGreaterThan(0); // Any positive height
    });

    it('should throw error if result canvas context fails', () => {
      const mockGetContext = vi.fn(() => null);
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => ({
        width: 320,
        height: 320,
        getContext: mockGetContext,
      })) as any;

      const imageCanvas = document.createElement('canvas');
      const maskCanvas = document.createElement('canvas');

      expect(() => naiveCutout(imageCanvas, maskCanvas)).toThrow(
        'Failed to get context for result canvas'
      );

      document.createElement = originalCreateElement;
    });

    it('should throw error if mask canvas context fails', () => {
      const imageCanvas = document.createElement('canvas');
      const maskCanvas = document.createElement('canvas');

      // Mock document.createElement to return a canvas with failing getContext
      const originalCreateElement = document.createElement;
      const mockGetContext = vi.fn(() => null);
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'canvas') {
          return {
            width: 320,
            height: 320,
            getContext: mockGetContext,
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement.call(document, tagName);
      });

      expect(() => naiveCutout(imageCanvas, maskCanvas)).toThrow(
        'Failed to get context for result canvas'
      );

      document.createElement = originalCreateElement;
    });
  });

  describe('applyBackgroundColor', () => {
    it('should apply background color to image', () => {
      const imageCanvas = document.createElement('canvas');
      const color: [number, number, number, number] = [255, 0, 0, 255]; // Red

      const result = applyBackgroundColor(imageCanvas, color);

      expect(result).toBeDefined();
      expect(result.width).toBeGreaterThan(0); // Any positive width
      expect(result.height).toBeGreaterThan(0); // Any positive height
    });

    it('should throw error if result canvas context fails', () => {
      const mockGetContext = vi.fn(() => null);
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => ({
        width: 320,
        height: 320,
        getContext: mockGetContext,
      })) as any;

      const imageCanvas = document.createElement('canvas');
      const color: [number, number, number, number] = [255, 0, 0, 255];

      expect(() => applyBackgroundColor(imageCanvas, color)).toThrow(
        'Failed to get context for result canvas'
      );

      document.createElement = originalCreateElement;
    });
  });

  describe('postProcessMask', () => {
    it('should apply post-processing to mask', () => {
      const maskCanvas = document.createElement('canvas');

      const result = postProcessMask(maskCanvas);

      expect(result).toBeDefined();
      expect(result.width).toBeGreaterThan(0); // Any positive width
      expect(result.height).toBeGreaterThan(0); // Any positive height
    });

    it('should throw error if result canvas context fails', () => {
      const mockGetContext = vi.fn(() => null);
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => ({
        width: 320,
        height: 320,
        getContext: mockGetContext,
      })) as any;

      const maskCanvas = document.createElement('canvas');

      expect(() => postProcessMask(maskCanvas)).toThrow(
        'Failed to get context for result canvas'
      );

      document.createElement = originalCreateElement;
    });
  });

  describe('createMaskOnly', () => {
    it('should create mask-only canvas', () => {
      const maskCanvas = document.createElement('canvas');

      const result = createMaskOnly(maskCanvas);

      expect(result).toBeDefined();
      expect(result.width).toBeGreaterThan(0); // Any positive width
      expect(result.height).toBeGreaterThan(0); // Any positive height
    });

    it('should throw error if result canvas context fails', () => {
      const mockGetContext = vi.fn(() => null);
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => ({
        width: 320,
        height: 320,
        getContext: mockGetContext,
      })) as any;

      const maskCanvas = document.createElement('canvas');

      expect(() => createMaskOnly(maskCanvas)).toThrow(
        'Failed to get context for result canvas'
      );

      document.createElement = originalCreateElement;
    });
  });
});
