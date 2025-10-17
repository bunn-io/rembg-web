/**
 * Centralized logging utilities for rembg-web
 *
 * Provides configurable logging that respects the RembgConfig settings.
 * By default, only errors and warnings are shown.
 */

import { rembgConfig } from '../config';

/**
 * Log info messages (only if general logging is enabled).
 *
 * @param args - Arguments to log (same as console.log)
 *
 * @example
 * ```typescript
 * logInfo('Session initialized successfully');
 * logInfo('Processing image:', imageData);
 * ```
 */
export function logInfo(...args: Parameters<typeof console.log>): void {
    if (rembgConfig.isGeneralLoggingEnabled()) {
        console.log(...args);
    }
}

/**
 * Log debug messages (only if general logging is enabled).
 *
 * @param args - Arguments to log (same as console.log)
 *
 * @example
 * ```typescript
 * logDebug('Model output shape:', outputShape);
 * logDebug('Cache hit for model:', modelName);
 * ```
 */
export function logDebug(...args: Parameters<typeof console.log>): void {
    if (rembgConfig.isGeneralLoggingEnabled()) {
        console.log(...args);
    }
}

/**
 * Log performance timing messages (only if performance logging is enabled).
 *
 * @param args - Arguments to log (same as console.log)
 *
 * @example
 * ```typescript
 * logPerformance('Model inference took:', inferenceTime, 'ms');
 * logPerformance('Total processing time:', totalTime, 'ms');
 * ```
 */
export function logPerformance(...args: Parameters<typeof console.log>): void {
    if (rembgConfig.isPerformanceLoggingEnabled()) {
        console.log(...args);
    }
}

/**
 * Log warning messages (always shown - default level).
 *
 * @param args - Arguments to log (same as console.warn)
 *
 * @example
 * ```typescript
 * logWarn('WebNN not available, falling back to WebGL');
 * logWarn('Model cache miss, downloading from server');
 * ```
 */
export function logWarn(...args: Parameters<typeof console.warn>): void {
    console.warn(...args);
}

/**
 * Log error messages (always shown - default level).
 *
 * @param args - Arguments to log (same as console.error)
 *
 * @example
 * ```typescript
 * logError('Failed to load model:', error);
 * logError('Session initialization failed:', error.message);
 * ```
 */
export function logError(...args: Parameters<typeof console.error>): void {
    console.error(...args);
}

/**
 * Enable general logging (info, debug messages).
 *
 * @param enable - Whether to enable general logging
 *
 * @example
 * ```typescript
 * // Enable detailed logging for debugging
 * enableGeneralLogging(true);
 *
 * // Disable logging for production
 * enableGeneralLogging(false);
 * ```
 */
export function enableGeneralLogging(enable: boolean): void {
    rembgConfig.enableGeneralLogging(enable);
}

/**
 * Enable performance logging (timing messages).
 *
 * @param enable - Whether to enable performance logging
 *
 * @example
 * ```typescript
 * // Enable performance monitoring
 * enablePerformanceLogging(true);
 *
 * // Disable performance logging
 * enablePerformanceLogging(false);
 * ```
 */
export function enablePerformanceLogging(enable: boolean): void {
    rembgConfig.enablePerformanceLogging(enable);
}

/**
 * Check if general logging is enabled.
 *
 * @returns True if general logging is enabled
 *
 * @example
 * ```typescript
 * if (isGeneralLoggingEnabled()) {
 *   logInfo('Detailed logging is active');
 * }
 * ```
 */
export function isGeneralLoggingEnabled(): boolean {
    return rembgConfig.isGeneralLoggingEnabled();
}

/**
 * Check if performance logging is enabled.
 *
 * @returns True if performance logging is enabled
 *
 * @example
 * ```typescript
 * if (isPerformanceLoggingEnabled()) {
 *   logPerformance('Performance monitoring is active');
 * }
 * ```
 */
export function isPerformanceLoggingEnabled(): boolean {
    return rembgConfig.isPerformanceLoggingEnabled();
}

/**
 * Enable ONNX Runtime profiling.
 *
 * @param enable - Whether to enable ONNX profiling
 *
 * @example
 * ```typescript
 * // Enable ONNX profiling for performance analysis
 * enableONNXProfiling(true);
 *
 * // Disable profiling
 * enableONNXProfiling(false);
 * ```
 */
export function enableONNXProfiling(enable: boolean): void {
    rembgConfig.enableONNXProfiling(enable);
}

/**
 * Check if ONNX profiling is enabled.
 *
 * @returns True if ONNX profiling is enabled
 *
 * @example
 * ```typescript
 * if (isONNXProfilingEnabled()) {
 *   console.log('ONNX profiling is active');
 * }
 * ```
 */
export function isONNXProfilingEnabled(): boolean {
    return rembgConfig.isONNXProfilingEnabled();
}
