import { BaseSession, SessionOptions } from './sessions/base';
import { U2NetSession } from './sessions/u2net';
import { U2NetpSession } from './sessions/u2netp';
import { U2NetHumanSegSession } from './sessions/u2net_human_seg';
import { U2NetClothSegSession } from './sessions/u2net_cloth_seg';
import { U2NetCustomSession, U2NetCustomConfig } from './sessions/u2net_custom';
import { IsNetGeneralUseSession } from './sessions/isnet_general_use';
import { IsNetAnimeSession } from './sessions/isnet_anime';
import { SiluetaSession } from './sessions/silueta';
import { rembgConfig } from './config';
import { logInfo, logPerformance } from './utils/logger';

// Registry of available session classes
const sessionRegistry: Map<
  string,
  new (options?: SessionOptions) => BaseSession
> = new Map();

// Register available sessions
sessionRegistry.set('u2net', U2NetSession);
sessionRegistry.set('u2netp', U2NetpSession); // Force rebuild
sessionRegistry.set('u2net_human_seg', U2NetHumanSegSession);
sessionRegistry.set('u2net_cloth_seg', U2NetClothSegSession);
sessionRegistry.set('isnet-general-use', IsNetGeneralUseSession);
sessionRegistry.set('isnet-anime', IsNetAnimeSession);
sessionRegistry.set('silueta', SiluetaSession);

// Cache for initialized sessions with LRU tracking
const sessionCache: Map<string, BaseSession> = new Map();
const sessionAccessOrder: string[] = []; // Track access order for LRU

// Configuration for cache management
const CACHE_CONFIG = {
  maxSessions: 5, // Maximum number of cached sessions
  maxMemoryMB: 500, // Maximum memory usage in MB (approximate)
};

// Track cache statistics
const cacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0,
  totalSessions: 0,
};

/**
 * Compare two SessionOptions objects for equality
 * Returns true if all relevant settings match
 */
function areSessionOptionsEqual(
  options1: SessionOptions,
  options2: SessionOptions
): boolean {
  // Compare all settings that affect session behavior
  const mismatches: string[] = [];

  if (options1.preferWebNN !== options2.preferWebNN) {
    mismatches.push(
      `preferWebNN: ${options1.preferWebNN} vs ${options2.preferWebNN}`
    );
  }
  if (options1.webnnDeviceType !== options2.webnnDeviceType) {
    mismatches.push(
      `webnnDeviceType: ${options1.webnnDeviceType} vs ${options2.webnnDeviceType}`
    );
  }
  if (options1.webnnPowerPreference !== options2.webnnPowerPreference) {
    mismatches.push(
      `webnnPowerPreference: ${options1.webnnPowerPreference} vs ${options2.webnnPowerPreference}`
    );
  }
  if (options1.preferWebGPU !== options2.preferWebGPU) {
    mismatches.push(
      `preferWebGPU: ${options1.preferWebGPU} vs ${options2.preferWebGPU}`
    );
  }
  if (options1.webgpuPowerPreference !== options2.webgpuPowerPreference) {
    mismatches.push(
      `webgpuPowerPreference: ${options1.webgpuPowerPreference} vs ${options2.webgpuPowerPreference}`
    );
  }
  if (options1.simd !== options2.simd) {
    mismatches.push(`simd: ${options1.simd} vs ${options2.simd}`);
  }
  if (options1.proxy !== options2.proxy) {
    mismatches.push(`proxy: ${options1.proxy} vs ${options2.proxy}`);
  }
  if (options1.numThreads !== options2.numThreads) {
    mismatches.push(
      `numThreads: ${options1.numThreads} vs ${options2.numThreads}`
    );
  }

  const providers1 = JSON.stringify(options1.executionProviders?.sort());
  const providers2 = JSON.stringify(options2.executionProviders?.sort());
  if (providers1 !== providers2) {
    mismatches.push(`executionProviders: ${providers1} vs ${providers2}`);
  }

  if (mismatches.length > 0) {
    logInfo(
      `[areSessionOptionsEqual] Settings mismatch detected: ${mismatches.join(', ')}`
    );
    return false;
  }

  return true;
}

/**
 * Update LRU access order for a session
 */
function updateAccessOrder(cacheKey: string): void {
  // Remove from current position
  const index = sessionAccessOrder.indexOf(cacheKey);
  if (index > -1) {
    sessionAccessOrder.splice(index, 1);
  }
  // Add to end (most recently used)
  sessionAccessOrder.push(cacheKey);
}

/**
 * Evict least recently used session
 */
async function evictLRUSession(): Promise<void> {
  if (sessionAccessOrder.length === 0) return;

  const lruKey = sessionAccessOrder[0];
  const session = sessionCache.get(lruKey);

  if (session) {
    await session.dispose();
    sessionCache.delete(lruKey);
    sessionAccessOrder.shift();
    cacheStats.evictions++;
  }
}

/**
 * Check if cache needs eviction and perform it
 */
async function checkAndEvict(): Promise<void> {
  // Evict based on count limit
  while (sessionCache.size >= CACHE_CONFIG.maxSessions) {
    await evictLRUSession();
  }

  // TODO: Add memory-based eviction when performance.memory is available
  // This would require browser support for performance.memory API
}

/**
 * Create a new session instance with LRU cache management.
 *
 * Creates a new session for the specified model with intelligent caching.
 * Sessions are cached and reused when possible to improve performance.
 * For custom models, provide the modelPath in the config parameter.
 *
 * @param modelName - Name of the model to use (default: 'u2net')
 * @param config - Configuration for custom models (required for 'u2net_custom')
 * @param options - Session options for WebNN, WebGPU, and other settings
 * @returns Promise that resolves to a BaseSession instance
 *
 * @throws {Error} When model name is not supported
 * @throws {Error} When u2net_custom is used without modelPath in config
 * @throws {Error} When model fails to load or initialize
 *
 * @example
 * ```typescript
 * // Create a standard U2Net session
 * const session = await newSession('u2net');
 *
 * // Create a session with WebNN acceleration
 * const session = await newSession('u2net', undefined, {
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 *
 * // Create a custom model session
 * const customSession = await newSession('u2net_custom', {
 *   modelPath: '/path/to/my-model.onnx',
 *   inputSize: [512, 512]
 * });
 * ```
 */
export async function newSession(
  modelName: string = 'u2net',
  config?: U2NetCustomConfig,
  options?: SessionOptions
): Promise<BaseSession> {
  const sessionStartTime = performance.now();
  logInfo(`[newSession] Creating session for model: ${modelName}`);

  // Merge global WebNN, WebGPU, and cache bypass configuration with session options
  const optionsMergeStart = performance.now();
  const mergedOptions: SessionOptions = {
    ...options,
    // Apply global WebNN settings if not explicitly set
    preferWebNN: options?.preferWebNN ?? rembgConfig.isWebNNEnabled(),
    webnnDeviceType:
      options?.webnnDeviceType ?? rembgConfig.getWebNNDeviceType(),
    webnnPowerPreference:
      options?.webnnPowerPreference ?? rembgConfig.getWebNNPowerPreference(),
    // Apply global WebGPU settings if not explicitly set
    preferWebGPU: options?.preferWebGPU ?? rembgConfig.isWebGPUEnabled(),
    webgpuPowerPreference:
      options?.webgpuPowerPreference ?? rembgConfig.getWebGPUPowerPreference(),
    // Apply global cache bypass settings if not explicitly set
    bypassSessionCache:
      options?.bypassSessionCache ?? rembgConfig.isSessionCacheBypassEnabled(),
    bypassModelCache:
      options?.bypassModelCache ?? rembgConfig.isModelCacheBypassEnabled(),
  };
  const optionsMergeTime = performance.now() - optionsMergeStart;
  logPerformance(
    `[newSession] Options merge: ${optionsMergeTime.toFixed(2)}ms`
  );

  // Handle u2net_custom with configuration
  if (modelName === 'u2net_custom') {
    if (!config || !config.modelPath) {
      throw new Error('u2net_custom requires modelPath in config');
    }

    // Create a unique cache key for custom models
    const cacheKey = `u2net_custom_${config.modelPath}`;

    // Check cache first (unless bypassed)
    const cacheCheckStart = performance.now();
    if (!mergedOptions.bypassSessionCache && sessionCache.has(cacheKey)) {
      const cachedSession = sessionCache.get(cacheKey)!;
      const cachedOptions = cachedSession.getOptions();

      // Validate settings match
      if (areSessionOptionsEqual(mergedOptions, cachedOptions)) {
        updateAccessOrder(cacheKey);
        cacheStats.hits++;
        const cacheCheckTime = performance.now() - cacheCheckStart;
        const totalTime = performance.now() - sessionStartTime;
        logPerformance(
          `[newSession] Cache hit for ${modelName}: ${cacheCheckTime.toFixed(2)}ms (total: ${totalTime.toFixed(2)}ms)`
        );
        return cachedSession;
      } else {
        // Settings don't match - evict and recreate
        logInfo(
          `[newSession] Settings mismatch for ${modelName}, evicting cached session`
        );
        await cachedSession.dispose();
        sessionCache.delete(cacheKey);
        const index = sessionAccessOrder.indexOf(cacheKey);
        if (index > -1) {
          sessionAccessOrder.splice(index, 1);
        }
        cacheStats.evictions++;
      }
    } else if (mergedOptions.bypassSessionCache) {
      logInfo(`[newSession] Session cache bypassed for ${modelName}`);
    }
    const cacheCheckTime = performance.now() - cacheCheckStart;
    logPerformance(
      `[newSession] Cache miss for ${modelName}: ${cacheCheckTime.toFixed(2)}ms`
    );

    // Create new custom session
    const sessionCreateStart = performance.now();
    const session = new U2NetCustomSession(config, mergedOptions);
    const sessionCreateTime = performance.now() - sessionCreateStart;
    logPerformance(
      `[newSession] Custom session creation: ${sessionCreateTime.toFixed(2)}ms`
    );

    // Cache the session
    const cacheStoreStart = performance.now();
    sessionCache.set(cacheKey, session);
    updateAccessOrder(cacheKey);
    cacheStats.misses++;
    cacheStats.totalSessions++;
    const cacheStoreTime = performance.now() - cacheStoreStart;
    logPerformance(
      `[newSession] Session caching: ${cacheStoreTime.toFixed(2)}ms`
    );

    // Check if eviction is needed (async, don't await)
    checkAndEvict().catch(console.warn);

    const totalTime = performance.now() - sessionStartTime;
    logPerformance(
      `[newSession] Total custom session creation: ${totalTime.toFixed(2)}ms`
    );
    return session;
  }

  const registryLookupStart = performance.now();
  const SessionClass = sessionRegistry.get(modelName);
  const registryLookupTime = performance.now() - registryLookupStart;
  logPerformance(
    `[newSession] Registry lookup: ${registryLookupTime.toFixed(2)}ms`
  );

  if (!SessionClass) {
    const availableModels = Array.from(sessionRegistry.keys()).join(', ');
    throw new Error(
      `No session class found for model '${modelName}'. Available models: ${availableModels}`
    );
  }

  // Check cache first (unless bypassed)
  const cacheCheckStart = performance.now();
  if (!mergedOptions.bypassSessionCache && sessionCache.has(modelName)) {
    const cachedSession = sessionCache.get(modelName)!;
    const cachedOptions = cachedSession.getOptions();

    // Validate settings match
    if (areSessionOptionsEqual(mergedOptions, cachedOptions)) {
      updateAccessOrder(modelName);
      cacheStats.hits++;
      const cacheCheckTime = performance.now() - cacheCheckStart;
      const totalTime = performance.now() - sessionStartTime;
      logPerformance(
        `[newSession] Cache hit for ${modelName}: ${cacheCheckTime.toFixed(2)}ms (total: ${totalTime.toFixed(2)}ms)`
      );
      return cachedSession;
    } else {
      // Settings don't match - evict and recreate
      logInfo(
        `[newSession] Settings mismatch for ${modelName}, evicting cached session`
      );
      await cachedSession.dispose();
      sessionCache.delete(modelName);
      const index = sessionAccessOrder.indexOf(modelName);
      if (index > -1) {
        sessionAccessOrder.splice(index, 1);
      }
      cacheStats.evictions++;
    }
  } else if (mergedOptions.bypassSessionCache) {
    logInfo(`[newSession] Session cache bypassed for ${modelName}`);
  }
  const cacheCheckTime = performance.now() - cacheCheckStart;
  logPerformance(
    `[newSession] Cache miss for ${modelName}: ${cacheCheckTime.toFixed(2)}ms`
  );

  // Create new session
  const sessionCreateStart = performance.now();
  const session = new SessionClass(mergedOptions);
  const sessionCreateTime = performance.now() - sessionCreateStart;
  logPerformance(
    `[newSession] Session creation: ${sessionCreateTime.toFixed(2)}ms`
  );

  // Cache the session
  const cacheStoreStart = performance.now();
  sessionCache.set(modelName, session);
  updateAccessOrder(modelName);
  cacheStats.misses++;
  cacheStats.totalSessions++;
  const cacheStoreTime = performance.now() - cacheStoreStart;
  logPerformance(
    `[newSession] Session caching: ${cacheStoreTime.toFixed(2)}ms`
  );

  // Check if eviction is needed (async, don't await)
  checkAndEvict().catch(console.warn);

  const totalTime = performance.now() - sessionStartTime;
  logPerformance(
    `[newSession] Total session creation: ${totalTime.toFixed(2)}ms`
  );
  return session;
}

/**
 * Get list of available model names.
 *
 * Returns all supported model names including built-in models and the
 * custom model option. Use this to validate model names before creating sessions.
 *
 * @returns Array of available model names
 *
 * @example
 * ```typescript
 * const models = getAvailableModels();
 * console.log('Available models:', models);
 * // Output: ['u2net', 'u2netp', 'u2net_human_seg', 'u2net_cloth_seg', 'isnet-general-use', 'isnet-anime', 'silueta', 'u2net_custom']
 *
 * // Validate model name before use
 * if (models.includes('u2net')) {
 *   const session = await newSession('u2net');
 * }
 * ```
 */
export function getAvailableModels(): string[] {
  const models = Array.from(sessionRegistry.keys());
  models.push('u2net_custom'); // Add custom model (not in registry)
  return models;
}

/**
 * Get cache statistics and performance metrics.
 *
 * Returns information about session cache performance including hit rates,
 * eviction counts, and current cache size. Useful for monitoring and
 * optimizing cache behavior.
 *
 * @returns Cache statistics object with hit rate, current sessions, etc.
 *
 * @example
 * ```typescript
 * const stats = getCacheStats();
 * console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
 * console.log(`Current sessions: ${stats.currentSessions}/${stats.maxSessions}`);
 * console.log(`Total evictions: ${stats.evictions}`);
 *
 * // Monitor cache performance
 * if (stats.hitRate < 0.5) {
 *   console.warn('Low cache hit rate - consider increasing cache size');
 * }
 * ```
 */
export function getCacheStats() {
  return {
    ...cacheStats,
    currentSessions: sessionCache.size,
    maxSessions: CACHE_CONFIG.maxSessions,
    hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0,
  };
}

/**
 * Configure cache settings.
 *
 * Allows you to adjust cache behavior including maximum number of
 * cached sessions and memory limits. Changes take effect immediately
 * and affect future session creation.
 *
 * @param options - Cache configuration options
 *
 * @example
 * ```typescript
 * // Limit cache to 3 sessions
 * configureCache({ maxSessions: 3 });
 *
 * // Set memory limit to 1GB
 * configureCache({ maxMemoryMB: 1024 });
 *
 * // Configure both
 * configureCache({
 *   maxSessions: 5,
 *   maxMemoryMB: 512
 * });
 * ```
 */
export function configureCache(options: {
  maxSessions?: number;
  maxMemoryMB?: number;
}): void {
  if (options.maxSessions !== undefined) {
    CACHE_CONFIG.maxSessions = Math.max(1, options.maxSessions);
  }
  if (options.maxMemoryMB !== undefined) {
    CACHE_CONFIG.maxMemoryMB = Math.max(1000, options.maxMemoryMB);
  }
}

/**
 * Clear session cache.
 *
 * Removes all cached sessions from memory. This can help free up memory
 * when switching between different models or when memory usage is high.
 * Note: This does not dispose of sessions, just removes them from cache.
 *
 * @example
 * ```typescript
 * // Clear all cached sessions
 * clearSessionCache();
 *
 * // Check cache stats after clearing
 * const stats = getCacheStats();
 * console.log(`Sessions after clear: ${stats.currentSessions}`);
 * ```
 */
export function clearSessionCache(): void {
  sessionCache.clear();
  sessionAccessOrder.length = 0;
  // Reset stats
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.evictions = 0;
  cacheStats.totalSessions = 0;
}

/**
 * Dispose all cached sessions.
 *
 * Properly disposes of all cached sessions, freeing up memory and
 * cleaning up resources. This is more thorough than clearSessionCache()
 * as it also disposes of ONNX Runtime sessions.
 *
 * @example
 * ```typescript
 * // Dispose all sessions and free resources
 * await disposeAllSessions();
 *
 * // Verify all sessions are disposed
 * const stats = getCacheStats();
 * console.log(`Sessions after dispose: ${stats.currentSessions}`);
 * ```
 */
export async function disposeAllSessions(): Promise<void> {
  const disposePromises = Array.from(sessionCache.values()).map(session =>
    session.dispose()
  );
  await Promise.all(disposePromises);
  sessionCache.clear();
  sessionAccessOrder.length = 0;
}

/**
 * Clear all cached models from IndexedDB.
 *
 * Removes cached model files from IndexedDB storage. This forces
 * models to be re-downloaded on next use, which can help with
 * corrupted cache or when you want to ensure you have the latest models.
 *
 * @example
 * ```typescript
 * // Clear all cached models
 * await clearModelCache();
 *
 * // Next session creation will re-download models
 * const session = await newSession('u2net');
 * ```
 */
export async function clearModelCache(): Promise<void> {
  await BaseSession.clearCache();
}

/**
 * Clear cache for a specific model.
 *
 * Removes cached model files for a specific model from IndexedDB storage.
 * This forces the model to be re-downloaded on next use.
 *
 * @param modelName - Name of the model to clear from cache
 *
 * @example
 * ```typescript
 * // Clear specific model cache
 * await clearModelCacheForModel('u2net');
 *
 * // Clear custom model cache
 * await clearModelCacheForModel('u2net_custom');
 *
 * // Next session creation will re-download the model
 * const session = await newSession('u2net');
 * ```
 */
export async function clearModelCacheForModel(
  modelName: string
): Promise<void> {
  await BaseSession.clearModelCache(modelName);
}
