import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import {
  getAvailableModels,
  getCacheStats,
  configureCache,
  clearSessionCache,
  disposeAllSessions,
  clearModelCache,
  clearModelCacheForModel,
} from '../../src/sessionFactory';
import { rembgConfig } from '../../src/config';
import { BaseSession, type SessionOptions } from '../../src/sessions/base';

// Mock the session classes
vi.mock('../../src/sessions/u2net', () => ({
  U2NetSession: vi.fn().mockImplementation(() => ({
    getName: () => 'u2net',
    getOptions: () => ({}),
    dispose: vi.fn(),
  })),
}));

vi.mock('../../src/sessions/u2netp', () => ({
  U2NetpSession: vi.fn().mockImplementation(() => ({
    getName: () => 'u2netp',
    getOptions: () => ({}),
    dispose: vi.fn(),
  })),
}));

vi.mock('../../src/sessions/u2net_human_seg', () => ({
  U2NetHumanSegSession: vi.fn().mockImplementation(() => ({
    getName: () => 'u2net_human_seg',
    getOptions: () => ({}),
    dispose: vi.fn(),
  })),
}));

vi.mock('../../src/sessions/u2net_cloth_seg', () => ({
  U2NetClothSegSession: vi.fn().mockImplementation(() => ({
    getName: () => 'u2net_cloth_seg',
    getOptions: () => ({}),
    dispose: vi.fn(),
  })),
}));

vi.mock('../../src/sessions/isnet_general_use', () => ({
  IsNetGeneralUseSession: vi.fn().mockImplementation(() => ({
    getName: () => 'isnet-general-use',
    getOptions: () => ({}),
    dispose: vi.fn(),
  })),
}));

vi.mock('../../src/sessions/isnet_anime', () => ({
  IsNetAnimeSession: vi.fn().mockImplementation(() => ({
    getName: () => 'isnet-anime',
    getOptions: () => ({}),
    dispose: vi.fn(),
  })),
}));

vi.mock('../../src/sessions/silueta', () => ({
  SiluetaSession: vi.fn().mockImplementation(() => ({
    getName: () => 'silueta',
    getOptions: () => ({}),
    dispose: vi.fn(),
  })),
}));

vi.mock('../../src/sessions/u2net_custom', () => ({
  U2NetCustomSession: vi.fn().mockImplementation(() => ({
    getName: () => 'u2net_custom',
    getOptions: () => ({}),
    dispose: vi.fn(),
  })),
}));

// Mock BaseSession
vi.mock('../../src/sessions/base', () => ({
  BaseSession: {
    clearCache: vi.fn(),
    clearModelCache: vi.fn(),
  },
}));

describe('Session Factory', () => {
  let mockBaseSession = BaseSession as Mocked<typeof BaseSession>;
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset config to defaults
    rembgConfig.resetToDefaults();
    rembgConfig.resetWebNNSettings();
    rembgConfig.resetWebGPUSettings();
    rembgConfig.resetLoggingSettings();
    rembgConfig.resetCacheBypassSettings();
    // Clear session cache
    clearSessionCache();
  });

  describe('getAvailableModels', () => {
    it('should return list of available models', () => {
      const models = getAvailableModels();

      expect(models).toContain('u2net');
      expect(models).toContain('u2netp');
      expect(models).toContain('u2net_human_seg');
      expect(models).toContain('u2net_cloth_seg');
      expect(models).toContain('isnet-general-use');
      expect(models).toContain('isnet-anime');
      expect(models).toContain('silueta');
      expect(models).toContain('u2net_custom');
    });

    it('should return a new array each time', () => {
      const models1 = getAvailableModels();
      const models2 = getAvailableModels();

      expect(models1).toEqual(models2);
      expect(models1).not.toBe(models2); // Different array instances
    });
  });

  describe('getCacheStats', () => {
    it('should return initial cache statistics', () => {
      const stats = getCacheStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('evictions');
      expect(stats).toHaveProperty('totalSessions');
      expect(stats).toHaveProperty('currentSessions');
      expect(stats).toHaveProperty('maxSessions');
      expect(stats).toHaveProperty('hitRate');

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.currentSessions).toBe(0);
      expect(stats.maxSessions).toBe(5);
      expect(stats.hitRate).toBe(0);
    });

    it('should return a new object each time', () => {
      const stats1 = getCacheStats();
      const stats2 = getCacheStats();

      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2); // Different object instances
    });
  });

  describe('configureCache', () => {
    it('should configure max sessions', () => {
      configureCache({ maxSessions: 10 });

      const stats = getCacheStats();
      expect(stats.maxSessions).toBe(10);
    });

    it('should configure max memory', () => {
      configureCache({ maxMemoryMB: 1000 });

      // Note: Memory configuration is stored internally and not exposed in stats
      // This test verifies the function doesn't throw
      expect(() => configureCache({ maxMemoryMB: 1000 })).not.toThrow();
    });

    it('should configure both max sessions and memory', () => {
      configureCache({ maxSessions: 15, maxMemoryMB: 2000 });

      const stats = getCacheStats();
      expect(stats.maxSessions).toBe(15);
    });

    it('should enforce minimum values', () => {
      configureCache({ maxSessions: 0, maxMemoryMB: 500 });

      const stats = getCacheStats();
      expect(stats.maxSessions).toBe(1); // Should be at least 1
    });

    it('should handle undefined values', () => {
      const originalStats = getCacheStats();

      configureCache({});

      const newStats = getCacheStats();
      expect(newStats.maxSessions).toBe(originalStats.maxSessions);
    });
  });

  describe('clearSessionCache', () => {
    it('should clear session cache and reset statistics', () => {
      // First, get initial stats
      const initialStats = getCacheStats();

      // Clear cache
      clearSessionCache();

      const clearedStats = getCacheStats();
      expect(clearedStats.currentSessions).toBe(0);
      expect(clearedStats.hits).toBe(0);
      expect(clearedStats.misses).toBe(0);
      expect(clearedStats.evictions).toBe(0);
      expect(clearedStats.totalSessions).toBe(0);
    });

    it('should not affect max sessions configuration', () => {
      configureCache({ maxSessions: 10 });
      clearSessionCache();

      const stats = getCacheStats();
      expect(stats.maxSessions).toBe(10);
    });
  });

  describe('disposeAllSessions', () => {
    it('should dispose all cached sessions', async () => {
      // This test verifies the function doesn't throw
      // In a real scenario, there would be cached sessions to dispose
      await expect(disposeAllSessions()).resolves.toBeUndefined();
    });

    it('should clear cache after disposing sessions', async () => {
      await disposeAllSessions();

      const stats = getCacheStats();
      expect(stats.currentSessions).toBe(0);
    });
  });

  describe('clearModelCache', () => {
    it('should clear all cached models', async () => {
      await clearModelCache();

      expect(BaseSession.clearCache).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockBaseSession.clearCache.mockRejectedValueOnce(
        new Error('Clear failed')
      );

      await expect(clearModelCache()).rejects.toThrow('Clear failed');
    });
  });

  describe('clearModelCacheForModel', () => {
    it('should clear cache for specific model', async () => {
      await clearModelCacheForModel('u2net');

      expect(BaseSession.clearModelCache).toHaveBeenCalledWith('u2net');
    });

    it('should handle errors gracefully', async () => {
      mockBaseSession.clearModelCache.mockRejectedValueOnce(
        new Error('Clear failed')
      );

      await expect(clearModelCacheForModel('u2net')).rejects.toThrow(
        'Clear failed'
      );
    });
  });

  describe('Integration with Config', () => {
    it('should respect global WebNN settings', () => {
      rembgConfig.enableWebNN(true);
      rembgConfig.setWebNNDeviceType('cpu');
      rembgConfig.setWebNNPowerPreference('low-power');

      // The session factory should merge these global settings
      // This is tested indirectly through the newSession function
      expect(rembgConfig.isWebNNEnabled()).toBe(true);
      expect(rembgConfig.getWebNNDeviceType()).toBe('cpu');
      expect(rembgConfig.getWebNNPowerPreference()).toBe('low-power');
    });

    it('should respect global WebGPU settings', () => {
      rembgConfig.enableWebGPU(true);
      rembgConfig.setWebGPUPowerPreference('high-performance');

      expect(rembgConfig.isWebGPUEnabled()).toBe(true);
      expect(rembgConfig.getWebGPUPowerPreference()).toBe('high-performance');
    });

    it('should respect global cache bypass settings', () => {
      rembgConfig.setSessionCacheBypass(true);
      rembgConfig.setModelCacheBypass(true);

      expect(rembgConfig.isSessionCacheBypassEnabled()).toBe(true);
      expect(rembgConfig.isModelCacheBypassEnabled()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty model name', () => {
      const models = getAvailableModels();
      expect(models).not.toContain('');
      expect(models).not.toContain(null);
      expect(models).not.toContain(undefined);
    });

    it('should handle negative cache configuration', () => {
      configureCache({ maxSessions: -5, maxMemoryMB: -100 });

      const stats = getCacheStats();
      expect(stats.maxSessions).toBe(1); // Should be at least 1
    });

    it('should handle very large cache configuration', () => {
      configureCache({ maxSessions: 1000, maxMemoryMB: 10000 });

      const stats = getCacheStats();
      expect(stats.maxSessions).toBe(1000);
    });

    it('should handle multiple cache operations', () => {
      configureCache({ maxSessions: 3 });
      clearSessionCache();
      configureCache({ maxSessions: 7 });

      const stats = getCacheStats();
      expect(stats.maxSessions).toBe(7);
      expect(stats.currentSessions).toBe(0);
    });
  });
});
