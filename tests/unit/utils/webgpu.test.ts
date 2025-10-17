import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isWebGPUAvailable,
  getWebGPUDevice,
  validateWebGPUConfig,
  getWebGPUContextOptions,
  getWebGPUInfo,
  logWebGPUInfo,
} from 'rembg-web/utils/webgpu';
import { mockWebGPU, mockWebGPUAdapter } from '../../mocks/navigator';
import type { SessionOptions } from 'rembg-web/sessions/base';

describe('WebGPU Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isWebGPUAvailable', () => {
    it('should return true when WebGPU is available', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          gpu: mockWebGPU,
        },
        writable: true,
      });

      const isAvailable = isWebGPUAvailable();
      expect(isAvailable).toBe(true);
    });

    it('should return false when navigator is undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
      });

      const isAvailable = isWebGPUAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should return false when gpu is not in navigator', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
      });

      const isAvailable = isWebGPUAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should return false when gpu is null', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          gpu: null,
        },
        writable: true,
      });

      const isAvailable = isWebGPUAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should handle errors gracefully', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          get gpu() {
            throw new Error('Access denied');
          },
        },
        writable: true,
      });

      const isAvailable = isWebGPUAvailable();
      expect(isAvailable).toBe(false);
    });
  });

  describe('getWebGPUDevice', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: {
          gpu: mockWebGPU,
        },
        writable: true,
      });
    });

    it('should return device when WebGPU is available', async () => {
      const device = await getWebGPUDevice();

      expect(device).toBeDefined();
      expect(mockWebGPU.requestAdapter).toHaveBeenCalledWith(undefined);
    });

    it('should return null when adapter is not available', async () => {
      mockWebGPU.requestAdapter.mockResolvedValueOnce(null);

      const device = await getWebGPUDevice();

      expect(device).toBeNull();
    });

    it('should return null when WebGPU is not available', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          gpu: null,
        },
        writable: true,
      });

      const device = await getWebGPUDevice();

      expect(device).toBeNull();
    });

    it('should handle requestAdapter errors', async () => {
      mockWebGPU.requestAdapter.mockRejectedValueOnce(
        new Error('Adapter request failed')
      );

      const device = await getWebGPUDevice();

      expect(device).toBeNull();
    });

    it('should handle requestDevice errors', async () => {
      mockWebGPUAdapter.requestDevice.mockRejectedValueOnce(
        new Error('Device request failed')
      );

      const device = await getWebGPUDevice();

      expect(device).toBeNull();
    });

    it('should pass power preference to requestAdapter', async () => {
      const device = await getWebGPUDevice({
        powerPreference: 'high-performance',
      });

      expect(mockWebGPU.requestAdapter).toHaveBeenCalledWith({
        powerPreference: 'high-performance',
      });
    });
  });

  describe('validateWebGPUConfig', () => {
    it('should return true for valid power preference', () => {
      const options: SessionOptions = {
        webgpuPowerPreference: 'high-performance',
      };

      const isValid = validateWebGPUConfig(options);
      expect(isValid).toBe(true);
    });

    it('should return true for low-power preference', () => {
      const options: SessionOptions = {
        webgpuPowerPreference: 'low-power',
      };

      const isValid = validateWebGPUConfig(options);
      expect(isValid).toBe(true);
    });

    it('should return true for default preference', () => {
      const options: SessionOptions = {
        webgpuPowerPreference: 'default',
      };

      const isValid = validateWebGPUConfig(options);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid power preference', () => {
      const options: SessionOptions = {
        webgpuPowerPreference: 'invalid' as any,
      };

      const isValid = validateWebGPUConfig(options);
      expect(isValid).toBe(false);
    });

    it('should return true for empty options', () => {
      const isValid = validateWebGPUConfig({});
      expect(isValid).toBe(true);
    });

    it('should return true for undefined options', () => {
      const isValid = validateWebGPUConfig(undefined as any);
      expect(isValid).toBe(true);
    });
  });

  describe('getWebGPUContextOptions', () => {
    it('should return context options with power preference', () => {
      const options: SessionOptions = {
        webgpuPowerPreference: 'high-performance',
      };

      const contextOptions = getWebGPUContextOptions(options);
      expect(contextOptions.powerPreference).toBe('high-performance');
    });

    it('should return empty object for empty options', () => {
      const contextOptions = getWebGPUContextOptions({});
      expect(contextOptions).toEqual({});
    });

    it('should only include defined options', () => {
      const options: SessionOptions = {
        webgpuPowerPreference: 'low-power',
        // Other options are undefined
      };

      const contextOptions = getWebGPUContextOptions(options);
      expect(contextOptions.powerPreference).toBe('low-power');
      expect(Object.keys(contextOptions)).toEqual(['powerPreference']);
    });
  });

  describe('getWebGPUInfo', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: {
          gpu: mockWebGPU,
          userAgent: 'Mozilla/5.0 (Test Browser)',
        },
        writable: true,
      });
    });

    it('should return info when WebGPU is available', async () => {
      const info = await getWebGPUInfo();

      expect(info.available).toBe(true);
      expect(info.userAgent).toBe('Mozilla/5.0 (Test Browser)');
      expect(info.adapterInfo).toBeDefined();
    });

    it('should return info when WebGPU is not available', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          gpu: null,
          userAgent: 'Mozilla/5.0 (Test Browser)',
        },
        writable: true,
      });

      const info = await getWebGPUInfo();

      expect(info.available).toBe(false);
      expect(info.userAgent).toBe('Mozilla/5.0 (Test Browser)');
      expect(info.adapterInfo).toBeNull();
    });

    it('should handle undefined navigator', async () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
      });

      const info = await getWebGPUInfo();

      expect(info.available).toBe(false);
      expect(info.userAgent).toBe('unknown');
      expect(info.adapterInfo).toBeNull();
    });

    it('should handle adapter request failure', async () => {
      mockWebGPU.requestAdapter.mockResolvedValueOnce(null);

      const info = await getWebGPUInfo();

      expect(info.available).toBe(true);
      expect(info.adapterInfo).toBeNull();
    });

    it('should handle device request failure', async () => {
      mockWebGPUAdapter.requestDevice.mockRejectedValueOnce(
        new Error('Device request failed')
      );

      const info = await getWebGPUInfo();

      expect(info.available).toBe(true);
      expect(info.adapterInfo).toBeDefined();
    });
  });

  describe('logWebGPUInfo', () => {
    it('should log available WebGPU info', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const { enableGeneralLogging } = await import('rembg-web/utils/logger');

      // Enable general logging for this test
      enableGeneralLogging(true);

      Object.defineProperty(global, 'navigator', {
        value: {
          gpu: mockWebGPU,
          userAgent: 'Mozilla/5.0 (Test Browser)',
        },
        writable: true,
      });

      await logWebGPUInfo();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/WebGPU Support: Available/)
      );
    });

    it('should log unavailable WebGPU info', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const { enableGeneralLogging } = await import('rembg-web/utils/logger');

      // Enable general logging for this test
      enableGeneralLogging(true);

      Object.defineProperty(global, 'navigator', {
        value: {
          gpu: null,
          userAgent: 'Mozilla/5.0 (Test Browser)',
        },
        writable: true,
      });

      await logWebGPUInfo();

      expect(consoleSpy).toHaveBeenCalledWith('WebGPU Support: Not Available');
    });
  });

  describe('Edge Cases', () => {
    it('should handle navigator.gpu being undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          // gpu is undefined
        },
        writable: true,
      });

      const isAvailable = isWebGPUAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should handle navigator.gpu being a function', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          gpu: vi.fn(),
        },
        writable: true,
      });

      const isAvailable = isWebGPUAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should handle requestAdapter returning undefined', async () => {
      mockWebGPU.requestAdapter.mockResolvedValueOnce(undefined as any);

      const device = await getWebGPUDevice();
      expect(device).toBeNull();
    });

    it('should handle requestDevice returning undefined', async () => {
      mockWebGPUAdapter.requestDevice.mockResolvedValueOnce(undefined as any);

      const device = await getWebGPUDevice();
      expect(device).toBeNull();
    });

    it('should handle multiple power preference values', async () => {
      // Set up the mock for this test
      Object.defineProperty(global, 'navigator', {
        value: {
          gpu: mockWebGPU,
        },
        writable: true,
      });

      const powerPreferences = ['default', 'low-power', 'high-performance'];

      for (const preference of powerPreferences) {
        await getWebGPUDevice({ powerPreference: preference as any });
      }

      expect(mockWebGPU.requestAdapter).toHaveBeenCalledTimes(3);
      expect(mockWebGPU.requestAdapter).toHaveBeenNthCalledWith(1, {
        powerPreference: 'default',
      });
      expect(mockWebGPU.requestAdapter).toHaveBeenNthCalledWith(2, {
        powerPreference: 'low-power',
      });
      expect(mockWebGPU.requestAdapter).toHaveBeenNthCalledWith(3, {
        powerPreference: 'high-performance',
      });
    });
  });

  describe('Integration with Session Options', () => {
    it('should work with session options containing WebGPU preferences', () => {
      const options: SessionOptions = {
        preferWebGPU: true,
        webgpuPowerPreference: 'high-performance',
      };

      const isValid = validateWebGPUConfig(options);
      expect(isValid).toBe(true);

      const contextOptions = getWebGPUContextOptions(options);
      expect(contextOptions.powerPreference).toBe('high-performance');
    });

    it('should handle mixed WebNN and WebGPU options', () => {
      const options: SessionOptions = {
        preferWebNN: true,
        preferWebGPU: true,
        webnnDeviceType: 'gpu',
        webgpuPowerPreference: 'low-power',
      };

      const isValid = validateWebGPUConfig(options);
      expect(isValid).toBe(true);

      const contextOptions = getWebGPUContextOptions(options);
      expect(contextOptions.powerPreference).toBe('low-power');
    });
  });
});
