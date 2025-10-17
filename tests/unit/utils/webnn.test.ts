import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isWebNNAvailable,
  getExecutionProviders,
  validateWebNNConfig,
  getWebNNContextOptions,
  isWebNNDeviceSupported,
  getWebNNInfo,
  logWebNNInfo,
} from '../../../src/utils/webnn';
import { mockWebNN } from '../../mocks/navigator';
import type { SessionOptions } from '../../../src/sessions/base';

describe('WebNN Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isWebNNAvailable', () => {
    it('should return true when WebNN is available', () => {
      // Mock navigator with WebNN support
      Object.defineProperty(global, 'navigator', {
        value: {
          ml: mockWebNN,
        },
        writable: true,
      });

      const isAvailable = isWebNNAvailable();
      expect(isAvailable).toBe(true);
    });

    it('should return false when navigator is undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
      });

      const isAvailable = isWebNNAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should return false when ml is not in navigator', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
      });

      const isAvailable = isWebNNAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should return false when ml is null', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ml: null,
        },
        writable: true,
      });

      const isAvailable = isWebNNAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should handle errors gracefully', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          get ml() {
            throw new Error('Access denied');
          },
        },
        writable: true,
      });

      const isAvailable = isWebNNAvailable();
      expect(isAvailable).toBe(false);
    });
  });

  describe('getExecutionProviders', () => {
    beforeEach(() => {
      // Set up default navigator with WebNN support
      Object.defineProperty(global, 'navigator', {
        value: {
          ml: mockWebNN,
          gpu: {
            requestAdapter: vi.fn().mockResolvedValue({}),
          },
        },
        writable: true,
      });
    });

    it('should use explicit execution providers when provided', () => {
      const options: SessionOptions = {
        executionProviders: ['cpu', 'webgl'],
      };

      const providers = getExecutionProviders(options);
      expect(providers).toEqual(['cpu', 'webgl']);
    });

    it('should add WebNN when preferred and available', () => {
      const options: SessionOptions = {
        preferWebNN: true,
      };

      const providers = getExecutionProviders(options);
      expect(providers).toContain('webnn');
      expect(providers).toContain('webgl');
      expect(providers).toContain('cpu');
    });

    it('should not add WebNN when not preferred', () => {
      const options: SessionOptions = {
        preferWebNN: false,
      };

      const providers = getExecutionProviders(options);
      expect(providers).not.toContain('webnn');
      expect(providers).toEqual(['webgl', 'cpu']);
    });

    it('should not add WebNN when not available', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ml: null,
          gpu: {
            requestAdapter: vi.fn().mockResolvedValue({}),
          },
        },
        writable: true,
      });

      const options: SessionOptions = {
        preferWebNN: true,
      };

      const providers = getExecutionProviders(options);
      expect(providers).not.toContain('webnn');
      expect(providers).toEqual(['webgl', 'cpu']);
    });

    it('should add WebGPU when preferred and available', () => {
      const options: SessionOptions = {
        preferWebGPU: true,
      };

      const providers = getExecutionProviders(options);
      expect(providers).toContain('webgpu');
      expect(providers).toContain('webgl');
      expect(providers).toContain('cpu');
    });

    it('should add both WebNN and WebGPU when both preferred', () => {
      const options: SessionOptions = {
        preferWebNN: true,
        preferWebGPU: true,
      };

      const providers = getExecutionProviders(options);
      expect(providers).toContain('webnn');
      expect(providers).toContain('webgpu');
      expect(providers).toContain('webgl');
      expect(providers).toContain('cpu');
    });

    it('should handle empty options', () => {
      const providers = getExecutionProviders();
      expect(providers).toEqual(['webgl', 'cpu']);
    });

    it('should handle undefined options', () => {
      const providers = getExecutionProviders({});
      expect(providers).toEqual(['webgl', 'cpu']);
    });
  });

  describe('validateWebNNConfig', () => {
    it('should return true for valid device type', () => {
      const options: SessionOptions = {
        webnnDeviceType: 'cpu',
      };

      const isValid = validateWebNNConfig(options);
      expect(isValid).toBe(true);
    });

    it('should return true for valid power preference', () => {
      const options: SessionOptions = {
        webnnPowerPreference: 'high-performance',
      };

      const isValid = validateWebNNConfig(options);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid device type', () => {
      const options: SessionOptions = {
        webnnDeviceType: 'invalid' as any,
      };

      const isValid = validateWebNNConfig(options);
      expect(isValid).toBe(false);
    });

    it('should return false for invalid power preference', () => {
      const options: SessionOptions = {
        webnnPowerPreference: 'invalid' as any,
      };

      const isValid = validateWebNNConfig(options);
      expect(isValid).toBe(false);
    });

    it('should return false for invalid WebGPU power preference', () => {
      const options: SessionOptions = {
        webgpuPowerPreference: 'invalid' as any,
      };

      const isValid = validateWebNNConfig(options);
      expect(isValid).toBe(false);
    });

    it('should return true for valid WebGPU power preference', () => {
      const options: SessionOptions = {
        webgpuPowerPreference: 'low-power',
      };

      const isValid = validateWebNNConfig(options);
      expect(isValid).toBe(true);
    });

    it('should return true for empty options', () => {
      const isValid = validateWebNNConfig({});
      expect(isValid).toBe(true);
    });

    it('should return true for undefined options', () => {
      const isValid = validateWebNNConfig(undefined as any);
      expect(isValid).toBe(true);
    });
  });

  describe('getWebNNContextOptions', () => {
    it('should return context options with device type', () => {
      const options: SessionOptions = {
        webnnDeviceType: 'gpu',
        webnnPowerPreference: 'high-performance',
      };

      const contextOptions = getWebNNContextOptions(options);
      expect(contextOptions.deviceType).toBe('gpu');
      expect(contextOptions.powerPreference).toBe('high-performance');
    });

    it('should return empty object for empty options', () => {
      const contextOptions = getWebNNContextOptions({});
      expect(contextOptions).toEqual({});
    });

    it('should only include defined options', () => {
      const options: SessionOptions = {
        webnnDeviceType: 'cpu',
        // webnnPowerPreference is undefined
      };

      const contextOptions = getWebNNContextOptions(options);
      expect(contextOptions.deviceType).toBe('cpu');
      expect(contextOptions.powerPreference).toBeUndefined();
    });
  });

  describe('isWebNNDeviceSupported', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ml: mockWebNN,
        },
        writable: true,
      });
    });

    it('should return false when WebNN is not available', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ml: null,
        },
        writable: true,
      });

      const isSupported = await isWebNNDeviceSupported('gpu');
      expect(isSupported).toBe(false);
    });

    it('should return true for supported device type', async () => {
      const isSupported = await isWebNNDeviceSupported('gpu');
      expect(isSupported).toBe(true);
      expect(mockWebNN.createContext).toHaveBeenCalledWith({
        deviceType: 'gpu',
      });
    });

    it('should return false for unsupported device type', async () => {
      mockWebNN.createContext.mockRejectedValueOnce(
        new Error('Device type not supported')
      );

      const isSupported = await isWebNNDeviceSupported(
        'unsupported' as 'cpu' | 'gpu' | 'npu'
      );
      expect(isSupported).toBe(false);
    });

    it('should handle createContext errors', async () => {
      mockWebNN.createContext.mockRejectedValueOnce(
        new Error('Context creation failed')
      );

      const isSupported = await isWebNNDeviceSupported('gpu');
      expect(isSupported).toBe(false);
    });
  });

  describe('getWebNNInfo', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ml: mockWebNN,
          userAgent: 'Mozilla/5.0 (Test Browser)',
        },
        writable: true,
      });
    });

    it('should return info when WebNN is available', async () => {
      const info = await getWebNNInfo();

      expect(info.available).toBe(true);
      expect(info.userAgent).toBe('Mozilla/5.0 (Test Browser)');
      expect(Array.isArray(info.supportedDevices)).toBe(true);
    });

    it('should return info when WebNN is not available', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ml: null,
          userAgent: 'Mozilla/5.0 (Test Browser)',
        },
        writable: true,
      });

      const info = await getWebNNInfo();

      expect(info.available).toBe(false);
      expect(info.userAgent).toBe('Mozilla/5.0 (Test Browser)');
      expect(info.supportedDevices).toEqual([]);
    });

    it('should handle undefined navigator', async () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
      });

      const info = await getWebNNInfo();

      expect(info.available).toBe(false);
      expect(info.userAgent).toBe('unknown');
      expect(info.supportedDevices).toEqual([]);
    });

    it('should test all device types', async () => {
      const info = await getWebNNInfo();

      // Should have called createContext for each device type
      expect(mockWebNN.createContext).toHaveBeenCalledWith({
        deviceType: 'cpu',
      });
      expect(mockWebNN.createContext).toHaveBeenCalledWith({
        deviceType: 'gpu',
      });
      expect(mockWebNN.createContext).toHaveBeenCalledWith({
        deviceType: 'npu',
      });
    });
  });

  describe('logWebNNInfo', () => {
    it('should log available WebNN info', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const { enableGeneralLogging } = await import('rembg-web/utils/logger');

      // Enable general logging for this test
      enableGeneralLogging(true);

      Object.defineProperty(global, 'navigator', {
        value: {
          ml: mockWebNN,
          userAgent: 'Mozilla/5.0 (Test Browser)',
        },
        writable: true,
      });

      await logWebNNInfo();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/WebNN Support: Available/)
      );
    });

    it('should log unavailable WebNN info', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const { enableGeneralLogging } = await import('rembg-web/utils/logger');

      // Enable general logging for this test
      enableGeneralLogging(true);

      Object.defineProperty(global, 'navigator', {
        value: {
          ml: null,
          userAgent: 'Mozilla/5.0 (Test Browser)',
        },
        writable: true,
      });

      await logWebNNInfo();

      expect(consoleSpy).toHaveBeenCalledWith('WebNN Support: Not Available');
    });
  });

  describe('Edge Cases', () => {
    it('should handle navigator.ml being undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          // ml is undefined
        },
        writable: true,
      });

      const isAvailable = isWebNNAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should handle navigator.ml being a function', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ml: vi.fn(),
        },
        writable: true,
      });

      const isAvailable = isWebNNAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should handle createContext returning null', async () => {
      mockWebNN.createContext.mockResolvedValueOnce(null as any);

      const isSupported = await isWebNNDeviceSupported('gpu');
      expect(isSupported).toBe(false);
    });

    it('should handle createContext returning undefined', async () => {
      mockWebNN.createContext.mockResolvedValueOnce(undefined as any);

      const isSupported = await isWebNNDeviceSupported('gpu');
      expect(isSupported).toBe(false);
    });
  });
});
