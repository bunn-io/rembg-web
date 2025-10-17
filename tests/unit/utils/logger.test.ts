import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  logInfo,
  logDebug,
  logPerformance,
  logWarn,
  logError,
  enableGeneralLogging,
  enablePerformanceLogging,
  enableONNXProfiling,
  isGeneralLoggingEnabled,
  isPerformanceLoggingEnabled,
  isONNXProfilingEnabled,
} from '../../../src/utils/logger';
import { rembgConfig } from '../../../src/config';

describe('Logger Utilities', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Reset config to defaults
    rembgConfig.resetLoggingSettings();

    // Clear all mocks
    vi.clearAllMocks();

    // Set up console spies
    consoleSpy = {
      log: vi.spyOn(console, 'log'),
      warn: vi.spyOn(console, 'warn'),
      error: vi.spyOn(console, 'error'),
    };

    // Clear any previous calls
    consoleSpy.log.mockClear();
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
  });

  describe('logInfo', () => {
    it('should log when general logging is enabled', () => {
      enableGeneralLogging(true);

      logInfo('Test info message');

      expect(consoleSpy.log).toHaveBeenCalledWith('Test info message');
    });

    it('should not log when general logging is disabled', () => {
      enableGeneralLogging(false);

      // Clear the log from the enableGeneralLogging call
      consoleSpy.log.mockClear();

      logInfo('Test info message');

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments', () => {
      enableGeneralLogging(true);

      logInfo('Message', { data: 'test' }, 123);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Message',
        { data: 'test' },
        123
      );
    });

    it('should not log by default', () => {
      logInfo('Test info message');

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('logDebug', () => {
    it('should log when general logging is enabled', () => {
      enableGeneralLogging(true);

      logDebug('Test debug message');

      expect(consoleSpy.log).toHaveBeenCalledWith('Test debug message');
    });

    it('should not log when general logging is disabled', () => {
      enableGeneralLogging(false);

      // Clear the log from the enableGeneralLogging call
      consoleSpy.log.mockClear();

      logDebug('Test debug message');

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments', () => {
      enableGeneralLogging(true);

      logDebug('Debug', { data: 'test' }, 456);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Debug',
        { data: 'test' },
        456
      );
    });
  });

  describe('logPerformance', () => {
    it('should log when performance logging is enabled', () => {
      enablePerformanceLogging(true);

      logPerformance('Test performance message');

      expect(consoleSpy.log).toHaveBeenCalledWith('Test performance message');
    });

    it('should not log when performance logging is disabled', () => {
      enablePerformanceLogging(false);

      // Clear the log from the enablePerformanceLogging call
      consoleSpy.log.mockClear();

      logPerformance('Test performance message');

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments', () => {
      enablePerformanceLogging(true);

      logPerformance('Performance', { time: 123 }, 'ms');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Performance',
        { time: 123 },
        'ms'
      );
    });

    it('should not log by default', () => {
      logPerformance('Test performance message');

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('logWarn', () => {
    it('should always log warnings', () => {
      logWarn('Test warning message');

      expect(consoleSpy.warn).toHaveBeenCalledWith('Test warning message');
    });

    it('should log warnings even when general logging is disabled', () => {
      enableGeneralLogging(false);

      logWarn('Test warning message');

      expect(consoleSpy.warn).toHaveBeenCalledWith('Test warning message');
    });

    it('should handle multiple arguments', () => {
      logWarn('Warning', { data: 'test' }, 789);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Warning',
        { data: 'test' },
        789
      );
    });
  });

  describe('logError', () => {
    it('should always log errors', () => {
      logError('Test error message');

      expect(consoleSpy.error).toHaveBeenCalledWith('Test error message');
    });

    it('should log errors even when general logging is disabled', () => {
      enableGeneralLogging(false);

      logError('Test error message');

      expect(consoleSpy.error).toHaveBeenCalledWith('Test error message');
    });

    it('should handle multiple arguments', () => {
      logError('Error', { data: 'test' }, 999);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error',
        { data: 'test' },
        999
      );
    });
  });

  describe('enableGeneralLogging', () => {
    it('should enable general logging', () => {
      enableGeneralLogging(true);

      expect(isGeneralLoggingEnabled()).toBe(true);
    });

    it('should disable general logging', () => {
      enableGeneralLogging(false);

      expect(isGeneralLoggingEnabled()).toBe(false);
    });

    it('should affect logInfo and logDebug', () => {
      enableGeneralLogging(true);
      // Clear the log from the enableGeneralLogging call
      consoleSpy.log.mockClear();

      logInfo('Info message');
      logDebug('Debug message');

      expect(consoleSpy.log).toHaveBeenCalledTimes(2);

      enableGeneralLogging(false);
      // Clear the log from the enableGeneralLogging call
      consoleSpy.log.mockClear();

      logInfo('Info message 2');
      logDebug('Debug message 2');

      expect(consoleSpy.log).not.toHaveBeenCalled(); // No additional calls
    });
  });

  describe('enablePerformanceLogging', () => {
    it('should enable performance logging', () => {
      enablePerformanceLogging(true);

      expect(isPerformanceLoggingEnabled()).toBe(true);
    });

    it('should disable performance logging', () => {
      enablePerformanceLogging(false);

      expect(isPerformanceLoggingEnabled()).toBe(false);
    });

    it('should affect logPerformance', () => {
      enablePerformanceLogging(true);
      // Clear the log from the enablePerformanceLogging call
      consoleSpy.log.mockClear();

      logPerformance('Performance message');

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);

      enablePerformanceLogging(false);
      // Clear the log from the enablePerformanceLogging call
      consoleSpy.log.mockClear();

      logPerformance('Performance message 2');

      expect(consoleSpy.log).not.toHaveBeenCalled(); // No additional calls
    });
  });

  describe('enableONNXProfiling', () => {
    it('should enable ONNX profiling', () => {
      enableONNXProfiling(true);

      expect(isONNXProfilingEnabled()).toBe(true);
    });

    it('should disable ONNX profiling', () => {
      enableONNXProfiling(false);

      expect(isONNXProfilingEnabled()).toBe(false);
    });
  });

  describe('isGeneralLoggingEnabled', () => {
    it('should return false by default', () => {
      expect(isGeneralLoggingEnabled()).toBe(false);
    });

    it('should return true when enabled', () => {
      enableGeneralLogging(true);
      expect(isGeneralLoggingEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      enableGeneralLogging(false);
      expect(isGeneralLoggingEnabled()).toBe(false);
    });
  });

  describe('isPerformanceLoggingEnabled', () => {
    it('should return false by default', () => {
      expect(isPerformanceLoggingEnabled()).toBe(false);
    });

    it('should return true when enabled', () => {
      enablePerformanceLogging(true);
      expect(isPerformanceLoggingEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      enablePerformanceLogging(false);
      expect(isPerformanceLoggingEnabled()).toBe(false);
    });
  });

  describe('isONNXProfilingEnabled', () => {
    it('should return false by default', () => {
      expect(isONNXProfilingEnabled()).toBe(false);
    });

    it('should return true when enabled', () => {
      enableONNXProfiling(true);
      expect(isONNXProfilingEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      enableONNXProfiling(false);
      expect(isONNXProfilingEnabled()).toBe(false);
    });
  });

  describe('Integration with Config', () => {
    it('should use config singleton for state management', () => {
      // Enable logging through config directly
      rembgConfig.enableGeneralLogging(true);

      expect(isGeneralLoggingEnabled()).toBe(true);

      logInfo('Test message');
      expect(consoleSpy.log).toHaveBeenCalledWith('Test message');
    });

    it('should reflect config changes immediately', () => {
      // Start with logging disabled
      expect(isGeneralLoggingEnabled()).toBe(false);

      // Enable through config
      rembgConfig.enableGeneralLogging(true);
      expect(isGeneralLoggingEnabled()).toBe(true);

      // Disable through utility function
      enableGeneralLogging(false);
      expect(rembgConfig.isGeneralLoggingEnabled()).toBe(false);
    });

    it('should handle all logging types independently', () => {
      // Enable all logging types
      enableGeneralLogging(true);
      enablePerformanceLogging(true);

      // Clear the logs from the enable calls
      consoleSpy.log.mockClear();
      consoleSpy.warn.mockClear();
      consoleSpy.error.mockClear();

      logInfo('Info message');
      logDebug('Debug message');
      logPerformance('Performance message');
      logWarn('Warning message');
      logError('Error message');

      expect(consoleSpy.log).toHaveBeenCalledTimes(3); // Info, Debug, Performance
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1); // Warning
      expect(consoleSpy.error).toHaveBeenCalledTimes(1); // Error
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined arguments', () => {
      enableGeneralLogging(true);
      enablePerformanceLogging(true);

      // Clear the logs from the enable calls
      consoleSpy.log.mockClear();

      logInfo(undefined);
      logDebug(null);
      logPerformance('test');

      expect(consoleSpy.log).toHaveBeenCalledTimes(3);
      expect(consoleSpy.log).toHaveBeenNthCalledWith(1, undefined);
      expect(consoleSpy.log).toHaveBeenNthCalledWith(2, null);
      expect(consoleSpy.log).toHaveBeenNthCalledWith(3, 'test');
    });

    it('should handle complex objects', () => {
      enableGeneralLogging(true);

      const complexObject = {
        nested: { value: 123 },
        array: [1, 2, 3],
        func: () => 'test',
      };

      logInfo('Complex object:', complexObject);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Complex object:',
        complexObject
      );
    });

    it('should handle circular references', () => {
      enableGeneralLogging(true);

      const circular: any = { name: 'test' };
      circular.self = circular;

      // This should not throw an error
      expect(() => logInfo('Circular:', circular)).not.toThrow();
    });
  });
});
