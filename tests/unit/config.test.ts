import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RembgConfig, rembgConfig } from '../../src/config';

describe('RembgConfig', () => {
  let config: RembgConfig;

  beforeEach(() => {
    // Get a fresh instance for each test
    config = RembgConfig.getInstance();
    // Reset to defaults (this will reset baseUrl to '/models')
    config.resetToDefaults();
    config.resetWebNNSettings();
    config.resetWebGPUSettings();
    config.resetLoggingSettings();
    config.resetCacheBypassSettings();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RembgConfig.getInstance();
      const instance2 = RembgConfig.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as rembgConfig export', () => {
      const instance = RembgConfig.getInstance();
      expect(instance).toBe(rembgConfig);
    });
  });

  describe('Base URL Configuration', () => {
    it('should have default base URL', () => {
      expect(config.getBaseUrl()).toBe('/models');
    });

    it('should set and get base URL', () => {
      config.setBaseUrl('/custom-models');
      expect(config.getBaseUrl()).toBe('/custom-models');
    });

    it('should log when setting base URL', () => {
      config.enableGeneralLogging(true);

      const consoleSpy = vi.spyOn(console, 'log');
      config.setBaseUrl('/custom-models');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Set base URL for models: /custom-models'
      );
    });
  });

  describe('Model Path Management', () => {
    it('should have default model paths', () => {
      const paths = config.getAllModelPaths();
      expect(paths.get('u2net')).toBeUndefined();
      expect(paths.get('u2netp')).toBeUndefined();
      expect(paths.get('u2net_human_seg')).toBeUndefined();
      expect(paths.get('u2net_cloth_seg')).toBeUndefined();
      expect(paths.get('isnet-general-use')).toBeUndefined();
      expect(paths.get('isnet-anime')).toBeUndefined();
      expect(paths.get('silueta')).toBeUndefined();
      expect(paths.get('u2net_custom')).toBeUndefined();
    });

    it('should set and get custom model paths', () => {
      const customPath = '/custom/path/model.onnx';
      config.setCustomModelPath('u2net', customPath);

      expect(config.getCustomModelPath('u2net')).toBe(customPath);
      expect(config.hasCustomPath('u2net')).toBe(true);
    });

    it('should return undefined for non-existent model', () => {
      expect(config.getCustomModelPath('nonexistent')).toBeUndefined();
      expect(config.hasCustomPath('nonexistent')).toBe(false);
    });

    it('should remove custom paths', () => {
      config.setCustomModelPath('u2net', '/custom/path');
      expect(config.hasCustomPath('u2net')).toBe(true);

      config.removeCustomPath('u2net');
      expect(config.hasCustomPath('u2net')).toBe(false);
    });

    it('should reset to defaults', () => {
      config.setCustomModelPath('u2net', '/custom/path');
      config.resetToDefaults();

      expect(config.getCustomModelPath('u2net')).toBeUndefined();
    });

    it('should get available models', () => {
      const models = config.getAvailableModels();
      expect(models).toContain('u2net');
      expect(models).toContain('u2netp');
      expect(models).toContain('u2net_human_seg');
      expect(models).toContain('u2net_cloth_seg');
      expect(models).toContain('isnet-general-use');
      expect(models).toContain('isnet-anime');
      expect(models).toContain('silueta');
      expect(models).toContain('u2net_custom');
    });
  });

  describe('WebNN Configuration', () => {
    it('should have default WebNN settings', () => {
      expect(config.isWebNNEnabled()).toBe(false);
      expect(config.getWebNNDeviceType()).toBe('gpu');
      expect(config.getWebNNPowerPreference()).toBe('default');
    });

    it('should enable/disable WebNN', () => {
      config.enableWebNN(true);
      expect(config.isWebNNEnabled()).toBe(true);

      config.enableWebNN(false);
      expect(config.isWebNNEnabled()).toBe(false);
    });

    it('should set WebNN device type', () => {
      config.setWebNNDeviceType('cpu');
      expect(config.getWebNNDeviceType()).toBe('cpu');

      config.setWebNNDeviceType('npu');
      expect(config.getWebNNDeviceType()).toBe('npu');
    });

    it('should set WebNN power preference', () => {
      config.setWebNNPowerPreference('high-performance');
      expect(config.getWebNNPowerPreference()).toBe('high-performance');

      config.setWebNNPowerPreference('low-power');
      expect(config.getWebNNPowerPreference()).toBe('low-power');
    });

    it('should get WebNN config', () => {
      config.enableWebNN(true);
      config.setWebNNDeviceType('cpu');
      config.setWebNNPowerPreference('high-performance');

      const webnnConfig = config.getWebNNConfig();
      expect(webnnConfig).toEqual({
        enabled: true,
        deviceType: 'cpu',
        powerPreference: 'high-performance',
      });
    });

    it('should reset WebNN settings', () => {
      config.enableWebNN(true);
      config.setWebNNDeviceType('cpu');
      config.setWebNNPowerPreference('high-performance');

      config.resetWebNNSettings();

      expect(config.isWebNNEnabled()).toBe(false);
      expect(config.getWebNNDeviceType()).toBe('gpu');
      expect(config.getWebNNPowerPreference()).toBe('default');
    });
  });

  describe('WebGPU Configuration', () => {
    it('should have default WebGPU settings', () => {
      expect(config.isWebGPUEnabled()).toBe(false);
      expect(config.getWebGPUPowerPreference()).toBe('default');
    });

    it('should enable/disable WebGPU', () => {
      config.enableWebGPU(true);
      expect(config.isWebGPUEnabled()).toBe(true);

      config.enableWebGPU(false);
      expect(config.isWebGPUEnabled()).toBe(false);
    });

    it('should set WebGPU power preference', () => {
      config.setWebGPUPowerPreference('high-performance');
      expect(config.getWebGPUPowerPreference()).toBe('high-performance');

      config.setWebGPUPowerPreference('low-power');
      expect(config.getWebGPUPowerPreference()).toBe('low-power');
    });

    it('should get WebGPU config', () => {
      config.enableWebGPU(true);
      config.setWebGPUPowerPreference('high-performance');

      const webgpuConfig = config.getWebGPUConfig();
      expect(webgpuConfig).toEqual({
        enabled: true,
        powerPreference: 'high-performance',
      });
    });

    it('should reset WebGPU settings', () => {
      config.enableWebGPU(true);
      config.setWebGPUPowerPreference('high-performance');

      config.resetWebGPUSettings();

      expect(config.isWebGPUEnabled()).toBe(false);
      expect(config.getWebGPUPowerPreference()).toBe('default');
    });
  });

  describe('Logging Configuration', () => {
    it('should have default logging settings', () => {
      expect(config.isGeneralLoggingEnabled()).toBe(false);
      expect(config.isPerformanceLoggingEnabled()).toBe(false);
      expect(config.isONNXProfilingEnabled()).toBe(false);
    });

    it('should enable/disable general logging', () => {
      config.enableGeneralLogging(true);
      expect(config.isGeneralLoggingEnabled()).toBe(true);

      config.enableGeneralLogging(false);
      expect(config.isGeneralLoggingEnabled()).toBe(false);
    });

    it('should enable/disable performance logging', () => {
      config.enablePerformanceLogging(true);
      expect(config.isPerformanceLoggingEnabled()).toBe(true);

      config.enablePerformanceLogging(false);
      expect(config.isPerformanceLoggingEnabled()).toBe(false);
    });

    it('should enable/disable ONNX profiling', () => {
      config.enableONNXProfiling(true);
      expect(config.isONNXProfilingEnabled()).toBe(true);

      config.enableONNXProfiling(false);
      expect(config.isONNXProfilingEnabled()).toBe(false);
    });

    it('should get logging config', () => {
      config.enableGeneralLogging(true);
      config.enablePerformanceLogging(true);
      config.enableONNXProfiling(true);

      const loggingConfig = config.getLoggingConfig();
      expect(loggingConfig).toEqual({
        generalLogging: true,
        performanceLogging: true,
        onnxProfiling: true,
      });
    });

    it('should reset logging settings', () => {
      config.enableGeneralLogging(true);
      config.enablePerformanceLogging(true);
      config.enableONNXProfiling(true);

      config.resetLoggingSettings();

      expect(config.isGeneralLoggingEnabled()).toBe(false);
      expect(config.isPerformanceLoggingEnabled()).toBe(false);
      expect(config.isONNXProfilingEnabled()).toBe(false);
    });
  });

  describe('Cache Bypass Configuration', () => {
    it('should have default cache bypass settings', () => {
      expect(config.isSessionCacheBypassEnabled()).toBe(false);
      expect(config.isModelCacheBypassEnabled()).toBe(false);
    });

    it('should set session cache bypass', () => {
      config.setSessionCacheBypass(true);
      expect(config.isSessionCacheBypassEnabled()).toBe(true);

      config.setSessionCacheBypass(false);
      expect(config.isSessionCacheBypassEnabled()).toBe(false);
    });

    it('should set model cache bypass', () => {
      config.setModelCacheBypass(true);
      expect(config.isModelCacheBypassEnabled()).toBe(true);

      config.setModelCacheBypass(false);
      expect(config.isModelCacheBypassEnabled()).toBe(false);
    });

    it('should get cache bypass config', () => {
      config.setSessionCacheBypass(true);
      config.setModelCacheBypass(true);

      const cacheBypassConfig = config.getCacheBypassConfig();
      expect(cacheBypassConfig).toEqual({
        sessionCacheBypass: true,
        modelCacheBypass: true,
      });
    });

    it('should reset cache bypass settings', () => {
      config.setSessionCacheBypass(true);
      config.setModelCacheBypass(true);

      config.resetCacheBypassSettings();

      expect(config.isSessionCacheBypassEnabled()).toBe(false);
      expect(config.isModelCacheBypassEnabled()).toBe(false);
    });
  });

  describe('Console Logging', () => {
    it('should log when setting model paths', () => {
      config.enableGeneralLogging(true);

      const consoleSpy = vi.spyOn(console, 'log');
      config.setCustomModelPath('u2net', '/custom/path');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Set custom model path for u2net: /custom/path'
      );
    });

    it('should log when removing custom paths', () => {
      config.enableGeneralLogging(true);

      const consoleSpy = vi.spyOn(console, 'log');
      config.setCustomModelPath('u2net', '/custom/path');
      config.removeCustomPath('u2net');
      expect(consoleSpy).toHaveBeenCalledWith('Removed custom path for u2net');
    });

    it('should log when resetting to defaults', () => {
      config.enableGeneralLogging(true);

      const consoleSpy = vi.spyOn(console, 'log');
      config.resetToDefaults();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Reset all model paths to defaults'
      );
    });

    it('should log WebNN configuration changes', () => {
      config.enableGeneralLogging(true);

      const consoleSpy = vi.spyOn(console, 'log');
      config.enableWebNN(true);
      expect(consoleSpy).toHaveBeenCalledWith('WebNN support enabled globally');

      config.setWebNNDeviceType('cpu');
      expect(consoleSpy).toHaveBeenCalledWith('WebNN device type set to: cpu');

      config.setWebNNPowerPreference('high-performance');
      expect(consoleSpy).toHaveBeenCalledWith(
        'WebNN power preference set to: high-performance'
      );
    });

    it('should log WebGPU configuration changes', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      config.enableGeneralLogging(true);

      config.enableWebGPU(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'WebGPU support enabled globally'
      );

      config.setWebGPUPowerPreference('high-performance');
      expect(consoleSpy).toHaveBeenCalledWith(
        'WebGPU power preference set to: high-performance'
      );
    });

    it('should log logging configuration changes', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      config.enableGeneralLogging(true);
      expect(consoleSpy).toHaveBeenCalledWith('General logging enabled');

      config.enablePerformanceLogging(true);
      expect(consoleSpy).toHaveBeenCalledWith('Performance logging enabled');

      config.enableONNXProfiling(true);
      expect(consoleSpy).toHaveBeenCalledWith('ONNX profiling enabled');
    });

    it('should log cache bypass configuration changes', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      config.enableGeneralLogging(true);

      config.setSessionCacheBypass(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Session cache bypass enabled globally'
      );

      config.setModelCacheBypass(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Model cache bypass enabled globally'
      );
    });
  });
});
